import React, { useMemo } from 'react';
import { Download } from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore';

const INTENT_LABELS: Record<string, { label: string; color: string }> = {
  APPOINTMENT: { label: 'Demandes de rendez-vous', color: 'bg-blue-600' },
  CANCELLATION: { label: 'Annulations', color: 'bg-amber-500' },
  PRICING: { label: 'Questions tarifaires', color: 'bg-emerald-600' },
  ADMINISTRATIVE: { label: 'Démarches administratives', color: 'bg-purple-600' },
  EMERGENCY: { label: 'Urgences vitales', color: 'bg-rose-600' },
  SPAM: { label: 'Indésirables', color: 'bg-slate-400' },
  OTHER: { label: 'Autres / à préciser', color: 'bg-slate-500' },
};

const pct = (n: number, total: number) => (total ? Math.round((n / total) * 100) : 0);

export const AnalyticsReportsView: React.FC = () => {
  const { emails, appointments, showToast } = useAppStore();

  const stats = useMemo(() => {
    const totalEmails = emails.length;
    const replied = emails.filter(e => e.replyStatus === 'SENT' || ['SENT', 'VALIDATED_AND_SENT'].includes(e.status)).length;
    const autoBooked = emails.filter(e => e.bookingDecision === 'DIRECT_CONFIRMATION' || e.bookingDecision === 'RESCHEDULED').length;
    const clarifications = emails.filter(e => e.bookingDecision === 'NEEDS_CLARIFICATION').length;
    const active = appointments.filter(a => a.status !== 'CANCELLED');
    const cancelled = appointments.filter(a => a.status === 'CANCELLED').length;
    const noShow = appointments.filter(a => a.status === 'NO_SHOW').length;
    const reminders = appointments.filter(a => a.reminderSent24h).length;

    const byIntent = Object.entries(
      emails.reduce<Record<string, number>>((acc, e) => {
        const key = INTENT_LABELS[e.intent] ? e.intent : 'OTHER';
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, {})
    ).sort((a, b) => b[1] - a[1]);

    return { totalEmails, replied, autoBooked, clarifications, active, cancelled, noShow, reminders, byIntent };
  }, [emails, appointments]);

  // Export CSV réel (rendez-vous + e-mails)
  const handleExport = () => {
    const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const rows = [
      ['Type', 'Date', 'Heure', 'Patient', 'E-mail', 'Motif / Sujet', 'Statut'],
      ...appointments.map(a => ['RDV', a.date, a.timeStart, a.patientName, a.patientEmail, a.serviceName, a.status]),
      ...emails.map(e => ['E-mail', e.receivedAtISO?.slice(0, 10) || '', e.receivedAtISO?.slice(11, 16) || '', e.sender.name, e.sender.email, e.subject, e.status]),
    ];
    const csv = '﻿' + rows.map(r => r.map(esc).join(';')).join('\r\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `rapport-activite-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    showToast({ title: 'Rapport exporté', message: `${rows.length - 1} ligne(s) exportée(s) au format CSV.`, type: 'success' });
  };

  const cards = [
    { label: 'E-mails reçus', val: String(stats.totalEmails), sub: `${stats.replied} réponse(s) envoyée(s) (${pct(stats.replied, stats.totalEmails)} %)`, color: 'text-blue-600' },
    { label: 'RDV réservés par l’IA', val: String(stats.autoBooked), sub: `${stats.clarifications} demande(s) de précision au patient`, color: 'text-purple-600' },
    { label: 'Rendez-vous actifs', val: String(stats.active.length), sub: `${stats.cancelled} annulé(s) • ${stats.noShow} absence(s)`, color: 'text-emerald-600' },
    { label: 'Rappels 24h envoyés', val: String(stats.reminders), sub: 'Par e-mail, la veille à 08h00', color: 'text-indigo-600' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-[#14213D] tracking-tight">Statistiques d’activité</h1>
          <p className="text-xs text-slate-500">Calculées en temps réel sur vos e-mails et rendez-vous</p>
        </div>

        <button
          onClick={handleExport}
          disabled={!emails.length && !appointments.length}
          className="px-4 py-2 bg-white border border-[#E5EAF2] hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed text-slate-700 text-xs font-bold rounded-xl shadow-xs flex items-center gap-2 transition-all"
        >
          <Download className="w-4 h-4 text-blue-600" />
          <span>Exporter (CSV)</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {cards.map((m) => (
          <div key={m.label} className="p-5 bg-white rounded-2xl border border-[#E5EAF2] shadow-xs">
            <span className="text-xs font-semibold text-slate-500">{m.label}</span>
            <div className={`text-2xl font-black mt-2 ${m.color}`}>{m.val}</div>
            <span className="text-[10px] text-slate-400 mt-1 block">{m.sub}</span>
          </div>
        ))}
      </div>

      <div className="p-6 bg-white rounded-2xl border border-[#E5EAF2] shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-black text-[#14213D]">Répartition des demandes reçues</h2>
          <span className="text-xs font-mono text-slate-400">Total : {stats.totalEmails} e-mail(s)</span>
        </div>

        {stats.byIntent.length === 0 ? (
          <p className="text-xs text-slate-400 py-6 text-center">Aucun e-mail reçu pour le moment.</p>
        ) : (
          <div className="space-y-3">
            {stats.byIntent.map(([intent, count]) => (
              <div key={intent} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-700">{INTENT_LABELS[intent].label}</span>
                  <span className="font-mono text-slate-500">{count} ({pct(count, stats.totalEmails)} %)</span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${INTENT_LABELS[intent].color}`} style={{ width: `${pct(count, stats.totalEmails)}%` }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalyticsReportsView;
