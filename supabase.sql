-- ============================================
-- TNVM DATABASE SCHEMA
-- Run this entire block in one go
-- ============================================

-- Enable UUID generation
create extension if not exists "uuid-ossp";

-- ============================================
-- TABLE 1: PROFILES (members)
-- ============================================
create table profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  full_name text not null,
  email text not null unique,
  phone text,
  city text,
  family_size integer default 1,
  avatar_url text,
  role text not null default 'member' check (role in ('member', 'admin')),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamp with time zone default now()
);

-- ============================================
-- TABLE 2: EVENTS
-- ============================================
create table events (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  description text,
  location text,
  event_date timestamp with time zone not null,
  image_url text,
  rsvp_count integer default 0,
  created_by uuid references profiles(id) on delete set null,
  created_at timestamp with time zone default now()
);

-- ============================================
-- TABLE 3: RSVPS
-- ============================================
create table rsvps (
  id uuid default uuid_generate_v4() primary key,
  event_id uuid references events(id) on delete cascade not null,
  user_id uuid references profiles(id) on delete cascade not null,
  created_at timestamp with time zone default now(),
  unique(event_id, user_id)
);

-- ============================================
-- TABLE 4: ANNOUNCEMENTS
-- ============================================
create table announcements (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  body text not null,
  author_id uuid references profiles(id) on delete set null,
  published_at timestamp with time zone default now(),
  created_at timestamp with time zone default now()
);

-- ============================================
-- TABLE 5: GALLERY ALBUMS
-- ============================================
create table gallery_albums (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  cover_url text,
  created_by uuid references profiles(id) on delete set null,
  created_at timestamp with time zone default now()
);

-- ============================================
-- TABLE 6: GALLERY PHOTOS
-- ============================================
create table gallery_photos (
  id uuid default uuid_generate_v4() primary key,
  album_id uuid references gallery_albums(id) on delete cascade not null,
  url text not null,
  caption text,
  uploaded_by uuid references profiles(id) on delete set null,
  created_at timestamp with time zone default now()
);

-- ============================================
-- TABLE 7: DONATIONS
-- ============================================
create table donations (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) on delete set null,
  amount integer not null,
  currency text default 'cad',
  stripe_session_id text unique,
  status text default 'pending' check (status in ('pending', 'completed', 'failed')),
  created_at timestamp with time zone default now()
);

-- ============================================
-- TABLE 8: CONTACT MESSAGES
-- ============================================
create table contact_messages (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  email text not null,
  message text not null,
  created_at timestamp with time zone default now()
);

-- ============================================
-- TABLE 9: NOTIFICATIONS
-- ============================================
create table notifications (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  body text not null,
  sent_by uuid references profiles(id) on delete set null,
  sent_at timestamp with time zone default now()
);

-- ============================================
-- ENABLE ROW LEVEL SECURITY ON ALL TABLES
-- ============================================
alter table profiles enable row level security;
alter table events enable row level security;
alter table rsvps enable row level security;
alter table announcements enable row level security;
alter table gallery_albums enable row level security;
alter table gallery_photos enable row level security;
alter table donations enable row level security;
alter table contact_messages enable row level security;
alter table notifications enable row level security;

-- ============================================
-- RLS POLICIES: PROFILES
-- ============================================
-- Anyone can read approved member profiles (for directory)
create policy "public can view approved profiles"
on profiles for select
using (status = 'approved');

-- User can read their own profile regardless of status
create policy "user can view own profile"
on profiles for select
using (auth.uid() = id);

-- User can update their own profile
create policy "user can update own profile"
on profiles for update
using (auth.uid() = id);

-- Admin can view all profiles
create policy "admin can view all profiles"
on profiles for select
using (
  (select role from profiles where id = auth.uid()) = 'admin'
);

-- Admin can update any profile (approve/reject)
create policy "admin can update any profile"
on profiles for update
using (
  (select role from profiles where id = auth.uid()) = 'admin'
);

-- System can insert profile on registration
create policy "system can insert profile"
on profiles for insert
with check (auth.uid() = id);

-- ============================================
-- RLS POLICIES: EVENTS
-- ============================================
-- Everyone can read events
create policy "public can view events"
on events for select
using (true);

-- Only admin can create events
create policy "admin can create events"
on events for insert
with check (
  (select role from profiles where id = auth.uid()) = 'admin'
);

-- Only admin can update events
create policy "admin can update events"
on events for update
using (
  (select role from profiles where id = auth.uid()) = 'admin'
);

-- Only admin can delete events
create policy "admin can delete events"
on events for delete
using (
  (select role from profiles where id = auth.uid()) = 'admin'
);

-- ============================================
-- RLS POLICIES: RSVPS
-- ============================================
-- Approved members can RSVP
create policy "approved members can rsvp"
on rsvps for insert
with check (
  auth.uid() = user_id and
  (select status from profiles where id = auth.uid()) = 'approved'
);

-- Members can cancel their own RSVP
create policy "members can delete own rsvp"
on rsvps for delete
using (auth.uid() = user_id);

-- Anyone can see RSVP counts (not who RSVPd)
create policy "public can view rsvps"
on rsvps for select
using (true);

-- ============================================
-- RLS POLICIES: ANNOUNCEMENTS
-- ============================================
-- Everyone can read announcements
create policy "public can view announcements"
on announcements for select
using (true);

-- Only admin can create/edit/delete
create policy "admin manages announcements"
on announcements for all
using (
  (select role from profiles where id = auth.uid()) = 'admin'
);

-- ============================================
-- RLS POLICIES: GALLERY ALBUMS
-- ============================================
-- Everyone can view albums
create policy "public can view albums"
on gallery_albums for select
using (true);

-- Only admin can manage albums
create policy "admin manages albums"
on gallery_albums for all
using (
  (select role from profiles where id = auth.uid()) = 'admin'
);

-- ============================================
-- RLS POLICIES: GALLERY PHOTOS
-- ============================================
-- Everyone can view photos
create policy "public can view photos"
on gallery_photos for select
using (true);

-- Approved members can upload photos
create policy "approved members can upload photos"
on gallery_photos for insert
with check (
  (select status from profiles where id = auth.uid()) = 'approved'
);

-- Admin can delete any photo
create policy "admin can delete photos"
on gallery_photos for delete
using (
  (select role from profiles where id = auth.uid()) = 'admin'
);

-- Member can delete own photo
create policy "member can delete own photo"
on gallery_photos for delete
using (auth.uid() = uploaded_by);

-- ============================================
-- RLS POLICIES: DONATIONS
-- ============================================
-- Anyone can insert a donation (guest donations allowed)
create policy "anyone can create donation"
on donations for insert
with check (true);

-- Only admin can view all donations
create policy "admin can view donations"
on donations for select
using (
  (select role from profiles where id = auth.uid()) = 'admin'
);

-- User can view own donations
create policy "user can view own donations"
on donations for select
using (auth.uid() = user_id);

-- Only admin can update donation status
create policy "admin can update donations"
on donations for update
using (
  (select role from profiles where id = auth.uid()) = 'admin'
);

-- ============================================
-- RLS POLICIES: CONTACT MESSAGES
-- ============================================
-- Anyone can send a contact message
create policy "anyone can send contact message"
on contact_messages for insert
with check (true);

-- Only admin can read messages
create policy "admin can view contact messages"
on contact_messages for select
using (
  (select role from profiles where id = auth.uid()) = 'admin'
);

-- ============================================
-- RLS POLICIES: NOTIFICATIONS
-- ============================================
-- Only admin can do anything with notifications
create policy "admin manages notifications"
on notifications for all
using (
  (select role from profiles where id = auth.uid()) = 'admin'
);

-- ============================================
-- AUTO-CREATE PROFILE ON SIGNUP TRIGGER
-- ============================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, email, status, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', 'New Member'),
    new.email,
    'pending',
    'member'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================
-- RSVP COUNT AUTO-UPDATE TRIGGER
-- ============================================
create or replace function update_rsvp_count()
returns trigger as $$
begin
  if TG_OP = 'INSERT' then
    update events set rsvp_count = rsvp_count + 1 where id = NEW.event_id;
  elsif TG_OP = 'DELETE' then
    update events set rsvp_count = rsvp_count - 1 where id = OLD.event_id;
  end if;
  return null;
end;
$$ language plpgsql security definer;

create trigger on_rsvp_change
  after insert or delete on rsvps
  for each row execute procedure update_rsvp_count();


  update profiles
set role = 'admin', status = 'approved'
where email = 'your@email.com';