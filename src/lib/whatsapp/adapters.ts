import crypto from 'crypto';
import { PrintShopAdapter, UploadSessionResult, UploadSessionRecord } from './types';
import { getSupabaseServerClient } from '@/lib/supabase/server';

export { type PrintShopAdapter, type UploadSessionResult, type UploadSessionRecord };

// In-memory sessions store (accessible across API routes in same server runtime)
const activeSessions = new Map<string, UploadSessionRecord>();
const processedEventIds = new Set<string>();
const sentNotifications: Array<{ eventId: string; messageId: string; timestamp: Date }> = [];

/**
 * PrintVaultWhatsAppAdapter
 *
 * Implements the PrintShopAdapter contract for PrintVault.
 * Interacts with Supabase when available, with automatic graceful fallback
 * to the zero-store memory buffer.
 */
export class PrintVaultWhatsAppAdapter implements PrintShopAdapter {
  private getBaseUrl(): string {
    if (process.env.SECURE_UPLOAD_BASE_URL) {
      return process.env.SECURE_UPLOAD_BASE_URL;
    }
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    return `${appUrl}/upload`;
  }

  async createUploadSession(customerPhone: string): Promise<UploadSessionResult> {
    const token = crypto.randomBytes(24).toString('base64url');
    const sessionId = `pv_sess_${crypto.randomUUID()}`;
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15-minute lifetime

    const baseUrl = this.getBaseUrl();
    const separator = baseUrl.includes('?') ? '&' : '?';
    const uploadUrl = `${baseUrl}${separator}session=${sessionId}&token=${token}&phone=${encodeURIComponent(customerPhone)}`;

    const record: UploadSessionRecord = {
      sessionId,
      customerPhone,
      token,
      uploadUrl,
      expiresAt,
      status: 'PENDING_UPLOAD',
    };

    activeSessions.set(sessionId, record);

    return {
      sessionId,
      uploadUrl,
      expiresAt,
    };
  }

  async validateUploadSession(sessionId: string, token: string): Promise<UploadSessionRecord | null> {
    const record = activeSessions.get(sessionId);
    if (!record) return null;

    // Check token match
    if (record.token !== token) return null;

    // Check expiry
    if (Date.now() > record.expiresAt.getTime()) {
      record.status = 'EXPIRED';
      return null;
    }

    return record;
  }

  getUploadInstructions(_sessionId?: string): string {
    return (
      'Please open your secure PrintVault link, select your document (Aadhaar, PAN, PDF, or image), ' +
      'apply privacy masking if needed, and confirm your print specifications. ' +
      'All documents are encrypted in transit and purged immediately after printing.'
    );
  }

  async isWebhookEventProcessed(eventId: string): Promise<boolean> {
    if (processedEventIds.has(eventId)) return true;

    // Optional Supabase lookup
    const supabase = getSupabaseServerClient();
    if (supabase) {
      try {
        const { data } = await supabase
          .from('purge_receipts')
          .select('id')
          .eq('token', eventId)
          .maybeSingle();
        if (data) return true;
      } catch {
        // Fall back to memory set
      }
    }

    return false;
  }

  async markNotificationSent(eventId: string, messageId: string): Promise<void> {
    processedEventIds.add(eventId);
    sentNotifications.push({
      eventId,
      messageId,
      timestamp: new Date(),
    });
  }

  // --- Helper methods for test assertions and debugging ---
  getActiveSessions() {
    return new Map(activeSessions);
  }

  getSentNotifications() {
    return [...sentNotifications];
  }

  clear(): void {
    activeSessions.clear();
    processedEventIds.clear();
    sentNotifications.length = 0;
  }
}

// Global singleton adapter instance
let activeAdapter: PrintShopAdapter = new PrintVaultWhatsAppAdapter();

export function getPrintShopAdapter(): PrintShopAdapter {
  return activeAdapter;
}

export function setPrintShopAdapter(adapter: PrintShopAdapter): void {
  activeAdapter = adapter;
}
