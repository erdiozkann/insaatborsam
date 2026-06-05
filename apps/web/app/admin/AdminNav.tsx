'use client'

// Admin sol menü — aktif link vurgusu için client component (usePathname).
// Industrial Precision: 0 radius, border, token renkler.

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const LINKS = [
  { href: '/admin', label: 'Panel', exact: true },
  { href: '/admin/rfq', label: 'Teklif Talepleri' },
  { href: '/admin/teklifler', label: 'Teklifler' },
  { href: '/admin/siparisler', label: 'Siparişler' },
  { href: '/admin/saticilar', label: 'Satıcılar' },
  { href: '/admin/alicilar', label: 'Alıcılar' },
]

export function AdminNav() {
  const pathname = usePathname()

  return (
    <nav className="flex flex-col py-2">
      {LINKS.map((link) => {
        const active = link.exact ? pathname === link.href : pathname.startsWith(link.href)
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`px-5 py-3 text-sm font-bold uppercase tracking-wider border-l-2 transition-colors ${
              active
                ? 'border-brand bg-surface-container text-navy'
                : 'border-transparent text-ink-secondary hover:bg-surface-container hover:text-navy'
            }`}
          >
            {link.label}
          </Link>
        )
      })}
    </nav>
  )
}
