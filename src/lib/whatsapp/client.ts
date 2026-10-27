import {
  MetaApiResponseSuccess,
  MetaApiResponseError,
  OutboundSendResponse,
  WhatsAppConfig,
} from './types';

/**
 * Server-only WhatsApp Cloud API client.
 * Ensures credentials remain strictly on the server and provides phone normalization,
 * rate limiting, and safe mock mode support.
 */

// Simple in-memory sliding window rate limiter for abuse prevention
interface RateLimitRecord {
  timestamps: number[];
}

const recipientRateLimits = new Map<string, RateLimitRecord>();
let globalRateLimit: RateLimitRecord = { timestamps: [] };

const MAX_MESSAGES_PER_RECIPIENT_PER_MINUTE = 10;
const MAX_GLOBAL_MESSAGES_PER_MINUTE = 120;
const RATE_LIMIT_WINDOW_MS = 60 * 1000;

export interface MockSentMessage {
  to: string;
  body: string;
  timestamp: Date;
  messageId: string;
}

export const mockSentMessages: MockSentMessage[] = [];

/**
 * Normalizes phone numbers to standard international digits-only format (E.164 without leading plus).
 * e.g. "+91 98765-43210" -> "919876543210"
 */
export function normalizePhoneNumber(rawPhone: string): { normalized: string; valid: boolean; reason?: string } {
  if (!rawPhone || typeof rawPhone !== 'string') {
    return { normalized: '', valid: false, reason: 'Phone number must be a non-empty string.' };
  }

  // Strip all non-digit characters
  const digitsOnly = rawPhone.replace(/\D/g, '');

  // International phone numbers typically span 10 to 15 digits (ITU E.164)
  if (digitsOnly.length < 10 || digitsOnly.length > 15) {
    return {
      normalized: digitsOnly,
      valid: false,
      reason: `Invalid phone number length (${digitsOnly.length} digits). Expected 10 to 15 digits.`,
    };
  }

  return { normalized: digitsOnly, valid: true };
}

/**
 * Masks a phone number for safe server-side logging without exposing PII.
 * e.g. "919876543210" -> "919****210"
 */
export function maskPhoneNumber(phone: string): string {
  if (!phone || phone.length < 6) return '******';
  const start = phone.substring(0, 3);
  const end = phone.substring(phone.length - 3);
  return `${start}****${end}`;
}

/**
 * Checks in-memory rate limits to prevent spam and cost abuse.
 */
function checkRateLimit(recipient: string): { allowed: boolean; reason?: string } {
  const now = Date.now();

  // Check global rate limit
  globalRateLimit.timestamps = globalRateLimit.timestamps.filter(
    (t) => now - t < RATE_LIMIT_WINDOW_MS
  );
  if (globalRateLimit.timestamps.length >= MAX_GLOBAL_MESSAGES_PER_MINUTE) {
    return {
      allowed: false,
      reason: 'Global outbound rate limit exceeded. Please retry in a few moments.',
    };
  }

  // Check per-recipient rate limit
  const recipientRecord = recipientRateLimits.get(recipient) || { timestamps: [] };
  recipientRecord.timestamps = recipientRecord.timestamps.filter(
    (t) => now - t < RATE_LIMIT_WINDOW_MS
  );

  if (recipientRecord.timestamps.length >= MAX_MESSAGES_PER_RECIPIENT_PER_MINUTE) {
    return {
      allowed: false,
      reason: `Outbound rate limit exceeded for recipient ${maskPhoneNumber(recipient)}.`,
    };
  }

  // Record dispatch
  globalRateLimit.timestamps.push(now);
  recipientRecord.timestamps.push(now);
  recipientRateLimits.set(recipient, recipientRecord);

  return { allowed: true };
}

export function resetRateLimits(): void {
  recipientRateLimits.clear();
  globalRateLimit = { timestamps: [] };
}

export function clearMockSentMessages(): void {
  mockSentMessages.length = 0;
}

/**
 * Resolves configuration from environment variables, supporting both PrintVault and standard naming conventions.
 */
export function getWhatsAppConfig(): WhatsAppConfig {
  const accessToken =
    process.env.WHATSAPP_TOKEN ||
    process.env.WHATSAPP_ACCESS_TOKEN ||
    '';

  const isMock =
    process.env.WHATSAPP_MOCK_MODE === 'true' ||
    process.env.NODE_ENV === 'test' ||
    !accessToken;

  const appBaseUrl =
    process.env.SECURE_UPLOAD_BASE_URL ||
    (process.env.NEXT_PUBLIC_APP_URL ? `${process.env.NEXT_PUBLIC_APP_URL}/upload` : 'http://localhost:3000/upload');

  return {
    accessToken,
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || '',
    verifyToken: process.env.WHATSAPP_VERIFY_TOKEN || 'printvault_verify_token_dev',
    appSecret: process.env.WHATSAPP_APP_SECRET || '',
    graphApiVersion: process.env.WHATSAPP_GRAPH_API_VERSION || 'v22.0',
    secureUploadBaseUrl: appBaseUrl,
    internalApiKey: process.env.PRINTVAULT_INTERNAL_SECRET || process.env.WHATSAPP_INTERNAL_API_KEY,
    mockMode: isMock,
  };
}

export class WhatsAppClient {
  private config: WhatsAppConfig;

  constructor(customConfig?: Partial<WhatsAppConfig>) {
    const base = getWhatsAppConfig();
    this.config = {
      ...base,
      ...customConfig,
    };
  }

  /**
   * Sends a plain text message to a WhatsApp customer phone number.
   */
  async sendTextMessage(
    to: string,
    text: string,
    previewUrl = false
  ): Promise<OutboundSendResponse> {
    const normalized = normalizePhoneNumber(to);
    if (!normalized.valid) {
      throw new Error(`Cannot send WhatsApp message: ${normalized.reason}`);
    }

    if (!text || text.trim() === '') {
      throw new Error('Cannot send WhatsApp message: message body cannot be empty.');
    }

    // Rate limit check
    const rateCheck = checkRateLimit(normalized.normalized);
    if (!rateCheck.allowed) {
      throw new Error(`Rate limit error: ${rateCheck.reason}`);
    }

    // Handle Mock Mode
    if (this.config.mockMode) {
      const mockId = `mock_wamid_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      mockSentMessages.push({
        to: normalized.normalized,
        body: text,
        timestamp: new Date(),
        messageId: mockId,
      });

      return {
        success: true,
        messageId: mockId,
        mock: true,
      };
    }

    // Live Meta Cloud API call
    if (!this.config.accessToken || !this.config.phoneNumberId) {
      throw new Error(
        'WhatsApp Cloud API configuration error: Missing WHATSAPP_ACCESS_TOKEN (or WHATSAPP_TOKEN) or WHATSAPP_PHONE_NUMBER_ID.'
      );
    }

    const url = `https://graph.facebook.com/${this.config.graphApiVersion}/${this.config.phoneNumberId}/messages`;

    const payload = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: normalized.normalized,
      type: 'text',
      text: {
        preview_url: previewUrl,
        body: text,
      },
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorData = data as MetaApiResponseError;
        const errMsg = errorData.error?.message || `HTTP ${response.status} ${response.statusText}`;
        const errCode = errorData.error?.code ? ` (code: ${errorData.error.code})` : '';
        throw new Error(`Meta WhatsApp Cloud API error: ${errMsg}${errCode}`);
      }

      const successData = data as MetaApiResponseSuccess;
      const messageId = successData.messages?.[0]?.id || 'unknown';

      return {
        success: true,
        messageId,
        mock: false,
      };
    } catch (error) {
      const sanitized = error instanceof Error ? error.message : 'Unknown network error';
      throw new Error(`Failed to send WhatsApp message to ${maskPhoneNumber(normalized.normalized)}: ${sanitized}`);
    }
  }
}

export const defaultWhatsAppClient = new WhatsAppClient();
