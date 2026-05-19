-- Migration: 20260519000029_rfq_offers_rls.sql
-- Amaç: rfq_offers tablosu için RLS politikaları.
--
-- Gizli teklif prensibi:
--   Satıcılar birbirinin teklifini GÖREMEZ. Alıcı tüm teklifleri görür.
--   Bu B2B marketplace'in temel rekabet dinamiği — ihlali iş modelini bozar.
--
-- Politika özeti:
--   - Buyer SELECT: Alıcı kendi rfq'larına gelen tüm teklifleri görür.
--   - Seller SELECT (own): Satıcı sadece kendi teklifini görür.
--   - Seller INSERT: Davetli satıcı teklif verebilir (invitation status kontrolü).
--   - Seller UPDATE: Satıcı pending teklifini güncelleyebilir (revise) veya çekebilir.
--   - DELETE: Yok — withdrawn status ile soft invalidate.

-- RLS'i aç
ALTER TABLE public.rfq_offers ENABLE ROW LEVEL SECURITY;

-- Önceki policy'leri temizle (idempotent)
DROP POLICY IF EXISTS "rfq_offers_select_buyer" ON public.rfq_offers;
DROP POLICY IF EXISTS "rfq_offers_select_own_seller" ON public.rfq_offers;
DROP POLICY IF EXISTS "rfq_offers_insert_invited_seller" ON public.rfq_offers;
DROP POLICY IF EXISTS "rfq_offers_update_own_seller" ON public.rfq_offers;

-- SELECT: Alıcı kendi rfq'larına gelen teklifleri görür
CREATE POLICY "rfq_offers_select_buyer"
  ON public.rfq_offers
  FOR SELECT
  TO authenticated
  USING (
    rfq_id IN (
      SELECT r.id FROM public.rfqs r
      JOIN public.buyer_profiles bp ON bp.id = r.buyer_id
      WHERE bp.user_id = auth.uid()
    )
  );

-- SELECT: Satıcı sadece kendi teklifini görür (başkasının teklifini GÖREMEz)
CREATE POLICY "rfq_offers_select_own_seller"
  ON public.rfq_offers
  FOR SELECT
  TO authenticated
  USING (
    seller_id IN (
      SELECT id FROM public.seller_profiles WHERE user_id = auth.uid()
    )
  );

-- INSERT: Satıcı teklif verebilmek için davet edilmiş olmalı
-- (rfq_invitations.status IN ('invited','seen') — 'responded' değilse henüz teklif vermemiş)
CREATE POLICY "rfq_offers_insert_invited_seller"
  ON public.rfq_offers
  FOR INSERT
  TO authenticated
  WITH CHECK (
    seller_id IN (
      SELECT id FROM public.seller_profiles WHERE user_id = auth.uid()
    )
    AND rfq_id IN (
      SELECT inv.rfq_id
      FROM public.rfq_invitations inv
      JOIN public.seller_profiles sp ON sp.id = inv.seller_id
      WHERE sp.user_id = auth.uid()
        AND inv.status IN ('invited', 'seen')
    )
    -- Yalnızca açık RFQ'ya teklif verilebilir
    AND rfq_id IN (
      SELECT id FROM public.rfqs
      WHERE status IN ('open', 'evaluating') AND deleted_at IS NULL
    )
  );

-- UPDATE: Satıcı kendi pending teklifini güncelleyebilir (revize veya withdraw)
-- status = 'withdrawn' set etmek satıcı tarafından yapılabilir.
-- status = 'accepted'/'rejected' set etmek alıcı tarafından — bu policy USING
-- içinde seller kontrolü yaptığından alıcı bu policy ile UPDATE yapamaz.
CREATE POLICY "rfq_offers_update_own_seller"
  ON public.rfq_offers
  FOR UPDATE
  TO authenticated
  USING (
    seller_id IN (
      SELECT id FROM public.seller_profiles WHERE user_id = auth.uid()
    )
    AND status IN ('pending')   -- sadece pending teklif revize edilebilir
  )
  WITH CHECK (
    seller_id IN (
      SELECT id FROM public.seller_profiles WHERE user_id = auth.uid()
    )
    -- Satıcı sadece 'withdrawn' veya 'pending' set edebilir — accepted/rejected/expired yasak
    AND status IN ('pending', 'withdrawn')
  );

-- DELETE policy YOK — withdrawn status ile geçersiz kılınır.
