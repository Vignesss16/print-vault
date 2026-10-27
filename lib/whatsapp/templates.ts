/**
 * Configurable message templates for the Secure Print Shop (M-04) WhatsApp flow.
 *
 * Implements strict privacy guidance directing customers to use the secure web upload link
 * rather than transmitting sensitive PII (Aadhaar, PAN, bank statements) via WhatsApp chat.
 */

export interface UploadInvitationParams {
  uploadUrl: string;
  expiryMinutes?: number;
}

export interface DocumentReceivedParams {
  jobId: string;
  pageCount?: number;
}

export interface PrintReadyParams {
  jobId: string;
  pickupCode: string;
  shopName?: string;
}

export interface AttachmentWarningParams {
  uploadUrl: string;
}

export interface SessionExpiredParams {
  newUploadUrl?: string;
}

/**
 * Message sent when a customer initiates contact or requests a print upload link.
 */
export function getUploadInvitationMessage(params: UploadInvitationParams): string {
  const expiryNote = params.expiryMinutes
    ? `This link expires in ${params.expiryMinutes} minutes.`
    : 'Your upload link expires automatically.';

  return (
    `🔒 *Welcome to Secure Print Shop!*\n\n` +
    `To protect your personal data and privacy, please upload your document using our secure portal:\n` +
    `👉 ${params.uploadUrl}\n\n` +
    `⚠️ *Important Privacy Notice:* Please do NOT send Aadhaar cards, PAN cards, bank statements, or other sensitive documents directly as WhatsApp attachments or photos.\n\n` +
    `🕒 ${expiryNote}`
  );
}

/**
 * Warning sent when a customer accidentally sends a direct document/image attachment in WhatsApp.
 * Direct media is never stored or processed; customer is redirected to the secure portal.
 */
export function getDirectAttachmentWarningMessage(params: AttachmentWarningParams): string {
  return (
    `⚠️ *Privacy & Security Notice*\n\n` +
    `For your security, we *cannot accept documents, IDs, or photos directly in WhatsApp chat*.\n\n` +
    `Sending identity documents like Aadhaar, PAN, or financial records over chat risks your personal privacy.\n\n` +
    `Please tap your private, encrypted upload link to submit your files securely:\n` +
    `👉 ${params.uploadUrl}\n\n` +
    `Documents uploaded through our secure portal are encrypted in transit and automatically purged after printing.`
  );
}

/**
 * Confirmation message sent when the main application finishes receiving the upload.
 */
export function getDocumentReceivedMessage(params: DocumentReceivedParams): string {
  const pageInfo = params.pageCount ? ` (${params.pageCount} pages)` : '';
  return (
    `✅ *Document Received Securely!*\n\n` +
    `Your file${pageInfo} has been received into our encrypted print queue.\n` +
    `📄 *Job ID:* ${params.jobId}\n\n` +
    `We will notify you here as soon as your print is completed.`
  );
}

/**
 * Notification sent when the print shop operator completes printing.
 */
export function getPrintReadyMessage(params: PrintReadyParams): string {
  const shop = params.shopName || 'Secure Print Shop';
  return (
    `🖨️ *Your Print is Ready for Pickup!*\n\n` +
    `📄 *Job ID:* ${params.jobId}\n` +
    `🔑 *Pickup Code:* *${params.pickupCode}*\n\n` +
    `Please present your pickup code at the ${shop} counter to collect your prints. ` +
    `All digital copies will be permanently deleted once collected.`
  );
}

/**
 * Message sent if an existing upload session has expired.
 */
export function getSessionExpiredMessage(params: SessionExpiredParams): string {
  if (params.newUploadUrl) {
    return (
      `⌛ *Upload Session Expired*\n\n` +
      `Your previous link has expired for your protection. Here is your fresh secure upload link:\n` +
      `👉 ${params.newUploadUrl}`
    );
  }

  return (
    `⌛ *Upload Session Expired*\n\n` +
    `Your previous upload link has expired for your protection. ` +
    `Please reply with *"Hi"* or *"Print"* to generate a new secure link.`
  );
}
