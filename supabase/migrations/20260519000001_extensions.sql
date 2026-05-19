-- Migration: 20260519000001_extensions.sql
-- Amaç: İnşaat Borsam veritabanı için gerekli Postgres extension'larını kur.
-- İdempotent: tekrar çalıştırılabilir, IF NOT EXISTS kullanılıyor.
--
-- Açıklama:
--   - pgvector: Ürün ve RFQ embedding'leri için (semantic search, satıcı eşleştirme).
--   - pg_trgm: Türkçe fuzzy/trigram arama (ürün adı, marka).
--   - uuid-ossp: gen_random_uuid() yedeği (pgcrypto Supabase'de varsayılan açık,
--                yine de uuid_generate_v4 ihtiyacı için yedek olarak kuruluyor).
--   - citext: Case-insensitive email/slug karşılaştırmaları için yedek.

CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS citext;

-- pgcrypto Supabase'de default açık ama yine de garantiye alalım (gen_random_uuid için).
CREATE EXTENSION IF NOT EXISTS pgcrypto;
