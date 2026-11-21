import React, { useState } from 'react';
import { 
  Search, 
  Bell, 
  Plus, 
  Menu, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  LogOut, 
  User, 
  Settings, 
  Sparkles,
  Server
} from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore';

interface SuperAdminTopNavProps {
  onToggleMobileMenu: () => void;
  onOpenCreateCabinet?: () => void;
  onLogout?: () => void;
}

export const SuperAdminTopNav: React.FC<SuperAdminTopNavProps> = ({
  onToggleMobileMenu,
  onOpenCreateCabinet,
  onLogout
}) => {
  const { currentUser, logout, isBackendConnected } = useAppStore();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showAdminMenu, setShowAdminMenu] = useState(false);

  const notifications = [
    { id: 1, type: 'URGENT', title: 'Tentative de brute-force bloquée', time: 'Il y a 4 min', desc: 'IP 197.14.52.12 bloquée après 5 tentatives échouées.' },
    { id: 2, type: 'SUCCESS', title: 'Nouveau cabinet inscrit', time: 'Il y a 18 min', desc: 'Clinique Dentaire Les Berges du Lac a activé l’offre Enterprise.' },
    { id: 3, type: 'INFO', title: 'Backup automatique MongoDB réussi', time: 'Il y a 1h', desc: 'Snapshot chiffré stocké sur AWS S3 avec succès.' }
  ];

  return (
    <header className="h-18 bg-white border-b border-[#E8EDF4] px-6 flex items-center justify-between shrink-0 z-30 font-sans">
      {/* Left: Mobile hamburger + Global Search */}
      <div className="flex items-center gap-3 flex-1 max-w-lg">
        <button
          onClick={onToggleMobileMenu}
          className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="relative w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Recherche globale : Cabinets, Médecins, Abonnements, IP..."
            className="w-full pl-10 pr-4 py-2 bg-[#F7F9FC] border border-[#E8EDF4] rounded-xl text-xs text-[#14213D] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] transition-all"
          />
        </div>
      </div>

      {/* Right: Status pill, Quick Create CTA, Notifications & Admin Menu */}
      <div className="flex items-center gap-3">
        {/* Backend Endpoint & Cluster SLA Pill */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#F7F9FC] border border-[#E8EDF4] text-[11px] font-semibold text-slate-700">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="font-mono text-emerald-600 font-bold">localhost:5000 (Local)</span>
          <span className="text-slate-400">• SLA 99.98%</span>
        </div>

        {/* Quick Action: New Tenant */}
        {onOpenCreateCabinet && (
          <button
            onClick={onOpenCreateCabinet}
            className="px-3.5 py-2 rounded-xl bg-[#2563EB] hover:bg-blue-700 active:scale-[0.98] text-white text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Nouveau Cabinet</span>
          </button>
        )}

        {/* Notifications Popover */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 rounded-xl bg-[#F7F9FC] border border-[#E8EDF4] text-slate-600 hover:text-[#2563EB] hover:bg-slate-100 transition-all relative"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white text-[9px] font-black rounded-full flex items-center justify-center">
              3
            </span>
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-[#E8EDF4] p-4 space-y-3 z-50 animate-in fade-in">
              <div className="flex items-center justify-between border-b border-[#E8EDF4] pb-2.5">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#2563EB]" />
                  <span className="text-xs font-bold text-[#14213D]">Alertes & Audit Système</span>
                </div>
                <span className="text-[10px] text-slate-400 font-semibold">3 non lues</span>
              </div>

              <div className="space-y-2 max-h-72 overflow-y-auto">
                {notifications.map(n => (
                  <div 
                    key={n.id} 
                    className={`p-3 rounded-xl border text-xs space-y-1 ${
                      n.type === 'URGENT' 
                        ? 'bg-rose-50/70 border-rose-200 text-rose-900' 
                        : n.type === 'SUCCESS' 
                        ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900' 
                        : 'bg-[#F7F9FC] border-[#E8EDF4] text-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between font-bold">
                      <span>{n.title}</span>
                      <span className="text-[10px] text-slate-400 font-normal">{n.time}</span>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed">{n.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Super Admin Profile Menu */}
        <div className="relative">
          <button
            onClick={() => setShowAdminMenu(!showAdminMenu)}
            className="flex items-center gap-2.5 p-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-[#F7F9FC] border border-[#E8EDF4] hover:bg-slate-100 transition-all"
          >
            <div className="w-7 h-7 rounded-lg bg-[#14213D] text-white flex items-center justify-center text-xs font-black shrink-0">
              {currentUser.name.charAt(0)}
            </div>
            <div className="hidden sm:block text-left">
              <div className="text-xs font-bold text-[#14213D] leading-tight truncate max-w-[120px]">
                {currentUser.name.split(' ')[0]}
              </div>
              <div className="text-[10px] text-[#2563EB] font-bold">Super Admin</div>
            </div>
          </button>

          {showAdminMenu && (
            <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-[#E8EDF4] p-3 space-y-1 z-50 animate-in fade-in">
              <div className="p-2 border-b border-[#E8EDF4]">
                <div className="font-bold text-xs text-[#14213D] truncate">{currentUser.name}</div>
                <div className="text-[10px] text-slate-400 truncate">{currentUser.email}</div>
                <span className="inline-block mt-1 text-[9px] font-black uppercase tracking-wider bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.2 rounded-full">
                  Super Administrator
                </span>
              </div>

              <button
                onClick={() => {
                  setShowAdminMenu(false);
                  if (onLogout) onLogout();
                  else logout();
                }}
                className="w-full text-left px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors flex items-center gap-2"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Se déconnecter de la plateforme</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
