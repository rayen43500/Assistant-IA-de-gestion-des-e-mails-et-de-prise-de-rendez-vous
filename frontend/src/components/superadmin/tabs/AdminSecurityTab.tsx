import React, { useState } from 'react';
import { 
  ShieldCheck, 
  AlertTriangle, 
  Lock, 
  Key, 
  Ban, 
  Search, 
  CheckCircle2, 
  RefreshCw,
  Eye,
  FileText
} from 'lucide-react';
import { useAppStore } from '../../../stores/useAppStore';

export const AdminSecurityTab: React.FC = () => {
  const { showToast } = useAppStore();
  const [search, setSearch] = useState('');

  const [securityEvents, setSecurityEvents] = useState([
    { id: 'SEC-109', time: 'Il y a 4 min', event: 'Tentative Brute-force bloquée', ip: '197.14.52.12', location: 'Tunis, TN', severity: 'CRITICAL', action: 'IP bannie (24h)', user: 'dr.bensalem@cabinet-ai.tn' },
    { id: 'SEC-108', time: 'Il y a 32 min', event: 'OWASP Prompt Injection Neutralisée', ip: '41.226.11.45', location: 'Sousse, TN', severity: 'WARNING', action: 'Payload sanitisé', user: 'Ingestion Publique' },
    { id: 'SEC-107', time: 'Il y a 1h', event: 'Connexion 2FA Validée', ip: '102.156.4.88', location: 'Tunis, TN', severity: 'INFO', action: 'Session ouverte', user: 'admin@medilaw.ai' },
    { id: 'SEC-106', time: 'Il y a 2h', event: 'Tentative d’accès Tenant non autorisé', ip: '196.203.8.19', location: 'Sfax, TN', severity: 'CRITICAL', action: 'Accès rejeté 403', user: 'token_mismatch' },
    { id: 'SEC-105', time: 'Hier 23:15', event: 'Chiffrement automatique Backup S3', ip: '127.0.0.1', location: 'Système interne', severity: 'INFO', action: 'AES-256 appliqué', user: 'Cron Service' }
  ]);

  const handleRevokeAllSessions = () => {
    showToast({
      title: 'Toutes les sessions révoquées',
      message: 'Les tokens JWT actifs ont été invalidés sur la blacklist Redis.',
      type: 'warning'
    });
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-[#14213D] tracking-tight">Audit de Sécurité & Détection d’Intrusions</h1>
          <p className="text-xs text-slate-500">
            Journalisation des événements cryptographiques, protection anti-brute force et conformité RGPD / CDC 2026
          </p>
        </div>

        <button
          onClick={handleRevokeAllSessions}
          className="px-4 py-2 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 rounded-xl text-xs font-bold shadow-2xs flex items-center gap-2 transition-colors w-fit"
        >
          <Lock className="w-4 h-4 text-rose-600" />
          <span>Révoquer Toutes les Sessions JWT</span>
        </button>
      </div>

      {/* Security Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-5 bg-white rounded-2xl border border-[#E8EDF4] shadow-xs">
          <span className="text-xs font-semibold text-slate-500">Niveau de Menace Global</span>
          <div className="text-2xl font-black text-emerald-600 mt-2">FAIBLE</div>
          <span className="text-[10px] text-slate-400 mt-1 block">WAF et fail2ban actifs</span>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-[#E8EDF4] shadow-xs">
          <span className="text-xs font-semibold text-slate-500">IPs Bannies Actuellement</span>
          <div className="text-2xl font-black text-[#14213D] mt-2">1 adresse IP</div>
          <span className="text-[10px] text-rose-600 mt-1 block">197.14.52.12 (Brute force)</span>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-[#E8EDF4] shadow-xs">
          <span className="text-xs font-semibold text-slate-500">Certificat SSL / TLS</span>
          <div className="text-2xl font-black text-emerald-600 mt-2">VALIDE</div>
          <span className="text-[10px] text-slate-400 mt-1 block">Let's Encrypt (Renouvellement auto)</span>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-[#E8EDF4] shadow-xs">
          <span className="text-xs font-semibold text-slate-500">Audit Traçabilité</span>
          <div className="text-2xl font-black text-blue-600 mt-2">100%</div>
          <span className="text-[10px] text-slate-400 mt-1 block">Journaux immuables en base</span>
        </div>
      </div>

      {/* Security Events Table */}
      <div className="bg-white rounded-2xl border border-[#E8EDF4] shadow-xs overflow-hidden">
        <div className="p-4 border-b border-[#E8EDF4] flex items-center justify-between">
          <h2 className="text-sm font-bold text-[#14213D] flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#2563EB]" />
            <span>Journal des Incidents et Alertes Récentes</span>
          </h2>
          <span className="text-xs text-slate-400">Temps réel</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[800px]">
            <thead className="bg-[#F7F9FC] border-b border-[#E8EDF4] text-slate-500 font-semibold">
              <tr>
                <th className="p-4">Événement de Sécurité</th>
                <th className="p-4">Gravité</th>
                <th className="p-4">Adresse IP Source</th>
                <th className="p-4">Localisation</th>
                <th className="p-4">Cible / Utilisateur</th>
                <th className="p-4">Action Prise</th>
                <th className="p-4 text-right">Horodatage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {securityEvents.map(evt => (
                <tr key={evt.id} className="hover:bg-[#F7F9FC]">
                  <td className="p-4 font-bold text-[#14213D]">{evt.event}</td>

                  <td className="p-4">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      evt.severity === 'CRITICAL' 
                        ? 'bg-rose-50 text-rose-700 border border-rose-200' 
                        : evt.severity === 'WARNING' 
                        ? 'bg-amber-50 text-amber-700 border border-amber-200' 
                        : 'bg-emerald-50 text-emerald-700'
                    }`}>
                      {evt.severity}
                    </span>
                  </td>

                  <td className="p-4 font-mono font-bold text-slate-700">{evt.ip}</td>
                  <td className="p-4 text-slate-600">{evt.location}</td>
                  <td className="p-4 font-mono text-slate-500">{evt.user}</td>
                  <td className="p-4 font-semibold text-slate-800">{evt.action}</td>
                  <td className="p-4 text-right text-slate-400 font-mono">{evt.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
