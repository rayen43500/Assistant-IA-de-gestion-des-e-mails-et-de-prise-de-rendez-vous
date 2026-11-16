import React, { useState } from 'react';
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
  const { showToast } = useAppStore();
  const [filterType, setFilterType] = useState<'ALL' | 'APPOINTMENT' | 'EMAIL' | 'CANCELLATION' | 'ALERT'>('ALL');

  const [notifications, setNotifications] = useState([
    {
      id: 'notif-1',
      type: 'ALERT',
      title: '🚨 Alerte SAMU 190 Déclenchée',
      description: 'Mme Mona Karray a signalé de violentes douleurs thoraciques et essoufflement. Consigne vitale transmise et praticien alerté.',
      time: 'Il y a 12 min',
      unread: true,
      priority: 'CRITICAL',
      actionLabel: 'Voir le message',
      actionType: 'EMAIL'
    },
    {
      id: 'notif-2',
      type: 'APPOINTMENT',
      title: 'Nouveau Rendez-vous Confirmé',
      description: 'M. Sami Chaabane a confirmé sa consultation de cardiologie pour aujourd’hui à 09h00. Événement synchronisé sur Google Calendar.',
      time: 'Il y a 35 min',
      unread: true,
      priority: 'HIGH',
      actionLabel: 'Voir le calendrier',
      actionType: 'CALENDAR'
    },
    {
      id: 'notif-3',
      type: 'EMAIL',
      title: 'Nouvelle Demande de Tarifs & CNAM',
      description: 'M. Karim Bouazizi sollicite la grille tarifaire pour une échocardiographie Doppler et prise en charge conventionnée.',
      time: 'Il y a 1h',
      unread: true,
      priority: 'NORMAL',
      actionLabel: 'Valider la réponse IA',
      actionType: 'EMAIL'
    },
    {
      id: 'notif-4',
      type: 'CANCELLATION',
      title: 'Annulation de Créneau',
      description: 'Mme Leila Trabelsi a annulé son créneau d’échocardiographie de 10h00. Le créneau a été réouvert automatiquement à la réservation.',
      time: 'Il y a 2h',
      unread: false,
      priority: 'NORMAL',
      actionLabel: 'Consulter l’agenda',
      actionType: 'CALENDAR'
    },
    {
      id: 'notif-5',
      type: 'APPOINTMENT',
      title: 'Rappel WhatsApp 24h Expédié',
      description: 'Le workflow n8n a délivré le message WhatsApp de rappel avec l’itinéraire du cabinet à Kamel Dridi pour demain 14h00.',
      time: 'Aujourd’hui 08:00',
      unread: false,
      priority: 'LOW',
      actionLabel: 'Détails du rappel',
      actionType: 'CALENDAR'
    }
  ]);

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
