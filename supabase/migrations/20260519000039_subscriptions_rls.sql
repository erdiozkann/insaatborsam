-- Migration: 20260519000039_subscriptions_rls.sql
-- Amaç: subscriptions tablosu için RLS politikaları.
--
-- Politika özeti:
--   - Buyer SELECT: Alıcı kendi aboneliklerini görür.
--   - Seller SELECT: Satıcı kendi aboneliklerini görür.
--   - INSERT/UPDATE/DELETE: Kullanıcıya KAPALI.
--
-- Neden INSERT/UPDATE/DELETE yok?
--   Abonelik yaratma/güncelleme/iptal akışı:
--     1. Kullanıcı web sitesinde (insaatborsam.com) ödeme başlatır.
--     2. Stripe/Iyzico ödemeyi işler.
--     3. Webhook Edge Function'a çağrı yapar (service_role).
--     4. Edge Function subscriptions tablosunu günceller.
--   Hiçbir adımda client-side Supabase insert/update kullanılmaz.
--
-- Apple/Google uyumluluk notu:
--   Mobil uygulama (buyer/seller app) bu tabloyu okuyabilir (SELECT).
--   Ancak yazmak için herhangi bir UI yok ve RLS yazma politikası da tanımlı değil.

-- RLS'i aç
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Önceki policy'leri temizle (idempotent)
DROP POLICY IF EXISTS "subscriptions_select_buyer" ON public.subscriptions;
DROP POLICY IF EXISTS "subscriptions_select_seller" ON public.subscriptions;

-- SELECT: Alıcı kendi aboneliklerini görür
CREATE POLICY "subscriptions_select_buyer"
  ON public.subscriptions
  FOR SELECT
  TO authenticated
  USING (
    buyer_id IN (
      SELECT id FROM public.buyer_profiles
      WHERE user_id = auth.uid()
        AND deleted_at IS NULL
    )
  );

-- SELECT: Satıcı kendi aboneliklerini görür
CREATE POLICY "subscriptions_select_seller"
  ON public.subscriptions
  FOR SELECT
  TO authenticated
  USING (
    seller_id IN (
      SELECT id FROM public.seller_profiles
      WHERE user_id = auth.uid()
        AND deleted_at IS NULL
    )
  );

-- INSERT policy YOK — web checkout → Stripe/Iyzico webhook → Edge Function.
-- UPDATE policy YOK — abonelik değişikliği sadece webhook ile yapılır.
-- DELETE policy YOK — finansal kayıt silinmez (yasal zorunluluk).
--
-- Staff erişimi: 000034_staff_access_policies.sql (sonraki sprint) ile eklenecek.
