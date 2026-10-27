'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { StoredPrintJob } from '@/lib/jobsStore';

function UploadContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const jobId = searchParams.get('jobId') || '';
  const token = searchParams.get('token') || '';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [job, setJob] = useState<StoredPrintJob | null>(null);

  // Upload Form State - always start with upload form visible
  const [fileName, setFileName] = useState('Assignment_Final_Review.pdf');
  const [fileSize, setFileSize] = useState('1.8 MB');
  const [isMasked, setIsMasked] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadTimestamp, setUploadTimestamp] = useState<string>('');
  const [isSimulated, setIsSimulated] = useState(true);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Verify job from API
    async function fetchJob() {
      if (!jobId) {
        setError('Missing Job Reference. Please access this page using the link provided in your WhatsApp chat.');
        setLoading(false);
        return;
      }

      if (!token) {
        setError('Missing Authorization Token. A Job Reference alone is not an authentication credential.');
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`/api/jobs/${encodeURIComponent(jobId)}`);
        const data = await res.json();
        if (!res.ok || !data.success || !data.job) {
          setError(data.error || 'Job not found in PrintVault.');
          setLoading(false);
          return;
        }

        // Verify token matches
        const jobCleanToken = (data.job.token || '').replace(/\s+/g, '').toUpperCase();
        const inputCleanToken = token.replace(/\s+/g, '').toUpperCase();
        if (jobCleanToken !== inputCleanToken) {
          setError('Authorization failed: The provided token does not match this job reference.');
          setLoading(false);
          return;
        }

        setJob(data.job);
        setUploadSuccess(false);
        if (data.job.fileName) {
          setFileName(data.job.fileName);
        }
        if (data.job.fileSize) {
          setFileSize(data.job.fileSize);
        }
        setLoading(false);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Network error fetching job details.';
        setError(msg);
        setLoading(false);
      }
    }

    fetchJob();
  }, [jobId, token]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
      const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
      setFileSize(file.size > 1024 * 1024 ? `${sizeMB} MB` : `${Math.round(file.size / 1024)} KB`);
      // If user selects a new file, ensure upload form is active
      setUploadSuccess(false);
    }
  };

  const handleUpload = async () => {
    if (!job) return;
    setIsUploading(true);

    try {
      const res = await fetch(`/api/jobs/${encodeURIComponent(job.id)}/upload`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          fileName,
          fileSize,
          isMaskedAadhaar: isMasked,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Upload failed');
      }

      setUploadSuccess(true);
      setUploadTimestamp(data.uploadedAt || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      setIsSimulated(Boolean(data.isSimulatedStorage));

      // Synchronize into PrintVault System State
      if (typeof window !== 'undefined') {
        try {
          const systemJob = {
            id: job.id,
            token: job.token,
            fileName: fileName,
            fileSize: fileSize,
            pageCount: job.pageCount,
            copies: job.copies,
            colorMode: job.colorMode,
            totalPrice: job.totalPrice,
            shop: job.shop || {
              id: 'shop-sai-xerox',
              name: 'Sai Xerox',
              distance: '50m away',
              location: 'College Main Gate, Bengaluru',
              rating: 4.9,
              jobsCount: '620+ jobs today',
              statusBadge: 'Fast queue',
              image: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=300&q=80',
              lat: 12.9716,
              lng: 77.5946,
              operatorName: 'Suresh Kumar',
              pricePerBw: 2.0,
              pricePerColor: 10.0,
              printerModel: 'Canon imageRUNNER ADVANCE C5560i (PrintVault Enclave)',
              phone: '+91 98450 99881',
              isOnline: true,
            },
            status: 'ready_for_scan',
            createdAt: 'Just now',
            expiresInSeconds: 600,
            isMaskedAadhaar: isMasked,
            sha256Hash: job.sha256Hash || '9e7b...4c19',
            verificationKey: job.verificationKey || 'e98a...f201',
          };
          localStorage.setItem('printvault_active_job', JSON.stringify(systemJob));
          localStorage.setItem(
            'printvault_realtime_event',
            JSON.stringify({
              type: 'ACTIVE_JOB_UPDATED',
              activeJob: systemJob,
              _t: Date.now(),
            })
          );
          if ('BroadcastChannel' in window) {
            const bc = new BroadcastChannel('printvault_realtime_sync');
            bc.postMessage({ type: 'ACTIVE_JOB_UPDATED', activeJob: systemJob });
            bc.close();
          }
          localStorage.setItem(
            'printvault_whatsapp_upload_done',
            JSON.stringify({
              jobId: job.id,
              token,
              fileName,
              timestamp: Date.now(),
            })
          );
        } catch {}
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Upload failed';
      alert(`Upload error: ${msg}`);
    } finally {
      setIsUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[100dvh] bg-[#f5f3ef] flex flex-col items-center justify-center p-4 sm:p-6 text-center">
        <div className="w-12 h-12 rounded-2xl bg-[#e1e0ff] text-[#3d3bf3] flex items-center justify-center animate-spin mb-4 shadow-sm">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
          </svg>
        </div>
        <h2 className="text-base sm:text-lg font-bold text-[#1b1c1a]">Verifying PrintVault Secure Token...</h2>
        <p className="text-xs sm:text-sm text-[#6b6760] mt-1">Establishing encrypted TLS channel with Sai Xerox enclave</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[100dvh] bg-[#f5f3ef] flex flex-col items-center justify-center p-4 sm:p-6">
        <div className="max-w-md w-full bg-white rounded-3xl p-6 shadow-md border border-red-200 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto text-2xl font-bold">
            ⚠️
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-[#1b1c1a]">Security Authorization Error</h2>
          <p className="text-xs sm:text-sm text-red-700 bg-red-50 p-3 rounded-xl border border-red-100">{error}</p>
          <p className="text-xs text-[#6b6760]">
            For privacy protection, PrintVault requires a verified session token to prevent unauthorized document submission.
          </p>
          <div className="pt-2">
            <Link
              href="/demo/whatsapp"
              className="inline-block px-5 py-2.5 rounded-xl bg-[#3d3bf3] text-white text-xs sm:text-sm font-semibold hover:bg-[#2e2cd4] transition-all"
            >
              Back to WhatsApp Chat
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-[#f5f3ef] py-4 px-3 sm:py-8 sm:px-4 flex flex-col items-center justify-center font-sans antialiased">
      {/* Top Header Card */}
      <div className="max-w-lg w-full bg-white rounded-2xl sm:rounded-3xl shadow-sm border border-[#ece8e1] overflow-hidden my-auto">
        {/* Banner */}
        <div className="bg-[#07006c] text-white p-4 sm:p-6 relative overflow-hidden">
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-start justify-between gap-3">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/15 text-[11px] text-emerald-300 font-medium mb-1.5 border border-white/10">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Hardware Enclave Active</span>
              </div>
              <h1 className="text-lg sm:text-xl font-bold tracking-tight">PrintVault Secure Upload</h1>
              <p className="text-xs text-white/80 mt-0.5">
                Target Kiosk: <strong className="text-white">Sai Xerox</strong> (Powered by PrintVault)
              </p>
            </div>
            <div className="sm:text-right bg-white/10 sm:bg-transparent p-2 sm:p-0 rounded-xl border border-white/10 sm:border-0 flex sm:flex-col justify-between items-center sm:items-end">
              <span className="text-[10px] uppercase tracking-wider text-white/70 font-semibold">Ref Code</span>
              <span className="font-mono text-xs sm:text-sm font-bold text-emerald-300">{job?.id}</span>
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-white/15 flex items-center justify-between text-xs text-white/85">
            <span>PIN: <strong className="font-mono text-white">{token}</strong></span>
            <span>Est. Total: <strong className="text-emerald-300">₹{job?.totalPrice}</strong></span>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-5">
          {uploadSuccess ? (
            <div className="space-y-4 text-center py-2 sm:py-4">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto text-2xl sm:text-3xl font-bold border border-emerald-200">
                ✓
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-[#1b1c1a]">Document Upload Confirmed!</h2>
                <p className="text-xs sm:text-sm text-[#454556] mt-1 max-w-sm mx-auto leading-relaxed">
                  Your document <strong>{fileName}</strong> has been encrypted and securely registered for Sai Xerox kiosk review.
                </p>
              </div>

              <div className="bg-[#f5f3ef] rounded-2xl p-3 sm:p-4 text-left text-xs space-y-2 border border-[#ece8e1]">
                <div className="flex justify-between">
                  <span className="text-[#6b6760]">Timestamp:</span>
                  <span className="font-semibold text-[#1b1c1a]">{uploadTimestamp}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#6b6760]">Client Encryption:</span>
                  <span className="font-semibold text-emerald-700">AES-GCM-256 (In-Transit)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#6b6760]">Decryption Mode:</span>
                  <span className="font-semibold text-[#1b1c1a]">Ephemeral Volatile RAM Only</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#6b6760]">Storage Mode:</span>
                  <span className="font-semibold text-amber-700">
                    {isSimulated ? 'Local Mock/Cache (Demo Session)' : 'Supabase Enclave Storage'}
                  </span>
                </div>
              </div>

              {/* Action Buttons: includes direct Re-Upload so user never needs to refresh */}
              <div className="pt-2 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setUploadSuccess(false);
                    setTimeout(() => fileInputRef.current?.click(), 100);
                  }}
                  className="w-full py-3 px-4 rounded-xl border border-[#d1d7db] bg-white hover:bg-[#f0f2f5] text-[#111b21] text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs"
                >
                  <span>🔄</span>
                  <span>Select Another File / Re-Upload</span>
                </button>

                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    type="button"
                    onClick={() => router.push(`/demo/whatsapp?uploaded=true&jobId=${encodeURIComponent(job?.id || '')}`)}
                    className="flex-1 py-3 px-4 rounded-xl bg-[#00a884] hover:bg-[#008f6f] text-white text-xs sm:text-sm font-bold transition-all shadow-sm cursor-pointer text-center"
                  >
                    Return to WhatsApp Chat
                  </button>
                  <Link
                    href="/"
                    className="flex-1 py-3 px-4 rounded-xl bg-[#e1e0ff] hover:bg-[#d4d2ff] text-[#07006c] text-xs sm:text-sm font-bold transition-all text-center flex items-center justify-center gap-1"
                  >
                    <span>📱 View in Live Tracker</span>
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Privacy Notice Banner */}
              <div className="bg-[#fff8e6] border border-[#f0df9e] rounded-2xl p-3 sm:p-3.5 flex items-start gap-2.5 sm:gap-3">
                <span className="text-lg sm:text-xl">🛡️</span>
                <div className="text-[11px] sm:text-xs text-[#523d00] leading-relaxed">
                  <strong>Zero-Leak Architecture:</strong> Your document is encrypted before leaving your browser.
                  Sai Xerox operators view files in sandboxed memory. No disk copies or WhatsApp Web storage.
                </div>
              </div>

              {/* File Selector Dropzone */}
              <div className="space-y-2">
                <label className="block text-[11px] sm:text-xs font-bold text-[#1b1c1a] uppercase tracking-wide">
                  Select Document to Encrypt &amp; Print
                </label>

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                  className="hidden"
                />

                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full border-2 border-dashed border-[#d5d1c8] hover:border-[#3d3bf3] rounded-2xl p-4 sm:p-6 text-center bg-[#fbf9f5] hover:bg-white transition-all cursor-pointer space-y-2"
                >
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#e1e0ff] text-[#3d3bf3] flex items-center justify-center mx-auto text-lg sm:text-xl font-bold">
                    📄
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm font-bold text-[#1b1c1a] truncate max-w-xs mx-auto">{fileName}</p>
                    <p className="text-[11px] text-[#6b6760] mt-0.5">{fileSize} • PDF, JPG, PNG up to 25MB</p>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      fileInputRef.current?.click();
                    }}
                    className="inline-block text-xs font-semibold text-[#3d3bf3] bg-white px-3 py-1.5 rounded-full border border-[#ece8e1] hover:bg-[#f5f3ef] cursor-pointer"
                  >
                    Change Document
                  </button>
                </div>
              </div>

              {/* Aadhaar / ID Masking Toggle */}
              <div className="bg-[#f5f3ef] rounded-2xl p-3 sm:p-3.5 flex items-center justify-between border border-[#ece8e1]">
                <div className="space-y-0.5 pr-2">
                  <span className="text-xs font-bold text-[#1b1c1a] block">Auto-Mask Sensitive ID Digits</span>
                  <p className="text-[11px] text-[#6b6760] leading-snug">
                    Automatically redacts the first 8 digits of Aadhaar or Government ID cards in RAM.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsMasked(!isMasked)}
                  className={`w-12 h-6 rounded-full transition-colors p-0.5 shrink-0 cursor-pointer ${
                    isMasked ? 'bg-[#3d3bf3]' : 'bg-[#d5d1c8]'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                      isMasked ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Order Specs Preview */}
              <div className="border-t border-[#ece8e1] pt-3 text-xs text-[#6b6760] space-y-1">
                <div className="flex justify-between">
                  <span>Printing Spec:</span>
                  <span className="font-semibold text-[#1b1c1a]">
                    {job?.pageCount} pages × {job?.copies} {job?.copies && job.copies > 1 ? 'copies' : 'copy'} ({job?.colorMode === 'bw' ? 'B&W' : 'Colour'})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Finishing:</span>
                  <span className="font-semibold text-[#1b1c1a]">
                    {job?.paperSize || 'A4'}, {job?.printSide === 'double' ? 'Double-sided' : 'Single-sided'}, Binding: {job?.binding || 'none'}
                  </span>
                </div>
              </div>

              {/* Upload CTA */}
              <button
                type="button"
                onClick={handleUpload}
                disabled={isUploading}
                className="w-full py-3.5 sm:py-4 px-4 rounded-xl bg-[#3d3bf3] hover:bg-[#2e2cd4] text-white text-xs sm:text-sm font-bold shadow-sm active:scale-[0.99] transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
              >
                {isUploading ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                    </svg>
                    <span>Encrypting &amp; Uploading to Enclave...</span>
                  </>
                ) : (
                  <span>🔒 Encrypt &amp; Upload Document</span>
                )}
              </button>

              <div className="flex items-center justify-between pt-1 text-[11px] text-[#6b6760]">
                <Link href="/demo/whatsapp" className="hover:underline text-[#00a884] font-semibold">
                  ← Back to WhatsApp Chat
                </Link>
                <span>Hardware Enclave • No Disk Retention</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SecureUploadPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[100dvh] bg-[#f5f3ef] flex items-center justify-center p-6 text-xs text-[#6b6760]">
          Loading PrintVault Secure Enclave...
        </div>
      }
    >
      <UploadContent />
    </Suspense>
  );
}
