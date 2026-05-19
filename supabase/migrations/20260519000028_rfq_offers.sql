-- Migration: 20260519000028_rfq_offers.sql
-- Amaç: Satıcının RFQ'ya verdiği teklif.
-- rfqs (1) -> rfq_offers (n) <- seller_profiles
--
-- ÖNEMLİ: resulting_order_id kolonu BU MIGRATION'DA YOK.
-- orders tablosu oluşturulduktan sonra döngüsel FK çözümü için:
--   ALTER TABLE migration'ı (000017_alter_rfq_offers_add_order_fk.sql — yeniden numaralanacak)
--   ile eklenecek.
--
-- Para kolonları: BIGINT cent.

CREATE TABLE IF NOT EXISTS public.rfq_offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Bağlantılar
  rfq_id    UUID NOT NULL REFERENCES public.rfqs(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES public.seller_profiles(id) ON DELETE CASCADE,

  -- Teklif detayları
  unit_price_cents  BIGINT NOT NULL CHECK (unit_price_cents > 0),
  total_price_cents BIGINT NOT NULL CHECK (total_price_cents > 0),

  -- Teslimat süresi (iş günü)
  delivery_time_days INTEGER NOT NULL CHECK (delivery_time_days > 0),

  -- Satıcı notu (opsiyonel — örn. "Fiyat 15 gün geçerli, kargo dahil değil")
  notes TEXT,

  -- Durum makinesi
  --   pending   : Teklif verildi, alıcı karar vermedi
  --   accepted  : Alıcı kabul etti → sipariş oluşturulacak
  --   rejected  : Alıcı reddetti
  --   expired   : RFQ süresi doldu, teklif otomatik pasif
  --   withdrawn : Satıcı teklifini geri çekti
  status TEXT NOT NULL DEFAULT 'pending' CHECK (
    status IN ('pending', 'accepted', 'rejected', 'expired', 'withdrawn')
  ),

  -- resulting_order_id BURAYA SONRA EKLENECEK:
  -- orders tablosu oluşturulduktan sonra:
  --   ALTER TABLE public.rfq_offers
  --     ADD COLUMN resulting_order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL;
  -- Bakınız: migration 000038_alter_rfq_offers_add_order_fk.sql (tahmini numara)

  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Bir satıcı bir RFQ'ya sadece bir teklif verebilir
  -- Faz 1 kararı: Her satıcı her RFQ için tek teklif verebilir.
  -- Teklif revizyonları ve çoklu teklif geçmişi Faz 2'de rfq_offer_revisions tablosu
  -- ile ele alınacaktır. Şu an withdrawn yapılan teklif yeniden gönderilemez.
  CONSTRAINT rfq_offers_unique_rfq_seller UNIQUE (rfq_id, seller_id)
);

-- RFQ'nun tüm teklifleri (alıcı liste görünümü için)
CREATE INDEX IF NOT EXISTS idx_rfq_offers_rfq_status
  ON public.rfq_offers (rfq_id, status);

-- Satıcının tüm teklifleri (satıcı panel için)
CREATE INDEX IF NOT EXISTS idx_rfq_offers_seller_status
  ON public.rfq_offers (seller_id, status);

CREATE INDEX IF NOT EXISTS idx_rfq_offers_created
  ON public.rfq_offers (created_at DESC);

COMMENT ON TABLE public.rfq_offers IS 'Satıcının RFQ teklifleri. resulting_order_id orders tablosu kurulduktan sonra ALTER TABLE ile eklenecek.';
COMMENT ON COLUMN public.rfq_offers.unit_price_cents IS 'Birim fiyat cent (BIGINT). Örn. 45000 = ₺450,00.';
