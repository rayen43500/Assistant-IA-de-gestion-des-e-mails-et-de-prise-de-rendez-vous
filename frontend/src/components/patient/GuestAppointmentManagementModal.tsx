import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  User, 
  AlertTriangle, 
  CheckCircle2, 
  X, 
  Trash2, 
  RefreshCw, 
  Copy, 
  ExternalLink,
  ShieldCheck,
  Stethoscope
} from 'lucide-react';
import { apiGetPublicBookingByToken, apiCancelPublicBookingByToken } from '../../services/apiClient';
import { useAppStore } from '../../stores/useAppStore';

interface GuestAppointmentManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  token?: string;
}

export const GuestAppointmentManagementModal: React.FC<GuestAppointmentManagementModalProps> = ({
  isOpen,
  onClose,
  token: initialToken = ''
}) => {
  const { showToast } = useAppStore();
  const [tokenInput, setTokenInput] = useState(initialToken);
  const [loading, setLoading] = useState(false);
  const [appointment, setAppointment] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [cancelledSuccess, setCancelledSuccess] = useState(false);

  useEffect(() => {
    if (initialToken) {
      setTokenInput(initialToken);
      fetchBookingDetails(initialToken);
    }
  }, [initialToken, isOpen]);

  const fetchBookingDetails = async (tok: string) => {
    if (!tok.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const data = await apiGetPublicBookingByToken(tok.trim());
      if (data?.appointment) {
        setAppointment(data.appointment);
      } else {
        setError('Rendez-vous introuvable ou jeton expiré.');
      }
    } catch (e: any) {
      setError(e.response?.data?.error || 'Jeton de gestion invalide ou rendez-vous introuvable.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!window.confirm('Êtes-vous sûr de vouloir annuler ce rendez-vous ? Cette action libérera immédiatement le créneau dans l\'agenda du cabinet et sur Google Calendar.')) {
      return;
    }
    setCancelling(true);
    try {
      await apiCancelPublicBookingByToken(tokenInput.trim());
      setCancelledSuccess(true);
      showToast({
        title: 'Rendez-vous annulé',
        message: 'Le créneau a été libéré sur l\'agenda et Google Calendar.',
        type: 'info'
      });
    } catch (e: any) {
      showToast({
        title: 'Erreur d’annulation',
        message: e.response?.data?.error || 'Impossible d’annuler le rendez-vous.',
        type: 'danger'
      });
    } finally {
      setCancelling(false);
    }
  };

  const copyManagementLink = () => {
    const url = `${window.location.origin}/rendez-vous/gestion?token=${encodeURIComponent(tokenInput)}`;
    navigator.clipboard.writeText(url);
    showToast({
      title: 'Lien copié',
      message: 'Le lien direct de gestion a été copié dans votre presse-papier.',
      type: 'success'
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs font-sans animate-in fade-in">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-[#E8EDF4] overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-5 border-b border-[#E8EDF4] bg-[#F7F9FC] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#2563EB]">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-[#14213D] tracking-tight">Gestion de Rendez-vous Invité</h2>
              <p className="text-xs text-slate-500">Consultez ou annulez sans compte grâce à votre jeton sécurisé</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5">
          {!appointment && !cancelledSuccess ? (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Jeton de gestion (reçu par e-mail ou SMS)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={tokenInput}
                    onChange={(e) => setTokenInput(e.target.value)}
                    placeholder="Collez votre jeton ou lien..."
                    className="flex-1 px-3.5 py-2.5 bg-[#F7F9FC] border border-[#E8EDF4] rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]"
                  />
                  <button
                    onClick={() => fetchBookingDetails(tokenInput)}
                    disabled={loading || !tokenInput.trim()}
                    className="px-4 py-2.5 bg-[#2563EB] hover:bg-blue-700 text-white rounded-xl text-xs font-bold disabled:opacity-50 transition-colors"
                  >
                    {loading ? 'Vérification...' : 'Consulter'}
                  </button>
                </div>
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}
            </div>
          ) : cancelledSuccess ? (
            <div className="text-center py-6 space-y-4">
              <div className="w-14 h-14 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto shadow-xs">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-lg font-black text-[#14213D]">Rendez-vous Annulé avec Succès</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Le créneau a été libéré sur le calendrier du médecin et la synchronisation Google Calendar a été mise à jour.
                </p>
              </div>
              <button
                onClick={onClose}
                className="px-6 py-2.5 bg-[#14213D] hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors"
              >
                Fermer
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Doctor and Status Badge */}
              <div className="flex items-start justify-between p-4 bg-[#F7F9FC] rounded-2xl border border-[#E8EDF4]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 text-[#2563EB] flex items-center justify-center font-bold">
                    <Stethoscope className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-[#14213D]">{appointment.doctor?.name || appointment.practitionerName || 'Dr. Praticien'}</h3>
                    <p className="text-xs text-slate-500">{appointment.doctor?.specialty || 'Médecine Spécialisée'}</p>
                  </div>
                </div>

                <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                  appointment.status === 'CONFIRMED' 
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                    : appointment.status === 'CANCELLED'
                    ? 'bg-rose-50 text-rose-700 border border-rose-200'
                    : 'bg-blue-50 text-blue-700 border border-blue-200'
                }`}>
                  {appointment.status === 'CONFIRMED' ? 'Confirmé' : appointment.status === 'CANCELLED' ? 'Annulé' : 'Planifié'}
                </span>
              </div>

              {/* Slot and Location Details */}
              <div className="p-4 bg-white rounded-2xl border border-[#E8EDF4] space-y-3 text-xs">
                <div className="flex items-center gap-3 text-slate-700">
                  <Calendar className="w-4 h-4 text-[#2563EB] shrink-0" />
                  <span className="font-semibold">Date :</span>
                  <span className="font-bold text-[#14213D]">{appointment.date}</span>
                </div>
                <div className="flex items-center gap-3 text-slate-700">
                  <Clock className="w-4 h-4 text-[#2563EB] shrink-0" />
                  <span className="font-semibold">Horaire :</span>
                  <span className="font-bold text-blue-600">
                    {appointment.timeSlot?.start || appointment.timeStart} - {appointment.timeSlot?.end || appointment.timeEnd}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-slate-700">
                  <MapPin className="w-4 h-4 text-[#2563EB] shrink-0" />
                  <span className="font-semibold">Adresse :</span>
                  <span>{appointment.doctor?.clinic || 'Cabinet Médical MediLawAI, Tunis'}</span>
                </div>
                <div className="flex items-center gap-3 text-slate-700">
                  <User className="w-4 h-4 text-[#2563EB] shrink-0" />
                  <span className="font-semibold">Patient :</span>
                  <span className="font-medium text-[#14213D]">{appointment.patient?.name || appointment.patientName}</span>
                </div>
              </div>

              {/* Google Sync and Security Info */}
              <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-200 text-[11px] text-blue-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#2563EB]" />
                  <span>Synchronisé Google Calendar avec protection anti-conflit</span>
                </div>
                <button
                  onClick={copyManagementLink}
                  className="font-bold text-[#2563EB] hover:underline flex items-center gap-1"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copier lien</span>
                </button>
              </div>

              {/* Action buttons */}
              {appointment.status !== 'CANCELLED' && (
                <div className="pt-2 flex items-center gap-3">
                  <button
                    onClick={handleCancel}
                    disabled={cancelling}
                    className="flex-1 py-3 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>{cancelling ? 'Annulation en cours...' : 'Annuler ce Rendez-vous'}</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
