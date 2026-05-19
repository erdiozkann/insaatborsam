-- Migration: 20260519000030_orders.sql
-- Amaç: Sipariş ana tablosu.
-- Hem RFQ akışından (buyer accepts rfq_offer) hem direkt satın alımdan oluşur.
--
-- Para kolonları: BIGINT *_cents (CLAUDE.md kuralı).
-- Miktar (quantity): NUMERIC(12,2) — order_items tablosunda.
-- Soft delete YOK — sipariş finansal/yasal kayıttır (10 yıl saklama, KVKK).
-- İptal: status = 'cancelled'. Silme: asla.

-- Sipariş numarası için sequence (ORD-00001-3F formatı)
CREATE SEQUENCE IF NOT EXISTS public.order_number_seq
  START WITH 1000
  INCREMENT BY 1
  NO CYCLE;

CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Sipariş numarası — trigger ile otomatik set edilir (ORD-NNNNN-XX)
  order_number TEXT UNIQUE,

  -- Taraflar
  buyer_id  UUID NOT NULL REFERENCES public.buyer_profiles(id) ON DELETE RESTRICT,
  seller_id UUID NOT NULL REFERENCES public.seller_profiles(id) ON DELETE RESTRICT,

  -- RFQ akışından geliyorsa kaynak referansları (her ikisi opsiyonel)
  source_rfq_id UUID REFERENCES public.rfqs(id) ON DELETE SET NULL,
  -- Kabul edilen teklif referansı (accepted rfq offer)
  source_offer_id UUID REFERENCES public.rfq_offers(id) ON DELETE SET NULL,

  -- Tutarlar (BIGINT cent)
  subtotal_cents           BIGINT NOT NULL CHECK (subtotal_cents >= 0),
  shipping_cost_cents      BIGINT NOT NULL DEFAULT 0 CHECK (shipping_cost_cents >= 0),
  tax_amount_cents         BIGINT NOT NULL DEFAULT 0 CHECK (tax_amount_cents >= 0),
  total_amount_cents       BIGINT NOT NULL CHECK (total_amount_cents > 0),
  platform_commission_cents BIGINT NOT NULL DEFAULT 0 CHECK (platform_commission_cents >= 0),
  currency TEXT NOT NULL DEFAULT 'TRY' CHECK (currency IN ('TRY', 'EUR', 'USD')),

  -- Kontrol: total = subtotal + shipping + tax (uygulama katmanında da doğrulanır)
  CONSTRAINT orders_total_consistency_chk CHECK (
    total_amount_cents = subtotal_cents + shipping_cost_cents + tax_amount_cents
  ),

  -- Teslimat
  -- ON DELETE RESTRICT: teslimat adresi silinmeden önce siparişler temizlenmeli.
  -- (Adresi soft-delete yapınca bu kısıtlama devreye girmez — sadece hard delete'te.)
  delivery_address_id UUID NOT NULL REFERENCES public.addresses(id) ON DELETE RESTRICT,

  shipping_method TEXT CHECK (
    shipping_method IS NULL OR shipping_method IN ('seller_own', 'platform_cargo')
  ),
  estimated_delivery_at TIMESTAMPTZ,
  delivered_at          TIMESTAMPTZ,

  -- Sipariş durum makinesi
  --   pending_payment → paid → confirmed → preparing → ready_to_ship
  --   → shipped → delivered   (başarılı yol)
  --   → cancelled             (herhangi bir noktada)
  --   → refunded              (paid sonrası)
  status TEXT NOT NULL DEFAULT 'pending_payment' CHECK (
    status IN (
      'pending_payment', 'paid', 'confirmed', 'preparing',
      'ready_to_ship', 'shipped', 'delivered', 'cancelled', 'refunded'
    )
  ),

  -- Ödeme durumu (payments tablosu Sprint 3'te eklenecek; şimdi enum yeterli)
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (
    payment_status IN ('pending', 'paid', 'failed', 'refunded')
  ),

  -- Notlar
  buyer_notes    TEXT,  -- Alıcı notu (teslimat talebi vb.)
  seller_notes   TEXT,  -- Satıcı notu (müşteriye görünür)
  internal_notes TEXT,  -- Sadece staff görür — sütun güvenliği RLS ile değil,
                        -- uygulama katmanında service_role sorgusuyla çözülür.

  -- Audit (deleted_at YOK — yasal saklama zorunluluğu)
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────
-- GÜVENLİK NOTU: Buyer/seller için doğrudan orders UPDATE kapalıdır.
-- RLS satır bazlı çalışır — UPDATE policy verilirse buyer/seller
-- total_amount_cents, status, payment_status, internal_notes gibi
-- kritik finansal alanları da değiştirebilir.
--
-- Not güncellemeleri SECURITY DEFINER RPC fonksiyonları üzerinden yapılır:
--   public.update_buyer_order_note(order_id, note)
--   public.update_seller_order_note(order_id, note)
-- Bakınız: 000035_order_note_functions.sql
--
-- Kritik finansal ve durum alanları sadece server-side trusted flow
-- (Edge Function + service_role) ile güncellenir.
-- ─────────────────────────────────────────────────────────────

-- Otomatik sipariş numarası üretici fonksiyon
CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.order_number IS NULL OR NEW.order_number = '' THEN
    NEW.order_number :=
      'ORD-' ||
      LPAD(nextval('public.order_number_seq')::TEXT, 5, '0') || '-' ||
      UPPER(SUBSTRING(MD5(gen_random_uuid()::TEXT) FROM 1 FOR 2));
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger: INSERT sırasında order_number NULL ise otomatik set et
DROP TRIGGER IF EXISTS trigger_set_order_number ON public.orders;
CREATE TRIGGER trigger_set_order_number
  BEFORE INSERT ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_order_number();

-- Index'ler
CREATE INDEX IF NOT EXISTS idx_orders_buyer
  ON public.orders (buyer_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_orders_seller
  ON public.orders (seller_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_orders_status
  ON public.orders (status);

CREATE INDEX IF NOT EXISTS idx_orders_payment_status
  ON public.orders (payment_status) WHERE payment_status = 'pending';

CREATE INDEX IF NOT EXISTS idx_orders_source_rfq
  ON public.orders (source_rfq_id) WHERE source_rfq_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_orders_created
  ON public.orders (created_at DESC);

COMMENT ON TABLE public.orders IS 'Sipariş ana tablosu. Hem RFQ akışından hem direkt satın alımdan oluşur. Yasal: 10 yıl saklama, soft delete yok.';
COMMENT ON COLUMN public.orders.source_offer_id IS 'Kabul edilen rfq_offer referansı. NULL = direkt satın alım (RFQ akışı değil).';
COMMENT ON COLUMN public.orders.internal_notes IS 'Sadece staff görür. Sütun güvenliği RLS ile değil, service_role sorgusu ile sağlanır (Faz 1 kararı).';
COMMENT ON COLUMN public.orders.platform_commission_cents IS 'Platform komisyonu — Iyzico/Stripe subaccount ile otomatik kesilir (Faz 2 entegrasyon).';
