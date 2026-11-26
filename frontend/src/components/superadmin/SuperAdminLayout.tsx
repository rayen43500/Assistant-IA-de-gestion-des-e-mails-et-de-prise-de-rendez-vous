import React, { useState } from 'react';
import { SuperAdminSidebar } from './SuperAdminSidebar';
import type { SuperAdminTabId } from './SuperAdminSidebar';
import { SuperAdminTopNav } from './SuperAdminTopNav';
import {
  RealAdminOverview,
  RealAdminClinics,
  RealAdminDoctors,
  RealAdminUsers,
  RealAdminAiSupervision,
  RealAdminMonitoring,
  RealAdminSecurity,
  RealAdminAutomations,
  RealAdminBilling,
  RealAdminSettings,
} from './RealAdminTabs';

interface SuperAdminLayoutProps {
  onExitSuperAdmin?: () => void;
  onLogout?: () => void;
}

export const SuperAdminLayout: React.FC<SuperAdminLayoutProps> = ({ onExitSuperAdmin, onLogout }) => {
  const [currentTab, setCurrentTab] = useState<SuperAdminTabId>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex h-screen bg-[#F7F9FC] text-[#14213D] font-sans overflow-hidden">
      {/* Fixed Left Sidebar */}
      <SuperAdminSidebar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        onExitSuperAdmin={onExitSuperAdmin}
        onLogout={onLogout}
        isMobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      {/* Main Column */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Navigation Bar */}
        <SuperAdminTopNav
          onToggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)}
          onOpenCreateCabinet={() => setCurrentTab('cabinets')}
          onLogout={onLogout}
        />

        {/* Scrollable Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {currentTab === 'dashboard' && <RealAdminOverview onNavigateToTab={setCurrentTab} />}
            {currentTab === 'cabinets' && <RealAdminClinics />}
            {currentTab === 'doctors' && <RealAdminDoctors />}
            {currentTab === 'users' && <RealAdminUsers />}
            {currentTab === 'subscriptions' && <RealAdminBilling kind="subscriptions" />}
            {currentTab === 'payments' && <RealAdminBilling kind="payments" />}
            {currentTab === 'ai-supervision' && <RealAdminAiSupervision />}
            {currentTab === 'automations' && <RealAdminAutomations />}
            {currentTab === 'monitoring' && <RealAdminMonitoring />}
            {currentTab === 'security' && <RealAdminSecurity />}
            {currentTab === 'settings' && <RealAdminSettings />}
          </div>
        </main>
      </div>
    </div>
  );
};
