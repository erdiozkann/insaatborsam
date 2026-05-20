// apps/web/src/lib/supabase/client.ts
// Tarayıcı (Client Component) için Supabase istemcisi.
// Sadece NEXT_PUBLIC_* anahtarlar kullanır — service role key asla burada olmaz.
// 'use client' bileşenlerinde import edilebilir.

import { createBrowserClient } from '@supabase/ssr'
import type { Database } from './types'
import { clientEnv } from '@/lib/env'

export function createClient() {
  return createBrowserClient<Database>(
    clientEnv.NEXT_PUBLIC_SUPABASE_URL,
    clientEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  )
}
