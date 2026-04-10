# TNVM PROJECT — COMPLETE UNDERSTANDING DOCUMENT

## What is TNVM?
**Tamil New Year Virtual Meet** — A community website for ~3000 Tamil members in Canada.
- **Purpose**: Connect members, organize events, share resources, accept donations
- **Budget**: Zero (using free tiers + open-source)
- **Priority**: Security and member privacy

---

## Tech Stack & Why We Use It

| Component | Choice | Why? |
|-----------|--------|------|
| **Frontend** | Next.js 14 + Tailwind CSS | Fast, SEO-friendly, mobile-first styling |
| **Backend** | Supabase (Postgres + Auth) | Free, secure, built-in RLS for data access control |
| **Auth** | Supabase Auth | Email + Google OAuth, handles password hashing, session mgmt |
| **Images** | Cloudinary | CDN-optimized image delivery, automatic compression |
| **Payments** | Stripe | Secure checkout, webhooks for transaction tracking |
| **Hosting** | Vercel | Free tier, auto-deploys from GitHub, fast edge network |
| **i18n** | next-intl | Multi-language support (English + Tamil) |
| **Forms** | Zod + Server Actions | Type-safe validation, server-side security |

---

## Architecture Overview

```
Frontend (Next.js 14)
    ↓ (HTTPS)
├─→ Public Pages (/, /about, /events, /gallery, /donate, /contact)
├─→ Auth Pages (/login, /register)
├─→ Member Area (after login: /dashboard, /rsvp, /gallery-upload)
└─→ Admin Panel (admins only: /admin/members, /admin/events, /admin/donations)
    ↓ (RLS-protected)
Backend: Supabase (https://ndqacuqchzgtkceaflke.supabase.co)
├─→ PostgreSQL Database (9 tables with RLS policies)
├─→ Auth (email + Google OAuth)
├─→ Real-time listeners for live updates
└─→ File storage for images
    ↓ (webhooks)
Stripe (donations)
Cloudinary (images)
OneSignal (push notifications)
```

---

## Part 1: Database Schema (9 Tables with RLS)

### 1. PROFILES Table
```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  status TEXT DEFAULT 'pending',  -- 'pending', 'approved', 'rejected'
  role TEXT DEFAULT 'member',      -- 'member', 'admin'
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```
**Purpose**: Store user information synced with Supabase Auth
**RLS Policy**: Users can read all profiles, update only their own
**Auto-created**: When user signs up, trigger fires to insert into this table

### 2. EVENTS Table
```sql
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  start_date TIMESTAMP NOT NULL,
  end_date TIMESTAMP NOT NULL,
  location TEXT,
  image_url TEXT,  -- Cloudinary URL
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP DEFAULT NOW()
);
```
**Purpose**: Store TNVM events (parties, celebrations, webinars)
**RLS Policy**: Public read, admins only create/edit
**Example**: "Tamil New Year Celebration - April 14, 2026"

### 3. RSVPs Table (Event Registrations)
```sql
CREATE TABLE rsvps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'attending',  -- 'attending', 'not_attending', 'maybe'
  notes TEXT,
  UNIQUE(event_id, user_id)  -- One RSVP per user per event
);
```
**Purpose**: Track who's attending which events
**RLS Policy**: Users see RSVPs for events they're registered for
**Example**: John RSVP'd "attending" to "Tamil Food Festival"

### 4. ANNOUNCEMENTS Table
```sql
CREATE TABLE announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  image_url TEXT,
  created_by UUID REFERENCES profiles(id),
  is_pinned BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);
```
**Purpose**: Post community news, updates, important notices
**RLS Policy**: Public read, admins only write
**Example**: "New membership fee structure", "Diwali special offer"

### 5. GALLERY_ALBUMS Table
```sql
CREATE TABLE gallery_albums (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  cover_photo_url TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP DEFAULT NOW()
);
```
**Purpose**: Group photos into albums (by event or theme)
**Example**: "Diwali 2025", "Annual Gala 2026", "New Year Celebration"

### 6. GALLERY_PHOTOS Table
```sql
CREATE TABLE gallery_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  album_id UUID REFERENCES gallery_albums(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,  -- Cloudinary URL
  caption TEXT,
  uploaded_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP DEFAULT NOW()
);
```
**Purpose**: Store individual photos (linked to albums)
**RLS Policy**: Approved members only can upload
**Example**: "Group photo from Diwali celebration", "Dance performance"

### 7. DONATIONS Table (Stripe Integration)
```sql
CREATE TABLE donations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  amount DECIMAL(10, 2) NOT NULL,
  stripe_payment_id TEXT,
  status TEXT DEFAULT 'pending',  -- 'pending', 'completed', 'failed'
  message TEXT,  -- Donor's optional message
  created_at TIMESTAMP DEFAULT NOW()
);
```
**Purpose**: Track donations (created by Stripe webhook)
**RLS Policy**: Users see own donations, admins see all
**Created by**: /api/webhooks/stripe (not users directly)

### 8. CONTACT_MESSAGES Table
```sql
CREATE TABLE contact_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'new',  -- 'new', 'read', 'replied'
  created_at TIMESTAMP DEFAULT NOW()
);
```
**Purpose**: Store contact form submissions
**RLS Policy**: No auth required (public accepts submissions)
**Created by**: /app/(public)/contact page (anyone can submit)

### 9. NOTIFICATIONS Table (OneSignal)
```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);
```
**Purpose**: Store push notification history
**RLS Policy**: Users see only their notifications
**Created by**: Backend when event created or announcement posted

---

## Part 2: Row Level Security (RLS) - Database-Level Access Control

### What is RLS?

**Without RLS (Dangerous):**
```javascript
// Attacker logs in with fake account
const { data } = await supabase.from('profiles').select('*')
// ❌ Returns ALL profiles (including admin data!)
```

**With RLS (Secure):**
```javascript
// Attacker logs in with fake account
const { data } = await supabase.from('profiles').select('*')
// ✅ Database automatically filters based on policy
// Returns only public data that policy allows
```

### How RLS Rules Work in TNVM

**PROFILES Table:**
```sql
-- Policy 1: Authenticated users can read profiles
CREATE POLICY "Profiles readable by authenticated users" ON profiles
  FOR SELECT USING (auth.role() = 'authenticated_user');

-- Policy 2: Users can only update their own profile
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);
```
**Result:**
- ✅ Can read: All profiles (everyone's data public)
- ✅ Can update: Only your own profile
- ❌ Cannot update: Other users' profiles (even if you try to hack)

**EVENTS Table:**
```sql
-- Policy 1: Everyone can read events
CREATE POLICY "Events readable by all" ON events
  FOR SELECT USING (true);

-- Policy 2: Only admins can create events
CREATE POLICY "Only admins create events" ON events
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );
```
**Result:**
- ✅ Can read: All events
- ✅ Can create: Admins only
- ❌ Regular members cannot create events (blocked by DB)

**RSVPs Table:**
```sql
-- Policy: Users can only create their own RSVP
CREATE POLICY "Users insert own RSVP" ON rsvps
  FOR INSERT WITH CHECK (auth.uid() = user_id);
```
**Result:**
- ❌ Cannot RSVP as someone else (DB rejects it)
- ✅ Can RSVP for yourself

---

## Part 3: Authentication Flow (Signup → Login → Access)

```
Step 1: USER VISITS /register
  ├─ Fills form: Name, Email, Password
  └─ Client-side Zod validation shows errors instantly

Step 2: FORM SUBMITTED → POST /api/auth/register
  ├─ Server-side Zod validation (never trust client!)
  ├─ supabase.auth.signUp(email, password)
  └─ Supabase creates: auth.users row + returns user.id

Step 3: TRIGGER FIRES: handle_new_user()
  ├─ PostgreSQL trigger auto-executes on auth.users INSERT
  ├─ INSERT INTO profiles(id, email, full_name, status='pending')
  └─ User now exists in profiles table

Step 4: APP REDIRECTS → /pending
  ├─ Shows: "Awaiting Admin Approval ⏳"
  └─ Middleware blocks: /dashboard access while status='pending'

Step 5: ADMIN APPROVES (in Supabase dashboard)
  ├─ Find user in profiles table
  └─ UPDATE status = 'approved' WHERE email = 'user@example.com'

Step 6: USER VISITS /login
  ├─ Enters email + password
  └─ Clicks: "Sign In with Email"

Step 7: REQUEST → supabase.auth.signInWithPassword()
  ├─ Supabase checks: email + password + email_confirmed
  ├─ If matching: User authenticated ✅
  ├─ If error: Returns error message
  └─ Stores JWT token in browser cookies (httpOnly, secure)

Step 8: MIDDLEWARE CHECK
  ├─ Every route checked by middleware.ts
  ├─ Is user logged in? Check JWT token
  ├─ Is user approved? Check profiles.status = 'approved'
  ├─ Is user admin? Check profiles.role = 'admin'
  └─ Redirect if access denied

Step 9: FINALLY IN DASHBOARD
  ├─ useEffect: supabase.auth.getUser()
  ├─ Show: "Hi, [name]!" + Logout button
  └─ Can now: RSVP to events, upload photos, make donations
```

### Environment Variables (Credentials)

```
NEXT_PUBLIC_SUPABASE_URL=https://ndqacuqchzgtkceaflke.supabase.co
│
├─ NEXT_PUBLIC_* means: Safe to use in browser
├─ Used by: Frontend to connect to Supabase
└─ Limited by: RLS policies (can't bypass data rules)

NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
│
├─ Anon = Anonymous (limited access)
├─ RLS blocks: Unauthorized reads/writes
└─ Example: User can read announcements but not create them

SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIs...
│
├─ Server-side ONLY (never in browser!)
├─ Bypasses RLS (admin access)
├─ Used by: /api routes for admin operations
└─ If leaked: Attacker has full DB access
```

---

## Part 4: How Data Flows (Example: Signup)

```
User Browser                Server (/api/auth/register)       Supabase
    │                              │                               │
    │ Form submit                  │                               │
    │ (name, email, pass) ────────→│                               │
    │                              │                               │
    │                              │ Validate with Zod             │
    │                              │ ✓ name 2-100 chars            │
    │                              │ ✓ email format correct        │
    │                              │ ✓ password >= 6 chars         │
    │                              │                               │
    │                              │ Auth.signUp(email, password)  │
    │                              │ ──────────────────────────→  │
    │                              │                              │
    │                              │        Hash password          │
    │                              │        Create user ID         │
    │                              │        Create JWT token       │
    │                              │ ←───────────────────────────│
    │                              │ { user: { id, email } }      │
    │                              │                              │
    │                              │          TRIGGER             │
    │                              │      handle_new_user()        │
    │                              │          FIRES!               │
    │                              │                              │
    │                              │    INSERT profiles(          │
    │                              │      id = user.id,        ──→│
    │                              │      email = user.email,  │  │
    │                              │      status = 'pending'   │  │
    │                              │    )                      │  │
    │                              │    ←──────────────────────   │
    │                              │                               │
    │ Redirect /pending ←──────────│                               │
    │ Show "Awaiting Approval"     │                               │
```

---

## Part 5: Security Practices in TNVM

### ✅ What We Do Right

| Practice | Why | Example |
|----------|-----|---------|
| **Zod Validation** | Prevent invalid data | `email: z.string().email()` |
| **RLS Policies** | DB-level access control | Users can't see admin data even if they hack |
| **Server-side validation** | Never trust client | Validate again in /api routes |
| **Secure env vars** | Protect secrets | Service role key never "NEXT_PUBLIC_" |
| **Password hashing** | Salted + hashed by Supabase | Never stored as plain text |
| **Middleware** | Route protection | Can't access /admin without role='admin' |
| **CORS + HTTPS** | Encrypted + authorized | All traffic encrypted |
| **Session timeout** | Auto-logout after 1 hour | Reduces token exposure risk |

### ❌ What We Avoid

| Mistake | Why | What We Do Instead |
|---------|-----|-------------------|
| Storing secrets in code | Visible in Git history | Use .env.local + process.env |
| Trusting client input | Can be hacked/spoofed | Always validate server-side |
| Weak passwords | Brute-force attacks | Min 6 chars + Supabase hashing |
| No RLS policies | SQL injection risks | RLS blocks unauthorized access |
| Storing passwords as text | Obvious if DB breached | Supabase uses bcrypt hashing |

---

## Part 6: File Organization

```
tnvm/
├── src/
│   ├── app/
│   │   ├── (public)/              # No auth required
│   │   │   ├── page.tsx           # Homepage
│   │   │   └── ...
│   │   ├── (auth)/                # Auth pages
│   │   │   ├── login/page.tsx
│   │   │   ├── register/page.tsx
│   │   │   └── pending/page.tsx
│   │   ├── (member)/              # Members only
│   │   │   ├── dashboard/page.tsx
│   │   │   └── ...
│   │   ├── (admin)/               # Admins only
│   │   │   ├── approvals/page.tsx
│   │   │   ├── events/page.tsx
│   │   │   └── ...
│   │   ├── api/
│   │   │   ├── auth/register/route.ts      # Signup endpoint
│   │   │   ├── auth/callback/route.ts      # Google OAuth callback
│   │   │   └── webhooks/stripe/route.ts    # Donation webhook
│   │   ├── middleware.ts          # Route protection
│   │   └── layout.tsx             # Global layout
│   ├── lib/
│   │   ├── supabase.ts            # Supabase clients
│   │   ├── validators.ts          # Zod schemas
│   │   ├── cloudinary.ts          # Image upload
│   │   └── stripe.ts              # Payment utils
│   ├── components/
│   │   ├── ui/                    # Reusable buttons, forms
│   │   ├── layout/                # Navbar, Footer
│   │   └── ...
│   └── messages/
│       ├── en.json                # English translations
│       └── ta.json                # Tamil translations
├── public/                        # Static files
├── .env.local                     # Secrets (never commit!)
├── supabase-setup.sql             # Database creation script
└── package.json
```

---

## Part 7: Deployment Steps

### 0️⃣  Setup Database (Manual in Supabase)
```
1. Go: https://ndqacuqchzgtkceaflke.supabase.co/project/_/sql
2. New Query
3. Copy/paste: supabase-setup.sql
4. Click: Run
5. Wait for completion ✅
```

### 1️⃣ Setup Environment Variables

Create `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://ndqacuqchzgtkceaflke.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...
```

### 2️⃣ Test Locally
```bash
npm run dev
# Visit http://localhost:3000
# Test: Signup → Login → Navigate to /dashboard
```

### 3️⃣ Deploy to Vercel
```bash
git push origin main
# Vercel auto-deploys
```

### 4️⃣ Configure Vercel Environment
```
Vercel Dashboard → Settings → Environment Variables
Add same .env variables
Deploy again
```

### 5️⃣ Point Domain
```
Vercel Project → Domains
Add: tnvm.org
Update DNS records
Wait 24-48 hours for propagation
```

---

## Part 8: Troubleshooting Guide

| Error | Cause | Fix |
|-------|-------|-----|
| "Failed to fetch" on signup | Supabase domain unreachable | Check `NEXT_PUBLIC_SUPABASE_URL` correct |
| User can signup but can't login | Email confirmation required | Supabase Auth → Disable "Confirm email" |
| Middleware redirect loop | Infinite redirect cycle | Check middleware conditions for contradictions |
| Can see other users' data | RLS policy missing | Verify RLS table has `FOR SELECT` policy |
| Service role key error | Not in .env.local server-only | Restart dev server after editing .env.local |
| Google OAuth fails | Credentials wrong | Check Supabase Auth → Google provider settings |

---

## Part 9: Quick Database Queries

```sql
-- See all users
SELECT email, status, role, created_at FROM profiles;

-- Approve pending user
UPDATE profiles SET status = 'approved' WHERE email = 'john@example.com';

-- Count approved members
SELECT COUNT(*) FROM profiles WHERE status = 'approved';

-- See all events
SELECT title, start_date, created_by FROM events ORDER BY start_date DESC;

-- How many RSVPs for upcoming events
SELECT e.title, COUNT(r.id) as rsvp_count
FROM events e
LEFT JOIN rsvps r ON e.id = r.event_id
WHERE e.start_date > NOW()
GROUP BY e.id, e.title;

-- Check RLS policies
SELECT policyname, tablename FROM pg_policies;
```

---

## Final Summary

### 1. **profiles** — Member information
- `id` (UUID, links to auth.users)
- `email`, `full_name`, `phone`, `city`, `family_size`
- `role` (member | admin)
- `status` (pending → approved → member can use platform)
- RLS: Public can view approved members, users see own profile, admins see all

### 2. **events** — Community events
- `id`, `title`, `description`, `location`, `event_date`, `image_url`, `rsvp_count`
- RLS: Public can view, only admins can create/edit/delete

### 3. **rsvps** — Event attendance
- `event_id`, `user_id`, `created_at`
- RLS: Approved members can RSVP, members can delete own RSVP, public can see count

### 4. **announcements** — News & updates
- `id`, `title`, `body`, `author_id`, `published_at`
- RLS: Public can view, only admins can manage

### 5. **gallery_albums** — Photo albums
- `id`, `title`, `cover_url`, `created_by`
- RLS: Public can view, only admins can manage

### 6. **gallery_photos** — Individual photos
- `id`, `album_id`, `url`, `caption`, `uploaded_by`
- RLS: Public can view, approved members can upload, anyone can delete own, admins can delete any

### 7. **donations** — Payments from Stripe
- `id`, `user_id`, `amount`, `currency`, `stripe_session_id`, `status`
- RLS: Anyone can insert (guests allowed), admins can view all, users see own

### 8. **contact_messages** — Contact form submissions
- `id`, `name`, `email`, `message`, `created_at`
- RLS: Anyone can send, only admins can view

### 9. **notifications** — Push notifications (OneSignal)
- `id`, `title`, `body`, `sent_by`, `sent_at`
- RLS: Only admins can manage

---

## Security & Row-Level Security (RLS)

**Why RLS?** Database-level access control — even if someone steals an API key, they can only see/edit what RLS policies allow.

### RLS Policy Examples:
```sql
-- Anyone can read approved profiles
CREATE POLICY "public can view approved profiles"
ON profiles FOR SELECT USING (status = 'approved');

-- Users can only update their own profile
CREATE POLICY "user can update own profile"
ON profiles FOR UPDATE USING (auth.uid() = id);

-- Only admins can manage events
CREATE POLICY "admin can manage events"
ON events FOR ALL USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
);
```

---

## Environment Variables (Sensitive Data)

**Location**: `.env.local` (never committed to GitHub)

| Variable | Secret? | For | Example |
|----------|---------|-----|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | No | Frontend | `https://xxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | No | Frontend (limited by RLS) | Long JWT token |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ YES | Server only (bypasses RLS) | Long JWT token |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | No | Frontend | `tnvm` |
| `CLOUDINARY_API_KEY` | ✅ YES | Server only | Numeric string |
| `CLOUDINARY_API_SECRET` | ✅ YES | Server only | Long string |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | No | Frontend | `pk_test_...` |
| `STRIPE_SECRET_KEY` | ✅ YES | Server only | `sk_test_...` |
| `STRIPE_WEBHOOK_SECRET` | ✅ YES | Server only | `whsec_...` |
| `NEXT_PUBLIC_ONESIGNAL_APP_ID` | No | Frontend | UUID |
| `ONESIGNAL_REST_API_KEY` | ✅ YES | Server only | Long string |

**Rule**: Variables with `NEXT_PUBLIC_` are sent to browser. Do NOT prefix secrets with `NEXT_PUBLIC_`.

---

## Build Phases

### ✅ Phase 1: Project Setup — DONE
- [x] GitHub repo created
- [x] Next.js 14 initialized
- [x] Dependencies installed
- [x] Supabase, Cloudinary, Stripe, OneSignal accounts created
- [x] All env vars added to `.env.local`
- [x] Skills folder copied (`/tnvm/skills/security.md`, `supabase.md`, `Nextjs.md`)

### ✅ Phase 2: Database — DONE
- [x] 9 tables created in Supabase
- [x] RLS enabled on all tables
- [x] RLS policies written for each table
- [x] Auto-trigger: profile created when user signs up

### 🔄 Phase 3: Auth — IN PROGRESS
- [ ] Google OAuth configured (credentials in `.env`)
- [ ] `/lib/supabase.ts` created (client setup)
- [ ] `/app/(auth)/login/page.tsx` (email)
- [ ] `/app/(auth)/register/page.tsx` (email)
- [ ] `middleware.ts` (protect routes)
- [ ] Google OAuth callback handler

### ⏳ Phase 4: Public Pages
- [ ] `/` Home page
- [ ] `/about`, `/events`, `/gallery`, `/directory`, `/news`, `/resources`, `/donate`, `/contact`

### ⏳ Phase 5: Member Area
- [ ] `/dashboard` (profile edit, view RSVPs)
- [ ] RSVP functionality
- [ ] Photo uploads

### ⏳ Phase 6: Admin Panel
- [ ] `/admin` dashboard
- [ ] Approve/reject members
- [ ] Manage events, announcements, gallery, donations
- [ ] Push notifications
- [ ] CSV export

### ⏳ Phase 7: Integrations
- [ ] Stripe webhook for donations
- [ ] Cloudinary image uploads
- [ ] WhatsApp floating button
- [ ] OneSignal push notifications
- [ ] Tamil font loading

### ⏳ Phase 8: Deployment
- [ ] Add env vars to Vercel
- [ ] Point tnvm.org DNS to Vercel
- [ ] SSL & security audit
- [ ] Mobile testing

---

## Development Workflow

### Starting a new feature:
1. **Read CLAUDE.md** — Project guidelines
2. **Read PROGRESS.md** — What's done, what's next
3. **Read skills/ files** — Security, Supabase, Next.js patterns
4. **Request task format**:
   ```
   Task: Build the member registration form
   File: /app/(auth)/register/page.tsx
   Read first: skills/SECURITY.md, skills/SUPABASE.md
   Requirements: Zod validation, Supabase insert, status=pending
   ```

### After each task:
1. **Update PROGRESS.md** — Mark as [x] done
2. **Note in session** — What was built, any decisions made
3. **Never break existing features** — Always test

---

## How to Deploy to Vercel

1. Push code to GitHub
2. **Vercel Dashboard** → Project → Settings → Environment Variables
3. Add EVERY variable from `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   SUPABASE_SERVICE_ROLE_KEY=...
   (etc.)
   ```
4. Redeploy
5. Point tnvm.org DNS to Vercel nameservers

---

## Key Decision Log

| Date | Decision | Reason |
|------|----------|--------|
| 2026-04-10 | Supabase for backend | Free tier, built-in auth, RLS for security |
| 2026-04-10 | Zod + Server Actions for forms | Type-safe, server-side validation, CSRF protection |
| 2026-04-10 | Email + Google OAuth | Easier signup, less friction |

---

## Questions During Development?

Check in this order:
1. **CLAUDE.md** — Project rules & folder structure
2. **skills/security.md** — Auth, forms, API security
3. **skills/supabase.md** — Database queries, RLS patterns
4. **skills/Nextjs.md** — Component structure, i18n, Tailwind
5. This file (**Understand.md**) — Architecture & "why" decisions

---

## ✅ PHASE 2 COMPLETION - TESTING VERIFIED (April 10, 2026)

### Registration Flow Tested & Confirmed Working
```
✅ User registers at http://localhost:3000/register
✅ Form validates (Zod schema)
✅ Sends to /api/auth/register endpoint
✅ Supabase creates auth user
✅ Trigger auto-creates profile with status='pending'
✅ Confirmation email sent successfully
✅ Profile visible in Supabase dashboard
✅ Middleware blocks /dashboard access (pending status)
```

### Next Immediate Steps

**Step 1: Approve Your Test User (SQL Query)**
Go to: https://ndqacuqchzgtkceaflke.supabase.co/project/_/sql
```sql
UPDATE profiles 
SET status = 'approved' 
WHERE email = 'your@email.com';
```

**Step 2: Test Login**
- Go to: http://localhost:3000/login
- Enter your confirmed email + password
- Should redirect to /dashboard
- Navbar shows: "Hi, [name]! Logout"

**Step 3: Build Phase 5 (Member Area)**
- Dashboard profile page
- View RSVPs
- Edit profile
- Upload to gallery

---

### Design Improvements (Can Do Later)

Current focus: **Functionality & Security** ✅  
Later phase: **UI/UX Polish**

Areas for future improvement:
- Color schemes & branding
- Typography & spacing
- Button styles & animations
- Form layouts
- Mobile UX
- Dark mode support

---

**Status: Ready for Phase 5 - Member Area Build 🚀**

