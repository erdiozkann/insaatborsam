type SectionHeaderProps = {
  label?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
};

export function SectionHeader({
  label,
  title,
  description,
  align = "center",
}: SectionHeaderProps) {
  const alignClass =
    align === "center" ? "items-center text-center" : "items-start text-left";

  return (
    <div className={`flex flex-col gap-3 ${alignClass}`}>
      {label && (
        <span className="text-xs font-bold uppercase tracking-wider text-brand-dark border border-brand-dark px-3 py-1 self-start">
          {label}
        </span>
      )}
      <h2 className="text-[28px] md:text-[32px] leading-[36px] md:leading-[40px] font-bold tracking-tight text-ink">
        {title}
      </h2>
      {description && (
        <p className="text-[16px] md:text-[18px] leading-7 text-ink-secondary max-w-2xl">
          {description}
        </p>
      )}
    </div>
  );
}
