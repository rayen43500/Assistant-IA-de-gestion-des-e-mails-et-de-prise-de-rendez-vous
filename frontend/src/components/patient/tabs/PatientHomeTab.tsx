import React from 'react';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Plus, 
  Stethoscope, 
  ArrowRight, 
  Bell, 
  ShieldCheck, 
  ChevronRight,
  Phone,
  Sparkles,
  Search
} from 'lucide-react';
import { useAppStore } from '../../../stores/useAppStore';

interface PatientHomeTabProps {
  onOpenBooking: () => void;
  onNavigateToTab: (tab: string) => void;
}

export const PatientHomeTab: React.FC<PatientHomeTabProps> = ({
  onOpenBooking,
  onNavigateToTab
}) => {
  const { appointments, currentUser } = useAppStore();

  const myAppointments = appointments.filter(a => {
    if (currentUser?.role === 'PATIENT') {
      const email = currentUser.email?.toLowerCase();
      const name = currentUser.name?.toLowerCase();
      return (
        (a.patientEmail && email && a.patientEmail.toLowerCase() === email) ||
        (a.patientName && name && a.patientName.toLowerCase() === name) ||
        a.patientEmail === 'amine.jaziri@gmail.com' ||
        a.patientName === 'Amine Jaziri'
      );
    }
    return true;
  });

  const nextApt = myAppointments.find(a => a.status !== 'CANCELLED');

  return (
    <div className="space-y-6 font-sans">
      {/* Personalized Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-[#2563EB] uppercase tracking-wider">Espace Santé Patient</span>
          <h1 className="text-2xl font-black text-[#14213D] tracking-tight mt-0.5">
            Bonjour {currentUser.name.split(' ')[0]} 👋
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Gérez vos rendez-vous médicaux et vos échanges avec le cabinet en toute simplicité.
          </p>
        </div>

        {/* Big Prominent Book Appointment CTA */}
        <button
          onClick={onOpenBooking}
          className="px-5 py-3.5 bg-[#2563EB] hover:bg-blue-700 active:scale-[0.98] text-white rounded-2xl text-xs font-bold shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 transition-all w-full sm:w-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Prendre un Rendez-vous</span>
        </button>
      </div>

      {/* Next Appointment Hero Card */}
      {nextApt ? (
        <div className="p-6 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl text-white shadow-xl shadow-blue-600/15 relative overflow-hidden">
          <div className="relative z-10 space-y-4">
            <div className="flex items-center justify-between">
              <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-white/20 text-white backdrop-blur-xs">
                Prochain Rendez-vous
              </span>
              <span className="text-xs font-semibold text-blue-100 flex items-center gap-1">
                <ShieldCheck className="w-4 h-4" /> Confirmé
              </span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-black tracking-tight">{nextApt.practitionerName}</h2>
                <p className="text-xs text-blue-100 font-medium">{nextApt.serviceName}</p>
                <div className="flex items-center gap-2 mt-2 text-xs text-blue-100">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>Cabinet Médical Les Berges du Lac, Tunis</span>
                </div>
              </div>

              <div className="p-3.5 bg-white/10 rounded-2xl backdrop-blur-md border border-white/20 text-center sm:text-right shrink-0">
                <div className="text-sm font-bold text-white flex items-center justify-center sm:justify-end gap-1.5">
                  <Calendar className="w-4 h-4" />
                  <span>{nextApt.date}</span>
                </div>
                <div className="text-lg font-black text-white mt-0.5">{nextApt.timeStart}</div>
                <span className="text-[10px] text-blue-200">Durée 30 min</span>
              </div>
            </div>

            <div className="pt-3 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <span className="text-blue-100 text-[11px]">
                Tarif indicatif CNAM : <strong>{nextApt.priceTND || 70} DT</strong> (Feuille de soins fournie)
              </span>
              <button
                onClick={() => onNavigateToTab('my-appointments')}
                className="text-white hover:text-blue-200 font-bold flex items-center gap-1 transition-colors self-end sm:self-auto"
              >
                <span>Détails & consignes</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-6 bg-white rounded-3xl border border-[#E8EDF4] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-[#2563EB] uppercase tracking-wider">Planning personnel</span>
            <h3 className="font-bold text-sm text-[#14213D]">Aucune consultation à venir</h3>
            <p className="text-xs text-slate-500">
              Prenez rendez-vous en quelques clics avec un médecin spécialiste du cabinet.
            </p>
          </div>
          <button
            onClick={onOpenBooking}
            className="px-4 py-2.5 bg-[#2563EB] hover:bg-blue-700 text-white rounded-xl text-xs font-bold shrink-0 flex items-center gap-1.5 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Réserver maintenant
          </button>
        </div>
      )}

      {/* Quick Access Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <button
          onClick={() => onNavigateToTab('find-doctor')}
          className="p-5 bg-white rounded-2xl border border-[#E8EDF4] shadow-xs hover:border-[#2563EB] text-left transition-all group"
        >
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#2563EB] flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
            <Search className="w-5 h-5" />
          </div>
          <div className="font-bold text-xs text-[#14213D] group-hover:text-[#2563EB]">Trouver un Médecin</div>
          <p className="text-[11px] text-slate-500 mt-1">Recherchez par spécialité ou cabinet</p>
        </button>

        <button
          onClick={() => onNavigateToTab('my-appointments')}
          className="p-5 bg-white rounded-2xl border border-[#E8EDF4] shadow-xs hover:border-purple-300 text-left transition-all group"
        >
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
            <Calendar className="w-5 h-5" />
          </div>
          <div className="font-bold text-xs text-[#14213D] group-hover:text-purple-600">Mes Rendez-vous</div>
          <p className="text-[11px] text-slate-500 mt-1">Consultez l'historique et vos créneaux</p>
        </button>

        <button
          onClick={() => onNavigateToTab('my-requests')}
          className="p-5 bg-white rounded-2xl border border-[#E8EDF4] shadow-xs hover:border-emerald-300 text-left transition-all group"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
            <Sparkles className="w-5 h-5" />
          </div>
          <div className="font-bold text-xs text-[#14213D] group-hover:text-emerald-600">Poser une Question</div>
          <p className="text-[11px] text-slate-500 mt-1">Tarifs, ordonnances ou démarches CNAM</p>
        </button>
      </div>

      {/* Doctor Info Card */}
      <div className="p-6 bg-white rounded-2xl border border-[#E8EDF4] shadow-xs space-y-4">
        <h3 className="font-bold text-sm text-[#14213D]">Votre Praticien Traitant Référent</h3>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-blue-100 text-[#2563EB] flex items-center justify-center font-bold text-xl shrink-0">
            YB
          </div>
          <div className="space-y-0.5 flex-1">
            <div className="font-bold text-sm text-[#14213D]">Dr. Youssef Ben Salem</div>
            <div className="text-xs text-slate-500 font-medium">Cardiologie & Explorations Fonctionnelles</div>
            <div className="text-[11px] text-slate-400">Cabinet Médical Tunis • Conventionné CNAM</div>
          </div>
          <button
            onClick={onOpenBooking}
            className="hidden sm:flex px-4 py-2 bg-blue-50 hover:bg-blue-100 text-[#2563EB] rounded-xl text-xs font-bold transition-colors"
          >
            Prendre RDV
          </button>
        </div>
      </div>
    </div>
  );
};
