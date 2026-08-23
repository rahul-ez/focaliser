# UI Tokens

This file is the single source of truth for every color, font, spacing, and radius value used in the Focus Tracker UI. It is read by the AI coding agent alongside `project-overview.md` and `architecture.md` before writing any component. The visual direction is minimal and typography-forward: a near-monochrome neutral palette carries almost all of the interface, with one accent color reserved for interactive/primary moments and a small semantic set reserved for state feedback. The fullscreen focus/break screen described in `project-overview.md` is treated as its own dedicated token group, since it intentionally breaks from the rest of the app's light, neutral surface.

**Framework:** Tailwind CSS v4, using the `@theme` directive. Tokens are defined once as CSS custom properties inside `@theme` in `app/globals.css`; Tailwind v4 automatically generates matching utility classes from them (e.g. `--color-primary` → `bg-primary`, `text-primary`, `border-primary`). No `tailwind.config.ts` color palette is needed — the theme block below is authoritative.

---

## How to Use

- Every token is a CSS custom property declared inside `@theme { }` in `app/globals.css`.
- Tailwind v4 reads the `--color-*`, `--font-*`, `--radius-*`, and `--spacing-*` prefixes and auto-generates corresponding utility classes. You never write custom utility CSS for a token — you only add the variable, and the class exists.
- Components consume tokens exclusively through generated Tailwind utility classes (`bg-primary`, `text-text-secondary`, `rounded-lg`). Never reference `var(--color-primary)` directly in component code — that's only for the rare case of a raw CSS file (e.g. the Web Worker has no styling, so this should not come up in practice).
- If a value is not in this file, it does not exist. Do not invent a one-off hex code, spacing value, or radius "just for this component."

**Correct:**
```tsx
<button className="bg-primary text-primary-foreground hover:bg-primary-dark rounded-md px-lg py-sm">
  Start Session
</button>
```

**Incorrect:**
```tsx
<button style={{ backgroundColor: '#5B5FEF', padding: '12px 24px' }}>
  Start Session
</button>
```
```tsx
<button className="bg-blue-600 hover:bg-blue-700 rounded-[8px] px-6 py-3">
  Start Session
</button>
```
The second and third examples bypass the token system entirely — they use Tailwind's default palette/spacing/radius scale instead of this project's theme, and will visually drift from the rest of the app the moment tokens are updated in one place.

---

## globals.css — Complete Token Definition

```css
@import "tailwindcss";

@theme {
  /* ---------- Font ---------- */
  --font-sans: 'Inter', ui-sans-serif, system-ui, -apple-system, sans-serif;
  --font-mono: 'JetBrains Mono', ui-monospace, 'SFMono-Regular', monospace;

  /* ---------- Page / surface backgrounds ---------- */
  --color-background: #FAFAF9;
  --color-surface: #FFFFFF;
  --color-surface-secondary: #F5F5F4;
  --color-surface-tertiary: #EFEEEC;
  --color-surface-muted: #E7E5E4;

  /* ---------- Borders ---------- */
  --color-border: #E5E3E0;
  --color-border-light: #EFEDEA;
  --color-border-muted: #D9D6D2;

  /* ---------- Text colors ---------- */
  --color-text-primary: #18181B;
  --color-text-secondary: #52525B;
  --color-text-muted: #8C8A86;
  --color-text-primary-dark: #FFFFFF;
  --color-text-secondary-dark: #D4D4D8;
  --color-text-muted-dark: #A1A1AA;

  /* ---------- Primary accent (Indigo) ---------- */
  --color-primary: #5B5FEF;
  --color-primary-dark: #4548C9;
  --color-primary-light: #EEF0FE;
  --color-primary-muted: #C7CBFB;
  --color-primary-foreground: #FFFFFF;

  /* ---------- Semantic: success ---------- */
  --color-success: #1D8A5F;
  --color-success-foreground: #FFFFFF;
  --color-success-light: #E3F5EC;

  /* ---------- Semantic: info ---------- */
  --color-info: #2C6ECB;
  --color-info-foreground: #FFFFFF;
  --color-info-light: #E8F1FC;

  /* ---------- Semantic: warning ---------- */
  --color-warning: #B45309;
  --color-warning-foreground: #FFFFFF;
  --color-warning-light: #FDF1E1;

  /* ---------- Semantic: error ---------- */
  --color-error: #C0362C;
  --color-error-foreground: #FFFFFF;
  --color-error-light: #FBEAE8;

  /* ---------- Session screen (fullscreen Focus / Break states) ---------- */
  /* Reserved exclusively for /session. Never mixed with the chrome palette above. */
  --color-focus-bg: #000000;
  --color-focus-fg: #FFFFFF;
  --color-focus-fg-muted: rgba(255, 255, 255, 0.55);
  --color-break: #D98C82;
  --color-break-foreground: #1A0E0C;
  --color-break-muted: rgba(217, 140, 130, 0.6);

  /* ---------- Overlays ---------- */
  --color-overlay: rgba(24, 24, 27, 0.5);
  --color-overlay-light: rgba(24, 24, 27, 0.25);
  --color-overlay-dark: rgba(0, 0, 0, 0.7);

  /* ---------- Border radii ---------- */
  --radius-sm: 0.375rem;
  --radius-md: 0.625rem;
  --radius-lg: 1rem;
  --radius-xl: 1.5rem;
  --radius-full: 9999px;

  /* ---------- Spacing ---------- */
  --spacing-xs: 0.25rem;
  --spacing-sm: 0.5rem;
  --spacing-md: 1rem;
  --spacing-lg: 1.5rem;
  --spacing-xl: 2rem;
  --spacing-2xl: 3rem;
  --spacing-3xl: 4rem;

  /* ---------- Containers / Max Widths ---------- */
  --container-sm: 24rem;
  --container-md: 28rem;
  --container-lg: 32rem;
  --container-xl: 36rem;
  --container-2xl: 42rem;
  --container-3xl: 48rem;
  --container-4xl: 56rem;
  --container-5xl: 64rem;
}

/* Values Tailwind v4 cannot derive from @theme (composite shadows) */
:root {
  --shadow-card: 0 1px 2px rgba(24, 24, 27, 0.04), 0 1px 3px rgba(24, 24, 27, 0.06);
  --shadow-card-hover: 0 4px 10px rgba(24, 24, 27, 0.08), 0 2px 4px rgba(24, 24, 27, 0.06);
}
```

---

## Color Usage Guide

**Page layout**

| Context | Token |
|---|---|
| App background (Home, Analytics, History) | `bg-background` |
| Card / panel surface | `bg-surface` |
| Secondary panel, table header row | `bg-surface-secondary` |
| Hover background for list rows | `bg-surface-tertiary` |
| Disabled / muted surface | `bg-surface-muted` |
| Default border (cards, inputs, dividers) | `border-border` |
| Subtle divider (between list rows) | `border-border-light` |
| Emphasized border | `border-border-muted` |

**Typography**

| Context | Token |
|---|---|
| Headings (all levels) | `text-text-primary` |
| Body copy | `text-text-primary` |
| Secondary copy (descriptions, sub-labels) | `text-text-secondary` |
| Muted copy (timestamps, placeholders, empty states) | `text-text-muted` |
| Text on the fullscreen session screen | `text-focus-fg` (primary), `text-focus-fg-muted` (de-emphasized, e.g. faded label under the hover-reveal text) |

**Primary accent**

| Context | Token |
|---|---|
| Primary button background | `bg-primary` |
| Primary button background (hover) | `bg-primary-dark` |
| Primary button text | `text-primary-foreground` |
| Active tab indicator / underline | `bg-primary` |
| Selected scroll-wheel value | `text-primary` |
| Links and inline interactive text | `text-primary` |
| Subtle accent background (selected chip, active filter) | `bg-primary-light` |
| Disabled primary button | `bg-primary-muted` |

**Semantic states**

| State | Base | Foreground (text on base) | Light (tint background) |
|---|---|---|---|
| Success | `bg-success` | `text-success-foreground` | `bg-success-light` |
| Info | `bg-info` | `text-info-foreground` | `bg-info-light` |
| Warning | `bg-warning` | `text-warning-foreground` | `bg-warning-light` |
| Error | `bg-error` | `text-error-foreground` | `bg-error-light` |

**Status badges and indicators specific to this product**

| Session status (`focus_sessions.status`) | Badge background | Badge text | Notes |
|---|---|---|---|
| `active` | `bg-primary-light` | `text-primary` | Shown in Past Sessions list if a session is somehow still open |
| `completed` | `bg-success-light` | `text-success` | Most common badge in Past Sessions |
| `on_break` | `bg-break-muted` | `text-break-foreground` | Only rendered on the fullscreen session screen itself, never as a list badge |
| `abandoned` | `bg-surface-muted` | `text-text-muted` | Deliberately colorless — stopping early is a neutral outcome, not an error |

---

## Typography

| Element | Size | Weight | Line height | Color token |
|---|---|---|---|---|
| Hero heading ("Ready to focus?") | 2.25rem / 36px (desktop), 1.875rem / 30px (mobile) | 700 | 1.1 | `text-text-primary` |
| Section heading (Analytics, Past Sessions page titles) | 1.5rem / 24px | 600 | 1.2 | `text-text-primary` |
| Card title | 1.125rem / 18px | 600 | 1.3 | `text-text-primary` |
| Body text | 1rem / 16px | 400 | 1.5 | `text-text-primary` |
| Secondary text (descriptions, helper copy) | 0.875rem / 14px | 400 | 1.5 | `text-text-secondary` |
| Muted text (timestamps, captions, placeholders) | 0.75rem / 12px | 500 | 1.4 | `text-text-muted` |
| Form label | 0.75rem / 12px, uppercase, letter-spacing 0.04em | 600 | 1.2 | `text-text-secondary` |
| Button text | 0.875rem / 14px | 600 | 1 | varies by button variant, see Component Tokens |
| Fullscreen timer numerals (Focus State) | `clamp(4rem, 20vw, 12rem)`, `font-mono`, `font-variant-numeric: tabular-nums` | 500 | 1 | `text-focus-fg` |
| Fullscreen stopwatch numerals (Break State) | same size/family as timer numerals | 500 | 1 | `text-break` |
| Stat number (Analytics averages, totals) | 1.875rem / 30px, `font-mono`, tabular-nums | 600 | 1.1 | `text-text-primary` |

**Font family and import:** Inter is the default UI font (`font-sans`); JetBrains Mono is reserved for numerals (`font-mono`) so digits stay fixed-width and don't jitter as they change. Both are loaded via `next/font/google` in `app/layout.tsx`, not via a `<link>` tag or `@import`, so Next.js can self-host and subset them:

```tsx
// app/layout.tsx
import { Inter, JetBrains_Mono } from 'next/font/google'

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' })
const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono' })

// Applied to <html> or <body> className: `${inter.variable} ${jetbrainsMono.variable}`
```

---

## Spacing

| Token | Value | Usage |
|---|---|---|
| `spacing-xs` | 0.25rem / 4px | Icon-to-label gap, tight badge padding |
| `spacing-sm` | 0.5rem / 8px | Button vertical padding, small gaps between inline elements |
| `spacing-md` | 1rem / 16px | Default padding inside inputs, gap between form fields |
| `spacing-lg` | 1.5rem / 24px | Card padding, button horizontal padding |
| `spacing-xl` | 2rem / 32px | Gap between major sections on a page |
| `spacing-2xl` | 3rem / 48px | Page top padding, spacing above/below the hero heading |
| `spacing-3xl` | 4rem / 64px | Empty-state vertical padding, large section breaks |

---

## Component Tokens

**Cards** (session summary cards, analytics chart containers)
- Background: `bg-surface`
- Border: `border border-border`
- Radius: `rounded-lg`
- Shadow: `shadow-[var(--shadow-card)]`, hover: `shadow-[var(--shadow-card-hover)]`
- Padding: `p-lg`

**Buttons — Primary** (e.g. Play button, Start Session)
- Default: `bg-primary text-primary-foreground rounded-md font-semibold text-sm px-lg py-sm`
- Hover: `hover:bg-primary-dark`
- Active: `active:bg-primary-dark active:scale-[0.98]`
- Focus: `focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background`
- Disabled: `disabled:bg-primary-muted disabled:text-primary-foreground/70 disabled:cursor-not-allowed`

**Buttons — Secondary** (e.g. cancel actions, tab-like toggles)
- Default: `bg-surface border border-border text-text-primary rounded-md font-semibold text-sm px-lg py-sm`
- Hover: `hover:bg-surface-secondary`
- Active: `active:bg-surface-tertiary`
- Focus: `focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2 focus-visible:ring-offset-background`
- Disabled: `disabled:opacity-50 disabled:cursor-not-allowed`

**Buttons — Ghost** (e.g. "Take a break?", "Stop session?", "Focus again?" hover-reveal text on `/session`)
- Default: `bg-transparent text-focus-fg-muted font-medium text-sm underline-offset-4`
- Hover: `hover:text-focus-fg hover:underline`
- Active: `active:text-focus-fg`
- Focus: `focus-visible:ring-2 focus-visible:ring-primary/30 rounded-sm`
- Disabled: `disabled:opacity-40 disabled:pointer-events-none`
- Note: this variant is the only one used on the black session screen and always pairs with `text-focus-fg` / `text-focus-fg-muted`, never with the light-theme text tokens.

**Inputs** (duration confirmation, session label, auth forms)
- Default: `bg-surface border border-border rounded-md text-text-primary placeholder:text-text-muted px-md py-sm text-sm`
- Focus: `focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none`
- Error: `border-error focus:ring-error/20`, helper text `text-error text-xs`
- Disabled: `bg-surface-muted text-text-muted cursor-not-allowed`

**Badges** (session status indicators in Past Sessions)
- Shape: `rounded-full px-sm py-xs text-xs font-medium`
- Color pairing: as defined in the "Status badges" table above (background + text token pair, never mixed across rows)

**Tables / list rows** (Past Sessions list)
- Header row: `bg-surface-secondary text-text-secondary text-xs font-semibold uppercase tracking-wide border-b border-border`
- Row: `border-b border-border-light hover:bg-surface-secondary`
- Cell padding: `px-md py-sm`

**Empty states** (no sessions logged yet, in `/history` or `/analytics`)
- Container: centered, `py-3xl`
- Icon/illustration: `text-text-muted`, minimal line-style only, no color
- Message: `text-text-secondary text-sm`
- Optional CTA button: primary button variant

---

## Invariants

- Never use raw hex codes or Tailwind's default palette classes (`bg-white`, `text-black`, `bg-blue-500`, etc.) in component code — always use the tokens defined in this file.
- Never use Tailwind arbitrary-value syntax to bypass a token (e.g. `bg-[#5B5FEF]`, `rounded-[8px]`, `p-[18px]`) — if the value isn't a token, it doesn't belong in the UI.
- The fullscreen session screen (`/session`) uses only `--color-focus-*` and `--color-break*` tokens. It never uses `--color-background`, `--color-surface`, or any chrome-page text token — this screen must render pure black regardless of any theming added elsewhere later.
- Every interactive element (button, input, link) must implement default, hover, focus, and disabled states using only tokens defined in Component Tokens above — no ad hoc one-off colors for any state.
- A badge's background and text token must always come from the same semantic pair (e.g. `bg-success-light` pairs with `text-success`, never with `text-error`).
- `font-mono` is reserved exclusively for numerals: timer digits, stopwatch digits, and analytics stat numbers. It is never used for body text, labels, or headings.
- `font-sans` (Inter) is used for everything that is not a numeral display per the rule above.
- The radius scale is fixed at five steps (`sm`, `md`, `lg`, `xl`, `full`); no other radius value is introduced.
- All spacing must come from the `spacing-*` scale defined above; no arbitrary padding/margin values.
- Focus states are never removed without a replacement — every focusable element must show a visible `focus-visible` ring using a token-based color.
- `--color-break` must remain a desaturated, muted tone. It must never be swapped for `--color-error` or any fully saturated red — the product requirement is explicitly a break color that "isn't too sharp."
- New tokens are never invented inline. Any new color, spacing, or radius need must be added to this file's `@theme` block first, then consumed by components.
