-- Migration: 20260519000004_seller_profiles.sql
-- Amaç: Satıcı (nalbur, bayi, toptan, üretici) profil tablosu.
-- profiles (1) -> seller_profiles (1) ilişkisi.

CREATE TABLE IF NOT EXISTS public.seller_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- profiles ile 1:1 — bir kullanıcının tek seller_profile'i olur
  user_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,

  -- Şirket bilgisi
  company_name TEXT NOT NULL,
  company_type TEXT NOT NULL CHECK (
    company_type IN ('nalbur', 'toptan', 'bayi', 'distributor', 'uretici')
  ),
  tax_id TEXT NOT NULL,           -- Vergi numarası (10-11 hane)
  trade_registry_no TEXT,         -- Ticaret sicil numarası (opsiyonel)

  -- IBAN — Supabase Vault ile şifrelenmiş tutulacak (Faz 1.5 entegrasyon).
  -- Şimdilik TEXT olarak ama erişim sınırlı (RLS sadece sahibe).
  iban_encrypted TEXT,

  -- Doğrulama / KYC
  is_verified BOOLEAN NOT NULL DEFAULT FALSE,
  verified_at TIMESTAMPTZ,
  -- KYC belgeleri ayrı tabloda (seller_kyc) tutulacak — burada cached durum.

  -- Mağaza vitrin bilgisi
  store_name TEXT NOT NULL,
  store_slug TEXT NOT NULL,
  store_description TEXT,
  store_logo_url TEXT,
  store_cover_url TEXT,

  -- Lokasyon
  primary_city TEXT NOT NULL,
  primary_district TEXT NOT NULL,
  service_areas TEXT[] NOT NULL DEFAULT '{}',  -- Hizmet verdiği şehirler

  -- Cached metrikler (sipariş/yorum tetiklediğinde güncellenir)
  rating_avg NUMERIC(3,2) NOT NULL DEFAULT 0 CHECK (rating_avg >= 0 AND rating_avg <= 5),
  rating_count INTEGER NOT NULL DEFAULT 0 CHECK (rating_count >= 0),
  successful_orders_count INTEGER NOT NULL DEFAULT 0 CHECK (successful_orders_count >= 0),

  -- Üyelik bilgisi (subscriptions tablosundan cached — payments doğrulayıcı)
  subscription_tier TEXT CHECK (
    subscription_tier IS NULL
    OR subscription_tier IN ('basic', 'pro', 'enterprise')
  ),
  subscription_expires_at TIMESTAMPTZ,

  -- Standart audit kolonları
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,

  -- Vergi numarası format kontrolü (10 veya 11 hane sayı)
  CONSTRAINT seller_profiles_tax_id_format_chk CHECK (tax_id ~ '^[0-9]{10,11}$'),

  -- is_verified güvenlik şartnamesi (signpost constraint)
  -- Bu CHECK her zaman true — veri doğrulaması yapmıyor, sadece şema seviyesinde
  -- "is_verified user-settable değildir" sinyali. Gerçek koruma RLS UPDATE policy'sinde:
  -- WITH CHECK (is_verified = OLD.is_verified). staff_users kurulduktan sonra
  -- ek trigger ile pekiştirilecek (sadece staff veya service_role değiştirebilir).
  CONSTRAINT is_verified_not_user_settable CHECK (true)
);

-- store_slug aktif satırlar arasında unique
CREATE UNIQUE INDEX IF NOT EXISTS idx_seller_profiles_store_slug_unique
  ON public.seller_profiles (LOWER(store_slug)) WHERE deleted_at IS NULL;

-- tax_id aktif satırlar arasında unique (aynı vergi no ile iki satıcı kayıt olamaz)
CREATE UNIQUE INDEX IF NOT EXISTS idx_seller_profiles_tax_id_unique
  ON public.seller_profiles (tax_id) WHERE deleted_at IS NULL;

-- Sık sorgulanan kolonlar için index
CREATE INDEX IF NOT EXISTS idx_seller_profiles_user_id
  ON public.seller_profiles (user_id);

CREATE INDEX IF NOT EXISTS idx_seller_profiles_city
  ON public.seller_profiles (primary_city) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_seller_profiles_verified
  ON public.seller_profiles (is_verified) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_seller_profiles_rating
  ON public.seller_profiles (rating_avg DESC) WHERE deleted_at IS NULL AND is_verified = TRUE;

-- GIN index — service_areas üzerinde "contains" sorguları için
CREATE INDEX IF NOT EXISTS idx_seller_profiles_service_areas
  ON public.seller_profiles USING GIN (service_areas);

COMMENT ON TABLE public.seller_profiles IS 'Satıcı (nalbur/toptan/bayi/distributör/üretici) firma profili. profiles ile 1:1.';
COMMENT ON COLUMN public.seller_profiles.iban_encrypted IS 'IBAN — Supabase Vault şifreli (Faz 1.5). Şimdilik plaintext ama erişim sahibe sınırlı.';
COMMENT ON COLUMN public.seller_profiles.subscription_tier IS 'subscriptions tablosundan cached değer — payments webhook tetiklediğinde güncellenir.';
