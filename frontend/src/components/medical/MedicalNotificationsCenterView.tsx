import React, { useState, useMemo } from 'react';
import { 
  Bell, 
  Calendar, 
  Mail, 
  AlertTriangle, 
  XCircle, 
  CheckCircle2, 
  Clock, 
  ArrowRight, 
  ShieldCheck,
  CheckCheck,
  Filter
} from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore';

interface MedicalNotificationsCenterViewProps {
  onNavigateToEmails?: () => void;
  onNavigateToCalendar?: () => void;
}

export const MedicalNotificationsCenterView: React.FC<MedicalNotificationsCenterViewProps> = ({
  onNavigateToEmails,
  onNavigateToCalendar
}) => {
  const { showToast, emails, appointments } = useAppStore();
  const [filterType, setFilterType] = useState<'ALL' | 'APPOINTMENT' | 'EMAIL' | 'CANCELLATION' | 'ALERT'>('ALL');
  const [readIds, setReadIds] = useState<Set<string>>(() => {
    try { return new Set(JSON.parse(localStorage.getItem('medilaw_read_notifications') || '[]')); } catch { return new Set(); }
  });

  const relative = (iso?: string) => {
    if (!iso) return '';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    const min = Math.round((Date.now() - d.getTime()) / 60000);
    if (min < 1) return 'À l’instant';
    if (min < 60) return `Il y a ${min} min`;
    if (min < 24 * 60) return `Il y a ${Math.round(min / 60)} h`;
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
  };

  // Notifications générées à partir des vrais e-mails et rendez-vous
  const notifications = useMemo(() => {
    const list: any[] = [];
    for (const e of emails) {
      const when = e.receivedAtISO || '';
      if (e.intent === 'EMERGENCY') {
        list.push({ id: `em-${e.id}`, type: 'ALERT', title: '🚨 Urgence vitale signalée', description: `${e.sender.name} : « ${e.subject} ». Les consignes SAMU 190 ont été préparées.`, when, priority: 'CRITICAL', actionLabel: 'Voir le message', actionType: 'EMAIL' });
      } else if (e.bookingDecision === 'DIRECT_CONFIRMATION' || e.bookingDecision === 'RESCHEDULED') {
        list.push({ id: `em-${e.id}`, type: 'APPOINTMENT', title: e.bookingDecision === 'RESCHEDULED' ? 'Rendez-vous déplacé par e-mail' : 'Rendez-vous réservé par l’IA', description: `${e.sender.name} — ${e.extractedEntities?.requestedDate || ''} ${e.extractedEntities?.requestedTime || ''}`.trim(), when, priority: 'HIGH', actionLabel: 'Voir le calendrier', actionType: 'CALENDAR' });
      } else if (e.intent === 'CANCELLATION') {
        list.push({ id: `em-${e.id}`, type: 'CANCELLATION', title: 'Demande d’annulation', description: `${e.sender.name} : « ${e.subject} »`, when, priority: 'NORMAL', actionLabel: 'Voir le message', actionType: 'EMAIL' });
      } else if (e.status === 'PENDING_VALIDATION') {
        list.push({ id: `em-${e.id}`, type: 'EMAIL', title: 'Réponse à valider', description: `${e.sender.name} : « ${e.subject} »`, when, priority: 'NORMAL', actionLabel: 'Valider la réponse', actionType: 'EMAIL' });
      } else if (e.status === 'WAITING_FOR_REPLY') {
        list.push({ id: `em-${e.id}`, type: 'EMAIL', title: 'En attente de la réponse du patient', description: `${e.sender.name} : praticien ou créneau à préciser.`, when, priority: 'LOW', actionLabel: 'Voir le message', actionType: 'EMAIL' });
      }
    }
    for (const a of appointments) {
      if (a.status === 'CANCELLED') {
        list.push({ id: `apt-${a.id}`, type: 'CANCELLATION', title: 'Rendez-vous annulé', description: `${a.patientName} — ${a.date} à ${a.timeStart}. Le créneau est de nouveau disponible.`, when: `${a.date}T${a.timeStart}`, priority: 'NORMAL', actionLabel: 'Consulter l’agenda', actionType: 'CALENDAR' });
      }
    }
    return list
      .sort((x, y) => (y.when || '').localeCompare(x.when || ''))
      .map(n => ({ ...n, time: relative(n.when), unread: !readIds.has(n.id) }));
  }, [emails, appointments, readIds]);

  const setNotifications = (updater: (prev: any[]) => any[]) => {
    const next = updater(notifications);
    const ids = new Set(next.filter(n => !n.unread).map(n => n.id));
    setReadIds(ids);
    try { localStorage.setItem('medilaw_read_notifications', JSON.stringify([...ids])); } catch {}
  };

  const handleMarkAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
    showToast({
      title: 'Toutes les notifications marquées comme lues',
      message: 'Le centre de notifications a été mis à jour.',
      type: 'info'
    });
  };

  const filtered = notifications.filter(n => {
    if (filterType !== 'ALL' && n.type !== filterType) return false;
    return true;
  });

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-[#14213D] tracking-tight">Centre de Notifications & Alertes Cliniques</h1>
          <p className="text-xs text-slate-500">
            Flux en direct des demandes de rendez-vous, réceptions d'e-mails, annulations et escalades SAMU 190
          </p>
        </div>

        <button
          onClick={handleMarkAllRead}
          className="px-3.5 py-2 bg-white border border-[#E8EDF4] hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold shadow-2xs flex items-center gap-1.5 transition-colors w-fit"
        >
          <CheckCheck className="w-4 h-4 text-[#2563EB]" />
          <span>Tout marquer comme lu</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        {[
          { id: 'ALL', label: 'Toutes les alertes', count: notifications.length },
          { id: 'ALERT', label: '🚨 Urgences SAMU', count: notifications.filter(n => n.type === 'ALERT').length, urgent: true },
          { id: 'APPOINTMENT', label: 'Rendez-vous', count: notifications.filter(n => n.type === 'APPOINTMENT').length },
          { id: 'EMAIL', label: 'E-mails IA', count: notifications.filter(n => n.type === 'EMAIL').length },
          { id: 'CANCELLATION', label: 'Annulations', count: notifications.filter(n => n.type === 'CANCELLATION').length }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setFilterType(tab.id as any)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              filterType === tab.id
                ? 'bg-[#2563EB] text-white shadow-2xs'
                : 'bg-white border border-[#E8EDF4] text-slate-700 hover:bg-slate-50'
            }`}
          >
            <span>{tab.label}</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
              filterType === tab.id ? 'bg-white/20 text-white' : tab.urgent ? 'bg-rose-100 text-rose-700 font-bold' : 'bg-slate-100 text-slate-600'
            }`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Notifications List */}
      <div className="bg-white rounded-2xl border border-[#E8EDF4] shadow-xs overflow-hidden divide-y divide-slate-100">
        {filtered.length === 0 && (
          <div className="p-8 text-center text-xs text-slate-400">Aucune notification pour le moment.</div>
        )}
        {filtered.map(notif => (
          <div 
            key={notif.id}
            className={`p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors ${
              notif.unread ? 'bg-blue-50/20' : 'hover:bg-[#F7F9FC]'
            }`}
          >
            <div className="flex items-start gap-3.5">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                notif.type === 'ALERT' 
                  ? 'bg-rose-100 text-rose-700' 
                  : notif.type === 'APPOINTMENT' 
                  ? 'bg-blue-100 text-blue-700' 
                  : notif.type === 'CANCELLATION' 
                  ? 'bg-amber-100 text-amber-700' 
                  : 'bg-purple-100 text-purple-700'
              }`}>
                {notif.type === 'ALERT' && <AlertTriangle className="w-5 h-5" />}
                {notif.type === 'APPOINTMENT' && <Calendar className="w-5 h-5" />}
                {notif.type === 'EMAIL' && <Mail className="w-5 h-5" />}
                {notif.type === 'CANCELLATION' && <XCircle className="w-5 h-5" />}
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-xs text-[#14213D]">{notif.title}</h3>
                  {notif.unread && (
                    <span className="w-2 h-2 rounded-full bg-[#2563EB]"></span>
                  )}
                </div>
                <p className="text-xs text-slate-600 leading-relaxed max-w-2xl">
                  {notif.description}
                </p>
                <span className="text-[10px] text-slate-400 font-mono block">
                  {notif.time}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
              <button
                onClick={() => {
                  if (notif.actionType === 'EMAIL' && onNavigateToEmails) onNavigateToEmails();
                  if (notif.actionType === 'CALENDAR' && onNavigateToCalendar) onNavigateToCalendar();
                }}
                className="px-3 py-1.5 bg-[#F7F9FC] hover:bg-blue-50 border border-[#E8EDF4] hover:border-blue-200 text-[#14213D] hover:text-[#2563EB] rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
              >
                <span>{notif.actionLabel}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
