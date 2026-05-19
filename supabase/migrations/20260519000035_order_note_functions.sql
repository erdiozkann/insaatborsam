-- Migration: 20260519000035_order_note_functions.sql
-- Amaç: orders tablosunda buyer/seller not güncellemesi için SECURITY DEFINER RPC.
--
-- Neden SECURITY DEFINER?
--   RLS satır bazlı çalışır — authenticated kullanıcıya UPDATE policy verilirse
--   total_amount_cents, status, payment_status gibi kritik finansal alanlar da
--   değiştirilebilir. SECURITY DEFINER fonksiyon tam olarak hangi kolonu
--   güncelleyeceğini kontrol eder ve başkasına dokunmaz.
--
-- Güvenlik önlemleri:
--   - SET search_path = public, pg_temp (güvenli search_path)
--   - Yalnızca kendi siparişini güncelleyebilir (auth.uid() kontrolü)
--   - Not maks. 2000 karakter
--   - Sadece ilgili not kolonu + updated_at güncellenir
--   - REVOKE PUBLIC, sadece authenticated role'e EXECUTE

-- ═══════════════════════════════════════════
-- Alıcı sipariş notu güncelleme
-- ═══════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.update_buyer_order_note(
  p_order_id UUID,
  p_note     TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_buyer_id UUID;
BEGIN
  -- Not uzunluk kontrolü
  IF p_note IS NOT NULL AND length(p_note) > 2000 THEN
    RAISE EXCEPTION 'Not çok uzun: maksimum 2000 karakter (girilen: % karakter)',
      length(p_note);
  END IF;

  -- Geçerli kullanıcının buyer_profile.id'sini bul
  SELECT id INTO v_buyer_id
  FROM public.buyer_profiles
  WHERE user_id = auth.uid()
    AND deleted_at IS NULL;

  IF v_buyer_id IS NULL THEN
    RAISE EXCEPTION 'Alıcı profili bulunamadı veya erişim yetkiniz yok';
  END IF;

  -- Sadece buyer_notes + updated_at — başka kolon yok
  UPDATE public.orders
  SET
    buyer_notes = p_note,
    updated_at  = NOW()
  WHERE
    id       = p_order_id
    AND buyer_id = v_buyer_id;
    -- orders'ta deleted_at yok; cancelled/refunded siparişe not eklenebilir (bilinçli karar)

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Sipariş bulunamadı veya bu siparişin alıcısı değilsiniz (order_id: %)',
      p_order_id;
  END IF;
END;
$$;

-- PUBLIC erişimi kaldır, sadece authenticated
REVOKE ALL  ON FUNCTION public.update_buyer_order_note(UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.update_buyer_order_note(UUID, TEXT) TO authenticated;

COMMENT ON FUNCTION public.update_buyer_order_note(UUID, TEXT) IS
  'Alıcı kendi sipariş notunu günceller. SECURITY DEFINER — sadece buyer_notes + updated_at değişir.';

-- ═══════════════════════════════════════════
-- Satıcı sipariş notu güncelleme
-- ═══════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.update_seller_order_note(
  p_order_id UUID,
  p_note     TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_seller_id UUID;
BEGIN
  -- Not uzunluk kontrolü
  IF p_note IS NOT NULL AND length(p_note) > 2000 THEN
    RAISE EXCEPTION 'Not çok uzun: maksimum 2000 karakter (girilen: % karakter)',
      length(p_note);
  END IF;

  -- Geçerli kullanıcının seller_profile.id'sini bul
  SELECT id INTO v_seller_id
  FROM public.seller_profiles
  WHERE user_id = auth.uid()
    AND deleted_at IS NULL;

  IF v_seller_id IS NULL THEN
    RAISE EXCEPTION 'Satıcı profili bulunamadı veya erişim yetkiniz yok';
  END IF;

  -- Sadece seller_notes + updated_at — başka kolon yok
  UPDATE public.orders
  SET
    seller_notes = p_note,
    updated_at   = NOW()
  WHERE
    id        = p_order_id
    AND seller_id = v_seller_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Sipariş bulunamadı veya bu siparişin satıcısı değilsiniz (order_id: %)',
      p_order_id;
  END IF;
END;
$$;

-- PUBLIC erişimi kaldır, sadece authenticated
REVOKE ALL  ON FUNCTION public.update_seller_order_note(UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.update_seller_order_note(UUID, TEXT) TO authenticated;

COMMENT ON FUNCTION public.update_seller_order_note(UUID, TEXT) IS
  'Satıcı kendi sipariş notunu günceller. SECURITY DEFINER — sadece seller_notes + updated_at değişir.';
