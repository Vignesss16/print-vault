import {
  WhatsAppWebhookPayload,
  IncomingMessageHandlingResult,
  PrintShopAdapter,
} from './types';
import { WhatsAppClient, defaultWhatsAppClient } from './client';
import { getPrintShopAdapter } from './adapters';
import {
  getUploadInvitationMessage,
  getDirectAttachmentWarningMessage,
} from './templates';

export interface ProcessWebhookOptions {
  client?: WhatsAppClient;
  adapter?: PrintShopAdapter;
}

/**
 * Core processor for incoming WhatsApp Business Cloud API webhook payloads in PrintVault.
 */
export async function processWhatsAppWebhook(
  payload: WhatsAppWebhookPayload,
  options: ProcessWebhookOptions = {}
): Promise<IncomingMessageHandlingResult[]> {
  const client = options.client || defaultWhatsAppClient;
  const adapter = options.adapter || getPrintShopAdapter();

  if (!payload || payload.object !== 'whatsapp_business_account' || !payload.entry) {
    return [
      {
        handled: false,
        reason: 'Payload is not a valid WhatsApp Business Account webhook event.',
      },
    ];
  }

  const results: IncomingMessageHandlingResult[] = [];

  for (const entry of payload.entry) {
    if (!entry.changes) continue;

    for (const change of entry.changes) {
      if (change.field !== 'messages') continue;

      const value = change.value;
      if (!value) continue;

      // Handle delivery status notifications (sent, delivered, read)
      if (value.statuses && value.statuses.length > 0) {
        for (const status of value.statuses) {
          results.push({
            handled: true,
            messageId: status.id,
            reason: `Status receipt acknowledged: ${status.status}`,
          });
        }
        continue;
      }

      // Handle incoming customer messages
      if (value.messages && value.messages.length > 0) {
        for (const message of value.messages) {
          const messageId = message.id;
          const customerPhone = message.from;

          // 1. Idempotency check: Meta guarantees at-least-once delivery
          const alreadyProcessed = await adapter.isWebhookEventProcessed(messageId);
          if (alreadyProcessed) {
            results.push({
              handled: true,
              duplicate: true,
              messageId,
              customerPhone,
              reason: `Message ${messageId} already processed (idempotency hit).`,
            });
            continue;
          }

          // 2. Handle Text Messages (e.g. "Hi", "Hello", "Need to print")
          if (message.type === 'text' && message.text?.body) {
            try {
              // Request expiring upload session from PrintVault adapter
              const session = await adapter.createUploadSession(customerPhone);

              const diffMs = session.expiresAt.getTime() - Date.now();
              const expiryMinutes = Math.max(1, Math.round(diffMs / 60000));

              const replyBody = getUploadInvitationMessage({
                uploadUrl: session.uploadUrl,
                expiryMinutes,
              });

              // Send response via WhatsApp Cloud API
              const sendResult = await client.sendTextMessage(customerPhone, replyBody, false);

              // Record event completion in adapter
              await adapter.markNotificationSent(messageId, sendResult.messageId || 'mock_outbound');

              results.push({
                handled: true,
                replySent: true,
                messageId,
                outboundMessageId: sendResult.messageId,
                customerPhone,
              });
            } catch (err) {
              results.push({
                handled: false,
                messageId,
                customerPhone,
                reason: `Failed to process text message: ${err instanceof Error ? err.message : 'Unknown error'}`,
              });
            }
            continue;
          }

          // 3. Handle Direct Attachments (image, document, audio, video)
          // CRITICAL SECURITY REQUIREMENT: Never download, store, or process incoming sensitive documents
          const isAttachment = ['image', 'document', 'audio', 'video', 'sticker'].includes(
            message.type
          );

          if (isAttachment) {
            try {
              const session = await adapter.createUploadSession(customerPhone);

              const warningBody = getDirectAttachmentWarningMessage({
                uploadUrl: session.uploadUrl,
              });

              const sendResult = await client.sendTextMessage(customerPhone, warningBody, false);
              await adapter.markNotificationSent(messageId, sendResult.messageId || 'mock_outbound');

              results.push({
                handled: true,
                replySent: true,
                isUnsupportedMedia: true,
                messageId,
                outboundMessageId: sendResult.messageId,
                customerPhone,
                reason: `Rejected direct ${message.type} attachment for privacy; directed to secure link.`,
              });
            } catch (err) {
              results.push({
                handled: false,
                messageId,
                customerPhone,
                isUnsupportedMedia: true,
                reason: `Failed to send attachment warning: ${err instanceof Error ? err.message : 'Unknown error'}`,
              });
            }
            continue;
          }

          // 4. Fallback for other unsupported message types
          results.push({
            handled: true,
            messageId,
            customerPhone,
            reason: `Ignored unsupported message type '${message.type}' gracefully.`,
          });
        }
      }
    }
  }

  return results.length > 0
    ? results
    : [{ handled: true, reason: 'No actionable message entries found in payload.' }];
}
