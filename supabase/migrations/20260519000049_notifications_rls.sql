-- Migration: 20260519000049_notifications_rls.sql
-- Amaç: notifications tablosu için RLS politikaları.
--
-- Politika özeti:
--   - SELECT: Kullanıcı sadece kendi (recipient_id = auth.uid()) bildirimlerini görür.
--     auth.uid() = profiles.id olduğundan doğrudan eşleşme — subquery gerekmez.
--   - INSERT: Yok — bildirimler Edge Function / service_role tarafından oluşturulur.
--   - UPDATE: Yok — read_at için mark_notification_read() RPC (ileride yazılacak).
--   - DELETE: Yok — bildirim geçmişi saklanır.
--
-- NOT: mark_notification_read() SECURITY DEFINER fonksiyonu ileride ayrı migration ile
--   eklenecek. Fonksiyon sadece status = 'read' ve read_at = NOW() update eder;
--   başka kolon dokunulmaz. REVOKE PUBLIC + GRANT authenticated.
--
-- Staff erişimi: staff_access_policies.sql toplu migration'da eklenecek.

-- RLS'i aç
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Önceki policy'leri temizle (idempotent)
DROP POLICY IF EXISTS "notifications_select_own" ON public.notifications;

-- SELECT: Kullanıcı sadece kendi bildirimlerini görür
-- profiles.id = auth.uid() olduğundan subquery gerekmez — doğrudan karşılaştırma.
CREATE POLICY "notifications_select_own"
  ON public.notifications
  FOR SELECT
  TO authenticated
  USING (recipient_id = auth.uid());

-- INSERT policy YOK — Edge Function / service_role tarafından oluşturulur.
-- UPDATE policy YOK — read_at SECURITY DEFINER RPC ile set edilir.
-- DELETE policy YOK — bildirim geçmişi saklanır.
