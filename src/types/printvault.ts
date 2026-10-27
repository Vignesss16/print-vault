export type ScreenType =
  | 'home'
  | 'new_job'
  | 'shop_qr'
  | 'live_tracker'
  | 'receipt'
  | 'receipts_list'
  | 'profile'
  | 'auth'
  | 'chat'
  | 'shopkeeper_auth'
  | 'shopkeeper_dashboard';

export type ViewMode = 'auto' | 'mobile' | 'desktop';

export type AppRole = 'customer' | 'shopkeeper';

export interface Customer {
  id: string;
  name: string;
  age: number;
  email: string;
  avatarUrl?: string;
  vaultTier?: string;
}

export interface Shopkeeper {
  id: string;
  shopId: string;
  shopName: string;
  operatorName: string;
  email: string;
  phone?: string;
  printerModel?: string;
  location: string;
  avatarUrl?: string;
  isOnline: boolean;
  todayJobsCount?: number;
  todayEarnings?: number;
}

export type JobStatus =
  | 'draft'
  | 'ready_for_scan'
  | 'scanned'
  | 'viewing'
  | 'printing'
  | 'completed_purged'
  | 'revoked';

export type ColorMode = 'bw' | 'color';

export interface PrintShop {
  id: string;
  name: string;
  distance: string;
  location: string;
  rating: number;
  jobsCount: string;
  statusBadge: string;
  image: string;
  lat: number;
  lng: number;
  operatorName?: string;
  pricePerBw?: number;
  pricePerColor?: number;
  printerModel?: string;
  phone?: string;
  isOnline?: boolean;
}

export interface UserLocation {
  latitude: number;
  longitude: number;
  address: string;
  accuracyMeters?: number;
}

export type ChatRequestStatus = 'pending' | 'accepted' | 'declined';

export interface ChatDocumentAttachment {
  fileName: string;
  fileSize: string;
  pageCount: number;
  copies: number;
  colorMode: ColorMode;
  isMaskedAadhaar: boolean;
  token: string;
  jobId: string;
  totalPrice: number;
  note?: string;
  sentAt: string;
  expiresInSeconds: number;
}

export interface ChatMessage {
  id: string;
  requestId: string;
  senderRole: 'customer' | 'shopkeeper' | 'system';
  senderName: string;
  text?: string;
  document?: ChatDocumentAttachment;
  timestamp: string;
}

export interface ChatSession {
  requestId: string;
  customer: Customer;
  shop: PrintShop;
  status: ChatRequestStatus;
  messages: ChatMessage[];
  createdAt: string;
}

export interface PrintJob {
  id: string;
  token: string;
  fileName: string;
  fileSize: string;
  pageCount: number;
  copies: number;
  colorMode: ColorMode;
  totalPrice: number;
  shop: PrintShop;
  status: JobStatus;
  createdAt: string;
  expiresInSeconds: number;
  isMaskedAadhaar: boolean;
  sha256Hash: string;
  verificationKey: string;
}

export interface RecentPrintItem {
  id: string;
  fileName: string;
  shopName: string;
  timestamp: string;
  status: 'Done' | 'Access ended';
  pageCount: number;
  colorMode: ColorMode;
  receiptId?: string;
}

