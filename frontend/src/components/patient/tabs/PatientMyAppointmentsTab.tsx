import React, { useState } from 'react';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  AlertCircle, 
  CheckCircle2, 
  XCircle, 
  Phone, 
  FileText,
  X
} from 'lucide-react';
import { useAppStore } from '../../../stores/useAppStore';

export const PatientMyAppointmentsTab: React.FC = () => {
  const { appointments, cancelAppointment, showToast } = useAppStore();
  const [selectedAptDetails, setSelectedAptDetails] = useState<any>(null);

  const handleCancelClick = (id: string, docName: string) => {
    cancelAppointment(id);
    showToast({
      title: 'Demande d’annulation transmise',
      message: `Votre rendez-vous avec le ${docName} a été annulé et le créneau libéré.`,
      type: 'info'
    });
    setSelectedAptDetails(null);
  };

  return (
    <div className="space-y-6 font-sans">
      <div>
        <h1 className="text-xl font-black text-[#14213D] tracking-tight">Mes Rendez-vous Médicaux</h1>
        <p className="text-xs text-slate-500">
          Consultez vos consultations programmées, vos rappels WhatsApp et vos rendez-vous passés
        </p>
      </div>

      <div className="space-y-4">
        {appointments.map(apt => {
          const isCancelled = apt.status === 'CANCELLED';
          return (
            <div
              key={apt.id}
              className={`p-5 bg-white rounded-3xl border border-[#E8EDF4] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                isCancelled ? 'opacity-60 bg-slate-50/50' : 'hover:border-blue-300'
              } transition-all`}
            >
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg shrink-0 ${
                  isCancelled ? 'bg-slate-200 text-slate-500' : 'bg-blue-100 text-[#2563EB]'
                }`}>
                  <Calendar className="w-6 h-6" />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm text-[#14213D]">{apt.practitionerName}</h3>
                    <span className={`px-2 py-0.2 rounded-full text-[9px] font-bold ${
                      isCancelled 
                        ? 'bg-rose-50 text-rose-700 border border-rose-200' 
                        : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    }`}>
                      {isCancelled ? 'Annulé' : 'Confirmé'}
                    </span>
                  </div>

                  <div className="text-xs text-slate-600 font-medium">{apt.serviceName}</div>

                  <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 pt-1">
                    <span className="flex items-center gap-1 font-mono font-semibold text-[#14213D]">
                      <Clock className="w-3.5 h-3.5 text-blue-600" /> {apt.date} à {apt.timeStart}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" /> Cabinet Médical Tunis
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                <button
                  onClick={() => setSelectedAptDetails(apt)}
                  className="px-3.5 py-2 bg-[#F7F9FC] hover:bg-slate-100 border border-[#E8EDF4] text-slate-700 rounded-xl text-xs font-bold transition-colors"
                >
                  Voir Détails
                </button>

                {!isCancelled && (
                  <button
                    onClick={() => handleCancelClick(apt.id, apt.practitionerName)}
                    className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-colors"
                  >
                    Annuler
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Appointment Detail Modal */}
      {selectedAptDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-[#E8EDF4] max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#E8EDF4] pb-3">
              <h3 className="font-black text-sm text-[#14213D]">Fiche de Consultation</h3>
              <button onClick={() => setSelectedAptDetails(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 bg-[#F7F9FC] rounded-2xl border border-[#E8EDF4] space-y-2.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Praticien :</span>
                <span className="font-bold text-[#14213D]">{selectedAptDetails.practitionerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Motif :</span>
                <span className="font-semibold text-slate-800">{selectedAptDetails.serviceName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Horaire :</span>
                <span className="font-mono font-bold text-blue-600">{selectedAptDetails.date} à {selectedAptDetails.timeStart}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Tarif prévu :</span>
                <span className="font-mono font-bold text-slate-900">{selectedAptDetails.priceTND || 70} DT (Convention CNAM)</span>
              </div>
            </div>

            <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-200/60 text-[11px] text-blue-900 space-y-1">
              <span className="font-bold">Consignes pour votre venue :</span>
              <p className="text-[10px] text-slate-600">
                Prière de vous présenter 10 minutes avant l'heure muni de votre carte d'assuré CNAM et de vos derniers bilans biologiques ou ECG.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setSelectedAptDetails(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
