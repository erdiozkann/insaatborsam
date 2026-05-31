-- Migration: 20260531000001_offer_lifecycle_rpc.sql
-- Amaç: Alıcı teklif lifecycle yazma tarafı — status CHECK genişletme + SECURITY DEFINER RPC.
--
-- Sprint 6.1. Sprint 6 salt-okumaydı; burada alıcı kendi RFQ'sine gelen teklifleri
-- shortlist / reject / accept_pending yapabilir. Sipariş/ödeme YOK.
--
-- Tasarım kararları (ön analiz):
--   - CHECK genişletilir: mevcut değerler KORUNUR, 'shortlisted' + 'accepted_pending_order' eklenir.
--     Eski veriler kırılmaz (backward compatible). 'accepted' de korunur (legacy uyum).
--   - Buyer DOĞRUDAN UPDATE yapmaz. rfq_offers'ta buyer UPDATE RLS policy YOKTUR ve
--     eklenmez. Bunun yerine SECURITY DEFINER RPC: tek noktadan ownership + whitelist +
--     alan kilidi. Bu, geniş bir UPDATE policy yüzeyi açmaktan daha güvenli.
--   - RPC yalnızca status + updated_at günceller. seller_id / rfq_id / fiyatlar /
--     resulting_order_id ASLA değişmez (UPDATE bunlara dokunmaz).
--   - Sipariş oluşturulmaz; accepted_pending_order yalnızca bir durumdur.

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. status CHECK constraint genişletme
-- ─────────────────────────────────────────────────────────────────────────────
-- 000028'de inline column CHECK olarak oluşturuldu → otomatik ad: rfq_offers_status_check.
-- DROP IF EXISTS + yeni ad ile ADD (idempotent). Eğer ad farklıysa migration uyarlanmalı.
ALTER TABLE public.rfq_offers
  DROP CONSTRAINT IF EXISTS rfq_offers_status_check;

ALTER TABLE public.rfq_offers
  ADD CONSTRAINT rfq_offers_status_check CHECK (
    status IN (
      'pending',                -- teklif verildi (submitted karşılığı)
      'shortlisted',            -- alıcı kısa listeye aldı (YENİ)
      'accepted',               -- legacy/uyum (yeni akışta kullanılmaz)
      'accepted_pending_order', -- alıcı seçti, sipariş aşaması bekleniyor (YENİ)
      'rejected',               -- alıcı reddetti
      'expired',                -- talep süresi doldu
      'withdrawn'               -- satıcı geri çekti
    )
  );

COMMENT ON CONSTRAINT rfq_offers_status_check ON public.rfq_offers IS
  'Sprint 6.1: lifecycle değerleri shortlisted + accepted_pending_order eklendi. '
  'Mevcut değerler korunur (backward compatible).';

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. SECURITY DEFINER RPC: alıcı kendi RFQ teklifinin durumunu değiştirir
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.set_rfq_offer_status(
  p_offer_id   UUID,
  p_next_status TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_buyer_id     UUID;
  v_rfq_buyer_id UUID;
BEGIN
  -- Whitelist: alıcı yalnızca bu üç hedef duruma geçirebilir.
  IF p_next_status NOT IN ('shortlisted', 'rejected', 'accepted_pending_order') THEN
    RAISE EXCEPTION 'Gecersiz teklif durumu' USING ERRCODE = 'check_violation';
  END IF;

  -- Çağıran kullanıcının buyer profili (yoksa = alıcı değil → satıcı/anon engellenir).
  SELECT id INTO v_buyer_id
  FROM public.buyer_profiles
  WHERE user_id = auth.uid();

  IF v_buyer_id IS NULL THEN
    RAISE EXCEPTION 'Yetkisiz islem' USING ERRCODE = 'insufficient_privilege';
  END IF;

  -- Teklifin bağlı olduğu RFQ'nun sahibi (alıcısı).
  SELECT r.buyer_id INTO v_rfq_buyer_id
  FROM public.rfq_offers o
  JOIN public.rfqs r ON r.id = o.rfq_id
  WHERE o.id = p_offer_id
    AND r.deleted_at IS NULL;

  IF v_rfq_buyer_id IS NULL THEN
    RAISE EXCEPTION 'Teklif bulunamadi' USING ERRCODE = 'no_data_found';
  END IF;

  -- Ownership: yalnızca RFQ sahibi alıcı bu teklifi yönetebilir (IDOR koruması).
  IF v_rfq_buyer_id <> v_buyer_id THEN
    RAISE EXCEPTION 'Bu teklif uzerinde yetkiniz yok' USING ERRCODE = 'insufficient_privilege';
  END IF;

  -- Yalnızca status + updated_at güncellenir.
  -- seller_id / rfq_id / unit_price_cents / total_price_cents / resulting_order_id
  -- bilinçli olarak DOKUNULMAZ.
  UPDATE public.rfq_offers
  SET status     = p_next_status,
      updated_at = NOW()
  WHERE id = p_offer_id;
END;
$$;

-- Erişim: yalnızca authenticated; ownership fonksiyon içinde auth.uid() ile zorunlu.
REVOKE ALL ON FUNCTION public.set_rfq_offer_status(UUID, TEXT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.set_rfq_offer_status(UUID, TEXT) FROM anon;
GRANT EXECUTE ON FUNCTION public.set_rfq_offer_status(UUID, TEXT) TO authenticated;

COMMENT ON FUNCTION public.set_rfq_offer_status(UUID, TEXT) IS
  'Alıcı kendi RFQ''sine gelen teklifin durumunu değiştirir (shortlisted/rejected/'
  'accepted_pending_order). SECURITY DEFINER: ownership + whitelist içeride zorunlu. '
  'Sadece status + updated_at günceller; seller_id/rfq_id/fiyat/resulting_order_id dokunulmaz. '
  'Sipariş oluşturmaz.';
