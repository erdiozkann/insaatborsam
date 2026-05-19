-- Migration: 20260519000034_order_items_rls.sql
-- Amaç: order_items tablosu için RLS politikaları.
--
-- Politika özeti:
--   - Buyer SELECT: Kendi siparişlerinin kalemlerini görür.
--   - Seller SELECT: Kendi siparişlerinin kalemlerini görür.
--   - INSERT: Alıcı sipariş oluştururken kalem ekleyebilir.
--             RFQ akışında Edge Function (service_role) ekler.
--   - UPDATE/DELETE: Yok — immutable snapshot prensibi.

-- RLS'i aç
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Önceki policy'leri temizle (idempotent)
DROP POLICY IF EXISTS "order_items_select_buyer" ON public.order_items;
DROP POLICY IF EXISTS "order_items_select_seller" ON public.order_items;
DROP POLICY IF EXISTS "order_items_insert_buyer" ON public.order_items;

-- SELECT: Alıcı kendi siparişlerinin kalemlerini görür
CREATE POLICY "order_items_select_buyer"
  ON public.order_items
  FOR SELECT
  TO authenticated
  USING (
    order_id IN (
      SELECT o.id FROM public.orders o
      JOIN public.buyer_profiles bp ON bp.id = o.buyer_id
      WHERE bp.user_id = auth.uid()
    )
  );

-- SELECT: Satıcı kendi siparişlerinin kalemlerini görür
CREATE POLICY "order_items_select_seller"
  ON public.order_items
  FOR SELECT
  TO authenticated
  USING (
    order_id IN (
      SELECT o.id FROM public.orders o
      JOIN public.seller_profiles sp ON sp.id = o.seller_id
      WHERE sp.user_id = auth.uid()
    )
  );

-- INSERT: Alıcı kendi siparişine kalem ekleyebilir
-- (Sipariş sadece pending_payment aşamasında değiştirilebilir — uygulama katmanı kontrol)
CREATE POLICY "order_items_insert_buyer"
  ON public.order_items
  FOR INSERT
  TO authenticated
  WITH CHECK (
    order_id IN (
      SELECT o.id FROM public.orders o
      JOIN public.buyer_profiles bp ON bp.id = o.buyer_id
      WHERE bp.user_id = auth.uid()
        AND o.status = 'pending_payment'
    )
  );

-- UPDATE/DELETE policy YOK — immutable snapshot. Sadece service_role ile.
