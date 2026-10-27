import { PrintJob } from '@/types/printvault';
import { initialActiveJob } from '@/data/mockData';

export interface StoredPrintJob extends PrintJob {
  paperSize?: 'A4' | 'A3';
  printSide?: 'single' | 'double';
  binding?: 'none' | 'stapling' | 'spiral';
  pageRange?: string;
  instructions?: string;
  source?: 'supabase' | 'local_cache';
  uploadedAt?: string;
  paymentStatus?: 'DEMO_PAYMENT_PENDING' | 'SIMULATED_PAYMENT_CONFIRMED';
}

declare global {
  var __printVaultJobsStore: Map<string, StoredPrintJob> | undefined;
}

function getStore(): Map<string, StoredPrintJob> {
  if (!globalThis.__printVaultJobsStore) {
    const store = new Map<string, StoredPrintJob>();
    // Seed with initial active job
    store.set(initialActiveJob.id, {
      ...initialActiveJob,
      paperSize: 'A4',
      printSide: 'double',
      binding: 'none',
      source: 'local_cache',
    });
    // Also index by token
    store.set(initialActiveJob.token, {
      ...initialActiveJob,
      paperSize: 'A4',
      printSide: 'double',
      binding: 'none',
      source: 'local_cache',
    });
    globalThis.__printVaultJobsStore = store;
  }
  return globalThis.__printVaultJobsStore;
}

export const jobsStore = {
  get(idOrToken: string): StoredPrintJob | undefined {
    const normalized = idOrToken.trim();
    const store = getStore();
    return store.get(normalized);
  },

  set(job: StoredPrintJob): void {
    const store = getStore();
    store.set(job.id, job);
    if (job.token) {
      store.set(job.token, job);
    }
  },

  getAll(): StoredPrintJob[] {
    const store = getStore();
    const uniqueMap = new Map<string, StoredPrintJob>();
    store.forEach((job) => {
      uniqueMap.set(job.id, job);
    });
    return Array.from(uniqueMap.values());
  },

  updateStatus(
    idOrToken: string,
    status: StoredPrintJob['status'],
    extra?: Partial<StoredPrintJob>
  ): StoredPrintJob | undefined {
    const existing = this.get(idOrToken);
    if (!existing) return undefined;

    const updated: StoredPrintJob = {
      ...existing,
      status,
      ...extra,
    };
    this.set(updated);
    return updated;
  },
};
