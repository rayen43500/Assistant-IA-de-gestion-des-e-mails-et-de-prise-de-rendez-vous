import React, { useState } from 'react';
import { 
  Bot, 
  Send, 
  Sparkles, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  User, 
  AlertCircle, 
  Scale, 
  Stethoscope, 
  ArrowRight,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';
import { mapAppointment } from '../../../services/mappers';
import { API_BASE_URL } from '../../../services/apiClient';
import { useAppStore } from '../../../stores/useAppStore';
import { getPatientContact, addSavedBookingToken } from '../patientData';

interface ChatMessage {
  id: string;
  sender: 'USER' | 'AI';
  text: string;
  time: string;
  proposedSlots?: string[];
  confirmedAppointment?: any;
  decision?: string;
}

export const PatientAiBookingChat: React.FC = () => {
  const { currentUser, showToast } = useAppStore();
  const [selectedProfession, setSelectedProfession] = useState<'MEDECIN' | 'AVOCAT'>('MEDECIN');
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  // Mémoire de la conversation (praticien, date, créneaux proposés)
  const [chatContext, setChatContext] = useState<any>({});

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'AI',
      text: `Bonjour ! Je suis l'assistant de prise de rendez-vous.\nIndiquez le praticien (ou la spécialité), le jour et l'heure souhaités : je vérifie l'agenda et je réserve.\n\n💡 Exemple : « Je souhaite un rendez-vous lundi à 10h pour une consultation. »`,
      time: 'À l’instant'
    }
  ]);

  const handleSend = async (messageToSend?: string) => {
    const text = (messageToSend || inputMessage).trim();
    if (!text || isLoading) return;

    const userMsg: ChatMessage = {
      id: 'user-' + Date.now(),
      sender: 'USER',
      text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    if (!messageToSend) setInputMessage('');
    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/ai/patient-chat-booking`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          selectedProfession,
          patientInfo: getPatientContact(),
          context: chatContext
        })
      });

      if (!response.ok) throw new Error('Erreur de communication avec le serveur');
      const data = await response.json();

      const aiMsg: ChatMessage = {
        id: 'ai-' + Date.now(),
        sender: 'AI',
        text: data.replyText,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        proposedSlots: data.proposedSlots || [],
        confirmedAppointment: data.appointment,
        decision: data.decision
      };

      setMessages(prev => [...prev, aiMsg]);
      setChatContext(data.confirmed ? {} : (data.context || {}));
      if (data.managementToken) addSavedBookingToken(data.managementToken);

      // Si le rendez-vous a été confirmé automatiquement dans le calendrier interne
      if (data.confirmed && data.appointment) {
        // Le RDV est déjà enregistré par le serveur : on l'ajoute seulement à l'affichage
        useAppStore.setState((state) => ({ appointments: [...state.appointments, mapAppointment(data.appointment)] }));

        showToast({
          title: 'Rendez-vous confirmé',
          message: `Votre créneau avec ${data.practitioner?.name} est réservé. Retrouvez-le dans « Mes rendez-vous ».`,
          type: 'success'
        });
      }
    } catch (err: any) {
      setMessages(prev => [
        ...prev,
        {
          id: 'err-' + Date.now(),
          sender: 'AI',
          text: `Désolé, une erreur est survenue lors de la vérification des disponibilités. Vous pouvez réessayer ou appeler le secrétariat.`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectSlot = (slot: string, date?: string) => {
    handleSend(`Je confirme pour le créneau de ${slot}${date ? ' le ' + date : ''}`);
  };

  return (
    <div className="bg-white rounded-2xl border border-[#E5EAF2] shadow-xs flex flex-col h-[580px] overflow-hidden">
      {/* Top Header with Profession Switch */}
      <div className="p-3.5 border-b border-[#E5EAF2] bg-[#F7F9FC] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-xs">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs font-bold text-[#14213D] flex items-center gap-1.5">
              <span>Assistant Prise de RDV Directe (Calendrier Interne)</span>
              <span className="text-[9px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded-full font-bold">1 Seul Message</span>
            </h2>
            <p className="text-[10px] text-slate-500">
              Vérification immédiate des disponibilités sans questions superflues
            </p>
          </div>
        </div>

        {/* Profession Toggle: Médecin vs Avocat */}
        <div className="flex items-center bg-white p-1 rounded-xl border border-slate-200 shadow-2xs self-start sm:self-auto">
          <button
            onClick={() => setSelectedProfession('MEDECIN')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all ${
              selectedProfession === 'MEDECIN'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Stethoscope className="w-3.5 h-3.5" />
            <span>Médecin</span>
          </button>
          <button
            onClick={() => setSelectedProfession('AVOCAT')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all ${
              selectedProfession === 'AVOCAT'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Scale className="w-3.5 h-3.5" />
            <span>Avocat</span>
          </button>
        </div>
      </div>

      {/* Quick Prompt Pills */}
      <div className="p-2 border-b border-slate-100 bg-white flex items-center gap-2 overflow-x-auto text-[11px] no-scrollbar">
        <span className="text-slate-400 font-bold shrink-0 text-[10px] uppercase">Suggestions :</span>
        <button
          onClick={() => handleSend("Je souhaite un rendez-vous demain à 10h00 pour une consultation.")}
          className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 font-medium shrink-0 border border-blue-100 text-left"
        >
          ✨ Demain à 10h00
        </button>
        <button
          onClick={() => handleSend("Bonjour, je souhaite un rendez-vous avec un avocat pour lundi prochain.")}
          className="px-2.5 py-1 rounded-lg bg-purple-50 text-purple-700 hover:bg-purple-100 font-medium shrink-0 border border-purple-100 text-left"
        >
          ⚖️ Avocat lundi prochain
        </button>
        <button
          onClick={() => handleSend("Bonjour, je voudrais un rendez-vous de contrôle la semaine prochaine.")}
          className="px-2.5 py-1 rounded-lg bg-slate-50 text-slate-700 hover:bg-slate-100 font-medium shrink-0 border border-slate-200 text-left"
        >
          📅 Semaine prochaine
        </button>
      </div>

      {/* Message List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#FAFCFF]">
        {messages.map(msg => {
          const isUser = msg.sender === 'USER';
          return (
            <div key={msg.id} className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
              <div className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-3.5 text-xs leading-relaxed shadow-2xs ${
                isUser 
                  ? 'bg-blue-600 text-white rounded-tr-none' 
                  : 'bg-white text-slate-800 border border-slate-200/80 rounded-tl-none'
              }`}>
                <div className="whitespace-pre-wrap">{msg.text}</div>

                {/* If Slot alternatives proposed, display interactive buttons */}
                {msg.proposedSlots && msg.proposedSlots.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-100">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
                      Créneaux disponibles au planning interne :
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {msg.proposedSlots.map((slot, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSelectSlot(slot)}
                          className="px-3 py-1.5 bg-blue-50 hover:bg-blue-600 hover:text-white text-blue-700 font-bold rounded-xl text-xs border border-blue-200 transition-all flex items-center gap-1"
                        >
                          <Clock className="w-3 h-3" />
                          <span>{slot}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* If Confirmed Card */}
                {msg.confirmedAppointment && (
                  <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 space-y-1">
                    <div className="flex items-center gap-1.5 font-bold text-xs text-emerald-800">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Réservation Confirmée dans le Calendrier Interne</span>
                    </div>
                    <div className="text-[11px] text-emerald-700 flex items-center gap-3 pt-1">
                      <span>📅 {msg.confirmedAppointment.date}</span>
                      <span>⏰ {msg.confirmedAppointment.timeSlot?.start} - {msg.confirmedAppointment.timeSlot?.end}</span>
                    </div>
                  </div>
                )}
              </div>
              <span className="text-[9px] text-slate-400 mt-1 px-1">{msg.time}</span>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex items-center gap-2 text-xs text-slate-400 bg-white p-3 rounded-2xl w-fit border border-slate-100">
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-600" />
            <span>Vérification immédiate du calendrier interne...</span>
          </div>
        )}
      </div>

      {/* Input Form */}
      <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="p-3 border-t border-[#E5EAF2] bg-white flex items-center gap-2">
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          placeholder={`Demandez votre RDV ${selectedProfession === 'AVOCAT' ? 'avec un avocat' : 'avec un médecin'} (ex: jeudi à 15h)...`}
          className="flex-1 px-3.5 py-2.5 bg-[#F7F9FC] border border-[#E5EAF2] rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={!inputMessage.trim() || isLoading}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs"
        >
          <Send className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Envoyer</span>
        </button>
      </form>
    </div>
  );
};
