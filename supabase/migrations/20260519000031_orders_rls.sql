-- Migration: 20260519000031_orders_rls.sql
-- Amaç: orders tablosu için RLS politikaları.
--
-- Politika özeti:
--   - Buyer SELECT: Alıcı kendi siparişlerini görür.
--   - Seller SELECT: Satıcı kendi siparişlerini görür.
--   - INSERT: Alıcı yeni sipariş oluşturabilir (buyer_id kendi profile'ı).
--              RFQ akışında Edge Function (service_role) da oluşturur.
--   - UPDATE: YOK — buyer/seller için doğrudan UPDATE kapalı.
--             Not güncellemeleri SECURITY DEFINER RPC ile yapılır (000035).
--             Status/ödeme/tutar değişiklikleri sadece service_role ile.
--   - DELETE: Yok — yasal saklama zorunluluğu (10 yıl).
--
-- GÜVENLİK NEDENİ: RLS satır bazlı çalışır. UPDATE policy verilseydi
-- buyer/seller total_amount_cents, status, payment_status gibi kritik
-- finansal alanları doğrudan değiştirebilirdi.

-- RLS'i aç
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Önceki policy'leri temizle (idempotent)
DROP POLICY IF EXISTS "orders_select_buyer" ON public.orders;
DROP POLICY IF EXISTS "orders_select_seller" ON public.orders;
DROP POLICY IF EXISTS "orders_insert_buyer" ON public.orders;
-- UPDATE policy'leri temizle (önceden yazılmışsa)
DROP POLICY IF EXISTS "orders_update_buyer_notes" ON public.orders;
DROP POLICY IF EXISTS "orders_update_seller_notes" ON public.orders;

-- SELECT: Alıcı kendi siparişlerini görür
CREATE POLICY "orders_select_buyer"
  ON public.orders
  FOR SELECT
  TO authenticated
  USING (
    buyer_id IN (
      SELECT id FROM public.buyer_profiles WHERE user_id = auth.uid()
    )
  );

-- SELECT: Satıcı kendi siparişlerini görür
CREATE POLICY "orders_select_seller"
  ON public.orders
  FOR SELECT
  TO authenticated
  USING (
    seller_id IN (
      SELECT id FROM public.seller_profiles WHERE user_id = auth.uid()
    )
  );

-- INSERT: Alıcı kendi buyer_profile.id ile sipariş oluşturabilir
-- (Direkt satın alım akışı. RFQ akışı → Edge Function service_role kullanır.)
CREATE POLICY "orders_insert_buyer"
  ON public.orders
  FOR INSERT
  TO authenticated
  WITH CHECK (
    buyer_id IN (
      SELECT id FROM public.buyer_profiles WHERE user_id = auth.uid()
    )
  );

-- UPDATE policy YOK — kasıtlı güvenlik kararı.
-- Not güncellemeleri: public.update_buyer_order_note / update_seller_order_note (000035)
-- Status geçişleri: Edge Function + service_role
-- Finansal alanlar: sadece server-side trusted flow

-- DELETE policy YOK — yasal zorunluluk, hiçbir koşulda hard delete yok.
-- İptal: service_role ile status = 'cancelled'.
