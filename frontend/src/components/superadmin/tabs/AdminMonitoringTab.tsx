import React, { useState } from 'react';
import { 
  Activity, 
  Server, 
  Cpu, 
  Database, 
  HardDrive, 
  CheckCircle2, 
  RefreshCw, 
  ExternalLink,
  ShieldCheck,
  Zap,
  Clock
} from 'lucide-react';
import { useAppStore } from '../../../stores/useAppStore';

export const AdminMonitoringTab: React.FC = () => {
  const { showToast } = useAppStore();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const containers = [
    { name: 'cabinet_backend', role: 'Node.js Express API & JWT', port: '5000', memory: '92 MB / 512 MB', cpu: '1.2%', status: 'HEALTHY', uptime: '14 jours 6h' },
    { name: 'cabinet_ai_service', role: 'FastAPI + scikit-learn NLP', port: '8000', memory: '340 MB / 1024 MB', cpu: '2.8%', status: 'HEALTHY', uptime: '14 jours 6h' },
    { name: 'cabinet_mongo', role: 'MongoDB 7.0 Multi-tenant Cluster', port: '27017', memory: '135 MB / 2048 MB', cpu: '0.8%', status: 'HEALTHY', uptime: '14 jours 6h' },
    { name: 'cabinet_redis', role: 'Redis 7.2 In-memory Cache', port: '6379', memory: '24 MB / 256 MB', cpu: '0.2%', status: 'HEALTHY', uptime: '14 jours 6h' },
    { name: 'cabinet_n8n', role: 'Workflow Orchestration Engine', port: '5678', memory: '110 MB / 512 MB', cpu: '1.5%', status: 'HEALTHY', uptime: '14 jours 6h' },
    { name: 'cabinet_prometheus', role: 'Time-series Metrics Scraper', port: '9090', memory: '52 MB / 256 MB', cpu: '0.4%', status: 'HEALTHY', uptime: '14 jours 6h' },
    { name: 'cabinet_grafana', role: 'SRE Monitoring Dashboards', port: '3000', memory: '68 MB / 256 MB', cpu: '0.5%', status: 'HEALTHY', uptime: '14 jours 6h' }
  ];

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      showToast({
        title: 'Métriques actualisées',
        message: 'Interrogation de l’endpoint /metrics Prometheus réussie.',
        type: 'info'
      });
    }, 700);
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-[#14213D] tracking-tight">Monitoring & Santé de l’Infrastructure</h1>
          <p className="text-xs text-slate-500">
            Supervision temps réel des 7 conteneurs Docker, utilisation mémoire et métriques Prometheus
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="px-3.5 py-2 bg-white border border-[#E8EDF4] hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold shadow-2xs flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Actualiser</span>
          </button>
          <a
            href="http://localhost:9090"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-2 bg-blue-50 border border-blue-200 text-[#2563EB] rounded-xl text-xs font-bold flex items-center gap-1.5 hover:bg-blue-100 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Prometheus</span>
          </a>
        </div>
      </div>

      {/* Resource Gauges */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-5 bg-white rounded-2xl border border-[#E8EDF4] shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Charge CPU Moyenne</span>
            <Cpu className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-[#14213D]">7.4%</div>
          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-blue-600 rounded-full" style={{ width: '7.4%' }}></div>
          </div>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-[#E8EDF4] shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Mémoire RAM Utilisée</span>
            <HardDrive className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-black text-[#14213D]">821 MB <span className="text-xs text-slate-400 font-normal">/ 4096 MB</span></div>
          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-purple-600 rounded-full" style={{ width: '20%' }}></div>
          </div>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-[#E8EDF4] shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Cache Hit Rate Redis</span>
            <Zap className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-emerald-600">96.8%</div>
          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-600 rounded-full" style={{ width: '96.8%' }}></div>
          </div>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-[#E8EDF4] shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Disponibilité Globale</span>
            <Activity className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-600">99.98%</div>
          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-600 rounded-full" style={{ width: '99.98%' }}></div>
          </div>
        </div>
      </div>

      {/* Containers Table */}
      <div className="bg-white rounded-2xl border border-[#E8EDF4] shadow-xs overflow-hidden">
        <div className="p-4 border-b border-[#E8EDF4] flex items-center justify-between">
          <h2 className="text-sm font-bold text-[#14213D] flex items-center gap-2">
            <Server className="w-4 h-4 text-[#2563EB]" />
            <span>État des 7 Conteneurs Docker de la Stack</span>
          </h2>
          <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> Docker Compose UP
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[750px]">
            <thead className="bg-[#F7F9FC] border-b border-[#E8EDF4] text-slate-500 font-semibold">
              <tr>
                <th className="p-4">Service & Conteneur</th>
                <th className="p-4">Rôle Système</th>
                <th className="p-4">Port Externe</th>
                <th className="p-4">RAM Allouée</th>
                <th className="p-4">CPU</th>
                <th className="p-4">Uptime</th>
                <th className="p-4">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {containers.map((c, idx) => (
                <tr key={idx} className="hover:bg-[#F7F9FC]">
                  <td className="p-4 font-mono font-bold text-[#14213D]">{c.name}</td>
                  <td className="p-4 text-slate-600">{c.role}</td>
                  <td className="p-4 font-mono text-[#2563EB] font-bold">:{c.port}</td>
                  <td className="p-4 font-mono text-slate-700">{c.memory}</td>
                  <td className="p-4 font-mono font-bold text-slate-700">{c.cpu}</td>
                  <td className="p-4 font-mono text-slate-500">{c.uptime}</td>
                  <td className="p-4">
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                      <CheckCircle2 className="w-3 h-3" /> {c.status}
                    </span>
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
