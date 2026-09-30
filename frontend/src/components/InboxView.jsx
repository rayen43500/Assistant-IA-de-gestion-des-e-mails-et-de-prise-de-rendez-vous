import React, { useState } from 'react';
import { 
  Inbox, 
  Search, 
  Filter, 
  CheckCircle2, 
  Send, 
  Sparkles, 
  AlertOctagon, 
  Clock, 
  User, 
  CalendarPlus,
  PlusCircle,
  FileCheck
} from 'lucide-react';

export default function InboxView({ emails, onValidateEmail, onSimulateIncomingEmail }) {
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEmail, setSelectedEmail] = useState(emails[0] || null);
  const [editedReply, setEditedReply] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  // Modal simulation nouvel e-mail entrant
  const [showSimulateModal, setShowSimulateModal] = useState(false);
  const [newSubject, setNewSubject] = useState('Demande de consultation pour contrôle tension');
  const [newBody, setNewBody] = useState('Bonjour Dr. Ben Salem, j\'aimerais prendre un rendez-vous ce vendredi vers 14h30 pour un bilan de tension. Bien cordialement, Sami Ben Amor.');
  const [newSenderName, setNewSenderName] = useState('Sami Ben Amor');
  const [newSenderEmail, setNewSenderEmail] = useState('sami.ba@gmail.com');

  const filteredEmails = emails.filter((email) => {
    const matchesCategory = selectedCategory === 'ALL' || email.intent === selectedCategory;
    const matchesSearch = 
      email.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      email.body?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      email.sender?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleSelectEmail = (email) => {
    setSelectedEmail(email);
    setEditedReply(email.draftReply || '');
    setIsEditing(false);
  };

  const handleSimulateSubmit = (e) => {
    e.preventDefault();
    onSimulateIncomingEmail({
      subject: newSubject,
      body: newBody,
      sender: { name: newSenderName, email: newSenderEmail },
    });
    setShowSimulateModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Barre d'outils supérieure */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Inbox className="w-5 h-5 text-blue-400" />
            <span>Boîte de Réception Intelligente</span>
          </h1>
          <span className="text-xs text-slate-400">({filteredEmails.length} messages)</span>
        </div>

        {/* Bouton de simulation d'arrivée d'e-mail */}
        <button
          onClick={() => setShowSimulateModal(true)}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-lg shadow-blue-500/20 transition-all"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Simuler un e-mail entrant (Test IA)</span>
        </button>
      </div>

      {/* Filtres par Catégorie & Recherche */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 glass-panel p-3 rounded-xl">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
          {[
            { id: 'ALL', label: 'Tous' },
            { id: 'APPOINTMENT', label: 'Rendez-vous' },
            { id: 'PRICING', label: 'Tarifs' },
            { id: 'EMERGENCY', label: 'Urgences' },
            { id: 'ADMINISTRATIVE', label: 'Administratif' },
            { id: 'SPAM', label: 'Spam' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                selectedCategory === cat.id
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Recherche */}
        <div className="relative w-full md:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Rechercher par expéditeur, sujet..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Grille Double Panneau : Liste à gauche, Détails & Validation à droite */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[550px]">
        {/* Panneau de Gauche : Liste des E-mails */}
        <div className="lg:col-span-5 glass-panel rounded-2xl p-3 space-y-2 overflow-y-auto max-h-[600px]">
          {filteredEmails.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              Aucun e-mail trouvé pour ce filtre.
            </div>
          ) : (
            filteredEmails.map((email) => {
              const isSelected = selectedEmail && (selectedEmail.id === email.id || selectedEmail._id === email._id);
              return (
                <div
                  key={email.id || email._id}
                  onClick={() => handleSelectEmail(email)}
                  className={`p-3.5 rounded-xl cursor-pointer transition-all border ${
                    isSelected
                      ? 'bg-blue-600/15 border-blue-500/40 shadow-sm'
                      : 'glass-card border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-white truncate">
                      {email.sender?.name}
                    </span>
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                      email.intent === 'EMERGENCY' ? 'badge-emergency' :
                      email.intent === 'APPOINTMENT' ? 'badge-appointment' :
                      email.intent === 'PRICING' ? 'badge-pricing' :
                      email.intent === 'SPAM' ? 'badge-spam' : 'badge-administrative'
                    }`}>
                      {email.intent}
                    </span>
                  </div>

                  <h4 className="text-xs text-slate-300 font-medium mt-1 truncate">
                    {email.subject}
                  </h4>

                  <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                    {email.body}
                  </p>

                  <div className="mt-2.5 flex items-center justify-between text-[10px] text-slate-500">
                    <span>Confiance: {Math.round((email.confidence || 0.9) * 100)}%</span>
                    <span className={`font-semibold ${
                      email.status === 'VALIDATED_AND_SENT' ? 'text-emerald-400' :
                      email.status === 'ESCALATED_EMERGENCY' ? 'text-red-400 font-bold' :
                      'text-amber-400'
                    }`}>
                      {email.status}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Panneau de Droite : Détail, IA & Action de validation */}
        <div className="lg:col-span-7 glass-panel rounded-2xl p-6 flex flex-col justify-between">
          {selectedEmail ? (
            <div className="space-y-5">
              {/* Entête e-mail */}
              <div className="border-b border-slate-800 pb-4">
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-md ${
                    selectedEmail.intent === 'EMERGENCY' ? 'badge-emergency' :
                    selectedEmail.intent === 'APPOINTMENT' ? 'badge-appointment' :
                    selectedEmail.intent === 'PRICING' ? 'badge-pricing' : 'badge-administrative'
                  }`}>
                    Classification IA : {selectedEmail.intent} ({Math.round((selectedEmail.confidence || 0.9) * 100)}%)
                  </span>
                  <span className="text-xs text-slate-400">
                    Statut : <span className="font-semibold text-white">{selectedEmail.status}</span>
                  </span>
                </div>

                <h2 className="text-lg font-bold text-white mt-2">
                  {selectedEmail.subject}
                </h2>
                <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-slate-200 font-medium">{selectedEmail.sender?.name}</span>
                  <span>&lt;{selectedEmail.sender?.email}&gt;</span>
                </div>
              </div>

              {/* Contenu du message original */}
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-200 leading-relaxed">
                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Message du patient / client :
                </div>
                {selectedEmail.body}
              </div>

              {/* Alerte si Urgence Détectée */}
              {selectedEmail.intent === 'EMERGENCY' && (
                <div className="p-4 rounded-xl bg-red-950/40 border border-red-500/50 flex items-start gap-3">
                  <AlertOctagon className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                  <div className="text-xs space-y-1">
                    <p className="font-bold text-red-300">PROTOCOLE D'URGENCE VITAL DÉCLENCHÉ</p>
                    <p className="text-red-300/80 leading-relaxed">
                      L'IA a détecté des symptômes graves. Aucune réponse automatique standard n'est expédiée sans accord préalable.
                      Recommandation : Contacter immédiatement le patient ou rediriger vers le 190 (SAMU Tunisie).
                    </p>
                  </div>
                </div>
              )}

              {/* Proposition de Réponse de l'IA (Human-in-the-Loop) */}
              <div className="p-4 rounded-xl bg-gradient-to-br from-slate-900 via-slate-900/80 to-blue-950/30 border border-blue-500/20 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-semibold text-blue-300">
                    <Sparkles className="w-4 h-4 text-blue-400" />
                    <span>Réponse contextuelle préparée par l'Assistant IA</span>
                  </div>
                  <button
                    onClick={() => setIsEditing(!isEditing)}
                    className="text-[11px] text-blue-400 hover:text-blue-300 underline"
                  >
                    {isEditing ? 'Terminer la modification' : 'Modifier manuellement'}
                  </button>
                </div>

                {isEditing ? (
                  <textarea
                    rows={6}
                    value={editedReply}
                    onChange={(e) => setEditedReply(e.target.value)}
                    className="w-full p-3 rounded-lg bg-slate-950 border border-blue-500/40 text-xs text-white font-mono focus:outline-none"
                  />
                ) : (
                  <div className="text-xs text-slate-300 font-mono whitespace-pre-line leading-relaxed bg-slate-950/50 p-3 rounded-lg border border-slate-800">
                    {editedReply || selectedEmail.draftReply || 'Aucune réponse générée.'}
                  </div>
                )}
              </div>

              {/* Boutons d'Action (Validation en 1-clic) */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={() => onValidateEmail(selectedEmail.id || selectedEmail._id, editedReply, true)}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-blue-500/20 flex items-center gap-2 transition-all"
                >
                  <Send className="w-4 h-4" />
                  <span>Valider & Envoyer par e-mail (1 Clic)</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 text-xs py-12">
              <Inbox className="w-12 h-12 text-slate-600 mb-2" />
              <span>Sélectionnez un e-mail pour prévisualiser l'analyse IA.</span>
            </div>
          )}
        </div>
      </div>

      {/* Modal Simulateur d'Ingestion d'e-mail */}
      {showSimulateModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-lg rounded-2xl p-6 border border-slate-700 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-400" />
                <span>Simulateur d'Ingestion d'E-mail (Pipeline IA)</span>
              </h3>
              <button
                onClick={() => setShowSimulateModal(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSimulateSubmit} className="space-y-4">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Nom du patient / client</label>
                <input
                  type="text"
                  value={newSenderName}
                  onChange={(e) => setNewSenderName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white"
                  required
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Adresse e-mail expéditeur</label>
                <input
                  type="email"
                  value={newSenderEmail}
                  onChange={(e) => setNewSenderEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white"
                  required
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Objet de l'e-mail</label>
                <input
                  type="text"
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white"
                  required
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Corps du message</label>
                <textarea
                  rows={4}
                  value={newBody}
                  onChange={(e) => setNewBody(e.target.value)}
                  className="w-full p-3 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSimulateModal(false)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-500/20"
                >
                  Traiter via le modèle IA
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
