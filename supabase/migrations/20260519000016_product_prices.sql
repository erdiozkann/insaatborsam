-- Migration: 20260519000016_product_prices.sql
-- Amaç: Tier bazlı fiyatlama (retail/wholesale/dealer).
-- products (1) -> product_prices (n)
-- Para BIGINT cent.
-- Soft delete YOK — child kayıt, parent silinince CASCADE.

CREATE TABLE IF NOT EXISTS public.product_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Sahip ürün
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,

  -- Fiyat seviyesi
  --   retail: perakende (1+ birim)
  --   wholesale: toptan (örn. 100+ birim)
  --   dealer: bayi (sözleşmeli müşteri için özel fiyat)
  tier TEXT NOT NULL CHECK (tier IN ('retail', 'wholesale', 'dealer')),

  -- Bu tier'in geçerli olduğu minimum miktar
  min_quantity INTEGER NOT NULL DEFAULT 1 CHECK (min_quantity >= 1),

  -- Fiyat (BIGINT cent)
  price_cents BIGINT NOT NULL CHECK (price_cents > 0),

  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Aynı ürün + tier + min_quantity kombinasyonu tek olmalı
  CONSTRAINT product_prices_unique_tier_qty UNIQUE (product_id, tier, min_quantity)
);

-- Ürünün fiyat seviyelerini listelemek için index
CREATE INDEX IF NOT EXISTS idx_product_prices_product_tier
  ON public.product_prices (product_id, tier, min_quantity);

COMMENT ON TABLE public.product_prices IS 'Tier bazlı fiyatlama (retail/wholesale/dealer). Müşteri tipine göre fiyat çözünürlüğü.';
COMMENT ON COLUMN public.product_prices.price_cents IS 'BIGINT cent (örn. 9999 = ₺99,99).';
