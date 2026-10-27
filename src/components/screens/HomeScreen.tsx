'use client';

import React from 'react';
import Link from 'next/link';
import { usePrintVault } from '@/context/PrintVaultContext';
import { NearbyXeroxMap } from '@/components/common/NearbyXeroxMap';
import { mockShops } from '@/data/mockData';

export const HomeScreen: React.FC = () => {
  const {
    activeJob,
    setCurrentScreen,
    countdown,
    formatCountdown,
    currentUser,
    userLocation,
    isFetchingLocation,
    fetchUserLocation,
    initiateChatWithShop,
  } = usePrintVault();

  const customerName = currentUser?.name || 'Tanishq Mudaliyar';
  const customerFirstName = customerName.split(' ')[0];

  return (
    <div className="flex flex-col w-full pb-8">
      {/* Greeting Banner */}
      <div className="pt-1 pb-4 flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <h1 className="font-heading font-bold text-[24px] text-[#1b1c1a] tracking-tight leading-tight">
            Hello, {customerFirstName}
          </h1>
          <span className="font-sans text-[11px] bg-[#e1e0ff] text-[#07006c] px-3 py-1 rounded-full font-medium">
            Active
          </span>
        </div>
        <p className="font-sans text-[13px] text-[#6b6760]">
          Find nearby Xerox shops and send documents directly to print.
        </p>
      </div>

      {/* Featured WhatsApp Ordering Demo Card */}
      <section className="w-full mb-5 rounded-2xl bg-gradient-to-r from-[#00a884] to-[#075e54] p-4 text-white shadow-md relative overflow-hidden">
        <div className="flex items-start justify-between gap-3 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white text-2xl shrink-0">
              💬
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-heading font-bold text-[15px] text-white tracking-tight">
                  Sai Xerox WhatsApp Demo
                </span>
                <span className="text-[9px] bg-amber-300 text-black px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
                  Simulation
                </span>
              </div>
              <p className="font-sans text-[12px] text-emerald-100 mt-0.5">
                Order prints directly through WhatsApp with Zero Data Leakage.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-white/20 flex items-center justify-between relative z-10">
          <span className="text-[11px] text-emerald-100 flex items-center gap-1">
            <span>🛡️</span>
            <span>No files sent over chat</span>
          </span>
          <Link
            href="/demo/whatsapp"
            className="px-4 py-1.5 rounded-xl bg-white text-[#075e54] font-heading font-bold text-[12px] hover:bg-emerald-50 active:scale-95 transition-all shadow-xs inline-flex items-center gap-1.5"
          >
            <span>Try WhatsApp Demo</span>
            <span>→</span>
          </Link>
        </div>
      </section>

      {/* Active Print Job Banner (If active) */}
      {activeJob && (
        <section className="w-full relative overflow-hidden rounded-2xl bg-[#e1e0ff]/70 p-4 shadow-xs text-[#07006c] mb-6 border border-[#c0c1ff]">
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white text-[#3d3bf3] text-[11px] font-medium shadow-xs">
              <span className="w-2 h-2 rounded-full bg-[#3d3bf3] animate-pulse"></span>
              <span>1 active print job</span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white text-[#1b1c1a] text-[11px] font-medium shadow-xs">
              <span className="material-symbols-outlined text-[14px] text-[#3d3bf3]">timer</span>
              <span>{formatCountdown(countdown)} left</span>
            </div>
          </div>

          <div className="flex items-start gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-[#3d3bf3] shadow-xs shrink-0">
              <span className="material-symbols-outlined text-[22px]">description</span>
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-heading font-semibold text-[15px] text-[#07006c] truncate">
                {activeJob.fileName}
              </span>
              <span className="font-sans text-[12px] text-[#454556] truncate">
                {activeJob.shop.name}
              </span>
            </div>
          </div>

          <div className="bg-white/80 rounded-xl p-3 flex items-center justify-between border border-white">
            <div>
              <span className="font-sans text-[10px] text-[#6b6760] uppercase tracking-wide font-medium block">
                Pickup PIN
              </span>
              <span className="font-mono text-[17px] text-[#3d3bf3] font-bold tracking-wider">
                {activeJob.token}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentScreen('shop_qr')}
                className="px-3 py-1.5 rounded-lg bg-white text-[#1b1c1a] font-sans text-[12px] font-medium border border-[#ece8e1] hover:bg-[#fbf9f5] cursor-pointer"
                type="button"
              >
                QR Code
              </button>
              <button
                onClick={() => setCurrentScreen('live_tracker')}
                className="px-3 py-1.5 rounded-lg bg-[#3d3bf3] text-white font-sans text-[12px] font-medium hover:bg-[#2e2cd4] cursor-pointer shadow-xs"
                type="button"
              >
                Status
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Find Location & Map */}
      {!userLocation ? (
        <section className="w-full rounded-2xl bg-gradient-to-b from-white to-[#fbf9f5] p-6 shadow-xs border border-[#ece8e1] mb-6 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-[#e1e0ff] text-[#3d3bf3] flex items-center justify-center mx-auto">
            <span className="material-symbols-outlined text-[28px]">
              near_me
            </span>
          </div>

          <div className="max-w-[340px] mx-auto space-y-1.5">
            <h3 className="font-heading font-semibold text-[18px] text-[#1b1c1a] tracking-tight">
              Find Xerox Shops Near You
            </h3>
            <p className="font-sans text-[13px] text-[#6b6760] leading-relaxed">
              Locate certified print shops in your area, view live pricing, and send documents directly.
            </p>
          </div>

          <button
            type="button"
            onClick={fetchUserLocation}
            disabled={isFetchingLocation}
            className="w-full h-12 rounded-xl bg-[#3d3bf3] hover:bg-[#2e2cd4] text-white font-sans text-[14px] font-semibold flex items-center justify-center gap-2 shadow-xs active:scale-[0.99] transition-all cursor-pointer disabled:opacity-75"
          >
            {isFetchingLocation ? (
              <>
                <span className="material-symbols-outlined text-[18px] animate-spin">sync</span>
                <span>Locating shops nearby...</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[18px]">location_on</span>
                <span>Find Nearby Shops</span>
              </>
            )}
          </button>

          <p className="font-sans text-[11px] text-[#8a8780]">
            Your location is only used to show nearby stores.
          </p>
        </section>
      ) : (
        <section className="w-full mb-6 space-y-3">
          <div className="flex items-center justify-between px-1">
            <div>
              <h2 className="font-heading font-semibold text-[17px] text-[#1b1c1a] tracking-tight">
                Nearby Print Shops
              </h2>
              <p className="font-sans text-[12px] text-[#6b6760]">
                Select a store to connect and send your print file
              </p>
            </div>
            <button
              type="button"
              onClick={fetchUserLocation}
              disabled={isFetchingLocation}
              className="px-3 py-1.5 rounded-full bg-white hover:bg-[#f5f3ef] border border-[#ece8e1] text-[#3d3bf3] font-sans text-[11px] font-medium flex items-center gap-1 shadow-2xs cursor-pointer disabled:opacity-50"
            >
              <span className={`material-symbols-outlined text-[14px] ${isFetchingLocation ? 'animate-spin' : ''}`}>
                sync
              </span>
              <span>Update</span>
            </button>
          </div>

          <NearbyXeroxMap />
        </section>
      )}

      {/* Stores List */}
      <section className="w-full space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="font-heading font-semibold text-[17px] text-[#1b1c1a] tracking-tight">
            Print Shops ({mockShops.length})
          </h2>
          <span className="font-sans text-[11px] text-[#3d3bf3] font-medium bg-[#e1e0ff] px-2.5 py-0.5 rounded-full">
            Within 1 km
          </span>
        </div>

        <div className="space-y-3">
          {mockShops.map((shop) => (
            <div
              key={shop.id}
              className="p-4 rounded-2xl bg-white border border-[#ece8e1] shadow-2xs hover:border-[#3d3bf3]/40 transition-all"
            >
              <div className="flex items-start gap-3.5">
                <img
                  src={shop.image}
                  alt={shop.name}
                  className="w-13 h-13 rounded-xl object-cover shrink-0 border border-[#ece8e1]"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <h3 className="font-heading font-semibold text-[14px] text-[#1b1c1a] truncate">
                      {shop.name}
                    </h3>
                    <span className="font-sans text-[11px] font-medium text-[#1e0cde] bg-[#e1e0ff] px-2 py-0.5 rounded-md shrink-0">
                      {shop.distance}
                    </span>
                  </div>

                  <p className="font-sans text-[12px] text-[#6b6760] truncate mt-0.5">
                    {shop.operatorName} • {shop.location}
                  </p>

                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <span className="inline-flex items-center gap-0.5 bg-[#fbf9f5] px-2 py-0.5 rounded-md text-[11px] font-semibold text-[#1b1c1a] border border-[#ece8e1]">
                      <span className="material-symbols-outlined text-[#e5a000] text-[13px]">star</span>
                      {shop.rating}
                    </span>

                    <span className="font-sans text-[11px] text-[#0a542a] bg-[#ddf5e6] px-2 py-0.5 rounded-md font-medium">
                      ₹{shop.pricePerBw || 2}/page B&amp;W
                    </span>

                    <span className="font-sans text-[11px] text-[#454556] bg-[#f5f3ef] px-2 py-0.5 rounded-md">
                      {shop.statusBadge}
                    </span>
                  </div>

                  <div className="mt-3 pt-3 border-t border-[#ece8e1] flex items-center justify-between">
                    <span className="font-sans text-[11px] text-[#8a8780]">
                      {shop.printerModel?.split(' ')[0] || 'Canon'} Laser Printer
                    </span>

                    <button
                      type="button"
                      onClick={() => initiateChatWithShop(shop)}
                      className="px-3.5 py-1.5 rounded-xl bg-[#3d3bf3] hover:bg-[#2e2cd4] text-white font-sans text-[12px] font-semibold flex items-center gap-1.5 shadow-2xs active:scale-95 transition-all cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[15px]">chat</span>
                      <span>Chat &amp; Print</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
