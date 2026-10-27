/**
 * PrintVault WhatsApp Interaction Simulator
 *
 * Usage:
 *   npx tsx scripts/simulate-whatsapp.ts
 */

import { processWhatsAppWebhook } from '../src/lib/whatsapp/message-handler';
import { WhatsAppClient, mockSentMessages, clearMockSentMessages } from '../src/lib/whatsapp/client';
import { getPrintShopAdapter } from '../src/lib/whatsapp/adapters';
import { WhatsAppWebhookPayload } from '../src/lib/whatsapp/types';

async function runSimulation() {
  console.log('================================================================');
  console.log('🤖 PrintVault - WhatsApp Interaction Simulator');
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
                  text: { body: 'Hi, I need to print my documents!' },
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

  // --- Scenario 2: Customer mistakenly attaches a PDF ---
  console.log(`📎 [Scenario 2] Customer sends direct PDF attachment (Aadhaar_Card.pdf):`);
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
  console.log('\n💬 WhatsApp Privacy Alert Sent to Customer:');
  console.log('----------------------------------------------------------------');
  console.log(mockSentMessages[mockSentMessages.length - 1].body);
  console.log('----------------------------------------------------------------\n');

  console.log('✅ Simulation completed successfully!');
}

runSimulation().catch(console.error);
