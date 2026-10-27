'use client';

import React from 'react';
import { usePrintVault } from '@/context/PrintVaultContext';

export const ShopkeeperDashboardScreen: React.FC = () => {
  const {
    currentShopkeeper,
    shopkeeperSignOut,
    activeChatSession,
    acceptChatRequest,
    declineChatRequest,
    setCurrentScreen,
    setAppRole,
    triggerToast,
    initiateChatWithShop,
  } = usePrintVault();

  const shopName = currentShopkeeper?.shopName || 'QuickPrint Corner & Xerox';
  const operatorName = currentShopkeeper?.operatorName || 'Mohan Kumar';
  const printerModel = currentShopkeeper?.printerModel || 'Canon imageRUNNER ADVANCE C5560i';

  // Check if there is an active session for this shop
  const hasPendingRequest = activeChatSession && activeChatSession.status === 'pending';
  const hasAcceptedChat = activeChatSession && activeChatSession.status === 'accepted';

  const simulateIncomingRequest = () => {
    // If no active session, initiate one from Tanishq Mudaliyar
    if (!activeChatSession) {
      initiateChatWithShop({
        id: currentShopkeeper?.shopId || 'shop-1',
        name: shopName,
        distance: '120m away',
        location: currentShopkeeper?.location || 'MG Road, Bengaluru',
        rating: 4.9,
        jobsCount: '340+ jobs today',
        statusBadge: 'Ready to pick',
        image: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=300&q=80',
        lat: 12.9723,
        lng: 77.5952,
        operatorName,
        pricePerBw: 2.0,
        pricePerColor: 5.0,
        printerModel,
        isOnline: true,
      });
      triggerToast('Simulated new incoming request from customer Tanishq Mudaliyar!');
    } else {
      triggerToast('A request or chat session is already active!');
    }
  };

  return (
    <div className="flex flex-col w-full pb-8 pt-1">
      {/* Top Operator Terminal Banner */}
      <div className="bg-[#07006c] text-white rounded-3xl p-5 shadow-md mb-5 border border-[#1b1c7d]">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-white border border-white/20">
              <span className="material-symbols-outlined text-[26px]">storefront</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-heading font-bold text-[18px] tracking-tight leading-tight">
                  {shopName}
                </h2>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
              </div>
              <p className="font-sans text-[12px] text-white/80 mt-0.5">
                Operator: <strong className="text-white">{operatorName}</strong>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={shopkeeperSignOut}
            className="px-3 py-1.5 rounded-full bg-white/15 hover:bg-white/25 text-white font-sans text-[11px] font-semibold border border-white/20 transition-all cursor-pointer"
          >
            Sign Out
          </button>
        </div>

        {/* Hardware Status Strip */}
        <div className="p-3 bg-white/10 rounded-2xl border border-white/10 flex items-center justify-between text-[11px]">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[17px] text-emerald-400">print</span>
            <span className="font-sans font-medium">{printerModel}</span>
          </div>
          <span className="font-sans text-emerald-300 font-semibold bg-emerald-950/40 px-2 py-0.5 rounded">
            Printer Ready
          </span>
        </div>

        {/* Real-time stats */}
        <div className="grid grid-cols-2 gap-3 mt-3 pt-3 border-t border-white/15 text-center">
          <div>
            <span className="font-sans text-[10px] text-white/70 block uppercase tracking-wider">
              Jobs Today
            </span>
            <span className="font-mono text-[20px] font-bold text-white">42</span>
          </div>
          <div>
            <span className="font-sans text-[10px] text-white/70 block uppercase tracking-wide">
              Today&apos;s Revenue
            </span>
            <span className="font-mono text-[20px] font-bold text-emerald-300">₹1,280</span>
          </div>
        </div>
      </div>

      {/* SECTION 1: INCOMING PRINT REQUESTS QUEUE */}
      <section className="mb-6 space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <h3 className="font-heading font-bold text-[17px] text-[#1b1c1a] tracking-tight">
              Incoming Customer Requests
            </h3>
            {hasPendingRequest && (
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
            )}
          </div>
          <span className="font-mono text-[11px] font-semibold bg-[#ffe8d6] text-[#8a3800] px-2.5 py-0.5 rounded-full">
            {hasPendingRequest ? '1 Pending' : '0 Pending'}
          </span>
        </div>

        {hasPendingRequest ? (
          /* Active Incoming Request from Customer (e.g. Tanishq Mudaliyar) */
          <div className="p-5 rounded-3xl bg-white border-2 border-amber-400 shadow-md space-y-4 animate-in fade-in duration-200">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-[#e1e0ff] text-[#3d3bf3] flex items-center justify-center font-bold text-[18px]">
                  {activeChatSession.customer.name.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-heading font-bold text-[16px] text-[#1b1c1a]">
                      {activeChatSession.customer.name}
                    </h4>
                    <span className="font-mono text-[10px] bg-[#e1e0ff] text-[#07006c] px-2 py-0.2 rounded-full font-semibold">
                      New Customer
                    </span>
                  </div>
                  <p className="font-sans text-[12px] text-[#454556] mt-0.5">
                    {activeChatSession.customer.email} • 120m away • Just now
                  </p>
                </div>
              </div>

              <span className="font-mono text-[11px] text-amber-700 bg-[#fff3c4] px-2.5 py-1 rounded-full font-bold">
                Awaiting Response
              </span>
            </div>

            <div className="p-3 bg-[#fbf9f5] rounded-2xl border border-[#ece8e1] flex items-center justify-between text-[12px]">
              <div className="flex items-center gap-2 text-[#454556]">
                <span className="material-symbols-outlined text-[17px] text-[#3d3bf3]">
                  near_me
                </span>
                <span>Customer waiting for print</span>
              </div>
              <span className="font-sans text-[11px] text-[#6b6760]">120m away</span>
            </div>

            {/* Accept / Decline Action Buttons */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <button
                type="button"
                onClick={() => {
                  acceptChatRequest();
                  setCurrentScreen('chat');
                  triggerToast(`Accepted request from ${activeChatSession.customer.name}!`);
                }}
                className="w-full py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-sans text-[14px] font-semibold flex items-center justify-center gap-2 shadow-md shadow-emerald-600/25 active:scale-98 transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">check_circle</span>
                <span>Accept &amp; Open Chat</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  declineChatRequest();
                  triggerToast('Declined customer connection request.');
                }}
                className="w-full py-3 px-4 rounded-2xl bg-white hover:bg-[#ffebee] text-[#ba1a1a] font-sans text-[14px] font-semibold border border-[#ffcdd2] flex items-center justify-center gap-2 active:scale-98 transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">cancel</span>
                <span>Decline</span>
              </button>
            </div>
          </div>
        ) : (
          /* Empty Queue State with Simulation Trigger */
          <div className="p-6 rounded-3xl bg-white border border-[#ece8e1] shadow-xs text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-[#f5f3ef] text-[#767588] flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-[24px]">inbox</span>
            </div>
            <h4 className="font-heading font-semibold text-[15px] text-[#1b1c1a]">
              No Incoming Requests Right Now
            </h4>
            <p className="font-sans text-[12px] text-[#6b6760] max-w-[300px] mx-auto">
              Your shop is visible to nearby customers. New print requests will appear here instantly.
            </p>

            <button
              type="button"
              onClick={simulateIncomingRequest}
              className="mt-2 px-4 py-2 rounded-full bg-[#e1e0ff] hover:bg-[#d4d2ff] text-[#07006c] font-sans text-[12px] font-medium transition-all inline-flex items-center gap-1.5 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">bolt</span>
              <span>Simulate Customer Request (Tanishq)</span>
            </button>
          </div>
        )}
      </section>

      {/* SECTION 2: ACTIVE CUSTOMER CHAT ROOMS */}
      <section className="mb-6 space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="font-heading font-bold text-[17px] text-[#1b1c1a] tracking-tight">
            Active Customer Chat Sessions
          </h3>
          <span className="font-mono text-[11px] text-[#07006c] font-semibold bg-[#e1e0ff] px-2.5 py-0.5 rounded-full">
            {hasAcceptedChat ? '1 Active' : '0 Active'}
          </span>
        </div>

        {hasAcceptedChat ? (
          <div
            onClick={() => setCurrentScreen('chat')}
            className="p-4 rounded-3xl bg-white border border-[#ece8e1] hover:border-[#3d3bf3] shadow-xs flex items-center justify-between gap-3 transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-11 h-11 rounded-2xl bg-[#ddf5e6] text-[#0a542a] flex items-center justify-center font-bold text-[16px] shrink-0">
                {activeChatSession.customer.name.charAt(0)}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="font-heading font-bold text-[14px] text-[#1b1c1a] truncate group-hover:text-[#3d3bf3] transition-colors">
                    {activeChatSession.customer.name}
                  </h4>
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                </div>
                <p className="font-sans text-[11px] text-[#454556] truncate mt-0.5">
                  {activeChatSession.messages[activeChatSession.messages.length - 1]?.text ||
                    'Ready to receive documents'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <span className="px-3 py-1.5 rounded-xl bg-[#3d3bf3] text-white text-[12px] font-sans font-semibold group-hover:bg-[#2e2cd4] transition-all flex items-center gap-1">
                <span className="material-symbols-outlined text-[15px]">chat</span>
                <span>Open Chat</span>
              </span>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-[#f5f3ef] border border-[#ece8e1] text-center text-[#767588] text-[12px]">
            Accepted requests will establish a direct ephemeral chat here where customer documents are received and printed.
          </div>
        )}
      </section>

      {/* Switch to Customer Portal Mode */}
      <div className="pt-2 text-center">
        <button
          type="button"
          onClick={() => {
            setAppRole('customer');
            setCurrentScreen('home');
          }}
          className="text-[#454556] hover:text-[#3d3bf3] font-sans text-[13px] font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <span className="material-symbols-outlined text-[18px]">swap_horiz</span>
          <span>Switch back to Customer Portal</span>
        </button>
      </div>
    </div>
  );
};
