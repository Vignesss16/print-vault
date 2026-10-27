import { describe, it, expect, beforeEach } from 'vitest';
import { processWhatsAppWebhook } from '@/lib/whatsapp/message-handler';
import { MockPrintShopAdapter, resetPrintShopAdapter } from '@/lib/whatsapp/adapters';
import { WhatsAppClient, mockSentMessages, clearMockSentMessages } from '@/lib/whatsapp/client';
import { WhatsAppWebhookPayload } from '@/lib/whatsapp/types';

describe('WhatsApp Webhook Message Handler', () => {
  let adapter: MockPrintShopAdapter;
  let client: WhatsAppClient;

  beforeEach(() => {
    adapter = resetPrintShopAdapter();
    client = new WhatsAppClient({ mockMode: true });
    clearMockSentMessages();
  });

  const createTextWebhookPayload = (
    text: string,
    messageId = 'wamid.HBgM1001',
    from = '919876543210'
  ): WhatsAppWebhookPayload => ({
    object: 'whatsapp_business_account',
    entry: [
      {
        id: 'WHATSAPP_BUSINESS_ACCOUNT_ID',
        changes: [
          {
            field: 'messages',
            value: {
              messaging_product: 'whatsapp',
              metadata: {
                display_phone_number: '15550001234',
                phone_number_id: '1234567890',
              },
              contacts: [
                {
                  profile: { name: 'Customer Test' },
                  wa_id: from,
                },
              ],
              messages: [
                {
                  from,
                  id: messageId,
                  timestamp: '1700000000',
                  type: 'text',
                  text: { body: text },
                },
              ],
            },
          },
        ],
      },
    ],
  });

  it('handles incoming "Hi" text message by generating secure upload link and sending reply', async () => {
    const payload = createTextWebhookPayload('Hi');
    const results = await processWhatsAppWebhook(payload, { client, adapter });

    expect(results).toHaveLength(1);
    expect(results[0].handled).toBe(true);
    expect(results[0].replySent).toBe(true);
    expect(results[0].messageId).toBe('wamid.HBgM1001');

    // Verify adapter recorded session
    expect(adapter.getSessions().size).toBe(1);

    // Verify mock WhatsApp reply
    expect(mockSentMessages).toHaveLength(1);
    const sent = mockSentMessages[0];
    expect(sent.to).toBe('919876543210');
    expect(sent.body).toContain('Welcome to Secure Print Shop!');
    expect(sent.body).toContain('Please do NOT send Aadhaar cards, PAN cards, bank statements');
    expect(sent.body).toContain('session=');

    // Verify event is marked as processed in adapter
    expect(await adapter.isWebhookEventProcessed('wamid.HBgM1001')).toBe(true);
  });

  it('safely handles duplicate webhook deliveries (idempotency)', async () => {
    const payload = createTextWebhookPayload('Hello');

    // First delivery
    const firstResults = await processWhatsAppWebhook(payload, { client, adapter });
    expect(firstResults[0].replySent).toBe(true);
    expect(mockSentMessages).toHaveLength(1);

    // Second delivery (simulating Meta webhook retry)
    const secondResults = await processWhatsAppWebhook(payload, { client, adapter });
    expect(secondResults[0].handled).toBe(true);
    expect(secondResults[0].duplicate).toBe(true);

    // Crucial: no duplicate message was dispatched
    expect(mockSentMessages).toHaveLength(1);
  });

  it('rejects direct document and image attachments for privacy and directs to secure portal', async () => {
    const mediaPayload: WhatsAppWebhookPayload = {
      object: 'whatsapp_business_account',
      entry: [
        {
          id: 'WABA_ID',
          changes: [
            {
              field: 'messages',
              value: {
                messaging_product: 'whatsapp',
                metadata: {
                  display_phone_number: '15550001234',
                  phone_number_id: '1234567890',
                },
                messages: [
                  {
                    from: '919876543210',
                    id: 'wamid.HBgM_DOC_1',
                    timestamp: '1700000000',
                    type: 'document',
                    document: {
                      id: 'media_id_99999',
                      filename: 'Aadhaar_Card_Scan.pdf',
                      mime_type: 'application/pdf',
                    },
                  },
                ],
              },
            },
          ],
        },
      ],
    };

    const results = await processWhatsAppWebhook(mediaPayload, { client, adapter });

    expect(results[0].handled).toBe(true);
    expect(results[0].isUnsupportedMedia).toBe(true);
    expect(results[0].replySent).toBe(true);

    // Verify that direct attachment warning was dispatched with the secure upload link
    expect(mockSentMessages).toHaveLength(1);
    const sent = mockSentMessages[0];
    expect(sent.body).toContain('cannot accept documents, IDs, or photos directly in WhatsApp chat');
    expect(sent.body).toContain('Aadhaar, PAN, or financial records');
    expect(sent.body).toContain('session=');
  });

  it('gracefully acknowledges delivery status updates (sent, delivered, read)', async () => {
    const statusPayload: WhatsAppWebhookPayload = {
      object: 'whatsapp_business_account',
      entry: [
        {
          id: 'WABA_ID',
          changes: [
            {
              field: 'messages',
              value: {
                messaging_product: 'whatsapp',
                metadata: {
                  display_phone_number: '15550001234',
                  phone_number_id: '1234567890',
                },
                statuses: [
                  {
                    id: 'wamid.HBgM1001',
                    status: 'delivered',
                    timestamp: '1700000005',
                    recipient_id: '919876543210',
                  },
                ],
              },
            },
          ],
        },
      ],
    };

    const results = await processWhatsAppWebhook(statusPayload, { client, adapter });
    expect(results[0].handled).toBe(true);
    expect(results[0].reason).toContain('Status receipt acknowledged: delivered');
    expect(mockSentMessages).toHaveLength(0);
  });

  it('handles malformed payloads safely without crashing', async () => {
    const badPayload = {} as unknown as WhatsAppWebhookPayload;
    const results = await processWhatsAppWebhook(badPayload, { client, adapter });

    expect(results[0].handled).toBe(false);
    expect(results[0].reason).toContain('not a valid WhatsApp Business Account webhook');
  });
});
