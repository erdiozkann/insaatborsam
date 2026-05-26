'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { loginAction, type LoginState } from './actions'

const initialState: LoginState = { phase: 'phone' }

type Props = {
  redirectTo?: string
}

export function GirisForm({ redirectTo = '/profil' }: Props) {
  const [state, formAction, pending] = useActionState(loginAction, initialState)

  if (state.phase === 'otp') {
    return (
      <form action={formAction} className="flex flex-col gap-5">
        <input type="hidden" name="step" value="otp" />
        <input type="hidden" name="phone" value={state.phone} />
        <input type="hidden" name="redirect_to" value={redirectTo} />

        <div className="border border-border bg-surface-container-lowest p-4">
          <p className="text-sm text-ink-secondary leading-6">
            <span className="font-bold text-ink">{state.phone}</span> numarasına SMS gönderdik.
            Gelen 6 haneli kodu girin.
          </p>
        </div>

        {state.error && (
          <div
            role="alert"
            className="border border-state-error bg-surface-container p-4"
          >
            <p className="text-sm text-state-error">{state.error}</p>
          </div>
        )}

        <div className="flex flex-col gap-1">
          <label
            htmlFor="token"
            className="text-xs font-bold uppercase tracking-wider text-navy"
          >
            SMS Kodu
          </label>
          <input
            id="token"
            name="token"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            placeholder="000000"
            required
            autoFocus
            className="border border-border bg-surface px-4 py-3 text-ink text-lg tabular-nums placeholder:text-ink-muted focus-visible:outline-2 focus-visible:outline-navy tracking-[0.5em] w-full"
          />
        </div>

        <button
          type="submit"
          disabled={pending}
          className="bg-brand text-navy font-bold text-sm uppercase tracking-wider px-6 py-3 min-h-11 w-full flex items-center justify-center hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {pending ? 'Doğrulanıyor...' : 'Kodu Doğrula'}
        </button>

        <button
          type="button"
          onClick={() => (window.location.href = '/giris')}
          className="text-sm text-ink-secondary hover:text-ink underline text-center"
        >
          Farklı numara kullan
        </button>
      </form>
    )
  }

  // phase === 'phone'
  return (
    <form action={formAction} className="flex flex-col gap-5">
      <input type="hidden" name="step" value="phone" />
      <input type="hidden" name="redirect_to" value={redirectTo} />

      {state.error && (
        <div
          role="alert"
          className="border border-state-error bg-surface-container p-4"
        >
          <p className="text-sm text-state-error">{state.error}</p>
        </div>
      )}

      <div className="flex flex-col gap-1">
        <label
          htmlFor="phone"
          className="text-xs font-bold uppercase tracking-wider text-navy"
        >
          Telefon Numarası <span className="text-state-error">*</span>
        </label>
        <input
          id="phone"
          name="phone"
          type="tel"
          autoComplete="tel"
          placeholder="0532 000 00 00"
          required
          className="border border-border bg-surface px-4 py-3 text-ink placeholder:text-ink-muted focus-visible:outline-2 focus-visible:outline-navy"
        />
        <span className="text-xs text-ink-muted">Türkiye hatlı numara</span>
      </div>

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
          placeholder="Ahmet Yılmaz"
          required
          className="border border-border bg-surface px-4 py-3 text-ink placeholder:text-ink-muted focus-visible:outline-2 focus-visible:outline-navy"
        />
        <span className="text-xs text-ink-muted">Yeni hesap için gereklidir</span>
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="text-xs font-bold uppercase tracking-wider text-navy mb-1">
          Hesap Türü <span className="text-state-error">*</span>
        </legend>
        <label className="flex items-center gap-3 cursor-pointer text-sm text-ink-secondary">
          <input
            type="radio"
            name="role"
            value="buyer"
            defaultChecked
            className="w-4 h-4 cursor-pointer border border-border"
          />
          Alıcı (Müteahhit / Usta)
        </label>
        <label className="flex items-center gap-3 cursor-pointer text-sm text-ink-secondary">
          <input
            type="radio"
            name="role"
            value="seller"
            className="w-4 h-4 cursor-pointer border border-border"
          />
          Satıcı (Bayi / Mağaza)
        </label>
      </fieldset>

      <div className="flex flex-col gap-3 pt-2 border-t border-border">
        <label
          htmlFor="consent_kvkk"
          className="flex items-start gap-3 cursor-pointer text-xs text-ink-secondary leading-5"
        >
          <input
            id="consent_kvkk"
            name="consent_kvkk"
            type="checkbox"
            value="true"
            required
            className="w-4 h-4 mt-0.5 cursor-pointer flex-shrink-0 border border-border"
          />
          <span>
            <Link
              href="/yasal/kvkk"
              target="_blank"
              rel="noopener noreferrer"
              className="text-navy underline"
            >
              KVKK Aydınlatma Metni
            </Link>
            &apos;ni okudum ve kişisel verilerimin işlenmesine onay veriyorum.{' '}
            <span className="text-state-error">*</span>
          </span>
        </label>

        <label
          htmlFor="consent_marketing"
          className="flex items-start gap-3 cursor-pointer text-xs text-ink-secondary leading-5"
        >
          <input
            id="consent_marketing"
            name="consent_marketing"
            type="checkbox"
            value="true"
            className="w-4 h-4 mt-0.5 cursor-pointer flex-shrink-0 border border-border"
          />
          <span>Kampanya ve duyurulardan haberdar olmak istiyorum. (İsteğe bağlı)</span>
        </label>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="bg-brand text-navy font-bold text-sm uppercase tracking-wider px-6 py-3 min-h-11 w-full flex items-center justify-center hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {pending ? 'SMS Gönderiliyor...' : 'SMS Kodu Gönder'}
      </button>
    </form>
  )
}
