# Build Plan

## Core Principle

Every feature area is built UI-first with mock/hardcoded data, verified visually against `ui-tokens.md` and `ui-rules.md`, and only then wired to real logic — a real database table, a real API route, or a real client-side engine (timer worker, Supabase Auth). No phase produces invisible backend work with nothing to look at; if a feature can't be opened in the browser and checked against something concrete, it isn't scoped correctly and should be split. This project does not use PostHog or any analytics/tracking service, per `architecture.md` and `code-standards.md`, so no "PostHog events" line appears anywhere in this plan.

---

## Phase 1 — Foundation

### 01 Project Scaffold & Global Shell
**UI:**
- Root layout (`app/layout.tsx`) rendering `<html>`/`<body>` with the Inter and JetBrains Mono font variables applied
- Full Tailwind v4 `@theme` token block copied into `app/globals.css` exactly per `ui-tokens.md` (all color, font, radius, and spacing variables)
- `components/nav/TopNav.tsx`: logo text "Focaliser" (`text-text-primary font-semibold`) linking to `/`, two static tab links "Analytics" and "Past Sessions" rendered with inactive styling only (no active-route detection yet)
- Stub pages for every route, each rendering only a page-level heading naming the page, inside the standard `max-w-5xl mx-auto px-xl py-2xl` wrapper (`/` "Home", `/analytics` "Analytics", `/history` "History", `/login` "Login", `/signup` "Signup"), plus `app/session/page.tsx` as a bare, wrapper-less black-background stub
**Logic:**
- `next.config.ts`, `tsconfig.json` (`strict: true`, `@/*` path alias) configured
- No data fetching and no auth checks anywhere yet — every stub page renders unconditionally for any visitor
- Testable outcome: running the dev server shows a navbar and six distinct pages reachable by URL, with no console errors.

### 02 Design Token System & Shared UI Primitives
**UI:**
- `components/ui/Button.tsx` built with `primary`, `secondary`, and `ghost` variants, covering every state (default, hover, active, focus-visible, disabled) exactly per `ui-rules.md`'s Buttons section
- `components/ui/Card.tsx` with the optional `accentColor` left-bar prop
- `components/ui/Input.tsx` with default, focus, error, and disabled states
- `components/ui/Badge.tsx` with the four session-status variants (`active`, `completed`, `on_break`, `abandoned`)
- A temporary, unlinked internal route `app/dev/preview/page.tsx` rendering every component and every variant/state side by side for visual comparison against `ui-tokens.md`
**Logic:**
- `lib/constants.ts` created with every constant from `code-standards.md` (`DEFAULT_DURATION_SECONDS`, `MIN_SESSION_DURATION_SECONDS`, `MAX_SESSION_DURATION_SECONDS`, `SESSION_LABEL_MAX_LENGTH`, `SESSIONS_PAGE_SIZE`, `HEATMAP_WEEKS`, `SESSION_END_ALERT_DURATION_MS`)
- `clsx` installed and used inside `Button.tsx`/`Badge.tsx` for variant class composition
- Testable outcome: `/dev/preview` visually confirms every primitive and every state matches `ui-tokens.md`/`ui-rules.md` before any real page consumes them.

### 03 Database Schema & Row Level Security
**UI:** None — this feature has no dedicated screen; its output is verified directly against the database.
**Logic:**
- Supabase project created; `supabase/migrations/0001_init.sql` defines `user_settings`, `focus_sessions`, and `breaks` exactly per `architecture.md`'s Database Schema, including the `status` `CHECK` constraint and all foreign keys with `on delete cascade`
- RLS enabled on all three tables; policies restrict `SELECT`/`INSERT`/`UPDATE`/`DELETE` to rows where `user_id = auth.uid()`
- `lib/types/database.types.ts` generated via the Supabase CLI (`supabase gen types typescript`)
- Testable outcome: `supabase db reset` applies cleanly with no errors; inserting a row as one test user and querying as a second test user returns zero rows, confirming RLS.

### 04 Authentication — Static UI
**UI:**
- `app/login/page.tsx`: heading, email `Input`, password `Input`, "Log in" primary `Button`, "Send magic link instead" ghost `Button`, link to `/signup`
- `app/signup/page.tsx`: heading, email `Input`, password `Input`, "Create account" primary `Button`, link to `/login`
- Empty-field validation shown via `Input`'s error state, driven entirely by local component state
**Logic:**
- Form submission on both pages is a no-op that only logs to console — no Supabase Auth calls yet
- Testable outcome: both forms render, accept input, and show local validation errors, with no backend wired.

### 05 Authentication — Wire to Supabase Auth
**UI:**
- Primary button on both forms gains a loading state (disabled, label changes to "Logging in…" / "Creating account…") during the real request
- A real error state is shown via `Card` with `accentColor="error"` on failed login/signup, displaying a generic message per `code-standards.md`'s Error Handling rules
**Logic:**
- `app/login/page.tsx` and `app/signup/page.tsx` call `lib/supabase/client.ts`'s `createClient()` and `supabase.auth.signInWithPassword()` / `signUp()` / `signInWithOtp()`
- `app/auth/callback/route.ts` implemented to exchange the magic-link code and redirect to `/`
- `middleware.ts` + `lib/supabase/middleware.ts` implemented: unauthenticated visitors to `/`, `/session`, `/analytics`, or `/history` are redirected to `/login`; authenticated visitors to `/login`/`/signup` are redirected to `/`
- `TopNav` updated to render only when an authenticated session exists
- Testable outcome: creating an account, logging out, and logging back in works end-to-end against the real Supabase project; visiting `/` while logged out redirects to `/login`.

---

## Phase 2 — Home & Start Session Flow

### 06 Home Page — Static UI
**UI:**
- `app/page.tsx` hero heading "Ready to focus?" (`text-4xl font-bold`), centered above the controls
- `components/timer/DurationPicker.tsx`: three-column iOS-style scroll wheel (hours/minutes/seconds), starting at the hardcoded `DEFAULT_DURATION_SECONDS` value, fully interactive scroll/snap behavior
- `components/timer/LabelInput.tsx`: single `Input`, placeholder "What are you focusing on?", enforces `SESSION_LABEL_MAX_LENGTH` client-side with a `text-text-muted` character counter
- `components/timer/PlayButton.tsx`: circular primary `Button` with a Lucide `Play` icon, navigates to `/session` passing the picker's local values via client state only — no session is created yet
**Logic:**
- All state (selected duration, label) held in local `useState` in `app/page.tsx` — no API calls, no Zustand store yet
- Testable outcome: a user can scroll to a duration, type a label, click play, and land on a static `/session` screen showing that duration, entirely client-side with no persistence.

### 07 Home Page — Wire Session Creation
**UI:**
- `PlayButton` gains a disabled/loading state while the create-session request is in flight
- An inline error message (`text-error text-sm`) appears below the play button if session creation fails
**Logic:**
- `lib/db/sessions.ts`: `createSession()` implemented exactly per `library-docs.md`'s Supabase DB Queries pattern
- `lib/validation/session.ts`: `createSessionSchema` (Zod) implemented; `app/api/sessions/route.ts` `POST` handler implemented per `code-standards.md`'s API Route Handlers pattern
- `lib/timer/useFocusSession.ts` (Zustand store) created; `startSession()` calls `POST /api/sessions` and stores the returned `sessionId`
- `app/page.tsx` replaced local-only navigation with a call to `useFocusSession.startSession()`, navigating to `/session` only after the row is created
- Home page (Server Component) fetches the user's `user_settings.default_duration_seconds` to set `DurationPicker`'s initial value instead of the hardcoded constant
- Testable outcome: clicking play creates a real `focus_sessions` row (`status: 'active'`) before navigating to `/session`, verifiable in the Supabase table editor.

---

## Phase 3 — Fullscreen Focus Session

### 08 Fullscreen Session Screen — Static UI
**UI:**
- `app/session/page.tsx`: full-viewport `bg-focus-bg` container, no `TopNav`, no page wrapper
- `components/timer/FocusCountdown.tsx`: `font-mono` numerals in `H:MM:SS`/`MM:SS` format, ticking down via a plain client-side `setInterval` (not yet the Web Worker), starting from the duration passed from Home
- Hover-reveal "Take a break?" and "Stop session?" ghost texts, shown/hidden on mouse enter/leave with Framer Motion's 200ms fade, per `ui-rules.md`
- `components/timer/BreakStopwatch.tsx`: `font-mono` numerals in `text-break`, counting up from 0, with hover-reveal "Focus again?" text — reachable via a temporary dev-only toggle, not yet wired to the real break click
**Logic:**
- All timer state is local to the page component (`useState` + `setInterval`) — no Zustand store, no Web Worker, no API calls, no persistence
- Testable outcome: navigating to `/session` shows a ticking countdown with working hover-reveal interactions purely in the browser, visually matching `ui-rules.md` exactly.

### 09 Fullscreen Session — Real Countdown Engine
**UI:** None new — `FocusCountdown` now reflects the Web Worker's authoritative time instead of the local interval.
**Logic:**
- `lib/timer/timerWorker.ts` implemented: ticks down/up independently of the main thread, posting `{ type: 'tick', remainingSeconds }` and `{ type: 'complete' }` messages
- `lib/timer/useFocusSession.ts` extended to spawn and message the worker instead of using `setInterval`
- `lib/timer/sessionBuffer.ts` implemented per `library-docs.md`'s `idb` pattern; `writeSessionBuffer()` called on a throttled interval (every 5 seconds) so a refresh can restore `remainingSeconds`
- On `/session` mount, check for an existing buffer matching the current `sessionId` and restore from it if present
- Testable outcome: backgrounding the tab for 30 seconds shows no countdown drift on return, and refreshing mid-session restores the correct remaining time from the buffer.

### 10 Break Flow — Wire Real Data
**UI:** None new — `BreakStopwatch` is now reachable only via the real "Take a break?" click, and "Focus again?" is the only way back.
**Logic:**
- `lib/db/breaks.ts`: `createBreak()` and `endBreak()` implemented per `architecture.md`'s Database Schema
- `app/api/breaks/route.ts` (`POST`, create) and `app/api/breaks/[id]/route.ts` (`PATCH`, end) implemented
- `useFocusSession.startBreak()` calls `POST /api/breaks`, pauses the worker, sets `status: 'on_break'`; `resumeSession()` calls `PATCH /api/breaks/:id` with the computed duration and sets `status: 'active'`
- `focus_sessions.status` updated alongside the break row changes, matching `architecture.md`'s transition rules
- Testable outcome: clicking "Take a break?" creates a real `breaks` row with `started_at` set; clicking "Focus again?" sets `ended_at` and `duration_seconds` on that same row, verifiable in Supabase.

### 11 Stop Session Early — Wire Real Data
**UI:** None new — "Stop session?" now performs the real stop instead of a no-op.
**Logic:**
- `lib/db/sessions.ts` extended with `updateSessionStatus()` supporting the `'abandoned'` transition
- `app/api/sessions/[id]/route.ts` `PATCH` handler implemented, accepting `{ status: 'abandoned', ended_at, actual_focus_seconds }`
- `useFocusSession.stopSession()` reads elapsed focus time from the worker, calls the `PATCH` endpoint, calls `clearSessionBuffer()`, resets the store, and navigates to `/`
- Client-side enforcement that "Stop session?" is only rendered/clickable while `status === 'active'`, never `'on_break'`, per `ui-rules.md`
- Testable outcome: clicking "Stop session?" mid-focus immediately returns to `/`; the session's row shows `status: 'abandoned'` with an accurate `actual_focus_seconds`.

### 12 Session Completion — Wire Real Data
**UI:**
- `components/timer/SessionEndAlert.tsx` implemented: the Framer Motion gradual opacity pulse (`SESSION_END_ALERT_DURATION_MS`, 2000ms) replacing the countdown at zero, respecting `prefers-reduced-motion`
**Logic:**
- `timerWorker.ts` posts `{ type: 'complete' }` when `remainingSeconds` reaches 0
- `useFocusSession.completeSession()` calls the same `PATCH /api/sessions/:id` endpoint with `status: 'completed'` and `actual_focus_seconds` equal to the full planned duration, then calls `clearSessionBuffer()` and navigates to `/` after the alert finishes
- Testable outcome: a short test session (e.g. 10 seconds) run to completion shows the gradual alert, then returns to `/`, with the session row showing `status: 'completed'`.

---

## Phase 4 — Analytics

### 13 Analytics Page — Static UI
**UI:**
- `app/analytics/page.tsx`: section headings "This Week" and "This Month"
- `components/analytics/FocusTimeChart.tsx` and `components/analytics/BreakChart.tsx` rendered once per period using hardcoded mock data arrays
- `components/analytics/AveragesSummary.tsx`: stat-number cards (average session length, average break count, average break duration) using mock numbers, styled per `ui-rules.md`'s stat-number typography
**Logic:**
- All chart/summary data is a hardcoded mock array/object defined at the top of the page file — no Supabase calls
- Testable outcome: `/analytics` visually matches the intended dashboard layout using fake numbers, before any real aggregation exists.

### 14 Analytics — Wire Real Aggregation
**UI:**
- Empty state added (per `ui-rules.md`'s Empty States rules) in place of any chart/summary when the user has zero completed sessions in the given period
**Logic:**
- `lib/db/analytics.ts`: `getWeeklySummary()` and `getMonthlySummary()` implemented using date-fns ranges exactly per `library-docs.md`, querying `focus_sessions`/`breaks` filtered by `user_id` and `status = 'completed'`
- `app/api/analytics/route.ts` `GET` handler implemented for any future client-side refetch need
- `app/analytics/page.tsx` (Server Component) replaces the mock arrays with real calls to `lib/db/analytics.ts`, passed as props to the chart/summary components
- Testable outcome: completing two or three real sessions from Phase 3 and revisiting `/analytics` shows real, correct totals and averages matching the Supabase tables.

---

## Phase 5 — Past Sessions & History

### 15 Past Sessions List — Static UI
**UI:**
- `app/history/page.tsx`: section heading "Past Sessions"
- `components/history/SessionList.tsx` rendered with a hardcoded mock array of 5–8 sessions, each row showing label, date, planned vs. actual duration, break count, and a `Badge` matching its mock status
- Row hover state and header styling per `ui-rules.md`'s Tables section
**Logic:**
- Mock data array defined at the top of the page file — no Supabase calls
- Testable outcome: `/history` visually matches the intended list layout and badge states using fake data.

### 16 Past Sessions — Wire Real Data
**UI:**
- `components/history/EmptyHistory.tsx` implemented per `ui-rules.md`'s Empty States rules, shown when the user has zero sessions
**Logic:**
- `lib/db/sessions.ts`: `listSessions()` implemented with pagination using `SESSIONS_PAGE_SIZE`, ordered reverse-chronologically by `started_at`
- `app/history/page.tsx` (Server Component) replaces the mock array with a real call to `listSessions(userId)`
- Testable outcome: `/history` shows the real sessions created during Phase 2–3 testing, correctly ordered and paginated, and shows the empty state for a brand-new test account.

### 17 Heatmap — Static UI
**UI:**
- `components/history/Heatmap.tsx` rendered alongside `SessionList` using a hardcoded mock daily-totals array covering `HEATMAP_WEEKS` weeks, using the 4-step color scale exactly as defined in `library-docs.md` and `ui-rules.md`
**Logic:**
- Mock daily-totals array defined at the top of the page file
- Testable outcome: the heatmap renders with visually distinct intensity levels using fake data, confirming the CSS bucket classes render correctly.

### 18 Heatmap — Wire Real Data
**UI:** None new — the existing `Heatmap` now reflects real data.
**Logic:**
- `lib/db/analytics.ts`: `getDailyTotals()` implemented, grouping `focus_sessions.actual_focus_seconds` by calendar day for the current user over the last `HEATMAP_WEEKS` weeks
- `app/history/page.tsx` passes the real `getDailyTotals()` result into `Heatmap` instead of the mock array
- Testable outcome: the heatmap reflects actual daily focus totals from real completed sessions, cross-checkable against a specific day's rows in Supabase.

---

## Phase 6 — Polish & Cross-Cutting Consistency

### 19 Responsive & Accessibility Pass
**UI:**
- Apply the responsive patterns from `ui-registry.md` across all pages: the Analytics chart grid collapses to one column below `md:`, the Past Sessions table collapses to stacked `Card` rows below `md:`, page horizontal padding drops to `px-lg` below `md:`
- Verify every focus-visible ring is present on every interactive element (buttons, inputs, nav tabs, hover-reveal texts)
- Verify `prefers-reduced-motion` is respected on both the hover-reveal fade and the end-of-session alert
**Logic:**
- No new data logic — this is a review-and-fix pass across existing components
- Testable outcome: resizing the browser below 768px shows the documented mobile layout for Analytics and Past Sessions, and toggling OS-level reduced motion removes both animations' motion without breaking functionality.

### 20 Registry & Standards Audit
**UI:** None new.
**Logic:**
- Confirm every component built in Phases 1–5 has a corresponding entry in `ui-registry.md`; add any missing entries
- Confirm every library usage matches its documented pattern in `library-docs.md`; correct any drift found
- Confirm every constant referenced across the codebase traces back to `lib/constants.ts`, with no duplicated literals
- Testable outcome: `ui-registry.md` has a filled-in entry for every shipped component, and a manual search for hardcoded hex values, arbitrary Tailwind values, and duplicated numeric literals returns zero results outside `lib/constants.ts` and `ui-tokens.md`.

---

## Feature Count

| Phase | Features | Count |
|---|---|---|
| Phase 1 — Foundation | 01–05 | 5 |
| Phase 2 — Home & Start Session Flow | 06–07 | 2 |
| Phase 3 — Fullscreen Focus Session | 08–12 | 5 |
| Phase 4 — Analytics | 13–14 | 2 |
| Phase 5 — Past Sessions & History | 15–18 | 4 |
| Phase 6 — Polish & Cross-Cutting Consistency | 19–20 | 2 |
| **Total** | | **20** |
