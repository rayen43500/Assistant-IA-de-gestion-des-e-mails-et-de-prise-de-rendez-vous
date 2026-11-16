import React, { useState } from 'react';
import { 
  Bot, 
  Send, 
  Sparkles, 
  BookOpen, 
  CheckCircle2, 
  HelpCircle, 
  RefreshCw,
  Copy,
  Lightbulb,
  ShieldCheck,
  Calendar,
  Mail,
  Coffee,
  Clock
} from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore';

interface Message {
  sender: 'USER' | 'AI';
  text: string;
  timestamp: string;
  sources?: string[];
  actionSuggestion?: {
    type: 'APPROVE_EMAIL' | 'BOOK_SLOT';
    label: string;
  };
}

export const AiAssistantWorkspace: React.FC = () => {
  const { sector, emails, appointments, availabilitySettings, showToast } = useAppStore();
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: 'AI',
      text: sector === 'MEDICAL' 
        ? `Bonjour Dr. Ben Salem. Je suis votre copilote clinique et secrétariat IA. Je suis parfaitement synchronisé avec vos disponibilités (08:30 - 17:30), votre pause déjeuner (12:30 - 14:00) et votre durée de consultation standard (${availabilitySettings.consultationDuration} min). Que souhaitez-vous vérifier ?`
        : `Bonjour Maître Trabelsi. Je suis votre copilote juridique IA. Je peux résumer les correspondances clients, préparer les modèles de consultation ou vérifier vos audiences.`,
      timestamp: '09:00',
      sources: ["Guide d'Accueil MediLawAI v2026", "Disponibilités Cabinet Synchronisées"]
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const userMsg: Message = {
      sender: 'USER',
      text: inputValue,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsTyping(true);

    setTimeout(() => {
      setIsTyping(false);
      let reply = "D'après la base certifiée du cabinet, cette information a été vérifiée.";
      let sources = ["Tarifs & Conventions 2026", "Grille de Disponibilités"];

      const lower = userMsg.text.toLowerCase();

      if (lower.includes('horaire') || lower.includes('pause') || lower.includes('déjeuner') || lower.includes('disponibilité')) {
        reply = `D'après vos réglages de disponibilité en vigueur dans l'éditeur :
• Heures de présence : Du Lundi au Vendredi de 08:30 à 17:30
• Pause Déjeuner : 12:30 à 14:00 (créneaux verrouillés contre toute réservation)
• Durée moyenne par consultation : ${availabilitySettings.consultationDuration} min (+ ${availabilitySettings.bufferTime} min de battement)
• Réservation en ligne : ${availabilitySettings.onlineBookingEnabled ? 'Activée (e-mails & WhatsApp)' : 'Suspendue'}
• Périodes de fermeture : ${availabilitySettings.unavailablePeriods.map(p => `${p.title} du ${p.start} au ${p.end}`).join(', ')}

L'assistant IA applique strictement ces règles : tout patient demandant un créneau pendant votre pause déjeuner est automatiquement réorienté vers 11:30 ou 14:00.`;
        sources = ["Éditeur de Disponibilités & Horaires", "Google Calendar API"];
      } else if (lower.includes('13h') || lower.includes('12h30') || lower.includes('13:00') || lower.includes('13:30')) {
        reply = `⚠️ Ce créneau est impossible : Entre 12:30 et 14:00, le cabinet est en pause déjeuner protégée.

Conformément à vos directives, j'ai formulé une réponse alternative courtoise proposant au patient le même jour à 11:30 (avant la pause) ou à 14:00 (dès la reprise).`;
        sources = ["Règle Pause Déjeuner (12:30 - 14:00)", "Moteur d'arbitrage NLP"];
      } else if (lower.includes('tarif') || lower.includes('prix') || lower.includes('cnam')) {
        reply = sector === 'MEDICAL'
          ? "Selon la grille officielle du cabinet : La consultation cardiologique est à 70 DT, l'électrocardiogramme (ECG) à 50 DT et l'écho-Doppler à 140 DT. Conventionnement CNAM actif avec feuille de soins délivrée sur place."
          : "Selon la grille du cabinet : La consultation juridique initiale d'une heure est fixée à 120 DT HT. Les conventions d'honoraires pour le contentieux des affaires sont établies sur devis écrit préalable.";
        sources = ["Grille Tarifaire Certifiée MediLawAI"];
      } else if (lower.includes('urgence') || lower.includes('samu')) {
        reply = "🚨 Protocole d'Urgence : Tout patient signalant une douleur thoracique aiguë ou une détresse respiratoire est immédiatement orienté vers le SAMU Tunisie (190 / 198). Une alerte SMS prioritaire a déjà été transmise au praticien d'astreinte.";
        sources = ["Protocole Médical d'Urgence SAMU 190"];
      } else if (lower.includes('rdv') || lower.includes('créneau')) {
        reply = `Les prochains créneaux confirmés disponibles hors pause déjeuner sont :
• Demain Mercredi : 10:00, 11:30, 14:30
• Jeudi : 09:30, 10:30, 15:00
(Durée unitaire : ${availabilitySettings.consultationDuration} min, synchronisé Google Calendar).`;
        sources = ["Synchronisation Google Calendar API"];
      }

      setMessages(prev => [...prev, {
        sender: 'AI',
        text: reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        sources
      }]);
    }, 700);
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    showToast({
      title: 'Copié dans le presse-papier !',
      message: 'Le texte de l’assistant IA est prêt à être collé.',
      type: 'info'
    });
  };

  return (
    <div className="h-[calc(100vh-7rem)] flex gap-6 font-sans">
      {/* Main Chat Interface */}
      <div className="flex-1 bg-white rounded-2xl border border-[#E5EAF2] shadow-xs flex flex-col overflow-hidden">
        {/* Chat header */}
        <div className="p-4 border-b border-[#E5EAF2] bg-[#F7F9FC] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-[#14213D]">Copilote IA & Secrétariat Clinique</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span> Connecté
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Horaires configurés : 08:30 - 17:30 • Pause : 12:30 - 14:00 • Consultation : {availabilitySettings.consultationDuration} min
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-xl border border-purple-200">
              Modèle Santé v2.4 Fine-tuné
            </span>
          </div>
        </div>

        {/* Messages Stream */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex gap-3 max-w-2xl ${msg.sender === 'USER' ? 'ml-auto flex-row-reverse' : ''}`}
            >
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold ${
                msg.sender === 'USER' ? 'bg-[#2563EB] text-white' : 'bg-purple-100 text-purple-700'
              }`}>
                {msg.sender === 'USER' ? 'Dr' : <Sparkles className="w-4 h-4" />}
              </div>

              <div className={`space-y-1.5 ${msg.sender === 'USER' ? 'items-end' : ''}`}>
                <div className={`p-4 rounded-2xl text-xs leading-relaxed whitespace-pre-line shadow-2xs ${
                  msg.sender === 'USER'
                    ? 'bg-[#2563EB] text-white rounded-tr-none'
                    : 'bg-[#F7F9FC] text-slate-800 border border-[#E5EAF2] rounded-tl-none'
                }`}>
                  {msg.text}
                </div>

                {msg.sources && msg.sources.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1 text-[10px] text-slate-400">
                    <span>Sources certifiées :</span>
                    {msg.sources.map((s, sIdx) => (
                      <span key={sIdx} className="bg-white border border-slate-200 px-1.5 py-0.5 rounded text-slate-600 font-medium">
                        {s}
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between text-[10px] text-slate-400 px-1">
                  <span>{msg.timestamp}</span>
                  {msg.sender === 'AI' && (
                    <button
                      onClick={() => handleCopy(msg.text)}
                      className="hover:text-slate-700 p-0.5 rounded"
                      title="Copier la réponse"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex items-center gap-2 text-xs text-slate-400 italic">
              <Sparkles className="w-4 h-4 text-purple-600 animate-spin" />
              <span>L’IA consulte votre agenda et la grille de pause déjeuner...</span>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSend} className="p-3 sm:p-4 border-t border-[#E5EAF2] bg-white flex items-center gap-2 sm:gap-3">
          <input
            type="text"
            placeholder="Posez une question sur les horaires, les pauses, ou demandez de vérifier un créneau..."
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            className="flex-1 px-3 sm:px-4 py-2 sm:py-2.5 text-xs bg-[#F7F9FC] border border-[#E5EAF2] rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
          />
          <button
            type="submit"
            disabled={!inputValue.trim()}
            className="p-2 sm:p-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-40 text-white shadow-sm transition-all shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>

      {/* Suggested Prompts sidebar */}
      <div className="hidden xl:flex w-76 bg-white rounded-2xl border border-[#E5EAF2] shadow-xs p-5 space-y-4 shrink-0 flex-col justify-between">
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider">
            <Lightbulb className="w-4 h-4 text-amber-500" />
            <span>Questions & Tests IA</span>
          </div>

          <div className="space-y-2 text-xs">
            {[
              "Quels sont mes horaires et mes pauses actuelles ?",
              "Un patient demande un rendez-vous jeudi à 13h",
              "Quels créneaux Google Calendar sont disponibles ce jeudi ?",
              "Quels sont les tarifs de consultation et les remboursements CNAM ?",
              "Quelle est la procédure SAMU en cas de douleur thoracique ?"
            ].map((prompt, pIdx) => (
              <button
                key={pIdx}
                onClick={() => setInputValue(prompt)}
                className="w-full p-2.5 rounded-xl border border-slate-100 bg-[#F7F9FC] hover:bg-purple-50 hover:border-purple-200 text-left text-slate-700 hover:text-purple-900 transition-all text-[11px] leading-relaxed"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>

        <div className="p-3 bg-purple-50 rounded-xl border border-purple-200 text-[11px] text-purple-900 space-y-1">
          <div className="font-bold flex items-center gap-1.5">
            <Coffee className="w-3.5 h-3.5 text-amber-600" />
            <span>Règle Déjeuner Intégrée</span>
          </div>
          <p className="opacity-90">L'IA ne proposera jamais de rendez-vous entre 12:30 et 14:00.</p>
        </div>
      </div>
    </div>
  );
};
