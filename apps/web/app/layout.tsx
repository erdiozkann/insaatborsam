// Root layout — Türkçe lang attribute, Inter font, global CSS import. Tüm sayfalar bu shell altında render olur.

import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "700", "800"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: {
    default: "İnşaat Borsam — İnşaatın Dijital Borsası",
    template: "%s | İnşaat Borsam",
  },
  description:
    "Türkiye inşaat sektörü için yapay zeka destekli dijital tedarik borsası. Müteahhitler, yapı malzemesi satıcıları ve nakliyecileri tek platformda buluşturur.",
  metadataBase: new URL("https://insaatborsam.com"),
  openGraph: {
    type: "website",
    locale: "tr_TR",
    siteName: "İnşaat Borsam",
  },
};

export const viewport: Viewport = {
  themeColor: "#f4b400",
  colorScheme: "light",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr" className={inter.variable}>
      <body className="bg-background text-on-background">{children}</body>
    </html>
  );
}
