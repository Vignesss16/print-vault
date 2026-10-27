import { describe, it, expect } from 'vitest';
import crypto from 'crypto';
import { verifyMetaSignature } from '@/lib/whatsapp/verify-signature';

describe('WhatsApp Webhook Signature Verification (X-Hub-Signature-256)', () => {
  const secret = 'super_secret_app_key_12345';
  const body = JSON.stringify({ object: 'whatsapp_business_account', entry: [] });

  function generateSignature(payload: string, appSecret: string): string {
    const hmac = crypto.createHmac('sha256', appSecret);
    hmac.update(payload);
    return `sha256=${hmac.digest('hex')}`;
  }

  it('successfully verifies a valid signature', () => {
    const signature = generateSignature(body, secret);
    const result = verifyMetaSignature(body, signature, secret);

    expect(result.valid).toBe(true);
    expect(result.reason).toBeUndefined();
  });

  it('rejects when signature does not match (tampered body)', () => {
    const signature = generateSignature(body, secret);
    const tamperedBody = body + ' ';
    const result = verifyMetaSignature(tamperedBody, signature, secret);

    expect(result.valid).toBe(false);
    expect(result.reason).toContain('Signature verification failed');
  });

  it('rejects when signature does not match (wrong secret)', () => {
    const signature = generateSignature(body, 'wrong_secret');
    const result = verifyMetaSignature(body, signature, secret);

    expect(result.valid).toBe(false);
    expect(result.reason).toContain('Signature verification failed');
  });

  it('rejects when signature header is missing or empty', () => {
    expect(verifyMetaSignature(body, null, secret).valid).toBe(false);
    expect(verifyMetaSignature(body, '', secret).valid).toBe(false);
    expect(verifyMetaSignature(body, undefined, secret).valid).toBe(false);
  });

  it('rejects when app secret is missing or empty', () => {
    const signature = generateSignature(body, secret);
    expect(verifyMetaSignature(body, signature, '').valid).toBe(false);
    expect(verifyMetaSignature(body, signature, undefined).valid).toBe(false);
  });

  it('rejects malformed signature prefix', () => {
    const signature = 'sha1=abcdef1234567890';
    const result = verifyMetaSignature(body, signature, secret);

    expect(result.valid).toBe(false);
    expect(result.reason).toContain('Expected sha256=<hex_digest>');
  });

  it('rejects invalid signature length', () => {
    const signature = 'sha256=1234abcd';
    const result = verifyMetaSignature(body, signature, secret);

    expect(result.valid).toBe(false);
    expect(result.reason).toContain('Expected 64 hex characters');
  });
});
