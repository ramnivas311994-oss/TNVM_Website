import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { full_name, email, password } = await req.json()

    // Validate input
    if (!full_name || !email || !password) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Create Supabase client for auth (browser client - correct for signUp)
    const supabaseAuth = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // Sign up with Supabase Auth (profile is auto-created by trigger)
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    const { data: authData, error: authError } = await supabaseAuth.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name,
        },
        emailRedirectTo: `${baseUrl}/auth/callback`,
      },
    })

    if (authError) {
      console.error('Supabase auth error:', authError)
      return NextResponse.json(
        { error: authError.message || 'Failed to create account' },
        { status: 400 }
      )
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: 'Failed to create user' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: true, message: 'Registration successful. Please wait for admin approval.' },
      { status: 201 }
    )
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred: ' + String(error) },
      { status: 500 }
    )
  }
}
