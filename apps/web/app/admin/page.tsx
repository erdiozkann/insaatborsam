import Link from 'next/link'
import { requireStaff } from '@/lib/admin/guards'
import { createClient } from '@/lib/supabase/server'

// Admin Panel (dashboard). Salt-okuma sayaçlar (staff RLS read).
export default async function AdminDashboardPage() {
  await requireStaff('/admin')
  const supabase = await createClient()

  // count: 'exact', head: true → satır çekmeden yalnızca sayı (RLS staff read tüm satırları sayar).
  const [totalRfq, openRfq, totalOffers, pendingOrders, unverifiedSellers] = await Promise.all([
    supabase.from('rfqs').select('id', { count: 'exact', head: true }).is('deleted_at', null),
    supabase.from('rfqs').select('id', { count: 'exact', head: true }).eq('status', 'open').is('deleted_at', null),
    supabase.from('rfq_offers').select('id', { count: 'exact', head: true }),
    supabase.from('orders').select('id', { count: 'exact', head: true }).eq('status', 'pending_payment'),
    supabase.from('seller_profiles').select('id', { count: 'exact', head: true }).eq('is_verified', false).is('deleted_at', null),
  ])

  const stats = [
    { label: 'Toplam Teklif Talebi', value: totalRfq.count ?? 0, href: '/admin/rfq' },
    { label: 'Açık Talep', value: openRfq.count ?? 0, href: '/admin/rfq' },
    { label: 'Toplam Teklif', value: totalOffers.count ?? 0, href: '/admin/teklifler' },
    { label: 'Ödeme Bekleyen Sipariş', value: pendingOrders.count ?? 0, href: '/admin/siparisler' },
    { label: 'Doğrulanmamış Satıcı', value: unverifiedSellers.count ?? 0, href: '/admin/saticilar' },
  ]

  return (
    <div className="px-5 md:px-8 py-8 flex flex-col gap-8">
      <div>
        <span className="text-xs font-bold uppercase tracking-wider text-ink-muted block mb-2">Yönetim</span>
        <h1 className="text-[26px] font-extrabold tracking-tight text-ink leading-9">Operasyon Paneli</h1>
      </div>

      {/* Sayaçlar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-border border border-border">
        {stats.map((s) => (
          <Link
            key={s.label}
            href={s.href}
            className="bg-surface-container-lowest p-6 flex flex-col gap-2 hover:bg-surface-container transition-colors"
          >
            <span className="text-xs font-bold uppercase tracking-wider text-ink-muted">{s.label}</span>
            <span className="text-[32px] font-extrabold text-navy tabular-nums leading-none">{s.value}</span>
          </Link>
        ))}
      </div>

      {/* Nakliye hazırlık notu */}
      <div className="border border-border bg-surface-container px-5 py-4">
        <h2 className="text-xs font-bold uppercase tracking-wider text-navy mb-2">Nakliye Hazırlığı</h2>
        <p className="text-sm text-ink-secondary leading-6">
          Nakliye tercihi Sprint 10&apos;da RFQ/offer akışına eklenecek.{' '}
          <strong className="text-ink">Pilot sırasında nakliye ihtiyacı admin tarafından manuel takip edilecek.</strong>
        </p>
      </div>
    </div>
  )
}
