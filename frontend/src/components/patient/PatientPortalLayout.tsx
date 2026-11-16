import React, { useState } from 'react';
import { 
  Home, 
  Search, 
  Calendar, 
  MessageSquare, 
  Bell, 
  User, 
  Plus, 
  LogOut, 
  ArrowLeft,
  ShieldCheck,
  Stethoscope
} from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore';
import { PatientHomeTab } from './tabs/PatientHomeTab';
import { PatientFindDoctorTab } from './tabs/PatientFindDoctorTab';
import { PatientMyAppointmentsTab } from './tabs/PatientMyAppointmentsTab';
import { PatientMyRequestsTab } from './tabs/PatientMyRequestsTab';
import { PatientNotificationsTab } from './tabs/PatientNotificationsTab';
import { PatientProfileTab } from './tabs/PatientProfileTab';
import { PatientBookingModal } from './tabs/PatientBookingModal';

interface PatientPortalLayoutProps {
  onExitPortal?: () => void;
}

export type PatientTabId = 'home' | 'find-doctor' | 'my-appointments' | 'my-requests' | 'notifications' | 'profile';

export const PatientPortalLayout: React.FC<PatientPortalLayoutProps> = ({ onExitPortal }) => {
  const { currentUser, logout } = useAppStore();
  const [currentTab, setCurrentTab] = useState<PatientTabId>('home');
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [doctorForBooking, setDoctorForBooking] = useState<any>(null);

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
    <div className="min-h-screen bg-[#F7F9FC] text-[#14213D] flex flex-col font-sans pb-20 sm:pb-0">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#E8EDF4] px-4 sm:px-8 h-18 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-[#2563EB] flex items-center justify-center text-white font-black shadow-xs">
            M
          </div>
          <div>
            <div className="flex items-center gap-1.5 font-black text-sm text-[#14213D]">
              <span>MediLaw<span className="text-[#2563EB]">AI</span></span>
              <span className="text-[10px] font-bold text-teal-700 bg-teal-50 border border-teal-200 px-2 py-0.2 rounded-full">
                Portail Patient
              </span>
            </div>
            <span className="text-[10px] text-slate-400">Prise de rendez-vous en ligne certifiée</span>
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-1 bg-[#F7F9FC] p-1 rounded-2xl border border-[#E8EDF4]">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentTab(item.id as any)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-[#2563EB] text-white shadow-2xs'
                    : 'text-slate-600 hover:text-[#14213D] hover:bg-slate-200/50'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* User profile avatar & exit/logout */}
        <div className="flex items-center gap-2">
          {onExitPortal && (
            <button
              onClick={onExitPortal}
              title="Retour à l'espace praticien"
              className="text-xs font-bold text-slate-600 hover:text-[#2563EB] px-3 py-1.5 rounded-xl hover:bg-slate-100 transition-colors hidden sm:block"
            >
              Espace Praticien
            </button>
          )}

          <div className="w-8 h-8 rounded-full bg-blue-100 text-[#2563EB] font-bold text-xs flex items-center justify-center">
            {currentUser?.name?.charAt(0) || 'A'}
          </div>

          <button
            onClick={logout}
            title="Se déconnecter"
            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 lg:p-8">
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
      </main>

      {/* Interactive 5-Step Booking Modal */}
      <PatientBookingModal
        isOpen={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
        preselectedDoctor={doctorForBooking}
      />

      {/* Mobile Bottom Navigation Bar (Apple Health & Doctolib inspired) */}
      <div className="fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t border-[#E8EDF4] px-2 py-2 flex items-center justify-around z-40 lg:hidden shadow-lg">
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentTab(item.id as any)}
              className={`flex flex-col items-center gap-1 py-1 px-2 rounded-xl transition-all ${
                isActive ? 'text-[#2563EB] font-bold' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] leading-none">{item.label.split(' ')[0]}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
