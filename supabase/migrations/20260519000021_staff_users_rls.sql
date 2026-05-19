-- Migration: 20260519000021_staff_users_rls.sql
-- Amaç: staff_users tablosu için RLS politikaları.
--
-- Politika özeti:
--   - Self-SELECT: Kullanıcı kendi staff_users satırını görür (is_staff mi değil mi
--     anlamak için). Recursive policy riski YOK — USING içinde auth.uid() = user_id
--     direkt karşılaştırma yapar, başka tabloya bakmaz.
--   - Diğer staff görüntüleme: Admin panel staff listesini service_role ile
--     Edge Function üzerinden çeker (RLS bypass). Bu şekilde recursive policy
--     riski tamamen ortadan kalkar.
--   - INSERT/UPDATE/DELETE: Yok — staff ataması sadece service_role / migration
--     ile yapılır. Bir staff kullanıcısı başka staff atayamaz (privilege escalation).
--
-- Not: staff_users tablosunun aktif olması halinde diğer tablo policy'leri
--   EXISTS (SELECT 1 FROM staff_users WHERE user_id = auth.uid() AND is_active = TRUE)
--   kontrolü yapacak. Bu SELECT policy aşağıdaki self-SELECT policy üzerinden çalışır.

-- RLS'i aç
ALTER TABLE public.staff_users ENABLE ROW LEVEL SECURITY;

-- Önceki policy'leri temizle (idempotent)
DROP POLICY IF EXISTS "staff_users_select_own" ON public.staff_users;

-- SELECT: kullanıcı kendi staff_users satırını görür
-- (Uygulama: "Ben staff mıyım?" kontrolü için kullanılır)
CREATE POLICY "staff_users_select_own"
  ON public.staff_users
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    AND deleted_at IS NULL
  );

-- INSERT/UPDATE/DELETE policy YOK.
-- Staff listesi admin panelinde service_role ile Edge Function üzerinden çekilir.

-- ─────────────────────────────────────────────────────────────
-- Staff erişimleri self-SELECT ile sınırlıdır.
-- Diğer tablolardaki staff erişimi 0000XX_staff_access_policies.sql içinde
-- role/permission bazlı toplu eklenecektir.
-- Sadece is_active kontrolü kalıcı yetki modeli değildir:
--   - deleted_at IS NULL kontrolü zorunlu
--   - role_id üzerinden permission matrisi (roles.permissions JSONB) kullanılmalı
--   - owner/admin gibi geniş yetki için roles tablosundan name/permission check
-- Şu an sadece is_active kullanıyorsa bu GEÇİCİ — staff_access_policies.sql ile tamamlanacak.
-- ─────────────────────────────────────────────────────────────
