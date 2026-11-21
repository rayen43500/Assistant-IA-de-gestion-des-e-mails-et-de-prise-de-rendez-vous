import React from 'react';
import { 
  LayoutDashboard, 
  Building2, 
  Stethoscope, 
  Users, 
  CreditCard, 
  Receipt, 
  Bot, 
  Workflow, 
  Activity, 
  ShieldCheck, 
  Settings,
  Sparkles,
  LogOut,
  ChevronRight,
  X
} from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore';

export type SuperAdminTabId = 
  | 'dashboard'
  | 'cabinets'
  | 'doctors'
  | 'users'
  | 'subscriptions'
  | 'payments'
  | 'ai-supervision'
  | 'automations'
  | 'monitoring'
  | 'security'
  | 'settings';

interface SuperAdminSidebarProps {
  currentTab: SuperAdminTabId;
  onSelectTab: (tab: SuperAdminTabId) => void;
  onExitSuperAdmin?: () => void;
  onLogout?: () => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const SuperAdminSidebar: React.FC<SuperAdminSidebarProps> = ({
  currentTab,
  onSelectTab,
  onExitSuperAdmin,
  onLogout,
  isMobileOpen = false,
  onCloseMobile
}) => {
  const { currentUser, logout } = useAppStore();

  const navItems: { id: SuperAdminTabId; label: string; icon: React.ElementType; badge?: string }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'cabinets', label: 'Cabinets', icon: Building2, badge: '4' },
    { id: 'doctors', label: 'Médecins & Avocats', icon: Stethoscope },
    { id: 'users', label: 'Utilisateurs', icon: Users, badge: '17' },
    { id: 'subscriptions', label: 'Abonnements', icon: CreditCard },
    { id: 'payments', label: 'Paiements', icon: Receipt },
    { id: 'ai-supervision', label: 'Supervision IA', icon: Bot, badge: '94.2%' },
    { id: 'automations', label: 'Automatisations', icon: Workflow, badge: '4 n8n' },
    { id: 'monitoring', label: 'Monitoring', icon: Activity, badge: 'UP' },
    { id: 'security', label: 'Sécurité', icon: ShieldCheck },
    { id: 'settings', label: 'Paramètres', icon: Settings }
  ];

  const handleSelect = (tab: SuperAdminTabId) => {
    onSelectTab(tab);
    if (onCloseMobile) onCloseMobile();
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isMobileOpen && (
        <div 
          onClick={onCloseMobile}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 lg:hidden transition-opacity"
        />
      )}

      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-[#E8EDF4] flex flex-col justify-between shrink-0 font-sans transition-transform duration-300 lg:relative lg:translate-x-0 ${
        isMobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
      }`}>
        <div className="flex flex-col h-full overflow-hidden">
          {/* Brand header */}
          <div className="h-18 px-5 border-b border-[#E8EDF4] flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#2563EB] flex items-center justify-center text-white shadow-xs font-black">
                M
              </div>
              <div>
                <div className="text-sm font-black text-[#14213D] tracking-tight flex items-center gap-1.5">
                  <span>MediLaw<span className="text-[#2563EB]">AI</span></span>
                  <span className="text-[9px] font-black uppercase tracking-wider bg-blue-50 text-[#2563EB] border border-blue-200/60 px-1.5 py-0.2 rounded-md">
                    Admin
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 font-medium">Enterprise Control Plane</span>
              </div>
            </div>

            {/* Mobile close */}
            <button
              onClick={onCloseMobile}
              className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation items list */}
          <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
            <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Navigation Système
            </div>

            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleSelect(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all group ${
                    isActive
                      ? 'bg-[#2563EB] text-white shadow-xs'
                      : 'text-slate-600 hover:bg-[#F7F9FC] hover:text-[#14213D]'
                  }`}
                >
                  <div className="flex items-center gap-3 truncate">
                    <Icon className={`w-4 h-4 shrink-0 transition-colors ${
                      isActive ? 'text-white' : 'text-slate-400 group-hover:text-[#2563EB]'
                    }`} />
                    <span className="truncate">{item.label}</span>
                  </div>

                  {item.badge && (
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                      isActive 
                        ? 'bg-white/20 text-white' 
                        : item.badge === 'UP' 
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                        : 'bg-slate-100 text-slate-600'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Super Admin profile footer */}
          <div className="p-3 border-t border-[#E8EDF4] bg-[#F7F9FC] shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5 overflow-hidden">
                <div className="w-8 h-8 rounded-xl bg-[#14213D] text-white flex items-center justify-center font-bold text-xs shrink-0">
                  {currentUser.name.charAt(0)}
                </div>
                <div className="overflow-hidden">
                  <div className="text-xs font-bold text-[#14213D] truncate">{currentUser.name}</div>
                  <div className="text-[10px] text-slate-400 truncate">Super Admin • SaaS</div>
                </div>
              </div>

              <button
                onClick={onLogout || logout}
                title="Se déconnecter"
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
