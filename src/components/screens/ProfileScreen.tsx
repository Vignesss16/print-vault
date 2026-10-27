'use client';

import React, { useState } from 'react';
import { usePrintVault } from '@/context/PrintVaultContext';
import { userProfile } from '@/data/mockData';

export const ProfileScreen: React.FC = () => {
  const { setCurrentScreen, triggerToast, currentUser, signOut } = usePrintVault();
  const [autoMaskAadhaar, setAutoMaskAadhaar] = useState(true);
  const [autoPurgeSpooler, setAutoPurgeSpooler] = useState(true);

  const name = currentUser?.name || userProfile.name;
  const email = currentUser?.email || userProfile.email;
  const age = currentUser?.age || 24;
  const avatar = currentUser?.avatarUrl || userProfile.avatar;

  return (
    <div className="flex flex-col w-full pb-10 pt-1">
      {/* Profile Card */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#ece8e1] flex items-center gap-4 mb-5">
        <div className="relative">
          <img
            alt={name}
            className="w-16 h-16 rounded-2xl object-cover border border-[#ece8e1]"
            src={avatar}
          />
          <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white"></span>
        </div>
        <div className="flex flex-col min-w-0 flex-1">
          <h2 className="font-heading font-bold text-[18px] text-[#1b1c1a] truncate">
            {name}
          </h2>
          <p className="font-sans text-[13px] text-[#454556] truncate">
            {email} • {age} yrs
          </p>
          <span className="inline-flex items-center gap-1 font-sans text-[11px] text-[#1e0cde] bg-[#e1e0ff] px-2.5 py-0.5 rounded-full mt-1 w-fit font-medium">
            <span className="material-symbols-outlined text-[13px]">verified</span>
            Verified Account
          </span>
        </div>
      </div>

      {/* Security Metrics Grid */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="bg-white rounded-2xl p-3.5 border border-[#ece8e1] shadow-2xs">
          <span className="font-sans text-[11px] text-[#6b6760] block">Print Jobs Completed</span>
          <span className="font-mono text-[22px] font-bold text-[#1b1c1a] mt-0.5 block">
            {userProfile.ephemeralPurgesCompleted}
          </span>
          <span className="font-sans text-[11px] text-emerald-700 font-medium">100% Private</span>
        </div>
        <div className="bg-white rounded-2xl p-3.5 border border-[#ece8e1] shadow-2xs">
          <span className="font-sans text-[11px] text-[#6b6760] block">Pages Printed</span>
          <span className="font-mono text-[22px] font-bold text-[#1b1c1a] mt-0.5 block">
            {userProfile.totalSavedPages}
          </span>
          <span className="font-sans text-[11px] text-[#3d3bf3] font-medium">Encrypted</span>
        </div>
      </div>

      {/* Security & Vault Settings */}
      <div className="bg-white rounded-2xl p-4 border border-[#ece8e1] shadow-sm space-y-4 mb-5">
        <h3 className="font-heading font-semibold text-[15px] text-[#1b1c1a]">
          Privacy Controls
        </h3>

        <div className="flex items-center justify-between">
          <div className="pr-2">
            <p className="font-sans text-[13px] font-semibold text-[#1b1c1a]">
              Aadhaar &amp; National ID Auto-Masking
            </p>
            <p className="font-sans text-[11px] text-[#6b6760]">
              Mask first 8 digits before upload
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer select-none">
            <input
              type="checkbox"
              checked={autoMaskAadhaar}
              onChange={(e) => {
                setAutoMaskAadhaar(e.target.checked);
                triggerToast('Privacy preference updated');
              }}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-[#eae8e4] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#3d3bf3]"></div>
          </label>
        </div>

        <div className="h-px bg-[#ece8e1]"></div>

        <div className="flex items-center justify-between">
          <div className="pr-2">
            <p className="font-sans text-[13px] font-semibold text-[#1b1c1a]">
              Auto-Erase From Printer
            </p>
            <p className="font-sans text-[11px] text-[#6b6760]">
              Erase document from printer memory immediately after printing
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer select-none">
            <input
              type="checkbox"
              checked={autoPurgeSpooler}
              onChange={(e) => {
                setAutoPurgeSpooler(e.target.checked);
                triggerToast('Auto-erase preference updated');
              }}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-[#eae8e4] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#3d3bf3]"></div>
          </label>
        </div>
      </div>

      {/* Hardware Device Identity */}
      <div className="bg-[#f5f3ef] rounded-2xl p-4 border border-[#ece8e1] space-y-2 mb-6">
        <div className="flex items-center justify-between">
          <span className="font-sans text-[12px] text-[#454556]">Device Hardware ID</span>
          <span className="font-mono text-[11px] font-semibold text-[#1b1c1a]">
            SEC-NODE-IND-884
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="font-sans text-[12px] text-[#454556]">Key Rotation Policy</span>
          <span className="font-mono text-[11px] font-semibold text-[#0a542a] bg-[#ddf5e6] px-2 py-0.5 rounded">
            Per-Session Ephemeral
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-2.5">
        <button
          onClick={signOut}
          className="w-full h-[48px] rounded-full bg-[#f5f3ef] hover:bg-[#ffdad6]/60 hover:text-[#ba1a1a] text-[#454556] font-sans text-[14px] font-semibold border border-[#ece8e1] transition-all flex items-center justify-center gap-2 cursor-pointer"
          type="button"
        >
          <span className="material-symbols-outlined text-[18px]">logout</span>
          <span>Sign Out / Switch Customer</span>
        </button>

        <button
          onClick={() => setCurrentScreen('home')}
          className="w-full h-[48px] rounded-full bg-white text-[#1b1c1a] font-sans text-[14px] font-semibold border border-[#ece8e1] hover:bg-[#fbf9f5] transition-all cursor-pointer"
          type="button"
        >
          Back to Home
        </button>
      </div>
    </div>
  );
};
