// Next.js 15 config — Turbopack varsayılan, monorepo paketleri transpileEdildi.

import type { NextConfig } from "next";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

// Monorepo'da Next.js workspace root'u otomatik bulamayınca yanlış lockfile'a düşer (home directory gibi).
// Explicit olarak repo köküne işaret ediyoruz.
const __dirname = dirname(fileURLToPath(import.meta.url));
const monorepoRoot = resolve(__dirname, "../..");

const nextConfig: NextConfig = {
  reactStrictMode: true,
  typedRoutes: true,
  transpilePackages: ["@insaatborsam/ui", "@insaatborsam/shared", "@insaatborsam/database", "@insaatborsam/ai"],
  turbopack: {
    root: monorepoRoot,
  },
  // i18n: app router'da custom çözüm — şimdilik tek dil (tr), Faz 3'te i18next.
};

export default nextConfig;
