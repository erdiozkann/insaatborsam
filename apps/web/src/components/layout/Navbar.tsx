"use client";

import { useState } from "react";
import Link from "next/link";
import { Logo } from "@insaatborsam/ui/components/Logo";

const navLinks = [
  { href: "/nasil-calisir", label: "Nasıl Çalışır" },
  { href: "/fiyatlar", label: "Fiyatlar" },
  { href: "/iletisim", label: "İletişim" },
];

export function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="border-b border-border bg-surface-container-lowest sticky top-0 z-50">
      <div className="w-full max-w-container mx-auto px-5 md:px-12">
        <div className="flex items-center justify-between h-16">
          <Link href="/" aria-label="İnşaat Borsam Ana Sayfa">
            <Logo size="md" />
          </Link>

          <nav className="hidden md:flex items-center gap-8" aria-label="Ana menü">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-ink-secondary hover:text-ink transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-4">
            <Link
              href="/giris"
              className="text-sm font-medium text-ink-secondary hover:text-ink transition-colors"
            >
              Giriş Yap
            </Link>
            <Link
              href="/satici-ol"
              className="bg-brand text-navy font-bold text-sm uppercase tracking-wider px-5 py-2.5 hover:opacity-90 transition-opacity min-h-11 flex items-center"
            >
              Satıcı Başvurusu
            </Link>
          </div>

          <button
            type="button"
            onClick={() => setOpen((prev) => !prev)}
            className="md:hidden flex flex-col justify-center gap-1.5 p-2 w-11 h-11 text-ink"
            aria-label={open ? "Menüyü kapat" : "Menüyü aç"}
            aria-expanded={open}
          >
            <span
              className={`block w-6 h-0.5 bg-current transition-transform origin-center ${
                open ? "rotate-45 translate-y-2" : ""
              }`}
            />
            <span
              className={`block w-6 h-0.5 bg-current transition-opacity ${open ? "opacity-0" : ""}`}
            />
            <span
              className={`block w-6 h-0.5 bg-current transition-transform origin-center ${
                open ? "-rotate-45 -translate-y-2" : ""
              }`}
            />
          </button>
        </div>

        {open && (
          <nav
            className="md:hidden border-t border-border py-4 flex flex-col gap-1"
            aria-label="Mobil menü"
          >
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-base font-medium text-ink py-3 border-b border-border last:border-0"
                onClick={() => setOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/giris"
              className="text-base font-medium text-ink py-3 border-b border-border"
              onClick={() => setOpen(false)}
            >
              Giriş Yap
            </Link>
            <Link
              href="/satici-ol"
              className="bg-brand text-navy font-bold text-sm uppercase tracking-wider px-5 py-3 text-center min-h-11 flex items-center justify-center mt-3"
              onClick={() => setOpen(false)}
            >
              Satıcı Başvurusu
            </Link>
          </nav>
        )}
      </div>
    </header>
  );
}
