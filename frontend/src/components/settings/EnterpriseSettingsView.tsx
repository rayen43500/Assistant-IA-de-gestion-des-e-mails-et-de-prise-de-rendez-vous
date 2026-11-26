import React, { useState, useEffect } from 'react';
import { API_BASE_URL, apiClient, apiErrorMessage } from '../../services/apiClient';
import {
  Building2,
  ShieldCheck,
  Sliders,
  Bell,
  Lock,
  UserCheck,
  Sparkles,
  Key,
  Globe,
  Save,
  Mail,
  Calendar,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Trash2,
  MessageCircle,
  Phone,
  X,
  Settings2,
  Copy,
  Eye,
  EyeOff
} from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore';
import {
  apiGetGoogleStatus,
  apiGetGoogleConnectUrl,
  apiDisconnectGoogle,
  apiDirectConnectGoogle,
  apiGetWhatsAppStatus,
  apiConnectWhatsApp,
  apiDisconnectWhatsApp,
  apiGetGoogleWorkspaceConfig,
  apiSaveGoogleWorkspaceConfig,
  apiGetWhatsAppConfig,
  apiSaveWhatsAppConfig,
  apiGetPracticeDoctors,
  apiSyncGoogleCalendar,
  apiTestIncomingEmail
} from '../../services/apiClient';

interface DoctorOption {
  _id: string;
  name: string;
  professionalEmail?: string;
  specialty?: string;
}

export const EnterpriseSettingsView: React.FC = () => {
  const {
    sector,
    organizationName,
    setOrganizationName,
    aiAutonomyLevel,
    setAiAutonomyLevel,
    confidenceThreshold,
    setConfidenceThreshold,
    showToast
  } = useAppStore();

  const [emergencyPhone, setEmergencyPhone] = useState('');
  const [openingHours, setOpeningHours] = useState('08:30 - 17:30');
  const [activeSection, setActiveSection] = useState<'all' | 'ai' | 'google' | 'cabinet'>('all');

  // État RÉEL de l'intégration Google (boîte centrale Gmail + agenda) — renvoyé par le serveur
  const [googleStatus, setGoogleStatus] = useState<{
    connected: boolean;
    configured?: boolean;
    canSendEmails?: boolean;
    email?: string;
    scopes?: string[];
    syncStatus?: string;
    calendarId?: string;
    lastSyncAt?: string;
    polling?: any;
  }>({ connected: false, email: '' });
  const [loadingGoogle, setLoadingGoogle] = useState(false);

  // Modal Configuration Google Workspace
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [showAdvancedDevSettings, setShowAdvancedDevSettings] = useState(false);
  const [googleClientId, setGoogleClientId] = useState('');
  const [googleClientSecret, setGoogleClientSecret] = useState('');
  const [showSecret, setShowSecret] = useState(false);
  const [googleRedirectUri, setGoogleRedirectUri] = useState(`${API_BASE_URL}/api/integrations/google/callback`);
  const [gmailEnabled, setGmailEnabled] = useState(true);
  const [calendarEnabled, setCalendarEnabled] = useState(true);
  const [hasStoredSecret, setHasStoredSecret] = useState(false);
  const [savingGoogle, setSavingGoogle] = useState(false);

  // Praticiens du cabinet
  const [doctorsList, setDoctorsList] = useState<DoctorOption[]>([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [doctorIndividualEmail, setDoctorIndividualEmail] = useState<string>('');

  // État WhatsApp Business (réel)
  const [whatsAppStatus, setWhatsAppStatus] = useState<{
    connected: boolean;
    phoneNumber?: string;
    lastSyncAt?: string;
  }>({ connected: false });
  const [loadingWhatsApp, setLoadingWhatsApp] = useState(false);

  // Modal Configuration WhatsApp Business API
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [whatsAppPhoneNumber, setWhatsAppPhoneNumber] = useState('');
  const [whatsAppAccessToken, setWhatsAppAccessToken] = useState('');
  const [showWhatsAppToken, setShowWhatsAppToken] = useState(false);
  const [whatsAppBusinessAccountId, setWhatsAppBusinessAccountId] = useState('');
  const [whatsAppPhoneNumberId, setWhatsAppPhoneNumberId] = useState('');
  const [whatsAppEnabled, setWhatsAppEnabled] = useState(true);
  const [hasStoredToken, setHasStoredToken] = useState(false);
  const [savingWhatsApp, setSavingWhatsApp] = useState(false);

  // Lecture immédiate de la boîte + test du moteur
  const [replyMode, setReplyMode] = useState<'auto' | 'hitl'>('auto');
  const [replyModeLocked, setReplyModeLocked] = useState(false);
  useEffect(() => {
    apiClient.get('/api/integrations/ai-settings').then(({ data }) => {
      setReplyMode(data.autoReplyMode);
      setReplyModeLocked(Boolean(data.lockedByServer));
    }).catch(() => {});
  }, []);
  const saveReplyMode = async (mode: 'auto' | 'hitl') => {
    if (replyModeLocked || mode === replyMode) return;
    const previous = replyMode;
    setReplyMode(mode);
    try {
      await apiClient.put('/api/integrations/ai-settings', { autoReplyMode: mode });
      setAiAutonomyLevel(mode === 'hitl' ? 'SUPERVISED' : 'AUTONOMOUS');
      showToast({ title: 'Mode enregistré', message: mode === 'auto' ? 'Les réponses claires partent automatiquement.' : 'Toutes les réponses attendent votre validation.', type: 'success' });
    } catch (err: any) {
      setReplyMode(previous);
      showToast({ title: 'Non enregistré', message: apiErrorMessage(err), type: 'danger' });
    }
  };

  const [isSyncing, setIsSyncing] = useState(false);
  const [showSyncReportModal, setShowSyncReportModal] = useState(false);
  const [syncReport, setSyncReport] = useState<any>(null);
  const [testingIncomingEmail, setTestingIncomingEmail] = useState(false);
  const [testEmailResult, setTestEmailResult] = useState<any>(null);

  useEffect(() => {
    loadAllConfigs();
  }, []);

  const loadAllConfigs = async () => {
    await Promise.all([
      loadGoogleIntegrationStatus(),
      loadGoogleWorkspaceConfig(),
      loadWhatsAppConfig(),
      loadPracticeDoctors()
    ]);
  };

  const loadPracticeDoctors = async () => {
    try {
      const res = await apiGetPracticeDoctors();
      if (res && res.doctors && res.doctors.length > 0) {
        setDoctorsList(res.doctors);
        setSelectedDoctorId(res.doctors[0]._id);
      }
    } catch {
      setDoctorsList([]);
    }
  };

  const loadGoogleWorkspaceConfig = async () => {
    try {
      const res = await apiGetGoogleWorkspaceConfig();
      if (res) {
        setGoogleClientId(res.clientId || '');
        setGoogleRedirectUri(res.redirectUri || `${API_BASE_URL}/api/integrations/google/callback`);
        setGmailEnabled(res.gmailEnabled !== false);
        setCalendarEnabled(res.calendarEnabled !== false);
        setHasStoredSecret(Boolean(res.hasSecret));
        if (res.doctorEmail) setDoctorIndividualEmail(res.doctorEmail);
      }
    } catch {
      // configuration absente : formulaire vide
    }
  };

  const loadWhatsAppConfig = async () => {
    try {
      const res = await apiGetWhatsAppConfig();
      if (res) {
        setWhatsAppPhoneNumber(res.phoneNumber || '');
        setWhatsAppBusinessAccountId(res.businessAccountId || '');
        setWhatsAppPhoneNumberId(res.phoneNumberId || '');
        setWhatsAppEnabled(res.enabled !== false);
        setHasStoredToken(!!res.hasToken);
        setWhatsAppStatus({
          connected: !!res.isConfigured && !!res.hasToken,
          phoneNumber: res.phoneNumber || '',
          lastSyncAt: res.isConfigured && res.hasToken ? 'Configuré' : 'Non configuré'
        });
      }
    } catch {
      setWhatsAppStatus({ connected: false });
    }
  };

  const formatSync = (v?: string | null) => {
    if (!v) return '—';
    const d = new Date(v);
    return Number.isNaN(d.getTime()) ? String(v) : d.toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  };

  const loadGoogleIntegrationStatus = async () => {
    try {
      const res = await apiGetGoogleStatus();
      setGoogleStatus({
        connected: Boolean(res?.connected),
        configured: Boolean(res?.configured),
        canSendEmails: Boolean(res?.canSendEmails),
        email: res?.email || '',
        scopes: res?.scopes || [],
        syncStatus: res?.status,
        calendarId: res?.calendarId || 'primary',
        lastSyncAt: formatSync(res?.polling?.lastPollAt || res?.lastSynchronization),
        polling: res?.polling,
      });
      if (res?.email) setDoctorIndividualEmail(res.email);
    } catch {
      setGoogleStatus({ connected: false, email: '' });
    }
  };

  // Informations du cabinet (nom, téléphone d'astreinte) enregistrées sur le serveur
  useEffect(() => {
    apiClient.get('/api/clinics/current').then(({ data }) => {
      if (data?.name) setOrganizationName(data.name);
      if (data?.phone) setEmergencyPhone(data.phone);
    }).catch(() => {});
  }, []);

  const handleSaveGeneral = async () => {
    try {
      await apiClient.put('/api/clinics/settings', { name: organizationName, phone: emergencyPhone });
      showToast({ title: 'Cabinet mis à jour', message: 'Nom et téléphone d’astreinte enregistrés.', type: 'success' });
    } catch (err: any) {
      showToast({ title: 'Non enregistré', message: apiErrorMessage(err), type: 'danger' });
    }
  };

  // Enregistre Client ID / Secret / adresse de la boîte centrale
  const saveGoogleConfig = async () => {
    const docEmail = doctorIndividualEmail.trim();
    await apiSaveGoogleWorkspaceConfig({
      clientId: googleClientId.trim(),
      clientSecret: googleClientSecret.trim() || undefined,
      redirectUri: googleRedirectUri.trim(),
      gmailEnabled,
      calendarEnabled,
      doctorEmail: docEmail || undefined,
      doctorId: selectedDoctorId || undefined
    } as any);
    if (googleClientSecret.trim()) setHasStoredSecret(true);
    setGoogleClientSecret('');
  };

  const handleSaveGoogleConfig = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!googleClientId.trim()) {
      showToast({ title: 'Client ID requis', message: 'Collez le Client ID OAuth fourni par Google Cloud Console.', type: 'warning' });
      return;
    }
    setSavingGoogle(true);
    try {
      await saveGoogleConfig();
      await loadGoogleIntegrationStatus();
      setShowGoogleModal(false);
      showToast({ title: 'Configuration Google enregistrée', message: 'Cliquez ensuite sur « Autoriser avec Google » pour connecter la boîte.', type: 'success' });
    } catch (err: any) {
      showToast({ title: 'Enregistrement impossible', message: apiErrorMessage(err), type: 'danger' });
    } finally {
      setSavingGoogle(false);
    }
  };

  // Enregistrement Configuration WhatsApp Business API
  const handleSaveWhatsAppConfig = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!whatsAppPhoneNumber.trim()) {
      showToast({ title: 'Numéro requis', message: 'Veuillez saisir un numéro de téléphone WhatsApp valide.', type: 'warning' });
      return;
    }
    setSavingWhatsApp(true);
    try {
      await apiSaveWhatsAppConfig({
        phoneNumber: whatsAppPhoneNumber.trim(),
        metaAccessToken: whatsAppAccessToken.trim() || undefined,
        businessAccountId: whatsAppBusinessAccountId.trim(),
        phoneNumberId: whatsAppPhoneNumberId.trim(),
        enabled: whatsAppEnabled
      });
      await loadWhatsAppConfig();
      setShowWhatsAppModal(false);
      showToast({ title: 'WhatsApp Business enregistré', message: `Numéro ${whatsAppPhoneNumber} enregistré.`, type: 'success' });
    } catch (err: any) {
      showToast({ title: 'Erreur WhatsApp', message: apiErrorMessage(err, 'Erreur lors de la sauvegarde WhatsApp.'), type: 'danger' });
    } finally {
      setSavingWhatsApp(false);
    }
  };

  // Connexion OAuth réelle : enregistrement des identifiants puis redirection vers Google
  const handleConnectGoogleOAuth = async () => {
    setLoadingGoogle(true);
    try {
      if (googleClientId.trim()) await saveGoogleConfig();
      const res = await apiGetGoogleConnectUrl();
      const targetUrl = res?.authUrl || res?.url;
      if (!targetUrl) throw new Error('URL d’autorisation Google indisponible.');
      // Retour automatique sur l'application après consentement (?google_connected=success)
      window.location.href = targetUrl;
    } catch (err: any) {
      setLoadingGoogle(false);
      setShowGoogleModal(true);
      showToast({ title: 'Connexion Google impossible', message: apiErrorMessage(err, err?.message), type: 'danger' });
    }
  };

  const handleDisconnectGoogle = async () => {
    if (!window.confirm('Voulez-vous déconnecter la boîte Gmail ? Les e-mails ne seront plus lus ni répondus automatiquement.')) return;
    try {
      await apiDisconnectGoogle();
      showToast({ title: 'Google déconnecté', message: 'La lecture et l’envoi des e-mails sont suspendus.', type: 'info' });
    } catch (err: any) {
      showToast({ title: 'Déconnexion impossible', message: apiErrorMessage(err), type: 'danger' });
    }
    await loadGoogleIntegrationStatus();
  };

  const handleDisconnectWhatsApp = async () => {
    if (!window.confirm('Voulez-vous déconnecter WhatsApp Business ?')) return;
    try {
      await apiDisconnectWhatsApp();
    } catch (err: any) {
      showToast({ title: 'Déconnexion impossible', message: apiErrorMessage(err), type: 'danger' });
    }
    await loadWhatsAppConfig();
  };

  // Lecture immédiate de la boîte Gmail (au lieu d'attendre le cycle de 30 s)
  const handleManualSync = async () => {
    setIsSyncing(true);
    setTestEmailResult(null);
    try {
      const { data } = await apiClient.post('/api/integrations/google/poll-now');
      setSyncReport(data);
      setShowSyncReportModal(true);
      await loadGoogleIntegrationStatus();
      useAppStore.getState().loadAllData();
    } catch (err: any) {
      showToast({ title: 'Lecture impossible', message: apiErrorMessage(err), type: 'danger' });
    } finally {
      setIsSyncing(false);
    }
  };

  // Test du moteur IA sur un e-mail fictif (aucun envoi au patient)
  const handleTestIncomingEmail = async () => {
    setTestingIncomingEmail(true);
    try {
      const { data } = await apiClient.post('/api/emails/ingest', {
        senderName: 'Patient Test',
        senderEmail: 'test.moteur@exemple.tn',
        subject: '[TEST] Demande de rendez-vous',
        body: '[TEST] Bonjour, je souhaite un rendez-vous demain à 10h00 pour une consultation.',
        autoSend: false
      });
      setTestEmailResult(data);
      useAppStore.getState().loadEmails();
    } catch (err: any) {
      showToast({ title: 'Test impossible', message: apiErrorMessage(err), type: 'danger' });
    } finally {
      setTestingIncomingEmail(false);
    }
  };

  const handleDoctorChange = (docId: string) => {
    setSelectedDoctorId(docId);
    const doc = doctorsList.find(d => d._id === docId);
    if (doc && doc.professionalEmail) {
      setDoctorIndividualEmail(doc.professionalEmail);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showToast({
      title: 'Copié !',
      message: 'URI de redirection copiée dans le presse-papier.',
      type: 'info'
    });
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* En-tête des paramètres */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E5EAF2] pb-5">
        <div>
          <h1 className="text-xl font-black text-[#14213D] tracking-tight">Paramètres du Cabinet</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Gérez vos règles d'autonomie IA, vos intégrations Google & WhatsApp et vos identifiants praticiens
          </p>
        </div>

        {/* Onglets rapides */}
        <div className="flex items-center gap-1.5 p-1 bg-[#F7F9FC] rounded-2xl border border-[#E5EAF2] shrink-0">
          <button
            onClick={() => setActiveSection('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeSection === 'all' ? 'bg-[#2563EB] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Vue d'ensemble
          </button>
          <button
            onClick={() => setActiveSection('google')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeSection === 'google' ? 'bg-[#2563EB] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Intégrations & APIs
          </button>
          <button
            onClick={() => setActiveSection('ai')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeSection === 'ai' ? 'bg-[#2563EB] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Moteur IA
          </button>
          <button
            onClick={() => setActiveSection('cabinet')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeSection === 'cabinet' ? 'bg-[#2563EB] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Cabinet
          </button>
        </div>
      </div>

      {/* SECTION 1 : Autonomie & Moteur NLP IA */}
      {(activeSection === 'all' || activeSection === 'ai') && (
        <div className="bg-white rounded-2xl border border-[#E5EAF2] shadow-xs p-6 space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#2563EB]">
                <Sliders className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-[#14213D]">Autonomie & Moteur NLP de l'Assistant IA</h2>
                <p className="text-xs text-slate-500">Contrôle de validation humaine des e-mails entrants</p>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-50 text-[#2563EB] border border-blue-200">
              {replyMode === 'hitl' ? 'Mode supervisé' : 'Mode automatique'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div
              onClick={() => saveReplyMode('hitl')}
              className={`p-4 rounded-xl border cursor-pointer transition-all ${
                replyMode === 'hitl'
                  ? 'border-[#2563EB] bg-blue-50/50 shadow-xs'
                  : 'border-[#E5EAF2] hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-bold text-xs text-[#14213D]">Supervision du secrétariat</span>
                {replyMode === 'hitl' && <CheckCircle2 className="w-4 h-4 text-[#2563EB]" />}
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                L’IA prépare chaque réponse (confirmation, créneaux, demande de précision) et réserve les créneaux, mais rien n’est envoyé au patient sans votre validation.
              </p>
            </div>

            <div
              onClick={() => saveReplyMode('auto')}
              className={`p-4 rounded-xl border cursor-pointer transition-all ${
                replyMode === 'auto'
                  ? 'border-[#2563EB] bg-blue-50/50 shadow-xs'
                  : 'border-[#E5EAF2] hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-bold text-xs text-[#14213D]">Réponses automatiques 24h/24 (recommandé)</span>
                {replyMode === 'auto' && <CheckCircle2 className="w-4 h-4 text-[#2563EB]" />}
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                E-mail clair (praticien, date, heure) et créneau libre : RDV réservé et confirmé immédiatement. Sinon, l’IA demande la précision manquante. Les autres messages restent à valider.
              </p>
            </div>
          </div>

          {replyModeLocked && (
            <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2">
              Le serveur impose le mode supervisé (AUTO_REPLY_MODE=hitl).
            </p>
          )}
        </div>
      )}

      {/* SECTION 2 : INTÉGRATIONS EXTERNES DÉDIÉES (Gmail, Google Calendar, WhatsApp) */}
      {(activeSection === 'all' || activeSection === 'google') && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-[#2563EB]" />
                <h2 className="text-sm font-bold text-[#14213D] uppercase tracking-wider">
                  Intégrations Externes & APIs Officielles
                </h2>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Gérez vos canaux de communication et la synchronisation de chaque praticien
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowGoogleModal(true)}
                className="px-3.5 py-2 bg-white hover:bg-slate-50 border border-[#E5EAF2] text-[#14213D] rounded-xl text-xs font-bold shadow-2xs flex items-center gap-1.5 transition-all"
              >
                <Settings2 className="w-3.5 h-3.5 text-[#2563EB]" />
                <span>Config Google Workspace</span>
              </button>
              <button
                onClick={() => setShowWhatsAppModal(true)}
                className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold shadow-2xs flex items-center gap-1.5 transition-all"
              >
                <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                <span>Config WhatsApp API</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* CARD 1: GMAIL */}
            <div className="bg-white rounded-2xl border border-[#E5EAF2] shadow-xs p-5 flex flex-col justify-between space-y-4 hover:border-slate-300 transition-all">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center text-red-600">
                    <Mail className="w-5 h-5" />
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                    googleStatus.connected
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}>
                    {googleStatus.connected ? '● Connecté' : 'À connecter'}
                  </span>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-[#14213D]">Gmail</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Gestion des emails professionnels</p>
                </div>

                {googleStatus.connected ? (
                  <div className="space-y-1.5">
                    <div className="p-2.5 rounded-xl bg-[#F7F9FC] border border-[#E5EAF2] text-[11px] font-mono text-slate-700 truncate">
                      {googleStatus.email}
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Boîte centrale : l’IA lit chaque e-mail, identifie le praticien et répond dans le même fil (dernière lecture : {googleStatus.lastSyncAt}).
                    </p>
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-400">
                    Configurez vos clés Google Workspace pour permettre à l'IA d'analyser vos e-mails entrants.
                  </p>
                )}
              </div>

              <div className="space-y-2">
                {googleStatus.connected ? (
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowGoogleModal(true)}
                      className="flex-1 py-2 bg-[#F7F9FC] hover:bg-slate-100 border border-[#E5EAF2] text-slate-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Settings2 className="w-3.5 h-3.5 text-[#2563EB]" />
                      <span>Configurer</span>
                    </button>
                    <button
                      onClick={handleDisconnectGoogle}
                      className="p-2 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 rounded-xl transition-colors"
                      title="Déconnecter Gmail"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowGoogleModal(true)}
                    className="w-full py-2 bg-[#2563EB] hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-colors"
                  >
                    <Settings2 className="w-3.5 h-3.5" />
                    <span>Connecter Gmail</span>
                  </button>
                )}
              </div>
            </div>

            {/* CARD 2: GOOGLE CALENDAR */}
            <div className="bg-white rounded-2xl border border-[#E5EAF2] shadow-xs p-5 flex flex-col justify-between space-y-4 hover:border-slate-300 transition-all">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#2563EB]">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                    googleStatus.connected
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}>
                    {googleStatus.connected ? '● Connecté' : 'À connecter'}
                  </span>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-[#14213D]">Google Calendar</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Synchronisation des rendez-vous</p>
                </div>

                {googleStatus.connected ? (
                  <div className="space-y-1.5">
                    <div className="p-2.5 rounded-xl bg-[#F7F9FC] border border-[#E5EAF2] text-[11px] flex items-center justify-between text-slate-600">
                      <span>Dernière synchro :</span>
                      <span className="font-semibold text-[#14213D]">{googleStatus.lastSyncAt}</span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Synchronisation bidirectionnelle avec marquage anti-boucle et respect de la pause déjeuner (12:30-14:00).
                    </p>
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-400">
                    Activez la consultation des créneaux FreeBusy en direct et l'ajout automatique des réservations.
                  </p>
                )}
              </div>

              <div>
                {googleStatus.connected ? (
                  <div className="flex gap-2">
                    <button
                      onClick={handleManualSync}
                      disabled={isSyncing}
                      className="flex-1 py-2 bg-[#F7F9FC] hover:bg-slate-100 border border-[#E5EAF2] text-slate-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 text-[#2563EB] ${isSyncing ? 'animate-spin' : ''}`} />
                      <span>{isSyncing ? 'Lecture…' : 'Lire la boîte maintenant'}</span>
                    </button>
                    <button
                      onClick={() => setShowGoogleModal(true)}
                      className="p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl transition-colors"
                      title="Configurer Google Calendar"
                    >
                      <Settings2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowGoogleModal(true)}
                    className="w-full py-2 bg-[#2563EB] hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-colors"
                  >
                    <Settings2 className="w-3.5 h-3.5" />
                    <span>Connecter Calendar</span>
                  </button>
                )}
              </div>
            </div>

            {/* CARD 3: WHATSAPP */}
            <div className="bg-white rounded-2xl border border-[#E5EAF2] shadow-xs p-5 flex flex-col justify-between space-y-4 hover:border-slate-300 transition-all">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
                    <MessageCircle className="w-5 h-5" />
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                    whatsAppStatus.connected
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}>
                    {whatsAppStatus.connected ? '● Connecté' : 'À connecter'}
                  </span>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-[#14213D]">WhatsApp</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Rappels automatiques des rendez-vous</p>
                </div>

                {whatsAppStatus.connected ? (
                  <div className="space-y-1.5">
                    <div className="p-2.5 rounded-xl bg-[#F7F9FC] border border-[#E5EAF2] text-[11px] font-mono text-emerald-700 flex items-center justify-between">
                      <span className="font-bold">{whatsAppStatus.phoneNumber || '+216 98 111 222'}</span>
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-bold">Actif</span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Rappels automatiques expédiés aux patients 24h avant chaque consultation avec lien d'annulation/confirmation.
                    </p>
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-400">
                    Connectez votre compte WhatsApp Business pour envoyer des rappels automatiques et réduire l'absentéisme.
                  </p>
                )}
              </div>

              <div>
                {whatsAppStatus.connected ? (
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowWhatsAppModal(true)}
                      className="flex-1 py-2 bg-[#F7F9FC] hover:bg-slate-100 border border-[#E5EAF2] text-slate-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Settings2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Modifier Numéro</span>
                    </button>
                    <button
                      onClick={handleDisconnectWhatsApp}
                      className="p-2 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 rounded-xl transition-colors"
                      title="Déconnecter WhatsApp"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowWhatsAppModal(true)}
                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-colors"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>Connecter WhatsApp</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 3 : Structure & Informations du Cabinet */}
      {(activeSection === 'all' || activeSection === 'cabinet') && (
        <div className="bg-white rounded-2xl border border-[#E5EAF2] shadow-xs p-6 space-y-4">
          <h2 className="text-sm font-bold text-[#14213D]">Informations de la Structure & Astreinte</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Nom Officiel du Cabinet</label>
              <input
                type="text"
                value={organizationName}
                onChange={e => setOrganizationName(e.target.value)}
                className="w-full p-2.5 bg-[#F7F9FC] border border-[#E5EAF2] rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#2563EB]"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Téléphone d’Astreinte Praticien (Urgences)</label>
              <input
                type="text"
                value={emergencyPhone}
                onChange={e => setEmergencyPhone(e.target.value)}
                className="w-full p-2.5 bg-[#F7F9FC] border border-[#E5EAF2] rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#2563EB]"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              onClick={handleSaveGeneral}
              className="px-5 py-2.5 bg-[#2563EB] hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-all"
            >
              <Save className="w-4 h-4" />
              <span>Enregistrer les Modifications</span>
            </button>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 1 : CONFIGURATION GOOGLE WORKSPACE (Clés réelles)   */}
      {/* ======================================================== */}
      {showGoogleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs font-sans animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-[#E8EDF4] space-y-5 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#E8EDF4]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 text-[#2563EB] flex items-center justify-center">
                  <Mail className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h3 className="text-base font-black text-[#14213D]">Configuration Google Workspace</h3>
                  <p className="text-xs text-slate-500">Connectez les services Google de votre cabinet.</p>
                </div>
              </div>
              <button
                onClick={() => setShowGoogleModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveGoogleConfig} className="space-y-4 text-xs">
              {/* Boîte Gmail personnelle du praticien (configuration dédiée individuelle) */}
              <div className="p-3.5 bg-blue-50/60 rounded-2xl border border-blue-100 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#14213D] flex items-center gap-1.5">
                    <UserCheck className="w-4 h-4 text-[#2563EB]" />
                    Boîte de réception des patients
                  </span>
                  <span className="text-[10px] text-blue-700 font-bold bg-blue-100 px-2.5 py-0.5 rounded-full">
                    Boîte centrale du cabinet
                  </span>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Adresse Gmail qui reçoit les demandes de rendez-vous
                  </label>
                  <input
                    type="email"
                    value={doctorIndividualEmail}
                    onChange={e => setDoctorIndividualEmail(e.target.value)}
                    placeholder="rdv@votre-cabinet.tn"
                    className="w-full px-3 py-2 bg-white border border-[#E5EAF2] rounded-xl text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                  <p className="text-[10px] text-slate-500 mt-1.5">
                    Les patients écrivent à cette adresse sans créer de compte. Après « Autoriser avec Google », connectez-vous avec CE compte Gmail.
                  </p>
                </div>
              </div>

              {/* Carte Simplifiée & Sécurisée Praticien */}
              <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200/80 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="text-xs font-bold text-emerald-900">Connexion Google Chiffrée (AES-256)</span>
                </div>
                <span className="text-[10px] text-emerald-700 font-bold bg-white px-2 py-0.5 rounded-md border border-emerald-200">
                  Automatique • Prêt
                </span>
              </div>

              {/* Accordéon masqué pour les paramètres techniques de développement */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => setShowAdvancedDevSettings(!showAdvancedDevSettings)}
                  className="text-[11px] font-semibold text-slate-400 hover:text-slate-600 flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <span>{showAdvancedDevSettings ? '▼ Masquer' : '▶ Afficher'} Paramètres Techniques API (Réservé Développeur / IT)</span>
                </button>

                {showAdvancedDevSettings && (
                  <div className="mt-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1 flex items-center gap-1.5">
                        <Key className="w-3.5 h-3.5 text-slate-400" />
                        Google Client ID
                      </label>
                      <input
                        type="text"
                        value={googleClientId}
                        onChange={e => setGoogleClientId(e.target.value)}
                        placeholder="xxxxxxxx.apps.googleusercontent.com"
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-[11px] font-mono"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[11px] font-bold text-slate-600 flex items-center gap-1.5">
                          <Lock className="w-3.5 h-3.5 text-slate-400" />
                          Google Client Secret
                        </label>
                        {hasStoredSecret && (
                          <span className="text-[9px] text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                            ✓ Chiffré AES-256 stocké
                          </span>
                        )}
                      </div>
                      <div className="relative">
                        <input
                          type={showSecret ? 'text' : 'password'}
                          value={googleClientSecret}
                          onChange={e => setGoogleClientSecret(e.target.value)}
                          placeholder={hasStoredSecret ? '•••••••••••••••••••••••• (inchangé)' : 'GOCSPX-xxxxxxxxxxxxxx'}
                          className="w-full pl-3 pr-8 py-1.5 bg-white border border-slate-200 rounded-lg text-[11px] font-mono"
                        />
                        <button
                          type="button"
                          onClick={() => setShowSecret(!showSecret)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                          {showSecret ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1 flex items-center gap-1.5">
                        <Globe className="w-3.5 h-3.5 text-slate-400" />
                        Google Redirect URI
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={googleRedirectUri}
                          onChange={e => setGoogleRedirectUri(e.target.value)}
                          className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-[11px] font-mono text-slate-600"
                        />
                        <button
                          type="button"
                          onClick={() => copyToClipboard(googleRedirectUri)}
                          className="px-2.5 py-1.5 bg-slate-200 hover:bg-slate-300 rounded-lg text-[11px] font-bold text-slate-700 flex items-center gap-1"
                        >
                          <Copy className="w-3 h-3" />
                          <span>Copier</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Services à connecter */}
              <div className="pt-2 border-t border-[#E8EDF4] space-y-2">
                <span className="block font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                  Services à connecter
                </span>

                <div className="flex items-center justify-between p-3 rounded-xl bg-[#F7F9FC] border border-[#E8EDF4]">
                  <div className="flex items-center gap-2.5">
                    <Mail className="w-4 h-4 text-red-500" />
                    <div>
                      <div className="font-bold text-slate-800">Gmail API</div>
                      <div className="text-[10px] text-slate-500">Lecture et brouillons de réponse sécurisés</div>
                    </div>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <span className="text-[11px] font-bold text-emerald-600">
                      {gmailEnabled ? 'Activé' : 'Désactivé'}
                    </span>
                    <input
                      type="checkbox"
                      checked={gmailEnabled}
                      onChange={e => setGmailEnabled(e.target.checked)}
                      className="sr-only"
                    />
                    <div className={`w-9 h-5 rounded-full transition-colors relative ${gmailEnabled ? 'bg-[#2563EB]' : 'bg-slate-300'}`}>
                      <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-transform ${gmailEnabled ? 'left-4.5' : 'left-0.5'}`} />
                    </div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-[#F7F9FC] border border-[#E8EDF4]">
                  <div className="flex items-center gap-2.5">
                    <Calendar className="w-4 h-4 text-[#2563EB]" />
                    <div>
                      <div className="font-bold text-slate-800">Google Calendar API</div>
                      <div className="text-[10px] text-slate-500">FreeBusy et synchronisation bidirectionnelle</div>
                    </div>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <span className="text-[11px] font-bold text-emerald-600">
                      {calendarEnabled ? 'Activé' : 'Désactivé'}
                    </span>
                    <input
                      type="checkbox"
                      checked={calendarEnabled}
                      onChange={e => setCalendarEnabled(e.target.checked)}
                      className="sr-only"
                    />
                    <div className={`w-9 h-5 rounded-full transition-colors relative ${calendarEnabled ? 'bg-[#2563EB]' : 'bg-slate-300'}`}>
                      <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-transform ${calendarEnabled ? 'left-4.5' : 'left-0.5'}`} />
                    </div>
                  </label>
                </div>
              </div>

              {/* Boutons d'action */}
              <div className="flex items-center justify-between pt-3 border-t border-[#E8EDF4]">
                <button
                  type="button"
                  onClick={handleConnectGoogleOAuth}
                  disabled={loadingGoogle}
                  className="px-4 py-2.5 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-[#2563EB] font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-2xs active:scale-[0.98]"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-[#2563EB]" />
                  <span>{loadingGoogle ? 'Connexion en cours...' : 'Autoriser avec Google OAuth'}</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowGoogleModal(false)}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={savingGoogle}
                    className="px-5 py-2.5 bg-[#2563EB] hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{savingGoogle ? 'Enregistrement...' : 'Enregistrer la configuration'}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 2 : CONFIGURATION WHATSAPP BUSINESS API (Meta Cloud)*/}
      {/* ======================================================== */}
      {showWhatsAppModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs font-sans animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-[#E8EDF4] space-y-5 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#E8EDF4]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center">
                  <MessageCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-[#14213D]">Configuration WhatsApp Business API</h3>
                  <p className="text-xs text-slate-500">Connectez l'API officielle Meta Cloud pour les rappels de RDV.</p>
                </div>
              </div>
              <button
                onClick={() => setShowWhatsAppModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveWhatsAppConfig} className="space-y-4 text-xs">
              {/* Numéro WhatsApp */}
              <div>
                <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  Numéro WhatsApp Professionnel du Cabinet
                </label>
                <input
                  type="text"
                  value={whatsAppPhoneNumber}
                  onChange={e => setWhatsAppPhoneNumber(e.target.value)}
                  placeholder="+216 98 111 222"
                  className="w-full px-3.5 py-2.5 bg-[#F7F9FC] border border-[#E8EDF4] rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  required
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Format international avec indicatif pays (ex: +216 pour la Tunisie).
                </span>
              </div>

              {/* Meta Access Token */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-slate-700 flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-slate-400" />
                    Meta Cloud Access Token (Bearer Token)
                  </label>
                  {hasStoredToken && (
                    <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      ✓ Token chiffré stocké
                    </span>
                  )}
                </div>
                <div className="relative">
                  <input
                    type={showWhatsAppToken ? 'text' : 'password'}
                    value={whatsAppAccessToken}
                    onChange={e => setWhatsAppAccessToken(e.target.value)}
                    placeholder={hasStoredToken ? '•••••••••••••••••••••••• (inchangé)' : 'EAABw...'}
                    className="w-full pl-3.5 pr-10 py-2.5 bg-[#F7F9FC] border border-[#E8EDF4] rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowWhatsAppToken(!showWhatsAppToken)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showWhatsAppToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* WABA ID & Phone Number ID */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">WhatsApp Business Account ID</label>
                  <input
                    type="text"
                    value={whatsAppBusinessAccountId}
                    onChange={e => setWhatsAppBusinessAccountId(e.target.value)}
                    placeholder="ex: 104592817291823"
                    className="w-full px-3 py-2 bg-[#F7F9FC] border border-[#E8EDF4] rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Phone Number ID</label>
                  <input
                    type="text"
                    value={whatsAppPhoneNumberId}
                    onChange={e => setWhatsAppPhoneNumberId(e.target.value)}
                    placeholder="ex: 109283746192837"
                    className="w-full px-3 py-2 bg-[#F7F9FC] border border-[#E8EDF4] rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
              </div>

              {/* Service activé */}
              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Rappels Automatiques 24h & Webhook n8n
                  </span>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <span className="text-[11px] font-bold text-emerald-700">
                      {whatsAppEnabled ? 'Activé' : 'Désactivé'}
                    </span>
                    <input
                      type="checkbox"
                      checked={whatsAppEnabled}
                      onChange={e => setWhatsAppEnabled(e.target.checked)}
                      className="sr-only"
                    />
                    <div className={`w-9 h-5 rounded-full transition-colors relative ${whatsAppEnabled ? 'bg-emerald-600' : 'bg-slate-300'}`}>
                      <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-transform ${whatsAppEnabled ? 'left-4.5' : 'left-0.5'}`} />
                    </div>
                  </label>
                </div>
                <p className="text-[11px] text-emerald-700 leading-relaxed">
                  L'IA expédie un message de rappel interactif la veille de chaque consultation avec boutons de confirmation ou annulation immédiate.
                </p>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E8EDF4]">
                <button
                  type="button"
                  onClick={() => setShowWhatsAppModal(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={savingWhatsApp}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{savingWhatsApp ? 'Enregistrement...' : 'Enregistrer la configuration'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* ======================================================== */}
      {/* MODAL 3 : RAPPORT & TEST DE SYNCHRONISATION EN DIRECT    */}
      {/* ======================================================== */}
      {showSyncReportModal && syncReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs font-sans animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-[#E8EDF4] space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#E8EDF4]">
              <div>
                <h3 className="text-base font-black text-[#14213D]">Lecture de la boîte Gmail</h3>
                <p className="text-xs text-slate-500">
                  Boîte : <strong className="font-mono text-slate-800">{syncReport.polling?.mailbox || googleStatus.email || '—'}</strong>
                </p>
              </div>
              <button onClick={() => setShowSyncReportModal(false)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100">
                <X className="w-4 h-4" />
              </button>
            </div>

            {syncReport.connected === false || syncReport.error ? (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs">
                {syncReport.error || 'La boîte Gmail n’est pas connectée. Autorisez l’accès avec Google pour activer la lecture et les réponses automatiques.'}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 text-xs">
                {[
                  ['Nouveaux e-mails', syncReport.fetched],
                  ['Traités par l’IA', syncReport.processed],
                  ['Réponses envoyées', syncReport.replied],
                  ['Ignorés (robots, newsletters)', syncReport.skipped],
                ].map(([label, val]) => (
                  <div key={String(label)} className="p-3 bg-[#F7F9FC] border border-[#E8EDF4] rounded-2xl">
                    <span className="text-[11px] text-slate-500 font-semibold">{label}</span>
                    <div className="text-lg font-black text-[#14213D]">{val ?? 0}</div>
                  </div>
                ))}
              </div>
            )}
            <p className="text-[11px] text-slate-500">
              Lecture automatique toutes les {syncReport.polling?.intervalSeconds || 30} s • Dernière lecture : {formatSync(syncReport.polling?.lastPollAt)}
            </p>

            <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200/80 space-y-3 text-xs">
              <span className="font-bold text-[#14213D] flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-[#2563EB]" /> Tester le moteur IA
              </span>
              <p className="text-[11px] text-slate-600">Analyse un e-mail de test « RDV demain à 10h » (aucun e-mail n’est envoyé).</p>
              <button
                type="button"
                onClick={handleTestIncomingEmail}
                disabled={testingIncomingEmail}
                className="w-full py-2.5 bg-[#2563EB] hover:bg-blue-700 disabled:opacity-60 text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center justify-center gap-1.5"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>{testingIncomingEmail ? 'Analyse en cours…' : 'Lancer le test'}</span>
              </button>
              {testEmailResult && (
                <div className="p-3 bg-white rounded-xl border border-blue-100 space-y-2 text-[11px]">
                  <div className="flex items-center justify-between font-bold text-[#14213D]">
                    <span>Décision : {testEmailResult.decision}</span>
                    <span className="text-[10px] text-blue-600 font-mono">{testEmailResult.intent}</span>
                  </div>
                  <div className="text-slate-600">Praticien : {testEmailResult.practitioner?.name || 'à préciser par le patient'}</div>
                  <pre className="p-2 bg-slate-50 rounded-lg whitespace-pre-wrap font-sans text-slate-700">{testEmailResult.draftReply}</pre>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end pt-2 border-t border-[#E8EDF4]">
              <button onClick={() => setShowSyncReportModal(false)} className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-xs transition-colors">
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
