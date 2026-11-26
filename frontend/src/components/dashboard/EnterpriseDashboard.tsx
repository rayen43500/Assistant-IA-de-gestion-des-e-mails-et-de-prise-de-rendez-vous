import React from 'react';
import {
  Mail,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  Sparkles,
  ArrowUpRight,
  UserCheck,
  Zap,
  ShieldCheck,
  Send,
  Workflow
} from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore';

interface EnterpriseDashboardProps {
  onNavigateToEmails: () => void;
  onNavigateToCalendar: () => void;
  onNavigateToAutomations: () => void;
}

export const EnterpriseDashboard: React.FC<EnterpriseDashboardProps> = ({
  onNavigateToEmails,
  onNavigateToCalendar,
  onNavigateToAutomations
}) => {
  const { sector, emails, appointments, updateEmailStatus, showToast, currentUser } = useAppStore();

  const now = new Date();
  const isoOf = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const todayISO = isoOf(now);
  const todayLabel = now.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  const totalEmails = emails.length;
  const pendingApprovals = emails.filter(e => e.status === 'PENDING_VALIDATION');
  const autoReplied = emails.filter(e => (e as any).replyStatus === 'SENT' || e.status === 'SENT' || e.status === 'VALIDATED_AND_SENT').length;
  const awaitingPatient = emails.filter(e => e.status === 'WAITING_FOR_REPLY' || e.status === 'NEEDS_CLARIFICATION').length;
  const avgConfidence = emails.length ? Math.round(emails.reduce((sum, e) => sum + (e.confidence || 0), 0) / emails.length * 100) : null;
  const activeAppointments = appointments.filter(a => a.status !== 'CANCELLED');
  const todayAppointments = activeAppointments.filter(a => a.date === todayISO).sort((a, b) => a.timeStart.localeCompare(b.timeStart));
  const in7Days = isoOf(new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7));
  const upcomingCount = activeAppointments.filter(a => a.date >= todayISO && a.date <= in7Days).length;

  // Activité réelle des 7 derniers jours (e-mails reçus + RDV pris)
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6 + i);
    const iso = isoOf(d);
    return {
      iso,
      label: d.toLocaleDateString('fr-FR', { weekday: 'short' }).replace('.', ''),
      emails: emails.filter(e => ((e as any).receivedAtISO || '').startsWith(iso)).length,
      appointments: activeAppointments.filter(a => a.date === iso).length,
    };
  });
  const maxActivity = Math.max(1, ...last7.map(d => d.emails + d.appointments));
  const weekEmails = last7.reduce((n, d) => n + d.emails, 0);
  const peakDay = last7.reduce((best, d) => (d.emails > best.emails ? d : best), last7[0]);
  const emergencyCount = emails.filter(e => e.intent === 'EMERGENCY' && e.status !== 'VALIDATED_AND_SENT').length;

  const handleQuickApprove = async (id: string, name: string) => {
    const ok = await updateEmailStatus(id, 'VALIDATED_AND_SENT');
    if (ok) {
      showToast({ title: 'Réponse envoyée', message: `La réponse a été envoyée à ${name}.`, type: 'success' });
    }
  };

  return (
    <div className="space-y-6">
      {/* Welcome Banner matching screenshot 1 style */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-[#14213D] tracking-tight">Vue d’ensemble Opérationnelle</h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-100 text-blue-800">
              {sector === 'MEDICAL' ? 'Cabinet Médical' : 'Étude Juridique'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            <span className="capitalize">{todayLabel}</span> • {currentUser?.name}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={onNavigateToEmails}
            className="px-3.5 py-2 rounded-xl bg-white border border-[#E5EAF2] hover:bg-slate-50 text-slate-700 text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all"
          >
            <Mail className="w-3.5 h-3.5 text-blue-600" />
            <span>File de validation ({pendingApprovals.length})</span>
          </button>
          <button
            onClick={onNavigateToAutomations}
            className="px-3.5 py-2 rounded-xl bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 text-indigo-700 text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all"
          >
            <Workflow className="w-3.5 h-3.5 text-indigo-600" />
            <span>Automatisations n8n</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Row (matching Screenshot 1) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-[#E5EAF2] shadow-xs hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">E-mails Traités par l’IA</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Mail className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-[#14213D] mt-2">{totalEmails}</div>
          <div className="flex items-center gap-1 text-[11px] text-emerald-600 font-semibold mt-2">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>{autoReplied} réponse(s) envoyée(s)</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-[#E5EAF2] shadow-xs hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Confiance moyenne de l’IA</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-[#14213D] mt-2">{avgConfidence === null ? '—' : `${avgConfidence}%`}</div>
          <div className="flex items-center gap-1 text-[11px] text-purple-600 font-semibold mt-2">
            <span>Sur les {totalEmails} e-mail(s) analysé(s)</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-[#E5EAF2] shadow-xs hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Rendez-vous Aujourd’hui</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-[#14213D] mt-2">{todayAppointments.length}</div>
          <div className="flex items-center gap-1 text-[11px] text-emerald-600 font-semibold mt-2">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{upcomingCount} RDV dans les 7 prochains jours</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-[#E5EAF2] shadow-xs hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">En attente du patient</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-[#14213D] mt-2">{awaitingPatient}</div>
          <div className="flex items-center gap-1 text-[11px] text-blue-600 font-semibold mt-2">
            <span>Précision ou choix de créneau demandé</span>
          </div>
        </div>
      </div>

      {/* Main Content Grid: Activity Chart & AI Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Volume & Appointments Timeline (matching Screenshot 1) */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-white border border-[#E5EAF2] shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-black text-[#14213D]">Activité des E-mails & Prises de Rendez-vous</h2>
              <p className="text-xs text-slate-400">Distribution quotidienne sur les 7 derniers jours</p>
            </div>
            <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">Cette Semaine</span>
          </div>

          {/* Graphical Mock representing volume evolution */}
          <div className="h-44 w-full bg-[#F7F9FC] rounded-xl border border-slate-100 p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
              <span>{weekEmails} e-mail(s) cette semaine</span>
              <span className="text-blue-600 font-bold">{peakDay.emails > 0 ? `Pic : ${peakDay.label} (${peakDay.emails})` : 'Aucune activité récente'}</span>
            </div>
            {/* SVG Wave preview */}
            <div className="h-24 w-full flex items-end gap-3 px-2">
              {last7.map((d) => (
                <div key={d.iso} className="flex-1 h-full flex flex-col items-center justify-end gap-1.5" title={`${d.emails} e-mail(s), ${d.appointments} RDV`}>
                  <span className="text-[10px] font-mono text-slate-500">{d.emails + d.appointments || ''}</span>
                  <div
                    style={{ height: `${Math.max(4, ((d.emails + d.appointments) / maxActivity) * 100)}%` }}
                    className={`w-full rounded-t-md transition-all ${d.emails + d.appointments ? 'bg-gradient-to-t from-blue-600 to-blue-400' : 'bg-slate-200'}`}
                  />
                  <span className={`text-[10px] font-medium capitalize ${d.iso === todayISO ? 'text-blue-700 font-bold' : 'text-slate-500'}`}>{d.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Today's Appointments List (from Screenshot 2) */}
          <div className="pt-2">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-[#14213D] uppercase tracking-wider">
                Planning du jour
              </h3>
              <button onClick={onNavigateToCalendar} className="text-xs font-bold text-blue-600 hover:underline">
                Voir l'agenda complet →
              </button>
            </div>

            <div className="space-y-2">
              {todayAppointments.length === 0 && (
                <div className="p-4 rounded-xl border border-dashed border-slate-200 text-center text-xs text-slate-400">
                  Aucun rendez-vous aujourd’hui.
                </div>
              )}
              {todayAppointments.map((apt) => (
                <div key={apt.id} className="p-3 rounded-xl border border-[#E5EAF2] bg-[#F7F9FC] flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-blue-700 bg-blue-100/60 px-2 py-1 rounded-lg">
                      {apt.timeStart}
                    </span>
                    <div>
                      <div className="font-bold text-slate-800">{apt.patientName}</div>
                      <div className="text-[11px] text-slate-500">{apt.serviceName} • {apt.patientPhone}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full font-semibold text-[10px] bg-emerald-100 text-emerald-800">
                      {apt.status === 'CONFIRMED' ? 'Confirmé' : 'Planifié'}{apt.googleCalendarSynced ? ' • Google ✓' : ''}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: AI Approval Queue & Urgent Actions */}
        <div className="space-y-6">
          {/* Urgent / Priority Banner if emergencies */}
          {emergencyCount > 0 && (
            <div className="p-5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 space-y-2">
              <div className="flex items-center gap-2 font-black text-xs uppercase tracking-wider text-rose-700">
                <AlertTriangle className="w-4 h-4 text-rose-600 animate-bounce" />
                <span>Urgence Vitale Détectée</span>
              </div>
              <p className="text-xs leading-relaxed text-rose-800">
                Un cas critique a été escaladé vers le praticien de garde et la procédure SAMU 190.
              </p>
              <button
                onClick={onNavigateToEmails}
                className="w-full py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
              >
                Consulter l’Alerte E-mail
              </button>
            </div>
          )}

          {/* AI Approval Queue (Human-in-the-Loop) */}
          <div className="p-5 rounded-2xl bg-white border border-[#E5EAF2] shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <h3 className="text-xs font-bold text-[#14213D] uppercase tracking-wider">File de Validation Humaine</h3>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
                {pendingApprovals.length} en attente
              </span>
            </div>

            <div className="space-y-3">
              {pendingApprovals.slice(0, 3).map((em) => (
                <div key={em.id} className="p-3.5 rounded-xl border border-slate-200 bg-[#F7F9FC] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-800 truncate">{em.sender.name}</span>
                    <span className="text-[10px] font-bold text-blue-600">{em.intent}</span>
                  </div>
                  <p className="text-[11px] text-slate-600 line-clamp-2 italic">
                    "{em.subject}"
                  </p>
                  <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                    <span className="text-[10px] text-slate-400 font-mono">Confiance : {(em.confidence * 100).toFixed(0)}%</span>
                    <button
                      onClick={() => handleQuickApprove(em.id, em.sender.name)}
                      className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] rounded-lg shadow-xs flex items-center gap-1 transition-colors"
                    >
                      <Send className="w-3 h-3" />
                      <span>Approuver & Envoyer</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={onNavigateToEmails}
              className="w-full py-2 text-center text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors"
            >
              Ouvrir toute la boîte de réception →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

