import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import crypto from 'crypto';
import { GET, POST } from '@/app/api/whatsapp/webhook/route';
import { resetPrintShopAdapter } from '@/lib/whatsapp/adapters';
import { clearMockSentMessages } from '@/lib/whatsapp/client';

describe('Webhook API Route (/api/whatsapp/webhook)', () => {
  const verifyToken = 'test_verify_token_secure_99';
  const appSecret = 'test_meta_app_secret_12345';

  beforeEach(() => {
    process.env.WHATSAPP_VERIFY_TOKEN = verifyToken;
    process.env.WHATSAPP_APP_SECRET = appSecret;
    process.env.WHATSAPP_MOCK_MODE = 'false';
    resetPrintShopAdapter();
    clearMockSentMessages();
  });

  describe('GET (Meta Webhook Challenge Verification)', () => {
    it('returns the challenge when mode and verify token match', async () => {
      const url = `http://localhost:3000/api/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=${verifyToken}&hub.challenge=1158201444`;
      const req = new NextRequest(url);

      const res = await GET(req);
      expect(res.status).toBe(200);
      const text = await res.text();
      expect(text).toBe('1158201444');
    });

    it('returns 403 Forbidden when verify token does not match', async () => {
      const url = `http://localhost:3000/api/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=wrong_token&hub.challenge=1158201444`;
      const req = new NextRequest(url);

      const res = await GET(req);
      expect(res.status).toBe(403);
      const json = await res.json();
      expect(json.error).toContain('Forbidden');
    });

    it('returns 403 Forbidden when hub.mode is not subscribe', async () => {
      const url = `http://localhost:3000/api/whatsapp/webhook?hub.mode=other&hub.verify_token=${verifyToken}&hub.challenge=1158201444`;
      const req = new NextRequest(url);

      const res = await GET(req);
      expect(res.status).toBe(403);
    });

    it('returns 403 Forbidden when server WHATSAPP_VERIFY_TOKEN is missing', async () => {
      delete process.env.WHATSAPP_VERIFY_TOKEN;
      const url = `http://localhost:3000/api/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=${verifyToken}&hub.challenge=1158201444`;
      const req = new NextRequest(url);

      const res = await GET(req);
      expect(res.status).toBe(403);
    });
  });

  describe('POST (Meta Incoming Webhook Events)', () => {
    function signBody(body: string, secret: string): string {
      const hmac = crypto.createHmac('sha256', secret);
      hmac.update(body);
      return `sha256=${hmac.digest('hex')}`;
    }

    const validPayload = JSON.stringify({
      object: 'whatsapp_business_account',
      entry: [
        {
          id: 'WABA_123',
          changes: [
            {
              field: 'messages',
              value: {
                messaging_product: 'whatsapp',
                metadata: {
                  display_phone_number: '12345',
                  phone_number_id: '999',
                },
                messages: [
                  {
                    from: '919876543210',
                    id: 'wamid.HBgM1234',
                    timestamp: '1700000000',
                    type: 'text',
                    text: { body: 'Hello' },
                  },
                ],
              },
            },
          ],
        },
      ],
    });

    it('accepts and processes valid webhook events with valid HMAC signature', async () => {
      const signature = signBody(validPayload, appSecret);

      const req = new NextRequest('http://localhost:3000/api/whatsapp/webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-hub-signature-256': signature,
        },
        body: validPayload,
      });

      const res = await POST(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.status).toBe('ok');
      expect(json.results).toHaveLength(1);
      expect(json.results[0].handled).toBe(true);
    });

    it('rejects POST with 401 Unauthorized when signature is invalid', async () => {
      const wrongSignature = signBody(validPayload, 'tampered_secret_key');

      const req = new NextRequest('http://localhost:3000/api/whatsapp/webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-hub-signature-256': wrongSignature,
        },
        body: validPayload,
      });

      const res = await POST(req);
      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json.error).toContain('Unauthorized');
    });

    it('rejects POST with 401 Unauthorized when signature header is missing', async () => {
      const req = new NextRequest('http://localhost:3000/api/whatsapp/webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: validPayload,
      });

      const res = await POST(req);
      expect(res.status).toBe(401);
    });

    it('rejects POST with 400 Bad Request when JSON is malformed', async () => {
      const malformedBody = '{ not_valid_json ';
      const signature = signBody(malformedBody, appSecret);

      const req = new NextRequest('http://localhost:3000/api/whatsapp/webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-hub-signature-256': signature,
        },
        body: malformedBody,
      });

      const res = await POST(req);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toContain('Malformed JSON payload');
    });
  });
});
