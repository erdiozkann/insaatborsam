// apps/web/src/components/seller/SellerPendingScreen.tsx
// Doğrulanmamış (is_verified=false) satıcılara gösterilen "Doğrulama Bekleniyor" ekranı.
// Satıcı sayfalarında (panel, RFQ feed, teklifler) tutarlı kullanım için paylaşılır.
// Teklif verme / RFQ erişimi bu durumda açılmaz.

import Link from 'next/link'

type Props = {
  storeName: string
  /** Üst başlık etiketi — örn. "Satıcı Paneli", "Gelen Teklif Talepleri". */
  sectionLabel: string
}

export function SellerPendingScreen({ storeName, sectionLabel }: Props) {
  return (
    <>
      <section className="bg-surface border-b border-border py-10">
        <div className="w-full max-w-container mx-auto px-5 md:px-12">
          <span className="text-xs font-bold uppercase tracking-wider text-ink-muted block mb-2">
            {sectionLabel}
          </span>
          <h1 className="text-[28px] font-extrabold tracking-tight text-ink leading-[36px]">
            {storeName}
          </h1>
        </div>
      </section>

      <section className="bg-surface py-16">
        <div className="w-full max-w-container mx-auto px-5 md:px-12">
          <div className="max-w-xl mx-auto border border-state-warning bg-surface-container-lowest">
            <div className="bg-surface-container px-6 py-4 border-b border-border">
              <h2 className="text-xs font-bold uppercase tracking-wider text-navy">
                Doğrulama Bekleniyor
              </h2>
            </div>
            <div className="p-8 flex flex-col gap-4">
              <p className="text-sm text-ink leading-6">
                Mağaza profiliniz oluşturuldu: <strong>{storeName}</strong>. Teklif
                talebi görüntülemek ve teklif vermek için hesabınızın ekibimiz
                tarafından doğrulanması gerekiyor.
              </p>
              <p className="text-sm text-ink-secondary leading-6">
                Başvurunuz inceleniyor. 24 iş saati içinde e-posta ve SMS ile
                bilgilendireceğiz.
              </p>
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Link
                  href="/satici/onboarding?status=pending"
                  className="bg-brand text-navy font-bold text-sm uppercase tracking-wider px-5 py-2 hover:opacity-90 transition-opacity"
                >
                  Mağaza Bilgileri
                </Link>
                <Link
                  href="/satici/panel"
                  className="border border-border text-navy font-bold text-sm uppercase tracking-wider px-5 py-2 hover:bg-surface-container transition-colors"
                >
                  Panel
                </Link>
                <Link
                  href="/iletisim"
                  className="border border-border text-navy font-bold text-sm uppercase tracking-wider px-5 py-2 hover:bg-surface-container transition-colors"
                >
                  İletişim
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
