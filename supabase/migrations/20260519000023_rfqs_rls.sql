-- Migration: 20260519000023_rfqs_rls.sql
-- Amaç: rfqs tablosu için RLS politikaları.
--
-- Politika özeti:
--   - Buyer-own SELECT/INSERT/UPDATE: Alıcı kendi taleplerine tam erişim.
--   - Seller-invited SELECT: Davetli satıcılar talebi görür.
--     BU POLICY ŞİMDİLİK EKLENMİYOR — rfq_invitations tablosu henüz yok.
--     000027_rfq_invitations_rls.sql dosyasında eklenecek.
--   - DELETE: soft delete (UPDATE ile deleted_at). Hard delete yok.
--
-- Seller erişim policy bekleniyor → 000027_rfq_invitations_rls.sql

-- RLS'i aç
ALTER TABLE public.rfqs ENABLE ROW LEVEL SECURITY;

-- Önceki policy'leri temizle (idempotent)
DROP POLICY IF EXISTS "rfqs_select_own_buyer" ON public.rfqs;
DROP POLICY IF EXISTS "rfqs_insert_own_buyer" ON public.rfqs;
DROP POLICY IF EXISTS "rfqs_update_own_buyer" ON public.rfqs;
-- Satıcı policy'leri 000027'de temizlenecek / eklenecek
DROP POLICY IF EXISTS "rfqs_select_invited_seller" ON public.rfqs;

-- SELECT: alıcı kendi tüm taleplerini görür (her status)
CREATE POLICY "rfqs_select_own_buyer"
  ON public.rfqs
  FOR SELECT
  TO authenticated
  USING (
    buyer_id IN (
      SELECT id FROM public.buyer_profiles
      WHERE user_id = auth.uid()
    )
  );

-- INSERT: alıcı sadece kendi buyer_profile.id ile talep açabilir
CREATE POLICY "rfqs_insert_own_buyer"
  ON public.rfqs
  FOR INSERT
  TO authenticated
  WITH CHECK (
    buyer_id IN (
      SELECT id FROM public.buyer_profiles
      WHERE user_id = auth.uid()
    )
  );

-- UPDATE: alıcı kendi açık/evaluating taleplerini günceller
-- (closed/expired/cancelled talep artık değiştirilmemeli — uygulama katmanı kontrol)
CREATE POLICY "rfqs_update_own_buyer"
  ON public.rfqs
  FOR UPDATE
  TO authenticated
  USING (
    buyer_id IN (
      SELECT id FROM public.buyer_profiles
      WHERE user_id = auth.uid()
    )
    AND deleted_at IS NULL
  )
  WITH CHECK (
    buyer_id IN (
      SELECT id FROM public.buyer_profiles
      WHERE user_id = auth.uid()
    )
  );

-- DELETE policy YOK — soft delete pattern.
