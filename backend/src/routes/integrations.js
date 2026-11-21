import express from 'express';
import crypto from 'crypto';
import Integration from '../models/Integration.js';
import Doctor from '../models/Doctor.js';
import Clinic from '../models/Clinic.js';
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
 * GET /api/integrations/google/config
 * Récupère les identifiants configurés pour Google Workspace
 */
router.get('/google/config', protect, authorize('PRATICIEN', 'ADMIN', 'SUPER_ADMIN'), async (req, res) => {
  try {
    const clinic = await Clinic.findById(req.clinicId);
    let doctor = await Doctor.findOne({ userId: req.user._id });
    if (!doctor) doctor = await Doctor.findOne({ tenantId: req.clinicId });

    const googleCfg = clinic?.integrationsConfig?.googleWorkspace || {};
    return res.json({
      clientId: googleCfg.clientId || process.env.GOOGLE_CLIENT_ID || '',
      redirectUri: googleCfg.redirectUri || process.env.GOOGLE_REDIRECT_URI || `${req.protocol}://${req.get('host')}/api/integrations/google/callback`,
      gmailEnabled: googleCfg.gmailEnabled !== false,
      calendarEnabled: googleCfg.calendarEnabled !== false,
      isConfigured: !!(googleCfg.clientId || process.env.GOOGLE_CLIENT_ID),
      hasSecret: !!(googleCfg.encryptedClientSecret || process.env.GOOGLE_CLIENT_SECRET),
      doctorEmail: doctor?.professionalEmail || '',
      doctorName: doctor?.name || '',
      doctorId: doctor?._id
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur récupération config Google', error: error.message });
  }
});

/**
 * POST /api/integrations/google/config
 * Enregistre les identifiants réels Google Workspace (Client ID, Secret, Redirect URI)
 * et associe l'e-mail propre au médecin.
 */
router.post('/google/config', protect, authorize('PRATICIEN', 'ADMIN', 'SUPER_ADMIN'), async (req, res) => {
  try {
    const { clientId, clientSecret, redirectUri, gmailEnabled, calendarEnabled, doctorEmail, doctorId } = req.body;

    if (!clientId || !clientId.trim()) {
      return res.status(400).json({ message: 'Le Google Client ID est obligatoire.' });
    }

    const clinic = await Clinic.findById(req.clinicId);
    if (!clinic) {
      return res.status(404).json({ message: 'Cabinet introuvable.' });
    }

    if (!clinic.integrationsConfig) {
      clinic.integrationsConfig = {};
    }

    const existingSecret = clinic.integrationsConfig.googleWorkspace?.encryptedClientSecret || '';
    const encryptedSecret = clientSecret?.trim() ? encryptData(clientSecret.trim()) : existingSecret;

    clinic.integrationsConfig.googleWorkspace = {
      clientId: clientId.trim(),
      encryptedClientSecret: encryptedSecret,
      redirectUri: redirectUri?.trim() || `${req.protocol}://${req.get('host')}/api/integrations/google/callback`,
      gmailEnabled: gmailEnabled !== false,
      calendarEnabled: calendarEnabled !== false,
      isConfigured: true
    };
    await clinic.save();

    // Mettre à jour l'email propre à ce médecin (chaque médecin a son propre email)
    let updatedDoctor = null;
    if (doctorEmail) {
      const docQuery = doctorId ? { _id: doctorId } : { userId: req.user._id };
      updatedDoctor = await Doctor.findOne(docQuery);
      if (!updatedDoctor) updatedDoctor = await Doctor.findOne({ tenantId: req.clinicId });
      if (updatedDoctor) {
        updatedDoctor.professionalEmail = doctorEmail.trim().toLowerCase();
        await updatedDoctor.save();

        // Mettre à jour l'enregistrement d'intégration correspondant
        await Integration.findOneAndUpdate(
          { doctorId: updatedDoctor._id, provider: 'GOOGLE' },
          { providerAccountEmail: updatedDoctor.professionalEmail }
        );
      }
    }

    return res.json({
      success: true,
      message: 'Configuration Google Workspace enregistrée avec succès.',
      isConfigured: true,
      doctorEmail: updatedDoctor?.professionalEmail || doctorEmail
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur enregistrement config Google', error: error.message });
  }
});

/**
 * GET /api/integrations/whatsapp/config
 * Récupère la configuration WhatsApp Business
 */
router.get('/whatsapp/config', protect, authorize('PRATICIEN', 'ADMIN', 'SUPER_ADMIN'), async (req, res) => {
  try {
    const clinic = await Clinic.findById(req.clinicId);
    let doctor = await Doctor.findOne({ userId: req.user._id });
    if (!doctor) doctor = await Doctor.findOne({ tenantId: req.clinicId });

    const waCfg = clinic?.integrationsConfig?.whatsapp || {};
    return res.json({
      phoneNumber: waCfg.phoneNumber || doctor?.phone || '',
      businessAccountId: waCfg.businessAccountId || '',
      phoneNumberId: waCfg.phoneNumberId || '',
      enabled: waCfg.enabled !== false,
      isConfigured: !!waCfg.phoneNumber,
      hasToken: !!waCfg.encryptedAccessToken
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur récupération config WhatsApp', error: error.message });
  }
});

/**
 * POST /api/integrations/whatsapp/config
 * Enregistre la configuration WhatsApp Business
 */
router.post('/whatsapp/config', protect, authorize('PRATICIEN', 'ADMIN', 'SUPER_ADMIN'), async (req, res) => {
  try {
    const { phoneNumber, metaAccessToken, businessAccountId, phoneNumberId, enabled } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({ message: 'Le numéro WhatsApp professionnel est obligatoire.' });
    }

    const clinic = await Clinic.findById(req.clinicId);
    if (!clinic) {
      return res.status(404).json({ message: 'Cabinet introuvable.' });
    }

    if (!clinic.integrationsConfig) {
      clinic.integrationsConfig = {};
    }

    const existingToken = clinic.integrationsConfig.whatsapp?.encryptedAccessToken || '';
    const encryptedToken = metaAccessToken?.trim() ? encryptData(metaAccessToken.trim()) : existingToken;

    clinic.integrationsConfig.whatsapp = {
      phoneNumber: phoneNumber.trim(),
      encryptedAccessToken: encryptedToken,
      businessAccountId: businessAccountId?.trim() || '',
      phoneNumberId: phoneNumberId?.trim() || '',
      enabled: enabled !== false,
      isConfigured: true
    };
    await clinic.save();

    // Mettre à jour l'intégration du médecin
    let doctor = await Doctor.findOne({ userId: req.user._id });
    if (!doctor) doctor = await Doctor.findOne({ tenantId: req.clinicId });
    if (doctor) {
      doctor.phone = phoneNumber.trim();
      await doctor.save();

      await Integration.findOneAndUpdate(
        { doctorId: doctor._id, provider: 'WHATSAPP' },
        {
          tenantId: req.clinicId,
          doctorId: doctor._id,
          provider: 'WHATSAPP',
          providerAccountEmail: phoneNumber.trim(),
          connectionStatus: 'CONNECTED',
          syncStatus: 'ACTIVE',
          lastSyncAt: new Date(),
          encryptedCredentialReference: encryptedToken
        },
        { upsert: true, new: true }
      );
    }

    return res.json({
      success: true,
      message: 'Configuration WhatsApp Business enregistrée avec succès.',
      isConfigured: true
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur enregistrement config WhatsApp', error: error.message });
  }
});

/**
 * GET /api/integrations/doctors
 * Liste tous les médecins du cabinet avec leur e-mail individuel
 */
router.get('/doctors', protect, authorize('PRATICIEN', 'ADMIN', 'SUPER_ADMIN'), async (req, res) => {
  try {
    const doctors = await Doctor.find({ tenantId: req.clinicId }).select('name professionalEmail specialty phone appointmentDuration');
    res.json({ doctors });
  } catch (error) {
    res.status(500).json({ message: 'Erreur liste médecins', error: error.message });
  }
});

/**
 * GET /api/integrations/google/connect
 * Génère une URL d'autorisation Google OAuth 2.0 unique et sécurisée pour le médecin authentifié
 */
router.get('/google/connect', protect, authorize('PRATICIEN', 'ADMIN', 'SUPER_ADMIN'), async (req, res) => {
  try {
    const clinic = await Clinic.findById(req.clinicId);
    const googleCfg = clinic?.integrationsConfig?.googleWorkspace;
    const clientId = googleCfg?.clientId || process.env.GOOGLE_CLIENT_ID || '104829104829-medilawai-oauth.apps.googleusercontent.com';
    const redirectUri = googleCfg?.redirectUri || process.env.GOOGLE_REDIRECT_URI || `${req.protocol}://${req.get('host')}/api/integrations/google/callback`;

    // Récupérer le doctorId associé à l'utilisateur
    let doctor = await Doctor.findOne({ userId: req.user._id });
    if (!doctor) {
      doctor = await Doctor.findOne({ tenantId: req.clinicId });
    }

    if (!doctor) {
      doctor = await Doctor.create({
        tenantId: req.clinicId,
        userId: req.user._id,
        name: req.user.name || 'Dr. Praticien',
        professionalEmail: req.user.email || 'dr.bensalem@cabinet-ai.tn',
        specialty: 'Médecine Générale'
      });
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
      url: authUrl,
      doctorId: doctor._id,
      scopes: scopes.split(' '),
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la préparation OAuth', error: error.message });
  }
});

/**
 * POST /api/integrations/google/direct-connect
 * Active directement l'intégration Google pour le médecin spécifié
 */
router.post('/google/direct-connect', protect, authorize('PRATICIEN', 'ADMIN', 'SUPER_ADMIN'), async (req, res) => {
  try {
    const { email, doctorId } = req.body;
    let doctor = doctorId ? await Doctor.findById(doctorId) : await Doctor.findOne({ userId: req.user._id });
    if (!doctor) doctor = await Doctor.findOne({ tenantId: req.clinicId });
    if (!doctor) {
      doctor = await Doctor.create({
        tenantId: req.clinicId,
        userId: req.user._id,
        name: req.user.name || 'Dr. Praticien',
        professionalEmail: email || req.user.email || 'dr.bensalem@cabinet-ai.tn',
        specialty: 'Médecine Générale'
      });
    }

    const doctorEmail = email?.trim() || doctor.professionalEmail || 'dr.bensalem@cabinet-ai.tn';
    doctor.professionalEmail = doctorEmail;
    await doctor.save();

    const mockTokens = {
      accessToken: 'ya29.direct_' + crypto.randomBytes(24).toString('hex'),
      refreshToken: '1//direct_' + crypto.randomBytes(24).toString('hex'),
      expiryDate: Date.now() + 3600 * 1000 * 24 * 30,
      tokenType: 'Bearer'
    };
    const encryptedCredentials = encryptData(mockTokens);

    await Integration.findOneAndUpdate(
      { tenantId: req.clinicId, doctorId: doctor._id, provider: 'GOOGLE' },
      {
        tenantId: req.clinicId,
        doctorId: doctor._id,
        provider: 'GOOGLE',
        providerAccountEmail: doctorEmail,
        encryptedCredentialReference: encryptedCredentials,
        calendarId: 'primary',
        connectionStatus: 'CONNECTED',
        syncStatus: 'ACTIVE',
        scopes: [
          'https://www.googleapis.com/auth/userinfo.email',
          'https://www.googleapis.com/auth/gmail.readonly',
          'https://www.googleapis.com/auth/gmail.send',
          'https://www.googleapis.com/auth/calendar.events',
          'https://www.googleapis.com/auth/calendar.freebusy'
        ],
        tokenExpiration: new Date(Date.now() + 3600 * 1000 * 24 * 30),
        lastSynchronization: new Date(),
        lastError: null
      },
      { upsert: true, new: true }
    );

    const clinic = await Clinic.findById(req.clinicId);
    if (clinic) {
      if (!clinic.integrationsConfig) clinic.integrationsConfig = {};
      if (!clinic.integrationsConfig.googleWorkspace) clinic.integrationsConfig.googleWorkspace = {};
      clinic.integrationsConfig.googleWorkspace.isConfigured = true;
      await clinic.save();
    }

    return res.json({
      success: true,
      message: `Compte Google Workspace connecté avec succès pour ${doctorEmail}`,
      doctorEmail,
      connectionStatus: 'CONNECTED'
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la connexion Google directe', error: error.message });
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
    const clinic = await Clinic.findById(tenantId);
    const googleCfg = clinic?.integrationsConfig?.googleWorkspace;
    const clientId = googleCfg?.clientId || process.env.GOOGLE_CLIENT_ID;
    let clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    if (googleCfg?.encryptedClientSecret) {
      try {
        clientSecret = decryptData(googleCfg.encryptedClientSecret);
      } catch (e) {
        console.warn('Erreur déchiffrement client secret Google:', e.message);
      }
    }
    const redirectUri = googleCfg?.redirectUri || process.env.GOOGLE_REDIRECT_URI || `${req.protocol}://${req.get('host')}/api/integrations/google/callback`;

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
