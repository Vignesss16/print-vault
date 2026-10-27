'use client';

import React from 'react';
import { PrintVaultProvider, usePrintVault } from '@/context/PrintVaultContext';
import { Header } from '@/components/common/Header';
import { BottomNav } from '@/components/common/BottomNav';
import { Toast } from '@/components/common/Toast';
import { HomeScreen } from '@/components/screens/HomeScreen';
import { NewPrintJobScreen } from '@/components/screens/NewPrintJobScreen';
import { ShopLinkQrScreen } from '@/components/screens/ShopLinkQrScreen';
import { LiveTrackerScreen } from '@/components/screens/LiveTrackerScreen';
import { VerificationReceiptScreen } from '@/components/screens/VerificationReceiptScreen';
import { ReceiptsListScreen } from '@/components/screens/ReceiptsListScreen';
import { ProfileScreen } from '@/components/screens/ProfileScreen';
import { AuthScreen } from '@/components/screens/AuthScreen';
import { ChatScreen } from '@/components/screens/ChatScreen';
import { ShopkeeperAuthScreen } from '@/components/screens/ShopkeeperAuthScreen';
import { ShopkeeperDashboardScreen } from '@/components/screens/ShopkeeperDashboardScreen';
import { DesktopWebLayout } from '@/components/desktop/DesktopWebLayout';

function MobileAppFrame() {
  const { currentScreen, setCurrentScreen } = usePrintVault();

  const getHeaderProps = () => {
    switch (currentScreen) {
      case 'home':
        return { title: 'PrintVault', subtitle: 'Home', showBack: false };
      case 'auth':
        return {
          title: 'PrintVault',
          subtitle: 'Sign in',
          showBack: true,
          onBack: () => setCurrentScreen('home'),
        };
      case 'new_job':
        return {
          title: 'New Print Job',
          showBack: true,
          onBack: () => setCurrentScreen('home'),
        };
      case 'shop_qr':
        return {
          title: 'Print QR Code',
          showBack: true,
          onBack: () => setCurrentScreen('home'),
        };
      case 'live_tracker':
        return {
          title: 'Print Status',
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
          subtitle: 'Receipts',
          showBack: true,
          onBack: () => setCurrentScreen('home'),
        };
      case 'profile':
        return {
          title: 'PrintVault',
          subtitle: 'Profile',
          showBack: true,
          onBack: () => setCurrentScreen('home'),
        };
      case 'chat':
        return {
          title: 'PrintVault',
          subtitle: 'Chat',
          showBack: true,
          onBack: () => setCurrentScreen('home'),
        };
      case 'shopkeeper_auth':
        return {
          title: 'PrintVault',
          subtitle: 'Shopkeeper Sign In',
          showBack: true,
          onBack: () => setCurrentScreen('home'),
        };
      case 'shopkeeper_dashboard':
        return {
          title: 'PrintVault',
          subtitle: 'Shopkeeper Portal',
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
      case 'auth':
        return <AuthScreen />;
      case 'shopkeeper_auth':
        return <ShopkeeperAuthScreen />;
      case 'shopkeeper_dashboard':
        return <ShopkeeperDashboardScreen />;
      case 'chat':
        return <ChatScreen />;
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
