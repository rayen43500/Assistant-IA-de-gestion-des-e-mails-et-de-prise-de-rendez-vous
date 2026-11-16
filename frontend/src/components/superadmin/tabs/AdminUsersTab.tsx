import React, { useState } from 'react';
import { 
  Users, 
  Search, 
  ShieldCheck, 
  Key, 
  UserX, 
  UserCheck, 
  Plus, 
  Edit2, 
  Trash2, 
  Lock,
  Mail,
  Building2,
  X,
  Power
} from 'lucide-react';
import { useAppStore } from '../../../stores/useAppStore';

export const AdminUsersTab: React.FC = () => {
  const { showToast } = useAppStore();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);

  // Add form state
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<'PRATICIEN' | 'ADMIN' | 'SUPER_ADMIN'>('PRATICIEN');
  const [newCabinet, setNewCabinet] = useState('Cabinet Médical Dr. Ben Salem');
  const [newTwoFactor, setNewTwoFactor] = useState(true);

  const [users, setUsers] = useState([
    { id: 'usr-admin-1', name: 'Amine Mansour', email: 'admin@medilaw.ai', role: 'SUPER_ADMIN', cabinet: 'MediLawAI Platform Inc.', twoFactor: true, lastLogin: 'En ligne', status: 'ACTIVE' },
    { id: 'usr-admin-2', name: 'Sarra Kallel', email: 'sarra.admin@medilaw.ai', role: 'SUPER_ADMIN', cabinet: 'MediLawAI Platform Inc.', twoFactor: true, lastLogin: 'Il y a 15 min', status: 'ACTIVE' },
    { id: 'usr-admin-3', name: 'Hedi Bouzid', email: 'hedi.security@medilaw.ai', role: 'SUPER_ADMIN', cabinet: 'MediLawAI Platform Inc.', twoFactor: true, lastLogin: 'Il y a 1h', status: 'ACTIVE' },
    { id: 'usr-1', name: 'Dr. Youssef Ben Salem', email: 'dr.bensalem@cabinet-ai.tn', role: 'PRATICIEN', cabinet: 'Cabinet Médical Dr. Ben Salem', twoFactor: true, lastLogin: 'Il y a 14 min', status: 'ACTIVE' },
    { id: 'usr-2', name: 'Dr. Nadia Trabelsi', email: 'dr.nadia@cabinet-ai.tn', role: 'PRATICIEN', cabinet: 'Cabinet Médical Dr. Ben Salem', twoFactor: true, lastLogin: 'Il y a 3 min', status: 'ACTIVE' },
    { id: 'usr-3', name: 'Me. Selim Trabelsi', email: 'me.trabelsi@avocats-tunis.tn', role: 'PRATICIEN', cabinet: 'Cabinet d’Avocats Selim Trabelsi', twoFactor: true, lastLogin: 'Il y a 2h', status: 'ACTIVE' },
    { id: 'usr-4', name: 'Me. Sonia Mabrouk', email: 's.mabrouk@avocats-tunis.tn', role: 'PRATICIEN', cabinet: 'Cabinet d’Avocats Selim Trabelsi', twoFactor: false, lastLogin: 'Aujourd’hui 09:12', status: 'ACTIVE' },
    { id: 'usr-5', name: 'Dr. Mehdi Chaouch', email: 'dr.chaouch@clinique-lac.tn', role: 'ADMIN', cabinet: 'Clinique Dentaire Les Berges du Lac', twoFactor: true, lastLogin: 'Il y a 30 min', status: 'ACTIVE' }
  ]);

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newEmail) return;

    const created = {
      id: `usr-${Date.now()}`,
      name: newName,
      email: newEmail,
      role: newRole,
      cabinet: newCabinet,
      twoFactor: newTwoFactor,
      lastLogin: 'Jamais connecté',
      status: 'ACTIVE'
    };

    setUsers([created, ...users]);
    setShowAddModal(false);
    setNewName('');
    setNewEmail('');

    showToast({
      title: 'Compte utilisateur créé !',
      message: `${created.name} (${created.role}) a été ajouté. Un e-mail d'invitation lui a été transmis.`,
      type: 'success'
    });
  };

  const handleUpdateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    setUsers(prev => prev.map(u => u.id === editingUser.id ? editingUser : u));
    showToast({
      title: 'Utilisateur mis à jour',
      message: `Les droits et informations de ${editingUser.name} ont été modifiés.`,
      type: 'success'
    });
    setEditingUser(null);
  };

  const handleDeleteUser = (id: string, name: string) => {
    if (!window.confirm(`Confirmez-vous la révocation du compte de ${name} ?`)) return;
    setUsers(prev => prev.filter(u => u.id !== id));
    showToast({
      title: 'Utilisateur supprimé',
      message: `Le compte de ${name} a été révoqué du système.`,
      type: 'warning'
    });
  };

  const handleToggleStatus = (id: string) => {
    setUsers(prev => prev.map(u => {
      if (u.id === id) {
        const next = u.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
        showToast({
          title: 'Statut du compte modifié',
          message: `${u.name} est maintenant ${next === 'ACTIVE' ? 'Actif' : 'Suspendu'}.`,
          type: 'info'
        });
        return { ...u, status: next };
      }
      return u;
    }));
  };

  const handleResetPassword = (email: string) => {
    showToast({
      title: 'Lien de réinitialisation transmis',
      message: `Un e-mail sécurisé de réinitialisation a été envoyé à ${email}.`,
      type: 'info'
    });
  };

  const filtered = users.filter(u => {
    if (roleFilter !== 'ALL' && u.role !== roleFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.cabinet.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-[#14213D] tracking-tight">Gestion des Utilisateurs SaaS</h1>
          <p className="text-xs text-slate-500">
            Contrôle des accès, double authentification (2FA), rôles et sessions actives sur l’ensemble des tenants
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 px-3 py-1.5 rounded-xl shadow-2xs">
            Super Admins : <strong>{users.filter(u => u.role === 'SUPER_ADMIN').length}</strong>
          </span>
          <span className="text-xs font-bold text-slate-600 bg-white border border-[#E8EDF4] px-3 py-1.5 rounded-xl shadow-2xs">
            Comptes : <strong>{users.length}</strong>
          </span>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 bg-[#2563EB] text-white px-3.5 py-1.5 rounded-xl text-xs font-bold hover:bg-[#1d4ed8] shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Nouvel Utilisateur
          </button>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="p-4 bg-white rounded-2xl border border-[#E8EDF4] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Rechercher nom, e-mail, cabinet..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-[#F7F9FC] border border-[#E8EDF4] rounded-xl text-xs text-[#14213D] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]"
          />
        </div>

        <div className="flex items-center gap-2">
          {['ALL', 'PRATICIEN', 'ADMIN', 'SUPER_ADMIN'].map(r => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                roleFilter === r 
                  ? 'bg-[#2563EB] text-white shadow-2xs' 
                  : 'bg-[#F7F9FC] border border-[#E8EDF4] text-slate-600 hover:bg-slate-100'
              }`}
            >
              {r === 'ALL' ? 'Tous' : r === 'PRATICIEN' ? 'Praticiens' : r === 'ADMIN' ? 'Admins Cabinet' : 'Super Admins'}
            </button>
          ))}
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-[#E8EDF4] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[800px]">
            <thead className="bg-[#F7F9FC] border-b border-[#E8EDF4] text-slate-500 font-semibold">
              <tr>
                <th className="p-4">Utilisateur & Contact</th>
                <th className="p-4">Organisation (Cabinet)</th>
                <th className="p-4">Rôle Système</th>
                <th className="p-4">Sécurité 2FA</th>
                <th className="p-4">Dernière Connexion</th>
                <th className="p-4">Statut</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(u => (
                <tr key={u.id} className="hover:bg-[#F7F9FC] transition-colors">
                  <td className="p-4">
                    <div className="font-bold text-[#14213D]">{u.name}</div>
                    <div className="text-[11px] text-slate-400">{u.email}</div>
                  </td>

                  <td className="p-4">
                    <div className="font-bold text-slate-800">{u.cabinet}</div>
                  </td>

                  <td className="p-4">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      u.role === 'SUPER_ADMIN' 
                        ? 'bg-rose-50 text-rose-700 border border-rose-200' 
                        : u.role === 'ADMIN' 
                        ? 'bg-purple-50 text-purple-700 border border-purple-200' 
                        : u.role === 'PRATICIEN' 
                        ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                        : 'bg-slate-100 text-slate-700'
                    }`}>
                      {u.role}
                    </span>
                  </td>

                  <td className="p-4">
                    {u.twoFactor ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                        <ShieldCheck className="w-3 h-3" /> Activée (TOTP)
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-amber-600">Désactivée</span>
                    )}
                  </td>

                  <td className="p-4 font-mono text-slate-500 text-[11px]">
                    {u.lastLogin}
                  </td>

                  <td className="p-4">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      u.status === 'ACTIVE' ? 'text-emerald-700 bg-emerald-50' : 'text-rose-700 bg-rose-50'
                    }`}>
                      {u.status}
                    </span>
                  </td>

                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => handleResetPassword(u.email)}
                        title="Réinitialiser mot de passe"
                        className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-blue-600 rounded-lg transition-colors"
                      >
                        <Key className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setEditingUser({ ...u })}
                        title="Modifier le compte"
                        className="p-1.5 hover:bg-blue-50 text-slate-400 hover:text-blue-600 rounded-lg transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleToggleStatus(u.id)}
                        title={u.status === 'ACTIVE' ? 'Suspendre' : 'Activer'}
                        className="p-1.5 hover:bg-amber-50 text-slate-400 hover:text-amber-600 rounded-lg transition-colors"
                      >
                        <Power className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteUser(u.id, u.name)}
                        title="Supprimer l'utilisateur"
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

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[#E8EDF4] shadow-2xl w-full max-w-lg p-6 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h2 className="text-base font-bold text-[#14213D] flex items-center gap-2">
                <Plus className="w-5 h-5 text-[#2563EB]" />
                Créer un Utilisateur
              </h2>
              <button 
                onClick={() => setShowAddModal(false)}
                className="p-1 hover:bg-slate-100 rounded-lg text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddUser} className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Nom et Prénom</label>
                  <input
                    type="text"
                    required
                    placeholder="ex: Dr. Sarah Mansouri"
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    className="w-full px-3 py-2 bg-[#F7F9FC] border border-[#E8EDF4] rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Rôle Système</label>
                  <select
                    value={newRole}
                    onChange={e => setNewRole(e.target.value as any)}
                    className="w-full px-3 py-2 bg-[#F7F9FC] border border-[#E8EDF4] rounded-xl text-xs"
                  >
                    <option value="PRATICIEN">Praticien (Docteur / Avocat)</option>
                    <option value="ADMIN">Administrateur Cabinet</option>
                    <option value="SUPER_ADMIN">Super Admin Plateforme</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Adresse E-mail de Connexion</label>
                <input
                  type="email"
                  required
                  placeholder="contact@cabinet.tn"
                  value={newEmail}
                  onChange={e => setNewEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F7F9FC] border border-[#E8EDF4] rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Organisation / Cabinet Rattaché</label>
                <input
                  type="text"
                  required
                  value={newCabinet}
                  onChange={e => setNewCabinet(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F7F9FC] border border-[#E8EDF4] rounded-xl text-xs"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="twoFactor"
                  checked={newTwoFactor}
                  onChange={e => setNewTwoFactor(e.target.checked)}
                  className="rounded text-[#2563EB] focus:ring-[#2563EB]"
                />
                <label htmlFor="twoFactor" className="text-xs text-slate-700 font-medium">
                  Exiger l'authentification à double facteur (2FA TOTP)
                </label>
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
                  Créer Compte
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[#E8EDF4] shadow-2xl w-full max-w-lg p-6 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h2 className="text-base font-bold text-[#14213D] flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-[#2563EB]" />
                Modifier Utilisateur : {editingUser.name}
              </h2>
              <button 
                onClick={() => setEditingUser(null)}
                className="p-1 hover:bg-slate-100 rounded-lg text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateUser} className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Nom et Prénom</label>
                  <input
                    type="text"
                    required
                    value={editingUser.name}
                    onChange={e => setEditingUser({ ...editingUser, name: e.target.value })}
                    className="w-full px-3 py-2 bg-[#F7F9FC] border border-[#E8EDF4] rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Rôle Système</label>
                  <select
                    value={editingUser.role}
                    onChange={e => setEditingUser({ ...editingUser, role: e.target.value })}
                    className="w-full px-3 py-2 bg-[#F7F9FC] border border-[#E8EDF4] rounded-xl text-xs"
                  >
                    <option value="PRATICIEN">Praticien (Docteur / Avocat)</option>
                    <option value="ADMIN">Administrateur Cabinet</option>
                    <option value="SUPER_ADMIN">Super Admin Plateforme</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Adresse E-mail</label>
                <input
                  type="email"
                  required
                  value={editingUser.email}
                  onChange={e => setEditingUser({ ...editingUser, email: e.target.value })}
                  className="w-full px-3 py-2 bg-[#F7F9FC] border border-[#E8EDF4] rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Organisation / Cabinet Rattaché</label>
                <input
                  type="text"
                  required
                  value={editingUser.cabinet}
                  onChange={e => setEditingUser({ ...editingUser, cabinet: e.target.value })}
                  className="w-full px-3 py-2 bg-[#F7F9FC] border border-[#E8EDF4] rounded-xl text-xs"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="editTwoFactor"
                  checked={editingUser.twoFactor}
                  onChange={e => setEditingUser({ ...editingUser, twoFactor: e.target.checked })}
                  className="rounded text-[#2563EB] focus:ring-[#2563EB]"
                />
                <label htmlFor="editTwoFactor" className="text-xs text-slate-700 font-medium">
                  Authentification à double facteur (2FA) activée
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
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
