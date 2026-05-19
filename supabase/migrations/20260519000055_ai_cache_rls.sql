-- Migration: 20260519000055_ai_cache_rls.sql
-- Amaç: ai_cache tablosu için RLS — tam erişim engeli.
--
-- POLİTİKA: Sıfır policy — deny by default.
--   - anon          : Erişim yok.
--   - authenticated : Erişim yok. (buyer, seller, staff client dahil)
--   - service_role  : RLS bypass — tam erişim (Edge Function).
--
-- NEDEN SIFIR POLİTİKA?
--   ai_cache bir iç optimizasyon bileşenidir; kullanıcıların cache içeriğini
--   görmesine, yazmasına veya manipüle etmesine izin verilmez:
--   1. Cache hit/miss sayısını manipüle etmek maliyet analizini bozar.
--   2. input_hash üzerinden tersine mühendislik girişimi mümkün olabilir.
--   3. response_data içinde kısmen PII barındıran yapılandırılmış veri olabilir.
--   4. Cache poisoning (kötü response enjeksiyonu) sistemin doğruluğunu bozar.
--
-- Erişim kontrol zinciri:
--   Kullanıcı isteği → Edge Function (service_role) → ai_cache okuma/yazma
--   Kullanıcı → ai_cache : ASLA

-- RLS'i aç
ALTER TABLE public.ai_cache ENABLE ROW LEVEL SECURITY;

-- Önceki policy'leri temizle (idempotent)
DROP POLICY IF EXISTS "ai_cache_select_service" ON public.ai_cache;
DROP POLICY IF EXISTS "ai_cache_insert_service" ON public.ai_cache;

-- SIFIR POLİTİKA — kasıtlı güvenlik kararı.
-- Cache poisoning, PII sızıntısı ve maliyet manipülasyonu risklerini engeller.
