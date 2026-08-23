# UI Registry

This file is a living record of every UI component actually built in Focaliser. Unlike `ui-tokens.md` (the raw values) and `ui-rules.md` (the general rules), this file tracks concrete, already-implemented components — their exact file path, class recipe, and any non-obvious implementation detail. It is updated by the AI agent immediately after every component is built or meaningfully changed. Its only purpose is to stop pattern drift: two components solving the same visual problem should never diverge because an agent forgot what the first one looked like.

---

## How to Use

1. **Check first** — before writing a new component, search this file for an existing entry that solves the same or a similar UI problem (e.g. any card, any badge, any form input).
2. **If a match exists** — reuse its exact classes and structure from the table below. Do not invent a new recipe for something already solved.
3. **If no match exists** — build the component following `ui-rules.md` and `ui-tokens.md`, then immediately add a new entry to this file in the same section, using the exact table + pattern-notes format shown in the examples below.

---

## Components

### Shared / Global Primitives
`components/ui/` — feature-agnostic building blocks used across every page.

#### Button
**File:** `components/ui/Button.tsx`
**Purpose:** Single button component supporting `primary`, `secondary`, and `ghost` variants via a `variant` prop, used everywhere an action is triggered.
**Last updated:** 2026-08-22

| Property | Class |
|---|---|
| Primary background | `bg-primary` |
| Primary text | `text-primary-foreground` |
| Primary hover | `hover:bg-primary-dark` |
| Primary disabled | `disabled:bg-primary-muted disabled:text-primary-foreground/70 disabled:cursor-not-allowed` |
| Secondary background | `bg-surface border border-border` |
| Secondary text | `text-text-primary` |
| Secondary hover | `hover:bg-surface-secondary` |
| Ghost background | `bg-transparent` |
| Ghost text (default) | `text-focus-fg-muted` (session-screen usage) or `text-text-secondary` (chrome-page usage) |
| Shared radius | `rounded-md` |
| Shared padding | `px-lg py-sm` |
| Shared font | `text-sm font-semibold` |
| Shared focus ring | `focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background` (opacity of ring changes per variant, see `ui-rules.md`) |

**Pattern notes:**
- One component, one `variant` prop (`'primary' | 'secondary' | 'ghost'`) — never create a second Button component or a one-off styled `<button>` elsewhere in the app.
- The `ghost` variant takes an additional `context` prop (`'chrome' | 'session'`) because its default text color differs between light chrome pages and the black `/session` screen — this is the only variant with context-dependent color.
- Active/pressed state (`active:scale-[0.98]`) is only applied to `primary` — `secondary` and `ghost` do not scale on press.

#### Card
**File:** `components/ui/Card.tsx`
**Purpose:** Generic content container used for session summaries, analytics chart wrappers, and any other bordered content block.
**Last updated:** 2026-08-22

| Property | Class |
|---|---|
| Background | `bg-surface` |
| Border | `border border-border` |
| Radius | `rounded-lg` |
| Padding | `p-lg` |
| Shadow (default) | `shadow-[var(--shadow-card)]` |
| Shadow (hover) | `hover:shadow-[var(--shadow-card-hover)]` |
| Status accent (optional) | `border-l-4 border-l-{status-color}` — only when the card represents a session status |

**Pattern notes:**
- Accepts an optional `accentColor` prop (e.g. `success`, `primary`) that adds the `border-l-4` left bar — used for session-status cards in Past Sessions. Omit the prop entirely for neutral cards (e.g. analytics chart containers).
- Never apply a colored background to this component, even via a prop — color enters only through `accentColor` (left bar) or a nested `Badge`.

#### Input
**File:** `components/ui/Input.tsx`
**Purpose:** Form input primitive supporting optional labels, error state messaging, helper text, and disabled styling.
**Last updated:** 2026-08-22

| Property | Class |
|---|---|
| Default container | `w-full flex flex-col gap-xs` |
| Label text | `text-xs font-semibold uppercase tracking-[0.04em] text-text-secondary` |
| Default input surface | `bg-surface border border-border rounded-md px-md py-sm text-sm text-text-primary placeholder:text-text-muted` |
| Focus ring | `focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none` |
| Error state input | `border-error focus:border-error focus:ring-2 focus:ring-error/20` |
| Error helper text | `text-error text-xs font-medium` |
| Helper text | `text-text-muted text-xs` |
| Disabled state | `bg-surface-muted text-text-muted cursor-not-allowed` |

**Pattern notes:**
- Automatically links label `htmlFor` with input `id` using React's `useId()` when explicit `id` is not provided.
- Never use a hardcoded color or custom font size outside the defined tokens.

#### Badge
**File:** `components/ui/Badge.tsx`
**Purpose:** Status indicator badge for session states (`completed`, `active`, `abandoned`, `on_break`).
**Last updated:** 2026-08-22

| Property | Class |
|---|---|
| Shape & padding | `rounded-full px-sm py-xs text-xs font-medium inline-flex items-center justify-center select-none` |
| `completed` status | `bg-success-light text-success` |
| `active` status | `bg-primary-light text-primary` |
| `abandoned` status | `bg-surface-muted text-text-muted` |
| `on_break` status | `bg-break-muted text-break-foreground` |

**Pattern notes:**
- Always pairs background and text tokens from the exact same semantic group.
- `on_break` variant exists for state definitions but is only rendered on the fullscreen session display.


---

### Navigation
`components/nav/`

#### TopNav
**File:** `components/nav/TopNav.tsx`
**Purpose:** Global header navigation bar providing logo and primary tab navigation across chrome pages, automatically omitted on `/session`.
**Last updated:** 2026-08-22

| Property | Class |
|---|---|
| Container | `bg-surface border-b border-border h-16 w-full` |
| Inner wrapper | `max-w-5xl mx-auto px-xl h-full flex items-center justify-between` |
| Logo text | `text-text-primary font-semibold text-base tracking-tight hover:opacity-90` |
| Tab link (inactive) | `text-text-secondary hover:text-text-primary text-sm font-medium transition-colors` |
| Tab link (active, planned) | `text-primary font-semibold border-b-2 border-primary` |

**Pattern notes:**
- Client Component using `usePathname()`. Returns `null` when `pathname === '/session'` so the session screen remains zero-chrome.
- Always matches the standard `max-w-5xl mx-auto px-xl` horizontal grid constraint of page wrappers below it.


---

### Home (`/`)
`app/page.tsx`, `components/timer/`

#### DurationPicker
**File:** `components/timer/DurationPicker.tsx`
**Purpose:** iOS-style 3-column scroll-wheel selector for Hours (0-12), Minutes (0-59), and Seconds (0-59) with snap alignment.
**Last updated:** 2026-08-23

| Property | Class |
|---|---|
| Card container | `bg-surface border border-border rounded-lg p-lg shadow-[var(--shadow-card)] flex items-center justify-center gap-md md:gap-lg w-full max-w-sm mx-auto` |
| Column label | `text-xs font-semibold uppercase tracking-wider text-text-secondary mb-sm` |
| Selection highlight box | `absolute inset-x-0 h-[44px] rounded-md bg-surface-secondary border border-border` |
| Column scroll container | `w-full h-full overflow-y-auto snap-y snap-mandatory scrollbar-none outline-none focus-visible:ring-2 focus-visible:ring-primary/20 rounded-md` |
| Selected row numeral | `text-primary font-semibold text-2xl scale-110 font-mono tabular-nums` |
| Unselected row numeral | `text-text-muted text-lg hover:text-text-secondary opacity-60 hover:opacity-90 font-mono tabular-nums` |
| Separator colon | `text-text-muted font-mono font-bold text-xl pt-6` |

**Pattern notes:**
- Pure CSS snap (`snap-y snap-mandatory`) with padding spacers (2 rows top/bottom) for zero external dependencies.
- Synchronizes with keyboard/mouse wheel/touch events and automatically scrolls to initial value on mount.

#### LabelInput
**File:** `components/timer/LabelInput.tsx`
**Purpose:** Form input for optional session label with live character counter enforcing max length.
**Last updated:** 2026-08-23

| Property | Class |
|---|---|
| Container | `w-full max-w-sm mx-auto flex flex-col gap-xs` |
| Input | Uses `Input` primitive with `label="Session Label (Optional)"` and `placeholder="What are you focusing on?"` |
| Counter | `text-text-muted text-xs tabular-nums text-right` |

**Pattern notes:**
- Enforces `SESSION_LABEL_MAX_LENGTH` (200) client-side.

#### PlayButton
**File:** `components/timer/PlayButton.tsx`
**Purpose:** Circular primary action button to trigger focus session start.
**Last updated:** 2026-08-23

| Property | Class |
|---|---|
| Button container | `w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-[var(--shadow-card)] transition-all cursor-pointer` |
| Hover state | `hover:bg-primary-dark hover:shadow-[var(--shadow-card-hover)]` |
| Active state | `active:bg-primary-dark active:scale-95` |
| Focus ring | `focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background` |
| Disabled state | `disabled:bg-primary-muted disabled:text-primary-foreground/70 disabled:cursor-not-allowed` |
| Play Icon | `Lucide Play (w-7 h-7 fill-current translate-x-0.5)` |
| Loading Spinner | `Lucide Loader2 (w-7 h-7 animate-spin text-primary-foreground)` |

**Pattern notes:**
- Circular shape (`rounded-full`) reserved specifically for the primary timer start action. Shows animated spinner when `isLoading` is true.

---

### Fullscreen Session (`/session`)
`app/session/page.tsx`, `components/timer/`

#### FocusCountdown
`components/timer/FocusCountdown.tsx`
<!-- ← Agent fills this in when built -->

#### BreakStopwatch
`components/timer/BreakStopwatch.tsx`
<!-- ← Agent fills this in when built -->

#### SessionEndAlert
`components/timer/SessionEndAlert.tsx`
<!-- ← Agent fills this in when built -->

---

### Analytics (`/analytics`)
`app/analytics/page.tsx`, `components/analytics/`

#### FocusTimeChart
`components/analytics/FocusTimeChart.tsx`
<!-- ← Agent fills this in when built -->

#### BreakChart
`components/analytics/BreakChart.tsx`
<!-- ← Agent fills this in when built -->

#### AveragesSummary
`components/analytics/AveragesSummary.tsx`
<!-- ← Agent fills this in when built -->

---

### Past Sessions (`/history`)
`app/history/page.tsx`, `components/history/`

#### SessionList
`components/history/SessionList.tsx`
<!-- ← Agent fills this in when built -->

#### Heatmap
`components/history/Heatmap.tsx`
<!-- ← Agent fills this in when built -->

#### History Empty State
`components/history/EmptyHistory.tsx`
<!-- ← Agent fills this in when built -->

---

### Auth (`/login`, `/signup`)
`app/login/page.tsx`, `app/signup/page.tsx`, `components/auth/`

#### AuthForm
**File:** `components/auth/AuthForm.tsx`
**Purpose:** Client component providing authenticated sign-in (email/password & magic link) and sign-up with field validation, error card notices, and loading states.
**Last updated:** 2026-08-22

| Property | Class |
|---|---|
| Card container | `Card` wrapper (`w-full max-w-md mx-auto flex flex-col gap-lg`) |
| Form heading | `text-xl font-semibold text-text-primary mb-xs` |
| Subtitle text | `text-sm text-text-secondary` |
| Error notice | `<Card accentColor="error" className="py-sm px-md">` with `text-error text-xs font-medium` |
| Success notice | `<Card accentColor="success" className="py-sm px-md">` with `text-success text-xs font-medium` |
| Submit button | `<Button variant="primary" className="w-full">` |
| Magic link toggle | `<Button variant="ghost" context="chrome" className="w-full text-xs">` |
| Footer divider & link | `border-t border-border-light pt-md text-center`, `text-primary font-medium hover:underline` |

**Pattern notes:**
- Consumes `@/lib/supabase/client` to execute `signInWithPassword`, `signUp`, and `signInWithOtp`.
- Never displays raw database error details; wraps all exceptions into clear, actionable user messages.


---

## Patterns & Conventions

**Page layout pattern**
- Max content width: `max-w-5xl` (1024px), centered with `mx-auto`
- Horizontal padding: `px-xl` (2rem / 32px)
- Vertical top padding: `py-2xl` (3rem / 48px)
- Gap between major sections: `gap-xl` (2rem / 32px)
- Standard wrapper used on `/`, `/analytics`, `/history`, `/login`, `/signup`:
  ```tsx
  <div className="max-w-5xl mx-auto px-xl py-2xl">
  ```
- `/session` never uses this wrapper — it is fullscreen (`w-screen h-screen`) with no max-width constraint.

**Typography patterns**
| Use case | Classes |
|---|---|
| Hero heading ("Ready to focus?") | `text-4xl font-bold text-text-primary leading-[1.1]` (desktop), `text-3xl` at mobile breakpoint |
| Section heading | `text-2xl font-semibold text-text-primary leading-[1.2]` |
| Card title | `text-lg font-semibold text-text-primary leading-[1.3]` |
| Body text | `text-base font-normal text-text-primary leading-[1.5]` |
| Secondary text | `text-sm font-normal text-text-secondary leading-[1.5]` |
| Muted text (timestamps, captions) | `text-xs font-medium text-text-muted leading-[1.4]` |
| Stat number | `text-3xl font-semibold text-text-primary font-mono` with `font-variant-numeric: tabular-nums` |
| Timer/stopwatch numerals | `font-mono` at `clamp(4rem, 20vw, 12rem)`, `font-medium`, tabular-nums |

**Responsive patterns**
- Breakpoints follow Tailwind v4 defaults: `sm` 640px, `md` 768px, `lg` 1024px, `xl` 1280px.
- Page horizontal padding scales down on mobile: `px-xl` (32px) on `md:` and above, `px-lg` (24px) below `md:`.
- Analytics chart grid: two-column grid (`grid-cols-2 gap-lg`) at `md:` and above, single column (`grid-cols-1`) below `md:`.
- Past Sessions table collapses to a stacked card list below `md:` — each row becomes a `Card` component instead of a table row; do not attempt to horizontally scroll the table on mobile.
- The fullscreen session screen (`/session`) has no responsive breakpoints — the `clamp()` on the numeral font size handles all viewport sizes fluidly instead of discrete breakpoint rules.

**Shared custom CSS classes (defined once, reused across components)**
| Class / variable | Defined in | Used by |
|---|---|---|
| `--shadow-card` | `app/globals.css` `:root` | `Card`, any future bordered container |
| `--shadow-card-hover` | `app/globals.css` `:root` | `Card` hover state |
| `tabular-nums` (Tailwind utility) | Tailwind core | `FocusCountdown`, `BreakStopwatch`, `AveragesSummary` stat numbers |
