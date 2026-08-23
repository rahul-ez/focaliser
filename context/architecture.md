# Architecture

## Stack

| Layer | Tool | Purpose |
|---|---|---|
| Framework | Next.js 15 (App Router) | Routing, Server Components, Route Handlers (API), SSR |
| Language | TypeScript (strict mode) | All application code; `strict: true` in `tsconfig.json`, no `any` without explicit justification |
| Backend / BaaS | Supabase | Postgres database, Auth, Row Level Security (RLS), auto-generated types |
| Auth | Supabase Auth | Email/password + magic link sign-in, session cookies via `@supabase/ssr` |
| Database | Postgres (via Supabase) | Single source of truth for all persisted data (users, sessions, breaks, settings) |
| Styling | Tailwind CSS | All UI styling; no CSS-in-JS, no separate `.css` files per component |
| State (client) | Zustand | Client-side timer/session state machine (`active`, `on_break`, `idle`) |
| Timer accuracy | Web Worker (`timerWorker.ts`) | Drift-free countdown independent of main-thread throttling in background tabs |
| Local buffering | IndexedDB (`idb`) | Buffers an in-progress session locally so an accidental refresh doesn't lose elapsed time before it's synced to Postgres |
| Animation | Framer Motion | Hover blur/reveal transitions, gradual end-of-session alert |
| Charts | Recharts | Analytics bar/line charts (focus time, break time, averages) |
| Heatmap | `react-calendar-heatmap` | GitHub-style daily activity heatmap on `/history` |
| AI | None | This product has no AI/LLM feature in v1. Do not introduce an AI SDK, prompt file, or agent-facing endpoint unless explicitly requested in a future update to `project-overview.md`. |
| Other services | None | No Stripe, Resend, Cloudinary, or analytics/telemetry service in v1 |
| Hosting | Vercel (assumed) | Next.js-native deployment target; Supabase hosted separately |

---

## Folder Structure

```
focus-tracker/
├── app/
│   ├── layout.tsx                  → Root layout. Wraps all routes in global providers (Supabase session context, Tailwind globals). Renders <TopNav /> conditionally (see Navigation rule in System Boundaries).
│   ├── page.tsx                    → "/" Home. Duration picker, label input, play button. Server Component that reads auth session; redirects to /login if unauthenticated.
│   ├── globals.css                 → Tailwind directives only. No custom component classes here.
│   ├── login/
│   │   └── page.tsx                → "/login" — email/password + magic link form. Public route.
│   ├── signup/
│   │   └── page.tsx                → "/signup" — account creation form. Public route.
│   ├── session/
│   │   └── page.tsx                → "/session" — fullscreen countdown/stopwatch view. Client Component (needs Web Worker + hover state). No <TopNav />.
│   ├── analytics/
│   │   └── page.tsx                → "/analytics" — charts + averages. Server Component fetches aggregates, passes to client chart components.
│   ├── history/
│   │   └── page.tsx                → "/history" — session list + heatmap.
│   ├── api/
│   │   ├── sessions/
│   │   │   ├── route.ts            → POST: create a new FocusSession row. GET: list sessions for current user (paginated).
│   │   │   └── [id]/route.ts       → PATCH: update a session's status/end fields (completed | abandoned) and actual_focus_seconds.
│   │   ├── breaks/
│   │   │   └── route.ts            → POST: create a new Break row (break started). PATCH: set ended_at + duration_seconds on an open break.
│   │   └── analytics/
│   │       └── route.ts            → GET: aggregated totals/averages for a given period (week | month), scoped to current user.
│   └── auth/
│       └── callback/
│           └── route.ts            → Supabase Auth callback handler (magic link / OAuth exchange). Redirects to "/" on success.
├── components/
│   ├── timer/
│   │   ├── DurationPicker.tsx       → iOS-style scroll wheel for hours/minutes/seconds. Emits selected duration in seconds.
│   │   ├── LabelInput.tsx           → Freeform text input for session label.
│   │   ├── PlayButton.tsx           → Triggers session creation + navigation to /session.
│   │   ├── FocusCountdown.tsx       → Fullscreen countdown display (black bg, white numerals). Renders hover-reveal "Take a break?" and "Stop session?".
│   │   ├── BreakStopwatch.tsx       → Fullscreen stopwatch (counts up, muted red). Renders hover-reveal "Focus again?".
│   │   └── SessionEndAlert.tsx      → Gradual visual/audio cue when countdown reaches 0.
│   ├── analytics/
│   │   ├── FocusTimeChart.tsx       → Weekly/monthly focus time chart (Recharts).
│   │   ├── BreakChart.tsx           → Break count/duration chart (Recharts).
│   │   └── AveragesSummary.tsx      → Renders computed averages passed from app/analytics/page.tsx.
│   ├── history/
│   │   ├── SessionList.tsx          → Reverse-chronological list of past sessions.
│   │   └── Heatmap.tsx              → Wraps react-calendar-heatmap with per-day focus totals.
│   ├── nav/
│   │   └── TopNav.tsx               → Logo (links to "/") + Analytics/Past Sessions tabs. Never rendered on /session.
│   └── ui/                          → Shared primitives only (Button, Input, TextField). No feature logic lives here.
├── lib/
│   ├── supabase/
│   │   ├── client.ts                → Browser Supabase client factory. Used only in Client Components.
│   │   ├── server.ts                → Server Supabase client factory (cookies-based). Used only in Server Components, Route Handlers, and middleware.
│   │   └── middleware.ts            → Helper that refreshes the Supabase session cookie; imported by root middleware.ts.
│   ├── timer/
│   │   ├── useFocusSession.ts       → Zustand store: session/break state machine, elapsed time, current session id.
│   │   └── timerWorker.ts           → Web Worker script performing the actual countdown/stopwatch ticking off the main thread.
│   ├── db/
│   │   ├── sessions.ts              → Typed query functions for focus_sessions table (create, update, list, get-by-id). The only file allowed to run raw Supabase queries against focus_sessions.
│   │   ├── breaks.ts                → Typed query functions for breaks table. The only file allowed to run raw Supabase queries against breaks.
│   │   └── analytics.ts             → Aggregation queries (SUM/AVG/GROUP BY) reading from focus_sessions and breaks.
│   └── types/
│       └── database.types.ts        → Auto-generated Supabase types (`supabase gen types typescript`). Never hand-edited.
├── middleware.ts                    → Route protection (redirects unauthenticated users to /login) + session refresh. Runs on every request except static assets.
├── supabase/
│   ├── migrations/                  → SQL migration files. Source of truth for schema — database.types.ts is generated from this, never the reverse.
│   └── config.toml                  → Local Supabase CLI config.
├── public/                          → Static assets (favicon, etc.)
├── .env.local                       → NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY (server-only). Never committed.
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json                    → strict: true, noImplicitAny: true
└── package.json
```

---

## System Boundaries

| Folder / File | Owns | Not Allowed To Do |
|---|---|---|
| `app/*/page.tsx` | Route-level composition, auth-gated data fetching (Server Components), passing data to client components | Must not contain raw SQL/Supabase queries inline — must call functions from `lib/db/*`. Must not contain business logic for the timer state machine. |
| `app/api/**/route.ts` | HTTP boundary: parsing requests, calling `lib/db/*`, returning responses | Must not render UI. Must not import from `components/`. Must not contain Supabase queries inline — must delegate to `lib/db/*`. |
| `components/timer/*` | Presentation and hover/interaction UI for the timer/break/stop flow | Must not call Supabase directly. Must not fetch or mutate data — must call `useFocusSession` store actions, which in turn call `app/api/*` routes. |
| `components/analytics/*`, `components/history/*` | Rendering charts/lists from data passed in as props | Must not fetch data themselves (no `useEffect` fetch-on-mount) — data is fetched server-side in `app/analytics/page.tsx` / `app/history/page.tsx` and passed down. |
| `components/nav/*` | Navigation UI only | Must not contain auth logic — reads session state passed from layout, does not call Supabase Auth directly. |
| `components/ui/*` | Generic, feature-agnostic primitives | Must not import from `lib/db/*`, `lib/supabase/*`, or any feature folder. Zero business logic. |
| `lib/supabase/*` | Supabase client instantiation only | Must not contain query logic (no `.from('focus_sessions')` calls here) — only exports client factories. |
| `lib/timer/*` | Client-side timer/break state machine and Web Worker messaging | Must not call Supabase directly — mutations go through `fetch()` calls to `app/api/*` routes, keeping the DB access path single. |
| `lib/db/*` | All Supabase read/write queries, typed against `database.types.ts` | Must not import from `components/`. Must not contain HTTP request/response handling (that belongs in `app/api/*`). |
| `lib/types/*` | Generated type definitions | Never hand-edited; regenerated from `supabase/migrations/*`. |
| `middleware.ts` | Route protection, session cookie refresh | Must not contain business logic or DB queries beyond session validation. |
| `supabase/migrations/*` | Schema definition (source of truth) | Application code must never assume a column/table exists that isn't defined here first. |

This layering prevents circular dependencies: `components` → `lib/timer` → `app/api` → `lib/db` → `lib/supabase`, and never the reverse.

---

## Data Flow

```
// Start a focus session
User sets duration + label on "/" 
  → PlayButton.tsx calls useFocusSession.startSession(duration, label)
  → useFocusSession sends POST /api/sessions { planned_duration_seconds, label }
  → app/api/sessions/route.ts validates payload, calls lib/db/sessions.ts createSession(userId, ...)
  → lib/db/sessions.ts inserts row into focus_sessions (status='active', started_at=now())
  → Response returns session id
  → useFocusSession stores session id in Zustand + starts timerWorker.ts countdown
  → Client navigates to "/session"

// Take a break
User hovers on /session (Focus State) → clicks "Take a break?"
  → useFocusSession.startBreak() pauses timerWorker countdown, records remaining_seconds locally
  → POST /api/breaks { session_id }
  → app/api/breaks/route.ts calls lib/db/breaks.ts createBreak(userId, sessionId)
  → lib/db/breaks.ts inserts row into breaks (started_at=now(), ended_at=null)
  → focus_sessions.status updated to 'on_break' via lib/db/sessions.ts updateStatus()
  → UI switches to BreakStopwatch.tsx counting up from 0

// Resume from break
User hovers on /session (Break State) → clicks "Focus again?"
  → useFocusSession.resumeSession() computes break duration client-side
  → PATCH /api/breaks/:id { ended_at, duration_seconds }
  → lib/db/breaks.ts updates the open breaks row
  → focus_sessions.status updated back to 'active'
  → timerWorker.ts resumes countdown from stored remaining_seconds

// Stop session early (Focus State only)
User hovers on /session (Focus State) → clicks "Stop session?"
  → useFocusSession.stopSession() reads elapsed focus seconds from timerWorker
  → PATCH /api/sessions/:id { status: 'abandoned', ended_at, actual_focus_seconds }
  → lib/db/sessions.ts updates the row
  → Client navigates back to "/"
  → No confirmation dialog is shown at any point in this flow

// Session completes naturally (countdown reaches 0 in Focus State)
timerWorker.ts posts message { type: 'complete' } to main thread
  → SessionEndAlert.tsx plays gradual visual/audio cue
  → useFocusSession.completeSession() 
  → PATCH /api/sessions/:id { status: 'completed', ended_at, actual_focus_seconds = planned_duration_seconds }
  → lib/db/sessions.ts updates the row
  → Client navigates back to "/"

// Load analytics
User navigates to "/analytics"
  → app/analytics/page.tsx (Server Component) reads authenticated user from lib/supabase/server.ts
  → Calls lib/db/analytics.ts getWeeklySummary(userId), getMonthlySummary(userId)
  → lib/db/analytics.ts runs GROUP BY / SUM / AVG queries against focus_sessions + breaks filtered by user_id
  → Data passed as props to FocusTimeChart.tsx, BreakChart.tsx, AveragesSummary.tsx (client components, render-only)

// Load past sessions
User navigates to "/history"
  → app/history/page.tsx (Server Component) calls lib/db/sessions.ts listSessions(userId) and lib/db/analytics.ts getDailyTotals(userId)
  → Data passed as props to SessionList.tsx and Heatmap.tsx (render-only)

// Auth (login/signup)
User submits credentials on "/login" or "/signup"
  → Client calls Supabase Auth directly via lib/supabase/client.ts (signInWithPassword / signInWithOtp / signUp)
  → Supabase sets session cookie via @supabase/ssr
  → middleware.ts validates session on next request, redirects "/" ↔ "/login" as appropriate
```

---

## Database Schema

**auth.users** (managed entirely by Supabase Auth — not created or modified by application migrations)

| Column | Type | Notes |
|---|---|---|
| id | uuid | Primary key. Referenced by all app tables as `user_id`. |
| email | text | Managed by Supabase Auth. |

**user_settings**

| Column | Type | Notes |
|---|---|---|
| user_id | uuid | Primary key, foreign key → auth.users(id), on delete cascade |
| default_duration_seconds | integer | Not null, default 1500 (25 min) |
| created_at | timestamptz | Not null, default now() |
| updated_at | timestamptz | Not null, default now() |

**focus_sessions**

| Column | Type | Notes |
|---|---|---|
| id | uuid | Primary key, default gen_random_uuid() |
| user_id | uuid | Not null, foreign key → auth.users(id), on delete cascade |
| label | text | Nullable. Freeform session description. |
| planned_duration_seconds | integer | Not null. Value selected on the scroll-wheel picker. |
| actual_focus_seconds | integer | Not null, default 0. Updated on completion/abandonment; excludes break time. |
| status | text | Not null. CHECK constraint: one of `'active'`, `'on_break'`, `'completed'`, `'abandoned'`. Default `'active'`. |
| started_at | timestamptz | Not null, default now() |
| ended_at | timestamptz | Nullable. Set only when status becomes `'completed'` or `'abandoned'`. |
| created_at | timestamptz | Not null, default now() |

**breaks**

| Column | Type | Notes |
|---|---|---|
| id | uuid | Primary key, default gen_random_uuid() |
| session_id | uuid | Not null, foreign key → focus_sessions(id), on delete cascade |
| user_id | uuid | Not null, foreign key → auth.users(id), on delete cascade. Denormalized from session_id for direct RLS enforcement on this table. |
| started_at | timestamptz | Not null, default now() |
| ended_at | timestamptz | Nullable. Null while break is in progress. |
| duration_seconds | integer | Nullable. Computed and set only when ended_at is set. |
| created_at | timestamptz | Not null, default now() |

**Row Level Security (RLS):** enabled on `user_settings`, `focus_sessions`, and `breaks`. Every policy restricts `SELECT`, `INSERT`, `UPDATE`, `DELETE` to rows where `user_id = auth.uid()`. No table in this schema permits cross-user reads under any policy.

---

## Storage

Not applicable in v1. This application stores no files, images, or binary blobs — all data is structured rows in Postgres. Do not create a Supabase Storage bucket unless a future update to `project-overview.md` introduces a feature requiring file storage (e.g. avatar uploads).

---

## Authentication

- **Provider:** Supabase Auth
- **Methods:** Email/password (`signInWithPassword`, `signUp`) and magic link (`signInWithOtp`)
- **Protected routes:** `/`, `/session`, `/analytics`, `/history`, all `app/api/*` routes
- **Public routes:** `/login`, `/signup`, `/auth/callback`
- **Middleware file:** `middleware.ts` (project root) — validates session on every request except static assets; redirects unauthenticated users from protected routes to `/login`, and redirects authenticated users away from `/login`/`/signup` to `/`
- **Post-login redirect:** `/` (Home)
- **Session storage:** HTTP-only cookies managed by `@supabase/ssr`, refreshed in `lib/supabase/middleware.ts`

---

## Client Pattern

```typescript
// lib/supabase/client.ts — Browser client (used only in Client Components)
import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/lib/types/database.types'

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

```typescript
// lib/supabase/server.ts — Server client (used only in Server Components, Route Handlers)
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/lib/types/database.types'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )
}
```

```typescript
// middleware.ts — root middleware, delegates to lib/supabase/middleware.ts
import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
```

---

## Key Integration Patterns

**Supabase Auth — Sign up**
```typescript
const supabase = createClient()
const { data, error } = await supabase.auth.signUp({
  email,
  password,
})
// data.user: { id, email, ... } | error: AuthError
// On success, Supabase sends a confirmation email; session is not active until confirmed
// unless email confirmations are disabled in the Supabase project settings.
```

**Supabase Auth — Sign in**
```typescript
const supabase = createClient()
const { data, error } = await supabase.auth.signInWithPassword({ email, password })
// data.session: sets the auth cookie via @supabase/ssr
// On success, redirect client-side to "/"
```

**Create a focus session (Route Handler)**
```typescript
// app/api/sessions/route.ts
export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { label, planned_duration_seconds } = await request.json()

  const session = await createSession(supabase, {
    user_id: user.id,
    label,
    planned_duration_seconds,
  })
  // createSession() lives in lib/db/sessions.ts and performs:
  // supabase.from('focus_sessions').insert({...}).select().single()

  return Response.json({ session })
}
```

**Aggregation query (Analytics)**
```typescript
// lib/db/analytics.ts
export async function getWeeklySummary(supabase: SupabaseClient<Database>, userId: string) {
  const { data, error } = await supabase
    .from('focus_sessions')
    .select('actual_focus_seconds, started_at')
    .eq('user_id', userId)
    .eq('status', 'completed')
    .gte('started_at', startOfWeekISOString())
  // Aggregation (SUM, AVG, break counts) is computed in application code from the
  // returned rows, or via a Postgres RPC function for larger datasets.
  // Response shape saved to DB: none — this is a read-only aggregation, nothing is written back.
}
```

---

## Invariants

1. No file outside `lib/db/*` may call `supabase.from('focus_sessions')`, `supabase.from('breaks')`, or `supabase.from('user_settings')` directly.
2. No file outside `lib/supabase/*` may call `createBrowserClient` or `createServerClient` directly — all other code obtains a client via `lib/supabase/client.ts` or `lib/supabase/server.ts`.
3. `components/*` files never import from `lib/db/*` or `lib/supabase/*` directly. Client components call Zustand store actions (`lib/timer/useFocusSession.ts`) or receive data as props from Server Components.
4. `app/api/*` route handlers never import from `components/*`.
5. Every query against `focus_sessions`, `breaks`, or `user_settings` must be scoped by `user_id = auth.uid()` — enforced by RLS policy, never bypassed with the service role key in user-facing code paths.
6. `SUPABASE_SERVICE_ROLE_KEY` is never imported into any file under `app/`, `components/`, or `lib/timer/` — it is reserved for trusted server-only scripts (e.g. migrations, admin tooling) if ever introduced.
7. `breaks.duration_seconds` is only set when `ended_at` is also set in the same write. A break row must never have `duration_seconds` populated while `ended_at` is null.
8. `focus_sessions.actual_focus_seconds` never includes time spent in `on_break` status — break time is tracked exclusively via the `breaks` table.
9. `focus_sessions.status` transitions only follow: `active → on_break → active` (repeatable), `active → completed`, `active → abandoned`. A session must never transition directly from `on_break` to `completed` or `abandoned` — the client resumes to `active` first.
10. The "Stop session?" control is only rendered/functional while `status === 'active'` (Focus State) — never while `status === 'on_break'`.
11. No confirmation dialog, modal, or `window.confirm` is added to the stop-session flow — stopping is immediate per `project-overview.md`.
12. `<TopNav />` is never rendered on `/session`.
13. `components/analytics/*` and `components/history/*` never fetch data client-side (no `useEffect` + fetch) — all data arrives as props from their parent Server Component.
14. `lib/types/database.types.ts` is never hand-edited — it is regenerated from `supabase/migrations/*` via the Supabase CLI.
15. No AI/LLM SDK, API key, or prompt file is added to this codebase unless `project-overview.md` is updated to include an AI feature first.
16. No Supabase Storage bucket is created unless `project-overview.md` is updated to include a file-storage feature first.
17. `middleware.ts` matcher must continue to exclude static assets; it must always run on `/`, `/session`, `/analytics`, `/history`, and all `/api/*` routes.
18. All new columns/tables are added via a new file in `supabase/migrations/`, never by editing an existing applied migration file.
