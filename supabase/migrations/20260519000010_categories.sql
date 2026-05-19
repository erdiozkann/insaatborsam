-- Migration: 20260519000010_categories.sql
-- Amaç: Ürün kategori ağacı (self-referential).
-- Faz 1 seed: 3 ana kategori (Seramik & Vitrifiye, Yapı Kimyasalları, Elektrik) + alt kategoriler.
-- Seed migration ayrı dosyada (000033_seed_categories.sql).
--
-- Soft delete YOK — kategori sistem verisi, is_active flag silme işlevi görür.

CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Ağaç yapısı (self-referential)
  parent_id UUID REFERENCES public.categories(id) ON DELETE CASCADE,

  -- Görüntüleme
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  icon TEXT,                       -- lucide icon adı: 'hammer', 'plug', vb.
  image_url TEXT,

  -- Sıralama ve durum
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,

  -- SEO meta
  meta_title TEXT,
  meta_description TEXT,

  -- Standart audit kolonları
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  -- deleted_at YOK — sistem verisi, is_active flag yeterli
);

-- Slug case-insensitive unique
CREATE UNIQUE INDEX IF NOT EXISTS idx_categories_slug_unique
  ON public.categories (LOWER(slug));

-- Sık sorgulanan kolonlar
CREATE INDEX IF NOT EXISTS idx_categories_parent
  ON public.categories (parent_id);

CREATE INDEX IF NOT EXISTS idx_categories_active_order
  ON public.categories (is_active, display_order);

COMMENT ON TABLE public.categories IS 'Ürün kategori ağacı. Self-referential parent_id ile hiyerarşi (ana → alt kategori).';
COMMENT ON COLUMN public.categories.icon IS 'lucide icon adı (örn. ''hammer'', ''plug''). UI tarafında dinamik resolve edilir.';
