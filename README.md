# Spur AI Live Chat Agent

A mini AI customer support chat for **Spur Boutique**, a fictional e-commerce store. Users chat via a live widget; messages are persisted to PostgreSQL and answered by Google Generative AI (Gemini 3.5 Flash) with store FAQ knowledge baked into the system prompt. Features real-time character count warnings and intelligent retry logic for rate limiting.

## Live Demo



| Service  | URL |
| -------- | --- |
| Frontend | https://assginment-jc5r.vercel.app |
| Backend  | https://assginment-peach.vercel.app/health |

## Prerequisites

- **Node.js 20+**
- **Docker Desktop** (for local PostgreSQL) — or a free [Neon](https://neon.tech) / [Supabase](https://supabase.com) Postgres instance
- **Google Generative AI API key** — [Google AI Studio](https://aistudio.google.com/app/apikey)

## Quick Start (Local)

### 1. Start the database



Create a free database on Neon or Supabase and use its connection string as `DATABASE_URL` in step 2.

### 2. Configure environment variables

**Backend** — copy and fill in values:

```bash
cd backend
cp .env.example .env
```

Edit `backend/.env`:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/spur_chat
GOOGLE_API_KEY=your-google-api-key-here
PORT=3000
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
```

**Frontend:**

```bash
cd frontend
cp .env.example .env
```

Edit `frontend/.env`:

```env
VITE_API_URL=http://localhost:3000
```

### 3. Install dependencies & run migrations

```bash
cd backend
npm install
npm run db:migrate
npm run dev
```

In a second terminal:

```bash
cd frontend
npm install
npm run dev
```

### 4. Open the app

Visit **http://localhost:5173** and try questions like:

- "What's your return policy?"
- "Do you ship to the USA?"
- "What are your support hours?"

Reload the page — your conversation history should restore via `sessionId` stored in `localStorage`.

---

## Project Structure

```
spur_assignment/
├── backend/                  # Node.js + TypeScript API
│   ├── src/
│   │   ├── index.ts          # Server entry, wiring
│   │   ├── routes/           # HTTP route handlers
│   │   ├── services/         # Business logic + LLM
│   │   ├── db/               # Schema, migrations, repository
│   │   ├── config/           # Env validation, store FAQ
│   │   └── middleware/       # Global error handler
│   └── drizzle/              # SQL migrations
├── frontend/                 # React + Vite chat UI
│   └── src/
│       ├── components/       # ChatWidget, MessageList, etc.
│       ├── hooks/            # useChat (state + API)
│       └── api/              # Fetch wrappers
├── docker-compose.yml        # Local Postgres
└── render.yaml               # Render deployment blueprint
```

## Architecture Overview

```mermaid
flowchart LR
    subgraph frontend [Frontend]
        ChatUI[ChatWidget]
        Session[localStorage sessionId]
        Counter[Character Counter]
    end

    subgraph backend [Backend]
        Routes[Fastify Routes]
        ChatSvc[ChatService]
        LLMSvc[LLMService]
        Repo[MessageRepository]
    end

    subgraph external [External]
        PG[(PostgreSQL)]
        Google[Google Generative AI]
    end

    ChatUI -->|POST /chat/message| Routes
    ChatUI -->|GET /chat/history/:id| Routes
    Routes --> ChatSvc
    ChatSvc --> Repo
    ChatSvc --> LLMSvc
    Repo --> PG
    LLMSvc --> Google
    Session --> ChatUI
    Counter --> ChatUI
```

### Backend layers

| Layer | Responsibility |
| ----- | -------------- |
| **Routes** (`routes/chat.routes.ts`) | Parse HTTP, delegate to services, no business logic |
| **ChatService** (`services/chat.service.ts`) | Orchestrate: validate → persist user msg → build history → call LLM → persist AI reply |
| **LLMService** (`services/llm.service.ts`) | Encapsulated OpenAI call with timeout, token cap, error mapping |
| **MessageRepository** (`db/repository.ts`) | All database reads/writes |
| **Config** (`config/`) | Zod-validated env vars + hardcoded store FAQ |

This separation makes it straightforward to add new channels later (e.g. a `WhatsAppAdapter` that calls the same `ChatService`).


## LLM Integration

| Setting | Value |
| ------- | ----- |
| Provider | Google Generative AI |
| Model | `gemini-3.5-flash` |
| Max tokens | 500 per reply |
| History cap | Last 20 messages |
| Timeout | 30 seconds |
| Retry strategy | Exponential backoff (1s, 2s, 4s) for rate limits |

### Prompting strategy

The system prompt (`backend/src/config/store-knowledge.ts`) includes:

1. Role definition — helpful support agent for Spur Boutique
2. Full store FAQ — shipping, returns, support hours, payment
3. Instruction to defer to a human agent when unsure

Conversation history is sent as alternating user/assistant messages so follow-ups stay contextual.

## Robustness

| Scenario | Behavior |
| -------- | -------- |
| Empty message | Backend returns 400; frontend disables Send button |
| Message > 4000 chars | Truncated server-side; user notified in AI reply |
| Invalid/missing sessionId | New conversation created automatically |
| LLM API failure | Friendly error shown in chat UI |
| Missing env vars | Server fails at startup with clear log message |

---

## Deployment



### Verify deployment - backend health check

```bash
curl https://assginment-peach.vercel.app/health
# → {"status":"ok"}
```

Open the frontend URL, send a test message, reload — history should persist.

---

## Design Decisions & Trade-offs

- **Fastify over Express** — lighter, built-in schema validation hooks, good TypeScript support.
- **Drizzle over Prisma** — minimal abstraction, SQL-first migrations, no codegen step.


## If I Had More Time

- **Streaming responses** (SSE) so the agent's reply appears token-by-token
- **Redis** for rate limiting and session caching
- **Channel adapter pattern** — `LiveChatChannel`, `WhatsAppChannel` sharing one `ChatService`
- **Unit tests** for `ChatService` and LLM error paths
- **E2E tests** with Playwright
- **Admin dashboard** to browse conversations
- **RAG** over a proper knowledge base instead of hardcoded FAQ

---
