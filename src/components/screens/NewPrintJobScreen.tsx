'use client';

import React, { useState, useRef } from 'react';
import { usePrintVault } from '@/context/PrintVaultContext';
import { mockShops } from '@/data/mockData';
import { ColorMode } from '@/types/printvault';

export const NewPrintJobScreen: React.FC = () => {
  const { createNewJob, setCurrentScreen, triggerToast } = usePrintVault();

  // Document state
  const [fileName, setFileName] = useState('e-Aadhaar_Official.pdf');
  const [fileSize, setFileSize] = useState('1.4 MB');
  const [pageCount, setPageCount] = useState(2);
  const [isAadhaarMasked, setIsAadhaarMasked] = useState(true);
  const [hasFile, setHasFile] = useState(true);

  // Print specifications
  const [copies, setCopies] = useState(1);
  const [colorMode, setColorMode] = useState<ColorMode>('bw');

  // Shop selection
  const [selectedShopId, setSelectedShopId] = useState(mockShops[0].id);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Pricing calculations
  const unitPrice = colorMode === 'bw' ? 3 : 10;
  const totalPrice = copies * pageCount * unitPrice;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
      const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
      setFileSize(`${sizeMB} MB`);
      // Estimate pages for preview
      setPageCount(Math.max(1, Math.floor(Math.random() * 4) + 1));
      setHasFile(true);
      triggerToast(`Loaded ${file.name}`);
    }
  };

  const handleRemoveFile = () => {
    setHasFile(false);
    triggerToast('Document removed');
  };

  const handleSubmit = () => {
    if (!hasFile) {
      triggerToast('Please upload a document first');
      return;
    }
    const shop = mockShops.find((s) => s.id === selectedShopId) || mockShops[0];
    createNewJob({
      fileName: isAadhaarMasked && fileName.toLowerCase().includes('aadhaar')
        ? 'e-Aadhaar_Masked_2025.pdf'
        : fileName,
      fileSize,
      pageCount,
      copies,
      colorMode,
      shop,
      isMaskedAadhaar: isAadhaarMasked,
    });
  };

  return (
    <div className="flex flex-col w-full pb-28 pt-2">
      {/* Progress Header */}
      <div className="flex items-center justify-between mb-5 px-1">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#3d3bf3] animate-pulse"></span>
          <span className="font-mono text-[11px] uppercase tracking-wider text-[#454556] font-semibold">
            Secure Vault Pipeline
          </span>
        </div>
        <span className="font-mono text-[11px] text-[#1e0cde] font-semibold bg-[#e1e0ff] px-2.5 py-1 rounded-full">
          Step 1 of 3
        </span>
      </div>

      <div className="space-y-6">
        {/* STEP 1: Document Upload Section */}
        <section className="space-y-3">
          <div className="flex items-baseline justify-between px-1">
            <h2 className="font-heading font-semibold text-[18px] text-[#1b1c1a] tracking-tight">
              1. Upload Document
            </h2>
            <span className="font-sans text-[12px] text-[#454556] flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px] text-emerald-600">lock</span>
              Encrypted in-transit
            </span>
          </div>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden"
            accept=".pdf,.png,.jpg,.jpeg"
          />

          {!hasFile ? (
            /* Upload Zone Drop Area */
            <div
              onClick={() => fileInputRef.current?.click()}
              className="w-full bg-white rounded-2xl p-6 shadow-sm border-2 border-dashed border-[#ece8e1] hover:border-[#3d3bf3] flex flex-col items-center justify-center text-center cursor-pointer transition-all hover:bg-[#fbf9f5]"
            >
              <div className="w-12 h-12 rounded-full bg-[#f5f3ef] flex items-center justify-center text-[#3d3bf3] mb-2.5">
                <span className="material-symbols-outlined text-[26px]">cloud_upload</span>
              </div>
              <p className="font-heading font-semibold text-[15px] text-[#1b1c1a] mb-1">
                Drop credentials or select source
              </p>
              <p className="font-sans text-[12px] text-[#454556] mb-4">
                Supports PDF, JPG, PNG up to 25 MB
              </p>

              {/* Source Chips */}
              <div className="grid grid-cols-3 gap-2 w-full pt-1">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                  className="flex flex-col items-center justify-center gap-1 py-2 px-1 rounded-xl bg-[#f5f3ef] hover:bg-[#efeeea] text-[#1b1c1a] transition-all active:scale-95 text-xs font-medium"
                >
                  <span className="material-symbols-outlined text-[20px] text-[#434256]">photo_camera</span>
                  <span>Camera</span>
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                  className="flex flex-col items-center justify-center gap-1 py-2 px-1 rounded-xl bg-[#e1e0ff]/50 text-[#07006c] hover:bg-[#e1e0ff] transition-all active:scale-95 text-xs font-semibold"
                >
                  <span className="material-symbols-outlined text-[20px] text-[#3d3bf3]">folder_open</span>
                  <span>Files</span>
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                  className="flex flex-col items-center justify-center gap-1 py-2 px-1 rounded-xl bg-[#f5f3ef] hover:bg-[#efeeea] text-[#1b1c1a] transition-all active:scale-95 text-xs font-medium"
                >
                  <span className="material-symbols-outlined text-[20px] text-[#434256]">photo_library</span>
                  <span>Gallery</span>
                </button>
              </div>
            </div>
          ) : (
            /* Uploaded Document Card */
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#ece8e1] space-y-3">
              <div className="flex items-center gap-3">
                <div className="relative w-12 h-14 rounded-xl bg-[#efeeea] overflow-hidden shrink-0 shadow-xs flex items-center justify-center border border-[#ece8e1]">
                  <span className="material-symbols-outlined text-[#3d3bf3] text-[26px]">
                    picture_as_pdf
                  </span>
                  <span className="absolute bottom-0.5 right-0.5 font-mono text-[8px] text-white font-bold bg-[#3d3bf3] px-1 rounded">
                    PDF
                  </span>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="font-heading font-semibold text-[15px] text-[#1b1c1a] truncate">
                      {fileName}
                    </p>
                    <span
                      className="material-symbols-outlined text-[#3d3bf3] text-[18px] shrink-0"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      verified
                    </span>
                  </div>
                  <p className="font-sans text-[12px] text-[#454556] flex items-center gap-1 mt-0.5">
                    <span>{fileSize}</span>
                    <span>•</span>
                    <span className="font-mono text-[11px] text-[#3d3bf3] font-semibold">
                      {pageCount} Pages
                    </span>
                    <span>•</span>
                    <span className="text-[#5e5d66]">Verified SHA-256</span>
                  </p>
                </div>

                <button
                  aria-label="Remove document"
                  onClick={handleRemoveFile}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-[#454556] hover:bg-[#f5f3ef] active:scale-90 transition-all"
                  type="button"
                >
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              </div>

              {/* Aadhaar Privacy Masking Delight Banner */}
              <div className="bg-[#fff3c4] text-[#443800] rounded-xl p-3.5 shadow-xs transition-all border border-[#f0e2a2]">
                <div className="flex items-start gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-[#ffe58a] flex items-center justify-center shrink-0 mt-0.5 text-[#5b4a00]">
                    <span
                      className="material-symbols-outlined text-[18px]"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      security
                    </span>
                  </div>
                  <div className="flex-1 min-w-0 pr-1">
                    <div className="flex items-center gap-1.5">
                      <p className="font-heading text-[13px] font-bold tracking-tight text-[#3b3000]">
                        Smart Privacy Guard
                      </p>
                      <span className="font-mono text-[10px] bg-[#ffe58a] text-[#5b4a00] px-1.5 py-0.5 rounded-full font-semibold">
                        Auto-detected
                      </span>
                    </div>
                    <p className="font-sans text-[12px] text-[#524400] mt-0.5 leading-snug">
                      Mask the first 8 digits of your Aadhaar number before this leaves your phone?
                    </p>
                  </div>

                  {/* Custom Toggle Switch */}
                  <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1 select-none">
                    <input
                      checked={isAadhaarMasked}
                      onChange={(e) => setIsAadhaarMasked(e.target.checked)}
                      className="sr-only peer"
                      type="checkbox"
                    />
                    <div className="w-11 h-6 bg-[#d8ca8e] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#3d3bf3]"></div>
                  </label>
                </div>

                <div className="mt-2.5 pt-1.5 flex items-center justify-between bg-white/75 rounded-lg px-2.5 py-1.5 text-[#443800]">
                  <span className="font-sans text-[11px] font-medium flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">
                      {isAadhaarMasked ? 'visibility_off' : 'visibility'}
                    </span>
                    Rendered as:
                  </span>
                  <span className="font-mono text-[12px] font-bold tracking-widest text-[#1b1c1a]">
                    {isAadhaarMasked ? 'XXXX-XXXX-4892' : '4829-1928-4892'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* STEP 2: Print Configuration Options */}
        <section className="space-y-3">
          <div className="flex items-baseline justify-between px-1">
            <h2 className="font-heading font-semibold text-[18px] text-[#1b1c1a] tracking-tight">
              2. Print Specifications
            </h2>
            <span className="font-mono text-[12px] text-[#454556] font-medium">Standard A4</span>
          </div>

          <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#ece8e1] space-y-4">
            {/* Copies Counter */}
            <div className="flex items-center justify-between">
              <div>
                <p className="font-sans font-semibold text-[15px] text-[#1b1c1a]">Copies</p>
                <p className="font-sans text-[12px] text-[#454556]">Single-sided archival bond</p>
              </div>
              <div className="flex items-center bg-[#f5f3ef] rounded-full p-1 border border-[#ece8e1]">
                <button
                  aria-label="Decrease copies"
                  onClick={() => setCopies((c) => Math.max(1, c - 1))}
                  className="w-9 h-9 rounded-full bg-white flex items-center justify-center text-[#1b1c1a] hover:bg-[#fbf9f5] transition-all active:scale-90 shadow-xs"
                  type="button"
                >
                  <span className="material-symbols-outlined text-[18px]">remove</span>
                </button>
                <span className="font-mono text-[16px] font-bold px-4 text-[#1b1c1a] min-w-[36px] text-center">
                  {copies}
                </span>
                <button
                  aria-label="Increase copies"
                  onClick={() => setCopies((c) => Math.min(50, c + 1))}
                  className="w-9 h-9 rounded-full bg-white flex items-center justify-center text-[#1b1c1a] hover:bg-[#fbf9f5] transition-all active:scale-90 shadow-xs"
                  type="button"
                >
                  <span className="material-symbols-outlined text-[18px]">add</span>
                </button>
              </div>
            </div>

            {/* Color Mode Selector */}
            <div>
              <label className="font-sans font-semibold text-[15px] text-[#1b1c1a] block mb-2">
                Color Mode
              </label>
              <div className="grid grid-cols-2 gap-2 p-1 bg-[#f5f3ef] rounded-full border border-[#ece8e1]">
                <button
                  type="button"
                  onClick={() => setColorMode('bw')}
                  className={`py-2 px-3 rounded-full font-sans text-[13px] font-semibold transition-all flex items-center justify-center gap-1.5 ${
                    colorMode === 'bw'
                      ? 'bg-[#3d3bf3] text-white shadow-sm'
                      : 'text-[#454556] hover:text-[#1b1c1a]'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">filter_b_and_w</span>
                  <span>B&amp;W (₹3/pg)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setColorMode('color')}
                  className={`py-2 px-3 rounded-full font-sans text-[13px] font-semibold transition-all flex items-center justify-center gap-1.5 ${
                    colorMode === 'color'
                      ? 'bg-[#3d3bf3] text-white shadow-sm'
                      : 'text-[#454556] hover:text-[#1b1c1a]'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">palette</span>
                  <span>Color (₹10/pg)</span>
                </button>
              </div>
            </div>

            {/* Paper Specs Meta */}
            <div className="pt-1 flex items-center justify-between text-[#454556] bg-[#f5f3ef]/80 rounded-xl px-3 py-2 border border-[#ece8e1]/60">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[17px] text-[#434256]">description</span>
                <span className="font-sans text-[12px] font-medium text-[#1b1c1a]">Paper Stock</span>
              </div>
              <span className="font-mono text-[11px] font-semibold bg-white text-[#1b1c1a] px-2.5 py-1 rounded-md shadow-2xs border border-[#ece8e1]">
                A4 · 75 GSM Bond
              </span>
            </div>
          </div>
        </section>

        {/* STEP 3: Print Shop Destination */}
        <section className="space-y-3">
          <div className="flex items-baseline justify-between px-1">
            <h2 className="font-heading font-semibold text-[18px] text-[#1b1c1a] tracking-tight">
              3. Select Print Point
            </h2>
            <span className="font-sans text-[12px] text-[#1e0cde] font-medium flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">near_me</span>
              GPS calibrated
            </span>
          </div>

          <div className="space-y-2.5">
            {mockShops.map((shop) => {
              const isSelected = selectedShopId === shop.id;
              return (
                <div
                  key={shop.id}
                  onClick={() => setSelectedShopId(shop.id)}
                  role="button"
                  tabIndex={0}
                  className={`relative rounded-2xl p-4 transition-all cursor-pointer border ${
                    isSelected
                      ? 'bg-[#e1e0ff]/20 border-[#3d3bf3] ring-2 ring-[#3d3bf3]/30 shadow-sm'
                      : 'bg-white border-[#ece8e1] hover:border-[#c6c4d9]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded-xl bg-[#efeeea] overflow-hidden shrink-0 relative mt-0.5 border border-[#ece8e1]">
                        <img
                          alt={shop.name}
                          className="w-full h-full object-cover"
                          src={shop.image}
                        />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h3 className="font-heading text-[15px] font-bold text-[#1b1c1a]">
                            {shop.name}
                          </h3>
                          {isSelected && (
                            <span
                              className="material-symbols-outlined text-[#3d3bf3] text-[16px]"
                              style={{ fontVariationSettings: "'FILL' 1" }}
                            >
                              check_circle
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="font-mono text-[11px] font-semibold text-[#1e0cde]">
                            {shop.distance}
                          </span>
                          <span className="text-[#454556] text-[11px]">•</span>
                          <span className="font-sans text-[12px] text-[#454556]">
                            {shop.location}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-1.5">
                          <span className="inline-flex items-center gap-0.5 bg-[#eae8e4] px-1.5 py-0.5 rounded text-[11px] font-bold text-[#1b1c1a]">
                            <span
                              className="material-symbols-outlined text-[#e5a000] text-[13px]"
                              style={{ fontVariationSettings: "'FILL' 1" }}
                            >
                              star
                            </span>
                            {shop.rating}
                          </span>
                          <span className="font-sans text-[11px] text-[#454556]">
                            ({shop.jobsCount})
                          </span>
                          <span className="font-mono text-[10px] text-[#434256] bg-[#f5f3ef] px-1.5 py-0.5 rounded font-medium">
                            {shop.statusBadge}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Radio Indicator */}
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-1 transition-all ${
                        isSelected
                          ? 'bg-[#3d3bf3] text-white shadow-xs'
                          : 'bg-[#efeeea] text-transparent'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[15px] font-bold">
                        check
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Ephemeral Security Footnote */}
        <div className="flex items-center justify-center gap-1.5 text-[#454556] pt-1">
          <span className="material-symbols-outlined text-[16px] text-[#3d3bf3]">timer_10</span>
          <p className="font-sans text-[12px]">Self-destruct token generated upon link creation</p>
        </div>
      </div>

      {/* Bottom Floating Execution Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#fbf9f5]/90 backdrop-blur-xl border-t border-[#ece8e1] pb-safe shadow-[0_-8px_24px_rgba(22,22,29,0.06)]">
        <div className="max-w-[480px] mx-auto px-6 py-3 flex items-center gap-4">
          <div className="flex flex-col">
            <span className="font-sans text-[11px] text-[#454556] leading-none uppercase tracking-wider font-medium">
              Job Total
            </span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="font-heading text-[22px] text-[#1b1c1a] font-bold">
                ₹{totalPrice}
              </span>
              <span className="font-mono text-[11px] text-[#454556]">incl. tax</span>
            </div>
          </div>
          <button
            onClick={handleSubmit}
            className="flex-1 h-[52px] rounded-full bg-[#3d3bf3] hover:bg-[#2e2cd4] transition-all active:scale-[0.98] shadow-md shadow-[#3d3bf3]/25 flex items-center justify-center gap-2 text-white font-sans text-[15px] font-semibold"
            type="button"
          >
            <span className="material-symbols-outlined text-[20px]">lock_clock</span>
            <span>Create secure link</span>
          </button>
        </div>
      </div>
    </div>
  );
};
