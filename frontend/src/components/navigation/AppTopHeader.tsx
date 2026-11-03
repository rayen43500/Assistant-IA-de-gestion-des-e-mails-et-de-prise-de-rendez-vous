import React, { useState } from 'react';
import { 
  Search, 
  Bell, 
  Plus, 
  Globe, 
  HelpCircle, 
  User, 
  ShieldCheck, 
  Sparkles,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore';

interface AppTopHeaderProps {
  onOpenQuickAppointment: () => void;
}

export const AppTopHeader: React.FC<AppTopHeaderProps> = ({ onOpenQuickAppointment }) => {
  const { sector, organizationName, language, setLanguage, emails, showToast } = useAppStore();
  const [showNotifications, setShowNotifications] = useState(false);

  const pendingEmails = emails.filter(e => e.status === 'PENDING_VALIDATION');
  const emergencyEmails = emails.filter(e => e.intent === 'EMERGENCY' && e.status !== 'VALIDATED_AND_SENT');

  return (
    <header className="h-16 bg-white border-b border-[#E5EAF2] px-6 flex items-center justify-between shrink-0 shadow-xs z-30">
      {/* Global Search */}
      <div className="flex items-center gap-3 flex-1 max-w-md">
        <div className="relative w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={sector === 'MEDICAL' ? "Rechercher patient, dossier, rendez-vous ou e-mail..." : "Rechercher client, affaire, consultation..."}
            className="w-full pl-10 pr-4 py-2 bg-[#F7F9FC] border border-[#E5EAF2] rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />
        </div>
      </div>

      {/* Quick Action & Controls */}
      <div className="flex items-center gap-3">
        {/* Quick Create Appointment CTA */}
        <button
          onClick={onOpenQuickAppointment}
          className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm flex items-center gap-1.5 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Nouveau Rendez-vous</span>
        </button>

        {/* Language selector FR / EN / AR */}
        <div className="relative flex items-center bg-[#F7F9FC] border border-[#E5EAF2] rounded-xl p-1 text-xs font-bold text-slate-600">
          <button
            onClick={() => setLanguage('fr')}
            className={`px-2 py-1 rounded-lg transition-all ${language === 'fr' ? 'bg-white shadow-xs text-blue-600' : 'hover:text-slate-900'}`}
          >
            FR
          </button>
          <button
            onClick={() => setLanguage('en')}
            className={`px-2 py-1 rounded-lg transition-all ${language === 'en' ? 'bg-white shadow-xs text-blue-600' : 'hover:text-slate-900'}`}
          >
            EN
          </button>
          <button
            onClick={() => setLanguage('ar')}
            className={`px-2 py-1 rounded-lg transition-all ${language === 'ar' ? 'bg-white shadow-xs text-blue-600' : 'hover:text-slate-900'}`}
          >
            عربي
          </button>
        </div>

        {/* Notifications Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 rounded-xl bg-[#F7F9FC] border border-[#E5EAF2] text-slate-600 hover:text-blue-600 hover:bg-slate-100 transition-all relative"
          >
            <Bell className="w-4 h-4" />
            {emergencyEmails.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-600 text-white text-[9px] font-black rounded-full flex items-center justify-center animate-pulse">
                {emergencyEmails.length}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-[#E5EAF2] p-4 space-y-3 z-50">
              <div className="flex items-center justify-between border-b pb-2">
                <span className="text-xs font-bold text-slate-900">Notifications & Alertes</span>
                <span className="text-[10px] text-blue-600 font-semibold">{pendingEmails.length} en attente</span>
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto">
                {emergencyEmails.map(em => (
                  <div key={em.id} className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-xs space-y-1">
                    <div className="flex items-center gap-1.5 font-bold text-rose-800">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                      <span>{em.sender.name}</span>
                    </div>
                    <p className="text-[11px] text-rose-700 truncate">{em.subject}</p>
                  </div>
                ))}

                {pendingEmails.filter(e => e.intent !== 'EMERGENCY').slice(0, 3).map(em => (
                  <div key={em.id} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                    <div className="font-bold text-slate-800 truncate">{em.sender.name}</div>
                    <p className="text-[11px] text-slate-600 truncate">{em.subject}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
