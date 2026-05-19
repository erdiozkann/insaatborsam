-- Migration: 20260519000032_alter_rfq_offers_add_order_fk.sql
-- Amaç: Döngüsel FK çözümü — rfq_offers.resulting_order_id ekleniyor.
--
-- NEDEN AYRI MIGRATION?
--   rfq_offers (000028) ve orders (000030) arasında döngüsel FK var:
--     rfq_offers.resulting_order_id → orders.id
--     orders.source_offer_id → rfq_offers.id
--   İkisi aynı anda yaratılamaz. Çözüm: önce iki tablo sırasıyla oluşturuldu
--   (rfq_offers → orders sırası, orders'ta source_offer_id FK var),
--   şimdi rfq_offers'a geri yönlü FK ekleniyor.
--
-- İdempotent: ADD COLUMN IF NOT EXISTS Postgres 15+'da destekleniyor.

ALTER TABLE public.rfq_offers
  ADD COLUMN IF NOT EXISTS resulting_order_id UUID
    REFERENCES public.orders(id) ON DELETE SET NULL;

-- Kabul edilen teklifleri hızlı bulmak için index
CREATE INDEX IF NOT EXISTS idx_rfq_offers_resulting_order
  ON public.rfq_offers (resulting_order_id)
  WHERE resulting_order_id IS NOT NULL;

COMMENT ON COLUMN public.rfq_offers.resulting_order_id IS
  'Teklif kabul edildiğinde oluşan siparişin referansı. '
  'NULL = henüz sipariş oluşturulmadı veya teklif kabul edilmedi. '
  'ON DELETE SET NULL: sipariş iptal/silinirse teklif kaydı silinmez.';
