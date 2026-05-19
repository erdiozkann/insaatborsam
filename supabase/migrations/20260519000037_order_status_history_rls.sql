-- Migration: 20260519000037_order_status_history_rls.sql
-- Amaç: order_status_history tablosu için RLS politikaları.
--
-- Politika özeti:
--   - Buyer SELECT: Alıcı kendi sipariş geçmişini görür.
--   - Seller SELECT: Satıcı kendi sipariş geçmişini görür.
--   - INSERT: Kullanıcıya KAPALI — sadece service_role / Edge Function.
--             Durum geçişi hiçbir zaman client-side ile tetiklenmez.
--   - UPDATE/DELETE: Yok — append-only denetim günlüğü, değiştirilemez.

-- RLS'i aç
ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;

-- Önceki policy'leri temizle (idempotent)
DROP POLICY IF EXISTS "order_status_history_select_buyer" ON public.order_status_history;
DROP POLICY IF EXISTS "order_status_history_select_seller" ON public.order_status_history;

-- SELECT: Alıcı kendi siparişlerinin durum geçmişini görür
CREATE POLICY "order_status_history_select_buyer"
  ON public.order_status_history
  FOR SELECT
  TO authenticated
  USING (
    order_id IN (
      SELECT o.id FROM public.orders o
      JOIN public.buyer_profiles bp ON bp.id = o.buyer_id
      WHERE bp.user_id = auth.uid()
    )
  );

-- SELECT: Satıcı kendi siparişlerinin durum geçmişini görür
CREATE POLICY "order_status_history_select_seller"
  ON public.order_status_history
  FOR SELECT
  TO authenticated
  USING (
    order_id IN (
      SELECT o.id FROM public.orders o
      JOIN public.seller_profiles sp ON sp.id = o.seller_id
      WHERE sp.user_id = auth.uid()
    )
  );

-- INSERT/UPDATE/DELETE policy YOK.
-- Durum geçişleri yalnızca Edge Function (service_role) tarafından kaydedilir.
-- Uygulama akışı: order status değiştiğinde Edge Function önce orders.status günceller,
-- sonra order_status_history INSERT eder (atomik, transaction içinde).
