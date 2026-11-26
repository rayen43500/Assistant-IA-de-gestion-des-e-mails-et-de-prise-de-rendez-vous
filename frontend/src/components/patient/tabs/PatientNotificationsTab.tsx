import React from 'react';
import { CheckCircle2, Calendar, XCircle } from 'lucide-react';
import { usePatientBookings, formatLongDate, todayISO } from '../patientData';

/**
 * Notifications du patient, générées à partir de ses vrais rendez-vous.
 */
export const PatientNotificationsTab: React.FC = () => {
  const { bookings, loading } = usePatientBookings();
  const today = todayISO();

  const items = bookings.flatMap((b) => {
    const list: { id: string; icon: React.ElementType; tone: string; title: string; text: string }[] = [];
    if (b.status === 'CANCELLED') {
      list.push({ id: `${b.id}-c`, icon: XCircle, tone: 'text-slate-500 bg-slate-100', title: 'Rendez-vous annulé', text: `${formatLongDate(b.date)} à ${b.start} avec ${b.doctorName}.` });
    } else {
      list.push({ id: `${b.id}-ok`, icon: CheckCircle2, tone: 'text-emerald-600 bg-emerald-50', title: 'Rendez-vous confirmé', text: `${formatLongDate(b.date)} à ${b.start} avec ${b.doctorName}.` });
      if (b.date >= today) {
        list.push({ id: `${b.id}-r`, icon: Calendar, tone: 'text-blue-600 bg-blue-50', title: 'Rappel prévu', text: `Un rappel par e-mail vous sera envoyé la veille du rendez-vous (${formatLongDate(b.date)}).` });
      }
    }
    return list;
  }).reverse();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-black text-[#14213D] tracking-tight">Notifications</h1>
        <p className="text-xs text-slate-500">Confirmations, annulations et rappels de vos rendez-vous</p>
      </div>
      <div className="bg-white rounded-2xl border border-[#E8EDF4] shadow-xs divide-y divide-slate-100">
        {loading && <div className="p-6 text-center text-xs text-slate-400">Chargement…</div>}
        {!loading && items.length === 0 && <div className="p-8 text-center text-xs text-slate-400">Aucune notification pour le moment.</div>}
        {items.map(n => (
          <div key={n.id} className="p-4 flex items-start gap-3">
            <span className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${n.tone}`}><n.icon className="w-4 h-4" /></span>
            <div className="text-xs">
              <div className="font-bold text-[#14213D]">{n.title}</div>
              <div className="text-slate-600 capitalize-first">{n.text}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PatientNotificationsTab;
