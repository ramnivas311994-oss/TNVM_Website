# CLAUDE.md — TNVM Project Intelligence

## What this project is
Tamil community website for TNVM (tnvm.org).
~3000 members, low traffic, zero budget, security is the top priority.

## Tech stack (never deviate from this)
- Frontend : Next.js 14 App Router + Tailwind CSS
- Backend  : Supabase (Postgres + Auth + Storage)
- Images   : Cloudinary
- Payments : Stripe
- Hosting  : Vercel
- i18n     : next-intl (English + Tamil)

## Rules you must always follow
1. Read PROGRESS.md before starting any task
2. Read skills/SECURITY.md before writing any auth, form, or API route
3. Read skills/SUPABASE.md before writing any DB query
4. Never write a secret or API key in any file — use process.env only
5. Every form must have Zod server-side validation
6. Every Supabase table must have RLS enabled
7. Every admin route must check role === 'admin' in middleware
8. Mobile-first: write Tailwind mobile styles first, then md: breakpoints
9. Never break a working feature when adding a new one
10. After every task, update PROGRESS.md

## Folder structure
/app/(public)/     → public pages (no auth required)
/app/(auth)/       → login, register pages
/app/(member)/     → logged-in member pages
/app/(admin)/      → admin-only pages
/app/api/          → API routes (Stripe webhook, push notify)
/components/ui/    → reusable UI: Button, Card, Input, Modal
/components/layout/→ Navbar, Footer, WhatsAppButton
/lib/              → supabase.ts, cloudinary.ts, stripe.ts, validators.ts
/messages/         → en.json, ta.json

## Design tokens
Primary red  : #B91C1C
Primary gold : #D97706
Font         : Inter (Latin) + Lohit Tamil (Tamil text)
Border radius: 8px

## How to ask me for tasks
Use this format for efficiency:
"Task: [what to build]
File: [which file to create/edit]
Depends on: [any other file I need to read first]"