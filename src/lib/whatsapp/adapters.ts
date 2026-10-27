import crypto from 'crypto';
import { PrintShopAdapter, UploadSessionResult, UploadSessionRecord } from './types';
import { mockShops } from '@/data/mockData';
import { getSupabaseServerClient } from '@/lib/supabase/server';

export { type PrintShopAdapter, type UploadSessionResult, type UploadSessionRecord };

// In-memory sessions store
const activeSessions = new Map<string, UploadSessionRecord>();
const processedEventIds = new Set<string>();
const sentNotifications: Array<{ eventId: string; messageId: string; timestamp: Date }> = [];

/**
 * Registers an upload session record into active sessions.
 */
export function registerUploadSession(record: UploadSessionRecord): void {
  activeSessions.set(record.sessionId, record);
}

/**
 * Retrieves a registered upload session record by session ID.
 */
export function getRegisteredSession(sessionId: string): UploadSessionRecord | undefined {
  return activeSessions.get(sessionId);
}

/**
 * Directly creates a validated upload session following the PrintVault contract
 * (used in tests or fallback local environments).
 */
export function createDirectUploadSession(
  customerPhone: string,
  expiresInSeconds = 600,
  shopId?: string
): UploadSessionResult {
  const sessionId = `pv_sess_${crypto.randomUUID()}`;
  const token = crypto.randomBytes(24).toString('base64url');
  const expiresAt = new Date(Date.now() + expiresInSeconds * 1000);

  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.PRINTVAULT_API_BASE_URL ||
    'https://print-vault-livid.vercel.app';

  const cleanBase = baseUrl.replace(/\/$/, '');
  const uploadUrl = `${cleanBase}/upload?session=${sessionId}&token=${token}&phone=${encodeURIComponent(customerPhone)}`;

  registerUploadSession({
    sessionId,
    customerPhone,
    token,
    uploadUrl,
    expiresAt,
    status: 'PENDING_UPLOAD',
  });

  return {
    sessionId,
    uploadUrl,
    expiresAt,
  };
}

/**
 * PrintVaultWhatsAppAdapter
 *
 * Implements the PrintShopAdapter contract for PrintVault.
 * Invokes the main application's POST /api/sessions/upload service endpoint.
 */
export class PrintVaultWhatsAppAdapter implements PrintShopAdapter {
  async createUploadSession(customerPhone: string): Promise<UploadSessionResult> {
    const apiBaseUrl =
      process.env.PRINTVAULT_API_BASE_URL ||
      process.env.NEXT_PUBLIC_APP_URL ||
      '';

    const secret =
      process.env.PRINTVAULT_INTERNAL_SECRET ||
      process.env.WHATSAPP_INTERNAL_API_KEY ||
      '';

    // If an API base URL is configured, invoke the official service contract endpoint
    if (apiBaseUrl) {
      const url = `${apiBaseUrl.replace(/\/$/, '')}/api/sessions/upload`;

      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Internal-Secret': secret,
          },
          body: JSON.stringify({
            phoneNumber: customerPhone,
            expiresInSeconds: 600,
          }),
        });

        if (!response.ok) {
          const errText = await response.text().catch(() => '');
          throw new Error(
            `Upload session service error: HTTP ${response.status} ${response.statusText} - ${errText}`
          );
        }

        const data = await response.json();
        if (!data || !data.id || !data.uploadUrl || !data.expiresAt) {
          throw new Error(
            'Upload session service returned an invalid payload (missing id, uploadUrl, or expiresAt).'
          );
        }

        return {
          sessionId: data.id,
          uploadUrl: data.uploadUrl,
          expiresAt: new Date(data.expiresAt),
        };
      } catch (error) {
        // In local/test mode without an external running server, fall back to direct creation
        if (process.env.NODE_ENV === 'test' || process.env.WHATSAPP_MOCK_MODE === 'true') {
          return createDirectUploadSession(customerPhone);
        }
        throw error;
      }
    }

    // Default direct generation when no remote API base URL is specified
    return createDirectUploadSession(customerPhone);
  }

  async validateUploadSession(sessionId: string, token: string): Promise<UploadSessionRecord | null> {
    const record = activeSessions.get(sessionId);
    if (!record) return null;

    if (record.token !== token) return null;

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
      'All documents are encrypted in transit and shredded from memory immediately after printing.'
    );
  }

  async isWebhookEventProcessed(eventId: string): Promise<boolean> {
    if (processedEventIds.has(eventId)) return true;

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
        // Fall back to in-memory check
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

  // Helper inspection methods
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

let activeAdapter: PrintShopAdapter = new PrintVaultWhatsAppAdapter();

export function getPrintShopAdapter(): PrintShopAdapter {
  return activeAdapter;
}

export function setPrintShopAdapter(adapter: PrintShopAdapter): void {
  activeAdapter = adapter;
}
