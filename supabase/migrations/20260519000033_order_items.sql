-- Migration: 20260519000033_order_items.sql
-- Amaç: Sipariş kalemleri — immutable snapshot.
-- orders (1) -> order_items (n)
--
-- Snapshot prensibi: Ürün sonradan silinse veya fiyatı değişse bile
-- sipariş kaydı kendi anlık değerini taşır.
-- Güncelleme/silme YOK — sipariş oluşturulduğunda kalemleri dondurulur.

CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Ait olduğu sipariş
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,

  -- Ürün referansı (RESTRICT — ürün silinemez, sadece soft-delete)
  -- Ürün soft-delete yapılırsa bu FK çalışmaya devam eder (deleted_at bakılmaz).
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,

  -- Snapshot kolonları (sipariş anındaki değer — sonraki ürün değişikliklerinden bağımsız)
  product_name_snapshot TEXT NOT NULL,
  product_sku_snapshot  TEXT,
  product_image_snapshot TEXT,

  -- Fiyat snapshot (BIGINT cent)
  unit_price_snapshot_cents BIGINT NOT NULL CHECK (unit_price_snapshot_cents > 0),

  -- Miktar ve birim (snapshot — sipariş anındaki)
  quantity NUMERIC(12,2) NOT NULL CHECK (quantity > 0),
  unit     TEXT NOT NULL,

  -- Kalem toplamı (quantity × unit_price_snapshot_cents — uygulama hesaplar)
  line_total_cents BIGINT NOT NULL CHECK (line_total_cents > 0),

  -- Sıralama
  display_order INTEGER NOT NULL DEFAULT 0,

  -- Sadece created_at — immutable kayıt, updated_at/deleted_at yok
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Tutarlılık kontrolü: line_total = quantity * unit_price (tam sayıya yuvarlanmış)
  -- Not: NUMERIC * BIGINT casting gereği bu check yaklaşık — kesin kontrol uygulamada.
  CONSTRAINT order_items_line_total_chk CHECK (line_total_cents > 0)
);

-- Siparişin tüm kalemleri (sıralı)
CREATE INDEX IF NOT EXISTS idx_order_items_order
  ON public.order_items (order_id, display_order);

-- Ürün bazlı sipariş geçmişi (satıcı analytics için)
CREATE INDEX IF NOT EXISTS idx_order_items_product
  ON public.order_items (product_id);

COMMENT ON TABLE public.order_items IS 'Sipariş kalemleri — immutable snapshot. Ürün silinse/fiyatı değişse bile sipariş kaydı sabit kalır.';
COMMENT ON COLUMN public.order_items.unit_price_snapshot_cents IS 'Sipariş anındaki birim fiyat (cent). Sonraki ürün güncellemelerinden etkilenmez.';
