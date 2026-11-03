import React, { useState } from 'react';
import { 
  ShieldAlert, 
  Building2, 
  Server, 
  Activity, 
  Cpu, 
  Lock, 
  Database,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Search,
  ExternalLink
} from 'lucide-react';

export const SuperAdminPlatformView: React.FC = () => {
  const [tenants, setTenants] = useState([
    { id: 'tn-1', name: 'Cabinet Dr. Ben Salem (Cardiologie)', city: 'Tunis', sector: 'MEDICAL', status: 'ACTIVE', usersCount: 3, emailsMonth: 1420, plan: 'PROFESSIONNEL' },
    { id: 'tn-2', name: 'Cabinet Me. Selim Trabelsi (Affaires)', city: 'Tunis', sector: 'LEGAL', status: 'ACTIVE', usersCount: 4, emailsMonth: 980, plan: 'PROFESSIONNEL' },
    { id: 'tn-3', name: 'Clinique Dentaire Les Berges du Lac', city: 'Tunis', sector: 'MEDICAL', status: 'ACTIVE', usersCount: 8, emailsMonth: 4210, plan: 'ENTERPRISE' },
    { id: 'tn-4', name: 'Étude Notariale Karray & Associés', city: 'Sfax', sector: 'LEGAL', status: 'ACTIVE', usersCount: 2, emailsMonth: 540, plan: 'STARTER' }
  ]);

  const microservices = [
    { name: 'cabinet_backend (Node.js/Express)', port: '5000', status: 'HEALTHY', memory: '88 MB', uptime: '99.98%' },
    { name: 'cabinet_ai_service (FastAPI + NLP)', port: '8000', status: 'HEALTHY', memory: '340 MB', uptime: '99.95%' },
    { name: 'cabinet_mongo (MongoDB 7.0 Multi-tenant)', port: '27017', status: 'HEALTHY', memory: '120 MB', uptime: '100%' },
    { name: 'cabinet_n8n (Workflows Orchestration)', port: '5678', status: 'HEALTHY', memory: '95 MB', uptime: '99.90%' },
    { name: 'cabinet_prometheus (Supervision & Alertes)', port: '9090', status: 'HEALTHY', memory: '50 MB', uptime: '100%' },
    { name: 'cabinet_grafana (Tableaux de bord)', port: '3000', status: 'HEALTHY', memory: '65 MB', uptime: '100%' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-rose-600" />
            <h1 className="text-xl font-black text-[#14213D] tracking-tight">Super Administration SaaS MediLawAI</h1>
          </div>
          <p className="text-xs text-slate-500">
            Supervision multi-tenant, isolation cryptographique et monitoring d'infrastructure globale
          </p>
        </div>

        <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
          Accès Réservé Propriétaire SaaS
        </span>
      </div>

      {/* Global SaaS KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Cabinets Actifs (Tenants)', val: '4', sub: 'Isolation stricte par clinicId', color: 'text-blue-600' },
          { label: 'Utilisateurs Connectés', val: '17', sub: 'Médecins, Avocats, Secrétaires', color: 'text-purple-600' },
          { label: 'E-mails Traités ce Mois', val: '7,150', sub: 'Précision moyenne 94.2%', color: 'text-emerald-600' },
          { label: 'Taux de Disponibilité Système', val: '99.98%', sub: 'SLA Entreprise respecté', color: 'text-indigo-600' }
        ].map((k, idx) => (
          <div key={idx} className="p-5 bg-white rounded-2xl border border-[#E5EAF2] shadow-xs">
            <span className="text-xs font-semibold text-slate-500">{k.label}</span>
            <div className={`text-2xl font-black mt-2 ${k.color}`}>{k.val}</div>
            <span className="text-[10px] text-slate-400 mt-1 block">{k.sub}</span>
          </div>
        ))}
      </div>

      {/* Tenants Table */}
      <div className="bg-white rounded-2xl border border-[#E5EAF2] shadow-xs overflow-hidden p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-[#14213D]">Organisations Médicales & Juridiques Enregistrées</h2>
          <span className="text-xs text-slate-400 font-mono">Bases isolées</span>
        </div>

        <table className="w-full text-left text-xs">
          <thead className="bg-[#F7F9FC] border-b border-[#E5EAF2] text-slate-500 font-semibold">
            <tr>
              <th className="p-3">Cabinet / Ville</th>
              <th className="p-3">Secteur</th>
              <th className="p-3">Formule</th>
              <th className="p-3">Comptes</th>
              <th className="p-3">Volume E-mails</th>
              <th className="p-3">Statut</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {tenants.map(t => (
              <tr key={t.id} className="hover:bg-slate-50">
                <td className="p-3">
                  <div className="font-bold text-slate-900">{t.name}</div>
                  <div className="text-[10px] text-slate-400">{t.city}, Tunisie</div>
                </td>
                <td className="p-3">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    t.sector === 'MEDICAL' ? 'bg-blue-50 text-blue-700' : 'bg-indigo-50 text-indigo-700'
                  }`}>
                    {t.sector}
                  </span>
                </td>
                <td className="p-3 font-semibold text-slate-700">{t.plan}</td>
                <td className="p-3 font-bold text-slate-800">{t.usersCount} utilisateurs</td>
                <td className="p-3 font-mono text-slate-600">{t.emailsMonth} / mois</td>
                <td className="p-3">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {t.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Docker Compose Microservices Health */}
      <div className="bg-white rounded-2xl border border-[#E5EAF2] shadow-xs p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-[#14213D] flex items-center gap-2">
            <Server className="w-4 h-4 text-blue-600" />
            <span>État des 6 Conteneurs Docker de la Plateforme</span>
          </h2>
          <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> Tous Opérationnels
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {microservices.map((svc, i) => (
            <div key={i} className="p-3.5 rounded-xl border border-slate-200 bg-[#F7F9FC] space-y-1.5 text-xs">
              <div className="flex items-center justify-between font-mono">
                <span className="font-bold text-slate-800 truncate">{svc.name.split(' ')[0]}</span>
                <span className="text-emerald-700 font-bold text-[10px]">{svc.status}</span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-500">
                <span>Port : {svc.port}</span>
                <span>RAM : {svc.memory}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

