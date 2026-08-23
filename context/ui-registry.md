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
**Last updated:** 2026-08-23

| Property | Class |
|---|---|
| Container | `bg-surface border-b border-border h-16 w-full sticky top-0 z-40` |
| Inner wrapper | `max-w-5xl mx-auto px-lg md:px-xl h-full flex items-center justify-between` |
| Logo text | `text-text-primary font-semibold text-base tracking-tight hover:opacity-90 transition-opacity` |
| Tab link (inactive) | `h-full inline-flex items-center text-sm transition-colors border-b-2 border-transparent text-text-secondary hover:text-text-primary font-medium` |
| Tab link (active) | `h-full inline-flex items-center text-sm transition-colors border-b-2 border-primary text-primary font-semibold` |

**Pattern notes:**
- Client Component using `usePathname()`. Returns `null` when `pathname === '/session'`, `/login`, or `/signup` so distraction-free and auth flows remain zero-chrome.
- Matches `max-w-5xl mx-auto px-lg md:px-xl` responsive grid constraint of page wrappers below it.


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
**File:** `components/timer/FocusCountdown.tsx`
**Purpose:** Fullscreen countdown display in pure black (`bg-focus-bg`) with large white numerals (`text-focus-fg`), hover blur effect, and ghost buttons ("Take a break?", "Stop session?").
**Last updated:** 2026-08-23

| Property | Class |
|---|---|
| Screen container | `w-screen h-screen bg-focus-bg flex flex-col items-center justify-center relative select-none overflow-hidden` |
| Numerals (default) | `font-mono tabular-nums text-focus-fg font-medium tracking-tight text-[clamp(4rem,18vw,14rem)] leading-none blur-none opacity-100 scale-100` |
| Numerals (hovered) | `blur-md opacity-30 scale-[0.98]` |
| Primary action ("Take a break?") | `text-focus-fg-muted hover:text-focus-fg text-base md:text-lg font-medium transition-colors hover:underline underline-offset-8` |
| Secondary action ("Stop session?") | `text-focus-fg-muted hover:text-focus-fg text-xs md:text-sm font-medium opacity-75 hover:opacity-100 transition-all hover:underline underline-offset-4` |

**Pattern notes:**
- Framer Motion 200ms fade transition for action overlay on hover.
- Idle timeout (3 seconds) automatically restores sharp numerals if mouse is idle.

#### BreakStopwatch
**File:** `components/timer/BreakStopwatch.tsx`
**Purpose:** Fullscreen stopwatch display in muted terracotta red (`text-break`) counting up from 0:00 with hover reveal ("Focus again?").
**Last updated:** 2026-08-23

| Property | Class |
|---|---|
| Screen container | `w-screen h-screen bg-focus-bg flex flex-col items-center justify-center relative select-none overflow-hidden` |
| Numerals (default) | `font-mono tabular-nums text-break font-medium tracking-tight text-[clamp(4rem,18vw,14rem)] leading-none blur-none opacity-100 scale-100` |
| Numerals (hovered) | `blur-md opacity-30 scale-[0.98]` |
| Action ("Focus again?") | `text-focus-fg-muted hover:text-focus-fg text-base md:text-lg font-medium transition-colors hover:underline underline-offset-8` |

**Pattern notes:**
- Stop session control is omitted during break state per product specification.

#### SessionEndAlert
**File:** `components/timer/SessionEndAlert.tsx`
**Purpose:** Gradual 2-second visual pulse alerting session completion before redirecting.
**Last updated:** 2026-08-23

| Property | Class |
|---|---|
| Screen container | `w-screen h-screen bg-focus-bg flex flex-col items-center justify-center relative select-none overflow-hidden` |
| Pulsing numerals | `font-mono tabular-nums text-focus-fg font-medium tracking-tight text-[clamp(4rem,18vw,14rem)] leading-none` |
| Animation | `animate={{ opacity: [1, 0.2, 1, 0.2, 1] }}`, transition: `SESSION_END_ALERT_DURATION_MS` (2s), ease: `easeInOut` |

**Pattern notes:**
- Checks `prefers-reduced-motion` to display static `00:00` without flashing if reduced motion is requested.

---

### Analytics (`/analytics`)
`app/analytics/page.tsx`, `components/analytics/`

#### FocusTimeChart
**File:** `components/analytics/FocusTimeChart.tsx`
**Purpose:** Responsive Recharts bar chart displaying daily focus time in minutes using single series `--color-primary` (`#5B5FEF`).
**Last updated:** 2026-08-23

| Property | Class |
|---|---|
| Card wrapper | `Card` (`flex flex-col gap-md w-full`) |
| Section header | `text-sm font-semibold uppercase tracking-[0.04em] text-text-secondary` |
| Axis tick text | `12px font-sans fill-[#8C8A86]` (matches `--color-text-muted`) |
| Bar fill | `#5B5FEF` (`--color-primary`), `radius={[4, 4, 0, 0]}` |
| Tooltip | `bg-surface border border-border rounded-md px-md py-xs shadow-[var(--shadow-card)]` |

**Pattern notes:**
- Disables initial mount animations (`isAnimationActive={false}`) for immediate distraction-free rendering.

#### BreakChart
**File:** `components/analytics/BreakChart.tsx`
**Purpose:** Responsive Recharts bar chart displaying daily break minutes and counts in `--color-break` (`#D98C82`).
**Last updated:** 2026-08-23

| Property | Class |
|---|---|
| Card wrapper | `Card` (`flex flex-col gap-md w-full`) |
| Section header | `text-sm font-semibold uppercase tracking-[0.04em] text-text-secondary` |
| Bar fill | `#D98C82` (`--color-break`), `radius={[4, 4, 0, 0]}` |

**Pattern notes:**
- Tooltip displays both formatted break duration and count.

#### AveragesSummary
**File:** `components/analytics/AveragesSummary.tsx`
**Purpose:** 4-card glanceable grid summarizing total focus time, average session length, total breaks, and average break duration.
**Last updated:** 2026-08-23

| Property | Class |
|---|---|
| Grid container | `grid grid-cols-2 lg:grid-cols-4 gap-md w-full` |
| Card item | `Card` (`flex flex-col gap-xs`) |
| Card title | `text-xs font-semibold uppercase tracking-[0.04em] text-text-secondary` |
| Stat numeral | `text-3xl font-semibold text-text-primary font-mono tabular-nums leading-tight` |
| Subtext | `text-xs text-text-muted mt-xs` |

**Pattern notes:**
- Numerals use `font-mono tabular-nums` for alignment stability.

#### EmptyAnalytics
**File:** `components/analytics/EmptyAnalytics.tsx`
**Purpose:** Empty state displayed when no completed sessions exist for the selected period.
**Last updated:** 2026-08-23

| Property | Class |
|---|---|
| Container | `Card` (`flex flex-col items-center justify-center py-3xl px-xl text-center gap-md w-full`) |
| Icon | `Lucide BarChart2 (size 36 text-text-muted stroke-[1.5])` |
| Title | `text-base font-semibold text-text-primary` |
| Helper text | `text-sm text-text-secondary` |
| CTA Button | `<Button variant="primary">Start a Focus Session</Button>` |

---

### Past Sessions (`/history`)
`app/history/page.tsx`, `components/history/`

#### SessionList
**File:** `components/history/SessionList.tsx`
**Purpose:** Displays chronological focus session logs in a desktop table and collapses to stacked cards on mobile devices.
**Last updated:** 2026-08-23

| Property | Class |
|---|---|
| Table container (desktop) | `hidden md:block w-full overflow-hidden bg-surface border border-border rounded-lg shadow-[var(--shadow-card)]` |
| Table header | `bg-surface-secondary text-text-secondary text-xs font-semibold uppercase tracking-wide border-b border-border` |
| Table row | `hover:bg-surface-secondary transition-colors` |
| Cell padding | `px-md py-sm` |
| Stacked card list (mobile) | `flex md:hidden flex-col gap-sm` |

**Pattern notes:**
- Integrates `Badge` component for session statuses (`completed`, `active`, `abandoned`, `on_break`).
- Formats dates with `date-fns` and numbers with `font-mono`.

#### Heatmap
**File:** `components/history/Heatmap.tsx`
**Purpose:** 52-week calendar activity heatmap rendering daily focus time intensity in 4 discrete tints of `--color-primary`.
**Last updated:** 2026-08-23

| Property | Class |
|---|---|
| Card wrapper | `Card` (`flex flex-col gap-md w-full`) |
| Scroll container | `w-full overflow-x-auto pb-xs` with `min-w-[640px]` inner container |
| Legend swatches | `w-3 h-3 rounded-xs` with `.heatmap-scale-0` through `.heatmap-scale-3` |

**Pattern notes:**
- `showWeekdayLabels={false}` to maintain clean minimal layout without day-of-week clutter.
- Legend swatches use token background classes (`bg-surface-muted`, `bg-primary-light`, `bg-primary-muted`, `bg-primary`).
- Includes native SVG tooltips showing date and focused duration.

#### History Empty State
**File:** `components/history/EmptyHistory.tsx`
**Purpose:** Empty state displayed when user has zero recorded sessions in history.
**Last updated:** 2026-08-23

| Property | Class |
|---|---|
| Container | `Card` (`flex flex-col items-center justify-center py-3xl px-xl text-center gap-md w-full`) |
| Icon | `Lucide Clock (size 36 text-text-muted stroke-[1.5])` |
| Title | `text-base font-semibold text-text-primary` |
| Helper text | `text-sm text-text-secondary` |
| CTA Button | `<Button variant="primary">Start a Focus Session</Button>` |

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
