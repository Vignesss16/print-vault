import crypto from 'crypto';
import { VerifySignatureResult } from './types';

/**
 * Validates the Meta WhatsApp X-Hub-Signature-256 header against the raw request body.
 *
 * Meta signs every incoming webhook POST using HMAC-SHA256 with your App Secret.
 * Header format: `sha256=<hex_digest>`
 *
 * @param rawBody The unparsed, exact string or Buffer of the incoming request body
 * @param signatureHeader The value of the `x-hub-signature-256` HTTP header
 * @param appSecret The Meta App Secret (from environment variable WHATSAPP_APP_SECRET)
 */
export function verifyMetaSignature(
  rawBody: string | Buffer,
  signatureHeader: string | null | undefined,
  appSecret: string | undefined = process.env.WHATSAPP_APP_SECRET
): VerifySignatureResult {
  if (!appSecret || appSecret.trim() === '') {
    return {
      valid: false,
      reason: 'Missing server configuration: WHATSAPP_APP_SECRET is not set.',
    };
  }

  if (!signatureHeader || signatureHeader.trim() === '') {
    return {
      valid: false,
      reason: 'Missing x-hub-signature-256 header in request.',
    };
  }

  // Meta header must start with "sha256="
  const prefix = 'sha256=';
  if (!signatureHeader.startsWith(prefix)) {
    return {
      valid: false,
      reason: 'Invalid signature format. Expected sha256=<hex_digest>.',
    };
  }

  const expectedSignatureHex = signatureHeader.substring(prefix.length).trim();
  if (expectedSignatureHex.length !== 64) {
    return {
      valid: false,
      reason: 'Invalid signature length. Expected 64 hex characters for SHA-256.',
    };
  }

  try {
    const hmac = crypto.createHmac('sha256', appSecret);
    hmac.update(rawBody);
    const calculatedSignatureHex = hmac.digest('hex');

    const expectedBuffer = Buffer.from(expectedSignatureHex, 'hex');
    const calculatedBuffer = Buffer.from(calculatedSignatureHex, 'hex');

    if (expectedBuffer.length !== calculatedBuffer.length) {
      return {
        valid: false,
        reason: 'Signature buffer length mismatch.',
      };
    }

    // Use constant-time comparison to prevent timing attacks
    const isValid = crypto.timingSafeEqual(expectedBuffer, calculatedBuffer);

    return {
      valid: isValid,
      reason: isValid ? undefined : 'Signature verification failed (hash mismatch).',
    };
  } catch (error) {
    return {
      valid: false,
      reason: `Signature calculation error: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}
