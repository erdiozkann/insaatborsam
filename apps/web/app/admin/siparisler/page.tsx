import { requireStaff } from '@/lib/admin/guards'
import { createClient } from '@/lib/supabase/server'
import { formatCents, formatDate } from '@/lib/admin/format'
import { orderStatusLabel, paymentStatusLabel } from '@/lib/order/order-status'

export default async function AdminOrdersPage() {
  await requireStaff('/admin/siparisler')
  const supabase = await createClient()

  // Staff RLS read (orders_staff_read). Alıcı şirket adı + satıcı mağaza adı (PII minimum).
  const { data: orders } = await supabase
    .from('orders')
    .select('id, order_number, status, payment_status, total_amount_cents, created_at, buyer_profiles(company_name), seller_profiles(store_name)')
    .order('created_at', { ascending: false })
    .limit(100)

  return (
    <div className="px-5 md:px-8 py-8 flex flex-col gap-6">
      <h1 className="text-[26px] font-extrabold tracking-tight text-ink leading-9">Siparişler</h1>

      <div className="border border-border bg-surface-container px-5 py-3">
        <p className="text-xs text-ink-secondary leading-5">
          Ödeme adımı pilot sürecinde henüz aktif değildir. Tüm siparişler şu an <strong className="text-ink">ödeme öncesi</strong> aşamasındadır.
        </p>
      </div>

      {!orders || orders.length === 0 ? (
        <div className="border border-border bg-surface-container-lowest p-8 text-center">
          <p className="text-sm text-ink-secondary">Henüz sipariş yok.</p>
        </div>
      ) : (
        <div className="border border-border bg-surface-container-lowest overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-navy text-white">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider">Sipariş No</th>
                <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider">Alıcı</th>
                <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider">Satıcı</th>
                <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider">Durum</th>
                <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider">Ödeme</th>
                <th className="text-right px-4 py-3 text-xs font-bold uppercase tracking-wider">Toplam</th>
                <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider">Tarih</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o, idx) => (
                <tr key={o.id} className={idx % 2 === 0 ? 'bg-surface-container-lowest' : 'bg-surface-container-low'}>
                  <td className="px-4 py-3 font-bold text-ink tabular-nums">{o.order_number ?? '—'}</td>
                  <td className="px-4 py-3 text-ink-secondary">{o.buyer_profiles?.company_name ?? '—'}</td>
                  <td className="px-4 py-3 text-ink-secondary">{o.seller_profiles?.store_name ?? '—'}</td>
                  <td className="px-4 py-3"><span className="text-xs font-bold uppercase tracking-wider text-navy">{orderStatusLabel(o.status)}</span></td>
                  <td className="px-4 py-3"><span className="text-xs font-bold uppercase tracking-wider text-ink-muted">{paymentStatusLabel(o.payment_status)}</span></td>
                  <td className="px-4 py-3 text-right tabular-nums font-bold text-ink">{formatCents(o.total_amount_cents)}</td>
                  <td className="px-4 py-3 text-ink-secondary">{formatDate(o.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
