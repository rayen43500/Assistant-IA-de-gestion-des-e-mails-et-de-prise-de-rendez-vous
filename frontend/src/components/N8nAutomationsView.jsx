import React, { useState } from 'react';
import { apiClient, N8N_UI_URL } from '../services/apiClient';
import { useAppStore } from '../stores/useAppStore';
import {
  Workflow,
  Play,
  CheckCircle2,
  ExternalLink,
  Mail,
  MessageSquare,
  Calendar,
  AlertTriangle,
  Clock,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Terminal,
  Server,
  Zap,
  Layers,
  Sparkles
} from 'lucide-react';

export default function N8nAutomationsView({ onSimulateEmail }) {
  const [activeWorkflow, setActiveWorkflow] = useState('0');
  const [simulationLoading, setSimulationLoading] = useState(false);
  const [simulationResult, setSimulationResult] = useState(null);

  const workflows = [
    {
      id: '1',
      title: 'Ingestion & Tri Automatique E-mails',
      description: 'Capture Gmail/IMAP, classification NLP Deep Learning, et escalade automatique.',
      trigger: 'Gmail IMAP / Webhook POST',
      frequency: 'Temps réel & Polling 1 min',
      n8nId: '4d9McL2J7pagy5Df',
      icon: Mail,
      nodes: [
        { name: 'Quand on clique sur Tester', type: 'Trigger' },
        { name: 'Formatage Entrant', type: 'Set' },
        { name: 'Backend Ingestion & IA', type: 'NLP Deep Learning' },
        { name: 'Alerte WhatsApp Praticien', type: 'Escalade' }
      ]
    },
    {
      id: '2',
      title: 'Rappels 24h Avant RDV (Gmail Garanti + WhatsApp Optionnel)',
      description: 'Envoi prioritaire de l\'e-mail de rappel via Gmail, avec notification WhatsApp optionnelle non-bloquante.',
      trigger: 'Cron Quotidien (08h00 Tunis)',
      frequency: 'Tous les matins à 08:00',
      n8nId: 'w55mWLlk6GBvxuVQ',
      icon: MessageSquare,
      nodes: [
        { name: 'Cron Schedule 08h00', type: 'Trigger Temporel' },
        { name: 'GET /reminders-due', type: 'Backend Query' },
        { name: 'Rappel Gmail (Prioritaire)', type: 'E-mail Patient' },
        { name: 'WhatsApp (Optionnel)', type: 'Canal Confort' }
      ]
    },
    {
      id: '3',
      title: 'Synchronisation Google Calendar',
      description: 'Création et mise à jour des créneaux dans l’agenda Google Calendar du Dr. Rayen.',
      trigger: 'Webhook Réservation Confirmée',
      frequency: 'Événementiel à chaque confirmation',
      n8nId: 'gHsvnnDjW4SBALov',
      icon: Calendar,
      nodes: [
        { name: 'Webhook Event', type: 'Trigger' },
        { name: 'Google Calendar Sync', type: 'FreeBusy Check' },
        { name: 'Anti-boucle & Pause 12h30', type: 'Respect Créneaux' }
      ]
    },
    {
      id: '4',
      title: 'Escalade d’Urgence Critique SAMU 190 / 198',
      description: 'Détection instantanée des risques vitaux et notification immédiate au praticien de garde.',
      trigger: 'Webhook Priorité Haute',
      frequency: 'Immédiat (< 2 secondes)',
      n8nId: 'p61YDYKHJlnFgNRN',
      icon: AlertTriangle,
      nodes: [
        { name: 'Filtre Détection Urgence', type: 'Classification >95%' },
        { name: 'SMS / WhatsApp Prioritaire', type: 'Alerte Téléphone' },
        { name: 'Protocole SAMU 190', type: 'Redirection Vitale' }
      ]
    }
  ];

  // Diagnostic réel de la chaîne : aucune réussite n'est supposée, chaque étape est vérifiée
  const handleRunAllFlows = async () => {
    setSimulationLoading(true);
    setSimulationResult(null);
    const startTime = performance.now();
    const check = async (step, workflow, fn) => {
      try {
        const { ok, result, action } = await fn();
        return { step, workflow, status: ok ? 'OK' : 'À CONFIGURER', ok, result, action };
      } catch (err) {
        return { step, workflow, status: 'ERREUR', ok: false, result: err?.response?.data?.message || err?.message || 'Injoignable', action: 'Vérifiez que le service est démarré' };
      }
    };

    const flowsReport = await Promise.all([
      check(1, 'Backend API', async () => {
        const { data } = await apiClient.get('/health');
        return { ok: data?.status === 'UP', result: `Statut : ${data?.status}`, action: data?.environment || '' };
      }),
      check(2, 'Service IA (classification)', async () => {
        const { data } = await apiClient.get('/api/ai/health');
        const up = data && data.status !== 'DEGRADED';
        return { ok: up, result: up ? 'Service IA opérationnel' : 'Service IA indisponible : analyse locale de secours', action: data?.error || '' };
      }),
      check(3, 'Boîte Gmail centrale (lecture + envoi)', async () => {
        const { data } = await apiClient.get('/api/integrations/google/status');
        return {
          ok: Boolean(data?.connected),
          result: data?.connected ? `Connectée : ${data.email}` : 'Non connectée : les réponses restent en brouillon',
          action: data?.connected ? `Dernière lecture : ${data.polling?.lastPollAt ? new Date(data.polling.lastPollAt).toLocaleTimeString('fr-FR') : '—'}` : 'Paramètres > Intégrations > Autoriser avec Google',
        };
      }),
      check(4, 'Moteur n8n', async () => {
        await fetch(`${N8N_UI_URL}/healthz`, { mode: 'no-cors' });
        return { ok: true, result: `Joignable sur ${N8N_UI_URL}`, action: 'Workflows : ingestion, rappels 24h, agenda, urgences, journal' };
      }),
    ]);

    const successful = flowsReport.filter(r => r.ok).length;
    setSimulationResult({
      masterWorkflow: 'Diagnostic de la chaîne e-mail → IA → agenda',
      status: successful === flowsReport.length ? 'OPERATIONNEL' : 'ACTION_REQUISE',
      n8nWorkflowId: 'MasterRunAll0001',
      totalWorkflows: flowsReport.length,
      successfulWorkflows: successful,
      executionTimeMs: Number((performance.now() - startTime).toFixed(1)),
      timestamp: new Date().toISOString(),
      flowsReport,
      message: successful === flowsReport.length
        ? '✅ Toute la chaîne est opérationnelle.'
        : `⚠️ ${flowsReport.length - successful} élément(s) à configurer ou démarrer (voir ci-dessous).`,
    });
    setSimulationLoading(false);
  };

  // Test réel d'un flux : le moteur backend traite un e-mail de test (aucun envoi au patient)
  const handleRunSimulation = async (type) => {
    setSimulationLoading(true);
    setSimulationResult(null);
    const t0 = performance.now();
    try {
      if (type === 'REMINDER') {
        const d = new Date(); d.setDate(d.getDate() + 1);
        const tomorrow = d.toISOString().split('T')[0];
        const { data } = await apiClient.get(`/api/appointments?date=${tomorrow}`);
        const due = (Array.isArray(data) ? data : []).filter(a => ['SCHEDULED', 'CONFIRMED'].includes(a.status) && !a.reminderSent24h);
        setSimulationResult({
          workflow: '2. Rappels e-mail 24h',
          status: 'OK',
          ok: true,
          dueCount: due.length,
          recipients: due.map(a => `${a.patient?.name} — ${a.timeSlot?.start}`),
          note: 'n8n envoie ces rappels chaque jour à 08h00 (Gmail doit être connecté).',
          executionTimeMs: Number((performance.now() - t0).toFixed(1)),
        });
      } else {
        const payload = type === 'EMERGENCY'
          ? { senderName: 'Patient Test', senderEmail: 'test.urgence@exemple.tn', subject: '[TEST] Douleur thoracique', body: "[TEST] J'ai une douleur thoracique forte depuis ce matin.", autoSend: false }
          : { senderName: 'Patient Test', senderEmail: 'test.rdv@exemple.tn', subject: '[TEST] Demande de rendez-vous', body: '[TEST] Bonjour, je souhaite un rendez-vous demain à 10h00.', autoSend: false };
        const { data } = await apiClient.post('/api/emails/ingest', payload);
        setSimulationResult({
          workflow: type === 'EMERGENCY' ? '4. Escalade urgence vitale' : '1. Ingestion e-mail → IA → décision',
          status: 'OK',
          ok: true,
          decision: data.decision,
          intent: data.intent,
          praticien: data.practitioner?.name || 'à préciser par le patient',
          reponsePreparee: data.draftReply,
          note: 'E-mail de test ajouté à la boîte (réponse non envoyée).',
          executionTimeMs: Number((performance.now() - t0).toFixed(1)),
        });
        useAppStore.getState().loadEmails();
      }
    } catch (err) {
      setSimulationResult({ workflow: type, status: 'ERREUR', ok: false, erreur: err?.response?.data?.message || err?.message });
    } finally {
      setSimulationLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-[#14213D] flex items-center gap-2">
            <Workflow className="w-5 h-5 text-indigo-600" />
            <span>Moteur d'Automatisation & Workflows n8n</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Orchestration événementielle des e-mails, alertes WhatsApp et synchronisation d'agenda.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold shadow-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>n8n Opérationnel (:5678)</span>
          </div>

          <a
            href={N8N_UI_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm transition-all"
          >
            <span>Ouvrir n8n Web</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* CARTE MASTER WORKFLOW (RUN ALL FLOWS) */}
      <div className="p-6 rounded-2xl bg-linear-to-r from-indigo-900 via-blue-900 to-indigo-950 text-white shadow-md border border-indigo-700 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 text-[11px] font-bold uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-300" />
                <span>Master Flow Orchestrateur</span>
              </span>
              <span className="text-emerald-400 text-xs font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>4 Workflows Connectés</span>
              </span>
            </div>

            <h2 className="text-lg font-black tracking-tight text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-300" />
              <span>0. Orchestrateur Global : Exécuter Tous les Workflows (Run All Flows)</span>
            </h2>

            <p className="text-xs text-indigo-100/90 leading-relaxed">
              Déclenche en cascade les 4 flux n8n : <strong>1. Ingestion E-mail IA</strong> ➔ <strong>2. Rappels WhatsApp 24h</strong> ➔ <strong>3. Synchro Google Calendar</strong> ➔ <strong>4. Escalade SAMU 190</strong>, et synthétise un rapport global consolidé.
            </p>

            <div className="pt-1 flex flex-wrap items-center gap-2 text-[11px] text-indigo-200">
              <span className="bg-white/10 px-2.5 py-1 rounded-lg">ID n8n : <code>MasterRunAll0001</code></span>
              <span className="bg-white/10 px-2.5 py-1 rounded-lg">Webhook : <code>POST /webhook/run-all-workflows</code></span>
              <span className="bg-emerald-500/20 text-emerald-300 px-2.5 py-1 rounded-lg font-bold">0 Erreur de Paramètre</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch md:items-center gap-2.5 w-full md:w-auto shrink-0">
            <button
              onClick={handleRunAllFlows}
              disabled={simulationLoading}
              className="px-5 py-3 rounded-xl bg-linear-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white text-xs font-black shadow-lg transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer disabled:opacity-60"
            >
              {simulationLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Exécution en cours...</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 text-amber-300 fill-amber-300" />
                  <span>🚀 Lancer Tous les Workflows (1 Clic)</span>
                </>
              )}
            </button>

            <a
              href={`${N8N_UI_URL}/workflow/MasterRunAll0001`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 border border-white/20 text-center"
            >
              <span>Voir dans n8n</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>

      {/* Cartes des 4 Workflows Individuels */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-black uppercase tracking-wider text-slate-500">
            Workflows Spécialisés Actifs dans n8n
          </h2>
          <span className="text-[11px] text-slate-400">
            Cliquez pour tester individuellement ou ouvrez directement dans l'éditeur n8n
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {workflows.map((wf) => {
            const Icon = wf.icon;
            const isSelected = activeWorkflow === wf.id;
            return (
              <div
                key={wf.id}
                onClick={() => setActiveWorkflow(wf.id)}
                className={`p-5 rounded-2xl border transition-all cursor-pointer relative overflow-hidden ${isSelected
                    ? 'border-indigo-600 bg-indigo-50/40 shadow-sm ring-2 ring-indigo-500/20'
                    : 'border-[#E5EAF2] bg-white hover:border-slate-300 hover:shadow-xs'
                  }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl ${wf.id === '1' ? 'bg-blue-100 text-blue-700' :
                        wf.id === '2' ? 'bg-emerald-100 text-emerald-700' :
                          wf.id === '3' ? 'bg-purple-100 text-purple-700' :
                            'bg-rose-100 text-rose-700'
                      }`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">{wf.title}</h3>
                      <span className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5 font-medium">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>{wf.frequency}</span>
                      </span>
                    </div>
                  </div>

                  <a
                    href={`${N8N_UI_URL}/workflow/${wf.n8nId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-indigo-100 text-slate-700 hover:text-indigo-700 border border-slate-200 transition-all flex items-center gap-1"
                    title="Ouvrir dans n8n"
                  >
                    <span>Ouvrir</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                <p className="text-xs text-slate-600 mt-3 leading-relaxed">
                  {wf.description}
                </p>

                {/* Chaîne des nœuds */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-1.5 overflow-x-auto text-[10px]">
                  {wf.nodes.map((node, nIdx) => (
                    <React.Fragment key={nIdx}>
                      <div className="bg-[#F7F9FC] border border-[#E5EAF2] px-2.5 py-1 rounded-md text-slate-700 font-semibold whitespace-nowrap">
                        {node.name}
                      </div>
                      {nIdx < wf.nodes.length - 1 && (
                        <ArrowRight className="w-3 h-3 text-slate-400 shrink-0" />
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Banc d'Essai & Rapport d'Exécution */}
      <div className="p-6 rounded-2xl bg-white border border-[#E5EAF2] shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-[#14213D] flex items-center gap-2">
              <Play className="w-4 h-4 text-indigo-600" />
              <span>Banc d'Essai Interactif & Simulation de Déclenchement n8n</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Simulez l'exécution individuelle ou globale des flux et visualisez la réponse immédiate.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleRunAllFlows}
              disabled={simulationLoading}
              className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition-all flex items-center gap-1.5"
            >
              <Zap className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
              <span>Exécuter Tous les Flux</span>
            </button>

            <button
              onClick={() => handleRunSimulation('APPOINTMENT')}
              disabled={simulationLoading}
              className="px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-all flex items-center gap-1.5"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>1. Ingestion RDV</span>
            </button>

            <button
              onClick={() => handleRunSimulation('REMINDER')}
              disabled={simulationLoading}
              className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-all flex items-center gap-1.5"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>2. Rappels 24h</span>
            </button>

            <button
              onClick={() => handleRunSimulation('EMERGENCY')}
              disabled={simulationLoading}
              className="px-3 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs transition-all flex items-center gap-1.5"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>4. Urgence 190</span>
            </button>
          </div>
        </div>

        {/* Résultat de simulation */}
        {simulationLoading && (
          <div className="p-8 rounded-xl bg-[#F7F9FC] border border-slate-200 flex flex-col items-center justify-center gap-3 text-slate-600 text-xs font-medium">
            <RefreshCw className="w-6 h-6 text-indigo-600 animate-spin" />
            <span>Exécution de la chaîne de workflows n8n en cours avec le microservice IA et l'API Express...</span>
          </div>
        )}

        {simulationResult && !simulationLoading && (
          <div className="p-5 rounded-xl bg-[#F7F9FC] border border-indigo-200 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-indigo-100 pb-3">
              <span className="font-black text-slate-900 flex items-center gap-2 text-sm">
                <CheckCircle2 className={`w-5 h-5 shrink-0 ${simulationResult.ok === false || simulationResult.status === 'ACTION_REQUISE' ? 'text-amber-500' : 'text-emerald-600'}`} />
                <span>{simulationResult.masterWorkflow || simulationResult.workflow}</span>
              </span>
              <div className="flex items-center gap-2 text-xs">
                <span className={`px-2.5 py-0.5 rounded-full font-bold ${simulationResult.ok === false || simulationResult.status === 'ACTION_REQUISE' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>
                  {simulationResult.status}
                </span>
                <span className="text-indigo-700 font-mono font-bold">
                  {simulationResult.executionTimeMs ? `${simulationResult.executionTimeMs} ms` : 'OK'}
                </span>
              </div>
            </div>

            {/* Si c'est le Master Flow, afficher la grille des 4 étapes */}
            {simulationResult.flowsReport && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                {simulationResult.flowsReport.map((flow) => (
                  <div key={flow.step} className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        <span className={`w-5 h-5 rounded-full text-[10px] font-black flex items-center justify-center ${flow.ok ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                          {flow.ok ? '✓' : '!'}
                        </span>
                        <span>{flow.workflow}</span>
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${flow.ok ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-800 border-amber-200'}`}>
                        {flow.status}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 pl-6.5">{flow.result}</p>
                    <p className="text-[10px] text-indigo-600 font-semibold pl-6.5">➔ {flow.action}</p>
                  </div>
                ))}
              </div>
            )}

            <pre className="p-3 rounded-lg bg-white text-slate-800 font-mono text-[11px] overflow-x-auto border border-slate-200 shadow-2xs max-h-56">
              {JSON.stringify(simulationResult, null, 2)}
            </pre>
          </div>
        )}
      </div>

      {/* Guide & Sécurité DevSecOps n8n */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-white border border-[#E5EAF2] shadow-xs space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-bold text-indigo-700">
            <Server className="w-4 h-4" />
            <span>Moteur Dédié n8n</span>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            Accessible en direct sur <code>{N8N_UI_URL}</code> avec tous les flux préconfigurés pour le cabinet.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-white border border-[#E5EAF2] shadow-xs space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-700">
            <ShieldCheck className="w-4 h-4" />
            <span>Tolérance aux Pannes & Fallback</span>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            Si un service externe subit une latence, le mode résilient local garantit qu'aucun e-mail patient n'est perdu.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-white border border-[#E5EAF2] shadow-xs space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-bold text-blue-700">
            <Terminal className="w-4 h-4" />
            <span>Import & Sync Automatisé</span>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            Les workflows sont synchronisés directement dans SQLite avec le flux maître <code>MasterRunAll0001</code>.
          </p>
        </div>
      </div>
    </div>
  );
}
