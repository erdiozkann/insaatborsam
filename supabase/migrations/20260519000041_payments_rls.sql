-- Migration: 20260519000041_payments_rls.sql
-- Amaç: payments tablosu için RLS politikaları.
--
-- Politika özeti:
--   - Buyer SELECT: Kendi siparişlerinin veya aboneliklerinin ödemelerini görür.
--   - Seller SELECT: Kendi siparişlerinin ödemelerini görür.
--              (Seller'ın kendi membership abonelik ödemelerini de görmesi için
--               subscription_id üzerinden seller_profiles JOIN eklendi.)
--   - INSERT/UPDATE/DELETE: Hiçbir kullanıcıya açık değil.
--     Tüm mutasyonlar: Iyzico/Stripe webhook → Edge Function → service_role.
--
-- GÜVENLİK: provider_response JSONB'de PII olabilir (kart sahibi adı, vb.).
--   RLS ile kendi ödemesini gören kullanıcı bu veriyi de okur. Kritik PII'yi
--   (full kart no, CVV) zaten saklamıyoruz; card_last_four ve card_brand maskelenmiş.

-- RLS'i aç
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Önceki policy'leri temizle (idempotent)
DROP POLICY IF EXISTS "payments_select_buyer" ON public.payments;
DROP POLICY IF EXISTS "payments_select_seller" ON public.payments;

-- SELECT: Alıcı kendi sipariş ve abonelik ödemelerini görür
CREATE POLICY "payments_select_buyer"
  ON public.payments
  FOR SELECT
  TO authenticated
  USING (
    -- Sipariş ödemeleri: buyer'ın kendi siparişleri
    order_id IN (
      SELECT o.id FROM public.orders o
      JOIN public.buyer_profiles bp ON bp.id = o.buyer_id
      WHERE bp.user_id = auth.uid()
    )
    OR
    -- Abonelik ödemeleri: buyer'ın kendi abonelikleri
    subscription_id IN (
      SELECT s.id FROM public.subscriptions s
      JOIN public.buyer_profiles bp ON bp.id = s.buyer_id
      WHERE bp.user_id = auth.uid()
        AND bp.deleted_at IS NULL
    )
  );

-- SELECT: Satıcı kendi sipariş ve abonelik ödemelerini görür
CREATE POLICY "payments_select_seller"
  ON public.payments
  FOR SELECT
  TO authenticated
  USING (
    -- Sipariş ödemeleri: seller'ın kendi siparişleri
    order_id IN (
      SELECT o.id FROM public.orders o
      JOIN public.seller_profiles sp ON sp.id = o.seller_id
      WHERE sp.user_id = auth.uid()
    )
    OR
    -- Abonelik ödemeleri: seller'ın kendi üyelik abonelikleri
    subscription_id IN (
      SELECT s.id FROM public.subscriptions s
      JOIN public.seller_profiles sp ON sp.id = s.seller_id
      WHERE sp.user_id = auth.uid()
        AND sp.deleted_at IS NULL
    )
  );

-- INSERT/UPDATE/DELETE policy YOK — finansal veri sadece server-side trusted flow ile değişir.
