import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Kullanım Koşulları",
  description: "İnşaat Borsam platform kullanım koşulları ve hizmet şartları.",
  alternates: { canonical: "https://insaatborsam.com/yasal/kullanim-kosullari" },
};

const h2 = "text-[22px] font-bold text-ink mt-10 mb-4 leading-[30px]";
const p = "text-sm text-ink-secondary leading-7 mb-4";

export default function KullanimKosullariPage() {
  return (
    <article>
      <header className="mb-10">
        <span className="text-xs font-bold uppercase tracking-wider text-ink-muted block mb-3">
          Son güncelleme: Mayıs 2026
        </span>
        <h1 className="text-[32px] md:text-[40px] leading-[40px] md:leading-[48px] font-extrabold tracking-tight text-ink">
          Kullanım Koşulları
        </h1>
        <p className={p + " mt-4"}>
          İnşaat Borsam platformunu kullanarak aşağıdaki koşulları kabul etmiş sayılırsınız.
          Lütfen dikkatlice okuyun.
        </p>
      </header>

      <h2 className={h2}>1. Platform Kullanımı</h2>
      <p className={p}>
        Platform yalnızca ticari amaçlı inşaat malzemesi alım-satımı için kullanılabilir.
        Sahte bilgi, yanıltıcı içerik veya yasa dışı faaliyetler kesinlikle yasaktır.
      </p>

      <h2 className={h2}>2. Üyelik ve Hesap</h2>
      <p className={p}>
        Satıcı üyeliği yalnızca insaatborsam.com üzerinden satın alınır. Hesap güvenliğinizden
        siz sorumlusunuz. Şüpheli aktivite tespit edilirse hesap askıya alınabilir.
      </p>

      <h2 className={h2}>3. Komisyon ve Ödemeler</h2>
      <p className={p}>
        İşlem komisyonu, tamamlanan sipariş tutarından plan oranında düşülür. Teklif verme
        ücretsizdir. Komisyon iade koşulları sipariş iptali politikasında belirtilmektedir.
      </p>

      <h2 className={h2}>4. İçerik ve Ürünler</h2>
      <p className={p}>
        Satıcılar yüklediği ürün bilgilerinin doğruluğundan sorumludur. Yanıltıcı fiyat veya
        stok bilgisi hesap kapatma sebebidir. Yasadışı ürünler kesinlikle yasaktır.
      </p>

      <h2 className={h2}>5. Sorumluluk Sınırlaması</h2>
      <p className={p}>
        İnşaat Borsam bir aracı platformdur. Alıcı-satıcı anlaşmazlıklarında arabuluculuk
        sağlanır ancak doğrudan sorumluluk üstlenilmez. Platform kesintileri için tazminat
        ödenmez.
      </p>

      <h2 className={h2}>6. Fikri Mülkiyet</h2>
      <p className={p}>
        Platform yazılımı, logosu ve içerikleri İnşaat Borsam&apos;a aittir. İzinsiz kopyalama,
        çoğaltma veya ticari kullanım yasaktır.
      </p>

      <h2 className={h2}>7. Değişiklikler</h2>
      <p className={p}>
        Bu koşullar önceden bildirim yapılarak güncellenebilir. Güncellemeler yayına girdikten
        sonra platformu kullanmaya devam etmek koşulları kabul anlamına gelir.
      </p>

      <h2 className={h2}>8. Uygulanacak Hukuk</h2>
      <p className={p}>
        Bu sözleşme Türkiye Cumhuriyeti hukuku kapsamında yorumlanır. Uyuşmazlıklarda
        İstanbul Mahkemeleri yetkilidir.
      </p>
    </article>
  );
}
