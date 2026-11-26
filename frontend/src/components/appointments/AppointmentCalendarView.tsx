import React, { useState, useEffect, useMemo } from 'react';
import { apiGetGoogleStatus } from '../../services/apiClient';

// Dates locales (pas d'UTC : évite le décalage d'un jour le soir)
const toISO = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const fromISO = (iso: string) => { const [y, m, d] = iso.split('-').map(Number); return new Date(y, m - 1, d); };
const addDaysISO = (iso: string, n: number) => { const d = fromISO(iso); d.setDate(d.getDate() + n); return toISO(d); };
const DAY_NAMES = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
const MONTHS_FR = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
const longDate = (iso: string) => { const d = fromISO(iso); return `${DAY_NAMES[d.getDay()]} ${d.getDate()} ${MONTHS_FR[d.getMonth()]} ${d.getFullYear()}`; };
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
    availabilitySettings,
    isSlotAvailable,
    showToast,
    currentUser,
    loadAppointments
  } = useAppStore();

  const todayISO = toISO(new Date());
  const [anchorDate, setAnchorDate] = useState<string>(todayISO);
  const [calendarInfo, setCalendarInfo] = useState<{ connected: boolean; email: string }>({ connected: false, email: '' });
  const [refreshedAt, setRefreshedAt] = useState<Date | null>(null);

  useEffect(() => {
    loadAppointments().then(() => setRefreshedAt(new Date()));
    apiGetGoogleStatus().then((st) => setCalendarInfo({ connected: Boolean(st?.connected), email: st?.email || '' })).catch(() => {});
  }, []);

  const [selectedView, setSelectedView] = useState<'WEEK' | 'DAY' | 'MONTH'>('WEEK');
  const [showModal, setShowModal] = useState(false);
  const [selectedApt, setSelectedApt] = useState<AppointmentItem | null>(null);
  const [isEditingSelected, setIsEditingSelected] = useState(false);

  // New Appointment Form State
  const [patientName, setPatientName] = useState('');
  const [patientPhone, setPatientPhone] = useState('+216 ');
  const [patientEmail, setPatientEmail] = useState('');
  const [aptDate, setAptDate] = useState(toISO(new Date()));
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

  // Semaine (lundi → vendredi) contenant la date affichée
  const weekDays = useMemo(() => {
    const d = fromISO(anchorDate);
    const monday = addDaysISO(anchorDate, -((d.getDay() + 6) % 7));
    return [0, 1, 2, 3, 4].map((i) => {
      const date = addDaysISO(monday, i);
      return { name: DAY_NAMES[fromISO(date).getDay()] + (date === todayISO ? ' (Aujourd’hui)' : ''), date };
    });
  }, [anchorDate, todayISO]);

  const navigate = (direction: -1 | 1) => {
    const step = selectedView === 'DAY' ? 1 : selectedView === 'WEEK' ? 7 : 0;
    if (step) return setAnchorDate(addDaysISO(anchorDate, direction * step));
    const d = fromISO(anchorDate);
    setAnchorDate(toISO(new Date(d.getFullYear(), d.getMonth() + direction, 1)));
  };
  const periodLabel = selectedView === 'DAY'
    ? longDate(anchorDate)
    : selectedView === 'WEEK'
      ? `Semaine du ${fromISO(weekDays[0].date).getDate()} au ${longDate(weekDays[4].date).split(' ').slice(1).join(' ')}`
      : `${MONTHS_FR[fromISO(anchorDate).getMonth()]} ${fromISO(anchorDate).getFullYear()}`;

  const handleCheckAndSave = async (e: React.FormEvent) => {
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
      practitionerName: currentUser?.name || '',
      serviceName: aptService,
      date: aptDate,
      timeStart: aptTime,
      timeEnd: `${endH}:${endM}`,
      durationMinutes: duration,
      status: 'SCHEDULED',
      reminderSent24h: false,
      googleCalendarSynced: false
    };

    const result = await addAppointment(newApt);
    if (!result.success) {
      setCollisionWarning(result.error || 'Ce créneau n’est pas disponible.');
      return;
    }
    showToast({
      title: 'Rendez-vous enregistré',
      message: `${patientName} — ${longDate(aptDate)} à ${aptTime} (${duration} min).`,
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

  const handleSaveEdit = async (e: React.FormEvent) => {
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

    if (editTime !== selectedApt.timeStart || editDate !== selectedApt.date || editService !== selectedApt.serviceName) {
      const [eh, em] = editTime.split(':').map(Number);
      const endM = eh * 60 + em + (selectedApt.durationMinutes || 30);
      const moved = await addAppointment({
        ...selectedApt,
        date: editDate,
        timeStart: editTime,
        timeEnd: `${String(Math.floor(endM / 60)).padStart(2, '0')}:${String(endM % 60).padStart(2, '0')}`,
        serviceName: editService
      });
      if (!moved.success) return;
      await cancelAppointment(selectedApt.id);
      await loadAppointments();
    }

    setSelectedApt({
      ...selectedApt,
      date: editDate,
      timeStart: editTime,
      serviceName: editService
    });

    setIsEditingSelected(false);
    showToast({
      title: 'Rendez-vous modifié',
      message: `Le rendez-vous de ${selectedApt.patientName} est déplacé au ${longDate(editDate)} à ${editTime}.`,
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
      message: 'Le créneau est de nouveau disponible.',
      type: 'warning'
    });
  };


  return (
    <div className="space-y-6 font-sans">
      {/* Header controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-[#14213D] tracking-tight">Agenda & Prise de Rendez-vous</h1>
          <p className="text-xs text-slate-500">{periodLabel}</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="p-1 bg-white border border-[#E5EAF2] rounded-xl flex items-center text-xs font-bold text-slate-600 shadow-xs">
            <button onClick={() => navigate(-1)} className="px-2.5 py-1.5 rounded-lg hover:bg-slate-100" aria-label="Période précédente">‹</button>
            <button onClick={() => setAnchorDate(todayISO)} className="px-3 py-1.5 rounded-lg hover:bg-slate-100">Aujourd’hui</button>
            <button onClick={() => navigate(1)} className="px-2.5 py-1.5 rounded-lg hover:bg-slate-100" aria-label="Période suivante">›</button>
          </div>
          <div className="p-1 bg-white border border-[#E5EAF2] rounded-xl flex items-center text-xs font-bold text-slate-600 shadow-xs">
            <button
              onClick={() => setSelectedView('DAY')}
              className={`px-3 py-1.5 rounded-lg transition-all ${selectedView === 'DAY' ? 'bg-[#2563EB] text-white shadow-2xs' : 'hover:text-slate-900'}`}
            >
              Jour
            </button>
            <button
              onClick={() => setSelectedView('WEEK')}
              className={`px-3 py-1.5 rounded-lg transition-all ${selectedView === 'WEEK' ? 'bg-[#2563EB] text-white shadow-2xs' : 'hover:text-slate-900'}`}
            >
              Semaine
            </button>
            <button
              onClick={() => setSelectedView('MONTH')}
              className={`px-3 py-1.5 rounded-lg transition-all ${selectedView === 'MONTH' ? 'bg-[#2563EB] text-white shadow-2xs' : 'hover:text-slate-900'}`}
            >
              Mois
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
            <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${calendarInfo.connected ? 'bg-emerald-500' : 'bg-slate-300'}`}></span>
            <span className="truncate">Google Calendar : <b>{calendarInfo.connected ? calendarInfo.email : 'non connecté (agenda interne)'}</b></span>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-lg border border-amber-200/80">
            <Coffee className="w-3.5 h-3.5 text-amber-600" />
            <span className="font-semibold text-[11px]">Pause Déjeuner : 12:30 - 14:00</span>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 text-blue-800 bg-blue-50 px-2.5 py-0.5 rounded-lg border border-blue-200/80">
            <Bot className="w-3.5 h-3.5 text-blue-600" />
            <span className="font-semibold text-[11px]">Consultations de {availabilitySettings.consultationDuration} min</span>
          </div>
        </div>

        <button onClick={() => loadAppointments().then(() => setRefreshedAt(new Date()))} className="text-[11px] text-slate-500 hover:text-blue-600 font-mono shrink-0">
          {refreshedAt ? `Actualisé à ${refreshedAt.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} ↻` : 'Chargement…'}
        </button>
      </div>

      {/* Calendar Grid (Week View, Day View, Month View) */}
      {selectedView === 'WEEK' && (
        <div className="bg-white rounded-2xl border border-[#E5EAF2] shadow-xs overflow-x-auto">
          <div className="min-w-[750px]">
            {/* Days Header */}
            <div className="grid grid-cols-6 border-b border-[#E5EAF2] bg-[#F7F9FC] text-center text-xs font-bold text-slate-700">
              <div className="p-3 border-r border-[#E5EAF2] text-slate-400">Créneau</div>
              {weekDays.map(d => (
                <div key={d.date} className={`p-3 border-r border-[#E5EAF2] last:border-r-0 ${d.date === todayISO ? 'bg-blue-50/60 text-blue-700' : ''}`}>
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
                          d.date === todayISO ? 'bg-blue-50/10' : ''
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
                              {apt.googleCalendarSynced && <span className="text-emerald-700 font-bold">Google ✓</span>}
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
      )}

      {/* Day View */}
      {selectedView === 'DAY' && (
        <div className="bg-white rounded-2xl border border-[#E5EAF2] shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-[#E5EAF2] pb-3">
            <div>
              <h2 className="text-base font-bold text-[#14213D]">Planning — {longDate(anchorDate)}</h2>
              <p className="text-xs text-slate-500">Vue horaire détaillée avec contacts patients et pauses</p>
            </div>
            {anchorDate === todayISO && (
              <span className="text-xs font-bold text-[#2563EB] bg-blue-50 px-3 py-1 rounded-full border border-blue-200">Aujourd'hui</span>
            )}
          </div>

          <div className="divide-y divide-slate-100">
            {hours.map(slot => {
              const apt = appointments.find(a => a.date === anchorDate && a.timeStart === slot && a.status !== 'CANCELLED');
              const dayStatus = isSlotAvailable(anchorDate, slot);
              const isLunch = slot >= '12:30' && slot < '14:00';

              return (
                <div key={slot} className="py-2.5 flex items-center gap-4 text-xs">
                  <span className="w-16 font-mono font-bold text-slate-400 text-right">{slot}</span>

                  <div className="flex-1">
                    {apt ? (
                      <div
                        onClick={() => openAptDetails(apt)}
                        className="p-3 bg-blue-50 hover:bg-blue-100/70 border border-blue-200 rounded-xl cursor-pointer transition-colors flex items-center justify-between"
                      >
                        <div>
                          <div className="font-bold text-[#14213D] text-sm">{apt.patientName}</div>
                          <div className="text-slate-600 text-xs">{apt.serviceName} • {apt.patientPhone}</div>
                        </div>
                        <div className="text-right">
                          {apt.googleCalendarSynced && (
                            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">Google ✓</span>
                          )}
                        </div>
                      </div>
                    ) : !isLunch && !dayStatus.available ? (
                      <div className="p-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-400 italic">{dayStatus.reason}</div>
                    ) : isLunch ? (
                      <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl text-amber-900 flex items-center gap-2">
                        <Coffee className="w-4 h-4 text-amber-600" />
                        <span className="font-bold">Pause Déjeuner Protégée du Cabinet</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between p-2 rounded-xl border border-dashed border-slate-200 hover:border-blue-300 transition-colors">
                        <span className="text-slate-400 italic">Créneau disponible ({availabilitySettings.consultationDuration} min)</span>
                        <button
                          onClick={() => {
                            setAptDate(anchorDate);
                            setAptTime(slot);
                            setCollisionWarning(null);
                            setShowModal(true);
                          }}
                          className="px-2.5 py-1 text-[11px] font-bold text-[#2563EB] hover:bg-blue-50 rounded-lg"
                        >
                          + Réserver
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Month View */}
      {selectedView === 'MONTH' && (
        <div className="bg-white rounded-2xl border border-[#E5EAF2] shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-[#E5EAF2] pb-3">
            <div>
              <h2 className="text-base font-bold text-[#14213D]">Vue mensuelle — {periodLabel}</h2>
              <p className="text-xs text-slate-500">Cliquez sur un jour pour ouvrir son planning</p>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-2">
            {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(day => (
              <div key={day} className="text-center font-bold text-xs text-slate-500 py-1.5 bg-[#F7F9FC] rounded-lg">
                {day}
              </div>
            ))}

            {Array.from({ length: (fromISO(anchorDate.slice(0, 8) + '01').getDay() + 6) % 7 }, (_, i) => (
              <div key={`blank-${i}`} />
            ))}
            {Array.from({ length: new Date(fromISO(anchorDate).getFullYear(), fromISO(anchorDate).getMonth() + 1, 0).getDate() }, (_, i) => {
              const dayNum = i + 1;
              const dateStr = `${anchorDate.slice(0, 8)}${dayNum.toString().padStart(2, '0')}`;
              const dayApts = appointments.filter(a => a.date === dateStr && a.status !== 'CANCELLED');
              const isToday = dateStr === todayISO;

              return (
                <div
                  key={dayNum}
                  onClick={() => {
                    setAnchorDate(dateStr);
                    setSelectedView('DAY');
                  }}
                  className={`min-h-[72px] p-2 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                    isToday
                      ? 'border-[#2563EB] bg-blue-50/50 shadow-xs ring-1 ring-[#2563EB]'
                      : 'border-[#E8EDF4] hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-bold ${isToday ? 'text-[#2563EB]' : 'text-slate-800'}`}>
                      {dayNum}
                    </span>
                    {dayApts.length > 0 && (
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    )}
                  </div>

                  <div className="space-y-1">
                    {dayApts.slice(0, 1).map(a => (
                      <div key={a.id} className="text-[9px] bg-blue-100 text-blue-900 px-1 py-0.5 rounded truncate font-medium">
                        {a.timeStart} {a.patientName.split(' ')[0]}
                      </div>
                    ))}
                    {dayApts.length > 1 && (
                      <div className="text-[8px] text-slate-500 font-bold">
                        +{dayApts.length - 1} autre(s)
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

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
                    <ShieldCheck className={`w-3.5 h-3.5 ${selectedApt.googleCalendarSynced ? 'text-emerald-600' : 'text-slate-400'}`} />
                    <span className={selectedApt.googleCalendarSynced ? 'text-emerald-700 font-semibold' : 'text-slate-500'}>
                      {selectedApt.googleCalendarSynced ? 'Synchronisé avec Google Calendar' : 'Agenda interne uniquement'}
                      {selectedApt.reminderSent24h ? ' • Rappel envoyé' : ' • Rappel e-mail la veille à 08h00'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                  <span className="text-[11px] text-slate-400">{selectedApt.practitionerName}</span>

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
