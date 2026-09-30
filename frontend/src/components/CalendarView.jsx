import React, { useState } from 'react';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  User, 
  Plus, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  CalendarCheck,
  BellRing
} from 'lucide-react';

export default function CalendarView({ appointments, onAddAppointment, onCancelAppointment }) {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showModal, setShowModal] = useState(false);

  // Formulaire nouveau RDV
  const [patientName, setPatientName] = useState('');
  const [patientEmail, setPatientEmail] = useState('');
  const [patientPhone, setPatientPhone] = useState('+216 ');
  const [reason, setReason] = useState('Consultation générale');
  const [startTime, setStartTime] = useState('10:00');
  const [conflictError, setConflictError] = useState('');

  const timeSlots = [
    '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00'
  ];

  const filteredAppointments = appointments.filter(a => a.date === selectedDate);

  const handleSubmit = (e) => {
    e.preventDefault();
    setConflictError('');

    // Vérification de double réservation
    const conflict = filteredAppointments.find(
      a => a.timeSlot?.start === startTime && a.status !== 'CANCELLED'
    );

    if (conflict) {
      setConflictError(`Le créneau ${startTime} est déjà réservé pour "${conflict.patient?.name}". Double réservation bloquée.`);
      return;
    }

    onAddAppointment({
      patient: { name: patientName, email: patientEmail, phone: patientPhone },
      reason,
      date: selectedDate,
      timeSlot: { start: startTime, end: startTime },
      status: 'CONFIRMED',
      source: 'MANUAL_SECRETARY',
    });

    setShowModal(false);
    setPatientName('');
    setPatientEmail('');
  };

  return (
    <div className="space-y-6">
      {/* Barre d'outils */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <CalendarCheck className="w-5 h-5 text-emerald-400" />
            <span>Gestion de l'Agenda & Synchronisation Calendrier</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Synchronisation Google/Outlook, vérification des conflits et rappels 24h.
          </p>
        </div>

        <button
          onClick={() => { setShowModal(true); setConflictError(''); }}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-500/20 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Nouveau Rendez-vous</span>
        </button>
      </div>

      {/* Sélecteur de date */}
      <div className="glass-panel p-4 rounded-xl flex items-center gap-4">
        <div className="flex items-center gap-2 text-xs text-slate-300 font-medium">
          <CalendarIcon className="w-4 h-4 text-blue-400" />
          <span>Sélectionner la journée :</span>
        </div>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="bg-slate-900 border border-slate-700 text-xs text-white px-3 py-1.5 rounded-lg focus:outline-none focus:border-blue-500"
        />
      </div>

      {/* Grille des Créneaux Horaires */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {timeSlots.map((slot) => {
          const booked = filteredAppointments.find(
            a => a.timeSlot?.start === slot && a.status !== 'CANCELLED'
          );

          return (
            <div
              key={slot}
              className={`p-4 rounded-2xl border transition-all ${
                booked
                  ? 'glass-panel border-blue-500/30 bg-blue-950/20'
                  : 'glass-card border-slate-800/80 bg-slate-900/40'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-white flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-blue-400" />
                  <span>{slot}</span>
                </span>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                  booked 
                    ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' 
                    : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                }`}>
                  {booked ? booked.status : 'Disponible'}
                </span>
              </div>

              {booked ? (
                <div className="mt-3 space-y-2">
                  <div className="flex items-center gap-2 text-xs text-white font-medium">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>{booked.patient?.name}</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Motif : <span className="text-slate-300">{booked.reason}</span>
                  </p>
                  <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1">
                    <span className="flex items-center gap-1 text-emerald-400">
                      <BellRing className="w-3 h-3" />
                      <span>Rappel 24h programmé</span>
                    </span>
                    <button
                      onClick={() => onCancelAppointment(booked.id || booked._id)}
                      className="text-red-400 hover:text-red-300 underline font-medium"
                    >
                      Annuler / Libérer
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mt-3 py-2 text-center text-xs text-slate-500">
                  Créneau libre pour réservation
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Modal d'ajout de rendez-vous */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-md rounded-2xl p-6 border border-slate-700 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <CalendarCheck className="w-4 h-4 text-emerald-400" />
                <span>Programmer un Rendez-vous</span>
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {conflictError && (
              <div className="p-3 rounded-lg bg-red-950/60 border border-red-500/50 flex items-center gap-2 text-xs text-red-300">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                <span>{conflictError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Nom et prénom du patient</label>
                <input
                  type="text"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white"
                  placeholder="Ex : Mohamed Ben Ali"
                  required
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Adresse e-mail</label>
                <input
                  type="email"
                  value={patientEmail}
                  onChange={(e) => setPatientEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white"
                  placeholder="m.benali@gmail.com"
                  required
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Téléphone (WhatsApp)</label>
                <input
                  type="text"
                  value={patientPhone}
                  onChange={(e) => setPatientPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white"
                  placeholder="+216 98 123 456"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Date</label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Heure de début</label>
                  <select
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white"
                  >
                    {timeSlots.map(t => (
                      <option key={t} value={t} className="bg-slate-900">{t}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Motif de consultation</label>
                <input
                  type="text"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md shadow-emerald-500/20"
                >
                  Confirmer la réservation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
