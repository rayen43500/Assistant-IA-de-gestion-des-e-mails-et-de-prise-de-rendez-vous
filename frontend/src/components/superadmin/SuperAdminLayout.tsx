import React, { useState } from 'react';
import { SuperAdminSidebar } from './SuperAdminSidebar';
import type { SuperAdminTabId } from './SuperAdminSidebar';
import { SuperAdminTopNav } from './SuperAdminTopNav';
import { AdminDashboardTab } from './tabs/AdminDashboardTab';
import { AdminCabinetsTab } from './tabs/AdminCabinetsTab';
import { AdminDoctorsTab } from './tabs/AdminDoctorsTab';
import { AdminUsersTab } from './tabs/AdminUsersTab';
import { AdminSubscriptionsTab } from './tabs/AdminSubscriptionsTab';
import { AdminPaymentsTab } from './tabs/AdminPaymentsTab';
import { AdminAiSupervisionTab } from './tabs/AdminAiSupervisionTab';
import { AdminAutomationsTab } from './tabs/AdminAutomationsTab';
import { AdminMonitoringTab } from './tabs/AdminMonitoringTab';
import { AdminSecurityTab } from './tabs/AdminSecurityTab';
import { AdminSettingsTab } from './tabs/AdminSettingsTab';

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
            {currentTab === 'dashboard' && <AdminDashboardTab onNavigateToTab={setCurrentTab} />}
            {currentTab === 'cabinets' && <AdminCabinetsTab />}
            {currentTab === 'doctors' && <AdminDoctorsTab />}
            {currentTab === 'users' && <AdminUsersTab />}
            {currentTab === 'subscriptions' && <AdminSubscriptionsTab />}
            {currentTab === 'payments' && <AdminPaymentsTab />}
            {currentTab === 'ai-supervision' && <AdminAiSupervisionTab />}
            {currentTab === 'automations' && <AdminAutomationsTab />}
            {currentTab === 'monitoring' && <AdminMonitoringTab />}
            {currentTab === 'security' && <AdminSecurityTab />}
            {currentTab === 'settings' && <AdminSettingsTab />}
          </div>
        </main>
      </div>
    </div>
  );
};
