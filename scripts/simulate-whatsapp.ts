/**
 * WhatsApp Integration Interactive Simulator (M-04 Secure Print Shop)
 *
 * Allows developers and evaluators to test incoming WhatsApp messages,
 * greetings, and direct attachment rejection without needing active Meta credentials.
 *
 * Usage:
 *   npx tsx scripts/simulate-whatsapp.ts
 */

import { processWhatsAppWebhook } from '../lib/whatsapp/message-handler';
import { WhatsAppClient, mockSentMessages, clearMockSentMessages } from '../lib/whatsapp/client';
import { getPrintShopAdapter } from '../lib/whatsapp/adapters';
import { WhatsAppWebhookPayload } from '../lib/whatsapp/types';

async function runSimulation() {
  console.log('================================================================');
  console.log('🤖 M-04 Secure Print Shop - WhatsApp Interaction Simulator');
  console.log('================================================================\n');

  clearMockSentMessages();
  const client = new WhatsAppClient({ mockMode: true });
  const adapter = getPrintShopAdapter();

  const customerPhone = '+91 98765 43210';

  // --- Scenario 1: Customer sends "Hi" ---
  console.log(`📱 [Scenario 1] Customer sends "Hi" from ${customerPhone}:`);
  const greetingPayload: WhatsAppWebhookPayload = {
    object: 'whatsapp_business_account',
    entry: [
      {
        id: 'SIMULATED_WABA_ID',
        changes: [
          {
            field: 'messages',
            value: {
              messaging_product: 'whatsapp',
              metadata: { display_phone_number: '15550001234', phone_number_id: '12345' },
              messages: [
                {
                  from: '919876543210',
                  id: `sim_msg_${Date.now()}`,
                  timestamp: `${Math.floor(Date.now() / 1000)}`,
                  type: 'text',
                  text: { body: 'Hi, I need some prints!' },
                },
              ],
            },
          },
        ],
      },
    ],
  };

  const results1 = await processWhatsAppWebhook(greetingPayload, { client, adapter });
  console.log('⚙️ Webhook Processing Result:', results1);
  console.log('\n💬 WhatsApp Outbound Reply Sent to Customer:');
  console.log('----------------------------------------------------------------');
  console.log(mockSentMessages[mockSentMessages.length - 1].body);
  console.log('----------------------------------------------------------------\n');

  // --- Scenario 2: Customer mistakenly attaches a PDF (e.g. Aadhaar / Bank Statement) ---
  console.log(`📎 [Scenario 2] Customer sends direct document attachment (Aadhaar_Card.pdf):`);
  const documentPayload: WhatsAppWebhookPayload = {
    object: 'whatsapp_business_account',
    entry: [
      {
        id: 'SIMULATED_WABA_ID',
        changes: [
          {
            field: 'messages',
            value: {
              messaging_product: 'whatsapp',
              metadata: { display_phone_number: '15550001234', phone_number_id: '12345' },
              messages: [
                {
                  from: '919876543210',
                  id: `sim_msg_${Date.now() + 1}`,
                  timestamp: `${Math.floor(Date.now() / 1000)}`,
                  type: 'document',
                  document: {
                    id: 'doc_sim_id_777',
                    filename: 'Aadhaar_Card.pdf',
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

  const results2 = await processWhatsAppWebhook(documentPayload, { client, adapter });
  console.log('⚙️ Webhook Processing Result:', results2);
  console.log('\n💬 WhatsApp Privacy Warning Reply Sent to Customer:');
  console.log('----------------------------------------------------------------');
  console.log(mockSentMessages[mockSentMessages.length - 1].body);
  console.log('----------------------------------------------------------------\n');

  // --- Scenario 3: Duplicate webhook delivery (Idempotency test) ---
  console.log(`🔁 [Scenario 3] Simulating Meta webhook retry of the same event:`);
  const duplicateResults = await processWhatsAppWebhook(greetingPayload, { client, adapter });
  console.log('⚙️ Duplicate Result:', duplicateResults);
  console.log(`Total messages sent to user: ${mockSentMessages.length} (Expected: 2, no extra message sent)\n`);

  console.log('✅ Simulation completed successfully!');
}

runSimulation().catch(console.error);
