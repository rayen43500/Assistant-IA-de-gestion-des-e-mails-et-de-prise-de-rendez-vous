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
  Bot,
  ArrowLeft
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
  const [showMobileDetail, setShowMobileDetail] = useState<boolean>(false);

  const selectedEmail = emails.find(e => e.id === selectedEmailId) || emails[0];

  const filteredEmails = emails.filter(e => {
    // Sector-specific isolation: Medical emails vs Legal correspondences
    const isLegalEmail = e.subject.toLowerCase().includes('juridique') || e.body.toLowerCase().includes('tribunal') || e.body.toLowerCase().includes('avocat') || e.body.toLowerCase().includes('société');
    if (sector === 'MEDICAL' && isLegalEmail) return false;
    if (sector === 'LEGAL' && !isLegalEmail && (e.intent === 'EMERGENCY' || e.body.toLowerCase().includes('palpitation') || e.body.toLowerCase().includes('cardio'))) return false;

    if (activeFolder === 'pending' && e.status !== 'PENDING_VALIDATION') return false;
    if (activeFolder === 'urgent' && e.intent !== 'EMERGENCY') return false;
    if (activeFolder === 'appointments' && e.intent !== 'APPOINTMENT') return false;
    if (activeFolder === 'pricing' && e.intent !== 'PRICING') return false;
    if (activeFolder === 'unassigned' && e.status !== 'NEEDS_CLARIFICATION' && e.status !== 'UNASSIGNED' && e.status !== 'WAITING_FOR_REPLY') return false;
    if (activeFolder === 'sent' && e.status !== 'VALIDATED_AND_SENT' && e.status !== 'SENT') return false;
    if (filterSearch) {
      const q = filterSearch.toLowerCase();
      return e.sender.name.toLowerCase().includes(q) || e.subject.toLowerCase().includes(q) || e.body.toLowerCase().includes(q);
    }
    return true;
  });

  const simulateScenario = async (scenarioNumber: number) => {
    try {
      const res = await fetch('http://localhost:5000/api/emails/simulate-scenario', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenarioNumber }),
      });
      if (res.ok) {
        const data = await res.json();
        const em = data.email || data;
        const newEmailItem: EmailItem = {
          id: em.id || em._id || 'em-' + Date.now(),
          sender: em.sender || { name: 'Contact Externe', email: 'contact@example.com' },
          subject: em.subject || 'Sans objet',
          body: em.body || em.bodyText || '',
          receivedAt: 'À l’instant',
          isRead: false,
          intent: (em.intent || 'APPOINTMENT') as any,
          priority: em.intent === 'EMERGENCY' ? 'CRITICAL' : 'MEDIUM',
          status: em.status || 'PENDING_VALIDATION',
          confidence: em.confidence || 0.92,
          draftReply: em.draftReply || em.clarificationMessage || '',
          folder: (em.status === 'WAITING_FOR_REPLY' || em.status === 'NEEDS_CLARIFICATION') ? 'unassigned' : 'inbox',
          scenario: data.scenario || scenarioNumber,
          isRegisteredContact: data.contact?.isRegistered || false,
          detectedLanguage: em.detectedLanguage || 'FR',
          recipient: 'contact@medilawai.com',
          extractedEntities: em.extractedEntities,
        };
        addEmail(newEmailItem);
        setSelectedEmailId(newEmailItem.id);
        showToast({
          title: `Scénario ${scenarioNumber} Injecté avec Succès !`,
          message: data.scenarioDescription || `Message traité et orienté vers l'espace du Dr. Rayen B.`,
          type: 'success',
        });
      }
    } catch (err: any) {
      showToast({
        title: 'Erreur Simulation',
        message: err.message,
        type: 'error',
      });
    }
  };

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-[#E5EAF2]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-black text-[#14213D] tracking-tight">Messagerie Centralisée MediLawAI</h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
              Boîte Centrale Unique
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Réception & Envoi : <span className="font-semibold text-blue-600">contact@medilawai.com</span> • Espace sécurisé : <span className="font-semibold text-slate-700">Dr. Rayen B.</span>
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-1.5">
          <span className="text-[11px] font-bold text-slate-500 mr-1">Tester Scénario :</span>
          <button
            onClick={() => simulateScenario(1)}
            className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-bold transition-all border border-blue-200"
            title="Scénario 1 : Patient inscrit + Médecin identifié"
          >
            1. Inscrit + Médecin
          </button>
          <button
            onClick={() => simulateScenario(2)}
            className="px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg text-xs font-bold transition-all border border-purple-200"
            title="Scénario 2 : Patient non inscrit (externe) + Médecin identifié"
          >
            2. Externe + Médecin
          </button>
          <button
            onClick={() => simulateScenario(3)}
            className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg text-xs font-bold transition-all border border-amber-200"
            title="Scénario 3 : Patient inscrit + Médecin inconnu (Clarification)"
          >
            3. Inscrit + Inconnu
          </button>
          <button
            onClick={() => simulateScenario(4)}
            className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-bold transition-all border border-rose-200"
            title="Scénario 4 : Patient non inscrit + Médecin inconnu (Clarification sans compte)"
          >
            4. Externe + Inconnu
          </button>
        </div>
      </div>

      {/* Mobile folder filter pills (visible on small/medium screens) */}
      <div className="flex lg:hidden overflow-x-auto gap-1.5 pb-1 no-scrollbar shrink-0">
        {[
          { id: 'all', label: 'Tous', count: emails.length },
          { id: 'pending', label: 'À Valider', count: emails.filter(e => e.status === 'PENDING_VALIDATION').length },
          { id: 'urgent', label: 'Urgences', count: emails.filter(e => e.intent === 'EMERGENCY').length },
          { id: 'appointments', label: 'RDV', count: emails.filter(e => e.intent === 'APPOINTMENT').length },
          { id: 'pricing', label: 'Tarifs', count: emails.filter(e => e.intent === 'PRICING').length },
        ].map(folder => (
          <button
            key={folder.id}
            onClick={() => { setActiveFolder(folder.id); setShowMobileDetail(false); }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              activeFolder === folder.id
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white border border-[#E5EAF2] text-slate-700 hover:bg-slate-50'
            }`}
          >
            {folder.label} ({folder.count})
          </button>
        ))}
      </div>

      {/* 3-Panel Email Layout */}
      <div className="flex-1 bg-white rounded-2xl border border-[#E5EAF2] shadow-xs flex overflow-hidden">
        {/* Panel 1: Folders / Filters (Left - Hidden on mobile/tablet) */}
        <div className="hidden lg:flex w-56 border-r border-[#E5EAF2] bg-[#F7F9FC] p-3 flex-col justify-between shrink-0">
          <div className="space-y-1">
            <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Dossiers & Filtres IA
            </div>

            {[
              { id: 'all', label: 'Tous les e-mails', icon: Inbox, count: emails.length },
              { id: 'pending', label: 'À Valider (Human)', icon: Clock, count: emails.filter(e => e.status === 'PENDING_VALIDATION').length, highlight: true },
              { id: 'urgent', label: 'Urgences SAMU 190', icon: AlertTriangle, count: emails.filter(e => e.intent === 'EMERGENCY').length, urgent: true },
              { id: 'appointments', label: 'Demandes de RDV', icon: Calendar, count: emails.filter(e => e.intent === 'APPOINTMENT').length },
              { id: 'unassigned', label: 'Non Attribués / Clarif', icon: MessageSquare, count: emails.filter(e => e.status === 'NEEDS_CLARIFICATION' || e.status === 'WAITING_FOR_REPLY' || e.status === 'UNASSIGNED').length },
              { id: 'sent', label: 'Envoyés (Central)', icon: Send, count: emails.filter(e => e.status === 'VALIDATED_AND_SENT' || e.status === 'SENT').length },
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

        {/* Panel 2: Email List (Center - Full width on mobile when no detail is open) */}
        <div className={`${showMobileDetail ? 'hidden md:flex' : 'flex'} w-full md:w-80 border-r border-[#E5EAF2] flex-col shrink-0`}>
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
                  onClick={() => { 
                    setSelectedEmailId(em.id); 
                    setIsEditingDraft(false); 
                    setEditedDraft(''); 
                    setShowMobileDetail(true);
                  }}
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

        {/* Panel 3: Email Preview & AI Response Generator (Right - Full width on mobile when detail is open) */}
        {selectedEmail ? (
          <div className={`${showMobileDetail ? 'flex' : 'hidden md:flex'} flex-1 flex-col overflow-y-auto bg-white p-4 sm:p-6 space-y-6`}>
            {/* Mobile Back Button to return to list */}
            <button
              onClick={() => setShowMobileDetail(false)}
              className="md:hidden flex items-center gap-1.5 text-xs font-bold text-blue-600 p-2 rounded-xl bg-blue-50 hover:bg-blue-100 w-fit transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Retour à la boîte de réception</span>
            </button>

            {/* Header info */}
            <div className="border-b border-[#E5EAF2] pb-4 space-y-3">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h2 className="text-lg font-black text-[#14213D]">{selectedEmail.subject}</h2>
                    {selectedEmail.scenario && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800">
                        Scénario {selectedEmail.scenario}
                      </span>
                    )}
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      selectedEmail.isRegisteredContact
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-purple-100 text-purple-800'
                    }`}>
                      {selectedEmail.isRegisteredContact ? 'Patient Inscrit' : 'Contact Externe (Non inscrit)'}
                    </span>
                    {selectedEmail.detectedLanguage && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                        Langue : {selectedEmail.detectedLanguage}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-xs text-slate-500 flex-wrap">
                    <span className="font-semibold text-slate-800">{selectedEmail.sender.name}</span>
                    <span>&lt;{selectedEmail.sender.email}&gt;</span>
                    <span className="text-slate-400">vers</span>
                    <span className="font-semibold text-blue-600">contact@medilawai.com</span>
                    {selectedEmail.sender.phone && (
                      <span className="text-blue-600 font-semibold">• {selectedEmail.sender.phone}</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
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
                    <span>Valider & Expédier via contact@medilawai.com</span>
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
