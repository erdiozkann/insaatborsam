// apps/web/src/components/order/OrderTimeline.tsx
// Sipariş durum geçiş timeline'ı — SALT-OKUMA. Mutation/status update YOK.
// Veri kaynağı: order_status_history (append-only). Kayıt yoksa mevcut order.status
// üzerinden tek adımlı durum gösterilir.
//
// Server component — interaktivite yok. Industrial Precision: 0 radius, border,
// token renkler (hex yok), tabular-nums (tarih/sayı).

import { orderStatusLabel } from '@/lib/order/order-status'

export type OrderTimelineEntry = {
  id: string
  statusTo: string
  actorType: string
  note: string | null
  createdAt: string
}

const ACTOR_LABELS: Record<string, string> = {
  buyer: 'Alıcı',
  seller: 'Satıcı',
  staff: 'Operasyon',
  system: 'Sistem',
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export function OrderTimeline({
  entries,
  fallbackStatus,
  fallbackDate,
}: {
  entries: OrderTimelineEntry[]
  fallbackStatus: string
  fallbackDate: string
}) {
  // Geçmiş kaydı yoksa: mevcut durumdan tek adımlı güvenli görünüm.
  const rows: OrderTimelineEntry[] =
    entries.length > 0
      ? entries
      : [
          {
            id: 'fallback',
            statusTo: fallbackStatus,
            actorType: 'system',
            note: null,
            createdAt: fallbackDate,
          },
        ]

  return (
    <ol className="flex flex-col">
      {rows.map((row, idx) => {
        const isLast = idx === rows.length - 1
        return (
          <li key={row.id} className="flex gap-4">
            {/* Marker sütunu (kare nokta + dikey çizgi) */}
            <div className="flex flex-col items-center flex-shrink-0">
              <span
                className={`mt-1 h-3 w-3 ${isLast ? 'bg-brand' : 'bg-navy'}`}
                aria-hidden="true"
              />
              {!isLast && <span className="w-px flex-1 bg-border" aria-hidden="true" />}
            </div>
            {/* İçerik */}
            <div className={`flex flex-col gap-1 ${isLast ? '' : 'pb-5'}`}>
              <span className="text-sm font-bold text-ink">{orderStatusLabel(row.statusTo)}</span>
              <span className="text-xs text-ink-muted tabular-nums">
                {formatDateTime(row.createdAt)} · {ACTOR_LABELS[row.actorType] ?? 'Sistem'}
              </span>
              {row.note && <span className="text-xs text-ink-secondary leading-5">{row.note}</span>}
            </div>
          </li>
        )
      })}
    </ol>
  )
}
