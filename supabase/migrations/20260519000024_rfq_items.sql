-- Migration: 20260519000024_rfq_items.sql
-- Amaç: Çok kalemli RFQ kalemleri.
-- rfqs (1) -> rfq_items (n) — tek kalemli talep için rfqs.quantity yeterli,
-- çok kalemli talep için (örn. "60 ton çimento + 120 m² seramik") ayrı tablo.
-- Soft delete YOK — child kayıt, parent silinince CASCADE.

CREATE TABLE IF NOT EXISTS public.rfq_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Ait olduğu talep
  rfq_id UUID NOT NULL REFERENCES public.rfqs(id) ON DELETE CASCADE,

  -- Kategori bağlantısı (opsiyonel — serbest metin malzeme adı da olabilir)
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,

  -- Malzeme tanımı (serbest metin — alıcı istediği gibi yazar)
  material_name TEXT NOT NULL,
  brand_preference TEXT,

  -- Miktar (kesirli olabilir: 15.5 m², 0.5 ton)
  quantity NUMERIC(12,2) NOT NULL CHECK (quantity > 0),
  unit TEXT NOT NULL CHECK (unit IN ('m2', 'm3', 'metre', 'ton', 'kg', 'adet', 'paket', 'kutu', 'litre', 'cuval')),

  -- Tahmini birim fiyat (alıcının beklenti referansı, opsiyonel, BIGINT cent)
  estimated_unit_price_cents BIGINT CHECK (
    estimated_unit_price_cents IS NULL OR estimated_unit_price_cents > 0
  ),

  -- Esnek teknik özellikler (JSON)
  --   örn. {"boyut": "60x60", "renk": "beyaz", "kalinlik_mm": 9}
  specifications JSONB NOT NULL DEFAULT '{}'::jsonb,

  -- Ek notlar
  notes TEXT,

  -- Sıralama (UI'daki kalem listesi sırası)
  display_order INTEGER NOT NULL DEFAULT 0,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RFQ'nun tüm kalemleri (sıralı)
CREATE INDEX IF NOT EXISTS idx_rfq_items_rfq_order
  ON public.rfq_items (rfq_id, display_order);

COMMENT ON TABLE public.rfq_items IS 'Çok kalemli RFQ için ayrı kalem satırları. Tek kalemli talep için rfqs.quantity/unit yeterli.';
COMMENT ON COLUMN public.rfq_items.estimated_unit_price_cents IS 'Alıcının beklenti fiyatı (isteğe bağlı). Satıcılara gösterilmeyebilir — uygulama kararı.';
