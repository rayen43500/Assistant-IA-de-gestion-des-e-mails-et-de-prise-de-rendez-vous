import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  Plus, 
  Phone, 
  Mail, 
  Calendar, 
  FileText, 
  UserCheck,
  Edit2,
  Trash2,
  X,
  Stethoscope,
  Scale
} from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore';

export const ContactsDirectoryView: React.FC = () => {
  const { sector, contacts, addContact, updateContact, deleteContact, showToast } = useAppStore();
  const [search, setSearch] = useState('');
  const [selectedContact, setSelectedContact] = useState<any>(contacts[0] || null);
  // Sélection par défaut quand la liste réelle arrive du serveur
  useEffect(() => {
    if (!selectedContact && contacts.length) setSelectedContact(contacts[0]);
    if (selectedContact && !contacts.some(c => c.id === selectedContact.id || c.email === selectedContact.email)) setSelectedContact(contacts[0] || null);
  }, [contacts]);

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingContact, setEditingContact] = useState<any>(null);

  // New Contact form
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('+216 ');
  const [newIdentifier, setNewIdentifier] = useState('MED-2026-');
  const [newCategory, setNewCategory] = useState('Cardiologie');
  const [newNotes, setNewNotes] = useState('');

  const filtered = contacts.filter(c => {
    // Strict Sector-specific isolation: Medical patients vs Legal clients
    const isLegalContact = c.identifier.startsWith('JUR') || c.category.toLowerCase().includes('droit') || c.category.toLowerCase().includes('juridique');
    if (sector === 'MEDICAL' && isLegalContact) return false;
    if (sector === 'LEGAL' && !isLegalContact) return false;

    if (search) {
      const q = search.toLowerCase();
      return (
        c.name.toLowerCase().includes(q) || 
        c.email.toLowerCase().includes(q) ||
        c.identifier.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newEmail) return;

    const newC = {
      id: `c-${Date.now()}`,
      name: newName,
      email: newEmail,
      phone: newPhone,
      identifier: newIdentifier || `MED-${Date.now().toString().slice(-4)}`,
      category: newCategory,
      lastInteraction: new Date().toLocaleDateString('fr-FR'),
      totalAppointments: 0,
      notes: newNotes || ''
    };

    addContact(newC);
    setSelectedContact(newC);
    setShowAddModal(false);
    setNewName('');
    setNewEmail('');
    setNewNotes('');

    showToast({
      title: 'Dossier créé avec succès !',
      message: `Le patient ${newC.name} (${newC.identifier}) est désormais enregistré.`,
      type: 'success'
    });
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingContact) return;

    updateContact(editingContact.id, editingContact);
    if (selectedContact?.id === editingContact.id) {
      setSelectedContact(editingContact);
    }
    showToast({
      title: 'Dossier mis à jour',
      message: `Les coordonnées et notes de ${editingContact.name} ont été enregistrées.`,
      type: 'success'
    });
    setEditingContact(null);
  };

  const handleDelete = (id: string, name: string) => {
    if (!window.confirm(`Confirmez-vous la suppression du dossier de ${name} ?`)) return;
    deleteContact(id);
    if (selectedContact?.id === id) {
      const remaining = contacts.filter(c => c.id !== id);
      setSelectedContact(remaining[0] || null);
    }
    showToast({
      title: 'Dossier supprimé',
      message: `Le dossier patient de ${name} a été archivé/supprimé.`,
      type: 'warning'
    });
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-[#14213D] tracking-tight">
            {sector === 'MEDICAL' ? 'Dossiers Patients du Cabinet' : 'Répertoire Clients & Affaires'}
          </h1>
          <p className="text-xs text-slate-500">
            {sector === 'MEDICAL' 
              ? 'Historique médical confidentiel, rendez-vous et coordonnées certifiées' 
              : 'Dossiers d’entreprises, correspondances et consultations juridiques'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Rechercher nom, dossier, tél..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-8 pr-3 py-1.5 bg-white border border-[#E5EAF2] rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 bg-[#2563EB] text-white px-3.5 py-1.5 rounded-xl text-xs font-bold hover:bg-[#1d4ed8] shadow-xs transition-colors shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            Nouveau Patient
          </button>
        </div>
      </div>

      {/* Directory Table and Detail Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Table List */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-[#E5EAF2] shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[550px]">
              <thead className="bg-[#F7F9FC] border-b border-[#E5EAF2] text-slate-500 font-semibold">
                <tr>
                  <th className="p-3.5">Identifiant / Nom</th>
                  <th className="p-3.5">Coordonnées</th>
                  <th className="p-3.5">Catégorie</th>
                  <th className="p-3.5">RDV Totaux</th>
                  <th className="p-3.5">Dernier Contact</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map(contact => (
                  <tr 
                    key={contact.id} 
                    onClick={() => setSelectedContact(contact)}
                    className={`hover:bg-slate-50 cursor-pointer transition-colors ${
                      selectedContact?.id === contact.id ? 'bg-blue-50/50' : ''
                    }`}
                  >
                    <td className="p-3.5">
                      <div className="font-bold text-slate-900">{contact.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{contact.identifier}</div>
                    </td>
                    <td className="p-3.5">
                      <div className="text-slate-800">{contact.phone}</div>
                      <div className="text-[11px] text-slate-400 truncate">{contact.email}</div>
                    </td>
                    <td className="p-3.5">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                        {contact.category}
                      </span>
                    </td>
                    <td className="p-3.5 font-bold text-slate-800">
                      {contact.totalAppointments}
                    </td>
                    <td className="p-3.5 text-slate-500">
                      {contact.lastInteraction}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Contact Profile Detail */}
        {selectedContact ? (
          <div className="bg-white rounded-2xl border border-[#E5EAF2] shadow-xs p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-[#E5EAF2] pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-lg">
                  {selectedContact.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-bold text-sm text-[#14213D]">{selectedContact.name}</h3>
                  <span className="text-[11px] font-mono text-slate-400">{selectedContact.identifier}</span>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setEditingContact({ ...selectedContact })}
                  title="Modifier le dossier"
                  className="p-1.5 hover:bg-blue-50 text-slate-400 hover:text-blue-600 rounded-lg transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(selectedContact.id, selectedContact.name)}
                  title="Supprimer le dossier"
                  className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center gap-2.5 text-slate-700">
                <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                <span className="font-semibold">{selectedContact.phone}</span>
              </div>
              <div className="flex items-center gap-2.5 text-slate-700">
                <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                <span className="font-semibold truncate">{selectedContact.email}</span>
              </div>
              <div className="flex items-center gap-2.5 text-slate-700">
                <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                <span>{selectedContact.totalAppointments} consultations enregistrées</span>
              </div>
            </div>

            <div className="p-3 bg-[#F7F9FC] rounded-xl border border-slate-100 space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Notes Administratives</span>
              <p className="text-xs text-slate-700 leading-relaxed">{selectedContact.notes}</p>
            </div>

            <div className="pt-2">
              <span className="inline-block text-[10px] font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">
                Catégorie : {selectedContact.category}
              </span>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-[#E5EAF2] p-8 text-center text-slate-400 text-xs flex flex-col items-center justify-center">
            <Users className="w-8 h-8 text-slate-300 mb-2" />
            Sélectionnez un patient pour consulter sa fiche
          </div>
        )}
      </div>

      {/* Add Contact Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[#E8EDF4] shadow-2xl w-full max-w-lg p-6 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h2 className="text-base font-bold text-[#14213D] flex items-center gap-2">
                <Plus className="w-5 h-5 text-[#2563EB]" />
                Nouveau Dossier Patient
              </h2>
              <button 
                onClick={() => setShowAddModal(false)}
                className="p-1 hover:bg-slate-100 rounded-lg text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Nom et Prénom</label>
                  <input
                    type="text"
                    required
                    placeholder="ex: Yassine Trabelsi"
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    className="w-full px-3 py-2 bg-[#F7F9FC] border border-[#E8EDF4] rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">N° CNAM / Dossier</label>
                  <input
                    type="text"
                    value={newIdentifier}
                    onChange={e => setNewIdentifier(e.target.value)}
                    className="w-full px-3 py-2 bg-[#F7F9FC] border border-[#E8EDF4] rounded-xl text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Téléphone</label>
                  <input
                    type="text"
                    required
                    value={newPhone}
                    onChange={e => setNewPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-[#F7F9FC] border border-[#E8EDF4] rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">E-mail</label>
                  <input
                    type="email"
                    required
                    placeholder="patient@email.com"
                    value={newEmail}
                    onChange={e => setNewEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-[#F7F9FC] border border-[#E8EDF4] rounded-xl text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Catégorie / Motif de suivi</label>
                <input
                  type="text"
                  value={newCategory}
                  onChange={e => setNewCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F7F9FC] border border-[#E8EDF4] rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Notes Médicales & Historique</label>
                <textarea
                  rows={3}
                  value={newNotes}
                  onChange={e => setNewNotes(e.target.value)}
                  placeholder="Antécédents, traitements en cours, allergies..."
                  className="w-full px-3 py-2 bg-[#F7F9FC] border border-[#E8EDF4] rounded-xl text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#2563EB] text-white text-xs font-bold rounded-xl hover:bg-[#1d4ed8]"
                >
                  Créer Dossier Patient
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Contact Modal */}
      {editingContact && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[#E8EDF4] shadow-2xl w-full max-w-lg p-6 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h2 className="text-base font-bold text-[#14213D] flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-[#2563EB]" />
                Modifier Dossier : {editingContact.name}
              </h2>
              <button 
                onClick={() => setEditingContact(null)}
                className="p-1 hover:bg-slate-100 rounded-lg text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Nom et Prénom</label>
                  <input
                    type="text"
                    required
                    value={editingContact.name}
                    onChange={e => setEditingContact({ ...editingContact, name: e.target.value })}
                    className="w-full px-3 py-2 bg-[#F7F9FC] border border-[#E8EDF4] rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">N° CNAM / Dossier</label>
                  <input
                    type="text"
                    value={editingContact.identifier}
                    onChange={e => setEditingContact({ ...editingContact, identifier: e.target.value })}
                    className="w-full px-3 py-2 bg-[#F7F9FC] border border-[#E8EDF4] rounded-xl text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Téléphone</label>
                  <input
                    type="text"
                    required
                    value={editingContact.phone}
                    onChange={e => setEditingContact({ ...editingContact, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-[#F7F9FC] border border-[#E8EDF4] rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">E-mail</label>
                  <input
                    type="email"
                    required
                    value={editingContact.email}
                    onChange={e => setEditingContact({ ...editingContact, email: e.target.value })}
                    className="w-full px-3 py-2 bg-[#F7F9FC] border border-[#E8EDF4] rounded-xl text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Catégorie</label>
                <input
                  type="text"
                  value={editingContact.category}
                  onChange={e => setEditingContact({ ...editingContact, category: e.target.value })}
                  className="w-full px-3 py-2 bg-[#F7F9FC] border border-[#E8EDF4] rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Notes Médicales</label>
                <textarea
                  rows={3}
                  value={editingContact.notes}
                  onChange={e => setEditingContact({ ...editingContact, notes: e.target.value })}
                  className="w-full px-3 py-2 bg-[#F7F9FC] border border-[#E8EDF4] rounded-xl text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingContact(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#2563EB] text-white text-xs font-bold rounded-xl hover:bg-[#1d4ed8]"
                >
                  Enregistrer Modifications
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
