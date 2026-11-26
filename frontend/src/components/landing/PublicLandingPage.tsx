import React, { useState } from 'react';
import { 
  Building2, 
  Stethoscope, 
  Scale, 
  Mail, 
  Calendar, 
  Bot, 
  ShieldCheck, 
  CheckCircle2, 
  ArrowRight, 
  Zap, 
  Users, 
  HelpCircle,
  ExternalLink,
  ChevronDown,
  Sparkles,
  Lock,
  MessageSquare,
  Clock,
  Phone,
  Check,
  Coffee,
  Globe
} from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore';

interface PublicLandingPageProps {
  onEnterApp: () => void;
  onOpenOnboarding: () => void;
  onOpenAuth?: (mode: 'LOGIN' | 'REGISTER') => void;
  onOpenPatientPortal?: () => void;
}

export const PublicLandingPage: React.FC<PublicLandingPageProps> = ({ 
  onEnterApp, 
  onOpenOnboarding, 
  onOpenAuth, 
  onOpenPatientPortal 
}) => {
  const { setSector } = useAppStore();
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const toggleFaq = (idx: number) => {
    setOpenFaq(openFaq === idx ? null : idx);
  };

  const handleSelectMedical = () => {
    setSector('MEDICAL');
    onOpenOnboarding();
  };

  const handleSelectLegal = () => {
    setSector('LEGAL');
    onOpenOnboarding();
  };

  return (
    <div className="min-h-screen bg-[#F7F9FC] text-[#14213D] flex flex-col font-sans selection:bg-blue-100 selection:text-blue-900">
      {/* 01. HEADER */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#E8EDF4]">
        <div className="max-w-7xl mx-auto px-6 h-18 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="w-10 h-10 rounded-2xl bg-[#2563EB] flex items-center justify-center text-white shadow-md shadow-blue-600/20">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xl font-black tracking-tight text-[#14213D]">
                MediLaw<span className="text-[#2563EB]">AI</span>
              </span>
              <span className="block text-[10px] font-bold text-slate-400 -mt-0.5">
                Secrétariat Intelligent 24h/24
              </span>
            </div>
          </div>

          {/* Navigation Principale */}
          <nav className="hidden lg:flex items-center gap-8 text-xs font-semibold text-slate-600">
            <a href="#features" className="hover:text-[#2563EB] transition-colors">Fonctionnalités</a>
            <a href="#solutions" className="hover:text-[#2563EB] transition-colors">Solutions métiers</a>
            <a href="#how-it-works" className="hover:text-[#2563EB] transition-colors">Comment ça marche</a>
            <a href="#pricing" className="hover:text-[#2563EB] transition-colors">Tarifs</a>
            <a href="#faq" className="hover:text-[#2563EB] transition-colors">FAQ</a>
          </nav>

          {/* Boutons à droite */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={onOpenPatientPortal}
              className="hidden sm:inline-flex text-xs font-bold text-emerald-700 hover:text-emerald-800 px-3.5 py-2 rounded-xl transition-colors"
            >
              Prendre rendez-vous
            </button>
            <button
              onClick={() => onOpenAuth?.('LOGIN')}
              className="text-xs font-bold text-slate-700 hover:text-[#2563EB] px-3.5 py-2 rounded-xl transition-colors"
            >
              Connexion Professionnel
            </button>

            <button
              onClick={onOpenOnboarding}
              className="text-xs font-bold text-white bg-[#2563EB] hover:bg-blue-700 active:scale-[0.98] px-4 py-2.5 rounded-xl shadow-md shadow-blue-600/20 transition-all flex items-center gap-1.5"
            >
              <span>Créer mon cabinet</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* 02. HERO SECTION */}
      <section className="pt-16 pb-16 px-6 relative overflow-hidden bg-gradient-to-b from-white via-[#F7F9FC] to-[#F7F9FC]">
        <div className="max-w-5xl mx-auto text-center space-y-6">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-[#14213D] tracking-tight leading-[1.12]">
            Votre secrétariat. Plus intelligent. <br />
            <span className="text-[#2563EB]">Disponible 24h/24.</span>
          </h1>

          <p className="text-base sm:text-lg text-slate-600 max-w-3xl mx-auto leading-relaxed">
            MediLawAI automatise la gestion de vos e-mails, simplifie la prise de rendez-vous et accompagne votre secrétariat grâce à l'intelligence artificielle.
          </p>

          <p className="text-sm font-semibold text-slate-700">
            Concentrez-vous sur votre métier. Nous simplifions votre gestion quotidienne.
          </p>

          {/* Boutons CTA */}
          <div className="flex flex-wrap items-center justify-center gap-3.5 pt-2">
            <button
              onClick={onOpenOnboarding}
              className="px-6 py-3.5 bg-[#2563EB] hover:bg-blue-700 active:scale-[0.98] text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-600/25 transition-all flex items-center gap-2"
            >
              <span>Créer mon cabinet</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={onOpenPatientPortal}
              className="px-6 py-3.5 bg-white hover:bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-xs font-bold shadow-xs transition-all flex items-center gap-2"
            >
              <span>Je suis patient : prendre rendez-vous</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Éléments de confiance */}
          <div className="pt-8 border-t border-slate-200/60 max-w-4xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-4 text-left">
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span className="text-xs text-slate-600 leading-snug">Validation humaine des réponses sensibles</span>
            </div>
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span className="text-xs text-slate-600 leading-snug">Synchronisation Google Calendar</span>
            </div>
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span className="text-xs text-slate-600 leading-snug">Automatisation WhatsApp 24h</span>
            </div>
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span className="text-xs text-slate-600 leading-snug">Protection des données et contrôle des accès</span>
            </div>
          </div>
        </div>

        {/* APERÇU DE LA PLATEFORME (Véritable Dashboard) */}
        <div className="max-w-6xl mx-auto mt-14">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-black text-[#14213D] tracking-tight">
              Tout votre secrétariat dans une seule interface.
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Vue synthétique du véritable espace de travail médical et de secrétariat
            </p>
          </div>

          <div className="bg-white rounded-3xl border border-[#E8EDF4] shadow-xl shadow-slate-200/50 p-6 space-y-6">
            {/* Top metrics bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-[#F7F9FC] rounded-2xl border border-[#E8EDF4]">
                <div className="text-[11px] font-semibold text-slate-500">Rendez-vous du jour</div>
                <div className="text-xl font-black text-[#14213D] mt-1">6 consultations</div>
                <div className="text-[10px] text-emerald-600 font-bold mt-1">✓ Google Calendar synchronisé</div>
              </div>

              <div className="p-4 bg-[#F7F9FC] rounded-2xl border border-[#E8EDF4]">
                <div className="text-[11px] font-semibold text-slate-500">Nouveaux e-mails</div>
                <div className="text-xl font-black text-[#14213D] mt-1">3 reçus</div>
                <div className="text-[10px] text-blue-600 font-bold mt-1">Classification NLP active</div>
              </div>

              <div className="p-4 bg-[#F7F9FC] rounded-2xl border border-[#E8EDF4]">
                <div className="text-[11px] font-semibold text-slate-500">Demandes en attente</div>
                <div className="text-xl font-black text-[#14213D] mt-1">2 à valider</div>
                <div className="text-[10px] text-amber-600 font-bold mt-1">Supervision humaine requise</div>
              </div>

              <div className="p-4 bg-[#F7F9FC] rounded-2xl border border-[#E8EDF4]">
                <div className="text-[11px] font-semibold text-slate-500">Disponibilités & Pauses</div>
                <div className="text-xl font-black text-[#14213D] mt-1">08:30 - 17:30</div>
                <div className="text-[10px] text-slate-600 font-semibold mt-1">Pause Déjeuner 12:30 - 14:00</div>
              </div>
            </div>

            {/* Simulated Live Workspace modules */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2 text-xs">
              {/* Module 1: Prochains Rendez-vous */}
              <div className="p-4 bg-[#F7F9FC] rounded-2xl border border-[#E8EDF4] space-y-3">
                <div className="flex items-center justify-between font-bold text-slate-800">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-[#2563EB]" /> Planning du Jour
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">Mardi 03 Nov</span>
                </div>

                <div className="space-y-2">
                  <div className="p-2.5 bg-white rounded-xl border border-slate-200 flex justify-between items-center">
                    <div>
                      <div className="font-bold text-slate-800">Amine Jaziri</div>
                      <div className="text-[10px] text-slate-500">Cardiologie & ECG</div>
                    </div>
                    <span className="font-mono font-bold text-blue-600 text-[11px]">10:00</span>
                  </div>

                  <div className="p-2.5 bg-white rounded-xl border border-slate-200 flex justify-between items-center">
                    <div>
                      <div className="font-bold text-slate-800">Karim Bouazizi</div>
                      <div className="text-[10px] text-slate-500">Suivi tensionnel</div>
                    </div>
                    <span className="font-mono font-bold text-blue-600 text-[11px]">11:30</span>
                  </div>

                  <div className="p-2 bg-amber-50 rounded-xl border border-amber-200/80 text-amber-900 flex items-center justify-center gap-1.5 text-[11px] font-semibold">
                    <Coffee className="w-3.5 h-3.5 text-amber-600" />
                    <span>12:30 - 14:00 • Pause Déjeuner Protégée</span>
                  </div>
                </div>
              </div>

              {/* Module 2: E-mails IA en attente */}
              <div className="p-4 bg-[#F7F9FC] rounded-2xl border border-[#E8EDF4] space-y-3">
                <div className="flex items-center justify-between font-bold text-slate-800">
                  <span className="flex items-center gap-1.5">
                    <Mail className="w-4 h-4 text-[#2563EB]" /> Gestion E-mails IA
                  </span>
                  <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-bold">Brouillons prêts</span>
                </div>

                <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1.5">
                  <div className="font-bold text-slate-800">Sami Chaabane</div>
                  <div className="text-[11px] text-slate-600">« Demande de certificat médical pour sport »</div>
                  <div className="p-2 bg-blue-50/60 rounded-lg text-[10px] text-blue-900 italic border border-blue-100">
                    IA : « Réponse préparée selon le modèle légal du cabinet, en attente de signature... »
                  </div>
                </div>

                <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1.5">
                  <div className="font-bold text-slate-800">Mona Karray</div>
                  <div className="text-[11px] text-slate-600">« Douleur thoracique ce matin »</div>
                  <span className="inline-block text-[9px] font-bold bg-rose-50 text-rose-700 px-2 py-0.5 rounded-full border border-rose-200">
                    Alerte SAMU 190 générée
                  </span>
                </div>
              </div>

              {/* Module 3: Assistant IA & Notifications */}
              <div className="p-4 bg-[#F7F9FC] rounded-2xl border border-[#E8EDF4] space-y-3">
                <div className="flex items-center justify-between font-bold text-slate-800">
                  <span className="flex items-center gap-1.5">
                    <Bot className="w-4 h-4 text-[#2563EB]" /> Copilote Cabinet IA
                  </span>
                  <span className="text-[10px] text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full font-bold">Actif 24/7</span>
                </div>

                <div className="p-3 bg-purple-50/50 rounded-xl border border-purple-100 space-y-1.5">
                  <div className="text-[11px] font-bold text-purple-900">Synthèse du Secrétariat</div>
                  <p className="text-[10px] text-purple-800 leading-relaxed">
                    2 rappels WhatsApp ont été expédiés ce matin à 08h00. Vos créneaux de jeudi après-midi sont synchronisés avec Google Calendar.
                  </p>
                </div>

                <div className="flex items-center justify-between text-[11px] pt-1">
                  <span className="text-slate-500">Protection Anti-Double Réservation</span>
                  <span className="font-bold text-emerald-600">Vérifiée</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 03. FONCTIONNALITÉS */}
      <section id="features" className="py-20 px-6 bg-white border-t border-[#E8EDF4]">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs font-bold text-[#2563EB] uppercase tracking-wider">Fonctionnalités</span>
            <h2 className="text-3xl sm:text-4xl font-black text-[#14213D] tracking-tight">
              Un secrétariat intelligent qui travaille avec vous.
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
              Une automatisation fine conçue pour respecter les usages professionnels, sans jamais vous déposséder du contrôle.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* 01 */}
            <div className="p-6 rounded-2xl border border-[#E8EDF4] bg-[#F7F9FC] space-y-3 hover:border-blue-300 transition-colors">
              <span className="text-xs font-mono font-bold text-[#2563EB]">01</span>
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-[#2563EB] flex items-center justify-center font-bold">
                <Mail className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-[#14213D]">Gestion intelligente des e-mails</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                L'IA analyse, classe et prépare les réponses aux demandes reçues selon vos modèles certifiés.
              </p>
            </div>

            {/* 02 */}
            <div className="p-6 rounded-2xl border border-[#E8EDF4] bg-[#F7F9FC] space-y-3 hover:border-blue-300 transition-colors">
              <span className="text-xs font-mono font-bold text-[#2563EB]">02</span>
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-[#2563EB] flex items-center justify-center font-bold">
                <Calendar className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-[#14213D]">Gestion des rendez-vous</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Consultez les disponibilités, gérez votre calendrier et évitez les doubles réservations en direct.
              </p>
            </div>

            {/* 03 */}
            <div className="p-6 rounded-2xl border border-[#E8EDF4] bg-[#F7F9FC] space-y-3 hover:border-blue-300 transition-colors">
              <span className="text-xs font-mono font-bold text-[#2563EB]">03</span>
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-[#2563EB] flex items-center justify-center font-bold">
                <Globe className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-[#14213D]">Réservation en ligne</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Permettez à vos patients ou clients de consulter les créneaux disponibles et de réserver facilement.
              </p>
            </div>

            {/* 04 */}
            <div className="p-6 rounded-2xl border border-[#E8EDF4] bg-[#F7F9FC] space-y-3 hover:border-blue-300 transition-colors">
              <span className="text-xs font-mono font-bold text-[#2563EB]">04</span>
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-[#2563EB] flex items-center justify-center font-bold">
                <MessageSquare className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-[#14213D]">Rappels automatiques</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Envoyez des rappels personnalisés par WhatsApp avant les rendez-vous pour réduire le taux d'absentéisme.
              </p>
            </div>

            {/* 05 */}
            <div className="p-6 rounded-2xl border border-[#E8EDF4] bg-[#F7F9FC] space-y-3 hover:border-blue-300 transition-colors">
              <span className="text-xs font-mono font-bold text-[#2563EB]">05</span>
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-[#2563EB] flex items-center justify-center font-bold">
                <Bot className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-[#14213D]">Assistant IA</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Accédez rapidement aux informations de votre cabinet grâce à un assistant connecté à vos documents.
              </p>
            </div>

            {/* 06 */}
            <div className="p-6 rounded-2xl border border-[#E8EDF4] bg-[#F7F9FC] space-y-3 hover:border-blue-300 transition-colors">
              <span className="text-xs font-mono font-bold text-[#2563EB]">06</span>
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-[#2563EB] flex items-center justify-center font-bold">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-[#14213D]">Validation humaine</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Gardez le contrôle : les réponses sensibles nécessitent une validation professionnelle avant leur envoi.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 04. SOLUTIONS MÉTIERS */}
      <section id="solutions" className="py-20 px-6 bg-[#F7F9FC] border-t border-[#E8EDF4]">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs font-bold text-[#2563EB] uppercase tracking-wider">Solutions Métiers</span>
            <h2 className="text-3xl sm:text-4xl font-black text-[#14213D] tracking-tight">
              Une solution adaptée à votre profession.
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Deux environnements spécialisés pour répondre aux exigences déontologiques de chaque pratique.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Carte Médicale */}
            <div className="bg-white rounded-3xl border border-[#E8EDF4] p-8 space-y-6 shadow-xs flex flex-col justify-between">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-100 text-[#2563EB] flex items-center justify-center font-bold">
                  <Stethoscope className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-[#14213D]">Cabinets Médicaux & Dentaires</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Simplifiez la gestion de votre cabinet et améliorez l'expérience de vos patients.
                  </p>
                </div>

                <div className="space-y-2.5 pt-2">
                  {[
                    "Gestion des patients.",
                    "Réservation médicale en ligne.",
                    "Gestion des disponibilités.",
                    "Rappels de consultation.",
                    "Gestion des e-mails.",
                    "Assistant IA administratif."
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-2.5 text-xs text-slate-700 font-medium">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={handleSelectMedical}
                className="w-full py-3 bg-[#2563EB] hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center justify-center gap-2"
              >
                <span>Découvrir la solution médicale</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Carte Juridique */}
            <div className="bg-white rounded-3xl border border-[#E8EDF4] p-8 space-y-6 shadow-xs flex flex-col justify-between">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                  <Scale className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-[#14213D]">Cabinets Juridiques & Avocats</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Optimisez la gestion administrative et les communications avec vos clients.
                  </p>
                </div>

                <div className="space-y-2.5 pt-2">
                  {[
                    "Gestion des demandes clients.",
                    "Prise de rendez-vous.",
                    "Gestion des consultations.",
                    "Rappels automatiques.",
                    "Gestion des e-mails.",
                    "Assistant documentaire juridique."
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-2.5 text-xs text-slate-700 font-medium">
                      <Check className="w-4 h-4 text-purple-600 shrink-0" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={handleSelectLegal}
                className="w-full py-3 bg-[#14213D] hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center justify-center gap-2"
              >
                <span>Découvrir la solution juridique</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 05. COMMENT ÇA MARCHE ? */}
      <section id="how-it-works" className="py-20 px-6 bg-white border-t border-[#E8EDF4]">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs font-bold text-[#2563EB] uppercase tracking-wider">Parcours Simple</span>
            <h2 className="text-3xl sm:text-4xl font-black text-[#14213D] tracking-tight">
              Votre cabinet opérationnel en quelques étapes.
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Une mise en route guidée en 5 étapes simples, sans compétences techniques requises.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {[
              { num: '01', title: 'Créez votre espace professionnel', desc: 'Inscription rapide et sélection de votre spécialité.' },
              { num: '02', title: 'Configurez vos informations', desc: 'Définissez vos horaires d’ouverture et pauses déjeuner.' },
              { num: '03', title: 'Connectez vos outils', desc: 'Gmail, Google Calendar et WhatsApp en un clic.' },
              { num: '04', title: 'Laissez l’IA organiser', desc: 'Tri automatique des demandes et brouillons rédigés.' },
              { num: '05', title: 'Validez et pilotez', desc: 'Approuvez les réponses et gérez votre planning.' }
            ].map((step, idx) => (
              <div key={idx} className="p-5 rounded-2xl border border-[#E8EDF4] bg-[#F7F9FC] space-y-2">
                <span className="text-xs font-mono font-black text-[#2563EB]">{step.num}</span>
                <h3 className="font-bold text-xs text-[#14213D]">{step.title}</h3>
                <p className="text-[11px] text-slate-500 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 06. AUTOMATISATION & INTELLIGENCE ARTIFICIELLE */}
      <section className="py-20 px-6 bg-[#F7F9FC] border-t border-[#E8EDF4]">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs font-bold text-[#2563EB] uppercase tracking-wider">Écosystème Connecté</span>
            <h2 className="text-3xl sm:text-4xl font-black text-[#14213D] tracking-tight">
              Toutes vos tâches connectées dans un seul écosystème.
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Une synergie fluide entre vos outils quotidiens et les moteurs d'intelligence artificielle.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 text-center">
            <div className="p-5 bg-white rounded-2xl border border-[#E8EDF4] shadow-2xs space-y-2">
              <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center mx-auto">
                <Mail className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-xs text-[#14213D]">Gmail</h3>
              <p className="text-[11px] text-slate-500">Réception et traitement sécurisé des e-mails</p>
            </div>

            <div className="p-5 bg-white rounded-2xl border border-[#E8EDF4] shadow-2xs space-y-2">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center mx-auto">
                <Bot className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-xs text-[#14213D]">Intelligence Artificielle</h3>
              <p className="text-[11px] text-slate-500">Classification NLP & génération de réponses</p>
            </div>

            <div className="p-5 bg-white rounded-2xl border border-[#E8EDF4] shadow-2xs space-y-2">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#2563EB] flex items-center justify-center mx-auto">
                <Calendar className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-xs text-[#14213D]">Google Calendar</h3>
              <p className="text-[11px] text-slate-500">Synchronisation des rendez-vous en direct</p>
            </div>

            <div className="p-5 bg-white rounded-2xl border border-[#E8EDF4] shadow-2xs space-y-2">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                <MessageSquare className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-xs text-[#14213D]">WhatsApp</h3>
              <p className="text-[11px] text-slate-500">Rappels de RDV automatiques avant 24h</p>
            </div>

            <div className="p-5 bg-white rounded-2xl border border-[#E8EDF4] shadow-2xs space-y-2">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center mx-auto">
                <Zap className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-xs text-[#14213D]">n8n Workflows</h3>
              <p className="text-[11px] text-slate-500">Orchestration des flux automatisés</p>
            </div>
          </div>
        </div>
      </section>

      {/* 07. SÉCURITÉ & CONFIDENTIALITÉ */}
      <section className="py-20 px-6 bg-white border-t border-[#E8EDF4]">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs font-bold text-[#2563EB] uppercase tracking-wider">Sécurité</span>
            <h2 className="text-3xl sm:text-4xl font-black text-[#14213D] tracking-tight">
              Votre confiance est notre priorité.
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Des fondations techniques rigoureuses pour préserver le secret professionnel et l'intégrité de vos dossiers.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="p-5 rounded-2xl border border-[#E8EDF4] bg-[#F7F9FC] space-y-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <h3 className="font-bold text-xs text-[#14213D]">Contrôle des accès par rôle</h3>
              <p className="text-[11px] text-slate-500">Séparation stricte des privilèges praticien, secrétariat et administrateur.</p>
            </div>

            <div className="p-5 rounded-2xl border border-[#E8EDF4] bg-[#F7F9FC] space-y-2">
              <Lock className="w-5 h-5 text-emerald-600" />
              <h3 className="font-bold text-xs text-[#14213D]">Protection des informations sensibles</h3>
              <p className="text-[11px] text-slate-500">Chiffrement AES-256 au repos et protocoles TLS 1.3 en transit.</p>
            </div>

            <div className="p-5 rounded-2xl border border-[#E8EDF4] bg-[#F7F9FC] space-y-2">
              <Clock className="w-5 h-5 text-emerald-600" />
              <h3 className="font-bold text-xs text-[#14213D]">Journalisation des actions</h3>
              <p className="text-[11px] text-slate-500">Traçabilité complète de chaque validation et modification de dossier.</p>
            </div>

            <div className="p-5 rounded-2xl border border-[#E8EDF4] bg-[#F7F9FC] space-y-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <h3 className="font-bold text-xs text-[#14213D]">Validation humaine des réponses sensibles</h3>
              <p className="text-[11px] text-slate-500">Supervision humaine obligatoire avant tout envoi médical ou juridique officiel.</p>
            </div>

            <div className="p-5 rounded-2xl border border-[#E8EDF4] bg-[#F7F9FC] space-y-2">
              <Zap className="w-5 h-5 text-emerald-600" />
              <h3 className="font-bold text-xs text-[#14213D]">Sauvegardes et supervision</h3>
              <p className="text-[11px] text-slate-500">Snapshots automatisés réguliers et monitoring de disponibilité en temps réel.</p>
            </div>

            <div className="p-5 rounded-2xl border border-[#E8EDF4] bg-[#F7F9FC] space-y-2">
              <Building2 className="w-5 h-5 text-emerald-600" />
              <h3 className="font-bold text-xs text-[#14213D]">Isolation des données des cabinets</h3>
              <p className="text-[11px] text-slate-500">Architecture multi-tenant avec cloisonnement étanche entre structures.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 08. TARIFICATION */}
      <section id="pricing" className="py-20 px-6 bg-[#F7F9FC] border-t border-[#E8EDF4]">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs font-bold text-[#2563EB] uppercase tracking-wider">Tarification Transparente</span>
            <h2 className="text-3xl sm:text-4xl font-black text-[#14213D] tracking-tight">
              Une formule adaptée à votre cabinet.
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Des tarifs clairs en Dinars Tunisiens (TND), sans frais d’installation cachés.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Starter */}
            <div className="bg-white rounded-3xl border border-[#E8EDF4] p-8 space-y-6 shadow-xs flex flex-col justify-between">
              <div className="space-y-4">
                <span className="text-xs font-bold text-slate-500 uppercase">Starter</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black text-[#14213D]">89 TND</span>
                  <span className="text-xs text-slate-500">/ mois</span>
                </div>
                <p className="text-xs text-slate-500">Pour les professionnels indépendants.</p>

                <div className="space-y-2.5 pt-4 border-t border-slate-100 text-xs text-slate-700">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>1 praticien titulaire</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Jusqu’à 300 e-mails traités / mois</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Synchronisation Google Calendar</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Réservation en ligne pour les patients</span>
                  </div>
                </div>
              </div>

              <button
                onClick={onOpenOnboarding}
                className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-colors"
              >
                Choisir Starter
              </button>
            </div>

            {/* Professionnel */}
            <div className="bg-white rounded-3xl border-2 border-[#2563EB] p-8 space-y-6 shadow-md shadow-blue-600/10 flex flex-col justify-between relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#2563EB] text-white px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase">
                Recommandé
              </div>

              <div className="space-y-4">
                <span className="text-xs font-bold text-[#2563EB] uppercase">Professionnel</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black text-[#14213D]">189 TND</span>
                  <span className="text-xs text-slate-500">/ mois</span>
                </div>
                <p className="text-xs text-slate-500">Pour les cabinets qui souhaitent automatiser leur secrétariat.</p>

                <div className="space-y-2.5 pt-4 border-t border-slate-100 text-xs text-slate-700">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#2563EB] shrink-0" />
                    <span>Jusqu’à 3 praticiens + accès secrétariat</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#2563EB] shrink-0" />
                    <span>Tri e-mails & classification NLP illimités</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#2563EB] shrink-0" />
                    <span>Rappels automatiques WhatsApp 24h</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#2563EB] shrink-0" />
                    <span>Copilote IA connecté à vos documents</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#2563EB] shrink-0" />
                    <span>Gestion des pauses & congés avancée</span>
                  </div>
                </div>
              </div>

              <button
                onClick={onOpenOnboarding}
                className="w-full py-3 bg-[#2563EB] hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
              >
                Choisir Professionnel
              </button>
            </div>

            {/* Entreprise */}
            <div className="bg-white rounded-3xl border border-[#E8EDF4] p-8 space-y-6 shadow-xs flex flex-col justify-between">
              <div className="space-y-4">
                <span className="text-xs font-bold text-slate-500 uppercase">Entreprise</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black text-[#14213D]">Sur devis</span>
                </div>
                <p className="text-xs text-slate-500">Pour les structures multi-praticiens et multi-sites.</p>

                <div className="space-y-2.5 pt-4 border-t border-slate-100 text-xs text-slate-700">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Nombre illimité de praticiens & sites</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Accompagnement et formation de l'équipe</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Serveur dédié / Hébergement sur-mesure</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Support prioritaire dédié 7j/7</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => window.location.href = 'mailto:contact@medilawai.tn?subject=Demande Devis Entreprise'}
                className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-colors"
              >
                Contacter l'équipe
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 09. FAQ (8 Questions exactes) */}
      <section id="faq" className="py-20 px-6 bg-white border-t border-[#E8EDF4]">
        <div className="max-w-4xl mx-auto space-y-12">
          <div className="text-center space-y-3">
            <span className="text-xs font-bold text-[#2563EB] uppercase tracking-wider">FAQ</span>
            <h2 className="text-3xl font-black text-[#14213D] tracking-tight">Questions Fréquentes</h2>
            <p className="text-xs sm:text-sm text-slate-500">Tout ce que vous devez savoir pour démarrer sereinement.</p>
          </div>

          <div className="space-y-3">
            {[
              {
                q: "Comment fonctionne MediLawAI ?",
                a: "MediLawAI se connecte de façon sécurisée à vos e-mails professionnels et à votre agenda Google Calendar. Notre modèle d'IA analyse les demandes entrantes, prépare des brouillons de réponses adaptés et permet la réservation directe de créneaux en évitant tout double rendez-vous."
              },
              {
                q: "Est-ce que je peux connecter mon Gmail ?",
                a: "Oui, la synchronisation avec Gmail s'effectue via des protocoles officiels OAuth2 sécurisés. Vous pouvez à tout moment activer ou suspendre l'accès depuis vos paramètres."
              },
              {
                q: "Comment fonctionne la réservation en ligne ?",
                a: "Vos patients ou clients accèdent à votre portail dédié pour visualiser les créneaux réellement disponibles selon vos horaires de travail et votre pause déjeuner. Une fois le créneau réservé, il s'inscrit immédiatement dans votre Google Calendar."
              },
              {
                q: "Les patients peuvent-ils choisir leurs horaires ?",
                a: "Oui, les patients sélectionnent uniquement parmi les créneaux ouverts que vous avez validés. Les périodes de pause déjeuner, congés et rendez-vous déjà pris sont automatiquement verrouillés."
              },
              {
                q: "Est-ce que je peux utiliser WhatsApp ?",
                a: "Oui, l'intégration WhatsApp permet d'envoyer des rappels automatiques et personnalisés aux patients ou clients 24 heures avant leur consultation afin de limiter les oublis."
              },
              {
                q: "Puis-je inviter un secrétaire ?",
                a: "Absolument. Vous pouvez attribuer un compte dédié avec le rôle 'Secrétaire' pour gérer le planning, modifier les fiches de patients et valider les e-mails en collaboration avec le praticien."
              },
              {
                q: "Mes données sont-elles protégées ?",
                a: "La confidentialité est au cœur de MediLawAI : chaque cabinet dispose d'une base de données cloisonnée, les transferts sont chiffrés en TLS 1.3 et aucune réponse sensible n'est transmise sans validation humaine."
              },
              {
                q: "Puis-je annuler mon abonnement ?",
                a: "Oui, les abonnements sont sans engagement de durée obligatoire. Vous pouvez résilier en un clic depuis votre espace d'administration à la fin de chaque période mensuelle."
              }
            ].map((faq, idx) => (
              <div
                key={idx}
                className="rounded-2xl border border-[#E8EDF4] bg-[#F7F9FC] overflow-hidden transition-colors"
              >
                <button
                  onClick={() => toggleFaq(idx)}
                  className="w-full p-4.5 text-left flex items-center justify-between text-xs font-bold text-[#14213D] hover:text-[#2563EB]"
                >
                  <span>{faq.q}</span>
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${openFaq === idx ? 'rotate-180 text-[#2563EB]' : ''}`} />
                </button>
                {openFaq === idx && (
                  <div className="px-4.5 pb-4.5 text-xs text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 10. FOOTER */}
      <footer className="bg-[#14213D] text-white pt-16 pb-12 px-6 border-t border-slate-800">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-10 text-xs">
          {/* Col 1 : Identité */}
          <div className="space-y-3 md:col-span-1">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#2563EB] flex items-center justify-center text-white font-bold">
                <Bot className="w-4 h-4" />
              </div>
              <span className="text-lg font-black tracking-tight text-white">MediLawAI</span>
            </div>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              Votre secrétariat intelligent au service des professionnels de santé et du droit.
            </p>
          </div>

          {/* Col 2 : Produit */}
          <div className="space-y-2.5">
            <span className="font-bold text-slate-200 uppercase tracking-wider text-[11px]">Produit</span>
            <ul className="space-y-2 text-slate-400 text-[11px]">
              <li><a href="#features" className="hover:text-white transition-colors">Fonctionnalités</a></li>
              <li><a href="#solutions" className="hover:text-white transition-colors">Solutions</a></li>
              <li><a href="#pricing" className="hover:text-white transition-colors">Tarifs</a></li>
              <li><a href="#faq" className="hover:text-white transition-colors">FAQ</a></li>
            </ul>
          </div>

          {/* Col 3 : Accès rapides */}
          <div className="space-y-2.5">
            <span className="font-bold text-slate-200 uppercase tracking-wider text-[11px]">Accès</span>
            <ul className="space-y-2 text-slate-400 text-[11px]">
              <li><button onClick={() => onOpenAuth && onOpenAuth('LOGIN')} className="hover:text-white transition-colors text-left">Espace Professionnel</button></li>
              <li><button onClick={onOpenOnboarding} className="hover:text-white transition-colors text-left">Créer mon cabinet</button></li>
            </ul>
          </div>

          {/* Col 4 : Informations & Contact */}
          <div className="space-y-2.5">
            <span className="font-bold text-slate-200 uppercase tracking-wider text-[11px]">Informations</span>
            <ul className="space-y-2 text-slate-400 text-[11px]">
              <li><span>Confidentialité & Sécurité</span></li>
              <li><span>Conditions d'utilisation</span></li>
              <li>
                <a href="mailto:contact@medilawai.tn" className="text-blue-400 hover:underline">
                  contact@medilawai.tn
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="max-w-7xl mx-auto mt-12 pt-6 border-t border-slate-800 text-[11px] text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span>© 2026 MediLawAI. Tous droits réservés.</span>
          <span>Plateforme SaaS pour professionnels médicaux et juridiques en Tunisie.</span>
        </div>
      </footer>
    </div>
  );
};
