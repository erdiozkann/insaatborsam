-- Migration: 20260519000058_price_index.sql
-- Amaç: İnşaat malzemesi canlı fiyat endeksi — aggregate, anonimize veri.
--
-- ÖNEMLİ GİZLİLİK NOTU:
--   Bu tablo YALNIZCA agregasyon verisini içerir.
--   Tekil satıcı fiyatı, bireysel sipariş tutarı veya herhangi bir
--   kişisel veri (seller_id, order_id, buyer_id) SAKLANMAZ.
--   Kaynak veri anonimize edildikten sonra bu tabloya yazılır.
--   Public read edilebilir olması bu sayede güvenlidir.
--
-- Fiyat hesaplama yöntemi:
--   service_role / Edge Function, orders tablosundaki completed siparişlerden
--   belirli bir malzeme için median/mean hesaplayıp buraya yazar.
--   sample_size < 3 olan kayıtlar public'e açılmamalı (anonimleştirme eşiği).

CREATE TABLE IF NOT EXISTS public.price_index (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Malzeme tanımı
  -- material_key: makine-okunabilir anahtar (alt çizgi, küçük harf)
  --   Örnekler: 'cement_42_5_ton', 'rebar_8mm_kg', 'ceramic_60x60_m2',
  --             'plaster_50kg_bag', 'hollow_brick_adet'
  material_key TEXT NOT NULL,

  -- Kategori bağlantısı (opsiyonel — filtreleme ve UI gruplaması için)
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,

  -- Birim
  unit TEXT NOT NULL,

  -- Coğrafi kapsam
  --   city  : NULL → Türkiye geneli
  --   region: Bölge bazlı (Marmara, Ege, vb. — Faz 2 granülaritesi)
  city   TEXT,   -- NULL = Türkiye geneli medyan
  region TEXT,   -- NULL = şehir spesifik veya Türkiye geneli

  -- Fiyat (BIGINT cent — TRY)
  price_cents     BIGINT NOT NULL CHECK (price_cents > 0),
  min_price_cents BIGINT CHECK (min_price_cents IS NULL OR min_price_cents > 0),
  max_price_cents BIGINT CHECK (max_price_cents IS NULL OR max_price_cents > 0),
  currency TEXT NOT NULL DEFAULT 'TRY' CHECK (currency IN ('TRY', 'EUR')),

  -- Önceki dönemle fiyat değişimi (yüzde — opsiyonel, hesaplanan)
  -- Pozitif = fiyat arttı, negatif = fiyat düştü
  price_change_pct NUMERIC(6,2),

  -- Veri kalitesi
  sample_size        INT NOT NULL DEFAULT 1 CHECK (sample_size > 0),
  computation_method TEXT CHECK (
    computation_method IS NULL OR
    computation_method IN ('median', 'mean', 'manual', 'external_api')
  ),
  -- Veri kaynağı (satıcı/sipariş izi bırakmaz)
  data_source TEXT CHECK (
    data_source IS NULL OR
    data_source IN ('platform_orders', 'manual_entry', 'external_api', 'market_survey')
  ),

  -- Gözlem tarihi (fiyatın geçerli olduğu tarih)
  observed_at DATE NOT NULL,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Aynı malzeme + şehir + tarih kombinasyonu unique
  CONSTRAINT price_index_unique_key UNIQUE (material_key, city, observed_at),

  -- min ≤ price ≤ max tutarlılığı
  CONSTRAINT price_index_range_chk CHECK (
    (min_price_cents IS NULL OR min_price_cents <= price_cents)
    AND (max_price_cents IS NULL OR max_price_cents >= price_cents)
  )
);

-- Temel sorgulama: malzeme fiyat geçmişi (grafik, tarih bazlı)
CREATE INDEX IF NOT EXISTS idx_price_index_material_date
  ON public.price_index (material_key, observed_at DESC);

-- Şehir + tarih bazlı (bölgesel fiyat karşılaştırma)
CREATE INDEX IF NOT EXISTS idx_price_index_city_date
  ON public.price_index (city, observed_at DESC)
  WHERE city IS NOT NULL;

-- Kategori bazlı fiyat özeti (kategori sayfasında fiyat aralığı gösterimi)
CREATE INDEX IF NOT EXISTS idx_price_index_category_date
  ON public.price_index (category_id, observed_at DESC)
  WHERE category_id IS NOT NULL;

-- Türkiye geneli (city IS NULL) en güncel fiyatlar
CREATE INDEX IF NOT EXISTS idx_price_index_national_latest
  ON public.price_index (material_key, observed_at DESC)
  WHERE city IS NULL;

COMMENT ON TABLE public.price_index IS
  'İnşaat malzemesi fiyat endeksi. YALNIZCA agregasyon verisi — tekil satıcı/sipariş datası YOK. '
  'sample_size < 3 olan kayıtlar uygulama katmanında filtrelenmelidir (anonimleştirme eşiği).';
COMMENT ON COLUMN public.price_index.material_key IS
  'Makine-okunabilir malzeme anahtarı. Örnekler: cement_42_5_ton, rebar_8mm_kg, ceramic_60x60_m2.';
COMMENT ON COLUMN public.price_index.sample_size IS
  'Kaç işlemden hesaplandı. sample_size < 3 → public''e gösterilmemeli (bireysel satıcı tanımlanabilir).';
COMMENT ON COLUMN public.price_index.city IS
  'NULL = Türkiye geneli medyan. Dolu = şehir bazlı.';
