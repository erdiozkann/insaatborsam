import { ImageResponse } from "next/og";

export const alt = "İnşaat Borsam — İnşaatın Dijital Borsası";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#f4b400",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "center",
          padding: "80px",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background:
              "repeating-linear-gradient(45deg, rgba(0,0,0,0.03) 0px, rgba(0,0,0,0.03) 1px, transparent 1px, transparent 40px)",
          }}
        />
        <div
          style={{
            fontSize: 14,
            fontWeight: 700,
            color: "#191c1e",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            marginBottom: 24,
            opacity: 0.7,
          }}
        >
          insaatborsam.com
        </div>
        <div
          style={{
            fontSize: 72,
            fontWeight: 800,
            color: "#191c1e",
            letterSpacing: "-0.02em",
            lineHeight: 1.05,
            marginBottom: 24,
          }}
        >
          İnşaat Borsam
        </div>
        <div
          style={{
            fontSize: 28,
            color: "#504533",
            fontWeight: 500,
            lineHeight: 1.4,
            maxWidth: 700,
          }}
        >
          İnşaatın Dijital Borsası
        </div>
        <div
          style={{
            marginTop: 48,
            fontSize: 18,
            fontWeight: 600,
            background: "#191c1e",
            color: "#f4b400",
            padding: "8px 20px",
            display: "flex",
          }}
        >
          Türkiye&apos;nin ilk yapay zeka destekli inşaat tedarik platformu
        </div>
      </div>
    ),
    { ...size }
  );
}
