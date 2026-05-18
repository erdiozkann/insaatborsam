// Geçici Logo placeholder — Inter 800 weight metin + altında hazard sarı 3px line.
// Gerçek logo Sprint 1-2 arasında swap edilecek (Erdi tasarlayacak).
// Web-only (JSX <svg>). Mobile için Logo.native.tsx Sprint 1'de eklenir (react-native-svg).

import type { JSX } from "react";

type LogoSize = "sm" | "md" | "lg";

type LogoProps = {
  size?: LogoSize;
  className?: string;
  // Kullanıcılara duyurulan metin — ekran okuyucular için.
  ariaLabel?: string;
};

const dimensions: Record<LogoSize, { width: number; height: number; fontSize: number; lineY: number }> = {
  sm: { width: 140, height: 28, fontSize: 18, lineY: 26 },
  md: { width: 200, height: 40, fontSize: 26, lineY: 37 },
  lg: { width: 300, height: 60, fontSize: 40, lineY: 56 },
};

export function Logo({ size = "md", className, ariaLabel = "İnşaat Borsam" }: LogoProps): JSX.Element {
  const { width, height, fontSize, lineY } = dimensions[size];

  return (
    <svg
      role="img"
      aria-label={ariaLabel}
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <title>{ariaLabel}</title>
      <text
        x="0"
        y={fontSize}
        fontFamily="Inter, system-ui, sans-serif"
        fontSize={fontSize}
        fontWeight="800"
        letterSpacing="-0.02em"
        fill="#191c1e"
      >
        İnşaat Borsam
      </text>
      <rect x="0" y={lineY} width={width * 0.55} height="3" fill="#f4b400" />
    </svg>
  );
}

export default Logo;
