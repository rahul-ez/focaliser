# Focaliser — Home Page & Theme Redesign: Agent Build Plan

**Audience:** AI coding agent. Not reviewed by a human before execution.
**Relationship to existing docs:** This spec modifies `ui-tokens.md` (colors, fonts), `ui-rules.md` (home page layout, nav), and `ui-registry.md` (component entries) as described below. After implementation, update those three files to match — do not leave them describing the old design. `ui-tokens.md` remains the source of truth for values; this file is the instruction set for getting it there.

**Scope:** (1) new color palette, (2) new heading font, (3) full rebuild of the home page (`/`) into a minimal hero, (4) light nav changes (Sign out), (5) propagate the new theme to the rest of the app via tokens only — no structural redesign of `/analytics`, `/history`, `/session`, or auth pages beyond what falls out of the token/font change.

---

## 0. Non-negotiable constraints carried over from the existing system

These already exist in `ui-rules.md` / `ui-tokens.md` and still apply in full during this redesign:

- No raw hex codes or arbitrary Tailwind values in component code (`bg-[#...]`, `rounded-[...]`) — everything goes through `@theme` tokens.
- `/session` (fullscreen focus/break screen) keeps its own isolated token group (`--color-focus-*`, `--color-break*`) and is **out of scope** for this rebrand. Do not touch it.
- `--color-success`, `--color-info`, `--color-warning`, `--color-error` and their `-light`/`-foreground` variants are **unchanged**. This redesign only touches neutrals, the primary accent, and typography.
- One accent color on screen at a time. Do not introduce a second saturated accent anywhere.
- `font-mono` stays reserved for numerals only (timer, stopwatch, stat numbers) — unaffected by this change.

---

## 1. Font system

Add a serif display font for headings. Keep the existing sans-serif for everything else — Playfair Display is a display serif; it degrades UI legibility at small sizes (form labels, table cells, buttons), so it is scoped narrowly, the same way `font-mono` is already scoped to numerals only.

### 1.1 Token addition

```css
/* app/globals.css, inside @theme */
--font-serif: 'Playfair Display', Georgia, 'Times New Roman', serif;
--font-sans: 'Inter', ui-sans-serif, system-ui, -apple-system, sans-serif; /* unchanged */
--font-mono: 'JetBrains Mono', ui-monospace, 'SFMono-Regular', monospace; /* unchanged */
```

### 1.2 Loader

```tsx
// app/layout.tsx
import { Inter, JetBrains_Mono, Playfair_Display } from 'next/font/google'

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' })
const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono' })
const playfairDisplay = Playfair_Display({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-serif',
})

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetbrainsMono.variable} ${playfairDisplay.variable}`}
    >
      <body className="font-sans">{children}</body>
    </html>
  )
}
```

### 1.3 Usage rule (add to `ui-tokens.md` invariants)

- `font-serif` is used **only** for: the home page hero heading, the wordmark/logo text in `TopNav`, and the top-level `<h1>` section heading on `/analytics` and `/history`.
- `font-serif` is **never** used for body copy, form labels, inputs, buttons, table content, badges, nav tab links, or numerals.
- Everything not covered above stays `font-sans` (Inter), exactly as today.
- Weight: use 500 or 600 on `font-serif` elements. Never 700+ (reads heavy/generic at large display sizes) and never italic anywhere in the UI (reads decorative, not professional).

---

## 2. Color tokens

Source palette (use these four hex values exactly, unmodified): `#2C2C2C`, `#853953`, `#612D53`, `#F3F4F4`.

Mapping rationale: `#F3F4F4` is the lightest → page background. `#2C2C2C` is the darkest, near-neutral → primary text. `#612D53` and `#853953` are both plum/wine tones from the same family → primary accent and its hover/active state, respectively (do not use them as two independent accents — they are one accent expressed at two depths).

### 2.1 Replace in `@theme` (app/globals.css)

```css
/* ---------- Page / surface backgrounds ---------- */
--color-background: #F3F4F4;
--color-surface: #FFFFFF;              /* unchanged — pure white cards read cleaner against F3F4F4 than an off-white card would */
--color-surface-secondary: #EAEBEB;
--color-surface-tertiary: #E0E1E1;
--color-surface-muted: #D4D5D5;

/* ---------- Borders ---------- */
--color-border: #DBD9D9;
--color-border-light: #E6E4E4;
--color-border-muted: #C9C6C6;

/* ---------- Text colors ---------- */
--color-text-primary: #2C2C2C;
--color-text-secondary: #5C5959;
--color-text-muted: #8B8888;
--color-text-primary-dark: #FFFFFF;     /* unchanged, dark-mode reserve, not currently used */
--color-text-secondary-dark: #D4D4D8;   /* unchanged */
--color-text-muted-dark: #A1A1AA;       /* unchanged */

/* ---------- Primary accent (Plum) ---------- */
--color-primary: #612D53;
--color-primary-dark: #853953;
--color-primary-light: #EDE3E8;
--color-primary-muted: #C9A9BC;
--color-primary-foreground: #FFFFFF;
```

Everything under `Semantic: success/info/warning/error`, `Session screen`, and `Overlays` in `ui-tokens.md` stays **exactly as it is today** — do not edit those blocks.

### 2.2 Why `--color-primary-light` / `--color-primary-muted` aren't from the source palette

The palette only supplies four colors. `-light` and `-muted` are computed tints of `#612D53` (mixed toward the new background) so that badges (`bg-primary-light text-primary`), disabled buttons (`disabled:bg-primary-muted`), and selected-chip backgrounds have a token to use. Use the values above as given — do not recompute or introduce a fifth freehand color.

### 2.3 Audit step

Grep the codebase for the old palette before considering this done: `#5B5FEF`, `#4548C9`, `#EEF0FE`, `#C7CBFB`. Any component-level (non-token) reference to these is a bug — components must consume color exclusively through the utility classes generated from `@theme`, so a clean grep for the old hex values (outside of `globals.css` git history) confirms the swap was token-driven, not hardcoded.

---

## 3. Home page (`/`) rebuild

Full replacement of the current hero + `DurationPicker` card. Target: one serif headline, one unboxed inline row of controls, nothing else on the page.

### 3.1 Structure

```tsx
// app/page.tsx
<main className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center px-xl">
  <h1 className="font-serif font-medium text-text-primary text-center leading-[1.15] mb-2xl text-[clamp(2.5rem,6vw,5rem)]">
    Ready to focus?
  </h1>
  <HomeSessionForm />
</main>
```

`min-h-[calc(100vh-4rem)]` accounts for the 64px `TopNav`, so the hero is vertically centered in the remaining viewport. This page does **not** use the standard `max-w-5xl mx-auto px-xl py-2xl` content wrapper used on `/analytics` and `/history` — it is a full-viewport centered composition, not a document-style page.

### 3.2 `HomeSessionForm` (new component: `components/timer/HomeSessionForm.tsx`)

One unboxed row: duration field, label field, play button. No `Card`, no border wrapper, no `shadow-*` anywhere in this component — that is the entire point of "minimal." Fields are distinguished only by an underline, not a full input box.

```tsx
<form
  onSubmit={handleStart}
  className="flex items-center gap-lg w-full max-w-2xl mx-auto flex-wrap justify-center"
>
  <input
    type="text"
    inputMode="numeric"
    aria-label="Session duration"
    placeholder="25:00"
    className="font-mono tabular-nums text-2xl text-text-primary bg-transparent border-0 border-b border-border
      text-center w-24 py-xs placeholder:text-text-muted
      focus:border-primary focus:outline-none transition-colors"
  />
  <input
    type="text"
    aria-label="Session label"
    placeholder="What are you focusing on?"
    className="font-sans text-base text-text-primary bg-transparent border-0 border-b border-border
      flex-1 min-w-[220px] py-xs placeholder:text-text-muted
      focus:border-primary focus:outline-none transition-colors"
  />
  <button
    type="submit"
    aria-label="Start session"
    className="shrink-0 w-12 h-12 rounded-full bg-primary text-primary-foreground
      flex items-center justify-center transition-all
      hover:bg-primary-dark active:scale-[0.96]
      focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
  >
    <Play size={18} strokeWidth={2} fill="currentColor" />
  </button>
</form>
```

Notes:
- Duration field is `font-mono tabular-nums` per the existing numerals rule — it's the one numeral element on this page.
- Play button uses the `lucide-react` `Play` icon, filled (`fill="currentColor"`) at 18px, inside a `rounded-full` primary-colored button. This is the one `rounded-full` element on the page and the one place `bg-primary` appears — keep it that way, do not add other filled/rounded accents nearby.
- No placeholder gradient, no background blob, no icon badge, no helper microcopy under the form. If duration parsing needs a hint (e.g. accepted formats), surface it as a validation message only on error, styled per the existing `Input` error-state token (`text-error text-xs`), not as permanent copy under the field.
- Existing `components/timer/DurationPicker.tsx` (scroll-wheel picker) is left in place only if it is still used elsewhere in the flow (e.g., a session-recovery or edit-duration screen). If the home page was its only usage, remove it and remove its entry from `ui-registry.md` rather than leaving an orphaned component.

### 3.3 What NOT to add to this page

Beyond the general Do Nots in Section 6: no secondary CTA, no feature list, no stats preview, no "recent sessions" strip, no illustration, no footer. The home page is the headline and the form — nothing competes with them for attention.

---

## 4. Navigation changes

`TopNav` (`components/nav/TopNav.tsx`) gets two changes, applied globally (it already renders on every page except `/session`, `/login`, `/signup`, so this satisfies the home page requirement without a page-specific header):

1. **Logo font**: switch from `font-sans` to `font-serif` to establish the brand mark, since Playfair Display is now the identity typeface.
   ```
   text-text-primary font-serif font-semibold text-lg tracking-tight hover:opacity-90 transition-opacity
   ```
2. **Add Sign out** at the far right, after the Analytics / History tab links, separated by a thin divider so it doesn't read as a third nav tab:
   ```tsx
   <div className="flex items-center gap-lg">
     <TabLink href="/analytics">Analytics</TabLink>
     <TabLink href="/history">History</TabLink>
     <div className="w-px h-4 bg-border-light" aria-hidden="true" />
     <button
       onClick={handleSignOut}
       className="text-text-secondary text-sm font-medium hover:text-text-primary transition-colors"
     >
       Sign out
     </button>
   </div>
   ```
   Sign out stays a plain text action — no icon required, no button box, no color (it is not a primary or destructive action, so it should not use `text-error` or `bg-primary`). If an icon is wanted for visual balance, use `lucide-react`'s `LogOut` at 14px, `text-text-secondary`, positioned before the label — optional, not required.

Do not add a "Home" tab — the wordmark on the left already links to `/`, per the existing pattern.

---

## 5. Propagating the theme to the rest of the app

Because every existing component (`Button`, `Card`, `Badge`, `Input`, tables, the heatmap, the analytics stat cards) already consumes color exclusively through tokens (`bg-primary`, `text-primary`, `bg-surface-secondary`, etc.), updating `@theme` in Section 2 is sufficient to re-skin `/analytics`, `/history`, and the auth pages — no component-level color edits should be needed there. Two font-only changes complete the consistency requirement:

- On `/analytics` and `/history`, the page-level `<h1>` ("Analytics", "Past Sessions" or equivalent) switches from `font-sans font-semibold` to `font-serif font-medium`, matching the home hero's typeface family. Card titles, table headers, form labels, and body text stay `font-sans` — do not cascade the serif font past the single top-level heading on each page.
- `AuthForm`'s heading (`components/auth/AuthForm.tsx`) also switches to `font-serif font-medium` for the same reason — it's the only other page-level heading in the app.

Everything else (badges, buttons, inputs, table rows, the heatmap tint scale, empty states) inherits the new plum accent and neutral palette automatically through the tokens and needs no direct edits.

---

## 6. Icons / SVGs

- Continue using `lucide-react` (already the established icon set per `ui-registry.md` — `BarChart2`, `Clock`, etc.). Do not introduce a second icon library.
- Line-style, single color, no fill except the one home-page play button noted in 3.2.
- Standard stroke width `1.5`–`2`. Standard sizes: `14`–`16px` inline with text, `18px` in buttons, `36px` in empty states (per existing pattern).
- Icon color always comes from a text token (`text-text-muted`, `text-text-secondary`, `text-primary`) — never a raw fill hex, never a gradient fill, never a two-tone or "duotone" icon style.
- No emoji anywhere, in code, copy, or icon substitution — not in headings, buttons, empty states, error messages, or code comments intended for the UI.

---

## 7. Explicit Do Nots

In addition to everything already in `ui-rules.md`'s "Do Nots" section (unchanged, still binding), this redesign specifically avoids the visual habits that read as generic AI-generated output:

- No glassmorphism, no frosted/blurred panels.
- No mesh gradients, glow blobs, or radial gradient backgrounds behind the hero text.
- No floating pill badge above the headline (e.g. a "✨ New" or "Introducing" tag) — the headline stands alone.
- No three-icon feature-grid section, no generic "why choose us" block — the home page per Section 3 is headline + form, nothing else.
- No oversized `rounded-full` treatment on more than the one play button specified.
- No stacked/duplicated shadows or glow-on-hover effects beyond the existing `--shadow-card` / `--shadow-card-hover` pair, and those don't apply to the unboxed home page fields at all.
- No stock illustration, no abstract 3D render, no decorative SVG blob shapes behind content.
- No emoji, anywhere, under any circumstance.
- No italic serif treatment, no drop caps, no text gradients on the headline — flat `text-text-primary`, solid color, per Section 1.3.
- No "Get Started" style oversized gradient CTA button — the existing `Button` primary variant (flat `bg-primary`, `rounded-md`) is the only button style in the app; the home page's circular play button is a deliberate, singular exception documented in 3.2, not a new general pattern.

---

## 8. File-by-file change list

| File | Change |
|---|---|
| `app/globals.css` | Replace color tokens per Section 2.1; add `--font-serif` per Section 1.1 |
| `app/layout.tsx` | Add `Playfair_Display` import/loader per Section 1.2 |
| `app/page.tsx` | Replace existing hero + `DurationPicker` Card with structure in Section 3.1 |
| `components/timer/HomeSessionForm.tsx` | New component, Section 3.2 |
| `components/timer/DurationPicker.tsx` | Keep only if reused elsewhere; otherwise remove and drop its `ui-registry.md` entry |
| `components/nav/TopNav.tsx` | Logo font-serif; add Sign out per Section 4 |
| `app/analytics/page.tsx`, `app/history/page.tsx` | Top-level `<h1>` switches to `font-serif font-medium`, Section 5 |
| `components/auth/AuthForm.tsx` | Heading switches to `font-serif font-medium`, Section 5 |
| `ui-tokens.md` | Update color table, add `--font-serif` row and usage rule (Section 1.3) |
| `ui-rules.md` | Update Font and Navigation sections to match Sections 1 and 4; update home page description |
| `ui-registry.md` | Update `TopNav` entry, add `HomeSessionForm` entry, remove/update `DurationPicker` entry per its outcome above, following the file's own "update immediately after building" rule |

---

## 9. Verification checklist before calling this done

- [ ] Grep for `#5B5FEF`, `#4548C9`, `#EEF0FE`, `#C7CBFB` — zero matches outside git history.
- [ ] Grep for any emoji character in `app/` and `components/` — zero matches.
- [ ] Grep for `bg-white`, `text-black`, `bg-blue-`, or any `bg-[#`/`text-[#`/`rounded-[` arbitrary value — zero new matches introduced by this change.
- [ ] `font-serif` appears only on: home hero, `TopNav` logo, `/analytics` and `/history` page `<h1>`, `AuthForm` heading. Nowhere else.
- [ ] `/session` renders unchanged — still pure `bg-focus-bg` black, no plum accent, no serif font.
- [ ] Home page has no `Card`, no `shadow-*`, no `rounded-full` element other than the one play button.
- [ ] `--color-success`, `--color-info`, `--color-warning`, `--color-error`, `--color-focus-*`, `--color-break*` are byte-for-byte unchanged from the original `ui-tokens.md`.
- [ ] `ui-tokens.md`, `ui-rules.md`, `ui-registry.md` all updated to reflect the shipped state, per each file's own stated purpose.
