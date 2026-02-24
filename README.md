# Lead Management (WhatsApp Ads)

This project captures WhatsApp inbound leads from Facebook/Instagram click-to-chat ads, stores them in MySQL, and lets sales executives update lead status after calling.

## Flow

1. User clicks ad and sends message on WhatsApp.
2. Meta sends webhook event to `/api/whatsapp/webhook`.
3. Backend extracts phone + message, upserts into MySQL `leads` table.
4. Sales team opens React dashboard, updates status/notes/assignee/follow-up.

## Backend setup (`server`)

1. Copy `.env.example` to `.env` and set MySQL + Meta values.
2. Install dependencies:
   - `npm install`
3. Run:
   - `npm run dev`

Server URL: `http://localhost:5000`

### Meta webhook endpoints

- Verification (GET): `http://<your-domain>/api/whatsapp/webhook`
- Events (POST): `http://<your-domain>/api/whatsapp/webhook`

`META_VERIFY_TOKEN` in `.env` must match the token configured in Meta App webhook settings.

## Frontend setup (`client`)

1. Copy `.env.example` to `.env`.
2. Install dependencies:
   - `npm install`
3. Run:
   - `npm run dev`

Client URL: `http://localhost:5173`

## API summary

- `GET /api/leads` list leads (`status`, `search`, `assignedTo`, `limit` query params)
- `POST /api/leads` create manual/test lead
- `PATCH /api/leads/:id` update name, status, assignedTo, notes, followUpAt, lastCallOutcome, markCalled
- `GET /api/whatsapp/webhook` Meta verification callback
- `POST /api/whatsapp/webhook` inbound WhatsApp event receiver

## Test webhook payload (sample)

```json
{
  "object": "whatsapp_business_account",
  "entry": [
    {
      "changes": [
        {
          "value": {
            "contacts": [
              {
                "wa_id": "919999999999",
                "profile": { "name": "Ravi" }
              }
            ],
            "messages": [
              {
                "from": "919999999999",
                "timestamp": "1700000000",
                "text": { "body": "Hi" },
                "type": "text"
              }
            ]
          }
        }
      ]
    }
  ]
}
```
