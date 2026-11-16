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
  AlertTriangle,
  Menu
} from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore';

interface AppTopHeaderProps {
  onOpenQuickAppointment: () => void;
  onToggleMobileMenu?: () => void;
  onOpenAuthModal?: () => void;
}

export const AppTopHeader: React.FC<AppTopHeaderProps> = ({ 
  onOpenQuickAppointment,
  onToggleMobileMenu,
  onOpenAuthModal
}) => {
  const { sector, organizationName, language, setLanguage, emails, showToast, currentUser, logout, isAuthenticated } = useAppStore();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const pendingEmails = emails.filter(e => e.status === 'PENDING_VALIDATION');
  const emergencyEmails = emails.filter(e => e.intent === 'EMERGENCY' && e.status !== 'VALIDATED_AND_SENT');

  return (
    <header className="h-16 bg-white border-b border-[#E5EAF2] px-4 sm:px-6 flex items-center justify-between shrink-0 shadow-xs z-30">
      {/* Left : Hamburger on mobile + Global Search */}
      <div className="flex items-center gap-2 sm:gap-3 flex-1 max-w-md">
        {/* Mobile menu toggle */}
        <button
          onClick={onToggleMobileMenu}
          aria-label="Menu"
          className="p-2 rounded-xl text-slate-700 hover:bg-slate-100 md:hidden transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="relative w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={sector === 'MEDICAL' ? "Rechercher patient, RDV..." : "Rechercher client, dossier..."}
            className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2 bg-[#F7F9FC] border border-[#E5EAF2] rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />
        </div>
      </div>

      {/* Quick Action & Controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Backend Endpoint Indicator (Hidden on small screens) */}
        <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-[11px] font-semibold text-slate-700">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="font-mono text-blue-600 font-bold">stage-cqe9.onrender.com</span>
        </div>

        {/* Quick Create Appointment CTA */}
        <button
          onClick={onOpenQuickAppointment}
          className="px-3 sm:px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm flex items-center gap-1.5 transition-all"
        >
          <Plus className="w-4 h-4 shrink-0" />
          <span className="hidden sm:inline">Nouveau Rendez-vous</span>
          <span className="sm:hidden">RDV</span>
        </button>

        {/* Language selector FR / EN / AR */}
        <div className="flex items-center bg-[#F7F9FC] border border-[#E5EAF2] rounded-xl p-0.5 sm:p-1 text-xs font-bold text-slate-600">
          <button
            onClick={() => setLanguage('fr')}
            className={`px-1.5 sm:px-2 py-1 rounded-lg transition-all ${language === 'fr' ? 'bg-white shadow-xs text-blue-600' : 'hover:text-slate-900'}`}
          >
            FR
          </button>
          <button
            onClick={() => setLanguage('en')}
            className={`px-1.5 sm:px-2 py-1 rounded-lg transition-all ${language === 'en' ? 'bg-white shadow-xs text-blue-600' : 'hover:text-slate-900'}`}
          >
            EN
          </button>
          <button
            onClick={() => setLanguage('ar')}
            className={`px-1.5 sm:px-2 py-1 rounded-lg transition-all ${language === 'ar' ? 'bg-white shadow-xs text-blue-600' : 'hover:text-slate-900'}`}
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
            <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-white rounded-2xl shadow-2xl border border-[#E5EAF2] p-4 space-y-3 z-50">
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

        {/* User Account & Login / Switch Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-[#F7F9FC] border border-[#E5EAF2] hover:bg-slate-100 transition-all text-xs font-bold text-slate-800"
          >
            <div className="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
              {currentUser?.name?.charAt(0) || 'U'}
            </div>
            <span className="hidden md:inline max-w-[120px] truncate">{currentUser?.name?.split(' ')[0] || 'Mon Compte'}</span>
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-[#E5EAF2] p-3 space-y-2 z-50">
              <div className="p-2 border-b border-slate-100">
                <div className="font-bold text-xs text-slate-900 truncate">{currentUser.name}</div>
                <div className="text-[10px] text-slate-500 truncate">{currentUser.email}</div>
                <div className="mt-1 inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
                  <span>{currentUser.role}</span> • <span>{currentUser.organizationName}</span>
                </div>
              </div>

              <button
                onClick={() => {
                  setShowUserMenu(false);
                  if (onOpenAuthModal) onOpenAuthModal();
                }}
                className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 rounded-xl transition-colors flex items-center gap-2"
              >
                <User className="w-3.5 h-3.5 text-blue-600" />
                <span>Changer de compte / Espace Pro</span>
              </button>

              <button
                onClick={() => {
                  setShowUserMenu(false);
                  logout();
                  showToast({
                    title: 'Déconnexion effectuée',
                    message: 'Votre session a été fermée avec succès.',
                    type: 'info'
                  });
                }}
                className="w-full text-left px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors flex items-center gap-2"
              >
                <span>Se déconnecter</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
