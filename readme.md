# Xeno AI-Native Mini CRM

An AI-native CRM that helps a D2C/retail brand decide **who to talk to**, **what to say**, and **how to reach them**  

The product takes a "classic interface, AI at the key decision points" approach: a marketer can describe an audience in plain English and get a live, editable segment; get AI-drafted message variants for a campaign; and get a plain-English summary of how a campaign performed — all backed by a real two-service, callback-driven delivery simulation.

---

## Live Links

| | URL |
|---|---|
| **Frontend (app)** | https://xeno-ai-crm.netlify.app |
| **CRM Backend API** | https://xeno-crm-backend-f14x.onrender.com |
| **Channel Service** | https://xeno-channel-service-u27s.onrender.com |
| **Repository** | https://github.com/st4377/AI-Native-CRM |
| **Walkthrough Video** | https://drive.google.com/file/d/13Md__pTzOS1YJoKaIqGSM064tjK7y3KS/view?usp=sharing |

> Public demo — no login required. 

This is a **monorepo** — both the "frontend codebase" and "backend codebase" links for the submission form point to the same repository, with the relevant subfolder:
- Backend: https://github.com/st4377/AI-Native-CRM/tree/main/xeno-crm-backend
- Channel service: https://github.com/st4377/AI-Native-CRM/tree/main/xeno-channel-service
- Frontend: https://github.com/st4377/AI-Native-CRM/tree/main/xeno-crm-frontend

---

## Architecture

```
┌───────────────────────────────────┐
│        Frontend (React + Vite)     │
│        Netlify                     │
│                                     │
│  Dashboard · Customers · Segments  │
│  · Campaigns                       │
└──────────────────┬──────────────────┘
                   │ REST (fetch)
┌──────────────────▼──────────────────┐
│        CRM Backend (Express)        │
│        Render                       │
│                                      │
│  /api/customers                     │
│  /api/segments    ──► Groq (AI: NL → rules)
│  /api/campaigns   ──► Groq (AI: drafting, summaries)
│  /api/communications/receipt  ◄──── webhook
└──────────────────┬──────────────────┘
                   │ POST /send (per recipient)
┌──────────────────▼──────────────────┐
│     Channel Service (Express)       │
│     Render — stub provider          │
│                                      │
│  Simulates delivery lifecycle:      │
│  sent → delivered / failed          │
│       → opened → clicked            │
│  Calls back to CRM via /receipt     │
└──────────────────────────────────────┘
                   │
┌──────────────────▼──────────────────┐
│        PostgreSQL (Supabase)        │
│  customers · orders · segments      │
│  campaigns · communication_logs     │
│  + customer_stats (view)            │
└───────────────────────────────────────┘
```

### Why two services?

Real channel providers (Twilio, Gupshup, WhatsApp Business API, etc.) are external systems: your backend calls them to send, and they call you back asynchronously with delivery events. The channel service here is a **separate, independently deployed stub** that mirrors that exact contract — it doesn't deliver anything for real, but it accepts a send request, then asynchronously reports `sent → delivered/failed → opened → clicked` back to the CRM's `/api/communications/receipt` endpoint with randomized, realistic probabilities. This makes the send/callback loop, and how the CRM ingests and aggregates those events, the real centerpiece of the system design — not a detail hidden inside a single app.

---

## AI Touchpoints

| Where | What AI does |
|---|---|
| **Segment Builder** | Marketer describes an audience in plain English (e.g. *"high spenders who haven't ordered in 30 days"*). Groq (`llama-3.3-70b-versatile`) converts this into a structured JSON rules object, which is validated against an allowlist of fields/operators and turned into a parameterized SQL query. The marketer sees a live count + preview of matching customers and can **edit the JSON rules directly** before saving — the AI output is a starting point, not a black box. |
| **Campaign Message Drafting** | Given a segment + channel + campaign goal, Groq drafts **3 message variants** with different angles (urgency / value / warmth), each using a `{{name}}` placeholder for personalization. The marketer picks one, edits freely, and sends. |
| **Campaign Performance Summary** | After a campaign runs and receipts come in, Groq generates a 2-3 sentence plain-English summary of delivery/open/click performance, ending in one concrete, actionable suggestion. |

AI assists the marketer at three concrete decision points — *who to target, what to say, and how it went* — rather than being a separate chatbot bolted onto the side.

---

## Features

- **Data ingestion** — seeded customer/order dataset (50+ customers, 150+ orders) plus an in-app "Add Customer" form (with optional first order) for live ingestion.
- **`customer_stats` view** — a SQL view joins `customers` with aggregated `orders` to compute `total_spend`, `order_count`, and `days_since_last_order` live, so segmentation never works off stale data.
- **AI segment builder** — natural language → structured rules → live preview → editable → save.
- **Campaign creation** — pick a saved segment + channel, describe a goal, get AI-drafted messages, edit, send.
- **Two-service delivery simulation** — every recipient gets a `communication_logs` row; the channel service asynchronously reports status changes back via webhook.
- **Funnel-style analytics** — delivered/opened/clicked are modeled cumulatively (a "clicked" recipient also counts as "opened" and "delivered"), matching how a marketer actually reads a funnel.
- **Dashboard** — aggregate stats across all customers, segments, and campaigns (delivery rate, open rate, click rate).
- **AI performance summaries** — one click per campaign.

---

## Stack

| Layer | Tech |
|---|---|
| Frontend | React (Vite), Tailwind CSS |
| CRM Backend | Node.js, Express, `pg` (direct Postgres) |
| Channel Service | Node.js, Express, axios |
| Database | PostgreSQL (Supabase) |
| AI | Groq API — `llama-3.3-70b-versatile` |
| Hosting | Netlify (frontend) · Render (backend + channel service) · Supabase (DB) |

---

## Project Structure

```
AI-Native-CRM/
├── xeno-crm-backend/
│   ├── src/
│   │   ├── server.js          # Express app, route registration
│   │   ├── db.js               # Postgres connection pool
│   │   ├── llm.js               # Groq API wrapper (generateJSON / generateText)
│   │   ├── routes/
│   │   │   ├── customers.js    # list / get / create customers
│   │   │   ├── segments.js     # AI NL→rules, preview, save, list
│   │   │   ├── campaigns.js    # AI drafting, send, list, summary
│   │   │   └── communications.js # receipt webhook
│   │   └── lib/
│   │       └── segmentQueryBuilder.js  # rules JSON → safe parameterized SQL
│   └── setup.sql                # creates the customer_stats view
├── xeno-channel-service/
│   └── src/server.js            # stub provider: simulates send → callback lifecycle
└── xeno-crm-frontend/
    └── src/
        ├── components/Sidebar.jsx
        ├── pages/
        │   ├── DashboardPage.jsx
        │   ├── CustomersPage.jsx
        │   ├── SegmentsPage.jsx
        │   └── CampaignsPage.jsx
        └── api.js                # fetch wrapper
```

---

## Local Setup

**Prerequisites:** Node.js 18+, a Supabase (or any Postgres) database, a free Groq API key.

```bash
# 1. Database
# Run xeno-crm-backend/setup.sql in your Postgres instance — creates customer_stats view

# 2. Backend
cd xeno-crm-backend
npm install
cp .env.example .env     # set DATABASE_URL, GROQ_API_KEY, CHANNEL_SERVICE_URL
npm run dev               # http://localhost:4000

# 3. Channel service (separate terminal)
cd xeno-channel-service
npm install
cp .env.example .env     # set CRM_RECEIPT_URL
npm run dev               # http://localhost:5000

# 4. Frontend (separate terminal)
cd xeno-crm-frontend
npm install
echo "VITE_API_URL=http://localhost:4000" > .env
npm run dev               # http://localhost:5173
```

---

## Segment Rules Format

Segments are stored as JSON, generated by AI or edited by hand:

```json
{
  "operator": "AND",
  "conditions": [
    { "field": "total_spend", "op": ">", "value": 5000 },
    { "field": "days_since_last_order", "op": ">", "value": 14 }
  ]
}
```

Allowed fields: `total_spend`, `order_count`, `days_since_last_order`.
Allowed operators: `>`, `<`, `>=`, `<=`, `=`, `!=`.

Because this JSON can originate from an LLM, `segmentQueryBuilder.js` validates every field and operator against an allowlist **before** building the SQL query — the AI never produces SQL directly.

---

## Design Decisions & Tradeoffs

- **Direct `pg` instead of an ORM.** Segment rules are dynamic and AI-generated; translating arbitrary JSON into safe SQL is simpler and more transparent with raw parameterized queries than with an ORM's query builder.
- **`customer_stats` as a SQL view, not denormalized columns.** `order_count`, `last_order_date`, and `days_since_last_order` are always computed live from `orders`, so segmentation can never run against stale aggregates.
- **LLM provider abstracted behind `generateJSON` / `generateText`.** Originally built against Gemini; when Google's API hit an account-level free-tier outage (a known issue affecting `AQ.`-prefixed keys at the time), the entire AI layer was swapped to Groq by rewriting one file — every route, prompt, and feature was unaffected. This is a deliberate "swap the model, not the product" architecture.
- **Funnel-style cumulative stats.** `delivered_count` includes everyone who went on to open or click; `opened_count` includes everyone who clicked. This matches how a marketer reads a funnel ("of those delivered, how many opened?") rather than showing only the *current* status of each message.
- **Fire-and-forget sends to the channel service.** All `communication_logs` rows are created in a single transaction before any HTTP calls go out, so a campaign's audience is fixed at send time even if the channel service is slow or briefly unavailable. Failed sends are logged but not retried.
- **`communication_logs.status` stores only the latest state**, not a full event history. Sufficient to demonstrate the callback loop and funnel at this scale; see Scaling below for the production version.
- **No authentication / single-brand.** Out of scope per the assignment ("imagine a single brand"). Adding multi-tenancy would mean JWT auth plus a `brand_id` on every table with row-level security.

---

## Scaling Considerations

| Concern | Current (this build) | At scale |
|---|---|---|
| Campaign dispatch | Fire-and-forget `axios` calls per recipient | Durable queue (BullMQ/SQS) with retries, backoff, and a dead-letter queue |
| Channel callbacks | Direct HTTP POST to `/receipt` | Ordered, replay-safe event stream (Kafka/SQS) |
| Communication state | Single `status` column (latest state only) | Append-only event log (one row per status transition) for true funnel timing & history |
| Database | Single Supabase Postgres instance | Read replicas for analytics; partition `campaigns` / `communication_logs` by `created_at` |
| AI calls | Synchronous Groq call per request | Cache common segment descriptions; pre-generate drafts/summaries asynchronously for large audiences |
| Multi-tenancy | Single brand, no auth | JWT auth + `brand_id` row-level security on every table |

The two-service, callback-driven architecture was chosen specifically so this scaling path is additive — swapping fire-and-forget HTTP for a queue, or a single status column for an event log, doesn't require restructuring the system, just hardening it.

---

## AI-Native Development Workflow

This project was built by — scaffolding the Express routes, designing the segment-rules-to-SQL safety layer, debugging deployment issues (including the Gemini → Groq provider swap above), and iterating on the frontend layout and responsiveness. See the walkthrough video for specific examples of what was generated, reviewed, and changed. 
