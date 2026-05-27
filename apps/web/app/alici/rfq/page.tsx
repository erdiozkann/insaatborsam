import type { Metadata } from 'next'
import Link from 'next/link'
import { requireBuyer } from '@/lib/rfq/guards'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: 'Teklif Taleplerim | İnşaat Borsam',
  robots: { index: false },
}

const STATUS_LABELS: Record<string, string> = {
  open: 'Açık',
  evaluating: 'Değerlendiriliyor',
  closed: 'Kapandı',
  expired: 'Süresi Doldu',
  cancelled: 'İptal Edildi',
}

function statusClass(status: string): string {
  if (status === 'open') return 'text-state-success border border-state-success'
  if (status === 'evaluating') return 'text-navy border border-navy'
  return 'text-ink-muted border border-border'
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })
}

const UNIT_LABELS: Record<string, string> = {
  m2: 'm²', m3: 'm³', metre: 'Metre', ton: 'Ton', kg: 'Kg',
  adet: 'Adet', paket: 'Paket', kutu: 'Kutu', litre: 'Litre', cuval: 'Çuval',
}

export default async function AliciRfqListPage() {
  const { buyerProfileId } = await requireBuyer('/alici/rfq')

  const supabase = await createClient()

  const { data: rfqs } = await supabase
    .from('rfqs')
    .select('id, title, status, quantity, unit, delivery_deadline, offer_count, created_at')
    .eq('buyer_id', buyerProfileId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(50)

  return (
    <>
      <section className="bg-surface border-b border-border py-10">
        <div className="w-full max-w-container mx-auto px-5 md:px-12">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-ink-muted block mb-2">
                Alıcı Paneli
              </span>
              <h1 className="text-[28px] font-extrabold tracking-tight text-ink leading-[36px]">
                Teklif Taleplerim
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/alici/rfq/yeni"
                className="bg-brand text-navy font-bold text-xs uppercase tracking-wider px-4 py-2 hover:opacity-90 transition-opacity"
              >
                + Yeni Talep
              </Link>
              <Link
                href="/alici/panel"
                className="border border-border text-navy font-bold text-xs uppercase tracking-wider px-4 py-2 hover:bg-surface-container transition-colors"
              >
                Panel
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-surface py-10 md:py-16">
        <div className="w-full max-w-container mx-auto px-5 md:px-12">
          {!rfqs || rfqs.length === 0 ? (
            <div className="border border-border bg-surface-container-lowest p-12 flex flex-col items-center gap-4 text-center max-w-xl">
              <p className="text-sm text-ink-secondary leading-6">
                Henüz teklif talebi oluşturmadınız. Birden fazla satıcıdan aynı anda fiyat teklifi almak için talep oluşturun.
              </p>
              <Link
                href="/alici/rfq/yeni"
                className="bg-brand text-navy font-bold text-sm uppercase tracking-wider px-5 py-2 hover:opacity-90 transition-opacity"
              >
                İlk Talebi Oluştur →
              </Link>
            </div>
          ) : (
            <div className="border border-border bg-surface-container-lowest divide-y divide-border">
              {rfqs.map((rfq) => (
                <Link
                  key={rfq.id}
                  href={`/alici/rfq/${rfq.id}`}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-5 py-4 hover:bg-surface-container transition-colors group"
                >
                  <div className="flex flex-col gap-1 min-w-0">
                    <span className="text-sm font-bold text-ink group-hover:text-navy transition-colors truncate">
                      {rfq.title}
                    </span>
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="text-xs text-ink-muted tabular-nums">
                        {rfq.quantity} {UNIT_LABELS[rfq.unit] ?? rfq.unit}
                      </span>
                      <span className="text-xs text-ink-muted">
                        Teslimat: {formatDate(rfq.delivery_deadline)}
                      </span>
                      <span className="text-xs text-ink-muted">
                        {formatDate(rfq.created_at)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    {rfq.offer_count > 0 && (
                      <span className="text-xs font-bold text-state-success tabular-nums">
                        {rfq.offer_count} Teklif
                      </span>
                    )}
                    <span
                      className={`text-xs font-bold uppercase tracking-wider px-2 py-1 ${statusClass(rfq.status)}`}
                    >
                      {STATUS_LABELS[rfq.status] ?? rfq.status}
                    </span>
                    <span className="text-ink-muted text-sm">→</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  )
}
