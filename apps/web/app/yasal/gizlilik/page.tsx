import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Gizlilik Politikası",
  description: "İnşaat Borsam gizlilik politikası. Kişisel verilerinizi nasıl topladığımız, kullandığımız ve koruduğumuz hakkında bilgi.",
  alternates: { canonical: "https://insaatborsam.com/yasal/gizlilik" },
};

const h2 = "text-[22px] font-bold text-ink mt-10 mb-4 leading-[30px]";
const p = "text-sm text-ink-secondary leading-7 mb-4";

export default function GizlilikPage() {
  return (
    <article>
      <header className="mb-10">
        <span className="text-xs font-bold uppercase tracking-wider text-ink-muted block mb-3">
          Son güncelleme: Mayıs 2026
        </span>
        <h1 className="text-[32px] md:text-[40px] leading-[40px] md:leading-[48px] font-extrabold tracking-tight text-ink">
          Gizlilik Politikası
        </h1>
        <p className={p + " mt-4"}>
          İnşaat Borsam olarak gizliliğinize saygı duyuyoruz. Bu politika, verilerinizi nasıl
          topladığımızı, kullandığımızı ve koruduğumuzu açıklamaktadır.
        </p>
      </header>

      <h2 className={h2}>1. Toplanan Veriler</h2>
      <p className={p}>
        Platform kullanımı sırasında ad, e-posta, telefon, adres ve ödeme bilgileri (son 4 hane)
        toplanır. Kart numaraları sistemimizde saklanmaz.
      </p>

      <h2 className={h2}>2. Çerezler (Cookies)</h2>
      <p className={p}>
        Oturum yönetimi ve analitik için zorunlu çerezler kullanılır. Pazarlama çerezleri için
        açık onay alınır. Çerezleri tarayıcı ayarlarınızdan yönetebilirsiniz.
      </p>

      <h2 className={h2}>3. Güvenlik</h2>
      <p className={p}>
        Veriler şifreli bağlantı (TLS 1.3) üzerinden iletilir. Veritabanı erişimi Row Level
        Security ile kısıtlanmıştır. Ödeme verileri Iyzico altyapısı üzerinden 3D Secure ile işlenir.
      </p>

      <h2 className={h2}>4. Üçüncü Taraflarla Paylaşım</h2>
      <p className={p}>
        Verileriniz; ödeme işlemcisi (Iyzico/Stripe), e-posta sağlayıcısı (Resend) ve hata takip
        servisi (Sentry) ile paylaşılır. Üçüncü taraf reklam ağlarına veri satılmaz.
      </p>

      <h2 className={h2}>5. Veri Silme</h2>
      <p className={p}>
        Hesabınızı kapatmanız durumunda profil veriniz 30 gün içinde silinir. Finansal kayıtlar
        yasal zorunluluk (TTK) gereği 10 yıl saklanır.
      </p>

      <h2 className={h2}>6. İletişim</h2>
      <p className={p}>
        Gizlilik ile ilgili sorularınız için:{" "}
        <a href="mailto:hello@insaatborsam.com" className="text-navy underline">
          hello@insaatborsam.com
        </a>
      </p>
    </article>
  );
}
