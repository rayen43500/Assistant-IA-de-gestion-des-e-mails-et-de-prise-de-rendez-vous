import React, { useState } from 'react';
import { 
  FileText, 
  Search, 
  UploadCloud, 
  Download, 
  Eye, 
  CheckCircle2, 
  Clock, 
  Tag, 
  Plus, 
  ShieldCheck, 
  X,
  FileCheck,
  Trash2
} from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore';

export const MedicalDocumentsView: React.FC = () => {
  const { showToast } = useAppStore();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [previewDoc, setPreviewDoc] = useState<any>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);

  // New Doc Form
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('TARIFS_CNAM');
  const [newContent, setNewContent] = useState('');

  const [documents, setDocuments] = useState([
    {
      id: 'doc-1',
      title: 'Grille Tarifaire et Conventions CNAM 2026',
      category: 'TARIFS_CNAM',
      categoryLabel: 'Tarifs & CNAM',
      type: 'PDF',
      size: '240 KB',
      updatedAt: '2026-11-03',
      status: 'CERTIFIED',
      content: 'Consultation cardiologique : 70 TND. Électrocardiogramme (ECG) : 50 TND. Échocardiographie Doppler : 140 TND. Prise en charge CNAM filière privée (remboursement AP1 sur feuille de soins). Conventions actives avec la BNA, BIAT et Star Assurances.'
    },
    {
      id: 'doc-2',
      title: 'Protocole d’Urgence et Redirection SAMU 190',
      category: 'PROTOCOLES',
      categoryLabel: 'Urgences Vitales',
      type: 'PDF',
      size: '180 KB',
      updatedAt: '2026-11-01',
      status: 'CERTIFIED',
      content: 'Toute douleur thoracique aiguë persistante, détresse respiratoire ou syncope impose un appel immédiat au 190 (SAMU) ou 198 (Protection Civile). Consigne stricte de ne pas faire déplacer le patient par ses propres moyens.'
    },
    {
      id: 'doc-3',
      title: 'Ordonnance Type : Bilan Cardiovasculaire & Statines',
      category: 'ORDONNANCES',
      categoryLabel: 'Modèles Ordonnances',
      type: 'DOCX',
      size: '115 KB',
      updatedAt: '2026-10-28',
      status: 'CERTIFIED',
      content: 'Posologies types pour Atorvastatine 20mg (1cp le soir), contrôle du bilan lipidique (Cholestérol total, HDL, LDL, Triglycérides) et créatininémie à renouveler dans 3 mois.'
    },
    {
      id: 'doc-4',
      title: 'Fiche d’Information & Consentement Éclairé pour Écho-Doppler',
      category: 'CONSENTEMENT',
      categoryLabel: 'Consentements Patients',
      type: 'PDF',
      size: '320 KB',
      updatedAt: '2026-10-15',
      status: 'CERTIFIED',
      content: 'Explications de l’examen non invasif par ultrasons, absence d’effets secondaires, recueil de signature obligatoire pour les dossiers de prise en charge hospitalière.'
    },
    {
      id: 'doc-5',
      title: 'Horaires d’Ouverture et Coordonnées du Cabinet',
      category: 'ADMINISTRATIF',
      categoryLabel: 'Informations Cabinet',
      type: 'PDF',
      size: '95 KB',
      updatedAt: '2026-10-10',
      status: 'CERTIFIED',
      content: 'Du lundi au vendredi de 08h30 à 17h30. Samedi de 08h30 à 13h00. Fermé le dimanche. Adresse : Avenue Habib Bourguiba, Tunis. Téléphone : +216 71 234 567.'
    }
  ]);

  const categories = [
    { id: 'ALL', label: 'Tous les documents' },
    { id: 'TARIFS_CNAM', label: 'Tarifs & CNAM' },
    { id: 'PROTOCOLES', label: 'Protocoles SAMU' },
    { id: 'ORDONNANCES', label: 'Ordonnances Types' },
    { id: 'CONSENTEMENT', label: 'Consentements' },
    { id: 'ADMINISTRATIF', label: 'Administratif' }
  ];

  const filtered = documents.filter(doc => {
    if (categoryFilter !== 'ALL' && doc.category !== categoryFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return doc.title.toLowerCase().includes(q) || doc.content.toLowerCase().includes(q);
    }
    return true;
  });

  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newContent) return;

    const newDoc = {
      id: `doc-${Date.now()}`,
      title: newTitle,
      category: newCategory,
      categoryLabel: categories.find(c => c.id === newCategory)?.label || 'Document',
      type: 'PDF',
      size: '145 KB',
      updatedAt: 'Aujourd’hui',
      status: 'CERTIFIED',
      content: newContent
    };

    setDocuments([newDoc, ...documents]);
    setShowUploadModal(false);
    setNewTitle('');
    setNewContent('');

    showToast({
      title: 'Document indexé avec succès !',
      message: `${newDoc.title} a été ajouté à la base RAG de l’assistant IA.`,
      type: 'success'
    });
  };

  const handleDownload = (docTitle: string) => {
    showToast({
      title: 'Téléchargement initié',
      message: `${docTitle} est en cours de téléchargement sécurisé.`,
      type: 'info'
    });
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-[#14213D] tracking-tight">Bibliothèque Documentaire & Base RAG</h1>
          <p className="text-xs text-slate-500">
            Fiches de tarifs CNAM, protocoles d’urgence SAMU et modèles d’ordonnances certifiés par le Dr. Ben Salem
          </p>
        </div>

        <button
          onClick={() => setShowUploadModal(true)}
          className="px-4 py-2.5 bg-[#2563EB] hover:bg-blue-700 active:scale-[0.98] text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-2 transition-all w-fit"
        >
          <UploadCloud className="w-4 h-4" />
          <span>Ajouter un Document</span>
        </button>
      </div>

      {/* Search and Category Filters */}
      <div className="p-4 bg-white rounded-2xl border border-[#E8EDF4] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Rechercher document, tarif, protocole..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-[#F7F9FC] border border-[#E8EDF4] rounded-xl text-xs text-[#14213D] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 no-scrollbar">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setCategoryFilter(cat.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                categoryFilter === cat.id
                  ? 'bg-[#2563EB] text-white shadow-2xs'
                  : 'bg-[#F7F9FC] border border-[#E8EDF4] text-slate-600 hover:bg-slate-100'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Documents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(doc => (
          <div 
            key={doc.id}
            className="p-5 bg-white rounded-2xl border border-[#E8EDF4] shadow-xs hover:border-blue-300 transition-all flex flex-col justify-between group"
          >
            <div>
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#2563EB] flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> Certifié RAG
                </span>
              </div>

              <h3 className="font-bold text-xs text-[#14213D] leading-snug group-hover:text-[#2563EB] transition-colors">
                {doc.title}
              </h3>
              <span className="inline-block mt-1 text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.2 rounded-md">
                {doc.categoryLabel}
              </span>

              <p className="text-[11px] text-slate-500 mt-2 line-clamp-3 leading-relaxed">
                {doc.content}
              </p>
            </div>

            <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-[10px] text-slate-400 font-mono">
                {doc.type} • {doc.size}
              </span>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPreviewDoc(doc)}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-[#2563EB] hover:bg-blue-50 transition-colors"
                  title="Prévisualiser"
                >
                  <Eye className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDownload(doc.title)}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                  title="Télécharger"
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Document Preview Modal */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-[#E8EDF4] max-w-xl w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#E8EDF4] pb-3">
              <div className="flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-[#2563EB]" />
                <h3 className="font-black text-sm text-[#14213D]">{previewDoc.title}</h3>
              </div>
              <button onClick={() => setPreviewDoc(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 bg-[#F7F9FC] rounded-2xl border border-[#E8EDF4] space-y-3 text-xs leading-relaxed text-slate-800">
              <div className="flex items-center justify-between text-[11px] text-slate-500 border-b border-slate-200/60 pb-2">
                <span>Catégorie : <strong>{previewDoc.categoryLabel}</strong></span>
                <span>Mis à jour le : <strong>{previewDoc.updatedAt}</strong></span>
              </div>
              <div className="whitespace-pre-wrap font-sans">{previewDoc.content}</div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> Source active utilisée par le Copilot IA
              </span>
              <button
                onClick={() => setPreviewDoc(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Document Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-[#E8EDF4] max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#E8EDF4] pb-3">
              <h3 className="font-black text-sm text-[#14213D] flex items-center gap-2">
                <UploadCloud className="w-4 h-4 text-[#2563EB]" />
                <span>Indexer un Nouveau Document Médical</span>
              </h3>
              <button onClick={() => setShowUploadModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Titre du Document</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Grille Tarifs Consultation 2026"
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  className="w-full px-3.5 py-2 bg-[#F7F9FC] border border-[#E8EDF4] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Catégorie Médicale</label>
                <select
                  value={newCategory}
                  onChange={e => setNewCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F7F9FC] border border-[#E8EDF4] rounded-xl focus:outline-none focus:border-[#2563EB]"
                >
                  <option value="TARIFS_CNAM">Tarifs & CNAM</option>
                  <option value="PROTOCOLES">Protocoles d'Urgence SAMU</option>
                  <option value="ORDONNANCES">Modèles d'Ordonnances</option>
                  <option value="CONSENTEMENT">Consentements Éclairés</option>
                  <option value="ADMINISTRATIF">Informations Générales Cabinet</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Contenu Textuel Certifié (Pour le RAG IA)</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Indiquez les tarifs exacts, règles et consignes déontologiques..."
                  value={newContent}
                  onChange={e => setNewContent(e.target.value)}
                  className="w-full p-3 bg-[#F7F9FC] border border-[#E8EDF4] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 border border-[#E8EDF4] rounded-xl text-slate-600 font-bold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#2563EB] text-white rounded-xl font-bold shadow-xs hover:bg-blue-700"
                >
                  Certifier & Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
