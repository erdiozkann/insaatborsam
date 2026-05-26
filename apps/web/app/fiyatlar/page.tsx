import type { Metadata } from "next";
import Link from "next/link";
import { PlanCard } from "@/components/ui/PlanCard";
import { SectionHeader } from "@/components/ui/SectionHeader";

export const metadata: Metadata = {
  title: "Fiyatlar & Üyelik",
  description:
    "İnşaat Borsam satıcı ve alıcı üyelik planları. Başlangıç €99/ay, Pro €199/ay, Enterprise €599/ay. Gizli maliyet yok.",
  openGraph: {
    title: "Fiyatlar & Üyelik | İnşaat Borsam",
    url: "https://insaatborsam.com/fiyatlar",
  },
  alternates: { canonical: "https://insaatborsam.com/fiyatlar" },
};

const sellerPlans = [
  {
    name: "Başlangıç",
    price: "€99",
    annualNote: "Yıllık ödemede: €948 (€79/ay)",
    features: [
      { text: "50 ürün", included: true },
      { text: "30 RFQ yanıtı/ay", included: true },
      { text: "%5 işlem komisyonu", included: true },
      { text: "1 ekip üyesi", included: true },
      { text: '"Doğrulanmış Satıcı" rozeti', included: true },
      { text: "WhatsApp API entegrasyonu", included: false },
      { text: "Hesap yöneticisi", included: false },
    ],
    ctaLabel: "Başvur",
    ctaHref: "/satici-ol",
  },
  {
    name: "Pro",
    price: "€199",
    annualNote: "Yıllık ödemede: €1,908 (€159/ay)",
    badge: "En Popüler",
    highlighted: true,
    features: [
      { text: "500 ürün", included: true },
      { text: "200 RFQ yanıtı/ay", included: true },
      { text: "%4 işlem komisyonu", included: true },
      { text: "3 ekip üyesi", included: true },
      { text: '"Pro Satıcı" rozeti', included: true },
      { text: "WhatsApp API entegrasyonu", included: true },
      { text: "Hesap yöneticisi", included: false },
    ],
    ctaLabel: "Başvur",
    ctaHref: "/satici-ol",
  },
  {
    name: "Enterprise",
    price: "€599",
    annualNote: "Yıllık ödemede: €5,748 (€479/ay)",
    features: [
      { text: "Sınırsız ürün", included: true },
      { text: "Sınırsız RFQ yanıtı", included: true },
      { text: "%3 işlem komisyonu", included: true },
      { text: "10 ekip üyesi", included: true },
      { text: '"Enterprise" rozeti + özel sayfa', included: true },
      { text: "WhatsApp API entegrasyonu", included: true },
      { text: "Dedike hesap yöneticisi", included: true },
    ],
    ctaLabel: "İletişime Geç",
    ctaHref: "/iletisim",
  },
];

const buyerPlans = [
  {
    name: "Ücretsiz",
    price: "€0",
    features: [
      { text: "20 ürün araması/gün", included: true },
      { text: "5 RFQ/ay", included: true },
      { text: "1 proje", included: true },
      { text: "7 günlük fiyat geçmişi", included: true },
      { text: "Sınırsız RFQ", included: false },
      { text: "90 günlük fiyat geçmişi", included: false },
    ],
    ctaLabel: "Uygulamayı İndir",
    ctaHref: "#uygulama",
    badge: "Yakında",
  },
  {
    name: "Pro",
    price: "€49",
    annualNote: "Yıllık ödemede: €468 (€39/ay)",
    highlighted: true,
    badge: "Önerilen",
    features: [
      { text: "Sınırsız ürün araması", included: true },
      { text: "50 RFQ/ay", included: true },
      { text: "5 proje", included: true },
      { text: "90 günlük fiyat geçmişi", included: true },
      { text: "Öncelikli destek", included: true },
      { text: "AI BOM Üreticisi (Faz 2)", included: false },
    ],
    ctaLabel: "Uygulamayı İndir",
    ctaHref: "#uygulama",
  },
  {
    name: "Business",
    price: "€99",
    annualNote: "Yıllık ödemede: €948 (€79/ay)",
    features: [
      { text: "Sınırsız ürün araması", included: true },
      { text: "Sınırsız RFQ", included: true },
      { text: "10 proje", included: true },
      { text: "Tam fiyat geçmişi", included: true },
      { text: "10 ekip üyesi", included: true },
      { text: "AI BOM Üreticisi (Faz 2)", included: true },
    ],
    ctaLabel: "Uygulamayı İndir",
    ctaHref: "#uygulama",
  },
];

const faq = [
  {
    q: "Komisyon nasıl işliyor?",
    a: "Komisyon sadece tamamlanan siparişlerden alınır. Sipariş tutarından plan komisyon oranı düşülür, kalan satıcının hesabına geçer. Teklif verme ve RFQ yanıtlama ücretsizdir.",
  },
  {
    q: "Yıllık ödeme mümkün mü?",
    a: "Evet. Yıllık ödeme seçeneği her planda mevcuttur. Yıllık ödemede yaklaşık 2 ay ücretsiz kullanım sağlanır.",
  },
  {
    q: "Kart bilgilerim güvende mi?",
    a: "Evet. Tüm ödemeler BDDK lisanslı Iyzico altyapısı üzerinden işlenir. Kart bilgileri hiçbir zaman sistemlerimizde saklanmaz.",
  },
  {
    q: "Üyelik nereden satın alınır?",
    a: "Üyelik sadece insaatborsam.com üzerinden satın alınır. Mobil uygulamalarda ödeme ekranı bulunmamaktadır.",
  },
];

type Props = {
  searchParams: Promise<{ tab?: string }>;
};

export default async function FiyatlarPage({ searchParams }: Props) {
  const { tab } = await searchParams;
  const activeTab = tab === "alici" ? "alici" : "satici";

  return (
    <>
      <section className="bg-surface border-b border-border py-16 md:py-20">
        <div className="w-full max-w-container mx-auto px-5 md:px-12">
          <SectionHeader
            label="Fiyatlandırma"
            title="Şeffaf Fiyatlar"
            description="Gizli maliyet yok. İhtiyacına göre plan seç, büyüdükçe yükselt."
            align="left"
          />

          <div className="mt-8 inline-flex gap-0 border border-border bg-surface-container">
            <Link
              href="/fiyatlar"
              className={`px-5 py-2.5 text-sm font-bold uppercase tracking-wider transition-colors ${
                activeTab === "satici"
                  ? "bg-navy text-white"
                  : "text-ink-secondary hover:text-ink"
              }`}
            >
              Satıcılar
            </Link>
            <Link
              href="/fiyatlar?tab=alici"
              className={`px-5 py-2.5 text-sm font-bold uppercase tracking-wider transition-colors ${
                activeTab === "alici"
                  ? "bg-navy text-white"
                  : "text-ink-secondary hover:text-ink"
              }`}
            >
              Alıcılar
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-surface py-16 md:py-24">
        <div className="w-full max-w-container mx-auto px-5 md:px-12">
          {activeTab === "satici" && (
            <>
              <p className="text-sm text-ink-muted mb-8 border border-border px-4 py-3 bg-surface-container-lowest">
                ⚠ Üyelik sadece insaatborsam.com üzerinden satın alınır. Mobil uygulamada ödeme ekranı bulunmamaktadır.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {sellerPlans.map((plan) => (
                  <PlanCard key={plan.name} {...plan} />
                ))}
              </div>
            </>
          )}

          {activeTab === "alici" && (
            <>
              <p className="text-sm text-ink-muted mb-8 border border-border px-4 py-3 bg-surface-container-lowest">
                Alıcı uygulaması yakında App Store ve Google Play&apos;de yayına girecek.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {buyerPlans.map((plan) => (
                  <PlanCard key={plan.name} {...plan} />
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      <section className="bg-surface-container border-t border-border py-16 md:py-20">
        <div className="w-full max-w-container mx-auto px-5 md:px-12">
          <SectionHeader label="Sık Sorulan Sorular" title="Merak Ettikleriniz" align="left" />

          <div className="mt-10 flex flex-col divide-y divide-border">
            {faq.map((item) => (
              <div key={item.q} className="py-6">
                <h3 className="text-[16px] font-bold text-ink mb-3">{item.q}</h3>
                <p className="text-sm text-ink-secondary leading-6">{item.a}</p>
              </div>
            ))}
          </div>

          <div className="mt-10">
            <Link href="/iletisim" className="text-sm font-bold text-navy uppercase tracking-wider hover:underline">
              Başka sorunuz mu var? İletişime geçin →
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-navy py-16">
        <div className="w-full max-w-container mx-auto px-5 md:px-12 text-center">
          <h2 className="text-[28px] font-bold text-white mb-4">İlk 3 ay komisyonsuz başvur</h2>
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
