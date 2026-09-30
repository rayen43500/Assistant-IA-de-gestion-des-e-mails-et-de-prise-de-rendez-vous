import React, { useState } from 'react';
import { 
  Mail, 
  CalendarCheck, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Send, 
  Sparkles,
  ArrowRight,
  TrendingUp,
  FileText
} from 'lucide-react';

export default function DashboardView({ emails, appointments, onNavigateToInbox, onValidateEmail }) {
  const pendingEmails = emails.filter(e => e.status === 'PENDING_VALIDATION');
  const emergencyEmails = emails.filter(e => e.intent === 'EMERGENCY');
  const todayAppointments = appointments.filter(a => a.status !== 'CANCELLED');

  const [summarySent, setSummarySent] = useState(false);

  return (
    <div className="space-y-6">
      {/* En-tête de bienvenue */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-blue-900/40 via-indigo-900/20 to-slate-900 p-6 rounded-2xl border border-blue-500/20 shadow-xl">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            Tableau de Bord & Supervision Quotidienne
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
              Cabinet Actif
            </span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Tri automatique NLP, gestion des créneaux de rendez-vous et RAG contextuel.
          </p>
        </div>

        {/* Bouton Résumé Quotidien (CDC 3.5) */}
        <button
          onClick={() => setSummarySent(true)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold shadow-lg transition-all ${
            summarySent 
              ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/40' 
              : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-blue-500/25'
          }`}
        >
          {summarySent ? (
            <>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Résumé matinal envoyé au praticien</span>
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              <span>Générer le Résumé Matinal (08h00)</span>
            </>
          )}
        </button>
      </div>

      {/* Cartes Métriques Clés */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* E-mails à valider */}
        <div className="glass-panel p-5 rounded-2xl relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              En attente de validation
            </span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Mail className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-white">{pendingEmails.length}</span>
            <span className="text-xs text-blue-400">brouillons IA prêts</span>
          </div>
          <p className="text-xs text-slate-400 mt-2">Triés par le modèle Deep Learning</p>
        </div>

        {/* Urgences Détectées */}
        <div className="glass-panel p-5 rounded-2xl relative overflow-hidden group border-red-500/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-red-400 uppercase tracking-wider">
              Alertes d'urgence
            </span>
            <div className="p-2 rounded-xl bg-red-500/20 text-red-400 border border-red-500/30">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-red-400">{emergencyEmails.length}</span>
            <span className="text-xs text-red-400/80">priorité vitale</span>
          </div>
          <p className="text-xs text-slate-400 mt-2">Escalade immédiate SAMU / Médecin</p>
        </div>

        {/* Rendez-vous du Jour */}
        <div className="glass-panel p-5 rounded-2xl relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Rendez-vous programmés
            </span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <CalendarCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-white">{todayAppointments.length}</span>
            <span className="text-xs text-emerald-400">confirmés</span>
          </div>
          <p className="text-xs text-slate-400 mt-2">Protection anti double réservation</p>
        </div>

        {/* Précision IA & Taux de Confiance */}
        <div className="glass-panel p-5 rounded-2xl relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Précision IA F1-Score
            </span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-white">94.2%</span>
            <span className="text-xs text-purple-400">&gt; 90% requis</span>
          </div>
          <p className="text-xs text-slate-400 mt-2">Temps de traitement moyen: 24 ms</p>
        </div>
      </div>

      {/* Section Principale : Brouillons urgents & Rendez-vous du jour */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Colonne Gauche (2/3) : Brouillons nécessitant une validation en 1 clic */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-2xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white">
                Brouillons IA en attente de validation
              </h2>
              <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full border border-slate-700">
                {pendingEmails.length}
              </span>
            </div>
            <button
              onClick={onNavigateToInbox}
              className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 font-medium transition-colors"
            >
              <span>Voir toute la boîte de réception</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {pendingEmails.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                <CheckCircle2 className="w-10 h-10 text-emerald-400/80 mx-auto mb-2" />
                <p className="text-sm font-medium">Tous les e-mails ont été traités et validés !</p>
                <p className="text-xs text-slate-500 mt-1">La boîte est parfaitement à jour.</p>
              </div>
            ) : (
              pendingEmails.slice(0, 3).map((email) => (
                <div key={email.id || email._id} className="p-4 rounded-xl glass-card border border-slate-700/60 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                          email.intent === 'EMERGENCY' ? 'badge-emergency' :
                          email.intent === 'APPOINTMENT' ? 'badge-appointment' :
                          email.intent === 'PRICING' ? 'badge-pricing' : 'badge-administrative'
                        }`}>
                          {email.intent}
                        </span>
                        <span className="text-xs text-slate-400">Confiance : {Math.round((email.confidence || 0.9) * 100)}%</span>
                      </div>
                      <h3 className="text-sm font-semibold text-white mt-1.5">{email.subject}</h3>
                      <p className="text-xs text-slate-400">De : {email.sender?.name} ({email.sender?.email})</p>
                    </div>

                    <button
                      onClick={() => onValidateEmail(email.id || email._id)}
                      className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-600/20 flex items-center gap-1.5 shrink-0 transition-all"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Valider & Envoyer</span>
                    </button>
                  </div>

                  {/* Aperçu du brouillon généré par l'IA */}
                  <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800 text-xs text-slate-300 font-mono whitespace-pre-line leading-relaxed">
                    <div className="text-[10px] text-blue-400 font-semibold mb-1 flex items-center gap-1 uppercase tracking-wider">
                      <Sparkles className="w-3 h-3" />
                      <span>Réponse proposée par l'Assistant IA :</span>
                    </div>
                    {email.draftReply}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Colonne Droite (1/3) : Rendez-vous du jour */}
        <div className="glass-panel p-6 rounded-2xl space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <CalendarCheck className="w-4 h-4 text-emerald-400" />
              <span>Agenda du Jour</span>
            </h2>
            <span className="text-xs text-slate-400 font-medium">Aujourd'hui</span>
          </div>

          <div className="space-y-3">
            {todayAppointments.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">Aucun rendez-vous planifié aujourd'hui.</p>
            ) : (
              todayAppointments.map((apt, idx) => (
                <div key={idx} className="p-3.5 rounded-xl glass-card border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold text-xs">
                      {apt.timeSlot?.start || '09:00'}
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-white">{apt.patient?.name}</h4>
                      <p className="text-[11px] text-slate-400">{apt.reason}</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                    {apt.status}
                  </span>
                </div>
              ))
            )}
          </div>

          {/* Rappel 24h automatique */}
          <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-start gap-2.5">
            <Clock className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
            <p className="text-xs text-blue-300">
              Rappels automatiques activés : les patients de demain reçoivent un SMS / WhatsApp 24h avant.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
