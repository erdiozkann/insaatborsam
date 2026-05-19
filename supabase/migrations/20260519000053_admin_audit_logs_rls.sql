-- Migration: 20260519000053_admin_audit_logs_rls.sql
-- Amaç: admin_audit_logs tablosu için RLS — tam erişim engeli.
--
-- POLİTİKA: Sıfır policy — deny by default.
--   - anon          : Erişim yok.
--   - authenticated : Erişim yok. (buyer, seller, staff client rollerinin tümü)
--   - service_role  : RLS bypass — tam erişim (Edge Function INSERT).
--
-- NEDEN STAFF CLIENT DA GÖREMEZ?
--   Admin panel logları, staff_access_policies.sql toplu migration'da eklenecek
--   role-bazlı policy ile sağlanacak. Şu an o tablo kurulmamış.
--   Geçici olarak sıfır policy → staff panel log görünümü devre dışı.
--   Bu bilerek yapılan bir kısıtlamadır; erken access vermektense güvenli başlamak doğru.
--
-- INSERT akışı:
--   Staff aksiyon yapar → Edge Function (service_role) aksiyonu işler
--   → admin_audit_logs INSERT → RLS bypass ile kayıt düşülür.
--   Staff client'ı asla doğrudan INSERT yapmaz.
--
-- Saklama süresi (KVKK/güvenlik): 1 yıl (docs/04-DATABASE.md lifecycle).
--   Cron: 1 yıldan eski kayıtlar service_role ile temizlenir.

-- RLS'i aç
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- Önceki policy'leri temizle (idempotent)
DROP POLICY IF EXISTS "admin_audit_logs_select_staff" ON public.admin_audit_logs;
DROP POLICY IF EXISTS "admin_audit_logs_insert_staff" ON public.admin_audit_logs;

-- SIFIR POLİTİKA — bilinçli güvenlik kararı.
-- Herhangi bir policy eklenmesi önce güvenlik incelemesi gerektirir.
-- Özellikle INSERT policy ASLA authenticated role'e verilmez
-- (staff client'ı sahte audit log ekleyemez).
