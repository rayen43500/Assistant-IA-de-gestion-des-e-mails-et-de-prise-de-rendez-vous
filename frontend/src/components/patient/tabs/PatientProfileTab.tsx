import React, { useState } from 'react';
import { 
  User, 
  Phone, 
  Mail, 
  ShieldCheck, 
  Save, 
  Bell, 
  CreditCard,
  Lock
} from 'lucide-react';
import { useAppStore } from '../../../stores/useAppStore';

export const PatientProfileTab: React.FC = () => {
  const { showToast, currentUser } = useAppStore();

  const [name, setName] = useState(currentUser.name || 'Amine Jaziri');
  const [email, setEmail] = useState(currentUser.email || 'amine.jaziri@gmail.com');
  const [phone, setPhone] = useState('+216 98 456 789');
  const [cnamNumber, setCnamNumber] = useState('14508923-01');
  const [birthDate, setBirthDate] = useState('1988-06-14');

  // Preferences
  const [whatsappReminders, setWhatsappReminders] = useState(true);
  const [emailConfirmations, setEmailConfirmations] = useState(true);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    showToast({
      title: 'Profil patient mis à jour',
      message: 'Vos coordonnées et préférences de rappel ont été enregistrées.',
      type: 'success'
    });
  };

  return (
    <div className="space-y-6 font-sans max-w-2xl">
      <div>
        <h1 className="text-xl font-black text-[#14213D] tracking-tight">Mon Profil Patient</h1>
        <p className="text-xs text-slate-500">
          Renseignez vos coordonnées de contact pour les rappels WhatsApp et votre matricule CNAM
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Personal Details Card */}
        <div className="bg-white rounded-3xl border border-[#E8EDF4] shadow-xs p-6 space-y-4">
          <h2 className="text-sm font-bold text-[#14213D] flex items-center gap-2">
            <User className="w-4 h-4 text-[#2563EB]" />
            <span>Informations Personnelles</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Nom Complet</label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#F7F9FC] border border-[#E8EDF4] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Date de Naissance</label>
              <input
                type="date"
                value={birthDate}
                onChange={e => setBirthDate(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#F7F9FC] border border-[#E8EDF4] rounded-xl focus:outline-none focus:border-[#2563EB]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Numéro Mobile (Rappels WhatsApp)</label>
              <input
                type="tel"
                required
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#F7F9FC] border border-[#E8EDF4] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Adresse E-mail</label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#F7F9FC] border border-[#E8EDF4] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Matricule CNAM / Caisse de Prise en Charge</label>
            <input
              type="text"
              placeholder="Ex: 14508923-01"
              value={cnamNumber}
              onChange={e => setCnamNumber(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#F7F9FC] border border-[#E8EDF4] rounded-xl font-mono text-xs focus:outline-none focus:border-[#2563EB]"
            />
          </div>
        </div>

        {/* Notification Preferences Card */}
        <div className="bg-white rounded-3xl border border-[#E8EDF4] shadow-xs p-6 space-y-4">
          <h2 className="text-sm font-bold text-[#14213D] flex items-center gap-2">
            <Bell className="w-4 h-4 text-purple-600" />
            <span>Préférences de Communication</span>
          </h2>

          <div className="space-y-3 text-xs">
            <label className="flex items-center justify-between p-3 bg-[#F7F9FC] rounded-2xl cursor-pointer">
              <div>
                <div className="font-bold text-slate-800">Rappel WhatsApp 24h avant la consultation</div>
                <div className="text-[11px] text-slate-500">Recommandé pour recevoir l'adresse et l'itinéraire</div>
              </div>
              <input
                type="checkbox"
                checked={whatsappReminders}
                onChange={e => setWhatsappReminders(e.target.checked)}
                className="w-4 h-4 rounded text-[#2563EB] focus:ring-[#2563EB]"
              />
            </label>

            <label className="flex items-center justify-between p-3 bg-[#F7F9FC] rounded-2xl cursor-pointer">
              <div>
                <div className="font-bold text-slate-800">Confirmation immédiate par e-mail</div>
                <div className="text-[11px] text-slate-500">Envoi de la confirmation avec fichier calendrier (.ics)</div>
              </div>
              <input
                type="checkbox"
                checked={emailConfirmations}
                onChange={e => setEmailConfirmations(e.target.checked)}
                className="w-4 h-4 rounded text-[#2563EB] focus:ring-[#2563EB]"
              />
            </label>
          </div>
        </div>

        <button
          type="submit"
          className="w-full py-3.5 bg-[#2563EB] hover:bg-blue-700 text-white rounded-2xl text-xs font-bold shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 transition-all"
        >
          <Save className="w-4 h-4" />
          <span>Enregistrer mes Coordonnées</span>
        </button>
      </form>
    </div>
  );
};
