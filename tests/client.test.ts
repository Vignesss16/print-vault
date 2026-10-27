import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  WhatsAppClient,
  normalizePhoneNumber,
  maskPhoneNumber,
  resetRateLimits,
  clearMockSentMessages,
  mockSentMessages,
} from '@/lib/whatsapp/client';

describe('WhatsAppClient & Phone Utilities', () => {
  beforeEach(() => {
    resetRateLimits();
    clearMockSentMessages();
  });

  describe('Phone Number Normalization & Masking', () => {
    it('normalizes formatted phone numbers into E.164 digits', () => {
      expect(normalizePhoneNumber('+91 98765-43210')).toEqual({
        normalized: '919876543210',
        valid: true,
      });

      expect(normalizePhoneNumber('(555) 123-4567')).toEqual({
        normalized: '5551234567',
        valid: true,
      });
    });

    it('rejects invalid or too short phone numbers', () => {
      const result = normalizePhoneNumber('12345');
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('Invalid phone number length');
    });

    it('masks phone numbers to protect customer PII in logs', () => {
      expect(maskPhoneNumber('919876543210')).toBe('919****210');
      expect(maskPhoneNumber('')).toBe('******');
    });
  });

  describe('Mock Mode Outbound Messaging', () => {
    it('simulates outbound WhatsApp message sending without real credentials', async () => {
      const client = new WhatsAppClient({ mockMode: true });
      const result = await client.sendTextMessage('+91 98765 43210', 'Hello from test');

      expect(result.success).toBe(true);
      expect(result.mock).toBe(true);
      expect(result.messageId).toContain('mock_wamid_');

      expect(mockSentMessages).toHaveLength(1);
      expect(mockSentMessages[0].to).toBe('919876543210');
      expect(mockSentMessages[0].body).toBe('Hello from test');
    });

    it('rejects sending empty message text', async () => {
      const client = new WhatsAppClient({ mockMode: true });
      await expect(client.sendTextMessage('919876543210', '')).rejects.toThrow(
        'message body cannot be empty'
      );
    });

    it('enforces rate limits per recipient to prevent spam/abuse', async () => {
      const client = new WhatsAppClient({ mockMode: true });
      const phone = '919876543210';

      // Send 10 messages (the max limit per minute)
      for (let i = 0; i < 10; i++) {
        await client.sendTextMessage(phone, `Msg ${i}`);
      }

      // The 11th should be blocked by rate limiting
      await expect(client.sendTextMessage(phone, 'Msg 11')).rejects.toThrow(
        /rate limit/i
      );
    });
  });

  describe('Live Meta Cloud API Mode & Error Handling', () => {
    it('fails when credentials are missing in live mode', async () => {
      const client = new WhatsAppClient({
        mockMode: false,
        accessToken: '',
        phoneNumberId: '',
      });

      await expect(
        client.sendTextMessage('919876543210', 'Test message')
      ).rejects.toThrow('Missing WHATSAPP_ACCESS_TOKEN or WHATSAPP_PHONE_NUMBER_ID');
    });

    it('properly handles Meta API 4xx/5xx error responses without leaking sensitive tokens', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: async () => ({
          error: {
            message: 'Template name does not exist',
            type: 'OAuthException',
            code: 100,
          },
        }),
      });

      global.fetch = mockFetch;

      const client = new WhatsAppClient({
        mockMode: false,
        accessToken: 'EAAB_test_token_should_never_be_logged',
        phoneNumberId: '1234567890123',
        graphApiVersion: 'v22.0',
      });

      await expect(
        client.sendTextMessage('919876543210', 'Test message')
      ).rejects.toThrow('Meta WhatsApp Cloud API error: Template name does not exist (code: 100)');

      // Verify fetch was called with right URL and headers
      expect(mockFetch).toHaveBeenCalledWith(
        'https://graph.facebook.com/v22.0/1234567890123/messages',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            Authorization: 'Bearer EAAB_test_token_should_never_be_logged',
          }),
        })
      );
    });
  });
});
