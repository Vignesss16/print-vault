import { NextRequest, NextResponse } from 'next/server';
import { verifyMetaSignature } from '@/lib/whatsapp/verify-signature';
import { processWhatsAppWebhook } from '@/lib/whatsapp/message-handler';
import { WhatsAppWebhookPayload } from '@/lib/whatsapp/types';

/**
 * GET /api/whatsapp/webhook
 *
 * Webhook Verification Endpoint required by Meta:
 * Meta sends a GET request with query parameters:
 * - hub.mode: 'subscribe'
 * - hub.verify_token: token configured in the Meta App Dashboard
 * - hub.challenge: integer or string challenge to echo back
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  const configuredVerifyToken = process.env.WHATSAPP_VERIFY_TOKEN;

  // Validation
  if (mode === 'subscribe' && token && configuredVerifyToken && token === configuredVerifyToken) {
    // Challenge must be returned with HTTP 200 plain text
    return new NextResponse(challenge, {
      status: 200,
      headers: { 'Content-Type': 'text/plain' },
    });
  }

  // Token mismatch or invalid mode
  return NextResponse.json(
    { error: 'Forbidden: Invalid verification token or mode.' },
    { status: 403 }
  );
}

/**
 * POST /api/whatsapp/webhook
 *
 * Receives incoming WhatsApp Cloud API events (messages, statuses).
 * Validates X-Hub-Signature-256 to ensure authenticity, deduplicates events,
 * and replies with secure upload session instructions.
 */
export async function POST(request: NextRequest) {
  const signatureHeader = request.headers.get('x-hub-signature-256');

  // Read raw body as text for cryptographic HMAC verification
  let rawBody: string;
  try {
    rawBody = await request.text();
  } catch {
    return NextResponse.json({ error: 'Failed to read request body.' }, { status: 400 });
  }

  // If in mock mode or app secret is not configured, we allow skipping if explicitly declared
  const isMockMode = process.env.WHATSAPP_MOCK_MODE === 'true';

  if (!isMockMode) {
    const signatureVerification = verifyMetaSignature(
      rawBody,
      signatureHeader,
      process.env.WHATSAPP_APP_SECRET
    );

    if (!signatureVerification.valid) {
      return NextResponse.json(
        { error: 'Unauthorized: Invalid webhook signature.', details: signatureVerification.reason },
        { status: 401 }
      );
    }
  }

  // Parse JSON payload
  let payload: WhatsAppWebhookPayload;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'Malformed JSON payload.' }, { status: 400 });
  }

  try {
    const results = await processWhatsAppWebhook(payload);
    return NextResponse.json({ status: 'ok', results }, { status: 200 });
  } catch (error) {
    // Always return HTTP 200 to Meta once payload is received to prevent infinite retry storms,
    // but include error metadata in the response body.
    const message = error instanceof Error ? error.message : 'Unknown processing error';
    return NextResponse.json({ status: 'error', error: message }, { status: 200 });
  }
}
