'use client';

import React from 'react';
import { usePrintVault } from '@/context/PrintVaultContext';
import { userProfile } from '@/data/mockData';

interface HeaderProps {
  title?: string;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  title = 'PrintVault',
  subtitle,
  showBack = false,
  onBack,
}) => {
  const { currentScreen, setCurrentScreen } = usePrintVault();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      setCurrentScreen('home');
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-[#fbf9f5]/90 backdrop-blur-xl border-b border-[#ece8e1]/80 shadow-[0_1px_8px_rgba(0,0,0,0.03)] shrink-0">
      <div className="pt-safe">
        <div className="h-16 px-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {showBack && (
              <button
                aria-label="Go Back"
                onClick={handleBack}
                className="w-10 h-10 -ml-2 rounded-full flex items-center justify-center text-[#1b1c1a] hover:bg-[#efeeea] active:scale-95 transition-all"
                type="button"
              >
                <span className="material-symbols-outlined text-[22px]">arrow_back</span>
              </button>
            )}

            {/* PrintVault Shield Logo */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-[#3d3bf3] flex items-center justify-center text-white shadow-sm shadow-[#3d3bf3]/20">
                <span className="material-symbols-outlined text-[19px]">shield_lock</span>
              </div>

              <div className="flex flex-col">
                <span className="font-heading font-semibold text-[17px] text-[#1b1c1a] tracking-tight leading-none">
                  {title}
                </span>
                {subtitle && (
                  <span className="font-mono text-[11px] text-[#454556] font-medium mt-0.5">
                    {subtitle}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* User Profile Avatar */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentScreen('profile')}
              aria-label="Profile"
              className={`relative p-0.5 rounded-full transition-all ${
                currentScreen === 'profile'
                  ? 'ring-2 ring-[#3d3bf3]'
                  : 'ring-1 ring-[#c6c4d9] hover:ring-[#3d3bf3]'
              }`}
            >
              <img
                alt={userProfile.name}
                className="w-8 h-8 rounded-full object-cover"
                src={userProfile.avatar}
              />
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white"></span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
