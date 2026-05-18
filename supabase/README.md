# Supabase

İnşaat Borsam Postgres + Auth + Storage + Realtime + Edge Functions tek noktası.

## Sprint 1 Setup

```bash
# Supabase CLI
npm i -g supabase

# Local stack başlat
supabase start

# Production projeyi link et (Erdi Supabase Dashboard'dan project_id alır)
supabase link --project-ref <PROJECT_ID>

# config.toml içindeki project_id placeholder'ı güncelle

# İlk migration setini uygula
supabase db reset      # local
supabase db push       # production
```

## Klasör Yapısı

```
supabase/
├── config.toml          — Local CLI ayarları
├── migrations/          — Timestamped SQL migrations (Sprint 1+)
└── functions/           — Edge Functions (Deno, Sprint 5+)
```

## Migration Sırası (Sprint 1)

Detay: `docs/04-DATABASE.md` Bölüm "Migrations Sırası". Düzeltilmiş sıra (orders rfq_offers'tan ÖNCE):

```
20260601000000_extensions.sql       # pgvector, pg_trgm, uuid-ossp
20260601000100_profiles.sql
20260601000200_buyer_profiles.sql
20260601000300_seller_profiles.sql
20260601000400_categories.sql
20260601000500_products.sql
20260601000600_addresses.sql
20260601000700_orders.sql            # orders ÖNCE
20260601000800_rfqs.sql
20260601000900_rfq_offers.sql        # FK to orders nullable, ALTER sonradan
20260601001000_payments.sql
20260601001100_subscriptions.sql
20260601001200_conversations.sql
20260601001300_reviews.sql
20260601001400_projects.sql
20260601001500_admin.sql
20260601001600_discovered_businesses.sql
20260601001700_price_index.sql
20260601001800_ai_call_logs.sql
20260601001900_functions.sql
20260601002000_rls_policies.sql
20260601002100_seed_categories.sql
```

## Kritik

- Her tabloda **RLS aktif** — istisnasız. Detay: `supabase-rls-validator` skill.
- Service role key sadece Edge Function veya Next.js server-side.
- Migration yazımı için `database-architect` agent ve `04-DATABASE.md` referans.
