import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { verifyMetaSignature } from '@/lib/whatsapp/verify-signature';
import { processWhatsAppWebhook } from '@/lib/whatsapp/message-handler';
import { WhatsAppWebhookPayload } from '@/lib/whatsapp/types';

/**
 * Timing-safe string comparison to prevent timing attacks when comparing verification tokens.
 */
function timingSafeTokenCompare(provided: string, expected: string): boolean {
  if (!provided || !expected) return false;
  try {
    const bufProvided = Buffer.from(provided);
    const bufExpected = Buffer.from(expected);
    if (bufProvided.length !== bufExpected.length) {
      return false;
    }
    return crypto.timingSafeEqual(bufProvided, bufExpected);
  } catch {
    return false;
  }
}

/**
 * GET /api/whatsapp/webhook
 *
 * Meta Webhook Verification Endpoint.
 * Meta calls this when configuring the webhook in the Developer Portal.
 *
 * Query parameters:
 * - hub.mode: Must be "subscribe"
 * - hub.verify_token: Must match WHATSAPP_VERIFY_TOKEN
 * - hub.challenge: Plaintext string to echo back with HTTP 200
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  const configuredVerifyToken = process.env.WHATSAPP_VERIFY_TOKEN;

  // 1. Missing server configuration check: Never accept any token if not configured
  if (!configuredVerifyToken || configuredVerifyToken.trim() === '') {
    return NextResponse.json(
      { error: 'Server configuration error: WHATSAPP_VERIFY_TOKEN is not configured on the server.' },
      { status: 500 }
    );
  }

  // 2. Accept verification ONLY when hub.mode === "subscribe"
  if (mode !== 'subscribe') {
    return NextResponse.json(
      { error: 'Forbidden: Invalid verification mode. Expected hub.mode=subscribe.' },
      { status: 403 }
    );
  }

  // 3. Compare supplied token securely against configured token
  if (!token || !timingSafeTokenCompare(token, configuredVerifyToken)) {
    return NextResponse.json(
      { error: 'Forbidden: Invalid verification token.' },
      { status: 403 }
    );
  }

  // 4. Missing challenge check
  if (!challenge) {
    return NextResponse.json(
      { error: 'Bad Request: Missing hub.challenge parameter.' },
      { status: 400 }
    );
  }

  // 5. Return the challenge as plain text with HTTP 200
  return new Response(challenge, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
    },
  });
}

/**
 * POST /api/whatsapp/webhook
 *
 * Receives incoming WhatsApp webhook events from Meta (messages, media, statuses).
 * Validates X-Hub-Signature-256 HMAC-SHA256 signature against raw request body before parsing.
 */
export async function POST(request: NextRequest) {
  const signatureHeader = request.headers.get('x-hub-signature-256');

  // 1. Read raw body text before any parsing
  let rawBody: string;
  try {
    rawBody = await request.text();
  } catch {
    return NextResponse.json({ error: 'Failed to read request body.' }, { status: 400 });
  }

  const isMockMode = process.env.WHATSAPP_MOCK_MODE === 'true';

  // 2. Verify signature using Meta App Secret
  if (!isMockMode) {
    const appSecret = process.env.WHATSAPP_APP_SECRET;
    if (!appSecret || appSecret.trim() === '') {
      return NextResponse.json(
        { error: 'Server configuration error: WHATSAPP_APP_SECRET is not configured on the server.' },
        { status: 500 }
      );
    }

    const signatureVerification = verifyMetaSignature(
      rawBody,
      signatureHeader,
      appSecret
    );

    if (!signatureVerification.valid) {
      return NextResponse.json(
        { error: 'Unauthorized: Invalid webhook signature.', details: signatureVerification.reason },
        { status: 401 }
      );
    }
  }

  // 3. Parse JSON body safely
  let payload: WhatsAppWebhookPayload;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'Malformed JSON payload.' }, { status: 400 });
  }

  // 4. Process event idempotently
  try {
    const results = await processWhatsAppWebhook(payload);
    return NextResponse.json({ status: 'ok', results }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown processing error';
    return NextResponse.json({ status: 'error', error: message }, { status: 200 });
  }
}
