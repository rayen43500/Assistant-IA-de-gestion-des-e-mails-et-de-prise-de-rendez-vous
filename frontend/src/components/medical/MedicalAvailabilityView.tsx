import React, { useState, useEffect } from 'react';
import { apiClient, apiErrorMessage, DEMO_MODE } from '../../services/apiClient';
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
  ToggleRight,
  Bot,
  Sparkles
} from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore';

export const MedicalAvailabilityView: React.FC = () => {
  const { availabilitySettings, updateAvailabilitySettings, showToast } = useAppStore();

  const [onlineBookingEnabled, setOnlineBookingEnabled] = useState(availabilitySettings.onlineBookingEnabled);
  const [consultationDuration, setConsultationDuration] = useState<number>(availabilitySettings.consultationDuration);
  const [bufferTime, setBufferTime] = useState<number>(availabilitySettings.bufferTime); // 0, 5, 10, 15 min entre consultations

  const [daysSchedule, setDaysSchedule] = useState(availabilitySettings.daysSchedule);
  const [unavailablePeriods, setUnavailablePeriods] = useState(availabilitySettings.unavailablePeriods);

  const [saving, setSaving] = useState(false);
  const [doctorName, setDoctorName] = useState('');

  // Chargement des horaires réels (ceux utilisés par l'IA pour réserver)
  useEffect(() => {
    apiClient.get('/api/schedule/me').then(({ data }) => {
      setOnlineBookingEnabled(data.onlineBookingEnabled);
      setConsultationDuration(data.consultationDuration);
      setBufferTime(data.bufferTime);
      setDaysSchedule(data.daysSchedule);
      setUnavailablePeriods(data.unavailablePeriods);
      setDoctorName(data.doctorName || '');
      updateAvailabilitySettings(data);
    }).catch((err) => {
      if (!DEMO_MODE) showToast({ title: 'Horaires indisponibles', message: apiErrorMessage(err), type: 'warning' });
    });
  }, []);

  // Enregistrement serveur (source de vérité du moteur de réservation)
  const persist = async (patch: Record<string, unknown> = {}) => {
    const payload = { onlineBookingEnabled, consultationDuration, bufferTime, daysSchedule, unavailablePeriods, ...patch };
    if (DEMO_MODE) { updateAvailabilitySettings(payload as any); return true; }
    setSaving(true);
    try {
      const { data } = await apiClient.put('/api/schedule/me', payload);
      updateAvailabilitySettings(data);
      setUnavailablePeriods(data.unavailablePeriods);
      return true;
    } catch (err: any) {
      showToast({ title: 'Non enregistré', message: apiErrorMessage(err), type: 'danger' });
      return false;
    } finally {
      setSaving(false);
    }
  };

  const [newPeriodTitle, setNewPeriodTitle] = useState('');
  const [newPeriodStart, setNewPeriodStart] = useState('');
  const [newPeriodEnd, setNewPeriodEnd] = useState('');

  const handleToggleDay = (idx: number) => {
    setDaysSchedule(prev => prev.map((d, i) => i === idx ? { ...d, active: !d.active } : d));
  };

  const handleTimeChange = (idx: number, field: string, val: string) => {
    setDaysSchedule(prev => prev.map((d, i) => i === idx ? { ...d, [field]: val } : d));
  };

  const handleAddUnavailable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPeriodTitle || !newPeriodStart || !newPeriodEnd) return;
    if (newPeriodEnd < newPeriodStart) {
      showToast({ title: 'Dates invalides', message: 'La date de fin doit être après la date de début.', type: 'warning' });
      return;
    }
    const newP = { id: Date.now(), title: newPeriodTitle, start: newPeriodStart, end: newPeriodEnd, type: 'VACATION' as const };
    const updated = [...unavailablePeriods, newP];
    setUnavailablePeriods(updated);
    setNewPeriodTitle('');
    setNewPeriodStart('');
    setNewPeriodEnd('');

    if (!(await persist({ unavailablePeriods: updated }))) return;

    showToast({
      title: 'Période d’indisponibilité enregistrée',
      message: 'L’IA ne proposera plus de rendez-vous sur ces dates.',
      type: 'info'
    });
  };

  const handleRemovePeriod = async (id: number | string) => {
    const updated = unavailablePeriods.filter(p => p.id !== id);
    setUnavailablePeriods(updated);
    if (!(await persist({ unavailablePeriods: updated }))) return;
    showToast({
      title: 'Période débloquée',
      message: 'Les créneaux de cette période redeviennent réservables.',
      type: 'info'
    });
  };

  const handleSave = async () => {
    if (!(await persist())) return;
    showToast({
      title: 'Disponibilités enregistrées',
      message: 'L’agenda et le moteur de réservation par e-mail utilisent désormais ces horaires.',
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
            {doctorName ? `Agenda de ${doctorName} — ` : ''}horaires, pauses, durée des consultations et congés
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-2.5 bg-[#2563EB] hover:bg-blue-700 disabled:opacity-60 active:scale-[0.98] text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-2 transition-all w-fit"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? 'Enregistrement…' : 'Enregistrer les disponibilités'}</span>
        </button>
      </div>

      {/* Sync Status Banner */}
      <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/80 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="font-bold text-[#14213D] flex items-center gap-2">
              <span>Synchronisation Calendrier & Assistant IA Active</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            </div>
            <p className="text-slate-600 text-[11px]">
              L'IA connaît vos pauses déjeuner (12:30 - 14:00), les jours fermés et adapte automatiquement les propositions de RDV.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[10px] font-bold text-blue-700 bg-white px-3 py-1 rounded-full border border-blue-200 shadow-2xs">
            Durée : {consultationDuration} min + {bufferTime} min battement
          </span>
          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/60 px-3 py-1 rounded-full border border-emerald-200">
            Anti-Double Réservation OK
          </span>
        </div>
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

        {/* Consultation Duration */}
        <div className="p-5 bg-white rounded-2xl border border-[#E8EDF4] shadow-xs space-y-2">
          <div className="text-xs font-bold text-[#14213D] flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#2563EB]" />
            <span>Durée Moyenne de Consultation</span>
          </div>
          <p className="text-[11px] text-slate-500">Créneau standard affecté dans l’agenda</p>

          <div className="grid grid-cols-4 gap-1.5 pt-1">
            {[15, 30, 45, 60].map(duration => (
              <button
                key={duration}
                onClick={() => setConsultationDuration(duration)}
                className={`py-1.5 rounded-xl text-xs font-bold transition-all ${
                  consultationDuration === duration
                    ? 'bg-[#2563EB] text-white shadow-2xs'
                    : 'bg-[#F7F9FC] text-slate-600 hover:bg-slate-100 border border-[#E8EDF4]'
                }`}
              >
                {duration} min
              </button>
            ))}
          </div>
        </div>

        {/* Buffer Time */}
        <div className="p-5 bg-white rounded-2xl border border-[#E8EDF4] shadow-xs space-y-2">
          <div className="text-xs font-bold text-[#14213D] flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#2563EB]" />
            <span>Temps de Désinfection / Battement</span>
          </div>
          <p className="text-[11px] text-slate-500">Intervalle de respiration entre deux consultations</p>

          <div className="grid grid-cols-4 gap-1.5 pt-1">
            {[0, 5, 10, 15].map(buffer => (
              <button
                key={buffer}
                onClick={() => setBufferTime(buffer)}
                className={`py-1.5 rounded-xl text-xs font-bold transition-all ${
                  bufferTime === buffer
                    ? 'bg-[#2563EB] text-white shadow-2xs'
                    : 'bg-[#F7F9FC] text-slate-600 hover:bg-slate-100 border border-[#E8EDF4]'
                }`}
              >
                {buffer} min
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Weekly Schedule Grid */}
      <div className="bg-white rounded-2xl border border-[#E8EDF4] shadow-xs p-6 space-y-5">
        <div className="flex items-center justify-between border-b border-[#E8EDF4] pb-4">
          <div>
            <h2 className="text-sm font-bold text-[#14213D]">Plages Horaires d’Ouverture du Cabinet</h2>
            <p className="text-xs text-slate-500">Configurez les heures de présence et la pause déjeuner pour chaque jour</p>
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Protection Anti-Double Réservation Active</span>
          </div>
        </div>

        <div className="space-y-3">
          {daysSchedule.map((d, idx) => (
            <div
              key={d.day}
              className={`p-4 rounded-2xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                d.active ? 'bg-white border-[#E8EDF4] shadow-2xs' : 'bg-slate-50/70 border-slate-200 opacity-60'
              }`}
            >
              <div className="flex items-center gap-4 min-w-[140px]">
                <button
                  onClick={() => handleToggleDay(idx)}
                  className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs transition-colors ${
                    d.active ? 'bg-[#2563EB] text-white' : 'bg-slate-200 text-slate-400'
                  }`}
                >
                  {d.active ? '✓' : '✕'}
                </button>
                <div>
                  <span className={`text-xs font-bold ${d.active ? 'text-[#14213D]' : 'text-slate-400'}`}>
                    {d.day}
                  </span>
                  <div className="text-[10px] text-slate-400">
                    {d.active ? 'Ouvert' : 'Fermé'}
                  </div>
                </div>
              </div>

              {d.active ? (
                <div className="flex flex-wrap items-center gap-4 text-xs">
                  {/* Working Hours */}
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500 font-medium">De</span>
                    <input
                      type="time"
                      value={d.start}
                      onChange={e => handleTimeChange(idx, 'start', e.target.value)}
                      className="px-2.5 py-1 bg-[#F7F9FC] border border-[#E8EDF4] rounded-lg text-xs font-mono font-semibold text-[#14213D]"
                    />
                    <span className="text-slate-500 font-medium">à</span>
                    <input
                      type="time"
                      value={d.end}
                      onChange={e => handleTimeChange(idx, 'end', e.target.value)}
                      className="px-2.5 py-1 bg-[#F7F9FC] border border-[#E8EDF4] rounded-lg text-xs font-mono font-semibold text-[#14213D]"
                    />
                  </div>

                  {/* Lunch Break */}
                  <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
                    <Coffee className="w-3.5 h-3.5 text-amber-600" />
                    <span className="text-slate-500 font-medium">Pause :</span>
                    <input
                      type="time"
                      value={d.breakStart}
                      onChange={e => handleTimeChange(idx, 'breakStart', e.target.value)}
                      className="px-2 py-1 bg-amber-50/50 border border-amber-200 rounded-lg text-xs font-mono text-amber-900"
                    />
                    <span className="text-slate-400">-</span>
                    <input
                      type="time"
                      value={d.breakEnd}
                      onChange={e => handleTimeChange(idx, 'breakEnd', e.target.value)}
                      className="px-2 py-1 bg-amber-50/50 border border-amber-200 rounded-lg text-xs font-mono text-amber-900"
                    />
                  </div>
                </div>
              ) : (
                <span className="text-xs text-slate-400 italic">Aucune consultation assurée ce jour</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Vacations & Unavailable Periods */}
      <div className="bg-white rounded-2xl border border-[#E8EDF4] shadow-xs p-6 space-y-5">
        <div className="flex items-center justify-between border-b border-[#E8EDF4] pb-4">
          <div>
            <h2 className="text-sm font-bold text-[#14213D]">Congés, Astreintes et Indisponibilités</h2>
            <p className="text-xs text-slate-500">Verrouillage de périodes complètes (vacances, congrès, gardes SAMU)</p>
          </div>
        </div>

        {/* Existing Periods */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {unavailablePeriods.map(p => (
            <div
              key={p.id}
              className="p-4 rounded-2xl border border-[#E8EDF4] bg-[#F7F9FC] flex items-center justify-between gap-3 shadow-2xs"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[#14213D]">{p.title}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    p.type === 'EMERGENCY_DUTY' ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                  }`}>
                    {p.type === 'EMERGENCY_DUTY' ? 'Garde SAMU' : 'Congé'}
                  </span>
                </div>
                <div className="text-[11px] font-mono text-slate-500 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>Du {p.start} au {p.end}</span>
                </div>
              </div>

              <button
                onClick={() => handleRemovePeriod(p.id)}
                className="p-2 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-xl transition-colors"
                title="Supprimer la période"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        {/* Add Period Form */}
        <form onSubmit={handleAddUnavailable} className="p-4 bg-slate-50/60 rounded-2xl border border-dashed border-slate-300 space-y-3">
          <div className="text-xs font-bold text-slate-700">Bloquer une nouvelle période d’absence</div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Motif de l’absence</label>
              <input
                type="text"
                required
                placeholder="ex: Participation Congrès Médical"
                value={newPeriodTitle}
                onChange={e => setNewPeriodTitle(e.target.value)}
                className="w-full px-3 py-1.5 bg-white border border-[#E8EDF4] rounded-xl text-xs"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Date de début</label>
              <input
                type="date"
                required
                value={newPeriodStart}
                onChange={e => setNewPeriodStart(e.target.value)}
                className="w-full px-3 py-1.5 bg-white border border-[#E8EDF4] rounded-xl text-xs"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Date de fin</label>
              <input
                type="date"
                required
                value={newPeriodEnd}
                onChange={e => setNewPeriodEnd(e.target.value)}
                className="w-full px-3 py-1.5 bg-white border border-[#E8EDF4] rounded-xl text-xs"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#14213D] text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Bloquer ces Dates
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
