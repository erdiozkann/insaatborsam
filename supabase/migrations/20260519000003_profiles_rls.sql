-- Migration: 20260519000003_profiles_rls.sql
-- Amaç: profiles tablosu için RLS (Row Level Security) politikaları.
--
-- Politika özeti:
--   - Kullanıcı kendi profilini okur, günceller (kendi satırı için tam erişim).
--   - INSERT: trigger ile auth.users insert olduğunda otomatik (handle_new_user fonksiyonu,
--     ileri migration'da). Burada manuel INSERT policy'si auth context'inden gelir.
--   - DELETE: kullanıcı kendi hesabını soft-delete eder (deleted_at). Hard delete
--     sadece KVKK silme talebi ile Edge Function (service_role) tarafından yapılır.
--
-- Staff erişim politikası bu migration'da YOK — staff_users tablosu oluşturulduktan sonra
-- ayrı bir migration ile (000034_staff_access_policies.sql) eklenecek.

-- RLS'i aç
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Önceki policy'leri temizle (idempotent)
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_soft_delete_own" ON public.profiles;

-- SELECT: kullanıcı kendi profilini okur
CREATE POLICY "profiles_select_own"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = id
    AND deleted_at IS NULL
  );

-- INSERT: kullanıcı yalnızca kendi auth.uid()'siyle eşleşen satır ekleyebilir
-- (Pratikte handle_new_user trigger'ı ile yapılacak; bu policy fallback.)
CREATE POLICY "profiles_insert_own"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- UPDATE: kullanıcı kendi profilini günceller
-- (id ve role değiştirilemez — uygulama katmanında ek kontrol)
CREATE POLICY "profiles_update_own"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = id
    AND deleted_at IS NULL
  )
  WITH CHECK (auth.uid() = id);

-- "DELETE" yerine soft delete pattern: UPDATE ile deleted_at set edilir.
-- Hard DELETE yalnızca service_role (Edge Function) ile yapılır — policy yok demek
-- DELETE'in authenticated için yasak olduğu anlamına gelir.
