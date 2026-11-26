import React, { useState } from 'react';
import { 
  X, 
  Lock, 
  Mail, 
  User, 
  Building2, 
  Stethoscope, 
  Scale, 
  ArrowRight, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle,
  Sparkles,
  RefreshCw,
  KeyRound
} from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore';
import { DEMO_MODE, SERVER_LABEL } from '../../services/apiClient';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialMode?: 'LOGIN' | 'REGISTER';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialMode = 'LOGIN'
}) => {
  const [mode, setMode] = useState<'LOGIN' | 'REGISTER'>(initialMode);
  const { login, register, showToast, isBackendConnected, backendUrl } = useAppStore();

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register form state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regClinicName, setRegClinicName] = useState('');
  const [regSector, setRegSector] = useState<'MEDICAL' | 'LEGAL'>('MEDICAL');

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleQuickDemo = (role: 'DOCTOR' | 'LAWYER' | 'ADMIN' | 'PATIENT') => {
    setMode('LOGIN');
    setErrorMessage(null);
    // Comptes de démonstration créés par le seed (backend/src/config/seed.js)
    if (role === 'DOCTOR') {
      setLoginEmail('dr.bensalem@cabinet-ai.tn');
    } else if (role === 'LAWYER') {
      setLoginEmail('dr.nadia@cabinet-ai.tn');
    } else if (role === 'ADMIN') {
      setLoginEmail('admin@medilaw.ai');
    } else {
      setLoginEmail('patient@medilaw.ai');
    }
    setLoginPassword('Password123!');
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);

    const res = await login({ email: loginEmail, password: loginPassword });
    setLoading(false);

    if (res.success) {
      showToast({
        title: 'Connexion réussie !',
        message: 'Bienvenue dans votre espace sécurisé MediLawAI.',
        type: 'success'
      });
      onSuccess();
      onClose();
    } else {
      setErrorMessage(res.error || 'Identifiants invalides');
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName || !regEmail || !regPassword) {
      setErrorMessage('Veuillez remplir tous les champs obligatoires.');
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    const res = await register({
      name: regName,
      email: regEmail,
      password: regPassword,
      clinicName: regClinicName || (regSector === 'MEDICAL' ? 'Cabinet Médical' : 'Cabinet Juridique'),
      clinicType: regSector
    });
    setLoading(false);

    if (res.success) {
      showToast({
        title: 'Compte cabinet créé avec succès !',
        message: 'Votre espace de travail est prêt à l’emploi.',
        type: 'success'
      });
      onSuccess();
      onClose();
    } else {
      setErrorMessage(res.error || 'Erreur lors de l’inscription');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header Modal */}
        <div className="relative bg-gradient-to-r from-[#14213D] to-[#1F3158] p-6 text-white shrink-0">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <h2 className="text-xl font-black tracking-tight">
            {mode === 'LOGIN' ? 'Connexion Espace Professionnel' : 'Créer un Compte Cabinet'}
          </h2>
          <p className="text-xs text-slate-300 mt-1">
            {mode === 'LOGIN' 
              ? 'Accédez à votre secrétariat intelligent et à la gestion de vos consultations.' 
              : 'Démarrez l’automatisation de vos e-mails et rendez-vous en 2 minutes.'}
          </p>

          {/* Mode Switch Tabs */}
          <div className="flex bg-white/10 p-1 rounded-xl mt-4">
            <button
              onClick={() => { setMode('LOGIN'); setErrorMessage(null); }}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                mode === 'LOGIN' ? 'bg-white text-[#14213D] shadow-xs' : 'text-white/80 hover:text-white'
              }`}
            >
              Se Connecter
            </button>
            <button
              onClick={() => { setMode('REGISTER'); setErrorMessage(null); }}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                mode === 'REGISTER' ? 'bg-white text-[#14213D] shadow-xs' : 'text-white/80 hover:text-white'
              }`}
            >
              Créer un Compte
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Quick Demo Credentials shortcuts for testing */}
          {mode === 'LOGIN' && DEMO_MODE && (
            <div className="p-3.5 bg-blue-50/70 rounded-2xl border border-blue-100 space-y-2">
              <div className="flex items-center justify-between text-[11px] font-bold text-blue-900">
                <span className="flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-blue-600" /> Profils de Démonstration Rapide :
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickDemo('DOCTOR')}
                  className="px-2.5 py-2 bg-white hover:bg-blue-100/60 border border-blue-200 rounded-xl text-xs font-bold text-slate-800 text-center transition-all flex items-center justify-center gap-1.5 truncate shadow-xs"
                >
                  <Stethoscope className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span className="truncate">Médecin</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickDemo('LAWYER')}
                  className="px-2.5 py-2 bg-white hover:bg-purple-100/60 border border-purple-200 rounded-xl text-xs font-bold text-slate-800 text-center transition-all flex items-center justify-center gap-1.5 truncate shadow-xs"
                >
                  <Scale className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                  <span className="truncate">Avocat</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickDemo('ADMIN')}
                  className="px-2.5 py-2 bg-white hover:bg-rose-100/60 border border-rose-200 rounded-xl text-xs font-bold text-slate-800 text-center transition-all flex items-center justify-center gap-1.5 truncate shadow-xs"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                  <span className="truncate">Super Admin</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickDemo('PATIENT')}
                  className="px-2.5 py-2 bg-white hover:bg-emerald-100/60 border border-emerald-200 rounded-xl text-xs font-bold text-slate-800 text-center transition-all flex items-center justify-center gap-1.5 truncate shadow-xs"
                >
                  <User className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span className="truncate">Patient</span>
                </button>
              </div>
            </div>
          )}

          {/* Error Banner */}
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-rose-700 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Form Content */}
          {mode === 'LOGIN' ? (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Adresse E-mail Professionnelle
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="vous@votre-cabinet.tn"
                    autoComplete="email"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700">
                    Mot de passe
                  </label>
                  <span className="text-[10px] text-blue-600 font-semibold cursor-pointer hover:underline">
                    Mot de passe oublié ?
                  </span>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-600 pt-1">
                <label className="flex items-center gap-2 cursor-pointer font-medium">
                  <input type="checkbox" defaultChecked className="rounded text-blue-600 focus:ring-blue-500" />
                  <span>Maintenir ma session active</span>
                </label>
                <span className="text-[10px] font-bold text-slate-400">Chiffrement AES-256</span>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 transition-all disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Vérification auprès du serveur...</span>
                  </>
                ) : (
                  <>
                    <span>Accéder à mon Espace Pro</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              {/* Sector selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Secteur d'activité du Cabinet
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setRegSector('MEDICAL')}
                    className={`p-3 rounded-xl border text-left flex items-center gap-2.5 transition-all ${
                      regSector === 'MEDICAL'
                        ? 'border-blue-600 bg-blue-50/70 text-blue-900 font-bold'
                        : 'border-slate-200 bg-slate-50 text-slate-600 font-semibold hover:bg-slate-100'
                    }`}
                  >
                    <Stethoscope className={`w-4 h-4 ${regSector === 'MEDICAL' ? 'text-blue-600' : 'text-slate-400'}`} />
                    <span className="text-xs">Cabinet Médical</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRegSector('LEGAL')}
                    className={`p-3 rounded-xl border text-left flex items-center gap-2.5 transition-all ${
                      regSector === 'LEGAL'
                        ? 'border-purple-600 bg-purple-50/70 text-purple-900 font-bold'
                        : 'border-slate-200 bg-slate-50 text-slate-600 font-semibold hover:bg-slate-100'
                    }`}
                  >
                    <Scale className={`w-4 h-4 ${regSector === 'LEGAL' ? 'text-purple-600' : 'text-slate-400'}`} />
                    <span className="text-xs">Cabinet Juridique</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nom et Prénom du Praticien / Associé
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="Ex: Dr. Sarah Mansouri"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nom du Cabinet
                </label>
                <div className="relative">
                  <Building2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={regClinicName}
                    onChange={(e) => setRegClinicName(e.target.value)}
                    placeholder={regSector === 'MEDICAL' ? "Cabinet de Pédiatrie Les Berges du Lac" : "Cabinet d'Avocats Mansouri & Associés"}
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  E-mail Professionnel
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="contact@cabinet-mansouri.tn"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Mot de passe sécurisé
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Minimum 8 caractères"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Création du cabinet en cours...</span>
                  </>
                ) : (
                  <>
                    <span>Créer mon Cabinet & Démarrer l’Essai</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Security footnote */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-center gap-2 text-[10px] text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Connexion chiffrée • Serveur <strong className={`font-mono ${isBackendConnected ? 'text-slate-600' : 'text-rose-600'}`}>{isBackendConnected ? SERVER_LABEL : 'injoignable'}</strong></span>
          </div>
        </div>
      </div>
    </div>
  );
};
