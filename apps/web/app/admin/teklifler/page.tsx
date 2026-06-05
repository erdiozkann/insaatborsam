import { requireStaff } from '@/lib/admin/guards'
import { createClient } from '@/lib/supabase/server'
import { formatCents, formatDate } from '@/lib/admin/format'
import { offerStatusLabel } from '@/lib/rfq/offer-status'

export default async function AdminOffersPage() {
  await requireStaff('/admin/teklifler')
  const supabase = await createClient()

  // Staff RLS read (rfq_offers_staff_read). RFQ başlığı + satıcı mağaza adı embed (PII yok).
  const { data: offers } = await supabase
    .from('rfq_offers')
    .select('id, total_price_cents, delivery_time_days, status, created_at, resulting_order_id, rfqs(title), seller_profiles(store_name)')
    .order('created_at', { ascending: false })
    .limit(100)

  return (
    <div className="px-5 md:px-8 py-8 flex flex-col gap-6">
      <h1 className="text-[26px] font-extrabold tracking-tight text-ink leading-9">Teklifler</h1>

      {!offers || offers.length === 0 ? (
        <div className="border border-border bg-surface-container-lowest p-8 text-center">
          <p className="text-sm text-ink-secondary">Henüz teklif yok.</p>
        </div>
      ) : (
        <div className="border border-border bg-surface-container-lowest overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-navy text-white">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider">Talep</th>
                <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider">Satıcı</th>
                <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider">Durum</th>
                <th className="text-right px-4 py-3 text-xs font-bold uppercase tracking-wider">Toplam</th>
                <th className="text-right px-4 py-3 text-xs font-bold uppercase tracking-wider">Teslimat</th>
                <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider">Tarih</th>
                <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider">Sipariş</th>
              </tr>
            </thead>
            <tbody>
              {offers.map((o, idx) => (
                <tr key={o.id} className={idx % 2 === 0 ? 'bg-surface-container-lowest' : 'bg-surface-container-low'}>
                  <td className="px-4 py-3 text-ink">{o.rfqs?.title ?? '—'}</td>
                  <td className="px-4 py-3 text-ink-secondary">{o.seller_profiles?.store_name ?? '—'}</td>
                  <td className="px-4 py-3"><span className="text-xs font-bold uppercase tracking-wider text-navy">{offerStatusLabel(o.status)}</span></td>
                  <td className="px-4 py-3 text-right tabular-nums font-bold text-ink">{formatCents(o.total_price_cents)}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-ink-secondary">{o.delivery_time_days} gün</td>
                  <td className="px-4 py-3 text-ink-secondary">{formatDate(o.created_at)}</td>
                  <td className="px-4 py-3">
                    {o.resulting_order_id
                      ? <span className="text-xs font-bold uppercase tracking-wider text-state-success">Var</span>
                      : <span className="text-xs text-ink-muted">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
