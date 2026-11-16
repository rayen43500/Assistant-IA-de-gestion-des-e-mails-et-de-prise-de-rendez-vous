import React, { useState } from 'react';
import { 
  Stethoscope, 
  Search, 
  Mail, 
  Phone, 
  CheckCircle2, 
  Clock, 
  Edit2,
  Trash2,
  Plus, 
  Scale,
  X,
  Power
} from 'lucide-react';
import { useAppStore } from '../../../stores/useAppStore';

export const AdminDoctorsTab: React.FC = () => {
  const { showToast } = useAppStore();
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'DOCTOR' | 'LAWYER'>('ALL');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState<any>(null);

  // New Doctor Form
  const [newName, setNewName] = useState('');
  const [newProfession, setNewProfession] = useState('Médecin Spécialiste');
  const [newType, setNewType] = useState<'DOCTOR' | 'LAWYER'>('DOCTOR');
  const [newCabinet, setNewCabinet] = useState('Cabinet Médical Dr. Ben Salem');
  const [newCity, setNewCity] = useState('Tunis');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('+216 ');
  const [newLicense, setNewLicense] = useState('ORD-MED-2026-');

  const [practitioners, setPractitioners] = useState([
    {
      id: 'doc-1',
      name: 'Dr. Youssef Ben Salem',
      profession: 'Médecin Cardiologue',
      type: 'DOCTOR',
      cabinet: 'Cabinet Médical Dr. Ben Salem',
      city: 'Tunis',
      email: 'dr.bensalem@cabinet-ai.tn',
      phone: '+216 71 234 567',
      licenseId: 'ORD-MED-2014-9812',
      calendarSync: true,
      appointmentsMonth: 124,
      status: 'ACTIVE'
    },
    {
      id: 'doc-2',
      name: 'Dr. Amira Khemir',
      profession: 'Cardiologue Adjointe',
      type: 'DOCTOR',
      cabinet: 'Cabinet Médical Dr. Ben Salem',
      city: 'Tunis',
      email: 'dr.khemir@cabinet-ai.tn',
      phone: '+216 71 234 568',
      licenseId: 'ORD-MED-2019-1402',
      calendarSync: true,
      appointmentsMonth: 86,
      status: 'ACTIVE'
    },
    {
      id: 'doc-3',
      name: 'Me. Selim Trabelsi',
      profession: 'Avocat à la Cour de Cassation',
      type: 'LAWYER',
      cabinet: 'Cabinet d’Avocats Selim Trabelsi',
      city: 'Tunis',
      email: 'me.trabelsi@avocats-tunis.tn',
      phone: '+216 71 888 999',
      licenseId: 'BAR-TUNIS-2008-045',
      calendarSync: true,
      appointmentsMonth: 42,
      status: 'ACTIVE'
    },
    {
      id: 'doc-4',
      name: 'Dr. Mehdi Chaouch',
      profession: 'Chirurgien Dentiste',
      type: 'DOCTOR',
      cabinet: 'Clinique Dentaire Les Berges du Lac',
      city: 'Tunis',
      email: 'dr.chaouch@clinique-lac.tn',
      phone: '+216 70 111 222',
      licenseId: 'ORD-DENT-2016-5601',
      calendarSync: true,
      appointmentsMonth: 180,
      status: 'ACTIVE'
    },
    {
      id: 'doc-5',
      name: 'Me. Leila Karray',
      profession: 'Notaire Titulaire',
      type: 'LAWYER',
      cabinet: 'Étude Notariale Karray & Associés',
      city: 'Sfax',
      email: 'me.karray@notaires-sfax.tn',
      phone: '+216 74 222 333',
      licenseId: 'NOT-SFAX-2012-089',
      calendarSync: false,
      appointmentsMonth: 35,
      status: 'ACTIVE'
    }
  ]);

  const handleAddDoctor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newEmail) return;

    const created = {
      id: `doc-${Date.now()}`,
      name: newName,
      profession: newProfession,
      type: newType,
      cabinet: newCabinet,
      city: newCity,
      email: newEmail,
      phone: newPhone,
      licenseId: newLicense,
      calendarSync: true,
      appointmentsMonth: 0,
      status: 'ACTIVE'
    };

    setPractitioners([created, ...practitioners]);
    setShowAddModal(false);
    setNewName('');
    setNewEmail('');

    showToast({
      title: 'Praticien Enregistré !',
      message: `${created.name} a été rattaché à ${created.cabinet}.`,
      type: 'success'
    });
  };

  const handleUpdateDoctor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDoctor) return;

    setPractitioners(prev => prev.map(p => p.id === editingDoctor.id ? editingDoctor : p));
    showToast({
      title: 'Praticien Modifié',
      message: `La fiche de ${editingDoctor.name} a été mise à jour.`,
      type: 'success'
    });
    setEditingDoctor(null);
  };

  const handleDeleteDoctor = (id: string, name: string) => {
    if (!window.confirm(`Confirmez-vous la suppression du praticien ${name} ?`)) return;
    setPractitioners(prev => prev.filter(p => p.id !== id));
    showToast({
      title: 'Praticien retiré',
      message: `${name} a été retiré de la liste.`,
      type: 'warning'
    });
  };

  const handleToggleStatus = (id: string) => {
    setPractitioners(prev => prev.map(p => {
      if (p.id === id) {
        const next = p.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
        showToast({
          title: 'Statut praticien mis à jour',
          message: `${p.name} est maintenant ${next === 'ACTIVE' ? 'Actif' : 'Inactif'}.`,
          type: 'info'
        });
        return { ...p, status: next };
      }
      return p;
    }));
  };

  const filtered = practitioners.filter(p => {
    if (filterType !== 'ALL' && p.type !== filterType) return false;
    if (search) {
      const q = search.toLowerCase();
      return p.name.toLowerCase().includes(q) || p.cabinet.toLowerCase().includes(q) || p.profession.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-[#14213D] tracking-tight">Répertoire des Praticiens Titulaires</h1>
          <p className="text-xs text-slate-500">
            Médecins spécialistes, chirurgiens et avocats associés inscrits aux ordres professionnels nationaux
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-600 bg-white border border-[#E8EDF4] px-3 py-1.5 rounded-xl shadow-2xs">
            Total : <strong>{practitioners.length} praticiens</strong>
          </span>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 bg-[#2563EB] text-white px-3.5 py-1.5 rounded-xl text-xs font-bold hover:bg-[#1d4ed8] shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Nouveau Praticien
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 bg-white rounded-2xl border border-[#E8EDF4] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Rechercher nom, spécialité, cabinet..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-[#F7F9FC] border border-[#E8EDF4] rounded-xl text-xs text-[#14213D] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]"
          />
        </div>

        <div className="flex items-center gap-2">
          {(['ALL', 'DOCTOR', 'LAWYER'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilterType(f)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                filterType === f 
                  ? 'bg-[#2563EB] text-white shadow-2xs' 
                  : 'bg-[#F7F9FC] border border-[#E8EDF4] text-slate-600 hover:bg-slate-100'
              }`}
            >
              {f === 'ALL' ? 'Tous' : f === 'DOCTOR' ? 'Médecins' : 'Avocats & Notaires'}
            </button>
          ))}
        </div>
      </div>

      {/* Practitioners Table */}
      <div className="bg-white rounded-2xl border border-[#E8EDF4] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[800px]">
            <thead className="bg-[#F7F9FC] border-b border-[#E8EDF4] text-slate-500 font-semibold">
              <tr>
                <th className="p-4">Praticien & Spécialité</th>
                <th className="p-4">Cabinet Rattaché</th>
                <th className="p-4">N° Ordre / Barreau</th>
                <th className="p-4">Coordonnées Pro</th>
                <th className="p-4">Google Calendar</th>
                <th className="p-4">RDV ce mois</th>
                <th className="p-4">Statut</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(p => (
                <tr key={p.id} className="hover:bg-[#F7F9FC] transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold shrink-0 ${
                        p.type === 'DOCTOR' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                      }`}>
                        {p.type === 'DOCTOR' ? <Stethoscope className="w-4 h-4" /> : <Scale className="w-4 h-4" />}
                      </div>
                      <div>
                        <div className="font-bold text-[#14213D]">{p.name}</div>
                        <div className="text-[11px] text-slate-400 font-medium">{p.profession}</div>
                      </div>
                    </div>
                  </td>

                  <td className="p-4">
                    <div className="font-bold text-slate-800">{p.cabinet}</div>
                    <div className="text-[10px] text-slate-400">{p.city}, Tunisie</div>
                  </td>

                  <td className="p-4 font-mono font-semibold text-slate-600">
                    {p.licenseId}
                  </td>

                  <td className="p-4">
                    <div className="text-slate-800 font-medium">{p.email}</div>
                    <div className="text-[11px] text-slate-400">{p.phone}</div>
                  </td>

                  <td className="p-4">
                    {p.calendarSync ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3" /> Synchronisé
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                        <Clock className="w-3 h-3" /> Non connecté
                      </span>
                    )}
                  </td>

                  <td className="p-4 font-black text-slate-800 font-mono">
                    {p.appointmentsMonth}
                  </td>

                  <td className="p-4">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      p.status === 'ACTIVE' ? 'text-emerald-700 bg-emerald-50' : 'text-slate-600 bg-slate-100'
                    }`}>
                      {p.status}
                    </span>
                  </td>

                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => setEditingDoctor({ ...p })}
                        title="Modifier le praticien"
                        className="p-1.5 hover:bg-blue-50 text-slate-400 hover:text-blue-600 rounded-lg transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleToggleStatus(p.id)}
                        title={p.status === 'ACTIVE' ? 'Désactiver' : 'Activer'}
                        className="p-1.5 hover:bg-amber-50 text-slate-400 hover:text-amber-600 rounded-lg transition-colors"
                      >
                        <Power className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteDoctor(p.id, p.name)}
                        title="Supprimer définitivement"
                        className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Doctor Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[#E8EDF4] shadow-2xl w-full max-w-lg p-6 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h2 className="text-base font-bold text-[#14213D] flex items-center gap-2">
                <Plus className="w-5 h-5 text-[#2563EB]" />
                Ajouter un Nouveau Praticien
              </h2>
              <button 
                onClick={() => setShowAddModal(false)}
                className="p-1 hover:bg-slate-100 rounded-lg text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddDoctor} className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Type de Praticien</label>
                  <select
                    value={newType}
                    onChange={e => {
                      const t = e.target.value as 'DOCTOR' | 'LAWYER';
                      setNewType(t);
                      setNewProfession(t === 'DOCTOR' ? 'Médecin Spécialiste' : 'Avocat à la Cour');
                    }}
                    className="w-full px-3 py-2 bg-[#F7F9FC] border border-[#E8EDF4] rounded-xl text-xs"
                  >
                    <option value="DOCTOR">Médecin / Santé</option>
                    <option value="LAWYER">Avocat / Juriste</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Nom Complet & Titre</label>
                  <input
                    type="text"
                    required
                    placeholder="ex: Dr. Karim Ben Ayed"
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    className="w-full px-3 py-2 bg-[#F7F9FC] border border-[#E8EDF4] rounded-xl text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Spécialité / Fonction</label>
                  <input
                    type="text"
                    required
                    value={newProfession}
                    onChange={e => setNewProfession(e.target.value)}
                    className="w-full px-3 py-2 bg-[#F7F9FC] border border-[#E8EDF4] rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">N° Ordre / Barreau</label>
                  <input
                    type="text"
                    value={newLicense}
                    onChange={e => setNewLicense(e.target.value)}
                    className="w-full px-3 py-2 bg-[#F7F9FC] border border-[#E8EDF4] rounded-xl text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Cabinet de rattachement</label>
                  <input
                    type="text"
                    required
                    value={newCabinet}
                    onChange={e => setNewCabinet(e.target.value)}
                    className="w-full px-3 py-2 bg-[#F7F9FC] border border-[#E8EDF4] rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Gouvernorat / Ville</label>
                  <input
                    type="text"
                    value={newCity}
                    onChange={e => setNewCity(e.target.value)}
                    className="w-full px-3 py-2 bg-[#F7F9FC] border border-[#E8EDF4] rounded-xl text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">E-mail Professionnel</label>
                  <input
                    type="email"
                    required
                    placeholder="docteur@cabinet.tn"
                    value={newEmail}
                    onChange={e => setNewEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-[#F7F9FC] border border-[#E8EDF4] rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Téléphone Direct</label>
                  <input
                    type="text"
                    value={newPhone}
                    onChange={e => setNewPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-[#F7F9FC] border border-[#E8EDF4] rounded-xl text-xs"
                  />
                </div>
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
                  Enregistrer Praticien
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Doctor Modal */}
      {editingDoctor && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[#E8EDF4] shadow-2xl w-full max-w-lg p-6 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h2 className="text-base font-bold text-[#14213D] flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-[#2563EB]" />
                Modifier Praticien : {editingDoctor.name}
              </h2>
              <button 
                onClick={() => setEditingDoctor(null)}
                className="p-1 hover:bg-slate-100 rounded-lg text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateDoctor} className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Nom Complet & Titre</label>
                  <input
                    type="text"
                    required
                    value={editingDoctor.name}
                    onChange={e => setEditingDoctor({ ...editingDoctor, name: e.target.value })}
                    className="w-full px-3 py-2 bg-[#F7F9FC] border border-[#E8EDF4] rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Spécialité / Fonction</label>
                  <input
                    type="text"
                    required
                    value={editingDoctor.profession}
                    onChange={e => setEditingDoctor({ ...editingDoctor, profession: e.target.value })}
                    className="w-full px-3 py-2 bg-[#F7F9FC] border border-[#E8EDF4] rounded-xl text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Cabinet de rattachement</label>
                  <input
                    type="text"
                    required
                    value={editingDoctor.cabinet}
                    onChange={e => setEditingDoctor({ ...editingDoctor, cabinet: e.target.value })}
                    className="w-full px-3 py-2 bg-[#F7F9FC] border border-[#E8EDF4] rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">N° Ordre / Barreau</label>
                  <input
                    type="text"
                    value={editingDoctor.licenseId}
                    onChange={e => setEditingDoctor({ ...editingDoctor, licenseId: e.target.value })}
                    className="w-full px-3 py-2 bg-[#F7F9FC] border border-[#E8EDF4] rounded-xl text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">E-mail</label>
                  <input
                    type="email"
                    required
                    value={editingDoctor.email}
                    onChange={e => setEditingDoctor({ ...editingDoctor, email: e.target.value })}
                    className="w-full px-3 py-2 bg-[#F7F9FC] border border-[#E8EDF4] rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Téléphone</label>
                  <input
                    type="text"
                    value={editingDoctor.phone}
                    onChange={e => setEditingDoctor({ ...editingDoctor, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-[#F7F9FC] border border-[#E8EDF4] rounded-xl text-xs"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingDoctor(null)}
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
