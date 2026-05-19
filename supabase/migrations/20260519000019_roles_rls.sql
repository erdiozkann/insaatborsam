-- Migration: 20260519000019_roles_rls.sql
-- Amaç: roles tablosu için RLS politikaları.
--
-- Politika özeti:
--   - SELECT: yalnızca authenticated kullanıcılar görür. Anon kullanıcının rol
--     listesini bilmesine gerek yok (admin paneli authenticated arkasında).
--   - INSERT/UPDATE/DELETE: yok — yalnızca migration / seed / service_role.
--
-- Not: Bu tabloyu sadece staff_users.role_id FK üzerinden okumak yeterli olur.
-- Ama "rol seçim dropdown'u" gibi UI ihtiyacı için authenticated SELECT açık.

-- RLS'i aç
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;

-- Önceki policy'leri temizle (idempotent)
DROP POLICY IF EXISTS "roles_authenticated_read" ON public.roles;

-- SELECT: authenticated kullanıcılar tüm rolleri görür
CREATE POLICY "roles_authenticated_read"
  ON public.roles
  FOR SELECT
  TO authenticated
  USING (TRUE);

-- INSERT/UPDATE/DELETE policy YOK — seed/migration ile yönetilir.
