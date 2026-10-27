/**
 * TypeScript types and interfaces for the Meta WhatsApp Cloud API integration
 * and the Secure Print Shop (M-04) integration contract.
 */

// =============================================================================
// Main Application Integration Adapter Contract
// =============================================================================

export interface UploadSessionResult {
  sessionId: string;
  uploadUrl: string;
  expiresAt: Date;
}

/**
 * Adapter interface allowing the main application to supply business logic,
 * database persistence, and secure token generation without coupling this module
 * to a specific database or storage engine.
 */
export interface PrintShopAdapter {
  /**
   * Generates or requests a secure, expiring, access-controlled upload session
   * from the main application's upload service.
   *
   * @param customerPhone E.164 formatted customer phone number
   */
  createUploadSession(customerPhone: string): Promise<UploadSessionResult>;

  /**
   * Returns localized or customized instructional text for document submission.
   *
   * @param sessionId Optional session identifier
   */
  getUploadInstructions(sessionId?: string): string;

  /**
   * Records that an outbound notification or reply was sent for an incoming event,
   * enabling audit logging and analytics.
   *
   * @param eventId The incoming WhatsApp message/event ID
   * @param messageId The outbound WhatsApp message ID returned by Meta
   */
  markNotificationSent(eventId: string, messageId: string): Promise<void>;

  /**
   * Checks whether an incoming webhook event ID has already been handled,
   * protecting against Meta's at-least-once webhook retry delivery.
   *
   * @param eventId The incoming WhatsApp message ID (e.g. "wamid.HBgM...")
   */
  isWebhookEventProcessed(eventId: string): Promise<boolean>;
}

// =============================================================================
// Meta WhatsApp Cloud API Webhook Payloads
// =============================================================================

export interface WhatsAppProfile {
  name?: string;
}

export interface WhatsAppContact {
  profile?: WhatsAppProfile;
  wa_id: string;
}

export type WhatsAppMessageType =
  | 'text'
  | 'image'
  | 'document'
  | 'audio'
  | 'video'
  | 'sticker'
  | 'location'
  | 'contacts'
  | 'interactive'
  | 'button'
  | 'unsupported';

export interface WhatsAppTextMessage {
  body: string;
}

export interface WhatsAppMediaAttachment {
  id: string;
  mime_type?: string;
  sha256?: string;
  filename?: string;
  caption?: string;
}

export interface WhatsAppIncomingMessage {
  from: string;
  id: string;
  timestamp: string;
  type: WhatsAppMessageType | string;
  text?: WhatsAppTextMessage;
  document?: WhatsAppMediaAttachment;
  image?: WhatsAppMediaAttachment;
  audio?: WhatsAppMediaAttachment;
  video?: WhatsAppMediaAttachment;
  errors?: Array<{
    code: number;
    title: string;
    message?: string;
    error_data?: { details: string };
  }>;
}

export interface WhatsAppStatus {
  id: string;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  timestamp: string;
  recipient_id: string;
  conversation?: {
    id: string;
    origin?: {
      type: string;
    };
    expiration_timestamp?: string;
  };
  pricing?: {
    billable: boolean;
    pricing_model: string;
    category: string;
  };
  errors?: Array<{
    code: number;
    title: string;
    message?: string;
  }>;
}

export interface WhatsAppMetadata {
  display_phone_number: string;
  phone_number_id: string;
}

export interface WhatsAppValue {
  messaging_product: 'whatsapp';
  metadata: WhatsAppMetadata;
  contacts?: WhatsAppContact[];
  messages?: WhatsAppIncomingMessage[];
  statuses?: WhatsAppStatus[];
  errors?: Array<{
    code: number;
    title: string;
    message: string;
  }>;
}

export interface WhatsAppChange {
  value: WhatsAppValue;
  field: 'messages';
}

export interface WhatsAppEntry {
  id: string;
  changes: WhatsAppChange[];
}

export interface WhatsAppWebhookPayload {
  object: 'whatsapp_business_account';
  entry?: WhatsAppEntry[];
}

// =============================================================================
// Outbound WhatsApp Cloud API Types
// =============================================================================

export interface OutboundTextMessageBody {
  messaging_product: 'whatsapp';
  recipient_type: 'individual';
  to: string;
  type: 'text';
  text: {
    preview_url?: boolean;
    body: string;
  };
}

export interface OutboundTemplateMessageBody {
  messaging_product: 'whatsapp';
  recipient_type: 'individual';
  to: string;
  type: 'template';
  template: {
    name: string;
    language: {
      code: string;
    };
    components?: Array<{
      type: 'header' | 'body' | 'button';
      sub_type?: string;
      index?: number;
      parameters: Array<{
        type: 'text' | 'image' | 'document' | 'video';
        text?: string;
      }>;
    }>;
  };
}

export interface MetaApiResponseSuccess {
  messaging_product: 'whatsapp';
  contacts: Array<{
    input: string;
    wa_id: string;
  }>;
  messages: Array<{
    id: string;
    message_status?: string;
  }>;
}

export interface MetaApiError {
  message: string;
  type: string;
  code: number;
  error_subcode?: number;
  fbtrace_id?: string;
}

export interface MetaApiResponseError {
  error: MetaApiError;
}

// =============================================================================
// Module Configuration & Helper Types
// =============================================================================

export interface WhatsAppConfig {
  accessToken: string;
  phoneNumberId: string;
  verifyToken: string;
  appSecret: string;
  graphApiVersion: string;
  secureUploadBaseUrl: string;
  internalApiKey?: string;
  mockMode: boolean;
}

export interface VerifySignatureResult {
  valid: boolean;
  reason?: string;
}

export interface IncomingMessageHandlingResult {
  handled: boolean;
  duplicate?: boolean;
  replySent?: boolean;
  messageId?: string;
  outboundMessageId?: string;
  reason?: string;
  customerPhone?: string;
  isUnsupportedMedia?: boolean;
}

export interface OutboundSendRequest {
  to: string;
  message: string;
  previewUrl?: boolean;
}

export interface OutboundSendResponse {
  success: boolean;
  messageId?: string;
  mock?: boolean;
  error?: string;
}
