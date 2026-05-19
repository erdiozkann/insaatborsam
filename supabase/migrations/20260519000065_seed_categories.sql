-- Migration: 20260519000065_seed_categories.sql
-- Amaç: Faz 1 başlangıç kategori verisi.
--
-- Hiyerarşi: 3 ana kategori + toplam 12 alt kategori = 15 kayıt.
-- categories tablosu parent_id self-referential FK destekliyor (000010).
--
-- Idempotency: INSERT ... WHERE NOT EXISTS(slug kontrolü).
--   Partial unique index: UNIQUE(LOWER(slug)) WHERE — ON CONFLICT direkt kullanılamaz.
--   WHERE NOT EXISTS pattern ile her slug için güvenli.
--
-- Sabit ID'ler: tekrar çalıştırmada aynı ID'ler → FK referansları tutarlı kalır.
-- UUID hex formatı: 00000000-ca00-0000-0000-000000000XXX (ca = category)

-- ─── Ana kategoriler ──────────────────────────────────────────────────────────

-- 1. Seramik & Vitrifiye
INSERT INTO public.categories (id, parent_id, name, slug, description, icon, display_order, is_active)
SELECT
  '00000000-ca00-0000-0000-000000000001',
  NULL,
  'Seramik & Vitrifiye',
  'seramik-vitrifiye',
  'Yer ve duvar seramikleri, lavabo, klozet, küvet ve banyo ekipmanları',
  'layers',
  1,
  TRUE
WHERE NOT EXISTS (SELECT 1 FROM public.categories WHERE slug = 'seramik-vitrifiye');

-- 2. Yapı Kimyasalları
INSERT INTO public.categories (id, parent_id, name, slug, description, icon, display_order, is_active)
SELECT
  '00000000-ca00-0000-0000-000000000002',
  NULL,
  'Yapı Kimyasalları',
  'yapi-kimyasallari',
  'Yapıştırıcılar, derz dolgu, su yalıtımı, astar ve boya ürünleri',
  'flask-conical',
  2,
  TRUE
WHERE NOT EXISTS (SELECT 1 FROM public.categories WHERE slug = 'yapi-kimyasallari');

-- 3. Elektrik
INSERT INTO public.categories (id, parent_id, name, slug, description, icon, display_order, is_active)
SELECT
  '00000000-ca00-0000-0000-000000000003',
  NULL,
  'Elektrik',
  'elektrik',
  'Kablo, priz & anahtar, pano, sigorta ve aydınlatma malzemeleri',
  'zap',
  3,
  TRUE
WHERE NOT EXISTS (SELECT 1 FROM public.categories WHERE slug = 'elektrik');

-- ─── Seramik & Vitrifiye alt kategorileri ────────────────────────────────────

INSERT INTO public.categories (id, parent_id, name, slug, display_order, is_active)
SELECT '00000000-ca00-0000-0000-000000000011',
       '00000000-ca00-0000-0000-000000000001',
       'Yer Seramiği', 'yer-seramigi', 1, TRUE
WHERE NOT EXISTS (SELECT 1 FROM public.categories WHERE slug = 'yer-seramigi');

INSERT INTO public.categories (id, parent_id, name, slug, display_order, is_active)
SELECT '00000000-ca00-0000-0000-000000000012',
       '00000000-ca00-0000-0000-000000000001',
       'Duvar Seramiği', 'duvar-seramigi', 2, TRUE
WHERE NOT EXISTS (SELECT 1 FROM public.categories WHERE slug = 'duvar-seramigi');

INSERT INTO public.categories (id, parent_id, name, slug, display_order, is_active)
SELECT '00000000-ca00-0000-0000-000000000013',
       '00000000-ca00-0000-0000-000000000001',
       'Lavabo', 'lavabo', 3, TRUE
WHERE NOT EXISTS (SELECT 1 FROM public.categories WHERE slug = 'lavabo');

INSERT INTO public.categories (id, parent_id, name, slug, display_order, is_active)
SELECT '00000000-ca00-0000-0000-000000000014',
       '00000000-ca00-0000-0000-000000000001',
       'Klozet', 'klozet', 4, TRUE
WHERE NOT EXISTS (SELECT 1 FROM public.categories WHERE slug = 'klozet');

-- ─── Yapı Kimyasalları alt kategorileri ─────────────────────────────────────

INSERT INTO public.categories (id, parent_id, name, slug, display_order, is_active)
SELECT '00000000-ca00-0000-0000-000000000021',
       '00000000-ca00-0000-0000-000000000002',
       'Seramik Yapıştırıcı', 'seramik-yapistirici', 1, TRUE
WHERE NOT EXISTS (SELECT 1 FROM public.categories WHERE slug = 'seramik-yapistirici');

INSERT INTO public.categories (id, parent_id, name, slug, display_order, is_active)
SELECT '00000000-ca00-0000-0000-000000000022',
       '00000000-ca00-0000-0000-000000000002',
       'Derz Dolgu', 'derz-dolgu', 2, TRUE
WHERE NOT EXISTS (SELECT 1 FROM public.categories WHERE slug = 'derz-dolgu');

INSERT INTO public.categories (id, parent_id, name, slug, display_order, is_active)
SELECT '00000000-ca00-0000-0000-000000000023',
       '00000000-ca00-0000-0000-000000000002',
       'Su Yalıtımı', 'su-yalitimi', 3, TRUE
WHERE NOT EXISTS (SELECT 1 FROM public.categories WHERE slug = 'su-yalitimi');

INSERT INTO public.categories (id, parent_id, name, slug, display_order, is_active)
SELECT '00000000-ca00-0000-0000-000000000024',
       '00000000-ca00-0000-0000-000000000002',
       'Astar', 'astar', 4, TRUE
WHERE NOT EXISTS (SELECT 1 FROM public.categories WHERE slug = 'astar');

-- ─── Elektrik alt kategorileri ───────────────────────────────────────────────

INSERT INTO public.categories (id, parent_id, name, slug, display_order, is_active)
SELECT '00000000-ca00-0000-0000-000000000031',
       '00000000-ca00-0000-0000-000000000003',
       'Kablo', 'kablo', 1, TRUE
WHERE NOT EXISTS (SELECT 1 FROM public.categories WHERE slug = 'kablo');

INSERT INTO public.categories (id, parent_id, name, slug, display_order, is_active)
SELECT '00000000-ca00-0000-0000-000000000032',
       '00000000-ca00-0000-0000-000000000003',
       'Priz & Anahtar', 'priz-anahtar', 2, TRUE
WHERE NOT EXISTS (SELECT 1 FROM public.categories WHERE slug = 'priz-anahtar');

INSERT INTO public.categories (id, parent_id, name, slug, display_order, is_active)
SELECT '00000000-ca00-0000-0000-000000000033',
       '00000000-ca00-0000-0000-000000000003',
       'Pano', 'pano', 3, TRUE
WHERE NOT EXISTS (SELECT 1 FROM public.categories WHERE slug = 'pano');

INSERT INTO public.categories (id, parent_id, name, slug, display_order, is_active)
SELECT '00000000-ca00-0000-0000-000000000034',
       '00000000-ca00-0000-0000-000000000003',
       'Aydınlatma', 'aydinlatma', 4, TRUE
WHERE NOT EXISTS (SELECT 1 FROM public.categories WHERE slug = 'aydinlatma');
