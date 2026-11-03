import React, { useState } from 'react';
import { 
  Users, 
  Search, 
  Plus, 
  Phone, 
  Mail, 
  Calendar, 
  FileText, 
  MoreVertical,
  UserCheck,
  Stethoscope,
  Scale
} from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore';

export const ContactsDirectoryView: React.FC = () => {
  const { sector, contacts, showToast } = useAppStore();
  const [search, setSearch] = useState('');
  const [selectedContact, setSelectedContact] = useState(contacts[0]);

  const filtered = contacts.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    c.email.toLowerCase().includes(search.toLowerCase()) ||
    c.identifier.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
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
              placeholder="Rechercher nom, dossier, téléphone..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-8 pr-3 py-1.5 bg-white border border-[#E5EAF2] rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Directory Table and Detail Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Table List */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-[#E5EAF2] shadow-xs overflow-hidden">
          <table className="w-full text-left text-xs">
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

        {/* Contact Profile Detail */}
        {selectedContact && (
          <div className="bg-white rounded-2xl border border-[#E5EAF2] shadow-xs p-6 space-y-5">
            <div className="flex items-center gap-3 border-b border-[#E5EAF2] pb-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-lg">
                {selectedContact.name.charAt(0)}
              </div>
              <div>
                <h3 className="font-bold text-sm text-[#14213D]">{selectedContact.name}</h3>
                <span className="text-[11px] font-mono text-slate-400">{selectedContact.identifier}</span>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center gap-2.5 text-slate-700">
                <Phone className="w-4 h-4 text-slate-400" />
                <span className="font-semibold">{selectedContact.phone}</span>
              </div>
              <div className="flex items-center gap-2.5 text-slate-700">
                <Mail className="w-4 h-4 text-slate-400" />
                <span className="font-semibold">{selectedContact.email}</span>
              </div>
              <div className="flex items-center gap-2.5 text-slate-700">
                <Calendar className="w-4 h-4 text-slate-400" />
                <span>{selectedContact.totalAppointments} consultations enregistrées</span>
              </div>
            </div>

            <div className="p-3 bg-[#F7F9FC] rounded-xl border border-slate-100 space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Notes Administratives</span>
              <p className="text-xs text-slate-700 leading-relaxed">{selectedContact.notes}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

