-- Migration: 20260519000017_product_prices_rls.sql
-- Amaç: product_prices tablosu için RLS politikaları.
--
-- Politika özeti:
--   - Public read: parent ürün 'active' ise retail tier herkese açık;
--     wholesale/dealer tier sadece authenticated buyer'a açık.
--   - Owner CRUD: ürünün satıcısı fiyatları yönetir.
--
-- Not: Anonim kullanıcı toptan/bayi fiyatını görmemeli — pazarlık avantajı kaybolur.
-- Authenticated buyer wholesale görür ama dealer sadece sözleşmeli müşteriye —
-- bu ayrım Faz 2'de dealer_relationships tablosu ile çözülecek; şimdilik dealer
-- tier de authenticated rolüne açık (uygulama katmanında ek filtre uygular).

-- RLS'i aç
ALTER TABLE public.product_prices ENABLE ROW LEVEL SECURITY;

-- Önceki policy'leri temizle (idempotent)
DROP POLICY IF EXISTS "product_prices_public_read_retail" ON public.product_prices;
DROP POLICY IF EXISTS "product_prices_authenticated_read_all_tiers" ON public.product_prices;
DROP POLICY IF EXISTS "product_prices_select_own" ON public.product_prices;
DROP POLICY IF EXISTS "product_prices_insert_own" ON public.product_prices;
DROP POLICY IF EXISTS "product_prices_update_own" ON public.product_prices;
DROP POLICY IF EXISTS "product_prices_delete_own" ON public.product_prices;

-- SELECT (anon): yalnızca retail tier ve sadece aktif ürünler
CREATE POLICY "product_prices_public_read_retail"
  ON public.product_prices
  FOR SELECT
  TO anon
  USING (
    tier = 'retail'
    AND product_id IN (
      SELECT id FROM public.products
      WHERE status = 'active' AND deleted_at IS NULL
    )
  );

-- SELECT (authenticated): tüm tier'lar — sadece aktif ürünler için
-- (dealer tier'ı uygulama katmanında dealer_relationships ile filtrelenecek)
CREATE POLICY "product_prices_authenticated_read_all_tiers"
  ON public.product_prices
  FOR SELECT
  TO authenticated
  USING (
    product_id IN (
      SELECT id FROM public.products
      WHERE status = 'active' AND deleted_at IS NULL
    )
  );

-- SELECT (owner): satıcı kendi tüm ürünlerinin fiyatlarını her durumda görür
CREATE POLICY "product_prices_select_own"
  ON public.product_prices
  FOR SELECT
  TO authenticated
  USING (
    product_id IN (
      SELECT p.id FROM public.products p
      JOIN public.seller_profiles sp ON sp.id = p.seller_id
      WHERE sp.user_id = auth.uid()
    )
  );

-- INSERT: satıcı yalnızca kendi ürününe fiyat ekleyebilir
CREATE POLICY "product_prices_insert_own"
  ON public.product_prices
  FOR INSERT
  TO authenticated
  WITH CHECK (
    product_id IN (
      SELECT p.id FROM public.products p
      JOIN public.seller_profiles sp ON sp.id = p.seller_id
      WHERE sp.user_id = auth.uid()
    )
  );

-- UPDATE: satıcı kendi ürün fiyatlarını günceller
CREATE POLICY "product_prices_update_own"
  ON public.product_prices
  FOR UPDATE
  TO authenticated
  USING (
    product_id IN (
      SELECT p.id FROM public.products p
      JOIN public.seller_profiles sp ON sp.id = p.seller_id
      WHERE sp.user_id = auth.uid()
    )
  )
  WITH CHECK (
    product_id IN (
      SELECT p.id FROM public.products p
      JOIN public.seller_profiles sp ON sp.id = p.seller_id
      WHERE sp.user_id = auth.uid()
    )
  );

-- DELETE: satıcı kendi ürün fiyatını siler (hard delete OK — fiyat değişimi
-- audit'i ileride price_change_history ile yapılacak, şimdilik basit)
CREATE POLICY "product_prices_delete_own"
  ON public.product_prices
  FOR DELETE
  TO authenticated
  USING (
    product_id IN (
      SELECT p.id FROM public.products p
      JOIN public.seller_profiles sp ON sp.id = p.seller_id
      WHERE sp.user_id = auth.uid()
    )
  );
