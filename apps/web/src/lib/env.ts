// apps/web/src/lib/env.ts
// Zod ile environment değişkeni doğrulama.
// Eksik ya da hatalı env varsa uygulama başlamadan Türkçe hatayla çöker.
//
// ─── GÜVENLİK KURALI ──────────────────────────────────────────────────────
// clientEnv → sadece NEXT_PUBLIC_* değerler — tarayıcıda güvenli.
// SUPABASE_SERVICE_ROLE_KEY bu dosyada YOKTUR.
// Sunucu-only secret'lar Route Handler veya Edge Function içinde
// doğrudan `process.env.SUPABASE_SERVICE_ROLE_KEY` ile okunur.
// ──────────────────────────────────────────────────────────────────────────

import { z } from 'zod'

// Zod v4: required_error kaldırıldı — string() için error/message kullanılır.
const clientSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z
    .string({ error: 'NEXT_PUBLIC_SUPABASE_URL tanımlı değil — apps/web/.env.local dosyasını kontrol edin' })
    .url('NEXT_PUBLIC_SUPABASE_URL geçerli bir URL değil (https://xxx.supabase.co formatı bekleniyor)'),

  NEXT_PUBLIC_SUPABASE_ANON_KEY: z
    .string({ error: 'NEXT_PUBLIC_SUPABASE_ANON_KEY tanımlı değil — apps/web/.env.local dosyasını kontrol edin' })
    .min(20, 'NEXT_PUBLIC_SUPABASE_ANON_KEY çok kısa — Supabase dashboard\'dan doğru anahtarı kopyaladığınızdan emin olun'),

  NEXT_PUBLIC_SITE_URL: z
    .string()
    .url()
    .default('http://localhost:3000'),

  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
})

const result = clientSchema.safeParse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  NODE_ENV: process.env.NODE_ENV,
})

if (!result.success) {
  const hatalar = Object.entries(result.error.flatten().fieldErrors)
    .map(([key, mesajlar]) => `  • ${key}: ${mesajlar?.join(', ')}`)
    .join('\n')

  // Secret değerleri loglamıyoruz — sadece hangi KEY eksik/hatalı.
  throw new Error(
    `\n❌ Eksik veya hatalı environment değişkenleri:\n${hatalar}\n` +
    `  → apps/web/.env.local dosyasını kontrol edin.\n`,
  )
}

export const clientEnv = result.data
