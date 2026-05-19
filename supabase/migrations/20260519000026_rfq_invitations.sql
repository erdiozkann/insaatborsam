-- Migration: 20260519000026_rfq_invitations.sql
-- Amaç: Hangi satıcıya hangi RFQ gönderildi — funnel takibi.
-- rfqs (1) -> rfq_invitations (n) -> seller_profiles
-- Soft delete YOK — status makinesi yeterli ('invited/seen/responded/declined/expired').

CREATE TABLE IF NOT EXISTS public.rfq_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Bağlantılar
  rfq_id    UUID NOT NULL REFERENCES public.rfqs(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES public.seller_profiles(id) ON DELETE CASCADE,

  -- Davet yöntemi
  --   auto   : AI eşleştirme ile otomatik davet (match_sellers_for_rfq RPC)
  --   manual : Alıcı veya staff tarafından manuel eklendi
  invite_method TEXT NOT NULL DEFAULT 'auto' CHECK (invite_method IN ('auto', 'manual')),

  -- Durum makinesi
  --   invited   : Davet gönderildi, satıcı henüz açmadı
  --   seen      : Satıcı daveti gördü (seen_at set edilir)
  --   responded : Teklif verildi (rfq_offers tablosunda kaydı var)
  --   declined  : Satıcı teklif vermeyeceğini belirtti
  --   expired   : Talep kapandı/süresi doldu, satıcı yanıt vermedi
  status TEXT NOT NULL DEFAULT 'invited' CHECK (
    status IN ('invited', 'seen', 'responded', 'declined', 'expired')
  ),

  -- Zaman damgaları
  seen_at      TIMESTAMPTZ,
  responded_at TIMESTAMPTZ,
  declined_at  TIMESTAMPTZ,

  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Bir satıcı bir RFQ'ya bir kez davet edilir
  CONSTRAINT rfq_invitations_unique_rfq_seller UNIQUE (rfq_id, seller_id)
);

-- Satıcı gelen davetleri listeler
CREATE INDEX IF NOT EXISTS idx_rfq_invitations_seller_status
  ON public.rfq_invitations (seller_id, status);

-- RFQ'ya kaç satıcı davet edildi, kimleri yanıtladı
CREATE INDEX IF NOT EXISTS idx_rfq_invitations_rfq_status
  ON public.rfq_invitations (rfq_id, status);

COMMENT ON TABLE public.rfq_invitations IS 'RFQ-satıcı davet kaydı. AI eşleştirme (auto) veya manuel. Funnel: invited → seen → responded/declined.';
COMMENT ON COLUMN public.rfq_invitations.invite_method IS '''auto'': match_sellers_for_rfq RPC ile AI eşleştirme. ''manual'': alıcı veya staff tarafından.';
