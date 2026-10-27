'use client';

import React from 'react';
import { usePrintVault } from '@/context/PrintVaultContext';
import { ScreenType } from '@/types/printvault';

export const BottomNav: React.FC = () => {
  const { currentScreen, setCurrentScreen } = usePrintVault();

  // If we are in the middle of creating a job or showing QR, we can still show or hide based on UX.
  // The stitch designs show BottomNav on Home and Receipt, and custom floating execution bars on New Job and QR.
  const hideOnScreens: ScreenType[] = ['new_job'];
  if (hideOnScreens.includes(currentScreen)) {
    return null;
  }

  const navItems = [
    {
      id: 'home' as ScreenType,
      label: 'Shops',
      icon: 'storefront',
      isActive: currentScreen === 'home',
    },
    {
      id: 'chat' as ScreenType,
      label: 'Chat',
      icon: 'chat',
      isActive: currentScreen === 'chat',
    },
    {
      id: 'profile' as ScreenType,
      label: 'Profile',
      icon: 'person',
      isActive: currentScreen === 'profile',
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 pb-safe bg-[#fbf9f5]/92 backdrop-blur-xl border-t border-[#ece8e1] shadow-[0_-4px_24px_rgba(22,22,29,0.04)]">
      <div className="max-w-[480px] mx-auto h-16 px-4 flex items-center justify-around">
        {navItems.map((item) => {
          return (
            <button
              key={item.id}
              onClick={() => setCurrentScreen(item.id)}
              className={`flex flex-col items-center justify-center min-w-[54px] min-h-[48px] gap-0.5 transition-all ${
                item.isActive
                  ? 'text-[#3d3bf3] font-semibold scale-105'
                  : 'text-[#454556] hover:text-[#1b1c1a]'
              }`}
            >
              <span
                className="material-symbols-outlined text-[22px]"
                style={item.isActive ? { fontVariationSettings: "'FILL' 1" } : {}}
              >
                {item.icon}
              </span>
              <span className="font-sans text-[11px] leading-tight tracking-tight">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
