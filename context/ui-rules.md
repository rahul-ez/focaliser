# UI Rules

This file translates `ui-tokens.md` into direct build rules: every value below is pulled from that token file — if a rule and a token ever appear to disagree, `ui-tokens.md` is authoritative and this file should be corrected to match it.

---

## Font

```tsx
// app/layout.tsx
import { Inter, JetBrains_Mono } from 'next/font/google'

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' })
const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono' })

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="font-sans">{children}</body>
    </html>
  )
}
```

- Apply both font variable classes on `<html>`, and apply `font-sans` as the default on `<body>`.
- `font-mono` is only ever applied explicitly, at the element level, to numerals (see Typography Hierarchy).
- Never use `system-ui`, `-apple-system`, or `Arial` as the primary rendered font — those exist in the token stack only as fallback values, not as the intended typeface.

---

## Layout

| Property | Value |
|---|---|
| Max page content width | `max-w-5xl` (1024px), centered with `mx-auto` |
| Horizontal page padding | `px-xl` (2rem / 32px) |
| Vertical page padding (top of page content) | `py-2xl` (3rem / 48px) |
| Gap between major sections on a page | `gap-xl` (2rem / 32px) |
| Header (TopNav) height | `4rem` (64px), fixed exact value, not min-height |
| Navigation type | Single top navbar, no sidebar, no bottom nav |

Every page (`/`, `/analytics`, `/history`) uses the same content wrapper: `<div className="max-w-5xl mx-auto px-xl py-2xl">`. `/session` does not use this wrapper — it is fullscreen and ignores the max-width constraint entirely.

---

## Navigation

- Navbar container: `bg-surface border-b border-border h-16 w-full`. Inner content is constrained to `max-w-5xl mx-auto px-xl`, same as page content, so nav items align with the page below.
- Active tab (current route): `text-primary font-semibold`, with a `border-b-2 border-primary` applied to the tab itself (not the whole navbar) as the underline.
- Inactive tab: `text-text-secondary font-medium`, no border.
- Inactive tab hover: `hover:text-text-primary`. Never add an underline on hover — underline is reserved exclusively for the active state.
- The logo/wordmark on the left of the navbar links to `/` and uses `text-text-primary font-semibold`, never `text-primary`.
- `<TopNav />` is never rendered on `/session` — confirmed by checking the route's `page.tsx` renders no navbar element at all, not a hidden or transparent one.

---

## Cards

```tsx
<div className="bg-surface border border-border rounded-lg p-lg shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-card-hover)]">
  {/* card content */}
</div>
```

- Cards never use a colored (non-neutral) background. The card container background is always `bg-surface`.
- Color is introduced only two ways: (1) a badge placed inside the card (see Badges), or (2) a `border-l-4` left accent bar in a status color (e.g. `border-l-4 border-l-success` on a completed-session card), applied to the card's left edge only, never the full background.
- A card never has more than one accent color applied to it at once (one badge color OR one left-bar color, not both conveying different states).

---

## Typography Hierarchy

| Level | Size | Weight | Color | Line height |
|---|---|---|---|---|
| Level 1 — Section heading | 1.5rem / 24px | 600 | `text-text-primary` | 1.2 |
| Level 2 — Body / primary text | 1rem / 16px | 400 | `text-text-primary` | 1.5 |
| Level 3 — Secondary text | 0.875rem / 14px | 400 | `text-text-secondary` | 1.5 |
| Level 3 — Muted text | 0.75rem / 12px | 500 | `text-text-muted` | 1.4 |

**Special cases:**

| Element | Size | Weight | Color | Notes |
|---|---|---|---|---|
| Stat number (Analytics averages/totals) | 1.875rem / 30px | 600 | `text-text-primary` | `font-mono`, `tabular-nums`, line-height 1.1 |
| Table header cell | 0.75rem / 12px | 600 | `text-text-secondary` | uppercase, `tracking-wide` |
| Chart axis/legend label | 0.75rem / 12px | 500 | `text-text-muted` | `font-sans`, never bold |

Never use a font size outside the values in this table. Never apply `font-mono` to anything other than the special-case numeral elements listed here and in the Fullscreen Session Screen section below.

---

## Badges

- Shape: `rounded-full`
- Padding: `px-sm py-xs` (0.5rem / 0.25rem)
- Font size: `text-xs` (12px)
- Font weight: `font-medium` (500)
- Background/text pairing must always come from the same semantic group — never mix (e.g. `bg-success-light` with `text-success`, never `text-error`).

**Product-specific badge variants (session status):**

| Status | Classes |
|---|---|
| `completed` | `bg-success-light text-success` |
| `active` | `bg-primary-light text-primary` |
| `abandoned` | `bg-surface-muted text-text-muted` |

`on_break` never appears as a list badge — it only exists transiently on the fullscreen `/session` screen while a session is in progress.

---

## Buttons

**Primary**
```tsx
<button className="bg-primary text-primary-foreground rounded-md px-lg py-sm text-sm font-semibold
  hover:bg-primary-dark
  active:bg-primary-dark active:scale-[0.98]
  focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background
  disabled:bg-primary-muted disabled:text-primary-foreground/70 disabled:cursor-not-allowed">
  Start Session
</button>
```

**Secondary**
```tsx
<button className="bg-surface border border-border text-text-primary rounded-md px-lg py-sm text-sm font-semibold
  hover:bg-surface-secondary
  active:bg-surface-tertiary
  focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2 focus-visible:ring-offset-background
  disabled:opacity-50 disabled:cursor-not-allowed">
  Cancel
</button>
```

- Every button in the app is one of these two variants, or the Ghost variant defined below in Fullscreen Session Screen rules. No third button style is introduced.
- Button corner radius is always `rounded-md` — never `rounded-lg`, `rounded-full`, or `rounded-sm` on a button.

---

## Form Inputs

```tsx
<input className="bg-surface border border-border rounded-md px-md py-sm text-sm text-text-primary
  placeholder:text-text-muted
  focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none" />
```

- Background: `bg-surface`
- Border: `border border-border`, default state
- Border radius: `rounded-md`
- Padding: `px-md py-sm`
- Font size: `text-sm`
- Text color: `text-text-primary`
- Placeholder color: `text-text-muted`
- Focus ring: `focus:ring-2 focus:ring-primary/20` plus `focus:border-primary`, `focus:outline-none`
- Error state: `border-error focus:ring-error/20`, with helper text below in `text-error text-xs`
- Disabled state: `bg-surface-muted text-text-muted cursor-not-allowed`

---

## Tables

Used for the Past Sessions list on `/history`.

- Header row background: `bg-surface-secondary`
- Header cell text: `text-text-secondary text-xs font-semibold uppercase tracking-wide`
- Body rows: flat `bg-surface` — never alternate row background colors (no zebra striping)
- Row border: `border-b border-border-light` on every row except the last
- Row hover: `hover:bg-surface-secondary`
- Body cell text: `text-sm text-text-primary` for primary values (label, date), `text-sm text-text-secondary` for secondary values (duration)
- Cell padding: `px-md py-sm`

---

## Fullscreen Session Screen

This is the single most distinctive surface in the product and uses its own isolated rule set — none of the rules above (surfaces, cards, navbar) apply here.

- Screen background is always `bg-focus-bg` (pure black). It never uses `bg-background` or `bg-surface`.
- Timer/stopwatch numerals render in `font-mono`, `tabular-nums`, sized `clamp(4rem, 20vw, 12rem)`, weight 500, color `text-focus-fg` (Focus State) or `text-break` (Break State).
- Numeral format is always `H:MM:SS` when the value is one hour or more, and `MM:SS` when under one hour — never drop a leading zero on minutes or seconds (e.g. `0:45` not `0:5`).
- No card, border, shadow, or badge is ever rendered on this screen. It is numerals only, plus the two hover-reveal texts.
- Hover-reveal text ("Take a break?", "Stop session?", "Focus again?") uses the Ghost button rule: default `text-focus-fg-muted`, hover `text-focus-fg` with `hover:underline`, and is invisible (`opacity-0`) until the cursor moves within the screen.
- When both "Take a break?" and "Stop session?" are visible on hover (Focus State), "Take a break?" is the visually primary of the two (`text-focus-fg-muted` at full weight) and "Stop session?" is secondary (`text-focus-fg-muted` with reduced size, `text-xs` vs `text-sm`) — reflecting that stopping is the less-expected action.
- The end-of-session alert animates opacity/brightness gradually (minimum 2-second transition) — it never triggers a hard cut, flash, or instant color change.

---

## Analytics Heatmap

Used on `/history` for the calendar-style daily focus heatmap.

- Cell shape: `rounded-sm`, fixed square size, no gaps larger than `spacing-xs` between cells.
- Color scale uses tints of the primary accent only, from `bg-surface-muted` (zero focus time that day) up through `bg-primary-light`, `bg-primary-muted`, to `bg-primary` (highest focus time that day) — four steps total, no more.
- Never use a different hue (e.g. green-to-red) for heatmap intensity — the scale must stay within the primary accent family to match the near-monochrome direction.
- Day cells with no data render `bg-surface-muted`, not a fully transparent or bordered-only cell.

---

## Empty States

- Icon (if used): single-color line icon, `text-text-muted`, no fill, no accent color.
- Message text: `text-text-secondary text-sm`, centered.
- Container padding: `py-3xl`, content horizontally centered.
- Optional CTA button: Primary button variant only — never Secondary or Ghost in an empty state.
- Example: `/history` with zero sessions shows the muted icon, the message "No sessions yet," and a Primary button linking to `/`.

---

## Do Nots

- Never add a gradient to any card, button, or badge background — every fill is a single flat token color.
- Never introduce a box-shadow value that isn't `var(--shadow-card)` or `var(--shadow-card-hover)`.
- Never use `position: fixed` for the top navbar or any other persistent UI element — the navbar scrolls normally with the page (or uses `sticky top-0` if a sticky navbar is later requested, but never `fixed`).
- Never use alternating row background colors (zebra striping) in any table.
- Never render a confirmation dialog, modal, or `window.confirm` before stopping a session — per `architecture.md`, stopping is immediate.
- Never render `<TopNav />` on `/session`.
- Never use the literal CSS/Tailwind keywords `white` or `black` (e.g. `bg-white`, `text-black`) anywhere in the app — use `bg-focus-bg`/`text-focus-fg` on the session screen, and `bg-surface`/`text-text-primary` everywhere else, even where the rendered color is visually identical.
- Never use more than one accent color (`--color-primary`) worth of saturated color on a single screen at once — semantic colors (success/error/warning/info) are for state feedback only, not decoration.
- Never use an arbitrary Tailwind value (`bg-[#...]`, `rounded-[...]`, `p-[...]`) anywhere — if it's not a token, it doesn't ship.
- Never apply `font-mono` outside of timer numerals, stopwatch numerals, and stat numbers.
- Never use a border-radius value outside the five-step scale (`sm`, `md`, `lg`, `xl`, `full`).
- Never style the Break State stopwatch using `--color-error` — it must always use `--color-break`.
