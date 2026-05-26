-- Migration: 20260526000001_auth_security_preflight.sql
-- Sprint 3 Auth Security Preflight — 2026-05-26
-- Owner: Erdi
--
-- AMAÇ:
--   Auth akışı (login/register UI) başlamadan önce iki kritik privilege escalation
--   açığını kapatmak. Bu migration olmadan:
--     1) Herhangi bir kullanıcı signUp({ data: { role: 'staff' } }) ile staff profili açabilir.
--     2) Herhangi bir authenticated kullanıcı kendi subscription_tier/rating/verified alanlarını
--        doğrudan UPDATE ile yükseltebilir/değiştirebilir.
--
-- KAPSAM:
--   GÖREV 1 — handle_new_user():    'staff' rol enjeksiyonu kapatıldı.
--   GÖREV 2 — buyer_profiles:       subscription_tier + ödeme/sistem alanları kilitlendi.
--   GÖREV 3 — seller_profiles:      Mevcut is_verified kilidi korunuyor +
--                                   subscription_tier + sistem alanları eklendi.
--
-- ETKİ / BAĞIMLILIK:
--   - Mevcut buyer/seller UX: YOK (kullanıcı zaten bu alanları değiştiremezdi,
--     sadece RLS'de açıkça engellenmiyordu).
--   - Mevcut staff_users / is_active_staff() / has_staff_role(): DOKUNULMADI.
--   - webhook_events, ai_cache, deny-by-default tabloları: DOKUNULMADI.
--   - Sprint 2.8 security hardening (20260525000001): BOZULMADI.
--   - Sprint 3 search quota (monthly_searches_used): Artık SECURITY DEFINER RPC
--     gerektirir — doğru mimari, uygulama katmanında doğrudan UPDATE geçersiz.
--
-- TEHDİT REFERANSLARI (docs/10-THREAT_MODEL.md):
--   T03 türevi — "sistem alanı manipülasyonu": kullanıcı kendi verified/tier alanını değiştirir.
--   T08 türevi — "privilege escalation": 'staff' rolü public signup ile elde edilir.
--
-- SKILL KONTROL LİSTESİ (rls-policy-audit + security-review + supabase-rls-validator):
--   [x] DROP POLICY IF EXISTS — idempotent ✓
--   [x] UPDATE policy hem USING hem WITH CHECK — ✓
--   [x] WITH CHECK subquery pattern: kendi satırı, recursion riski yok — ✓
--   [x] deleted_at IS NULL — USING clause'da ✓
--   [x] user_id = auth.uid() — hem USING hem WITH CHECK ✓
--   [x] Staff INSERT/UPDATE/DELETE policy eklenmedi — ✓
--   [x] SECURITY DEFINER + SET search_path + REVOKE — ✓
--   [x] Service role kullanılmıyor — ✓
--   [x] deny-by-default tabloları (webhook_events, ai_cache) dokunulmadı — ✓

-- =============================================================================
-- GÖREV 1: handle_new_user() — 'staff' rol enjeksiyonu kapatma
-- =============================================================================
--
-- SORUN:
--   Mevcut fonksiyon (20260519000062):
--     WHEN ... IN ('buyer', 'seller', 'transporter', 'staff') THEN ...
--   Saldırgan adımları:
--     supabase.auth.signUp({ phone, data: { role: 'staff', full_name: 'X' } })
--     → auth.users INSERT → handle_new_user tetiklenir
--     → profiles.role = 'staff' olarak yazılır
--     → is_active_staff() = TRUE döner (staff_users olmasa da profiles.role 'staff')
--     → 17+ tablodaki staff SELECT policy'leri açılır → veri sızıntısı
--
-- FİX:
--   CASE ifadesinde 'staff' kaldırıldı. Kabul edilen roller: 'buyer', 'seller', 'transporter'.
--   'staff', 'admin', 'owner', 'superadmin' veya bilinmeyen → 'buyer' default.
--
-- STAFF HESAP OLUŞTURMA NOTU (Sprint 3+ için):
--   Staff hesabı yalnızca service_role ile oluşturulabilir:
--     1. supabase.auth.admin.createUser({ email, password, user_metadata: { role: 'staff' } })
--        → Trigger 'buyer' default ile profiles satırı açar (staff metadata ignored).
--     2. service_role ile: UPDATE public.profiles SET role='staff' WHERE id=<uid>
--     3. service_role ile: INSERT INTO public.staff_users(user_id, role_id, ...) VALUES(...)
--   Bu 3 adım Sprint 4 Admin Panel Edge Function'ında implement edilecek.
--
-- TRIGGER NOTU:
--   `on_auth_user_created` trigger'ı (20260519000062) yeniden oluşturulmaz.
--   CREATE OR REPLACE FUNCTION aynı OID'yi korur; trigger referansı geçerli kalır.
--
-- GÜVENLIK KURALLARI:
--   SECURITY DEFINER + SET search_path = public, pg_temp → korunuyor
--   REVOKE ALL FROM PUBLIC + anon + authenticated → yenileniyor (idempotent)

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_role               TEXT;
  v_full_name          TEXT;
  v_phone              TEXT;
  v_consent_kvkk       BOOLEAN;
  v_consent_marketing  BOOLEAN;
  v_preferred_language TEXT;
BEGIN
  -- ── Rol güvenlik filtresi ────────────────────────────────────────────────
  -- YALNIZCA 'buyer', 'seller', 'transporter' kabul edilir.
  -- 'staff', 'admin', 'owner' veya herhangi bilinmeyen değer → 'buyer' default.
  -- Staff hesapları sadece service_role / Supabase admin API ile oluşturulur.
  -- Gerekçe: is_active_staff() = TRUE için profiles.role='staff' yeterli —
  --   public signup bu yetkiyi veremez.
  v_role := CASE
    WHEN NULLIF(TRIM(NEW.raw_user_meta_data->>'role'), '') IN ('buyer', 'seller', 'transporter')
      THEN TRIM(NEW.raw_user_meta_data->>'role')
    ELSE 'buyer'
  END;

  -- ── full_name ─────────────────────────────────────────────────────────────
  -- metadata 'full_name' → OAuth 'name' → son çare placeholder
  v_full_name := COALESCE(
    NULLIF(TRIM(NEW.raw_user_meta_data->>'full_name'), ''),
    NULLIF(TRIM(NEW.raw_user_meta_data->>'name'),      ''),
    'Kullanıcı'
  );

  -- ── phone ─────────────────────────────────────────────────────────────────
  -- SMS OTP akışında auth.phone dolu gelir; OAuth akışında metadata'dan alınır.
  v_phone := NULLIF(TRIM(
    COALESCE(NEW.phone, NEW.raw_user_meta_data->>'phone', '')
  ), '');

  -- ── KVKK onayları ─────────────────────────────────────────────────────────
  -- Sadece tam 'true' string kabul edilir ('1', 'yes' gibi değerler FALSE sayılır).
  v_consent_kvkk      := (NEW.raw_user_meta_data->>'consent_kvkk')      = 'true';
  v_consent_marketing := (NEW.raw_user_meta_data->>'consent_marketing') = 'true';

  -- ── Dil tercihi ───────────────────────────────────────────────────────────
  v_preferred_language := COALESCE(
    NULLIF(TRIM(NEW.raw_user_meta_data->>'preferred_language'), ''),
    'tr'
  );

  -- ── profiles INSERT ───────────────────────────────────────────────────────
  -- ON CONFLICT (id) DO NOTHING: trigger iki kez tetiklenirse ikinci run geçer.
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

-- REVOKE kuralları — Sprint 2.8 (20260525000001) REVOKE'ları yenileniyor (idempotent).
-- CREATE OR REPLACE sonrası Supabase default grant'ları sıfırlanmış olabilir; güvence için.
REVOKE ALL      ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE EXECUTE  ON FUNCTION public.handle_new_user() FROM anon;
REVOKE EXECUTE  ON FUNCTION public.handle_new_user() FROM authenticated;

COMMENT ON FUNCTION public.handle_new_user() IS
  'auth.users INSERT trigger — public.profiles otomatik oluşturur. '
  'SECURITY DEFINER, SET search_path = public. '
  '20260526000001 fix: staff/admin/owner rol enjeksiyonu kapatıldı. '
  'Staff hesapları yalnızca service_role + 3 adım prosedürü ile oluşturulabilir.';


-- =============================================================================
-- GÖREV 2: buyer_profiles — subscription_tier + sistem alanları kilidi
-- =============================================================================
--
-- SORUN:
--   Mevcut policy (20260519000007):
--     WITH CHECK (user_id = auth.uid())
--   Bu WITH CHECK subscription_tier dahil tüm alanları güncellemeye izin verir.
--   Saldırgan: UPDATE buyer_profiles SET subscription_tier='business' WHERE user_id=auth.uid()
--   → Ücret ödemeden 'business' plan özelliklerine erişim.
--
-- FİX:
--   WITH CHECK'e sistem alanları için subquery kilitler eklendi.
--   Pattern: NEW.alan = (SELECT mevcut_deger FROM ... WHERE id = kendi_id)
--   Değiştirmeye çalışılırsa NEW.alan != mevcut_deger → CHECK FALSE → UPDATE RED.
--
-- KİLİTLENEN ALANLAR:
--   subscription_tier        NOT NULL DEFAULT 'free'  → webhook/service_role günceller
--   subscription_expires_at  NULLABLE                 → webhook/service_role günceller
--   monthly_searches_used    NOT NULL DEFAULT 0       → SECURITY DEFINER RPC artırır
--   monthly_searches_reset_at NOT NULL                → cron/service_role sıfırlar
--
-- KULLANICI GÜNCELLEYEBİLECEĞİ ALANLAR (kilit yok):
--   company_name, company_type, tax_id (kısmi)
--   (Bunlar profil tamamlama / ayarlar sayfasından güncellenir)
--
-- RECURSION RİSKİ: YOK
--   buyer_profiles_select_own policy (20260519000007):
--     USING (user_id = auth.uid() AND deleted_at IS NULL)
--   WITH CHECK içindeki subquery'ler kendi satırına SELECT yapar → policy izin verir.
--   Aynı satırı okuma → döngü yok.
--
-- NOT NULL / NULLABLE AYRIMI:
--   subscription_tier     → NOT NULL → = operatörü
--   subscription_expires_at → NULLABLE → IS NOT DISTINCT FROM (NULL güvenli karşılaştırma)
--   monthly_searches_used → NOT NULL → = operatörü
--   monthly_searches_reset_at → NOT NULL → = operatörü

DROP POLICY IF EXISTS "buyer_profiles_update_own" ON public.buyer_profiles;

CREATE POLICY "buyer_profiles_update_own"
  ON public.buyer_profiles
  FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid()
    AND deleted_at IS NULL
  )
  WITH CHECK (
    user_id = auth.uid()
    -- subscription_tier kilidi: webhooklar günceller, kullanıcı değiştiremez
    AND subscription_tier = (
      SELECT bp2.subscription_tier
      FROM public.buyer_profiles bp2
      WHERE bp2.id = buyer_profiles.id
    )
    -- subscription_expires_at kilidi: NULLABLE → IS NOT DISTINCT FROM
    AND subscription_expires_at IS NOT DISTINCT FROM (
      SELECT bp2.subscription_expires_at
      FROM public.buyer_profiles bp2
      WHERE bp2.id = buyer_profiles.id
    )
    -- monthly_searches_used kilidi: SECURITY DEFINER RPC artırır (Sprint 3+)
    AND monthly_searches_used = (
      SELECT bp2.monthly_searches_used
      FROM public.buyer_profiles bp2
      WHERE bp2.id = buyer_profiles.id
    )
    -- monthly_searches_reset_at kilidi: cron/service_role sıfırlar
    AND monthly_searches_reset_at = (
      SELECT bp2.monthly_searches_reset_at
      FROM public.buyer_profiles bp2
      WHERE bp2.id = buyer_profiles.id
    )
  );


-- =============================================================================
-- GÖREV 3: seller_profiles — is_verified kilidi KORUNUYOR +
--           subscription_tier + sistem alanları ekleniyor
-- =============================================================================
--
-- SORUN:
--   Mevcut policy (20260519000005):
--     WITH CHECK (user_id=auth.uid() AND is_verified = (SELECT ...))
--   is_verified kilidi VAR ama subscription_tier, rating alanları AÇIK.
--   Saldırgan: UPDATE seller_profiles SET subscription_tier='enterprise' WHERE user_id=auth.uid()
--   veya:      UPDATE seller_profiles SET rating_avg=5.0, rating_count=999 WHERE user_id=auth.uid()
--
-- FİX:
--   Mevcut is_verified subquery kilidi tamamen korunuyor (000005 pattern bozulmadı).
--   Aşağıdaki sistem alanları ek kilitleniyor:
--
-- KİLİTLENEN ALANLAR (YENİ):
--   verified_at              NULLABLE  → staff/service_role günceller
--   subscription_tier        NULLABLE  → webhook/service_role günceller
--   subscription_expires_at  NULLABLE  → webhook/service_role günceller
--   successful_orders_count  NOT NULL  → sipariş tamamlama trigger günceller
--   rating_avg               NOT NULL  → update_seller_rating_on_review() trigger günceller
--   rating_count             NOT NULL  → update_seller_rating_on_review() trigger günceller
--
-- KİLİTLENEN ALANLAR (MEVCUT — 000005'ten miras):
--   is_verified              NOT NULL  → staff/service_role günceller
--
-- KULLANICI GÜNCELLEYEBİLECEĞİ ALANLAR (kilit yok):
--   company_name, company_type, trade_registry_no, store_name, store_slug,
--   store_description, store_logo_url, store_cover_url, primary_city,
--   primary_district, service_areas, iban_encrypted (Vault'a taşınana kadar)
--
-- NOT NULL / NULLABLE AYRIMI:
--   is_verified             → NOT NULL → = operatörü (mevcut pattern korunuyor)
--   verified_at             → NULLABLE → IS NOT DISTINCT FROM
--   subscription_tier       → NULLABLE → IS NOT DISTINCT FROM
--   subscription_expires_at → NULLABLE → IS NOT DISTINCT FROM
--   successful_orders_count → NOT NULL → = operatörü
--   rating_avg              → NOT NULL → = operatörü (NUMERIC)
--   rating_count            → NOT NULL → = operatörü
--
-- TRİGGER NOTU (update_seller_rating_on_review):
--   Bu fonksiyon SECURITY DEFINER (Migration 000063) olarak çalışır.
--   SECURITY DEFINER + postgres user → RLS bypass → rating güncellemesi çalışmaya devam eder.
--
-- RECURSION RİSKİ: YOK
--   seller_profiles_select_own (20260519000005):
--     USING (user_id = auth.uid())
--   Kendi satırına WITH CHECK subquery → policy izin verir → döngü yok.
--   Bu pattern 000005'te kanıtlandı ve aynı şekilde kullanılıyor.

DROP POLICY IF EXISTS "seller_profiles_update_own" ON public.seller_profiles;

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
    -- is_verified kilidi: KORUNUYOR (000005 pattern) — staff/service_role günceller
    AND is_verified = (
      SELECT sp2.is_verified
      FROM public.seller_profiles sp2
      WHERE sp2.id = seller_profiles.id
    )
    -- verified_at kilidi: NULLABLE → IS NOT DISTINCT FROM — staff günceller
    AND verified_at IS NOT DISTINCT FROM (
      SELECT sp2.verified_at
      FROM public.seller_profiles sp2
      WHERE sp2.id = seller_profiles.id
    )
    -- subscription_tier kilidi: NULLABLE → IS NOT DISTINCT FROM — webhooklar günceller
    AND subscription_tier IS NOT DISTINCT FROM (
      SELECT sp2.subscription_tier
      FROM public.seller_profiles sp2
      WHERE sp2.id = seller_profiles.id
    )
    -- subscription_expires_at kilidi: NULLABLE → IS NOT DISTINCT FROM
    AND subscription_expires_at IS NOT DISTINCT FROM (
      SELECT sp2.subscription_expires_at
      FROM public.seller_profiles sp2
      WHERE sp2.id = seller_profiles.id
    )
    -- successful_orders_count kilidi: NOT NULL — sipariş trigger günceller
    AND successful_orders_count = (
      SELECT sp2.successful_orders_count
      FROM public.seller_profiles sp2
      WHERE sp2.id = seller_profiles.id
    )
    -- rating_avg kilidi: NOT NULL NUMERIC — update_seller_rating_on_review() günceller
    AND rating_avg = (
      SELECT sp2.rating_avg
      FROM public.seller_profiles sp2
      WHERE sp2.id = seller_profiles.id
    )
    -- rating_count kilidi: NOT NULL — update_seller_rating_on_review() günceller
    AND rating_count = (
      SELECT sp2.rating_count
      FROM public.seller_profiles sp2
      WHERE sp2.id = seller_profiles.id
    )
  );


-- =============================================================================
-- GÖREV 4: profiles — role + email + created_at + consent_kvkk kilidi
-- =============================================================================
--
-- SORUN:
--   Mevcut policy (20260519000003):
--     WITH CHECK (auth.uid() = id)
--   Hiçbir alan kilitli değil. Authenticated kullanıcı kendi profiles satırında:
--     UPDATE profiles SET role='staff' → is_active_staff()=TRUE → 17+ tablo erişimi
--     UPDATE profiles SET email='sahte@domain.com' → auth.users ile tutarsızlık
--     UPDATE profiles SET consent_kvkk=false → KVKK uyum kaydı bozulur
--     UPDATE profiles SET created_at='1900-01-01' → audit güvenilirliği kaybolur
--   Not: 000003 yorum "id ve role değiştirilemez — uygulama katmanında" diyordu.
--   Bu migration o kontrolü DB katmanına taşıyor.
--
-- FİX:
--   role, email, created_at, consent_kvkk, consent_kvkk_at kilitlendi.
--   Kalan profil alanları (full_name, phone, avatar_url, preferred_language,
--   consent_marketing, consent_marketing_at, deleted_at, updated_at) açık.
--
-- RECURSION RİSKİ: YOK
--   profiles_select_own: USING (auth.uid() = id AND deleted_at IS NULL)
--   USING clause, güncellenen satırın auth.uid()=id ve deleted_at IS NULL olduğunu garantiler.
--   WITH CHECK subquery: WHERE p2.id = auth.uid() → aynı (kendi) satırı okur.
--   profiles_select_own USING ifadesi saf expression — başka tablo sorgusu yok.
--   Zincir: UPDATE policy WITH CHECK → SELECT profiles_select_own → biter. Döngü yok.
--   MVCC: subquery UPDATE öncesi committed snapshot okur.
--
-- NEDEN role KİLİTLENDİ:
--   Privilege escalation ana riski. profiles.role='staff' → is_active_staff()=TRUE →
--   000064 staff SELECT policy'leri açılır → tüm platform verisi okunabilir.
--   T08 + T09 tehdit kombinasyonu (docs/10-THREAT_MODEL.md).
--
-- NEDEN email KİLİTLENDİ:
--   email Supabase auth.users.email'in yetkisindedir.
--   profiles.email doğrudan değiştirmek auth sistemi ile tutarsızlık yaratır.
--   Email değişikliği supabase.auth.updateUser() → auth.users → handle_new_user dışı
--   bir sync mekanizması gerektirir (Sprint 4+).
--
-- NEDEN consent_kvkk KİLİTLENDİ:
--   KVKK onayı handle_new_user trigger'i tarafından metadata'dan alınır (kayıt anı).
--   Onay geri çekme KVKK Madde 5/3 kapsamında hukuki süreç gerektirir;
--   doğrudan UPDATE değil, Sprint 4 veri silme Edge Function'i ile yapılır.
--   Rastgele consent_kvkk=false → hesap bütünlüğü bozulur.
--
-- NEDEN consent_marketing AÇIK BIRAKILDI:
--   KVKK Madde 11 gereği pazarlama tercihi kullanıcı kontrolündedir (opt-out hakkı).
--   consent_marketing_at de açık: tercih değişim zaman damgası.
--
-- NEDEN deleted_at AÇIK BIRAKILDI:
--   Soft delete: UPDATE profiles SET deleted_at=NOW() bu policy üzerinden geçer.
--   profiles_soft_delete_own policy mevcut değil (000003'te drop, recreate yok).
--   deleted_at kilitlenmesi hesap silme işlevini kırar.
--   Hard delete yalnızca service_role (Edge Function).
--
-- KİLİTLENEN ALANLAR (NOT NULL / NULLABLE):
--   role            TEXT NOT NULL        → = operatörü
--   email           TEXT NOT NULL        → = operatörü
--   created_at      TIMESTAMPTZ NOT NULL → = operatörü
--   consent_kvkk    BOOLEAN NOT NULL     → = operatörü
--   consent_kvkk_at TIMESTAMPTZ NULLABLE → IS NOT DISTINCT FROM
--
-- KULLANICI GÜNCELLEYEBİLECEĞİ ALANLAR (kilit yok):
--   full_name, phone, avatar_url, preferred_language
--   consent_marketing, consent_marketing_at
--   deleted_at (soft delete), updated_at (trigger zaten üzerine yazar)
--
-- KORUNAN MEVCUT POLİCY'LER (DOKUNULMADI):
--   profiles_select_own (000003), profiles_insert_own (000003),
--   profiles_staff_read (000064)

DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;

CREATE POLICY "profiles_update_own"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = id
    AND deleted_at IS NULL
  )
  WITH CHECK (
    auth.uid() = id
    -- role kilidi: privilege escalation engeli — 'staff' dahil hiçbir role değişikliği
    AND role = (
      SELECT p2.role
      FROM public.profiles p2
      WHERE p2.id = auth.uid()
    )
    -- email kilidi: Supabase auth.users yetkisinde, doğrudan UPDATE yasak
    AND email = (
      SELECT p2.email
      FROM public.profiles p2
      WHERE p2.id = auth.uid()
    )
    -- created_at kilidi: audit timestamp — NOT NULL, = operatörü
    AND created_at = (
      SELECT p2.created_at
      FROM public.profiles p2
      WHERE p2.id = auth.uid()
    )
    -- consent_kvkk kilidi: kayıt anında alınan KVKK onayı — NOT NULL, = operatörü
    AND consent_kvkk = (
      SELECT p2.consent_kvkk
      FROM public.profiles p2
      WHERE p2.id = auth.uid()
    )
    -- consent_kvkk_at kilidi: NULLABLE → IS NOT DISTINCT FROM
    AND consent_kvkk_at IS NOT DISTINCT FROM (
      SELECT p2.consent_kvkk_at
      FROM public.profiles p2
      WHERE p2.id = auth.uid()
    )
  );
