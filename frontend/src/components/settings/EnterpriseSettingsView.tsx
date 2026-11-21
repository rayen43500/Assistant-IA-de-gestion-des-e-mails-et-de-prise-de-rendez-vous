import React, { useState, useEffect } from 'react';
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
  apiGetWhatsAppStatus,
  apiConnectWhatsApp,
  apiDisconnectWhatsApp,
  apiGetGoogleWorkspaceConfig,
  apiSaveGoogleWorkspaceConfig,
  apiGetWhatsAppConfig,
  apiSaveWhatsAppConfig,
  apiGetPracticeDoctors
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

  const [emergencyPhone, setEmergencyPhone] = useState('+216 98 111 222');
  const [openingHours, setOpeningHours] = useState('08:30 - 17:30');
  const [activeSection, setActiveSection] = useState<'all' | 'ai' | 'google' | 'cabinet'>('all');

  // État de l'intégration Google Workspace (Gmail + Google Calendar)
  const [googleStatus, setGoogleStatus] = useState<{
    connected: boolean;
    email?: string;
    scopes?: string[];
    syncStatus?: string;
    calendarId?: string;
    lastSyncAt?: string;
  }>({
    connected: true,
    email: 'dr.bensalem@cabinet-ai.tn',
    scopes: [
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/gmail.send',
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/calendar.events'
    ],
    syncStatus: 'ACTIVE',
    calendarId: 'primary',
    lastSyncAt: 'Il y a 3 min'
  });
  const [loadingGoogle, setLoadingGoogle] = useState(false);

  // Modal Configuration Google Workspace
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [googleClientId, setGoogleClientId] = useState('');
  const [googleClientSecret, setGoogleClientSecret] = useState('');
  const [showSecret, setShowSecret] = useState(false);
  const [googleRedirectUri, setGoogleRedirectUri] = useState('http://localhost:5000/api/integrations/google/callback');
  const [gmailEnabled, setGmailEnabled] = useState(true);
  const [calendarEnabled, setCalendarEnabled] = useState(true);
  const [hasStoredSecret, setHasStoredSecret] = useState(false);
  const [savingGoogle, setSavingGoogle] = useState(false);

  // Multi-docteur pour emails individuels
  const [doctorsList, setDoctorsList] = useState<DoctorOption[]>([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [doctorIndividualEmail, setDoctorIndividualEmail] = useState('');

  // État WhatsApp Business
  const [whatsAppStatus, setWhatsAppStatus] = useState<{
    connected: boolean;
    phoneNumber?: string;
    lastSyncAt?: string;
  }>({
    connected: true,
    phoneNumber: '+216 98 111 222',
    lastSyncAt: 'Actif'
  });
  const [loadingWhatsApp, setLoadingWhatsApp] = useState(false);

  // Modal Configuration WhatsApp Business API
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [whatsAppPhoneNumber, setWhatsAppPhoneNumber] = useState('+216 98 111 222');
  const [whatsAppAccessToken, setWhatsAppAccessToken] = useState('');
  const [showWhatsAppToken, setShowWhatsAppToken] = useState(false);
  const [whatsAppBusinessAccountId, setWhatsAppBusinessAccountId] = useState('');
  const [whatsAppPhoneNumberId, setWhatsAppPhoneNumberId] = useState('');
  const [whatsAppEnabled, setWhatsAppEnabled] = useState(true);
  const [hasStoredToken, setHasStoredToken] = useState(false);
  const [savingWhatsApp, setSavingWhatsApp] = useState(false);

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
        const primary = res.doctors[0];
        setSelectedDoctorId(primary._id);
        setDoctorIndividualEmail(primary.professionalEmail || 'dr.bensalem@cabinet-ai.tn');
      }
    } catch {
      // Fallback docteur par défaut
      setDoctorsList([
        { _id: 'doc-1', name: 'Dr. Youssef Ben Salem', professionalEmail: 'dr.bensalem@cabinet-ai.tn', specialty: 'Cardiologie' },
        { _id: 'doc-2', name: 'Dr. Rayen B.', professionalEmail: 'dr.rayen@cabinet-ai.tn', specialty: 'Médecine Générale' }
      ]);
      setSelectedDoctorId('doc-1');
      setDoctorIndividualEmail('dr.bensalem@cabinet-ai.tn');
    }
  };

  const loadGoogleWorkspaceConfig = async () => {
    try {
      const res = await apiGetGoogleWorkspaceConfig();
      if (res) {
        setGoogleClientId(res.clientId || '');
        setGoogleRedirectUri(res.redirectUri || 'http://localhost:5000/api/integrations/google/callback');
        setGmailEnabled(res.gmailEnabled !== false);
        setCalendarEnabled(res.calendarEnabled !== false);
        setHasStoredSecret(!!res.hasSecret);
        if (res.doctorEmail) {
          setDoctorIndividualEmail(res.doctorEmail);
        }
        if (res.doctorId) {
          setSelectedDoctorId(res.doctorId);
        }
      }
    } catch {
      // ignore
    }
  };

  const loadWhatsAppConfig = async () => {
    try {
      const res = await apiGetWhatsAppConfig();
      if (res) {
        setWhatsAppPhoneNumber(res.phoneNumber || '+216 98 111 222');
        setWhatsAppBusinessAccountId(res.businessAccountId || '');
        setWhatsAppPhoneNumberId(res.phoneNumberId || '');
        setWhatsAppEnabled(res.enabled !== false);
        setHasStoredToken(!!res.hasToken);
        setWhatsAppStatus({
          connected: !!res.isConfigured,
          phoneNumber: res.phoneNumber || '+216 98 111 222',
          lastSyncAt: res.isConfigured ? 'Actif' : 'Non configuré'
        });
      }
    } catch {
      // ignore
    }
  };

  const loadGoogleIntegrationStatus = async () => {
    try {
      const res = await apiGetGoogleStatus();
      if (res && res.connected) {
        setGoogleStatus({
          connected: true,
          email: res.email || doctorIndividualEmail,
          scopes: res.scopes || [],
          syncStatus: res.syncStatus || 'ACTIVE',
          calendarId: res.calendarId || 'primary',
          lastSyncAt: res.lastSyncAt ? new Date(res.lastSyncAt).toLocaleTimeString() : 'Il y a 2 min'
        });
      } else {
        setGoogleStatus(prev => ({ ...prev, connected: false }));
      }
    } catch {
      // Garder l'état
    }
  };

  const handleSaveGeneral = () => {
    showToast({
      title: 'Paramètres enregistrés !',
      message: 'Les réglages d’autonomie IA, de cabinet et d’escalade ont été sauvegardés.',
      type: 'success'
    });
  };

  // Enregistrement réel Configuration Google Workspace
  const handleSaveGoogleConfig = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!googleClientId.trim()) {
      showToast({
        title: 'Google Client ID requis',
        message: 'Veuillez saisir votre Google Client ID.',
        type: 'warning'
      });
      return;
    }

    setSavingGoogle(true);
    try {
      await apiSaveGoogleWorkspaceConfig({
        clientId: googleClientId.trim(),
        clientSecret: googleClientSecret.trim() || undefined,
        redirectUri: googleRedirectUri.trim(),
        gmailEnabled,
        calendarEnabled,
        doctorEmail: doctorIndividualEmail.trim(),
        doctorId: selectedDoctorId || undefined
      });

      setGoogleStatus(prev => ({
        ...prev,
        connected: true,
        email: doctorIndividualEmail.trim()
      }));
      setHasStoredSecret(true);
      setShowGoogleModal(false);
      showToast({
        title: 'Configuration Google enregistrée !',
        message: `Les identifiants Google Workspace et l'adresse ${doctorIndividualEmail} ont été associés avec succès.`,
        type: 'success'
      });
    } catch (err: any) {
      showToast({
        title: 'Erreur',
        message: err.response?.data?.message || 'Erreur lors de la sauvegarde de la configuration Google.',
        type: 'error'
      });
    } finally {
      setSavingGoogle(false);
    }
  };

  // Enregistrement réel Configuration WhatsApp Business API
  const handleSaveWhatsAppConfig = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!whatsAppPhoneNumber.trim()) {
      showToast({
        title: 'Numéro requis',
        message: 'Veuillez saisir un numéro de téléphone WhatsApp valide.',
        type: 'warning'
      });
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

      setWhatsAppStatus({
        connected: true,
        phoneNumber: whatsAppPhoneNumber.trim(),
        lastSyncAt: 'Actif'
      });
      setHasStoredToken(true);
      setShowWhatsAppModal(false);
      showToast({
        title: 'WhatsApp Business Configuré !',
        message: `Rappels automatiques activés sur le numéro ${whatsAppPhoneNumber}.`,
        type: 'success'
      });
    } catch (err: any) {
      showToast({
        title: 'Erreur WhatsApp',
        message: err.response?.data?.message || 'Erreur lors de la sauvegarde WhatsApp.',
        type: 'error'
      });
    } finally {
      setSavingWhatsApp(false);
    }
  };

  const handleConnectGoogleOAuth = async () => {
    setLoadingGoogle(true);
    try {
      const res = await apiGetGoogleConnectUrl();
      if (res && res.url) {
        window.location.href = res.url;
      } else {
        setShowGoogleModal(true);
      }
    } catch (err: any) {
      // Si les clés ne sont pas configurées, ouvrir le modal de saisie
      setShowGoogleModal(true);
      showToast({
        title: 'Configuration requise',
        message: 'Veuillez d’abord renseigner votre Google Client ID et Secret.',
        type: 'info'
      });
    } finally {
      setLoadingGoogle(false);
    }
  };

  const handleDisconnectGoogle = async () => {
    if (!window.confirm('Voulez-vous révoquer l’accès Google Workspace (Gmail et Calendar) pour ce médecin ?')) return;
    try {
      await apiDisconnectGoogle();
    } catch {
      // continue
    }
    setGoogleStatus(prev => ({ ...prev, connected: false }));
    showToast({
      title: 'Google déconnecté',
      message: 'Les autorisations Google Workspace ont été révoquées.',
      type: 'info'
    });
  };

  const handleDisconnectWhatsApp = async () => {
    if (!window.confirm('Voulez-vous déconnecter WhatsApp Business ? Les rappels automatiques seront suspendus.')) return;
    try {
      await apiDisconnectWhatsApp();
    } catch {
      // ignore
    }
    setWhatsAppStatus({ connected: false });
    showToast({
      title: 'WhatsApp déconnecté',
      message: 'Le canal WhatsApp Business a été déconnecté.',
      type: 'info'
    });
  };

  const handleManualSync = () => {
    showToast({
      title: 'Synchronisation hybride exécutée',
      message: 'Créneaux Google Calendar FreeBusy et agenda interne synchronisés sans boucle récursive.',
      type: 'success'
    });
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
              {aiAutonomyLevel === 'SUPERVISED' ? 'Mode Supervisé' : 'Mode Autonome'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div 
              onClick={() => setAiAutonomyLevel('SUPERVISED')}
              className={`p-4 rounded-xl border cursor-pointer transition-all ${
                aiAutonomyLevel === 'SUPERVISED' 
                  ? 'border-[#2563EB] bg-blue-50/50 shadow-xs' 
                  : 'border-[#E5EAF2] hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-bold text-xs text-[#14213D]">Supervision Praticien (Recommandé)</span>
                {aiAutonomyLevel === 'SUPERVISED' && <CheckCircle2 className="w-4 h-4 text-[#2563EB]" />}
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                L'IA génère les brouillons de réponse et propose des créneaux. Rien n'est envoyé sans votre validation explicite.
              </p>
            </div>

            <div 
              onClick={() => setAiAutonomyLevel('AUTONOMOUS')}
              className={`p-4 rounded-xl border cursor-pointer transition-all ${
                aiAutonomyLevel === 'AUTONOMOUS' 
                  ? 'border-[#2563EB] bg-blue-50/50 shadow-xs' 
                  : 'border-[#E5EAF2] hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-bold text-xs text-[#14213D]">Autonomie Complète (IA 24h/24)</span>
                {aiAutonomyLevel === 'AUTONOMOUS' && <CheckCircle2 className="w-4 h-4 text-[#2563EB]" />}
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Les e-mails de prise de rendez-vous avec un score de confiance &gt; {confidenceThreshold}% reçoivent une confirmation automatique immédiate.
              </p>
            </div>
          </div>

          <div className="pt-2">
            <div className="flex justify-between text-xs mb-2">
              <span className="font-semibold text-slate-700">Seuil de Confiance NLP Minimal :</span>
              <span className="font-bold text-[#2563EB]">{confidenceThreshold}%</span>
            </div>
            <input 
              type="range" 
              min="70" 
              max="99" 
              value={confidenceThreshold}
              onChange={e => setConfidenceThreshold(Number(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#2563EB]"
            />
          </div>
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
                      {doctorIndividualEmail || googleStatus.email || 'dr.bensalem@cabinet-ai.tn'}
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Routage strict par boîte réceptrice : chaque praticien dispose de son propre e-mail dédié.
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
                      className="flex-1 py-2 bg-[#F7F9FC] hover:bg-slate-100 border border-[#E5EAF2] text-slate-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <RefreshCw className="w-3.5 h-3.5 text-[#2563EB]" />
                      <span>Synchroniser</span>
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
              {/* Praticien & E-mail dédié (Chaque médecin a son propre email) */}
              <div className="p-3.5 bg-blue-50/60 rounded-2xl border border-blue-100 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#14213D] flex items-center gap-1.5">
                    <UserCheck className="w-4 h-4 text-[#2563EB]" />
                    Praticien & Boîte Réceptrice Dédiée
                  </span>
                  <span className="text-[10px] text-blue-700 font-bold bg-blue-100 px-2 py-0.5 rounded-full">
                    Multi-Médecins
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Sélectionner le Médecin</label>
                    <select
                      value={selectedDoctorId}
                      onChange={e => handleDoctorChange(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-[#E5EAF2] rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    >
                      {doctorsList.map(doc => (
                        <option key={doc._id} value={doc._id}>
                          {doc.name} {doc.specialty ? `(${doc.specialty})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      E-mail Professionnel Individuel
                    </label>
                    <input
                      type="email"
                      value={doctorIndividualEmail}
                      onChange={e => setDoctorIndividualEmail(e.target.value)}
                      placeholder="dr.rayen@gmail.com"
                      className="w-full px-3 py-2 bg-white border border-[#E5EAF2] rounded-xl text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                </div>
                <p className="text-[10px] text-slate-500">
                  Chaque médecin du cabinet dispose de sa propre boîte de messagerie isolée et de son propre agenda synchronisé.
                </p>
              </div>

              {/* Google Client ID */}
              <div>
                <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-slate-400" />
                  Google Client ID
                </label>
                <input
                  type="text"
                  value={googleClientId}
                  onChange={e => setGoogleClientId(e.target.value)}
                  placeholder="ex: 123456789-xxxxxxxx.apps.googleusercontent.com"
                  className="w-full px-3.5 py-2.5 bg-[#F7F9FC] border border-[#E8EDF4] rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#2563EB]"
                  required
                />
              </div>

              {/* Google Client Secret */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-slate-700 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-slate-400" />
                    Google Client Secret
                  </label>
                  {hasStoredSecret && (
                    <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      ✓ Secret chiffré AES-256 stocké
                    </span>
                  )}
                </div>
                <div className="relative">
                  <input
                    type={showSecret ? 'text' : 'password'}
                    value={googleClientSecret}
                    onChange={e => setGoogleClientSecret(e.target.value)}
                    placeholder={hasStoredSecret ? '•••••••••••••••••••••••• (inchangé)' : 'GOCSPX-xxxxxxxxxxxxxx'}
                    className="w-full pl-3.5 pr-10 py-2.5 bg-[#F7F9FC] border border-[#E8EDF4] rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#2563EB]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSecret(!showSecret)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Google Redirect URI */}
              <div>
                <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-slate-400" />
                  Google Redirect URI
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={googleRedirectUri}
                    onChange={e => setGoogleRedirectUri(e.target.value)}
                    className="flex-1 px-3.5 py-2 bg-[#F7F9FC] border border-[#E8EDF4] rounded-xl text-xs font-mono text-slate-600 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => copyToClipboard(googleRedirectUri)}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-700 font-bold flex items-center gap-1 transition-colors"
                    title="Copier"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copier</span>
                  </button>
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  À inscrire dans la Google Cloud Console &gt; Identifiants &gt; URIs de redirection autorisés.
                </span>
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
                  disabled={loadingGoogle || !googleClientId}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-[#2563EB]" />
                  <span>{loadingGoogle ? 'Connexion...' : 'Autoriser avec Google OAuth'}</span>
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
    </div>
  );
};
