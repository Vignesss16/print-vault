'use client';

import React, { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  calculatePrintPrice,
  validateAndParsePageRange,
  DEMO_RATES,
  ColorMode,
  PaperSize,
  PrintSide,
  BindingOption,
  PricingBreakdown,
} from '@/lib/pricing';
import { saiXeroxShop } from '@/data/mockData';
import { StoredPrintJob } from '@/lib/jobsStore';
import { PrintJob, RecentPrintItem } from '@/types/printvault';

type ConversationStage =
  | 'WELCOME'
  | 'MAIN_MENU'
  | 'SELECT_DOCUMENT'
  | 'CONFIG_CARD'
  | 'CREATE_JOB'
  | 'AWAITING_UPLOAD'
  | 'ORDER_TRACKING'
  | 'PAYMENT_PENDING'
  | 'PAYMENT_CONFIRMED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'HELP';

interface OrderDraft {
  fileName: string;
  fileSize: string;
  totalDocPages: number;
  pageCount: number;
  pageSelectionType: 'all' | 'custom';
  pageRangeText?: string;
  selectedPages?: number[];
  copies: number;
  colorMode: ColorMode;
  paperSize: PaperSize;
  printSide: PrintSide;
  binding: BindingOption;
  instructions: string;
}

interface ChatMessage {
  id: string;
  sender: 'shop' | 'user' | 'system';
  text: string;
  timestamp: string;
  quickReplies?: string[];
  type?:
    | 'text'
    | 'document_selector'
    | 'configurator_card'
    | 'order_summary'
    | 'status_card'
    | 'pricing_card'
    | 'upload_card'
    | 'payment_card'
    | 'privacy_warning';
  metadata?: {
    pricing?: PricingBreakdown;
    job?: StoredPrintJob;
    uploadUrl?: string;
    token?: string;
    jobId?: string;
    customNote?: string;
    draft?: OrderDraft;
  };
}

const DEMO_DOCUMENT_PRESETS = [
  {
    id: 'aadhaar',
    name: 'e-Aadhaar_Masked_2026.pdf',
    size: '1.4 MB',
    pages: 2,
    label: '📄 Aadhaar Card (2 pages)',
    description: 'Government ID • Double-sided recommended',
  },
  {
    id: 'assignment',
    name: 'CS402_Distributed_Systems_Assignment.pdf',
    size: '2.8 MB',
    pages: 6,
    label: '📑 Assignment (6 pages)',
    description: 'Coursework • B&W or Colour',
  },
  {
    id: 'thesis',
    name: 'Final_Year_Thesis_Report.pdf',
    size: '5.2 MB',
    pages: 16,
    label: '📚 Project Thesis (16 pages)',
    description: 'Complete Report • Spiral binding',
  },
  {
    id: 'resume',
    name: 'Curriculum_Vitae_2026.pdf',
    size: '520 KB',
    pages: 1,
    label: '📋 Resume / CV (1 page)',
    description: 'Single sheet • High quality A4',
  },
];

const DEFAULT_ORDER_DRAFT: OrderDraft = {
  fileName: '',
  fileSize: '',
  totalDocPages: 0,
  pageCount: 0,
  pageSelectionType: 'all',
  pageRangeText: '',
  selectedPages: [],
  copies: 1,
  colorMode: 'bw',
  paperSize: 'A4',
  printSide: 'double',
  binding: 'none',
  instructions: '',
};

// Client-side quick PDF page detector
async function detectPdfPageCount(file: File): Promise<number> {
  try {
    const buffer = await file.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    const text = new TextDecoder('latin1').decode(bytes.slice(0, Math.min(bytes.length, 1024 * 1024)));
    const matches = text.match(/\/Type\s*\/Page[^s]/g);
    if (matches && matches.length > 0) {
      return matches.length;
    }
    const countMatch = text.match(/\/Type\s*\/Pages[\s\S]*?\/Count\s+(\d+)/);
    if (countMatch && countMatch[1]) {
      const parsed = parseInt(countMatch[1], 10);
      if (!isNaN(parsed) && parsed > 0) return parsed;
    }
  } catch {}
  // Default estimate based on size
  const sizeMB = file.size / (1024 * 1024);
  return Math.max(1, Math.min(30, Math.ceil(sizeMB * 3)));
}

function WhatsAppDemoChat() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlUploaded = searchParams.get('uploaded');
  const urlJobId = searchParams.get('jobId');

  // Conversation State
  const [stage, setStage] = useState<ConversationStage>('MAIN_MENU');
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: 'welcome-msg-init',
      sender: 'shop',
      text: `Hello! Welcome to Sai Xerox 👋\n\nI'm your PrintVault print assistant. Place your print order here, upload your document through a secure link, and track the order.\n\nFor your privacy, please do not send document files directly in this chat.`,
      timestamp: '10:00 AM',
      quickReplies: ['Start New Print Order', 'Track Existing Order', 'View Price List', 'Help'],
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [orderDraft, setOrderDraft] = useState<OrderDraft>(DEFAULT_ORDER_DRAFT);
  const [activeCreatedJob, setActiveCreatedJob] = useState<StoredPrintJob | null>(null);
  const [isSubmittingJob, setIsSubmittingJob] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showSimulationInfo, setShowSimulationInfo] = useState(false);
  const [customRangeInput, setCustomRangeInput] = useState('');
  const [rangeError, setRangeError] = useState<string | null>(null);
  const [showMobileShopDrawer, setShowMobileShopDrawer] = useState(false);

  const idCounterRef = useRef(10);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Helper to add shop message with realistic typing delay
  const addShopMessage = useCallback(
    (
      text: string,
      quickReplies?: string[],
      extra?: Partial<ChatMessage>,
      delayMs = 450
    ) => {
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const uniqueId = `msg-shop-${idCounterRef.current++}`;
        setMessages((prev) => [
          ...prev,
          {
            id: uniqueId,
            sender: 'shop',
            text,
            timestamp: timeStr,
            quickReplies,
            ...extra,
          },
        ]);
      }, delayMs);
    },
    []
  );

  // Helper to add user message immediately
  const addUserMessage = (text: string) => {
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const uniqueId = `msg-user-${idCounterRef.current++}`;
    setMessages((prev) => [
      ...prev,
      {
        id: uniqueId,
        sender: 'user',
        text,
        timestamp: timeStr,
      },
    ]);
  };

  // Synchronize a job into PrintVault System State
  const syncJobToSystem = useCallback((stored: StoredPrintJob, initialStatus: PrintJob['status'] = 'ready_for_scan') => {
    if (typeof window === 'undefined') return;

    const systemJob: PrintJob = {
      id: stored.id,
      token: stored.token,
      fileName: stored.fileName,
      fileSize: stored.fileSize || '1.8 MB',
      pageCount: stored.pageCount,
      copies: stored.copies,
      colorMode: stored.colorMode,
      totalPrice: stored.totalPrice,
      shop: saiXeroxShop,
      status: initialStatus,
      createdAt: 'Just now',
      expiresInSeconds: 600,
      isMaskedAadhaar: true,
      sha256Hash: stored.sha256Hash || '9e7b...4c19',
      verificationKey: stored.verificationKey || 'e98a...f201',
    };

    try {
      localStorage.setItem('printvault_active_job', JSON.stringify(systemJob));
      localStorage.setItem(
        'printvault_realtime_event',
        JSON.stringify({
          type: 'NEW_DOCUMENT',
          activeJob: systemJob,
          _t: Date.now(),
        })
      );
      if ('BroadcastChannel' in window) {
        const bc = new BroadcastChannel('printvault_realtime_sync');
        bc.postMessage({ type: 'NEW_DOCUMENT', activeJob: systemJob });
        bc.close();
      }
    } catch (e) {
      console.warn('System sync warning:', e);
    }
  }, []);

  const handleUploadConfirmed = useCallback(
    (jobId: string, docName?: string) => {
      setStage('ORDER_TRACKING');
      addShopMessage(
        `✅ *Document Upload Confirmed!*\n\n• *Job Reference*: ${jobId}\n• *Document*: ${docName || 'Encrypted File'}\n• *Enclave Status*: Ready for Kiosk Review in RAM\n\nSai Xerox kiosk operator can now view and print without saving to disk.`,
        ['Simulate Step: Printing', 'Simulate Step: Purge & Complete', 'Simulate UPI Payment', 'View in System Tracker'],
        {
          type: 'status_card',
          metadata: {
            jobId,
            customNote: 'Document verified in PrintVault enclave RAM. Decryption token ready for operator scan.',
          },
        },
        500
      );
    },
    [addShopMessage]
  );

  // Initial Welcome Flow
  const startFreshConversation = () => {
    setStage('MAIN_MENU');
    setOrderDraft(DEFAULT_ORDER_DRAFT);
    setActiveCreatedJob(null);
    setCustomRangeInput('');
    setRangeError(null);

    const initialWelcome: ChatMessage = {
      id: `welcome-msg-${idCounterRef.current++}`,
      sender: 'shop',
      text: `Hello! Welcome to Sai Xerox 👋\n\nI'm your PrintVault print assistant. Place your print order here, upload your document through a secure link, and track the order.\n\nFor your privacy, please do not send document files directly in this chat.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      quickReplies: ['Start New Print Order', 'Track Existing Order', 'View Price List', 'Help'],
    };

    setMessages([initialWelcome]);
  };

  // Listen for upload completion from the dedicated upload route
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'printvault_whatsapp_upload_done' && e.newValue) {
        try {
          const payload = JSON.parse(e.newValue);
          if (payload.jobId && (activeCreatedJob?.id === payload.jobId || stage === 'AWAITING_UPLOAD')) {
            handleUploadConfirmed(payload.jobId, payload.fileName);
          }
        } catch {}
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [activeCreatedJob, stage, handleUploadConfirmed]);

  // Handle URL redirect with uploaded=true
  useEffect(() => {
    if (urlUploaded === 'true' && urlJobId && stage === 'AWAITING_UPLOAD') {
      const timer = setTimeout(() => {
        handleUploadConfirmed(urlJobId, orderDraft.fileName);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [urlUploaded, urlJobId, stage, orderDraft.fileName, handleUploadConfirmed]);

  // Universal command interceptor
  const handleUniversalCommand = (rawText: string): boolean => {
    const cmd = rawText.trim().toLowerCase();

    if (cmd === 'cancel' || cmd === 'stop' || cmd === 'abort') {
      addUserMessage(rawText);
      setStage('CANCELLED');
      setOrderDraft(DEFAULT_ORDER_DRAFT);
      setActiveCreatedJob(null);
      addShopMessage(
        `Current order has been cancelled safely. No files or pending jobs were retained.\n\nHow can I help you next?`,
        ['Start New Print Order', 'Track Existing Order', 'View Price List']
      );
      return true;
    }

    if (cmd === 'restart' || cmd === 'reset') {
      addUserMessage(rawText);
      startFreshConversation();
      return true;
    }

    if (cmd === 'help' || cmd === 'commands') {
      addUserMessage(rawText);
      addShopMessage(
        `🤖 *Sai Xerox • PrintVault Print Assistant Help*\n\n` +
          `• *Start New Print Order*: Choose your document first to detect real pages, then configure print options with live pricing.\n` +
          `• *System Sync*: Once confirmed, your print job goes directly into the PrintVault system & Live Tracker.\n` +
          `• *Zero-Leak Upload*: Use the generated secure upload link to encrypt your file with AES-GCM.\n` +
          `• *Track Order*: Enter your Job Reference code (e.g. PV-XXXX-2026).\n` +
          `• *Commands*: Type *cancel* anytime to abort, or *restart* to reset.`,
        ['Start New Print Order', 'Track Existing Order', 'View Price List']
      );
      return true;
    }

    return false;
  };

  // Step 1: Prompt user to select/attach document first
  const initiateDocumentSelection = () => {
    setStage('SELECT_DOCUMENT');
    addShopMessage(
      `Great! To prepare your print at Sai Xerox, please select or attach your document first.\n\nI will detect the exact page count, file format, and prepare your print options:`,
      ['📁 Choose File from Device', '📄 Aadhaar Card (2 pages)', '📑 Assignment (6 pages)', '📚 Project Thesis (16 pages)', '📋 Resume / CV (1 page)'],
      {
        type: 'document_selector',
      }
    );
  };

  // Step 2: Handle document selection (either from file picker or preset)
  const handleDocumentChosen = (doc: { name: string; size: string; pages: number }) => {
    const newDraft: OrderDraft = {
      fileName: doc.name,
      fileSize: doc.size,
      totalDocPages: doc.pages,
      pageCount: doc.pages,
      pageSelectionType: 'all',
      pageRangeText: `All pages (1-${doc.pages})`,
      selectedPages: Array.from({ length: doc.pages }, (_, i) => i + 1),
      copies: 1,
      colorMode: 'bw',
      paperSize: 'A4',
      printSide: doc.pages > 1 ? 'double' : 'single',
      binding: 'none',
      instructions: '',
    };

    setOrderDraft(newDraft);
    setCustomRangeInput('');
    setRangeError(null);
    setStage('CONFIG_CARD');

    addUserMessage(`Attached document: ${doc.name} (${doc.pages} ${doc.pages > 1 ? 'pages' : 'page'}, ${doc.size})`);

    const pricing = calculatePrintPrice({
      fileName: newDraft.fileName,
      pageCount: newDraft.pageCount,
      copies: newDraft.copies,
      colorMode: newDraft.colorMode,
      paperSize: newDraft.paperSize,
      printSide: newDraft.printSide,
      binding: newDraft.binding,
    });

    addShopMessage(
      `✅ Document received: *${doc.name}* (${doc.pages} pages, ${doc.size}).\n\nCustomize your print settings below with real-time price calculation:`,
      ['⚡ Confirm & Place Order', 'Cancel'],
      {
        type: 'configurator_card',
        metadata: { draft: newDraft, pricing },
      },
      300
    );
  };

  // Handle actual file input change from user's filesystem
  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const sizeStr =
      file.size > 1024 * 1024
        ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
        : `${Math.round(file.size / 1024)} KB`;

    let detectedPages = 1;
    if (file.name.toLowerCase().endsWith('.pdf')) {
      detectedPages = await detectPdfPageCount(file);
    } else if (file.type.startsWith('image/')) {
      detectedPages = 1;
    } else {
      detectedPages = Math.max(1, Math.ceil(file.size / (250 * 1024)));
    }

    handleDocumentChosen({
      name: file.name,
      size: sizeStr,
      pages: detectedPages,
    });

    // Reset input
    e.target.value = '';
  };

  // Send message action
  const handleUserSubmit = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    if (handleUniversalCommand(trimmed)) {
      setInputValue('');
      return;
    }

    addUserMessage(trimmed);
    setInputValue('');
    processStateMachineInput(trimmed);
  };

  // State Machine Transitions
  const processStateMachineInput = (input: string) => {
    const lower = input.toLowerCase();

    // 1. MAIN MENU
    if (stage === 'MAIN_MENU' || stage === 'CANCELLED' || stage === 'COMPLETED') {
      if (lower.includes('start') || lower.includes('new') || lower.includes('order') || lower.includes('print')) {
        initiateDocumentSelection();
        return;
      }

      if (lower.includes('track')) {
        setStage('ORDER_TRACKING');
        addShopMessage(
          `Please enter your PrintVault Job Reference (e.g., PV-8F3K-29XA or your 6-digit PIN):`,
          ['PV-8F3K-29XA', 'Cancel']
        );
        return;
      }

      if (lower.includes('price') || lower.includes('rate') || lower.includes('cost')) {
        displayPriceList();
        return;
      }

      if (lower.includes('help')) {
        handleUniversalCommand('help');
        return;
      }

      addShopMessage(
        `I didn't quite catch that. Please choose one of the options below:`,
        ['Start New Print Order', 'Track Existing Order', 'View Price List', 'Help']
      );
      return;
    }

    // 2. SELECT DOCUMENT
    if (stage === 'SELECT_DOCUMENT') {
      if (lower.includes('file') || lower.includes('device') || lower.includes('upload') || lower.includes('choose')) {
        fileInputRef.current?.click();
        return;
      }

      // Check presets
      if (lower.includes('aadhaar')) {
        const p = DEMO_DOCUMENT_PRESETS[0];
        handleDocumentChosen({ name: p.name, size: p.size, pages: p.pages });
        return;
      }
      if (lower.includes('assignment')) {
        const p = DEMO_DOCUMENT_PRESETS[1];
        handleDocumentChosen({ name: p.name, size: p.size, pages: p.pages });
        return;
      }
      if (lower.includes('thesis') || lower.includes('report') || lower.includes('project')) {
        const p = DEMO_DOCUMENT_PRESETS[2];
        handleDocumentChosen({ name: p.name, size: p.size, pages: p.pages });
        return;
      }
      if (lower.includes('resume') || lower.includes('cv')) {
        const p = DEMO_DOCUMENT_PRESETS[3];
        handleDocumentChosen({ name: p.name, size: p.size, pages: p.pages });
        return;
      }

      addShopMessage(
        `Please select a document or choose one of the quick presets below:`,
        ['📁 Choose File from Device', '📄 Aadhaar Card (2 pages)', '📑 Assignment (6 pages)', '📚 Project Thesis (16 pages)', '📋 Resume / CV (1 page)']
      );
      return;
    }

    // 3. CONFIG CARD (Natural Language updates to order draft)
    if (stage === 'CONFIG_CARD') {
      if (lower.includes('confirm') || lower.includes('place') || lower.includes('done') || lower.includes('ok') || lower.includes('yes')) {
        executeJobCreation(orderDraft);
        return;
      }

      if (lower.includes('change') && (lower.includes('file') || lower.includes('doc'))) {
        initiateDocumentSelection();
        return;
      }

      // Check copies modification
      const copiesMatch = input.match(/(\d+)\s*(copies|copy)/i);
      if (copiesMatch) {
        const count = parseInt(copiesMatch[1], 10);
        if (count >= 1 && count <= 100) {
          updateDraftProperty({ copies: count });
          addShopMessage(`Updated copies to ${count}.`);
          return;
        }
      }

      // Check color modification
      if (lower.includes('black and white') || lower.includes('b&w') || lower.includes('bw')) {
        updateDraftProperty({ colorMode: 'bw' });
        addShopMessage(`Updated to Black & White printing.`);
        return;
      }
      if (lower.includes('color') || lower.includes('colour')) {
        updateDraftProperty({ colorMode: 'color' });
        addShopMessage(`Updated to Full Colour printing.`);
        return;
      }

      // Check sides
      if (lower.includes('single')) {
        updateDraftProperty({ printSide: 'single' });
        addShopMessage(`Updated to Single-sided printing.`);
        return;
      }
      if (lower.includes('double') || lower.includes('duplex')) {
        updateDraftProperty({ printSide: 'double' });
        addShopMessage(`Updated to Double-sided duplex printing.`);
        return;
      }

      // Check paper
      if (lower.includes('a3')) {
        updateDraftProperty({ paperSize: 'A3' });
        addShopMessage(`Updated paper size to A3.`);
        return;
      }
      if (lower.includes('a4')) {
        updateDraftProperty({ paperSize: 'A4' });
        addShopMessage(`Updated paper size to A4.`);
        return;
      }

      addShopMessage(
        `You can adjust settings directly on the card above, or tap "Confirm & Place Order":`,
        ['⚡ Confirm & Place Order', '📁 Choose Another Document', 'Cancel']
      );
      return;
    }

    // 4. ORDER TRACKING
    if (stage === 'ORDER_TRACKING') {
      if (lower.includes('view in system') || lower.includes('system tracker') || lower.includes('main app')) {
        router.push('/');
        return;
      }
      executeOrderTracking(input.trim());
      return;
    }

    // Fallback
    addShopMessage(
      `I didn't recognize that instruction. Type "help" or select an option:`,
      ['Start New Print Order', 'Track Existing Order', 'Help']
    );
  };

  // Direct updater for order draft properties
  const updateDraftProperty = (updates: Partial<OrderDraft>) => {
    setOrderDraft((prev) => {
      const next = { ...prev, ...updates };
      return next;
    });
  };

  // Handle custom range input change
  const handleApplyCustomRange = (rangeStr: string) => {
    if (!rangeStr.trim() || !orderDraft.totalDocPages) return;
    const res = validateAndParsePageRange(rangeStr, orderDraft.totalDocPages);
    if (!res.valid) {
      setRangeError(res.error || 'Invalid range format');
      return;
    }
    setRangeError(null);
    updateDraftProperty({
      pageSelectionType: 'custom',
      pageRangeText: rangeStr,
      pageCount: res.pageCount,
      selectedPages: res.pages,
    });
  };

  // Real Backend API call to create job and sync into system state
  const executeJobCreation = async (draft: OrderDraft) => {
    if (isSubmittingJob) return;
    setIsSubmittingJob(true);
    setStage('CREATE_JOB');

    const pricing = calculatePrintPrice({
      fileName: draft.fileName || 'document.pdf',
      pageCount: draft.pageCount || 1,
      copies: draft.copies || 1,
      colorMode: draft.colorMode || 'bw',
      paperSize: draft.paperSize || 'A4',
      printSide: draft.printSide || 'double',
      binding: draft.binding || 'none',
    });

    try {
      const res = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: draft.fileName || 'document.pdf',
          fileSize: draft.fileSize || '1.8 MB',
          pageCount: draft.pageCount || 1,
          copies: draft.copies || 1,
          colorMode: draft.colorMode || 'bw',
          totalPrice: pricing.grandTotal,
          shopId: saiXeroxShop.id,
          shop: saiXeroxShop,
          paperSize: draft.paperSize,
          printSide: draft.printSide,
          binding: draft.binding,
          pageRange: draft.pageRangeText,
          instructions: draft.instructions,
          status: 'ready_for_scan',
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Server error creating print job.');
      }

      const returnedJob: StoredPrintJob = data.job;
      setActiveCreatedJob(returnedJob);
      setStage('AWAITING_UPLOAD');

      // CRITICAL: Push directly to PrintVault System State
      syncJobToSystem(returnedJob, 'ready_for_scan');

      const isLocal = data.source === 'local_cache';
      const uploadUrl = `/demo/whatsapp/upload?jobId=${encodeURIComponent(returnedJob.id)}&token=${encodeURIComponent(
        returnedJob.token
      )}&mode=upload`;

      const createdMsg =
        `🎉 *Your print order has been created & synced to the system!*\n\n` +
        `• *Job Reference*: ${returnedJob.id}\n` +
        `• *Pickup PIN*: ${returnedJob.token}\n` +
        `• *Shop*: Sai Xerox (College Main Gate)\n` +
        `• *Document*: ${returnedJob.fileName} (${returnedJob.pageCount} pages, ${returnedJob.copies} ${returnedJob.copies > 1 ? 'copies' : 'copy'})\n` +
        `• *Total Price*: ₹${returnedJob.totalPrice}\n` +
        `• *System Sync*: Active in PrintVault Live Tracker\n` +
        `• *Persistence*: ${isLocal ? 'Local Cache (Demo Mode)' : 'Supabase Production Database'}\n\n` +
        `🔒 *Next Step*: Please upload and client-side encrypt your document through the secure PrintVault upload page.`;

      addShopMessage(
        createdMsg,
        ['Open Secure Upload Page', 'View in System Tracker', 'Simulate Operator Printing', 'Simulate Purge & Complete'],
        {
          type: 'upload_card',
          metadata: {
            job: returnedJob,
            uploadUrl,
            jobId: returnedJob.id,
            token: returnedJob.token,
          },
        },
        500
      );
    } catch (err: unknown) {
      setStage('CONFIG_CARD');
      const msg = err instanceof Error ? err.message : 'Failed to create print job.';
      addShopMessage(
        `❌ API Error: ${msg}\n\nPlease try confirming again or check network connectivity.`,
        ['⚡ Confirm & Place Order', 'Cancel']
      );
    } finally {
      setIsSubmittingJob(false);
    }
  };

  // Real Backend API call to track job
  const executeOrderTracking = async (searchRef: string) => {
    try {
      const res = await fetch(`/api/jobs/${encodeURIComponent(searchRef)}`);
      const data = await res.json();

      if (!res.ok || !data.success || !data.job) {
        addShopMessage(
          `❌ Order not found for reference "${searchRef}".\n\nPlease verify your Job Reference (e.g., PV-8F3K-29XA or your 6-digit PIN) and try again.`,
          ['Track Another Order', 'Start New Print Order', 'Main Menu']
        );
        return;
      }

      const job: StoredPrintJob = data.job;
      const statusLabel =
        job.status === 'ready_for_scan'
          ? 'Ready for Kiosk Scan'
          : job.status === 'printing'
          ? 'Printing in Progress'
          : job.status === 'completed_purged'
          ? 'Completed & DoD Shredded'
          : job.status === 'revoked'
          ? 'Revoked & Keys Purged'
          : job.status;

      const trackingText =
        `📦 *Live Print Job Status*\n\n` +
        `• *Reference*: ${job.id}\n` +
        `• *Pickup PIN*: ${job.token}\n` +
        `• *Shop*: ${job.shop?.name || 'Sai Xerox'}\n` +
        `• *Document*: ${job.fileName} (${job.pageCount} pages, ${job.copies} ${job.copies > 1 ? 'copies' : 'copy'})\n` +
        `• *Current Status*: ${statusLabel}\n` +
        `• *Amount*: ₹${job.totalPrice}\n` +
        `• *Data Source*: ${data.source === 'local_cache' ? 'Local Demo Session' : 'Supabase Enclave'}`;

      addShopMessage(
        trackingText,
        ['Simulate Step: Printing', 'Simulate Step: Purge & Complete', 'Simulate UPI Payment', 'View in System Tracker'],
        {
          type: 'status_card',
          metadata: { job, jobId: job.id },
        }
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      addShopMessage(
        `Network error retrieving job status: ${msg}`,
        ['Track Existing Order', 'Main Menu']
      );
    }
  };

  // Simulate shop status transition and broadcast to system
  const handleSimulateStatus = async (targetStatus: StoredPrintJob['status']) => {
    const targetJobId = activeCreatedJob?.id || 'PV-8F3K-29XA';

    try {
      const res = await fetch(`/api/jobs/${encodeURIComponent(targetJobId)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: targetStatus }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to update status');
      }

      setActiveCreatedJob(data.job);

      // System synchronization
      if (typeof window !== 'undefined') {
        try {
          if (targetStatus === 'completed_purged') {
            const completedItem: RecentPrintItem = {
              id: `done-${Date.now()}`,
              fileName: data.job.fileName,
              shopName: 'Sai Xerox',
              timestamp: 'Just now',
              status: 'Done',
              pageCount: data.job.pageCount,
              colorMode: data.job.colorMode,
            };
            localStorage.removeItem('printvault_active_job');
            localStorage.setItem(
              'printvault_realtime_event',
              JSON.stringify({
                type: 'JOB_PURGED',
                item: completedItem,
                _t: Date.now(),
              })
            );
            if ('BroadcastChannel' in window) {
              const bc = new BroadcastChannel('printvault_realtime_sync');
              bc.postMessage({ type: 'JOB_PURGED', item: completedItem });
              bc.close();
            }
          } else {
            const sysJob: PrintJob = {
              id: data.job.id,
              token: data.job.token,
              fileName: data.job.fileName,
              fileSize: data.job.fileSize || '1.8 MB',
              pageCount: data.job.pageCount,
              copies: data.job.copies,
              colorMode: data.job.colorMode,
              totalPrice: data.job.totalPrice,
              shop: saiXeroxShop,
              status: targetStatus as PrintJob['status'],
              createdAt: 'Just now',
              expiresInSeconds: 600,
              isMaskedAadhaar: true,
              sha256Hash: data.job.sha256Hash || '9e7b...4c19',
              verificationKey: data.job.verificationKey || 'e98a...f201',
            };
            localStorage.setItem('printvault_active_job', JSON.stringify(sysJob));
            localStorage.setItem(
              'printvault_realtime_event',
              JSON.stringify({
                type: 'ACTIVE_JOB_UPDATED',
                activeJob: sysJob,
                _t: Date.now(),
              })
            );
            if ('BroadcastChannel' in window) {
              const bc = new BroadcastChannel('printvault_realtime_sync');
              bc.postMessage({ type: 'ACTIVE_JOB_UPDATED', activeJob: sysJob });
              bc.close();
            }
          }
        } catch {}
      }

      let statusMsg = '';
      if (targetStatus === 'printing') {
        statusMsg = `🖨️ *Update from Sai Xerox*: Your document is now being printed on the Canon imageRUNNER Enclave printer.\n\nLive Tracker in main system updated to "Printing".`;
      } else if (targetStatus === 'completed_purged') {
        statusMsg = `✅ *Update from Sai Xerox*: Printing completed!\n\nDoD 5220.22-M 7-pass memory shred executed. Decryption keys purged from RAM. Document moved to verified receipts.`;
      } else if (targetStatus === 'revoked') {
        statusMsg = `🛑 *Update from Sai Xerox*: Print session revoked. Decryption key purged immediately.`;
      } else {
        statusMsg = `ℹ️ *Update from Sai Xerox*: Status changed to ${targetStatus}.`;
      }

      addShopMessage(statusMsg, ['View in System Tracker', 'Simulate UPI Payment', 'Start New Print Order']);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      addShopMessage(`Simulation status update failed: ${msg}`);
    }
  };

  // Simulated Payment Execution
  const handleSimulatePayment = async () => {
    const targetJobId = activeCreatedJob?.id || 'PV-8F3K-29XA';
    const amount = activeCreatedJob?.totalPrice || 28;

    addUserMessage('Simulate UPI Payment (Demo)');

    try {
      await fetch(`/api/jobs/${encodeURIComponent(targetJobId)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'ready_for_scan',
          paymentStatus: 'SIMULATED_PAYMENT_CONFIRMED',
        }),
      });

      addShopMessage(
        `💳 *Simulated Payment Confirmed!*\n\n` +
          `• *Job Reference*: ${targetJobId}\n` +
          `• *Amount*: ₹${amount}\n` +
          `• *Status*: SIMULATED_PAYMENT_CONFIRMED\n\n` +
          `ℹ️ *DEMO NOTE*: No real money was charged. This simulated UPI payment demonstrates Kiosk contactless payment reconciliation.`,
        ['Simulate Step: Printing', 'Simulate Step: Purge & Complete', 'View in System Tracker'],
        {
          type: 'payment_card',
          metadata: {
            jobId: targetJobId,
            customNote: 'DEMO PAYMENT: Simulated payment confirmed. No real financial transaction occurred.',
          },
        }
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      addShopMessage(`Payment simulation error: ${msg}`);
    }
  };

  const displayPriceList = () => {
    const text =
      `📄 *Sai Xerox — Price List (DEMO Rates)*\n\n` +
      `• *A4 Black & White*: ₹${DEMO_RATES.a4BwPerSide} per printed side\n` +
      `• *A4 Full Colour*: ₹${DEMO_RATES.a4ColorPerSide} per printed side\n` +
      `• *A3 Black & White*: ₹${DEMO_RATES.a3BwPerSide} per printed side\n` +
      `• *A3 Full Colour*: ₹${DEMO_RATES.a3ColorPerSide} per printed side\n` +
      `• *Stapling*: ₹${DEMO_RATES.staplingCost} per order\n` +
      `• *Spiral Binding*: ₹${DEMO_RATES.spiralCost} per order\n\n` +
      `_Note: Double-sided printing uses ceil(pages/2) physical sheets, charged per printed side. These are sample rates for demonstration only._`;

    addShopMessage(text, ['Start New Print Order', 'Track Existing Order', 'Help'], {
      type: 'pricing_card',
    });
  };

  // Trapping direct attachment click
  const handleAttachmentAttempt = () => {
    setShowPrivacyModal(true);
    addShopMessage(
      `⚠️ *Privacy Warning*: For your security, do not attach document files directly in WhatsApp chat.\n\nPrint shop kiosks often run WhatsApp Web on public screens. PrintVault generates a private, client-side encrypted upload link instead.`,
      ['Start New Print Order', 'Open Secure Upload Page'],
      { type: 'privacy_warning' }
    );
  };

  // Computed pricing for live card
  const currentPricing = calculatePrintPrice({
    fileName: orderDraft.fileName || 'document.pdf',
    pageCount: orderDraft.pageCount || 1,
    copies: orderDraft.copies || 1,
    colorMode: orderDraft.colorMode || 'bw',
    paperSize: orderDraft.paperSize || 'A4',
    printSide: orderDraft.printSide || 'double',
    binding: orderDraft.binding || 'none',
  });

  return (
    <div className="h-[100dvh] bg-[#dad8d2] text-[#111b21] flex flex-col font-sans antialiased overflow-hidden">
      {/* Hidden file input for document selection */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileInputChange}
        accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
        className="hidden"
      />

      {/* Simulation Banner Notice */}
      <div className="bg-[#0b141a] text-amber-300 py-1.5 px-3 sm:px-4 text-[11px] sm:text-xs font-mono flex items-center justify-between border-b border-white/10 shrink-0 z-50">
        <div className="flex items-center gap-1.5 sm:gap-2 truncate mr-2">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping shrink-0"></span>
          <span className="font-bold uppercase tracking-wider truncate">MOCK WHATSAPP</span>
          <span className="hidden sm:inline text-white/60">• Demonstration only</span>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <button
            type="button"
            onClick={() => setShowSimulationInfo(!showSimulationInfo)}
            className="text-white hover:text-amber-200 underline cursor-pointer text-[10px] sm:text-[11px]"
          >
            How it works
          </button>
          <Link
            href="/"
            className="px-2 py-0.5 rounded bg-white/15 hover:bg-white/25 text-white text-[10px] sm:text-[11px] font-sans font-medium transition-colors"
          >
            Back to App
          </Link>
        </div>
      </div>

      {/* Main Container */}
      <div className="flex-1 max-w-6xl w-full mx-auto sm:p-4 flex flex-col lg:flex-row gap-4 h-full overflow-hidden">
        {/* LEFT SIDEBAR (Desktop) */}
        <aside className="hidden lg:flex flex-col w-80 bg-white rounded-3xl shadow-sm border border-[#d1d7db] p-5 shrink-0 justify-between">
          <div className="space-y-5">
            {/* Shop Profile Widget */}
            <div className="bg-gradient-to-br from-[#00a884] to-[#075e54] text-white p-4 rounded-2xl shadow-sm space-y-3">
              <div className="flex items-center gap-3">
                <img
                  src={saiXeroxShop.image}
                  alt={saiXeroxShop.name}
                  className="w-12 h-12 rounded-full border-2 border-white/40 object-cover shadow-xs"
                />
                <div>
                  <div className="flex items-center gap-1.5">
                    <h2 className="font-bold text-base leading-tight">{saiXeroxShop.name}</h2>
                    <span className="text-xs">✓</span>
                  </div>
                  <p className="text-xs text-white/80">Powered by PrintVault</p>
                  <p className="text-[11px] text-amber-200 mt-0.5 font-medium">★ 4.9 • 50m away</p>
                </div>
              </div>

              <div className="pt-2 border-t border-white/20 text-xs space-y-1 text-white/90">
                <div className="flex items-center gap-1.5">
                  <span>📍</span>
                  <span className="truncate">{saiXeroxShop.location}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span>⏰</span>
                  <span>8:00 AM – 9:30 PM (Open Now)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span>📞</span>
                  <span>{saiXeroxShop.phone}</span>
                </div>
              </div>
            </div>

            {/* Rate Card Summary */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#54656f]">DEMO RATE CARD</h3>
                <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-medium">Sample Rates</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 bg-[#f0f2f5] rounded-xl border border-[#e9edef]">
                  <span className="text-[11px] text-[#54656f] block">A4 Black &amp; White</span>
                  <span className="font-bold text-[#111b21]">₹2 / side</span>
                </div>
                <div className="p-2.5 bg-[#f0f2f5] rounded-xl border border-[#e9edef]">
                  <span className="text-[11px] text-[#54656f] block">A4 Full Colour</span>
                  <span className="font-bold text-[#111b21]">₹10 / side</span>
                </div>
                <div className="p-2.5 bg-[#f0f2f5] rounded-xl border border-[#e9edef]">
                  <span className="text-[11px] text-[#54656f] block">A3 B&amp;W</span>
                  <span className="font-bold text-[#111b21]">₹5 / side</span>
                </div>
                <div className="p-2.5 bg-[#f0f2f5] rounded-xl border border-[#e9edef]">
                  <span className="text-[11px] text-[#54656f] block">Spiral Binding</span>
                  <span className="font-bold text-[#111b21]">₹30 / book</span>
                </div>
              </div>
            </div>

            {/* Hackathon Judge Simulation Controls */}
            <div className="space-y-2 pt-2 border-t border-[#e9edef]">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#54656f]">
                JUDGE / DEMO TESTING CONTROLS
              </h3>
              <p className="text-[11px] text-[#667781] leading-relaxed">
                Simulate shopkeeper terminal reactions or trigger common hackathon test flows:
              </p>
              <div className="space-y-1.5 pt-1">
                <button
                  type="button"
                  onClick={() => handleSimulateStatus('printing')}
                  className="w-full text-left py-2 px-3 rounded-xl bg-white hover:bg-[#f0f2f5] border border-[#d1d7db] text-xs font-medium transition-colors flex items-center justify-between cursor-pointer"
                >
                  <span>🖨️ Simulate &quot;Operator Printing&quot;</span>
                  <span className="text-[10px] text-[#00a884] font-semibold">Trigger</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSimulateStatus('completed_purged')}
                  className="w-full text-left py-2 px-3 rounded-xl bg-white hover:bg-[#f0f2f5] border border-[#d1d7db] text-xs font-medium transition-colors flex items-center justify-between cursor-pointer"
                >
                  <span>🛡️ Simulate &quot;Purge &amp; Complete&quot;</span>
                  <span className="text-[10px] text-[#00a884] font-semibold">Trigger</span>
                </button>
                <button
                  type="button"
                  onClick={handleSimulatePayment}
                  className="w-full text-left py-2 px-3 rounded-xl bg-white hover:bg-[#f0f2f5] border border-[#d1d7db] text-xs font-medium transition-colors flex items-center justify-between cursor-pointer"
                >
                  <span>💳 Simulate &quot;UPI Payment&quot;</span>
                  <span className="text-[10px] text-[#00a884] font-semibold">Trigger</span>
                </button>
                <button
                  type="button"
                  onClick={handleAttachmentAttempt}
                  className="w-full text-left py-2 px-3 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-xs font-medium text-amber-900 transition-colors flex items-center justify-between cursor-pointer"
                >
                  <span>⚠️ Test Privacy File Alert</span>
                  <span className="text-[10px] text-amber-700 font-semibold">Test</span>
                </button>
              </div>
            </div>

            {/* View in system live tracker button */}
            <div className="pt-2 border-t border-[#e9edef]">
              <Link
                href="/"
                className="w-full py-2.5 px-3 rounded-xl bg-[#e1e0ff] hover:bg-[#d4d2ff] text-[#07006c] text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-2xs"
              >
                <span>📱 View in PrintVault Tracker</span>
                <span>→</span>
              </Link>
            </div>
          </div>

          <div className="pt-3 border-t border-[#e9edef] flex items-center justify-between">
            <button
              type="button"
              onClick={startFreshConversation}
              className="text-xs text-red-600 hover:text-red-700 font-semibold cursor-pointer"
            >
              ↺ Reset Chat
            </button>
            <span className="text-[10px] text-[#8696a0]">PrintVault v0.1 • M-04</span>
          </div>
        </aside>

        {/* CHAT PANE */}
        <main className="flex-1 flex flex-col bg-[#efeae2] sm:rounded-3xl shadow-sm border border-[#d1d7db] overflow-hidden relative h-full">
          {/* Subtle WhatsApp doodle background overlay */}
          <div
            className="absolute inset-0 opacity-[0.06] pointer-events-none"
            style={{
              backgroundImage: `radial-gradient(#00a884 0.75px, transparent 0.75px)`,
              backgroundSize: '16px 16px',
            }}
          />

          {/* WhatsApp Chat Top Header */}
          <header className="relative z-10 bg-[#f0f2f5] px-3 sm:px-4 py-2 sm:py-2.5 flex items-center justify-between border-b border-[#d1d7db] shrink-0">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <Link
                href="/"
                className="lg:hidden w-8 h-8 rounded-full bg-white flex items-center justify-center text-[#54656f] border border-[#d1d7db] shrink-0"
                title="Back to App"
              >
                ←
              </Link>
              <div className="relative shrink-0">
                <img
                  src={saiXeroxShop.image}
                  alt={saiXeroxShop.name}
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-full object-cover border border-[#d1d7db]"
                />
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white"></span>
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h1 className="font-semibold text-xs sm:text-sm text-[#111b21] leading-tight truncate">{saiXeroxShop.name}</h1>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
                </div>
                <p className="text-[10px] sm:text-[11px] text-[#54656f] truncate">Online • Powered by PrintVault</p>
              </div>
            </div>

            {/* Clear Simulation Badge & Mobile Drawer Trigger */}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setShowMobileShopDrawer(true)}
                className="lg:hidden px-2 py-1 rounded-full bg-white hover:bg-[#e9edef] border border-[#00a884] text-[#00a884] text-[10px] font-bold transition-all shadow-2xs flex items-center gap-1 cursor-pointer"
                title="Shop info & testing controls"
              >
                <span>ℹ️</span>
                <span className="hidden xs:inline">Controls</span>
              </button>

              <span className="hidden sm:inline px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold border border-amber-300 shadow-2xs tracking-wider">
                SIMULATION MODE
              </span>
              <button
                type="button"
                onClick={startFreshConversation}
                title="Restart conversation"
                className="w-8 h-8 rounded-full bg-white hover:bg-[#e9edef] text-[#54656f] border border-[#d1d7db] flex items-center justify-center text-sm transition-colors cursor-pointer"
              >
                ↺
              </button>
            </div>
          </header>

          {/* Privacy Security Ribbon */}
          <div className="relative z-10 bg-[#ffeebb]/85 px-4 py-1.5 text-center text-[11px] text-[#523d00] border-b border-[#f0df9e] flex items-center justify-center gap-1.5">
            <span>🔒</span>
            <span>
              <strong>Privacy Notice:</strong> WhatsApp is for communication only. Upload documents through the secure
              PrintVault upload page.
            </span>
          </div>

          {/* Messages Scroll Area */}
          <div
            ref={chatContainerRef}
            className="relative z-10 flex-1 overflow-y-auto p-4 space-y-3.5 scroll-smooth"
          >
            {messages.map((msg) => {
              const isShop = msg.sender === 'shop';
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isShop ? 'items-start' : 'items-end'}`}
                >
                  <div
                    className={`max-w-[92%] sm:max-w-[78%] rounded-2xl px-3.5 py-2.5 shadow-2xs text-[13px] leading-relaxed relative break-words ${
                      isShop
                        ? 'bg-white text-[#111b21] rounded-tl-none border border-[#e9edef]'
                        : 'bg-[#d9fdd3] text-[#111b21] rounded-tr-none border border-[#c4eec0]'
                    }`}
                  >
                    {/* Message Body */}
                    <div className="whitespace-pre-wrap">{msg.text}</div>

                    {/* Step 1: Document Selector Card */}
                    {msg.type === 'document_selector' && stage === 'SELECT_DOCUMENT' && (
                      <div className="mt-3 pt-3 border-t border-[#e9edef] space-y-3">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="w-full py-2.5 px-3 rounded-xl bg-[#00a884] hover:bg-[#008f6f] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
                        >
                          <span>📁</span>
                          <span>Select Document from Device (PDF, DOCX, JPG)</span>
                        </button>

                        <div className="space-y-1.5">
                          <span className="text-[11px] font-semibold text-[#54656f] block uppercase tracking-wider">
                            Or pick a sample test document:
                          </span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                            {DEMO_DOCUMENT_PRESETS.map((preset) => (
                              <button
                                key={preset.id}
                                type="button"
                                onClick={() => handleDocumentChosen({ name: preset.name, size: preset.size, pages: preset.pages })}
                                className="text-left p-2 rounded-xl bg-[#f0f2f5] hover:bg-[#e9edef] border border-[#d1d7db] text-xs transition-all cursor-pointer group"
                              >
                                <div className="font-semibold text-[#111b21] group-hover:text-[#00a884]">
                                  {preset.label}
                                </div>
                                <div className="text-[10px] text-[#667781] mt-0.5">{preset.description}</div>
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Step 2: Interactive Print Configurator Card */}
                    {msg.type === 'configurator_card' && (
                      <div className="mt-3 pt-3 border-t border-[#d1d7db] space-y-3.5">
                        {/* Document Info Header */}
                        <div className="bg-[#f0f2f5] p-3 rounded-2xl border border-[#d1d7db] flex items-center justify-between">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="text-2xl">📄</span>
                            <div className="min-w-0">
                              <div className="font-bold text-xs text-[#111b21] truncate">
                                {orderDraft.fileName || 'document.pdf'}
                              </div>
                              <div className="text-[11px] text-[#54656f]">
                                {orderDraft.totalDocPages} pages • {orderDraft.fileSize || '1.8 MB'}
                              </div>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={initiateDocumentSelection}
                            className="text-[11px] font-semibold text-[#00a884] hover:underline px-2 py-1 shrink-0 cursor-pointer"
                          >
                            Change File
                          </button>
                        </div>

                        {/* Interactive Controls */}
                        <div className="space-y-3 text-xs">
                          {/* Copies Selector */}
                          <div className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-[#e9edef]">
                            <span className="font-semibold text-[#111b21]">Number of Copies:</span>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => updateDraftProperty({ copies: Math.max(1, orderDraft.copies - 1) })}
                                className="w-7 h-7 rounded-lg bg-[#f0f2f5] hover:bg-[#e9edef] text-[#111b21] font-bold flex items-center justify-center text-sm cursor-pointer"
                              >
                                −
                              </button>
                              <span className="w-8 text-center font-bold text-sm text-[#111b21]">
                                {orderDraft.copies}
                              </span>
                              <button
                                type="button"
                                onClick={() => updateDraftProperty({ copies: Math.min(100, orderDraft.copies + 1) })}
                                className="w-7 h-7 rounded-lg bg-[#f0f2f5] hover:bg-[#e9edef] text-[#111b21] font-bold flex items-center justify-center text-sm cursor-pointer"
                              >
                                +
                              </button>
                            </div>
                          </div>

                          {/* Quick Copies Pills */}
                          <div className="flex gap-1.5 flex-wrap">
                            {[1, 2, 3, 5, 10].map((num) => (
                              <button
                                key={num}
                                type="button"
                                onClick={() => updateDraftProperty({ copies: num })}
                                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-colors cursor-pointer ${
                                  orderDraft.copies === num
                                    ? 'bg-[#00a884] text-white border-[#00a884]'
                                    : 'bg-white text-[#54656f] border-[#d1d7db] hover:bg-[#f0f2f5]'
                                }`}
                              >
                                {num} {num > 1 ? 'copies' : 'copy'}
                              </button>
                            ))}
                          </div>

                          {/* Color Mode Toggle */}
                          <div>
                            <span className="text-[11px] font-semibold text-[#54656f] block mb-1">Color Mode:</span>
                            <div className="grid grid-cols-2 gap-2">
                              <button
                                type="button"
                                onClick={() => updateDraftProperty({ colorMode: 'bw' })}
                                className={`p-2 rounded-xl border text-left flex items-center justify-between cursor-pointer transition-all ${
                                  orderDraft.colorMode === 'bw'
                                    ? 'bg-[#e7f8f5] border-[#00a884] text-[#075e54] font-bold'
                                    : 'bg-white border-[#d1d7db] text-[#54656f]'
                                }`}
                              >
                                <span>⚪ Black &amp; White</span>
                                <span className="text-[10px] opacity-80">₹2/side</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => updateDraftProperty({ colorMode: 'color' })}
                                className={`p-2 rounded-xl border text-left flex items-center justify-between cursor-pointer transition-all ${
                                  orderDraft.colorMode === 'color'
                                    ? 'bg-[#e7f8f5] border-[#00a884] text-[#075e54] font-bold'
                                    : 'bg-white border-[#d1d7db] text-[#54656f]'
                                }`}
                              >
                                <span>🎨 Full Colour</span>
                                <span className="text-[10px] opacity-80">₹10/side</span>
                              </button>
                            </div>
                          </div>

                          {/* Sides (Duplex vs Single) */}
                          <div>
                            <span className="text-[11px] font-semibold text-[#54656f] block mb-1">Print Sides:</span>
                            <div className="grid grid-cols-2 gap-2">
                              <button
                                type="button"
                                onClick={() => updateDraftProperty({ printSide: 'double' })}
                                className={`p-2 rounded-xl border text-left cursor-pointer transition-all ${
                                  orderDraft.printSide === 'double'
                                    ? 'bg-[#e7f8f5] border-[#00a884] text-[#075e54] font-bold'
                                    : 'bg-white border-[#d1d7db] text-[#54656f]'
                                }`}
                              >
                                <span>📖 Double-sided (Duplex)</span>
                                <span className="text-[10px] block opacity-75 font-normal">Saves paper sheets</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => updateDraftProperty({ printSide: 'single' })}
                                className={`p-2 rounded-xl border text-left cursor-pointer transition-all ${
                                  orderDraft.printSide === 'single'
                                    ? 'bg-[#e7f8f5] border-[#00a884] text-[#075e54] font-bold'
                                    : 'bg-white border-[#d1d7db] text-[#54656f]'
                                }`}
                              >
                                <span>📄 Single-sided</span>
                                <span className="text-[10px] block opacity-75 font-normal">1 sheet per page</span>
                              </button>
                            </div>
                          </div>

                          {/* Paper Size & Binding in row */}
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <span className="text-[11px] font-semibold text-[#54656f] block mb-1">Paper Size:</span>
                              <div className="flex gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => updateDraftProperty({ paperSize: 'A4' })}
                                  className={`flex-1 py-1.5 rounded-lg border text-center text-xs font-medium cursor-pointer ${
                                    orderDraft.paperSize === 'A4'
                                      ? 'bg-[#00a884] text-white border-[#00a884]'
                                      : 'bg-white text-[#54656f] border-[#d1d7db]'
                                  }`}
                                >
                                  A4 (Standard)
                                </button>
                                <button
                                  type="button"
                                  onClick={() => updateDraftProperty({ paperSize: 'A3' })}
                                  className={`flex-1 py-1.5 rounded-lg border text-center text-xs font-medium cursor-pointer ${
                                    orderDraft.paperSize === 'A3'
                                      ? 'bg-[#00a884] text-white border-[#00a884]'
                                      : 'bg-white text-[#54656f] border-[#d1d7db]'
                                  }`}
                                >
                                  A3 (Large)
                                </button>
                              </div>
                            </div>

                            <div>
                              <span className="text-[11px] font-semibold text-[#54656f] block mb-1">Finishing:</span>
                              <select
                                value={orderDraft.binding}
                                onChange={(e) => updateDraftProperty({ binding: e.target.value as BindingOption })}
                                className="w-full py-1.5 px-2 bg-white rounded-lg border border-[#d1d7db] text-xs font-medium text-[#111b21] cursor-pointer"
                              >
                                <option value="none">None (₹0)</option>
                                <option value="stapling">Stapling (+₹5)</option>
                                <option value="spiral">Spiral Binding (+₹30)</option>
                              </select>
                            </div>
                          </div>

                          {/* Page Selection (All vs Range) */}
                          <div className="space-y-1.5 bg-white p-2.5 rounded-xl border border-[#e9edef]">
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-[#111b21]">Pages:</span>
                              <div className="flex gap-1">
                                <button
                                  type="button"
                                  onClick={() => {
                                    updateDraftProperty({
                                      pageSelectionType: 'all',
                                      pageCount: orderDraft.totalDocPages,
                                      pageRangeText: `All pages (1-${orderDraft.totalDocPages})`,
                                      selectedPages: Array.from({ length: orderDraft.totalDocPages }, (_, i) => i + 1),
                                    });
                                    setRangeError(null);
                                  }}
                                  className={`px-2 py-0.5 rounded text-[11px] font-medium border cursor-pointer ${
                                    orderDraft.pageSelectionType === 'all'
                                      ? 'bg-[#00a884] text-white border-[#00a884]'
                                      : 'bg-[#f0f2f5] text-[#54656f] border-[#d1d7db]'
                                  }`}
                                >
                                  All ({orderDraft.totalDocPages} pgs)
                                </button>
                                <button
                                  type="button"
                                  onClick={() => updateDraftProperty({ pageSelectionType: 'custom' })}
                                  className={`px-2 py-0.5 rounded text-[11px] font-medium border cursor-pointer ${
                                    orderDraft.pageSelectionType === 'custom'
                                      ? 'bg-[#00a884] text-white border-[#00a884]'
                                      : 'bg-[#f0f2f5] text-[#54656f] border-[#d1d7db]'
                                  }`}
                                >
                                  Custom Range
                                </button>
                              </div>
                            </div>

                            {orderDraft.pageSelectionType === 'custom' && (
                              <div className="pt-1.5 space-y-1">
                                <div className="flex gap-2">
                                  <input
                                    type="text"
                                    value={customRangeInput}
                                    onChange={(e) => setCustomRangeInput(e.target.value)}
                                    placeholder="e.g. 1-2, 4 or 1"
                                    className="flex-1 py-1 px-2 text-xs border border-[#d1d7db] rounded-lg bg-[#fbf9f5]"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => handleApplyCustomRange(customRangeInput)}
                                    className="px-2.5 py-1 rounded-lg bg-[#00a884] text-white font-bold text-xs cursor-pointer"
                                  >
                                    Apply
                                  </button>
                                </div>
                                {rangeError && <p className="text-[11px] text-red-600 font-medium">{rangeError}</p>}
                                <p className="text-[10px] text-[#667781]">
                                  Selected: {orderDraft.pageCount} of {orderDraft.totalDocPages} pages
                                </p>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Live Price Box */}
                        <div className="bg-[#f0f2f5] p-3 rounded-2xl border border-[#d1d7db] space-y-1.5">
                          <div className="flex items-center justify-between font-bold text-sm text-[#111b21]">
                            <span>Grand Total:</span>
                            <span className="text-emerald-700 text-base">₹{currentPricing.grandTotal}</span>
                          </div>
                          <div className="text-[11px] text-[#54656f] flex justify-between">
                            <span>Printed Sides:</span>
                            <span>
                              {currentPricing.pageCount * currentPricing.copies} sides ({currentPricing.physicalSheets} physical sheets)
                            </span>
                          </div>
                          <div className="text-[11px] text-[#54656f] flex justify-between">
                            <span>Rate:</span>
                            <span>
                              ₹{currentPricing.perSideRate}/side {currentPricing.bindingTotal > 0 ? `+ ₹${currentPricing.bindingTotal} finishing` : ''}
                            </span>
                          </div>
                        </div>

                        {/* Main CTA */}
                        <div className="pt-1 space-y-2">
                          <button
                            type="button"
                            onClick={() => executeJobCreation(orderDraft)}
                            disabled={isSubmittingJob}
                            className="w-full py-3 px-4 rounded-xl bg-[#00a884] hover:bg-[#008f6f] text-white text-xs font-bold transition-all shadow-sm active:scale-98 cursor-pointer flex items-center justify-center gap-2"
                          >
                            {isSubmittingJob ? (
                              <span>Creating Order &amp; Syncing System...</span>
                            ) : (
                              <span>⚡ Confirm &amp; Place Print Order (₹{currentPricing.grandTotal})</span>
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleUniversalCommand('cancel')}
                            className="w-full text-center text-xs text-[#54656f] hover:text-red-600 py-1 cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Rich Metadata Cards */}
                    {msg.type === 'upload_card' && msg.metadata?.uploadUrl && (
                      <div className="mt-3 pt-2.5 border-t border-[#d1d7db] space-y-2.5">
                        <div className="bg-[#e7f8f5] border border-[#a3e8db] p-3 rounded-xl text-xs space-y-2">
                          <div className="flex items-center gap-1.5 text-emerald-800 font-bold">
                            <span>🛡️</span>
                            <span>PrintVault Secure Upload Portal</span>
                          </div>
                          <p className="text-[11px] text-emerald-950">
                            Client-side AES encrypted upload. Token verification ensures zero unauthorized leakage.
                          </p>
                          <div className="flex flex-col sm:flex-row gap-2 pt-1">
                            <Link
                              href={msg.metadata.uploadUrl}
                              className="flex-1 text-center py-2 px-3 rounded-lg bg-[#00a884] hover:bg-[#008f6f] text-white text-xs font-bold transition-all shadow-2xs"
                            >
                              Open Secure Upload Page →
                            </Link>
                            <Link
                              href="/"
                              className="text-center py-2 px-3 rounded-lg bg-white border border-[#00a884] text-[#00a884] hover:bg-emerald-50 text-xs font-bold transition-all"
                            >
                              📱 System Live Tracker
                            </Link>
                          </div>
                        </div>
                      </div>
                    )}

                    {msg.type === 'status_card' && msg.metadata && (
                      <div className="mt-2.5 pt-2 border-t border-[#d1d7db] text-xs space-y-2">
                        <div className="bg-[#f0f2f5] p-2 rounded-lg border border-[#e9edef] text-[11px] text-[#54656f]">
                          {msg.metadata.customNote || 'Real-time synchronization active with PrintVault Hardware Enclave.'}
                        </div>
                        <Link
                          href="/"
                          className="inline-block w-full text-center py-1.5 px-3 rounded-lg bg-[#e1e0ff] text-[#07006c] font-bold text-xs hover:bg-[#d4d2ff] transition-colors"
                        >
                          📱 View Active Status in System Live Tracker →
                        </Link>
                      </div>
                    )}

                    {msg.type === 'payment_card' && msg.metadata && (
                      <div className="mt-2.5 pt-2 border-t border-[#d1d7db] text-xs space-y-1">
                        <div className="bg-amber-50 p-2 rounded-lg border border-amber-200 text-amber-900 text-[11px]">
                          {msg.metadata.customNote}
                        </div>
                      </div>
                    )}

                    {/* Timestamp & Read ticks */}
                    <div
                      className={`text-[10px] mt-1 flex items-center justify-end gap-1 ${
                        isShop ? 'text-[#8696a0]' : 'text-[#667781]'
                      }`}
                    >
                      <span>{msg.timestamp}</span>
                      {!isShop && <span className="text-[#53bdeb] font-bold">✓✓</span>}
                    </div>
                  </div>

                  {/* Quick Reply Chips below shop messages */}
                  {isShop && msg.quickReplies && msg.quickReplies.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2 max-w-[90%]">
                      {msg.quickReplies.map((reply) => (
                        <button
                          key={reply}
                          type="button"
                          onClick={() => {
                            if (reply === 'Open Secure Upload Page' && activeCreatedJob) {
                              const uploadUrl = `/demo/whatsapp/upload?jobId=${encodeURIComponent(
                                activeCreatedJob.id
                              )}&token=${encodeURIComponent(activeCreatedJob.token)}&mode=upload`;
                              router.push(uploadUrl);
                              return;
                            }
                            if (reply === 'View in System Tracker') {
                              router.push('/');
                              return;
                            }
                            if (reply === 'Simulate UPI Payment') {
                              handleSimulatePayment();
                              return;
                            }
                            if (reply === 'Simulate Operator Printing' || reply === 'Simulate Step: Printing') {
                              handleSimulateStatus('printing');
                              return;
                            }
                            if (reply === 'Simulate Purge & Complete' || reply === 'Simulate Step: Purge & Complete') {
                              handleSimulateStatus('completed_purged');
                              return;
                            }
                            if (reply.includes('Choose File') || reply.includes('Select Document')) {
                              fileInputRef.current?.click();
                              return;
                            }
                            if (reply === '⚡ Confirm & Place Order') {
                              executeJobCreation(orderDraft);
                              return;
                            }
                            handleUserSubmit(reply);
                          }}
                          className="px-3 py-1 rounded-full bg-white hover:bg-[#e7f8f5] text-[#00a884] text-xs font-semibold border border-[#d1d7db] hover:border-[#00a884] transition-all shadow-2xs active:scale-95 cursor-pointer"
                        >
                          {reply}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Realistic WhatsApp Typing Indicator */}
            {isTyping && (
              <div className="flex items-center gap-1.5 bg-white py-2 px-3 rounded-2xl rounded-tl-none w-16 border border-[#e9edef] shadow-2xs">
                <span className="w-1.5 h-1.5 bg-[#8696a0] rounded-full animate-bounce"></span>
                <span className="w-1.5 h-1.5 bg-[#8696a0] rounded-full animate-bounce [animation-delay:0.2s]"></span>
                <span className="w-1.5 h-1.5 bg-[#8696a0] rounded-full animate-bounce [animation-delay:0.4s]"></span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Chat Bottom Bar */}
          <footer className="relative z-10 bg-[#f0f2f5] px-3 py-2 border-t border-[#d1d7db] flex items-center gap-2">
            <button
              type="button"
              onClick={handleAttachmentAttempt}
              title="Attach File (Security Warning Demo)"
              className="w-9 h-9 rounded-full hover:bg-[#e9edef] text-[#54656f] flex items-center justify-center text-lg transition-colors cursor-pointer shrink-0"
            >
              📎
            </button>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleUserSubmit(inputValue);
              }}
              className="flex-1 flex items-center gap-2"
            >
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={
                  stage === 'SELECT_DOCUMENT'
                    ? 'Attach document or pick a sample preset above...'
                    : stage === 'CONFIG_CARD'
                    ? 'Adjust options on card or type (e.g., "2 copies color duplex")...'
                    : 'Type a message or command (help, cancel, track)...'
                }
                className="flex-1 py-2 px-4 rounded-xl bg-white border border-[#d1d7db] text-xs sm:text-sm text-[#111b21] placeholder-[#8696a0] focus:outline-none focus:border-[#00a884]"
              />

              <button
                type="submit"
                disabled={!inputValue.trim()}
                className="w-9 h-9 rounded-full bg-[#00a884] hover:bg-[#008f6f] disabled:opacity-40 disabled:hover:bg-[#00a884] text-white flex items-center justify-center text-sm transition-all shadow-2xs cursor-pointer shrink-0"
              >
                ➤
              </button>
            </form>
          </footer>
        </main>
      </div>

      {/* PRIVACY WARNING MODAL */}
      {showPrivacyModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-xl space-y-4 border border-amber-200">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center text-2xl font-bold">
              🛡️
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#111b21]">Zero-Leak Architecture Active</h3>
              <p className="text-xs text-[#54656f] mt-1 leading-relaxed">
                In unencrypted print shops, documents sent over WhatsApp Web remain stored on the kiosk desktop and cache,
                exposing customer Aadhaar cards, legal agreements, and exam papers to theft.
              </p>
            </div>
            <div className="bg-[#fff8e6] border border-[#f0df9e] p-3 rounded-xl text-xs text-[#523d00] leading-relaxed">
              <strong>PrintVault Rule:</strong> Document files are uploaded exclusively through client-side encrypted TLS
              channels and decrypted directly inside kiosk volatile RAM with automatic DoD 5220.22-M memory shredding.
            </div>
            <div className="pt-2 flex gap-2">
              <button
                type="button"
                onClick={() => setShowPrivacyModal(false)}
                className="flex-1 py-2.5 px-4 rounded-xl bg-[#00a884] text-white text-xs font-bold hover:bg-[#008f6f] transition-colors cursor-pointer"
              >
                Understood
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SIMULATION HOW IT WORKS MODAL */}
      {showSimulationInfo && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-xl space-y-4 border border-[#d1d7db] max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-[#111b21]">How the WhatsApp Mock Experience Works</h3>
              <button
                type="button"
                onClick={() => setShowSimulationInfo(false)}
                className="text-[#54656f] hover:text-black text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>
            <div className="text-xs text-[#54656f] space-y-2 leading-relaxed">
              <p>
                <strong>1. Document First:</strong> Instead of asking multiple tedious questions beforehand, you select or attach your document first (or choose a test preset). The system detects the exact page count and file details.
              </p>
              <p>
                <strong>2. Interactive Print Configurator:</strong> Adjust copies, color mode (B&amp;W vs Colour), duplex printing, paper size, and binding directly on a single responsive card with live price calculation.
              </p>
              <p>
                <strong>3. Full System Synchronization:</strong> Confirming your order creates a genuine print job in <code>/api/jobs</code>, sets the active job in <code>PrintVaultContext</code>, and updates the Live Tracker on the main dashboard.
              </p>
              <p>
                <strong>4. Zero Data Retention:</strong> WhatsApp is strictly for communication. Documents are uploaded via client-side AES encrypted tunnels, decrypted only in ephemeral RAM, and shredded via DoD 5220.22-M standards.
              </p>
            </div>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setShowSimulationInfo(false)}
                className="w-full py-2.5 px-4 rounded-xl bg-[#00a884] text-white text-xs font-bold hover:bg-[#008f6f] transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MOBILE SHOP INFO & SIMULATION CONTROLS DRAWER */}
      {showMobileShopDrawer && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl max-w-md w-full p-5 shadow-2xl space-y-4 border border-[#d1d7db] max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom-5">
            <div className="flex items-center justify-between pb-2 border-b border-[#e9edef]">
              <div className="flex items-center gap-2">
                <span className="text-xl">🏪</span>
                <h3 className="text-sm font-bold text-[#111b21]">Sai Xerox • Shop &amp; Demo Controls</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowMobileShopDrawer(false)}
                className="w-7 h-7 rounded-full bg-[#f0f2f5] text-[#54656f] hover:text-black font-bold flex items-center justify-center text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Shop Details */}
            <div className="bg-[#f0f2f5] p-3 rounded-2xl text-xs space-y-1 text-[#54656f]">
              <div className="font-bold text-[#111b21]">{saiXeroxShop.name} (Powered by PrintVault)</div>
              <div>📍 {saiXeroxShop.location}</div>
              <div>⏰ 8:00 AM – 9:30 PM • 📞 {saiXeroxShop.phone}</div>
            </div>

            {/* Rates */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#54656f]">Demo Rate Card</span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2 bg-white rounded-xl border border-[#e9edef]">
                  <span className="text-[10px] text-[#54656f] block">A4 B&amp;W</span>
                  <span className="font-bold text-[#111b21]">₹2 / side</span>
                </div>
                <div className="p-2 bg-white rounded-xl border border-[#e9edef]">
                  <span className="text-[10px] text-[#54656f] block">A4 Colour</span>
                  <span className="font-bold text-[#111b21]">₹10 / side</span>
                </div>
                <div className="p-2 bg-white rounded-xl border border-[#e9edef]">
                  <span className="text-[10px] text-[#54656f] block">A3 B&amp;W</span>
                  <span className="font-bold text-[#111b21]">₹5 / side</span>
                </div>
                <div className="p-2 bg-white rounded-xl border border-[#e9edef]">
                  <span className="text-[10px] text-[#54656f] block">Spiral Binding</span>
                  <span className="font-bold text-[#111b21]">₹30 / book</span>
                </div>
              </div>
            </div>

            {/* Simulation Triggers */}
            <div className="space-y-1.5 pt-1 border-t border-[#e9edef]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#54656f]">Judge / Test Triggers</span>
              <div className="space-y-1.5">
                <button
                  type="button"
                  onClick={() => {
                    handleSimulateStatus('printing');
                    setShowMobileShopDrawer(false);
                  }}
                  className="w-full text-left py-2 px-3 rounded-xl bg-white hover:bg-[#f0f2f5] border border-[#d1d7db] text-xs font-medium flex items-center justify-between cursor-pointer"
                >
                  <span>🖨️ Simulate &quot;Operator Printing&quot;</span>
                  <span className="text-[10px] text-[#00a884] font-bold">Trigger</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleSimulateStatus('completed_purged');
                    setShowMobileShopDrawer(false);
                  }}
                  className="w-full text-left py-2 px-3 rounded-xl bg-white hover:bg-[#f0f2f5] border border-[#d1d7db] text-xs font-medium flex items-center justify-between cursor-pointer"
                >
                  <span>🛡️ Simulate &quot;Purge &amp; Complete&quot;</span>
                  <span className="text-[10px] text-[#00a884] font-bold">Trigger</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleSimulatePayment();
                    setShowMobileShopDrawer(false);
                  }}
                  className="w-full text-left py-2 px-3 rounded-xl bg-white hover:bg-[#f0f2f5] border border-[#d1d7db] text-xs font-medium flex items-center justify-between cursor-pointer"
                >
                  <span>💳 Simulate &quot;UPI Payment&quot;</span>
                  <span className="text-[10px] text-[#00a884] font-bold">Trigger</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleAttachmentAttempt();
                    setShowMobileShopDrawer(false);
                  }}
                  className="w-full text-left py-2 px-3 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-xs font-medium text-amber-900 flex items-center justify-between cursor-pointer"
                >
                  <span>⚠️ Test Privacy File Alert</span>
                  <span className="text-[10px] text-amber-700 font-bold">Test</span>
                </button>
              </div>
            </div>

            {/* Tracker link */}
            <div className="pt-2">
              <Link
                href="/"
                className="w-full py-2.5 px-3 rounded-xl bg-[#e1e0ff] hover:bg-[#d4d2ff] text-[#07006c] text-xs font-bold transition-all flex items-center justify-center gap-1.5"
              >
                <span>📱 View in PrintVault Tracker</span>
                <span>→</span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function WhatsAppDemoPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#efeae2] flex items-center justify-center text-xs text-[#54656f]">
          Loading Sai Xerox WhatsApp Demo...
        </div>
      }
    >
      <WhatsAppDemoChat />
    </Suspense>
  );
}
