'use client';

import React from 'react';
import { usePrintVault } from '@/context/PrintVaultContext';

export const ReceiptsListScreen: React.FC = () => {
  const { recentPrints, viewReceipt, setCurrentScreen } = usePrintVault();

  return (
    <div className="flex flex-col w-full pb-8 pt-1">
      {/* Header */}
      <div className="mb-4">
        <h2 className="font-heading font-bold text-[24px] text-[#1b1c1a] tracking-tight">
          Cryptographic Receipts
        </h2>
        <p className="font-sans text-[13px] text-[#454556] mt-0.5">
          Immutable audit trails verifying full DoD 5220.22-M memory purges
        </p>
      </div>

      {/* Summary card */}
      <div className="bg-[#ddf5e6]/50 rounded-2xl p-4 border border-[#b2e5c5] flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white text-emerald-800 flex items-center justify-center shadow-2xs">
            <span className="material-symbols-outlined text-[22px]">verified</span>
          </div>
          <div>
            <p className="font-heading text-[14px] font-bold text-[#0a542a]">
              All Sessions Destroyed
            </p>
            <p className="font-sans text-[12px] text-[#0a542a]/80">
              0 active residual files in cloud memory
            </p>
          </div>
        </div>
        <span className="font-mono text-[11px] font-semibold bg-white text-emerald-800 px-2.5 py-1 rounded-full shadow-2xs">
          100% Wipe
        </span>
      </div>

      {/* Receipts list */}
      <div className="space-y-3">
        {recentPrints.map((item) => (
          <div
            key={item.id}
            onClick={() => viewReceipt(item)}
            role="button"
            tabIndex={0}
            className="w-full p-4 rounded-2xl bg-white shadow-sm border border-[#ece8e1] flex items-center justify-between gap-3 hover:border-[#3d3bf3]/40 transition-all cursor-pointer active:scale-[0.99]"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-[#f5f3ef] text-[#3d3bf3] flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[20px]">receipt_long</span>
              </div>
              <div className="min-w-0">
                <p className="font-sans text-[14px] font-semibold text-[#1b1c1a] truncate">
                  {item.fileName}
                </p>
                <p className="font-sans text-[12px] text-[#454556] truncate">
                  {item.shopName} • {item.pageCount} pgs • {item.timestamp}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="font-mono text-[11px] font-semibold bg-[#ddf5e6] text-[#0a542a] px-2.5 py-0.5 rounded-full">
                Purged
              </span>
              <span className="material-symbols-outlined text-[16px] text-[#767588]">
                chevron_right
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 text-center">
        <button
          onClick={() => setCurrentScreen('home')}
          className="text-[#3d3bf3] font-sans text-[13px] font-semibold hover:underline"
          type="button"
        >
          ← Return to Home
        </button>
      </div>
    </div>
  );
};
