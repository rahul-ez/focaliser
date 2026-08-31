# Focaliser

> A minimalist, typography-forward focus and break tracker designed for deep work.

Focaliser is built around a single premise: **when you are working, your screen should help you focus, not distract you.** When a session starts, all chrome, tabs, and navigation disappear into a pure black canvas with clean typography. When you take a break, time counts up gently in muted terracotta. When you review your progress, an editorial dark dashboard delivers clear insights into your focus habits.

---

## Key Features

### 1. Minimalist Editorial Home
- **Hero Focus Setup:** Quick session launcher featuring editorial serif typography (*"Ready to focus?"*).
- **Interactive Duration Selector:** Flat chip presets (`15m`, `25m`, `45m`, `60m`, `90m`) alongside precision numeric steppers for hours and minutes.
- **Session Labeling:** Optional inline tag input with auto-trimming and instant clear action.
- **Instant Launch:** Seamless transition into the fullscreen session mode with single-click start.

### 2. Distraction-Free Fullscreen Session (`/session`)
- **Zero UI Chrome:** No navigation bars, sidebars, or headers. Just clean timer digits on a pure black background (`#000000`).
- **Hover-Reveal Actions:** Hovering reveals subtle ghost actions (*"Take a break?"*, *"Stop session?"*) with gentle blur background transition.
- **Stopwatch Break State:** When pausing, switches to an ascending stopwatch in muted terracotta (`#D98C82`) with *"Focus again?"* toggle.
- **Background Tab Resilience:** Driven by a dedicated Web Worker timer to guarantee zero time drift, even when the browser tab is hidden or throttled.
- **Crash & Refresh Recovery:** IndexedDB local state buffering ensures uninterrupted timing across accidental refreshes or browser crashes.
- **Gentle Session End Alerts:** Non-jarring, 2-second visual pulse animation when a session finishes.

### 3. Analytics & Habits Dashboard (`/analytics`)
- **Period Summaries:** Toggle between *This Week* and *This Month* aggregates.
- **Glanceable Metrics:** Total focus time, average session length, total breaks taken, and average break duration.
- **Visual Trends:** Daily focus time and break distribution charts powered by Recharts, styled with dark editorial tokens.

### 4. History & Activity Heatmap (`/history`)
- **52-Week Activity Heatmap:** GitHub-style calendar heatmap tracking daily focus intensity across 4 discrete tints of the primary tone.
- **Chronological Logs:** Full audit list of past focus sessions with start timestamps, planned vs. actual focus times, break counts, and status badges (`completed`, `active`, `abandoned`).
- **Responsive Layout:** Automatically transitions from a structured desktop table to stacked touch cards on mobile devices.

### 5. Secure Supabase SSR Authentication
- **Password & Magic Link Sign-In:** Email/password authentication and passwordless magic link support.
- **Row-Level Security (RLS):** Every database row (`focus_sessions`, `breaks`, `user_settings`) is strictly scoped to `auth.uid() = user_id`.

---

## Design System & Typography

Focaliser follows a **Dark Editorial Grayscale** aesthetic adhering to strict token constraints:

### Three-Voice Typography
| Voice | Typeface | Purpose |
|---|---|---|
| **Editorial** | `Playfair Display` (`font-serif`) | Hero headline (*"Ready to focus?"*), page section headers, top navigation links |
| **Functional** | `Inter` (`font-sans`) | Body copy, buttons, labels, inputs, card titles, and badges |
| **Numeric** | `JetBrains Mono` (`font-mono`) | Fullscreen timer numerals, stopwatch digits, stat metrics, and numeric steppers |

### Color & Surface Philosophy
- **Canvas (`--color-background`):** `#121212` — Dark charcoal canvas for all chrome pages.
- **Surfaces (`--color-surface`):** `#1A1A1A` — Navbars, cards, inputs, and popovers.
- **Pure Black (`--color-focus-bg`):** `#000000` — **Reserved exclusively** for the fullscreen `/session` screen to maintain total immersion.
- **Tonal Primary (`--color-primary`):** `#E4E2DC` — Soft, light neutral tone for active pills, primary buttons, and highlight indicators.
- **Muted Terracotta (`--color-break`):** `#D98C82` — Soft, non-aggressive break indicator color.

---

## Tech Stack

- **Framework:** [Next.js 16 (App Router)](https://nextjs.org/)
- **Styling:** [Tailwind CSS v4](https://tailwindcss.com/) with `@theme` token definitions
- **State Management:** [Zustand](https://github.com/pmndrs/zustand)
- **Database & Auth:** [Supabase](https://supabase.com/) (`@supabase/ssr`, `@supabase/supabase-js`, PostgreSQL with RLS)
- **Animations:** [Framer Motion](https://www.framer.com/motion/)
- **Charts & Visualizations:** [Recharts](https://recharts.org/) & [react-calendar-heatmap](https://github.com/patientslikeme/react-calendar-heatmap)
- **Icons:** [Lucide React](https://lucide.dev/)
- **Date Utilities:** [date-fns](https://date-fns.org/)
- **Validation:** [Zod](https://zod.dev/)

---

## Project Structure

```
focaliser/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── signup/page.tsx
│   ├── analytics/page.tsx         # Weekly & monthly focus statistics
│   ├── api/
│   │   ├── analytics/route.ts     # Aggregated analytics endpoint
│   │   ├── breaks/route.ts        # Break creation & updates
│   │   └── sessions/route.ts      # Focus session lifecycle management
│   ├── auth/callback/route.ts     # Supabase Auth PKCE callback
│   ├── dev/preview/page.tsx       # Component showcase & token testbed
│   ├── history/page.tsx           # Session history & 52-week heatmap
│   ├── session/page.tsx           # Fullscreen distraction-free timer
│   ├── globals.css                # Tailwind CSS v4 @theme design tokens
│   ├── layout.tsx                 # Root layout with Google Fonts
│   ├── page.tsx                   # Home landing with editorial hero
│   └── proxy.ts                   # Next.js 16 proxy / auth middleware
├── components/
│   ├── analytics/                 # Summary cards, focus & break charts
│   ├── auth/                      # Unified auth form (password & magic link)
│   ├── history/                   # Heatmap & chronological session list
│   ├── nav/                       # Top navigation bar
│   ├── timer/                     # DurationSelector, pills, FocusCountdown, BreakStopwatch
│   └── ui/                        # Button, Card, Input, Badge primitives
├── context/                       # Architectural specs & design token documentation
├── lib/
│   ├── db/                        # Typed database queries (sessions, settings, analytics)
│   ├── supabase/                  # Server & browser Supabase SSR clients
│   ├── timer/                     # Web Worker, IndexedDB buffer, and Zustand store
│   └── validation/                # Zod schemas for API routes
├── public/
│   └── timerWorker.js             # High-precision background Web Worker
└── supabase/
    └── migrations/                # PostgreSQL schema & RLS policies
```

---

## Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18.18 or higher)
- [npm](https://www.npmjs.com/) or [pnpm](https://pnpm.io/)
- A free [Supabase](https://supabase.com/) project

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/your-username/focaliser.git
cd focaliser
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

Fill in your Supabase credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
```

### 3. Setup Database Schema
Execute the SQL migrations found in `supabase/migrations/` in your Supabase SQL Editor:
- **`user_settings`**: Stores user default duration and alert preferences.
- **`focus_sessions`**: Tracks planned vs. actual seconds, status (`active`, `completed`, `abandoned`), and label.
- **`breaks`**: Logs break start timestamps and durations.
- **Row Level Security**: Automatically enforces user data isolation.

### 4. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Production Build

To test and compile the production bundle:
```bash
npm run build
npm run start
```

---

## License

This project is licensed under the MIT License.
