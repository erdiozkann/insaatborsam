import type { Metadata } from "next";
import Link from "next/link";
import { SectionHeader } from "@/components/ui/SectionHeader";

export const metadata: Metadata = {
  title: "Nasıl Çalışır",
  description:
    "İnşaat Borsam nasıl çalışır? Alıcılar RFQ göndererek, satıcılar başvurarak 3 adımda dijital tedarik sürecine geçer.",
  openGraph: {
    title: "Nasıl Çalışır | İnşaat Borsam",
    url: "https://insaatborsam.com/nasil-calisir",
  },
  alternates: { canonical: "https://insaatborsam.com/nasil-calisir" },
};

const buyerSteps = [
  {
    step: "01",
    title: "Uygulamayı İndir",
    desc: "Buyer App'i App Store veya Google Play'den ücretsiz indir. SMS ile 30 saniyede hesap aç.",
    tag: "Yakında",
  },
  {
    step: "02",
    title: "Ücretsiz Kayıt (SMS OTP)",
    desc: "Telefon numaranla kaydol. Kredi kartı veya ödeme gerekmez. Ücretsiz plan tüm temel özellikleri içerir.",
  },
  {
    step: "03",
    title: "Ürün Ara veya RFQ Gönder",
    desc: "Arama çubuğuyla ürün bul veya RFQ formuyla ihtiyacını gir. AI otomatik kategorize eder, doğru satıcılara iletir.",
  },
  {
    step: "04",
    title: "Teklifleri Karşılaştır",
    desc: "Doğrulanmış satıcılardan gelen teklifleri yan yana gör. Fiyat, termin ve satıcı puanını karşılaştır.",
  },
  {
    step: "05",
    title: "Onayla ve Öde",
    desc: "Iyzico ile güvenli ödeme. 3D Secure zorunlu. Sipariş anında satıcıya iletilir, fatura otomatik oluşur.",
  },
  {
    step: "06",
    title: "Teslimatı Takip Et",
    desc: "Siparişin anlık durumunu uygulama üzerinden takip et. Teslimatta onayla, sorun varsa destek açıklığı oluştur.",
  },
];

const sellerSteps = [
  {
    step: "01",
    title: "insaatborsam.com'dan Başvur",
    desc: "Satıcı başvuru formunu doldur. Firma adı, iletişim ve hizmet verdiğin kategorileri gir.",
  },
  {
    step: "02",
    title: "Vergi Levhası Yükle",
    desc: "Vergi levhası ve ticaret sicil belgesini yükle. Ekibimiz 24 saat içinde doğrulama yapar.",
  },
  {
    step: "03",
    title: "Plan Seç ve Öde",
    desc: "Başlangıç (€99/ay), Pro (€199/ay) veya Enterprise (€599/ay) planını seç. Ödeme sadece web üzerinden.",
  },
  {
    step: "04",
    title: "Ürün Kataloğunu Ekle",
    desc: "Ürünlerini ekle. AI otomatik kategorize eder, başlık ve açıklamayı optimize eder.",
  },
  {
    step: "05",
    title: "RFQ Gelen Kutusundan Teklif Ver",
    desc: "Sana gelen RFQ'leri gör, tek tuşla teklif gönder. Kabul edilirse sipariş otomatik açılır.",
  },
];

const advantages = [
  {
    title: "AI Destekli Eşleştirme",
    desc: "Alıcının RFQ'su otomatik analiz edilir. Doğru kategorideki, stoku olan satıcılara otomatik iletilir.",
  },
  {
    title: "Güvenli Ödeme",
    desc: "BDDK onaylı Iyzico altyapısı. 3D Secure zorunlu. Kart bilgileri sistemimizde saklanmaz.",
  },
  {
    title: "Gerçek Zamanlı Takip",
    desc: "Sipariş onayından teslimatına kadar her adım anlık güncellenir. SMS + uygulama bildirimleri.",
  },
];

export default function NasilCalisirPage() {
  return (
    <>
      <section className="bg-surface border-b border-border py-16 md:py-20">
        <div className="w-full max-w-container mx-auto px-5 md:px-12">
          <SectionHeader
            label="Platform"
            title="Nasıl Çalışır?"
            description="İnşaat tedarikini dijitalleştiren platform — alıcılar ve satıcılar için ayrı, entegre akışlar."
            align="left"
          />
        </div>
      </section>

      {/* Alıcılar */}
      <section className="bg-surface py-16 md:py-24">
        <div className="w-full max-w-container mx-auto px-5 md:px-12">
          <div className="flex items-center gap-3 mb-10">
            <span className="h-0.5 w-8 bg-brand" aria-hidden />
            <h2 className="text-xs font-bold uppercase tracking-wider text-navy">Alıcılar İçin</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {buyerSteps.map((s) => (
              <div key={s.step} className="border border-border bg-surface-container-lowest p-6">
                <div className="flex items-start justify-between mb-4">
                  <span className="text-[40px] font-extrabold text-border tabular-nums leading-none">
                    {s.step}
                  </span>
                  {s.tag && (
                    <span className="bg-brand text-navy text-[10px] font-bold uppercase px-2 py-0.5">
                      {s.tag}
                    </span>
                  )}
                </div>
                <h3 className="text-[16px] font-bold text-ink mb-2">{s.title}</h3>
                <p className="text-sm text-ink-secondary leading-6">{s.desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-8">
            <div
              aria-label="Uygulama yakında"
              className="border border-border text-ink-muted font-bold text-sm uppercase tracking-wider px-5 py-3 min-h-11 inline-flex items-center gap-2 select-none cursor-default"
            >
              Uygulamayı İndir
              <span className="bg-brand text-navy text-[10px] font-bold uppercase px-1.5 py-0.5">
                Yakında
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Satıcılar */}
      <section className="bg-surface-container border-t border-b border-border py-16 md:py-24">
        <div className="w-full max-w-container mx-auto px-5 md:px-12">
          <div className="flex items-center gap-3 mb-10">
            <span className="h-0.5 w-8 bg-brand" aria-hidden />
            <h2 className="text-xs font-bold uppercase tracking-wider text-navy">Satıcılar İçin</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sellerSteps.map((s) => (
              <div key={s.step} className="border border-border bg-surface-container-lowest p-6">
                <span className="text-[40px] font-extrabold text-border tabular-nums leading-none block mb-4">
                  {s.step}
                </span>
                <h3 className="text-[16px] font-bold text-ink mb-2">{s.title}</h3>
                <p className="text-sm text-ink-secondary leading-6">{s.desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-8">
            <Link
              href="/satici-ol"
              className="bg-brand text-navy font-bold text-sm uppercase tracking-wider px-6 py-3 min-h-11 inline-flex items-center hover:opacity-90 transition-opacity"
            >
              Satıcı Başvurusu Yap →
            </Link>
          </div>
        </div>
      </section>

      {/* Platform avantajları */}
      <section className="bg-surface py-16 md:py-24">
        <div className="w-full max-w-container mx-auto px-5 md:px-12">
          <SectionHeader
            label="Neden İnşaat Borsam?"
            title="Platform Avantajları"
            align="center"
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
            {advantages.map((a) => (
              <div key={a.title} className="border border-border bg-surface-container-lowest p-6">
                <span className="h-0.5 w-8 bg-brand block mb-4" aria-hidden />
                <h3 className="text-[16px] font-bold text-ink mb-3">{a.title}</h3>
                <p className="text-sm text-ink-secondary leading-6">{a.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-navy py-16">
        <div className="w-full max-w-container mx-auto px-5 md:px-12 text-center">
          <h2 className="text-[28px] font-bold text-white mb-4">
            Hemen başla — ilk 3 ay komisyonsuz
          </h2>
          <Link
            href="/satici-ol"
            className="bg-brand text-navy font-bold text-sm uppercase tracking-wider px-8 py-4 inline-flex items-center hover:opacity-90 transition-opacity"
          >
            Satıcı Başvurusu →
          </Link>
        </div>
      </section>
    </>
  );
}
