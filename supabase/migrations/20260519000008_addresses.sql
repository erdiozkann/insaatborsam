-- Migration: 20260519000008_addresses.sql
-- Amaç: Kullanıcı teslimat adresleri (şantiye, depo, ofis).
-- profiles (1) -> addresses (n) ilişkisi.

CREATE TABLE IF NOT EXISTS public.addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Sahibi (profiles'e referans — buyer/seller fark etmez, ikisi de adres ekler)
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

  -- Etiket (kullanıcı tanımlı: "Şantiye", "Depo", "Ofis")
  label TEXT,

  -- Alıcı bilgisi (teslimat sırasında kuryeye verilecek)
  recipient_name TEXT NOT NULL,
  recipient_phone TEXT NOT NULL,

  -- Adres
  country TEXT NOT NULL DEFAULT 'TR',
  city TEXT NOT NULL,
  district TEXT NOT NULL,
  neighborhood TEXT,
  street_address TEXT NOT NULL,
  postal_code TEXT,

  -- Koordinat (opsiyonel — Google Places Autocomplete ile doldurulur)
  latitude NUMERIC(10,7),
  longitude NUMERIC(10,7),

  -- Bu kullanıcının default adresi mi?
  is_default BOOLEAN NOT NULL DEFAULT FALSE,

  -- Standart audit kolonları
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,

  -- Koordinat değer aralığı (geçerli enlem/boylam)
  CONSTRAINT addresses_lat_range_chk CHECK (
    latitude IS NULL OR (latitude >= -90 AND latitude <= 90)
  ),
  CONSTRAINT addresses_lng_range_chk CHECK (
    longitude IS NULL OR (longitude >= -180 AND longitude <= 180)
  )
);

-- Kullanıcı bazlı index (kullanıcının adres listesini çekmek için)
CREATE INDEX IF NOT EXISTS idx_addresses_user
  ON public.addresses (user_id) WHERE deleted_at IS NULL;

-- Default adres index (her kullanıcı için 1 default adres — partial unique)
CREATE UNIQUE INDEX IF NOT EXISTS idx_addresses_user_default_unique
  ON public.addresses (user_id) WHERE is_default = TRUE AND deleted_at IS NULL;

-- Coğrafi sorgular için index (Faz 2 — kargo eşleştirmesi)
CREATE INDEX IF NOT EXISTS idx_addresses_city_district
  ON public.addresses (city, district) WHERE deleted_at IS NULL;

COMMENT ON TABLE public.addresses IS 'Kullanıcı teslimat adresleri. Buyer/Seller fark etmez; orders.delivery_address_id buraya bağlanır.';
COMMENT ON COLUMN public.addresses.is_default IS 'Her kullanıcı için maksimum 1 default adres (partial unique index ile zorlanır).';
