-- Migration: 20260519000059_price_index_rls.sql
-- Amaç: price_index tablosu için RLS politikaları.
--
-- Politika özeti:
--   - Public read: Yeterli sample_size (>= 3) olan fiyat verileri herkese açık.
--     sample_size < 3 → bireysel satıcı tanımlanabilir olabilir; filtrelenir.
--   - INSERT/UPDATE/DELETE: Yok — sadece service_role / Edge Function / staff backend.
--
-- Neden public read güvenli?
--   price_index YALNIZCA anonimize agregasyon verisi içerir.
--   Tekil satıcı, sipariş veya kişisel veri YOKTUR (docs/04-DATABASE.md tasarım prensibi).
--   Bu garantilerin korunması Edge Function'ın sorumluluğundadır:
--   orders verisi → anonimize → price_index INSERT (seller_id/buyer_id aktarılmaz).

-- RLS'i aç
ALTER TABLE public.price_index ENABLE ROW LEVEL SECURITY;

-- Önceki policy'leri temizle (idempotent)
DROP POLICY IF EXISTS "price_index_public_read" ON public.price_index;

-- SELECT (public): sample_size >= 3 olan fiyat endeksi verileri herkese açık
-- sample_size < 3 → tekil satıcı tanımlanabilirlik riski → filtrelenir
CREATE POLICY "price_index_public_read"
  ON public.price_index
  FOR SELECT
  TO anon, authenticated
  USING (sample_size >= 3);

-- INSERT policy YOK — Edge Function / service_role ile yapılır:
--   1. Tamamlanan orders üzerinden agregasyon hesaplanır.
--   2. Seller/buyer kimliği olmaksızın sonuç bu tabloya yazılır.
--   3. Kullanıcı bu tabloya doğrudan yazamaz (fiyat manipülasyonu riski).

-- UPDATE policy YOK — fiyat güncellemesi yalnızca yeni INSERT ile yapılır
-- (tarih bazlı unique index sayesinde aynı gün için upsert mümkün — service_role ile).

-- DELETE policy YOK — tarihsel fiyat verisi silinmez (trend analizi için).
-- Hatalı kayıt düzeltmesi: service_role ile güncellenir veya yeni kayıt ile override edilir.
