# Spur AI Live Chat Agent

A mini AI customer support chat for **Spur Boutique**, a fictional e-commerce store. Users chat via a live widget; messages are persisted to PostgreSQL and answered by Google Generative AI (Gemini 3.5 Flash) with store FAQ knowledge baked into the system prompt. Features real-time character count warnings and intelligent retry logic for rate limiting.

## Live Demo

| Service  | URL                      |
| -------- | ------------------------ |
| Frontend | _Add Vercel/Netlify URL_ |
| Backend  | _Add Render URL_         |

## Prerequisites

- **Node.js 20+**
- **Docker Desktop** (for local PostgreSQL) — or a free [Neon](https://neon.tech) / [Supabase](https://supabase.com) Postgres instance
- **Google Generative AI API key** — [Google AI Studio](https://aistudio.google.com/app/apikey)

## Quick Start (Local)

### 1. Start the database

**Option A — Docker**

```bash
docker compose up -d
```

**Option B — Cloud Postgres**

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
