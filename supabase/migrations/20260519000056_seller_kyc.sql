-- Migration: 20260519000056_seller_kyc.sql
-- Amaç: Satıcı KYC (Know Your Customer) doğrulama tablosu.
-- seller_profiles (1) -> seller_kyc (1:1) — her satıcı için tek KYC kaydı.
--
-- ─────────────────────────────────────────────────────────────
-- KVKK / GİZLİLİK UYARISI — ÖZEL NİTELİKLİ KİŞİSEL VERİ:
--   Bu tablo KVKK Madde 6 kapsamında özel nitelikli kişisel veri içerir:
--     - T.C. Kimlik / Pasaport (id_document_path)
--     - Vergi kimlik belgesi (tax_certificate_path)
--     - Banka hesap bilgisi (iban_document_path)
--     - Şirket imza sirküleri (signature_circular_path)
--
--   Zorunlu önlemler:
--   1. Tüm belge path'leri Supabase Storage'da ÖZEL (private) bucket'ta tutulur.
--      Bucket adı: 'seller-kyc' — public=false zorunlu.
--   2. Belgelere erişim ASLA public URL ile yapılmaz.
--      Signed URL Edge Function (service_role) tarafından kısa TTL ile üretilir:
--        storage.from('seller-kyc').createSignedUrl(path, 300) -- 5 dakika
--   3. Satıcı istemcisinde (mobile app) path değerleri gösterilmez —
--      sadece signed URL alınıp gösterilir, 5 dakika sonra sona erer.
--   4. review_notes staff iç notudur — satıcıya gösterilmez.
--      rejection_reason satıcıya gösterilir (düzeltme yönlendirmesi için).
--   5. Bu tablo içeriği log'a yazılmaz ve analytics'e aktarılmaz.
-- ─────────────────────────────────────────────────────────────
--
-- Belge yükleme akışı:
--   Satıcı → Edge Function (service_role) → Storage upload → seller_kyc INSERT/UPDATE
--   Satıcı asla doğrudan INSERT/UPDATE yapamaz.

CREATE TABLE IF NOT EXISTS public.seller_kyc (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Satıcı ile 1:1
  seller_id UUID NOT NULL UNIQUE REFERENCES public.seller_profiles(id) ON DELETE CASCADE,

  -- KYC durum makinesi
  --   pending         : Belgeler yüklendi, inceleme bekliyor
  --   under_review    : Staff inceliyor
  --   approved        : KYC geçti, seller_profiles.is_verified = TRUE tetiklenir
  --   rejected        : Belgeler reddedildi (rejection_reason satıcıya gösterilir)
  --   needs_more_info : Eksik veya hatalı belge, yeniden yükleme gerekiyor
  --   expired         : Belgeler süresi doldu, yenileme gerekiyor (Faz 2)
  status TEXT NOT NULL DEFAULT 'pending' CHECK (
    status IN ('pending', 'under_review', 'approved', 'rejected', 'needs_more_info', 'expired')
  ),

  -- ─── Belge Storage path'leri (private bucket — public URL değil) ───────────
  -- Format: '{seller_id}/{document_type}/{uuid}.{ext}'
  -- Erişim: storage.from('seller-kyc').createSignedUrl(path, 300)

  tax_certificate_path     TEXT,  -- Vergi levhası (zorunlu)
  trade_registry_path      TEXT,  -- Ticaret sicil belgesi (şirket için zorunlu)
  signature_circular_path  TEXT,  -- İmza sirküleri (şirket için zorunlu)
  id_document_path         TEXT,  -- T.C. Kimlik / Pasaport (bireysel için zorunlu)
  iban_document_path       TEXT,  -- Banka hesap cüzdanı / IBAN belgesi

  -- ─── İnceleme bilgisi ────────────────────────────────────────────────────
  -- İncelemeyi yapan staff (hesap silinirse NULL)
  reviewed_by UUID REFERENCES public.staff_users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,

  -- Satıcıya gösterilen red sebebi (rejection veya needs_more_info durumunda)
  -- Örn. "Vergi levhası okunaksız, lütfen net fotoğraf yükleyin"
  rejection_reason TEXT CHECK (rejection_reason IS NULL OR length(rejection_reason) <= 1000),

  -- Staff iç notu — SATICI GÖREMEZ
  -- Uygulama katmanı bu alanı satıcı API yanıtından mutlaka çıkarmalı.
  review_notes TEXT,

  -- Zaman damgaları
  submitted_at TIMESTAMPTZ,  -- Satıcının belge yüklediği zaman
  approved_at  TIMESTAMPTZ,  -- Onay zamanı (status='approved' ile eş zamanlı)

  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  -- deleted_at YOK — KYC yasal uyumluluk kaydı; CASCADE ile seller silinince silinir
);

-- Status bazlı index (inceleme kuyruğu: "pending/under_review olanları bul")
CREATE INDEX IF NOT EXISTS idx_seller_kyc_status
  ON public.seller_kyc (status, submitted_at ASC)
  WHERE status IN ('pending', 'under_review');

-- Satıcı bazlı lookup (satıcı kendi KYC durumunu sorgular)
CREATE INDEX IF NOT EXISTS idx_seller_kyc_seller
  ON public.seller_kyc (seller_id);

-- İnceleyen staff bazlı (staff workload için)
CREATE INDEX IF NOT EXISTS idx_seller_kyc_reviewed_by
  ON public.seller_kyc (reviewed_by)
  WHERE reviewed_by IS NOT NULL;

COMMENT ON TABLE public.seller_kyc IS
  'Satıcı KYC belgesi ve doğrulama durumu. ÖZEL NİTELİKLİ KİŞİSEL VERİ (KVKK Madde 6). '
  'Belge path''leri private Storage bucket''ta. Erişim signed URL ile (Edge Function).';
COMMENT ON COLUMN public.seller_kyc.review_notes IS
  'STAFF ÖZEL — satıcıya gösterilmez. '
  'Uygulama/Edge Function bu alanı satıcı API yanıtından ÇIKARIP göndermemeli.';
COMMENT ON COLUMN public.seller_kyc.rejection_reason IS
  'Satıcıya gösterilen red nedeni. Düzeltme yönlendirmesi için kullanılır.';
COMMENT ON COLUMN public.seller_kyc.tax_certificate_path IS
  'Supabase Storage private path. Public URL değil. '
  'Erişim: storage.from(''seller-kyc'').createSignedUrl(path, 300) — 5 dakika TTL.';
