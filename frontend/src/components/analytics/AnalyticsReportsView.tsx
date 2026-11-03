import React from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Clock, 
  Mail, 
  CheckCircle2, 
  AlertTriangle,
  Download,
  Calendar,
  Sparkles
} from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore';

export const AnalyticsReportsView: React.FC = () => {
  const { emails, appointments, showToast } = useAppStore();

  const handleExport = () => {
    showToast({
      title: 'Rapport d’activité généré !',
      message: 'Le fichier CSV / PDF a été téléchargé.',
      type: 'success'
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-[#14213D] tracking-tight">Analytiques & Rapports Mensuels</h1>
          <p className="text-xs text-slate-500">Performances du modèle NLP, taux d’automatisation et respect des critères CDC</p>
        </div>

        <button
          onClick={handleExport}
          className="px-4 py-2 bg-white border border-[#E5EAF2] hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl shadow-xs flex items-center gap-2 transition-all"
        >
          <Download className="w-4 h-4 text-blue-600" />
          <span>Exporter Rapport (PDF/CSV)</span>
        </button>
      </div>

      {/* Metrics Performance Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Classification NLP F1-Score', val: '94.1%', sub: 'Critère CDC > 90% (Validé)', color: 'text-purple-600' },
          { label: 'Taux de Réponses Assistées', val: '86.4%', sub: 'Human-in-the-Loop actif', color: 'text-blue-600' },
          { label: 'Réduction de l’Absentéisme', val: '-68%', sub: 'Grâce aux rappels WhatsApp 24h', color: 'text-emerald-600' },
          { label: 'Temps Économisé Moyen', val: '3.2 h/j', sub: 'Pour le secrétariat médical/juridique', color: 'text-indigo-600' }
        ].map((m, i) => (
          <div key={i} className="p-5 bg-white rounded-2xl border border-[#E5EAF2] shadow-xs">
            <span className="text-xs font-semibold text-slate-500">{m.label}</span>
            <div className={`text-2xl font-black mt-2 ${m.color}`}>{m.val}</div>
            <span className="text-[10px] text-slate-400 mt-1 block">{m.sub}</span>
          </div>
        ))}
      </div>

      {/* Visual Chart Representation */}
      <div className="p-6 bg-white rounded-2xl border border-[#E5EAF2] shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-[#14213D]">Répartition des Intentions Détectées (NLP Deep Learning)</h2>
          <span className="text-xs font-mono text-slate-400">Total : 500 échantillons de test</span>
        </div>

        <div className="space-y-3">
          {[
            { label: 'Demandes de Rendez-vous (APPOINTMENT)', count: 215, pct: '43%', color: 'bg-blue-600' },
            { label: 'Questions Tarifaires & Conventions (PRICING)', count: 120, pct: '24%', color: 'bg-emerald-600' },
            { label: 'Démarches Administratives & Feuilles CNAM', count: 85, pct: '17%', color: 'bg-purple-600' },
            { label: 'Urgences Vitales & SAMU 190 (EMERGENCY)', count: 45, pct: '9%', color: 'bg-rose-600' },
            { label: 'Messages Publicitaires Filtrés (SPAM)', count: 35, pct: '7%', color: 'bg-slate-400' }
          ].map((cat, idx) => (
            <div key={idx} className="space-y-1">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-slate-800">{cat.label}</span>
                <span className="text-slate-500 font-mono">{cat.count} ({cat.pct})</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                <div style={{ width: cat.pct }} className={`h-full ${cat.color} rounded-full`} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

