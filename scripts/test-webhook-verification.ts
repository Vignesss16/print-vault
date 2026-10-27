/**
 * Comprehensive Verification Test Suite for WhatsApp Webhook & Sessions Integration
 *
 * Covers all 10 required test cases:
 * 1. Correct webhook verification token -> 200 OK with challenge
 * 2. Incorrect verification token -> 403 Forbidden
 * 3. Missing verification configuration on server -> 500 Server Error
 * 4. Incorrect verification mode -> 403 Forbidden
 * 5. Successful challenge response validation
 * 6. Invalid POST signature -> 401 Unauthorized
 * 7. Valid POST signature -> 200 OK
 * 8. Missing required App Secret configuration -> 500 Server Error
 * 9. Safe handling of malformed webhook payloads -> 400 Bad Request
 * 10. Upload-session API contract validation & error handling
 */

import crypto from 'crypto';
import { NextRequest } from 'next/server';
import { GET as webhookGET, POST as webhookPOST } from '../src/app/api/whatsapp/webhook/route';
import { POST as sessionsUploadPOST } from '../src/app/api/sessions/upload/route';
import { POST as sendPOST } from '../src/app/api/whatsapp/send/route';
import { verifyMetaSignature } from '../src/lib/whatsapp/verify-signature';
import { PrintVaultWhatsAppAdapter } from '../src/lib/whatsapp/adapters';

let testsPassed = 0;
let testsFailed = 0;

function assert(condition: boolean, testName: string, details?: string) {
  if (condition) {
    console.log(`  ✓ PASS: ${testName}`);
    testsPassed++;
  } else {
    console.error(`  ✗ FAIL: ${testName}${details ? ` - ${details}` : ''}`);
    testsFailed++;
  }
}

function generateSignature(payload: string, secret: string): string {
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(payload);
  return `sha256=${hmac.digest('hex')}`;
}

async function runTests() {
  console.log('================================================================');
  console.log('🧪 Running WhatsApp & Upload Session Verification Test Suite');
  console.log('================================================================\n');

  const originalEnv = { ...process.env };
  const TEST_VERIFY_TOKEN = 'test_verify_token_12345';
  const TEST_APP_SECRET = 'test_app_secret_abc123';
  const TEST_INTERNAL_SECRET = 'pv_sec_test_key_999';

  process.env.WHATSAPP_VERIFY_TOKEN = TEST_VERIFY_TOKEN;
  process.env.WHATSAPP_APP_SECRET = TEST_APP_SECRET;
  process.env.PRINTVAULT_INTERNAL_SECRET = TEST_INTERNAL_SECRET;
  process.env.WHATSAPP_MOCK_MODE = 'false';

  // ---------------------------------------------------------------------------
  // 1. GET /api/whatsapp/webhook Tests (Meta Verification Challenge)
  // ---------------------------------------------------------------------------
  console.log('--- Suite 1: Webhook GET Challenge Verification ---');

  // Test 1 & 5: Correct verification token & successful challenge response
  {
    const challenge = '1158201444';
    const url = `http://localhost:3000/api/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=${TEST_VERIFY_TOKEN}&hub.challenge=${challenge}`;
    const req = new NextRequest(url);
    const res = await webhookGET(req);
    const bodyText = await res.text();

    assert(res.status === 200, 'Test 1: Correct verification token returns HTTP 200');
    assert(
      bodyText === challenge,
      'Test 5: Successful challenge response returns raw challenge string',
      `Expected ${challenge}, got ${bodyText}`
    );
    assert(
      res.headers.get('content-type')?.includes('text/plain') ?? false,
      'Challenge response has text/plain Content-Type'
    );
  }

  // Test 2: Incorrect verification token -> 403 Forbidden
  {
    const url = `http://localhost:3000/api/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=wrong_token&hub.challenge=999999`;
    const req = new NextRequest(url);
    const res = await webhookGET(req);
    assert(res.status === 403, 'Test 2: Incorrect verification token returns HTTP 403');
  }

  // Test 3: Missing verification configuration on server -> 500 Server Error
  {
    delete process.env.WHATSAPP_VERIFY_TOKEN;
    const url = `http://localhost:3000/api/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=${TEST_VERIFY_TOKEN}&hub.challenge=999999`;
    const req = new NextRequest(url);
    const res = await webhookGET(req);
    assert(
      res.status === 500,
      'Test 3: Missing WHATSAPP_VERIFY_TOKEN on server returns HTTP 500 error'
    );
    // Restore
    process.env.WHATSAPP_VERIFY_TOKEN = TEST_VERIFY_TOKEN;
  }

  // Test 4: Incorrect verification mode -> 403 Forbidden
  {
    const url = `http://localhost:3000/api/whatsapp/webhook?hub.mode=unsubscribe&hub.verify_token=${TEST_VERIFY_TOKEN}&hub.challenge=999999`;
    const req = new NextRequest(url);
    const res = await webhookGET(req);
    assert(res.status === 403, 'Test 4: Incorrect verification mode returns HTTP 403');
  }

  // ---------------------------------------------------------------------------
  // 2. POST /api/whatsapp/webhook Tests (Security & Parsing)
  // ---------------------------------------------------------------------------
  console.log('\n--- Suite 2: Webhook POST Security & Event Handling ---');

  const validPayload = JSON.stringify({
    object: 'whatsapp_business_account',
    entry: [
      {
        id: 'WABA_1001',
        changes: [
          {
            field: 'messages',
            value: {
              messaging_product: 'whatsapp',
              metadata: { display_phone_number: '15550001234', phone_number_id: '12345' },
              messages: [
                {
                  from: '919876543210',
                  id: `msg_${Date.now()}`,
                  timestamp: `${Math.floor(Date.now() / 1000)}`,
                  type: 'text',
                  text: { body: 'Hi' },
                },
              ],
            },
          },
        ],
      },
    ],
  });

  // Test 6: Invalid POST signature -> 401 Unauthorized
  {
    const wrongSignature = generateSignature(validPayload, 'wrong_secret_key');
    const req = new NextRequest('http://localhost:3000/api/whatsapp/webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-hub-signature-256': wrongSignature,
      },
      body: validPayload,
    });
    const res = await webhookPOST(req);
    assert(res.status === 401, 'Test 6: Invalid POST signature returns HTTP 401 Unauthorized');
  }

  // Test 7: Valid POST signature -> 200 OK
  {
    const validSignature = generateSignature(validPayload, TEST_APP_SECRET);
    const req = new NextRequest('http://localhost:3000/api/whatsapp/webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-hub-signature-256': validSignature,
      },
      body: validPayload,
    });
    const res = await webhookPOST(req);
    assert(res.status === 200, 'Test 7: Valid POST signature returns HTTP 200 OK');
  }

  // Test 8: Missing required configuration (WHATSAPP_APP_SECRET) -> 500 Server Error
  {
    delete process.env.WHATSAPP_APP_SECRET;
    const req = new NextRequest('http://localhost:3000/api/whatsapp/webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-hub-signature-256': 'sha256=1234567890123456789012345678901234567890123456789012345678901234',
      },
      body: validPayload,
    });
    const res = await webhookPOST(req);
    assert(
      res.status === 500,
      'Test 8: Missing WHATSAPP_APP_SECRET on server returns HTTP 500 error'
    );
    // Restore
    process.env.WHATSAPP_APP_SECRET = TEST_APP_SECRET;
  }

  // Test 9: Safe handling of malformed webhook payloads -> 400 Bad Request
  {
    const malformedBody = 'not_valid_json{{{';
    const signature = generateSignature(malformedBody, TEST_APP_SECRET);
    const req = new NextRequest('http://localhost:3000/api/whatsapp/webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-hub-signature-256': signature,
      },
      body: malformedBody,
    });
    const res = await webhookPOST(req);
    assert(res.status === 400, 'Test 9: Malformed JSON body safely returns HTTP 400 Bad Request');
  }

  // ---------------------------------------------------------------------------
  // 3. Upload-Session API Contract & Failure Tests
  // ---------------------------------------------------------------------------
  console.log('\n--- Suite 3: Upload-Session Integration Contract & Failure Handling ---');

  // Test 10a: POST /api/sessions/upload succeeds with valid secret & body
  {
    const req = new NextRequest('http://localhost:3000/api/sessions/upload', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Secret': TEST_INTERNAL_SECRET,
      },
      body: JSON.stringify({
        phoneNumber: '+919876543210',
        customerName: 'Rohan',
        shopId: 'shop-1',
        expiresInSeconds: 600,
      }),
    });

    const res = await sessionsUploadPOST(req);
    const data = await res.json();

    assert(res.status === 201, 'Test 10a: Upload session created successfully (HTTP 201)');
    assert(typeof data.id === 'string' && data.id.startsWith('pv_sess_'), 'Session ID format is valid');
    assert(typeof data.token === 'string' && data.token.length >= 24, 'Session token is unguessable');
    assert(typeof data.uploadUrl === 'string' && data.uploadUrl.includes('token='), 'Upload URL contains token');
    assert(data.expiresInSeconds === 600, 'Expiry matches requested duration');
  }

  // Test 10b: Upload-session API rejects unauthorized calls without X-Internal-Secret
  {
    const req = new NextRequest('http://localhost:3000/api/sessions/upload', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Secret': 'wrong_secret',
      },
      body: JSON.stringify({ phoneNumber: '+919876543210' }),
    });

    const res = await sessionsUploadPOST(req);
    assert(res.status === 401, 'Test 10b: Upload session API rejects invalid X-Internal-Secret (HTTP 401)');
  }

  // Test 10c: Upload-session API rejects missing phoneNumber
  {
    const req = new NextRequest('http://localhost:3000/api/sessions/upload', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Secret': TEST_INTERNAL_SECRET,
      },
      body: JSON.stringify({ customerName: 'Rohan' }),
    });

    const res = await sessionsUploadPOST(req);
    assert(res.status === 400, 'Test 10c: Upload session API rejects missing phoneNumber (HTTP 400)');
  }

  // Test 10d: Protected outbound send endpoint rejects unauthenticated access
  {
    const req = new NextRequest('http://localhost:3000/api/whatsapp/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to: '+919876543210', message: 'Unauthorized test' }),
    });

    const res = await sendPOST(req);
    assert(res.status === 401, 'Outbound send rejects unauthenticated access (HTTP 401)');
  }

  // Restore original environment
  process.env = originalEnv;

  console.log('\n================================================================');
  console.log(`📊 Test Results: ${testsPassed} Passed, ${testsFailed} Failed`);
  console.log('================================================================');

  if (testsFailed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal test execution error:', err);
  process.exit(1);
});
