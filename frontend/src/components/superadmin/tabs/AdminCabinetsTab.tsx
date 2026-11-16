import React, { useState } from 'react';
import { 
  Building2, 
  Search, 
  Filter, 
  Plus, 
  MoreVertical, 
  Stethoscope, 
  Scale, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  ExternalLink,
  Edit2,
  Trash2,
  X
} from 'lucide-react';
import { useAppStore } from '../../../stores/useAppStore';

export const AdminCabinetsTab: React.FC = () => {
  const { showToast } = useAppStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [sectorFilter, setSectorFilter] = useState<'ALL' | 'MEDICAL' | 'LEGAL'>('ALL');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Form states for new cabinet modal
  const [newCabinetName, setNewCabinetName] = useState('');
  const [newCabinetCity, setNewCabinetCity] = useState('Tunis');
  const [newCabinetSector, setNewCabinetSector] = useState<'MEDICAL' | 'LEGAL'>('MEDICAL');
  const [newCabinetPlan, setNewCabinetPlan] = useState<'STARTER' | 'PROFESSIONNEL' | 'ENTERPRISE'>('PROFESSIONNEL');
  const [newCabinetEmail, setNewCabinetEmail] = useState('');

  const [cabinets, setCabinets] = useState([
    {
      id: 'tn-1',
      name: 'Cabinet Médical Dr. Youssef Ben Salem',
      city: 'Tunis',
      sector: 'MEDICAL',
      specialty: 'Cardiologie & Rythmologie',
      doctorsCount: 2,
      patientsCount: 420,
      emailsMonth: 1420,
      plan: 'PROFESSIONNEL',
      mrr: 500,
      status: 'ACTIVE',
      createdAt: '2026-01-15'
    },
    {
      id: 'tn-2',
      name: 'Cabinet d’Avocats Selim Trabelsi & Associés',
      city: 'Tunis',
      sector: 'LEGAL',
      specialty: 'Droit des Affaires & Sociétés',
      doctorsCount: 3,
      patientsCount: 180,
      emailsMonth: 980,
      plan: 'PROFESSIONNEL',
      mrr: 500,
      status: 'ACTIVE',
      createdAt: '2026-02-01'
    },
    {
      id: 'tn-3',
      name: 'Clinique Dentaire Les Berges du Lac',
      city: 'Tunis',
      sector: 'MEDICAL',
      specialty: 'Implantologie & Esthétique',
      doctorsCount: 6,
      patientsCount: 950,
      emailsMonth: 4210,
      plan: 'ENTERPRISE',
      mrr: 1200,
      status: 'ACTIVE',
      createdAt: '2026-03-10'
    },
    {
      id: 'tn-4',
      name: 'Étude Notariale Karray & Associés',
      city: 'Sfax',
      sector: 'LEGAL',
      specialty: 'Actes & Droit Immobilier',
      doctorsCount: 2,
      patientsCount: 110,
      emailsMonth: 540,
      plan: 'STARTER',
      mrr: 250,
      status: 'ACTIVE',
      createdAt: '2026-04-12'
    }
  ]);

  const filteredCabinets = cabinets.filter(c => {
    if (sectorFilter !== 'ALL' && c.sector !== sectorFilter) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return c.name.toLowerCase().includes(q) || c.city.toLowerCase().includes(q) || c.specialty.toLowerCase().includes(q);
    }
    return true;
  });

  const [editingCabinet, setEditingCabinet] = useState<any>(null);

  const handleUpdateCabinet = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCabinet) return;

    setCabinets(prev => prev.map(c => c.id === editingCabinet.id ? editingCabinet : c));
    showToast({
      title: 'Cabinet mis à jour !',
      message: `${editingCabinet.name} a été modifié avec succès.`,
      type: 'success'
    });
    setEditingCabinet(null);
  };

  const handleDeleteCabinet = (id: string, name: string) => {
    setCabinets(prev => prev.filter(c => c.id !== id));
    showToast({
      title: 'Cabinet supprimé',
      message: `${name} a été supprimé de la plateforme SaaS.`,
      type: 'warning'
    });
  };

  const handleToggleStatus = (id: string) => {
    setCabinets(prev => prev.map(c => {
      if (c.id === id) {
        const nextStatus = c.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
        showToast({
          title: `Statut modifié : ${nextStatus}`,
          message: `${c.name} est désormais ${nextStatus === 'ACTIVE' ? 'actif' : 'suspendu'}.`,
          type: nextStatus === 'ACTIVE' ? 'success' : 'warning'
        });
        return { ...c, status: nextStatus };
      }
      return c;
    }));
  };

  const handleCreateCabinet = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCabinetName || !newCabinetEmail) return;

    const created = {
      id: `tn-${Date.now()}`,
      name: newCabinetName,
      city: newCabinetCity,
      sector: newCabinetSector,
      specialty: newCabinetSector === 'MEDICAL' ? 'Médecine Spécialisée' : 'Conseil Juridique',
      doctorsCount: 1,
      patientsCount: 0,
      emailsMonth: 0,
      plan: newCabinetPlan,
      mrr: newCabinetPlan === 'ENTERPRISE' ? 1200 : newCabinetPlan === 'PROFESSIONNEL' ? 500 : 250,
      status: 'ACTIVE',
      createdAt: 'Aujourd’hui'
    };

    setCabinets(prev => [created, ...prev]);
    setShowCreateModal(false);
    setNewCabinetName('');
    setNewCabinetEmail('');

    showToast({
      title: 'Nouveau Cabinet Créé !',
      message: `${created.name} a été enregistré avec base isolée cryptographique.`,
      type: 'success'
    });
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-[#14213D] tracking-tight">Gestion des Cabinets (Tenants)</h1>
          <p className="text-xs text-slate-500">
            Supervision des organisations médicales et juridiques clientes, quotas e-mails et affectation des formules
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2.5 bg-[#2563EB] hover:bg-blue-700 active:scale-[0.98] text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-2 transition-all w-fit"
        >
          <Plus className="w-4 h-4" />
          <span>Ajouter un Cabinet</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 bg-white rounded-2xl border border-[#E8EDF4] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Rechercher par nom, ville, spécialité..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-[#F7F9FC] border border-[#E8EDF4] rounded-xl text-xs text-[#14213D] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-500">Secteur :</span>
          {(['ALL', 'MEDICAL', 'LEGAL'] as const).map(sec => (
            <button
              key={sec}
              onClick={() => setSectorFilter(sec)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                sectorFilter === sec 
                  ? 'bg-[#2563EB] text-white shadow-2xs' 
                  : 'bg-[#F7F9FC] border border-[#E8EDF4] text-slate-600 hover:bg-slate-100'
              }`}
            >
              {sec === 'ALL' ? 'Tous' : sec === 'MEDICAL' ? 'Médical' : 'Juridique'}
            </button>
          ))}
        </div>
      </div>

      {/* Cabinets Data Table */}
      <div className="bg-white rounded-2xl border border-[#E8EDF4] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[750px]">
            <thead className="bg-[#F7F9FC] border-b border-[#E8EDF4] text-slate-500 font-semibold">
              <tr>
                <th className="p-4">Cabinet & Spécialité</th>
                <th className="p-4">Secteur</th>
                <th className="p-4">Praticiens</th>
                <th className="p-4">E-mails / Mois</th>
                <th className="p-4">Abonnement</th>
                <th className="p-4">MRR</th>
                <th className="p-4">Statut</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCabinets.map(cab => (
                <tr key={cab.id} className="hover:bg-[#F7F9FC] transition-colors">
                  <td className="p-4">
                    <div className="font-bold text-[#14213D]">{cab.name}</div>
                    <div className="text-[11px] text-slate-400 font-medium">
                      {cab.city}, Tunisie • {cab.specialty}
                    </div>
                  </td>

                  <td className="p-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                      cab.sector === 'MEDICAL' 
                        ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                        : 'bg-purple-50 text-purple-700 border border-purple-200'
                    }`}>
                      {cab.sector === 'MEDICAL' ? <Stethoscope className="w-3 h-3" /> : <Scale className="w-3 h-3" />}
                      <span>{cab.sector}</span>
                    </span>
                  </td>

                  <td className="p-4 font-bold text-slate-700">
                    {cab.doctorsCount} praticiens
                  </td>

                  <td className="p-4 font-mono font-semibold text-slate-600">
                    {cab.emailsMonth}
                  </td>

                  <td className="p-4 font-semibold text-slate-800">
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-bold">
                      {cab.plan}
                    </span>
                  </td>

                  <td className="p-4 font-mono font-black text-slate-900">
                    {cab.mrr} DT
                  </td>

                  <td className="p-4">
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                      <CheckCircle2 className="w-3 h-3" /> {cab.status}
                    </span>
                  </td>

                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => setEditingCabinet({ ...cab })}
                        title="Modifier le cabinet"
                        className="p-1.5 hover:bg-blue-50 text-slate-500 hover:text-[#2563EB] rounded-lg transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleToggleStatus(cab.id)}
                        title={cab.status === 'ACTIVE' ? 'Suspendre' : 'Activer'}
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-colors ${
                          cab.status === 'ACTIVE' ? 'bg-amber-50 text-amber-700 hover:bg-amber-100' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                        }`}
                      >
                        {cab.status === 'ACTIVE' ? 'Suspendre' : 'Activer'}
                      </button>
                      <button
                        onClick={() => handleDeleteCabinet(cab.id, cab.name)}
                        title="Supprimer définitivement"
                        className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Cabinet Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-[#E8EDF4] max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#E8EDF4] pb-3">
              <h3 className="font-black text-sm text-[#14213D] flex items-center gap-2">
                <Building2 className="w-4 h-4 text-[#2563EB]" />
                <span>Créer une Nouvelle Organisation Client</span>
              </h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCabinet} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nom Officiel du Cabinet</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Centre Médical Pasteur Tunis"
                  value={newCabinetName}
                  onChange={e => setNewCabinetName(e.target.value)}
                  className="w-full px-3.5 py-2 bg-[#F7F9FC] border border-[#E8EDF4] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Secteur d'activité</label>
                  <select
                    value={newCabinetSector}
                    onChange={e => setNewCabinetSector(e.target.value as any)}
                    className="w-full px-3 py-2 bg-[#F7F9FC] border border-[#E8EDF4] rounded-xl focus:outline-none focus:border-[#2563EB]"
                  >
                    <option value="MEDICAL">Cabinet Médical</option>
                    <option value="LEGAL">Cabinet Juridique</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Ville</label>
                  <input
                    type="text"
                    value={newCabinetCity}
                    onChange={e => setNewCabinetCity(e.target.value)}
                    className="w-full px-3 py-2 bg-[#F7F9FC] border border-[#E8EDF4] rounded-xl focus:outline-none focus:border-[#2563EB]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">E-mail de l'Administrateur Titulaire</label>
                <input
                  type="email"
                  required
                  placeholder="contact@cabinet-pasteur.tn"
                  value={newCabinetEmail}
                  onChange={e => setNewCabinetEmail(e.target.value)}
                  className="w-full px-3.5 py-2 bg-[#F7F9FC] border border-[#E8EDF4] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Formule SaaS Choisie</label>
                <select
                  value={newCabinetPlan}
                  onChange={e => setNewCabinetPlan(e.target.value as any)}
                  className="w-full px-3 py-2 bg-[#F7F9FC] border border-[#E8EDF4] rounded-xl focus:outline-none focus:border-[#2563EB]"
                >
                  <option value="STARTER">Starter (250 DT / mois)</option>
                  <option value="PROFESSIONNEL">Professionnel (500 DT / mois)</option>
                  <option value="ENTERPRISE">Enterprise (1,200 DT / mois)</option>
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-[#E8EDF4] rounded-xl text-slate-600 font-bold hover:bg-slate-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#2563EB] text-white font-bold rounded-xl shadow-xs hover:bg-blue-700"
                >
                  Créer le Tenant
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Cabinet Modal */}
      {editingCabinet && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-[#E8EDF4] max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#E8EDF4] pb-3">
              <h3 className="font-black text-sm text-[#14213D] flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-[#2563EB]" />
                <span>Modifier le Cabinet : {editingCabinet.name}</span>
              </h3>
              <button onClick={() => setEditingCabinet(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateCabinet} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nom du Cabinet</label>
                <input
                  type="text"
                  required
                  value={editingCabinet.name}
                  onChange={e => setEditingCabinet({ ...editingCabinet, name: e.target.value })}
                  className="w-full px-3.5 py-2 bg-[#F7F9FC] border border-[#E8EDF4] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Ville</label>
                  <input
                    type="text"
                    value={editingCabinet.city}
                    onChange={e => setEditingCabinet({ ...editingCabinet, city: e.target.value })}
                    className="w-full px-3 py-2 bg-[#F7F9FC] border border-[#E8EDF4] rounded-xl focus:outline-none focus:border-[#2563EB]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Spécialité</label>
                  <input
                    type="text"
                    value={editingCabinet.specialty}
                    onChange={e => setEditingCabinet({ ...editingCabinet, specialty: e.target.value })}
                    className="w-full px-3 py-2 bg-[#F7F9FC] border border-[#E8EDF4] rounded-xl focus:outline-none focus:border-[#2563EB]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Formule SaaS</label>
                  <select
                    value={editingCabinet.plan}
                    onChange={e => setEditingCabinet({ 
                      ...editingCabinet, 
                      plan: e.target.value,
                      mrr: e.target.value === 'ENTERPRISE' ? 1200 : e.target.value === 'PROFESSIONNEL' ? 500 : 250
                    })}
                    className="w-full px-3 py-2 bg-[#F7F9FC] border border-[#E8EDF4] rounded-xl focus:outline-none focus:border-[#2563EB]"
                  >
                    <option value="STARTER">Starter (250 DT)</option>
                    <option value="PROFESSIONNEL">Professionnel (500 DT)</option>
                    <option value="ENTERPRISE">Enterprise (1,200 DT)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Statut du Tenant</label>
                  <select
                    value={editingCabinet.status}
                    onChange={e => setEditingCabinet({ ...editingCabinet, status: e.target.value })}
                    className="w-full px-3 py-2 bg-[#F7F9FC] border border-[#E8EDF4] rounded-xl focus:outline-none focus:border-[#2563EB]"
                  >
                    <option value="ACTIVE">Actif</option>
                    <option value="SUSPENDED">Suspendu</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingCabinet(null)}
                  className="px-4 py-2 border border-[#E8EDF4] rounded-xl text-slate-600 font-bold hover:bg-slate-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#2563EB] text-white font-bold rounded-xl shadow-xs hover:bg-blue-700"
                >
                  Enregistrer les Modifications
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
