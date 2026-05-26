'use client'

import { useActionState } from 'react'
import { profileEditAction, type ProfileEditState } from './actions'

type InitialValues = {
  full_name: string
  phone: string | null
  consent_marketing: boolean
}

type Props = {
  initialValues: InitialValues
}

const initialState: ProfileEditState = {}

export function ProfileEditForm({ initialValues }: Props) {
  const [state, formAction, pending] = useActionState(profileEditAction, initialState)

  return (
    <form action={formAction} className="flex flex-col gap-6">
      {state.error && (
        <div role="alert" className="border border-state-error bg-surface-container p-4">
          <p className="text-sm text-state-error">{state.error}</p>
        </div>
      )}

      <div className="flex flex-col gap-1">
        <label
          htmlFor="full_name"
          className="text-xs font-bold uppercase tracking-wider text-navy"
        >
          Ad Soyad <span className="text-state-error">*</span>
        </label>
        <input
          id="full_name"
          name="full_name"
          type="text"
          autoComplete="name"
          maxLength={100}
          defaultValue={initialValues.full_name}
          required
          className="border border-border bg-surface px-4 py-3 text-ink placeholder:text-ink-muted focus-visible:outline-2 focus-visible:outline-navy"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label
          htmlFor="phone"
          className="text-xs font-bold uppercase tracking-wider text-navy"
        >
          Telefon Numarası
        </label>
        <input
          id="phone"
          name="phone"
          type="tel"
          autoComplete="tel"
          maxLength={20}
          defaultValue={initialValues.phone ?? ''}
          placeholder="0532 000 00 00"
          className="border border-border bg-surface px-4 py-3 text-ink placeholder:text-ink-muted focus-visible:outline-2 focus-visible:outline-navy"
        />
        <span className="text-xs text-ink-muted">Boş bırakılırsa mevcut numara kaldırılır</span>
      </div>

      <div className="pt-2 border-t border-border">
        <label
          htmlFor="consent_marketing"
          className="flex items-start gap-3 cursor-pointer text-xs text-ink-secondary leading-5"
        >
          <input
            id="consent_marketing"
            name="consent_marketing"
            type="checkbox"
            value="true"
            defaultChecked={initialValues.consent_marketing}
            className="w-4 h-4 mt-0.5 cursor-pointer flex-shrink-0 border border-border"
          />
          <span>
            Kampanya ve duyurulardan haberdar olmak istiyorum. (İsteğe bağlı)
          </span>
        </label>
      </div>

      <div className="border border-border bg-surface-container-lowest p-4">
        <p className="text-xs text-ink-muted leading-5">
          E-posta adresiniz ve hesap türünüz buradan değiştirilemez. Değişiklik için{' '}
          <a href="mailto:hello@insaatborsam.com" className="text-navy underline">
            hello@insaatborsam.com
          </a>{' '}
          adresine yazın.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          type="submit"
          disabled={pending}
          className="bg-brand text-navy font-bold text-sm uppercase tracking-wider px-6 py-3 min-h-11 flex items-center justify-center hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {pending ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
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
