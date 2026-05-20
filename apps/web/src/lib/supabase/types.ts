// apps/web/src/lib/supabase/types.ts
// @insaatborsam/database paketinden type'ları web app'e re-export eder.
// Bu dosyayı elle düzenleme — types.ts `pnpm db:types` ile üretilir.

export type {
  Database,
  Json,
  Tables,
  TablesInsert,
  TablesUpdate,
  Enums,
} from '@insaatborsam/database'
