import React, { useState } from 'react';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Clock, 
  User, 
  CheckCircle2, 
  X, 
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  Phone
} from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore';
import type { AppointmentItem } from '../../types';

export const AppointmentCalendarView: React.FC = () => {
  const { sector, appointments, addAppointment, cancelAppointment, confirmAppointment, showToast } = useAppStore();
  const [selectedView, setSelectedView] = useState<'WEEK' | 'DAY'>('WEEK');
  const [showModal, setShowModal] = useState(false);

  // New Appointment Form State
  const [patientName, setPatientName] = useState('');
  const [patientPhone, setPatientPhone] = useState('+216 ');
  const [patientEmail, setPatientEmail] = useState('');
  const [aptDate, setAptDate] = useState('2026-11-03');
  const [aptTime, setAptTime] = useState('14:00');
  const [aptService, setAptService] = useState(sector === 'MEDICAL' ? 'Consultation Cardiologie' : 'Consultation Juridique');
  const [collisionWarning, setCollisionWarning] = useState<string | null>(null);

  const hours = ['08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30'];
  const weekDays = [
    { name: 'Lundi', date: '2026-11-02' },
    { name: 'Mardi (Aujourd’hui)', date: '2026-11-03' },
    { name: 'Mercredi', date: '2026-11-04' },
    { name: 'Jeudi', date: '2026-11-05' },
    { name: 'Vendredi', date: '2026-11-06' }
  ];

  const handleCheckAndSave = (e: React.FormEvent) => {
    e.preventDefault();
    setCollisionWarning(null);

    // Collision detection check (Anti double booking)
    const conflict = appointments.find(a => 
      a.date === aptDate && 
      a.timeStart === aptTime && 
      a.status !== 'CANCELLED'
    );

    if (conflict) {
      setCollisionWarning(`Collision détectée : Le créneau de ${aptTime} le ${aptDate} est déjà réservé par ${conflict.patientName}.`);
      return;
    }

    const newApt: AppointmentItem = {
      id: `apt-${Date.now()}`,
      patientName,
      patientEmail,
      patientPhone,
      practitionerName: sector === 'MEDICAL' ? 'Dr. Youssef Ben Salem' : 'Me. Selim Trabelsi',
      serviceName: aptService,
      date: aptDate,
      timeStart: aptTime,
      timeEnd: `${parseInt(aptTime.split(':')[0]) + (aptTime.endsWith('30') ? 1 : 0)}:${aptTime.endsWith('30') ? '00' : '30'}`,
      durationMinutes: 30,
      status: 'SCHEDULED',
      reminderSent24h: false,
      googleCalendarSynced: true,
      priceTND: sector === 'MEDICAL' ? 70 : 120
    };

    addAppointment(newApt);
    showToast({
      title: 'Rendez-vous créé avec succès !',
      message: `Créneau de ${aptTime} enregistré et synchronisé avec Google Calendar.`,
      type: 'success'
    });
    setShowModal(false);
    setPatientName('');
    setPatientPhone('+216 ');
    setPatientEmail('');
  };

  return (
    <div className="space-y-6">
      {/* Header controls (matching Screenshot 2 & 3) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-[#14213D] tracking-tight">Agenda & Prise de Rendez-vous</h1>
          <p className="text-xs text-slate-500">Protection anti-double réservation & synchronisation Google Calendar en direct</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="p-1 bg-white border border-[#E5EAF2] rounded-xl flex items-center text-xs font-bold text-slate-600 shadow-xs">
            <button
              onClick={() => setSelectedView('WEEK')}
              className={`px-3 py-1.5 rounded-lg transition-all ${selectedView === 'WEEK' ? 'bg-blue-600 text-white' : 'hover:text-slate-900'}`}
            >
              Semaine
            </button>
            <button
              onClick={() => setSelectedView('DAY')}
              className={`px-3 py-1.5 rounded-lg transition-all ${selectedView === 'DAY' ? 'bg-blue-600 text-white' : 'hover:text-slate-900'}`}
            >
              Jour
            </button>
          </div>

          <button
            onClick={() => { setCollisionWarning(null); setShowModal(true); }}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-600/20 flex items-center gap-1.5 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Nouveau Rendez-vous</span>
          </button>
        </div>
      </div>

      {/* Synchronized status bar */}
      <div className="p-3.5 bg-white rounded-xl border border-[#E5EAF2] shadow-xs flex items-center justify-between text-xs">
        <div className="flex items-center gap-2 text-slate-700 font-medium">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Google Calendar Connecté : <b>{sector === 'MEDICAL' ? 'dr.bensalem@cabinet-ai.tn' : 'me.trabelsi@avocats-tunis.tn'}</b></span>
        </div>
        <span className="text-[11px] text-slate-400 font-mono">Dernière synchronisation : Il y a 2 min</span>
      </div>

      {/* Calendar Grid (Week View inspired by Screenshot 2/3) */}
      <div className="bg-white rounded-2xl border border-[#E5EAF2] shadow-xs overflow-x-auto">
        <div className="min-w-[700px]">
          {/* Days Header */}
          <div className="grid grid-cols-6 border-b border-[#E5EAF2] bg-[#F7F9FC] text-center text-xs font-bold text-slate-700">
            <div className="p-3 border-r border-[#E5EAF2] text-slate-400">Créneau</div>
            {weekDays.map(d => (
              <div key={d.date} className={`p-3 border-r border-[#E5EAF2] last:border-r-0 ${d.date === '2026-11-03' ? 'bg-blue-50/60 text-blue-700' : ''}`}>
                <div>{d.name}</div>
                <div className="text-[10px] text-slate-400 font-normal">{d.date}</div>
              </div>
            ))}
          </div>

          {/* Time Slots rows */}
          <div className="divide-y divide-slate-100">
            {hours.map(slot => (
              <div key={slot} className="grid grid-cols-6 text-xs min-h-[56px]">
                <div className="p-2 border-r border-[#E5EAF2] text-slate-400 font-mono text-[11px] flex items-center justify-center bg-[#F7F9FC]">
                  {slot}
                </div>

                {weekDays.map(d => {
                  const apt = appointments.find(a => a.date === d.date && a.timeStart === slot && a.status !== 'CANCELLED');
                  return (
                    <div 
                      key={`${d.date}-${slot}`} 
                      className={`p-1.5 border-r border-[#E5EAF2] last:border-r-0 transition-colors relative ${
                        d.date === '2026-11-03' ? 'bg-blue-50/10' : ''
                      }`}
                    >
                      {apt ? (
                        <div className="h-full p-2 rounded-lg bg-blue-100/80 border border-blue-200 text-blue-900 flex flex-col justify-between shadow-xs">
                          <div className="font-bold truncate text-[11px]">{apt.patientName}</div>
                          <div className="text-[10px] text-blue-700 truncate">{apt.serviceName}</div>
                          <div className="text-[9px] text-slate-500 font-mono flex items-center justify-between mt-1">
                            <span>{apt.timeStart} - {apt.timeEnd}</span>
                            <span className="text-emerald-700 font-bold">Google Synced</span>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setAptDate(d.date);
                            setAptTime(slot);
                            setCollisionWarning(null);
                            setShowModal(true);
                          }}
                          className="w-full h-full rounded-lg hover:bg-slate-50 opacity-0 hover:opacity-100 text-[10px] text-blue-600 font-semibold flex items-center justify-center transition-all"
                        >
                          + Réserver
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Appointment Modal with Collision Check (matching Screenshot 2/3 popover) */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-black text-sm text-[#14213D]">
                Créer un Rendez-vous ({sector === 'MEDICAL' ? 'Patient' : 'Client'})
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            {collisionWarning && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{collisionWarning}</span>
              </div>
            )}

            <form onSubmit={handleCheckAndSave} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nom Complet du {sector === 'MEDICAL' ? 'Patient' : 'Client'}
                </label>
                <input
                  type="text"
                  required
                  placeholder="ex: Mohamed Bouazizi"
                  value={patientName}
                  onChange={e => setPatientName(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Téléphone (WhatsApp)</label>
                  <input
                    type="text"
                    required
                    value={patientPhone}
                    onChange={e => setPatientPhone(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">E-mail</label>
                  <input
                    type="email"
                    required
                    placeholder="patient@gmail.com"
                    value={patientEmail}
                    onChange={e => setPatientEmail(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={aptDate}
                    onChange={e => setAptDate(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Créneau Horaire</label>
                  <select
                    value={aptTime}
                    onChange={e => setAptTime(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    {hours.map(h => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Motif / Prestation</label>
                <input
                  type="text"
                  required
                  value={aptService}
                  onChange={e => setAptService(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="pt-3 border-t flex items-center justify-between">
                <span className="text-[11px] text-slate-400">Rappel WhatsApp 24h activé</span>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-xs transition-colors"
                >
                  Confirmer le Rendez-vous
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
