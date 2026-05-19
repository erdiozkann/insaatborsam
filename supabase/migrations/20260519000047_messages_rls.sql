-- Migration: 20260519000047_messages_rls.sql
-- Amaç: messages tablosu için RLS politikaları.
--
-- Politika özeti:
--   - Buyer SELECT: Kendi konuşmalarındaki mesajları görür (deleted_at dahil — placeholder UI için).
--   - Seller SELECT: Kendi konuşmalarındaki mesajları görür.
--   - INSERT (buyer): Kendi aktif konuşmasına buyer sender olarak mesaj atar.
--   - INSERT (seller): Kendi aktif konuşmasına seller sender olarak mesaj atar.
--   - UPDATE: Yok — read_at için mark_message_read() RPC (ileride), body değiştirilemez.
--   - DELETE: Yok — soft delete sadece service_role ile.
--
-- GÜVENLİK: sender_type ve sender_profile_id WITH CHECK ile kilitleniyor.
--   Buyer 'seller' sender_type ile mesaj gönderemez; sahte kimlik mümkün değil.

-- RLS'i aç
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Önceki policy'leri temizle (idempotent)
DROP POLICY IF EXISTS "messages_select_buyer" ON public.messages;
DROP POLICY IF EXISTS "messages_select_seller" ON public.messages;
DROP POLICY IF EXISTS "messages_insert_buyer" ON public.messages;
DROP POLICY IF EXISTS "messages_insert_seller" ON public.messages;

-- SELECT: Alıcı kendi konuşmalarındaki tüm mesajları görür
-- (deleted_at IS NULL filtresi YOK — soft deleted mesajlar da görünür,
--  UI "mesaj silindi" placeholder gösterir. İçeriği saklamak için body yerine
--  application-level render kullanılır.)
CREATE POLICY "messages_select_buyer"
  ON public.messages
  FOR SELECT
  TO authenticated
  USING (
    conversation_id IN (
      SELECT c.id FROM public.conversations c
      JOIN public.buyer_profiles bp ON bp.id = c.buyer_id
      WHERE bp.user_id = auth.uid()
        AND c.deleted_at IS NULL
    )
  );

-- SELECT: Satıcı kendi konuşmalarındaki tüm mesajları görür
CREATE POLICY "messages_select_seller"
  ON public.messages
  FOR SELECT
  TO authenticated
  USING (
    conversation_id IN (
      SELECT c.id FROM public.conversations c
      JOIN public.seller_profiles sp ON sp.id = c.seller_id
      WHERE sp.user_id = auth.uid()
        AND c.deleted_at IS NULL
    )
  );

-- INSERT: Alıcı kendi aktif konuşmasına buyer sender olarak mesaj atar
-- sender_type = 'buyer' VE sender_profile_id = auth.uid() zorunlu —
-- başkasının kimliğiyle mesaj gönderilemez.
CREATE POLICY "messages_insert_buyer"
  ON public.messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Konuşma bu alıcıya ait ve aktif
    conversation_id IN (
      SELECT c.id FROM public.conversations c
      JOIN public.buyer_profiles bp ON bp.id = c.buyer_id
      WHERE bp.user_id = auth.uid()
        AND c.status = 'active'
        AND c.deleted_at IS NULL
    )
    -- Kimlik kilidi: buyer sender_type ve kendi profiles.id
    AND sender_type = 'buyer'
    AND sender_profile_id = auth.uid()
  );

-- INSERT: Satıcı kendi aktif konuşmasına seller sender olarak mesaj atar
CREATE POLICY "messages_insert_seller"
  ON public.messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Konuşma bu satıcıya ait ve aktif
    conversation_id IN (
      SELECT c.id FROM public.conversations c
      JOIN public.seller_profiles sp ON sp.id = c.seller_id
      WHERE sp.user_id = auth.uid()
        AND c.status = 'active'
        AND c.deleted_at IS NULL
    )
    -- Kimlik kilidi: seller sender_type ve kendi profiles.id
    AND sender_type = 'seller'
    AND sender_profile_id = auth.uid()
  );

-- UPDATE policy YOK — kasıtlı güvenlik kararı:
--   read_at: Faz 2'de mark_message_read() SECURITY DEFINER RPC ile set edilecek.
--   body: mesaj içeriği değiştirilemez (Faz 1). Faz 2 edit akışı için ayrı RPC.
--   deleted_at: service_role ile soft delete.

-- DELETE policy YOK — soft delete pattern.
-- Staff/system mesajı insert'i service_role ile yapılır (policy gerekmez).
