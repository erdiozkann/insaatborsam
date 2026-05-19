-- Migration: 20260519000009_addresses_rls.sql
-- Amaç: addresses tablosu için RLS politikaları.
--
-- Politika özeti:
--   - Owner CRUD: Kullanıcı yalnızca kendi adreslerini görür/yönetir.
--   - Satıcı, kabul ettiği sipariş için alıcı adresini görmeli — bu izin orders
--     tablosundaki policy'de hallediliyor (orders → addresses JOIN). Bu RLS sadece
--     "kim direkt addresses tablosunu sorgulayabilir" kısmıyla ilgili.
--   - DELETE: soft delete (deleted_at).
--
-- NOT: Sipariş kapsamında satıcının alıcı adresine erişmesi için ileride bir
-- SELECT policy daha eklenecek (orders tablosu kurulduktan sonra). O policy
-- "addresses.id IN (SELECT delivery_address_id FROM orders WHERE seller_id = ...)"
-- şeklinde olacak.

-- RLS'i aç
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;

-- Önceki policy'leri temizle (idempotent)
DROP POLICY IF EXISTS "addresses_select_own" ON public.addresses;
DROP POLICY IF EXISTS "addresses_insert_own" ON public.addresses;
DROP POLICY IF EXISTS "addresses_update_own" ON public.addresses;
DROP POLICY IF EXISTS "addresses_delete_own" ON public.addresses;

-- SELECT: kullanıcı kendi adreslerini görür
CREATE POLICY "addresses_select_own"
  ON public.addresses
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    AND deleted_at IS NULL
  );

-- INSERT: kullanıcı yalnızca kendi adına adres ekleyebilir
CREATE POLICY "addresses_insert_own"
  ON public.addresses
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- UPDATE: kullanıcı kendi adresini günceller
CREATE POLICY "addresses_update_own"
  ON public.addresses
  FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid()
    AND deleted_at IS NULL
  )
  WITH CHECK (user_id = auth.uid());

-- DELETE: kullanıcı kendi adresini siler (HARD DELETE)
--
-- KVKK Madde 17 (Silme Hakkı / Verilerin Silinmesi):
--   Adres, kişisel veri kategorisindedir. Kullanıcı kendi adresini gerçekten
--   silebilmelidir (soft delete yetmez — KVKK silme talebine uymaz).
--
-- Sipariş geçmişi koruması:
--   orders.delivery_address_id ON DELETE RESTRICT ile bağlı. Yani sipariş kaydı
--   olan bir adres VERİTABANI SEVİYESİNDE silinemez (FK hatası döner).
--   Uygulama katmanı bu hatayı yakalayıp kullanıcıya anlamlı mesaj göstermeli:
--   "Bu adrese ait siparişiniz olduğu için silinemiyor. Önce siparişleri
--   anonimleştirmeniz gerekir (KVKK destek talebi)."
--
-- KVKK silme talebi geldiğinde:
--   1) Önce orders.delivery_address_id snapshot kolonlarına kopyalanır
--      (order migration'ında ele alınacak — adres bilgisi sipariş içinde dondurulur).
--   2) Sonra address hard DELETE yapılır.
--   3) Bu süreç service_role ile Edge Function üzerinden yürütülür.
CREATE POLICY "addresses_delete_own"
  ON public.addresses
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());
