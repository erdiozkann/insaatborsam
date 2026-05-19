-- Migration: 20260519000002_profiles.sql
-- Amaç: Kullanıcı uzantısı tablosu (auth.users 1:1).
-- Tüm rollerin (buyer/seller/transporter/staff) temel kimlik bilgisi burada.

CREATE TABLE IF NOT EXISTS public.profiles (
  -- Birincil anahtar — auth.users.id'ye 1:1 referans
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Temel kimlik
  email TEXT NOT NULL,
  phone TEXT,
  full_name TEXT NOT NULL,
  avatar_url TEXT,

  -- Rol — Faz 1'de buyer/seller/staff aktif, transporter Faz 2.
  role TEXT NOT NULL CHECK (role IN ('buyer', 'seller', 'transporter', 'staff')),

  -- Dil tercihi — Faz 1'de sadece 'tr'
  preferred_language TEXT NOT NULL DEFAULT 'tr',

  -- KVKK Onayları
  --   consent_kvkk: zorunlu açık rıza (kayıt sırasında işaretlenmeli)
  --   consent_marketing: pazarlama izni (opsiyonel)
  consent_kvkk BOOLEAN NOT NULL DEFAULT FALSE,
  consent_kvkk_at TIMESTAMPTZ,
  consent_marketing BOOLEAN NOT NULL DEFAULT FALSE,
  consent_marketing_at TIMESTAMPTZ,

  -- Standart audit kolonları
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,

  -- Unique constraint'ler (soft delete uyumlu olmadığı için partial unique index'ler aşağıda)
  CONSTRAINT profiles_email_format_chk CHECK (email ~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$')
);

-- Aktif satırlar arasında email/phone unique olsun (soft-deleted satırları hariç tut)
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_email_unique
  ON public.profiles (LOWER(email)) WHERE deleted_at IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_phone_unique
  ON public.profiles (phone) WHERE deleted_at IS NULL AND phone IS NOT NULL;

-- Sık kullanılan kolonlar için index
CREATE INDEX IF NOT EXISTS idx_profiles_role
  ON public.profiles (role) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_profiles_created_at
  ON public.profiles (created_at DESC);

-- Tablo yorumları
COMMENT ON TABLE public.profiles IS 'Tüm kullanıcı rollerinin (buyer/seller/transporter/staff) temel profil bilgisi. auth.users ile 1:1 ilişki.';
COMMENT ON COLUMN public.profiles.consent_kvkk IS 'KVKK açık rıza — kayıt sırasında zorunlu işaretlenir, false ise hesap eksik.';
COMMENT ON COLUMN public.profiles.deleted_at IS 'Soft delete — silinmiş hesaplar 30 gün saklanır, sonra hard delete (KVKK).';
