"use client";

import { useActionState } from "react";
import { submitSellerApplication } from "./actions";

const sehirler = ["İstanbul", "Ankara", "İzmir", "Bursa", "Kocaeli", "Diğer"];
const kategoriler = ["Seramik & Vitrifiye", "Yapı Kimyasalları", "Elektrik Malzemesi"];
const planlar = [
  { value: "baslangic", label: "Başlangıç — €99/ay" },
  { value: "pro", label: "Pro — €199/ay (Önerilen)" },
  { value: "enterprise", label: "Enterprise — €599/ay" },
];

const inputClass =
  "w-full border border-border bg-surface-container-lowest px-4 py-3 text-sm text-ink placeholder:text-ink-muted focus:outline-2 focus:outline-navy focus:border-border-strong";

const labelClass = "block text-xs font-bold uppercase tracking-wider text-navy mb-2";

export function SellerForm() {
  const [state, formAction, isPending] = useActionState(submitSellerApplication, null);

  return (
    <form action={formAction} className="flex flex-col gap-6">
      {state?.error && (
        <div className="border border-state-error bg-surface-container-lowest px-4 py-3">
          <p className="text-sm text-state-error font-medium">{state.error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="firma-adi" className={labelClass}>
            Firma Adı <span className="text-state-error">*</span>
          </label>
          <input
            id="firma-adi"
            name="firma-adi"
            type="text"
            required
            autoComplete="organization"
            placeholder="İnşaat Malzeme Ltd. Şti."
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="ad-soyad" className={labelClass}>
            Ad Soyad <span className="text-state-error">*</span>
          </label>
          <input
            id="ad-soyad"
            name="ad-soyad"
            type="text"
            required
            autoComplete="name"
            placeholder="Ahmet Yılmaz"
            className={inputClass}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="telefon" className={labelClass}>
            Telefon <span className="text-state-error">*</span>
          </label>
          <input
            id="telefon"
            name="telefon"
            type="tel"
            required
            autoComplete="tel"
            placeholder="05XX XXX XX XX"
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
        <label htmlFor="sehir" className={labelClass}>
          Şehir <span className="text-state-error">*</span>
        </label>
        <select id="sehir" name="sehir" required className={inputClass}>
          <option value="">Şehir seçin</option>
          {sehirler.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      <div>
        <fieldset>
          <legend className={labelClass}>
            Hizmet Verdiğiniz Kategoriler
          </legend>
          <div className="flex flex-col gap-3 mt-1">
            {kategoriler.map((kat) => (
              <label key={kat} className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="kategoriler"
                  value={kat}
                  className="w-4 h-4 border border-border accent-navy"
                />
                <span className="text-sm text-ink">{kat}</span>
              </label>
            ))}
          </div>
        </fieldset>
      </div>

      <div>
        <fieldset>
          <legend className={labelClass}>
            Plan Tercihi <span className="text-state-error">*</span>
          </legend>
          <div className="flex flex-col gap-3 mt-1">
            {planlar.map((plan) => (
              <label key={plan.value} className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="plan"
                  value={plan.value}
                  required
                  className="w-4 h-4 border border-border accent-navy"
                />
                <span className="text-sm text-ink">{plan.label}</span>
              </label>
            ))}
          </div>
        </fieldset>
      </div>

      <div className="border-t border-border pt-6">
        <p className="text-xs text-ink-muted mb-4">
          Formu göndererek{" "}
          <a href="/yasal/kvkk" className="underline hover:text-ink">
            KVKK Aydınlatma Metni
          </a>
          &apos;ni ve{" "}
          <a href="/yasal/kullanim-kosullari" className="underline hover:text-ink">
            Kullanım Koşulları
          </a>
          &apos;nı okuduğunuzu ve kabul ettiğinizi beyan edersiniz.
        </p>

        <button
          type="submit"
          disabled={isPending}
          className="bg-brand text-navy font-bold text-sm uppercase tracking-wider px-8 py-4 min-h-11 hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending ? "Gönderiliyor..." : "Başvuruyu Gönder →"}
        </button>
      </div>
    </form>
  );
}
