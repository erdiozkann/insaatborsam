-- Migration: 20260519000045_conversations_rls.sql
-- Amaç: conversations tablosu için RLS politikaları.
--
-- Politika özeti:
--   - Buyer SELECT: Kendi buyer_id'li konuşmaları görür.
--   - Seller SELECT: Kendi seller_id'li konuşmaları görür.
--   - INSERT (buyer): Sadece kendi buyer_id'siyle + hedef seller doğrulanmış olmalı.
--   - INSERT (seller): Sadece kendi seller_id'siyle + hedef buyer mevcut olmalı.
--   - UPDATE: Yok — unread counter trigger/RPC ile, archive/block Faz 2 RPC ile.
--   - DELETE: Yok — soft delete trusted flow (service_role deleted_at seter).
--
-- GÜVENLİK: unread counter (buyer_unread_count / seller_unread_count)
--   doğrudan kullanıcı UPDATE'ine kapalıdır. Sayaç manipülasyonu mümkün değil.

-- RLS'i aç
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

-- Önceki policy'leri temizle (idempotent)
DROP POLICY IF EXISTS "conversations_select_buyer" ON public.conversations;
DROP POLICY IF EXISTS "conversations_select_seller" ON public.conversations;
DROP POLICY IF EXISTS "conversations_insert_buyer" ON public.conversations;
DROP POLICY IF EXISTS "conversations_insert_seller" ON public.conversations;

-- SELECT: Alıcı kendi konuşmalarını görür
CREATE POLICY "conversations_select_buyer"
  ON public.conversations
  FOR SELECT
  TO authenticated
  USING (
    buyer_id IN (
      SELECT id FROM public.buyer_profiles
      WHERE user_id = auth.uid()
        AND deleted_at IS NULL
    )
    AND deleted_at IS NULL
  );

-- SELECT: Satıcı kendi konuşmalarını görür
CREATE POLICY "conversations_select_seller"
  ON public.conversations
  FOR SELECT
  TO authenticated
  USING (
    seller_id IN (
      SELECT id FROM public.seller_profiles
      WHERE user_id = auth.uid()
        AND deleted_at IS NULL
    )
    AND deleted_at IS NULL
  );

-- INSERT: Alıcı kendi buyer_id'siyle konuşma başlatır
-- Kısıtlama: Hedef satıcı doğrulanmış (is_verified=TRUE) ve aktif olmalı.
-- Alıcı sahte/silinmiş bir satıcıya mesaj açamaz.
CREATE POLICY "conversations_insert_buyer"
  ON public.conversations
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Kendi buyer_id'si
    buyer_id IN (
      SELECT id FROM public.buyer_profiles
      WHERE user_id = auth.uid()
        AND deleted_at IS NULL
    )
    -- Hedef satıcı doğrulanmış ve aktif
    AND seller_id IN (
      SELECT id FROM public.seller_profiles
      WHERE is_verified = TRUE
        AND deleted_at IS NULL
    )
  );

-- INSERT: Satıcı kendi seller_id'siyle konuşma başlatır
-- Kısıtlama: Hedef alıcı kayıtlı ve aktif olmalı.
CREATE POLICY "conversations_insert_seller"
  ON public.conversations
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Kendi seller_id'si
    seller_id IN (
      SELECT id FROM public.seller_profiles
      WHERE user_id = auth.uid()
        AND deleted_at IS NULL
    )
    -- Hedef alıcı mevcut ve aktif
    AND buyer_id IN (
      SELECT id FROM public.buyer_profiles
      WHERE deleted_at IS NULL
    )
  );

-- UPDATE policy YOK — kasıtlı güvenlik kararı:
--   unread_count: mesaj insert trigger ile artar, mark_conversation_read() RPC ile sıfırlanır.
--   last_message_at / last_message_preview: mesaj insert trigger ile güncellenir.
--   status (archive/block): Faz 2'de ayrı SECURITY DEFINER RPC ile yapılacak.

-- DELETE policy YOK — soft delete sadece service_role ile (deleted_at set eder).
