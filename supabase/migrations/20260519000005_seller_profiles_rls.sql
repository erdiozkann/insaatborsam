-- Migration: 20260519000005_seller_profiles_rls.sql
-- Amaç: seller_profiles tablosu için RLS politikaları.
--
-- Politika özeti:
--   - Public read: Doğrulanmış (is_verified=TRUE) ve silinmemiş satıcılar herkese
--     açık (mağaza vitrini). Anonim kullanıcı da görebilir.
--   - Owner CRUD: Satıcı kendi profilini günceller (verified flag'i hariç — UI'da disabled).
--   - INSERT: Kullanıcı kendi user_id ile bir seller_profile yaratabilir.
--   - DELETE: Soft delete (deleted_at) — hard delete yok.
--
-- NOT: is_verified flag'i sadece staff tarafından değiştirilebilir.
-- Bu kontrol uygulama katmanında veya ileride trigger ile sağlanacak.

-- RLS'i aç
ALTER TABLE public.seller_profiles ENABLE ROW LEVEL SECURITY;

-- Önceki policy'leri temizle (idempotent)
DROP POLICY IF EXISTS "seller_profiles_public_read_verified" ON public.seller_profiles;
DROP POLICY IF EXISTS "seller_profiles_select_own" ON public.seller_profiles;
DROP POLICY IF EXISTS "seller_profiles_insert_own" ON public.seller_profiles;
DROP POLICY IF EXISTS "seller_profiles_update_own" ON public.seller_profiles;

-- SELECT (public): doğrulanmış satıcıların vitrin bilgisini herkes görebilir
-- (anon + authenticated). IBAN ve hassas veri uygulama katmanında SELECT ile maskelenmeli.
CREATE POLICY "seller_profiles_public_read_verified"
  ON public.seller_profiles
  FOR SELECT
  TO anon, authenticated
  USING (
    is_verified = TRUE
    AND deleted_at IS NULL
  );

-- SELECT (owner): satıcı kendi profilini her durumda görür (doğrulanmamış da olsa)
CREATE POLICY "seller_profiles_select_own"
  ON public.seller_profiles
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- INSERT: kullanıcı yalnızca kendi user_id'siyle eşleşen seller_profile yaratabilir
CREATE POLICY "seller_profiles_insert_own"
  ON public.seller_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- UPDATE: satıcı kendi profilini günceller
-- Kritik: is_verified kolonu kullanıcı tarafından DEĞİŞTİRİLEMEZ.
-- WITH CHECK içindeki subquery, NEW.is_verified'ı satırın MEVCUT (DB'deki) değerine
-- kilitler. Bu sayede UPDATE statement'ı is_verified set etse bile policy reddeder.
-- Subquery RLS değerlendirmesinden geçer — SELECT policy "seller_profiles_select_own"
-- sayesinde kullanıcı kendi satırını görür, recursion riski yok.
-- staff_users kurulduktan sonra ek trigger ile staff/service_role override eklenecek.
CREATE POLICY "seller_profiles_update_own"
  ON public.seller_profiles
  FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid()
    AND deleted_at IS NULL
  )
  WITH CHECK (
    user_id = auth.uid()
    AND is_verified = (
      SELECT sp.is_verified
      FROM public.seller_profiles sp
      WHERE sp.id = seller_profiles.id
    )
  );

-- DELETE: yok (soft delete pattern). Hard delete sadece service_role ile.
