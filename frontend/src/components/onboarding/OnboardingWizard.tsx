import React, { useState } from 'react';
import { 
  Building2, 
  Stethoscope, 
  Scale, 
  CheckCircle, 
  ArrowRight, 
  ArrowLeft, 
  Mail, 
  Calendar, 
  MessageSquare, 
  ShieldCheck, 
  Sparkles,
  Clock,
  UserCheck
} from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore';

interface OnboardingWizardProps {
  onComplete: () => void;
  onCancel: () => void;
}

export const OnboardingWizard: React.FC<OnboardingWizardProps> = ({ onComplete, onCancel }) => {
  const { setSector, setOrganizationName, showToast } = useAppStore();
  const [step, setStep] = useState(1);

  // Form State
  const [selectedSector, setSelectedSectorState] = useState<'MEDICAL' | 'LEGAL'>('MEDICAL');
  const [orgName, setOrgName] = useState('Cabinet Dr. Ben Salem');
  const [phone, setPhone] = useState('+216 71 234 567');
  const [city, setCity] = useState('Tunis');
  const [specialty, setSpecialty] = useState('Cardiologie & Médecine Générale');
  const [openingTime, setOpeningTime] = useState('08:30');
  const [closingTime, setClosingTime] = useState('17:30');
  const [connectedGmail, setConnectedGmail] = useState(true);
  const [connectedCalendar, setConnectedCalendar] = useState(true);
  const [connectedWhatsApp, setConnectedWhatsApp] = useState(true);
  const [autonomyMode, setAutonomyMode] = useState<'HUMAN_IN_THE_LOOP' | 'SUGGEST_ONLY' | 'FULL_AUTONOMOUS'>('HUMAN_IN_THE_LOOP');

  const handleFinish = () => {
    setSector(selectedSector);
    setOrganizationName(orgName);
    showToast({
      title: 'Configuration terminée !',
      message: `Votre cabinet ${orgName} est configuré et connecté aux flux d'automatisation.`,
      type: 'success'
    });
    onComplete();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header with progress */}
        <div className="p-6 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Assistant de Configuration</span>
              <h2 className="text-lg font-bold text-slate-900 mt-0.5">Étape {step} sur 5 : {
                step === 1 ? 'Secteur d’activité' :
                step === 2 ? 'Informations du Cabinet' :
                step === 3 ? 'Horaires & Spécialités' :
                step === 4 ? 'Connexions Services (Google, WhatsApp)' :
                'Niveau d’Autonomie de l’IA'
              }</h2>
            </div>
            <button onClick={onCancel} className="text-xs text-slate-400 hover:text-slate-600">Passer</button>
          </div>

          <div className="flex items-center gap-2 mt-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div 
                key={i} 
                className={`h-1.5 flex-1 rounded-full transition-all ${
                  i <= step ? 'bg-blue-600' : 'bg-slate-200'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Step Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          {step === 1 && (
            <div className="space-y-4">
              <p className="text-sm text-slate-600">Choisissez votre domaine professionnel pour adapter le vocabulaire, les modèles IA et les flux légaux ou médicaux.</p>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => { setSelectedSectorState('MEDICAL'); setOrgName('Cabinet Médical Dr. Ben Salem'); setSpecialty('Cardiologie & Médecine Générale'); }}
                  className={`p-5 rounded-xl border text-left flex flex-col items-start gap-3 transition-all ${
                    selectedSector === 'MEDICAL' 
                      ? 'border-blue-600 bg-blue-50/50 shadow-sm ring-2 ring-blue-500/20' 
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="p-2.5 rounded-lg bg-blue-100 text-blue-600">
                    <Stethoscope className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">Cabinet Médical / Dentaire</h3>
                    <p className="text-xs text-slate-500 mt-1">Médecins, spécialistes, cliniques. Priorité urgences vitales (SAMU 190) et CNAM.</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => { setSelectedSectorState('LEGAL'); setOrgName('Cabinet d’Avocats Me. Trabelsi'); setSpecialty('Droit des affaires & Contentieux civil'); }}
                  className={`p-5 rounded-xl border text-left flex flex-col items-start gap-3 transition-all ${
                    selectedSector === 'LEGAL' 
                      ? 'border-blue-600 bg-blue-50/50 shadow-sm ring-2 ring-blue-500/20' 
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="p-2.5 rounded-lg bg-indigo-100 text-indigo-600">
                    <Scale className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">Cabinet d’Avocats / Juridique</h3>
                    <p className="text-xs text-slate-500 mt-1">Avocats, conseils juridiques. Gestion des dossiers contentieux et consultations.</p>
                  </div>
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <p className="text-sm text-slate-600">Renseignez l'identité officielle de votre structure pour la génération des modèles d'e-mails et SMS.</p>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Nom du Cabinet / Étude</label>
                  <input 
                    type="text" 
                    value={orgName} 
                    onChange={(e) => setOrgName(e.target.value)} 
                    className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" 
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Téléphone Secrétariat</label>
                    <input 
                      type="text" 
                      value={phone} 
                      onChange={(e) => setPhone(e.target.value)} 
                      className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Ville & Pays</label>
                    <input 
                      type="text" 
                      value={city} 
                      onChange={(e) => setCity(e.target.value)} 
                      className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" 
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <p className="text-sm text-slate-600">Configurez les disponibilités types pour le moteur de proposition de rendez-vous IA.</p>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Spécialité Principale</label>
                <input 
                  type="text" 
                  value={specialty} 
                  onChange={(e) => setSpecialty(e.target.value)} 
                  className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" 
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Ouverture Matin</label>
                  <input 
                    type="time" 
                    value={openingTime} 
                    onChange={(e) => setOpeningTime(e.target.value)} 
                    className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Fermeture Soir</label>
                  <input 
                    type="time" 
                    value={closingTime} 
                    onChange={(e) => setClosingTime(e.target.value)} 
                    className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" 
                  />
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <p className="text-sm text-slate-600">Activez les connecteurs pour synchroniser vos e-mails entrants et votre agenda en temps réel.</p>
              <div className="space-y-2.5">
                {[
                  { id: 'gmail', label: 'Google Gmail / IMAP', desc: 'Ingestion continue des e-mails patients & classement IA', state: connectedGmail, toggle: () => setConnectedGmail(!connectedGmail), icon: Mail, color: 'text-red-500' },
                  { id: 'gcal', label: 'Google Calendar API', desc: 'Création d’événements automatique sans double réservation', state: connectedCalendar, toggle: () => setConnectedCalendar(!connectedCalendar), icon: Calendar, color: 'text-blue-500' },
                  { id: 'wa', label: 'WhatsApp Cloud API / Twilio', desc: 'Rappels automatiques 24h avant RDV aux patients', state: connectedWhatsApp, toggle: () => setConnectedWhatsApp(!connectedWhatsApp), icon: MessageSquare, color: 'text-emerald-500' }
                ].map((conn) => {
                  const Icon = conn.icon;
                  return (
                    <div key={conn.id} className="p-3.5 rounded-xl border border-slate-200 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Icon className={`w-5 h-5 ${conn.color}`} />
                        <div>
                          <h4 className="text-xs font-bold text-slate-800">{conn.label}</h4>
                          <p className="text-[11px] text-slate-500">{conn.desc}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={conn.toggle}
                        className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors ${
                          conn.state 
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {conn.state ? 'Connecté' : 'Activer'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-4">
              <p className="text-sm text-slate-600">Choisissez le niveau de contrôle souhaité sur les réponses et les confirmations générées par l'IA.</p>
              <div className="space-y-3">
                {[
                  {
                    lvl: 'HUMAN_IN_THE_LOOP',
                    title: 'Human-in-the-Loop (Recommandé)',
                    desc: 'L’IA génère le brouillon de réponse et l’analyse, mais le secrétaire ou le praticien valide d’un clic avant tout envoi.',
                    icon: ShieldCheck,
                    badge: 'Sécurité Maximale'
                  },
                  {
                    lvl: 'SUGGEST_ONLY',
                    title: 'Suggestions Uniquement',
                    desc: 'L’IA se contente de taguer et de classer les e-mails sans préparer d’action automatique.',
                    icon: UserCheck,
                    badge: 'Mode Passif'
                  },
                  {
                    lvl: 'FULL_AUTONOMOUS',
                    title: 'Autonomie Supervisée (>90% confiance)',
                    desc: 'Les confirmations courantes sont expédiées immédiatement si le score de confiance dépasse le seuil paramétré.',
                    icon: Sparkles,
                    badge: 'Productivité Haute'
                  }
                ].map((opt) => (
                  <button
                    key={opt.lvl}
                    type="button"
                    onClick={() => setAutonomyMode(opt.lvl as any)}
                    className={`w-full p-4 rounded-xl border text-left transition-all ${
                      autonomyMode === opt.lvl 
                        ? 'border-blue-600 bg-blue-50/40 ring-1 ring-blue-500/20' 
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <opt.icon className="w-5 h-5 text-blue-600" />
                        <h4 className="font-bold text-slate-900 text-xs">{opt.title}</h4>
                      </div>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">{opt.badge}</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-2 leading-relaxed">{opt.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <button
            type="button"
            disabled={step === 1}
            onClick={() => setStep(step - 1)}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 disabled:opacity-30 disabled:pointer-events-none flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Précédent</span>
          </button>

          {step < 5 ? (
            <button
              type="button"
              onClick={() => setStep(step + 1)}
              className="px-5 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm transition-all flex items-center gap-1.5"
            >
              <span>Continuer</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleFinish}
              className="px-5 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-sm transition-all flex items-center gap-1.5"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              <span>Valider & Accéder au Dashboard</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

