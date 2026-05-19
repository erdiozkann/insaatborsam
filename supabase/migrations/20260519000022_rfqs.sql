-- Migration: 20260519000022_rfqs.sql
-- Amaç: RFQ (Teklif Talebi / Request for Quotation) ana tablosu.
-- buyer_profiles (1) -> rfqs (n) -> rfq_items, rfq_invitations, rfq_offers
--
-- Para kolonları:
--   estimated_budget_cents: opsiyonel üst bütçe limiti (BIGINT cent).
-- Miktar kolonları:
--   quantity: NUMERIC(12,2) — fiziksel miktar, kesirli olabilir (15.5 m²).

CREATE TABLE IF NOT EXISTS public.rfqs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Talebi oluşturan alıcı
  buyer_id UUID NOT NULL REFERENCES public.buyer_profiles(id) ON DELETE CASCADE,

  -- Talep detayları
  title TEXT NOT NULL,
  description TEXT NOT NULL,

  -- Kategori (opsiyonel — ürün seçilmeden de RFQ açılabilir)
  category_id UUID REFERENCES public.categories(id) ON DELETE RESTRICT,
  brand_preference TEXT,

  -- Miktar ve birim (ana talep — çok kalemli talep için rfq_items)
  quantity NUMERIC(12,2) NOT NULL CHECK (quantity > 0),
  unit TEXT NOT NULL CHECK (unit IN ('m2', 'm3', 'metre', 'ton', 'kg', 'adet', 'paket', 'kutu', 'litre', 'cuval')),

  -- Bütçe üst limiti (opsiyonel, BIGINT cent)
  estimated_budget_cents BIGINT CHECK (estimated_budget_cents IS NULL OR estimated_budget_cents > 0),

  -- Teslimat
  delivery_address_id UUID REFERENCES public.addresses(id) ON DELETE SET NULL,
  delivery_deadline DATE NOT NULL,

  -- Referans görsel (Supabase Storage URL, opsiyonel)
  reference_image_url TEXT,

  -- AI tarafından ayrıştırılan yapılandırılmış veri (Claude Haiku — Faz 2 AI Sprint)
  --   örn. {"malzeme": "seramik", "boyut": "60x60", "adet": 150}
  parsed_data JSONB NOT NULL DEFAULT '{}'::jsonb,

  -- AI embedding (RFQ-satıcı eşleştirme için — OpenAI text-embedding-3-small, 1536 dim)
  embedding vector(1536),

  -- Durum makinesi
  --   open       : teklif alınıyor
  --   evaluating : teklifler değerlendiriliyor (alıcı karar aşamasında)
  --   closed     : bir teklif kabul edildi / sipariş oluşturuldu
  --   expired    : expires_at geçti, kapatıldı
  --   cancelled  : alıcı iptal etti
  status TEXT NOT NULL DEFAULT 'open' CHECK (
    status IN ('open', 'evaluating', 'closed', 'expired', 'cancelled')
  ),

  -- Cached sayaçlar (trigger ile güncellenir)
  sent_to_count INTEGER NOT NULL DEFAULT 0 CHECK (sent_to_count >= 0),
  viewed_count  INTEGER NOT NULL DEFAULT 0 CHECK (viewed_count >= 0),
  offer_count   INTEGER NOT NULL DEFAULT 0 CHECK (offer_count >= 0),

  -- Zaman
  expires_at TIMESTAMPTZ NOT NULL,
  closed_at  TIMESTAMPTZ,

  -- Standart audit kolonları
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,

  -- expires_at her zaman created_at'ten sonra olmalı
  CONSTRAINT rfqs_expires_after_created_chk CHECK (expires_at > created_at),
  -- closed_at ancak status = 'closed' iken set edilmeli — uygulama katmanında kontrol
  CONSTRAINT rfqs_deadline_future_chk CHECK (delivery_deadline >= CURRENT_DATE)
);

-- Alıcı bazlı index
CREATE INDEX IF NOT EXISTS idx_rfqs_buyer
  ON public.rfqs (buyer_id) WHERE deleted_at IS NULL;

-- Durum bazlı index (açık talepler sıklıkla sorgulanır)
CREATE INDEX IF NOT EXISTS idx_rfqs_status
  ON public.rfqs (status) WHERE deleted_at IS NULL;

-- Süresi dolacak açık taleplerin tespiti için (cron job)
CREATE INDEX IF NOT EXISTS idx_rfqs_expires_open
  ON public.rfqs (expires_at) WHERE status = 'open' AND deleted_at IS NULL;

-- Kategori bazlı index
CREATE INDEX IF NOT EXISTS idx_rfqs_category
  ON public.rfqs (category_id) WHERE deleted_at IS NULL;

-- Embedding HNSW index (satıcı eşleştirme)
CREATE INDEX IF NOT EXISTS idx_rfqs_embedding_hnsw
  ON public.rfqs
  USING hnsw (embedding vector_cosine_ops);

COMMENT ON TABLE public.rfqs IS 'RFQ (Teklif Talebi). Alıcı açar, davetli satıcılar teklif verir. AI embedding ile satıcı eşleştirme.';
COMMENT ON COLUMN public.rfqs.parsed_data IS 'Claude Haiku ile ayrıştırılmış yapılandırılmış veri (Faz 2 AI Sprint). Şimdilik boş JSON.';
COMMENT ON COLUMN public.rfqs.estimated_budget_cents IS 'Opsiyonel üst bütçe (cent). Satıcılara gösterilmez — eşleştirme filtresinde kullanılır.';
