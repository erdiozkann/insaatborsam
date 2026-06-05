import Link from 'next/link'
import { requireStaff } from '@/lib/admin/guards'
import { createClient } from '@/lib/supabase/server'
import { formatDate, unitLabel } from '@/lib/admin/format'

const RFQ_STATUS_LABELS: Record<string, string> = {
  open: 'Açık',
  evaluating: 'Değerlendiriliyor',
  closed: 'Kapandı',
  expired: 'Süresi Doldu',
  cancelled: 'İptal',
}

export default async function AdminRfqListPage() {
  await requireStaff('/admin/rfq')
  const supabase = await createClient()

  // Staff RLS read (rfqs_staff_read). Buyer şirket adı embed — PII minimum (e-posta/telefon yok).
  const { data: rfqs } = await supabase
    .from('rfqs')
    .select('id, title, status, quantity, unit, offer_count, created_at, delivery_deadline, buyer_profiles(company_name)')
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(100)

  return (
    <div className="px-5 md:px-8 py-8 flex flex-col gap-6">
      <h1 className="text-[26px] font-extrabold tracking-tight text-ink leading-9">Teklif Talepleri</h1>

      {!rfqs || rfqs.length === 0 ? (
        <div className="border border-border bg-surface-container-lowest p-8 text-center">
          <p className="text-sm text-ink-secondary">Henüz teklif talebi yok.</p>
        </div>
      ) : (
        <div className="border border-border bg-surface-container-lowest overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-navy text-white">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider">Talep</th>
                <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider">Alıcı</th>
                <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider">Durum</th>
                <th className="text-right px-4 py-3 text-xs font-bold uppercase tracking-wider">Teklif</th>
                <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider">Oluşturma</th>
                <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider">Termin</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {rfqs.map((r, idx) => (
                <tr key={r.id} className={idx % 2 === 0 ? 'bg-surface-container-lowest' : 'bg-surface-container-low'}>
                  <td className="px-4 py-3">
                    <span className="font-bold text-ink">{r.title}</span>
                    <span className="block text-xs text-ink-muted tabular-nums">
                      {r.quantity} {unitLabel(r.unit)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-ink-secondary">{r.buyer_profiles?.company_name ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-navy">
                      {RFQ_STATUS_LABELS[r.status] ?? r.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-ink">{r.offer_count}</td>
                  <td className="px-4 py-3 text-ink-secondary">{formatDate(r.created_at)}</td>
                  <td className="px-4 py-3 text-ink-secondary">{formatDate(r.delivery_deadline)}</td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/admin/rfq/${r.id}`} className="text-xs font-bold uppercase tracking-wider text-navy underline">
                      Detay
                    </Link>
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
