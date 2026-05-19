-- Migration: 20260519000042_webhook_events.sql
-- Amaç: Iyzico/Stripe webhook olaylarının idempotency kaydı.
-- Aynı webhook olayının iki kez işlenmesini önler (UNIQUE provider+event_id).
--
-- Bu tablo yalnızca Edge Function (service_role) tarafından kullanılır.
-- Hiçbir kullanıcı rolü bu tabloya erişemez.
--
-- ─────────────────────────────────────────────────────────────
-- KVKK / VERİ MİNİMİZASYONU UYARISI:
--   payload JSONB sütunu ham webhook gövdesini içerir.
--   Iyzico webhook payload'ında ad/soyad, e-posta, kart son 4 hane gibi
--   kişisel veri (PII) bulunabilir.
--
--   Zorunlu önlemler:
--   1. Edge Function webhook payload'ını loglarken PII'yi maskele
--      (cardNumber, buyerName, email alanları).
--   2. payload sütunu KVKK kapsamındadır — saklama süresi maks. 6 ay
--      (CLAUDE.md / docs/04-DATABASE.md lifecycle tablosu).
--   3. İşlenen (processed) ve hatası olmayan (processing_error IS NULL) kayıtlar
--      6 ay sonra cronjob ile temizlenebilir (payload → NULL veya hard delete).
--   4. Bu tabloya asla client-side erişim verilmez.
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Webhook kaynağı
  provider   TEXT NOT NULL CHECK (provider IN ('stripe', 'iyzico')),
  event_id   TEXT NOT NULL,   -- Sağlayıcının olay ID'si (Stripe: evt_xxx, Iyzico: uuid)
  event_type TEXT NOT NULL,   -- Olay tipi (Stripe: payment_intent.succeeded, vb.)

  -- Ham gövde (KVKK: PII içerebilir — yukarıdaki uyarıya bak)
  payload JSONB NOT NULL,

  -- İşlem durumu
  --   pending    : Alındı, henüz işlenmedi (queue'da veya işlenirken)
  --   processed  : Başarıyla işlendi
  --   failed     : İşlem hatası (processing_error dolu)
  --   skipped    : Duplicate — daha önce işlendi, atlandı
  processing_status TEXT NOT NULL DEFAULT 'pending' CHECK (
    processing_status IN ('pending', 'processed', 'failed', 'skipped')
  ),

  -- Hata detayı (processing_status = 'failed')
  processing_error TEXT,

  -- Yeniden deneme sayacı (failed durumunda retry mekanizması için)
  retry_count INTEGER NOT NULL DEFAULT 0 CHECK (retry_count >= 0),

  -- Zaman damgaları
  received_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),  -- Webhook'un alındığı zaman
  processed_at TIMESTAMPTZ,                          -- İşlendiği zaman (NULL = henüz işlenmedi)

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  -- updated_at YOK — immutable log (processing_status ve processed_at dışında)
  -- deleted_at YOK — idempotency garantisi için kayıt tutulur
);

-- Temel idempotency garantisi: aynı provider + event_id bir kez işlenir
CREATE UNIQUE INDEX IF NOT EXISTS idx_webhook_events_provider_event_id_unique
  ON public.webhook_events (provider, event_id);

-- İşlenecek (pending/failed) eventları bulmak için (Edge Function cron/retry)
CREATE INDEX IF NOT EXISTS idx_webhook_events_pending
  ON public.webhook_events (provider, processing_status, received_at ASC)
  WHERE processing_status IN ('pending', 'failed');

-- Debug: belirli bir olay tipini sorgulamak için
CREATE INDEX IF NOT EXISTS idx_webhook_events_type
  ON public.webhook_events (provider, event_type, received_at DESC);

COMMENT ON TABLE public.webhook_events IS
  'Iyzico/Stripe webhook idempotency kaydı. '
  'KVKK: payload 6 ay saklanır, sonra temizlenir. '
  'Yalnızca service_role erişebilir — RLS aktif, kullanıcı policy yok.';
COMMENT ON COLUMN public.webhook_events.payload IS
  'Ham webhook gövdesi. PII içerebilir (ad, e-posta, kart son 4). '
  'Edge Function loglarken maskelenmeli. 6 ay KVKK saklama süresi.';
COMMENT ON COLUMN public.webhook_events.processing_status IS
  '''skipped'': UNIQUE constraint nedeniyle duplicate tespit edilip atlandı. '
  'İdempotency garantisi: event_id + provider kombinasyonu tekrar işlenmez.';
