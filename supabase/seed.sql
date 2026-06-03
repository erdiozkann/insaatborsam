-- supabase/seed.sql
-- Geliştirme / test seed verisi. `supabase db reset` ile temiz DB üzerine yüklenir.
-- Migration'lar (offer_count trigger dahil) seed'ten ÖNCE çalışır.
--
-- İçerik (Sprint 5.1):
--   - 1 alıcı (buyer)            → buyer@insaatborsam.test
--   - 1 satıcı (seller, verified)→ seller@insaatborsam.test
--   - 2 RFQ (açık)
--   - rfq_items (RFQ #1 için)
--   - rfq_invitations: satıcı her iki RFQ'ya davetli
--   - 1 mevcut teklif (RFQ #1) → offer_count trigger ile rfqs.offer_count = 1 olur
--
-- Test giriş şifresi (her iki kullanıcı): Test1234!
--
-- NOT: profiles, auth.users INSERT'i sonrası handle_new_user trigger'ı ile
-- otomatik oluşur (role metadata'dan okunur). Bu yüzden profiles'ı elle eklemiyoruz.
-- Sabit UUID'ler tekrarlanabilir referans için kullanılır.

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. auth.users (→ trigger ile public.profiles)
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at,
  confirmation_token, email_change, email_change_token_new, recovery_token
) VALUES
  (
    '00000000-0000-0000-0000-000000000000',
    '11111111-1111-1111-1111-111111111111',
    'authenticated', 'authenticated',
    'buyer@insaatborsam.test',
    crypt('Test1234!', gen_salt('bf')),
    NOW(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Mehmet Müteahhit","role":"buyer","consent_kvkk":"true","consent_marketing":"false","preferred_language":"tr"}',
    NOW(), NOW(), '', '', '', ''
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '22222222-2222-2222-2222-222222222222',
    'authenticated', 'authenticated',
    'seller@insaatborsam.test',
    crypt('Test1234!', gen_salt('bf')),
    NOW(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Ayşe Nalbur","role":"seller","consent_kvkk":"true","consent_marketing":"false","preferred_language":"tr"}',
    NOW(), NOW(), '', '', '', ''
  )
ON CONFLICT (id) DO NOTHING;

-- auth.identities (email login için bazı GoTrue sürümlerinde gerekir)
INSERT INTO auth.identities (
  id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at
) VALUES
  (
    '11111111-1111-1111-1111-111111111111',
    '11111111-1111-1111-1111-111111111111',
    '11111111-1111-1111-1111-111111111111',
    '{"sub":"11111111-1111-1111-1111-111111111111","email":"buyer@insaatborsam.test"}',
    'email', NOW(), NOW(), NOW()
  ),
  (
    '22222222-2222-2222-2222-222222222222',
    '22222222-2222-2222-2222-222222222222',
    '22222222-2222-2222-2222-222222222222',
    '{"sub":"22222222-2222-2222-2222-222222222222","email":"seller@insaatborsam.test"}',
    'email', NOW(), NOW(), NOW()
  )
ON CONFLICT (provider_id, provider) DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. buyer_profiles + seller_profiles
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO public.buyer_profiles (id, user_id, company_name, company_type)
VALUES (
  '33333333-3333-3333-3333-333333333333',
  '11111111-1111-1111-1111-111111111111',
  'Mehmet İnşaat Ltd. Şti.',
  'muteahhit'
)
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO public.seller_profiles (
  id, user_id, company_name, company_type, tax_id,
  store_name, store_slug, primary_city, primary_district,
  is_verified, verified_at
) VALUES (
  '44444444-4444-4444-4444-444444444444',
  '22222222-2222-2222-2222-222222222222',
  'Ayşe Yapı Malzemeleri',
  'nalbur',
  '1234567890',
  'Ayşe Yapı & Nalbur',
  'ayse-yapi-nalbur',
  'İstanbul',
  'Ümraniye',
  TRUE,
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. RFQ'lar (açık) — offer_count'u trigger yönetir, elle set ETMİYORUZ
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO public.rfqs (
  id, buyer_id, title, description, quantity, unit,
  estimated_budget_cents, delivery_deadline, expires_at, status
) VALUES
  (
    '55555555-5555-5555-5555-555555555555',
    '33333333-3333-3333-3333-333333333333',
    'Çimento ve İnşaat Demiri Alımı',
    'Şantiye için 50 ton çimento ve 8 ton inşaat demiri. Teslimat Ümraniye şantiyesine yapılacaktır. Fiyatlar KDV hariç verilsin.',
    50, 'ton',
    50000000,  -- ₺500.000 tahmini bütçe — satıcıya GÖSTERİLMEMELİ
    CURRENT_DATE + 30,
    NOW() + INTERVAL '14 days',
    'open'
  ),
  (
    '66666666-6666-6666-6666-666666666666',
    '33333333-3333-3333-3333-333333333333',
    'Seramik ve Yapıştırıcı Talebi',
    '300 m² yer seramiği (60x60) ve uygun seramik yapıştırıcısı. Marka önerisi alınabilir.',
    300, 'm2',
    NULL,
    CURRENT_DATE + 21,
    NOW() + INTERVAL '10 days',
    'open'
  )
ON CONFLICT (id) DO NOTHING;

-- RFQ #1 kalemleri
INSERT INTO public.rfq_items (id, rfq_id, material_name, quantity, unit, notes, display_order)
VALUES
  (
    '5a000000-0000-0000-0000-000000000001',
    '55555555-5555-5555-5555-555555555555',
    'Portland Çimentosu CEM I 42.5', 50, 'ton', 'Torbalı, paletli teslim', 0
  ),
  (
    '5a000000-0000-0000-0000-000000000002',
    '55555555-5555-5555-5555-555555555555',
    'Nervürlü İnşaat Demiri Ø12', 8, 'ton', 'TS 708 standardına uygun', 1
  )
ON CONFLICT (id) DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. rfq_invitations — satıcı her iki RFQ'ya davetli
--    RFQ #1: teklif verildi → status 'responded'
--    RFQ #2: henüz teklif yok → status 'invited' (yeni teklif verilebilir)
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO public.rfq_invitations (id, rfq_id, seller_id, invite_method, status, responded_at)
VALUES
  (
    '7a000000-0000-0000-0000-000000000001',
    '55555555-5555-5555-5555-555555555555',
    '44444444-4444-4444-4444-444444444444',
    'manual', 'responded', NOW()
  ),
  (
    '7a000000-0000-0000-0000-000000000002',
    '66666666-6666-6666-6666-666666666666',
    '44444444-4444-4444-4444-444444444444',
    'manual', 'invited', NULL
  )
ON CONFLICT (rfq_id, seller_id) DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. Mevcut teklif (RFQ #1) — INSERT sonrası trigger rfqs.offer_count = 1 yapar
--    total = unit_price_cents * quantity = 480000 * 50 = 24.000.000 (₺240.000,00)
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO public.rfq_offers (
  id, rfq_id, seller_id, unit_price_cents, total_price_cents, delivery_time_days, notes, status
) VALUES (
  '77777777-7777-7777-7777-777777777777',
  '55555555-5555-5555-5555-555555555555',
  '44444444-4444-4444-4444-444444444444',
  480000,    -- ₺4.800,00 / ton
  24000000,  -- ₺240.000,00 toplam (480000 * 50)
  7,
  'Fiyat 15 gün geçerlidir. Nakliye dahil değildir.',
  'pending'
)
ON CONFLICT (rfq_id, seller_id) DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────────────
-- 6. Staff (admin) kullanıcısı — Sprint 9 admin operasyon paneli testi için.
--    Rol: owner (seed_roles 000066 → 00000000-…-000000000101).
--    profiles handle_new_user trigger ile otomatik oluşur (role='staff', consent_kvkk).
--    Giriş: admin@insaatborsam.test / Test1234!
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at,
  confirmation_token, email_change, email_change_token_new, recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  '88888888-8888-8888-8888-888888888888',
  'authenticated', 'authenticated',
  'admin@insaatborsam.test',
  crypt('Test1234!', gen_salt('bf')),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"İB Operasyon","role":"staff","consent_kvkk":"true","consent_marketing":"false","preferred_language":"tr"}',
  NOW(), NOW(), '', '', '', ''
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO auth.identities (
  id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at
) VALUES (
  '88888888-8888-8888-8888-888888888888',
  '88888888-8888-8888-8888-888888888888',
  '88888888-8888-8888-8888-888888888888',
  '{"sub":"88888888-8888-8888-8888-888888888888","email":"admin@insaatborsam.test"}',
  'email', NOW(), NOW(), NOW()
)
ON CONFLICT (provider_id, provider) DO NOTHING;

-- staff_users: owner rolü (tam yetki). is_active = TRUE.
INSERT INTO public.staff_users (id, user_id, role_id, is_active)
VALUES (
  '8a000000-0000-0000-0000-000000000001',
  '88888888-8888-8888-8888-888888888888',
  '00000000-0000-0000-0000-000000000101',
  TRUE
)
ON CONFLICT (user_id) DO NOTHING;
