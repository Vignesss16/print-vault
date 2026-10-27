import { NextRequest, NextResponse } from 'next/server';
import { defaultWhatsAppClient } from '@/lib/whatsapp/client';

/**
 * POST /api/whatsapp/send
 *
 * Protected endpoint for PrintVault services to send outbound WhatsApp messages
 * (e.g. "Document Received" or "Print Ready").
 */
export async function POST(request: NextRequest) {
  const internalApiKey =
    process.env.PRINTVAULT_INTERNAL_SECRET || process.env.WHATSAPP_INTERNAL_API_KEY;
  const isMockMode = process.env.WHATSAPP_MOCK_MODE === 'true';

  if (!isMockMode && !internalApiKey) {
    return NextResponse.json(
      { error: 'Server misconfiguration: PRINTVAULT_INTERNAL_SECRET is not configured.' },
      { status: 500 }
    );
  }

  if (internalApiKey) {
    const authHeader = request.headers.get('authorization');
    const apiKeyHeader = request.headers.get('x-api-key');

    let providedToken: string | null = null;
    if (authHeader?.startsWith('Bearer ')) {
      providedToken = authHeader.substring(7).trim();
    } else if (apiKeyHeader) {
      providedToken = apiKeyHeader.trim();
    }

    if (!providedToken || providedToken !== internalApiKey) {
      return NextResponse.json(
        { error: 'Unauthorized: Valid API key or Bearer token is required.' },
        { status: 401 }
      );
    }
  }

  let body: { to?: string; message?: string; previewUrl?: boolean };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON request body.' }, { status: 400 });
  }

  const { to, message, previewUrl = false } = body;

  if (!to || typeof to !== 'string' || to.trim() === '') {
    return NextResponse.json(
      { error: 'Validation error: "to" phone number is required.' },
      { status: 400 }
    );
  }

  if (!message || typeof message !== 'string' || message.trim() === '') {
    return NextResponse.json(
      { error: 'Validation error: "message" text is required.' },
      { status: 400 }
    );
  }

  try {
    const result = await defaultWhatsAppClient.sendTextMessage(to, message, previewUrl);
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';

    if (errorMsg.includes('Rate limit')) {
      return NextResponse.json({ error: errorMsg }, { status: 429 });
    }

    return NextResponse.json({ error: errorMsg }, { status: 502 });
  }
}
