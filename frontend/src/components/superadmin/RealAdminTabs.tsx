import React, { useCallback, useEffect, useState } from 'react';
import {
  Building2, Stethoscope, Users, CalendarDays, Mail, AlertTriangle, CheckCircle2, XCircle,
  RefreshCw, Plus, ShieldCheck, Server, Database, Bot, Workflow, ExternalLink, CreditCard,
} from 'lucide-react';
import { apiClient, apiErrorMessage, N8N_UI_URL, SERVER_LABEL } from '../../services/apiClient';
import { useAppStore } from '../../stores/useAppStore';

/* ───────────────────────── Utilitaires partagés ───────────────────────── */

function useApi<T>(url: string) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get(url);
      setData(res.data);
      setError(null);
    } catch (err: any) {
      setError(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [url]);
  useEffect(() => { reload(); }, [reload]);
  return { data, error, loading, reload };
}

const Card: React.FC<{ className?: string; children: React.ReactNode }> = ({ className = '', children }) => (
  <div className={`bg-white rounded-2xl border border-[#E5EAF2] shadow-xs ${className}`}>{children}</div>
);

const PageHeader: React.FC<{ title: string; subtitle: string; onRefresh?: () => void; action?: React.ReactNode }> = ({ title, subtitle, onRefresh, action }) => (
  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
    <div>
      <h1 className="text-xl font-black text-[#14213D] tracking-tight">{title}</h1>
      <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
    </div>
    <div className="flex items-center gap-2">
      {onRefresh && (
        <button onClick={onRefresh} className="px-3 py-2 bg-white border border-[#E5EAF2] hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-700 flex items-center gap-1.5">
          <RefreshCw className="w-3.5 h-3.5" /> Actualiser
        </button>
      )}
      {action}
    </div>
  </div>
);

const StateBox: React.FC<{ loading: boolean; error: string | null; empty?: boolean; emptyText?: string; children: React.ReactNode }> = ({ loading, error, empty, emptyText, children }) => {
  if (loading) return <Card className="p-8 text-center text-xs text-slate-400">Chargement…</Card>;
  if (error) return <Card className="p-6 text-xs text-rose-700 bg-rose-50 border-rose-200">{error}</Card>;
  if (empty) return <Card className="p-8 text-center text-xs text-slate-400">{emptyText || 'Aucune donnée.'}</Card>;
  return <>{children}</>;
};

const Kpi: React.FC<{ label: string; value: React.ReactNode; sub?: string; icon: React.ElementType; tone?: string }> = ({ label, value, sub, icon: Icon, tone = 'text-blue-600 bg-blue-50' }) => (
  <Card className="p-5">
    <div className="flex items-center justify-between">
      <span className="text-xs font-semibold text-slate-500">{label}</span>
      <span className={`w-8 h-8 rounded-lg flex items-center justify-center ${tone}`}><Icon className="w-4 h-4" /></span>
    </div>
    <div className="text-2xl font-black text-[#14213D] mt-2">{value}</div>
    {sub && <div className="text-[11px] text-slate-500 mt-1">{sub}</div>}
  </Card>
);

const Badge: React.FC<{ ok: boolean; okText?: string; koText?: string }> = ({ ok, okText = 'Opérationnel', koText = 'Indisponible' }) => (
  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${ok ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'}`}>
    {ok ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}{ok ? okText : koText}
  </span>
);

const fmtDate = (v?: string) => (v ? new Date(v).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—');
const ROLE_LABELS: Record<string, string> = { SUPER_ADMIN: 'Super admin', ADMIN: 'Administrateur', PRATICIEN: 'Praticien', PATIENT: 'Patient' };
const inputCls = 'w-full px-3 py-2 bg-[#F7F9FC] border border-[#E5EAF2] rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20';

/* ───────────────────────── Vue d'ensemble ───────────────────────── */

export const RealAdminOverview: React.FC<{ onNavigateToTab?: (tab: any) => void }> = ({ onNavigateToTab }) => {
  const { data, error, loading, reload } = useApi<any>('/api/admin/overview');
  const max = Math.max(1, ...(data?.activity || []).map((d: any) => d.emails + d.appointments));
  return (
    <div className="space-y-6">
      <PageHeader title={data?.scope === 'CLINIC' ? 'Vue d’ensemble du cabinet' : 'Vue d’ensemble de la plateforme'} subtitle="Données réelles, mises à jour à chaque ouverture" onRefresh={reload} />
      <StateBox loading={loading && !data} error={error}>
        {data && (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <Kpi label="Cabinets" value={data.clinics} icon={Building2} />
              <Kpi label="Praticiens actifs" value={data.doctors.active} sub={`${data.doctors.total} au total`} icon={Stethoscope} tone="text-purple-600 bg-purple-50" />
              <Kpi label="Utilisateurs" value={data.users.total} sub={Object.entries(data.users.byRole).map(([r, n]) => `${n} ${ROLE_LABELS[r] || r}`).join(' • ')} icon={Users} tone="text-emerald-600 bg-emerald-50" />
              <Kpi label="Rendez-vous à venir" value={data.appointments.upcoming} sub={`${data.appointments.today} aujourd’hui • ${data.appointments.total} au total`} icon={CalendarDays} tone="text-amber-600 bg-amber-50" />
              <Kpi label="E-mails reçus (7 j)" value={data.emails.last7Days} sub={`${data.emails.total} au total`} icon={Mail} />
              <Kpi label="RDV réservés par l’IA" value={data.emails.autoBooked} sub={`${data.emails.clarifications} demande(s) de précision`} icon={Bot} tone="text-indigo-600 bg-indigo-50" />
              <Kpi label="Réponses à valider" value={data.emails.pendingValidation} sub={`${data.emails.replied} réponse(s) envoyée(s)`} icon={CheckCircle2} tone="text-sky-600 bg-sky-50" />
              <Kpi label="Urgences vitales" value={data.emails.emergencies} icon={AlertTriangle} tone="text-rose-600 bg-rose-50" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="p-6 lg:col-span-2">
                <h2 className="text-sm font-black text-[#14213D] mb-4">Activité des 7 derniers jours</h2>
                <div className="h-40 flex items-end gap-3">
                  {data.activity.map((d: any) => (
                    <div key={d.date} className="flex-1 h-full flex flex-col items-center justify-end gap-1" title={`${d.emails} e-mail(s), ${d.appointments} RDV créé(s)`}>
                      <span className="text-[10px] font-mono text-slate-500">{d.emails + d.appointments || ''}</span>
                      <div className="w-full flex flex-col justify-end rounded-t-md overflow-hidden" style={{ height: `${Math.max(3, ((d.emails + d.appointments) / max) * 100)}%` }}>
                        <div className="bg-blue-500" style={{ flex: d.emails || 0.0001 }} />
                        <div className="bg-emerald-500" style={{ flex: d.appointments || 0.0001 }} />
                      </div>
                      <span className="text-[10px] text-slate-500 capitalize">{new Date(`${d.date}T12:00:00`).toLocaleDateString('fr-FR', { weekday: 'short' })}</span>
                    </div>
                  ))}
                </div>
                <div className="flex gap-4 text-[11px] text-slate-500 mt-3">
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-blue-500" /> E-mails reçus</span>
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" /> RDV créés</span>
                </div>
              </Card>
              <ServicesCard services={data.services} onOpen={() => onNavigateToTab?.('monitoring')} />
            </div>
          </>
        )}
      </StateBox>
    </div>
  );
};

const ServicesCard: React.FC<{ services: any; onOpen?: () => void; detailed?: boolean }> = ({ services, onOpen, detailed }) => {
  const rows = [
    { icon: Server, name: 'API backend', ok: services.backend.up, info: `${SERVER_LABEL} • ${services.backend.environment} • en ligne depuis ${Math.round(services.backend.uptimeSeconds / 60)} min` },
    { icon: Database, name: 'Base de données MongoDB', ok: services.database.up, info: services.database.up ? 'Connectée' : 'Déconnectée' },
    { icon: Bot, name: 'Service IA', ok: services.ai.up, info: services.ai.up ? 'Classification active' : `Mode secours local${services.ai.detail ? ` (${services.ai.detail})` : ''}` },
    { icon: Mail, name: 'Boîte Gmail centrale', ok: services.gmail.up, info: services.gmail.up ? `${services.gmail.mailbox} • lu le ${fmtDate(services.gmail.lastPollAt)}` : 'Non connectée : les réponses restent en brouillon', okText: 'Connectée', koText: 'Non connectée' },
    { icon: Workflow, name: 'Moteur n8n', ok: services.n8n.up, info: services.n8n.url },
  ];
  return (
    <Card className="p-6 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-black text-[#14213D]">Santé des services</h2>
        {onOpen && <button onClick={onOpen} className="text-[11px] font-bold text-blue-600 hover:underline">Détails</button>}
      </div>
      {rows.map(r => (
        <div key={r.name} className="flex items-start justify-between gap-2 p-3 rounded-xl bg-[#F7F9FC] border border-[#E8EDF4]">
          <div className="flex items-start gap-2 min-w-0">
            <r.icon className="w-4 h-4 text-slate-500 mt-0.5 shrink-0" />
            <div className="min-w-0">
              <div className="text-xs font-bold text-[#14213D]">{r.name}</div>
              {(detailed || !r.ok) && <div className="text-[10px] text-slate-500 break-all">{r.info}</div>}
            </div>
          </div>
          <Badge ok={r.ok} okText={(r as any).okText} koText={(r as any).koText} />
        </div>
      ))}
    </Card>
  );
};

/* ───────────────────────── Cabinets ───────────────────────── */

export const RealAdminClinics: React.FC = () => {
  const { currentUser, showToast } = useAppStore();
  const { data, error, loading, reload } = useApi<any[]>('/api/admin/clinics');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', type: 'MEDICAL', phone: '', email: '', city: '' });
  const canCreate = currentUser?.role === 'SUPER_ADMIN';

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.post('/api/admin/clinics', form);
      showToast({ title: 'Cabinet créé', message: form.name, type: 'success' });
      setShowForm(false);
      setForm({ name: '', type: 'MEDICAL', phone: '', email: '', city: '' });
      reload();
    } catch (err: any) {
      showToast({ title: 'Création impossible', message: apiErrorMessage(err), type: 'danger' });
    }
  };

  return (
    <div className="space-y-4">
      <PageHeader title="Cabinets" subtitle="Cabinets enregistrés et leur activité" onRefresh={reload}
        action={canCreate && <button onClick={() => setShowForm(!showForm)} className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5"><Plus className="w-3.5 h-3.5" /> Nouveau cabinet</button>} />
      {showForm && (
        <Card className="p-5">
          <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <input required placeholder="Nom du cabinet *" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className={inputCls} />
            <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} className={inputCls}>
              <option value="MEDICAL">Cabinet médical</option>
              <option value="LEGAL">Cabinet juridique</option>
            </select>
            <input placeholder="Ville" value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} className={inputCls} />
            <input placeholder="Téléphone" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className={inputCls} />
            <input type="email" placeholder="E-mail de contact" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className={inputCls} />
            <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold">Créer</button>
          </form>
        </Card>
      )}
      <StateBox loading={loading} error={error} empty={!data?.length} emptyText="Aucun cabinet.">
        <Card className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-[#F7F9FC] text-slate-500 text-left">
              <tr>{['Cabinet', 'Type', 'Contact', 'Praticiens', 'Utilisateurs', 'RDV', 'E-mails', 'Créé le'].map(h => <th key={h} className="p-3 font-semibold">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data?.map(c => (
                <tr key={c.id}>
                  <td className="p-3 font-bold text-[#14213D]">{c.name}<div className="text-[10px] text-slate-400 font-normal">{c.address?.city || ''}</div></td>
                  <td className="p-3">{c.type === 'LEGAL' ? 'Juridique' : 'Médical'}</td>
                  <td className="p-3 text-slate-600">{c.phone || '—'}<div className="text-[10px] text-slate-400">{c.email || ''}</div></td>
                  <td className="p-3 font-mono">{c.doctors}</td>
                  <td className="p-3 font-mono">{c.users}</td>
                  <td className="p-3 font-mono">{c.appointments}</td>
                  <td className="p-3 font-mono">{c.emails}</td>
                  <td className="p-3 text-slate-500">{fmtDate(c.createdAt).slice(0, 10)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </StateBox>
    </div>
  );
};

/* ───────────────────────── Praticiens ───────────────────────── */

export const RealAdminDoctors: React.FC = () => {
  const { showToast } = useAppStore();
  const { data, error, loading, reload } = useApi<any[]>('/api/admin/doctors');
  const setStatus = async (id: string, status: string) => {
    try {
      await apiClient.patch(`/api/admin/doctors/${id}`, { status });
      reload();
    } catch (err: any) {
      showToast({ title: 'Modification impossible', message: apiErrorMessage(err), type: 'danger' });
    }
  };
  return (
    <div className="space-y-4">
      <PageHeader title="Praticiens" subtitle="Seuls les praticiens actifs reçoivent des rendez-vous de l’IA. Pour en ajouter un, créez un utilisateur « Praticien »." onRefresh={reload} />
      <StateBox loading={loading} error={error} empty={!data?.length} emptyText="Aucun praticien.">
        <Card className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-[#F7F9FC] text-slate-500 text-left">
              <tr>{['Praticien', 'Spécialité', 'Cabinet', 'Consultation', 'RDV à venir', 'RDV total', 'Statut'].map(h => <th key={h} className="p-3 font-semibold">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data?.map(d => (
                <tr key={d.id}>
                  <td className="p-3 font-bold text-[#14213D]">{d.name}<div className="text-[10px] text-slate-400 font-normal">{d.email}</div></td>
                  <td className="p-3">{d.specialty}</td>
                  <td className="p-3 text-slate-600">{d.clinic}</td>
                  <td className="p-3">{d.appointmentDuration} min</td>
                  <td className="p-3 font-mono">{d.upcoming}</td>
                  <td className="p-3 font-mono">{d.appointments}</td>
                  <td className="p-3">
                    <select value={d.status} onChange={e => setStatus(d.id, e.target.value)} className="px-2 py-1 border border-[#E5EAF2] rounded-lg bg-white text-xs">
                      <option value="ACTIVE">Actif</option>
                      <option value="ON_LEAVE">En congé</option>
                      <option value="INACTIVE">Inactif</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </StateBox>
    </div>
  );
};

/* ───────────────────────── Utilisateurs ───────────────────────── */

export const RealAdminUsers: React.FC = () => {
  const { currentUser, showToast } = useAppStore();
  const { data, error, loading, reload } = useApi<any[]>('/api/admin/users');
  const clinics = useApi<any[]>('/api/admin/clinics');
  const [showForm, setShowForm] = useState(false);
  const empty = { name: '', email: '', password: '', role: 'PRATICIEN', clinicId: '', specialty: '', profession: 'MEDECIN' };
  const [form, setForm] = useState(empty);
  const isSuper = currentUser?.role === 'SUPER_ADMIN';
  const roles = isSuper ? ['PRATICIEN', 'ADMIN', 'SUPER_ADMIN', 'PATIENT'] : ['PRATICIEN', 'ADMIN'];

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.post('/api/admin/users', form);
      showToast({ title: 'Compte créé', message: `${form.name} peut maintenant se connecter.`, type: 'success' });
      setForm(empty);
      setShowForm(false);
      reload();
    } catch (err: any) {
      showToast({ title: 'Création impossible', message: apiErrorMessage(err), type: 'danger' });
    }
  };
  const update = async (id: string, patch: Record<string, string>) => {
    try {
      await apiClient.patch(`/api/admin/users/${id}`, patch);
      reload();
    } catch (err: any) {
      showToast({ title: 'Modification impossible', message: apiErrorMessage(err), type: 'danger' });
    }
  };

  return (
    <div className="space-y-4">
      <PageHeader title="Utilisateurs" subtitle="Comptes ayant accès à l’application" onRefresh={reload}
        action={<button onClick={() => setShowForm(!showForm)} className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5"><Plus className="w-3.5 h-3.5" /> Nouvel utilisateur</button>} />
      {showForm && (
        <Card className="p-5">
          <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <input required placeholder="Nom complet * (ex : Dr. Sarra Ben Ali)" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className={inputCls} />
            <input required type="email" placeholder="E-mail de connexion *" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className={inputCls} />
            <input required type="password" minLength={8} placeholder="Mot de passe provisoire * (8 car. min.)" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} className={inputCls} />
            <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} className={inputCls}>
              {roles.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
            </select>
            {isSuper && (
              <select value={form.clinicId} onChange={e => setForm({ ...form, clinicId: e.target.value })} className={inputCls}>
                <option value="">Cabinet : le mien</option>
                {clinics.data?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            )}
            {form.role === 'PRATICIEN' && (
              <>
                <input placeholder="Spécialité (ex : Cardiologie)" value={form.specialty} onChange={e => setForm({ ...form, specialty: e.target.value })} className={inputCls} />
                <select value={form.profession} onChange={e => setForm({ ...form, profession: e.target.value })} className={inputCls}>
                  <option value="MEDECIN">Médecin</option>
                  <option value="AVOCAT">Avocat</option>
                  <option value="NOTAIRE">Notaire</option>
                  <option value="AUTRE">Autre</option>
                </select>
              </>
            )}
            <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold">Créer le compte</button>
          </form>
        </Card>
      )}
      <StateBox loading={loading} error={error} empty={!data?.length} emptyText="Aucun utilisateur.">
        <Card className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-[#F7F9FC] text-slate-500 text-left">
              <tr>{['Utilisateur', 'Cabinet', 'Rôle', 'Statut', 'Créé le'].map(h => <th key={h} className="p-3 font-semibold">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data?.map(u => {
                const self = u.id === currentUser?.id;
                return (
                  <tr key={u.id}>
                    <td className="p-3 font-bold text-[#14213D]">{u.name}{self && <span className="ml-1 text-[10px] text-blue-600">(vous)</span>}<div className="text-[10px] text-slate-400 font-normal">{u.email}</div></td>
                    <td className="p-3 text-slate-600">{u.clinic || '—'}</td>
                    <td className="p-3">
                      <select disabled={self || (!isSuper && !roles.includes(u.role))} value={u.role} onChange={e => update(u.id, { role: e.target.value })} className="px-2 py-1 border border-[#E5EAF2] rounded-lg bg-white text-xs disabled:opacity-60">
                        {(roles.includes(u.role) ? roles : [u.role, ...roles]).map(r => <option key={r} value={r}>{ROLE_LABELS[r] || r}</option>)}
                      </select>
                    </td>
                    <td className="p-3">
                      <button disabled={self} onClick={() => update(u.id, { status: u.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' })}
                        className={`px-2 py-1 rounded-lg text-[10px] font-bold border disabled:opacity-60 ${u.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                        {u.status === 'ACTIVE' ? 'Actif' : 'Désactivé'}
                      </button>
                    </td>
                    <td className="p-3 text-slate-500">{fmtDate(u.createdAt).slice(0, 10)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      </StateBox>
    </div>
  );
};

/* ───────────────────────── Supervision IA ───────────────────────── */

export const RealAdminAiSupervision: React.FC = () => {
  const { data, error, loading, reload } = useApi<any>('/api/admin/overview');
  const e = data?.emails;
  const pct = (n: number) => (e?.total ? Math.round((n / e.total) * 100) : 0);
  return (
    <div className="space-y-4">
      <PageHeader title="Supervision de l’IA" subtitle="Décisions prises par le moteur de rendez-vous sur les e-mails reçus" onRefresh={reload} />
      <StateBox loading={loading && !data} error={error}>
        {e && (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <Kpi label="E-mails analysés" value={e.total} icon={Mail} />
              <Kpi label="RDV réservés automatiquement" value={e.autoBooked} sub={`${pct(e.autoBooked)} % des e-mails`} icon={CalendarDays} tone="text-emerald-600 bg-emerald-50" />
              <Kpi label="Demandes de précision" value={e.clarifications} sub="Praticien ou créneau à préciser" icon={Bot} tone="text-indigo-600 bg-indigo-50" />
              <Kpi label="En attente de validation humaine" value={e.pendingValidation} icon={ShieldCheck} tone="text-amber-600 bg-amber-50" />
            </div>
            <Card className="p-5 text-xs text-slate-600 space-y-1">
              <p><b>Réponses envoyées :</b> {e.replied}</p>
              <p><b>Urgences vitales détectées :</b> {e.emergencies}</p>
              <p className="text-slate-500">Le mode (automatique ou supervisé) se règle dans Paramètres du cabinet &gt; Autonomie de l’IA.</p>
            </Card>
          </>
        )}
      </StateBox>
    </div>
  );
};

/* ───────────────────────── Monitoring ───────────────────────── */

export const RealAdminMonitoring: React.FC = () => {
  const { data, error, loading, reload } = useApi<any>('/api/admin/overview');
  return (
    <div className="space-y-4">
      <PageHeader title="Monitoring" subtitle="État réel des services de la plateforme" onRefresh={reload} />
      <StateBox loading={loading && !data} error={error}>
        {data && <ServicesCard services={data.services} detailed />}
      </StateBox>
      <Card className="p-5 text-xs text-slate-600">
        Métriques Prometheus détaillées : <code className="font-mono">{SERVER_LABEL}/metrics</code> (tableaux de bord Grafana dans la stack Docker).
      </Card>
    </div>
  );
};

/* ───────────────────────── Sécurité (journal d'audit) ───────────────────────── */

export const RealAdminSecurity: React.FC = () => {
  const { data, error, loading, reload } = useApi<any[]>('/api/admin/audit-logs?limit=200');
  return (
    <div className="space-y-4">
      <PageHeader title="Sécurité & journal d’audit" subtitle="Actions sensibles enregistrées (connexions OAuth, validations, créations de comptes, RDV…)" onRefresh={reload} />
      <StateBox loading={loading} error={error} empty={!data?.length} emptyText="Aucune action enregistrée.">
        <Card className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-[#F7F9FC] text-slate-500 text-left">
              <tr>{['Date', 'Action', 'Ressource', 'Par', 'Détails'].map(h => <th key={h} className="p-3 font-semibold">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data?.map(l => (
                <tr key={l.id}>
                  <td className="p-3 whitespace-nowrap text-slate-500">{fmtDate(l.createdAt)}</td>
                  <td className="p-3 font-mono text-[11px] text-[#14213D]">{l.action}</td>
                  <td className="p-3">{l.resource}</td>
                  <td className="p-3">{l.user}</td>
                  <td className="p-3 text-[10px] text-slate-500 max-w-md truncate" title={JSON.stringify(l.details)}>{Object.entries(l.details || {}).map(([k, v]) => `${k}: ${typeof v === 'object' ? JSON.stringify(v) : v}`).join(' • ')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </StateBox>
    </div>
  );
};

/* ───────────────────────── Automatisations ───────────────────────── */

const WORKFLOWS = [
  ['1. Ingestion e-mail → IA → réservation', 'Webhook ingest-email', 'E-mails venant d’autres sources (formulaire, autre boîte).'],
  ['2. Rappels e-mail 24h', 'Tous les jours à 08h00', 'Envoie un rappel la veille de chaque rendez-vous.'],
  ['3. RDV réservé → Google Calendar', 'Événement backend', 'Crée l’événement dans l’agenda Google du praticien.'],
  ['4. Escalade d’urgence vitale', 'Événement backend', 'Alerte le praticien d’astreinte.'],
  ['5. Journal des e-mails traités', 'Événement backend', 'Une exécution par décision du moteur (visible dans n8n).'],
];

export const RealAdminAutomations: React.FC = () => {
  const { data, reload } = useApi<any>('/api/admin/overview');
  return (
    <div className="space-y-4">
      <PageHeader title="Automatisations n8n" subtitle="Workflows importés et activés par n8n/import-workflows.js" onRefresh={reload}
        action={<a href={N8N_UI_URL} target="_blank" rel="noreferrer" className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5">Ouvrir n8n <ExternalLink className="w-3.5 h-3.5" /></a>} />
      <Card className="p-4 flex items-center justify-between text-xs">
        <span>Moteur n8n ({N8N_UI_URL})</span>
        {data ? <Badge ok={data.services.n8n.up} okText="Joignable" koText="Injoignable" /> : <span className="text-slate-400">…</span>}
      </Card>
      <Card className="divide-y divide-slate-100">
        {WORKFLOWS.map(([name, trigger, desc]) => (
          <div key={name} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <div>
              <div className="font-bold text-[#14213D]">{name}</div>
              <div className="text-slate-500">{desc}</div>
            </div>
            <span className="px-2 py-1 rounded-lg bg-slate-100 text-slate-600 text-[10px] font-semibold whitespace-nowrap">{trigger}</span>
          </div>
        ))}
      </Card>
    </div>
  );
};

/* ───────────────────────── Facturation (non activée) ───────────────────────── */

export const RealAdminBilling: React.FC<{ kind: 'subscriptions' | 'payments' }> = ({ kind }) => (
  <div className="space-y-4">
    <PageHeader title={kind === 'subscriptions' ? 'Abonnements' : 'Paiements'} subtitle="Gestion de la facturation des cabinets" />
    <Card className="p-8 text-center space-y-3">
      <CreditCard className="w-10 h-10 text-slate-300 mx-auto" />
      <h2 className="text-sm font-black text-[#14213D]">Module de facturation non activé</h2>
      <p className="text-xs text-slate-500 max-w-md mx-auto">
        Aucun prestataire de paiement n’est configuré : aucun abonnement ni paiement n’est enregistré.
        Les tarifs affichés sur la page d’accueil sont indicatifs.
      </p>
    </Card>
  </div>
);

/* ───────────────────────── Paramètres plateforme ───────────────────────── */

export const RealAdminSettings: React.FC = () => {
  const google = useApi<any>('/api/integrations/google/status');
  const mode = useApi<any>('/api/integrations/ai-settings');
  return (
    <div className="space-y-4">
      <PageHeader title="Paramètres de la plateforme" subtitle="Configuration effective (les secrets ne sont jamais affichés)" onRefresh={() => { google.reload(); mode.reload(); }} />
      <Card className="divide-y divide-slate-100 text-xs">
        {[
          ['Serveur API', SERVER_LABEL, true],
          ['Client OAuth Google configuré', google.data?.configured ? 'Oui' : 'Non (GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET)', Boolean(google.data?.configured)],
          ['Boîte Gmail centrale', google.data?.connected ? google.data.email : 'Non connectée', Boolean(google.data?.connected)],
          ['Envoi d’e-mails autorisé', google.data?.canSendEmails ? 'Oui (scope gmail.send)' : 'Non', Boolean(google.data?.canSendEmails)],
          ['Mode de réponse', mode.data?.autoReplyMode === 'hitl' ? 'Supervisé (validation humaine)' : 'Automatique', true],
          ['Interface n8n', N8N_UI_URL, true],
        ].map(([label, value, ok]) => (
          <div key={String(label)} className="p-4 flex items-center justify-between gap-3">
            <span className="text-slate-600">{label}</span>
            <span className={`font-semibold text-right ${ok ? 'text-[#14213D]' : 'text-amber-700'}`}>{String(value)}</span>
          </div>
        ))}
      </Card>
      <Card className="p-4 text-[11px] text-slate-500">
        Les clés d’API (JWT_SECRET, INTERNAL_API_KEY, GOOGLE_CLIENT_SECRET, ENCRYPTION_MASTER_KEY) se définissent dans les variables d’environnement du serveur (voir backend/.env.example).
      </Card>
    </div>
  );
};
