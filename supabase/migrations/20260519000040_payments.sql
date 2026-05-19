-- Migration: 20260519000040_payments.sql
-- Amaç: Ödeme kayıtları (sipariş + abonelik ödemeleri).
-- Hem Iyzico (TRY — sipariş) hem Stripe (EUR — abonelik) ödemeleri bu tabloda.
--
-- Para kolonları: BIGINT *_cents (CLAUDE.md kuralı).
-- Soft delete YOK — finansal kayıt (10 yıl saklama, KVKK).
--
-- GÜVENLİK NOTU: Kullanıcı INSERT/UPDATE/DELETE yapamaz.
-- Tüm mutasyonlar: Iyzico/Stripe webhook → Edge Function → service_role.

CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Ödemenin bağlı olduğu kayıt (en az biri dolu — aşağıda CHECK)
  order_id        UUID REFERENCES public.orders(id)        ON DELETE RESTRICT,
  subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE RESTRICT,

  -- Tam olarak biri dolu olmalı (XOR — ikisi birden dolu veya ikisi birden NULL olamaz)
  -- Faz 1 kararı: Her ödeme ya bir siparişe ya da bir aboneliğe aittir.
  -- Birden fazla context'e bağlı ödeme yoktur; refund da orijinal context'i miras alır.
  CONSTRAINT payments_context_xor_chk CHECK (
    (order_id IS NOT NULL AND subscription_id IS NULL)
    OR
    (order_id IS NULL AND subscription_id IS NOT NULL)
  ),

  -- Ödeme tipi
  --   order        : Sipariş ödemesi (Iyzico TRY veya Stripe)
  --   subscription : Üyelik ödemesi (Stripe EUR / Iyzico TRY gelecekte)
  --   shipping     : Ayrı kargo ödemesi — Faz 2
  --   refund       : İade kaydı — Faz 1'de refunded_amount_cents ile işlenir
  payment_type TEXT NOT NULL CHECK (
    payment_type IN ('order', 'subscription', 'shipping', 'refund')
  ),

  -- Ödeme sağlayıcısı
  provider TEXT NOT NULL CHECK (
    provider IN ('stripe', 'iyzico', 'manual_bank')
  ),

  -- Sağlayıcı referans ID'leri
  provider_payment_id  TEXT,          -- Stripe: pi_xxx / Iyzico: paymentId
  provider_response    JSONB,         -- Ham webhook/API yanıtı (debug için)

  -- İdempotency anahtarı — aynı checkout denemesinin iki kez kaydedilmesini önler
  -- (Iyzico: conversationId, Stripe: idempotency-key header)
  idempotency_key TEXT,

  -- Tutar
  amount_cents BIGINT NOT NULL CHECK (amount_cents > 0),
  currency TEXT NOT NULL CHECK (currency IN ('TRY', 'EUR', 'USD')),
  -- Not: currency'nin default'u yok — her ödeme kaydında açık olarak set edilmeli.
  -- Sipariş ödemeleri TRY, abonelik ödemeleri EUR. Hata riski: default yanlış para birimi.

  -- Durum makinesi
  --   pending    : İşlem başlatıldı, yanıt bekleniyor
  --   authorized : Kart yetkilendirildi, henüz çekilmedi (pre-auth, Iyzico)
  --   paid       : Başarılı ödeme
  --   failed     : Başarısız ödeme (failure_reason dolu)
  --   refunded   : Tam iade
  --   canceled   : Kullanıcı veya sistem tarafından iptal
  status TEXT NOT NULL DEFAULT 'pending' CHECK (
    status IN ('pending', 'authorized', 'paid', 'failed', 'refunded', 'canceled')
  ),

  -- Hata bilgisi (status = 'failed')
  failure_reason TEXT,
  failure_code   TEXT,  -- Sağlayıcı hata kodu (örn. 'insufficient_funds')

  -- 3DS akışı (Türkiye zorunlu)
  is_3d_secure BOOLEAN NOT NULL DEFAULT TRUE,

  -- Maskelenmiş kart bilgisi (son 4 hane + marka)
  card_last_four TEXT CHECK (card_last_four IS NULL OR card_last_four ~ '^\d{4}$'),
  card_brand     TEXT,  -- 'visa', 'mastercard', 'amex', vb.

  -- Zaman damgaları
  paid_at      TIMESTAMPTZ,
  refunded_at  TIMESTAMPTZ,

  -- Kısmi/tam iade
  refunded_amount_cents BIGINT NOT NULL DEFAULT 0 CHECK (refunded_amount_cents >= 0),

  -- Audit (deleted_at YOK — yasal finansal kayıt)
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- İade tutarı ödeme tutarını aşamaz
  CONSTRAINT payments_refund_amount_chk CHECK (
    refunded_amount_cents <= amount_cents
  ),
  -- paid_at sadece status = 'paid' olduğunda dolu olmalı (uygulama katmanı da kontrol eder)
  CONSTRAINT payments_paid_at_consistency_chk CHECK (
    (status = 'paid' AND paid_at IS NOT NULL)
    OR (status != 'paid')
  )
);

-- Sağlayıcı referans ID — aynı payment iki kez kayıt edilmesin
CREATE UNIQUE INDEX IF NOT EXISTS idx_payments_provider_payment_id_unique
  ON public.payments (provider, provider_payment_id)
  WHERE provider_payment_id IS NOT NULL;

-- İdempotency — aynı checkout iki kez payment oluşturmasın
CREATE UNIQUE INDEX IF NOT EXISTS idx_payments_idempotency_unique
  ON public.payments (provider, idempotency_key)
  WHERE idempotency_key IS NOT NULL;

-- Sipariş bazlı ödeme sorgular
CREATE INDEX IF NOT EXISTS idx_payments_order
  ON public.payments (order_id)
  WHERE order_id IS NOT NULL;

-- Abonelik bazlı ödeme sorgular
CREATE INDEX IF NOT EXISTS idx_payments_subscription
  ON public.payments (subscription_id)
  WHERE subscription_id IS NOT NULL;

-- Bekleyen ödemeler (cron/reconciliation)
CREATE INDEX IF NOT EXISTS idx_payments_status_pending
  ON public.payments (status, created_at DESC)
  WHERE status IN ('pending', 'authorized');

COMMENT ON TABLE public.payments IS
  'Ödeme kayıtları. Iyzico (TRY) + Stripe (EUR). '
  'Finansal kayıt — soft delete yok, 10 yıl saklama. '
  'Tüm mutasyonlar webhook → Edge Function → service_role ile yapılır.';
COMMENT ON COLUMN public.payments.idempotency_key IS
  'Checkout tekrarı önleme. Iyzico: conversationId, Stripe: idempotency-key header.';
COMMENT ON COLUMN public.payments.provider_response IS
  'Ham sağlayıcı yanıtı (JSONB). PII içerebilir — kart no, ad/soyad. '
  'Loglamada bu alandan PII maskelenmeli.';
COMMENT ON COLUMN public.payments.refunded_amount_cents IS
  'Kısmi iade için: iade edilen tutar. Tam iade = amount_cents kadar.';
