# 🔨 Work While Waiting for Rate Limit Reset

**⏱️ Timeline:** Next 30-60 minutes while the Supabase email rate limit resets

**Goal:** Build Phase 5 components so they're ready to test once rate limit expires and auth works

---

## What We CAN Do (No Auth Needed)
✅ Create React components  
✅ Write TypeScript  
✅ Build UI with Tailwind CSS  
✅ Create API endpoints  
✅ Write database queries  

## What We CAN'T Do (Needs Working Auth)
❌ Test registration  
❌ Test login  
❌ Test protected routes  
⏳ Have to wait until rate limit resets

---

## Priority Build Tasks (60-90 min total)

### Task 1: Create /app/(member)/dashboard/page.tsx
**Time:** 15 min  
**What:** Main member dashboard with profile overview + quick actions

**Deliverable:**
- Component structure (no API calls yet)
- Tailwind CSS styling
- TypeScript interface for profile data
- Placeholder cards for RSVPs & events

**File location:** `/Users/ramnivas/Mygit/TNVM/TNVM_Website/tnvm/src/app/(member)/dashboard/page.tsx`

---

### Task 2: Create /app/(member)/profile/edit/page.tsx
**Time:** 15 min  
**What:** Edit member profile form (name, city, phone, family_size)

**Deliverable:**
- Form with Zod validation schema
- Tailwind CSS styling
- useState for form state
- Save button (backend logic in API)

**File location:** `/Users/ramnivas/Mygit/TNVM/TNVM_Website/tnvm/src/app/(member)/profile/edit/page.tsx`

---

### Task 3: Create /api/profile/update endpoint
**Time:** 15 min  
**What:** Server route to update member profile in database

**Deliverable:**
```typescript
// POST /api/profile/update
// Receives: { full_name, city, phone, family_size }
// Returns: { success: true, data: updatedProfile }
```

**File location:** `/Users/ramnivas/Mygit/TNVM/TNVM_Website/tnvm/src/app/api/profile/update/route.ts`

---

### Task 4: Create /app/(member)/events/page.tsx
**Time:** 10 min  
**What:** Browse all events as a member

**Deliverable:**
- Events grid with Tailwind
- Card showing title, description, date, image
- Link to individual event page

**File location:** `/Users/ramnivas/Mygit/TNVM/TNVM_Website/tnvm/src/app/(member)/events/page.tsx`

---

### Task 5: Create /app/(member)/rsvps/page.tsx
**Time:** 10 min  
**What:** Show member's current RSVPs (event registrations)

**Deliverable:**
- List of events user has RSVP'd to
- Show date, time, location
- Cancel RSVP button (no backend yet)

**File location:** `/Users/ramnivas/Mygit/TNVM/TNVM_Website/tnvm/src/app/(member)/rsvps/page.tsx`

---

### Task 6: Create /lib/types.ts
**Time:** 5 min  
**What:** TypeScript interfaces for database tables

**Deliverable:**
```typescript
interface Profile {
  id: string
  full_name: string
  email: string
  phone?: string
  city?: string
  family_size: number
  role: 'member' | 'admin'
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
}

interface Event {
  id: string
  title: string
  description?: string
  event_date: string
  location?: string
  image_url?: string
  rsvp_count: number
  created_by?: string
  created_at: string
}

// ... more types
```

**File location:** `/Users/ramnivas/Mygit/TNVM/TNVM_Website/tnvm/src/lib/types.ts`

---

## Quick Build Plan

### Option A: Build ALL (90 min) ⭐ Recommended
```
1. Create types.ts (5 min)
2. Dashboard page (15 min)
3. Profile edit page (15 min)
4. Events page (10 min)
5. RSVPs page (10 min)
6. API endpoint (15 min)
7. Test compile (5 min)
```
→ You'll have 6 Phase 5 components ready for testing when rate limit resets!

### Option B: Build Essentials Only (45 min)
```
1. Create types.ts (5 min)
2. Dashboard page (15 min)
3. Profile edit page (15 min)
4. API endpoint (10 min)
```
→ Faster, but Events & RSVPs come later

### Option C: Just Planning (15 min)
```
1. Read PHASE_5_GUIDE.md thoroughly
2. Understand component structure
3. Plan folder organization
```
→ Start coding after rate limit resets

---

## Let Me Know Your Choice

**Which option would you prefer?**

**A)** Build everything now (90 min) - Ready for full testing when rate limit resets ⭐  
**B)** Build essentials (45 min) - Dashboard + Profile + API working  
**C)** Just planning (15 min) - Start coding after rate limit resets

---

## Bonus Work (If time allows)

- [ ] Create `/app/(member)/layout.tsx` with member navigation
- [ ] Create `/app/api/events/list/route.ts` (get all events)
- [ ] Create `/app/api/rsvps/list/route.ts` (get user's RSVPs)
- [ ] Create `/app/api/rsvps/create/route.ts` (new RSVP)
- [ ] Create navigation sidebar for member area
- [ ] Add breadcrumbs to member pages

