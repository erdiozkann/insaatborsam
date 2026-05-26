import { createClient } from '@/lib/supabase/server'
import { NextResponse, type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/profil'

  if (!code) {
    return NextResponse.redirect(`${origin}/giris?error=missing_code`)
  }

  // Reject open-redirect attempts
  const safeNext =
    next.startsWith('/') && !next.startsWith('//') ? next : '/profil'

  const supabase = await createClient()
  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    return NextResponse.redirect(`${origin}/giris?error=auth_callback`)
  }

  return NextResponse.redirect(`${origin}${safeNext}`)
}
