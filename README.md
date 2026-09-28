# Meeting Prep Agent

### "Never walk into a meeting without the context again."

An AI-powered meeting preparation assistant whose most important capability is **persistent memory**. The agent remembers what was discussed, decisions made, promises exchanged, deadlines, follow-ups, and unresolved questions across multiple meetings with the same people. When you're about to meet again, it recalls relevant information and creates a personalized briefing.

---

## Why Hindsight?

This app uses two separate data stores with distinct purposes:

| Store | Purpose | Examples |
|-------|---------|----------|
| **Supabase (PostgreSQL)** | Application records | Contacts, meetings, commitments, user preferences |
| **Hindsight** | Persistent agent memory | Relationship context, past interaction summaries, learned user preferences, recalled insights |

The key distinction: MongoDB/Supabase stores **structured application data** (rows in tables). Hindsight stores the **agent's long-term memory** — unstructured context that accumulates over time and can be semantically recalled.

The flow is:

```
Meeting entered → Extract info with Grok → Save to Supabase → Retain in Hindsight
                                                                         ↓
User clicks "Prepare Me" → Recall from Hindsight → Grok reasons over memories → Briefing
```

**Do NOT simply send the entire meeting history to Grok and call that memory.** The agent recalls relevant memories from Hindsight first, then Grok reasons over what was recalled.

---

## Features

### Core
- **Authentication** — Register, login, logout with secure password hashing (Supabase Auth)
- **Contacts** — Full CRUD with search, relationship types, company/role tracking
- **Meetings/Interactions** — Record meetings with raw notes; AI extracts structured data
- **AI Extraction** — Grok analyzes meeting notes to extract: summary, topics, decisions, commitments, deadlines, follow-ups, open questions, important facts
- **Commitments** — Track promises made by you and your contacts, with due dates and status
- **Overdue Detection** — Carefully identifies potentially overdue items without hallucinating completion or failure

### Memory & Intelligence
- **Hindsight Integration** — Every meeting's extracted information is retained in Hindsight as agent memory
- **"Prepare Me"** — Generates a personalized meeting briefing using recalled memories + Grok reasoning
- **Learning Preferences** — User feedback on briefings is analyzed and retained as learned preferences
- **"What I've Learned About You"** — Shows preferences the agent has inferred over time
- **Memory Timeline** — Visual timeline combining meetings and commitments

### Demo
- **Before vs After Memory** — Side-by-side comparison showing generic prep vs Hindsight-powered prep
- **Memory Demo** — Select any contact and run a live "Prepare Me" to see recalled memories in action
- **Demo Data** — One-click seeding of 3 realistic contacts with 8 meetings and 12 commitments

---

## Architecture

```
React Frontend (Vite + TypeScript + Tailwind)
    |
    | REST API (Supabase Edge Functions)
    v
Supabase Backend
    |
    +-- PostgreSQL Database
    |       +-- contacts
    |       +-- meetings (with AI-extracted structured data)
    |       +-- commitments
    |       +-- memory_feedback
    |       +-- user_preferences
    |
    +-- Edge Functions
    |       +-- extract-meeting (Grok extraction + Hindsight retain)
    |       +-- prepare-meeting (Hindsight recall + Grok briefing)
    |       +-- memory-feedback (Grok preference analysis + Hindsight retain)
    |       +-- health-check (system status)
    |
    +-- Hindsight (external API)
    |       +-- persistent agent memory
    |       +-- past interaction context
    |       +-- user preferences
    |
    +-- Grok/xAI (external API)
            +-- meeting extraction
            +-- briefing generation
            +-- preference analysis
```

### Edge Functions (Server Backend)

| Function | Purpose | External APIs |
|----------|---------|---------------|
| `extract-meeting` | Analyzes meeting notes, saves structured data, creates commitments, retains in Hindsight | Grok, Hindsight |
| `prepare-meeting` | Recalls memories from Hindsight, generates briefing with Grok | Hindsight, Grok |
| `memory-feedback` | Analyzes user feedback, infers preferences, retains in Hindsight | Grok, Hindsight |
| `health-check` | Reports connection status of database, Hindsight, and AI | Hindsight |

---

## Tech Stack

- **Frontend:** React 18, Vite 5, TypeScript, Tailwind CSS 3, Lucide React icons, React Router 7
- **Backend:** Supabase Edge Functions (Deno runtime)
- **Database:** Supabase (PostgreSQL) with Row Level Security
- **AI:** Grok/xAI (grok-beta model) for extraction, reasoning, and generation
- **Memory:** Hindsight for persistent agent memory (retain/recall API)

---

## Folder Structure

```
project/
├── src/
│   ├── components/          # Shared UI components
│   │   ├── Layout.tsx       # Sidebar + main content wrapper
│   │   ├── Modal.tsx        # Reusable modal dialog
│   │   ├── Toast.tsx        # Toast notifications
│   │   ├── EmptyState.tsx   # Empty state placeholder
│   │   ├── Skeleton.tsx     # Loading skeletons
│   │   ├── LoadingSpinner.tsx
│   │   ├── PreparationBrief.tsx  # Meeting briefing display + feedback
│   │   └── MemoryTimeline.tsx    # Visual timeline
│   ├── context/
│   │   └── AuthContext.tsx  # Supabase auth provider
│   ├── lib/
│   │   ├── supabase.ts      # Supabase client
│   │   ├── api.ts           # Edge function callers
│   │   ├── contacts.ts      # Contact CRUD
│   │   ├── meetings.ts      # Meeting CRUD
│   │   ├── commitments.ts   # Commitment CRUD
│   │   ├── preferences.ts   # Preference queries
│   │   ├── utils.ts         # Date formatting, status helpers
│   │   └── seedDemo.ts      # Demo data seeder
│   ├── pages/
│   │   ├── Login.tsx
│   │   ├── Register.tsx
│   │   ├── Dashboard.tsx
│   │   ├── Contacts.tsx
│   │   ├── ContactDetails.tsx  # Tabs: Overview, Interactions, Commitments, Timeline
│   │   ├── Meetings.tsx
│   │   ├── Commitments.tsx
│   │   ├── MemoryPage.tsx      # What I've Learned, Before/After, Memory Demo
│   │   └── Settings.tsx
│   ├── types/
│   │   └── index.ts         # TypeScript interfaces
│   ├── App.tsx              # Router + protected routes
│   ├── main.tsx             # Entry point
│   └── index.css            # Tailwind + custom styles
├── supabase/
│   ├── config.toml          # Edge function config
│   ├── functions/
│   │   ├── extract-meeting/index.ts
│   │   ├── prepare-meeting/index.ts
│   │   ├── memory-feedback/index.ts
│   │   └── health-check/index.ts
│   └── migrations/
│       └── 20260928183114_create_meeting_prep_schema.sql
├── .env.example
└── README.md
```

---

## Environment Variables

### Frontend (`.env`)

| Variable | Description | Source |
|----------|-------------|--------|
| `VITE_SUPABASE_URL` | Supabase project URL | Auto-provisioned in Bolt |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon public key | Auto-provisioned in Bolt |

### Edge Function Secrets (configured via Supabase)

| Variable | Description | Source |
|----------|-------------|--------|
| `SUPABASE_URL` | Supabase project URL | Auto-configured |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | Auto-configured |
| `XAI_API_KEY` | Grok/xAI API key | https://console.x.ai |
| `HINDSIGHT_API_KEY` | Hindsight API key | Your Hindsight deployment |
| `HINDSIGHT_BASE_URL` | Hindsight API base URL | Your Hindsight deployment |

**Important:** Never commit `.env` or expose secret keys in frontend code.

---

## Local Setup

1. **Clone and install:**
   ```bash
   npm install
   ```

2. **Environment variables:**
   - Copy `.env.example` to `.env`
   - Fill in your Supabase URL and anon key
   - Configure edge function secrets in Supabase dashboard:
     - `XAI_API_KEY` — from https://console.x.ai
     - `HINDSIGHT_API_KEY` and `HINDSIGHT_BASE_URL` — from your Hindsight deployment

3. **Run the dev server:**
   ```bash
   npm run dev
   ```

4. **Build for production:**
   ```bash
   npm run build
   ```

---

## Hindsight Setup

Hindsight is the persistent memory system. The app uses the Hindsight HTTP API:

### Retain (store memory)
```
POST /v1/default/banks/{bank_id}/retain
Authorization: Bearer {HINDSIGHT_API_KEY}
Content-Type: application/json

{
  "items": [{ "content": "Meeting memory text..." }]
}
```

### Recall (retrieve memory)
```
POST /v1/default/banks/{bank_id}/recall
Authorization: Bearer {HINDSIGHT_API_KEY}
Content-Type: application/json

{
  "query": "What do you know about Rahul Sharma?",
  "top_k": 10
}
```

### Bank Management
Each user gets two memory banks:
- `user-{userId}` — meeting memories and interaction context
- `user-{userId}-prefs` — learned user preferences

The app creates banks automatically via `PUT /v1/default/banks/{bank_id}`.

If Hindsight is not configured, the app runs in **limited mode** — meetings are saved, AI extraction works, but persistent memory recall is unavailable. The preparation briefing falls back to database-only context.

---

## xAI (Grok) Setup

1. Create an account at https://console.x.ai
2. Generate an API key
3. Set `XAI_API_KEY` as an edge function secret

The app uses the `grok-beta` model for:
- **Meeting extraction** — Structured JSON output from raw notes
- **Briefing generation** — Contextual preparation from recalled memories
- **Preference analysis** — Inferring user preferences from feedback

---

## API Documentation

### Auth (Supabase built-in)
- `POST /auth/v1/signup` — Register with email, password, name
- `POST /auth/v1/token?grant_type=password` — Login
- `POST /auth/v1/logout` — Logout
- `GET /auth/v1/user` — Current user

### Contacts (Supabase client)
- `GET /contacts` — List user's contacts (with optional search)
- `POST /contacts` — Create contact
- `GET /contacts/:id` — Get contact
- `PUT /contacts/:id` — Update contact
- `DELETE /contacts/:id` — Delete contact

### Meetings
- `GET /meetings` — List all meetings
- `POST /meetings` — Create meeting
- `GET /meetings/:id` — Get meeting
- `PUT /meetings/:id` — Update meeting
- `DELETE /meetings/:id` — Delete meeting

### Edge Functions
- `POST /functions/v1/extract-meeting` — AI extraction + Hindsight retain
  - Body: `{ meetingId, notes, contactName }`
- `POST /functions/v1/prepare-meeting` — Generate briefing
  - Body: `{ contactId, contactName }`
- `POST /functions/v1/memory-feedback` — Submit feedback
  - Body: `{ contactId, briefing, rating, improvementSuggestion }`
- `GET /functions/v1/health-check` — System health status

### Commitments
- `GET /commitments` — List (with optional status filter)
- `POST /commitments` — Create
- `PATCH /commitments/:id` — Update status

---

## Demo Walkthrough

1. **Register** an account (or sign in)
2. Go to **Dashboard** — click **"Load Demo Data"**
3. This creates 3 contacts with realistic meeting histories:
   - **Rahul Sharma** (Backend Lead, Acme Technologies) — 4 meetings about API integration
   - **Priya Nair** (Product Manager, Design Studio) — 2 meetings about dashboard redesign
   - **Arjun Patel** (DevOps Engineer, CloudOps Solutions) — 2 meetings about cloud migration
4. Go to **Contacts** → click **Rahul Sharma**
5. Click **"Prepare Me"** — the agent will:
   - Recall memories from Hindsight about Rahul
   - Generate a briefing referencing information from multiple past meetings
   - Show overdue follow-ups (API documentation was due Sept 23)
   - Suggest talking points based on remembered context
6. Go to **Memory** page to see:
   - **Before vs After Memory** comparison
   - **Memory Demo** — run "Prepare Me" for any contact
   - **What I've Learned About You** — preferences learned from feedback
7. After viewing a briefing, rate it ("Very useful" / "Useful" / "Not useful") — the agent learns from your feedback

### The Demo Experience

The latest meeting with Rahul says "Discussed frontend progress" — but older meetings contained:
- Rahul promised API documentation by September 23
- You promised frontend integration after receiving it
- Authentication requirements were discussed (JWT, 15-min tokens)
- Deployment target was September 30
- Staging environment was promised by September 25

When you click "Prepare Me," the briefing references ALL of this context — not just the latest meeting. This demonstrates that persistent memory works across interactions.

---

## How Memory Works

### When a Meeting is Saved:
1. Raw notes are saved to Supabase
2. Edge function calls Grok to extract structured information
3. Extracted data (summary, commitments, deadlines, etc.) is saved to the meeting record
4. Commitments are auto-created from extracted data
5. A memory summary is **retained in Hindsight** for long-term recall

### When "Prepare Me" is Clicked:
1. Edge function **recalls memories from Hindsight** about that contact
2. User preferences are also recalled from Hindsight
3. Current commitments and meeting data are gathered from Supabase
4. All context is sent to Grok with instructions to generate a briefing
5. Grok produces a structured briefing with careful rules:
   - Never invent meetings, commitments, dates, or facts
   - Use "Potentially overdue" for unconfirmed overdue items
   - Distinguish known facts from inferences from suggested questions
6. Briefing is displayed with a feedback mechanism

### When Feedback is Submitted:
1. Feedback is saved to Supabase
2. Grok analyzes the feedback to infer a user preference
3. The preference is **retained in Hindsight** for future briefings
4. The preference is also saved to the `user_preferences` table

---

## Security

- **Authentication:** Supabase Auth with email/password (no plain-text passwords)
- **Row Level Security:** Every table has RLS enabled — users can only access their own data
- **Authorization:** Edge functions verify JWT tokens and filter by `user_id`
- **No secrets in frontend:** All API keys (Grok, Hindsight) are edge function secrets only
- **CORS:** All edge functions include proper CORS headers

---

## Deployment

The app is designed for Bolt.new deployment:

1. **Frontend:** Built with Vite, deployed as static assets
2. **Backend:** Supabase Edge Functions (serverless Deno)
3. **Database:** Supabase PostgreSQL with RLS
4. **External services:** Hindsight and Grok/xAI called from edge functions

To deploy edge function secrets, use the Supabase dashboard or contact your platform administrator.

---

## Testing Checklist

- [x] User can register
- [x] User can log in
- [x] User can create contacts
- [x] User can create meetings
- [x] Meeting notes are analyzed by Grok (when XAI_API_KEY is configured)
- [x] Structured information is saved
- [x] Information is retained in Hindsight (when HINDSIGHT_API_KEY is configured)
- [x] Hindsight recall works
- [x] Preparation brief uses recalled memory
- [x] Commitments are tracked
- [x] Potential overdue commitments are identified carefully
- [x] User preferences can be learned
- [x] Memory timeline works
- [x] Authentication is secure (RLS on all tables)
- [x] Users cannot access other users' data
- [x] Errors are handled gracefully
- [x] Demo data exists
- [x] No secrets committed
- [x] Fallback mode when Hindsight not configured
