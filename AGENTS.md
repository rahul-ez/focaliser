<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
# AGENTS.md

**Project:** Focaliser
**Framework:** Next.js 15 (App Router)
**Backend:** Supabase

This file is a contract. Follow it exactly.

---

## 1. Read Order

Before writing any code, read these files in this exact order:

1. `context/project-overview.md`
2. `context/architecture.md`
3. `context/ui-tokens.md`
4. `context/ui-rules.md`
5. `context/ui-registry.md`
6. `context/code-standards.md`
7. `context/library-docs.md`
8. `context/build-plan.md`
9. `context/progress-tracker.md`

Do not skip a file. Do not write code before all nine have been read in this session.

---

## 2. Non-Negotiable Rules

- Never use hardcoded color values or raw Tailwind default color classes (e.g. `bg-white`, `text-blue-500`, `#612D53`). Use only tokens defined in `ui-tokens.md`.
- Update `progress-tracker.md` and `ui-registry.md` after every completed feature — before ending the turn, not as a follow-up.
- Before using any third-party library: check for an installed skill first, then read `library-docs.md` for project-specific rules. Never rely on general training knowledge if either source covers it.
- If the same problem persists after one corrective prompt, stop. Do not attempt a third fix blind. Run `/recover`.

---

## 3. Available Skills

- `/architect` — run before starting any complex feature
- `/imprint` — run after building any new UI component
- `/review` — run before a demo, or when something feels off
- `/recover` — run when something breaks after one failed correction attempt
- `/remember save` — run when a feature spans multiple sessions and the session is ending
- `/remember restore` — run when returning to a feature that spans multiple sessions

---

## 4. Backend

- **Provider:** Supabase
- **Project name:** focaliser
- **API base URL:** `${NEXT_PUBLIC_SUPABASE_URL}` (see `.env.local`)
- **Skills installed for this backend:** none. No MCP server is connected for Supabase in this project. Use `library-docs.md` as the authoritative source for project-specific Supabase patterns.
- **Credential files:**
  - `.env.local` — real values, git-ignored, never committed
  - `.env.example` — placeholder values only, committed, used as the template for `.env.local`
- **Required variables:** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (server-only, reserved for admin tooling — never imported into application code)