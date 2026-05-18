# @insaatborsam/database

Supabase Postgres + Auth + Storage + Realtime ile konuşmak için tek nokta.

## İçerik (Sprint 1 sonunda)

- `src/types.ts` — `pnpm db:types` ile generate edilen Supabase tip dosyası
- `src/client.ts` — `createClient<Database>()` wrapper, env validation
- `src/queries/` — yeniden kullanılabilir tipli sorgu fonksiyonları (`getActiveProductsByCategory`, `searchProductsSemantic`, vs.)

## Komutlar

```bash
pnpm db:types   # root'tan — supabase types regenerate
```

## Notlar

- Service role key bu paket altından client-side import edilmez (server-only modül `server.ts` Sprint 2'de)
- Tüm RLS policies için bkz: `docs/04-DATABASE.md` + `supabase-rls-validator` skill
