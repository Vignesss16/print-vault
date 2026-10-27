'use client';

import React from 'react';
import { usePrintVault } from '@/context/PrintVaultContext';

export const HomeScreen: React.FC = () => {
  const {
    activeJob,
    setCurrentScreen,
    recentPrints,
    viewReceipt,
    countdown,
    formatCountdown,
  } = usePrintVault();

  return (
    <div className="flex flex-col w-full">
      {/* Greeting Banner */}
      <div className="pt-2 pb-5 flex flex-col gap-1">
        <h1 className="font-heading font-bold text-[28px] text-[#1b1c1a] tracking-tight leading-tight">
          Good morning, Rohan
        </h1>
        <p className="font-sans text-[14px] text-[#454556]">
          Ready to print ephemeral documents securely
        </p>
      </div>

      {/* Active Print Job Card (Hero) */}
      {activeJob ? (
        <section className="w-full relative overflow-hidden rounded-[24px] bg-[#e1e0ff] p-5 shadow-sm text-[#07006c] mb-6 border border-[#c0c1ff]/60 transition-all hover:shadow-md">
          {/* Header pill status */}
          <div className="flex items-center justify-between gap-2 mb-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/80 text-[#3d3bf3] shadow-xs">
              <span className="w-2 h-2 rounded-full bg-[#3d3bf3] animate-pulse"></span>
              <span className="font-mono text-[11px] font-semibold tracking-wide">
                1 active print job
              </span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/90 text-[#454556] font-mono text-[11px] shadow-xs">
              <span className="material-symbols-outlined text-[15px] text-[#3d3bf3]">
                timer
              </span>
              <span className="font-semibold text-[#1b1c1a]">
                {formatCountdown(countdown)} left
              </span>
            </div>
          </div>

          {/* Document File details */}
          <div className="flex items-start gap-3.5 mb-5">
            <div className="w-11 h-11 rounded-2xl bg-white flex items-center justify-center text-[#3d3bf3] shadow-xs shrink-0">
              <span className="material-symbols-outlined text-[24px]">description</span>
            </div>
            <div className="flex flex-col min-w-0 pr-1">
              <span className="font-heading font-semibold text-[17px] text-[#07006c] truncate">
                {activeJob.fileName}
              </span>
              <div className="flex items-center gap-1.5 text-[#454556] mt-0.5">
                <span className="material-symbols-outlined text-[15px] shrink-0 text-[#3d3bf3]">
                  storefront
                </span>
                <span className="font-sans text-[13px] truncate">
                  {activeJob.shop.name}
                </span>
              </div>
            </div>
          </div>

          {/* Token & Self-destruct specs container */}
          <div className="bg-white/75 backdrop-blur-xs rounded-2xl p-3.5 mb-4 flex items-center justify-between border border-white/50">
            <div className="flex flex-col">
              <span className="font-sans text-[11px] text-[#454556] uppercase tracking-wider font-medium">
                One-Time Token
              </span>
              <span className="font-mono text-[19px] text-[#3d3bf3] tracking-widest font-bold">
                {activeJob.token}
              </span>
            </div>
            <div className="h-8 w-px bg-[#c6c4d9]/50"></div>
            <div className="flex flex-col items-end">
              <span className="font-sans text-[11px] text-[#454556] uppercase tracking-wider font-medium">
                Self-Destruct
              </span>
              <span className="font-mono text-[12px] text-[#1b1c1a] font-semibold flex items-center gap-1 mt-0.5">
                <span className="material-symbols-outlined text-[14px] text-[#3d3bf3]">
                  lock_clock
                </span>
                Post-render shred
              </span>
            </div>
          </div>

          {/* Bottom Card Controls */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-1.5 text-[#454556]">
              <span className="material-symbols-outlined text-[16px] text-emerald-700">
                verified_user
              </span>
              <span className="font-sans text-[12px] font-medium">Zero-store vault</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentScreen('shop_qr')}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-white/70 text-[#1b1c1a] font-sans text-[13px] font-medium shadow-xs hover:bg-white active:scale-95 transition-all"
                type="button"
                title="View QR Code"
              >
                <span className="material-symbols-outlined text-[16px]">qr_code_2</span>
                <span>QR</span>
              </button>
              <button
                onClick={() => setCurrentScreen('live_tracker')}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white text-[#1b1c1a] font-sans text-[13px] font-semibold shadow-xs hover:bg-[#fbf9f5] active:scale-95 transition-all"
                type="button"
              >
                <span>Track live</span>
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </button>
            </div>
          </div>
        </section>
      ) : (
        <section className="w-full rounded-[24px] bg-white p-6 shadow-sm border border-[#ece8e1] mb-6 text-center">
          <div className="w-12 h-12 rounded-full bg-[#f5f3ef] text-[#3d3bf3] flex items-center justify-center mx-auto mb-3">
            <span className="material-symbols-outlined text-[24px]">verified</span>
          </div>
          <h3 className="font-heading font-semibold text-[17px] text-[#1b1c1a]">
            Vault is Idle & Purged
          </h3>
          <p className="font-sans text-[13px] text-[#454556] mt-1 max-w-[280px] mx-auto">
            All previous ephemeral jobs have been safely erased. Ready to prepare your next secure print job.
          </p>
        </section>
      )}

      {/* Main CTA: New Secure Print */}
      <div className="w-full mb-8">
        <button
          onClick={() => setCurrentScreen('new_job')}
          className="w-full h-[52px] rounded-full bg-[#3d3bf3] text-white font-sans text-[16px] font-semibold flex items-center justify-center gap-2 shadow-md shadow-[#3d3bf3]/25 hover:bg-[#2e2cd4] active:scale-[0.98] transition-all"
          type="button"
        >
          <span className="material-symbols-outlined text-[22px]">add</span>
          <span>New secure print</span>
        </button>
      </div>

      {/* Recent Prints Section */}
      <section className="w-full flex flex-col gap-3">
        <div className="flex items-center justify-between px-0.5">
          <h2 className="font-heading font-semibold text-[18px] text-[#1b1c1a] tracking-tight">
            Recent prints
          </h2>
          <span className="font-sans text-[12px] text-[#454556]">
            Archived receipts
          </span>
        </div>

        <div className="flex flex-col gap-3">
          {recentPrints.map((item) => (
            <div
              key={item.id}
              onClick={() => viewReceipt(item)}
              role="button"
              tabIndex={0}
              className="w-full p-4 rounded-[20px] bg-white shadow-sm border border-[#ece8e1] flex items-center justify-between gap-3 transition-all hover:border-[#3d3bf3]/40 hover:shadow active:scale-[0.99] cursor-pointer"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    item.status === 'Done'
                      ? 'bg-[#ddf5e6] text-[#174e2b]'
                      : 'bg-[#f5f3ef] text-[#454556]'
                  }`}
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {item.status === 'Done' ? 'task_alt' : 'lock'}
                  </span>
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="font-sans text-[14px] font-semibold text-[#1b1c1a] truncate">
                    {item.fileName}
                  </span>
                  <span className="font-sans text-[12px] text-[#454556] truncate">
                    {item.shopName} · {item.timestamp}
                  </span>
                </div>
              </div>

              <div className="shrink-0 flex items-center gap-1.5">
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full font-mono text-[11px] font-semibold ${
                    item.status === 'Done'
                      ? 'bg-[#ddf5e6] text-[#174e2b]'
                      : 'bg-[#e1dee8] text-[#63626a]'
                  }`}
                >
                  {item.status}
                </span>
                <span className="material-symbols-outlined text-[16px] text-[#767588]">
                  chevron_right
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Ephemeral Trust Footnote */}
      <div className="mt-8 mb-4 flex items-center justify-center gap-2 text-[#454556]/80">
        <span className="material-symbols-outlined text-[16px] text-emerald-600">
          verified
        </span>
        <span className="font-mono text-[11px] text-center">
          End-to-end encrypted · Auto memory wipe
        </span>
      </div>
    </div>
  );
};
