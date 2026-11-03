import React, { useState } from 'react';
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
  Server
} from 'lucide-react';

export default function N8nAutomationsView({ onSimulateEmail }) {
  const [activeWorkflow, setActiveWorkflow] = useState('1');
  const [simulationLoading, setSimulationLoading] = useState(false);
  const [simulationResult, setSimulationResult] = useState(null);

  const workflows = [
    {
      id: '1',
      title: 'Ingestion & Tri Automatique E-mails',
      description: 'Capture Gmail/IMAP, classification NLP Deep Learning, et escalade automatique.',
      trigger: 'Gmail IMAP / Webhook POST',
      frequency: 'Temps réel & Polling 1 min',
      icon: Mail,
      nodes: [
        { name: 'Gmail / Webhook Ingest', type: 'Trigger' },
        { name: 'FastAPI Deep Learning', type: 'Classification NLP' },
        { name: 'Backend SaaS Node.js', type: 'Stockage & Audit' },
        { name: 'WhatsApp Urgent Alert', type: 'Escalade Praticien' }
      ]
    },
    {
      id: '2',
      title: 'Rappels WhatsApp 24h Avant Rendez-vous',
      description: 'Interrogation quotidienne des RDV du lendemain et envoi des SMS/WhatsApp aux patients.',
      trigger: 'Cron Quotidien (08h00 Tunis)',
      frequency: 'Tous les matins à 08:00',
      icon: MessageSquare,
      nodes: [
        { name: 'Cron Schedule 08h00', type: 'Trigger Temporel' },
        { name: 'GET /api/appointments/reminders-due', type: 'Backend Query' },
        { name: 'WhatsApp Cloud API', type: 'Message Patient' },
        { name: 'POST /:id/reminder-sent', type: 'Accusé de Réception' }
      ]
    },
    {
      id: '3',
      title: 'Synchronisation Google Calendar',
      description: 'Création et mise à jour des créneaux dans l’agenda Google Calendar du praticien.',
      trigger: 'Webhook Réservation Confirmée',
      frequency: 'Événementiel à chaque confirmation',
      icon: Calendar,
      nodes: [
        { name: 'Webhook Event', type: 'Trigger' },
        { name: 'Google Calendar API', type: 'Création d’événement' },
        { name: 'Mise à jour ID Backend', type: 'Synchronisation' }
      ]
    },
    {
      id: '4',
      title: 'Escalade d’Urgence Critique SAMU 190 / 198',
      description: 'Détection instantanée des risques vitaux et notification immédiate au praticien de garde.',
      trigger: 'Webhook Priorité Haute',
      frequency: 'Immédiat (< 2 secondes)',
      icon: AlertTriangle,
      nodes: [
        { name: 'Filtre Détection Urgence', type: 'Classification >95%' },
        { name: 'SMS / WhatsApp Prioritaire', type: 'Alerte Téléphone' },
        { name: 'Protocole SAMU 190', type: 'Redirection Vitale' }
      ]
    }
  ];

  const handleRunSimulation = (type) => {
    setSimulationLoading(true);
    setSimulationResult(null);

    setTimeout(() => {
      setSimulationLoading(false);
      if (type === 'EMERGENCY') {
        const payload = {
          workflow: '1. Ingestion et Tri E-mails + Escalade Urgence',
          status: 'SUCCESS',
          intent: 'EMERGENCY',
          confidence: 0.99,
          patient: 'Mona Karray (+216 98 111 222)',
          actionTaken: '🚨 Alerte SMS immédiate transmise au Dr. Ben Salem & Notification SAMU 190 générée.',
          executionTimeMs: 42.5
        };
        setSimulationResult(payload);
        if (onSimulateEmail) {
          onSimulateEmail({
            id: `sim-${Date.now()}`,
            sender: { name: 'Mona Karray', email: 'm.karray@yahoo.fr' },
            subject: 'URGENCE : Forte douleur thoracique simulée n8n',
            body: 'Simulation n8n : douleur thoracique aiguë irradiant vers le bras gauche.',
            intent: 'EMERGENCY',
            confidence: 0.99,
            status: 'ESCALATED_EMERGENCY',
            draftReply: '🚨 ALERTE URGENCE VITALE : Veuillez contacter sans délai le SAMU Tunisie au 190 ou 198.'
          });
        }
      } else if (type === 'REMINDER') {
        setSimulationResult({
          workflow: '2. Rappels Automatiques WhatsApp 24h',
          status: 'SUCCESS',
          dueCount: 2,
          recipients: ['Sami Chaabane (+216 98 456 789)', 'Leila Trabelsi (+216 22 334 455)'],
          template: '👋 Bonjour {{patient}}, rappel de votre consultation demain à {{heure}} au cabinet Dr. Ben Salem.',
          backendUpdated: true
        });
      } else {
        const payload = {
          workflow: '1. Ingestion E-mail n8n',
          status: 'SUCCESS',
          intent: 'APPOINTMENT',
          confidence: 0.96,
          sender: 'Yassine Dridi',
          subject: 'Demande de RDV consultation cardiologie',
          extractedEntities: { requestedDate: 'vendredi', requestedTime: '15h' },
          actionTaken: 'E-mail classé avec succès et inséré dans la file de validation Human-in-the-Loop.',
          executionTimeMs: 38.1
        };
        setSimulationResult(payload);
        if (onSimulateEmail) {
          onSimulateEmail({
            id: `sim-${Date.now()}`,
            sender: { name: 'Yassine Dridi', email: 'yassine.dridi@gmail.com' },
            subject: 'Demande de RDV consultation cardiologie vendredi 15h',
            body: 'Bonjour Docteur, je souhaiterais prendre un créneau ce vendredi après-midi.',
            intent: 'APPOINTMENT',
            confidence: 0.96,
            status: 'PENDING_VALIDATION',
            draftReply: 'Bonjour M. Dridi,\n\nNous avons bien reçu votre demande pour vendredi 15h00. Souhaitez-vous que nous confirmions ce créneau ?'
          });
        }
      }
    }, 700);
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
            <span>n8n Conteneur Opérationnel (:5678)</span>
          </div>

          <a
            href="http://localhost:5678"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm transition-all"
          >
            <span>Ouvrir l'Éditeur n8n</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Cartes des 4 Workflows (Thème Clair Haute Visibilité) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {workflows.map((wf) => {
          const Icon = wf.icon;
          const isSelected = activeWorkflow === wf.id;
          return (
            <div
              key={wf.id}
              onClick={() => setActiveWorkflow(wf.id)}
              className={`p-5 rounded-2xl border transition-all cursor-pointer relative overflow-hidden ${
                isSelected 
                  ? 'border-indigo-600 bg-indigo-50/40 shadow-sm ring-2 ring-indigo-500/20' 
                  : 'border-[#E5EAF2] bg-white hover:border-slate-300 hover:shadow-xs'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl ${
                    wf.id === '1' ? 'bg-blue-100 text-blue-700' :
                    wf.id === '2' ? 'bg-emerald-100 text-emerald-700' :
                    wf.id === '3' ? 'bg-purple-100 text-purple-700' :
                    'bg-rose-100 text-rose-700'
                  }`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-900">{wf.title}</h2>
                    <span className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5 font-medium">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>{wf.frequency}</span>
                    </span>
                  </div>
                </div>

                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                  Actif
                </span>
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

      {/* Banc de test interactif de simulation n8n */}
      <div className="p-6 rounded-2xl bg-white border border-[#E5EAF2] shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-[#14213D] flex items-center gap-2">
              <Play className="w-4 h-4 text-indigo-600" />
              <span>Banc d'Essai Interactif & Simulation de Déclenchement n8n</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Simulez la réception d'un événement externe via le webhook n8n et observez la réaction immédiate de l'IA.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => handleRunSimulation('APPOINTMENT')}
              disabled={simulationLoading}
              className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-all flex items-center gap-1.5"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Simuler Ingestion RDV</span>
            </button>

            <button
              onClick={() => handleRunSimulation('EMERGENCY')}
              disabled={simulationLoading}
              className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs transition-all flex items-center gap-1.5"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Simuler Cas Urgence 190</span>
            </button>

            <button
              onClick={() => handleRunSimulation('REMINDER')}
              disabled={simulationLoading}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-all flex items-center gap-1.5"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Déclencher Rappels 24h</span>
            </button>
          </div>
        </div>

        {/* Résultat de simulation */}
        {simulationLoading && (
          <div className="p-6 rounded-xl bg-[#F7F9FC] border border-slate-200 flex items-center justify-center gap-3 text-slate-600 text-xs font-medium">
            <RefreshCw className="w-4 h-4 text-indigo-600 animate-spin" />
            <span>Exécution du flux n8n en cours avec classification FastAPI...</span>
          </div>
        )}

        {simulationResult && !simulationLoading && (
          <div className="p-4 rounded-xl bg-[#F7F9FC] border border-indigo-200 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-900 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Exécution n8n Réussie : {simulationResult.workflow}</span>
              </span>
              <span className="text-indigo-700 font-mono text-[11px] font-bold">
                {simulationResult.executionTimeMs ? `${simulationResult.executionTimeMs} ms` : 'Traité avec succès'}
              </span>
            </div>

            <pre className="p-3 rounded-lg bg-white text-slate-800 font-mono text-[11px] overflow-x-auto border border-slate-200 shadow-2xs">
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
            <span>Conteneur Dédié n8n</span>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            Isolation réseau sous <code>cabinet_network</code>. Les identifiants sont injectés via variables d'environnement chiffrées.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-white border border-[#E5EAF2] shadow-xs space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-700">
            <ShieldCheck className="w-4 h-4" />
            <span>Tolérance aux Pannes & Fallback</span>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            Si l'IA ou n8n subit un délai, le mode dégradé du backend garantit qu'aucun e-mail patient n'est perdu.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-white border border-[#E5EAF2] shadow-xs space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-bold text-blue-700">
            <Terminal className="w-4 h-4" />
            <span>Import Automatisé</span>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            Les 4 workflows JSON sont montés dans <code>/workflows</code> et prêts à être activés en un clic ou via script.
          </p>
        </div>
      </div>
    </div>
  );
}
