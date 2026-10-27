'use client';

import React, { useState } from 'react';
import { usePrintVault } from '@/context/PrintVaultContext';
import { mockShops } from '@/data/mockData';
import { PrintShop } from '@/types/printvault';

export const NearbyXeroxMap: React.FC = () => {
  const { userLocation, initiateChatWithShop, fetchUserLocation, isFetchingLocation } = usePrintVault();
  const [selectedShop, setSelectedShop] = useState<PrintShop | null>(mockShops[0]);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [filterMode, setFilterMode] = useState<'all' | 'open' | 'fast'>('all');

  // Relative pin coordinates within the SVG canvas (Center = 240, 160)
  const shopPinPositions: Record<string, { x: number; y: number }> = {
    'shop-1': { x: 285, y: 130 }, // 120m North-East
    'shop-2': { x: 345, y: 95 },  // 350m Far North-East
    'shop-3': { x: 165, y: 220 }, // 500m South-West
    'shop-4': { x: 330, y: 235 }, // 850m South-East
  };

  const filteredShops = mockShops.filter((shop) => {
    if (filterMode === 'open') return shop.isOnline;
    if (filterMode === 'fast') return shop.statusBadge.toLowerCase().includes('fast') || shop.statusBadge.toLowerCase().includes('ready');
    return true;
  });

  return (
    <div className="w-full flex flex-col rounded-3xl bg-[#f5f3ef] border border-[#ece8e1] overflow-hidden shadow-sm">
      {/* Top Map Control Bar */}
      <div className="bg-white px-4 py-3 border-b border-[#ece8e1] flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
          <span className="font-sans text-[12px] font-semibold text-[#1b1c1a] tracking-tight">
            Nearby Shops (within 1 km)
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setZoomLevel((z) => Math.min(z + 0.15, 1.3))}
            className="w-7 h-7 rounded-lg bg-[#f5f3ef] hover:bg-[#ece8e1] flex items-center justify-center text-[#1b1c1a] font-bold text-[14px] transition-all cursor-pointer"
            title="Zoom In"
          >
            +
          </button>
          <button
            type="button"
            onClick={() => setZoomLevel((z) => Math.max(z - 0.15, 0.85))}
            className="w-7 h-7 rounded-lg bg-[#f5f3ef] hover:bg-[#ece8e1] flex items-center justify-center text-[#1b1c1a] font-bold text-[14px] transition-all cursor-pointer"
            title="Zoom Out"
          >
            -
          </button>
          <button
            type="button"
            onClick={() => {
              setZoomLevel(1);
              fetchUserLocation();
            }}
            disabled={isFetchingLocation}
            className="h-7 px-2.5 rounded-lg bg-[#3d3bf3]/10 hover:bg-[#3d3bf3]/20 text-[#3d3bf3] font-sans text-[11px] font-semibold flex items-center gap-1 transition-all cursor-pointer disabled:opacity-50"
            title="Recenter GPS"
          >
            <span className="material-symbols-outlined text-[14px]">my_location</span>
            <span className="hidden sm:inline">Recenter</span>
          </button>
        </div>
      </div>

      {/* Filter Tag Chips */}
      <div className="px-4 py-2 bg-white/70 backdrop-blur-sm border-b border-[#ece8e1] flex items-center gap-2 overflow-x-auto text-[11px]">
        <button
          type="button"
          onClick={() => setFilterMode('all')}
          className={`px-3 py-1 rounded-full font-medium transition-all shrink-0 cursor-pointer ${
            filterMode === 'all'
              ? 'bg-[#3d3bf3] text-white font-semibold shadow-2xs'
              : 'bg-[#efeeea] text-[#454556] hover:text-[#1b1c1a]'
          }`}
        >
          All Stores ({mockShops.length})
        </button>
        <button
          type="button"
          onClick={() => setFilterMode('open')}
          className={`px-3 py-1 rounded-full font-medium transition-all shrink-0 cursor-pointer ${
            filterMode === 'open'
              ? 'bg-[#3d3bf3] text-white font-semibold shadow-2xs'
              : 'bg-[#efeeea] text-[#454556] hover:text-[#1b1c1a]'
          }`}
        >
          🟢 Online &amp; Open
        </button>
        <button
          type="button"
          onClick={() => setFilterMode('fast')}
          className={`px-3 py-1 rounded-full font-medium transition-all shrink-0 cursor-pointer ${
            filterMode === 'fast'
              ? 'bg-[#3d3bf3] text-white font-semibold shadow-2xs'
              : 'bg-[#efeeea] text-[#454556] hover:text-[#1b1c1a]'
          }`}
        >
          ⚡ Quick Print
        </button>
      </div>

      {/* Interactive Map Vector Canvas */}
      <div className="relative w-full h-[280px] sm:h-[320px] bg-[#f2efe9] overflow-hidden select-none">
        {/* Subtle Map Grid & Architectural Blueprint Lines */}
        <div
          className="absolute inset-0 transition-transform duration-300 ease-out origin-center"
          style={{ transform: `scale(${zoomLevel})` }}
        >
          <svg className="w-full h-full" viewBox="0 0 480 320" preserveAspectRatio="xMidYMid slice">
            <defs>
              <pattern id="mapGrid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#e4e0d7" strokeWidth="0.8" />
              </pattern>
              {/* Radar pulse gradient */}
              <radialGradient id="radarPulse" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#3d3bf3" stopOpacity="0.25" />
                <stop offset="70%" stopColor="#3d3bf3" stopOpacity="0.08" />
                <stop offset="100%" stopColor="#3d3bf3" stopOpacity="0" />
              </radialGradient>
            </defs>

            {/* Base grid background */}
            <rect width="100%" height="100%" fill="url(#mapGrid)" />

            {/* Green park & open space blocks */}
            <path
              d="M 20 20 Q 80 15 110 50 L 90 100 Q 40 90 20 60 Z"
              fill="#e3ede3"
              stroke="#d1e3d1"
              strokeWidth="1"
            />
            <text x="45" y="60" fill="#789978" fontSize="9" fontFamily="sans-serif" fontWeight="600">
              Cubbon Park
            </text>

            <path
              d="M 370 170 Q 440 180 460 230 L 420 270 Q 380 250 360 220 Z"
              fill="#e3ede3"
              stroke="#d1e3d1"
              strokeWidth="1"
            />
            <text x="390" y="225" fill="#789978" fontSize="8" fontFamily="sans-serif" fontWeight="600">
              Mayo Hall Park
            </text>

            {/* Main Primary Road Lines */}
            <path
              d="M 0 160 Q 240 165 480 160"
              fill="none"
              stroke="#ffffff"
              strokeWidth="16"
              strokeLinecap="round"
            />
            <path
              d="M 0 160 Q 240 165 480 160"
              fill="none"
              stroke="#e2ded4"
              strokeWidth="1.5"
            />
            <text x="120" y="156" fill="#8d897f" fontSize="9" fontFamily="monospace" fontWeight="600" letterSpacing="1">
              MG ROAD (COMMERCIAL ARTERY)
            </text>

            {/* Cross Avenues */}
            <path
              d="M 240 0 L 240 320"
              fill="none"
              stroke="#ffffff"
              strokeWidth="12"
            />
            <path
              d="M 240 0 L 240 320"
              fill="none"
              stroke="#e2ded4"
              strokeWidth="1"
            />
            <text x="246" y="70" fill="#8d897f" fontSize="8" fontFamily="sans-serif">
              Church St
            </text>

            <path
              d="M 360 0 Q 340 160 380 320"
              fill="none"
              stroke="#ffffff"
              strokeWidth="10"
            />
            <path
              d="M 360 0 Q 340 160 380 320"
              fill="none"
              stroke="#e2ded4"
              strokeWidth="1"
            />
            <text x="355" y="290" fill="#8d897f" fontSize="8" fontFamily="sans-serif">
              Brigade Rd
            </text>

            <path
              d="M 100 0 L 140 320"
              fill="none"
              stroke="#ffffff"
              strokeWidth="9"
            />

            {/* Connecting dashed route line from User location to Selected Shop */}
            {selectedShop && shopPinPositions[selectedShop.id] && (
              <line
                x1="240"
                y1="160"
                x2={shopPinPositions[selectedShop.id].x}
                y2={shopPinPositions[selectedShop.id].y}
                stroke="#3d3bf3"
                strokeWidth="2.5"
                strokeDasharray="5,4"
                className="animate-pulse"
              />
            )}

            {/* User GPS Radar Pulse Circles */}
            <circle cx="240" cy="160" r="48" fill="url(#radarPulse)" className="animate-ping" style={{ animationDuration: '3s' }} />
            <circle cx="240" cy="160" r="32" fill="#3d3bf3" fillOpacity="0.12" stroke="#3d3bf3" strokeWidth="1" strokeDasharray="3,3" />

            {/* User Current Location Pin (Center: 240, 160) */}
            <g transform="translate(240, 160)">
              <circle r="9" fill="#3d3bf3" className="shadow-lg" />
              <circle r="4.5" fill="#ffffff" />
            </g>
          </svg>

          {/* User Location Floating Tag */}
          <div className="absolute top-[172px] left-[240px] -translate-x-1/2 bg-[#1b1c1a] text-white px-2 py-0.5 rounded-full font-sans text-[10px] font-bold shadow-md flex items-center gap-1 whitespace-nowrap z-10 pointer-events-none">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            <span>You (Current GPS)</span>
          </div>

          {/* Xerox Store Pins Placed on Map */}
          {filteredShops.map((shop) => {
            const pos = shopPinPositions[shop.id] || { x: 260, y: 150 };
            const isSelected = selectedShop?.id === shop.id;

            return (
              <div
                key={shop.id}
                onClick={() => setSelectedShop(shop)}
                style={{
                  left: `${(pos.x / 480) * 100}%`,
                  top: `${(pos.y / 320) * 100}%`,
                }}
                className={`absolute -translate-x-1/2 -translate-y-full cursor-pointer transition-all duration-200 z-20 group ${
                  isSelected ? 'scale-115 z-30' : 'hover:scale-110'
                }`}
              >
                {/* Store Pin Bubble */}
                <div
                  className={`flex items-center gap-1 px-2 py-1 rounded-xl shadow-md border font-sans text-[11px] font-bold transition-all ${
                    isSelected
                      ? 'bg-[#3d3bf3] text-white border-[#3d3bf3] ring-4 ring-[#3d3bf3]/25'
                      : 'bg-white text-[#1b1c1a] border-[#ece8e1] hover:border-[#3d3bf3]'
                  }`}
                >
                  <span className="material-symbols-outlined text-[15px]">print</span>
                  <span className="max-w-[100px] truncate">{shop.name.split(' ')[0]}</span>
                  <span
                    className={`font-mono text-[9px] px-1 py-0.2 rounded font-semibold ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-[#e1e0ff] text-[#3d3bf3]'
                    }`}
                  >
                    {shop.distance}
                  </span>
                </div>
                {/* Pointer Arrow */}
                <div
                  className={`w-2.5 h-2.5 mx-auto rotate-45 -mt-1 border-r border-b ${
                    isSelected
                      ? 'bg-[#3d3bf3] border-[#3d3bf3]'
                      : 'bg-white border-[#ece8e1]'
                  }`}
                ></div>
              </div>
            );
          })}
        </div>

        {/* Selected Shop Floating Quick-Card Overlay inside Map */}
        {selectedShop && (
          <div className="absolute bottom-3 left-3 right-3 bg-white/95 backdrop-blur-md rounded-2xl p-3 border border-[#ece8e1] shadow-lg flex items-center justify-between gap-3 z-30 animate-in fade-in slide-in-from-bottom-2 duration-200">
            <div className="flex items-center gap-2.5 min-w-0">
              <img
                src={selectedShop.image}
                alt={selectedShop.name}
                className="w-11 h-11 rounded-xl object-cover shrink-0 border border-[#ece8e1]"
              />
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h4 className="font-heading font-bold text-[13px] text-[#1b1c1a] truncate">
                    {selectedShop.name}
                  </h4>
                  <span className="font-mono text-[10px] text-emerald-800 bg-[#ddf5e6] px-1.5 py-0.2 rounded font-semibold">
                    {selectedShop.distance}
                  </span>
                </div>
                <p className="font-sans text-[11px] text-[#454556] truncate mt-0.5">
                  Operator: {selectedShop.operatorName || 'Mohan Kumar'} • ₹{selectedShop.pricePerBw || 2}/pg B&amp;W
                </p>
                <div className="flex items-center gap-2 text-[10px] text-[#767588] mt-0.5">
                  <span className="flex items-center gap-0.5 text-[#e5a000] font-bold">
                    <span className="material-symbols-outlined text-[12px]">star</span>
                    {selectedShop.rating}
                  </span>
                  <span>•</span>
                  <span className="font-mono text-[#07006c] font-medium">{selectedShop.printerModel?.split(' ')[0] || 'Canon'} Laser</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => initiateChatWithShop(selectedShop)}
              className="px-3.5 py-2 rounded-xl bg-[#3d3bf3] hover:bg-[#2e2cd4] text-white font-sans text-[12px] font-semibold flex items-center gap-1.5 shrink-0 shadow-xs active:scale-95 transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-[15px]">chat</span>
              <span>Chat &amp; Print</span>
            </button>
          </div>
        )}
      </div>

      {/* User Location Meta Bar */}
      <div className="bg-[#fbf9f5] px-4 py-2 border-t border-[#ece8e1] flex items-center justify-between text-[11px] text-[#454556]">
        <div className="flex items-center gap-1.5 truncate">
          <span className="material-symbols-outlined text-[15px] text-[#3d3bf3]">place</span>
          <span className="font-medium text-[#1b1c1a]">
            {userLocation?.address || 'MG Road Hub, Bengaluru (12.9716° N, 77.5946° E)'}
          </span>
        </div>
        <span className="font-mono text-[10px] text-[#767588] shrink-0">
          Accuracy: ±{userLocation?.accuracyMeters || 15}m
        </span>
      </div>
    </div>
  );
};
