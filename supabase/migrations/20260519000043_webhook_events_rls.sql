-- Migration: 20260519000043_webhook_events_rls.sql
-- Amaç: webhook_events tablosu için RLS — tam erişim engeli.
--
-- POLİTİKA: Hiçbir kullanıcı rolü bu tabloya erişemez.
--   - anon : Erişim yok.
--   - authenticated (buyer/seller/staff) : Erişim yok.
--   - service_role : RLS'i bypass eder, tam erişim (Edge Function).
--
-- NEDEN SIFIR POLİTİKA?
--   Postgres davranışı: RLS aktif + eşleşen policy yok = erişim reddedilir.
--   Bu, "deny by default" modelinin tam uygulamasıdır.
--   Gelecekte bile authenticated kullanıcıya SELECT verilmemeli —
--   payload JSONB PII içerdiğinden KVKK kapsamında hassas veridir.
--
-- Erişim kontrol zinciri:
--   Iyzico/Stripe → Edge Function (service_role) → webhook_events
--   Kullanıcı → webhook_events : ASLA

-- RLS'i aç
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;

-- Önceki policy'leri temizle (idempotent — önceden eklenmiş olmasın diye)
DROP POLICY IF EXISTS "webhook_events_select_authenticated" ON public.webhook_events;
DROP POLICY IF EXISTS "webhook_events_insert_authenticated" ON public.webhook_events;

-- SIFIR POLİTİKA — bilinçli güvenlik kararı.
-- Herhangi bir policy eklenmesi bu tablonun güvenliğini zedeleyebilir.
-- Değiştirmek için açık güvenlik incelemesi gerekir.
