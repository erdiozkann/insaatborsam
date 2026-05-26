type Feature = {
  text: string;
  included: boolean;
};

type PlanCardProps = {
  name: string;
  price: string;
  period?: string;
  annualNote?: string;
  features: Feature[];
  highlighted?: boolean;
  ctaLabel: string;
  ctaHref: string;
  badge?: string;
};

export function PlanCard({
  name,
  price,
  period = "/ay",
  annualNote,
  features,
  highlighted = false,
  ctaLabel,
  ctaHref,
  badge,
}: PlanCardProps) {
  return (
    <div
      className={`relative flex flex-col border bg-surface-container-lowest p-6 ${
        highlighted ? "border-brand-dark border-2" : "border-border"
      }`}
    >
      {badge && (
        <div className="absolute -top-3 left-6">
          <span className="bg-brand text-navy text-xs font-bold uppercase tracking-wider px-3 py-1">
            {badge}
          </span>
        </div>
      )}

      <div className="flex flex-col gap-1 mb-6">
        <h3 className="text-xs font-bold uppercase tracking-wider text-navy">{name}</h3>
        <div className="flex items-baseline gap-1">
          <span className="text-[32px] md:text-[36px] leading-[40px] md:leading-[44px] font-bold text-ink tabular-nums">
            {price}
          </span>
          <span className="text-sm text-ink-muted">{period}</span>
        </div>
        {annualNote && <p className="text-xs text-ink-muted">{annualNote}</p>}
      </div>

      <ul className="flex flex-col gap-3 mb-8 flex-1">
        {features.map((f) => (
          <li
            key={f.text}
            className={`flex items-start gap-3 text-sm ${
              f.included ? "text-ink" : "text-ink-muted"
            }`}
          >
            <span
              className={`flex-shrink-0 mt-0.5 font-bold text-xs ${
                f.included ? "text-state-success" : "text-ink-muted"
              }`}
            >
              {f.included ? "✓" : "—"}
            </span>
            {f.text}
          </li>
        ))}
      </ul>

      <a
        href={ctaHref}
        className={`text-center font-bold text-sm uppercase tracking-wider px-5 py-3 min-h-11 flex items-center justify-center transition-opacity hover:opacity-90 ${
          highlighted
            ? "bg-brand text-navy"
            : "border border-border-strong text-navy hover:bg-surface-container"
        }`}
      >
        {ctaLabel}
      </a>
    </div>
  );
}
