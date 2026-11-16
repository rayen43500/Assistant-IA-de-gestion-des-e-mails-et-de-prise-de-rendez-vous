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
  UserCheck,
  Coffee,
  X
} from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore';

interface OnboardingWizardProps {
  onComplete: () => void;
  onCancel: () => void;
}

export const OnboardingWizard: React.FC<OnboardingWizardProps> = ({ onComplete, onCancel }) => {
  const { setSector, setOrganizationName, setCurrentUser, updateAvailabilitySettings, showToast } = useAppStore();
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);

  // Form State
  // Step 1: Domaine professionnel
  const [selectedSector, setSelectedSectorState] = useState<'MEDICAL' | 'LEGAL'>('MEDICAL');

  // Step 2: Informations du cabinet
  const [cabinetName, setCabinetName] = useState('Cabinet Médical Dr. Ben Salem');
  const [address, setAddress] = useState('Avenue Habib Bourguiba');
  const [city, setCity] = useState('Tunis');
  const [phone, setPhone] = useState('+216 71 234 567');

  // Step 3: Profil professionnel
  const [doctorName, setDoctorName] = useState('Dr. Youssef Ben Salem');
  const [specialty, setSpecialty] = useState('Cardiologie & Rythmologie');
  const [licenseNumber, setLicenseNumber] = useState('ORD-MED-2026-9812');

  // Step 4: Configuration horaires & durée
  const [openTime, setOpenTime] = useState('08:30');
  const [closeTime, setCloseTime] = useState('17:30');
  const [breakStart, setBreakStart] = useState('12:30');
  const [breakEnd, setBreakEnd] = useState('14:00');
  const [duration, setDuration] = useState<number>(30);

  // Step 5: Intégrations
  const [connectGmail, setConnectGmail] = useState(true);
  const [connectCalendar, setConnectCalendar] = useState(true);
  const [connectWhatsApp, setConnectWhatsApp] = useState(true);

  const handleFinish = () => {
    setSector(selectedSector);
    setOrganizationName(cabinetName);
    
    // Update availability
    updateAvailabilitySettings({
      consultationDuration: duration,
      daysSchedule: [
        { day: 'Lundi', active: true, start: openTime, end: closeTime, hasBreak: true, breakStart, breakEnd },
        { day: 'Mardi', active: true, start: openTime, end: closeTime, hasBreak: true, breakStart, breakEnd },
        { day: 'Mercredi', active: true, start: openTime, end: closeTime, hasBreak: true, breakStart, breakEnd },
        { day: 'Jeudi', active: true, start: openTime, end: closeTime, hasBreak: true, breakStart, breakEnd },
        { day: 'Vendredi', active: true, start: openTime, end: closeTime, hasBreak: true, breakStart, breakEnd },
        { day: 'Samedi', active: true, start: '08:30', end: '13:00', hasBreak: false, breakStart: '12:00', breakEnd: '13:00' },
        { day: 'Dimanche', active: false, start: '09:00', end: '12:00', hasBreak: false, breakStart: '12:00', breakEnd: '13:00' }
      ]
    });

    // Update active user profile
    setCurrentUser({
      id: `usr-${Date.now()}`,
      name: doctorName,
      email: `${doctorName.toLowerCase().replace(/[^a-z]/g, '')}@cabinet-ai.tn`,
      role: 'PRATICIEN',
      organizationName: cabinetName,
      sector: selectedSector
    });

    showToast({
      title: 'Cabinet créé avec succès !',
      message: `Bienvenue dans votre espace professionnel ${cabinetName}.`,
      type: 'success'
    });

    onComplete();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 font-sans animate-in fade-in">
      <div className="bg-white rounded-3xl shadow-2xl border border-[#E8EDF4] max-w-2xl w-full overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header with progress */}
        <div className="p-6 border-b border-[#E8EDF4] bg-[#F7F9FC]">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-[#2563EB] uppercase tracking-wider">
                Créer mon cabinet • Étape {step} / 5
              </span>
              <h2 className="text-base font-bold text-[#14213D] mt-0.5">
                {step === 1 && 'Quel est votre domaine professionnel ?'}
                {step === 2 && 'Informations du cabinet'}
                {step === 3 && 'Profil professionnel du praticien'}
                {step === 4 && 'Configuration : horaires et durée des rendez-vous'}
                {step === 5 && 'Intégrations & Connexions'}
              </h2>
            </div>
            <button onClick={onCancel} className="p-1 hover:bg-slate-200/60 rounded-lg text-slate-400">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex items-center gap-2 mt-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div 
                key={i} 
                className={`h-1.5 flex-1 rounded-full transition-all ${
                  i <= step ? 'bg-[#2563EB]' : 'bg-slate-200'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Step Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          {/* Étape 1 : Domaine professionnel */}
          {step === 1 && (
            <div className="space-y-4">
              <p className="text-xs text-slate-600 leading-relaxed">
                Sélectionnez votre corps de métier pour pré-configurer le vocabulaire, les modèles d’IA et les protocoles réglementaires.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedSectorState('MEDICAL');
                    setCabinetName('Cabinet Médical Dr. Ben Salem');
                    setDoctorName('Dr. Youssef Ben Salem');
                    setSpecialty('Cardiologie & Rythmologie');
                  }}
                  className={`p-5 rounded-2xl border text-left flex flex-col justify-between gap-3 transition-all relative ${
                    selectedSector === 'MEDICAL' 
                      ? 'border-[#2563EB] bg-blue-50/50 shadow-xs ring-2 ring-[#2563EB]/20' 
                      : 'border-[#E8EDF4] hover:bg-slate-50'
                  }`}
                >
                  <div className="absolute top-3 right-3">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-600 text-white">
                      Recommandé
                    </span>
                  </div>

                  <div className="w-10 h-10 rounded-xl bg-blue-100 text-[#2563EB] flex items-center justify-center font-bold">
                    <Stethoscope className="w-5 h-5" />
                  </div>

                  <div>
                    <h3 className="font-bold text-sm text-[#14213D]">Médical</h3>
                    <p className="text-[11px] text-slate-500 mt-1">Médecins, dentistes et cliniques</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedSectorState('LEGAL');
                    setCabinetName('Cabinet d’Avocats Selim Trabelsi');
                    setDoctorName('Me. Selim Trabelsi');
                    setSpecialty('Droit des Affaires & Contentieux');
                  }}
                  className={`p-5 rounded-2xl border text-left flex flex-col justify-between gap-3 transition-all ${
                    selectedSector === 'LEGAL' 
                      ? 'border-[#2563EB] bg-blue-50/50 shadow-xs ring-2 ring-[#2563EB]/20' 
                      : 'border-[#E8EDF4] hover:bg-slate-50'
                  }`}
                >
                  <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                    <Scale className="w-5 h-5" />
                  </div>

                  <div>
                    <h3 className="font-bold text-sm text-[#14213D]">Juridique</h3>
                    <p className="text-[11px] text-slate-500 mt-1">Avocats et cabinets juridiques</p>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* Étape 2 : Informations du cabinet */}
          {step === 2 && (
            <div className="space-y-4 text-xs">
              <p className="text-slate-600">
                Renseignez les coordonnées officielles de votre établissement pour vos patients ou clients.
              </p>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nom du Cabinet / Clinique</label>
                <input
                  type="text"
                  required
                  value={cabinetName}
                  onChange={e => setCabinetName(e.target.value)}
                  className="w-full p-2.5 bg-[#F7F9FC] border border-[#E8EDF4] rounded-xl text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Adresse</label>
                  <input
                    type="text"
                    required
                    value={address}
                    onChange={e => setAddress(e.target.value)}
                    className="w-full p-2.5 bg-[#F7F9FC] border border-[#E8EDF4] rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Ville / Gouvernorat</label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={e => setCity(e.target.value)}
                    className="w-full p-2.5 bg-[#F7F9FC] border border-[#E8EDF4] rounded-xl text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Téléphone Direct du Secrétariat</label>
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="w-full p-2.5 bg-[#F7F9FC] border border-[#E8EDF4] rounded-xl text-xs"
                />
              </div>
            </div>
          )}

          {/* Étape 3 : Profil professionnel */}
          {step === 3 && (
            <div className="space-y-4 text-xs">
              <p className="text-slate-600">
                Informations du titulaire principal pour la certification des courriers et attestations.
              </p>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nom et Prénom du Praticien Titulaire</label>
                <input
                  type="text"
                  required
                  value={doctorName}
                  onChange={e => setDoctorName(e.target.value)}
                  className="w-full p-2.5 bg-[#F7F9FC] border border-[#E8EDF4] rounded-xl text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Spécialité</label>
                  <input
                    type="text"
                    required
                    value={specialty}
                    onChange={e => setSpecialty(e.target.value)}
                    className="w-full p-2.5 bg-[#F7F9FC] border border-[#E8EDF4] rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {selectedSector === 'MEDICAL' ? 'N° Ordre des Médecins' : 'N° Inscription au Barreau'}
                  </label>
                  <input
                    type="text"
                    required
                    value={licenseNumber}
                    onChange={e => setLicenseNumber(e.target.value)}
                    className="w-full p-2.5 bg-[#F7F9FC] border border-[#E8EDF4] rounded-xl text-xs font-mono"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Étape 4 : Configuration Horaires & Disponibilités */}
          {step === 4 && (
            <div className="space-y-4 text-xs">
              <p className="text-slate-600">
                Définissez la grille de consultation standard, la pause déjeuner protégée et la durée de consultation.
              </p>

              <div className="p-3.5 bg-blue-50/50 rounded-2xl border border-blue-100 flex items-center justify-between">
                <div>
                  <span className="font-bold text-[#14213D] block">Heures d'ouverture du cabinet</span>
                  <span className="text-[11px] text-slate-500">Du Lundi au Vendredi</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="time"
                    value={openTime}
                    onChange={e => setOpenTime(e.target.value)}
                    className="p-1.5 bg-white border border-[#E8EDF4] rounded-lg text-xs font-mono font-bold"
                  />
                  <span>à</span>
                  <input
                    type="time"
                    value={closeTime}
                    onChange={e => setCloseTime(e.target.value)}
                    className="p-1.5 bg-white border border-[#E8EDF4] rounded-lg text-xs font-mono font-bold"
                  />
                </div>
              </div>

              <div className="p-3.5 bg-amber-50/60 rounded-2xl border border-amber-200/70 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Coffee className="w-4 h-4 text-amber-600" />
                  <div>
                    <span className="font-bold text-amber-900 block">Pause Déjeuner Protégée</span>
                    <span className="text-[11px] text-amber-700">Aucun rendez-vous ne sera planifié</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="time"
                    value={breakStart}
                    onChange={e => setBreakStart(e.target.value)}
                    className="p-1.5 bg-white border border-amber-200 rounded-lg text-xs font-mono font-bold"
                  />
                  <span>-</span>
                  <input
                    type="time"
                    value={breakEnd}
                    onChange={e => setBreakEnd(e.target.value)}
                    className="p-1.5 bg-white border border-amber-200 rounded-lg text-xs font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-2">Durée Moyenne de Rendez-vous :</label>
                <div className="grid grid-cols-4 gap-2">
                  {[15, 30, 45, 60].map(dur => (
                    <button
                      key={dur}
                      type="button"
                      onClick={() => setDuration(dur)}
                      className={`py-2 rounded-xl text-xs font-bold transition-all ${
                        duration === dur
                          ? 'bg-[#2563EB] text-white shadow-2xs'
                          : 'bg-[#F7F9FC] text-slate-700 border border-[#E8EDF4] hover:bg-slate-100'
                      }`}
                    >
                      {dur} min
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Étape 5 : Intégrations */}
          {step === 5 && (
            <div className="space-y-4 text-xs">
              <p className="text-slate-600">
                Connectez vos outils de communication. Vous pouvez également finaliser et les configurer plus tard depuis vos paramètres.
              </p>

              <div className="space-y-2.5">
                <div className="p-3.5 bg-white rounded-2xl border border-[#E8EDF4] flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-red-50 text-red-600 flex items-center justify-center font-bold">
                      <Mail className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-[#14213D]">Gmail / E-mails Professionnels</div>
                      <div className="text-[11px] text-slate-400">Lecture, classification NLP et préparation des réponses</div>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={connectGmail}
                    onChange={e => setConnectGmail(e.target.checked)}
                    className="rounded text-[#2563EB] focus:ring-[#2563EB]"
                  />
                </div>

                <div className="p-3.5 bg-white rounded-2xl border border-[#E8EDF4] flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                      <Calendar className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-[#14213D]">Google Calendar</div>
                      <div className="text-[11px] text-slate-400">Synchronisation bidirectionnelle anti-double réservation</div>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={connectCalendar}
                    onChange={e => setConnectCalendar(e.target.checked)}
                    className="rounded text-[#2563EB] focus:ring-[#2563EB]"
                  />
                </div>

                <div className="p-3.5 bg-white rounded-2xl border border-[#E8EDF4] flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                      <MessageSquare className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-[#14213D]">WhatsApp Business Automations</div>
                      <div className="text-[11px] text-slate-400">Rappels automatiques de consultation 24h avant</div>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={connectWhatsApp}
                    onChange={e => setConnectWhatsApp(e.target.checked)}
                    className="rounded text-[#2563EB] focus:ring-[#2563EB]"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer controls */}
        <div className="p-4 border-t border-[#E8EDF4] bg-[#F7F9FC] flex items-center justify-between">
          {step > 1 ? (
            <button
              onClick={() => setStep((step - 1) as any)}
              className="px-4 py-2 border border-[#E8EDF4] bg-white rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 flex items-center gap-1.5 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Retour
            </button>
          ) : (
            <button
              onClick={onCancel}
              className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-slate-600"
            >
              Annuler
            </button>
          )}

          {step < 5 ? (
            <button
              onClick={() => setStep((step + 1) as any)}
              className="px-5 py-2 bg-[#2563EB] hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <span>Continuer</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={handleFinish}
                className="px-3.5 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200/60 rounded-xl"
              >
                Configurer plus tard
              </button>
              <button
                onClick={handleFinish}
                className="px-5 py-2 bg-[#2563EB] hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-blue-600/20 transition-all"
              >
                <span>Finaliser et Ouvrir mon Cabinet</span>
                <CheckCircle className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
