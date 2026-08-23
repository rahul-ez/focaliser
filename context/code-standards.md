# Code Standards

This file defines every engineering convention the AI coding agent must follow when writing code for Focaliser, so that code written in any session reads as if it came from the same senior engineer.

---

## Engineering Mindset

- Read `project-overview.md`, `architecture.md`, `ui-tokens.md`, `ui-rules.md`, and `ui-registry.md` before writing any code that touches a page, component, or table — do not guess at a decision that is already made in one of these files.
- Implement exactly the scope requested. Do not add a feature, page, or table listed under "Features Out of Scope" in `project-overview.md`, even if it seems like a natural extension.
- Every function that touches data (DB query, timer calculation, aggregation) must be written so it can be called and asserted against in isolation — no function that only works when wired into a full page render.
- Prefer the clear, boring solution over the clever one. If a one-liner requires a comment to explain what it does, write it as three plain lines instead.
- Build and verify one component, route, or table at a time. Do not scaffold five empty files across three folders before any one of them works.
- Never let a promise fail silently. Every `async` call either has a `try/catch` or is awaited inside a caller that has one — there is no fire-and-forget mutation in this codebase.
- After writing code that changes a route, a table, or a shared component, check `ui-registry.md` for a conflicting existing pattern before considering the task done.
- If a requirement is ambiguous between two of the provided context files, stop and flag the conflict rather than picking one silently.
- Never mark a task complete without having actually run or statically checked the code path (type-check, or a manual trace through the logic) — "it should work" is not a verification step.
- Immediately after finishing a feature from `build-plan.md`, update `progress-tracker.md` yourself: check off that feature's box, update `Current Status`, and log any non-obvious decision — this is part of finishing the feature, not a follow-up task the human does.

---

## TypeScript

- Strict mode is always on (`"strict": true` in `tsconfig.json`). Never add `"strict": false` or disable an individual strict flag to make code compile faster.
- Never use `any`. If a type is genuinely unknown (e.g. a third-party payload), type it as `unknown` and narrow it with a runtime check before use.
- Never use a type assertion (`as`) to silence a type error. The only acceptable use of `as` is narrowing `unknown` to a known shape immediately after a runtime validation (e.g. a Zod `.parse()` result).
- Every exported function has an explicit return type — never rely on inference for anything exported from `lib/db/*`, `lib/timer/*`, or an API route handler.
- Use `interface` for object shapes that represent data models or component props. Use `type` for unions, intersections, and utility-derived aliases (e.g. `type SessionStatus = 'active' | 'on_break' | 'completed' | 'abandoned'`).
- Every `async` function that can fail (network call, DB query) is wrapped in `try/catch` at the point where the error is first observable — never left to bubble up unhandled to a React render.
- Default to `const`. Use `let` only when a variable is genuinely reassigned (e.g. an accumulator in a loop). Never use `var`.

---

## Next.js App Router Conventions

- Every component is a Server Component by default. Add `"use client"` only when the component needs one of: React state/effects (`useState`, `useEffect`), browser-only APIs (Web Worker, `window`, hover/mouse events), the Zustand store (`useFocusSession`), or a Framer Motion animation that responds to client-side interaction.
- Data fetching happens in Server Components (`app/*/page.tsx`) by calling functions from `lib/db/*` directly — never inside a `useEffect` on the client, per the System Boundaries invariant in `architecture.md`.
- Route Handlers live at `app/api/<resource>/route.ts` (and `app/api/<resource>/[id]/route.ts` for single-item operations), one file per resource, matching the structure defined in `architecture.md`.
- This project's primary mutation pattern is Route Handlers, not Server Actions — established in `architecture.md`'s Data Flow section. Do not introduce Server Actions for session/break/analytics mutations; the "Server Actions" section below exists only in case a future, purely form-based feature (e.g. account settings) is added.
- Every authenticated page (`app/page.tsx`, `app/session/page.tsx`, `app/analytics/page.tsx`, `app/history/page.tsx`) exports `export const dynamic = 'force-dynamic'`, since all data on these pages is per-user and must never be statically cached or shared across users.
- `app/login/page.tsx` and `app/signup/page.tsx` do not set `dynamic` — they render the same form for every visitor and may use the default caching behavior.

---

## File and Folder Naming

- Folder names: `kebab-case` (e.g. `app/session/`, `components/timer/`).
- Component files: `PascalCase.tsx`, one component per file (e.g. `FocusCountdown.tsx` exports only `FocusCountdown`).
- Utility/logic files: `camelCase.ts` (e.g. `useFocusSession.ts`, `timerWorker.ts`).
- No barrel export files (`index.ts` that re-exports from sibling files) anywhere in `components/` or `lib/` — every import points directly at the file that defines the thing being imported. Barrel files are a common source of accidental circular imports and are not used in this codebase.
- API Route Handler files are always named `route.ts`, inside a folder named after the resource in plural form (`app/api/sessions/route.ts`, `app/api/breaks/route.ts`).
- If a Server Action is ever introduced, it lives in a co-located `actions.ts` file inside the relevant route folder (e.g. `app/settings/actions.ts`), never inside a component file.

---

## Component Structure

Every component file follows this exact order:

```tsx
'use client' // 1. Only if the component needs client-side interactivity — omit entirely for Server Components

// 2. External imports (React, Next.js, third-party libraries)
import { useState } from 'react'
import { motion } from 'framer-motion'

// 3. Internal imports (absolute path alias, see Import Aliases)
import { Button } from '@/components/ui/Button'
import { useFocusSession } from '@/lib/timer/useFocusSession'

// 4. Type definitions
interface FocusCountdownProps {
  sessionId: string
  remainingSeconds: number
}

// 5. Component function
export function FocusCountdown({ sessionId, remainingSeconds }: FocusCountdownProps) {
  const [isHovering, setIsHovering] = useState(false)

  return (
    <div className="bg-focus-bg h-screen w-screen">
      {/* component body */}
    </div>
  )
}
```

---

## API Route Handlers

Every Route Handler follows this exact pattern:

```typescript
// app/api/sessions/route.ts
import { createClient } from '@/lib/supabase/server'
import { createSession } from '@/lib/db/sessions'
import { z } from 'zod'

const createSessionSchema = z.object({
  label: z.string().max(200).nullable(),
  planned_duration_seconds: z.number().int().min(60).max(43200),
})

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const parsed = createSessionSchema.safeParse(body)

    if (!parsed.success) {
      return Response.json({ error: 'Invalid request body' }, { status: 400 })
    }

    const session = await createSession(supabase, {
      user_id: user.id,
      ...parsed.data,
    })

    return Response.json({ session }, { status: 201 })
  } catch (error) {
    console.error('[api/sessions:POST]', error)
    return Response.json({ error: 'Failed to create session' }, { status: 500 })
  }
}
```

- Logging prefix format: `console.error('[api/<resource>:<METHOD>]', error)` — always this exact bracketed format, so errors are grep-able across the codebase.
- Success response shape: the created/fetched resource under a key named after the resource (`{ session }`, `{ sessions }`, `{ break }`), matching the pattern established in `architecture.md`.
- Error response shape: always `{ error: string }`, paired with the correct HTTP status code (`400` invalid input, `401` unauthenticated, `404` not found, `500` unexpected failure).
- Request body validation always uses a Zod schema defined at the top of the route file (or imported from a shared schema file if reused) — never manual `if (!body.x)` chains.
- Every route handler's entire body is wrapped in a single `try/catch`; there is no code path that can throw without being caught inside the handler.

---

## Server Actions

Not currently used for sessions, breaks, or analytics — see Next.js App Router Conventions above. If a future purely form-based feature requires one, it follows this exact pattern:

```typescript
'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

interface ActionResult<T> {
  success: boolean
  data?: T
  error?: string
}

export async function updateDefaultDuration(
  durationSeconds: number
): Promise<ActionResult<{ default_duration_seconds: number }>> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'Unauthorized' }
    }

    const { data, error } = await supabase
      .from('user_settings')
      .update({ default_duration_seconds: durationSeconds })
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      console.error('[actions/updateDefaultDuration]', error)
      return { success: false, error: 'Failed to update default duration' }
    }

    revalidatePath('/')
    return { success: true, data }
  } catch (error) {
    console.error('[actions/updateDefaultDuration]', error)
    return { success: false, error: 'Failed to update default duration' }
  }
}
```

- A Server Action never `throw`s back to the caller — it always returns `{ success: false, error: string }` instead.
- Every mutating Server Action calls `revalidatePath` (or `revalidateTag`) for every path whose data it changed, before returning.
- Return shape is always `{ success: boolean, data?: T, error?: string }` — never a bare value, never a thrown exception.

---

## Supabase Client Usage

- Browser-side code (Client Components, the Zustand store) imports the client from `@/lib/supabase/client`, never from `@/lib/supabase/server`.
- Server-side code (Server Components, Route Handlers, Server Actions, middleware) imports the client from `@/lib/supabase/server`, which is `async` and must be awaited: `const supabase = await createClient()`.
- Never instantiate `createBrowserClient` or `createServerClient` directly outside of `lib/supabase/client.ts` and `lib/supabase/server.ts` — every other file imports the factory function, per the System Boundaries invariant in `architecture.md`.
- Common pitfall: forgetting to `await createClient()` in server contexts — the server factory returns a `Promise`, unlike the browser factory, because it reads cookies via `next/headers`.
- Never import `SUPABASE_SERVICE_ROLE_KEY` into any file under `app/`, `components/`, or `lib/timer/` — reserved for trusted server-only tooling only, per `architecture.md` invariant #6.

---

## Error Handling

- Never leave an empty `catch` block. At minimum, every `catch` logs the error with the prefix format below; most also return a user-facing error response or state.
- Console log prefix format: `console.error('[<area>/<file-or-function>]', error)` — e.g. `console.error('[lib/db/sessions:createSession]', error)`, `console.error('[timer/useFocusSession:resumeSession]', error)`.
- User-facing error messages are always short, generic, and non-technical (e.g. "Failed to start session. Try again.") — never surface a raw Postgres error message, stack trace, or Supabase error object to the UI.
- Background/agent-driven code (the Web Worker in `timerWorker.ts`) posts a typed `{ type: 'error', message: string }` message back to the main thread on failure rather than throwing inside the worker, since an uncaught worker exception cannot be caught by the calling component.
- Every API route handler's `catch` block returns a `500` with `{ error: string }` as defined in the API Route Handlers section — it never returns a `200` with an error buried in the body.

---

## Analytics / Tracking Events

Not applicable in v1. Per `architecture.md`, no analytics or telemetry service (e.g. PostHog) is integrated into this project. Do not add `posthog-js`, Google Analytics, or any custom event-tracking calls. If a tracking service is introduced later, every event name, firing condition, and property list must be added to this section before the first call to that service is written.

---

## Environment Variables

| Variable | Used In |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `lib/supabase/client.ts`, `lib/supabase/server.ts` — public Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `lib/supabase/client.ts`, `lib/supabase/server.ts` — public anon key, safe for browser exposure under RLS |
| `SUPABASE_SERVICE_ROLE_KEY` | Reserved for server-only admin tooling/migrations only. Not imported by any application code path in `app/`, `components/`, or `lib/timer/` in v1. |

- Never hardcode a Supabase URL, key, or any other credential directly in source code — always read from `process.env`.
- Only variables prefixed `NEXT_PUBLIC_` are exposed to the browser bundle. Any variable without that prefix (e.g. `SUPABASE_SERVICE_ROLE_KEY`) must never be referenced from a Client Component or any file that could be bundled client-side.
- All environment variables are declared in `.env.local` (git-ignored) and documented in `.env.example` with placeholder values, never real ones.

---

## Constants

Defined once in `lib/constants.ts` and imported everywhere — never hardcoded inline in a component or query function.

| Constant | Value | Usage |
|---|---|---|
| `DEFAULT_DURATION_SECONDS` | `1500` (25 min) | Fallback value for `user_settings.default_duration_seconds` on first use |
| `MIN_SESSION_DURATION_SECONDS` | `60` (1 min) | Lower bound enforced by the scroll-wheel picker and the API validation schema |
| `MAX_SESSION_DURATION_SECONDS` | `43200` (12 hr) | Upper bound enforced by the scroll-wheel picker and the API validation schema |
| `SESSION_LABEL_MAX_LENGTH` | `200` | Max characters accepted for `focus_sessions.label`, enforced client-side and in the Zod schema |
| `SESSIONS_PAGE_SIZE` | `20` | Pagination limit for `GET /api/sessions` and the `/history` list |
| `HEATMAP_WEEKS` | `52` | Number of weeks of history rendered in the `/history` heatmap |
| `SESSION_END_ALERT_DURATION_MS` | `2000` | Minimum transition time for the gradual end-of-session alert, per `ui-rules.md` |

---

## Import Aliases

- The `@/*` alias maps to the project root (configured in `tsconfig.json` `paths`). Every internal import uses this alias — never a relative path that climbs more than one directory level (`../../`).

**Correct:**
```typescript
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/Button'
```

**Incorrect:**
```typescript
import { createClient } from '../../../lib/supabase/server'
import { Button } from '../../ui/Button'
```

- A single-level relative import (`./SomeSiblingFile`) is acceptable only for a file importing its own co-located type-definitions file in the same folder; everything else uses `@/*`.

---

## Comments

- Comments explain *why*, never *what* — the code itself already says what it does. A comment justifying a non-obvious decision (e.g. "denormalized user_id here for direct RLS enforcement, see architecture.md") is good; a comment restating the next line (e.g. `// increment counter` above `count++`) is not written.
- Never commit a `TODO` comment. If work is intentionally deferred, it is tracked outside the codebase (an issue, a task list) — not left as a `// TODO` in committed code.
- No commented-out code is ever committed. Delete it; version control remembers it if it's needed again.

---

## Dependencies

New packages are only added after checking this list first. If a package isn't listed here, propose the addition and the reason before installing it — never install silently mid-task.

**Runtime dependencies**

| Package | Purpose |
|---|---|
| `next` | Framework (App Router) |
| `react`, `react-dom` | UI runtime |
| `typescript` | Language/type-checking |
| `@supabase/supabase-js` | Supabase JS client (underlying SDK) |
| `@supabase/ssr` | Supabase SSR-safe client helpers for Next.js (browser + server factories) |
| `zustand` | Client-side timer/session state machine |
| `framer-motion` | Hover blur/reveal transitions, gradual end-of-session alert |
| `recharts` | Analytics charts (focus time, break time) |
| `react-calendar-heatmap` | Calendar heatmap on `/history` |
| `idb` | IndexedDB wrapper for local session buffering |
| `zod` | Request body / form validation schemas |
| `date-fns` | Date range calculations for weekly/monthly analytics grouping |
| `lucide-react` | Icon set — single-color line icons only, matching the minimal design direction |
| `clsx` | Conditional Tailwind class composition in components with variant props (e.g. `Button`) |

**Styling / build tooling**

| Package | Purpose |
|---|---|
| `tailwindcss` (v4) | Styling, `@theme`-based token system per `ui-tokens.md` |
| `@tailwindcss/postcss` | Tailwind v4 PostCSS integration |

- No UI component library (shadcn/ui, MUI, Chakra, Ant Design) is installed — all components are hand-built against `ui-tokens.md` and `ui-rules.md` using primitives in `components/ui/`.
- No state management library other than Zustand is installed (no Redux, no Recoil, no Jotai).
- No analytics/telemetry package is installed in v1, per the Analytics/Tracking Events section above.
- No animation library other than Framer Motion is installed.
