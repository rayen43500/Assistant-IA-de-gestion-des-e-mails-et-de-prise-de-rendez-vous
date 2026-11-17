import React, { useState, useEffect } from 'react';
import { 
  Home, 
  Search, 
  Calendar, 
  MessageSquare, 
  Bell, 
  User, 
  Plus, 
  LogOut, 
  Menu, 
  X, 
  ArrowUpRight, 
  ShieldCheck, 
  Stethoscope,
  Key
} from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore';
import { PatientHomeTab } from './tabs/PatientHomeTab';
import { PatientFindDoctorTab } from './tabs/PatientFindDoctorTab';
import { PatientMyAppointmentsTab } from './tabs/PatientMyAppointmentsTab';
import { PatientMyRequestsTab } from './tabs/PatientMyRequestsTab';
import { PatientNotificationsTab } from './tabs/PatientNotificationsTab';
import { PatientProfileTab } from './tabs/PatientProfileTab';
import { PatientBookingModal } from './tabs/PatientBookingModal';
import { GuestAppointmentManagementModal } from './GuestAppointmentManagementModal';

interface PatientPortalLayoutProps {
  onExitPortal?: () => void;
  onLogout?: () => void;
}

export type PatientTabId = 'home' | 'find-doctor' | 'my-appointments' | 'my-requests' | 'notifications' | 'profile';

export const PatientPortalLayout: React.FC<PatientPortalLayoutProps> = ({ onExitPortal, onLogout }) => {
  const { currentUser, logout } = useAppStore();
  const [currentTab, setCurrentTab] = useState<PatientTabId>('home');
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [doctorForBooking, setDoctorForBooking] = useState<any>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');
  const [guestToken, setGuestToken] = useState<string>('');
  const [isGuestModalOpen, setIsGuestModalOpen] = useState(false);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tokenParam = urlParams.get('token');
    if (tokenParam) {
      setGuestToken(tokenParam);
      setIsGuestModalOpen(true);
    }
  }, []);

  const handleStartBookingWithDoctor = (doc: any) => {
    setDoctorForBooking(doc);
    setIsBookingOpen(true);
  };

  const navItems = [
    { id: 'home', label: 'Accueil', icon: Home },
    { id: 'find-doctor', label: 'Trouver un médecin', icon: Search },
    { id: 'my-appointments', label: 'Mes rendez-vous', icon: Calendar },
    { id: 'my-requests', label: 'Mes demandes', icon: MessageSquare },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'profile', label: 'Mon profil', icon: User }
  ];

  return (
    <div className="flex h-screen bg-[#F7F9FC] text-[#14213D] font-sans overflow-hidden">
      {/* Mobile Backdrop Overlay */}
      {mobileMenuOpen && (
        <div 
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-40 lg:hidden transition-opacity"
        />
      )}

      {/* Fixed Left Sidebar (exact same design as Super Admin & Practitioner) */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-[#E8EDF4] flex flex-col justify-between shrink-0 font-sans transition-transform duration-300 lg:relative lg:translate-x-0 ${
        mobileMenuOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
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
                    Patient
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 font-medium">Portail de Prise de RDV</span>
              </div>
            </div>

            <button
              onClick={() => setMobileMenuOpen(false)}
              className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Action: Prendre Rendez-vous CTA Button in Sidebar */}
          <div className="p-3 border-b border-[#E8EDF4] shrink-0">
            <button
              onClick={() => { setDoctorForBooking(null); setIsBookingOpen(true); }}
              className="w-full flex items-center justify-center gap-2 p-2.5 rounded-xl bg-[#2563EB] hover:bg-blue-700 active:scale-[0.98] text-white font-bold text-xs shadow-xs transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Prendre un Rendez-vous</span>
            </button>
          </div>

          {/* Navigation Links */}
          <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
            <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Navigation Patient
            </div>

            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setCurrentTab(item.id as any);
                    setMobileMenuOpen(false);
                  }}
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
                </button>
              );
            })}
          </div>

          {/* Quick exit to clinic workspace */}
          {onExitPortal && (
            <div className="px-3 py-2 border-t border-[#E8EDF4]">
              <button
                onClick={onExitPortal}
                className="w-full flex items-center justify-between p-2.5 rounded-xl bg-blue-50/70 border border-blue-200/60 hover:bg-blue-100/60 text-xs font-bold text-[#2563EB] transition-colors"
              >
                <span>Accéder Espace Cabinet</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Patient profile footer (Identical to Super Admin and Practitioner) */}
          <div className="p-3 border-t border-[#E8EDF4] bg-[#F7F9FC] shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5 overflow-hidden">
                <div className="w-8 h-8 rounded-xl bg-[#14213D] text-white flex items-center justify-center font-bold text-xs shrink-0">
                  {currentUser?.name?.charAt(0) || 'P'}
                </div>
                <div className="overflow-hidden">
                  <div className="text-xs font-bold text-[#14213D] truncate">{currentUser?.name || 'Patient'}</div>
                  <div className="text-[10px] text-slate-400 truncate flex items-center gap-1 mt-0.5">
                    <span className="text-[#2563EB] font-bold">Patient vérifié</span>
                  </div>
                </div>
              </div>
              <button 
                onClick={onLogout || logout} 
                title="Déconnexion" 
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Column */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Navigation Bar (Identical to SuperAdminTopNav & AppTopHeader) */}
        <header className="h-18 bg-white border-b border-[#E8EDF4] px-6 flex items-center justify-between shrink-0 z-30 font-sans">
          {/* Left: Mobile hamburger + Global Search */}
          <div className="flex items-center gap-3 flex-1 max-w-lg">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="relative w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Rechercher un praticien, spécialité, consultation..."
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-[#F7F9FC] border border-[#E8EDF4] rounded-xl text-xs text-[#14213D] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] transition-all"
              />
            </div>
          </div>

          {/* Right: Quick Action, Notifications & Patient Menu */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsGuestModalOpen(true)}
              className="hidden md:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors"
              title="Gérer un rendez-vous réservé sans compte"
            >
              <Key className="w-3.5 h-3.5 text-[#2563EB]" />
              <span>Gérer RDV Invité</span>
            </button>

            <button
              onClick={() => { setDoctorForBooking(null); setIsBookingOpen(true); }}
              className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#2563EB] hover:bg-blue-700 active:scale-[0.98] text-white text-xs font-bold shadow-xs transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Nouveau RDV</span>
            </button>

            {/* Notifications Popover */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 rounded-xl bg-[#F7F9FC] border border-[#E8EDF4] text-slate-600 hover:text-[#2563EB] hover:bg-slate-100 transition-all relative"
              >
                <Bell className="w-4 h-4" />
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-[#2563EB] rounded-full"></span>
              </button>
            </div>

            {/* Patient Profile Menu */}
            <div className="relative">
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center gap-2.5 p-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-[#F7F9FC] border border-[#E8EDF4] hover:bg-slate-100 transition-all"
              >
                <div className="w-7 h-7 rounded-lg bg-[#2563EB] text-white flex items-center justify-center text-xs font-black shrink-0">
                  {currentUser?.name?.charAt(0) || 'P'}
                </div>
                <div className="hidden sm:block text-left">
                  <div className="text-xs font-bold text-[#14213D] leading-tight truncate max-w-[120px]">
                    {currentUser?.name?.split(' ')[0] || 'Patient'}
                  </div>
                  <div className="text-[10px] text-[#2563EB] font-bold">Portail Patient</div>
                </div>
              </button>

              {showProfileMenu && (
                <div className="absolute right-0 mt-2 w-60 bg-white rounded-2xl shadow-xl border border-[#E8EDF4] p-3 space-y-1 z-50 animate-in fade-in">
                  <div className="p-2 border-b border-[#E8EDF4]">
                    <div className="font-bold text-xs text-[#14213D] truncate">{currentUser?.name}</div>
                    <div className="text-[10px] text-slate-400 truncate">{currentUser?.email}</div>
                    <span className="inline-block mt-1 text-[9px] font-black uppercase tracking-wider bg-blue-50 text-[#2563EB] border border-blue-200/60 px-2 py-0.2 rounded-full">
                      Patient Vérifié
                    </span>
                  </div>

                  {onExitPortal && (
                    <button
                      onClick={() => {
                        setShowProfileMenu(false);
                        onExitPortal();
                      }}
                      className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 rounded-xl transition-colors flex items-center gap-2"
                    >
                      <Stethoscope className="w-3.5 h-3.5 text-[#2563EB]" />
                      <span>Espace Cabinet</span>
                    </button>
                  )}

                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      if (onLogout) onLogout();
                      else logout();
                    }}
                    className="w-full text-left px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors flex items-center gap-2"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Se déconnecter</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Scrollable Main Workspace Content (Identical to Super Admin & Pro) */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-6xl mx-auto space-y-6">
            {currentTab === 'home' && (
              <PatientHomeTab
                onOpenBooking={() => { setDoctorForBooking(null); setIsBookingOpen(true); }}
                onNavigateToTab={(t: any) => setCurrentTab(t)}
              />
            )}

            {currentTab === 'find-doctor' && (
              <PatientFindDoctorTab
                onSelectDoctorForBooking={handleStartBookingWithDoctor}
              />
            )}

            {currentTab === 'my-appointments' && (
              <PatientMyAppointmentsTab />
            )}

            {currentTab === 'my-requests' && (
              <PatientMyRequestsTab />
            )}

            {currentTab === 'notifications' && (
              <PatientNotificationsTab />
            )}

            {currentTab === 'profile' && (
              <PatientProfileTab />
            )}
          </div>
        </main>
      </div>

      {/* Interactive 5-Step Booking Modal */}
      <PatientBookingModal
        isOpen={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
        preselectedDoctor={doctorForBooking}
      />

      {/* Guest Appointment Management Modal (No account required) */}
      <GuestAppointmentManagementModal
        isOpen={isGuestModalOpen}
        onClose={() => setIsGuestModalOpen(false)}
        token={guestToken}
      />
    </div>
  );
};
