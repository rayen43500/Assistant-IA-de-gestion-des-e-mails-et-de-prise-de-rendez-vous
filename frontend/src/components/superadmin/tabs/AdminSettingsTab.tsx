import React, { useState } from 'react';
import { 
  Settings, 
  Key, 
  Save, 
  ShieldCheck, 
  AlertTriangle, 
  Globe, 
  Mail, 
  Server, 
  Database,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';
import { useAppStore } from '../../../stores/useAppStore';

export const AdminSettingsTab: React.FC = () => {
  const { showToast } = useAppStore();

  const [platformName, setPlatformName] = useState('MediLawAI SaaS Platform');
  const [supportEmail, setSupportEmail] = useState('support@medilaw.ai');
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [sessionTimeoutHours, setSessionTimeoutHours] = useState('168');
  const [backupSchedule, setBackupSchedule] = useState('0 3 * * *');

  const [apiKeyRender, setApiKeyRender] = useState('rnd_9k8xY1a2b3c4d5e6f7g8h9i0');
  const [apiKeyTwilio, setApiKeyTwilio] = useState('AC_7894561230abcdef1234567890');
  const [apiKeyGoogle, setApiKeyGoogle] = useState('9876543210-abcdef.apps.googleusercontent.com');

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    showToast({
      title: 'Paramètres Généraux Enregistrés !',
      message: 'Les variables d’environnement globales et clés API ont été mises à jour.',
      type: 'success'
    });
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-[#14213D] tracking-tight">Paramètres Généraux de la Plateforme</h1>
          <p className="text-xs text-slate-500">
            Configuration globale du cluster, gestion des clés d'API tierces et gouvernance du système
          </p>
        </div>

        <button
          onClick={handleSaveSettings}
          className="px-4 py-2.5 bg-[#2563EB] hover:bg-blue-700 active:scale-[0.98] text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-2 transition-all w-fit"
        >
          <Save className="w-4 h-4" />
          <span>Enregistrer les Modifications</span>
        </button>
      </div>

      <form onSubmit={handleSaveSettings} className="space-y-6">
        {/* General Information Card */}
        <div className="bg-white rounded-2xl border border-[#E8EDF4] shadow-xs p-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-[#E8EDF4] pb-3">
            <Globe className="w-4 h-4 text-[#2563EB]" />
            <h2 className="text-sm font-bold text-[#14213D]">Identité SaaS & Maintenance</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Nom Public de la Plateforme</label>
              <input
                type="text"
                value={platformName}
                onChange={e => setPlatformName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#F7F9FC] border border-[#E8EDF4] rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">E-mail de Support Super Administrateur</label>
              <input
                type="email"
                value={supportEmail}
                onChange={e => setSupportEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#F7F9FC] border border-[#E8EDF4] rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]"
              />
            </div>
          </div>

          {/* Maintenance Toggle */}
          <div className="p-4 bg-[#F7F9FC] rounded-xl border border-[#E8EDF4] flex items-center justify-between">
            <div>
              <div className="font-bold text-xs text-[#14213D]">Mode Maintenance Global</div>
              <p className="text-[11px] text-slate-500">
                Affiche une page de maintenance aux utilisateurs des cabinets tout en conservant l'accès Super Admin.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={maintenanceMode}
                onChange={e => setMaintenanceMode(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#2563EB]"></div>
            </label>
          </div>
        </div>

        {/* API Keys & Gateways Card */}
        <div className="bg-white rounded-2xl border border-[#E8EDF4] shadow-xs p-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-[#E8EDF4] pb-3">
            <Key className="w-4 h-4 text-purple-600" />
            <h2 className="text-sm font-bold text-[#14213D]">Clés API & Passerelles Distantes (Production)</h2>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Render Cloud API Key (Déploiements stage-cqe9)
              </label>
              <input
                type="password"
                value={apiKeyRender}
                onChange={e => setApiKeyRender(e.target.value)}
                className="w-full font-mono px-3.5 py-2.5 bg-[#F7F9FC] border border-[#E8EDF4] rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Google Calendar OAuth 2.0 Client ID (Workspace Sync)
              </label>
              <input
                type="text"
                value={apiKeyGoogle}
                onChange={e => setApiKeyGoogle(e.target.value)}
                className="w-full font-mono px-3.5 py-2.5 bg-[#F7F9FC] border border-[#E8EDF4] rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Twilio / WhatsApp Business API Auth Token (Rappels 24h)
              </label>
              <input
                type="password"
                value={apiKeyTwilio}
                onChange={e => setApiKeyTwilio(e.target.value)}
                className="w-full font-mono px-3.5 py-2.5 bg-[#F7F9FC] border border-[#E8EDF4] rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]"
              />
            </div>
          </div>
        </div>

        {/* Database & Backups Card */}
        <div className="bg-white rounded-2xl border border-[#E8EDF4] shadow-xs p-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-[#E8EDF4] pb-3">
            <Database className="w-4 h-4 text-emerald-600" />
            <h2 className="text-sm font-bold text-[#14213D]">Sauvegardes Automatiques & Conformité CDC</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Fréquence Cron de Snapshot MongoDB</label>
              <input
                type="text"
                value={backupSchedule}
                onChange={e => setBackupSchedule(e.target.value)}
                className="w-full font-mono px-3.5 py-2.5 bg-[#F7F9FC] border border-[#E8EDF4] rounded-xl text-xs focus:outline-none focus:border-[#2563EB]"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">Actuel : Tous les jours à 03h00 (Tunis)</span>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Durée de Validité Session JWT (Heures)</label>
              <input
                type="number"
                value={sessionTimeoutHours}
                onChange={e => setSessionTimeoutHours(e.target.value)}
                className="w-full font-mono px-3.5 py-2.5 bg-[#F7F9FC] border border-[#E8EDF4] rounded-xl text-xs focus:outline-none focus:border-[#2563EB]"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">7 jours (168h) avec renouvellement glissant</span>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
