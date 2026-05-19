-- Migration: 20260519000044_conversations.sql
-- Amaç: Alıcı-satıcı mesajlaşma thread'leri.
-- messages (000046) bu tabloya bağlanır.
--
-- Sahiplik modeli:
--   buyer_id + seller_id ZORUNLU — her conversation bilinen iki taraf arasındadır.
--   Context (order/rfq/product) opsiyonel — genel konuşma da mümkün.
--
-- Soft delete VAR — konuşma "arşivlendi" veya "engellendi" olabilir.
-- Ancak mesajlar ayrıca soft-delete edilmez (mesaj seviyesi ayrı).
--
-- Unread counter güncelleme:
--   buyer_unread_count / seller_unread_count — mesaj eklendiğinde trigger ile artar,
--   okunduğunda SECURITY DEFINER RPC ile sıfırlanır (000047_conversations_rls.sql sonrası
--   ayrı bir fonksiyon migration ile eklenecek). Kullanıcı doğrudan UPDATE yapamaz.

CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Taraflar (zorunlu — her ikisi de bilinmeli)
  buyer_id  UUID NOT NULL REFERENCES public.buyer_profiles(id)  ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES public.seller_profiles(id) ON DELETE CASCADE,

  -- Context (opsiyonel — hangisi ilgiliyse dolu, yoksa NULL)
  related_order_id   UUID REFERENCES public.orders(id)   ON DELETE SET NULL,
  related_rfq_id     UUID REFERENCES public.rfqs(id)     ON DELETE SET NULL,
  related_product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,

  -- Son mesaj önizlemesi (bildirim ve liste UI'ı için)
  last_message_at      TIMESTAMPTZ,
  last_message_preview TEXT,  -- Max ~100 karakter (uygulama kesmeli)

  -- Okunmamış mesaj sayaçları (trigger ile artırılır, RPC ile sıfırlanır)
  buyer_unread_count  INTEGER NOT NULL DEFAULT 0 CHECK (buyer_unread_count >= 0),
  seller_unread_count INTEGER NOT NULL DEFAULT 0 CHECK (seller_unread_count >= 0),

  -- Konuşma durumu
  --   active   : Aktif, mesaj gönderilebilir
  --   archived : Bir taraf arşivledi
  --   blocked  : Staff veya sistem engelledi
  status TEXT NOT NULL DEFAULT 'active' CHECK (
    status IN ('active', 'archived', 'blocked')
  ),

  -- Aynı kişi kendisiyle konuşamaz
  -- (buyer ve seller ayrı profiller — teorik olarak aynı profiles satırı olabilir)
  -- Uygulamada bir kişi hem buyer hem seller olabilir; bu durumda kendi kendine
  -- konuşma açamaz (uygulama katmanında kontrol).

  -- Standart audit kolonları
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Alıcının konuşma listesi (son mesaj tarihine göre sıralı)
CREATE INDEX IF NOT EXISTS idx_conversations_buyer
  ON public.conversations (buyer_id, last_message_at DESC NULLS LAST)
  WHERE deleted_at IS NULL;

-- Satıcının konuşma listesi
CREATE INDEX IF NOT EXISTS idx_conversations_seller
  ON public.conversations (seller_id, last_message_at DESC NULLS LAST)
  WHERE deleted_at IS NULL;

-- Context bazlı sorgular (bir siparişe ait konuşmayı bul)
CREATE INDEX IF NOT EXISTS idx_conversations_order
  ON public.conversations (related_order_id)
  WHERE related_order_id IS NOT NULL AND deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_conversations_rfq
  ON public.conversations (related_rfq_id)
  WHERE related_rfq_id IS NOT NULL AND deleted_at IS NULL;

-- Okunmamış konuşmaları bulmak için (bildirim badge sayacı)
CREATE INDEX IF NOT EXISTS idx_conversations_buyer_unread
  ON public.conversations (buyer_id, buyer_unread_count)
  WHERE buyer_unread_count > 0 AND deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_conversations_seller_unread
  ON public.conversations (seller_id, seller_unread_count)
  WHERE seller_unread_count > 0 AND deleted_at IS NULL;

COMMENT ON TABLE public.conversations IS
  'Alıcı-satıcı mesajlaşma thread''leri. buyer_id + seller_id zorunlu. '
  'Context (order/rfq/product) opsiyonel.';
COMMENT ON COLUMN public.conversations.buyer_unread_count IS
  'Mesaj insert trigger ile artar. mark_conversation_read() RPC ile sıfırlanır. '
  'Kullanıcı doğrudan UPDATE yapamaz.';
COMMENT ON COLUMN public.conversations.last_message_preview IS
  'Son mesajın kısa önizlemesi. Uygulama ~100 karaktere kesip yazmalı. '
  'PII içerebilir — loglama/analitik sırasında dikkat.';
