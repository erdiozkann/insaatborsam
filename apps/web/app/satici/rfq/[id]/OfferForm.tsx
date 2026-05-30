'use client'

import { useActionState, useMemo, useState } from 'react'
import { useFormStatus } from 'react-dom'
import { createOfferAction, type OfferCreateState } from './actions'

const initialState: OfferCreateState = {}

function formatCents(cents: number): string {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(cents / 100)
}

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="bg-brand text-navy font-bold text-sm uppercase tracking-wider px-6 py-3 hover:opacity-90 transition-opacity disabled:opacity-50 min-h-[44px]"
    >
      {pending ? 'Gönderiliyor...' : 'Teklif Gönder →'}
    </button>
  )
}

type Props = {
  rfqId: string
  quantity: number
  unitLabel: string
}

export function OfferForm({ rfqId, quantity, unitLabel }: Props) {
  const boundAction = useMemo(() => createOfferAction.bind(null, rfqId), [rfqId])
  const [state, dispatch] = useActionState(boundAction, initialState)

  // Toplam tutar önizlemesi — yalnızca gösterim amaçlı; sunucu yeniden hesaplar.
  const [unitPrice, setUnitPrice] = useState('')

  const previewTotalCents = useMemo(() => {
    const parsed = parseFloat(unitPrice.replace(',', '.'))
    if (!Number.isFinite(parsed) || parsed <= 0) return null
    return Math.round(Math.round(parsed * 100) * quantity)
  }, [unitPrice, quantity])

  return (
    <form action={dispatch} className="flex flex-col gap-5">
      {state.error && (
        <div className="border border-state-error bg-surface-container-lowest px-5 py-4">
          <p className="text-sm text-state-error font-medium">{state.error}</p>
        </div>
      )}

      <div>
        <label
          htmlFor="unit_price"
          className="block text-xs font-bold uppercase tracking-wider text-ink-muted mb-2"
        >
          Birim Fiyat (₺) <span className="text-state-error">*</span>
        </label>
        <input
          id="unit_price"
          type="number"
          name="unit_price"
          required
          min="0.01"
          step="0.01"
          inputMode="decimal"
          value={unitPrice}
          onChange={(e) => setUnitPrice(e.target.value)}
          placeholder="0,00"
          className="w-full border border-border bg-surface px-4 py-2.5 text-sm text-ink tabular-nums placeholder:text-ink-muted focus:outline-none focus:border-navy"
        />
        <p className="text-xs text-ink-muted mt-2 tabular-nums">
          Ana miktar: {quantity} {unitLabel}
          {previewTotalCents !== null && (
            <>
              {' · '}
              Tahmini toplam:{' '}
              <span className="font-bold text-ink">{formatCents(previewTotalCents)}</span>
            </>
          )}
        </p>
      </div>

      <div>
        <label
          htmlFor="delivery_time_days"
          className="block text-xs font-bold uppercase tracking-wider text-ink-muted mb-2"
        >
          Teslimat Süresi (Gün) <span className="text-state-error">*</span>
        </label>
        <input
          id="delivery_time_days"
          type="number"
          name="delivery_time_days"
          required
          min="1"
          max="365"
          step="1"
          placeholder="Örn: 7"
          className="w-full border border-border bg-surface px-4 py-2.5 text-sm text-ink tabular-nums placeholder:text-ink-muted focus:outline-none focus:border-navy"
        />
      </div>

      <div>
        <label
          htmlFor="notes"
          className="block text-xs font-bold uppercase tracking-wider text-ink-muted mb-2"
        >
          Teklif Notu (Opsiyonel)
        </label>
        <textarea
          id="notes"
          name="notes"
          maxLength={1000}
          rows={3}
          placeholder="Örn: Fiyat 15 gün geçerlidir, kargo dahil değildir."
          className="w-full border border-border bg-surface px-4 py-2.5 text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:border-navy resize-none"
        />
      </div>

      <div className="flex items-center justify-between gap-4 pt-1">
        <p className="text-xs text-ink-muted leading-5">
          Toplam tutar, birim fiyat ile ana miktar çarpılarak hesaplanır.
        </p>
        <SubmitButton />
      </div>
    </form>
  )
}
