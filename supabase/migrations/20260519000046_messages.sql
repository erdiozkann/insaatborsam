-- Migration: 20260519000046_messages.sql
-- Amaç: Konuşma mesajları.
-- conversations (1) -> messages (n)
--
-- Mesaj gönderildiğinde trigger ile:
--   - conversations.last_message_at güncellenir
--   - conversations.last_message_preview güncellenir (~100 karakter)
--   - Karşı tarafın unread_count +1 artar
-- Bu trigger'lar 000053_triggers.sql'de yazılacak.

CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Ait olduğu konuşma thread'i
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,

  -- Gönderen tipi
  --   buyer  : Alıcı tarafından gönderildi
  --   seller : Satıcı tarafından gönderildi
  --   staff  : Admin/operasyon ekibi mesajı
  --   system : Otomatik sistem mesajı (sipariş durumu, bildirim, vb.)
  sender_type TEXT NOT NULL CHECK (
    sender_type IN ('buyer', 'seller', 'staff', 'system')
  ),

  -- Gönderenin profiles.id (sistem mesajlarında NULL)
  -- ON DELETE SET NULL: profil silinse bile mesaj geçmişi kalır
  sender_profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,

  -- sender_type ve sender_profile_id tutarlılık kontrolü
  CONSTRAINT messages_sender_consistency_chk CHECK (
    (sender_type = 'system' AND sender_profile_id IS NULL)
    OR (sender_type != 'system' AND sender_profile_id IS NOT NULL)
  ),

  -- Mesaj içeriği
  body TEXT NOT NULL CHECK (length(body) > 0 AND length(body) <= 5000),

  -- Ekler (Supabase Storage URL'leri listesi)
  --   örn. [{"url": "...", "type": "image/jpeg", "name": "fatura.jpg", "size_bytes": 12345}]
  attachments JSONB NOT NULL DEFAULT '[]'::jsonb,

  -- Mesaj tipi (görüntüleme için)
  --   text          : Düz metin
  --   image         : Görsel (attachments dolu)
  --   system_notice : Sistem bildirimi (sipariş durumu, RFQ kapandı, vb.)
  message_type TEXT NOT NULL DEFAULT 'text' CHECK (
    message_type IN ('text', 'image', 'file', 'system_notice')
  ),

  -- Ek bağlamsal veri (system_notice için: sipariş/RFQ ID'si vb.)
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,

  -- Okundu bilgisi (gönderen dışındaki tarafın okuması)
  read_at TIMESTAMPTZ,

  -- Düzenleme zamanı
  -- Faz 1: mesaj düzenleme özelliği yok. Bu kolon gelecek için hazır tutuldu.
  -- Faz 2'de edit akışı eklendiğinde edited_at set edilecek.
  -- UI: edited_at IS NOT NULL ise "düzenlendi" etiketi göster.
  edited_at TIMESTAMPTZ,

  -- Soft delete (içerik gizlenir, "mesaj silindi" placeholder gösterilir)
  deleted_at TIMESTAMPTZ,

  -- created_at yeterli — mesaj immutable (edit Faz 2)
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  -- updated_at YOK — body değiştirilemez (Faz 1), edited_at durumu yönetir
);

-- Konuşma bazlı mesaj listesi (kronolojik — temel sorgulama)
CREATE INDEX IF NOT EXISTS idx_messages_conversation_time
  ON public.messages (conversation_id, created_at ASC)
  WHERE deleted_at IS NULL;

-- Okunmamış mesajlar (konuşma bazlı — unread badge için)
CREATE INDEX IF NOT EXISTS idx_messages_unread
  ON public.messages (conversation_id, read_at)
  WHERE read_at IS NULL AND deleted_at IS NULL;

-- Gönderen bazlı index (staff audit: "bu kullanıcı ne yazdı?")
CREATE INDEX IF NOT EXISTS idx_messages_sender
  ON public.messages (sender_profile_id, created_at DESC)
  WHERE sender_profile_id IS NOT NULL AND deleted_at IS NULL;

COMMENT ON TABLE public.messages IS
  'Konuşma mesajları. conversations ile 1:n. '
  'Mesaj insert tetikleyicisi conversations.last_message_at / unread_count günceller.';
COMMENT ON COLUMN public.messages.body IS
  'Mesaj metni. Max 5000 karakter (DB CHECK). Ek uzun içerik için attachments.';
COMMENT ON COLUMN public.messages.edited_at IS
  'Faz 1: kullanılmıyor, NULL. '
  'Faz 2 düzenleme akışı eklendiğinde set edilir. UI: ''düzenlendi'' etiketi.';
COMMENT ON COLUMN public.messages.deleted_at IS
  'Soft delete — içerik gizlenir, ''Bu mesaj silindi'' placeholder gösterilir. '
  'Hard delete yok (konuşma geçmişi bütünlüğü için).';
