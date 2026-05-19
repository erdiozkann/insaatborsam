-- Migration: 20260519000014_product_images.sql
-- Amaç: Ürün görselleri.
-- products (1) -> product_images (n)
-- Soft delete YOK — child kayıt, parent silinince CASCADE.

CREATE TABLE IF NOT EXISTS public.product_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Sahip ürün
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,

  -- Görsel kaynağı (Supabase Storage URL)
  url TEXT NOT NULL,
  alt_text TEXT,

  -- Sıralama
  display_order INTEGER NOT NULL DEFAULT 0,

  -- Bu ürünün vitrin (primary) görseli mi?
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ürün başına maksimum 1 primary görsel (partial unique)
CREATE UNIQUE INDEX IF NOT EXISTS idx_product_images_primary_unique
  ON public.product_images (product_id) WHERE is_primary = TRUE;

-- Sık kullanılan: ürünün tüm görselleri (sıralı)
CREATE INDEX IF NOT EXISTS idx_product_images_product_order
  ON public.product_images (product_id, display_order);

COMMENT ON TABLE public.product_images IS 'Ürün görselleri. Parent ürün silinince CASCADE.';
COMMENT ON COLUMN public.product_images.url IS 'Supabase Storage URL — bucket: product-images (Faz 1''de oluşturulacak).';
