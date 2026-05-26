import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "KVKK Aydınlatma Metni",
  description: "İnşaat Borsam KVKK (Kişisel Verilerin Korunması Kanunu) kapsamında kişisel veri işleme aydınlatma metni.",
  alternates: { canonical: "https://insaatborsam.com/yasal/kvkk" },
};

const legalHeading = "text-[22px] font-bold text-ink mt-10 mb-4 leading-[30px]";
const legalSubheading = "text-[16px] font-bold text-ink mt-6 mb-2";
const legalParagraph = "text-sm text-ink-secondary leading-7 mb-4";

export default function KvkkPage() {
  return (
    <article>
      <header className="mb-10">
        <span className="text-xs font-bold uppercase tracking-wider text-ink-muted block mb-3">
          Son güncelleme: Mayıs 2026
        </span>
        <h1 className="text-[32px] md:text-[40px] leading-[40px] md:leading-[48px] font-extrabold tracking-tight text-ink">
          KVKK Aydınlatma Metni
        </h1>
        <p className={legalParagraph + " mt-4"}>
          Bu aydınlatma metni, 6698 sayılı Kişisel Verilerin Korunması Kanunu&apos;nun (KVKK) 10. maddesi
          uyarınca hazırlanmıştır.
        </p>
      </header>

      <section>
        <h2 className={legalHeading}>1. Veri Sorumlusu</h2>
        <p className={legalParagraph}>
          <strong className="text-ink">İnşaat Borsam</strong> — Veri sorumlusu sıfatıyla kişisel
          verilerinizi işlemektedir. İletişim: hello@insaatborsam.com
        </p>

        <h2 className={legalHeading}>2. İşlenen Kişisel Veriler</h2>
        <h3 className={legalSubheading}>Alıcılar</h3>
        <ul className="list-none flex flex-col gap-2 mb-4">
          {["Ad, soyad", "Telefon numarası (SMS OTP için)", "E-posta adresi", "Şantiye/teslimat adresi", "Sipariş geçmişi"].map((item) => (
            <li key={item} className="flex items-start gap-2 text-sm text-ink-secondary">
              <span className="text-ink-muted flex-shrink-0">—</span>
              {item}
            </li>
          ))}
        </ul>

        <h3 className={legalSubheading}>Satıcılar</h3>
        <ul className="list-none flex flex-col gap-2 mb-4">
          {["Ad, soyad, unvan", "Vergi numarası ve vergi levhası", "Ticaret sicil numarası", "IBAN bilgisi (ödeme için)", "Ürün kataloğu, fiyat listeleri"].map((item) => (
            <li key={item} className="flex items-start gap-2 text-sm text-ink-secondary">
              <span className="text-ink-muted flex-shrink-0">—</span>
              {item}
            </li>
          ))}
        </ul>

        <h2 className={legalHeading}>3. İşleme Amaçları</h2>
        <p className={legalParagraph}>
          Kişisel verileriniz; platform üyeliği ve kimlik doğrulama, sipariş ve ödeme işlemleri,
          müşteri desteği, yasal yükümlülüklerin yerine getirilmesi ve KVKK&apos;nın 5. maddesi
          kapsamında meşru menfaat amacıyla işlenmektedir.
        </p>

        <h2 className={legalHeading}>4. Saklama Süreleri</h2>
        <div className="border border-border divide-y divide-border mb-6">
          {[
            { kategori: "Profil & iletişim bilgileri", sure: "Hesap aktif olduğu sürece + 30 gün" },
            { kategori: "Sipariş & finansal kayıtlar", sure: "10 yıl (TTK zorunluluğu)" },
            { kategori: "KYC belgeleri (satıcı)", sure: "10 yıl (TTK)" },
            { kategori: "Mesajlaşma kayıtları", sure: "2 yıl" },
            { kategori: "Admin erişim logları", sure: "1 yıl" },
          ].map((row) => (
            <div key={row.kategori} className="grid grid-cols-2 px-4 py-3">
              <span className="text-sm text-ink">{row.kategori}</span>
              <span className="text-sm text-ink-secondary">{row.sure}</span>
            </div>
          ))}
        </div>

        <h2 className={legalHeading}>5. Veri Aktarımları</h2>
        <p className={legalParagraph}>
          Kişisel verileriniz aşağıdaki hizmet sağlayıcılara aktarılabilir:
        </p>
        <ul className="list-none flex flex-col gap-2 mb-6">
          {[
            "Supabase Inc. (veritabanı — AB-ABD Veri Gizliliği Çerçevesi kapsamında)",
            "Iyzico Ödeme Hizmetleri A.Ş. (ödeme — Türkiye)",
            "Resend Inc. (e-posta bildirimleri — ABD, SCCs kapsamında)",
            "Sentry (hata takibi — ABD, SCCs kapsamında)",
          ].map((item) => (
            <li key={item} className="flex items-start gap-2 text-sm text-ink-secondary">
              <span className="text-ink-muted flex-shrink-0">—</span>
              {item}
            </li>
          ))}
        </ul>

        <h2 className={legalHeading}>6. Veri Sahibi Hakları</h2>
        <p className={legalParagraph}>KVKK&apos;nın 11. maddesi uyarınca şu haklara sahipsiniz:</p>
        <ul className="list-none flex flex-col gap-2 mb-6">
          {[
            "Verilerinize erişim talep etme",
            "Hatalı verilerin düzeltilmesini isteme",
            "Verilerinizin silinmesini talep etme",
            "İşlemenin kısıtlanmasını isteme",
            "Veri taşınabilirliği (Faz 2)",
            "Otomatik karar almaya itiraz",
          ].map((item) => (
            <li key={item} className="flex items-start gap-2 text-sm text-ink-secondary">
              <span className="text-state-success font-bold flex-shrink-0">✓</span>
              {item}
            </li>
          ))}
        </ul>
        <p className={legalParagraph}>
          Haklarınızı kullanmak için:{" "}
          <a href="mailto:hello@insaatborsam.com" className="text-navy underline">
            hello@insaatborsam.com
          </a>
        </p>
      </section>
    </article>
  );
}
