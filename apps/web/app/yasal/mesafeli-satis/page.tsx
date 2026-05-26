import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mesafeli Satış Sözleşmesi",
  description: "İnşaat Borsam mesafeli satış sözleşmesi. Ürün alımlarınıza ilişkin cayma hakkı ve iade koşulları.",
  alternates: { canonical: "https://insaatborsam.com/yasal/mesafeli-satis" },
};

const h2 = "text-[22px] font-bold text-ink mt-10 mb-4 leading-[30px]";
const p = "text-sm text-ink-secondary leading-7 mb-4";

export default function MesafeliSatisPage() {
  return (
    <article>
      <header className="mb-10">
        <span className="text-xs font-bold uppercase tracking-wider text-ink-muted block mb-3">
          Son güncelleme: Mayıs 2026
        </span>
        <h1 className="text-[32px] md:text-[40px] leading-[40px] md:leading-[48px] font-extrabold tracking-tight text-ink">
          Mesafeli Satış Sözleşmesi
        </h1>
        <p className={p + " mt-4"}>
          6502 sayılı Tüketicinin Korunması Hakkında Kanun ve Mesafeli Sözleşmeler Yönetmeliği
          uyarınca hazırlanmıştır.
        </p>
      </header>

      <h2 className={h2}>1. Taraflar</h2>
      <p className={p}>
        <strong className="text-ink">SATICI:</strong> İnşaat Borsam — hello@insaatborsam.com
        <br />
        <strong className="text-ink">ALICI:</strong> Platform üzerinde sipariş veren kişi veya kurum.
      </p>
      <p className={p}>
        <strong className="text-ink">Not:</strong> Satış adresi bilgisi henüz tamamlanmamıştır.
        Bu alan hukuk danışmanı onayı sonrası güncellenecektir.
      </p>

      <h2 className={h2}>2. Sözleşmenin Konusu</h2>
      <p className={p}>
        Bu sözleşme, ALICI&apos;nın insaatborsam.com üzerinden sipariş ettiği fiziksel inşaat
        malzemelerinin satışına ilişkin koşulları düzenlemektedir.
      </p>

      <h2 className={h2}>3. Sipariş ve Ödeme</h2>
      <p className={p}>
        Siparişler onaylandıktan sonra SATICI&apos;ya (platfrom üzerindeki malzeme satıcısına)
        iletilir. Ödeme Iyzico altyapısı üzerinden 3D Secure ile gerçekleştirilir. Ödeme
        tamamlanmadan sipariş kesinleşmez.
      </p>

      <h2 className={h2}>4. Teslimat</h2>
      <p className={p}>
        Teslimat süresi ve koşulları her satıcı tarafından ayrı ayrı belirlenir. Teslimat bilgileri
        sipariş onay ekranında görüntülenir. Genel süre: 1–5 iş günü (İstanbul içi).
      </p>

      <h2 className={h2}>5. Cayma Hakkı</h2>
      <p className={p}>
        Tüketici sıfatındaki ALICI, malı teslim aldığı tarihten itibaren <strong className="text-ink">14 gün</strong>{" "}
        içinde herhangi bir gerekçe göstermeksizin cayma hakkını kullanabilir.
      </p>
      <p className={p}>
        <strong className="text-ink">İstisna:</strong> İnşaat malzemeleri B2B satışında tüketici
        mevzuatı uygulanmayabilir. Ticari alımlarda cayma hakkı sözleşme koşullarına bağlıdır.
      </p>

      <h2 className={h2}>6. İade Koşulları</h2>
      <p className={p}>
        Cayma hakkı kullanılması durumunda ürün kullanılmamış, orijinal ambalajında iade
        edilmelidir. İade kargo ücreti ALICI&apos;ya aittir (hatalı ürün hariç).
      </p>

      <h2 className={h2}>7. Şikayet ve Uyuşmazlık</h2>
      <p className={p}>
        Şikayetler için:{" "}
        <a href="mailto:hello@insaatborsam.com" className="text-navy underline">
          hello@insaatborsam.com
        </a>{" "}
        — Tüketici Hakem Heyeti başvurusu Türkiye&apos;deki yasal limitler çerçevesinde yapılabilir.
      </p>
    </article>
  );
}
