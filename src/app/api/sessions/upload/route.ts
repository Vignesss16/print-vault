import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { mockShops } from '@/data/mockData';
import { registerUploadSession } from '@/lib/whatsapp/adapters';

/**
 * POST /api/sessions/upload
 *
 * Service contract for creating secure, expiring, access-controlled upload sessions.
 *
 * Headers:
 *   X-Internal-Secret: <PRINTVAULT_INTERNAL_SECRET>
 *
 * Body:
 *   {
 *     "phoneNumber": "+1234567890",
 *     "customerName": "Rohan",     // optional
 *     "shopId": "shop-1",          // optional
 *     "expiresInSeconds": 600      // optional, defaults to 600 (10 mins)
 *   }
 *
 * Response:
 *   {
 *     "id": "pv_sess_...",
 *     "token": "...",
 *     "uploadUrl": "https://.../upload?session=...&token=...&phone=...",
 *     "shop": { ... },
 *     "expiresAt": "2026-10-27T...",
 *     "expiresInSeconds": 600
 *   }
 */
export async function POST(request: NextRequest) {
  // 1. Authenticate via X-Internal-Secret or Bearer token
  const configuredSecret =
    process.env.PRINTVAULT_INTERNAL_SECRET || process.env.WHATSAPP_INTERNAL_API_KEY;

  const internalSecretHeader = request.headers.get('x-internal-secret');
  const authHeader = request.headers.get('authorization');
  const apiKeyHeader = request.headers.get('x-api-key');

  let providedSecret: string | null = null;
  if (internalSecretHeader) {
    providedSecret = internalSecretHeader.trim();
  } else if (authHeader?.startsWith('Bearer ')) {
    providedSecret = authHeader.substring(7).trim();
  } else if (apiKeyHeader) {
    providedSecret = apiKeyHeader.trim();
  }

  if (configuredSecret) {
    if (!providedSecret || providedSecret !== configuredSecret) {
      return NextResponse.json(
        { error: 'Unauthorized: Invalid or missing X-Internal-Secret header.' },
        { status: 401 }
      );
    }
  }

  // 2. Validate request body
  let body: {
    phoneNumber?: string;
    customerName?: string;
    shopId?: string;
    expiresInSeconds?: number;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON request body.' }, { status: 400 });
  }

  const { phoneNumber, customerName, shopId, expiresInSeconds = 600 } = body;

  if (!phoneNumber || typeof phoneNumber !== 'string' || phoneNumber.trim() === '') {
    return NextResponse.json(
      { error: 'Validation error: "phoneNumber" is required.' },
      { status: 400 }
    );
  }

  // 3. Generate secure session identifier & unguessable token
  const sessionId = `pv_sess_${crypto.randomUUID()}`;
  const token = crypto.randomBytes(24).toString('base64url');
  const duration =
    typeof expiresInSeconds === 'number' && expiresInSeconds > 0 ? expiresInSeconds : 600;
  const expiresAt = new Date(Date.now() + duration * 1000);

  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.PRINTVAULT_API_BASE_URL ||
    'https://print-vault-livid.vercel.app';

  const cleanBase = baseUrl.replace(/\/$/, '');
  const uploadUrl = `${cleanBase}/upload?session=${sessionId}&token=${token}&phone=${encodeURIComponent(phoneNumber)}`;

  const shop = mockShops.find((s) => s.id === shopId) || mockShops[0];

  // 4. Save session record into active sessions registry
  registerUploadSession({
    sessionId,
    customerPhone: phoneNumber,
    token,
    uploadUrl,
    expiresAt,
    status: 'PENDING_UPLOAD',
  });

  return NextResponse.json(
    {
      id: sessionId,
      token,
      uploadUrl,
      shop: {
        id: shop.id,
        name: shop.name,
        location: shop.location,
        distance: shop.distance,
        rating: shop.rating,
      },
      expiresAt: expiresAt.toISOString(),
      expiresInSeconds: duration,
      ...(customerName ? { customerName } : {}),
    },
    { status: 201 }
  );
}
