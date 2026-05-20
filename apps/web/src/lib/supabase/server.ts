// apps/web/src/lib/supabase/server.ts
// Sunucu tarafı (Server Component, Route Handler, Server Action) Supabase istemcisi.
// `next/headers` bağımlılığı nedeniyle sadece sunucu bağlamında çalışır.
// Client Component'te import edilmemelidir.
//
// Next.js 15: cookies() async — `await createClient()` ile kullanın.

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from './types'
import { clientEnv } from '@/lib/env'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    clientEnv.NEXT_PUBLIC_SUPABASE_URL,
    clientEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          // Server Component'te set çalışmaz; sadece Route Handler/Action'da aktif.
          // Middleware yönlendirmesi için kullanılır — burada sessizce geçiyoruz.
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          } catch {
            // Server Component bağlamında cookie set edilemez — beklenen durum.
          }
        },
      },
    },
  )
}
