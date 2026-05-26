import type { Metadata } from "next";
import Link from "next/link";
import { SectionHeader } from "@/components/ui/SectionHeader";

export const metadata: Metadata = {
  title: "İnşaat Borsam — İnşaatın Dijital Borsası",
  description:
    "Türkiye inşaat sektörü için yapay zeka destekli dijital tedarik platformu. Teklif talebi gönderin, doğrulanmış satıcılardan teklifleri karşılaştırın, güvenle satın alın.",
  openGraph: {
    title: "İnşaat Borsam — İnşaatın Dijital Borsası",
    description:
      "Müteahhitler ve yapı malzemesi satıcıları için yapay zeka destekli dijital tedarik platformu.",
    url: "https://insaatborsam.com",
  },
  alternates: { canonical: "https://insaatborsam.com" },
};

const trustItems = [
  {
    label: "Doğrulanmış Satıcılar",
    desc: "Tüm satıcılar vergi levhası ile onaylandı",
  },
  {
    label: "3D Secure Ödeme",
    desc: "Iyzico altyapısı ile 3D Secure destekli güvenli ödeme",
  },
  {
    label: "KVKK Uyumlu",
    desc: "Kişisel veriler KVKK uyum prensipleri dikkate alınarak işlenir",
  },
];

const buyerFeatures = [
  "Birden fazla satıcıdan rekabetçi teklif al",
  "Güvenli ödeme ve dijital sipariş takibi",
  "AI destekli fiyat ve ürün karşılaştırma",
  "Ücretsiz başla",
];

const sellerFeatures = [
  "Dijital teklif talebi kutusuyla siparişleri yönet",
  "Günde 2 saat zamandan kazan",
  "Doğrulanmış alıcılarla çalış",
  "İlk 3 ay komisyonsuz",
];

const howItWorksSteps = [
  {
    step: "01",
    title: "Teklif Talebi Gönder",
    desc: "İhtiyacın olan malzemeyi platforma gir. AI otomatik kategorize eder.",
  },
  {
    step: "02",
    title: "Teklifleri Karşılaştır",
    desc: "Doğrulanmış satıcılardan gelen teklifleri yan yana gör. En iyi fiyatı seç.",
  },
  {
    step: "03",
    title: "Onayla ve Öde",
    desc: "3D Secure destekli güvenli ödeme altyapısı ile öde. Sipariş anında satıcıya iletilir.",
  },
];

const categories = [
  { name: "Seramik & Vitrifiye", desc: "Yer karosu, duvar karosu, vitrifiye ürünler" },
  { name: "Yapı Kimyasalları", desc: "Yapıştırıcı, derz, beton katkısı, yalıtım" },
  { name: "Elektrik Malzemesi", desc: "Kablo, pano, anahtar, priz, aydınlatma" },
];

const verificationItems = [
  "Vergi levhası kontrolü",
  "Ticaret sicil belgesi doğrulaması",
  "3D Secure ödeme güvencesi",
  "Sipariş bazlı komisyon — peşin ödeme yok",
];

const planTeasers = [
  {
    name: "Başlangıç",
    subtitle: "Küçük bayiler için",
    desc: "Sınırlı ürün ve teklif kotası, rekabetçi komisyon oranı",
    featured: false,
  },
  {
    name: "Pro",
    subtitle: "En Popüler",
    desc: "Genişletilmiş kota, WhatsApp API entegrasyonu ve ekip desteği",
    featured: true,
  },
  {
    name: "Enterprise",
    subtitle: "Büyük distribütörler için",
    desc: "Sınırsız ürün ve teklif, özel hesap yöneticisi desteği",
    featured: false,
  },
];

export default function HomePage() {
  return (
    <>
      {/* ── HERO ── */}
      <section className="bg-surface border-b border-border py-20 md:py-32">
        <div className="w-full max-w-container mx-auto px-5 md:px-12">
          <div className="inline-block bg-brand px-3 py-1 mb-6">
            <span className="text-xs font-bold uppercase tracking-wider text-navy">
              İlk 3 Ay Komisyonsuz
            </span>
          </div>

          <p className="text-xs font-bold uppercase tracking-wider text-ink-muted mb-3">
            Türkiye&apos;nin ilk yapay zeka destekli inşaat borsası
          </p>

          <h1 className="text-[44px] md:text-[64px] leading-[52px] md:leading-[72px] font-extrabold tracking-tight text-ink mb-6 max-w-3xl">
            İnşaatın
            <br />
            Dijital Borsası
          </h1>

          <p className="text-[18px] leading-7 text-ink-secondary mb-10 max-w-xl">
            Teklif talebi (RFQ) gönder, doğrulanmış satıcılardan gelen teklifleri
            karşılaştır. Dijital sipariş, güvenli ödeme, gerçek zamanlı takip.
          </p>

          <div className="flex flex-col sm:flex-row items-start gap-4 mb-16">
            <Link
              href="/satici-ol"
              className="bg-brand text-navy font-bold text-sm uppercase tracking-wider px-6 py-3 min-h-11 flex items-center hover:opacity-90 transition-opacity"
            >
              Erken Erişim Talep Et →
            </Link>
            <Link
              href="/satici-ol"
              className="border border-border-strong text-navy font-bold text-sm uppercase tracking-wider px-6 py-3 min-h-11 flex items-center hover:opacity-90 transition-opacity"
            >
              Satıcı Başvurusu Yap
            </Link>
          </div>

          <div className="flex flex-wrap gap-x-10 gap-y-4">
            {[
              { value: "3", label: "Aktif Kategori" },
              { value: "30 dk", label: "Ortalama Teklif Süresi" },
            ].map((stat) => (
              <div key={stat.label} className="flex items-center gap-3">
                <span className="text-2xl font-bold text-ink tabular-nums">
                  {stat.value}
                </span>
                <span className="text-sm text-ink-muted">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TRUST BAR ── */}
      <section className="bg-surface-container border-b border-border py-6">
        <div className="w-full max-w-container mx-auto px-5 md:px-12">
          <div className="flex flex-col md:flex-row md:justify-between gap-5 md:gap-0">
            {trustItems.map((item) => (
              <div key={item.label} className="flex items-start md:items-center gap-3">
                <span className="h-2 w-2 mt-1 md:mt-0 bg-state-success flex-shrink-0" aria-hidden />
                <div>
                  <span className="text-sm font-bold text-navy block">{item.label}</span>
                  <span className="text-xs text-ink-muted">{item.desc}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── DEĞer ÖNERİLERİ ── */}
      <section className="bg-surface py-16 md:py-24">
        <div className="w-full max-w-container mx-auto px-5 md:px-12">
          <SectionHeader
            label="Kim İçin?"
            title="Herkes İçin Ayrı Çözüm"
            description="İnşaat tedarik zincirindeki her aktör için özelleştirilmiş araçlar."
            align="center"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12">
            <div className="border border-border bg-surface-container-lowest p-8 flex flex-col">
              <h3 className="text-xs font-bold uppercase tracking-wider text-ink-muted mb-3">
                Alıcılar İçin
              </h3>
              <p className="text-[20px] font-bold text-ink mb-6 leading-7">
                Müteahhit, usta, mühendis — doğru fiyatı bul.
              </p>
              <ul className="flex flex-col gap-3 mb-8 flex-1">
                {buyerFeatures.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm text-ink-secondary">
                    <span className="text-state-success font-bold flex-shrink-0 mt-0.5">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                href="/satici-ol"
                className="border border-border-strong text-navy font-bold text-sm uppercase tracking-wider px-5 py-3 min-h-11 flex items-center hover:opacity-90 transition-opacity self-start"
              >
                Erken Erişim Talep Et →
              </Link>
            </div>

            <div className="border-2 border-brand-dark bg-surface-container-lowest p-8 flex flex-col">
              <h3 className="text-xs font-bold uppercase tracking-wider text-ink-muted mb-3">
                Satıcılar İçin
              </h3>
              <p className="text-[20px] font-bold text-ink mb-6 leading-7">
                Nalbur, bayi, distribütör — WhatsApp kaosu bitti.
              </p>
              <ul className="flex flex-col gap-3 mb-8 flex-1">
                {sellerFeatures.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm text-ink-secondary">
                    <span className="text-state-success font-bold flex-shrink-0 mt-0.5">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                href="/satici-ol"
                className="bg-brand text-navy font-bold text-sm uppercase tracking-wider px-5 py-3 min-h-11 flex items-center hover:opacity-90 transition-opacity self-start"
              >
                Satıcı Ol →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── NASIL ÇALIŞIR TEASER ── */}
      <section className="bg-surface-container border-t border-b border-border py-16 md:py-24">
        <div className="w-full max-w-container mx-auto px-5 md:px-12">
          <SectionHeader
            label="Nasıl Çalışır?"
            title="3 Adımda Başla"
            description="Alıcı veya satıcı olarak dakikalar içinde tedarik sürecini dijitalleştir."
            align="center"
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
            {howItWorksSteps.map((s) => (
              <div key={s.step} className="border border-border bg-surface-container-lowest p-6">
                <span className="text-[48px] font-extrabold text-border tabular-nums leading-none block mb-4">
                  {s.step}
                </span>
                <h3 className="text-[18px] font-bold text-ink mb-2">{s.title}</h3>
                <p className="text-sm text-ink-secondary leading-6">{s.desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 text-center">
            <Link
              href="/nasil-calisir"
              className="text-sm font-bold text-navy uppercase tracking-wider hover:underline"
            >
              Detaylı Anlatım →
            </Link>
          </div>
        </div>
      </section>

      {/* ── KATEGORİLER ── */}
      <section className="bg-surface py-16 md:py-20">
        <div className="w-full max-w-container mx-auto px-5 md:px-12">
          <SectionHeader
            label="Kategoriler"
            title="Aktif Kategoriler"
            description="İstanbul'da aktif satıcılar. Her ay yeni kategoriler ekleniyor."
            align="center"
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
            {categories.map((cat) => (
              <div
                key={cat.name}
                className="border border-border bg-surface-container-lowest p-6 flex flex-col gap-2"
              >
                <span className="h-0.5 w-8 bg-brand" aria-hidden />
                <h3 className="text-[16px] font-bold text-ink mt-2">{cat.name}</h3>
                <p className="text-sm text-ink-secondary">{cat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── GÜVEN / DOĞRULANMIŞ SATICI ── */}
      <section className="bg-surface-container border-t border-b border-border py-16">
        <div className="w-full max-w-container mx-auto px-5 md:px-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-brand-dark border border-brand-dark px-3 py-1 inline-block mb-4">
                Güvenlik
              </span>
              <h2 className="text-[28px] md:text-[32px] leading-[36px] md:leading-[40px] font-bold text-ink mb-6">
                Tüm satıcılar doğrulanmış
              </h2>
              <ul className="flex flex-col gap-4">
                {verificationItems.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm text-ink-secondary">
                    <span className="text-state-success font-bold flex-shrink-0 mt-0.5">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="border border-border bg-surface-container-lowest p-8">
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <span className="h-3 w-3 bg-state-success flex-shrink-0" aria-hidden />
                  <span className="text-sm font-bold text-navy">3D Secure Destekli Güvenli Ödeme</span>
                </div>
                <p className="text-sm text-ink-secondary leading-6">
                  Tüm ödemeler Iyzico altyapısı üzerinden 3D Secure ile işlenir.
                  Kart bilgilerin hiçbir zaman sistemlerimizde saklanmaz.
                </p>
                <div className="border-t border-border pt-4">
                  <div className="flex items-center gap-3">
                    <span className="h-3 w-3 bg-state-success flex-shrink-0" aria-hidden />
                    <span className="text-sm font-bold text-navy">KVKK Uyumlu Veri İşleme</span>
                  </div>
                  <p className="text-sm text-ink-secondary leading-6 mt-2">
                    Kişisel veriler KVKK uyum prensipleri dikkate alınarak işlenir.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FİYAT TEASER ── */}
      <section className="bg-surface py-16 md:py-24">
        <div className="w-full max-w-container mx-auto px-5 md:px-12">
          <SectionHeader
            label="Fiyatlandırma"
            title="Satıcı Üyelik Planları"
            description="Tüm planlar insaatborsam.com üzerinden satın alınır. Mobil uygulamada ödeme yapılmaz."
            align="center"
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
            {planTeasers.map((plan) => (
              <div
                key={plan.name}
                className={`flex flex-col gap-3 p-6 bg-surface-container-lowest ${
                  plan.featured ? "border-2 border-brand-dark" : "border border-border"
                }`}
              >
                {plan.featured && (
                  <span className="text-[10px] font-bold uppercase tracking-wider text-brand-dark">
                    {plan.subtitle}
                  </span>
                )}
                <h3 className="text-[20px] font-bold text-ink">{plan.name}</h3>
                {!plan.featured && (
                  <p className="text-xs font-bold uppercase tracking-wider text-ink-muted">
                    {plan.subtitle}
                  </p>
                )}
                <p className="text-sm text-ink-secondary leading-6 flex-1">{plan.desc}</p>
                <Link
                  href="/fiyatlar"
                  className="text-sm font-bold text-navy uppercase tracking-wider hover:underline mt-2 self-start"
                >
                  Detayları Gör →
                </Link>
              </div>
            ))}
          </div>

          <div className="mt-8 text-center">
            <Link
              href="/fiyatlar"
              className="text-sm font-bold text-navy uppercase tracking-wider hover:underline"
            >
              Tüm Planları ve Alıcı Planlarını Gör →
            </Link>
          </div>
        </div>
      </section>

      {/* ── SON CTA ── */}
      <section className="bg-navy py-16 md:py-20">
        <div className="w-full max-w-container mx-auto px-5 md:px-12 text-center">
          <div className="inline-block bg-brand px-3 py-1 mb-6">
            <span className="text-xs font-bold uppercase tracking-wider text-navy">
              İlk 3 Ay Komisyonsuz
            </span>
          </div>
          <h2 className="text-[28px] md:text-[36px] leading-[36px] md:leading-[44px] font-bold text-white mb-4 max-w-2xl mx-auto">
            İlk 3 ay komisyonsuz satış fırsatını kaçırma
          </h2>
          <p className="text-white/70 mb-10 max-w-lg mx-auto leading-7">
            Doğrulanmış alıcılarla direkt bağlantı kur. WhatsApp&apos;tan teklif
            yönetimi bitti. Dijital sipariş akışına geç.
          </p>
          <Link
            href="/satici-ol"
            className="bg-brand text-navy font-bold text-sm uppercase tracking-wider px-8 py-4 inline-flex items-center hover:opacity-90 transition-opacity"
          >
            Hemen Başvur →
          </Link>
        </div>
      </section>
    </>
  );
}
