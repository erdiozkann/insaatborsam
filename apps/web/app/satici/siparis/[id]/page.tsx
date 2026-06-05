import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { requireSellerProfile } from '@/lib/seller/guards'
import { createClient } from '@/lib/supabase/server'
import { SellerPendingScreen } from '@/components/seller/SellerPendingScreen'
import {
  orderStatusLabel,
  orderStatusBadgeClass,
  orderStatusSellerDescription,
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

export default async function SaticiSiparisDetayPage({ params }: Props) {
  const { id } = await params
  const { sellerProfile } = await requireSellerProfile(`/satici/siparis/${id}`)

  if (!sellerProfile.isVerified) {
    return <SellerPendingScreen storeName={sellerProfile.storeName} sectionLabel="Sipariş Detayı" />
  }

  if (!UUID_RE.test(id)) notFound()

  const supabase = await createClient()

  // RLS (orders_select_seller) + app katmanı filtresi: yalnızca kendi siparişi.
  // Alıcı kimliği (buyer_profiles) BİLİNÇLİ olarak embed EDİLMEZ — buyer_profiles RLS
  // satıcıya alıcı profilini açmaz (B2B alıcı gizliliği). Sipariş bağlamında alıcı
  // kimliği paylaşımı ayrı bir izin mekanizması olarak ileride ele alınacak.
  const { data: order } = await supabase
    .from('orders')
    .select(
      'id, order_number, status, payment_status, currency, subtotal_cents, shipping_cost_cents, tax_amount_cents, total_amount_cents, created_at, source_rfq_id',
    )
    .eq('id', id)
    .eq('seller_id', sellerProfile.id)
    .maybeSingle()

  if (!order) notFound()

  const { data: items } = await supabase
    .from('order_items')
    .select('id, product_name_snapshot, unit_price_snapshot_cents, quantity, unit, line_total_cents, display_order')
    .eq('order_id', order.id)
    .order('display_order')

  // Durum geçmişi (RLS: order_status_history_select_seller — yalnızca kendi siparişi).
  // Geçmiş kaydı alıcı PII içermez (status_to/actor_type/note/created_at).
  const { data: history } = await supabase
    .from('order_status_history')
    .select('id, status_to, actor_type, note, created_at')
    .eq('order_id', order.id)
    .order('created_at', { ascending: true })

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
              <Link
                href="/satici/teklifler"
                className="border border-border-strong text-navy font-bold text-xs uppercase tracking-wider px-4 py-2 hover:bg-surface-container transition-colors"
              >
                ← Tekliflerim
              </Link>
              <Link
                href="/satici/panel"
                className="border border-border-strong text-navy font-bold text-xs uppercase tracking-wider px-4 py-2 hover:bg-surface-container transition-colors"
              >
                Panel
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-surface py-10 md:py-16">
        <div className="w-full max-w-container mx-auto px-5 md:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 flex flex-col gap-6">

              {/* Bilgi notu — Sprint 8: ödeme YOK, sipariş ön hazırlık aşamasında */}
              <div className="border border-border bg-surface-container px-5 py-4 flex flex-col gap-2">
                <p className="text-sm text-ink leading-6">
                  Alıcı bu teklifinizden sipariş oluşturdu. {orderStatusSellerDescription(order.status)}
                </p>
                <p className="text-xs text-ink-secondary leading-5">
                  <strong className="text-ink">Sipariş ön hazırlık aşamasında; ödeme bekleniyor.</strong>{' '}
                  Ödeme ve teslimat adımı henüz aktif değildir. Henüz bir tahsilat yapılmadı.
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

              {/* Teslimat Hazırlığı — satıcıya alıcı adresi/PII GÖSTERİLMEZ */}
              <div className="border border-border bg-surface-container-lowest">
                <div className="p-5 border-b border-border">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-navy">Teslimat Hazırlığı</h2>
                </div>
                <div className="px-5 py-4">
                  <p className="text-sm text-ink-secondary leading-6">
                    Teslimat bilgileri ödeme adımında kesinleşecek.{' '}
                    <strong className="text-ink">Adres ve kargo bilgileri ilerleyen aşamada paylaşılacaktır.</strong>
                  </p>
                </div>
              </div>
            </div>

            {/* Sağ panel — tutar + durum */}
            <aside className="flex flex-col gap-4">
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

              {/* Sipariş Geçmişi (timeline) — alıcı PII içermez */}
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
                  <Link href="/satici/teklifler" className="text-xs text-navy underline font-medium">
                    Tüm tekliflerime git
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
