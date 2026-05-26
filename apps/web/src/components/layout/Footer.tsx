import Link from "next/link";
import { Logo } from "@insaatborsam/ui/components/Logo";

const platformLinks = [
  { href: "/nasil-calisir", label: "Nasıl Çalışır" },
  { href: "/fiyatlar", label: "Fiyatlar" },
  { href: "/satici-ol", label: "Satıcı Ol" },
];

const companyLinks = [{ href: "/iletisim", label: "İletişim" }];

const legalLinks = [
  { href: "/yasal/kvkk", label: "KVKK" },
  { href: "/yasal/gizlilik", label: "Gizlilik Politikası" },
  { href: "/yasal/kullanim-kosullari", label: "Kullanım Koşulları" },
  { href: "/yasal/mesafeli-satis", label: "Mesafeli Satış" },
];

export function Footer() {
  return (
    <footer className="border-t border-border bg-surface-container-lowest">
      <div className="w-full max-w-container mx-auto px-5 md:px-12 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-12">
          <div className="md:col-span-1 flex flex-col gap-4">
            <Logo size="sm" />
            <p className="text-sm text-ink-muted leading-6">
              İnşaatın dijital borsası. Müteahhitler ve yapı malzemesi satıcılarını tek platformda buluşturur.
            </p>
          </div>

          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-navy mb-4">Platform</h3>
            <ul className="flex flex-col gap-3">
              {platformLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-ink-secondary hover:text-ink transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-navy mb-4">Şirket</h3>
            <ul className="flex flex-col gap-3">
              {companyLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-ink-secondary hover:text-ink transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-navy mb-4">Yasal</h3>
            <ul className="flex flex-col gap-3">
              {legalLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-ink-secondary hover:text-ink transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-border mt-12 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-ink-muted">
            © 2026 İnşaat Borsam. Tüm hakları saklıdır.
          </p>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 bg-state-success flex-shrink-0" aria-hidden />
            <span className="text-xs text-ink-muted">KVKK Uyumlu</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
