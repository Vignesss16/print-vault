'use client';

import React from 'react';
import { usePrintVault } from '@/context/PrintVaultContext';

export const Toast: React.FC = () => {
  const { toastMessage } = usePrintVault();

  if (!toastMessage) return null;

  return (
    <div
      className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-[#30312e] text-[#f2f0ed] px-4 py-2.5 rounded-full font-sans text-[13px] font-medium shadow-2xl z-50 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-200 border border-[#454556]/40"
      role="status"
    >
      <span className="material-symbols-outlined text-[17px] text-[#e1e0ff]">
        check_circle
      </span>
      <span>{toastMessage}</span>
    </div>
  );
};
