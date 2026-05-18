// Geçici landing — Sprint 0 sonu doğrulama sayfası. Sprint 2'de gerçek marketing hero ile değiştirilecek.

import { Logo } from "@insaatborsam/ui/components/Logo";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-surface flex flex-col items-center justify-center px-5 md:px-12 py-16">
      <div className="w-full max-w-container flex flex-col items-center gap-12">
        <Logo size="lg" />

        <div className="flex flex-col items-center gap-4 text-center">
          <h1 className="text-[48px] leading-[56px] font-extrabold tracking-tight text-ink">
            İnşaat Borsam
          </h1>
          <p className="text-[18px] leading-7 text-ink-secondary max-w-xl">
            İnşaatın dijital borsası. Müteahhitler, satıcılar ve nakliyecileri tek platformda buluşturan üç taraflı B2B
            marketplace.
          </p>
        </div>

        <div className="border border-border-default bg-surface-container-lowest px-8 py-6 w-full max-w-md">
          <div className="flex items-center gap-3">
            <span
              aria-hidden
              className="block h-3 w-3 bg-state-success"
              title="Sprint 0 hazır"
            />
            <span className="text-sm font-bold uppercase tracking-wider text-navy">
              Sprint 0 — Monorepo Hazır
            </span>
          </div>
          <p className="mt-3 text-sm text-ink-secondary leading-6">
            Industrial Precision token sistemi yüklü. Tüm köşeler 0px, hazard sarı CTA için ayrıldı, soft shadow yok.
            Sprint 1: Supabase schema + Auth.
          </p>
        </div>

        <p className="text-xs uppercase tracking-wider text-ink-muted">
          Faz 1 · Launch 31 Ağustos 2026
        </p>
      </div>
    </main>
  );
}
