-- Migration: 20260519000057_seller_kyc_rls.sql
-- Amaç: seller_kyc tablosu için RLS politikaları.
--
-- Politika özeti:
--   - Seller SELECT: Satıcı sadece kendi KYC satırını görür.
--     UYARI: review_notes alanı bu SELECT ile de döner.
--     Uygulama/Edge Function satıcıya gönderilen yanıttan review_notes'u
--     MUTLAKA çıkarmalıdır. Kolon bazlı güvenlik (GRANT/REVOKE) Faz 2'de.
--   - INSERT: Yok — belge yükleme Edge Function (service_role) ile yapılır.
--     Satıcı yeni KYC kaydı oluşturamaz; Edge Function ilk kayıt + sonraki
--     güncelemeleri yönetir.
--   - UPDATE: Yok — KYC güncellemesi (yeni belge yükleme, status değişimi)
--     Edge Function üzerinden service_role ile yapılır.
--   - DELETE: Yok — yasal uyumluluk kaydı (cascade ile seller silinince otomatik).
--
-- Staff erişimi: staff_access_policies.sql toplu migration'da eklenecek.
--   Staff KYC inceleme kuyruğunu görmek için rol bazlı SELECT policy gerekli.
--
-- ─────────────────────────────────────────────────────────────
-- KRİTİK UYGULAMA KURALI — review_notes alanı:
--   Bu tablo SELECT policy ile satıcı TÜM kolonları okuyabilir.
--   review_notes staff iç notudur — satıcıya gösterilmemeli.
--
--   Uygulama katmanında zorunlu: satıcıya gönderilecek KYC yanıtında
--   review_notes alanı DROP edilmeli. Örnek (Edge Function TypeScript):
--
--     const { review_notes, ...safeKyc } = kycData;
--     return safeKyc;  // review_notes yok
--
--   Faz 2'de kolon bazlı güvenlik ile DB seviyesinde çözülecek:
--     REVOKE SELECT (review_notes) ON seller_kyc FROM authenticated;
-- ─────────────────────────────────────────────────────────────

-- RLS'i aç
ALTER TABLE public.seller_kyc ENABLE ROW LEVEL SECURITY;

-- Önceki policy'leri temizle (idempotent)
DROP POLICY IF EXISTS "seller_kyc_select_own" ON public.seller_kyc;

-- SELECT: Satıcı kendi KYC satırını görür
-- (review_notes dahil — uygulama katmanında filtreleme zorunlu)
CREATE POLICY "seller_kyc_select_own"
  ON public.seller_kyc
  FOR SELECT
  TO authenticated
  USING (
    seller_id IN (
      SELECT id FROM public.seller_profiles
      WHERE user_id = auth.uid()
        AND deleted_at IS NULL
    )
  );

-- INSERT policy YOK — belge yükleme akışı:
--   Satıcı → Edge Function (service_role) → Storage upload → seller_kyc INSERT
--
-- UPDATE policy YOK — güncelleme akışı:
--   Satıcı yeni belge yükler → Edge Function (service_role) → Storage upload → seller_kyc UPDATE
--   Staff inceler → Edge Function (service_role) → status, rejection_reason, review_notes UPDATE
--
-- DELETE policy YOK — seller_profiles CASCADE ile otomatik silinir.
