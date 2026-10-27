import { describe, it, expect } from 'vitest';
import {
  getUploadInvitationMessage,
  getDirectAttachmentWarningMessage,
  getDocumentReceivedMessage,
  getPrintReadyMessage,
  getSessionExpiredMessage,
} from '@/lib/whatsapp/templates';

describe('WhatsApp Message Templates (M-04 Privacy Rules)', () => {
  it('formats upload invitation message with explicit privacy warning', () => {
    const url = 'https://secure-printshop.example.com/upload?session=test-123';
    const message = getUploadInvitationMessage({ uploadUrl: url, expiryMinutes: 15 });

    expect(message).toContain(url);
    expect(message).toContain('Please do NOT send Aadhaar cards, PAN cards, bank statements');
    expect(message).toContain('expires in 15 minutes');
  });

  it('formats direct attachment warning message instructing user not to send documents on chat', () => {
    const url = 'https://secure-printshop.example.com/upload?session=test-456';
    const message = getDirectAttachmentWarningMessage({ uploadUrl: url });

    expect(message).toContain(url);
    expect(message).toContain('cannot accept documents, IDs, or photos directly in WhatsApp chat');
    expect(message).toContain('Aadhaar, PAN, or financial records');
  });

  it('formats document received confirmation message', () => {
    const message = getDocumentReceivedMessage({ jobId: 'JOB-9988', pageCount: 4 });

    expect(message).toContain('JOB-9988');
    expect(message).toContain('4 pages');
  });

  it('formats print ready pickup message with claim code', () => {
    const message = getPrintReadyMessage({
      jobId: 'JOB-9988',
      pickupCode: 'SECURE-77',
      shopName: 'Metro Print Hub',
    });

    expect(message).toContain('JOB-9988');
    expect(message).toContain('SECURE-77');
    expect(message).toContain('Metro Print Hub');
  });

  it('formats session expired message', () => {
    const message = getSessionExpiredMessage({
      newUploadUrl: 'https://secure-printshop.example.com/upload?session=new-1',
    });

    expect(message).toContain('Upload Session Expired');
    expect(message).toContain('new-1');
  });
});
