import React, { useState } from 'react';
import { 
  Stethoscope, 
  Search, 
  Calendar, 
  Mail, 
  Phone, 
  CheckCircle2, 
  Clock, 
  ShieldCheck, 
  MoreVertical,
  Plus,
  Scale
} from 'lucide-react';

export const AdminDoctorsTab: React.FC = () => {
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'DOCTOR' | 'LAWYER'>('ALL');

  const practitioners = [
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
  ];

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
            Total : <strong>{practitioners.length} praticiens actifs</strong>
          </span>
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
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                      {p.status}
                    </span>
                  </td>

                  <td className="p-4 text-right">
                    <button className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700">
                      <MoreVertical className="w-4 h-4" />
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
