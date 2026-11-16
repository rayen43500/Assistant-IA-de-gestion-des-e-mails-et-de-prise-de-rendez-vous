import React, { useState } from 'react';
import { 
  Send, 
  MessageSquare, 
  CheckCircle2, 
  Clock, 
  Bot, 
  Sparkles, 
  Plus, 
  User,
  HelpCircle
} from 'lucide-react';
import { useAppStore } from '../../../stores/useAppStore';

export const PatientMyRequestsTab: React.FC = () => {
  const { ingestNewEmail, showToast } = useAppStore();

  const [subject, setSubject] = useState('');
  const [question, setQuestion] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [requests, setRequests] = useState([
    {
      id: 'req-1',
      subject: 'Prise en charge CNAM pour échocardiographie',
      date: 'Hier à 14h20',
      status: 'ANSWERED',
      response: 'Bonjour M. Jaziri, oui notre cabinet pratique le tiers payant CNAM filière privée (code AP1). Munissez-vous simplement de votre carnet de soins à jour lors de votre venue.',
      answeredBy: 'Dr. Youssef Ben Salem'
    },
    {
      id: 'req-2',
      subject: 'Préparation pour épreuve d’effort et ECG',
      date: 'Il y a 3 jours',
      status: 'ANSWERED',
      response: 'Il est conseillé de porter une tenue confortable et d’éviter le café 2 heures avant votre consultation.',
      answeredBy: 'Secrétariat Médical'
    }
  ]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject || !question) return;

    setIsSubmitting(true);

    // Call real ingest endpoint in background
    await ingestNewEmail({
      sender: { name: 'Amine Jaziri', email: 'amine.jaziri@gmail.com', phone: '+216 98 456 789' },
      subject,
      body: question
    });

    const newReq = {
      id: `req-${Date.now()}`,
      subject,
      date: 'À l’instant',
      status: 'PENDING',
      response: 'Votre message a été transmis au secrétariat médical. Notre IA et le praticien préparent votre réponse.',
      answeredBy: 'Traitement en cours'
    };

    setRequests([newReq, ...requests]);
    setSubject('');
    setQuestion('');
    setIsSubmitting(false);

    showToast({
      title: 'Message transmis au cabinet',
      message: 'Le secrétariat du Dr. Ben Salem vous répondra dans les plus brefs délais.',
      type: 'success'
    });
  };

  return (
    <div className="space-y-6 font-sans">
      <div>
        <h1 className="text-xl font-black text-[#14213D] tracking-tight">Mes Demandes & Messages au Cabinet</h1>
        <p className="text-xs text-slate-500">
          Posez vos questions administratives, demandez des précisions sur vos ordonnances ou les prises en charge CNAM
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form to submit a new question (1 Col) */}
        <div className="bg-white rounded-3xl border border-[#E8EDF4] shadow-xs p-6 space-y-4">
          <h2 className="text-sm font-bold text-[#14213D] flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-[#2563EB]" />
            <span>Écrire au Cabinet Médical</span>
          </h2>

          <form onSubmit={handleSubmit} className="space-y-3 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Objet de la Demande</label>
              <input
                type="text"
                required
                placeholder="Ex: Question sur mon ordonnance"
                value={subject}
                onChange={e => setSubject(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#F7F9FC] border border-[#E8EDF4] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Votre Message</label>
              <textarea
                rows={4}
                required
                placeholder="Expliquez votre situation au Dr. Ben Salem ou à son secrétariat..."
                value={question}
                onChange={e => setQuestion(e.target.value)}
                className="w-full p-3 bg-[#F7F9FC] border border-[#E8EDF4] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]"
              />
            </div>

            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-[10px] text-amber-900 leading-relaxed">
              <strong>Rappel vital :</strong> En cas de douleur dans la poitrine ou urgence vitale, contactez directement le <strong>190 (SAMU)</strong>.
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-[#2563EB] hover:bg-blue-700 text-white rounded-xl font-bold shadow-xs flex items-center justify-center gap-2 transition-all disabled:opacity-60"
            >
              <Send className="w-4 h-4" />
              <span>Envoyer ma Demande</span>
            </button>
          </form>
        </div>

        {/* List of past requests & answers (2 Cols) */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-sm font-bold text-[#14213D]">Historique de vos Échanges</h2>

          <div className="space-y-3">
            {requests.map(req => (
              <div key={req.id} className="p-5 bg-white rounded-3xl border border-[#E8EDF4] shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-xs text-[#14213D]">{req.subject}</h3>
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                    req.status === 'ANSWERED' 
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}>
                    {req.status === 'ANSWERED' ? 'Répondu' : 'En attente'}
                  </span>
                </div>

                <div className="text-[10px] text-slate-400 font-mono">{req.date}</div>

                <div className="p-3.5 bg-[#F7F9FC] rounded-2xl border border-[#E8EDF4] text-xs leading-relaxed text-slate-800 space-y-1">
                  <div className="text-[10px] font-bold text-[#2563EB] flex items-center gap-1">
                    <Bot className="w-3.5 h-3.5" />
                    <span>Réponse de : {req.answeredBy}</span>
                  </div>
                  <p>{req.response}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
