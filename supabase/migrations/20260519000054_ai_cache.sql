-- Migration: 20260519000054_ai_cache.sql
-- Amaç: AI embedding ve completion sonuçlarının önbelleği.
-- Tekrarlayan AI çağrılarının maliyetini ve gecikmesini düşürür.
--
-- Bu tablo YALNIZCA Edge Function (service_role) tarafından kullanılır.
-- Kullanıcı erişimi yok — deny by default (000055_ai_cache_rls.sql).
--
-- ─────────────────────────────────────────────────────────────
-- KVKK / PII CACHE RİSKİ UYARISI:
--   AI prompt'ları bazen kişisel veri içerebilir:
--     - RFQ parse: alıcı adı, şantiye adresi, telefon
--     - Semantic search: kullanıcı arama metni
--     - Ürün özeti: satıcı şirket adı, vergi no
--
--   Zorunlu önlemler:
--   1. Cache key'i oluştururken giriş metnini ham saklamayın —
--      SHA256 hash kullanın. response_data'da kullanıcıya özgü
--      veri minimuma indirilmeli.
--   2. Embedding cache'i genellikle güvenli (vektör, PII yok).
--      Completion cache'te ham metin saklanıyorsa dikkat.
--   3. Saklama süresi: KVKK kapsamında maks. 30 gün önerilir.
--      expires_at zorunlu olarak set edilmeli.
--   4. Bu tabloya asla kullanıcı rolü erişimi verilmez.
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.ai_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Cache tipi
  --   embedding  : Vektör embedding sonucu (OpenAI text-embedding-3-small)
  --   completion : Claude/GPT metin tamamlama sonucu
  --   rfq_parse  : RFQ metninin yapılandırılmış parse sonucu (Claude Haiku)
  --   category_match : Kategori eşleştirme sonucu
  cache_type TEXT NOT NULL CHECK (
    cache_type IN ('embedding', 'completion', 'rfq_parse', 'category_match')
  ),

  -- AI sağlayıcısı ve modeli
  provider TEXT NOT NULL CHECK (provider IN ('openai', 'anthropic')),
  model    TEXT NOT NULL,  -- 'text-embedding-3-small', 'claude-haiku-4-5', vb.

  -- Girdi hash'i (cache key) — SHA256 of normalized input
  -- Ham girdi metni saklanmaz (PII riski). Sadece hash.
  input_hash TEXT NOT NULL,

  -- Embedding sonucu (cache_type='embedding' için)
  embedding vector(1536),

  -- Metin tamamlama sonucu (cache_type='completion','rfq_parse','category_match')
  response_text TEXT,
  response_data JSONB,       -- Yapılandırılmış parse sonucu

  -- Token sayacı (maliyet takibi)
  token_count_input  INTEGER CHECK (token_count_input  IS NULL OR token_count_input  >= 0),
  token_count_output INTEGER CHECK (token_count_output IS NULL OR token_count_output >= 0),

  -- Cache kullanım istatistiği
  hit_count INTEGER NOT NULL DEFAULT 0 CHECK (hit_count >= 0),

  -- TTL (zorunlu — saklama süresi sınırsız olmamalı, KVKK)
  expires_at TIMESTAMPTZ NOT NULL,

  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  -- updated_at YOK — hit_count artışı service_role ile; izlenecekse ayrı tablo
  -- deleted_at YOK — expires_at cron ile temizler
);

-- Temel lookup: cache_type + model + hash kombinasyonu unique olmalı
CREATE UNIQUE INDEX IF NOT EXISTS idx_ai_cache_lookup_unique
  ON public.ai_cache (cache_type, model, input_hash);

-- TTL temizliği için (cron: "DELETE FROM ai_cache WHERE expires_at < NOW()")
-- NOT: Partial index predicate içinde NOW() kullanılamaz (IMMUTABLE zorunlu).
-- Basit index yeterli — cron sorgusu zaten expires_at < NOW() filtresi uygular.
CREATE INDEX IF NOT EXISTS idx_ai_cache_expires
  ON public.ai_cache (expires_at ASC);

-- Cache tipi bazlı istatistik (toplam hit sayısı, vb.)
CREATE INDEX IF NOT EXISTS idx_ai_cache_type_hits
  ON public.ai_cache (cache_type, hit_count DESC);

COMMENT ON TABLE public.ai_cache IS
  'AI sonuç önbelleği. KVKK: expires_at zorunlu, max 30 gün. '
  'Ham girdi metni saklanmaz — SHA256 hash. Yalnızca service_role erişir.';
COMMENT ON COLUMN public.ai_cache.input_hash IS
  'Normalleştirilmiş girdinin SHA256 hash''i. '
  'PII içeren ham metin (RFQ, arama sorgusu) SAKLANMAZ — sadece hash.';
COMMENT ON COLUMN public.ai_cache.expires_at IS
  'Zorunlu TTL. Edge Function set etmeli: embedding 7 gün, completion 1 gün. '
  'Cron: "DELETE FROM ai_cache WHERE expires_at < NOW()" ile temizlenir.';
