# Supabase patterns for TNVM

## Client setup
// lib/supabase.ts
import { createClient } from '@supabase/supabase-js'
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

## Server-side (API routes, Server Components)
import { createClient } from '@supabase/supabase-js'
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!  // bypasses RLS — admin only
)

## Getting current user (Server Component)
import { cookies } from 'next/headers'
const supabase = createServerClient(...)
const { data: { session } } = await supabase.auth.getSession()
const { data: profile } = await supabase
  .from('profiles').select('*').eq('id', session.user.id).single()

## RLS policy pattern (run in Supabase SQL editor)
-- Public read
CREATE POLICY "public can read events"
ON events FOR SELECT USING (true);

-- Owner can update own row
CREATE POLICY "user updates own profile"
ON profiles FOR UPDATE USING (auth.uid() = id);

-- Admin only
CREATE POLICY "admin manages announcements"
ON announcements FOR ALL USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
);

## Key table queries
-- Get upcoming events
SELECT * FROM events WHERE event_date > now() ORDER BY event_date ASC LIMIT 5;

-- Get approved members
SELECT * FROM profiles WHERE status = 'approved' ORDER BY full_name;

-- Check if user RSVPd
SELECT * FROM rsvps WHERE event_id = $1 AND user_id = auth.uid();
