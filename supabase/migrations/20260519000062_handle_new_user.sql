-- Migration: 20260519000062_handle_new_user.sql
-- Amaç: auth.users INSERT olduğunda public.profiles otomatik oluşturulur.
--
-- Trigger akışı:
--   Supabase Auth kayıt → auth.users INSERT → on_auth_user_created trigger
--   → handle_new_user() SECURITY DEFINER → public.profiles INSERT
--
-- Metadata sözleşmesi (web/mobile app kayıt formundan iletilmeli):
--   raw_user_meta_data: {
--     "full_name": "Ad Soyad",
--     "role": "buyer" | "seller",          -- varsayılan: "buyer"
--     "phone": "+905xxxxxxxxx",             -- opsiyonel
--     "consent_kvkk": true,                 -- kayıt formunda zorunlu
--     "consent_marketing": false,           -- kayıt formunda opsiyonel
--     "preferred_language": "tr"            -- varsayılan: "tr"
--   }
--
-- Güvenlik:
--   - SECURITY DEFINER: function postgres yetkileriyle çalışır, profiles INSERT yapabilir.
--   - SET search_path: SQL injection güvenliği.
--   - Hata sessizce yutulmaz — constraint ihlali veya kritik hata trigger'ı durdurur.
--   - ON CONFLICT (id) DO NOTHING: duplicate trigger için güvenlik ağı.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_role TEXT;
  v_full_name TEXT;
  v_phone TEXT;
  v_consent_kvkk BOOLEAN;
  v_consent_marketing BOOLEAN;
  v_preferred_language TEXT;
BEGIN
  -- Role: metadata'dan al, geçerli değilse 'buyer'
  v_role := CASE
    WHEN NULLIF(TRIM(NEW.raw_user_meta_data->>'role'), '') IN ('buyer', 'seller', 'transporter', 'staff')
      THEN TRIM(NEW.raw_user_meta_data->>'role')
    ELSE 'buyer'
  END;

  -- full_name: metadata'dan al; Google/Apple OAuth 'name' alanını da dene
  v_full_name := COALESCE(
    NULLIF(TRIM(NEW.raw_user_meta_data->>'full_name'), ''),
    NULLIF(TRIM(NEW.raw_user_meta_data->>'name'), ''),
    'Kullanıcı'  -- son çare placeholder; uygulama profil tamamlama ekranına yönlendirmeli
  );

  -- phone: auth phone (SMS login) veya metadata
  v_phone := NULLIF(TRIM(
    COALESCE(NEW.phone, NEW.raw_user_meta_data->>'phone', '')
  ), '');

  -- KVKK onayı: 'true' string'i TRUE olarak yorumla, diğer her şey FALSE
  -- Tasarım kararı: boolean cast yerine string karşılaştırma — '1', 'yes' gibi değerler FALSE döner.
  v_consent_kvkk :=
    (NEW.raw_user_meta_data->>'consent_kvkk') = 'true';

  v_consent_marketing :=
    (NEW.raw_user_meta_data->>'consent_marketing') = 'true';

  -- Dil tercihi
  v_preferred_language := COALESCE(
    NULLIF(TRIM(NEW.raw_user_meta_data->>'preferred_language'), ''),
    'tr'
  );

  -- profiles INSERT
  -- ON CONFLICT (id) DO NOTHING: trigger iki kez tetiklenirse ikinci run sessizce geçer.
  -- email unique index partial (WHERE deleted_at IS NULL) — soft-deleted eski hesap varsa çakışmaz.
  INSERT INTO public.profiles (
    id,
    email,
    phone,
    full_name,
    role,
    preferred_language,
    consent_kvkk,
    consent_kvkk_at,
    consent_marketing,
    consent_marketing_at,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    v_phone,
    v_full_name,
    v_role,
    v_preferred_language,
    v_consent_kvkk,
    CASE WHEN v_consent_kvkk     THEN NOW() ELSE NULL END,
    v_consent_marketing,
    CASE WHEN v_consent_marketing THEN NOW() ELSE NULL END,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

-- Erişim kontrolü: Supabase auth mekanizması tetikler (auth schema işlemi)
-- Fonksiyon authenticated rolüne açık değil; sadece auth trigger içinden çağrılır.
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC;

-- Trigger: auth.users'a yeni kayıt geldiğinde
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

COMMENT ON FUNCTION public.handle_new_user() IS
  'auth.users INSERT trigger. public.profiles otomatik oluşturur. '
  'SECURITY DEFINER — auth trigger context''inden çağrılır, kullanıcı rolü değil.';
