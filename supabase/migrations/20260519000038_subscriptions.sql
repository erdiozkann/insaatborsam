-- Migration: 20260519000038_subscriptions.sql
-- Amaç: Kullanıcı abonelik kayıtları (alıcı/satıcı üyelik planları).
--
-- ═══════════════════════════════════════════════════════════════
-- KRİTİK — Apple/Google komisyon atlatma (CLAUDE.md kuralı):
--   Üyelik satın alımı YALNIZCA insaatborsam.com web sitesinden yapılır.
--   Ödeme işlemleri: Iyzico (TRY) veya Stripe (EUR).
--   Mobil uygulamalarda "Üye Ol", "Yükselt", "Satın Al" butonu YOKTUR.
--   Mobil uygulama sadece "Giriş Yap" akışıyla açılır.
--   Abonelik kaydı değişiklikleri: payment webhook (Iyzico/Stripe) → Edge Function.
--   Hiçbir client-side akış subscription INSERT/UPDATE yapamaz.
-- ═══════════════════════════════════════════════════════════════
--
-- Sahiplik modeli: buyer_id XOR seller_id (tam olarak biri dolu).
--   Transporter Faz 2: transporter_id (nullable) ileride eklenecek.
-- Para: price_cents BIGINT. Üyelik EUR (€), bazı TRY planlar için TRY.
-- Soft delete YOK — finansal kayıt (yasal saklama).

CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Sahiplik: tam olarak biri dolu (XOR — aşağıda CHECK)
  buyer_id  UUID REFERENCES public.buyer_profiles(id)  ON DELETE CASCADE,
  seller_id UUID REFERENCES public.seller_profiles(id) ON DELETE CASCADE,
  -- transporter_id UUID -- Faz 2: nakliyeci aboneliği

  -- XOR constraint: buyer_id ve seller_id'den tam olarak biri dolu olmalı
  CONSTRAINT subscriptions_owner_xor_chk CHECK (
    (buyer_id IS NOT NULL AND seller_id IS NULL)
    OR
    (buyer_id IS NULL AND seller_id IS NOT NULL)
  ),

  -- Plan
  -- Buyer planları : buyer_free (implicit, kayıt gerekmez), buyer_pro, buyer_business
  -- Seller planları: seller_basic, seller_pro, seller_enterprise
  plan_id TEXT NOT NULL CHECK (
    plan_id IN (
      'buyer_pro', 'buyer_business',
      'seller_basic', 'seller_pro', 'seller_enterprise'
    )
  ),

  -- Ödeme sağlayıcı
  --   stripe : EUR abonelikler (Avrupa + uluslararası)
  --   iyzico : TRY abonelikler (Türkiye lokal — gelecekte eklenecek TRY planlar)
  provider TEXT NOT NULL CHECK (provider IN ('stripe', 'iyzico')),

  -- Sağlayıcı referans ID'leri (webhook doğrulama ve yönetim için)
  provider_subscription_id TEXT,
  provider_customer_id      TEXT,

  -- Fiyat (BIGINT cent — EUR cent veya TRY kuruş)
  --   Örn. 4900 = €49,00 (EUR cent)
  price_cents BIGINT NOT NULL CHECK (price_cents > 0),

  -- Para birimi
  --   EUR: tüm Faz 1 planları (CLAUDE.md — bazı fiyatlar €)
  --   TRY: ileride Iyzico TRY planları için
  currency TEXT NOT NULL DEFAULT 'EUR' CHECK (currency IN ('EUR', 'TRY')),

  -- Dönem
  billing_cycle TEXT NOT NULL DEFAULT 'monthly' CHECK (
    billing_cycle IN ('monthly', 'yearly')
  ),

  -- Abonelik durum makinesi
  --   trialing   : deneme süreci (varsa)
  --   active     : aktif ve ödeme güncel
  --   past_due   : ödeme gecikmiş, kısa tolerans süresi
  --   canceled   : iptal edildi (current_period_end'de biter)
  --   incomplete : ilk ödeme tamamlanmadı (Stripe için)
  --   unpaid     : past_due sonrası ödeme hala gelmedi
  status TEXT NOT NULL CHECK (
    status IN ('trialing', 'active', 'past_due', 'canceled', 'incomplete', 'unpaid')
  ),

  -- Dönem zamanları
  current_period_start TIMESTAMPTZ NOT NULL,
  current_period_end   TIMESTAMPTZ NOT NULL,

  -- Deneme süresi (trialing status için)
  trial_ends_at TIMESTAMPTZ,

  -- İptal zamanlaması
  cancel_at   TIMESTAMPTZ,  -- İleride iptal planlandıysa
  canceled_at TIMESTAMPTZ,  -- Gerçek iptal zamanı

  -- Audit (deleted_at YOK — finansal kayıt, yasal saklama)
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Dönem tutarlılık kontrolü
  CONSTRAINT subscriptions_period_order_chk CHECK (
    current_period_end > current_period_start
  )
);

-- Alıcı bazlı index
CREATE INDEX IF NOT EXISTS idx_subscriptions_buyer
  ON public.subscriptions (buyer_id, status)
  WHERE buyer_id IS NOT NULL;

-- Satıcı bazlı index
CREATE INDEX IF NOT EXISTS idx_subscriptions_seller
  ON public.subscriptions (seller_id, status)
  WHERE seller_id IS NOT NULL;

-- Aktif abonelikler (webhook güncelleme sorguları için)
CREATE INDEX IF NOT EXISTS idx_subscriptions_status_active
  ON public.subscriptions (status)
  WHERE status IN ('active', 'trialing', 'past_due');

-- Provider referansı (webhook doğrulama için)
CREATE UNIQUE INDEX IF NOT EXISTS idx_subscriptions_provider_sub_id_unique
  ON public.subscriptions (provider, provider_subscription_id)
  WHERE provider_subscription_id IS NOT NULL;

-- Dönem bitiş tarihleri (renewal/expiry cron için)
CREATE INDEX IF NOT EXISTS idx_subscriptions_period_end
  ON public.subscriptions (current_period_end)
  WHERE status IN ('active', 'trialing');

COMMENT ON TABLE public.subscriptions IS
  'Alıcı/satıcı abonelik kayıtları. '
  'UYARI: Mobil uygulama üyelik satamaz (Apple/Google komisyon kuralı). '
  'Tüm değişiklikler payment webhook → Edge Function → service_role üzerinden yapılır.';
COMMENT ON COLUMN public.subscriptions.buyer_id IS
  'Alıcı aboneliği. seller_id ile XOR: tam olarak biri dolu.';
COMMENT ON COLUMN public.subscriptions.seller_id IS
  'Satıcı aboneliği. buyer_id ile XOR: tam olarak biri dolu.';
COMMENT ON COLUMN public.subscriptions.price_cents IS
  'BIGINT cent. EUR için: 4900 = €49,00. TRY için: 49900 = ₺499,00.';
COMMENT ON COLUMN public.subscriptions.cancel_at IS
  'Gelecekteki iptal tarihi. Stripe ''cancel_at_period_end'' ile set edilir.';
