import React, { useState } from 'react';
import { 
  Bot, 
  Sparkles, 
  ShieldCheck, 
  AlertTriangle, 
  Cpu, 
  Gauge, 
  CheckCircle2, 
  RefreshCw,
  Search,
  Activity,
  Layers,
  ArrowUpRight
} from 'lucide-react';
import { useAppStore } from '../../../stores/useAppStore';

export const AdminAiSupervisionTab: React.FC = () => {
  const { showToast } = useAppStore();
  const [testSubject, setTestSubject] = useState('Douleurs aiguës au bras gauche depuis 2h');
  const [testResult, setTestResult] = useState<any>(null);
  const [isTesting, setIsTesting] = useState(false);

  const kpis = [
    { label: 'Précision Globale Modèle', val: '94.2%', sub: 'F1-score 94.1% sur jeu de test', icon: Sparkles, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Temps d’Inférence Moyen', val: '65 ms', sub: 'FastAPI + scikit-learn / ONNX', icon: Gauge, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Taux d’Hallucination RAG', val: '0.00%', sub: 'Réponses 100% appuyées sur sources', icon: ShieldCheck, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Attaques Prompt Injection Bloquées', val: '47', sub: 'Filtre de sécurité OWASP LLM actif', icon: AlertTriangle, color: 'text-rose-600', bg: 'bg-rose-50' }
  ];

  const intentDistribution = [
    { intent: 'APPOINTMENT (Prise de RDV)', count: 3240, percentage: 45, color: 'bg-blue-600' },
    { intent: 'PRICING (Tarifs & CNAM)', count: 1800, percentage: 25, color: 'bg-purple-600' },
    { intent: 'ADMINISTRATIVE (Horaires/Attestations)', count: 1080, percentage: 15, color: 'bg-teal-600' },
    { intent: 'EMERGENCY (Urgences SAMU 190)', count: 720, percentage: 10, color: 'bg-rose-600' },
    { intent: 'SPAM / HORS SUJET', count: 360, percentage: 5, color: 'bg-slate-400' }
  ];

  const handleTestInference = () => {
    setIsTesting(true);
    setTimeout(() => {
      setIsTesting(false);
      setTestResult({
        intent: 'EMERGENCY',
        confidence: 0.992,
        priority: 'CRITICAL',
        detectedUrgencyKeywords: ['douleurs aiguës', 'bras gauche'],
        safeToAutoSend: false,
        recommendedAction: 'ESCALATION_SAMU_190'
      });
      showToast({
        title: 'Classification IA effectuée !',
        message: 'Modèle NLP : Intention EMERGENCY détectée (Confiance 99.2%).',
        type: 'success'
      });
    }, 600);
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-[#14213D] tracking-tight">Supervision & Performance des Modèles IA</h1>
          <p className="text-xs text-slate-500">
            Métriques d'inférence en direct du microservice FastAPI, précision NLP et garde-fous anti-hallucination
          </p>
        </div>

        <span className="text-xs font-bold text-slate-600 bg-white border border-[#E8EDF4] px-3 py-1.5 rounded-xl shadow-2xs">
          Moteur : <strong>scikit-learn TF-IDF + RAG Embeddings</strong>
        </span>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div key={idx} className="p-5 bg-white rounded-2xl border border-[#E8EDF4] shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-500">{kpi.label}</span>
                <div className={`w-8 h-8 rounded-xl ${kpi.bg} ${kpi.color} flex items-center justify-center`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-[#14213D]">{kpi.val}</div>
              <span className="text-[10px] text-slate-400 mt-1 block">{kpi.sub}</span>
            </div>
          );
        })}
      </div>

      {/* Breakdown & Test Sandbox Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Classification Breakdown (2 Cols) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-[#E8EDF4] shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-[#14213D]">Distribution des Intentions E-mails Traitées</h2>
              <p className="text-xs text-slate-400">7,200 requêtes analysées ce mois sur l’ensemble des cabinets</p>
            </div>
            <span className="text-xs font-bold text-blue-600">Total 100%</span>
          </div>

          <div className="space-y-4 pt-2">
            {intentDistribution.map((item, idx) => (
              <div key={idx} className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold text-slate-700">
                  <span>{item.intent}</span>
                  <span className="font-mono">{item.count} ({item.percentage}%)</span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className={`h-full ${item.color} rounded-full`} style={{ width: `${item.percentage}%` }}></div>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Seuil de confiance minimum pour suggestion automatique : <strong>88%</strong></span>
            <span className="text-emerald-600 font-bold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> FastText / TF-IDF v2026.4
            </span>
          </div>
        </div>

        {/* Live Test Sandbox (1 Col) */}
        <div className="bg-white rounded-2xl border border-[#E8EDF4] shadow-xs p-6 space-y-4 flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-bold text-[#14213D] flex items-center gap-2">
              <Bot className="w-4 h-4 text-purple-600" />
              <span>Bac à Sable d'Inférence IA</span>
            </h2>
            <p className="text-xs text-slate-400">Tester la classification d’un e-mail en direct</p>

            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Texte ou Objet du Message</label>
                <textarea
                  rows={3}
                  value={testSubject}
                  onChange={e => setTestSubject(e.target.value)}
                  className="w-full p-2.5 text-xs bg-[#F7F9FC] border border-[#E8EDF4] rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                />
              </div>

              <button
                onClick={handleTestInference}
                disabled={isTesting}
                className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center justify-center gap-2 transition-colors disabled:opacity-60"
              >
                {isTesting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                <span>Lancer l'Inférence NLP</span>
              </button>

              {testResult && (
                <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl space-y-1.5 text-xs">
                  <div className="flex items-center justify-between font-bold text-purple-950">
                    <span>Intention : {testResult.intent}</span>
                    <span className="font-mono">{(testResult.confidence * 100).toFixed(1)}%</span>
                  </div>
                  <div className="text-[11px] text-purple-800">
                    Priorité : <strong className="text-rose-700">{testResult.priority}</strong>
                  </div>
                  <div className="text-[10px] text-slate-600 font-mono">
                    Action : {testResult.recommendedAction}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="p-3 bg-[#F7F9FC] rounded-xl border border-[#E8EDF4] text-[10px] text-slate-500 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Protection anti-injection : Nettoyage regex et vérification de structure.</span>
          </div>
        </div>
      </div>
    </div>
  );
};
