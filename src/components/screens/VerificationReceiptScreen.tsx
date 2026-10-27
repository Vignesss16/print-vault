'use client';

import React from 'react';
import { usePrintVault } from '@/context/PrintVaultContext';
import confetti from 'canvas-confetti';

export const VerificationReceiptScreen: React.FC = () => {
  const { selectedReceipt, setCurrentScreen, triggerToast } = usePrintVault();

  const receipt = selectedReceipt || {
    id: 'PV-8F3K-29XA',
    token: '849 201',
    fileName: 'SBI_Statement_Q3.pdf',
    pageCount: 3,
    colorMode: 'bw' as const,
    shop: {
      name: 'QuickPrint Corner',
      location: 'MG Road, Bengaluru',
    },
    verificationKey: 'e98a...f201',
    createdAt: '10:14 AM',
  };

  const handleCopyId = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(receipt.id);
    }
    triggerToast('Job reference copied to clipboard');
  };

  const handleSaveReceipt = () => {
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.8 },
      colors: ['#3d3bf3', '#ddf5e6', '#ffe6d6', '#e1e0ff'],
    });
    triggerToast('Cryptographic receipt saved as PDF');
  };

  return (
    <div className="flex flex-col w-full gap-5 pb-8 pt-1">
      {/* Status Headline Banner */}
      <div className="flex items-center justify-between bg-[#f5f3ef] px-4 py-2.5 rounded-2xl border border-[#ece8e1]">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-[#1e0cde] animate-ping"></div>
          <span className="font-mono text-[11px] text-[#454556] uppercase tracking-wider font-semibold">
            Audit Log Finalized
          </span>
        </div>
        <span className="font-mono text-[11px] text-[#1e0cde] font-semibold bg-[#e1e0ff] px-2 py-0.5 rounded-full">
          Zero Artifacts
        </span>
      </div>

      {/* Physical Receipt Graphic Module */}
      <div className="relative w-full drop-shadow-md select-none transition-transform duration-200">
        {/* Top Zigzag Torn Edge SVG */}
        <div className="w-full overflow-hidden leading-none -mb-[1px]">
          <svg
            className="w-full h-3 text-white fill-current"
            preserveAspectRatio="none"
            viewBox="0 0 360 12"
          >
            <path d="M0,12 L10,0 L20,12 L30,0 L40,12 L50,0 L60,12 L70,0 L80,12 L90,0 L100,12 L110,0 L120,12 L130,0 L140,12 L150,0 L160,12 L170,0 L180,12 L190,0 L200,12 L210,0 L220,12 L230,0 L240,12 L250,0 L260,12 L270,0 L280,12 L290,0 L300,12 L310,0 L320,12 L330,0 L340,12 L350,0 L360,12 Z"></path>
          </svg>
        </div>

        {/* Paper Body Container */}
        <div className="bg-white px-6 py-6 flex flex-col gap-5 relative border-x border-[#ece8e1]">
          {/* Watermark / Stamp Row */}
          <div className="flex flex-col items-center justify-center gap-1 text-center pt-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#ddf5e6] text-[#0a542a] shadow-xs rotate-[-1deg] border border-[#b2e5c5]">
              <span
                className="material-symbols-outlined text-[17px] text-[#0a542a]"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                verified_user
              </span>
              <span className="font-mono text-[11px] font-bold tracking-wider">
                VERIFIED DELETED
              </span>
            </div>
            <p className="font-mono text-[11px] text-[#454556] pt-1">
              Cryptographic Purge Receipt
            </p>
          </div>

          {/* Job Identifiers Block */}
          <div className="flex flex-col items-center text-center pb-1">
            <span className="font-sans text-[11px] text-[#454556] uppercase tracking-wider font-medium">
              Job Reference
            </span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="font-mono text-[18px] text-[#1b1c1a] font-bold tracking-widest">
                {receipt.id}
              </span>
              <button
                onClick={handleCopyId}
                className="p-1 rounded-lg hover:bg-[#f5f3ef] transition-colors text-[#454556] active:scale-95"
                title="Copy Job ID"
                type="button"
              >
                <span className="material-symbols-outlined text-[16px]">content_copy</span>
              </button>
            </div>
          </div>

          {/* Perforated Cut Line Graphic */}
          <div className="relative flex items-center justify-between -mx-6 py-1">
            <div className="w-4 h-8 bg-[#fbf9f5] rounded-r-full shadow-inner border border-l-0 border-[#ece8e1]"></div>
            <div className="flex-1 border-b-2 border-dashed border-[#c6c4d9] mx-2"></div>
            <div className="w-4 h-8 bg-[#fbf9f5] rounded-l-full shadow-inner border border-r-0 border-[#ece8e1]"></div>
          </div>

          {/* Core Metadata Grid */}
          <div className="grid grid-cols-1 gap-3 bg-[#f5f3ef] p-3.5 rounded-2xl border border-[#ece8e1]">
            <div className="flex items-start gap-2.5">
              <div className="p-2 rounded-xl bg-white text-[#3d3bf3] shrink-0 mt-0.5 shadow-2xs border border-[#ece8e1]">
                <span className="material-symbols-outlined text-[18px]">storefront</span>
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-sans text-[11px] text-[#454556]">Merchant Station</span>
                <span className="font-heading font-semibold text-[14px] text-[#1b1c1a] truncate">
                  {receipt.shop.name}
                </span>
                <span className="font-sans text-[12px] text-[#454556]">
                  {receipt.shop.location || 'MG Road, Bengaluru'}
                </span>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <div className="p-2 rounded-xl bg-white text-[#3d3bf3] shrink-0 mt-0.5 shadow-2xs border border-[#ece8e1]">
                <span className="material-symbols-outlined text-[18px]">description</span>
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-sans text-[11px] text-[#454556]">Source Artifact</span>
                <span className="font-sans font-semibold text-[14px] text-[#1b1c1a] truncate">
                  {receipt.fileName}
                </span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="px-2 py-0.5 bg-white rounded font-mono text-[10px] text-[#454556] border border-[#ece8e1]">
                    {receipt.pageCount} pages
                  </span>
                  <span className="px-2 py-0.5 bg-white rounded font-mono text-[10px] text-[#454556] border border-[#ece8e1]">
                    {receipt.colorMode === 'color' ? 'Full Color' : 'Monochrome (B&W)'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Cryptographic Audit Timeline */}
          <div className="flex flex-col gap-2 pt-1">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[11px] text-[#1b1c1a] uppercase tracking-wider font-semibold">
                Immutable Audit Trail
              </span>
              <span className="font-mono text-[11px] text-[#1e0cde] font-semibold">
                SHA-256 Verified
              </span>
            </div>

            <div className="flex flex-col relative pl-6 before:absolute before:left-2 before:top-2 before:bottom-3 before:w-0.5 before:bg-[#eae8e4]">
              {/* Step 1 */}
              <div className="relative flex items-start gap-2.5 pb-3">
                <div className="absolute -left-6 top-1 w-4 h-4 rounded-full bg-[#e4e1eb] flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-[#3d3bf3]"></div>
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] text-[#454556] font-medium">10:14 AM</span>
                    <span className="font-sans text-[13px] font-semibold text-[#1b1c1a]">
                      Access token granted
                    </span>
                  </div>
                  <span className="font-sans text-[11px] text-[#454556]">
                    Initiated by authenticated customer key
                  </span>
                </div>
              </div>

              {/* Step 2 */}
              <div className="relative flex items-start gap-2.5 pb-3">
                <div className="absolute -left-6 top-1 w-4 h-4 rounded-full bg-[#e4e1eb] flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-[#3d3bf3]"></div>
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] text-[#454556] font-medium">10:16 AM</span>
                    <span className="font-sans text-[13px] font-semibold text-[#1b1c1a]">
                      Document spool executed
                    </span>
                  </div>
                  <span className="font-sans text-[11px] text-[#454556]">
                    Direct spool to Canon iR-ADV (1 copy)
                  </span>
                </div>
              </div>

              {/* Step 3 */}
              <div className="relative flex items-start gap-2.5 pb-3">
                <div className="absolute -left-6 top-1 w-4 h-4 rounded-full bg-[#e4e1eb] flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-[#3d3bf3]"></div>
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] text-[#454556] font-medium">10:18 AM</span>
                    <span className="font-sans text-[13px] font-semibold text-[#1b1c1a]">
                      Access revoked &amp; closed
                    </span>
                  </div>
                  <span className="font-sans text-[11px] text-[#454556]">
                    Tunnel destroyed, TLS session severed
                  </span>
                </div>
              </div>

              {/* Step 4 (Shredded) */}
              <div className="relative flex items-start gap-2.5">
                <div className="absolute -left-6 top-1 w-4 h-4 rounded-full bg-[#3d3bf3] flex items-center justify-center shadow-xs">
                  <span className="material-symbols-outlined text-[11px] text-white font-bold">
                    check
                  </span>
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] text-[#3d3bf3] font-semibold">10:18 AM</span>
                    <span className="font-sans text-[13px] font-semibold text-[#1b1c1a]">
                      Memory &amp; disk shredded
                    </span>
                  </div>
                  <span className="font-sans text-[11px] text-[#454556]">
                    DoD 5220.22-M 7-pass overwrite complete
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Human Integrity Disclaimer Note */}
          <div className="bg-[#f5f3ef] rounded-xl p-3 flex gap-2.5 items-start border border-[#ece8e1]">
            <span className="material-symbols-outlined text-[18px] text-[#5e5d66] shrink-0 mt-0.5">
              info
            </span>
            <p className="font-sans text-[11px] text-[#5e5d66] leading-relaxed">
              We deleted the cloud copy and ended shop access. We cannot control physical paper copies or screen photographs.
            </p>
          </div>

          {/* Digital Signature Stamp Row */}
          <div className="flex items-center justify-between pt-1 border-t border-[#ece8e1]">
            <div className="flex flex-col">
              <span className="font-mono text-[10px] text-[#454556] uppercase tracking-wider font-medium">
                VALIDATION KEY
              </span>
              <span className="font-mono text-[12px] text-[#1b1c1a] font-semibold tracking-wider">
                {receipt.verificationKey || 'e98a...f201'}
              </span>
            </div>
            <div className="w-10 h-10 bg-[#f5f3ef] rounded-lg p-1 flex items-center justify-center border border-[#ece8e1]">
              <svg className="w-8 h-8 text-[#1b1c1a]" fill="currentColor" viewBox="0 0 24 24">
                <path d="M3 3h4v4H3V3zm2 2v0h0zm8-2h4v4h-4V3zm2 2v0h0zM3 13h4v4H3v-4zm2 2v0h0zm12-4h2v2h-2v-2zm-4 4h2v4h-2v-4zm4 0h2v4h-2v-4zm-4-4h2v2h-2v-2zm8 0h2v6h-2v-6zm-2 6h2v2h-2v-2zm-6 2h2v2h-2v-2zm-2-8h2v2h-2v-2z"></path>
              </svg>
            </div>
          </div>
        </div>

        {/* Bottom Zigzag Torn Edge SVG */}
        <div className="w-full overflow-hidden leading-none -mt-[1px]">
          <svg
            className="w-full h-3 text-white fill-current rotate-180"
            preserveAspectRatio="none"
            viewBox="0 0 360 12"
          >
            <path d="M0,12 L10,0 L20,12 L30,0 L40,12 L50,0 L60,12 L70,0 L80,12 L90,0 L100,12 L110,0 L120,12 L130,0 L140,12 L150,0 L160,12 L170,0 L180,12 L190,0 L200,12 L210,0 L220,12 L230,0 L240,12 L250,0 L260,12 L270,0 L280,12 L290,0 L300,12 L310,0 L320,12 L330,0 L340,12 L350,0 L360,12 Z"></path>
          </svg>
        </div>
      </div>

      {/* Primary / Secondary Action Panel */}
      <div className="flex flex-col gap-2.5 pt-1">
        <button
          onClick={handleSaveReceipt}
          className="w-full h-[52px] rounded-full bg-[#3d3bf3] text-white font-sans text-[15px] font-semibold flex items-center justify-center gap-2 hover:bg-[#2e2cd4] active:scale-[0.99] transition-all shadow-md shadow-[#3d3bf3]/20"
          type="button"
        >
          <span className="material-symbols-outlined text-[20px]">download</span>
          <span>Save PDF receipt</span>
        </button>
        <button
          onClick={() => setCurrentScreen('home')}
          className="w-full h-[50px] rounded-full bg-white text-[#1b1c1a] font-sans text-[15px] font-semibold flex items-center justify-center gap-2 hover:bg-[#f5f3ef] active:scale-[0.99] transition-all border border-[#ece8e1] shadow-2xs"
          type="button"
        >
          <span>Done</span>
        </button>
      </div>
    </div>
  );
};
