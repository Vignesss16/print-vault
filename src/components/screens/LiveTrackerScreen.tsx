'use client';

import React, { useState } from 'react';
import { usePrintVault } from '@/context/PrintVaultContext';

export const LiveTrackerScreen: React.FC = () => {
  const {
    activeJob,
    revokeActiveJob,
    completeAndPurgeActiveJob,
    countdown,
    formatCountdown,
    triggerToast,
  } = usePrintVault();

  const [isRevoking, setIsRevoking] = useState(false);
  const [showRevokeConfirm, setShowRevokeConfirm] = useState(false);
  const [currentStep, setCurrentStep] = useState(4); // 1: uploaded, 2: scanned, 3: opened, 4: printing, 5: purged

  const token = activeJob?.id || 'PV-8F3K-29XA';
  const fileName = activeJob?.fileName || 'e-Aadhaar_Masked_2025.pdf';
  const shopName = activeJob?.shop.name || 'QuickPrint Corner';

  const handleCopy = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(token);
    }
    triggerToast('Job code copied to clipboard');
  };

  const handleRevoke = () => {
    setShowRevokeConfirm(false);
    setIsRevoking(true);
    triggerToast('Purging ephemeral decryption keys...');
    setTimeout(() => {
      revokeActiveJob();
      setIsRevoking(false);
    }, 1200);
  };

  const handleSimulateComplete = () => {
    setCurrentStep(5);
    triggerToast('DoD 5220.22-M 7-pass shred complete!');
    setTimeout(() => {
      completeAndPurgeActiveJob();
    }, 1200);
  };

  return (
    <div className="flex flex-col w-full pb-10 pt-1">
      {/* Status & Header Meta */}
      <div className="flex items-center justify-between mt-1 mb-4">
        <div>
          <span className="font-sans text-[12px] text-[#454556] flex items-center gap-1.5 font-medium">
            <span className="inline-block w-2 h-2 rounded-full bg-[#3d3bf3] animate-ping"></span>
            Encrypted Session Active
          </span>
          <h2 className="font-heading font-bold text-[22px] text-[#1b1c1a] tracking-tight mt-0.5">
            Active Print Tracker
          </h2>
        </div>
        <div className="bg-[#e4e1eb] text-[#1b1b22] font-mono text-[12px] px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-xs border border-[#c8c5cf]">
          <span className="material-symbols-outlined text-[16px] text-[#3d3bf3]">
            lock_clock
          </span>
          <span className="font-semibold">{formatCountdown(countdown)} left</span>
        </div>
      </div>

      {/* Document & Kiosk Card */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#ece8e1] mb-4">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-xl bg-[#e1e0ff] flex items-center justify-center text-[#1e0cde] shrink-0">
              <span className="material-symbols-outlined text-[24px]">description</span>
            </div>
            <div className="min-w-0">
              <p className="font-heading font-semibold text-[15px] text-[#1b1c1a] truncate">
                {fileName}
              </p>
              <p className="font-sans text-[12px] text-[#454556] flex items-center gap-1 mt-0.5">
                <span className="material-symbols-outlined text-[14px] text-[#3d3bf3]">
                  storefront
                </span>
                <span className="font-medium text-[#1b1c1a]">{shopName}</span>
              </p>
            </div>
          </div>
          <button
            aria-label="Security details"
            onClick={() => triggerToast('Hardware secure enclave verified')}
            className="w-8 h-8 rounded-full bg-[#f5f3ef] flex items-center justify-center text-[#454556] hover:bg-[#efeeea] transition-colors"
            type="button"
          >
            <span className="material-symbols-outlined text-[18px]">verified_user</span>
          </button>
        </div>

        {/* Job Token Bar */}
        <div className="bg-[#f5f3ef] rounded-xl p-3 flex items-center justify-between border border-[#ece8e1]">
          <div>
            <span className="font-sans text-[10px] text-[#454556] block uppercase tracking-wider font-semibold">
              One-Time Job Code
            </span>
            <span className="font-mono text-[16px] text-[#1e0cde] font-bold tracking-wider">
              {token}
            </span>
          </div>
          <button
            onClick={handleCopy}
            className="px-3 py-1.5 rounded-full bg-white text-[#1b1c1a] font-sans text-[12px] font-semibold flex items-center gap-1 active:scale-95 transition-transform border border-[#ece8e1] shadow-2xs"
            type="button"
          >
            <span className="material-symbols-outlined text-[14px]">content_copy</span>
            <span>Copy</span>
          </button>
        </div>
      </div>

      {/* Live Status Banner (Butter Yellow / Lavender Accent) */}
      <div className="bg-[#fff3c4] text-[#423100] rounded-2xl p-3.5 mb-5 flex items-center gap-3 shadow-xs border border-[#f0e2a2]">
        <div className="relative flex items-center justify-center w-9 h-9 rounded-full bg-[#e9e5ff] text-[#3d3bf3] shrink-0">
          <span className="material-symbols-outlined text-[19px]">visibility</span>
          <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-[#3d3bf3] rounded-full animate-pulse"></span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-heading text-[13px] font-bold text-[#302100]">
            {shopName} is viewing now
          </p>
          <p className="font-sans text-[12px] opacity-80 leading-tight">
            Watermark injected • Download strictly restricted
          </p>
        </div>
      </div>

      {/* Stepper Title */}
      <div className="flex items-center justify-between px-1 mb-2.5">
        <h3 className="font-heading font-semibold text-[16px] text-[#1b1c1a]">
          Lifecycle Verification
        </h3>
        <span className="font-mono text-[11px] text-[#1e0cde] font-bold bg-[#e1e0ff] px-2 py-0.5 rounded-full">
          STEP {currentStep} OF 5
        </span>
      </div>

      {/* Vertical Stepper Container */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#ece8e1] mb-6">
        <div className="relative flex flex-col gap-6">
          {/* Step 1: Uploaded & Encrypted */}
          <div className="flex items-start gap-3.5 relative">
            <div className="relative z-10 w-9 h-9 rounded-full bg-[#ddf5e6] text-[#0a542a] flex items-center justify-center shrink-0 shadow-2xs">
              <span className="material-symbols-outlined text-[18px] font-bold">check</span>
            </div>
            <div className="absolute left-[17px] top-9 w-0.5 h-8 bg-[#ddf5e6]"></div>
            <div className="flex-1 pt-0.5">
              <div className="flex items-baseline justify-between">
                <p className="font-sans text-[14px] font-semibold text-[#1b1c1a]">
                  Uploaded &amp; encrypted
                </p>
                <span className="font-mono text-[11px] text-[#454556]">10:24 AM</span>
              </div>
              <p className="font-sans text-[12px] text-[#454556]">
                256-bit client-side AES key primed
              </p>
            </div>
          </div>

          {/* Step 2: Shop Scanned Code */}
          <div className="flex items-start gap-3.5 relative">
            <div className="relative z-10 w-9 h-9 rounded-full bg-[#ddf5e6] text-[#0a542a] flex items-center justify-center shrink-0 shadow-2xs">
              <span className="material-symbols-outlined text-[18px] font-bold">
                qr_code_scanner
              </span>
            </div>
            <div className="absolute left-[17px] top-9 w-0.5 h-8 bg-[#ddf5e6]"></div>
            <div className="flex-1 pt-0.5">
              <div className="flex items-baseline justify-between">
                <p className="font-sans text-[14px] font-semibold text-[#1b1c1a]">
                  Shop scanned code
                </p>
                <span className="font-mono text-[11px] text-[#454556]">10:26 AM</span>
              </div>
              <p className="font-sans text-[12px] text-[#454556]">
                Kiosk Terminal #04 authenticated
              </p>
            </div>
          </div>

          {/* Step 3: Shop Opened Document */}
          <div className="flex items-start gap-3.5 relative">
            <div className="relative z-10 w-9 h-9 rounded-full bg-[#ddf5e6] text-[#0a542a] flex items-center justify-center shrink-0 shadow-2xs">
              <span className="material-symbols-outlined text-[18px] font-bold">
                lock_open_right
              </span>
            </div>
            <div className="absolute left-[17px] top-9 w-0.5 h-8 bg-[#e9e5ff]"></div>
            <div className="flex-1 pt-0.5">
              <div className="flex items-baseline justify-between">
                <p className="font-sans text-[14px] font-semibold text-[#1b1c1a]">
                  Shop opened document
                </p>
                <span className="font-mono text-[11px] text-[#454556]">10:27 AM</span>
              </div>
              <p className="font-sans text-[12px] text-[#454556]">
                Decrypted in volatile memory buffer
              </p>
            </div>
          </div>

          {/* Step 4: Printing in Progress (Active Pulse Node) */}
          <div className="flex items-start gap-3.5 relative">
            <div
              className={`relative z-10 w-9 h-9 rounded-full flex items-center justify-center shrink-0 shadow-2xs ${
                currentStep >= 5
                  ? 'bg-[#ddf5e6] text-[#0a542a]'
                  : 'bg-[#e9e5ff] text-[#3d3bf3]'
              }`}
            >
              {currentStep >= 5 ? (
                <span className="material-symbols-outlined text-[18px] font-bold">check</span>
              ) : (
                <>
                  <span
                    className="material-symbols-outlined text-[18px] animate-spin"
                    style={{ animationDuration: '4s' }}
                  >
                    print
                  </span>
                  <span className="absolute inset-0 rounded-full bg-[#3d3bf3]/20 animate-ping"></span>
                </>
              )}
            </div>
            <div
              className={`absolute left-[17px] top-9 w-0.5 h-8 ${
                currentStep >= 5 ? 'bg-[#ddf5e6]' : 'bg-[#efeeea]'
              }`}
            ></div>
            <div className="flex-1 pt-0.5">
              <div className="flex items-baseline justify-between">
                <p
                  className={`font-sans text-[14px] font-semibold ${
                    currentStep === 4 ? 'text-[#3d3bf3]' : 'text-[#1b1c1a]'
                  }`}
                >
                  {currentStep >= 5 ? 'Printed successfully' : 'Printing in progress'}
                </p>
                <span className="font-mono text-[11px] text-[#3d3bf3] font-semibold">
                  {currentStep >= 5 ? 'Done' : 'Right now'}
                </span>
              </div>
              <p className="font-sans text-[12px] text-[#454556]">Laser spooling • Page 1 of 1</p>
            </div>
          </div>

          {/* Step 5: Shredded / Purged */}
          <div className="flex items-start gap-3.5 relative">
            <div
              className={`relative z-10 w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                currentStep >= 5
                  ? 'bg-[#ddf5e6] text-[#0a542a]'
                  : 'bg-[#f5f3ef] text-[#5e5d66]'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">auto_delete</span>
            </div>
            <div className="flex-1 pt-0.5">
              <div className="flex items-baseline justify-between">
                <p className="font-sans text-[14px] font-medium text-[#5e5d66]">
                  File deleted &amp; memory shredded
                </p>
                <span className="font-mono text-[11px] text-[#5e5d66] font-medium">
                  {currentStep >= 5 ? 'Purged' : 'Upcoming'}
                </span>
              </div>
              <p className="font-sans text-[12px] text-[#454556]">
                Zero digital footprints retained
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Simulator Shortcut for Demo/Testing */}
      <div className="mb-6 flex justify-center">
        <button
          onClick={handleSimulateComplete}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#ddf5e6] text-[#0a542a] text-[12px] font-mono font-semibold hover:bg-[#cbf0d8] active:scale-95 transition-all border border-[#b2e5c5]"
          type="button"
        >
          <span className="material-symbols-outlined text-[16px]">check_circle</span>
          <span>Simulate Print Done &amp; View Purge Receipt</span>
        </button>
      </div>

      {/* Emergency Control Anchor Zone */}
      <div className="mt-auto pt-2 flex flex-col items-center">
        {showRevokeConfirm ? (
          <div className="w-full bg-[#ffdad6]/60 rounded-2xl p-4 border border-[#ba1a1a]/30 mb-2 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-2 text-[#ba1a1a] mb-2 font-heading font-semibold text-[14px]">
              <span className="material-symbols-outlined text-[20px]">warning</span>
              <span>Confirm Instant Document Revocation?</span>
            </div>
            <p className="font-sans text-[12px] text-[#454556] mb-3">
              This will instantly kill the session tunnel, destroy decryption keys, and purge all printer spooler buffers.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowRevokeConfirm(false)}
                className="flex-1 py-2 rounded-full bg-white text-[#1b1c1a] font-sans text-[13px] font-semibold border border-[#ece8e1]"
                type="button"
              >
                Cancel
              </button>
              <button
                onClick={handleRevoke}
                className="flex-1 py-2 rounded-full bg-[#f0445b] text-white font-sans text-[13px] font-semibold hover:bg-[#d9344a]"
                type="button"
              >
                Yes, Revoke Now
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowRevokeConfirm(true)}
            disabled={isRevoking}
            className="w-full h-[52px] rounded-full bg-[#f0445b] text-white font-sans text-[15px] font-semibold flex items-center justify-center gap-2 shadow-md shadow-[#f0445b]/25 active:scale-[0.98] transition-all hover:bg-[#d9344a]"
            type="button"
          >
            {isRevoking ? (
              <>
                <span className="material-symbols-outlined text-[20px] animate-spin">sync</span>
                <span>Purging Decryption Keys...</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[20px]">emergency_home</span>
                <span>Revoke access immediately</span>
              </>
            )}
          </button>
        )}
        <p className="font-sans text-[12px] text-[#454556] text-center mt-2 max-w-[320px]">
          Destroys the temporary decryption key immediately and clears the spooler cache.
        </p>
      </div>
    </div>
  );
};
