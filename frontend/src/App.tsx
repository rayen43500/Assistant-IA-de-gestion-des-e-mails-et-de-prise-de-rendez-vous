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
import KnowledgeView from './components/KnowledgeView.jsx';
import N8nAutomationsView from './components/N8nAutomationsView.jsx';
import { ToastNotification } from './components/common/ToastNotification';
import { useAppStore } from './stores/useAppStore';

export default function App() {
  const [inAppMode, setInAppMode] = useState<boolean>(true); // Default to SaaS app directly, can toggle to landing
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

  const { addEmail, loadEmails, loadAppointments, checkConnection } = useAppStore();

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
        }}
      />

      {/* Onboarding Wizard Modal */}
      {showOnboarding && (
        <OnboardingWizard
          onComplete={() => setShowOnboarding(false)}
          onCancel={() => setShowOnboarding(false)}
        />
      )}

      {/* Public Landing Page Mode */}
      {!inAppMode ? (
        <PublicLandingPage
          onEnterApp={() => setInAppMode(true)}
          onOpenOnboarding={() => setShowOnboarding(true)}
          onOpenAuth={(mode) => {
            setAuthModalMode(mode);
            setShowAuthModal(true);
          }}
        />
      ) : (
        /* Authenticated SaaS Professional Workspace */
        <div className="flex h-screen overflow-hidden">
          {/* Main App Sidebar with Mobile Support */}
          <AppSidebar
            currentTab={currentTab}
            onSelectTab={setCurrentTab}
            onBackToLanding={() => setInAppMode(false)}
            isOpenMobile={mobileMenuOpen}
            onCloseMobile={() => setMobileMenuOpen(false)}
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

              {currentTab === 'emails' && (
                <EmailWorkspace />
              )}

              {currentTab === 'appointments' && (
                <AppointmentCalendarView />
              )}

              {currentTab === 'contacts' && (
                <ContactsDirectoryView />
              )}

              {currentTab === 'ai-assistant' && (
                <AiAssistantWorkspace />
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
      )}
    </div>
  );
}
