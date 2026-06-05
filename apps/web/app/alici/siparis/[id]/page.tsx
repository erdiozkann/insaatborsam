import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { requireBuyer } from '@/lib/rfq/guards'
import { createClient } from '@/lib/supabase/server'
import {
  orderStatusLabel,
  orderStatusBadgeClass,
  orderStatusBuyerDescription,
  paymentStatusLabel,
  paymentStatusBadgeClass,
} from '@/lib/order/order-status'
import { OrderTimeline, type OrderTimelineEntry } from '@/components/order/OrderTimeline'

export const metadata: Metadata = {
  title: 'Sipariş Detayı | İnşaat Borsam',
  robots: { index: false },
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const UNIT_LABELS: Record<string, string> = {
  m2: 'm²', m3: 'm³', metre: 'Metre', ton: 'Ton', kg: 'Kg',
  adet: 'Adet', paket: 'Paket', kutu: 'Kutu', litre: 'Litre', cuval: 'Çuval',
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })
}

function formatCents(cents: number): string {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(cents / 100)
}

type Props = { params: Promise<{ id: string }> }

export default async function AliciSiparisDetayPage({ params }: Props) {
  const { id } = await params
  const { buyerProfileId } = await requireBuyer(`/alici/siparis/${id}`)

  if (!UUID_RE.test(id)) notFound()

  const supabase = await createClient()

  // RLS (orders_select_buyer) + app katmanı filtresi (defense-in-depth): yalnızca kendi siparişi.
  // Satıcı vitrin bilgisi embed edilir (seller_profiles public read — doğrulanmış satıcı).
  const { data: order } = await supabase
    .from('orders')
    .select(
      'id, order_number, status, payment_status, currency, subtotal_cents, shipping_cost_cents, tax_amount_cents, total_amount_cents, created_at, source_rfq_id, delivery_address_id, seller_profiles(store_name, company_name, primary_city)',
    )
    .eq('id', id)
    .eq('buyer_id', buyerProfileId)
    .maybeSingle()

  if (!order) notFound()

  const { data: items } = await supabase
    .from('order_items')
    .select('id, product_name_snapshot, unit_price_snapshot_cents, quantity, unit, line_total_cents, display_order')
    .eq('order_id', order.id)
    .order('display_order')

  // Durum geçmişi (RLS: order_status_history_select_buyer — yalnızca kendi siparişi).
  const { data: history } = await supabase
    .from('order_status_history')
    .select('id, status_to, actor_type, note, created_at')
    .eq('order_id', order.id)
    .order('created_at', { ascending: true })

  // Teslimat adresi YALNIZCA bağlıysa ve alıcının KENDİ adresiyse okunur
  // (addresses_select_own: user_id = auth.uid()). NULL ise empty state gösterilir.
  // Bu sprintte adres SEÇME/KAYDETME yok — sadece okuma + hazırlık paneli.
  let address: {
    label: string | null
    recipient_name: string
    city: string
    district: string
    neighborhood: string | null
    street_address: string
  } | null = null
  if (order.delivery_address_id) {
    const { data } = await supabase
      .from('addresses')
      .select('label, recipient_name, city, district, neighborhood, street_address')
      .eq('id', order.delivery_address_id)
      .maybeSingle()
    address = data ?? null
  }

  const seller = order.seller_profiles
  const sellerName = seller?.store_name ?? seller?.company_name ?? 'Satıcı'

  const timelineEntries: OrderTimelineEntry[] = (history ?? []).map((h) => ({
    id: h.id,
    statusTo: h.status_to,
    actorType: h.actor_type,
    note: h.note,
    createdAt: h.created_at,
  }))

  return (
    <>
      <section className="bg-surface border-b border-border py-10">
        <div className="w-full max-w-container mx-auto px-5 md:px-12">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-ink-muted block mb-2">
                Sipariş
              </span>
              <h1 className="text-[28px] font-extrabold tracking-tight text-ink leading-[36px] tabular-nums">
                {order.order_number ?? 'Sipariş'}
              </h1>
              <div className="flex items-center gap-2 mt-3 flex-wrap">
                <span
                  className={`text-xs font-bold uppercase tracking-wider px-2 py-1 ${orderStatusBadgeClass(order.status)}`}
                >
                  {orderStatusLabel(order.status)}
                </span>
                <span className="text-xs text-ink-muted">{formatDate(order.created_at)}</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {order.source_rfq_id && (
                <Link
                  href={`/alici/rfq/${order.source_rfq_id}`}
                  className="border border-border-strong text-navy font-bold text-xs uppercase tracking-wider px-4 py-2 hover:bg-surface-container transition-colors"
                >
                  ← Teklif Talebi
                </Link>
              )}
              <Link
                href="/alici/rfq"
                className="border border-border-strong text-navy font-bold text-xs uppercase tracking-wider px-4 py-2 hover:bg-surface-container transition-colors"
              >
                Taleplerim
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-surface py-10 md:py-16">
        <div className="w-full max-w-container mx-auto px-5 md:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 flex flex-col gap-6">

              {/* Ödeme bilgi notu — Sprint 8: ödeme YOK */}
              <div className="border border-border bg-surface-container px-5 py-4 flex flex-col gap-2">
                <p className="text-sm text-ink leading-6">
                  Siparişiniz oluşturuldu. {orderStatusBuyerDescription(order.status)}
                </p>
                <p className="text-xs text-ink-secondary leading-5">
                  <strong className="text-ink">Bu sipariş henüz ödeme alınmış bir sipariş değildir.</strong>{' '}
                  Ödeme ve teslimat adımı henüz aktif değildir; bu aşamada herhangi bir tahsilat yapılmaz.
                </p>
              </div>

              {/* Sipariş Kalemleri */}
              <div className="border border-border bg-surface-container-lowest">
                <div className="p-5 border-b border-border">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-navy">
                    Sipariş Kalemleri ({items?.length ?? 0})
                  </h2>
                </div>
                <div className="divide-y divide-border">
                  {(items ?? []).map((item) => (
                    <div key={item.id} className="px-5 py-4 flex flex-col gap-1">
                      <div className="flex items-start justify-between gap-4">
                        <span className="text-sm font-bold text-ink">{item.product_name_snapshot}</span>
                        <span className="text-sm text-ink font-bold tabular-nums text-right flex-shrink-0">
                          {formatCents(item.line_total_cents)}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="text-xs text-ink-muted tabular-nums">
                          {item.quantity} {UNIT_LABELS[item.unit] ?? item.unit}
                        </span>
                        <span className="text-xs text-ink-muted tabular-nums">
                          Birim: {formatCents(item.unit_price_snapshot_cents)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Teslimat Hazırlığı — Sprint 8: SADECE okuma/hazırlık, adres SEÇME yok */}
              <div className="border border-border bg-surface-container-lowest">
                <div className="p-5 border-b border-border">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-navy">Teslimat Hazırlığı</h2>
                </div>
                {address ? (
                  <div className="px-5 py-4 flex flex-col gap-1">
                    {address.label && (
                      <span className="text-xs text-ink-muted uppercase tracking-wider">{address.label}</span>
                    )}
                    <span className="text-sm font-bold text-ink">{address.recipient_name}</span>
                    <span className="text-sm text-ink leading-5">{address.street_address}</span>
                    <span className="text-xs text-ink-muted">
                      {[address.neighborhood, address.district, address.city].filter(Boolean).join(', ')}
                    </span>
                    <span className="text-xs text-ink-secondary leading-5 mt-2">
                      Teslimat tercihi ve kargo seçimi yakında eklenecektir.
                    </span>
                  </div>
                ) : (
                  <div className="px-5 py-4">
                    <p className="text-sm text-ink-secondary leading-6">
                      Teslimat bilgisi henüz eklenmedi.{' '}
                      <strong className="text-ink">Adres ve teslimat adımı ilerleyen aşamada açılacaktır.</strong>
                    </p>
                  </div>
                )}
              </div>

              {/* Satıcı */}
              <div className="border border-border bg-surface-container-lowest">
                <div className="p-5 border-b border-border">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-navy">Satıcı</h2>
                </div>
                <div className="px-5 py-4 flex flex-col gap-1">
                  <span className="text-sm font-bold text-ink">{sellerName}</span>
                  {seller?.primary_city && (
                    <span className="text-xs text-ink-muted">{seller.primary_city}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Sağ panel */}
            <aside className="flex flex-col gap-4">
              {/* Tutar Özeti */}
              <div className="border border-border bg-surface-container-lowest">
                <div className="p-5 border-b border-border">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-navy">Tutar Özeti</h3>
                </div>
                <div className="divide-y divide-border">
                  <div className="px-5 py-4 flex justify-between items-center gap-4">
                    <span className="text-xs text-ink-muted uppercase tracking-wider">Ara Toplam</span>
                    <span className="text-sm font-medium text-ink tabular-nums">{formatCents(order.subtotal_cents)}</span>
                  </div>
                  <div className="px-5 py-4 flex justify-between items-center gap-4">
                    <span className="text-xs text-ink-muted uppercase tracking-wider">Kargo</span>
                    <span className="text-sm font-medium text-ink tabular-nums">{formatCents(order.shipping_cost_cents)}</span>
                  </div>
                  <div className="px-5 py-4 flex justify-between items-center gap-4">
                    <span className="text-xs text-ink-muted uppercase tracking-wider">KDV</span>
                    <span className="text-sm font-medium text-ink tabular-nums">{formatCents(order.tax_amount_cents)}</span>
                  </div>
                  <div className="px-5 py-4 flex justify-between items-center gap-4 bg-surface-container">
                    <span className="text-xs text-navy uppercase tracking-wider font-bold">Toplam</span>
                    <span className="text-sm font-extrabold text-ink tabular-nums">{formatCents(order.total_amount_cents)}</span>
                  </div>
                </div>
              </div>

              {/* Durum + Ödeme */}
              <div className="border border-border bg-surface-container-lowest">
                <div className="p-5 border-b border-border">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-navy">Durum</h3>
                </div>
                <div className="divide-y divide-border">
                  <div className="px-5 py-4 flex justify-between items-center gap-4">
                    <span className="text-xs text-ink-muted uppercase tracking-wider">Sipariş</span>
                    <span className={`text-xs font-bold uppercase tracking-wider px-2 py-0.5 ${orderStatusBadgeClass(order.status)}`}>
                      {orderStatusLabel(order.status)}
                    </span>
                  </div>
                  <div className="px-5 py-4 flex justify-between items-center gap-4">
                    <span className="text-xs text-ink-muted uppercase tracking-wider">Ödeme</span>
                    <span className={`text-xs font-bold uppercase tracking-wider px-2 py-0.5 ${paymentStatusBadgeClass(order.payment_status)}`}>
                      {paymentStatusLabel(order.payment_status)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Sipariş Geçmişi (timeline) */}
              <div className="border border-border bg-surface-container-lowest">
                <div className="p-5 border-b border-border">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-navy">Sipariş Geçmişi</h3>
                </div>
                <div className="p-5">
                  <OrderTimeline
                    entries={timelineEntries}
                    fallbackStatus={order.status}
                    fallbackDate={order.created_at}
                  />
                </div>
                <div className="p-5 border-t border-border">
                  <Link href="/alici/rfq" className="text-xs text-navy underline font-medium">
                    Tüm taleplerime dön
                  </Link>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>
    </>
  )
}
