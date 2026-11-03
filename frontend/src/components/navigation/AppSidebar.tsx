import React from 'react';
import { 
  LayoutDashboard, 
  Inbox, 
  Calendar, 
  Users, 
  Bot, 
  BookOpen, 
  Workflow, 
  BarChart3, 
  Settings, 
  ShieldAlert, 
  LogOut,
  Stethoscope,
  Scale,
  ChevronRight,
  Globe
} from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore';

interface AppSidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onBackToLanding: () => void;
}

export const AppSidebar: React.FC<AppSidebarProps> = ({ currentTab, onSelectTab, onBackToLanding }) => {
  const { sector, setSector, organizationName, emails, currentUser } = useAppStore();

  const pendingEmailsCount = emails.filter(e => e.status === 'PENDING_VALIDATION').length;
  const emergencyCount = emails.filter(e => e.intent === 'EMERGENCY' && e.status !== 'VALIDATED_AND_SENT').length;

  const navItems = [
    { id: 'dashboard', label: 'Vue d’ensemble', icon: LayoutDashboard },
    { 
      id: 'emails', 
      label: 'Boîte E-mails IA', 
      icon: Inbox, 
      badge: pendingEmailsCount > 0 ? pendingEmailsCount : undefined,
      urgentBadge: emergencyCount > 0 ? emergencyCount : undefined 
    },
    { id: 'appointments', label: 'Rendez-vous & Agenda', icon: Calendar },
    { id: 'contacts', label: sector === 'MEDICAL' ? 'Patients du Cabinet' : 'Clients & Dossiers', icon: Users },
    { id: 'ai-assistant', label: 'Assistant IA & Copilot', icon: Bot, isAi: true },
    { id: 'knowledge', label: 'Base RAG Certifiée', icon: BookOpen },
    { id: 'automations', label: 'Workflows n8n', icon: Workflow },
    { id: 'analytics', label: 'Analytiques & Rapports', icon: BarChart3 },
    { id: 'settings', label: 'Paramètres & Autonomie', icon: Settings },
    { id: 'super-admin', label: 'Super Admin SaaS', icon: ShieldAlert, isAdmin: true }
  ];

  return (
    <aside className="w-68 bg-[#14213D] text-slate-300 flex flex-col justify-between shrink-0 border-r border-slate-800 selection:bg-blue-600">
      <div className="flex flex-col">
        {/* App Logo & Organization selector */}
        <div className="p-4 border-b border-slate-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-base shadow-sm">
                M
              </div>
              <span className="font-black text-white text-base tracking-tight">MediLaw<span className="text-blue-400">AI</span></span>
            </div>
            <button 
              onClick={onBackToLanding}
              title="Retour au site public"
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
            >
              <Globe className="w-4 h-4" />
            </button>
          </div>

          {/* Business Sector Switcher (Medical <-> Legal) */}
          <div className="mt-3.5 p-1 bg-slate-900/90 rounded-xl border border-slate-700/60 flex items-center gap-1">
            <button
              onClick={() => setSector('MEDICAL')}
              className={`flex-1 py-1.5 px-2 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all ${
                sector === 'MEDICAL' 
                  ? 'bg-blue-600 text-white shadow-xs' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Stethoscope className="w-3.5 h-3.5" />
              <span>Médical</span>
            </button>
            <button
              onClick={() => setSector('LEGAL')}
              className={`flex-1 py-1.5 px-2 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all ${
                sector === 'LEGAL' 
                  ? 'bg-indigo-600 text-white shadow-xs' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Scale className="w-3.5 h-3.5" />
              <span>Juridique</span>
            </button>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="p-3 space-y-1">
          <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Navigation Pro
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : item.isAi ? 'text-purple-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>

                <div className="flex items-center gap-1">
                  {item.urgentBadge && (
                    <span className="bg-rose-500 text-white text-[10px] font-black px-1.5 py-0.2 rounded-full animate-bounce">
                      {item.urgentBadge}
                    </span>
                  )}
                  {item.badge && !item.urgentBadge && (
                    <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                      isActive ? 'bg-white/20 text-white' : 'bg-blue-500/20 text-blue-400'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </nav>
      </div>

      {/* User profile footer */}
      <div className="p-3.5 border-t border-slate-800 bg-slate-900/60">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-full bg-blue-500/20 border border-blue-400/40 flex items-center justify-center text-blue-300 font-bold text-xs shrink-0">
              {currentUser.name.charAt(0)}
            </div>
            <div className="overflow-hidden">
              <div className="text-xs font-bold text-white truncate">{currentUser.name}</div>
              <div className="text-[10px] text-slate-400 truncate">{currentUser.organizationName}</div>
            </div>
          </div>
          <button 
            onClick={onBackToLanding} 
            title="Déconnexion" 
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
