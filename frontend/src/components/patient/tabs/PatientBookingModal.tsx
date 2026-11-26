import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  User,
  Phone,
  Mail,
  Stethoscope,
  X,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  AlertCircle,
  Copy
} from 'lucide-react';
import { useAppStore } from '../../../stores/useAppStore';
import { getPatientContact, savePatientContact, addSavedBookingToken } from '../patientData';
import { apiCreatePublicGuestBooking, apiFetchPublicDoctors, apiFetchPublicDoctorAvailability, apiErrorMessage } from '../../../services/apiClient';

interface PatientBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedDoctor?: any;
  /** Appelé après une réservation réussie (rafraîchir « Mes rendez-vous ») */
  onBooked?: () => void;
}

export const PatientBookingModal: React.FC<PatientBookingModalProps> = ({
  isOpen,
  onClose,
  preselectedDoctor,
  onBooked
}) => {
  const { showToast } = useAppStore();

  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(preselectedDoctor ? 2 : 1);
  const [selectedDoctor, setSelectedDoctor] = useState<any>(preselectedDoctor || null);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [days, setDays] = useState<{ date: string; label: string; slots: any[] }[]>([]);
  const [loadingDays, setLoadingDays] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [bookingError, setBookingError] = useState<string | null>(null);

  // Informations du patient (pré-remplies s'il est connecté)
  const savedContact = getPatientContact();
  const [patientName, setPatientName] = useState(savedContact.name);
  const [patientPhone, setPatientPhone] = useState(savedContact.phone);
  const [patientEmail, setPatientEmail] = useState(savedContact.email);
  const [reason, setReason] = useState('');
  const [guestToken, setGuestToken] = useState<string | null>(null);
  const [bookingSubmitting, setBookingSubmitting] = useState(false);

  const doctorId = selectedDoctor?._id || selectedDoctor?.id;

  // Étape 1 : praticiens réels
  useEffect(() => {
    if (!isOpen || step !== 1 || doctors.length) return;
    apiFetchPublicDoctors().then((list: any[]) => setDoctors((list || []).filter(d => d.bookingSettings?.onlineBookingEnabled !== false).map(d => ({
      ...d, id: d._id, clinic: d.tenantId?.name || '',
    })))).catch(() => setDoctors([]));
  }, [isOpen, step]);

  // Étape 2 : disponibilités réelles des 14 prochains jours
  useEffect(() => {
    if (!isOpen || !doctorId) return;
    setLoadingDays(true);
    const base = new Date();
    const dates = Array.from({ length: 14 }, (_, i) => {
      const d = new Date(base.getFullYear(), base.getMonth(), base.getDate() + i);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    });
    Promise.all(dates.map(date => apiFetchPublicDoctorAvailability(doctorId, date).then((r: any) => ({ date, slots: (r?.slots || []).filter((sl: any) => sl.available) })).catch(() => ({ date, slots: [] }))))
      .then(res => setDays(res.filter(d => d.slots.length).map(d => ({
        ...d,
        label: new Date(`${d.date}T12:00:00`).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' }),
      }))))
      .finally(() => setLoadingDays(false));
  }, [isOpen, doctorId]);

  if (!isOpen) return null;

  const datesList = days.slice(0, 9).map(d => ({ label: d.label, date: d.date, availableCount: d.slots.length }));
  const timeSlots = (days.find(d => d.date === selectedDate)?.slots || []).map((sl: any) => ({ time: sl.start, state: 'available' as const }));
  const longSelectedDate = selectedDate ? new Date(`${selectedDate}T12:00:00`).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }) : '';

  const handleConfirmBooking = async () => {
    if (!selectedSlot || !doctorId) return;
    if (!patientName.trim() || !/@/.test(patientEmail) || patientPhone.trim().length < 8) {
      setBookingError('Nom, e-mail valide et téléphone sont obligatoires.');
      return;
    }
    setBookingSubmitting(true);
    setBookingError(null);
    try {
      const res = await apiCreatePublicGuestBooking({
        doctorId,
        date: selectedDate,
        startTime: selectedSlot,
        patientName: patientName.trim(),
        patientEmail: patientEmail.trim(),
        patientPhone: patientPhone.trim(),
        reason: reason.trim() || 'Consultation',
        idempotencyKey: `guest-book-${patientEmail.trim().toLowerCase()}-${doctorId}-${selectedDate}-${selectedSlot}`
      });
      const token = res?.managementToken;
      setGuestToken(token || null);
      // Mémoriser la réservation sur cet appareil (onglet « Mes rendez-vous »)
      if (token) addSavedBookingToken(token);
      savePatientContact({ name: patientName.trim(), email: patientEmail.trim(), phone: patientPhone.trim() });
      onBooked?.();
      setStep(5);
      showToast({ title: 'Rendez-vous confirmé', message: `${longSelectedDate} à ${selectedSlot} avec ${selectedDoctor?.name}.`, type: 'success' });
    } catch (err: any) {
      setBookingError(apiErrorMessage(err, 'La réservation a échoué.'));
      // Créneau pris entre-temps : on rafraîchit les disponibilités
      if (err?.response?.status === 409) {
        setSelectedSlot(null);
        setStep(3);
        apiFetchPublicDoctorAvailability(doctorId, selectedDate).then((r: any) => setDays(prev => prev.map(d => d.date === selectedDate ? { ...d, slots: (r?.slots || []).filter((sl: any) => sl.available) } : d))).catch(() => {});
      }
    } finally {
      setBookingSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs font-sans animate-in fade-in">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-[#E8EDF4] overflow-hidden flex flex-col max-h-[92vh]">
        {/* Top Stepper Header */}
        <div className="p-5 border-b border-[#E8EDF4] bg-[#F7F9FC] flex items-center justify-between shrink-0">
          <div>
            <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-[#2563EB]">
              <span>Étape {step} sur 5</span>
              <span>•</span>
              <span>Réservation en Ligne</span>
            </div>
            <h2 className="text-base font-black text-[#14213D] tracking-tight mt-0.5">
              {step === 1 && 'Choisir le Praticien'}
              {step === 2 && 'Sélectionner la Date'}
              {step === 3 && 'Choisir un Créneau Disponible'}
              {step === 4 && 'Vos Informations Personnelles'}
              {step === 5 && 'Confirmation du Rendez-vous'}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {bookingError && step !== 5 && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700">{bookingError}</div>
          )}
          {/* STEP 1: Select Doctor */}
          {step === 1 && (
            <div className="space-y-3">
              {doctors.length === 0 && <p className="text-xs text-slate-400 text-center py-6">Chargement des praticiens…</p>}
              {doctors.map((doc, dIdx) => (
                <div
                  key={dIdx}
                  onClick={() => { setSelectedDoctor(doc); setSelectedDate(''); setSelectedSlot(null); setStep(2); }}
                  className="p-4 rounded-2xl border border-[#E8EDF4] hover:border-[#2563EB] hover:bg-blue-50/40 cursor-pointer transition-all flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-100 text-[#2563EB] flex items-center justify-center font-bold text-sm">
                      <Stethoscope className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-bold text-xs text-[#14213D] group-hover:text-[#2563EB]">{doc.name}</div>
                      <div className="text-[11px] text-slate-500">{doc.specialty}</div>
                      <div className="text-[10px] text-slate-400">{doc.clinic} • {doc.appointmentDuration || 30} min</div>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-[#2563EB] transition-colors" />
                </div>
              ))}
            </div>
          )}

          {/* STEP 2: Select Date */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="p-3 bg-blue-50/60 rounded-2xl border border-blue-100 text-xs text-blue-900 flex items-center gap-2.5">
                <Stethoscope className="w-4 h-4 text-[#2563EB] shrink-0" />
                <span className="truncate">Praticien : <strong>{selectedDoctor?.name}</strong> ({selectedDoctor?.specialty})</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">Choisissez le jour de consultation :</label>
                {loadingDays && <p className="text-xs text-slate-400 py-4 text-center">Recherche des disponibilités…</p>}
                {!loadingDays && datesList.length === 0 && <p className="text-xs text-slate-500 py-4 text-center">Aucun créneau disponible dans les 14 prochains jours. Contactez le cabinet.</p>}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {datesList.map(d => (
                    <button
                      key={d.date}
                      onClick={() => { setSelectedDate(d.date); setSelectedSlot(null); setStep(3); }}
                      className={`p-3.5 rounded-2xl border text-center transition-all ${
                        selectedDate === d.date
                          ? 'border-[#2563EB] bg-blue-50/70 text-[#2563EB] font-bold shadow-xs ring-1 ring-[#2563EB]'
                          : 'border-[#E8EDF4] hover:bg-slate-50 text-slate-700 font-semibold'
                      }`}
                    >
                      <div className="text-xs capitalize">{d.label}</div>
                      <span className="text-[10px] text-emerald-600 block mt-1 font-medium">
                        {d.availableCount} créneaux
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Available Appointments Time Slots (Green, Gray, Blue, Red) */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-600">
                <span className="font-bold text-[#14213D] capitalize">{longSelectedDate} avec {selectedDoctor?.name}</span>
                <button onClick={() => setStep(2)} className="text-[#2563EB] font-bold hover:underline">
                  Changer date
                </button>
              </div>

              {/* Legend of the 4 visual states */}
              <div className="p-2.5 bg-[#F7F9FC] rounded-xl border border-[#E8EDF4] flex flex-wrap items-center justify-between gap-2 text-[10px] font-semibold text-slate-600">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Disponible
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#2563EB]"></span> Sélectionné
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-300"></span> Réservé
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-400"></span> Indisponible
                </span>
              </div>

              {/* Time Slots Grid */}
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
                {timeSlots.map(slot => {
                  const isSelected = selectedSlot === slot.time;
                  const isAvailable = slot.state === 'available';
                  const isReserved = slot.state === 'reserved';
                  const isUnavailable = slot.state === 'unavailable';

                  return (
                    <button
                      key={slot.time}
                      disabled={!isAvailable}
                      onClick={() => setSelectedSlot(slot.time)}
                      className={`p-3 rounded-xl text-xs font-mono font-bold transition-all flex flex-col items-center justify-center gap-0.5 ${
                        isSelected
                          ? 'bg-[#2563EB] text-white shadow-md shadow-blue-500/20 ring-2 ring-[#2563EB]'
                          : isAvailable
                          ? 'bg-emerald-50/80 hover:bg-emerald-100/80 text-emerald-800 border border-emerald-200/80 cursor-pointer'
                          : isReserved
                          ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed opacity-60'
                          : 'bg-rose-50 text-rose-300 border border-rose-100 cursor-not-allowed opacity-50'
                      }`}
                    >
                      <span className="text-sm">{slot.time}</span>
                      <span className="text-[9px] font-sans font-normal opacity-90">
                        {isSelected ? 'Choisi' : isAvailable ? 'Libre' : isReserved ? 'Réservé' : 'Fermé'}
                      </span>
                    </button>
                  );
                })}
              </div>

              {selectedSlot && (
                <div className="pt-2">
                  <button
                    onClick={() => setStep(4)}
                    className="w-full py-3 bg-[#2563EB] hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/20 flex items-center justify-center gap-2 transition-all"
                  >
                    <span>Continuer avec {selectedSlot}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* STEP 4: Personal Information Form */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="p-3 bg-blue-50/70 rounded-2xl border border-blue-200/60 text-xs text-blue-900 space-y-1">
                <div className="font-bold">Récapitulatif du Créneau :</div>
                <div className="capitalize">{longSelectedDate} à {selectedSlot} • {selectedDoctor?.name}</div>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nom et prénom *</label>
                  <input
                    type="text"
                    required
                    value={patientName}
                    onChange={e => setPatientName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#F7F9FC] border border-[#E8EDF4] rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Téléphone *</label>
                  <input
                    type="tel"
                    required
                    value={patientPhone}
                    onChange={e => setPatientPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#F7F9FC] border border-[#E8EDF4] rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Adresse e-mail * (confirmation et rappel)</label>
                  <input
                    type="email"
                    required
                    value={patientEmail}
                    onChange={e => setPatientEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#F7F9FC] border border-[#E8EDF4] rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Motif de la consultation (facultatif)</label>
                  <input
                    type="text"
                    value={reason}
                    onChange={e => setReason(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#F7F9FC] border border-[#E8EDF4] rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]"
                  />
                </div>

                <div className="pt-2">
                  <button
                    onClick={handleConfirmBooking}
                    disabled={bookingSubmitting}
                    className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all active:scale-[0.99] disabled:opacity-60"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{bookingSubmitting ? 'Réservation en cours...' : 'Confirmer la Réservation'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: Booking Confirmation Screen */}
          {step === 5 && (
            <div className="py-4 text-center space-y-4">
              <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-md">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <h3 className="text-lg font-black text-[#14213D]">Rendez-vous Confirmé !</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Votre rendez-vous est enregistré dans l’agenda du praticien. Une confirmation vous est envoyée par e-mail.
                </p>
              </div>

              {/* Confirmation card */}
              <div className="p-4 bg-[#F7F9FC] rounded-2xl border border-[#E8EDF4] text-xs text-left space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">Praticien :</span>
                  <span className="font-bold text-[#14213D]">{selectedDoctor?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Date & Heure :</span>
                  <span className="font-bold text-blue-600 capitalize">{longSelectedDate} à {selectedSlot}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Lieu :</span>
                  <span className="font-medium text-slate-700">{selectedDoctor?.clinic || selectedDoctor?.tenantId?.name || ''}</span>
                </div>

              </div>

              {/* Guest Management Token Card */}
              {guestToken && (
                <div className="p-3.5 bg-blue-50/70 rounded-2xl border border-blue-200 text-left text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#14213D] flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-[#2563EB]" />
                      Gestion Sans Compte
                    </span>
                    <button
                      onClick={() => {
                        const url = `${window.location.origin}/?token=${encodeURIComponent(guestToken)}`;
                        navigator.clipboard.writeText(url);
                        showToast({
                          title: 'Lien copié !',
                          message: 'Lien de gestion copié dans le presse-papier.',
                          type: 'success'
                        });
                      }}
                      className="text-[11px] font-bold text-[#2563EB] hover:underline flex items-center gap-1"
                    >
                      <Copy className="w-3 h-3" />
                      <span>Copier Lien</span>
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-600">
                    Conservez ce lien pour modifier l'horaire ou annuler ce rendez-vous en 1 clic sans devoir vous connecter.
                  </p>
                  <div className="font-mono text-[10px] bg-white p-1.5 rounded-lg border border-blue-200 text-slate-700 truncate">
                    {`${window.location.origin}/?token=${guestToken}`}
                  </div>
                </div>
              )}

              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-[11px] text-emerald-800 space-y-1">
                <span className="font-bold flex items-center justify-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  Rappel automatique la veille
                </span>
                <p className="text-[10px] text-emerald-700">
                  Un e-mail de rappel est envoyé à {patientEmail} la veille du rendez-vous à 08h00.
                </p>
              </div>

              <button
                onClick={onClose}
                className="w-full py-3 bg-[#14213D] hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors"
              >
                Retour à l'Espace Patient
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
