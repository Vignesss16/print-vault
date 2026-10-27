import crypto from 'crypto';
import { PrintShopAdapter, UploadSessionResult } from './types';

export { type PrintShopAdapter, type UploadSessionResult };

/**
 * MockPrintShopAdapter: Clearly labeled mock implementation for local development and unit tests.
 *
 * DO NOT USE IN PRODUCTION. The main application will inject a production adapter backed
 * by real databases (e.g. PostgreSQL, Prisma, Supabase) and real presigned storage/upload URLs.
 */
export class MockPrintShopAdapter implements PrintShopAdapter {
  private processedEventIds = new Set<string>();
  private sentNotifications: Array<{ eventId: string; messageId: string; timestamp: Date }> = [];
  private sessions: Map<string, { phone: string; expiresAt: Date; uploadUrl: string }> = new Map();
  private baseUrl: string;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || process.env.SECURE_UPLOAD_BASE_URL || 'http://localhost:3000/upload';
  }

  async createUploadSession(customerPhone: string): Promise<UploadSessionResult> {
    // Generate an unguessable, cryptographically secure 192-bit session token
    const token = crypto.randomBytes(24).toString('base64url');
    const sessionId = `mock_sess_${crypto.randomUUID()}`;

    // Upload sessions expire in 15 minutes
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    const separator = this.baseUrl.includes('?') ? '&' : '?';
    const uploadUrl = `${this.baseUrl}${separator}session=${sessionId}&token=${token}&expires=${expiresAt.getTime()}`;

    this.sessions.set(sessionId, {
      phone: customerPhone,
      expiresAt,
      uploadUrl,
    });

    return {
      sessionId,
      uploadUrl,
      expiresAt,
    };
  }

  getUploadInstructions(_sessionId?: string): string {
    return (
      'Please open the secure link, select your PDF or images, specify print copies, ' +
      'and submit. Your files will be transmitted via TLS and queued securely for printing.'
    );
  }

  async isWebhookEventProcessed(eventId: string): Promise<boolean> {
    return this.processedEventIds.has(eventId);
  }

  async markNotificationSent(eventId: string, messageId: string): Promise<void> {
    this.processedEventIds.add(eventId);
    this.sentNotifications.push({
      eventId,
      messageId,
      timestamp: new Date(),
    });
  }

  // --- Helper methods for unit test assertions and simulation ---

  getProcessedEventIds(): string[] {
    return Array.from(this.processedEventIds);
  }

  getSentNotifications() {
    return [...this.sentNotifications];
  }

  getSessions() {
    return new Map(this.sessions);
  }

  clear(): void {
    this.processedEventIds.clear();
    this.sentNotifications = [];
    this.sessions.clear();
  }
}

// Global adapter instance initialized to the Mock adapter by default
let activeAdapter: PrintShopAdapter = new MockPrintShopAdapter();

/**
 * Retrieves the currently registered PrintShopAdapter.
 */
export function getPrintShopAdapter(): PrintShopAdapter {
  return activeAdapter;
}

/**
 * Registers a custom or production PrintShopAdapter.
 * Call this when merging into the main project to attach database and storage persistence.
 */
export function setPrintShopAdapter(adapter: PrintShopAdapter): void {
  activeAdapter = adapter;
}

/**
 * Resets the adapter back to a fresh MockPrintShopAdapter (useful for test suites).
 */
export function resetPrintShopAdapter(): MockPrintShopAdapter {
  const mock = new MockPrintShopAdapter();
  activeAdapter = mock;
  return mock;
}
