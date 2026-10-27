'use client';

import React from 'react';
import { PrintVaultProvider, usePrintVault } from '@/context/PrintVaultContext';
import { Header } from '@/components/common/Header';
import { BottomNav } from '@/components/common/BottomNav';
import { Toast } from '@/components/common/Toast';
import { ViewModeSwitcher } from '@/components/common/ViewModeSwitcher';
import { HomeScreen } from '@/components/screens/HomeScreen';
import { NewPrintJobScreen } from '@/components/screens/NewPrintJobScreen';
import { ShopLinkQrScreen } from '@/components/screens/ShopLinkQrScreen';
import { LiveTrackerScreen } from '@/components/screens/LiveTrackerScreen';
import { VerificationReceiptScreen } from '@/components/screens/VerificationReceiptScreen';
import { ReceiptsListScreen } from '@/components/screens/ReceiptsListScreen';
import { ProfileScreen } from '@/components/screens/ProfileScreen';
import { DesktopWebLayout } from '@/components/desktop/DesktopWebLayout';

function MobileAppFrame() {
  const { currentScreen, setCurrentScreen } = usePrintVault();

  const getHeaderProps = () => {
    switch (currentScreen) {
      case 'home':
        return { title: 'PrintVault', subtitle: 'Home', showBack: false };
      case 'new_job':
        return {
          title: 'New Print Job',
          showBack: true,
          onBack: () => setCurrentScreen('home'),
        };
      case 'shop_qr':
        return {
          title: 'Shop Link / QR',
          showBack: true,
          onBack: () => setCurrentScreen('home'),
        };
      case 'live_tracker':
        return {
          title: 'Tracker',
          showBack: true,
          onBack: () => setCurrentScreen('home'),
        };
      case 'receipt':
        return {
          title: 'PrintVault',
          subtitle: 'Receipt',
          showBack: true,
          onBack: () => setCurrentScreen('home'),
        };
      case 'receipts_list':
        return {
          title: 'PrintVault',
          subtitle: 'Audit Archive',
          showBack: true,
          onBack: () => setCurrentScreen('home'),
        };
      case 'profile':
        return {
          title: 'PrintVault',
          subtitle: 'Profile & Vault',
          showBack: true,
          onBack: () => setCurrentScreen('home'),
        };
      default:
        return { title: 'PrintVault', showBack: false };
    }
  };

  const renderActiveScreen = () => {
    switch (currentScreen) {
      case 'home':
        return <HomeScreen />;
      case 'new_job':
        return <NewPrintJobScreen />;
      case 'shop_qr':
        return <ShopLinkQrScreen />;
      case 'live_tracker':
        return <LiveTrackerScreen />;
      case 'receipt':
        return <VerificationReceiptScreen />;
      case 'receipts_list':
        return <ReceiptsListScreen />;
      case 'profile':
        return <ProfileScreen />;
      default:
        return <HomeScreen />;
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f3ef] sm:py-8 flex flex-col items-center justify-start">
      {/* Mobile Frame Container: 480px max width centered */}
      <div className="w-full sm:max-w-[480px] min-h-screen sm:min-h-[880px] bg-[#fbf9f5] flex flex-col relative sm:rounded-[36px] sm:shadow-[0_24px_64px_-12px_rgba(22,22,29,0.15)] sm:border sm:border-[#ece8e1] overflow-x-hidden">
        {/* Dynamic Mobile Header */}
        <Header {...getHeaderProps()} />

        {/* Content Area */}
        <main className="flex-1 flex flex-col w-full px-6 pt-4 pb-20">
          {renderActiveScreen()}
        </main>

        {/* Persistent Bottom Nav Tab Bar */}
        <BottomNav />
      </div>
    </div>
  );
}

function MainAppShell() {
  const { viewMode } = usePrintVault();

  return (
    <>
      {/* View Mode Switcher Pill */}
      <ViewModeSwitcher />

      {/* Global Floating Toast */}
      <Toast />

      {/* Render based on view mode */}
      {viewMode === 'desktop' ? (
        <DesktopWebLayout />
      ) : viewMode === 'mobile' ? (
        <MobileAppFrame />
      ) : (
        /* Auto Mode: Mobile under lg, Desktop Web on lg and above */
        <>
          <div className="block lg:hidden">
            <MobileAppFrame />
          </div>
          <div className="hidden lg:block">
            <DesktopWebLayout />
          </div>
        </>
      )}
    </>
  );
}

export default function Home() {
  return (
    <PrintVaultProvider>
      <MainAppShell />
    </PrintVaultProvider>
  );
}
