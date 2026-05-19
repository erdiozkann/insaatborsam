-- Migration: 20260519000007_buyer_profiles_rls.sql
-- Amaç: buyer_profiles tablosu için RLS politikaları.
--
-- Politika özeti:
--   - Public read YOK — alıcı verisi gizli (B2B'de alıcı kimliği korunur).
--   - Owner SELECT/UPDATE/INSERT: kullanıcı kendi alıcı profilini yönetir.
--   - DELETE: soft delete pattern (deleted_at), hard delete yok.
--   - Satıcılar alıcı kimliğini sadece RFQ/order context'inde görür — o ayrı bir
--     izin mekanizması (RFQ/order tablolarında policy'ler).

-- RLS'i aç
ALTER TABLE public.buyer_profiles ENABLE ROW LEVEL SECURITY;

-- Önceki policy'leri temizle (idempotent)
DROP POLICY IF EXISTS "buyer_profiles_select_own" ON public.buyer_profiles;
DROP POLICY IF EXISTS "buyer_profiles_insert_own" ON public.buyer_profiles;
DROP POLICY IF EXISTS "buyer_profiles_update_own" ON public.buyer_profiles;

-- SELECT: kullanıcı kendi alıcı profilini görür
CREATE POLICY "buyer_profiles_select_own"
  ON public.buyer_profiles
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    AND deleted_at IS NULL
  );

-- INSERT: kullanıcı yalnızca kendi user_id'siyle eşleşen buyer_profile yaratabilir
CREATE POLICY "buyer_profiles_insert_own"
  ON public.buyer_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- UPDATE: kullanıcı kendi alıcı profilini günceller
-- Not: subscription_tier kullanıcı tarafından doğrudan değiştirilememeli — uygulama
-- katmanında webhook üzerinden güncellenir. monthly_searches_used da RPC ile artırılır.
CREATE POLICY "buyer_profiles_update_own"
  ON public.buyer_profiles
  FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid()
    AND deleted_at IS NULL
  )
  WITH CHECK (user_id = auth.uid());

-- DELETE: yok (soft delete pattern). Hard delete sadece service_role ile.
