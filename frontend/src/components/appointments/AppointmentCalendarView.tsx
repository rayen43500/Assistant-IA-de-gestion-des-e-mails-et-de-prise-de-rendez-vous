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
  Phone,
  Mail,
  Edit2,
  Trash2,
  XCircle,
  Coffee,
  Bot
} from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore';
import type { AppointmentItem } from '../../types';

export const AppointmentCalendarView: React.FC = () => {
  const { 
    sector, 
    appointments, 
    addAppointment, 
    updateAppointment, 
    cancelAppointment, 
    deleteAppointment, 
    confirmAppointment, 
    availabilitySettings,
    isSlotAvailable,
    showToast 
  } = useAppStore();

  const [selectedView, setSelectedView] = useState<'WEEK' | 'DAY'>('WEEK');
  const [showModal, setShowModal] = useState(false);
  const [selectedApt, setSelectedApt] = useState<AppointmentItem | null>(null);
  const [isEditingSelected, setIsEditingSelected] = useState(false);

  // New Appointment Form State
  const [patientName, setPatientName] = useState('');
  const [patientPhone, setPatientPhone] = useState('+216 ');
  const [patientEmail, setPatientEmail] = useState('');
  const [aptDate, setAptDate] = useState('2026-11-03');
  const [aptTime, setAptTime] = useState('14:00');
  const [aptService, setAptService] = useState(sector === 'MEDICAL' ? 'Consultation Cardiologie' : 'Consultation Juridique');
  const [collisionWarning, setCollisionWarning] = useState<string | null>(null);

  // Edit State
  const [editDate, setEditDate] = useState('');
  const [editTime, setEditTime] = useState('');
  const [editService, setEditService] = useState('');

  // Hours covering opening hours (08:30 - 17:30) including lunch break (12:30 - 14:00)
  const hours = [
    '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00',
    '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00'
  ];

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

    // Collision & Availability check using store rules (lunch break, holidays, double booking)
    const availabilityCheck = isSlotAvailable(aptDate, aptTime);
    if (!availabilityCheck.available) {
      setCollisionWarning(availabilityCheck.reason || 'Ce créneau n’est pas disponible.');
      return;
    }

    const duration = availabilitySettings.consultationDuration || 30;
    const [h, m] = aptTime.split(':').map(Number);
    const endMinutes = h * 60 + m + duration;
    const endH = Math.floor(endMinutes / 60).toString().padStart(2, '0');
    const endM = (endMinutes % 60).toString().padStart(2, '0');

    const newApt: AppointmentItem = {
      id: `apt-${Date.now()}`,
      patientName,
      patientEmail,
      patientPhone,
      practitionerName: sector === 'MEDICAL' ? 'Dr. Youssef Ben Salem' : 'Me. Selim Trabelsi',
      serviceName: aptService,
      date: aptDate,
      timeStart: aptTime,
      timeEnd: `${endH}:${endM}`,
      durationMinutes: duration,
      status: 'SCHEDULED',
      reminderSent24h: false,
      googleCalendarSynced: true,
      priceTND: sector === 'MEDICAL' ? 70 : 120
    };

    addAppointment(newApt);
    showToast({
      title: 'Rendez-vous créé avec succès !',
      message: `Créneau de ${aptTime} enregistré (${duration} min) et synchronisé avec Google Calendar.`,
      type: 'success'
    });
    setShowModal(false);
    setPatientName('');
    setPatientPhone('+216 ');
    setPatientEmail('');
  };

  const openAptDetails = (apt: AppointmentItem) => {
    setSelectedApt(apt);
    setEditDate(apt.date);
    setEditTime(apt.timeStart);
    setEditService(apt.serviceName);
    setIsEditingSelected(false);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedApt) return;

    // Check if new time slot is during lunch break or already taken
    if (editTime !== selectedApt.timeStart || editDate !== selectedApt.date) {
      const check = isSlotAvailable(editDate, editTime);
      if (!check.available && !check.reason?.includes(selectedApt.patientName)) {
        showToast({
          title: 'Modification impossible',
          message: check.reason || 'Ce créneau est bloqué.',
          type: 'danger'
        });
        return;
      }
    }

    updateAppointment(selectedApt.id, {
      date: editDate,
      timeStart: editTime,
      serviceName: editService
    });

    setSelectedApt({
      ...selectedApt,
      date: editDate,
      timeStart: editTime,
      serviceName: editService
    });

    setIsEditingSelected(false);
    showToast({
      title: 'Rendez-vous modifié',
      message: `Le rendez-vous de ${selectedApt.patientName} a été déplacé au ${editDate} à ${editTime}.`,
      type: 'success'
    });
  };

  const handleCancelApt = (id: string) => {
    cancelAppointment(id);
    if (selectedApt?.id === id) {
      setSelectedApt({ ...selectedApt, status: 'CANCELLED' });
    }
    showToast({
      title: 'Rendez-vous annulé',
      message: 'Le créneau a été libéré sur Google Calendar et le planning.',
      type: 'warning'
    });
  };

  const handleDeleteApt = (id: string) => {
    deleteAppointment(id);
    setSelectedApt(null);
    showToast({
      title: 'Rendez-vous supprimé',
      message: 'Le rendez-vous a été définitivement supprimé.',
      type: 'info'
    });
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header controls */}
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
      <div className="p-3.5 bg-white rounded-xl border border-[#E5EAF2] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-4 text-slate-700 font-medium">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
            <span className="truncate">Google Calendar : <b>{sector === 'MEDICAL' ? 'dr.bensalem@cabinet-ai.tn' : 'me.trabelsi@avocats-tunis.tn'}</b></span>
          </div>
          
          <div className="hidden sm:flex items-center gap-1.5 text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-lg border border-amber-200/80">
            <Coffee className="w-3.5 h-3.5 text-amber-600" />
            <span className="font-semibold text-[11px]">Pause Déjeuner : 12:30 - 14:00</span>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 text-blue-800 bg-blue-50 px-2.5 py-0.5 rounded-lg border border-blue-200/80">
            <Bot className="w-3.5 h-3.5 text-blue-600" />
            <span className="font-semibold text-[11px]">IA Synchronisée ({availabilitySettings.consultationDuration} min)</span>
          </div>
        </div>

        <span className="text-[11px] text-slate-400 font-mono shrink-0">Dernière synchronisation : Il y a 1 min</span>
      </div>

      {/* Calendar Grid (Week View) */}
      <div className="bg-white rounded-2xl border border-[#E5EAF2] shadow-xs overflow-x-auto">
        <div className="min-w-[750px]">
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
                  const slotStatus = isSlotAvailable(d.date, slot);

                  // Is lunch break slot?
                  const isLunchBreak = slotStatus.reason?.includes('Pause Déjeuner') || (slot >= '12:30' && slot < '14:00');

                  return (
                    <div 
                      key={`${d.date}-${slot}`} 
                      className={`p-1.5 border-r border-[#E5EAF2] last:border-r-0 transition-colors relative ${
                        d.date === '2026-11-03' ? 'bg-blue-50/10' : ''
                      }`}
                    >
                      {apt ? (
                        <div 
                          onClick={() => openAptDetails(apt)}
                          className="h-full p-2 rounded-lg bg-blue-100/80 hover:bg-blue-200/90 border border-blue-200 text-blue-900 flex flex-col justify-between shadow-xs cursor-pointer transition-all"
                        >
                          <div className="font-bold truncate text-[11px]">{apt.patientName}</div>
                          <div className="text-[10px] text-blue-700 truncate">{apt.serviceName}</div>
                          <div className="text-[9px] text-slate-500 font-mono flex items-center justify-between mt-1">
                            <span>{apt.timeStart} - {apt.timeEnd}</span>
                            <span className="text-emerald-700 font-bold">Google Synced</span>
                          </div>
                        </div>
                      ) : isLunchBreak ? (
                        <div className="h-full p-2 rounded-lg bg-amber-50/60 border border-amber-200/50 text-amber-800 flex items-center justify-center gap-1.5 shadow-2xs select-none">
                          <Coffee className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          <span className="text-[10px] font-semibold text-amber-900">Pause Déjeuner</span>
                        </div>
                      ) : !slotStatus.available ? (
                        <div className="h-full p-2 rounded-lg bg-slate-50 border border-slate-200/60 text-slate-400 flex items-center justify-center text-[10px] italic">
                          Indisponible
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

      {/* Appointment Detail / Edit Modal */}
      {selectedApt && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[#E8EDF4] shadow-2xl w-full max-w-md p-6 animate-in fade-in zoom-in-95 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-sm font-bold text-[#14213D] flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-[#2563EB]" />
                {isEditingSelected ? 'Modifier Rendez-vous' : 'Détails du Rendez-vous'}
              </h2>
              <button 
                onClick={() => setSelectedApt(null)}
                className="p-1 hover:bg-slate-100 rounded-lg text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {isEditingSelected ? (
              <form onSubmit={handleSaveEdit} className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={editDate}
                    onChange={e => setEditDate(e.target.value)}
                    className="w-full p-2 border border-[#E8EDF4] rounded-xl text-xs bg-[#F7F9FC]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Créneau Horaire</label>
                  <select
                    value={editTime}
                    onChange={e => setEditTime(e.target.value)}
                    className="w-full p-2 border border-[#E8EDF4] rounded-xl text-xs bg-[#F7F9FC]"
                  >
                    {hours.filter(h => !(h >= '12:30' && h < '14:00')).map(h => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Motif / Prestation</label>
                  <input
                    type="text"
                    required
                    value={editService}
                    onChange={e => setEditService(e.target.value)}
                    className="w-full p-2 border border-[#E8EDF4] rounded-xl text-xs bg-[#F7F9FC]"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t">
                  <button
                    type="button"
                    onClick={() => setIsEditingSelected(false)}
                    className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-xl"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-[#2563EB] text-white font-bold rounded-xl hover:bg-[#1d4ed8]"
                  >
                    Sauvegarder
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4 text-xs">
                <div className="p-3 bg-[#F7F9FC] rounded-xl border border-slate-100 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-[#14213D]">{selectedApt.patientName}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      selectedApt.status === 'CONFIRMED' ? 'bg-emerald-50 text-emerald-700' : 
                      selectedApt.status === 'CANCELLED' ? 'bg-rose-50 text-rose-700' : 'bg-blue-50 text-blue-700'
                    }`}>
                      {selectedApt.status}
                    </span>
                  </div>
                  <div className="text-slate-600">{selectedApt.serviceName}</div>
                  <div className="flex items-center gap-2 text-slate-500 font-mono text-[11px]">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{selectedApt.date} à {selectedApt.timeStart} ({selectedApt.durationMinutes} min)</span>
                  </div>
                </div>

                <div className="space-y-2 text-slate-600">
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{selectedApt.patientPhone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span>{selectedApt.patientEmail}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700 font-semibold">Synchronisé Google Calendar & Rappel SMS planifié</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                  <button
                    onClick={() => handleDeleteApt(selectedApt.id)}
                    className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg flex items-center gap-1 font-semibold text-[11px]"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Supprimer
                  </button>

                  <div className="flex items-center gap-2">
                    {selectedApt.status !== 'CANCELLED' && (
                      <button
                        onClick={() => handleCancelApt(selectedApt.id)}
                        className="px-3 py-1.5 text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-xl font-bold text-xs"
                      >
                        Annuler RDV
                      </button>
                    )}
                    <button
                      onClick={() => setIsEditingSelected(true)}
                      className="px-3 py-1.5 bg-[#2563EB] text-white hover:bg-[#1d4ed8] rounded-xl font-bold text-xs flex items-center gap-1"
                    >
                      <Edit2 className="w-3.5 h-3.5" /> Modifier
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Appointment Modal with Collision Check */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95">
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
                    {hours.filter(h => !(h >= '12:30' && h < '14:00')).map(h => (
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
                <span className="text-[11px] text-slate-400">
                  Durée automatique : {availabilitySettings.consultationDuration} min
                </span>
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
