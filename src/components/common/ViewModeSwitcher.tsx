'use client';

import React from 'react';
import { usePrintVault } from '@/context/PrintVaultContext';
import { ViewMode } from '@/types/printvault';

export const ViewModeSwitcher: React.FC = () => {
  const { viewMode, setViewMode } = usePrintVault();

  const modes: { id: ViewMode; label: string; icon: string }[] = [
    { id: 'auto', label: 'Auto Responsive', icon: 'devices' },
    { id: 'mobile', label: 'Mobile App', icon: 'smartphone' },
    { id: 'desktop', label: 'Desktop Web', icon: 'laptop_mac' },
  ];

  return (
    <aside aria-label="Device view switcher" className="fixed top-3 right-4 z-50 flex items-center gap-1 p-1 bg-white/90 backdrop-blur-md rounded-full border border-[#ece8e1] shadow-lg text-[12px] font-sans">
      <span className="sr-only">Viewport Mode Switcher</span>
      {modes.map((m) => {
        const isActive = viewMode === m.id;
        return (
          <button
            key={m.id}
            type="button"
            onClick={() => setViewMode(m.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all cursor-pointer ${
              isActive
                ? 'bg-[#3d3bf3] text-white font-semibold shadow-xs'
                : 'text-[#454556] hover:text-[#1b1c1a] hover:bg-[#f5f3ef]'
            }`}
          >
            <span className="material-symbols-outlined text-[15px]">{m.icon}</span>
            <span className="hidden sm:inline">{m.label}</span>
          </button>
        );
      })}
    </aside>
  );
};
