import React, { useState, useEffect } from 'react';
import { PublicLandingPage } from './components/landing/PublicLandingPage';
import { OnboardingWizard } from './components/onboarding/OnboardingWizard';
import { AuthModal } from './components/auth/AuthModal';
import { AppSidebar } from './components/navigation/AppSidebar';
import { AppTopHeader } from './components/navigation/AppTopHeader';
import { EnterpriseDashboard } from './components/dashboard/EnterpriseDashboard';
import { EmailWorkspace } from './components/emails/EmailWorkspace';
import { AppointmentCalendarView } from './components/appointments/AppointmentCalendarView';
import { ContactsDirectoryView } from './components/contacts/ContactsDirectoryView';
import { AiAssistantWorkspace } from './components/ai/AiAssistantWorkspace';
import { AnalyticsReportsView } from './components/analytics/AnalyticsReportsView';
import { EnterpriseSettingsView } from './components/settings/EnterpriseSettingsView';
import { SuperAdminPlatformView } from './components/admin/SuperAdminPlatformView';
import { SuperAdminLayout } from './components/superadmin/SuperAdminLayout';
import { MedicalAvailabilityView } from './components/medical/MedicalAvailabilityView';
import { MedicalDocumentsView } from './components/medical/MedicalDocumentsView';
import { MedicalNotificationsCenterView } from './components/medical/MedicalNotificationsCenterView';
import { PatientPortalLayout } from './components/patient/PatientPortalLayout';
import KnowledgeView from './components/KnowledgeView.jsx';
import N8nAutomationsView from './components/N8nAutomationsView.jsx';
import { ToastNotification } from './components/common/ToastNotification';
import { useAppStore } from './stores/useAppStore';

export default function App() {
  const [inAppMode, setInAppMode] = useState<boolean>(true); // Default to SaaS app directly, can toggle to landing
  const [patientMode, setPatientMode] = useState<boolean>(false);
  const [cabinetPreviewMode, setCabinetPreviewMode] = useState<boolean>(false);
  const [showOnboarding, setShowOnboarding] = useState<boolean>(false);
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [authModalMode, setAuthModalMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN');
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [documents, setDocuments] = useState([
    {
      id: 'doc-1',
      title: 'Grille Tarifaire et Conventions CNAM 2026',
      category: 'TARIFS',
      content: 'Consultation cardiologique : 70 TND. Électrocardiogramme : 50 TND. Échocardiographie Doppler : 140 TND. Prise en charge CNAM filière privée (remboursement AP1).',
      updatedAt: '2026-11-03',
    },
    {
      id: 'doc-2',
      title: 'Horaires d’Ouverture et Garde',
      category: 'HORAIRES',
      content: 'Du lundi au vendredi de 08h30 à 17h30. Samedi de 08h30 à 13h00. Fermé le dimanche.',
      updatedAt: '2026-11-02',
    },
    {
      id: 'doc-3',
      title: 'Protocole d’Urgence et Redirection SAMU 190',
      category: 'URGENCES',
      content: 'Toute douleur thoracique persistante, détresse respiratoire ou perte de conscience impose un appel immédiat au 190 (SAMU) ou 198 (Protection Civile).',
      updatedAt: '2026-11-01',
    }
  ]);

  const { addEmail, loadEmails, loadAppointments, checkConnection, currentUser, logout, showToast } = useAppStore();

  const handleLogout = () => {
    logout();
    setInAppMode(false);
    setPatientMode(false);
    setCabinetPreviewMode(false);
    setCurrentTab('dashboard');
    showToast({
      title: 'Déconnexion effectuée',
      message: 'Votre session a été fermée avec succès.',
      type: 'info'
    });
  };

  useEffect(() => {
    // Connexion automatique et chargement dynamique depuis le backend
    checkConnection();
    loadEmails();
    loadAppointments();
  }, []);

  return (
    <div className="min-h-screen bg-[#F7F9FC] text-[#172033] flex flex-col font-sans selection:bg-blue-100 selection:text-blue-900">
      {/* Toast Notification Container */}
      <ToastNotification />

      {/* Espace de Connexion & Inscription Modal */}
      <AuthModal
        isOpen={showAuthModal}
        initialMode={authModalMode}
        onClose={() => setShowAuthModal(false)}
        onSuccess={() => {
          setShowAuthModal(false);
          setInAppMode(true);
          setCabinetPreviewMode(false);
          const u = useAppStore.getState().currentUser;
          if (u?.role === 'PATIENT') {
            setPatientMode(true);
          } else {
            setPatientMode(false);
          }
          if (u?.role === 'SUPER_ADMIN') {
            setCurrentTab('dashboard');
          }
        }}
      />

      {/* Onboarding Wizard Modal */}
      {showOnboarding && (
        <OnboardingWizard
          onComplete={() => {
            setShowOnboarding(false);
            setInAppMode(true);
            setPatientMode(false);
            setCurrentTab('dashboard');
          }}
          onCancel={() => setShowOnboarding(false)}
        />
      )}

      {/* Public Landing Page Mode */}
      {!inAppMode ? (
        <PublicLandingPage
          onEnterApp={() => {
            setInAppMode(true);
            setCabinetPreviewMode(false);
          }}
          onOpenOnboarding={() => setShowOnboarding(true)}
          onOpenAuth={(mode) => {
            setAuthModalMode(mode);
            setShowAuthModal(true);
          }}
          onOpenPatientPortal={() => {
            const state = useAppStore.getState();
            if (state.currentUser?.role !== 'PATIENT') {
              state.setCurrentUser({
                id: 'patient-1',
                name: 'Amine Jaziri',
                email: 'amine.jaziri@gmail.com',
                role: 'PATIENT',
                organizationName: 'Espace Patient Amine',
                sector: 'MEDICAL'
              });
            }
            setPatientMode(true);
            setInAppMode(true);
            setCabinetPreviewMode(false);
          }}
        />
      ) : (currentUser?.role === 'SUPER_ADMIN' && !cabinetPreviewMode) || currentTab === 'super-admin' ? (
        /* Dedicated Premium Super Admin Platform Layout */
        <SuperAdminLayout 
          onExitSuperAdmin={() => {
            setCabinetPreviewMode(true);
            setCurrentTab('dashboard');
            showToast({
              title: 'Mode Cabinet activé',
              message: 'Vous explorez l\'interface cabinet en tant que Super Admin.',
              type: 'info'
            });
          }}
          onLogout={handleLogout}
        />
      ) : currentUser?.role === 'PATIENT' || patientMode ? (
        /* Dedicated Premium Patient Portal Layout */
        <PatientPortalLayout 
          onExitPortal={() => { 
            setPatientMode(false); 
            setCurrentTab('dashboard'); 
          }} 
          onLogout={handleLogout}
        />
      ) : (
        /* Authenticated SaaS Professional Workspace */
        <div className="flex h-screen overflow-hidden flex-col">
          {currentUser?.role === 'SUPER_ADMIN' && cabinetPreviewMode && (
            <div className="bg-[#14213D] text-white text-xs px-4 py-2 flex items-center justify-between shrink-0 border-b border-blue-900 shadow-sm z-30">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></span>
                <span className="font-bold">Aperçu Cabinet Médical</span>
                <span className="text-slate-400 hidden sm:inline">• Connecté en Super Admin ({currentUser.name})</span>
              </div>
              <button
                onClick={() => setCabinetPreviewMode(false)}
                className="bg-[#2563EB] hover:bg-blue-600 text-white font-bold px-3 py-1 rounded-lg text-xs transition-colors flex items-center gap-1.5 shadow-xs"
              >
                <span>Retour Console Super Admin</span>
                <span>↗</span>
              </button>
            </div>
          )}

          <div className="flex flex-1 overflow-hidden">
            {/* Main App Sidebar with Mobile Support */}
            <AppSidebar
              currentTab={currentTab}
              onSelectTab={setCurrentTab}
              onBackToLanding={handleLogout}
              onLogout={handleLogout}
              isOpenMobile={mobileMenuOpen}
              onCloseMobile={() => setMobileMenuOpen(false)}
              isSuperAdmin={currentUser?.role === 'SUPER_ADMIN'}
              onReturnToSuperAdmin={currentUser?.role === 'SUPER_ADMIN' ? () => setCabinetPreviewMode(false) : undefined}
            />

            {/* Center Work Area */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
              {/* Top Navigation Bar with Hamburger */}
              <AppTopHeader
                onOpenQuickAppointment={() => setCurrentTab('appointments')}
                onToggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)}
                onOpenAuthModal={() => {
                  setAuthModalMode('LOGIN');
                  setShowAuthModal(true);
                }}
                onLogout={handleLogout}
              />

              {/* Scrollable Main Workspace Content */}
              <main className="flex-1 overflow-y-auto p-4 sm:p-6">
              {currentTab === 'dashboard' && (
                <EnterpriseDashboard
                  onNavigateToEmails={() => setCurrentTab('emails')}
                  onNavigateToCalendar={() => setCurrentTab('appointments')}
                  onNavigateToAutomations={() => setCurrentTab('automations')}
                />
              )}

              {currentTab === 'appointments' && (
                <AppointmentCalendarView />
              )}

              {currentTab === 'availabilities' && (
                <MedicalAvailabilityView />
              )}

              {currentTab === 'contacts' && (
                <ContactsDirectoryView />
              )}

              {currentTab === 'emails' && (
                <EmailWorkspace />
              )}

              {currentTab === 'ai-assistant' && (
                <AiAssistantWorkspace />
              )}

              {currentTab === 'documents' && (
                <MedicalDocumentsView />
              )}

              {currentTab === 'knowledge' && (
                <KnowledgeView
                  documents={documents}
                  onAddDocument={(doc: any) => setDocuments([...documents, doc])}
                  onQueryRag={async (q: string) => {
                    return `Selon la base certifiée : ${documents[0].content}`;
                  }}
                />
              )}

              {currentTab === 'notifications' && (
                <MedicalNotificationsCenterView
                  onNavigateToEmails={() => setCurrentTab('emails')}
                  onNavigateToCalendar={() => setCurrentTab('appointments')}
                />
              )}

              {currentTab === 'automations' && (
                <N8nAutomationsView
                  onSimulateEmail={(sim: any) => {
                    addEmail(sim);
                  }}
                />
              )}

              {currentTab === 'analytics' && (
                <AnalyticsReportsView />
              )}

              {currentTab === 'settings' && (
                <EnterpriseSettingsView />
              )}

              {currentTab === 'super-admin' && (
                <SuperAdminPlatformView />
              )}
            </main>
          </div>
        </div>
      </div>
      )}
    </div>
  );
}
