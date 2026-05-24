-- Sprint 2.8 — Güvenlik Sertleştirmesi
-- Supabase Security Advisor bulgularına göre üretildi (2026-05-25).
-- Kapsam: REVOKE EXECUTE (sadece anon), sabit search_path, ai_cache + webhook_events DENY policy.
--
-- DEĞİŞTİRME GEREKÇESİ:
--   Mevcut migration'larda REVOKE ALL FROM PUBLIC var ama Supabase, anon/authenticated'a
--   default EXECUTE yetkisi vermekte — explicit REVOKE FROM anon gerekli.
--
-- KURAL: authenticated rolünden REVOKE edilmez. Gerekçeler:
--   - is_active_staff(), has_staff_role() → 17+ tablodaki staff RLS policy'lerinde çağrılır.
--   - update_buyer_order_note(), update_seller_order_note() → 000035'te authenticated'a açık,
--     bilinçli tasarım kararı (fonksiyon içinde auth.uid() kontrolü var).
--   - handle_new_user(), update_seller_rating_on_review() → sadece trigger'dan çağrılır,
--     authenticated'dan da güvenle kesilebilir.

-- ─────────────────────────────────────────────────────────────────────────────
-- BÖLÜM 1: SECURITY DEFINER fonksiyonlardan anon EXECUTE yetkisini kaldır
-- ─────────────────────────────────────────────────────────────────────────────

-- Auth trigger — yalnızca Supabase auth sistemi tarafından tetiklenir (trigger function)
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM authenticated;

-- Staff kontrol helper'ları — anon erişimi yok; authenticated RLS policy'leri için açık kalır
REVOKE EXECUTE ON FUNCTION public.is_active_staff() FROM anon;
-- NOT: authenticated'dan REVOKE edilmez — 000064_staff_access_policies RLS policy'leri
--      is_active_staff() ve has_staff_role()'u USING clause içinde çağırır.

REVOKE EXECUTE ON FUNCTION public.has_staff_role(text[]) FROM anon;
-- NOT: authenticated'dan REVOKE edilmez — yukarıdaki gerekçe.

-- Sipariş notu RPC'leri — anon erişimi yok; authenticated kullanıcılar (alıcı/satıcı) çağırabilir
REVOKE EXECUTE ON FUNCTION public.update_buyer_order_note(uuid, text) FROM anon;
-- NOT: authenticated'dan REVOKE edilmez — 000035'te bilinçli olarak GRANT TO authenticated var.
--      Fonksiyon içi auth.uid() kontrolü güvenliği sağlar.

REVOKE EXECUTE ON FUNCTION public.update_seller_order_note(uuid, text) FROM anon;
-- NOT: authenticated'dan REVOKE edilmez — yukarıdaki gerekçe.

-- Rating trigger — yalnızca seller_reviews INSERT trigger'ından çağrılır
REVOKE EXECUTE ON FUNCTION public.update_seller_rating_on_review() FROM anon;
REVOKE EXECUTE ON FUNCTION public.update_seller_rating_on_review() FROM authenticated;

-- ─────────────────────────────────────────────────────────────────────────────
-- BÖLÜM 2: Mutable search_path sabitleme
-- 000030, 000060, 000061 migration'larında SET search_path eksikti.
-- ─────────────────────────────────────────────────────────────────────────────

ALTER FUNCTION public.generate_order_number() SET search_path = public;

ALTER FUNCTION public.set_updated_at() SET search_path = public;

ALTER FUNCTION public.is_active_row(TIMESTAMPTZ) SET search_path = public;

-- ─────────────────────────────────────────────────────────────────────────────
-- BÖLÜM 3: ai_cache — explicit DENY policy (Advisor "RLS no policy" uyarısını kapatır)
-- Semantik davranış değişmez: service_role bypass eder, sıfır-policy zaten deny eder.
-- Explicit policy Advisor'ın "intent belirsiz" uyarısını belgeli karara dönüştürür.
-- ─────────────────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "ai_cache_deny_anon" ON public.ai_cache;
CREATE POLICY "ai_cache_deny_anon"
  ON public.ai_cache
  AS RESTRICTIVE
  FOR ALL
  TO anon
  USING (false)
  WITH CHECK (false);

DROP POLICY IF EXISTS "ai_cache_deny_authenticated" ON public.ai_cache;
CREATE POLICY "ai_cache_deny_authenticated"
  ON public.ai_cache
  AS RESTRICTIVE
  FOR ALL
  TO authenticated
  USING (false)
  WITH CHECK (false);

-- ─────────────────────────────────────────────────────────────────────────────
-- BÖLÜM 4: webhook_events — explicit DENY policy (aynı gerekçe)
-- 000043'teki bilinçli "sıfır policy" kararı korunur; Advisor uyarısı kapatılır.
-- ─────────────────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "webhook_events_deny_anon" ON public.webhook_events;
CREATE POLICY "webhook_events_deny_anon"
  ON public.webhook_events
  AS RESTRICTIVE
  FOR ALL
  TO anon
  USING (false)
  WITH CHECK (false);

DROP POLICY IF EXISTS "webhook_events_deny_authenticated" ON public.webhook_events;
CREATE POLICY "webhook_events_deny_authenticated"
  ON public.webhook_events
  AS RESTRICTIVE
  FOR ALL
  TO authenticated
  USING (false)
  WITH CHECK (false);
