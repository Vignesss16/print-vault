'use client';

import React from 'react';
import { usePrintVault } from '@/context/PrintVaultContext';
import { userProfile, mockShops } from '@/data/mockData';
import { HomeScreen } from '@/components/screens/HomeScreen';
import { NewPrintJobScreen } from '@/components/screens/NewPrintJobScreen';
import { ShopLinkQrScreen } from '@/components/screens/ShopLinkQrScreen';
import { LiveTrackerScreen } from '@/components/screens/LiveTrackerScreen';
import { VerificationReceiptScreen } from '@/components/screens/VerificationReceiptScreen';
import { ReceiptsListScreen } from '@/components/screens/ReceiptsListScreen';
import { ProfileScreen } from '@/components/screens/ProfileScreen';

export const DesktopWebLayout: React.FC = () => {
  const {
    currentScreen,
    setCurrentScreen,
    activeJob,
    recentPrints,
    viewReceipt,
    countdown,
    formatCountdown,
    triggerToast,
  } = usePrintVault();

  const navLinks = [
    { id: 'home', label: 'Terminal Overview', icon: 'dashboard' },
    { id: 'new_job', label: 'New Secure Print', icon: 'add_circle' },
    { id: 'live_tracker', label: 'Live Tracker', icon: 'sensors' },
    { id: 'receipts_list', label: 'Purge Receipts', icon: 'receipt_long' },
    { id: 'profile', label: 'Hardware Enclave', icon: 'security' },
  ];

  return (
    <div className="min-h-screen bg-[#fbf9f5] text-[#1b1c1a] flex flex-col font-sans">
      {/* Top Desktop Navigation Bar */}
      <header className="sticky top-0 z-40 w-full bg-[#fbf9f5]/92 backdrop-blur-xl border-b border-[#ece8e1] shadow-xs">
        <div className="max-w-[1440px] mx-auto px-8 h-18 flex items-center justify-between">
          {/* Logo & Product Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#3d3bf3] flex items-center justify-center text-white shadow-md shadow-[#3d3bf3]/20">
              <span className="material-symbols-outlined text-[22px]">shield_lock</span>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-heading font-bold text-[20px] text-[#1b1c1a] tracking-tight">
                  PrintVault
                </span>
                <span className="font-mono text-[10px] bg-[#e1e0ff] text-[#07006c] px-2 py-0.5 rounded-full font-semibold">
                  Zero-Store Workstation
                </span>
              </div>
              <span className="font-sans text-[11px] text-[#454556]">
                End-to-End Encrypted Ephemeral Document Rendering
              </span>
            </div>
          </div>

          {/* Desktop Nav Items */}
          <nav className="hidden md:flex items-center gap-1 bg-[#efeeea]/70 p-1.5 rounded-full border border-[#ece8e1]">
            {navLinks.map((item) => {
              const isActive =
                currentScreen === item.id ||
                (item.id === 'receipts_list' && currentScreen === 'receipt') ||
                (item.id === 'live_tracker' && currentScreen === 'shop_qr');
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentScreen(item.id as any)}
                  type="button"
                  className={`flex items-center gap-2 px-4 py-2 rounded-full font-sans text-[13px] font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-white text-[#3d3bf3] shadow-xs'
                      : 'text-[#454556] hover:text-[#1b1c1a] hover:bg-white/50'
                  }`}
                >
                  <span
                    className="material-symbols-outlined text-[17px]"
                    style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}
                  >
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Security Status & User Profile */}
          <div className="flex items-center gap-3">
            <div className="hidden lg:flex items-center gap-2 bg-[#ddf5e6] text-[#0a542a] px-3.5 py-1.5 rounded-full border border-[#b2e5c5] font-mono text-[11px] font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
              <span>Enclave Tier 4 Active</span>
            </div>

            <button
              onClick={() => setCurrentScreen('profile')}
              type="button"
              className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-full bg-white hover:bg-[#f5f3ef] border border-[#ece8e1] shadow-2xs transition-all cursor-pointer"
            >
              <img
                src={userProfile.avatar}
                alt={userProfile.name}
                className="w-7 h-7 rounded-full object-cover"
              />
              <span className="font-heading text-[13px] font-semibold text-[#1b1c1a]">
                {userProfile.name}
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Editorial Metrics Banner */}
      <section className="bg-white border-b border-[#ece8e1] py-3 px-8 hidden md:block">
        <div className="max-w-[1440px] mx-auto flex items-center justify-between text-[12px]">
          <div className="flex items-center gap-6 text-[#454556]">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] text-[#3d3bf3] uppercase tracking-wider font-bold">
                ENCRYPTION
              </span>
              <span className="font-mono font-semibold text-[#1b1c1a]">AES-256-GCM Hardware Sealed</span>
            </div>
            <div className="h-3 w-px bg-[#ece8e1]"></div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] text-[#3d3bf3] uppercase tracking-wider font-bold">
                SHRED PROTOCOL
              </span>
              <span className="font-mono font-semibold text-[#1b1c1a]">DoD 5220.22-M 7-Pass</span>
            </div>
            <div className="h-3 w-px bg-[#ece8e1]"></div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] text-emerald-700 uppercase tracking-wider font-bold">
                CLOUD RETENTION
              </span>
              <span className="font-mono font-semibold text-emerald-800 bg-[#ddf5e6] px-1.5 py-0.5 rounded">
                0 Bytes (Ephemeral)
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {activeJob && (
              <span className="font-mono text-[11px] text-[#3d3bf3] bg-[#e1e0ff] px-2.5 py-0.5 rounded-full font-semibold">
                Active Job: {activeJob.id} ({formatCountdown(countdown)} left)
              </span>
            )}
            <span className="font-sans text-[#454556]">
              Station GPS: MG Road Hub, Bengaluru
            </span>
          </div>
        </div>
      </section>

      {/* Main 3-Column Desktop Grid */}
      <div className="max-w-[1440px] mx-auto w-full px-8 py-8 flex-1 grid grid-cols-12 gap-8 items-start">
        {/* Left Sidebar (Col 1-3: Navigation & Security Status) */}
        <aside className="col-span-12 lg:col-span-3 space-y-6">
          {/* Active Job Quick Terminal Card */}
          {activeJob ? (
            <div className="bg-[#e1e0ff]/40 rounded-3xl p-5 border border-[#c0c1ff] shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <span className="font-mono text-[11px] bg-white text-[#3d3bf3] px-2.5 py-0.5 rounded-full font-bold">
                  ACTIVE PIPELINE
                </span>
                <span className="font-mono text-[12px] font-bold text-[#07006c]">
                  {formatCountdown(countdown)}
                </span>
              </div>
              <h4 className="font-heading font-bold text-[16px] text-[#07006c] truncate">
                {activeJob.fileName}
              </h4>
              <p className="font-sans text-[12px] text-[#454556] mt-0.5">
                {activeJob.shop.name}
              </p>

              <div className="mt-3 p-3 bg-white/80 rounded-2xl border border-white flex items-center justify-between">
                <div>
                  <span className="font-sans text-[10px] text-[#454556] block uppercase tracking-wider">
                    TOKEN
                  </span>
                  <span className="font-mono text-[17px] font-bold text-[#3d3bf3]">
                    {activeJob.token}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard?.writeText(activeJob.token);
                    triggerToast('Token copied to clipboard');
                  }}
                  className="p-1.5 rounded-xl bg-[#f5f3ef] hover:bg-[#efeeea] text-[#1b1c1a] active:scale-90 transition-all"
                >
                  <span className="material-symbols-outlined text-[16px]">content_copy</span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 mt-3">
                <button
                  type="button"
                  onClick={() => setCurrentScreen('shop_qr')}
                  className="py-2 px-3 rounded-xl bg-white text-[#1b1c1a] font-sans text-[12px] font-semibold border border-[#ece8e1] hover:bg-[#fbf9f5] transition-all text-center flex items-center justify-center gap-1"
                >
                  <span className="material-symbols-outlined text-[15px]">qr_code_2</span>
                  <span>View QR</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentScreen('live_tracker')}
                  className="py-2 px-3 rounded-xl bg-[#3d3bf3] text-white font-sans text-[12px] font-semibold hover:bg-[#2e2cd4] transition-all text-center flex items-center justify-center gap-1 shadow-xs"
                >
                  <span className="material-symbols-outlined text-[15px]">sensors</span>
                  <span>Tracker</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-5 border border-[#ece8e1] shadow-xs text-center">
              <div className="w-10 h-10 rounded-2xl bg-[#ddf5e6] text-emerald-800 flex items-center justify-center mx-auto mb-2">
                <span className="material-symbols-outlined text-[20px]">verified</span>
              </div>
              <h4 className="font-heading font-semibold text-[15px] text-[#1b1c1a]">
                Zero Digital Footprint
              </h4>
              <p className="font-sans text-[12px] text-[#454556] mt-1">
                All cloud buffers are clean. Ready for next secure print.
              </p>
            </div>
          )}

          {/* Quick Actions Panel */}
          <div className="bg-white rounded-3xl p-5 border border-[#ece8e1] shadow-xs space-y-3">
            <h4 className="font-heading font-semibold text-[14px] text-[#1b1c1a]">
              Workstation Shortcuts
            </h4>

            <button
              type="button"
              onClick={() => setCurrentScreen('new_job')}
              className="w-full py-2.5 px-4 rounded-2xl bg-[#3d3bf3] text-white font-sans text-[13px] font-semibold flex items-center justify-between shadow-xs hover:bg-[#2e2cd4] transition-all"
            >
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">add_circle</span>
                <span>New Print Pipeline</span>
              </div>
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </button>

            <button
              type="button"
              onClick={() => setCurrentScreen('receipts_list')}
              className="w-full py-2.5 px-4 rounded-2xl bg-[#f5f3ef] hover:bg-[#efeeea] text-[#1b1c1a] font-sans text-[13px] font-medium flex items-center justify-between transition-all"
            >
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-[#454556]">
                  receipt_long
                </span>
                <span>Purge Receipts</span>
              </div>
              <span className="font-mono text-[11px] text-[#454556]">
                {recentPrints.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setCurrentScreen('profile')}
              className="w-full py-2.5 px-4 rounded-2xl bg-[#f5f3ef] hover:bg-[#efeeea] text-[#1b1c1a] font-sans text-[13px] font-medium flex items-center justify-between transition-all"
            >
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-[#454556]">
                  fingerprint
                </span>
                <span>Security Enclave</span>
              </div>
              <span className="material-symbols-outlined text-[16px] text-[#767588]">
                chevron_right
              </span>
            </button>
          </div>

          {/* Privacy Protocol Guarantee Box */}
          <div className="bg-[#fff3c4]/70 rounded-3xl p-4 border border-[#f0e2a2] text-[#443800] space-y-1.5">
            <div className="flex items-center gap-1.5 font-heading text-[13px] font-bold">
              <span className="material-symbols-outlined text-[17px] text-[#5b4a00]">
                shield
              </span>
              <span>Aadhaar Masking Standard</span>
            </div>
            <p className="font-sans text-[11px] leading-relaxed text-[#524400]">
              Compliant with Section 28A of the Aadhaar Act. First 8 digits are masked on-device using WebAssembly before network transmission.
            </p>
          </div>
        </aside>

        {/* Center Workspace (Col 4-9: Main Active Screen Content) */}
        <main className="col-span-12 lg:col-span-6 space-y-6">
          <div className="bg-white rounded-[32px] p-6 lg:p-8 shadow-sm border border-[#ece8e1]">
            {/* Screen switcher */}
            {currentScreen === 'home' && <HomeScreen />}
            {currentScreen === 'new_job' && <NewPrintJobScreen />}
            {currentScreen === 'shop_qr' && <ShopLinkQrScreen />}
            {currentScreen === 'live_tracker' && <LiveTrackerScreen />}
            {currentScreen === 'receipt' && <VerificationReceiptScreen />}
            {currentScreen === 'receipts_list' && <ReceiptsListScreen />}
            {currentScreen === 'profile' && <ProfileScreen />}
          </div>
        </main>

        {/* Right Sidebar (Col 10-12: Kiosks, Audit Stream & Receipts) */}
        <aside className="col-span-12 lg:col-span-3 space-y-6">
          {/* Nearby Certified Print Kiosks */}
          <div className="bg-white rounded-3xl p-5 border border-[#ece8e1] shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-heading font-semibold text-[15px] text-[#1b1c1a]">
                Certified Print Hubs
              </h4>
              <span className="font-mono text-[11px] text-[#3d3bf3] font-semibold bg-[#e1e0ff] px-2 py-0.5 rounded-full">
                Live GPS
              </span>
            </div>

            <div className="space-y-3">
              {mockShops.map((shop) => (
                <div
                  key={shop.id}
                  onClick={() => {
                    triggerToast(`Selected ${shop.name}`);
                  }}
                  className="p-3 rounded-2xl bg-[#f5f3ef]/80 hover:bg-[#efeeea] border border-[#ece8e1] transition-all cursor-pointer group"
                >
                  <div className="flex items-start gap-3">
                    <img
                      src={shop.image}
                      alt={shop.name}
                      className="w-11 h-11 rounded-xl object-cover shrink-0 border border-[#ece8e1]"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <h5 className="font-heading text-[13px] font-bold text-[#1b1c1a] truncate group-hover:text-[#3d3bf3] transition-colors">
                          {shop.name}
                        </h5>
                        <span className="font-mono text-[11px] font-semibold text-[#1e0cde]">
                          {shop.distance}
                        </span>
                      </div>
                      <p className="font-sans text-[11px] text-[#454556] truncate mt-0.5">
                        {shop.location}
                      </p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="inline-flex items-center gap-0.5 bg-white px-1.5 py-0.5 rounded text-[10px] font-bold text-[#1b1c1a] border border-[#ece8e1]">
                          <span className="material-symbols-outlined text-[#e5a000] text-[12px]">
                            star
                          </span>
                          {shop.rating}
                        </span>
                        <span className="font-mono text-[10px] text-[#454556] bg-white px-1.5 py-0.5 rounded border border-[#ece8e1]">
                          {shop.statusBadge}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Real-time Purge Receipts Stream */}
          <div className="bg-white rounded-3xl p-5 border border-[#ece8e1] shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-heading font-semibold text-[14px] text-[#1b1c1a]">
                Purge Receipts Log
              </h4>
              <button
                type="button"
                onClick={() => setCurrentScreen('receipts_list')}
                className="font-sans text-[12px] text-[#3d3bf3] hover:underline font-medium"
              >
                View all
              </button>
            </div>

            <div className="space-y-2">
              {recentPrints.slice(0, 3).map((item) => (
                <div
                  key={item.id}
                  onClick={() => viewReceipt(item)}
                  className="p-2.5 rounded-xl bg-[#fbf9f5] hover:bg-[#f5f3ef] border border-[#ece8e1] transition-all cursor-pointer flex items-center justify-between gap-2"
                >
                  <div className="min-w-0 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[17px] text-[#3d3bf3] shrink-0">
                      verified
                    </span>
                    <div className="min-w-0">
                      <p className="font-sans text-[12px] font-semibold text-[#1b1c1a] truncate">
                        {item.fileName}
                      </p>
                      <p className="font-sans text-[10px] text-[#454556] truncate">
                        {item.shopName} • {item.timestamp}
                      </p>
                    </div>
                  </div>
                  <span className="font-mono text-[10px] font-semibold px-2 py-0.5 bg-[#ddf5e6] text-[#0a542a] rounded shrink-0">
                    Purged
                  </span>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};
