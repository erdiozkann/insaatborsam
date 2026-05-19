-- Migration: 20260519000048_notifications.sql
-- Amaç: Kullanıcı bildirimleri (in-app, push, email, SMS, WhatsApp).
-- Faz 1: in_app + push aktif. email/sms/whatsapp Faz 2 (provider entegrasyonları).
--
-- recipient_id → profiles.id (auth.uid() ile doğrudan eşleşir — basit RLS).
-- Append-only log: updated_at yok, deleted_at yok.
-- read_at için mark_notification_read() SECURITY DEFINER RPC (ileride eklenecek).

CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Alıcı (profiles.id = auth.uid() — RLS basit karşılaştırma ile çalışır)
  recipient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

  -- Bildirim tipi (tip bazlı UI routing ve ikonlama)
  notification_type TEXT NOT NULL CHECK (
    notification_type IN (
      -- Sipariş bildirimleri
      'order_placed', 'order_paid', 'order_confirmed', 'order_shipped',
      'order_delivered', 'order_cancelled',
      -- RFQ bildirimleri
      'rfq_received', 'rfq_offer_received', 'rfq_offer_accepted',
      'rfq_offer_rejected', 'rfq_expired',
      -- Mesajlaşma
      'new_message',
      -- Abonelik
      'subscription_activated', 'subscription_expiring', 'subscription_expired',
      'payment_failed',
      -- Satıcı
      'product_out_of_stock', 'new_review',
      -- Sistem/genel
      'system_announcement', 'verification_approved', 'verification_rejected'
    )
  ),

  -- Başlık ve gövde (UI'da gösterilecek)
  title TEXT NOT NULL CHECK (length(title) > 0 AND length(title) <= 200),
  body  TEXT NOT NULL CHECK (length(body)  > 0 AND length(body)  <= 1000),

  -- Bağlamsal veri (deep link ve zengin görüntüleme için)
  --   örn. {"order_id": "...", "order_number": "ORD-01234-AB"}
  --         {"rfq_id": "...", "offer_count": 3}
  data JSONB NOT NULL DEFAULT '{}'::jsonb,

  -- Gönderim kanalı
  --   in_app    : Uygulama içi bildirim (Faz 1 aktif)
  --   push      : FCM/APNs push bildirimi (Faz 1 aktif — Expo Push)
  --   email     : E-posta (Faz 2 — Resend entegrasyonu)
  --   sms       : SMS (Faz 2 — Netgsm/Vonage entegrasyonu)
  --   whatsapp  : WhatsApp (Faz 2 — Meta Business API)
  channel TEXT NOT NULL DEFAULT 'in_app' CHECK (
    channel IN ('in_app', 'push', 'email', 'sms', 'whatsapp')
  ),

  -- Gönderim durumu
  --   pending : Oluşturuldu, henüz gönderilmedi
  --   sent    : Sağlayıcıya iletildi
  --   read    : Kullanıcı okudu (read_at set edildi)
  --   failed  : Gönderim başarısız
  status TEXT NOT NULL DEFAULT 'pending' CHECK (
    status IN ('pending', 'sent', 'read', 'failed')
  ),

  -- Zaman damgaları
  sent_at  TIMESTAMPTZ,           -- Sağlayıcıya gönderildiği zaman
  read_at  TIMESTAMPTZ,           -- Kullanıcının okuduğu zaman (mark_notification_read ile)

  -- Başarısız gönderim nedeni
  failure_reason TEXT,

  -- Append-only: sadece created_at
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  -- updated_at YOK — log kaydı
  -- deleted_at YOK — bildirim geçmişi saklanır
);

-- Kullanıcının bildirim listesi (okunmamışlar önce, sonra tarih sırası)
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_unread
  ON public.notifications (recipient_id, created_at DESC)
  WHERE status != 'read';

-- Kullanıcının tüm bildirimleri (sayfalama için)
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_all
  ON public.notifications (recipient_id, created_at DESC);

-- Bekleyen gönderimleri bulmak için (cron/queue işleme)
CREATE INDEX IF NOT EXISTS idx_notifications_pending
  ON public.notifications (channel, status, created_at ASC)
  WHERE status = 'pending';

-- Tip bazlı sorgulama (analytics)
CREATE INDEX IF NOT EXISTS idx_notifications_type
  ON public.notifications (notification_type, created_at DESC);

COMMENT ON TABLE public.notifications IS
  'Kullanıcı bildirimleri. Faz 1: in_app + push. Faz 2: email/sms/whatsapp. '
  'read_at için mark_notification_read() SECURITY DEFINER RPC gerekli.';
COMMENT ON COLUMN public.notifications.data IS
  'Deep link ve zengin içerik için bağlamsal veri. '
  'Örn. {"order_id": "uuid", "order_number": "ORD-01234-AB"}.';
COMMENT ON COLUMN public.notifications.read_at IS
  'Kullanıcı doğrudan UPDATE yapamaz. '
  'mark_notification_read(notification_id) SECURITY DEFINER RPC ile set edilir.';
