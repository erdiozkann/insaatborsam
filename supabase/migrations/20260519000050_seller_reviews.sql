-- Migration: 20260519000050_seller_reviews.sql
-- Amaç: Satıcı değerlendirmeleri — alıcı tarafından tamamlanan siparişten sonra.
--
-- Kısıtlamalar:
--   1. Sadece status='delivered' siparişi olan buyer review yazabilir.
--   2. Aynı sipariş + buyer kombinasyonu için tek review (UNIQUE).
--   3. Seller kendi review'ünü yazamaz (RLS WITH CHECK + CONSTRAINT).
--
-- Soft delete YOK — değerlendirme geçmişi platform güvenilirliği için saklanır.
-- UPDATE YOK — düzenleme Faz 2'de moderasyon + RPC ile gelecek.

CREATE TABLE IF NOT EXISTS public.seller_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Taraflar
  seller_id UUID NOT NULL REFERENCES public.seller_profiles(id) ON DELETE CASCADE,
  buyer_id  UUID NOT NULL REFERENCES public.buyer_profiles(id)  ON DELETE CASCADE,

  -- Kaynaklandığı sipariş (RESTRICT: review varken sipariş silinemez)
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE RESTRICT,

  -- Genel puan (1-5)
  rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),

  -- Yorum metni (opsiyonel)
  comment TEXT CHECK (comment IS NULL OR length(comment) <= 2000),

  -- Alt boyut puanları (opsiyonel — alıcı doldurmak zorunda değil)
  quality_rating       INT CHECK (quality_rating       IS NULL OR quality_rating       BETWEEN 1 AND 5),
  delivery_rating      INT CHECK (delivery_rating      IS NULL OR delivery_rating      BETWEEN 1 AND 5),
  communication_rating INT CHECK (communication_rating IS NULL OR communication_rating BETWEEN 1 AND 5),

  -- Doğrulanmış satın alma (tamamlanan sipariş → TRUE)
  -- Faz 1'de RLS WITH CHECK tamamlanmış sipariş zorunluluğunu sağlar.
  -- Manuel staff review'lerinde FALSE olabilir (service_role ile).
  is_verified_purchase BOOLEAN NOT NULL DEFAULT TRUE,

  -- Append-only — güncelleme yok, silme yok
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Aynı sipariş için aynı buyer sadece bir review yazabilir
  CONSTRAINT seller_reviews_unique_order_buyer UNIQUE (order_id, buyer_id),

  -- Satıcı kendi review'ünü yazamaz DB seviyesinde de kontrol edilsin
  -- (seller_id ve buyer_id için aynı profiles.user_id'ye sahip olamaz —
  --  uygulama katmanı + RLS WITH CHECK; DB FK ile tam enforce mümkün değil)
  -- Ek güvenlik: RLS policy "seller kendi review'ünü ekleyemez" ile sağlanır.

  -- Puanların makul aralıkta olduğu kontrol
  CONSTRAINT seller_reviews_rating_range_chk CHECK (rating BETWEEN 1 AND 5)
);

-- Satıcının tüm değerlendirmeleri (satıcı panel + public profil)
CREATE INDEX IF NOT EXISTS idx_seller_reviews_seller
  ON public.seller_reviews (seller_id, created_at DESC);

-- Alıcının yazdığı değerlendirmeler
CREATE INDEX IF NOT EXISTS idx_seller_reviews_buyer
  ON public.seller_reviews (buyer_id, created_at DESC);

-- Sipariş bazlı (bir siparişe review yazıldı mı?)
CREATE INDEX IF NOT EXISTS idx_seller_reviews_order
  ON public.seller_reviews (order_id);

-- Puan bazlı sıralama (yüksek puan filtreleme)
CREATE INDEX IF NOT EXISTS idx_seller_reviews_rating
  ON public.seller_reviews (seller_id, rating DESC);

COMMENT ON TABLE public.seller_reviews IS
  'Satıcı değerlendirmeleri. Sadece delivered sipariş sahibi buyer yazabilir. '
  'UNIQUE(order_id, buyer_id): aynı sipariş için tek review. '
  'Append-only — düzenleme Faz 2.';
COMMENT ON COLUMN public.seller_reviews.is_verified_purchase IS
  'TRUE = tamamlanan siparişten gelen review (RLS ile guarantee). '
  'FALSE = sadece service_role/staff müdahalesi ile olabilir.';
