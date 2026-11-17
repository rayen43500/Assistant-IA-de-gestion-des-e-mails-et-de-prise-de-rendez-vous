import express from 'express';
import crypto from 'crypto';
import Integration from '../models/Integration.js';
import Doctor from '../models/Doctor.js';
import { protect, authorize } from '../middleware/auth.js';
import { encryptData, decryptData } from '../services/cryptoService.js';

const router = express.Router();

// Cache mémoire serveur pour les états OAuth éphémères (single-use CSRF tokens)
const oauthStateCache = new Map();

/**
 * Nettoyage périodique des jetons d'état OAuth expirés (> 10 minutes)
 */
setInterval(() => {
  const now = Date.now();
  for (const [state, meta] of oauthStateCache.entries()) {
    if (now - meta.createdAt > 600000) {
      oauthStateCache.delete(state);
    }
  }
}, 300000);

/**
 * GET /api/integrations/google/connect
 * Génère une URL d'autorisation Google OAuth 2.0 unique et sécurisée pour le médecin authentifié
 */
router.get('/google/connect', protect, authorize('PRATICIEN', 'ADMIN', 'SUPER_ADMIN'), async (req, res) => {
  try {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI || `${req.protocol}://${req.get('host')}/api/integrations/google/callback`;

    if (!clientId) {
      return res.status(500).json({
        message: 'Configuration Google OAuth incomplète (GOOGLE_CLIENT_ID manquant sur le serveur)',
      });
    }

    // Récupérer le doctorId associé à l'utilisateur
    let doctor = await Doctor.findOne({ userId: req.user._id });
    if (!doctor) {
      doctor = await Doctor.findOne({ tenantId: req.clinicId });
    }

    if (!doctor) {
      return res.status(404).json({ message: 'Profil praticien introuvable pour ce compte.' });
    }

    // Générer un jeton d'état CSRF cryptographique à usage unique
    const stateToken = crypto.randomBytes(32).toString('hex');
    oauthStateCache.set(stateToken, {
      tenantId: String(req.clinicId),
      doctorId: String(doctor._id),
      userId: String(req.user._id),
      createdAt: Date.now(),
    });

    const scopes = [
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/gmail.send',
      'https://www.googleapis.com/auth/calendar.events',
      'https://www.googleapis.com/auth/calendar.freebusy',
    ].join(' ');

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${encodeURIComponent(clientId)}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `response_type=code&` +
      `scope=${encodeURIComponent(scopes)}&` +
      `access_type=offline&` +
      `prompt=consent&` +
      `state=${encodeURIComponent(stateToken)}`;

    res.json({
      authUrl,
      doctorId: doctor._id,
      scopes: scopes.split(' '),
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la préparation OAuth', error: error.message });
  }
});

/**
 * GET /api/integrations/google/callback
 * Échange le code d'autorisation contre les tokens, vérifie l'identité et sauvegarde l'intégration chiffrée
 */
router.get('/google/callback', async (req, res) => {
  const { code, state, error: oauthError } = req.query;

  if (oauthError) {
    return res.status(400).send(`Erreur d'autorisation Google : ${oauthError}`);
  }

  if (!code || !state) {
    return res.status(400).send('Paramètres de rappel OAuth invalides.');
  }

  // Valider le jeton d'état (anti-CSRF) et l'invalider immédiatement (single-use)
  const stateMeta = oauthStateCache.get(state);
  oauthStateCache.delete(state);

  if (!stateMeta) {
    return res.status(403).send('Jeton de session OAuth invalide ou expiré. Veuillez réinitialiser la connexion.');
  }

  const { tenantId, doctorId } = stateMeta;

  try {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI || `${req.protocol}://${req.get('host')}/api/integrations/google/callback`;

    // Échanger le code contre les tokens auprès de Google
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      const errBody = await tokenResponse.text();
      return res.status(400).send(`Échec de récupération des jetons Google : ${errBody}`);
    }

    const tokenData = await tokenResponse.json();

    // Obtenir l'adresse e-mail du compte Google connecté
    const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    let googleAccountEmail = 'inconnu@gmail.com';
    if (userInfoRes.ok) {
      const userInfo = await userInfoRes.json();
      googleAccountEmail = userInfo.email;
    }

    // Préparer les données à chiffrer
    const credentialsToEncrypt = {
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      expiryDate: Date.now() + (tokenData.expires_in * 1000),
      tokenType: tokenData.token_type,
    };

    const encryptedCredentials = encryptData(credentialsToEncrypt);

    // Mettre à jour ou créer l'intégration pour ce médecin
    const integration = await Integration.findOneAndUpdate(
      { tenantId, doctorId, provider: 'GOOGLE' },
      {
        providerAccountEmail: googleAccountEmail,
        encryptedCredentialReference: encryptedCredentials,
        calendarId: 'primary',
        connectionStatus: 'CONNECTED',
        scopes: tokenData.scope ? tokenData.scope.split(' ') : [],
        tokenExpiration: new Date(Date.now() + tokenData.expires_in * 1000),
        lastSynchronization: new Date(),
        lastError: null,
      },
      { upsert: true, new: true }
    );

    // Redirection vers le frontend vers la page des intégrations
    const frontendRedirect = process.env.FRONTEND_URL || 'http://localhost:5173';
    res.redirect(`${frontendRedirect}?google_connected=success&doctor_email=${encodeURIComponent(googleAccountEmail)}`);
  } catch (error) {
    res.status(500).send(`Erreur serveur lors de la finalisation Google OAuth : ${error.message}`);
  }
});

/**
 * GET /api/integrations/google/status
 * Récupère le statut de connexion Google pour le praticien sans exposer les tokens
 */
router.get('/google/status', protect, async (req, res) => {
  try {
    let doctor = await Doctor.findOne({ userId: req.user._id });
    if (!doctor) {
      doctor = await Doctor.findOne({ tenantId: req.clinicId });
    }

    if (!doctor) {
      return res.json({ connected: false, message: 'Aucun profil praticien trouvé.' });
    }

    const integration = await Integration.findOne({
      doctorId: doctor._id,
      provider: 'GOOGLE',
    });

    if (!integration || integration.connectionStatus !== 'CONNECTED') {
      return res.json({
        connected: false,
        status: integration ? integration.connectionStatus : 'DISCONNECTED',
        providerAccountEmail: integration ? integration.providerAccountEmail : null,
      });
    }

    res.json({
      connected: true,
      providerAccountEmail: integration.providerAccountEmail,
      status: integration.connectionStatus,
      scopes: integration.scopes,
      calendarId: integration.calendarId,
      lastSynchronization: integration.lastSynchronization,
      tokenExpiration: integration.tokenExpiration,
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération du statut', error: error.message });
  }
});

/**
 * DELETE /api/integrations/google/disconnect
 * Déconnecte le compte Google du médecin et révoque les accès
 */
router.delete('/google/disconnect', protect, authorize('PRATICIEN', 'ADMIN', 'SUPER_ADMIN'), async (req, res) => {
  try {
    let doctor = await Doctor.findOne({ userId: req.user._id });
    if (!doctor) {
      doctor = await Doctor.findOne({ tenantId: req.clinicId });
    }

    if (!doctor) {
      return res.status(404).json({ message: 'Profil praticien introuvable.' });
    }

    const integration = await Integration.findOne({
      doctorId: doctor._id,
      provider: 'GOOGLE',
    });

    if (!integration) {
      return res.json({ message: 'Aucune intégration Google active à déconnecter.' });
    }

    // Tenter la révocation auprès de Google
    try {
      if (integration.encryptedCredentialReference) {
        const tokens = decryptData(integration.encryptedCredentialReference, true);
        if (tokens && tokens.accessToken) {
          await fetch(`https://oauth2.googleapis.com/revoke?token=${tokens.accessToken}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          });
        }
      }
    } catch (revokeErr) {
      console.warn('[GoogleOAuth] Erreur lors de la révocation du token:', revokeErr.message);
    }

    integration.connectionStatus = 'DISCONNECTED';
    integration.encryptedCredentialReference = encryptData({ disconnected: true, at: new Date() });
    await integration.save();

    res.json({
      success: true,
      message: 'Compte Google déconnecté avec succès.',
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la déconnexion Google', error: error.message });
  }
});

/**
 * GET /api/integrations/whatsapp/status
 * Récupère l'état de connexion de WhatsApp Business pour le praticien/cabinet
 */
router.get('/whatsapp/status', protect, authorize('PRATICIEN', 'ADMIN', 'SUPER_ADMIN'), async (req, res) => {
  try {
    let doctor = await Doctor.findOne({ userId: req.user._id });
    if (!doctor) {
      doctor = await Doctor.findOne({ tenantId: req.clinicId });
    }

    if (!doctor) {
      return res.status(404).json({ message: 'Profil praticien introuvable.' });
    }

    const integration = await Integration.findOne({
      doctorId: doctor._id,
      provider: 'WHATSAPP',
      connectionStatus: 'CONNECTED'
    });

    if (!integration) {
      return res.json({ connected: false, status: 'NOT_CONNECTED' });
    }

    return res.json({
      connected: true,
      phoneNumber: integration.providerAccountEmail,
      status: 'ACTIVE',
      lastSyncAt: integration.lastSyncAt,
      doctor: {
        id: doctor._id,
        name: doctor.name
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la vérification WhatsApp', error: error.message });
  }
});

/**
 * POST /api/integrations/whatsapp/connect
 * Enregistre et active le numéro WhatsApp Business pour les rappels de consultation et alertes
 */
router.post('/whatsapp/connect', protect, authorize('PRATICIEN', 'ADMIN', 'SUPER_ADMIN'), async (req, res) => {
  try {
    const { phoneNumber, metaAccountId, webhookSecret } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({ message: 'Numéro de téléphone WhatsApp requis (ex: +216 98 123 456).' });
    }

    let doctor = await Doctor.findOne({ userId: req.user._id });
    if (!doctor) {
      doctor = await Doctor.findOne({ tenantId: req.clinicId });
    }

    if (!doctor) {
      return res.status(404).json({ message: 'Profil praticien introuvable.' });
    }

    const encryptedCredentials = encryptData({
      phoneNumber,
      metaAccountId: metaAccountId || 'meta_wa_act_default',
      webhookSecret: webhookSecret || 'secret_wa_meta',
      connectedAt: new Date()
    });

    const integration = await Integration.findOneAndUpdate(
      { doctorId: doctor._id, provider: 'WHATSAPP' },
      {
        tenantId: req.clinicId,
        doctorId: doctor._id,
        provider: 'WHATSAPP',
        providerAccountEmail: phoneNumber,
        encryptedCredentialReference: encryptedCredentials,
        connectionStatus: 'CONNECTED',
        syncStatus: 'ACTIVE',
        lastSyncAt: new Date()
      },
      { upsert: true, new: true }
    );

    res.json({
      success: true,
      connected: true,
      phoneNumber,
      message: 'WhatsApp Business connecté avec succès aux rappels automatisés 24h.'
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la connexion WhatsApp', error: error.message });
  }
});

/**
 * DELETE /api/integrations/whatsapp/disconnect
 * Déconnecte le service WhatsApp
 */
router.delete('/whatsapp/disconnect', protect, authorize('PRATICIEN', 'ADMIN', 'SUPER_ADMIN'), async (req, res) => {
  try {
    let doctor = await Doctor.findOne({ userId: req.user._id });
    if (!doctor) {
      doctor = await Doctor.findOne({ tenantId: req.clinicId });
    }

    if (!doctor) {
      return res.status(404).json({ message: 'Profil praticien introuvable.' });
    }

    await Integration.findOneAndUpdate(
      { doctorId: doctor._id, provider: 'WHATSAPP' },
      {
        connectionStatus: 'DISCONNECTED',
        syncStatus: 'PAUSED',
        encryptedCredentialReference: encryptData({ disconnected: true, at: new Date() })
      }
    );

    res.json({
      success: true,
      message: 'WhatsApp Business déconnecté.'
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la déconnexion WhatsApp', error: error.message });
  }
});

export default router;
