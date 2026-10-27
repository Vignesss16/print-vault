import { describe, it, expect, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/whatsapp/send/route';
import { resetRateLimits, clearMockSentMessages, mockSentMessages } from '@/lib/whatsapp/client';

describe('Outbound Send API Route (/api/whatsapp/send)', () => {
  const internalKey = 'internal_super_secret_jwt_key_99';

  beforeEach(() => {
    process.env.WHATSAPP_INTERNAL_API_KEY = internalKey;
    process.env.WHATSAPP_MOCK_MODE = 'true';
    resetRateLimits();
    clearMockSentMessages();
  });

  it('rejects unauthenticated requests without authorization header or x-api-key', async () => {
    const req = new NextRequest('http://localhost:3000/api/whatsapp/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to: '+919876543210', message: 'Hello' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error).toContain('Unauthorized');
  });

  it('rejects requests with invalid bearer token', async () => {
    const req = new NextRequest('http://localhost:3000/api/whatsapp/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer wrong_key',
      },
      body: JSON.stringify({ to: '+919876543210', message: 'Hello' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('accepts requests with valid Authorization Bearer header', async () => {
    const req = new NextRequest('http://localhost:3000/api/whatsapp/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${internalKey}`,
      },
      body: JSON.stringify({ to: '+919876543210', message: 'Your print job is ready!' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(mockSentMessages).toHaveLength(1);
    expect(mockSentMessages[0].body).toBe('Your print job is ready!');
  });

  it('accepts requests with valid x-api-key header', async () => {
    const req = new NextRequest('http://localhost:3000/api/whatsapp/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': internalKey,
      },
      body: JSON.stringify({ to: '+919876543210', message: 'Document received' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(mockSentMessages).toHaveLength(1);
  });

  it('returns 400 when "to" phone number is missing', async () => {
    const req = new NextRequest('http://localhost:3000/api/whatsapp/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${internalKey}`,
      },
      body: JSON.stringify({ message: 'Missing recipient' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain('"to" phone number is required');
  });

  it('returns 400 when "message" text is missing', async () => {
    const req = new NextRequest('http://localhost:3000/api/whatsapp/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${internalKey}`,
      },
      body: JSON.stringify({ to: '+919876543210' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain('"message" text is required');
  });

  it('returns 500 if WHATSAPP_INTERNAL_API_KEY is not configured in live mode', async () => {
    process.env.WHATSAPP_MOCK_MODE = 'false';
    delete process.env.WHATSAPP_INTERNAL_API_KEY;

    const req = new NextRequest('http://localhost:3000/api/whatsapp/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to: '+919876543210', message: 'Test' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).toContain('Server misconfiguration');
  });
});
