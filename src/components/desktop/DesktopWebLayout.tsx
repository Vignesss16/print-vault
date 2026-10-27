'use client';

import React from 'react';
import Link from 'next/link';
import { usePrintVault } from '@/context/PrintVaultContext';
import { ScreenType } from '@/types/printvault';
import { userProfile } from '@/data/mockData';
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

export const DesktopWebLayout: React.FC = () => {
  const {
    currentScreen,
    setCurrentScreen,
    activeChatSession,
    currentUser,
  } = usePrintVault();

  const hasPendingRequest = activeChatSession?.status === 'pending';
  const hasAcceptedChat = activeChatSession?.status === 'accepted';

  const navLinks = [
    { id: 'home', label: 'Nearby Shops', icon: 'near_me' },
    { id: 'chat', label: 'Chat', icon: 'chat', badge: hasAcceptedChat ? 'Active' : undefined },
    { id: 'shopkeeper_dashboard', label: 'Shopkeeper Portal', icon: 'storefront', badge: hasPendingRequest ? '1 New' : undefined },
  ];

  return (
    <div className="min-h-screen bg-[#fbf9f5] text-[#1b1c1a] flex flex-col font-sans antialiased">
      {/* Sleek Minimal Desktop Navigation Bar */}
      <header className="sticky top-0 z-40 w-full bg-[#fbf9f5]/90 backdrop-blur-xl border-b border-[#ece8e1] shadow-2xs">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo & Product Title */}
          <div
            onClick={() => setCurrentScreen('home')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-xl bg-[#3d3bf3] flex items-center justify-center text-white shadow-xs group-hover:scale-105 transition-all">
              <span className="material-symbols-outlined text-[20px]">shield_lock</span>
            </div>
            <div className="flex flex-col">
              <span className="font-heading font-bold text-[18px] text-[#1b1c1a] tracking-tight leading-none">
                PrintVault
              </span>
              <span className="font-sans text-[12px] text-[#6b6760] mt-0.5">
                Fast, private Xerox printing
              </span>
            </div>
          </div>

          {/* Clean Navigation Links */}
          <nav className="flex items-center gap-1 bg-[#efeeea]/80 p-1 rounded-full border border-[#ece8e1]">
            {navLinks.map((item) => {
              const isActive = currentScreen === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentScreen(item.id as ScreenType)}
                  type="button"
                  className={`flex items-center gap-2 px-4 py-1.5 rounded-full font-sans text-[13px] font-medium transition-all cursor-pointer ${
                    isActive
                      ? 'bg-white text-[#3d3bf3] shadow-xs font-semibold'
                      : 'text-[#454556] hover:text-[#1b1c1a] hover:bg-white/50'
                  }`}
                >
                  <span
                    className="material-symbols-outlined text-[17px]"
                    style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}
                  >
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className="w-2 h-2 rounded-full bg-[#3d3bf3]"></span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* User Account / Role Switcher */}
          <div className="flex items-center gap-3">
            <Link
              href="/demo/whatsapp"
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#00a884] hover:bg-[#008f6f] text-white font-sans text-[12px] font-semibold transition-all shadow-xs"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-200 animate-pulse"></span>
              <span>Try WhatsApp Demo</span>
            </Link>
            <button
              onClick={() => {
                if (currentScreen === 'shopkeeper_auth' || currentScreen === 'shopkeeper_dashboard') {
                  setCurrentScreen('home');
                } else {
                  setCurrentScreen('shopkeeper_dashboard');
                }
              }}
              type="button"
              className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#f5f3ef] hover:bg-[#ece8e1] text-[#1b1c1a] font-sans text-[12px] font-medium border border-[#ece8e1] transition-all cursor-pointer"
            >
              {hasPendingRequest && (
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
              )}
              <span className="material-symbols-outlined text-[16px] text-[#3d3bf3]">
                {currentScreen === 'shopkeeper_dashboard' || currentScreen === 'shopkeeper_auth'
                  ? 'person'
                  : 'storefront'}
              </span>
              <span>
                {currentScreen === 'shopkeeper_dashboard' || currentScreen === 'shopkeeper_auth'
                  ? 'Customer View'
                  : 'Shopkeeper'}
              </span>
              {hasPendingRequest && (
                <span className="px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">
                  1
                </span>
              )}
            </button>

            {currentUser ? (
              <button
                onClick={() => setCurrentScreen('profile')}
                type="button"
                className="flex items-center gap-2 pl-2 pr-3 py-1 rounded-full bg-white hover:bg-[#f5f3ef] border border-[#ece8e1] shadow-2xs transition-all cursor-pointer"
              >
                <img
                  src={currentUser.avatarUrl || userProfile.avatar}
                  alt={currentUser.name}
                  className="w-7 h-7 rounded-full object-cover"
                />
                <span className="font-heading text-[13px] font-semibold text-[#1b1c1a]">
                  {currentUser.name}
                </span>
              </button>
            ) : (
              <button
                onClick={() => setCurrentScreen('auth')}
                type="button"
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#3d3bf3] hover:bg-[#2e2cd4] text-white font-sans text-[13px] font-semibold shadow-xs transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">login</span>
                <span>Sign In</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Spacious Focused Content Canvas */}
      <main className="max-w-4xl mx-auto w-full px-6 py-8 flex-1 flex flex-col">
        <div className="bg-white rounded-[28px] p-6 lg:p-8 shadow-xs border border-[#ece8e1] flex-1">
          {currentScreen === 'home' && <HomeScreen />}
          {currentScreen === 'auth' && <AuthScreen />}
          {currentScreen === 'shopkeeper_auth' && <ShopkeeperAuthScreen />}
          {currentScreen === 'shopkeeper_dashboard' && <ShopkeeperDashboardScreen />}
          {currentScreen === 'chat' && <ChatScreen />}
          {currentScreen === 'new_job' && <NewPrintJobScreen />}
          {currentScreen === 'shop_qr' && <ShopLinkQrScreen />}
          {currentScreen === 'live_tracker' && <LiveTrackerScreen />}
          {currentScreen === 'receipt' && <VerificationReceiptScreen />}
          {currentScreen === 'receipts_list' && <ReceiptsListScreen />}
          {currentScreen === 'profile' && <ProfileScreen />}
        </div>
      </main>
    </div>
  );
};
