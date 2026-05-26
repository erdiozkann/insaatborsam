import type { Metadata } from "next";
import Link from "next/link";
import { ContactForm } from "./ContactForm";

export const metadata: Metadata = {
  title: "İletişim",
  description:
    "İnşaat Borsam ile iletişime geçin. Satıcı başvurusu, teknik destek veya genel sorularınız için bize yazın.",
  openGraph: {
    title: "İletişim | İnşaat Borsam",
    url: "https://insaatborsam.com/iletisim",
  },
  alternates: { canonical: "https://insaatborsam.com/iletisim" },
};

type Props = {
  searchParams: Promise<{ gonderildi?: string }>;
};

export default async function IletisimPage({ searchParams }: Props) {
  const { gonderildi } = await searchParams;

  if (gonderildi === "1") {
    return (
      <section className="bg-surface min-h-[60vh] flex items-center">
        <div className="w-full max-w-container mx-auto px-5 md:px-12 py-20">
          <div className="max-w-lg border border-border bg-surface-container-lowest p-10">
            <div className="flex items-center gap-3 mb-6">
              <span className="h-4 w-4 bg-state-success flex-shrink-0" aria-hidden />
              <span className="text-xs font-bold uppercase tracking-wider text-navy">
                Mesaj Alındı
              </span>
            </div>
            <h1 className="text-[28px] font-bold text-ink mb-4 leading-[36px]">
              Mesajınız iletildi!
            </h1>
            <p className="text-sm text-ink-secondary leading-6 mb-8">
              Genellikle 24 saat içinde yanıt veriyoruz.
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
          <span className="text-xs font-bold uppercase tracking-wider text-brand-dark border border-brand-dark px-3 py-1 inline-block mb-6">
            İletişim
          </span>
          <h1 className="text-[36px] md:text-[48px] leading-[44px] md:leading-[56px] font-extrabold tracking-tight text-ink mb-4">
            Bize Ulaşın
          </h1>
          <p className="text-[18px] leading-7 text-ink-secondary max-w-xl">
            Satıcı başvurusu, teknik destek veya genel sorularınız için burada bize yazın.
          </p>
        </div>
      </section>

      <section className="bg-surface py-12 md:py-20">
        <div className="w-full max-w-container mx-auto px-5 md:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            <div className="lg:col-span-2">
              <ContactForm />
            </div>

            <aside className="flex flex-col gap-6">
              <div className="border border-border bg-surface-container-lowest p-6">
                <h2 className="text-xs font-bold uppercase tracking-wider text-navy mb-4">
                  E-posta
                </h2>
                <a
                  href="mailto:hello@insaatborsam.com"
                  className="text-sm text-navy underline font-medium"
                >
                  hello@insaatborsam.com
                </a>
                <p className="text-xs text-ink-muted mt-2">
                  Genellikle 24 saat içinde yanıtlıyoruz.
                </p>
              </div>

              <div className="border border-border bg-surface-container-lowest p-6">
                <h2 className="text-xs font-bold uppercase tracking-wider text-navy mb-4">
                  Satıcı Başvurusu
                </h2>
                <p className="text-sm text-ink-secondary mb-4">
                  Platformumuza satıcı olarak katılmak için özel başvuru formunu kullanın.
                </p>
                <Link
                  href="/satici-ol"
                  className="bg-brand text-navy font-bold text-xs uppercase tracking-wider px-4 py-2 inline-flex items-center hover:opacity-90 transition-opacity"
                >
                  Satıcı Başvurusu →
                </Link>
              </div>
            </aside>
          </div>
        </div>
      </section>
    </>
  );
}
