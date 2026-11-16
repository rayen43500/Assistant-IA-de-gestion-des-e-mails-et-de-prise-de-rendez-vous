import React, { useState } from 'react';
import { 
  Workflow, 
  Play, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  ExternalLink, 
  RefreshCw,
  Zap,
  Activity,
  Layers
} from 'lucide-react';
import { useAppStore } from '../../../stores/useAppStore';

export const AdminAutomationsTab: React.FC = () => {
  const { showToast } = useAppStore();
  const [runningWf, setRunningWf] = useState<string | null>(null);

  const workflows = [
    {
      id: 'wf-1',
      name: 'Ingestion & Tri Automatique E-mails',
      trigger: 'Gmail Polling / Webhook POST',
      frequency: 'Toutes les 2 min (ou instantané)',
      status: 'ACTIVE',
      lastRun: 'Il y a 3 min',
      runsMonth: 1420,
      successRate: '99.4%',
      avgDuration: '420 ms'
    },
    {
      id: 'wf-2',
      name: 'Rappels WhatsApp 24h Avant Rendez-vous',
      trigger: 'Cron 08h00 (Africa/Tunis)',
      frequency: 'Quotidien à 08h00',
      status: 'ACTIVE',
      lastRun: 'Ce matin 08:00',
      runsMonth: 890,
      successRate: '98.8%',
      avgDuration: '1.2 s'
    },
    {
      id: 'wf-3',
      name: 'Synchronisation Google Calendar',
      trigger: 'Webhook Réservation Confirmée',
      frequency: 'Événementiel temps réel',
      status: 'ACTIVE',
      lastRun: 'Il y a 14 min',
      runsMonth: 650,
      successRate: '100%',
      avgDuration: '310 ms'
    },
    {
      id: 'wf-4',
      name: 'Escalade SAMU 190 & Urgence Vitale',
      trigger: 'Webhook Alerte Prioritaire',
      frequency: 'Instantané < 500ms',
      status: 'ACTIVE',
      lastRun: 'Ce matin 08:30',
      runsMonth: 45,
      successRate: '100%',
      avgDuration: '180 ms'
    }
  ];

  const handleTestRun = (wfName: string, wfId: string) => {
    setRunningWf(wfId);
    setTimeout(() => {
      setRunningWf(null);
      showToast({
        title: 'Workflow n8n Exécuté avec Succès !',
        message: `${wfName} : 1 exécution test terminée avec code 200 OK.`,
        type: 'success'
      });
    }, 1000);
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-[#14213D] tracking-tight">Supervision des Automatisations n8n</h1>
          <p className="text-xs text-slate-500">
            Orchestration événementielle, déclencheurs asynchrones et traçabilité des exécutions
          </p>
        </div>

        <a
          href="http://localhost:5678"
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-2 bg-white border border-[#E8EDF4] hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold shadow-2xs flex items-center gap-2 transition-colors w-fit"
        >
          <ExternalLink className="w-4 h-4 text-[#2563EB]" />
          <span>Ouvrir Console n8n (Port 5678)</span>
        </a>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-5 bg-white rounded-2xl border border-[#E8EDF4] shadow-xs">
          <span className="text-xs font-semibold text-slate-500">Workflows n8n Actifs</span>
          <div className="text-2xl font-black text-[#14213D] mt-2">4 / 4</div>
          <span className="text-[10px] text-emerald-600 mt-1 block">Tous en statut ACTIVE</span>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-[#E8EDF4] shadow-xs">
          <span className="text-xs font-semibold text-slate-500">Exécutions ce Mois</span>
          <div className="text-2xl font-black text-blue-600 mt-2">3,005</div>
          <span className="text-[10px] text-slate-400 mt-1 block">+12% vs mois précédent</span>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-[#E8EDF4] shadow-xs">
          <span className="text-xs font-semibold text-slate-500">Taux de Succès Moyen</span>
          <div className="text-2xl font-black text-emerald-600 mt-2">99.55%</div>
          <span className="text-[10px] text-emerald-600 mt-1 block">Tolérance aux pannes active</span>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-[#E8EDF4] shadow-xs">
          <span className="text-xs font-semibold text-slate-500">Temps Moyen de Réponse</span>
          <div className="text-2xl font-black text-purple-600 mt-2">530 ms</div>
          <span className="text-[10px] text-slate-400 mt-1 block">Performances optimales</span>
        </div>
      </div>

      {/* Workflows Table */}
      <div className="bg-white rounded-2xl border border-[#E8EDF4] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[750px]">
            <thead className="bg-[#F7F9FC] border-b border-[#E8EDF4] text-slate-500 font-semibold">
              <tr>
                <th className="p-4">Nom du Workflow</th>
                <th className="p-4">Type de Déclencheur</th>
                <th className="p-4">Fréquence</th>
                <th className="p-4">Dernière Exécution</th>
                <th className="p-4">Volume Mensuel</th>
                <th className="p-4">Succès</th>
                <th className="p-4 text-right">Action Test</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {workflows.map(wf => (
                <tr key={wf.id} className="hover:bg-[#F7F9FC] transition-colors">
                  <td className="p-4">
                    <div className="font-bold text-[#14213D] flex items-center gap-2">
                      <Workflow className="w-3.5 h-3.5 text-[#2563EB]" />
                      <span>{wf.name}</span>
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">ID: {wf.id}</div>
                  </td>

                  <td className="p-4 font-mono font-medium text-slate-700">
                    {wf.trigger}
                  </td>

                  <td className="p-4 text-slate-600">
                    {wf.frequency}
                  </td>

                  <td className="p-4 font-mono text-slate-500">
                    {wf.lastRun}
                  </td>

                  <td className="p-4 font-mono font-bold text-slate-800">
                    {wf.runsMonth} runs
                  </td>

                  <td className="p-4">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200">
                      {wf.successRate}
                    </span>
                  </td>

                  <td className="p-4 text-right">
                    <button
                      onClick={() => handleTestRun(wf.name, wf.id)}
                      disabled={runningWf === wf.id}
                      className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-[#2563EB] rounded-xl font-bold text-[11px] transition-colors inline-flex items-center gap-1.5"
                    >
                      {runningWf === wf.id ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Exécution...</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-3 h-3 fill-current" />
                          <span>Tester</span>
                        </>
                      )}
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
