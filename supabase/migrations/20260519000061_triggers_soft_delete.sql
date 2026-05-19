-- Migration: 20260519000061_triggers_soft_delete.sql
-- Amaç: Soft delete stratejisi belgesi + guard helper fonksiyonu.
--
-- ─────────────────────────────────────────────────────────────
-- SOFT DELETE STRATEJİSİ
--
-- Bu projede hard DELETE yerine soft delete tercih edilir:
--   deleted_at TIMESTAMPTZ NULL  →  NULL = aktif, dolu = silinmiş
--
-- Soft delete olan tablolar:
--   profiles, seller_profiles, buyer_profiles, addresses, products,
--   staff_users, rfqs, conversations, messages
--
-- Soft delete OLMAYAN tablolar (tasarım kararı):
--   categories       → is_active flag (sistem verisi)
--   orders           → status='cancelled' (yasal kayıt, 10 yıl)
--   payments         → status='refunded/canceled' (yasal kayıt)
--   subscriptions    → status='canceled' (finansal kayıt)
--   order_items      → immutable snapshot
--   order_status_history → append-only log
--   seller_reviews   → append-only, platform güvenilirliği
--   admin_audit_logs → append-only, denetim bütünlüğü
--   webhook_events   → idempotency kaydı
--   notifications    → append-only log
--   ai_cache         → expires_at TTL ile temizlenir
--   seller_kyc       → status makinesi, CASCADE ile silinir
--   price_index      → append-only tarihsel veri
--
-- ─────────────────────────────────────────────────────────────
-- HARD DELETE KURALLARI:
--
--   1. Kullanıcı verisi (KVKK Madde 17 silme hakkı):
--      Yalnızca service_role + Edge Function → UPDATE deleted_at = NOW()
--      30 gün sonra CRON → hard DELETE (profiles, seller_profiles, buyer_profiles)
--
--   2. Adresler: Kullanıcı hard delete edebilir (authenticated policy var).
--      Sipariş olan adres ON DELETE RESTRICT ile korunur.
--
--   3. Ürünler: Satıcı soft delete yapar (deleted_at UPDATE).
--      Hard delete yok (order_items FK RESTRICT).
--
--   4. Mesajlar: Satıcı/alıcı soft delete (deleted_at UPDATE).
--      UI "mesaj silindi" placeholder gösterir. Hard delete yok.
-- ─────────────────────────────────────────────────────────────

-- Soft delete guard: bir satırın aktif olup olmadığını kontrol eden IMMUTABLE helper.
-- RLS policy'lerinde ve SELECT WHERE koşullarında okunabilirlik için.
--
-- Kullanım:
--   WHERE public.is_active_row(deleted_at)          -- aktif satırlar
--   WHERE NOT public.is_active_row(deleted_at)       -- silinmiş satırlar
--
-- Not: Bu fonksiyon RLS USING içinde KULLANILMAMALI — inline `deleted_at IS NULL`
-- Postgres planner tarafından daha iyi optimize edilir. Sadece application-layer
-- veya Edge Function sorgularında okunabilirlik için kullanılabilir.

CREATE OR REPLACE FUNCTION public.is_active_row(p_deleted_at TIMESTAMPTZ)
RETURNS BOOLEAN
IMMUTABLE
LANGUAGE sql
AS $$
  SELECT p_deleted_at IS NULL;
$$;

COMMENT ON FUNCTION public.is_active_row(TIMESTAMPTZ) IS
  'Bir satırın soft-delete edilmemiş olduğunu kontrol eder. '
  'RLS policy içinde değil; application/Edge Function sorgularında kullanılır.';

-- ─────────────────────────────────────────────────────────────
-- SOFT DELETE FLOW ÖRNEKLERİ (Edge Function referansı):
--
-- Profil soft delete (KVKK silme talebi):
--   UPDATE profiles SET deleted_at = NOW() WHERE id = $user_id
--   -- 30 gün sonra CRON: DELETE FROM profiles WHERE deleted_at < NOW() - INTERVAL '30 days'
--
-- Ürün soft delete (satıcı tarafından):
--   UPDATE products SET deleted_at = NOW() WHERE id = $product_id AND seller_id = $seller_id
--
-- Mesaj soft delete (uygulama içi silme):
--   UPDATE messages SET deleted_at = NOW() WHERE id = $msg_id AND sender_profile_id = $profile_id
-- ─────────────────────────────────────────────────────────────
