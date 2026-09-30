import React, { useState } from 'react';
import { 
  BookOpen, 
  Plus, 
  FileText, 
  Sparkles, 
  Search, 
  CheckCircle, 
  ExternalLink,
  ShieldCheck
} from 'lucide-react';

export default function KnowledgeView({ documents, onAddDocument, onQueryRag }) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('TARIFS');
  const [newContent, setNewContent] = useState('');

  // Test RAG
  const [question, setQuestion] = useState('Quels sont les tarifs du cabinet et le remboursement CNAM ?');
  const [ragResult, setRagResult] = useState(null);
  const [isSearching, setIsSearching] = useState(false);

  const handleAddSubmit = (e) => {
    e.preventDefault();
    onAddDocument({
      title: newTitle,
      category: newCategory,
      content: newContent,
    });
    setShowAddModal(false);
    setNewTitle('');
    setNewContent('');
  };

  const handleTestRag = async (e) => {
    e.preventDefault();
    setIsSearching(true);
    const result = await onQueryRag(question);
    setRagResult(result);
    setIsSearching(false);
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-400" />
            <span>Base de Connaissances & RAG (Retrieval-Augmented Generation)</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            L'IA s'appuie strictement sur ces documents indexés pour répondre sans hallucinations.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-500/20 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Ajouter un Document / Tarif</span>
        </button>
      </div>

      {/* Test Interactif RAG */}
      <div className="glass-panel p-6 rounded-2xl border border-indigo-500/30 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <span>Tester l'Agent RAG sur la Base du Cabinet</span>
          </h2>
          <span className="text-[11px] text-indigo-300 bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">
            Recherche Sémantique Active
          </span>
        </div>

        <form onSubmit={handleTestRag} className="flex gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-indigo-500"
              placeholder="Posez une question sur les horaires, tarifs ou documents requis..."
              required
            />
          </div>
          <button
            type="submit"
            disabled={isSearching}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white text-xs font-bold shadow-lg shadow-indigo-500/20 transition-all shrink-0"
          >
            {isSearching ? 'Recherche vectorielle...' : 'Interroger l\'IA'}
          </button>
        </form>

        {ragResult && (
          <div className="p-4 rounded-xl bg-slate-900/80 border border-indigo-500/20 space-y-3">
            <div className="text-xs text-slate-300 leading-relaxed font-mono whitespace-pre-line">
              <span className="text-indigo-400 font-bold block mb-1">Réponse générée certifiée :</span>
              {ragResult.answer}
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800 text-[11px]">
              <span className="text-slate-400 font-semibold">Sources citées par le RAG :</span>
              {ragResult.sources?.map((s, idx) => (
                <span key={idx} className="bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-md border border-indigo-500/30 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3 text-indigo-400" />
                  <span>{s}</span>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Liste des Documents Indexés */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {documents.map((doc, idx) => (
          <div key={idx} className="glass-panel p-5 rounded-2xl space-y-3 border border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-800 text-indigo-400 border border-slate-700">
                {doc.category}
              </span>
              <FileText className="w-4 h-4 text-slate-500" />
            </div>

            <h3 className="text-sm font-bold text-white">{doc.title}</h3>

            <p className="text-xs text-slate-400 leading-relaxed line-clamp-4">
              {doc.content}
            </p>

            <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
              <span className="flex items-center gap-1 text-emerald-400">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Indexé & Embeddings prêts</span>
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Modal d'ajout de document */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-lg rounded-2xl p-6 border border-slate-700 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-indigo-400" />
                <span>Ajouter un Document à la Base RAG</span>
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Titre du document</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Ex : Barème des honoraires et tiers-payant"
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white"
                  required
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Catégorie</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white"
                >
                  <option value="TARIFS">Tarifs & Honoraires</option>
                  <option value="HORAIRES">Horaires & Permanences</option>
                  <option value="PROCEDURES">Procédures & Formalités</option>
                  <option value="PIECES_REQUISES">Pièces et justificatifs CNAM</option>
                  <option value="SPECIALITES">Spécialités du praticien</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Texte / Contenu du document</label>
                <textarea
                  rows={6}
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder="Rédigez ou collez le texte officiel du cabinet ici. Il sera découpé en fragments vectoriels pour le RAG..."
                  className="w-full p-3 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-500/20"
                >
                  Enregistrer et Vectoriser
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
