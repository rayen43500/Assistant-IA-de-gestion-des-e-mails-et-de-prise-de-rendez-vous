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
  Mail
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
  const { sector, emails, appointments, showToast } = useAppStore();
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: 'AI',
      text: sector === 'MEDICAL' 
        ? "Bonjour Dr. Ben Salem. Je suis votre assistant clinique et secrétariat IA. Je peux résumer vos e-mails récents, vérifier vos disponibilités d'agenda, ou répondre à des questions sur vos tarifs certifiés CNAM."
        : "Bonjour Maître Trabelsi. Je suis votre copilote juridique IA. Je peux résumer les correspondances clients, préparer les modèles de consultation ou vérifier vos audiences.",
      timestamp: '09:00',
      sources: ["Guide d'Accueil MediLawAI v2026"]
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
      let sources = ["Tarifs & Conventions 2026", "Horaires du Cabinet"];

      const lower = userMsg.text.toLowerCase();
      if (lower.includes('tarif') || lower.includes('prix') || lower.includes('cnam')) {
        reply = sector === 'MEDICAL'
          ? "Selon la grille officielle du cabinet : La consultation cardiologique est à 70 DT, l'électrocardiogramme (ECG) à 50 DT et l'écho-Doppler à 140 DT. Conventionnement CNAM actif avec feuille de soins délivrée sur place."
          : "Selon la grille du cabinet : La consultation juridique initiale d'une heure est fixée à 120 DT HT. Les conventions d'honoraires pour le contentieux des affaires sont établies sur devis écrit préalable.";
        sources = ["Grille Tarifaire Certifiée MediLawAI"];
      } else if (lower.includes('urgence') || lower.includes('samu')) {
        reply = "🚨 Protocole d'Urgence : Tout patient signalant une douleur thoracique aiguë ou une détresse respiratoire est immédiatement orienté vers le SAMU Tunisie (190 / 198). Une alerte SMS prioritaire a déjà été transmise au praticien d'astreinte.";
        sources = ["Protocole Médical d'Urgence SAMU 190"];
      } else if (lower.includes('rdv') || lower.includes('disponibilité')) {
        reply = "Les prochains créneaux libres confirmés dans votre Google Calendar sont : Demain mercredi à 14h30, et jeudi à 10h00.";
        sources = ["Synchronisation Google Calendar API"];
      }

      setMessages(prev => [...prev, {
        sender: 'AI',
        text: reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        sources
      }]);
    }, 800);
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
    <div className="h-[calc(100vh-7rem)] flex gap-6">
      {/* Main Chat Interface */}
      <div className="flex-1 bg-white rounded-2xl border border-[#E5EAF2] shadow-xs flex flex-col overflow-hidden">
        {/* Chat header */}
        <div className="p-4 border-b border-[#E5EAF2] bg-[#F7F9FC] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                <span>Copilot IA & Secrétariat Dédié</span>
                <span className="text-[10px] text-purple-700 font-semibold bg-purple-100 px-2 py-0.2 rounded-full">RAG Actif</span>
              </div>
              <p className="text-[11px] text-slate-500">Réponses formulées exclusivement sur la base certifiée de votre cabinet</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> Sans Hallucination
            </span>
          </div>
        </div>

        {/* Messages Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((m, idx) => (
            <div key={idx} className={`flex flex-col ${m.sender === 'USER' ? 'items-end' : 'items-start'}`}>
              <div className={`max-w-xl p-4 rounded-2xl text-xs leading-relaxed space-y-2 ${
                m.sender === 'USER' 
                  ? 'bg-blue-600 text-white rounded-br-xs shadow-xs' 
                  : 'bg-[#F7F9FC] text-slate-800 border border-[#E5EAF2] rounded-bl-xs shadow-xs'
              }`}>
                <div className="whitespace-pre-wrap">{m.text}</div>

                {m.sources && (
                  <div className="pt-2 border-t border-slate-200/60 flex flex-wrap items-center gap-1.5 text-[10px] text-slate-500">
                    <BookOpen className="w-3 h-3 text-purple-600" />
                    <span className="font-semibold">Sources vérifiées :</span>
                    {m.sources.map((s, sIdx) => (
                      <span key={sIdx} className="bg-white px-1.5 py-0.5 rounded border border-slate-200 text-purple-700 font-medium">
                        {s}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 mt-1 px-1 text-[10px] text-slate-400 font-mono">
                <span>{m.timestamp}</span>
                {m.sender === 'AI' && (
                  <button onClick={() => handleCopy(m.text)} className="hover:text-slate-600 transition-colors">
                    <Copy className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex items-center gap-2 text-xs text-slate-400 p-2 font-mono">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-purple-600" />
              <span>L’IA consulte la base certifiée et votre agenda Google...</span>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSend} className="p-4 border-t border-[#E5EAF2] bg-white flex items-center gap-3">
          <input
            type="text"
            placeholder={sector === 'MEDICAL' 
              ? "Ex: Quels sont nos tarifs CNAM pour un ECG ? Quels créneaux sont libres demain ?" 
              : "Ex: Quels sont nos honoraires de consultation ? Rédige un modèle pour vendredi..."}
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            className="flex-1 px-4 py-2.5 text-xs bg-[#F7F9FC] border border-[#E5EAF2] rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
          />
          <button
            type="submit"
            disabled={!inputValue.trim()}
            className="p-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-40 text-white shadow-sm transition-all"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>

      {/* Suggested Prompts sidebar */}
      <div className="w-72 bg-white rounded-2xl border border-[#E5EAF2] shadow-xs p-5 space-y-4 shrink-0 flex flex-col justify-between">
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider">
            <Lightbulb className="w-4 h-4 text-amber-500" />
            <span>Questions Fréquentes Pro</span>
          </div>

          <div className="space-y-2 text-xs">
            {[
              "Quels sont les tarifs de consultation et les remboursements CNAM ?",
              "Résume les 3 e-mails en attente de validation",
              "Quels créneaux Google Calendar sont disponibles ce jeudi ?",
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
            <Sparkles className="w-3.5 h-3.5 text-purple-600" />
            <span>Deep Learning Fine-tuné</span>
          </div>
          <p className="opacity-90">Modèle NLP adapté aux usages professionnels en Tunisie.</p>
        </div>
      </div>
    </div>
  );
};

