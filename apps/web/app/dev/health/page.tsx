// apps/web/app/dev/health/page.tsx
// Supabase bağlantı test sayfası — SADECE development ortamında erişilebilir.
// Production'da 404 döner.

import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export default async function HealthPage() {
  if (process.env.NODE_ENV !== 'development') {
    notFound()
  }

  type Result =
    | { ok: true; categories: { id: string; name: string; slug: string }[] }
    | { ok: false; error: string }

  let result: Result

  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('categories')
      .select('id, name, slug')
      .eq('is_active', true)
      .order('display_order', { ascending: true })
      .limit(5)

    if (error) {
      result = { ok: false, error: error.message }
    } else {
      result = { ok: true, categories: data ?? [] }
    }
  } catch (e) {
    result = { ok: false, error: e instanceof Error ? e.message : 'Bilinmeyen hata' }
  }

  return (
    <main className="min-h-screen bg-[#f7f9fb] px-8 py-12 font-[Inter,sans-serif]">
      <div className="max-w-2xl mx-auto flex flex-col gap-8">

        {/* Başlık */}
        <div className="border-b border-[#d4c4ac] pb-6">
          <p className="text-xs uppercase tracking-widest font-bold text-[#827560] mb-2">
            Geliştirici Araçları
          </p>
          <h1 className="text-2xl font-bold text-[#191c1e]">
            Sistem Sağlık Kontrolü
          </h1>
          <p className="mt-1 text-sm text-[#504533]">
            Supabase bağlantısı ve temel tablo erişimi
          </p>
        </div>

        {/* Bağlantı durumu */}
        <div className="border border-[#d4c4ac] bg-white p-6 flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <span
              className={`block h-3 w-3 ${result.ok ? 'bg-[#10B981]' : 'bg-[#ba1a1a]'}`}
              aria-hidden
            />
            <span className="text-sm font-bold uppercase tracking-wider text-[#191c1e]">
              Supabase Bağlantısı
            </span>
            <span className={`ml-auto text-xs font-mono font-bold ${result.ok ? 'text-[#10B981]' : 'text-[#ba1a1a]'}`}>
              {result.ok ? 'BAĞLANDI' : 'HATA'}
            </span>
          </div>

          {!result.ok && (
            <div className="bg-[#ffdad6] border border-[#ba1a1a] px-4 py-3">
              <p className="text-sm font-mono text-[#93000a]">{result.error}</p>
            </div>
          )}

          {result.ok && (
            <div className="flex flex-col gap-1">
              <p className="text-xs uppercase tracking-wider text-[#827560] mb-2">
                categories tablosu — ilk 5 aktif kategori
              </p>
              {result.categories.length === 0 ? (
                <p className="text-sm text-[#504533]">Kayıt yok (seed çalıştırıldı mı?)</p>
              ) : (
                <ul className="flex flex-col divide-y divide-[#eceef0]">
                  {result.categories.map((cat) => (
                    <li key={cat.id} className="flex items-center gap-4 py-2">
                      <span className="text-sm font-medium text-[#191c1e] w-40 truncate">
                        {cat.name}
                      </span>
                      <span className="text-xs font-mono text-[#827560]">{cat.slug}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        {/* Env durumu — değer gösterilmez, sadece var/yok */}
        <div className="border border-[#d4c4ac] bg-white p-6 flex flex-col gap-3">
          <p className="text-xs uppercase tracking-wider font-bold text-[#827560]">
            Environment Değişkenleri
          </p>
          {[
            ['NEXT_PUBLIC_SUPABASE_URL', process.env.NEXT_PUBLIC_SUPABASE_URL],
            ['NEXT_PUBLIC_SUPABASE_ANON_KEY', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY],
            ['SUPABASE_SERVICE_ROLE_KEY', process.env.SUPABASE_SERVICE_ROLE_KEY],
          ].map(([key, value]) => (
            <div key={key} className="flex items-center gap-3">
              <span
                className={`block h-2 w-2 flex-shrink-0 ${value ? 'bg-[#10B981]' : 'bg-[#ba1a1a]'}`}
                aria-hidden
              />
              <span className="text-xs font-mono text-[#191c1e]">{key}</span>
              <span className={`ml-auto text-xs font-bold ${value ? 'text-[#10B981]' : 'text-[#ba1a1a]'}`}>
                {value ? 'TANIMLI' : 'EKSİK'}
              </span>
            </div>
          ))}
        </div>

        <p className="text-xs text-[#827560] text-center">
          Bu sayfa yalnızca <code className="font-mono bg-[#eceef0] px-1">NODE_ENV=development</code> ortamında görünür.
        </p>
      </div>
    </main>
  )
}
