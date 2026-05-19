-- Migration: 20260519000027_rfq_invitations_rls.sql
-- Amaç: rfq_invitations RLS + rfqs/rfq_items satıcı erişim policy'leri.
--
-- Bu dosya ÜÇ tabloya policy ekler:
--   1. rfq_invitations — davet tablosu RLS
--   2. rfqs — satıcı erişim policy (000023'te ertelenendi: rfq_invitations yoktu)
--   3. rfq_items — satıcı erişim policy (000025'te ertelenenmişti: rfq_invitations yoktu)
--
-- Satıcı erişim prensibi:
--   Davetli satıcı (rfq_invitations.seller_id = kendi id'si) talep içeriğini görür.
--   Fiyat teklifi verebilmesi için RFQ + kalemleri okuyabilmeli.
--   Başka satıcının teklifini/fiyatını GÖREMEz (gizli teklif prensibi — rfq_offers'ta).

-- ═══════════════════════════════════════════
-- 1. rfq_invitations RLS
-- ═══════════════════════════════════════════

ALTER TABLE public.rfq_invitations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "rfq_invitations_select_seller" ON public.rfq_invitations;
DROP POLICY IF EXISTS "rfq_invitations_select_buyer" ON public.rfq_invitations;
DROP POLICY IF EXISTS "rfq_invitations_update_seller_seen" ON public.rfq_invitations;

-- SELECT: Satıcı kendi davetlerini görür
CREATE POLICY "rfq_invitations_select_seller"
  ON public.rfq_invitations
  FOR SELECT
  TO authenticated
  USING (
    seller_id IN (
      SELECT id FROM public.seller_profiles WHERE user_id = auth.uid()
    )
  );

-- SELECT: Alıcı kendi RFQ'larına yapılan davetlerin listesini görür
-- (kaç satıcıya gönderildi, kimler yanıtladı)
CREATE POLICY "rfq_invitations_select_buyer"
  ON public.rfq_invitations
  FOR SELECT
  TO authenticated
  USING (
    rfq_id IN (
      SELECT r.id FROM public.rfqs r
      JOIN public.buyer_profiles bp ON bp.id = r.buyer_id
      WHERE bp.user_id = auth.uid()
    )
  );

-- UPDATE: Satıcı kendi davetinin durumunu güncelleyebilir
-- (seen_at, declined_at — status geçişi uygulama katmanında kontrol edilir)
CREATE POLICY "rfq_invitations_update_seller_seen"
  ON public.rfq_invitations
  FOR UPDATE
  TO authenticated
  USING (
    seller_id IN (
      SELECT id FROM public.seller_profiles WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    seller_id IN (
      SELECT id FROM public.seller_profiles WHERE user_id = auth.uid()
    )
  );

-- INSERT/DELETE: Yok — davet oluşturma/silme sadece Edge Function / service_role ile.

-- ═══════════════════════════════════════════
-- 2. rfqs — satıcı erişim policy (000023'ten ertelendi)
-- ═══════════════════════════════════════════

-- Davetli satıcı RFQ içeriğini görür (estimated_budget_cents hariç göstermek
-- uygulama katmanı kararı — DB select tüm kolonları döndürür)
DROP POLICY IF EXISTS "rfqs_select_invited_seller" ON public.rfqs;

CREATE POLICY "rfqs_select_invited_seller"
  ON public.rfqs
  FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT inv.rfq_id
      FROM public.rfq_invitations inv
      JOIN public.seller_profiles sp ON sp.id = inv.seller_id
      WHERE sp.user_id = auth.uid()
        AND inv.status IN ('invited', 'seen', 'responded')
    )
  );

-- ═══════════════════════════════════════════
-- 3. rfq_items — satıcı erişim policy (000025'ten ertelendi)
-- ═══════════════════════════════════════════

-- Davetli satıcı RFQ kalemlerini görür
DROP POLICY IF EXISTS "rfq_items_select_invited_seller" ON public.rfq_items;

CREATE POLICY "rfq_items_select_invited_seller"
  ON public.rfq_items
  FOR SELECT
  TO authenticated
  USING (
    rfq_id IN (
      SELECT inv.rfq_id
      FROM public.rfq_invitations inv
      JOIN public.seller_profiles sp ON sp.id = inv.seller_id
      WHERE sp.user_id = auth.uid()
        AND inv.status IN ('invited', 'seen', 'responded')
    )
  );
