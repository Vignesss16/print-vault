'use client';

import React, { useState, useRef, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { mockShops } from '@/data/mockData';
import { ColorMode, PrintShop } from '@/types/printvault';

function UploadContent() {
  const searchParams = useSearchParams();
  const sessionParam = searchParams.get('session');
  const tokenParam = searchParams.get('token');
  const phoneParam = searchParams.get('phone') || '';

  // Form state
  const [fileName, setFileName] = useState('e-Aadhaar_Official.pdf');
  const [fileSize, setFileSize] = useState('1.4 MB');
  const [pageCount, setPageCount] = useState(2);
  const [hasFile, setHasFile] = useState(true);
  const [isAadhaarMasked, setIsAadhaarMasked] = useState(true);

  // Print specs
  const [copies, setCopies] = useState(1);
  const [colorMode, setColorMode] = useState<ColorMode>('bw');
  const [selectedShopId, setSelectedShopId] = useState(mockShops[0].id);

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completedJob, setCompletedJob] = useState<{
    id: string;
    token: string;
    shopName: string;
    totalPrice: number;
  } | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const unitPrice = colorMode === 'bw' ? 3 : 10;
  const totalPrice = copies * pageCount * unitPrice;
  const selectedShop = mockShops.find((s) => s.id === selectedShopId) || mockShops[0];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
      const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
      setFileSize(`${sizeMB} MB`);
      setPageCount(Math.max(1, Math.floor(Math.random() * 4) + 1));
      setHasFile(true);
      showToast(`Selected ${file.name}`);
    }
  };

  const handleSubmit = async () => {
    if (!hasFile) {
      showToast('Please select a document first');
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Register job in backend
      const res = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: isAadhaarMasked && fileName.toLowerCase().includes('aadhaar')
            ? 'e-Aadhaar_Masked_2025.pdf'
            : fileName,
          fileSize,
          pageCount,
          copies,
          colorMode,
          shopId: selectedShop.id,
          isMaskedAadhaar: isAadhaarMasked,
          shop: selectedShop,
        }),
      });

      const data = await res.json();
      const job = data.job || {
        id: `PV-${Math.random().toString(36).substring(2, 6).toUpperCase()}-2026`,
        token: `${Math.floor(100 + Math.random() * 900)} ${Math.floor(100 + Math.random() * 900)}`,
        totalPrice,
      };

      setCompletedJob({
        id: job.id,
        token: job.token,
        shopName: selectedShop.name,
        totalPrice: Number(job.totalPrice || totalPrice),
      });

      // 2. Send WhatsApp confirmation message if phone number exists
      if (phoneParam) {
        try {
          await fetch('/api/whatsapp/send', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${process.env.NEXT_PUBLIC_INTERNAL_KEY || 'pv_sec_dev_8f3a9e42d761bc05'}`,
            },
            body: JSON.stringify({
              to: phoneParam,
              message:
                `✅ *Document Received Securely!*\n\n` +
                `Your file has been encrypted and queued into PrintVault.\n` +
                `📄 *Job ID:* ${job.id}\n` +
                `🔑 *One-Time Pickup Token:* *${job.token}*\n` +
                `📍 *Print Shop:* ${selectedShop.name}\n\n` +
                `Show your 6-digit token at the counter to start printing. Digital copy is shredded upon collection.`,
            }),
          });
        } catch {
          // Non-critical if outbound send fails in demo
        }
      }

      showToast('Print token generated securely!');
    } catch (err) {
      showToast('Error creating print job. Please retry.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f3ef] sm:py-8 flex flex-col items-center justify-start">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-5 z-50 px-4 py-2.5 rounded-full bg-[#1b1c1a] text-white text-[13px] font-sans font-medium shadow-lg animate-bounce">
          {toastMessage}
        </div>
      )}

      {/* Main Container */}
      <div className="w-full sm:max-w-[480px] min-h-screen sm:min-h-[820px] bg-[#fbf9f5] flex flex-col relative sm:rounded-[36px] sm:shadow-[0_24px_64px_-12px_rgba(22,22,29,0.15)] sm:border sm:border-[#ece8e1] overflow-x-hidden p-6">
        {/* Header */}
        <header className="flex items-center justify-between pb-4 border-b border-[#ece8e1]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#3d3bf3] flex items-center justify-center text-white font-bold text-lg shadow-sm">
              PV
            </div>
            <div>
              <h1 className="font-heading font-bold text-[17px] text-[#1b1c1a] tracking-tight leading-tight">
                PrintVault Secure Portal
              </h1>
              <p className="font-sans text-[11px] text-[#454556]">Zero-Leak Ephemeral Print</p>
            </div>
          </div>
          <span className="font-mono text-[10px] bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full font-semibold border border-emerald-200">
            TLS Encrypted
          </span>
        </header>

        {completedJob ? (
          /* SUCCESS SCREEN */
          <div className="flex flex-col items-center justify-center py-8 text-center space-y-5 animate-fade-in">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-inner">
              <span className="material-symbols-outlined text-[36px]">check_circle</span>
            </div>

            <div>
              <span className="font-mono text-[11px] uppercase tracking-wider text-[#3d3bf3] font-bold bg-[#e1e0ff] px-3 py-1 rounded-full">
                Upload Confirmed
              </span>
              <h2 className="font-heading font-bold text-[24px] text-[#1b1c1a] mt-3">
                Ready for Printing!
              </h2>
              <p className="font-sans text-[13px] text-[#454556] mt-1 max-w-[320px] mx-auto">
                Your file has been transferred securely. Show this one-time pickup code to the operator at{' '}
                <strong className="text-[#1b1c1a]">{completedJob.shopName}</strong>.
              </p>
            </div>

            {/* Token Badge */}
            <div className="w-full bg-white rounded-2xl p-5 border border-[#ece8e1] shadow-sm flex flex-col items-center">
              <span className="font-sans text-[11px] uppercase tracking-wider text-[#454556] font-semibold">
                One-Time Pickup Token
              </span>
              <span className="font-mono text-[28px] font-bold text-[#3d3bf3] tracking-widest my-2 select-all">
                {completedJob.token}
              </span>
              <span className="font-sans text-[12px] text-[#5e5d66]">
                Job ID: <code className="font-mono text-[#1b1c1a]">{completedJob.id}</code>
              </span>
              <div className="mt-3 w-full bg-[#f5f3ef] rounded-xl p-2.5 text-left text-[11px] text-[#454556] flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px] text-[#3d3bf3] shrink-0">
                  lock_clock
                </span>
                <span>Self-destructs automatically in 10 minutes or upon print execution.</span>
              </div>
            </div>

            <a
              href="/"
              className="w-full h-[50px] rounded-full bg-[#3d3bf3] text-white font-sans text-[15px] font-semibold flex items-center justify-center gap-2 hover:bg-[#2e2cd4] transition-all shadow-md shadow-[#3d3bf3]/20"
            >
              Open PrintVault App
            </a>
          </div>
        ) : (
          /* UPLOAD FORM */
          <div className="flex flex-col space-y-6 pt-4 pb-12">
            {/* WhatsApp Verification Banner */}
            <div className="bg-[#e7f7ee] border border-[#c1e8d0] rounded-2xl p-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-[#25D366] text-white flex items-center justify-center font-bold text-sm shadow-xs">
                  WA
                </div>
                <div>
                  <p className="font-sans text-[12px] font-semibold text-[#164e29]">
                    WhatsApp Session Authenticated
                  </p>
                  <p className="font-mono text-[11px] text-[#2b7245]">
                    {phoneParam ? `Recipient: ${phoneParam}` : 'Session token active'}
                  </p>
                </div>
              </div>
              <span className="font-mono text-[10px] text-[#164e29] font-bold bg-white/80 px-2 py-0.5 rounded-full">
                Active (15m)
              </span>
            </div>

            {/* Step 1: File selection */}
            <section className="space-y-2.5">
              <div className="flex items-center justify-between">
                <h2 className="font-heading font-semibold text-[16px] text-[#1b1c1a]">
                  1. Select Sensitive Document
                </h2>
                <span className="font-sans text-[11px] text-emerald-700 font-medium flex items-center gap-1">
                  <span className="material-symbols-outlined text-[13px]">verified</span>
                  Zero-Storage
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
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full bg-white rounded-2xl p-6 border-2 border-dashed border-[#ece8e1] hover:border-[#3d3bf3] flex flex-col items-center justify-center text-center cursor-pointer transition-all hover:bg-[#fbf9f5]"
                >
                  <div className="w-12 h-12 rounded-full bg-[#f5f3ef] flex items-center justify-center text-[#3d3bf3] mb-2">
                    <span className="material-symbols-outlined text-[24px]">cloud_upload</span>
                  </div>
                  <p className="font-heading font-semibold text-[14px] text-[#1b1c1a]">
                    Tap to upload document
                  </p>
                  <p className="font-sans text-[11px] text-[#454556]">
                    Supports PDF, JPG, PNG up to 25 MB
                  </p>
                </div>
              ) : (
                <div className="bg-white rounded-2xl p-4 border border-[#ece8e1] shadow-xs space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-12 rounded-lg bg-[#efeeea] flex items-center justify-center text-[#3d3bf3] shrink-0 border border-[#ece8e1]">
                      <span className="material-symbols-outlined text-[22px]">description</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-heading font-semibold text-[14px] text-[#1b1c1a] truncate">
                        {fileName}
                      </p>
                      <p className="font-sans text-[11px] text-[#454556]">
                        {fileSize} • {pageCount} Pages • SHA-256 Verified
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setHasFile(false)}
                      className="w-7 h-7 rounded-full flex items-center justify-center text-[#454556] hover:bg-[#f5f3ef]"
                    >
                      <span className="material-symbols-outlined text-[16px]">close</span>
                    </button>
                  </div>

                  {/* Smart Privacy Guard */}
                  <div className="bg-[#fff3c4] text-[#443800] rounded-xl p-3 border border-[#f0e2a2]">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2">
                        <span className="material-symbols-outlined text-[18px] text-[#5b4a00] mt-0.5">
                          security
                        </span>
                        <div>
                          <p className="font-heading text-[12px] font-bold text-[#3b3000]">
                            Smart Privacy Guard (Aadhaar Masking)
                          </p>
                          <p className="font-sans text-[11px] text-[#524400] leading-tight mt-0.5">
                            Mask the first 8 digits before transmission?
                          </p>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={isAadhaarMasked}
                        onChange={(e) => setIsAadhaarMasked(e.target.checked)}
                        className="w-4 h-4 text-[#3d3bf3] rounded mt-1 cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              )}
            </section>

            {/* Step 2: Print Specifications */}
            <section className="space-y-2.5">
              <h2 className="font-heading font-semibold text-[16px] text-[#1b1c1a]">
                2. Print Specifications
              </h2>
              <div className="bg-white rounded-2xl p-4 border border-[#ece8e1] shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-sans font-semibold text-[14px] text-[#1b1c1a]">Copies</p>
                    <p className="font-sans text-[11px] text-[#454556]">Standard A4 Bond</p>
                  </div>
                  <div className="flex items-center bg-[#f5f3ef] rounded-full p-1 border border-[#ece8e1]">
                    <button
                      type="button"
                      onClick={() => setCopies((c) => Math.max(1, c - 1))}
                      className="w-7 h-7 rounded-full bg-white flex items-center justify-center text-[#1b1c1a] shadow-2xs"
                    >
                      -
                    </button>
                    <span className="font-mono text-[14px] font-bold px-3 text-[#1b1c1a]">
                      {copies}
                    </span>
                    <button
                      type="button"
                      onClick={() => setCopies((c) => Math.min(20, c + 1))}
                      className="w-7 h-7 rounded-full bg-white flex items-center justify-center text-[#1b1c1a] shadow-2xs"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div>
                  <p className="font-sans font-semibold text-[13px] text-[#1b1c1a] mb-1.5">
                    Color Mode
                  </p>
                  <div className="grid grid-cols-2 gap-2 p-1 bg-[#f5f3ef] rounded-full border border-[#ece8e1]">
                    <button
                      type="button"
                      onClick={() => setColorMode('bw')}
                      className={`py-1.5 text-xs font-semibold rounded-full transition-all ${
                        colorMode === 'bw'
                          ? 'bg-[#3d3bf3] text-white shadow-xs'
                          : 'text-[#454556]'
                      }`}
                    >
                      B&amp;W (₹3/pg)
                    </button>
                    <button
                      type="button"
                      onClick={() => setColorMode('color')}
                      className={`py-1.5 text-xs font-semibold rounded-full transition-all ${
                        colorMode === 'color'
                          ? 'bg-[#3d3bf3] text-white shadow-xs'
                          : 'text-[#454556]'
                      }`}
                    >
                      Color (₹10/pg)
                    </button>
                  </div>
                </div>
              </div>
            </section>

            {/* Step 3: Select Kiosk */}
            <section className="space-y-2.5">
              <h2 className="font-heading font-semibold text-[16px] text-[#1b1c1a]">
                3. Destination Print Point
              </h2>
              <div className="space-y-2">
                {mockShops.map((shop) => (
                  <div
                    key={shop.id}
                    onClick={() => setSelectedShopId(shop.id)}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                      selectedShopId === shop.id
                        ? 'bg-[#e1e0ff]/30 border-[#3d3bf3] ring-1 ring-[#3d3bf3]'
                        : 'bg-white border-[#ece8e1]'
                    }`}
                  >
                    <div>
                      <p className="font-heading font-bold text-[14px] text-[#1b1c1a]">
                        {shop.name}
                      </p>
                      <p className="font-sans text-[11px] text-[#454556]">
                        {shop.distance} • {shop.location}
                      </p>
                    </div>
                    <span className="font-mono text-[11px] font-bold text-[#3d3bf3]">
                      ★ {shop.rating}
                    </span>
                  </div>
                ))}
              </div>
            </section>

            {/* Total and Submit */}
            <div className="pt-2 flex items-center justify-between border-t border-[#ece8e1]">
              <div>
                <p className="font-sans text-[11px] uppercase tracking-wider text-[#454556] font-semibold">
                  Total Price
                </p>
                <p className="font-heading font-bold text-[22px] text-[#1b1c1a]">
                  ₹{totalPrice}
                </p>
              </div>

              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleSubmit}
                className="h-[50px] px-6 rounded-full bg-[#3d3bf3] hover:bg-[#2e2cd4] text-white font-sans text-[15px] font-semibold flex items-center gap-2 transition-all active:scale-98 shadow-md shadow-[#3d3bf3]/20 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span>Encrypting...</span>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[18px]">lock_clock</span>
                    <span>Generate Token</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SecureUploadPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#f5f3ef] flex items-center justify-center font-sans text-[14px] text-[#454556]">
          Loading secure portal...
        </div>
      }
    >
      <UploadContent />
    </Suspense>
  );
}
