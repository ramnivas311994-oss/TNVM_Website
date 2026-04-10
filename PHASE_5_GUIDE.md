# 🚀 PHASE 5: MEMBER AREA - Implementation Guide

## Overview
After registration and admin approval, members need a **Member Area** where they can:
- ✅ View their profile
- ✅ Edit profile (name, location, family size)
- ✅ View upcoming events
- ✅ RSVP to events
- ✅ View selected events
- ✅ Upload photos to gallery
- ✅ View notifications

---

## Architecture

```
Member Area Routes:
├── /dashboard              → Main dashboard (overview)
├── /profile/edit           → Edit profile form
├── /events                 → Browse events
├── /events/[id]            → Event details + RSVP
├── /rsvps                  → My RSVPs (event registrations)
├── /gallery/upload         → Upload photos
└── /notifications          → View notifications
```

Protected by middleware:
- User must be logged in (auth.uid exists)
- User must be approved (status = 'approved')
- Otherwise redirected to /pending

---

## Step-by-Step Implementation

### STEP 1: Create /app/(member)/dashboard/page.tsx

**Purpose**: Main dashboard showing member's overview

```typescript
// src/app/(member)/dashboard/page.tsx
'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

export default function DashboardPage() {
  const [user, setUser] = useState(null)
  const [upcomingEvents, setUpcomingEvents] = useState([])
  const [myRsvps, setMyRsvps] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get current user
        const { data: { user: userData } } = await supabase.auth.getUser()
        setUser(userData)

        // Get user's RSVPs
        const { data: rsvpData } = await supabase
          .from('rsvps')
          .select('event_id')
          .eq('user_id', userData?.id)
        
        setMyRsvps(rsvpData || [])

        // Get upcoming events
        const { data: eventsData } = await supabase
          .from('events')
          .select('*')
          .gt('event_date', new Date().toISOString())
          .order('event_date', { ascending: true })
          .limit(5)
        
        setUpcomingEvents(eventsData || [])
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) return <div className="text-center py-12">Loading...</div>

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-12">
        
        {/* Header */}
        <h1 className="text-4xl font-bold mb-8">Welcome, {user?.email?.split('@')[0]}!</h1>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-12">
          <Link href="/profile/edit" className="p-6 bg-white rounded-lg shadow hover:shadow-lg">
            <div className="text-3xl mb-2">📝</div>
            <h3 className="font-bold">Edit Profile</h3>
            <p className="text-sm text-gray-600">Update your information</p>
          </Link>
          <Link href="/events" className="p-6 bg-white rounded-lg shadow hover:shadow-lg">
            <div className="text-3xl mb-2">📅</div>
            <h3 className="font-bold">Browse Events</h3>
            <p className="text-sm text-gray-600">Upcoming events ({upcomingEvents.length})</p>
          </Link>
          <Link href="/gallery/upload" className="p-6 bg-white rounded-lg shadow hover:shadow-lg">
            <div className="text-3xl mb-2">📸</div>
            <h3 className="font-bold">Upload Photos</h3>
            <p className="text-sm text-gray-600">Share your memories</p>
          </Link>
          <Link href="/notifications" className="p-6 bg-white rounded-lg shadow hover:shadow-lg">
            <div className="text-3xl mb-2">🔔</div>
            <h3 className="font-bold">Notifications</h3>
            <p className="text-sm text-gray-600">Stay updated</p>
          </Link>
        </div>

        {/* My RSVPs */}
        <div className="bg-white rounded-lg shadow p-8 mb-12">
          <h2 className="text-2xl font-bold mb-6">My Event RSVPs ({myRsvps.length})</h2>
          {myRsvps.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {upcomingEvents.map(event => (
                myRsvps.some(r => r.event_id === event.id) && (
                  <div key={event.id} className="border rounded-lg p-4">
                    <h3 className="font-bold text-lg mb-2">{event.title}</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      📅 {new Date(event.event_date).toLocaleDateString()}
                    </p>
                    <Link
                      href={`/events/${event.id}`}
                      className="text-red-600 font-semibold hover:underline"
                    >
                      View Event →
                    </Link>
                  </div>
                )
              ))}
            </div>
          ) : (
            <p className="text-gray-600">You haven't RSVP'd to any events yet.</p>
          )}
        </div>

        {/* Upcoming Events */}
        <div className="bg-white rounded-lg shadow p-8">
          <h2 className="text-2xl font-bold mb-6">Upcoming Events</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {upcomingEvents.map(event => (
              <div key={event.id} className="border rounded-lg p-4 hover:shadow-lg transition">
                <h3 className="font-bold text-lg mb-2">{event.title}</h3>
                <p className="text-sm text-gray-600 mb-2">{event.description}</p>
                <p className="text-sm text-gray-600 mb-4">
                  📅 {new Date(event.event_date).toLocaleDateString()}
                </p>
                <Link
                  href={`/events/${event.id}`}
                  className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                >
                  View & RSVP
                </Link>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
```

### STEP 2: Create /app/(member)/profile/edit/page.tsx

**Purpose**: Let members edit their profile information

```typescript
// src/app/(member)/profile/edit/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function EditProfilePage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    full_name: '',
    city: '',
    family_size: 1,
    phone: ''
  })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()
        
        if (data) {
          setFormData({
            full_name: data.full_name || '',
            city: data.city || '',
            family_size: data.family_size || 1,
            phone: data.phone || ''
          })
        }
      }
    }
    fetchProfile()
  }, [])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'family_size' ? parseInt(value) : value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      const { error } = await supabase
        .from('profiles')
        .update(formData)
        .eq('id', user?.id)

      if (error) {
        setMessage('❌ Error: ' + error.message)
      } else {
        setMessage('✅ Profile updated successfully!')
        setTimeout(() => router.push('/dashboard'), 2000)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow p-8">
        <h1 className="text-2xl font-bold mb-6">Edit Profile</h1>

        {message && (
          <div className={`mb-4 p-4 rounded ${message.includes('✅') ? 'bg-green-50' : 'bg-red-50'}`}>
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Full Name</label>
            <input
              type="text"
              name="full_name"
              value={formData.full_name}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">City</label>
            <input
              type="text"
              name="city"
              value={formData.city}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Phone</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Family Size</label>
            <select
              name="family_size"
              value={formData.family_size}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8].map(n => (
                <option key={n} value={n}>{n} people</option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-red-600 text-white py-2 rounded hover:bg-red-700 disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>
    </div>
  )
}
```

### STEP 3: Create /app/(member)/events/page.tsx

**Purpose**: Browse all events and RSVP

```typescript
// src/app/(member)/events/page.tsx
'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

export default function EventsPage() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchEvents = async () => {
      const { data } = await supabase
        .from('events')
        .select('*')
        .order('event_date', { ascending: true })
      
      setEvents(data || [])
      setLoading(false)
    }

    fetchEvents()
  }, [])

  if (loading) return <div className="text-center py-12">Loading events...</div>

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">All Events</h1>

        {events.length === 0 ? (
          <p className="text-center text-gray-600 py-12">No events planned yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map(event => (
              <Link
                key={event.id}
                href={`/events/${event.id}`}
                className="bg-white rounded-lg shadow hover:shadow-lg transition p-6"
              >
                {event.image_url && (
                  <img
                    src={event.image_url}
                    alt={event.title}
                    className="w-full h-40 object-cover rounded mb-4"
                  />
                )}
                <h3 className="font-bold text-lg mb-2">{event.title}</h3>
                <p className="text-sm text-gray-600 mb-2">{event.description}</p>
                <p className="text-sm font-semibold text-red-600">
                  📅 {new Date(event.event_date).toLocaleDateString()}
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
```

---

## Implementation Order

1. **Dashboard** (`/dashboard`) - Main entry point
2. **Profile Edit** (`/profile/edit`) - Edit member info
3. **Events List** (`/events`) - Browse events
4. **Event Details** (`/events/[id]`) - View + RSVP
5. **My RSVPs** (`/rsvps`) - View my registrations
6. **Gallery Upload** (`/gallery/upload`) - Upload photos
7. **Notifications** (`/notifications`) - View alerts

---

## Database Queries Used

```sql
-- Get user's RSVPs
SELECT rsvps.id, events.title, events.event_date 
FROM rsvps
JOIN events ON rsvps.event_id = events.id
WHERE rsvps.user_id = 'user-uuid'

-- Get upcoming events
SELECT * FROM events
WHERE event_date > NOW()
ORDER BY event_date ASC

-- Create RSVP
INSERT INTO rsvps (event_id, user_id)
VALUES ('event-uuid', 'user-uuid')

-- Get user profile
SELECT * FROM profiles WHERE id = 'user-uuid'

-- Update profile
UPDATE profiles 
SET full_name = 'Name', city = 'City'
WHERE id = 'user-uuid'
```

---

## Security Checklist

- ✅ All routes protected by middleware (check status = 'approved')
- ✅ RLS policies prevent unauthorized data access
- ✅ Only authenticated users can RSVP (created_by = auth.uid)
- ✅ Users can only edit their own profile
- ✅ Server-side validation for all inputs

---

## Next Steps After Phase 5

1. **Phase 6**: Admin Panel
   - Approve/reject members
   - Create events
   - View donations
   - Send announcements

2. **Phase 7**: Integrations
   - Stripe donation webhooks
   - Cloudinary image upload
   - OneSignal push notifications

3. **Phase 8**: Deployment
   - Deploy to Vercel
   - Configure custom domain (tnvm.org)
   - Set up SSL certificate

---

**Status**: Ready to build Phase 5 🚀  
**Estimated Time**: 4-6 hours per feature  
**Priority**: Dashboard > Profile > Events > RSVP

