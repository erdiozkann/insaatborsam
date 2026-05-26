'use client'

import { useActionState, useState } from 'react'
import { sellerOnboardingAction, type SellerOnboardingState } from './actions'

type InitialValues = {
  company_name: string
  company_type: string
  tax_id: string
  trade_registry_no: string | null
  store_name: string
  store_slug: string
  store_description: string | null
  primary_city: string
  primary_district: string
  service_areas: string[]
}

type Props = {
  initialValues: InitialValues
  isExisting: boolean
}

const initialState: SellerOnboardingState = {}

const COMPANY_TYPE_OPTIONS = [
  { value: '', label: 'Seçiniz' },
  { value: 'nalbur', label: 'Nalbur / Hırdavat' },
  { value: 'toptan', label: 'Toptan Satıcı' },
  { value: 'bayi', label: 'Yetkili Bayi' },
  { value: 'distributor', label: 'Distribütör' },
  { value: 'uretici', label: 'Üretici' },
]

function slugify(name: string): string {
  const turkishMap: Record<string, string> = {
    ş: 's', Ş: 's', ç: 'c', Ç: 'c', ğ: 'g', Ğ: 'g',
    ı: 'i', İ: 'i', ö: 'o', Ö: 'o', ü: 'u', Ü: 'u',
  }
  return name
    .split('')
    .map((c) => turkishMap[c] ?? c)
    .join('')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 100)
}

export function SellerOnboardingForm({ initialValues, isExisting }: Props) {
  const [state, formAction, pending] = useActionState(sellerOnboardingAction, initialState)
  const [storeSlug, setStoreSlug] = useState(initialValues.store_slug)
  const [slugTouched, setSlugTouched] = useState(isExisting)

  function handleStoreNameChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (!slugTouched) {
      setStoreSlug(slugify(e.target.value))
    }
  }

  function handleSlugChange(e: React.ChangeEvent<HTMLInputElement>) {
    setSlugTouched(true)
    setStoreSlug(e.target.value)
  }

  return (
    <form action={formAction} className="flex flex-col gap-8">
      {state.error && (
        <div role="alert" className="border border-state-error bg-surface-container p-4">
          <p className="text-sm text-state-error">{state.error}</p>
        </div>
      )}

      {/* Firma Bilgileri */}
      <fieldset className="flex flex-col gap-5">
        <legend className="text-xs font-bold uppercase tracking-wider text-navy border-b border-border pb-3 w-full mb-2">
          Firma Bilgileri
        </legend>

        <div className="flex flex-col gap-1">
          <label
            htmlFor="company_name"
            className="text-xs font-bold uppercase tracking-wider text-navy"
          >
            Firma Adı <span className="text-state-error">*</span>
          </label>
          <input
            id="company_name"
            name="company_name"
            type="text"
            maxLength={200}
            defaultValue={initialValues.company_name}
            required
            className="border border-border bg-surface px-4 py-3 text-ink placeholder:text-ink-muted focus-visible:outline-2 focus-visible:outline-navy"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label
            htmlFor="company_type"
            className="text-xs font-bold uppercase tracking-wider text-navy"
          >
            Firma Türü <span className="text-state-error">*</span>
          </label>
          <select
            id="company_type"
            name="company_type"
            defaultValue={initialValues.company_type}
            required
            className="border border-border bg-surface px-4 py-3 text-ink focus-visible:outline-2 focus-visible:outline-navy appearance-none"
          >
            {COMPANY_TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value} disabled={opt.value === ''}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <label
              htmlFor="tax_id"
              className="text-xs font-bold uppercase tracking-wider text-navy"
            >
              Vergi Numarası <span className="text-state-error">*</span>
            </label>
            <input
              id="tax_id"
              name="tax_id"
              type="text"
              inputMode="numeric"
              maxLength={11}
              defaultValue={initialValues.tax_id}
              required
              placeholder="10 veya 11 hane"
              className="border border-border bg-surface px-4 py-3 text-ink placeholder:text-ink-muted focus-visible:outline-2 focus-visible:outline-navy tabular-nums"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label
              htmlFor="trade_registry_no"
              className="text-xs font-bold uppercase tracking-wider text-navy"
            >
              Ticaret Sicil No
            </label>
            <input
              id="trade_registry_no"
              name="trade_registry_no"
              type="text"
              maxLength={50}
              defaultValue={initialValues.trade_registry_no ?? ''}
              placeholder="Opsiyonel"
              className="border border-border bg-surface px-4 py-3 text-ink placeholder:text-ink-muted focus-visible:outline-2 focus-visible:outline-navy"
            />
          </div>
        </div>
      </fieldset>

      {/* Mağaza Bilgileri */}
      <fieldset className="flex flex-col gap-5">
        <legend className="text-xs font-bold uppercase tracking-wider text-navy border-b border-border pb-3 w-full mb-2">
          Mağaza Bilgileri
        </legend>

        <div className="flex flex-col gap-1">
          <label
            htmlFor="store_name"
            className="text-xs font-bold uppercase tracking-wider text-navy"
          >
            Mağaza Adı <span className="text-state-error">*</span>
          </label>
          <input
            id="store_name"
            name="store_name"
            type="text"
            maxLength={200}
            defaultValue={initialValues.store_name}
            required
            onChange={handleStoreNameChange}
            className="border border-border bg-surface px-4 py-3 text-ink placeholder:text-ink-muted focus-visible:outline-2 focus-visible:outline-navy"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label
            htmlFor="store_slug"
            className="text-xs font-bold uppercase tracking-wider text-navy"
          >
            Mağaza Adresi <span className="text-state-error">*</span>
          </label>
          <div className="flex items-center border border-border bg-surface">
            <span className="px-3 py-3 text-sm text-ink-muted border-r border-border bg-surface-container-low flex-shrink-0 select-none">
              insaatborsam.com/m/
            </span>
            <input
              id="store_slug"
              name="store_slug"
              type="text"
              maxLength={100}
              value={storeSlug}
              onChange={handleSlugChange}
              required
              placeholder="magaza-adiniz"
              className="flex-1 px-4 py-3 text-ink placeholder:text-ink-muted focus-visible:outline-2 focus-visible:outline-navy bg-transparent"
            />
          </div>
          <span className="text-xs text-ink-muted">
            Sadece küçük harf, rakam ve tire (-) kullanın
          </span>
        </div>

        <div className="flex flex-col gap-1">
          <label
            htmlFor="store_description"
            className="text-xs font-bold uppercase tracking-wider text-navy"
          >
            Mağaza Açıklaması
          </label>
          <textarea
            id="store_description"
            name="store_description"
            maxLength={500}
            rows={3}
            defaultValue={initialValues.store_description ?? ''}
            placeholder="Ürün ve hizmetlerinizi kısaca tanıtın..."
            className="border border-border bg-surface px-4 py-3 text-ink placeholder:text-ink-muted focus-visible:outline-2 focus-visible:outline-navy resize-none"
          />
          <span className="text-xs text-ink-muted">En fazla 500 karakter</span>
        </div>
      </fieldset>

      {/* Konum */}
      <fieldset className="flex flex-col gap-5">
        <legend className="text-xs font-bold uppercase tracking-wider text-navy border-b border-border pb-3 w-full mb-2">
          Konum ve Hizmet Alanı
        </legend>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <label
              htmlFor="primary_city"
              className="text-xs font-bold uppercase tracking-wider text-navy"
            >
              Ana Şehir <span className="text-state-error">*</span>
            </label>
            <input
              id="primary_city"
              name="primary_city"
              type="text"
              maxLength={100}
              defaultValue={initialValues.primary_city}
              required
              placeholder="İstanbul"
              className="border border-border bg-surface px-4 py-3 text-ink placeholder:text-ink-muted focus-visible:outline-2 focus-visible:outline-navy"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label
              htmlFor="primary_district"
              className="text-xs font-bold uppercase tracking-wider text-navy"
            >
              İlçe <span className="text-state-error">*</span>
            </label>
            <input
              id="primary_district"
              name="primary_district"
              type="text"
              maxLength={100}
              defaultValue={initialValues.primary_district}
              required
              placeholder="Bağcılar"
              className="border border-border bg-surface px-4 py-3 text-ink placeholder:text-ink-muted focus-visible:outline-2 focus-visible:outline-navy"
            />
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label
            htmlFor="service_areas"
            className="text-xs font-bold uppercase tracking-wider text-navy"
          >
            Hizmet Verilen Şehirler
          </label>
          <input
            id="service_areas"
            name="service_areas"
            type="text"
            defaultValue={initialValues.service_areas.join(', ')}
            placeholder="İstanbul, Bursa, Kocaeli"
            className="border border-border bg-surface px-4 py-3 text-ink placeholder:text-ink-muted focus-visible:outline-2 focus-visible:outline-navy"
          />
          <span className="text-xs text-ink-muted">Virgülle ayırarak birden fazla şehir girebilirsiniz</span>
        </div>
      </fieldset>

      <div className="border border-border bg-surface-container-lowest p-4">
        <p className="text-xs text-ink-muted leading-5">
          Mağaza profiliniz oluşturulduktan sonra ekibimiz tarafından doğrulama yapılacaktır.
          Doğrulama tamamlanana kadar satış yapamazsınız. Vergi levhası ve ticaret sicil
          belgelerinizi doğrulama sürecinde talep edeceğiz.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          type="submit"
          disabled={pending}
          className="bg-brand text-navy font-bold text-sm uppercase tracking-wider px-6 py-3 min-h-11 flex items-center justify-center hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {pending
            ? 'Kaydediliyor...'
            : isExisting
              ? 'Değişiklikleri Kaydet'
              : 'Mağaza Profilini Oluştur'}
        </button>
        <a
          href="/profil"
          className="border border-border text-ink-secondary font-bold text-sm uppercase tracking-wider px-6 py-3 min-h-11 flex items-center justify-center hover:bg-surface-container transition-colors"
        >
          İptal
        </a>
      </div>
    </form>
  )
}
