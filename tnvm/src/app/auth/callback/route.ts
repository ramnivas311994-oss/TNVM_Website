import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const requestUrl = new URL(req.url)
  const code = requestUrl.searchParams.get('code')

  if (code) {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // Redirect to dashboard after successful auth
      return NextResponse.redirect(new URL('/dashboard', requestUrl.origin))
    }
  }

  // Redirect to login if there's an error
  return NextResponse.redirect(new URL('/login?error=auth_failed', requestUrl.origin))
}
