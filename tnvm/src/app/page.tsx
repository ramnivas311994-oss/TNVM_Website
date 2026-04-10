'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function Home() {
  const router = useRouter()
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null)
  const [userName, setUserName] = useState('')
  const [loading, setLoading] = useState(true)

  // Check if user is logged in - runs only once on mount
  useEffect(() => {
    let isMounted = true
    
    const checkUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (isMounted) {
          if (user) {
            setIsLoggedIn(true)
            setUserName(user.email?.split('@')[0] || 'User')
          } else {
            setIsLoggedIn(false)
          }
          setLoading(false)
        }
      } catch (error) {
        if (isMounted) {
          setIsLoggedIn(false)
          setLoading(false)
        }
      }
    }
    
    checkUser()
    
    return () => {
      isMounted = false
    }
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setIsLoggedIn(false)
    router.push('/')
  }

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <nav className="bg-white shadow-sm sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="h-10 bg-gray-200 rounded w-32 animate-pulse"></div>
          </div>
        </nav>
      </div>
    )
  }

  return (
    <>
      {/* Navbar */}
      <nav className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="text-3xl font-bold text-red-600">🎭</div>
            <div className="font-bold text-2xl text-gray-900">TNVM</div>
          </div>
          
          <div className="hidden md:flex gap-6">
            <Link href="/" className="text-gray-700 hover:text-red-600 font-medium">
              Home
            </Link>
            <Link href="#events" className="text-gray-700 hover:text-red-600 font-medium">
              Events
            </Link>
            <Link href="#gallery" className="text-gray-700 hover:text-red-600 font-medium">
              Gallery
            </Link>
            <Link href="#about" className="text-gray-700 hover:text-red-600 font-medium">
              About
            </Link>
          </div>

          <div className="flex gap-3">
            {isLoggedIn ? (
              <>
                <span className="px-4 py-2 text-gray-700 font-medium text-sm md:text-base">Hi, {userName}!</span>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium text-sm md:text-base"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-3 md:px-4 py-2 text-red-600 hover:text-red-700 font-medium border border-red-600 rounded-lg text-sm md:text-base"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="px-3 md:px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium text-sm md:text-base"
                >
                  Join
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-red-50 to-yellow-50 py-20 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-4">
            Tamil New Year Virtual Meet
          </h1>
          <p className="text-xl md:text-2xl text-gray-700 mb-8 max-w-3xl mx-auto">
            Connect with Tamil community, celebrate our culture, share experiences, and make lasting memories together.
          </p>
          
          <div className="flex gap-4 justify-center flex-wrap">
            {!isLoggedIn && (
              <>
                <Link
                  href="/register"
                  className="px-8 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold text-lg transition"
                >
                  Join Our Community
                </Link>
                <Link
                  href="/login"
                  className="px-8 py-3 bg-white hover:bg-gray-100 text-red-600 border-2 border-red-600 rounded-lg font-bold text-lg transition"
                >
                  Already a Member? Login
                </Link>
              </>
            )}
            {isLoggedIn && (
              <Link
                href="/dashboard"
                className="px-8 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold text-lg transition"
              >
                Go to Dashboard
              </Link>
            )}
          </div>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="text-4xl mb-2">📅</div>
              <h3 className="font-bold text-lg mb-2">Events</h3>
              <p className="text-gray-600">Celebrate Tamil culture with our community events</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="text-4xl mb-2">📸</div>
              <h3 className="font-bold text-lg mb-2">Gallery</h3>
              <p className="text-gray-600">Share and view photos from past celebrations</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="text-4xl mb-2">🤝</div>
              <h3 className="font-bold text-lg mb-2">Community</h3>
              <p className="text-gray-600">Connect with members and make new friends</p>
            </div>
          </div>
        </div>
      </section>

      {/* Events Section */}
      <section id="events" className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold text-gray-900 mb-12 text-center">Upcoming Events</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { title: 'Tamil New Year Celebration', date: 'April 14, 2026', image: '🎉' },
              { title: 'Cultural Dance Night', date: 'May 5, 2026', image: '💃' },
              { title: 'Food & Cuisine Festival', date: 'June 1, 2026', image: '🍛' },
            ].map((event, idx) => (
              <div key={idx} className="bg-white rounded-lg shadow-md hover:shadow-lg transition overflow-hidden">
                <div className="bg-gradient-to-br from-red-100 to-yellow-100 h-40 flex items-center justify-center text-6xl">
                  {event.image}
                </div>
                <div className="p-6">
                  <h3 className="font-bold text-lg mb-2">{event.title}</h3>
                  <p className="text-gray-600 mb-4">📆 {event.date}</p>
                  {isLoggedIn ? (
                    <button className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium">
                      RSVP
                    </button>
                  ) : (
                    <Link
                      href="/login"
                      className="block text-center px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium"
                    >
                      Login to RSVP
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Gallery Section */}
      <section id="gallery" className="py-16 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold text-gray-900 mb-12 text-center">Photo Gallery</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              'Diwali 2025',
              'Spring Festival',
              'Cooking Class',
              'Dance Workshop',
              'Community Picnic',
              'Music Night',
              'Charity Drive',
              'New Year Party',
            ].map((title, idx) => (
              <div key={idx} className="bg-white rounded-lg shadow overflow-hidden cursor-pointer hover:shadow-lg transition">
                <div className="bg-gradient-to-br from-red-200 to-yellow-200 h-40 flex items-center justify-center">
                  <span className="text-4xl">📸</span>
                </div>
                <div className="p-4">
                  <p className="font-medium text-gray-900">{title}</p>
                  <p className="text-sm text-gray-500">Member photos • {Math.floor(Math.random() * 50) + 10} images</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-6">About TNVM</h2>
          <p className="text-lg text-gray-700 mb-4">
            Tamil New Year Virtual Meet (TNVM) is a vibrant community platform dedicated to celebrating Tamil culture, traditions, and heritage.
          </p>
          <p className="text-lg text-gray-700 mb-4">
            With over 3,000 passionate members, we organize events, share photos, connect families, and keep our rich traditions alive.
          </p>
          <div className="mt-8 bg-red-50 border-l-4 border-red-600 p-6">
            <p className="text-gray-900 font-bold text-lg">"Celebrating Tamil Heritage, Building Community"</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <p className="mb-2">© 2026 Tamil New Year Virtual Meet. All rights reserved.</p>
          <p className="text-gray-400">Made with ❤️ by the Tamil Community</p>
        </div>
      </footer>
    </>
  )
}
