import { PrintShop, PrintJob, RecentPrintItem } from '@/types/printvault';

export const mockShops: PrintShop[] = [
  {
    id: 'shop-1',
    name: 'QuickPrint Corner',
    distance: '120m away',
    location: 'Station Road, MG Road',
    rating: 4.9,
    jobsCount: '340+ jobs today',
    statusBadge: 'Ready to pick',
    image:
      'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=300&q=80',
  },
  {
    id: 'shop-2',
    name: 'CyberPoint Print Lab',
    distance: '450m away',
    location: 'Tech Hub Block C',
    rating: 4.8,
    jobsCount: '180+ jobs',
    statusBadge: 'Low queue',
    image:
      'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=300&q=80',
  },
  {
    id: 'shop-3',
    name: 'Metro Xerox & Docs Hub',
    distance: '850m away',
    location: 'Near Metro Gate 2',
    rating: 4.7,
    jobsCount: '520+ jobs',
    statusBadge: 'Fast queue',
    image:
      'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=300&q=80',
  },
];

export const initialActiveJob: PrintJob = {
  id: 'PV-8F3K-29XA',
  token: '849 201',
  fileName: 'e-Aadhaar_Masked_2025.pdf',
  fileSize: '1.4 MB',
  pageCount: 2,
  copies: 1,
  colorMode: 'bw',
  totalPrice: 6,
  shop: mockShops[0],
  status: 'viewing',
  createdAt: '10:24 AM',
  expiresInSeconds: 582, // ~09:42
  isMaskedAadhaar: true,
  sha256Hash: '9e7b...4c19',
  verificationKey: 'e98a...f201',
};

export const mockRecentPrints: RecentPrintItem[] = [
  {
    id: 'rec-1',
    fileName: 'SBI_Statement_Q3.pdf',
    shopName: 'QuickPrint Corner',
    timestamp: 'Completed 2h ago',
    status: 'Done',
    pageCount: 3,
    colorMode: 'bw',
    receiptId: 'rec-1',
  },
  {
    id: 'rec-2',
    fileName: 'PAN_Card_Rohan.pdf',
    shopName: 'PrintExpress Hub',
    timestamp: 'Yesterday',
    status: 'Access ended',
    pageCount: 1,
    colorMode: 'color',
    receiptId: 'rec-2',
  },
  {
    id: 'rec-3',
    fileName: 'Rent_Agreement_Draft.pdf',
    shopName: 'Metro Xerox',
    timestamp: '12 Oct',
    status: 'Access ended',
    pageCount: 6,
    colorMode: 'bw',
    receiptId: 'rec-3',
  },
];

export const userProfile = {
  name: 'Rohan Sharma',
  email: 'rohan.sharma@domain.in',
  avatar:
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
  vaultSecurityLevel: 'Hardware Enclave (Tier 4)',
  activeJobsCount: 1,
  totalSavedPages: 42,
  ephemeralPurgesCompleted: 19,
};
