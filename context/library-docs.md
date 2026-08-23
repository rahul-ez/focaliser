# Library Docs

This file documents how *this project* — Focaliser — uses each third-party library, not how the library works in general. It captures the exact call patterns, parameter choices, and constraints specific to this codebase, which override generic library knowledge whenever the two disagree.

**Authority order** for anything library-related:
1. **MCP server** (if one is connected for a given library — e.g. a live Supabase MCP server) — always the most current source, since it reflects the library's actual current API.
2. **Installed skill** (if a skill for that library is present in the environment) — encodes environment-specific constraints.
3. **This file** — project-specific patterns and rules for the libraries listed in `code-standards.md`'s approved dependency list.
4. **General training knowledge** — used only when none of the above cover the situation, and never in a way that contradicts this file.

---

## Before Using Any Library

1. Check whether a skill for the library is installed and read it first — skills often encode constraints (available APIs, environment quirks) that override general knowledge.
2. Check whether an MCP server is connected for the library or service — if so, use it for anything requiring current, authoritative API behavior rather than relying on memory.
3. Read this file for the project-specific pattern before writing new code that touches the library — every library in this project has an established pattern below; do not invent a new one that happens to also work.
4. Only fall back to general training knowledge for something genuinely uncovered by the above (e.g. a library method never before used in this codebase) — and once used, add the new pattern to this file.

---

## Supabase (`@supabase/supabase-js` + `@supabase/ssr`)

**Check first:** No MCP server or skill is connected for Supabase in this project. Use this file and `architecture.md` as the authoritative source for project-specific patterns.

### Client Instantiation

```typescript
// lib/supabase/client.ts — browser only
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
// lib/supabase/server.ts — server only, always async
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
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) =>
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)),
      },
    }
  )
}
```

### DB Queries (`lib/db/*`)

```typescript
// lib/db/sessions.ts
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/types/database.types'

type FocusSession = Database['public']['Tables']['focus_sessions']['Row']

export async function createSession(
  supabase: SupabaseClient<Database>,
  input: { user_id: string; label: string | null; planned_duration_seconds: number }
): Promise<FocusSession> {
  const { data, error } = await supabase
    .from('focus_sessions')
    .insert({
      user_id: input.user_id,
      label: input.label,
      planned_duration_seconds: input.planned_duration_seconds,
      status: 'active',
    })
    .select()
    .single()

  if (error) throw error
  return data
}
```

### Auth Check Pattern (used in every Route Handler and Server Component page)

```typescript
const supabase = await createClient()
const { data: { user }, error: authError } = await supabase.auth.getUser()

if (authError || !user) {
  return Response.json({ error: 'Unauthorized' }, { status: 401 })
}
```

**Rules:**
- `lib/supabase/client.ts` is imported only from Client Components (`'use client'` files) and the Zustand store. `lib/supabase/server.ts` is imported only from Server Components, Route Handlers, and Server Actions — never cross the two.
- `createClient()` from `lib/supabase/server.ts` returns a `Promise` and must always be `await`ed — forgetting this is the single most common Supabase mistake in this project, because the browser factory (confusingly) is not async.
- No file outside `lib/db/*` calls `supabase.from(...)` directly, per the System Boundaries invariant in `architecture.md`.
- Supabase JS methods return `{ data, error }` — they do not throw. Every call in `lib/db/*` explicitly checks `if (error) throw error` (or handles it inline) rather than relying on a surrounding `try/catch` to catch a Supabase error that was never thrown.
- Every mutation checks `auth.getUser()` and returns `401` before touching the database — Row Level Security is the enforcement backstop, not the first line of defense.
- Queries still explicitly filter by `user_id` even though RLS already restricts rows — this keeps query intent readable and makes code review catch mistakes without needing to reason about policies.
- `SUPABASE_SERVICE_ROLE_KEY` is never referenced in any file under `app/`, `components/`, or `lib/timer/`.

---

## Zustand

**Check first:** Use this file. No skill or MCP server applies.

### Store Definition

```typescript
// lib/timer/useFocusSession.ts
import { create } from 'zustand'

type SessionStatus = 'idle' | 'active' | 'on_break' | 'completed' | 'abandoned'

interface FocusSessionState {
  sessionId: string | null
  status: SessionStatus
  remainingSeconds: number
  elapsedFocusSeconds: number
  startSession: (durationSeconds: number, label: string | null) => Promise<void>
  startBreak: () => Promise<void>
  resumeSession: () => Promise<void>
  stopSession: () => Promise<void>
  completeSession: () => Promise<void>
  reset: () => void
}

export const useFocusSession = create<FocusSessionState>((set, get) => ({
  sessionId: null,
  status: 'idle',
  remainingSeconds: 0,
  elapsedFocusSeconds: 0,

  startSession: async (durationSeconds, label) => {
    const response = await fetch('/api/sessions', {
      method: 'POST',
      body: JSON.stringify({ planned_duration_seconds: durationSeconds, label }),
    })
    const { session } = await response.json()
    set({ sessionId: session.id, status: 'active', remainingSeconds: durationSeconds })
  },

  reset: () => set({ sessionId: null, status: 'idle', remainingSeconds: 0, elapsedFocusSeconds: 0 }),

  // startBreak, resumeSession, stopSession, completeSession follow the same
  // fetch-then-set-state shape as startSession above
  startBreak: async () => {},
  resumeSession: async () => {},
  stopSession: async () => {},
  completeSession: async () => {},
}))
```

**Rules:**
- The store holds only ephemeral, in-progress-session state (`sessionId`, `status`, `remainingSeconds`, `elapsedFocusSeconds`) — it never holds historical session lists or analytics data; those are fetched server-side and passed as props.
- Every store action that mutates persisted data calls `fetch()` against an `app/api/*` route — the store never imports or calls a Supabase client directly, per the System Boundaries invariant in `architecture.md`.
- `reset()` is always called immediately after navigating from `/session` back to `/`, so a stale `sessionId` can never leak into the next session's first render.
- Status transitions in the store must match the enum transitions defined in `architecture.md` invariant #9 (`active ↔ on_break`, `active → completed`, `active → abandoned`) — no action sets `status` to a value outside that state machine.

---

## Framer Motion

**Check first:** Use this file.

### Hover-Reveal Transition (`/session`)

```tsx
import { motion, AnimatePresence } from 'framer-motion'

<AnimatePresence>
  {isHovering && (
    <motion.button
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="text-focus-fg-muted hover:text-focus-fg text-sm"
    >
      Take a break?
    </motion.button>
  )}
</AnimatePresence>
```

### Gradual End-of-Session Alert

```tsx
import { motion } from 'framer-motion'
import { SESSION_END_ALERT_DURATION_MS } from '@/lib/constants'

<motion.div
  animate={{ opacity: [1, 0.4, 1] }}
  transition={{ duration: SESSION_END_ALERT_DURATION_MS / 1000, ease: 'easeInOut' }}
  className="text-focus-fg"
>
  {formattedTime}
</motion.div>
```

**Rules:**
- Only two motion patterns exist in this app: the 200ms hover-reveal fade shown above, and the end-of-session alert using `SESSION_END_ALERT_DURATION_MS` (2000ms) from `lib/constants.ts`. Do not invent a third timing value or easing curve elsewhere in the app.
- Check `window.matchMedia('(prefers-reduced-motion: reduce)')` before starting the end-of-session pulse; if reduced motion is preferred, skip straight to the final state (a static, fully-opaque display) rather than animating.
- Framer Motion is never used for page-route transitions or navbar animations — its use is scoped entirely to the `/session` screen's two effects listed above.

---

## Recharts

**Check first:** Use this file.

### Focus Time Chart

```tsx
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from 'recharts'

const PRIMARY_COLOR = '#5B5FEF' // must match --color-primary in ui-tokens.md exactly

export function FocusTimeChart({ data }: { data: { date: string; focusMinutes: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data}>
        <XAxis
          dataKey="date"
          tick={{ fontSize: 12, fill: '#8C8A86' }} // matches --color-text-muted
        />
        <YAxis tick={{ fontSize: 12, fill: '#8C8A86' }} />
        <Bar dataKey="focusMinutes" fill={PRIMARY_COLOR} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
```

**Rules:**
- Recharts SVG props (`fill`, `stroke`, `tick.fill`) do not accept Tailwind class names or CSS variables directly in all browsers reliably — always pass the literal resolved hex value from `ui-tokens.md`, and keep a comment noting which token it mirrors so it can be updated if the token changes.
- Every chart in this project uses a single series color (`--color-primary`, `#5B5FEF`) — never a multi-color/rainbow palette, per the near-monochrome design direction in `ui-tokens.md`.
- Axis and label font size is always `12px` with the muted text color, matching the "Chart axis/legend label" row in `ui-rules.md`'s Typography Hierarchy.
- No animation is enabled on chart mount (`isAnimationActive={false}`) — bars render immediately, consistent with the distraction-free, non-decorative design direction.

---

## react-calendar-heatmap

**Check first:** Use this file.

### Heatmap Rendering

```tsx
import CalendarHeatmap from 'react-calendar-heatmap'
import 'react-calendar-heatmap/dist/styles.css'

function classForValue(value: { count: number } | undefined): string {
  if (!value || value.count === 0) return 'heatmap-scale-0'
  if (value.count < 1800) return 'heatmap-scale-1' // < 30 min
  if (value.count < 5400) return 'heatmap-scale-2' // 30 min – 1.5 hr
  return 'heatmap-scale-3' // 1.5 hr+
}

export function Heatmap({ dailyTotals }: { dailyTotals: { date: string; count: number }[] }) {
  return (
    <CalendarHeatmap
      startDate={/* HEATMAP_WEEKS weeks ago, computed via date-fns */ new Date()}
      endDate={new Date()}
      values={dailyTotals}
      classForValue={classForValue}
    />
  )
}
```

```css
/* app/globals.css — required because react-calendar-heatmap renders raw SVG
   class names that Tailwind's JIT scanner cannot detect */
.heatmap-scale-0 { fill: var(--color-surface-muted); }
.heatmap-scale-1 { fill: var(--color-primary-light); }
.heatmap-scale-2 { fill: var(--color-primary-muted); }
.heatmap-scale-3 { fill: var(--color-primary); }
```

**Rules:**
- `classForValue` implements exactly the 4-bucket scale defined in `ui-rules.md`'s Analytics Heatmap section — never add a 5th bucket without updating `ui-rules.md` and `ui-tokens.md` first.
- The 4 bucket classes are defined as literal CSS rules in `globals.css`, not as Tailwind utility classes applied via `className` — Tailwind's build-time class scanner cannot see class names generated dynamically inside this library's internal SVG rendering.
- `dailyTotals` values are always seconds (matching `focus_sessions.actual_focus_seconds`); the bucket thresholds above are written in seconds (1800 = 30 min, 5400 = 90 min) — never pass minutes or hours into `classForValue` without converting first.

---

## idb

**Check first:** Use this file.

### Local Session Buffer

```typescript
// lib/timer/sessionBuffer.ts
import { openDB } from 'idb'

const DB_NAME = 'focaliser-buffer'
const STORE_NAME = 'session-buffer'
const BUFFER_KEY = 'current-session'

async function getDb() {
  return openDB(DB_NAME, 1, {
    upgrade(db) {
      db.createObjectStore(STORE_NAME)
    },
  })
}

export async function writeSessionBuffer(state: {
  sessionId: string
  remainingSeconds: number
  status: string
}): Promise<void> {
  try {
    const db = await getDb()
    await db.put(STORE_NAME, state, BUFFER_KEY)
  } catch (error) {
    console.error('[timer/sessionBuffer:write]', error)
    // Intentionally not re-thrown — see Rules below.
  }
}

export async function clearSessionBuffer(): Promise<void> {
  try {
    const db = await getDb()
    await db.delete(STORE_NAME, BUFFER_KEY)
  } catch (error) {
    console.error('[timer/sessionBuffer:clear]', error)
  }
}
```

**Rules:**
- The buffer always uses the single fixed key `'current-session'` — this app never buffers more than one concurrent session, so there is no key-per-session scheme.
- `clearSessionBuffer()` is always called immediately after a session successfully syncs to Supabase (on `completed` or `abandoned`) — a stale buffer must never persist past a synced session.
- This is the one documented exception to `code-standards.md`'s "never fire-and-forget" rule: `writeSessionBuffer` failures are logged but not re-thrown or surfaced to the user, because the IndexedDB buffer is a resilience nice-to-have, not the source of truth — Postgres, via the API routes, remains authoritative.

---

## Zod

**Check first:** Use this file (also referenced in `code-standards.md`'s API Route Handlers section).

### Schema Definition and Validation

```typescript
// lib/validation/session.ts
import { z } from 'zod'
import { MIN_SESSION_DURATION_SECONDS, MAX_SESSION_DURATION_SECONDS, SESSION_LABEL_MAX_LENGTH } from '@/lib/constants'

export const createSessionSchema = z.object({
  label: z.string().max(SESSION_LABEL_MAX_LENGTH).nullable(),
  planned_duration_seconds: z
    .number()
    .int()
    .min(MIN_SESSION_DURATION_SECONDS)
    .max(MAX_SESSION_DURATION_SECONDS),
})

export type CreateSessionInput = z.infer<typeof createSessionSchema>
```

```typescript
// usage inside a Route Handler
const parsed = createSessionSchema.safeParse(await request.json())
if (!parsed.success) {
  return Response.json({ error: 'Invalid request body' }, { status: 400 })
}
// parsed.data is now fully typed as CreateSessionInput
```

**Rules:**
- Always use `.safeParse()` inside Route Handlers and Server Actions — never `.parse()`, which throws and would bypass the standard `{ error: string }` response shape defined in `code-standards.md`.
- Schemas reused by more than one route or action live in `lib/validation/*.ts`; a schema used by only a single route may be defined inline at the top of that route file.
- No schema ever includes a `user_id` field — the authenticated user's id always comes from `supabase.auth.getUser()` server-side, never from client-supplied input.
- Numeric bounds in schemas (`MIN_SESSION_DURATION_SECONDS`, etc.) always import from `lib/constants.ts` — never a literal number re-typed inside the schema file.

---

## date-fns

**Check first:** Use this file.

### Week/Month Range Calculation

```typescript
// lib/db/analytics.ts
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, subWeeks } from 'date-fns'

const now = new Date()

const currentWeekRange = {
  start: startOfWeek(now, { weekStartsOn: 1 }), // Monday
  end: endOfWeek(now, { weekStartsOn: 1 }),
}

const currentMonthRange = {
  start: startOfMonth(now),
  end: endOfMonth(now),
}

const heatmapStartDate = subWeeks(now, 52) // HEATMAP_WEEKS from lib/constants.ts
```

**Rules:**
- Always pass `{ weekStartsOn: 1 }` explicitly to `startOfWeek`/`endOfWeek` — date-fns defaults to Sunday (`0`), which would silently shift every weekly analytics bucket by a day if omitted.
- All date-range math for analytics and the heatmap uses date-fns functions exclusively — never manual millisecond arithmetic (`Date.now() - 7 * 24 * 60 * 60 * 1000`) for range boundaries, since that approach breaks around daylight saving time transitions.
- `HEATMAP_WEEKS` (from `lib/constants.ts`) is the single source for how far back the heatmap and any "past N weeks" query looks — never hardcode `52` a second time somewhere else.

---

## lucide-react

**Check first:** Use this file.

### Icon Usage

```tsx
import { Coffee, BarChart2, Clock } from 'lucide-react'

<Coffee size={20} className="text-text-muted" />
```

**Rules:**
- Icons are always imported individually by name (`import { Coffee } from 'lucide-react'`) — never a dynamic string-to-icon lookup and never a wildcard import of the whole package.
- Default icon size is `20` for inline UI icons and `32` for empty-state icons, per `ui-rules.md`.
- Icon color is always set via `className` referencing a text color token (e.g. `text-text-muted`) — never a hardcoded `stroke` or `color` prop with a literal hex value.
- Icons are strictly line-style, single-color — Lucide's default rendering already satisfies this; no `fill` prop is ever set.

---

## clsx

**Check first:** Use this file.

### Variant Class Composition

```tsx
import clsx from 'clsx'

const buttonClasses = clsx(
  'rounded-md px-lg py-sm text-sm font-semibold',
  variant === 'primary' && 'bg-primary text-primary-foreground hover:bg-primary-dark',
  variant === 'secondary' && 'bg-surface border border-border text-text-primary hover:bg-surface-secondary',
  disabled && 'opacity-50 cursor-not-allowed'
)
```

**Rules:**
- `clsx` is used only inside components that accept a `variant` or `state`-style prop and need to switch between multiple predefined class strings (e.g. `Button`, `Badge`) — it is not used as a general substitute for a plain template literal or ternary where only one conditional class is involved.
- Class strings passed to `clsx` are always the exact token-based classes defined in `ui-rules.md` and `ui-registry.md` — `clsx` composes them, it never introduces a new one-off class.
