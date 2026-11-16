import React from 'react';
import { 
  Bell, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  MessageSquare, 
  ShieldCheck,
  AlertCircle
} from 'lucide-react';

export const PatientNotificationsTab: React.FC = () => {
  const patientNotifications = [
    {
      id: 1,
      title: 'Confirmation de Rendez-vous',
      desc: 'Votre consultation du Mercredi 4 Novembre à 10h00 avec le Dr. Ben Salem est confirmée.',
      time: 'Il y a 10 min',
      type: 'CONFIRM'
    },
    {
      id: 2,
      title: 'Rappel Automatique WhatsApp programmé',
      desc: 'Un rappel avec itinéraire et consignes vous parviendra la veille à 08h00 sur votre mobile.',
      time: 'Il y a 30 min',
      type: 'REMINDER'
    },
    {
      id: 3,
      title: 'Réponse à votre question CNAM',
      desc: 'Le secrétariat a répondu à votre demande concernant le remboursement échocardiographie.',
      time: 'Hier',
      type: 'MESSAGE'
    }
  ];

  return (
    <div className="space-y-6 font-sans">
      <div>
        <h1 className="text-xl font-black text-[#14213D] tracking-tight">Vos Notifications Médicales</h1>
        <p className="text-xs text-slate-500">
          Suivi des confirmations, rappels de consultation et messages de votre cabinet
        </p>
      </div>

      <div className="bg-white rounded-3xl border border-[#E8EDF4] shadow-xs overflow-hidden divide-y divide-slate-100">
        {patientNotifications.map(n => (
          <div key={n.id} className="p-5 flex items-start gap-3.5 hover:bg-[#F7F9FC] transition-colors">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#2563EB] flex items-center justify-center shrink-0">
              {n.type === 'CONFIRM' && <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
              {n.type === 'REMINDER' && <Calendar className="w-5 h-5 text-blue-600" />}
              {n.type === 'MESSAGE' && <MessageSquare className="w-5 h-5 text-purple-600" />}
            </div>

            <div className="space-y-1 flex-1">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-xs text-[#14213D]">{n.title}</h3>
                <span className="text-[10px] text-slate-400 font-mono">{n.time}</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">{n.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
