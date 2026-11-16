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
  Globe,
  X,
  Clock,
  Bell,
  FileText
} from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore';

interface AppSidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onBackToLanding: () => void;
  onLogout?: () => void;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
  isSuperAdmin?: boolean;
  onReturnToSuperAdmin?: () => void;
}

export const AppSidebar: React.FC<AppSidebarProps> = ({ 
  currentTab, 
  onSelectTab, 
  onBackToLanding,
  onLogout,
  isOpenMobile = false,
  onCloseMobile,
  isSuperAdmin = false,
  onReturnToSuperAdmin
}) => {
  const { sector, setSector, organizationName, emails, currentUser } = useAppStore();

  const pendingEmailsCount = emails.filter(e => e.status === 'PENDING_VALIDATION').length;
  const emergencyCount = emails.filter(e => e.intent === 'EMERGENCY' && e.status !== 'VALIDATED_AND_SENT').length;

  const isSuperAdminRole = isSuperAdmin || currentUser?.role === 'SUPER_ADMIN';

  // Navigation items for the Practitioner / Cabinet Workspace (10 core tabs)
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'appointments', label: 'Rendez-vous', icon: Calendar },
    { id: 'availabilities', label: 'Disponibilités', icon: Clock },
    { id: 'contacts', label: sector === 'MEDICAL' ? 'Patients' : 'Clients', icon: Users },
    { 
      id: 'emails', 
      label: 'E-mails', 
      icon: Inbox, 
      badge: pendingEmailsCount > 0 ? pendingEmailsCount : undefined,
      urgentBadge: emergencyCount > 0 ? emergencyCount : undefined 
    },
    { id: 'ai-assistant', label: 'Assistant IA', icon: Bot, isAi: true },
    { id: 'documents', label: 'Documents', icon: FileText },
    { id: 'notifications', label: 'Notifications', icon: Bell, urgentBadge: emergencyCount > 0 ? emergencyCount : undefined },
    { id: 'analytics', label: 'Statistiques', icon: BarChart3 },
    { id: 'settings', label: 'Paramètres', icon: Settings },
    ...(isSuperAdminRole ? [{ id: 'super-admin', label: 'Super Admin', icon: ShieldAlert, isAdmin: true }] : [])
  ];

  const handleItemClick = (id: string) => {
    onSelectTab(id);
    if (onCloseMobile) onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpenMobile && (
        <div 
          onClick={onCloseMobile}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-40 md:hidden transition-opacity"
        />
      )}

      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-[#E8EDF4] flex flex-col justify-between shrink-0 font-sans transition-transform duration-300 md:relative md:translate-x-0 ${
        isOpenMobile ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
      }`}>
        <div className="flex flex-col h-full overflow-hidden">
          {/* App Logo & Organization selector */}
          <div className="h-18 px-5 border-b border-[#E8EDF4] flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#2563EB] flex items-center justify-center text-white shadow-xs font-black">
                M
              </div>
              <div>
                <div className="text-sm font-black text-[#14213D] tracking-tight flex items-center gap-1.5">
                  <span>MediLaw<span className="text-[#2563EB]">AI</span></span>
                  <span className="text-[9px] font-black uppercase tracking-wider bg-blue-50 text-[#2563EB] border border-blue-200/60 px-1.5 py-0.2 rounded-md">
                    Pro
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 font-medium">Cabinet Workspace</span>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button 
                onClick={onBackToLanding}
                title="Retour au site public"
                className="p-1.5 rounded-lg hover:bg-[#F7F9FC] text-slate-400 hover:text-[#14213D] transition-colors"
              >
                <Globe className="w-4 h-4" />
              </button>

              {/* Close Button on Mobile */}
              <button
                onClick={onCloseMobile}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 md:hidden transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Business Sector Switcher (Medical <-> Legal) */}
          <div className="p-3 border-b border-[#E8EDF4] shrink-0">
            <div className="p-1 bg-[#F7F9FC] rounded-xl border border-[#E8EDF4] flex items-center gap-1">
              <button
                onClick={() => setSector('MEDICAL')}
                className={`flex-1 py-1.5 px-2 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all ${
                  sector === 'MEDICAL' 
                    ? 'bg-white text-[#2563EB] shadow-xs border border-blue-100' 
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Stethoscope className="w-3.5 h-3.5" />
                <span>Médical</span>
              </button>
              <button
                onClick={() => setSector('LEGAL')}
                className={`flex-1 py-1.5 px-2 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all ${
                  sector === 'LEGAL' 
                    ? 'bg-white text-indigo-600 shadow-xs border border-indigo-100' 
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Scale className="w-3.5 h-3.5" />
                <span>Juridique</span>
              </button>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
            <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Navigation Praticien
            </div>

            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleItemClick(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all group ${
                    isActive
                      ? 'bg-[#2563EB] text-white shadow-xs'
                      : 'text-slate-600 hover:bg-[#F7F9FC] hover:text-[#14213D]'
                  }`}
                >
                  <div className="flex items-center gap-3 truncate">
                    <Icon className={`w-4 h-4 shrink-0 transition-colors ${
                      isActive ? 'text-white' : item.isAi ? 'text-purple-600' : 'text-slate-400 group-hover:text-[#2563EB]'
                    }`} />
                    <span className="truncate">{item.label}</span>
                  </div>

                  <div className="flex items-center gap-1">
                    {item.urgentBadge && (
                      <span className="bg-rose-500 text-white text-[10px] font-black px-1.5 py-0.2 rounded-full animate-bounce">
                        {item.urgentBadge}
                      </span>
                    )}
                    {item.badge && !item.urgentBadge && (
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        isActive ? 'bg-white/20 text-white' : 'bg-blue-50 text-[#2563EB] border border-blue-200/60'
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Return to Super Admin Console if switched */}
          {onReturnToSuperAdmin && (
            <div className="px-3 py-2 border-t border-[#E8EDF4]">
              <button
                onClick={onReturnToSuperAdmin}
                className="w-full flex items-center justify-between p-2.5 rounded-xl bg-blue-50/70 border border-blue-200/60 hover:bg-blue-100/60 text-xs font-bold text-[#2563EB] transition-colors"
              >
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#2563EB]" />
                  <span>Console Super Admin</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* User profile footer */}
          <div className="p-3 border-t border-[#E8EDF4] bg-[#F7F9FC] shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5 overflow-hidden">
                <div className="w-8 h-8 rounded-xl bg-[#14213D] text-white flex items-center justify-center font-bold text-xs shrink-0">
                  {currentUser.name.charAt(0)}
                </div>
                <div className="overflow-hidden">
                  <div className="text-xs font-bold text-[#14213D] truncate">{currentUser.name}</div>
                  <div className="text-[10px] text-slate-400 truncate flex items-center gap-1 mt-0.5">
                    <span className="text-[#2563EB] font-bold">
                      {sector === 'MEDICAL' ? 'Médecin' : 'Avocat'}
                    </span>
                    <span>•</span>
                    <span className="truncate">{currentUser.organizationName}</span>
                  </div>
                </div>
              </div>
              <button 
                onClick={onLogout || onBackToLanding} 
                title="Déconnexion" 
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
