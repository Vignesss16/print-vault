'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { ScreenType, PrintJob, RecentPrintItem, PrintShop, ViewMode } from '@/types/printvault';
import { initialActiveJob, mockRecentPrints, mockShops } from '@/data/mockData';

interface PrintVaultContextType {
  currentScreen: ScreenType;
  setCurrentScreen: (screen: ScreenType) => void;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  activeJob: PrintJob | null;
  setActiveJob: React.Dispatch<React.SetStateAction<PrintJob | null>>;
  recentPrints: RecentPrintItem[];
  toastMessage: string | null;
  triggerToast: (msg: string) => void;
  createNewJob: (jobData: {
    fileName: string;
    fileSize: string;
    pageCount: number;
    copies: number;
    colorMode: 'bw' | 'color';
    shop: PrintShop;
    isMaskedAadhaar: boolean;
  }) => void;
  revokeActiveJob: () => void;
  completeAndPurgeActiveJob: () => void;
  selectedReceipt: PrintJob | null;
  viewReceipt: (receipt?: PrintJob | RecentPrintItem) => void;
  countdown: number;
  formatCountdown: (seconds: number) => string;
}

const PrintVaultContext = createContext<PrintVaultContextType | undefined>(undefined);

export function PrintVaultProvider({ children }: { children: React.ReactNode }) {
  const [currentScreen, setCurrentScreen] = useState<ScreenType>('home');
  const [viewMode, setViewMode] = useState<ViewMode>('auto');
  const [activeJob, setActiveJob] = useState<PrintJob | null>(initialActiveJob);
  const [recentPrints, setRecentPrints] = useState<RecentPrintItem[]>(mockRecentPrints);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [selectedReceipt, setSelectedReceipt] = useState<PrintJob | null>(null);
  const [countdown, setCountdown] = useState<number>(582); // ~9m 42s

  // Countdown timer effect
  useEffect(() => {
    if (!activeJob || countdown <= 0) return;
    const interval = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [activeJob, countdown]);

  const formatCountdown = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2500);
  };

  const createNewJob = async (jobData: {
    fileName: string;
    fileSize: string;
    pageCount: number;
    copies: number;
    colorMode: 'bw' | 'color';
    shop: PrintShop;
    isMaskedAadhaar: boolean;
  }) => {
    const unitPrice = jobData.colorMode === 'bw' ? 3 : 10;
    const totalPrice = unitPrice * jobData.pageCount * jobData.copies;
    const randPart = Math.random().toString(36).substring(2, 6).toUpperCase();
    const randTokenNum = Math.floor(100000 + Math.random() * 900000).toString();
    const formattedToken = `${randTokenNum.slice(0, 3)} ${randTokenNum.slice(3)}`;

    const newJob: PrintJob = {
      id: `PV-${randPart}-2026`,
      token: formattedToken,
      fileName: jobData.fileName,
      fileSize: jobData.fileSize,
      pageCount: jobData.pageCount,
      copies: jobData.copies,
      colorMode: jobData.colorMode,
      totalPrice,
      shop: jobData.shop,
      status: 'ready_for_scan',
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      expiresInSeconds: 600,
      isMaskedAadhaar: jobData.isMaskedAadhaar,
      sha256Hash: `${Math.random().toString(16).substring(2, 6)}...${Math.random().toString(16).substring(2, 6)}`,
      verificationKey: `${Math.random().toString(16).substring(2, 6)}...${Math.random().toString(16).substring(2, 6)}`,
    };

    setActiveJob(newJob);
    setCountdown(600);
    setCurrentScreen('shop_qr');
    triggerToast('Secure Print Token Generated');

    // Async persist to Backend API / Supabase
    try {
      await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: newJob.fileName,
          fileSize: newJob.fileSize,
          pageCount: newJob.pageCount,
          copies: newJob.copies,
          colorMode: newJob.colorMode,
          shopId: newJob.shop.id,
          isMaskedAadhaar: newJob.isMaskedAadhaar,
          shop: newJob.shop,
        }),
      });
    } catch {
      // Ignored: optimistic UI already applied
    }
  };

  const revokeActiveJob = async () => {
    if (!activeJob) return;
    const jobId = activeJob.id;
    const revokedItem: RecentPrintItem = {
      id: `rev-${Date.now()}`,
      fileName: activeJob.fileName,
      shopName: activeJob.shop.name,
      timestamp: 'Just now (Revoked)',
      status: 'Access ended',
      pageCount: activeJob.pageCount,
      colorMode: activeJob.colorMode,
    };
    setRecentPrints((prev) => [revokedItem, ...prev]);
    setActiveJob(null);
    triggerToast('Access Revoked. Volatile buffer purged.');
    setCurrentScreen('home');

    // Trigger backend revocation & purge receipt creation
    try {
      await fetch(`/api/jobs/${encodeURIComponent(jobId)}/revoke`, {
        method: 'POST',
      });
    } catch {
      // Handled optimistically
    }
  };

  const completeAndPurgeActiveJob = async () => {
    if (!activeJob) return;
    const jobId = activeJob.id;
    const completedItem: RecentPrintItem = {
      id: `done-${Date.now()}`,
      fileName: activeJob.fileName,
      shopName: activeJob.shop.name,
      timestamp: 'Just now',
      status: 'Done',
      pageCount: activeJob.pageCount,
      colorMode: activeJob.colorMode,
    };
    setSelectedReceipt({
      ...activeJob,
      status: 'completed_purged',
    });
    setRecentPrints((prev) => [completedItem, ...prev]);
    setActiveJob(null);
    setCurrentScreen('receipt');

    // Trigger backend DoD shred & verified purge receipt
    try {
      await fetch(`/api/jobs/${encodeURIComponent(jobId)}/purge`, {
        method: 'POST',
      });
    } catch {
      // Handled optimistically
    }
  };

  const viewReceipt = (item?: PrintJob | RecentPrintItem) => {
    if (!item) {
      // Default to initial receipt
      setSelectedReceipt(initialActiveJob);
    } else if ('totalPrice' in item) {
      setSelectedReceipt(item);
    } else {
      // Convert recent print to receipt view
      setSelectedReceipt({
        id: 'PV-8F3K-29XA',
        token: '849 201',
        fileName: item.fileName,
        fileSize: '1.8 MB',
        pageCount: item.pageCount,
        copies: 1,
        colorMode: item.colorMode,
        totalPrice: item.pageCount * (item.colorMode === 'bw' ? 3 : 10),
        shop: mockShops.find((s) => s.name === item.shopName) || mockShops[0],
        status: 'completed_purged',
        createdAt: item.timestamp,
        expiresInSeconds: 0,
        isMaskedAadhaar: true,
        sha256Hash: '9e7b...4c19',
        verificationKey: 'e98a...f201',
      });
    }
    setCurrentScreen('receipt');
  };

  return (
    <PrintVaultContext.Provider
      value={{
        currentScreen,
        setCurrentScreen,
        viewMode,
        setViewMode,
        activeJob,
        setActiveJob,
        recentPrints,
        toastMessage,
        triggerToast,
        createNewJob,
        revokeActiveJob,
        completeAndPurgeActiveJob,
        selectedReceipt,
        viewReceipt,
        countdown,
        formatCountdown,
      }}
    >
      {children}
    </PrintVaultContext.Provider>
  );
}

export function usePrintVault() {
  const context = useContext(PrintVaultContext);
  if (!context) {
    throw new Error('usePrintVault must be used within a PrintVaultProvider');
  }
  return context;
}
