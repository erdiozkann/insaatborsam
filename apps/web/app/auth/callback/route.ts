import { createClient } from '@/lib/supabase/server'
import { NextResponse, type NextRequest } from 'next/server'
import { getPostLoginRedirect, isLocalPath } from '@/lib/auth/redirects'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl
  const code = searchParams.get('code')
  const nextParam = searchParams.get('next')

  if (!code) {
    return NextResponse.redirect(`${origin}/giris?error=missing_code`)
  }

  const supabase = await createClient()
  const { data, error } = await supabase.auth.exchangeCodeForSession(code)

  if (error || !data.user) {
    return NextResponse.redirect(`${origin}/giris?error=auth_callback`)
  }

  // Explicit safe next param — honor it (e.g. email magic link with ?next=...)
  if (nextParam && isLocalPath(nextParam)) {
    return NextResponse.redirect(`${origin}${nextParam}`)
  }

  // No explicit next — smart redirect based on role + onboarding state
  const destination = await getPostLoginRedirect(data.user.id)
  return NextResponse.redirect(`${origin}${destination}`)
}
