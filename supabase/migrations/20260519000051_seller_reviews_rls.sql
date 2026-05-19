-- Migration: 20260519000051_seller_reviews_rls.sql
-- Amaç: seller_reviews tablosu için RLS politikaları.
--
-- Politika özeti:
--   - Public read: Doğrulanmış satın alım review'leri herkese açık (platform şeffaflığı).
--   - Buyer SELECT own: Alıcı kendi yazdığı review'leri görür.
--   - Seller SELECT: Satıcı hakkında yazılmış tüm review'leri görür.
--   - INSERT: Sadece delivered sipariş sahibi alıcı yazabilir.
--     Kısıtlamalar:
--       a) buyer_id kendi profili olmalı.
--       b) order_id delivered status'te ve kendi siparişi olmalı.
--       c) order'ın seller_id'si review'deki seller_id ile eşleşmeli.
--       d) Satıcı kendi review'ünü yazamaz (kendi seller_profiles.id'sini hedef alamaz).
--   - UPDATE: Yok — düzenleme Faz 2 RPC ile.
--   - DELETE: Yok — review geçmişi saklanır (sadece staff/service_role müdahale).

-- RLS'i aç
ALTER TABLE public.seller_reviews ENABLE ROW LEVEL SECURITY;

-- Önceki policy'leri temizle (idempotent)
DROP POLICY IF EXISTS "seller_reviews_public_read_verified" ON public.seller_reviews;
DROP POLICY IF EXISTS "seller_reviews_select_own_buyer" ON public.seller_reviews;
DROP POLICY IF EXISTS "seller_reviews_select_about_seller" ON public.seller_reviews;
DROP POLICY IF EXISTS "seller_reviews_insert_buyer_verified" ON public.seller_reviews;

-- SELECT (public): Doğrulanmış satın alım review'leri herkese açık (anon dahil)
CREATE POLICY "seller_reviews_public_read_verified"
  ON public.seller_reviews
  FOR SELECT
  TO anon, authenticated
  USING (is_verified_purchase = TRUE);

-- SELECT (buyer own): Alıcı kendi yazdığı review'leri görür (doğrulanmamış dahil)
CREATE POLICY "seller_reviews_select_own_buyer"
  ON public.seller_reviews
  FOR SELECT
  TO authenticated
  USING (
    buyer_id IN (
      SELECT id FROM public.buyer_profiles WHERE user_id = auth.uid()
    )
  );

-- SELECT (seller about): Satıcı hakkında yazılmış tüm review'leri görür
CREATE POLICY "seller_reviews_select_about_seller"
  ON public.seller_reviews
  FOR SELECT
  TO authenticated
  USING (
    seller_id IN (
      SELECT id FROM public.seller_profiles WHERE user_id = auth.uid()
    )
  );

-- INSERT: Sadece tamamlanmış siparişin sahibi alıcı review yazabilir
CREATE POLICY "seller_reviews_insert_buyer_verified"
  ON public.seller_reviews
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- (a) Kendi buyer_profile.id ile review yazıyor
    buyer_id IN (
      SELECT id FROM public.buyer_profiles
      WHERE user_id = auth.uid() AND deleted_at IS NULL
    )
    -- (b) + (c) Sipariş delivered, kendi siparişi, doğru seller
    AND EXISTS (
      SELECT 1 FROM public.orders o
      JOIN public.buyer_profiles bp ON bp.id = o.buyer_id
      WHERE o.id    = order_id        -- NEW row'dan order_id
        AND bp.user_id = auth.uid()   -- kendi siparişi
        AND o.status   = 'delivered'  -- tamamlanmış olmalı
        AND o.seller_id = seller_id   -- NEW row'dan seller_id ile eşleşmeli
    )
    -- (d) Satıcı kendi review'ünü yazamaz
    AND seller_id NOT IN (
      SELECT id FROM public.seller_profiles WHERE user_id = auth.uid()
    )
  );

-- UPDATE policy YOK — append-only review. Faz 2 moderasyon/edit için ayrı RPC.
-- DELETE policy YOK — review geçmişi saklanır. Staff müdahalesi service_role ile.
