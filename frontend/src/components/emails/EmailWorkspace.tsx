import React, { useState } from 'react';
import { 
  Inbox, 
  Send, 
  FileText, 
  Archive, 
  AlertTriangle, 
  Sparkles, 
  Clock, 
  CheckCircle2, 
  RefreshCw, 
  Trash2, 
  Edit3, 
  Languages, 
  SlidersHorizontal,
  Search,
  Calendar,
  MessageSquare,
  ShieldCheck,
  Bot
} from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore';
import type { EmailItem } from '../../types';

export const EmailWorkspace: React.FC = () => {
  const { emails, updateEmailStatus, showToast, sector, addEmail } = useAppStore();
  const [selectedEmailId, setSelectedEmailId] = useState<string>(emails[0]?.id || '');
  const [activeFolder, setActiveFolder] = useState<string>('all');
  const [filterSearch, setFilterSearch] = useState<string>('');
  const [isEditingDraft, setIsEditingDraft] = useState<boolean>(false);
  const [editedDraft, setEditedDraft] = useState<string>('');

  const selectedEmail = emails.find(e => e.id === selectedEmailId) || emails[0];

  const filteredEmails = emails.filter(e => {
    if (activeFolder === 'pending' && e.status !== 'PENDING_VALIDATION') return false;
    if (activeFolder === 'urgent' && e.intent !== 'EMERGENCY') return false;
    if (activeFolder === 'appointments' && e.intent !== 'APPOINTMENT') return false;
    if (activeFolder === 'pricing' && e.intent !== 'PRICING') return false;
    if (filterSearch) {
      const q = filterSearch.toLowerCase();
      return e.sender.name.toLowerCase().includes(q) || e.subject.toLowerCase().includes(q) || e.body.toLowerCase().includes(q);
    }
    return true;
  });

  const handleApprove = () => {
    if (!selectedEmail) return;
    updateEmailStatus(selectedEmail.id, 'VALIDATED_AND_SENT', editedDraft || selectedEmail.draftReply);
    showToast({
      title: 'E-mail validé et transmis au patient !',
      message: `La réponse a été expédiée avec succès à ${selectedEmail.sender.email}`,
      type: 'success'
    });
    setIsEditingDraft(false);
  };

  const handleRegenerate = (tone: string) => {
    if (!selectedEmail) return;
    let newReply = selectedEmail.draftReply;
    if (tone === 'SHORT') {
      newReply = `Bonjour,\nVotre demande a bien été prise en compte par le cabinet. Le créneau est réservé.\nCordialement,\nSecrétariat.`;
    } else if (tone === 'FORMAL') {
      newReply = `Monsieur/Madame,\nNous vous confirmons la bonne réception de votre correspondance. Le praticien a examiné vos disponibilités avec la plus grande attention.\nRestant à votre disposition,\nSecrétariat Général.`;
    }
    setEditedDraft(newReply);
    setIsEditingDraft(true);
    showToast({
      title: 'Texte reformulé par l’IA',
      message: `Le ton a été ajusté en style ${tone}.`,
      type: 'info'
    });
  };

  return (
    <div className="h-[calc(100vh-7rem)] flex flex-col space-y-4">
      {/* Top action bar */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-[#14213D] tracking-tight">Boîte de Réception & Tri IA</h1>
          <p className="text-xs text-slate-500">Classification NLP automatique en 5 catégories et validation Human-in-the-Loop</p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500">
            Total : {filteredEmails.length} messages
          </span>
        </div>
      </div>

      {/* 3-Panel Email Layout */}
      <div className="flex-1 bg-white rounded-2xl border border-[#E5EAF2] shadow-xs flex overflow-hidden">
        {/* Panel 1: Folders / Filters (Left) */}
        <div className="w-56 border-r border-[#E5EAF2] bg-[#F7F9FC] p-3 flex flex-col justify-between shrink-0">
          <div className="space-y-1">
            <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Dossiers & Filtres IA
            </div>

            {[
              { id: 'all', label: 'Tous les e-mails', icon: Inbox, count: emails.length },
              { id: 'pending', label: 'À Valider (Human)', icon: Clock, count: emails.filter(e => e.status === 'PENDING_VALIDATION').length, highlight: true },
              { id: 'urgent', label: 'Urgences SAMU 190', icon: AlertTriangle, count: emails.filter(e => e.intent === 'EMERGENCY').length, urgent: true },
              { id: 'appointments', label: 'Demandes de RDV', icon: Calendar, count: emails.filter(e => e.intent === 'APPOINTMENT').length },
              { id: 'pricing', label: 'Tarifs & CNAM', icon: FileText, count: emails.filter(e => e.intent === 'PRICING').length },
            ].map(folder => {
              const Icon = folder.icon;
              const isActive = activeFolder === folder.id;
              return (
                <button
                  key={folder.id}
                  onClick={() => setActiveFolder(folder.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-200/60 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <Icon className={`w-4 h-4 shrink-0 ${
                      isActive ? 'text-white' : folder.urgent ? 'text-rose-500' : 'text-slate-400'
                    }`} />
                    <span className="truncate">{folder.label}</span>
                  </div>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    isActive ? 'bg-white/20 text-white' : folder.urgent ? 'bg-rose-100 text-rose-700' : 'bg-slate-200 text-slate-600'
                  }`}>
                    {folder.count}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Garantie CDC 2026</span>
            </div>
            <p className="text-[10px] text-slate-500 leading-relaxed">
              Aucun e-mail sensible n'est expédié sans accord préalable.
            </p>
          </div>
        </div>

        {/* Panel 2: Email List (Center) */}
        <div className="w-80 border-r border-[#E5EAF2] flex flex-col shrink-0">
          <div className="p-3 border-b border-[#E5EAF2]">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Filtrer les messages..."
                value={filterSearch}
                onChange={e => setFilterSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-[#F7F9FC] border border-[#E5EAF2] rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {filteredEmails.map(em => {
              const isSelected = selectedEmail?.id === em.id;
              const isUrgent = em.intent === 'EMERGENCY';
              return (
                <div
                  key={em.id}
                  onClick={() => { setSelectedEmailId(em.id); setIsEditingDraft(false); setEditedDraft(''); }}
                  className={`p-3.5 cursor-pointer transition-all ${
                    isSelected ? 'bg-blue-50/70 border-l-4 border-blue-600' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-xs text-slate-900 truncate">{em.sender.name}</span>
                    <span className="text-[10px] text-slate-400 font-mono">{em.receivedAt.split(' ')[1]}</span>
                  </div>

                  <div className="text-xs font-semibold text-slate-800 truncate mb-1">{em.subject}</div>
                  <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">{em.body}</p>

                  <div className="flex items-center gap-1.5 mt-2">
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                      isUrgent 
                        ? 'bg-rose-100 text-rose-700 border border-rose-300' 
                        : em.intent === 'APPOINTMENT' 
                        ? 'bg-blue-100 text-blue-700' 
                        : 'bg-slate-100 text-slate-700'
                    }`}>
                      {em.intent}
                    </span>

                    {em.status === 'VALIDATED_AND_SENT' ? (
                      <span className="text-[9px] font-semibold text-emerald-600 flex items-center gap-0.5">
                        <CheckCircle2 className="w-3 h-3" /> Envoyé
                      </span>
                    ) : (
                      <span className="text-[9px] font-semibold text-amber-600 flex items-center gap-0.5">
                        <Clock className="w-3 h-3" /> En attente
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Panel 3: Email Preview & AI Response Generator (Right) */}
        {selectedEmail ? (
          <div className="flex-1 flex flex-col overflow-y-auto bg-white p-6 space-y-6">
            {/* Header info */}
            <div className="border-b border-[#E5EAF2] pb-4 space-y-3">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-black text-[#14213D]">{selectedEmail.subject}</h2>
                  <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                    <span className="font-semibold text-slate-800">{selectedEmail.sender.name}</span>
                    <span>&lt;{selectedEmail.sender.email}&gt;</span>
                    {selectedEmail.sender.phone && (
                      <span className="text-blue-600 font-semibold">• {selectedEmail.sender.phone}</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                    Confiance IA : {(selectedEmail.confidence * 100).toFixed(0)}%
                  </span>
                </div>
              </div>

              {/* Extracted Entities if present */}
              {selectedEmail.extractedEntities && (
                <div className="p-3 bg-[#F7F9FC] rounded-xl border border-slate-200 flex flex-wrap items-center gap-4 text-xs">
                  <div className="flex items-center gap-1.5 text-slate-500">
                    <Bot className="w-3.5 h-3.5 text-purple-600" />
                    <span className="font-bold text-slate-700">Entités Extraites :</span>
                  </div>
                  {selectedEmail.extractedEntities.requestedDate && (
                    <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-medium">
                      Date : {selectedEmail.extractedEntities.requestedDate}
                    </span>
                  )}
                  {selectedEmail.extractedEntities.requestedTime && (
                    <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-medium">
                      Heure : {selectedEmail.extractedEntities.requestedTime}
                    </span>
                  )}
                  {selectedEmail.extractedEntities.specialtyOrService && (
                    <span className="px-2 py-0.5 rounded bg-purple-100 text-purple-800 font-medium">
                      Service : {selectedEmail.extractedEntities.specialtyOrService}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Original message content */}
            <div className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed p-4 bg-[#F7F9FC] rounded-xl border border-slate-100">
              {selectedEmail.body}
            </div>

            {/* AI Generated Draft Section */}
            <div className="p-5 rounded-2xl bg-gradient-to-b from-blue-50/50 to-white border border-blue-200/80 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-blue-600" />
                  <h3 className="text-xs font-bold text-[#14213D] uppercase tracking-wider">
                    Proposition de Réponse IA ({sector === 'MEDICAL' ? 'Dr. Ben Salem' : 'Me. Trabelsi'})
                  </h3>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleRegenerate('SHORT')}
                    className="px-2 py-1 text-[11px] font-semibold bg-white border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600"
                  >
                    Raccourcir
                  </button>
                  <button
                    onClick={() => handleRegenerate('FORMAL')}
                    className="px-2 py-1 text-[11px] font-semibold bg-white border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600"
                  >
                    Plus Formel
                  </button>
                </div>
              </div>

              {isEditingDraft ? (
                <textarea
                  value={editedDraft}
                  onChange={e => setEditedDraft(e.target.value)}
                  rows={6}
                  className="w-full p-3 text-xs border border-blue-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              ) : (
                <div className="p-3 text-xs bg-white rounded-xl border border-blue-100 whitespace-pre-wrap leading-relaxed text-slate-800">
                  {editedDraft || selectedEmail.draftReply}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-2">
                <button
                  onClick={() => {
                    if (!isEditingDraft) setEditedDraft(selectedEmail.draftReply);
                    setIsEditingDraft(!isEditingDraft);
                  }}
                  className="text-xs text-slate-500 hover:text-slate-800 font-semibold flex items-center gap-1"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>{isEditingDraft ? 'Annuler modification' : 'Modifier le texte'}</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleApprove}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-600/20 flex items-center gap-1.5 transition-all"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Valider & Envoyer Maintenant</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-slate-400 text-xs">
            Sélectionnez un e-mail dans la liste pour afficher les détails.
          </div>
        )}
      </div>
    </div>
  );
};
