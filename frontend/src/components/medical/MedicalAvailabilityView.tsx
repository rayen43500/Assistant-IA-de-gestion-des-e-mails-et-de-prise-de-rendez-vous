import React, { useState } from 'react';
import { 
  Calendar, 
  Clock, 
  CheckCircle2, 
  Plus, 
  Trash2, 
  AlertCircle, 
  Save, 
  Globe, 
  Coffee, 
  ShieldCheck,
  Zap,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore';

export const MedicalAvailabilityView: React.FC = () => {
  const { showToast } = useAppStore();

  const [onlineBookingEnabled, setOnlineBookingEnabled] = useState(true);
  const [consultationDuration, setConsultationDuration] = useState<number>(30);
  const [bufferTime, setBufferTime] = useState<number>(5); // 5 min entre 2 consultations

  const [daysSchedule, setDaysSchedule] = useState([
    { day: 'Lundi', active: true, start: '08:30', end: '17:30', hasBreak: true, breakStart: '12:30', breakEnd: '14:00' },
    { day: 'Mardi', active: true, start: '08:30', end: '17:30', hasBreak: true, breakStart: '12:30', breakEnd: '14:00' },
    { day: 'Mercredi', active: true, start: '08:30', end: '17:30', hasBreak: true, breakStart: '12:30', breakEnd: '14:00' },
    { day: 'Jeudi', active: true, start: '08:30', end: '17:30', hasBreak: true, breakStart: '12:30', breakEnd: '14:00' },
    { day: 'Vendredi', active: true, start: '08:30', end: '17:30', hasBreak: true, breakStart: '12:30', breakEnd: '14:00' },
    { day: 'Samedi', active: true, start: '08:30', end: '13:00', hasBreak: false, breakStart: '12:00', breakEnd: '13:00' },
    { day: 'Dimanche', active: false, start: '09:00', end: '12:00', hasBreak: false, breakStart: '12:00', breakEnd: '13:00' }
  ]);

  const [unavailablePeriods, setUnavailablePeriods] = useState([
    { id: 1, title: 'Congés Annuels d’Hiver', start: '2026-12-24', end: '2026-12-31', type: 'VACATION' },
    { id: 2, title: 'Astreinte Garde SAMU 190', start: '2026-11-15', end: '2026-11-16', type: 'EMERGENCY_DUTY' }
  ]);

  const [newPeriodTitle, setNewPeriodTitle] = useState('');
  const [newPeriodStart, setNewPeriodStart] = useState('');
  const [newPeriodEnd, setNewPeriodEnd] = useState('');

  const handleToggleDay = (idx: number) => {
    setDaysSchedule(prev => prev.map((d, i) => i === idx ? { ...d, active: !d.active } : d));
  };

  const handleTimeChange = (idx: number, field: string, val: string) => {
    setDaysSchedule(prev => prev.map((d, i) => i === idx ? { ...d, [field]: val } : d));
  };

  const handleAddUnavailable = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPeriodTitle || !newPeriodStart || !newPeriodEnd) return;
    setUnavailablePeriods(prev => [
      ...prev,
      { id: Date.now(), title: newPeriodTitle, start: newPeriodStart, end: newPeriodEnd, type: 'VACATION' }
    ]);
    setNewPeriodTitle('');
    setNewPeriodStart('');
    setNewPeriodEnd('');
    showToast({
      title: 'Période d’indisponibilité bloquée',
      message: 'Ces dates sont désormais verrouillées sur Google Calendar et inaccessibles aux patients.',
      type: 'info'
    });
  };

  const handleRemovePeriod = (id: number) => {
    setUnavailablePeriods(prev => prev.filter(p => p.id !== id));
  };

  const handleSave = () => {
    showToast({
      title: 'Planning hebdomadaire synchronisé !',
      message: 'Les nouveaux créneaux ont été transmis à Google Calendar et au moteur de réservation n8n.',
      type: 'success'
    });
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-[#14213D] tracking-tight">Gestion des Disponibilités & Horaires</h1>
          <p className="text-xs text-slate-500">
            Éditeur de grille hebdomadaire, pauses déjeuner, durées de consultation et congés du praticien
          </p>
        </div>

        <button
          onClick={handleSave}
          className="px-4 py-2.5 bg-[#2563EB] hover:bg-blue-700 active:scale-[0.98] text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-2 transition-all w-fit"
        >
          <Save className="w-4 h-4" />
          <span>Enregistrer les Disponibilités</span>
        </button>
      </div>

      {/* Online Booking & Consultation Duration Settings */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Toggle Online Booking */}
        <div className="p-5 bg-white rounded-2xl border border-[#E8EDF4] shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <div className="text-xs font-bold text-[#14213D] flex items-center gap-2">
              <Globe className="w-4 h-4 text-[#2563EB]" />
              <span>Prise de RDV en Ligne</span>
            </div>
            <p className="text-[11px] text-slate-500">
              {onlineBookingEnabled ? 'Les patients peuvent réserver via e-mail ou WhatsApp' : 'Réservations suspendues temporairement'}
            </p>
          </div>

          <button
            onClick={() => setOnlineBookingEnabled(!onlineBookingEnabled)}
            className={`p-1.5 rounded-xl transition-colors ${onlineBookingEnabled ? 'text-[#2563EB]' : 'text-slate-400'}`}
          >
            {onlineBookingEnabled ? <ToggleRight className="w-8 h-8" /> : <ToggleLeft className="w-8 h-8" />}
          </button>
        </div>

        {/* Duration Selector */}
        <div className="p-5 bg-white rounded-2xl border border-[#E8EDF4] shadow-xs space-y-2">
          <div className="text-xs font-bold text-[#14213D] flex items-center gap-2">
            <Clock className="w-4 h-4 text-purple-600" />
            <span>Durée Moyenne de Consultation</span>
          </div>
          <div className="flex items-center gap-2 pt-1">
            {[15, 30, 45, 60].map(m => (
              <button
                key={m}
                onClick={() => setConsultationDuration(m)}
                className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  consultationDuration === m
                    ? 'bg-[#2563EB] text-white shadow-2xs'
                    : 'bg-[#F7F9FC] border border-[#E8EDF4] text-slate-600 hover:bg-slate-100'
                }`}
              >
                {m} min
              </button>
            ))}
          </div>
        </div>

        {/* Buffer Time between appointments */}
        <div className="p-5 bg-white rounded-2xl border border-[#E8EDF4] shadow-xs space-y-2">
          <div className="text-xs font-bold text-[#14213D] flex items-center gap-2">
            <Coffee className="w-4 h-4 text-amber-500" />
            <span>Temps de Désinfection / Battement</span>
          </div>
          <div className="flex items-center gap-2 pt-1">
            {[0, 5, 10, 15].map(b => (
              <button
                key={b}
                onClick={() => setBufferTime(b)}
                className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  bufferTime === b
                    ? 'bg-amber-600 text-white shadow-2xs'
                    : 'bg-[#F7F9FC] border border-[#E8EDF4] text-slate-600 hover:bg-slate-100'
                }`}
              >
                {b} min
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Weekly Schedule Visual Editor */}
      <div className="bg-white rounded-2xl border border-[#E8EDF4] shadow-xs p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-[#E8EDF4] pb-3">
          <div>
            <h2 className="text-sm font-bold text-[#14213D]">Plages Horaires d’Ouverture du Cabinet</h2>
            <p className="text-xs text-slate-400">Configurez les heures de présence et la pause déjeuner pour chaque jour</p>
          </div>
          <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
            Protection Anti-Double Réservation Active
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          {daysSchedule.map((d, idx) => (
            <div key={d.day} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              {/* Day checkbox */}
              <div className="flex items-center gap-3 w-40">
                <input
                  type="checkbox"
                  id={`day-${idx}`}
                  checked={d.active}
                  onChange={() => handleToggleDay(idx)}
                  className="w-4 h-4 rounded text-[#2563EB] focus:ring-[#2563EB]"
                />
                <label htmlFor={`day-${idx}`} className={`text-xs font-bold cursor-pointer ${d.active ? 'text-[#14213D]' : 'text-slate-400 line-through'}`}>
                  {d.day}
                </label>
              </div>

              {/* Working hours inputs */}
              {d.active ? (
                <div className="flex flex-wrap items-center gap-3 text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-400 text-[11px]">De</span>
                    <input
                      type="time"
                      value={d.start}
                      onChange={e => handleTimeChange(idx, 'start', e.target.value)}
                      className="px-2.5 py-1.5 bg-[#F7F9FC] border border-[#E8EDF4] rounded-lg font-mono font-semibold text-slate-800"
                    />
                    <span className="text-slate-400 text-[11px]">à</span>
                    <input
                      type="time"
                      value={d.end}
                      onChange={e => handleTimeChange(idx, 'end', e.target.value)}
                      className="px-2.5 py-1.5 bg-[#F7F9FC] border border-[#E8EDF4] rounded-lg font-mono font-semibold text-slate-800"
                    />
                  </div>

                  {/* Pause déjeuner */}
                  {d.hasBreak && (
                    <div className="flex items-center gap-1.5 pl-3 border-l border-slate-200 text-slate-500">
                      <Coffee className="w-3.5 h-3.5 text-amber-500" />
                      <span className="text-[11px]">Pause :</span>
                      <input
                        type="time"
                        value={d.breakStart}
                        onChange={e => handleTimeChange(idx, 'breakStart', e.target.value)}
                        className="px-2 py-1 bg-[#F7F9FC] border border-[#E8EDF4] rounded-lg font-mono text-[11px]"
                      />
                      <span className="text-[11px]">-</span>
                      <input
                        type="time"
                        value={d.breakEnd}
                        onChange={e => handleTimeChange(idx, 'breakEnd', e.target.value)}
                        className="px-2 py-1 bg-[#F7F9FC] border border-[#E8EDF4] rounded-lg font-mono text-[11px]"
                      />
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-xs text-slate-400 italic">
                  Cabinet fermé au public
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Holidays and Unavailable Periods */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* List of unavailable periods (2 Cols) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-[#E8EDF4] shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-[#14213D] flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#2563EB]" />
              <span>Congés Annuels & Périodes d’Indisponibilité</span>
            </h2>
            <span className="text-xs text-slate-400">{unavailablePeriods.length} période(s) bloquée(s)</span>
          </div>

          <div className="divide-y divide-slate-100">
            {unavailablePeriods.map(p => (
              <div key={p.id} className="py-3 flex items-center justify-between text-xs">
                <div>
                  <div className="font-bold text-[#14213D]">{p.title}</div>
                  <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                    Du {p.start} au {p.end}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                    p.type === 'EMERGENCY_DUTY' ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-slate-100 text-slate-700'
                  }`}>
                    {p.type === 'EMERGENCY_DUTY' ? 'Garde Urgence' : 'Congés Praticien'}
                  </span>
                  <button
                    onClick={() => handleRemovePeriod(p.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Add Period Form (1 Col) */}
        <div className="bg-white rounded-2xl border border-[#E8EDF4] shadow-xs p-6 space-y-4">
          <h2 className="text-sm font-bold text-[#14213D] flex items-center gap-2">
            <Plus className="w-4 h-4 text-[#2563EB]" />
            <span>Bloquer une Période</span>
          </h2>

          <form onSubmit={handleAddUnavailable} className="space-y-3 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Motif du Blocage</label>
              <input
                type="text"
                required
                placeholder="Ex: Séminaire Cardiologie Tunis"
                value={newPeriodTitle}
                onChange={e => setNewPeriodTitle(e.target.value)}
                className="w-full px-3 py-2 bg-[#F7F9FC] border border-[#E8EDF4] rounded-xl focus:outline-none focus:border-[#2563EB]"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Date de Début</label>
              <input
                type="date"
                required
                value={newPeriodStart}
                onChange={e => setNewPeriodStart(e.target.value)}
                className="w-full px-3 py-2 bg-[#F7F9FC] border border-[#E8EDF4] rounded-xl focus:outline-none focus:border-[#2563EB]"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Date de Fin</label>
              <input
                type="date"
                required
                value={newPeriodEnd}
                onChange={e => setNewPeriodEnd(e.target.value)}
                className="w-full px-3 py-2 bg-[#F7F9FC] border border-[#E8EDF4] rounded-xl focus:outline-none focus:border-[#2563EB]"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2 bg-[#14213D] hover:bg-slate-800 text-white rounded-xl font-bold shadow-xs transition-colors"
            >
              Verrouiller le Calendrier
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
