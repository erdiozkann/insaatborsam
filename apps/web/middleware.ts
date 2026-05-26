import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const PUBLIC_EXACT = new Set([
  '/',
  '/nasil-calisir',
  '/fiyatlar',
  '/satici-ol',
  '/iletisim',
  '/giris',
  '/robots.txt',
  '/sitemap.xml',
  '/opengraph-image',
  '/favicon.ico',
])

const PUBLIC_PREFIX = ['/yasal/', '/auth/', '/dev/']

const PROTECTED_PREFIX = [
  '/profil',
  '/alici/',
  '/satici/',
  '/rfq/',
  '/siparis/',
  '/admin/',
]

function isPublic(pathname: string): boolean {
  if (PUBLIC_EXACT.has(pathname)) return true
  return PUBLIC_PREFIX.some((p) => pathname.startsWith(p))
}

function isProtected(pathname: string): boolean {
  return PROTECTED_PREFIX.some((p) => pathname.startsWith(p))
}

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          )
        },
      },
    },
  )

  // getUser() validates JWT server-side — never use getSession() here
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // Authenticated user trying to access /giris → send to /profil
  if (user && pathname === '/giris') {
    const url = request.nextUrl.clone()
    url.pathname = '/profil'
    url.searchParams.delete('redirect')
    return NextResponse.redirect(url)
  }

  // Unauthenticated user accessing a protected route → /giris?redirect=<path>
  if (!user && isProtected(pathname)) {
    const url = request.nextUrl.clone()
    url.pathname = '/giris'
    url.searchParams.set('redirect', pathname)
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
