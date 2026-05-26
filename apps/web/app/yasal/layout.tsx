export default function YasalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-surface">
      <div className="w-full max-w-container mx-auto px-5 md:px-12 py-16 md:py-24">
        <div className="border border-state-warning bg-surface-container-lowest px-4 py-3 mb-10 flex items-start gap-3">
          <span className="text-state-warning font-bold text-sm flex-shrink-0">⚠</span>
          <p className="text-sm text-ink-secondary">
            <strong className="text-ink">Taslak Belge:</strong> Bu sayfa henüz hukuki geçerlilik kazanmamıştır.
            Hukuk danışmanı onayı tamamlandıktan sonra nihai metin yayına girecektir.
          </p>
        </div>
        <div className="max-w-3xl">{children}</div>
      </div>
    </div>
  );
}
