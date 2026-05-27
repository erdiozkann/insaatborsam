'use client'

import { useActionState, useEffect, useRef, useState } from 'react'
import { useFormStatus } from 'react-dom'
import { createRfqAction } from './actions'
import type { RfqCreateState } from './actions'

type Category = { id: string; name: string }

type Item = {
  key: number
  material_name: string
  quantity: string
  unit: string
  notes: string
}

const UNIT_OPTIONS = [
  { value: 'm2', label: 'm²' },
  { value: 'm3', label: 'm³' },
  { value: 'metre', label: 'Metre' },
  { value: 'ton', label: 'Ton' },
  { value: 'kg', label: 'Kg' },
  { value: 'adet', label: 'Adet' },
  { value: 'paket', label: 'Paket' },
  { value: 'kutu', label: 'Kutu' },
  { value: 'litre', label: 'Litre' },
  { value: 'cuval', label: 'Çuval' },
]

const initialState: RfqCreateState = {}

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="bg-brand text-navy font-bold text-sm uppercase tracking-wider px-6 py-3 hover:opacity-90 transition-opacity disabled:opacity-50"
    >
      {pending ? 'Kaydediliyor...' : 'Teklif Talebi Oluştur →'}
    </button>
  )
}

export function RfqCreateForm({ categories }: { categories: Category[] }) {
  const [state, dispatch] = useActionState(createRfqAction, initialState)
  const itemsJsonRef = useRef<HTMLInputElement>(null)
  const nextKey = useRef(1)

  const today = new Date().toISOString().split('T')[0]

  const [items, setItems] = useState<Item[]>([
    { key: 0, material_name: '', quantity: '', unit: 'adet', notes: '' },
  ])

  useEffect(() => {
    if (!itemsJsonRef.current) return
    const serialized = items.map(({ material_name, quantity, unit, notes }) => ({
      material_name: material_name.trim(),
      quantity: parseFloat(quantity.replace(',', '.')) || 0,
      unit,
      notes: notes.trim() || null,
    }))
    itemsJsonRef.current.value = JSON.stringify(serialized)
  }, [items])

  function addItem() {
    if (items.length >= 20) return
    setItems((prev) => [
      ...prev,
      { key: nextKey.current++, material_name: '', quantity: '', unit: 'adet', notes: '' },
    ])
  }

  function removeItem(key: number) {
    if (items.length <= 1) return
    setItems((prev) => prev.filter((i) => i.key !== key))
  }

  function updateItem(key: number, field: keyof Omit<Item, 'key'>, value: string) {
    setItems((prev) => prev.map((i) => (i.key === key ? { ...i, [field]: value } : i)))
  }

  return (
    <form action={dispatch} className="flex flex-col gap-8">
      <input type="hidden" name="items_json" ref={itemsJsonRef} defaultValue="[]" />

      {state.error && (
        <div className="border border-state-error bg-surface-container-lowest px-5 py-4">
          <p className="text-sm text-state-error font-medium">{state.error}</p>
        </div>
      )}

      {/* Talep Bilgileri */}
      <div className="border border-border bg-surface-container-lowest">
        <div className="p-5 border-b border-border">
          <h2 className="text-xs font-bold uppercase tracking-wider text-navy">Talep Bilgileri</h2>
        </div>
        <div className="p-5 flex flex-col gap-5">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-ink-muted mb-2">
              Talep Başlığı <span className="text-state-error">*</span>
            </label>
            <input
              type="text"
              name="title"
              required
              minLength={3}
              maxLength={300}
              placeholder="Örn: Çimento ve Demir Alımı"
              className="w-full border border-border bg-surface px-4 py-2.5 text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:border-navy"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-ink-muted mb-2">
              Açıklama <span className="text-state-error">*</span>
            </label>
            <textarea
              name="description"
              required
              minLength={10}
              maxLength={2000}
              rows={4}
              placeholder="Malzeme özellikleri, teslimat şartları ve diğer gereksinimlerinizi yazın."
              className="w-full border border-border bg-surface px-4 py-2.5 text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:border-navy resize-none"
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-xs font-bold uppercase tracking-wider text-ink-muted mb-2">
                Ana Miktar <span className="text-state-error">*</span>
              </label>
              <input
                type="number"
                name="quantity"
                required
                min="0.01"
                step="0.01"
                placeholder="100"
                className="w-full border border-border bg-surface px-4 py-2.5 text-sm text-ink tabular-nums placeholder:text-ink-muted focus:outline-none focus:border-navy"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-ink-muted mb-2">
                Birim <span className="text-state-error">*</span>
              </label>
              <select
                name="unit"
                required
                defaultValue="adet"
                className="w-full border border-border bg-surface px-4 py-2.5 text-sm text-ink focus:outline-none focus:border-navy"
              >
                {UNIT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-ink-muted mb-2">
                Teslimat Tarihi <span className="text-state-error">*</span>
              </label>
              <input
                type="date"
                name="delivery_deadline"
                required
                min={today}
                className="w-full border border-border bg-surface px-4 py-2.5 text-sm text-ink focus:outline-none focus:border-navy"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {categories.length > 0 && (
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-ink-muted mb-2">
                  Kategori
                </label>
                <select
                  name="category_id"
                  defaultValue=""
                  className="w-full border border-border bg-surface px-4 py-2.5 text-sm text-ink focus:outline-none focus:border-navy"
                >
                  <option value="">— Kategori Seçin (opsiyonel) —</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-ink-muted mb-2">
                Tahmini Bütçe (₺)
              </label>
              <input
                type="number"
                name="estimated_budget"
                min="1"
                step="1"
                placeholder="Opsiyonel"
                className="w-full border border-border bg-surface px-4 py-2.5 text-sm text-ink tabular-nums placeholder:text-ink-muted focus:outline-none focus:border-navy"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Malzeme Kalemleri */}
      <div className="border border-border bg-surface-container-lowest">
        <div className="p-5 border-b border-border flex items-center justify-between">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-navy">Malzeme Kalemleri</h2>
            <p className="text-xs text-ink-muted mt-1">En az 1 malzeme kalemi zorunludur.</p>
          </div>
          <button
            type="button"
            onClick={addItem}
            disabled={items.length >= 20}
            className="border border-border text-navy font-bold text-xs uppercase tracking-wider px-3 py-1.5 hover:bg-surface-container transition-colors disabled:opacity-40"
          >
            + Kalem Ekle
          </button>
        </div>

        <div className="divide-y divide-border">
          {items.map((item, idx) => (
            <div key={item.key} className="p-5 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-ink-muted">
                  Kalem {idx + 1}
                </span>
                {items.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeItem(item.key)}
                    className="text-xs text-state-error font-medium hover:opacity-80 transition-opacity"
                  >
                    Kaldır
                  </button>
                )}
              </div>

              <div>
                <label className="block text-xs text-ink-muted uppercase tracking-wider mb-2">
                  Malzeme Adı <span className="text-state-error">*</span>
                </label>
                <input
                  type="text"
                  value={item.material_name}
                  onChange={(e) => updateItem(item.key, 'material_name', e.target.value)}
                  required
                  minLength={2}
                  maxLength={200}
                  placeholder="Örn: Portland Çimentosu"
                  className="w-full border border-border bg-surface px-4 py-2.5 text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:border-navy"
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs text-ink-muted uppercase tracking-wider mb-2">
                    Miktar <span className="text-state-error">*</span>
                  </label>
                  <input
                    type="number"
                    value={item.quantity}
                    onChange={(e) => updateItem(item.key, 'quantity', e.target.value)}
                    required
                    min="0.01"
                    step="0.01"
                    placeholder="0"
                    className="w-full border border-border bg-surface px-4 py-2.5 text-sm text-ink tabular-nums placeholder:text-ink-muted focus:outline-none focus:border-navy"
                  />
                </div>
                <div>
                  <label className="block text-xs text-ink-muted uppercase tracking-wider mb-2">
                    Birim <span className="text-state-error">*</span>
                  </label>
                  <select
                    value={item.unit}
                    onChange={(e) => updateItem(item.key, 'unit', e.target.value)}
                    className="w-full border border-border bg-surface px-4 py-2.5 text-sm text-ink focus:outline-none focus:border-navy"
                  >
                    {UNIT_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs text-ink-muted uppercase tracking-wider mb-2">
                    Not (opsiyonel)
                  </label>
                  <input
                    type="text"
                    value={item.notes}
                    onChange={(e) => updateItem(item.key, 'notes', e.target.value)}
                    maxLength={500}
                    placeholder="Marka, kalite, renk..."
                    className="w-full border border-border bg-surface px-4 py-2.5 text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:border-navy"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between gap-4 pt-2">
        <p className="text-xs text-ink-muted leading-5">
          Talebi oluşturduktan sonra sisteme kaydedilir. Satıcılar AI eşleştirme ile davet edilir.
        </p>
        <SubmitButton />
      </div>
    </form>
  )
}
