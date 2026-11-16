import React from 'react';
import { 
  Building2, 
  Stethoscope, 
  Users, 
  CreditCard, 
  TrendingUp, 
  Activity, 
  CheckCircle2, 
  Server, 
  ArrowUpRight, 
  Clock, 
  ShieldCheck,
  Bot,
  AlertTriangle
} from 'lucide-react';

interface AdminDashboardTabProps {
  onNavigateToTab: (tab: any) => void;
}

export const AdminDashboardTab: React.FC<AdminDashboardTabProps> = ({ onNavigateToTab }) => {
  const kpiCards = [
    { label: 'Total Cabinets', value: '4', change: '+2 ce mois', icon: Building2, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Total Médecins & Avocats', value: '12', change: '+3 nouveaux', icon: Stethoscope, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Patients & Dossiers Suivis', value: '840', change: '+14% vs M-1', icon: Users, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Abonnements Actifs', value: '4', change: '100% renouvellement', icon: CreditCard, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: 'Revenu Mensuel (MRR)', value: '2,450 DT', change: '+18.5% croissance', icon: TrendingUp, color: 'text-teal-600', bg: 'bg-teal-50' },
    { label: 'Disponibilité Plateforme (SLA)', value: '99.98%', change: '0 incident critique', icon: Activity, color: 'text-emerald-600', bg: 'bg-emerald-50' }
  ];

  const recentActivities = [
    { id: 1, title: 'Souscription Plan Enterprise', cabinet: 'Clinique Dentaire Les Berges du Lac', time: 'Il y a 18 min', status: 'PAID', amount: '+750 DT' },
    { id: 2, title: 'Synchronisation Google Calendar', cabinet: 'Cabinet Dr. Youssef Ben Salem', time: 'Il y a 32 min', status: 'SYNCED', amount: '24 RDV' },
    { id: 3, title: 'Escalade Urgence SAMU 190', cabinet: 'Cabinet Dr. Youssef Ben Salem', time: 'Il y a 1h15', status: 'ESCALATED', amount: 'Alerte SMS' },
    { id: 4, title: 'Renouvellement Trimestriel', cabinet: 'Cabinet Me. Selim Trabelsi', time: 'Il y a 3h', status: 'PAID', amount: '+500 DT' },
    { id: 5, title: 'Nouveau praticien rattaché', cabinet: 'Étude Notariale Karray & Associés', time: 'Hier', status: 'ADDED', amount: 'Me. Karray' }
  ];

  const systemHealth = [
    { name: 'API Express (stage-cqe9)', port: '5000', status: 'HEALTHY', latency: '42ms', uptime: '99.98%' },
    { name: 'FastAPI AI Engine (NLP)', port: '8000', status: 'HEALTHY', latency: '65ms', uptime: '99.95%' },
    { name: 'MongoDB Cluster (Multi-tenant)', port: '27017', status: 'HEALTHY', latency: '12ms', uptime: '100%' },
    { name: 'n8n Workflow Automation', port: '5678', status: 'HEALTHY', latency: '28ms', uptime: '99.90%' }
  ];

  return (
    <div className="space-y-6 font-sans">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-[#14213D] tracking-tight">Vue Globale SaaS MediLawAI</h1>
          <p className="text-xs text-slate-500">
            Supervision centralisée des cabinets, de la facturation récurrente et des métriques d'infrastructure
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500 bg-white border border-[#E8EDF4] px-3 py-1.5 rounded-xl shadow-2xs">
            Dernière mise à jour : <strong className="text-[#14213D]">Temps Réel</strong>
          </span>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {kpiCards.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div key={idx} className="p-4 bg-white rounded-2xl border border-[#E8EDF4] shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-500 truncate">{kpi.label}</span>
                <div className={`w-8 h-8 rounded-xl ${kpi.bg} ${kpi.color} flex items-center justify-center shrink-0`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div>
                <div className="text-2xl font-black text-[#14213D] tracking-tight">{kpi.value}</div>
                <div className="text-[10px] font-bold text-emerald-600 mt-1 flex items-center gap-1">
                  <span>{kpi.change}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Section: Revenue Analytics & Cabinet Growth */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Analytics Chart (2 Columns) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-[#E8EDF4] shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-[#14213D]">Évolution des Revenus Récurrents (MRR)</h2>
              <p className="text-xs text-slate-400">Progression mensuelle des abonnements cabinets (en Dinars Tunisiens DT)</p>
            </div>
            <span className="px-2.5 py-1 rounded-full text-xs font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
              +28% en T4
            </span>
          </div>

          {/* Bar Chart Visualization */}
          <div className="h-56 flex items-end justify-between gap-3 pt-6 pb-2 px-2 border-b border-[#E8EDF4]">
            {[
              { month: 'Juin', rev: 1100, height: '45%' },
              { month: 'Juil', rev: 1350, height: '55%' },
              { month: 'Août', rev: 1600, height: '65%' },
              { month: 'Sept', rev: 1950, height: '80%' },
              { month: 'Oct', rev: 2200, height: '90%' },
              { month: 'Nov (En cours)', rev: 2450, height: '100%', active: true }
            ].map((col, cIdx) => (
              <div key={cIdx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                <span className="text-[10px] font-bold text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity">
                  {col.rev} DT
                </span>
                <div 
                  style={{ height: col.height }} 
                  className={`w-full rounded-xl transition-all ${
                    col.active 
                      ? 'bg-[#2563EB] shadow-md shadow-blue-500/20' 
                      : 'bg-slate-200 hover:bg-blue-300'
                  }`}
                />
                <span className={`text-[10px] font-bold ${col.active ? 'text-[#2563EB]' : 'text-slate-500'}`}>
                  {col.month}
                </span>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#2563EB]"></span>
                <span className="font-medium">Formules Pro & Enterprise</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-300"></span>
                <span className="font-medium">Formules Starter</span>
              </span>
            </div>
            <button 
              onClick={() => onNavigateToTab('payments')}
              className="font-bold text-[#2563EB] hover:underline flex items-center gap-1"
            >
              <span>Voir le grand livre</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Cabinet Growth Breakdown (1 Column) */}
        <div className="bg-white rounded-2xl border border-[#E8EDF4] shadow-xs p-6 space-y-4 flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-bold text-[#14213D]">Répartition des Cabinets</h2>
            <p className="text-xs text-slate-400">Distribution par secteur d'activité</p>

            <div className="space-y-4 mt-6">
              <div>
                <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                  <span className="flex items-center gap-1.5">
                    <Stethoscope className="w-3.5 h-3.5 text-blue-600" /> Cabinets Médicaux
                  </span>
                  <span>65% (3 cabinets)</span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-600 rounded-full" style={{ width: '65%' }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                  <span className="flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-purple-600" /> Cabinets Juridiques & Avocats
                  </span>
                  <span>35% (1 cabinet)</span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-purple-600 rounded-full" style={{ width: '35%' }}></div>
                </div>
              </div>
            </div>
          </div>

          <div className="p-3.5 bg-blue-50/70 border border-blue-200/60 rounded-xl space-y-1 text-xs">
            <span className="font-bold text-[#2563EB] flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4" /> Isolation Multi-Tenant
            </span>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Toutes les données des patients et dossiers clients sont cloisonnées cryptographiquement par <strong className="font-mono">clinicId</strong>.
            </p>
          </div>
        </div>
      </div>

      {/* Activities and System Health Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activities (2 Columns) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-[#E8EDF4] shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-[#14213D] flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#2563EB]" />
              <span>Activités Récentes de la Plateforme</span>
            </h2>
            <button 
              onClick={() => onNavigateToTab('cabinets')}
              className="text-xs font-bold text-[#2563EB] hover:underline"
            >
              Gérer les tenants
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {recentActivities.map((act) => (
              <div key={act.id} className="py-3 flex items-center justify-between text-xs hover:bg-[#F7F9FC] px-2 rounded-xl transition-colors">
                <div className="space-y-0.5">
                  <div className="font-bold text-[#14213D]">{act.title}</div>
                  <div className="text-[11px] text-slate-400">{act.cabinet}</div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="font-mono font-bold text-slate-700">{act.amount}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    act.status === 'PAID' 
                      ? 'bg-emerald-50 text-emerald-700' 
                      : act.status === 'ESCALATED' 
                      ? 'bg-rose-50 text-rose-700' 
                      : 'bg-blue-50 text-blue-700'
                  }`}>
                    {act.status}
                  </span>
                  <span className="text-[10px] text-slate-400 min-w-[70px] text-right">{act.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* System Health Cards (1 Column) */}
        <div className="bg-white rounded-2xl border border-[#E8EDF4] shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-[#14213D] flex items-center gap-2">
              <Server className="w-4 h-4 text-emerald-600" />
              <span>Santé des Microservices</span>
            </h2>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
              Tous UP
            </span>
          </div>

          <div className="space-y-2.5">
            {systemHealth.map((svc, sIdx) => (
              <div key={sIdx} className="p-3 bg-[#F7F9FC] rounded-xl border border-[#E8EDF4] flex items-center justify-between text-xs">
                <div>
                  <div className="font-bold text-[#14213D] truncate max-w-[150px]">{svc.name}</div>
                  <div className="text-[10px] text-slate-400 font-mono">Port :{svc.port} • Latence {svc.latency}</div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1 justify-end">
                    <CheckCircle2 className="w-3 h-3" /> {svc.status}
                  </span>
                  <span className="text-[9px] text-slate-400 font-mono">Uptime {svc.uptime}</span>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={() => onNavigateToTab('monitoring')}
            className="w-full py-2 bg-[#F7F9FC] hover:bg-slate-100 border border-[#E8EDF4] rounded-xl text-xs font-bold text-slate-700 transition-colors text-center"
          >
            Voir les métriques Prometheus détaillées
          </button>
        </div>
      </div>
    </div>
  );
};
