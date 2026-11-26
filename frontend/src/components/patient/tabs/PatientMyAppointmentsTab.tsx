import React, { useState } from 'react';
import { Calendar, Clock, Stethoscope, XCircle, RefreshCw } from 'lucide-react';
import { useAppStore } from '../../../stores/useAppStore';
import { apiCancelPublicBookingByToken, apiCancelAppointment, apiErrorMessage } from '../../../services/apiClient';
import { usePatientBookings, formatLongDate } from '../patientData';
import type { PatientBooking } from '../patientData';

const STATUS: Record<string, { label: string; cls: string }> = {
  CONFIRMED: { label: 'Confirmé', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  SCHEDULED: { label: 'Planifié', cls: 'bg-blue-50 text-blue-700 border-blue-200' },
  CANCELLED: { label: 'Annulé', cls: 'bg-slate-100 text-slate-500 border-slate-200' },
  COMPLETED: { label: 'Terminé', cls: 'bg-slate-100 text-slate-600 border-slate-200' },
  NO_SHOW: { label: 'Absent', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
};

export const PatientMyAppointmentsTab: React.FC = () => {
  const { showToast, loadAppointments } = useAppStore();
  const { upcoming, past, loading, reload } = usePatientBookings();
  const [cancelling, setCancelling] = useState<string | null>(null);

  const cancel = async (b: PatientBooking) => {
    if (!window.confirm(`Annuler votre rendez-vous du ${formatLongDate(b.date)} à ${b.start} ?`)) return;
    setCancelling(b.id);
    try {
      if (b.token) await apiCancelPublicBookingByToken(b.token);
      else await apiCancelAppointment(b.id);
      showToast({ title: 'Rendez-vous annulé', message: 'Le créneau a été libéré.', type: 'info' });
      await Promise.all([reload(), loadAppointments()]);
    } catch (err: any) {
      showToast({ title: 'Annulation impossible', message: apiErrorMessage(err), type: 'danger' });
    } finally {
      setCancelling(null);
    }
  };

  const Item: React.FC<{ b: PatientBooking }> = ({ b }) => {
    const st = STATUS[b.status] || STATUS.SCHEDULED;
    return (
      <div className="p-4 bg-white rounded-2xl border border-[#E8EDF4] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-xl bg-blue-50 text-[#2563EB] flex items-center justify-center shrink-0">
            <Stethoscope className="w-5 h-5" />
          </div>
          <div className="text-xs space-y-0.5">
            <div className="font-bold text-[#14213D] text-sm">{b.doctorName || 'Praticien'}</div>
            {b.specialty && <div className="text-[#2563EB] font-semibold">{b.specialty}</div>}
            <div className="flex items-center gap-1.5 text-slate-600 capitalize"><Calendar className="w-3.5 h-3.5" />{formatLongDate(b.date)}</div>
            <div className="flex items-center gap-1.5 text-slate-600"><Clock className="w-3.5 h-3.5" />{b.start}{b.end ? ` - ${b.end}` : ''} • {b.reason}</div>
            {b.clinicName && <div className="text-slate-400">{b.clinicName}</div>}
          </div>
        </div>
        <div className="flex items-center gap-2 self-end sm:self-center">
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${st.cls}`}>{st.label}</span>
          {b.canCancel && (
            <button
              onClick={() => cancel(b)}
              disabled={cancelling === b.id}
              className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold flex items-center gap-1 disabled:opacity-60"
            >
              <XCircle className="w-3.5 h-3.5" /> {cancelling === b.id ? 'Annulation…' : 'Annuler'}
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-black text-[#14213D] tracking-tight">Mes rendez-vous</h1>
          <p className="text-xs text-slate-500">Rendez-vous pris depuis cet appareil ou votre compte</p>
        </div>
        <button onClick={reload} className="px-3 py-2 bg-white border border-[#E8EDF4] hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-700 flex items-center gap-1.5">
          <RefreshCw className="w-3.5 h-3.5" /> Actualiser
        </button>
      </div>

      {loading ? (
        <div className="p-8 text-center text-xs text-slate-400">Chargement…</div>
      ) : upcoming.length === 0 && past.length === 0 ? (
        <div className="p-10 bg-white rounded-2xl border border-[#E8EDF4] text-center space-y-2">
          <Calendar className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-sm font-bold text-[#14213D]">Aucun rendez-vous</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Réservez un créneau dans « Trouver un médecin ». Si vous avez reçu un lien de gestion par e-mail, utilisez « Gérer RDV invité ».
          </p>
        </div>
      ) : (
        <>
          <section className="space-y-3">
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-500">À venir ({upcoming.length})</h2>
            {upcoming.length === 0 && <p className="text-xs text-slate-400">Aucun rendez-vous à venir.</p>}
            {upcoming.map(b => <Item key={b.id} b={b} />)}
          </section>
          {past.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-xs font-black uppercase tracking-wider text-slate-500">Passés ou annulés ({past.length})</h2>
              {past.map(b => <Item key={b.id} b={b} />)}
            </section>
          )}
        </>
      )}
    </div>
  );
};

export default PatientMyAppointmentsTab;
