-- ====================================================================
-- TNVM Database Schema Setup
-- Copy & paste this entire script into Supabase SQL Editor and run it
-- ====================================================================

-- TABLE 1: Profiles (auto-created by auth trigger)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  role TEXT DEFAULT 'member', -- 'member', 'admin'
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- TABLE 2: Events
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  start_date TIMESTAMP NOT NULL,
  end_date TIMESTAMP NOT NULL,
  location TEXT,
  image_url TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- TABLE 3: RSVPs
CREATE TABLE IF NOT EXISTS rsvps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'attending', -- 'attending', 'not_attending', 'maybe'
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(event_id, user_id)
);

-- TABLE 4: Announcements
CREATE TABLE IF NOT EXISTS announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  image_url TEXT,
  created_by UUID REFERENCES profiles(id),
  is_pinned BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- TABLE 5: Gallery Albums
CREATE TABLE IF NOT EXISTS gallery_albums (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  cover_photo_url TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- TABLE 6: Gallery Photos
CREATE TABLE IF NOT EXISTS gallery_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  album_id UUID REFERENCES gallery_albums(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  caption TEXT,
  uploaded_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- TABLE 7: Donations
CREATE TABLE IF NOT EXISTS donations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  amount DECIMAL(10, 2) NOT NULL,
  stripe_payment_id TEXT,
  status TEXT DEFAULT 'pending', -- 'pending', 'completed', 'failed'
  message TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- TABLE 8: Contact Messages
CREATE TABLE IF NOT EXISTS contact_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'new', -- 'new', 'read', 'replied'
  created_at TIMESTAMP DEFAULT NOW()
);

-- TABLE 9: Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ====================================================================
-- Row Level Security (RLS) Policies
-- ====================================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE rsvps ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE gallery_albums ENABLE ROW LEVEL SECURITY;
ALTER TABLE gallery_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Profiles RLS
CREATE POLICY "Profiles are viewable by authenticated users" ON profiles
  FOR SELECT USING (auth.role() = 'authenticated_user');

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Events RLS - Public read, authenticated write
CREATE POLICY "Events are viewable by everyone" ON events
  FOR SELECT USING (true);

CREATE POLICY "Only admins can create/edit events" ON events
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Only admins can update events" ON events
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- RSVPs RLS
CREATE POLICY "Users can view RSVPs for their events" ON rsvps
  FOR SELECT USING (
    auth.uid() IN (SELECT user_id FROM rsvps WHERE event_id = rsvps.event_id)
    OR auth.uid() IN (SELECT created_by FROM events WHERE id = rsvps.event_id)
  );

CREATE POLICY "Users can create their own RSVP" ON rsvps
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own RSVP" ON rsvps
  FOR UPDATE USING (auth.uid() = user_id);

-- Announcements RLS
CREATE POLICY "Announcements are viewable by everyone" ON announcements
  FOR SELECT USING (true);

CREATE POLICY "Only admins can create announcements" ON announcements
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Gallery Photos RLS
CREATE POLICY "Gallery photos are viewable by authenticated users" ON gallery_photos
  FOR SELECT USING (auth.role() = 'authenticated_user');

CREATE POLICY "Approved members can upload photos" ON gallery_photos
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND status = 'approved')
  );

-- Donations RLS
CREATE POLICY "Users can view their own donations" ON donations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create donations" ON donations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Contact Messages RLS (no auth required to submit)
CREATE POLICY "Contact messages are insertable by anyone" ON contact_messages
  FOR INSERT WITH CHECK (true);

-- Notifications RLS
CREATE POLICY "Users can view their own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

-- ====================================================================
-- Trigger: Auto-create profile on signup (if not exists)
-- ====================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, status)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', 'User'),
    'pending'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ====================================================================
-- All done! Run this script in Supabase SQL Editor
-- ====================================================================
