-- Migration: 20260519000025_rfq_items_rls.sql
-- Amaç: rfq_items tablosu için RLS politikaları.
--
-- Politika özeti:
--   - Buyer-own: Alıcı kendi rfq'larının kalemlerini görür/yönetir.
--   - Seller-invited SELECT: Davetli satıcılar kalemleri görür.
--     BU POLICY ŞİMDİLİK EKLENMİYOR — rfq_invitations henüz yok.
--     000027_rfq_invitations_rls.sql dosyasında eklenecek.

-- RLS'i aç
ALTER TABLE public.rfq_items ENABLE ROW LEVEL SECURITY;

-- Önceki policy'leri temizle (idempotent)
DROP POLICY IF EXISTS "rfq_items_select_own_buyer" ON public.rfq_items;
DROP POLICY IF EXISTS "rfq_items_insert_own_buyer" ON public.rfq_items;
DROP POLICY IF EXISTS "rfq_items_update_own_buyer" ON public.rfq_items;
DROP POLICY IF EXISTS "rfq_items_delete_own_buyer" ON public.rfq_items;
DROP POLICY IF EXISTS "rfq_items_select_invited_seller" ON public.rfq_items;

-- SELECT: alıcı kendi rfq kalemlerini görür
CREATE POLICY "rfq_items_select_own_buyer"
  ON public.rfq_items
  FOR SELECT
  TO authenticated
  USING (
    rfq_id IN (
      SELECT r.id FROM public.rfqs r
      JOIN public.buyer_profiles bp ON bp.id = r.buyer_id
      WHERE bp.user_id = auth.uid()
    )
  );

-- INSERT: alıcı kendi rfq'larına kalem ekler
CREATE POLICY "rfq_items_insert_own_buyer"
  ON public.rfq_items
  FOR INSERT
  TO authenticated
  WITH CHECK (
    rfq_id IN (
      SELECT r.id FROM public.rfqs r
      JOIN public.buyer_profiles bp ON bp.id = r.buyer_id
      WHERE bp.user_id = auth.uid()
        AND r.status = 'open'   -- sadece açık taleplere kalem eklenebilir
        AND r.deleted_at IS NULL
    )
  );

-- UPDATE: alıcı kendi rfq kalemlerini günceller
CREATE POLICY "rfq_items_update_own_buyer"
  ON public.rfq_items
  FOR UPDATE
  TO authenticated
  USING (
    rfq_id IN (
      SELECT r.id FROM public.rfqs r
      JOIN public.buyer_profiles bp ON bp.id = r.buyer_id
      WHERE bp.user_id = auth.uid()
        AND r.status = 'open'
        AND r.deleted_at IS NULL
    )
  )
  WITH CHECK (
    rfq_id IN (
      SELECT r.id FROM public.rfqs r
      JOIN public.buyer_profiles bp ON bp.id = r.buyer_id
      WHERE bp.user_id = auth.uid()
    )
  );

-- DELETE: alıcı kendi rfq kalemini siler (hard delete OK — kalem yeniden eklenebilir)
CREATE POLICY "rfq_items_delete_own_buyer"
  ON public.rfq_items
  FOR DELETE
  TO authenticated
  USING (
    rfq_id IN (
      SELECT r.id FROM public.rfqs r
      JOIN public.buyer_profiles bp ON bp.id = r.buyer_id
      WHERE bp.user_id = auth.uid()
        AND r.status = 'open'
        AND r.deleted_at IS NULL
    )
  );

-- Seller SELECT policy → 000027_rfq_invitations_rls.sql'de eklenecek.
