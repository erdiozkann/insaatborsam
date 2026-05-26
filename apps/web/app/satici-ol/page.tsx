import type { Metadata } from "next";
import Link from "next/link";
import { SellerForm } from "./SellerForm";

export const metadata: Metadata = {
  title: "Satıcı Ol",
  description:
    "İnşaat Borsam'a satıcı olarak katıl. Dijital teklif talebi kutusuyla siparişleri yönet, ilk 3 ay komisyonsuz sat.",
  openGraph: {
    title: "Satıcı Ol | İnşaat Borsam",
    url: "https://insaatborsam.com/satici-ol",
  },
  alternates: { canonical: "https://insaatborsam.com/satici-ol" },
};

type Props = {
  searchParams: Promise<{ basarili?: string }>;
};

export default async function SaticiOlPage({ searchParams }: Props) {
  const { basarili } = await searchParams;

  if (basarili === "1") {
    return (
      <section className="bg-surface min-h-[60vh] flex items-center">
        <div className="w-full max-w-container mx-auto px-5 md:px-12 py-20">
          <div className="max-w-lg border border-border bg-surface-container-lowest p-10">
            <div className="flex items-center gap-3 mb-6">
              <span className="h-4 w-4 bg-state-success flex-shrink-0" aria-hidden />
              <span className="text-xs font-bold uppercase tracking-wider text-navy">
                Başvuru Alındı
              </span>
            </div>
            <h1 className="text-[28px] font-bold text-ink mb-4 leading-[36px]">
              Başvurunuz alındı!
            </h1>
            <p className="text-sm text-ink-secondary leading-6 mb-8">
              24 saat içinde sizi arayacağız. Sorularınız için{" "}
              <a href="mailto:hello@insaatborsam.com" className="text-navy underline">
                hello@insaatborsam.com
              </a>{" "}
              adresine yazabilirsiniz.
            </p>
            <Link
              href="/"
              className="border border-border-strong text-navy font-bold text-sm uppercase tracking-wider px-5 py-3 inline-flex items-center hover:bg-surface-container transition-colors"
            >
              ← Ana Sayfaya Dön
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <>
      <section className="bg-surface border-b border-border py-16 md:py-20">
        <div className="w-full max-w-container mx-auto px-5 md:px-12">
          <div className="inline-block bg-brand px-3 py-1 mb-6">
            <span className="text-xs font-bold uppercase tracking-wider text-navy">
              İlk 3 Ay Komisyonsuz
            </span>
          </div>
          <h1 className="text-[36px] md:text-[48px] leading-[44px] md:leading-[56px] font-extrabold tracking-tight text-ink mb-4 max-w-2xl">
            Satıcı Başvurusu
          </h1>
          <p className="text-[18px] leading-7 text-ink-secondary max-w-xl">
            Formu doldurun, 24 saat içinde arayalım. Vergi levhası doğrulaması
            sonrası satışa başlayabilirsiniz.
          </p>
        </div>
      </section>

      <section className="bg-surface py-12 md:py-20">
        <div className="w-full max-w-container mx-auto px-5 md:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            <div className="lg:col-span-2">
              <SellerForm />
            </div>

            <aside className="flex flex-col gap-6">
              <div className="border border-border bg-surface-container-lowest p-6">
                <h2 className="text-xs font-bold uppercase tracking-wider text-navy mb-4">
                  Ne Kazanırsınız?
                </h2>
                <ul className="flex flex-col gap-3">
                  {[
                    "Doğrulanmış alıcılara erişim",
                    "Dijital RFQ inbox",
                    "Otomatik sipariş akışı",
                    "İlk 3 ay komisyonsuz",
                    "24 saat içinde aktivasyon",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-3 text-sm text-ink-secondary">
                      <span className="text-state-success font-bold flex-shrink-0 mt-0.5">✓</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="border border-border bg-surface-container-lowest p-6">
                <h2 className="text-xs font-bold uppercase tracking-wider text-navy mb-4">
                  Süreç Nasıl İşler?
                </h2>
                <ol className="flex flex-col gap-4">
                  {[
                    "Formu doldurun",
                    "24 saat içinde arayalım",
                    "Vergi levhası gönderin",
                    "Plan seçin & ödeyin",
                    "Satışa başlayın",
                  ].map((step, i) => (
                    <li key={step} className="flex items-start gap-3 text-sm text-ink-secondary">
                      <span className="text-xs font-bold text-brand-dark flex-shrink-0 mt-0.5 tabular-nums">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      {step}
                    </li>
                  ))}
                </ol>
              </div>

              <div className="border border-border bg-surface-container-lowest p-6">
                <p className="text-xs text-ink-muted leading-5">
                  Sorularınız için:{" "}
                  <a href="mailto:hello@insaatborsam.com" className="text-navy underline font-medium">
                    hello@insaatborsam.com
                  </a>
                </p>
              </div>
            </aside>
          </div>
        </div>
      </section>
    </>
  );
}
