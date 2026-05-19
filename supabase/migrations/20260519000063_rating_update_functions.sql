-- Migration: 20260519000063_rating_update_functions.sql
-- Amaç: seller_reviews INSERT sonrası seller_profiles rating cache otomatik güncellenir.
--
-- Mevcut seller_profiles kolonları (000004_seller_profiles.sql'den):
--   rating_avg   NUMERIC(3,2) DEFAULT 0  — ortalama puan (0.00–5.00)
--   rating_count INTEGER      DEFAULT 0  — değerlendirme sayısı
-- (successful_orders_count ayrı trigger ile güncellenecek — Faz 2)
--
-- Hesaplama kuralı: YALNIZCA is_verified_purchase = TRUE olan review'lar.
-- seller_reviews append-only olduğundan INSERT trigger yeterli.
-- UPDATE/DELETE trigger yok (review değiştirilemiyor, silinemiyor).
--
-- SECURITY DEFINER: seller_reviews ve seller_profiles tablolarına
-- authenticated kullanıcı yetkisi olmadan erişmek için.

CREATE OR REPLACE FUNCTION public.update_seller_rating_on_review()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_new_avg   NUMERIC(3,2);
  v_new_count INTEGER;
BEGIN
  -- Yalnızca doğrulanmış satın alım review'larını say
  SELECT
    COALESCE(ROUND(AVG(rating)::NUMERIC, 2), 0.00),
    COUNT(*)::INTEGER
  INTO
    v_new_avg,
    v_new_count
  FROM public.seller_reviews
  WHERE seller_id = NEW.seller_id
    AND is_verified_purchase = TRUE;

  -- seller_profiles rating cache güncelle
  UPDATE public.seller_profiles
  SET
    rating_avg   = v_new_avg,
    rating_count = v_new_count,
    updated_at   = NOW()
  WHERE id = NEW.seller_id;

  -- UPDATE etkilenen satır yoksa sessiz geç (satıcı profilini henüz silinmiş — nadir durum)
  RETURN NEW;
END;
$$;

REVOKE ALL  ON FUNCTION public.update_seller_rating_on_review() FROM PUBLIC;

COMMENT ON FUNCTION public.update_seller_rating_on_review() IS
  'seller_reviews INSERT sonrası seller_profiles.rating_avg ve rating_count cache günceller. '
  'Yalnızca is_verified_purchase=TRUE review''lar hesaba katılır.';

-- Trigger: seller_reviews INSERT sonrası
DROP TRIGGER IF EXISTS trg_update_seller_rating ON public.seller_reviews;
CREATE TRIGGER trg_update_seller_rating
  AFTER INSERT ON public.seller_reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.update_seller_rating_on_review();
