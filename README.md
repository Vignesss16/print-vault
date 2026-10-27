# WhatsApp Cloud API Integration Module (M-04: Secure Print Shop)

An independent, modular WhatsApp integration component designed for **M-04: The "Print Shop" Data Leak**.

This module allows print shop customers to initiate conversations on WhatsApp and receive a secure, expiring document-upload link, preventing customers from transmitting sensitive documents (Aadhaar cards, PAN cards, bank statements, salary slips) directly through WhatsApp chat.

---

## 1. Architectural Highlights & Privacy Guarantees

1. **Zero-Attachment Data Leak Prevention**:
   - Direct media files (images, PDFs, documents) received in chat are **never downloaded, stored, or processed**.
   - Instead, the customer receives an immediate privacy alert explaining why direct chat uploads are unsafe, along with a link to the main application's encrypted upload portal.
2. **Official Meta WhatsApp Business Cloud API**:
   - Supports configurable Graph API version (defaults to `v22.0`).
   - Server-only execution ensures API keys and secrets never reach client-side bundles.
3. **Cryptographic Webhook Verification**:
   - Validates Meta's `X-Hub-Signature-256` HMAC-SHA256 signature against the raw body using constant-time comparison (`crypto.timingSafeEqual`) to prevent timing attacks.
4. **Idempotent Webhook Processing**:
   - De-duplicates repeated webhook deliveries (`wamid.*`) to protect against duplicate messages during network retries.
5. **Decoupled Main Application Contract (Adapter Pattern)**:
   - Does not assume any database, ORM, or cloud storage.
   - Main project simply implements the `PrintShopAdapter` interface and registers it via `setPrintShopAdapter()`.
   - Includes an in-memory `MockPrintShopAdapter` for local development and standalone testing.
6. **Abuse Protection & Rate Limiting**:
   - In-memory sliding-window rate limiter per phone number and globally.
   - Phone number sanitization and E.164 normalization.
   - PII masking in server logs (e.g. `919****210`).
   - Protected outbound endpoint (`POST /api/whatsapp/send`) requiring internal API token authorization.

---

## 2. File & Directory Structure

```text
├── app/
│   └── api/
│       └── whatsapp/
│           ├── webhook/
│           │   └── route.ts         # GET (Meta challenge) & POST (Webhook events)
│           └── send/
│               └── route.ts         # POST (Protected outbound messaging endpoint)
├── lib/
│   └── whatsapp/
│       ├── types.ts                 # TypeScript types & PrintShopAdapter interface
│       ├── verify-signature.ts      # HMAC-SHA256 constant-time signature validator
│       ├── client.ts                # WhatsApp Cloud API client, rate limiting & mock mode
│       ├── templates.ts             # Privacy-focused WhatsApp message templates
│       ├── adapters.ts              # Adapter interface & MockPrintShopAdapter
│       ├── message-handler.ts       # Webhook orchestrator, deduplication & routing
│       └── index.ts                 # Unified public module export
├── scripts/
│   └── simulate-whatsapp.ts         # Interactive CLI simulator for testing workflows
├── tests/
│   ├── verify-signature.test.ts     # HMAC validation & tampering tests
│   ├── templates.test.ts            # Privacy message template tests
│   ├── client.test.ts               # Cloud API client, mock mode & rate limit tests
│   ├── message-handler.test.ts      # Message handling & direct attachment rejection tests
│   ├── adapters.test.ts             # Adapter interface & mock adapter tests
│   ├── webhook-route.test.ts        # GET challenge & POST webhook route tests
│   └── send-route.test.ts           # Protected outbound send endpoint tests
├── .env.example                     # Environment variable template
├── tsconfig.json                    # TypeScript configuration with @/* path aliases
├── vitest.config.ts                 # Vitest test runner configuration
└── package.json                     # Module scripts and dependencies
```

---

## 3. Environment Configuration

Copy `.env.example` to `.env` when deploying:

```bash
cp .env.example .env
```

| Variable | Description |
|---|---|
| `WHATSAPP_ACCESS_TOKEN` | Meta System User / Permanent Access Token with `whatsapp_business_messaging` permissions. |
| `WHATSAPP_PHONE_NUMBER_ID` | WhatsApp Business Phone Number ID from Meta Developer Portal. |
| `WHATSAPP_APP_SECRET` | Meta App Secret from App Settings > Basic (used to verify HMAC signatures). |
| `WHATSAPP_VERIFY_TOKEN` | Custom verification token you define in Meta Webhooks settings. |
| `WHATSAPP_GRAPH_API_VERSION` | Graph API version (default: `v22.0`). |
| `WHATSAPP_WEBHOOK_PUBLIC_URL` | Public callback URL (e.g., `https://your-domain.com/api/whatsapp/webhook`). |
| `SECURE_UPLOAD_BASE_URL` | Web URL of the main application's secure upload page. |
| `WHATSAPP_INTERNAL_API_KEY` | Secret token to authenticate internal service calls to `/api/whatsapp/send`. |
| `WHATSAPP_MOCK_MODE` | Set to `true` to run simulations locally without sending real WhatsApp messages. |

---

## 4. Testing & Local Simulation

### Run Unit Tests
The test suite covers signature validation, challenge negotiation, text greetings, direct attachment rejection, deduplication, and rate limiting:

```bash
npm test
```

### Run the Interactive Scenario Simulator
Simulate customer interactions (text greetings, PDF attachment rejection, and retry deduplication) without needing any Meta account:

```bash
npm run simulate
```

---

## 5. Endpoints Specification

### A. `GET /api/whatsapp/webhook`
- **Purpose**: Meta Developer Console Webhook verification challenge.
- **Parameters**: `hub.mode`, `hub.verify_token`, `hub.challenge`.
- **Response**: `200 OK` with `hub.challenge` plain text upon token match, or `403 Forbidden` if mismatched.

### B. `POST /api/whatsapp/webhook`
- **Purpose**: Receives incoming customer messages, media, and statuses.
- **Headers**: `x-hub-signature-256: sha256=<hex_digest>`
- **Behavior**:
  - Validates HMAC signature against raw request body.
  - De-duplicates events using `isWebhookEventProcessed(message.id)`.
  - For text: invokes `adapter.createUploadSession()`, returns secure upload link.
  - For files/images: rejects attachment directly, replies with privacy warning + upload link.
  - Acknowledges delivery receipts (`sent`, `delivered`, `read`).
- **Response**: `200 OK` with JSON execution summary.

### C. `POST /api/whatsapp/send`
- **Purpose**: Protected endpoint for the main application to send status updates (e.g. "Print Ready").
- **Headers**: `Authorization: Bearer <WHATSAPP_INTERNAL_API_KEY>` or `x-api-key: <WHATSAPP_INTERNAL_API_KEY>`
- **Request Body**:
  ```json
  {
    "to": "+919876543210",
    "message": "🖨️ Your print job is ready for pickup! Pickup code: SECURE-99."
  }
  ```
- **Response**: `200 OK` with `{ "success": true, "messageId": "..." }`.

---

## 6. Manual Meta Developer Console Setup (For Real WhatsApp Numbers)

1. **Create / Open Meta Developer App**:
   - Go to [developers.facebook.com](https://developers.facebook.com).
   - Create an app of type **Business**.
   - Add the **WhatsApp** product.
2. **API Setup & Test Number**:
   - In the left sidebar, navigate to **WhatsApp > API Setup**.
   - Note down the **Phone number ID** and **Temporary Access Token** (or create a System User for permanent token).
3. **Configure Webhook**:
   - In the left sidebar, navigate to **WhatsApp > Configuration**.
   - Click **Edit** next to Webhook Callback URL:
     - **Callback URL**: `https://your-domain.com/api/whatsapp/webhook` (use [ngrok](https://ngrok.com) for local testing: `https://<subdomain>.ngrok-free.app/api/whatsapp/webhook`).
     - **Verify Token**: Enter the exact string configured in your `WHATSAPP_VERIFY_TOKEN` env variable.
     - Click **Verify and save**.
   - Under **Webhook fields**, click **Manage** and subscribe to **`messages`**.
4. **Retrieve App Secret**:
   - Go to **App Settings > Basic**.
   - Click **Show** next to **App Secret** and paste it into `WHATSAPP_APP_SECRET`.

---

## 7. Integration Guide for Merging with the Main Application

When your teammate merges this module into the main Next.js project:

### Step 1: Copy Files
Copy the following folders into their Next.js project:
- `lib/whatsapp/`
- `app/api/whatsapp/`

### Step 2: Implement the `PrintShopAdapter`
Your teammate's backend manages database sessions and signed URLs. They only need to provide an adapter implementing `PrintShopAdapter`:

```typescript
// main-app/lib/whatsapp-adapter.ts
import { PrintShopAdapter, UploadSessionResult, setPrintShopAdapter } from '@/lib/whatsapp';
import { prisma } from '@/lib/prisma'; // or Supabase, MongoDB, etc.
import crypto from 'crypto';

export class DatabasePrintShopAdapter implements PrintShopAdapter {
  async createUploadSession(customerPhone: string): Promise<UploadSessionResult> {
    const sessionToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15-minute expiry

    // Save session in main application database
    const session = await prisma.uploadSession.create({
      data: {
        customerPhone,
        token: sessionToken,
        expiresAt,
        status: 'PENDING_UPLOAD',
      },
    });

    const uploadUrl = `${process.env.NEXT_PUBLIC_APP_URL}/upload/${session.id}?token=${sessionToken}`;

    return {
      sessionId: session.id,
      uploadUrl,
      expiresAt,
    };
  }

  getUploadInstructions(sessionId?: string): string {
    return 'Upload your document securely. Select your print parameters and submit.';
  }

  async isWebhookEventProcessed(eventId: string): Promise<boolean> {
    const existing = await prisma.webhookEvent.findUnique({
      where: { eventId },
    });
    return !!existing;
  }

  async markNotificationSent(eventId: string, messageId: string): Promise<void> {
    await prisma.webhookEvent.create({
      data: {
        eventId,
        outboundMessageId: messageId,
        processedAt: new Date(),
      },
    });
  }
}

// Register the adapter once during server initialization or in an instrumentation hook
setPrintShopAdapter(new DatabasePrintShopAdapter());
```

### Step 3: Triggering Outbound Notifications from Main App
When the customer finishes printing or the print job is completed in the dashboard, the main app can call `POST /api/whatsapp/send`:

```typescript
import { defaultWhatsAppClient, getPrintReadyMessage } from '@/lib/whatsapp';

// Inside your main project's print completion handler:
const message = getPrintReadyMessage({
  jobId: 'JOB-402',
  pickupCode: 'CLAIM-8821',
  shopName: 'FastPrint Central',
});

await defaultWhatsAppClient.sendTextMessage(customerPhone, message);
```
