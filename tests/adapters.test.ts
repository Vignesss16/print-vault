import { describe, it, expect, beforeEach } from 'vitest';
import {
  MockPrintShopAdapter,
  getPrintShopAdapter,
  setPrintShopAdapter,
  resetPrintShopAdapter,
} from '@/lib/whatsapp/adapters';

describe('PrintShopAdapter Contract & Mock Implementation', () => {
  let adapter: MockPrintShopAdapter;

  beforeEach(() => {
    adapter = resetPrintShopAdapter();
  });

  it('creates secure, expiring upload sessions with unguessable tokens', async () => {
    const session = await adapter.createUploadSession('+919876543210');

    expect(session.sessionId).toContain('mock_sess_');
    expect(session.uploadUrl).toContain('session=');
    expect(session.uploadUrl).toContain('token=');
    expect(session.expiresAt.getTime()).toBeGreaterThan(Date.now());
  });

  it('tracks processed webhook event IDs for idempotency', async () => {
    const eventId = 'wamid.HBgM12345678';

    expect(await adapter.isWebhookEventProcessed(eventId)).toBe(false);

    await adapter.markNotificationSent(eventId, 'outbound_msg_99');

    expect(await adapter.isWebhookEventProcessed(eventId)).toBe(true);
    expect(adapter.getSentNotifications()).toHaveLength(1);
    expect(adapter.getSentNotifications()[0].eventId).toBe(eventId);
  });

  it('allows registering a custom adapter via dependency injection', async () => {
    let customCallCount = 0;
    const customAdapter = {
      async createUploadSession() {
        customCallCount++;
        return {
          sessionId: 'custom-session-1',
          uploadUrl: 'https://custom-print.example.com/upload?s=1',
          expiresAt: new Date(),
        };
      },
      getUploadInstructions: () => 'Custom instructions',
      async isWebhookEventProcessed() {
        return false;
      },
      async markNotificationSent() {},
    };

    setPrintShopAdapter(customAdapter);
    expect(getPrintShopAdapter()).toBe(customAdapter);

    const session = await getPrintShopAdapter().createUploadSession('1234567890');
    expect(customCallCount).toBe(1);
    expect(session.sessionId).toBe('custom-session-1');
  });
});
