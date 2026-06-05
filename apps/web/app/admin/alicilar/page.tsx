import { requireStaff } from '@/lib/admin/guards'
import { createClient } from '@/lib/supabase/server'
import { formatDate } from '@/lib/admin/format'

export default async function AdminBuyersPage() {
  await requireStaff('/admin/alicilar')
  const supabase = await createClient()

  // Staff RLS read (buyer_profiles_staff_read). PII minimum: e-posta/telefon GÖSTERİLMEZ.
  const { data: buyers } = await supabase
    .from('buyer_profiles')
    .select('id, company_name, company_type, subscription_tier, created_at')
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(100)

  // RFQ / sipariş sayıları — pilot ölçeğinde uygulama katmanında toplanır (staff RLS read).
  const [{ data: rfqRows }, { data: orderRows }] = await Promise.all([
    supabase.from('rfqs').select('buyer_id').is('deleted_at', null).limit(2000),
    supabase.from('orders').select('buyer_id').limit(2000),
  ])

  const rfqCount = new Map<string, number>()
  for (const r of rfqRows ?? []) rfqCount.set(r.buyer_id, (rfqCount.get(r.buyer_id) ?? 0) + 1)
  const orderCount = new Map<string, number>()
  for (const o of orderRows ?? []) orderCount.set(o.buyer_id, (orderCount.get(o.buyer_id) ?? 0) + 1)

  return (
    <div className="px-5 md:px-8 py-8 flex flex-col gap-6">
      <h1 className="text-[26px] font-extrabold tracking-tight text-ink leading-9">Alıcılar</h1>

      {!buyers || buyers.length === 0 ? (
        <div className="border border-border bg-surface-container-lowest p-8 text-center">
          <p className="text-sm text-ink-secondary">Henüz alıcı yok.</p>
        </div>
      ) : (
        <div className="border border-border bg-surface-container-lowest overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-navy text-white">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider">Şirket</th>
                <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider">Tip</th>
                <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider">Plan</th>
                <th className="text-right px-4 py-3 text-xs font-bold uppercase tracking-wider">Talep</th>
                <th className="text-right px-4 py-3 text-xs font-bold uppercase tracking-wider">Sipariş</th>
                <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider">Kayıt</th>
              </tr>
            </thead>
            <tbody>
              {buyers.map((b, idx) => (
                <tr key={b.id} className={idx % 2 === 0 ? 'bg-surface-container-lowest' : 'bg-surface-container-low'}>
                  <td className="px-4 py-3 font-bold text-ink">{b.company_name ?? '—'}</td>
                  <td className="px-4 py-3 text-ink-secondary">{b.company_type ?? '—'}</td>
                  <td className="px-4 py-3 text-ink-secondary uppercase">{b.subscription_tier ?? '—'}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-ink">{rfqCount.get(b.id) ?? 0}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-ink">{orderCount.get(b.id) ?? 0}</td>
                  <td className="px-4 py-3 text-ink-secondary">{formatDate(b.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
