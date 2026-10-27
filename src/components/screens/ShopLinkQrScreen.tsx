'use client';

import React from 'react';
import { usePrintVault } from '@/context/PrintVaultContext';

export const ShopLinkQrScreen: React.FC = () => {
  const {
    activeJob,
    setCurrentScreen,
    triggerToast,
    countdown,
    formatCountdown,
    revokeActiveJob,
  } = usePrintVault();

  const token = activeJob ? activeJob.id : 'PV-8F3K-29XA';
  const fileName = activeJob ? activeJob.fileName : 'e-Aadhaar_Masked_2025.pdf';
  const pages = activeJob ? activeJob.pageCount : 2;
  const colorText =
    activeJob?.colorMode === 'color' ? 'Full Color' : 'Black & White';

  const handleCopy = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(token);
    }
    triggerToast('Job token copied to clipboard');
  };

  const handleShare = async () => {
    const shareData = {
      title: 'PrintVault Secure Job Token',
      text: `PrintVault One-Time Token: ${token} for ${fileName} at ${activeJob?.shop.name || 'QuickPrint Corner'}. Valid for 10 minutes.`,
      url: window.location.href,
    };

    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
        triggerToast('Shared successfully');
      } catch {
        // User cancelled share
      }
    } else {
      handleCopy();
      triggerToast('Share link copied to clipboard');
    }
  };

  return (
    <div className="flex flex-col w-full pb-10 pt-1">
      {/* Header Text Section */}
      <div className="mb-5 text-center">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 mb-2 rounded-full bg-[#e4e1eb]/60 text-[#1b1b22] border border-[#ece8e1]">
          <span className="w-2 h-2 rounded-full bg-[#3d3bf3] animate-pulse"></span>
          <span className="font-mono text-[11px] uppercase tracking-wider font-semibold">
            One-Time Token
          </span>
        </div>
        <h2 className="font-heading font-bold text-[26px] text-[#1b1c1a] tracking-tight">
          Ready for print
        </h2>
        <p className="font-sans text-[13px] text-[#454556] mt-0.5 max-w-[280px] mx-auto">
          Show this code to the shopkeeper or tap share
        </p>
      </div>

      {/* Central Card with QR & Token */}
      <div className="w-full bg-white rounded-[24px] p-6 shadow-md border border-[#ece8e1] flex flex-col items-center relative overflow-hidden">
        {/* Top pastel category stripe */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#3d3bf3]"></div>

        {/* QR Container with decorative scan framing */}
        <div className="relative w-full max-w-[230px] aspect-square p-4 bg-[#fbf9f5] rounded-2xl flex items-center justify-center my-2 border border-[#ece8e1]/80 shadow-inner group transition-transform active:scale-[0.99]">
          {/* Crisp high-contrast SVG QR Graphic */}
          <svg
            className="w-full h-full text-[#1b1c1a]"
            fill="currentColor"
            viewBox="0 0 160 160"
          >
            {/* Position Detection Pattern: Top-Left */}
            <rect fill="currentColor" height="42" rx="6" width="42" x="10" y="10" />
            <rect fill="#ffffff" height="30" rx="3" width="30" x="16" y="16" />
            <rect fill="currentColor" height="18" rx="2" width="18" x="22" y="22" />

            {/* Position Detection Pattern: Top-Right */}
            <rect fill="currentColor" height="42" rx="6" width="42" x="108" y="10" />
            <rect fill="#ffffff" height="30" rx="3" width="30" x="114" y="16" />
            <rect fill="currentColor" height="18" rx="2" width="18" x="120" y="22" />

            {/* Position Detection Pattern: Bottom-Left */}
            <rect fill="currentColor" height="42" rx="6" width="42" x="10" y="108" />
            <rect fill="#ffffff" height="30" rx="3" width="30" x="16" y="114" />
            <rect fill="currentColor" height="18" rx="2" width="18" x="22" y="120" />

            {/* Timing Patterns & Sync Trackers */}
            <rect height="6" rx="1" width="6" x="58" y="18" />
            <rect height="6" rx="1" width="6" x="70" y="18" />
            <rect height="6" rx="1" width="6" x="82" y="18" />
            <rect height="6" rx="1" width="6" x="94" y="18" />
            <rect height="6" rx="1" width="6" x="18" y="58" />
            <rect height="6" rx="1" width="6" x="18" y="70" />
            <rect height="6" rx="1" width="6" x="18" y="82" />
            <rect height="6" rx="1" width="6" x="18" y="94" />

            {/* QR Payload Blocks */}
            <rect height="10" rx="2" width="10" x="62" y="32" />
            <rect height="6" rx="1" width="6" x="76" y="32" />
            <rect height="8" rx="1.5" width="12" x="86" y="32" />
            <rect height="12" rx="2" width="12" x="36" y="60" />
            <rect height="8" rx="1" width="16" x="54" y="54" />
            <rect height="10" rx="2" width="10" x="74" y="52" />
            <rect height="14" rx="1.5" width="8" x="90" y="56" />
            <rect height="6" rx="1" width="14" x="104" y="60" />
            <rect height="12" rx="2" width="16" x="124" y="58" />
            <rect height="16" rx="1.5" width="8" x="34" y="78" />
            <rect height="12" rx="2" width="14" x="48" y="74" />
            <rect height="8" rx="1" width="18" x="68" y="70" />
            <rect height="14" rx="2" width="10" x="92" y="76" />
            <rect height="14" rx="2" width="14" x="108" y="72" />
            <rect height="8" rx="1" width="12" x="128" y="76" />
            <rect height="6" rx="1" width="14" x="36" y="98" />
            <rect height="12" rx="1.5" width="10" x="56" y="92" />
            <rect height="18" rx="1" width="8" x="72" y="86" />
            <rect height="8" rx="1.5" width="14" x="86" y="96" />
            <rect height="12" rx="1" width="10" x="106" y="92" />
            <rect height="14" rx="2" width="18" x="122" y="90" />
            <rect height="8" rx="1" width="14" x="60" y="112" />
            <rect height="14" rx="1.5" width="8" x="80" y="110" />
            <rect height="8" rx="1" width="12" x="94" y="114" />
            <rect height="12" rx="2" width="14" x="112" y="112" />
            <rect height="14" rx="1.5" width="10" x="132" y="110" />
            <rect height="16" rx="1.5" width="10" x="60" y="126" />
            <rect height="12" rx="2" width="16" x="76" y="130" />
            <rect height="8" rx="1" width="14" x="98" y="128" />
            <rect height="14" rx="1" width="8" x="118" y="130" />
            <rect height="12" rx="2" width="12" x="132" y="132" />

            {/* Center Emblem / Safe Dot */}
            <circle cx="80" cy="80" fill="#3d3bf3" r="8" />
            <circle cx="80" cy="80" fill="#ffffff" r="4.5" />
          </svg>
        </div>

        {/* Live Countdown Module */}
        <div className="mt-3 flex items-center justify-center gap-2 px-3.5 py-1.5 rounded-full bg-[#e1dee8]/70 border border-[#c6c4d9]/50">
          <div className="relative w-4 h-4 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90 text-[#3d3bf3]" viewBox="0 0 24 24">
              <circle
                className="text-[#dbdad6]"
                cx="12"
                cy="12"
                fill="none"
                r="9"
                stroke="currentColor"
                strokeWidth="2.5"
              />
              <circle
                cx="12"
                cy="12"
                fill="none"
                r="9"
                stroke="currentColor"
                strokeDasharray="56.5"
                strokeDashoffset={12 + ((600 - countdown) / 600) * 44}
                strokeLinecap="round"
                strokeWidth="2.5"
              />
            </svg>
          </div>
          <span className="font-sans text-[12px] font-semibold text-[#1b1c1a]">
            Expires in <span className="font-mono text-[13px] text-[#3d3bf3] font-bold">{formatCountdown(countdown)}</span>
          </span>
        </div>

        {/* Monospace Job Token Chip */}
        <div className="mt-4 flex items-center justify-between gap-3 w-full bg-[#f5f3ef] px-4 py-2.5 rounded-2xl border border-[#ece8e1]">
          <div className="flex flex-col">
            <span className="font-sans text-[11px] text-[#454556] leading-none uppercase tracking-wider font-medium">
              Job Token
            </span>
            <span className="font-mono text-[18px] text-[#1b1c1a] font-bold tracking-wider mt-1 select-all">
              {token}
            </span>
          </div>
          <button
            aria-label="Copy Job Token"
            onClick={handleCopy}
            className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-[#1b1c1a] hover:text-[#3d3bf3] active:scale-95 shadow-xs border border-[#ece8e1] transition-all"
            type="button"
          >
            <span className="material-symbols-outlined text-[20px]">content_copy</span>
          </button>
        </div>

        {/* Assurance Reassurance Box */}
        <div className="mt-4 w-full p-3 rounded-xl bg-[#f5f3ef]/80 border border-[#ece8e1]/80 flex items-start gap-2.5 text-left">
          <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center shrink-0 text-[#3d3bf3] mt-0.5 shadow-2xs">
            <span
              className="material-symbols-outlined text-[15px]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              verified_user
            </span>
          </div>
          <p className="font-sans text-[12px] text-[#454556] leading-relaxed">
            The QR holds a one-time key, not your document. The shop never gets a permanent copy.
          </p>
        </div>
      </div>

      {/* Document Meta Summary Preview */}
      <div className="mt-4 px-4 py-3 rounded-2xl bg-white border border-[#ece8e1] shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-[#f5f3ef] flex items-center justify-center text-[#3d3bf3] shrink-0">
            <span className="material-symbols-outlined text-[20px]">description</span>
          </div>
          <div className="min-w-0">
            <p className="font-sans text-[14px] font-semibold text-[#1b1c1a] truncate">
              {fileName}
            </p>
            <p className="font-sans text-[12px] text-[#454556] truncate">
              {pages} Pages • {colorText} • A4
            </p>
          </div>
        </div>
        <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-[#e1dee8] text-[#454556] font-semibold shrink-0">
          Encrypted
        </span>
      </div>

      {/* Bottom Action Area */}
      <div className="mt-6 flex flex-col items-center gap-3 w-full">
        {/* Primary Blue Pill Action Button */}
        <button
          onClick={handleShare}
          className="w-full h-[52px] rounded-full bg-[#3d3bf3] text-white font-sans text-[16px] font-semibold flex items-center justify-center gap-2 hover:bg-[#2e2cd4] transition-all active:scale-[0.98] shadow-md shadow-[#3d3bf3]/20"
          type="button"
        >
          <span className="material-symbols-outlined text-[20px]">share</span>
          <span>Share link</span>
        </button>

        {/* View Live Tracker button */}
        <button
          onClick={() => setCurrentScreen('live_tracker')}
          className="w-full h-[50px] rounded-full bg-white border border-[#ece8e1] text-[#1b1c1a] font-sans text-[15px] font-semibold flex items-center justify-center gap-2 hover:bg-[#fbf9f5] transition-all active:scale-[0.98] shadow-xs"
          type="button"
        >
          <span className="material-symbols-outlined text-[20px] text-[#3d3bf3]">
            sensors
          </span>
          <span>Open live lifecycle tracker</span>
        </button>

        {/* Quiet Secondary Action */}
        <button
          onClick={revokeActiveJob}
          className="h-10 px-6 rounded-full text-[#5e5d66] hover:text-[#ba1a1a] transition-colors font-sans text-[13px] active:opacity-75 flex items-center justify-center gap-1.5"
          type="button"
        >
          <span className="material-symbols-outlined text-[17px]">close</span>
          <span>Cancel print job</span>
        </button>
      </div>
    </div>
  );
};
