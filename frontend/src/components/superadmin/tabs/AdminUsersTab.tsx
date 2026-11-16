import React, { useState } from 'react';
import { 
  Users, 
  Search, 
  ShieldCheck, 
  Key, 
  UserX, 
  UserCheck, 
  MoreVertical, 
  Lock,
  Mail,
  Building2
} from 'lucide-react';
import { useAppStore } from '../../../stores/useAppStore';

export const AdminUsersTab: React.FC = () => {
  const { showToast } = useAppStore();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');

  const [users, setUsers] = useState([
    { id: 'usr-1', name: 'Dr. Youssef Ben Salem', email: 'dr.bensalem@cabinet-ai.tn', role: 'PRATICIEN', cabinet: 'Cabinet Médical Dr. Ben Salem', twoFactor: true, lastLogin: 'Il y a 14 min', status: 'ACTIVE' },
    { id: 'usr-2', name: 'Nadia Trabelsi', email: 'secretariat@cabinet-ai.tn', role: 'SECRETAIRE', cabinet: 'Cabinet Médical Dr. Ben Salem', twoFactor: true, lastLogin: 'Il y a 3 min', status: 'ACTIVE' },
    { id: 'usr-3', name: 'Me. Selim Trabelsi', email: 'me.trabelsi@avocats-tunis.tn', role: 'PRATICIEN', cabinet: 'Cabinet d’Avocats Selim Trabelsi', twoFactor: true, lastLogin: 'Il y a 2h', status: 'ACTIVE' },
    { id: 'usr-4', name: 'Sonia Mabrouk', email: 's.mabrouk@avocats-tunis.tn', role: 'SECRETAIRE', cabinet: 'Cabinet d’Avocats Selim Trabelsi', twoFactor: false, lastLogin: 'Aujourd’hui 09:12', status: 'ACTIVE' },
    { id: 'usr-5', name: 'Dr. Mehdi Chaouch', email: 'dr.chaouch@clinique-lac.tn', role: 'ADMIN', cabinet: 'Clinique Dentaire Les Berges du Lac', twoFactor: true, lastLogin: 'Il y a 30 min', status: 'ACTIVE' },
    { id: 'usr-6', name: 'Amine Mansour', email: 'admin@medilaw.ai', role: 'SUPER_ADMIN', cabinet: 'MediLawAI Platform Inc.', twoFactor: true, lastLogin: 'En ligne', status: 'ACTIVE' }
  ]);

  const filtered = users.filter(u => {
    if (roleFilter !== 'ALL' && u.role !== roleFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.cabinet.toLowerCase().includes(q);
    }
    return true;
  });

  const handleResetPassword = (email: string) => {
    showToast({
      title: 'Lien de réinitialisation transmis',
      message: `Un e-mail sécurisé de réinitialisation a été envoyé à ${email}.`,
      type: 'info'
    });
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-[#14213D] tracking-tight">Gestion des Utilisateurs SaaS</h1>
          <p className="text-xs text-slate-500">
            Contrôle des accès, double authentification (2FA), rôles et sessions actives sur l’ensemble des tenants
          </p>
        </div>

        <span className="text-xs font-bold text-slate-600 bg-white border border-[#E8EDF4] px-3 py-1.5 rounded-xl shadow-2xs">
          Comptes Enregistrés : <strong>{users.length}</strong>
        </span>
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
          {['ALL', 'PRATICIEN', 'SECRETAIRE', 'ADMIN', 'SUPER_ADMIN'].map(r => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                roleFilter === r 
                  ? 'bg-[#2563EB] text-white shadow-2xs' 
                  : 'bg-[#F7F9FC] border border-[#E8EDF4] text-slate-600 hover:bg-slate-100'
              }`}
            >
              {r === 'ALL' ? 'Tous' : r}
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
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                      {u.status}
                    </span>
                  </td>

                  <td className="p-4 text-right">
                    <button
                      onClick={() => handleResetPassword(u.email)}
                      title="Réinitialiser mot de passe"
                      className="px-2.5 py-1 text-[11px] font-bold text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      Reset MDP
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
