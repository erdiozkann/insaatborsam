import { notFound } from 'next/navigation'
import Link from 'next/link'
import { requireStaff } from '@/lib/admin/guards'
import { createClient } from '@/lib/supabase/server'
import { formatCents, formatDate, unitLabel } from '@/lib/admin/format'
import { offerStatusLabel } from '@/lib/rfq/offer-status'
import { orderStatusLabel } from '@/lib/order/order-status'
import { inviteSellerToRfqAction } from '../../actions'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const RFQ_STATUS_LABELS: Record<string, string> = {
  open: 'Açık', evaluating: 'Değerlendiriliyor', closed: 'Kapandı', expired: 'Süresi Doldu', cancelled: 'İptal',
}

const INVITATION_STATUS_LABELS: Record<string, string> = {
  invited: 'Davet Edildi', seen: 'Görüldü', responded: 'Yanıtladı', declined: 'Reddetti', expired: 'Süresi Doldu',
}

type Props = { params: Promise<{ id: string }> }

export default async function AdminRfqDetailPage({ params }: Props) {
  const { id } = await params
  const { roleName } = await requireStaff(`/admin/rfq/${id}`)
  if (!UUID_RE.test(id)) notFound()

  const supabase = await createClient()

  const { data: rfq } = await supabase
    .from('rfqs')
    .select('id, title, description, status, quantity, unit, offer_count, sent_to_count, created_at, delivery_deadline, expires_at, estimated_budget_cents, buyer_profiles(company_name, company_type)')
    .eq('id', id)
    .is('deleted_at', null)
    .maybeSingle()

  if (!rfq) notFound()

  const [{ data: items }, { data: offers }, { data: invitations }, { data: orders }] = await Promise.all([
    supabase.from('rfq_items').select('id, material_name, quantity, unit, display_order').eq('rfq_id', id).order('display_order'),
    supabase.from('rfq_offers').select('id, total_price_cents, delivery_time_days, status, resulting_order_id, seller_profiles(store_name)').eq('rfq_id', id).order('total_price_cents', { ascending: true }),
    supabase.from('rfq_invitations').select('id, status, seller_id, seller_profiles(store_name)').eq('rfq_id', id),
    supabase.from('orders').select('id, order_number, status, total_amount_cents').eq('source_rfq_id', id),
  ])

  // Davet adayları: doğrulanmış, henüz davet edilmemiş satıcılar (PII yok — mağaza adı/şehir).
  const invitedIds = new Set((invitations ?? []).map((i) => i.seller_id))
  const { data: verifiedSellers } = await supabase
    .from('seller_profiles')
    .select('id, store_name, primary_city')
    .eq('is_verified', true)
    .is('deleted_at', null)
    .limit(50)
  const inviteCandidates = (verifiedSellers ?? []).filter((s) => !invitedIds.has(s.id))

  const canInvite = roleName === 'owner' || roleName === 'admin'

  return (
    <div className="px-5 md:px-8 py-8 flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <Link href="/admin/rfq" className="text-xs font-bold uppercase tracking-wider text-navy underline">← Talepler</Link>
          <h1 className="text-[26px] font-extrabold tracking-tight text-ink leading-9 mt-2">{rfq.title}</h1>
          <span className="text-xs font-bold uppercase tracking-wider text-navy">
            {RFQ_STATUS_LABELS[rfq.status] ?? rfq.status}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Özet */}
          <div className="border border-border bg-surface-container-lowest">
            <div className="p-5 border-b border-border"><h2 className="text-xs font-bold uppercase tracking-wider text-navy">Talep Özeti</h2></div>
            <div className="divide-y divide-border">
              <div className="px-5 py-4">
                <span className="text-xs text-ink-muted uppercase tracking-wider block mb-2">Açıklama</span>
                <p className="text-sm text-ink leading-6 whitespace-pre-wrap">{rfq.description}</p>
              </div>
              <Row label="Alıcı" value={`${rfq.buyer_profiles?.company_name ?? '—'}${rfq.buyer_profiles?.company_type ? ` · ${rfq.buyer_profiles.company_type}` : ''}`} />
              <Row label="Ana Miktar" value={`${rfq.quantity} ${unitLabel(rfq.unit)}`} mono />
              <Row label="Termin" value={formatDate(rfq.delivery_deadline)} />
              <Row label="Geçerlilik" value={formatDate(rfq.expires_at)} />
              {rfq.estimated_budget_cents != null && <Row label="Tahmini Bütçe" value={formatCents(rfq.estimated_budget_cents)} mono />}
            </div>
          </div>

          {/* Kalemler */}
          {items && items.length > 0 && (
            <div className="border border-border bg-surface-container-lowest">
              <div className="p-5 border-b border-border"><h2 className="text-xs font-bold uppercase tracking-wider text-navy">Malzeme Kalemleri ({items.length})</h2></div>
              <div className="divide-y divide-border">
                {items.map((it) => (
                  <div key={it.id} className="px-5 py-3 flex justify-between gap-4">
                    <span className="text-sm text-ink">{it.material_name}</span>
                    <span className="text-sm text-ink font-medium tabular-nums">{it.quantity} {unitLabel(it.unit)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Teklifler */}
          <div className="border border-border bg-surface-container-lowest">
            <div className="p-5 border-b border-border"><h2 className="text-xs font-bold uppercase tracking-wider text-navy">Gelen Teklifler ({offers?.length ?? 0})</h2></div>
            {!offers || offers.length === 0 ? (
              <div className="px-5 py-4"><p className="text-sm text-ink-secondary">Henüz teklif yok.</p></div>
            ) : (
              <div className="divide-y divide-border">
                {offers.map((o) => (
                  <div key={o.id} className="px-5 py-3 flex items-center justify-between gap-4 flex-wrap">
                    <span className="text-sm font-bold text-ink">{o.seller_profiles?.store_name ?? 'Satıcı'}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-ink-muted tabular-nums">{o.delivery_time_days} gün</span>
                      <span className="text-sm font-bold text-ink tabular-nums">{formatCents(o.total_price_cents)}</span>
                      <span className="text-xs font-bold uppercase tracking-wider text-navy">{offerStatusLabel(o.status)}</span>
                      {o.resulting_order_id && <span className="text-xs font-bold uppercase tracking-wider text-state-success">Sipariş</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sağ panel */}
        <aside className="flex flex-col gap-6">
          {/* Sipariş durumu */}
          <div className="border border-border bg-surface-container-lowest">
            <div className="p-5 border-b border-border"><h3 className="text-xs font-bold uppercase tracking-wider text-navy">Sipariş</h3></div>
            <div className="p-5">
              {orders && orders.length > 0 ? (
                <ul className="flex flex-col gap-2">
                  {orders.map((o) => (
                    <li key={o.id} className="flex items-center justify-between gap-3">
                      <Link href={`/admin/siparisler`} className="text-sm font-bold text-navy underline tabular-nums">{o.order_number}</Link>
                      <span className="text-xs font-bold uppercase tracking-wider text-navy">{orderStatusLabel(o.status)}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-ink-secondary">Bu talepten henüz sipariş oluşmadı.</p>
              )}
            </div>
          </div>

          {/* Davetli satıcılar */}
          <div className="border border-border bg-surface-container-lowest">
            <div className="p-5 border-b border-border"><h3 className="text-xs font-bold uppercase tracking-wider text-navy">Davetli Satıcılar ({invitations?.length ?? 0})</h3></div>
            <div className="p-5">
              {!invitations || invitations.length === 0 ? (
                <p className="text-sm text-ink-secondary">Henüz davet yok.</p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {invitations.map((inv) => (
                    <li key={inv.id} className="flex items-center justify-between gap-3">
                      <span className="text-sm text-ink">{inv.seller_profiles?.store_name ?? 'Satıcı'}</span>
                      <span className="text-xs text-ink-muted uppercase tracking-wider">{INVITATION_STATUS_LABELS[inv.status] ?? inv.status}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Satıcı davet et (owner/admin) */}
          {canInvite && (
            <div className="border border-border bg-surface-container-lowest">
              <div className="p-5 border-b border-border"><h3 className="text-xs font-bold uppercase tracking-wider text-navy">Satıcı Davet Et</h3></div>
              <div className="p-5">
                {inviteCandidates.length === 0 ? (
                  <p className="text-sm text-ink-secondary">Davet edilebilecek doğrulanmış satıcı yok.</p>
                ) : (
                  <ul className="flex flex-col gap-2">
                    {inviteCandidates.map((s) => (
                      <li key={s.id} className="flex items-center justify-between gap-3">
                        <span className="text-sm text-ink min-w-0">
                          {s.store_name}
                          {s.primary_city && <span className="text-xs text-ink-muted"> · {s.primary_city}</span>}
                        </span>
                        <form action={inviteSellerToRfqAction.bind(null, rfq.id, s.id)}>
                          <button type="submit" className="bg-brand text-navy font-bold text-xs uppercase tracking-wider px-3 py-1.5 hover:opacity-90 transition-opacity">
                            Davet Et
                          </button>
                        </form>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}

          {/* Nakliye notu */}
          <div className="border border-border bg-surface-container px-5 py-4">
            <p className="text-xs text-ink-secondary leading-5">
              Nakliye tercihi yakında eklenecektir; pilot sırasında nakliye ihtiyacı manuel takip edilir.
            </p>
          </div>
        </aside>
      </div>
    </div>
  )
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="px-5 py-4 flex justify-between items-center gap-4">
      <span className="text-xs text-ink-muted uppercase tracking-wider flex-shrink-0">{label}</span>
      <span className={`text-sm text-ink font-medium text-right ${mono ? 'tabular-nums' : ''}`}>{value}</span>
    </div>
  )
}
