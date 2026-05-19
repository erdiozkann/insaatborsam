-- Migration: 20260519000012_products.sql
-- Amaç: Satıcı ürünleri.
-- seller_profiles (1) -> products (n) -> product_images/product_prices (1:n)
-- Para kolonları: BIGINT cent cinsinden (CLAUDE.md kuralı).

CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Sahibi
  seller_id UUID NOT NULL REFERENCES public.seller_profiles(id) ON DELETE CASCADE,

  -- Kategori (silinmeye karşı korunur — kategori taşınmadan ürün taşınamaz)
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE RESTRICT,

  -- Ürün bilgisi
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  brand TEXT,
  sku TEXT,

  -- Esnek teknik özellikler (JSON)
  --   örn. {"boyut": "60x60", "kalinlik_mm": 9, "yuzey": "mat"}
  specifications JSONB NOT NULL DEFAULT '{}'::jsonb,

  -- Fiyatlama (BIGINT cent — float hatasız)
  --   base_price_cents: tek birimin fiyatı. Örn. 12345 = ₺123,45
  --   Tier bazlı fiyatlar product_prices tablosunda.
  base_price_cents BIGINT NOT NULL CHECK (base_price_cents > 0),
  currency TEXT NOT NULL DEFAULT 'TRY' CHECK (currency IN ('TRY', 'EUR', 'USD')),

  -- Birim (metraj/adet için)
  unit TEXT NOT NULL CHECK (unit IN ('m2', 'm3', 'metre', 'ton', 'kg', 'adet', 'paket', 'kutu', 'litre', 'cuval')),

  -- Stok
  stock_quantity INTEGER NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
  min_order_quantity INTEGER NOT NULL DEFAULT 1 CHECK (min_order_quantity >= 1),

  -- Durum
  status TEXT NOT NULL DEFAULT 'draft' CHECK (
    status IN ('draft', 'active', 'paused', 'out_of_stock', 'rejected')
  ),
  is_featured BOOLEAN NOT NULL DEFAULT FALSE,

  -- AI Embedding (pgvector — semantic search, RFQ eşleştirme)
  -- OpenAI text-embedding-3-small dimension = 1536
  embedding vector(1536),

  -- Cached metrik
  view_count INTEGER NOT NULL DEFAULT 0 CHECK (view_count >= 0),

  -- Standart audit kolonları
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Aynı satıcı içinde slug unique (soft delete uyumlu)
CREATE UNIQUE INDEX IF NOT EXISTS idx_products_seller_slug_unique
  ON public.products (seller_id, LOWER(slug)) WHERE deleted_at IS NULL;

-- Sık kullanılan kolonlar için index
CREATE INDEX IF NOT EXISTS idx_products_seller
  ON public.products (seller_id) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_products_category
  ON public.products (category_id) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_products_status
  ON public.products (status) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_products_featured
  ON public.products (is_featured)
  WHERE status = 'active' AND deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_products_created
  ON public.products (created_at DESC) WHERE deleted_at IS NULL;

-- pgvector HNSW index — semantic similarity için (cosine distance)
-- Not: HNSW ivfflat'ten daha yüksek recall + güncellemelere dayanıklı.
CREATE INDEX IF NOT EXISTS idx_products_embedding_hnsw
  ON public.products
  USING hnsw (embedding vector_cosine_ops);

-- Full text search index — 'simple' config (Türkçe tokenizer Supabase'de garanti değil).
-- Türkçe için trigram index aşağıda (pg_trgm).
CREATE INDEX IF NOT EXISTS idx_products_fts_simple
  ON public.products
  USING GIN (to_tsvector('simple', name || ' ' || COALESCE(description, '') || ' ' || COALESCE(brand, '')))
  WHERE deleted_at IS NULL;

-- Trigram index — Türkçe fuzzy/contains match için (pg_trgm)
CREATE INDEX IF NOT EXISTS idx_products_name_trgm
  ON public.products
  USING GIN (name gin_trgm_ops)
  WHERE deleted_at IS NULL;

-- JSONB specifications üzerinde sorgu için GIN
CREATE INDEX IF NOT EXISTS idx_products_specs_gin
  ON public.products
  USING GIN (specifications)
  WHERE deleted_at IS NULL;

COMMENT ON TABLE public.products IS 'Satıcı ürünleri. Embedding pgvector ile semantic search/RFQ eşleştirme. Fiyat BIGINT cent.';
COMMENT ON COLUMN public.products.base_price_cents IS 'Tek birim fiyat (cent). Örn. 12345 = ₺123,45. Tier fiyatları product_prices tablosunda.';
COMMENT ON COLUMN public.products.embedding IS 'OpenAI text-embedding-3-small (1536 dim). AI özet/eşleştirme Edge Function ile doldurulur.';
COMMENT ON COLUMN public.products.specifications IS 'Esnek teknik özellikler JSON: {"boyut": "60x60", "kalinlik_mm": 9, ...}';
