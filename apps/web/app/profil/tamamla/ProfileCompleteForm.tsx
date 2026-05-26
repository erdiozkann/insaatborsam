'use client'

import { useActionState } from 'react'
import { profileCompleteAction, type ProfileCompleteState } from './actions'

type InitialValues = {
  company_name: string | null
  company_type: string | null
  tax_id: string | null
}

type Props = {
  initialValues: InitialValues
}

const initialState: ProfileCompleteState = {}

const COMPANY_TYPE_OPTIONS = [
  { value: '', label: 'Seçiniz (opsiyonel)' },
  { value: 'muteahhit', label: 'Müteahhit' },
  { value: 'usta', label: 'Usta' },
  { value: 'muhendis', label: 'Mühendis' },
  { value: 'mimar', label: 'Mimar' },
  { value: 'bireysel', label: 'Bireysel' },
]

export function ProfileCompleteForm({ initialValues }: Props) {
  const [state, formAction, pending] = useActionState(profileCompleteAction, initialState)

  return (
    <form action={formAction} className="flex flex-col gap-6">
      {state.error && (
        <div role="alert" className="border border-state-error bg-surface-container p-4">
          <p className="text-sm text-state-error">{state.error}</p>
        </div>
      )}

      <div className="flex flex-col gap-1">
        <label
          htmlFor="company_type"
          className="text-xs font-bold uppercase tracking-wider text-navy"
        >
          Faaliyet Alanı
        </label>
        <select
          id="company_type"
          name="company_type"
          defaultValue={initialValues.company_type ?? ''}
          className="border border-border bg-surface px-4 py-3 text-ink focus-visible:outline-2 focus-visible:outline-navy appearance-none"
        >
          {COMPANY_TYPE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <span className="text-xs text-ink-muted">Faaliyetinize en uygun seçeneği işaretleyin</span>
      </div>

      <div className="flex flex-col gap-1">
        <label
          htmlFor="company_name"
          className="text-xs font-bold uppercase tracking-wider text-navy"
        >
          Firma / Şantiye Adı
        </label>
        <input
          id="company_name"
          name="company_name"
          type="text"
          maxLength={200}
          defaultValue={initialValues.company_name ?? ''}
          placeholder="Örnek İnşaat A.Ş."
          className="border border-border bg-surface px-4 py-3 text-ink placeholder:text-ink-muted focus-visible:outline-2 focus-visible:outline-navy"
        />
        <span className="text-xs text-ink-muted">Bireysel kullanıcılar boş bırakabilir</span>
      </div>

      <div className="flex flex-col gap-1">
        <label
          htmlFor="tax_id"
          className="text-xs font-bold uppercase tracking-wider text-navy"
        >
          Vergi Numarası
        </label>
        <input
          id="tax_id"
          name="tax_id"
          type="text"
          inputMode="numeric"
          maxLength={11}
          defaultValue={initialValues.tax_id ?? ''}
          placeholder="10 veya 11 haneli vergi numarası"
          className="border border-border bg-surface px-4 py-3 text-ink placeholder:text-ink-muted focus-visible:outline-2 focus-visible:outline-navy tabular-nums"
        />
        <span className="text-xs text-ink-muted">Bireysel kullanıcılar boş bırakabilir</span>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          type="submit"
          disabled={pending}
          className="bg-brand text-navy font-bold text-sm uppercase tracking-wider px-6 py-3 min-h-11 flex items-center justify-center hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {pending ? 'Kaydediliyor...' : 'Kaydet ve Devam Et'}
        </button>
        <a
          href="/profil"
          className="border border-border text-ink-secondary font-bold text-sm uppercase tracking-wider px-6 py-3 min-h-11 flex items-center justify-center hover:bg-surface-container transition-colors"
        >
          Şimdi Değil
        </a>
      </div>
    </form>
  )
}
