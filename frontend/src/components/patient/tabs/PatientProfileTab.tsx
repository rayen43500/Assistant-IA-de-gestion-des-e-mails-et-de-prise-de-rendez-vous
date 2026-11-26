import React, { useState } from 'react';
import { User, Save, ShieldCheck } from 'lucide-react';
import { useAppStore } from '../../../stores/useAppStore';
import { getPatientContact, savePatientContact } from '../patientData';

/**
 * Coordonnées du patient : utilisées pour pré-remplir les réservations et le chat.
 * Elles sont conservées sur cet appareil uniquement.
 */
export const PatientProfileTab: React.FC = () => {
  const { showToast, currentUser } = useAppStore();
  const initial = getPatientContact();
  const [name, setName] = useState(initial.name);
  const [email, setEmail] = useState(initial.email);
  const [phone, setPhone] = useState(initial.phone);
  const isAccount = currentUser?.role === 'PATIENT' && !!currentUser?.id;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (email && !/@/.test(email)) {
      showToast({ title: 'E-mail invalide', message: 'Vérifiez votre adresse e-mail.', type: 'warning' });
      return;
    }
    savePatientContact({ name: name.trim(), email: email.trim(), phone: phone.trim() });
    showToast({ title: 'Coordonnées enregistrées', message: 'Elles seront utilisées pour vos prochaines réservations.', type: 'success' });
  };

  const input = 'w-full px-3.5 py-2.5 bg-[#F7F9FC] border border-[#E8EDF4] rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] disabled:opacity-60';

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-xl font-black text-[#14213D] tracking-tight">Mon profil</h1>
        <p className="text-xs text-slate-500">Vos coordonnées pour la confirmation et le rappel de vos rendez-vous</p>
      </div>

      <form onSubmit={handleSave} className="p-6 bg-white rounded-2xl border border-[#E8EDF4] shadow-xs space-y-4 text-xs">
        <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
          <div className="w-11 h-11 rounded-xl bg-blue-50 text-[#2563EB] flex items-center justify-center"><User className="w-5 h-5" /></div>
          <div>
            <div className="font-bold text-sm text-[#14213D]">{name || 'Patient'}</div>
            <div className="text-slate-500">{isAccount ? 'Compte patient' : 'Sans compte'}</div>
          </div>
        </div>

        <div>
          <label className="block font-bold text-slate-700 mb-1">Nom et prénom</label>
          <input value={name} onChange={e => setName(e.target.value)} className={input} placeholder="Votre nom complet" />
        </div>
        <div>
          <label className="block font-bold text-slate-700 mb-1">Adresse e-mail</label>
          <input type="email" value={email} disabled={isAccount} onChange={e => setEmail(e.target.value)} className={input} placeholder="vous@exemple.tn" />
        </div>
        <div>
          <label className="block font-bold text-slate-700 mb-1">Téléphone</label>
          <input value={phone} onChange={e => setPhone(e.target.value)} className={input} placeholder="+216 …" />
        </div>

        <div className="p-3 rounded-xl bg-[#F7F9FC] border border-[#E8EDF4] text-[11px] text-slate-600 flex items-start gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Ces informations restent sur cet appareil et ne sont transmises au cabinet qu’au moment d’une réservation.</span>
        </div>

        <button type="submit" className="px-4 py-2.5 bg-[#2563EB] hover:bg-blue-700 text-white rounded-xl font-bold flex items-center gap-1.5">
          <Save className="w-4 h-4" /> Enregistrer
        </button>
      </form>
    </div>
  );
};

export default PatientProfileTab;
