# İnşaat Borsam web (Next.js 15, pnpm + Turborepo monorepo) — standalone runtime.
# Coolify (Hostinger VPS) bu Dockerfile ile build alır; main'e push'ta otomatik deploy.
# syntax=docker/dockerfile:1

FROM node:22-alpine AS base
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable && corepack prepare pnpm@9.12.0 --activate
# Next standalone'un alpine'de çalışması için
RUN apk add --no-cache libc6-compat

# ── deps: tüm workspace bağımlılıklarını kur ──
FROM base AS deps
WORKDIR /app
COPY . .
RUN pnpm install --frozen-lockfile

# ── builder: theme:sync + web build ──
FROM deps AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
# NEXT_PUBLIC_* değerleri build sırasında bundle'a gömülür → build-arg olarak gelmeli.
# (anon key publiktir; service_role ASLA buraya girmez.)
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG NEXT_PUBLIC_SITE_URL
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL
RUN pnpm theme:sync
RUN pnpm --filter @insaatborsam/web build

# ── runner: minimal standalone server ──
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
RUN addgroup -S nodejs && adduser -S nextjs -G nodejs

# Monorepo standalone çıktısı repo yapısını korur: server apps/web/server.js'tedir.
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/public ./apps/web/public

USER nextjs
EXPOSE 3000
CMD ["node", "apps/web/server.js"]
