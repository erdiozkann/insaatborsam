"use client";

import { useActionState } from "react";
import { submitContactForm } from "./actions";

const inputClass =
  "w-full border border-border bg-surface-container-lowest px-4 py-3 text-sm text-ink placeholder:text-ink-muted focus:outline-2 focus:outline-navy focus:border-border-strong";

const labelClass = "block text-xs font-bold uppercase tracking-wider text-navy mb-2";

export function ContactForm() {
  const [state, formAction, isPending] = useActionState(submitContactForm, null);

  return (
    <form action={formAction} className="flex flex-col gap-6">
      {state?.error && (
        <div className="border border-state-error bg-surface-container-lowest px-4 py-3">
          <p className="text-sm text-state-error font-medium">{state.error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="ad" className={labelClass}>
            Adınız <span className="text-state-error">*</span>
          </label>
          <input
            id="ad"
            name="ad"
            type="text"
            required
            autoComplete="name"
            placeholder="Ahmet Yılmaz"
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="eposta" className={labelClass}>
            E-posta <span className="text-state-error">*</span>
          </label>
          <input
            id="eposta"
            name="eposta"
            type="email"
            required
            autoComplete="email"
            placeholder="ahmet@firma.com"
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label htmlFor="konu" className={labelClass}>
          Konu <span className="text-state-error">*</span>
        </label>
        <input
          id="konu"
          name="konu"
          type="text"
          required
          placeholder="Konu başlığı"
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor="mesaj" className={labelClass}>
          Mesaj <span className="text-state-error">*</span>
        </label>
        <textarea
          id="mesaj"
          name="mesaj"
          required
          rows={5}
          placeholder="Mesajınızı buraya yazın..."
          className={inputClass}
        />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="bg-brand text-navy font-bold text-sm uppercase tracking-wider px-8 py-4 min-h-11 self-start hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isPending ? "Gönderiliyor..." : "Mesaj Gönder →"}
      </button>
    </form>
  );
}
