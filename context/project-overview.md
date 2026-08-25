# Project Overview

A focus timer application ("Focus Tracker") that lets a user run timed focus sessions with labeled intent, take tracked breaks mid-session, and review historical and analytical data about their focus habits over time.

## About the Project

Focus Tracker is a single-purpose productivity timer. A user sets a duration (e.g. 3:00:00 or 0:45:00) using a scroll-wheel style time picker, optionally labels the session with what they intend to work on, and starts it. Once started, the app removes all UI except the countdown itself, presented fullscreen with a black background and white numerals, to minimize distraction. The user can pause into a "break" state at any time by hovering to reveal a "Take a break?" prompt; this switches the display to a stopwatch (counting up from zero) until the user resumes.

The app also functions as a personal analytics tool. Every completed session (including its breaks) is logged and later surfaced in two views: an Analytics tab showing aggregated charts (time focused, number of breaks, time spent on breaks, daily/weekly/monthly averages) and a Past Sessions tab showing a chronological list plus a calendar heatmap of historical activity, similar in spirit to phone screen-time reports or a GitHub contribution graph.

The core interaction loop is: set duration → label session → start → (optional breaks) → session ends → session is logged → user reviews via Analytics or Past Sessions. Every other feature exists to support this loop; the agent should not introduce steps that add friction before "start" or during an active session.

## The Problem It Solves

Most timer/pomodoro apps either (a) enforce a single rigid work/break interval structure (e.g. 25/5 Pomodoro) that doesn't fit variable-length deep work, or (b) surround the timer with buttons, settings, and notifications that themselves become a distraction. This app solves two specific problems:

1. **Distraction during focus**: once a session starts, there is no visible UI except the number. No buttons, no navigation, no badges. The only interactive element (the break prompt) is hidden until the user deliberately hovers, so it cannot be accidentally clicked or glanced at.
2. **Invisible focus habits**: users do not know how long they actually focus per day/week, how often they break, or whether their breaks are short or long. This app logs every session and break automatically (no manual timesheet entry) and turns that log into simple, glanceable analytics.

## Pages

```
/                     - Home. Timer duration picker, session label input, play button. Top-right tabs: Analytics, Past Sessions.
/session              - Fullscreen active-session view. Renders the countdown or the break stopwatch depending on session state. Not reachable directly via nav; entered only by pressing play on "/".
/analytics            - Charts and aggregate stats: focus time, break count, break time, per-period averages (weekly/monthly).
/history              - List of past sessions plus a calendar heatmap of daily focus activity.
/login                - Auth entry point (email/password or magic link). Redirects to "/" on success.
/signup               - Account creation. Redirects to "/" on success.
```

## Navigation

- Top navigation bar, visible only on `/`, `/analytics`, and `/history` (never on `/session`).
- Left side of the top bar: app logo/name, acts as a link back to `/`.
- Right side of the top bar: two tabs, "Analytics" and "Past Sessions", linking to `/analytics` and `/history` respectively. These are peer tabs, not a dropdown.
- No sidebar. No bottom navigation. Navigation is deliberately minimal — this is a 3-screen app plus auth.
- `/session` has zero persistent navigation chrome. Returning to `/` only happens automatically when the session/break cycle ends (timer reaches zero) or if the user explicitly exits (see Out of Scope note on manual exit).

## Core User Flow

**1. Onboarding**
User lands on `/login` or `/signup` if unauthenticated. After signup/login, user is redirected to `/` (Home). No onboarding tutorial, tour, or setup wizard — the interface must be self-explanatory from the Home screen alone.

**2. Home (`/`)**
User sees the heading "Ready to focus?" in large serif type. Below it: an unboxed inline duration field accepting `MM:SS` or `H:MM:SS`, a text input for the optional session label, and a play button. Top-right shows the Analytics and Past Sessions tabs plus Sign out. User sets a duration, optionally types a label, and presses play.

**3. Active Session (`/session`) — Focus State**
On pressing play, the app transitions to a fullscreen view: black background, large white countdown numerals showing time remaining, counting down in real time. No other UI elements are visible by default. If the user's cursor hovers anywhere on this screen, the timer visually blurs and a clickable text "Take a break?" fades in near the center. Moving the cursor away restores the sharp countdown. Clicking "Take a break?" transitions to Break State.

**4. Active Session (`/session`) — Break State**
The countdown pauses (remaining focus time is frozen, not lost) and the screen shows a stopwatch counting up from 0:00, rendered in a soft red/muted tone (not a harsh alert red) against the same black background. On hover, the stopwatch blurs and a "Focus again?" clickable text appears. Clicking it resumes the countdown from where it was frozen, and the break's duration is recorded as a completed break entry tied to the current session.

**5. Stopping a Session Early**
While in Focus State, hovering also reveals a second, visually secondary clickable text (e.g. smaller or lower-opacity than "Take a break?") reading "Stop session?" or equivalent. Clicking it ends the session immediately: the app records the elapsed focus time up to that point, marks the session `status = abandoned`, persists it (including any breaks already taken), and returns the user to `/`. This control is not available while in Break State — a user must resume focus before they can stop the session. There is no confirmation dialog; the click is final.

**6. Session Completion**
When the countdown reaches 0:00 while in Focus State, the app does not show buttons or abruptly stop. It presents a gradual visual/audio cue (e.g. fading brightness pulse and/or gently rising volume tone) to alert the user the session is over. Once acknowledged (or after a short auto-timeout), the session is marked complete, persisted with its label, planned duration, actual focused duration, and full break list, and the user is returned to `/`.

**7. Analytics (`/analytics`)**
User taps the Analytics tab from Home. Sees charts for weekly and monthly views: total focus time, number of breaks taken, total/average break time, and average session length. Each metric also shows an all-time or period average. All data shown is scoped to the logged-in user only.

**8. Past Sessions (`/history`)**
User taps the Past Sessions tab from Home. Sees a reverse-chronological list of past sessions (label, date, planned vs. actual duration, break count) and a calendar heatmap (GitHub/LeetCode style) where each day's cell intensity reflects total focus time that day.

## Data Architecture

All persisted data is scoped to an authenticated user via a `user_id` foreign key. There is no data sharing between users in this version — every entity below is private to its owner.

**User**
- `id` (uuid, primary key)
- `email`
- `created_at`
- Represents the authenticated account. Source of truth is the auth provider (e.g. Supabase Auth); app-level tables reference `user_id`.

**FocusSession**
- `id` (uuid, primary key)
- `user_id` (foreign key → User.id) — owner of the session, required
- `label` (string, nullable) — user-provided description of session intent
- `planned_duration_seconds` (integer) — duration selected on the scroll wheel
- `actual_focus_seconds` (integer) — sum of time actually spent in Focus State (excludes break time)
- `started_at` (timestamp)
- `ended_at` (timestamp, nullable until session completes)
- `status` (enum: `active`, `on_break`, `completed`, `abandoned`)
- Relates to many `Break` rows (one session has zero or more breaks).

**Break**
- `id` (uuid, primary key)
- `session_id` (foreign key → FocusSession.id)
- `user_id` (foreign key → User.id) — denormalized for query simplicity and to enforce row-level security directly on this table
- `started_at` (timestamp)
- `ended_at` (timestamp, nullable until break ends)
- `duration_seconds` (integer, computed on break end)

**UserSettings** (minimal, for defaults)
- `user_id` (primary key, foreign key → User.id)
- `default_duration_seconds` (integer) — last-used or preferred default for the scroll wheel
- No other configurable settings in this version.

**Derived/computed data (not stored as separate rows):**
- Weekly/monthly totals and averages shown in Analytics are computed by querying `FocusSession` and `Break` rows filtered by `user_id` and date range, not pre-aggregated tables, for the initial version.
- Heatmap data in `/history` is computed by grouping `FocusSession.actual_focus_seconds` by calendar day for the given `user_id`.

No data in this app is shared, public, or cross-user. Every table/query must filter by the authenticated `user_id`.

## Features In Scope

- Scroll-wheel style duration picker (hours/minutes/seconds) on Home
- Optional freeform text label per session
- Fullscreen distraction-free countdown timer (black background, white numerals)
- Hover-to-reveal "Take a break?" control during focus, hidden by default
- Hover-to-reveal "Stop session?" control during focus, hidden by default, ending the session early and logging it as abandoned
- Break stopwatch (counts up from 0, muted/soft color) with hover-to-reveal "Focus again?" control
- Pause/resume semantics where break time does not count against the planned focus duration
- Gradual (non-jarring) end-of-session alert
- Automatic logging of every completed session and its breaks
- Analytics tab: weekly/monthly totals for focus time, break count, break time; period averages
- Past Sessions tab: chronological session list
- Past Sessions tab: calendar heatmap of daily focus time
- Basic email/password (or magic link) authentication
- Per-user data isolation

## Features Out of Scope

- Manual editing of past session records (times, labels) after the fact
- A "stop session" control while in Break State (user must resume focus before they can stop; no stop control is shown on the stopwatch screen)
- Confirmation dialogs, undo, or recovery for an abandoned/stopped session — stopping is immediate and final
- Multiple concurrent sessions or multi-tasking between sessions
- Pomodoro-style automatic repeating work/break cycles or preset interval templates
- Push notifications, desktop notifications, or background/mobile-app reminders
- Social features: sharing sessions, leaderboards, friends, public profiles, or any cross-user visibility
- Team/organization accounts or multi-user workspaces
- Calendar app integration (Google Calendar, Outlook, etc.)
- Task/to-do list management beyond the single freeform label field
- Custom themes, colors, or sound selection
- Native mobile apps (iOS/Android) — web/PWA only in this version
- Offline-first full functionality (some local buffering for resilience is in scope; full offline mode is not)
- Data export (CSV/PDF export of session history)
- Third-party integrations (Slack status, Spotify, etc.)
- Streaks, gamification, badges, or achievement systems
- Settings page beyond a stored default duration

## Target User

Individual knowledge workers, students, and remote/freelance professionals who self-direct their own work blocks and want a low-friction way to run and reflect on focus sessions. Assumed to be comfortable with standard web apps (no technical expertise required, but not a "casual app store user" persona — this is a personal productivity tool typically opened intentionally at the start of a work block, not browsed). Single-user accounts only; no assumption of managerial oversight or team usage.

## Success Criteria

- A user can go from landing on `/` to a running fullscreen timer in 2 interactions or fewer (set duration, press play), with labeling optional.
- No UI element other than the countdown/stopwatch number is visible on `/session` unless the cursor is actively hovering.
- Every completed session persists a row in `FocusSession` with accurate `planned_duration_seconds` and `actual_focus_seconds`, and each break within it persists a corresponding `Break` row with the correct `duration_seconds`.
- Break time is never included in `actual_focus_seconds`, and pausing for a break does not reset or lose the remaining countdown.
- The Analytics tab renders weekly and monthly totals and averages that mathematically match the sum/average of the underlying `FocusSession`/`Break` rows for that user and period.
- The Past Sessions heatmap accurately reflects daily totals with no cross-user data leakage (verified via row-level security or equivalent query scoping).
- Stopping a session early from Focus State immediately persists a `FocusSession` row with `status = abandoned` and an `actual_focus_seconds` value matching elapsed focus time at the moment of stopping, and returns the user to `/` with no confirmation prompt.
- Ending a session never presents an abrupt cutoff (a jarring beep/flash) — the end-of-session alert is visibly/audibly gradual.
- A user's data is fully isolated: querying as User A never returns any row owned by User B.
