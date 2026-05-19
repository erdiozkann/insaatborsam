-- Migration: 20260519000006_buyer_profiles.sql
-- Amaç: Alıcı (müteahhit, usta, mühendis, mimar, bireysel) profil tablosu.
-- profiles (1) -> buyer_profiles (1) ilişkisi.

CREATE TABLE IF NOT EXISTS public.buyer_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- profiles ile 1:1 — bir kullanıcının tek buyer_profile'i olur
  user_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,

  -- Şirket bilgisi (bireysel kullanıcıda NULL olabilir)
  company_name TEXT,
  company_type TEXT CHECK (
    company_type IS NULL
    OR company_type IN ('muteahhit', 'usta', 'muhendis', 'mimar', 'bireysel')
  ),
  tax_id TEXT,  -- Bireysel kullanıcıda NULL

  -- Üyelik bilgisi (subscriptions tablosundan cached — webhook günceller)
  subscription_tier TEXT NOT NULL DEFAULT 'free' CHECK (
    subscription_tier IN ('free', 'pro', 'business')
  ),
  subscription_expires_at TIMESTAMPTZ,

  -- Free tier kullanım limiti takibi
  monthly_searches_used INTEGER NOT NULL DEFAULT 0 CHECK (monthly_searches_used >= 0),
  monthly_searches_reset_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '1 month'),

  -- Standart audit kolonları
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,

  -- Vergi numarası format kontrolü (varsa)
  CONSTRAINT buyer_profiles_tax_id_format_chk CHECK (
    tax_id IS NULL OR tax_id ~ '^[0-9]{10,11}$'
  )
);

-- Sık sorgulanan kolonlar için index
CREATE INDEX IF NOT EXISTS idx_buyer_profiles_user_id
  ON public.buyer_profiles (user_id);

CREATE INDEX IF NOT EXISTS idx_buyer_profiles_subscription
  ON public.buyer_profiles (subscription_tier) WHERE deleted_at IS NULL;

-- tax_id aktif satırlar arasında unique (varsa)
CREATE UNIQUE INDEX IF NOT EXISTS idx_buyer_profiles_tax_id_unique
  ON public.buyer_profiles (tax_id) WHERE deleted_at IS NULL AND tax_id IS NOT NULL;

COMMENT ON TABLE public.buyer_profiles IS 'Alıcı (müteahhit/usta/mühendis/mimar/bireysel) profili. profiles ile 1:1.';
COMMENT ON COLUMN public.buyer_profiles.subscription_tier IS 'subscriptions tablosundan cached değer — varsayılan free.';
COMMENT ON COLUMN public.buyer_profiles.monthly_searches_used IS 'Free tier için aylık arama kotası takibi — monthly_searches_reset_at geldiğinde sıfırlanır.';
