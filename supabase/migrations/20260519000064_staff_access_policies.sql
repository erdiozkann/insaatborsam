-- Migration: 20260519000064_staff_access_policies.sql
-- Amaç: Tüm tablolar için staff SELECT erişim politikaları.
--
-- KURAL:
--   - Staff varsayılan yetkisi: SELECT only.
--   - Staff INSERT/UPDATE/DELETE: bu dosyada YOK. Hassas mutasyonlar Faz 2 RPC ile.
--   - Recursive policy riski: is_active_staff() SECURITY DEFINER ile çözüldü.
--   - webhook_events, ai_cache: staff dahil herkese KAPALI (deny-by-default korunur).
--
-- Helper fonksiyonlar (recursive policy yerine SECURITY DEFINER):
--   public.is_active_staff()              → herhangi bir aktif staff
--   public.has_staff_role(TEXT[])         → belirli rol(ler)den biri olan aktif staff

-- ─── Staff check helper fonksiyonları ────────────────────────────────────────

-- Herhangi bir aktif staff kontrolü
CREATE OR REPLACE FUNCTION public.is_active_staff()
RETURNS BOOLEAN
STABLE
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.staff_users
    WHERE user_id   = auth.uid()
      AND is_active = TRUE
      AND deleted_at IS NULL
  );
$$;

REVOKE ALL    ON FUNCTION public.is_active_staff()       FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_active_staff()       TO authenticated;

-- Belirli rollere sahip aktif staff kontrolü
CREATE OR REPLACE FUNCTION public.has_staff_role(p_role_names TEXT[])
RETURNS BOOLEAN
STABLE
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.staff_users su
    JOIN public.roles r ON r.id = su.role_id
    WHERE su.user_id   = auth.uid()
      AND su.is_active = TRUE
      AND su.deleted_at IS NULL
      AND r.name = ANY(p_role_names)
  );
$$;

REVOKE ALL    ON FUNCTION public.has_staff_role(TEXT[])  FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_staff_role(TEXT[])  TO authenticated;

COMMENT ON FUNCTION public.is_active_staff() IS
  'Mevcut kullanıcının aktif staff olup olmadığını döner. '
  'SECURITY DEFINER: staff_users RLS''ini bypass ederek kendi satırını okur.';
COMMENT ON FUNCTION public.has_staff_role(TEXT[]) IS
  'Mevcut kullanıcının belirtilen rollerden birine sahip aktif staff olup olmadığını döner. '
  'Örn: has_staff_role(ARRAY[''owner'',''admin''])';

-- ─── Staff SELECT politikaları ────────────────────────────────────────────────
-- Her tablo için DROP IF EXISTS + CREATE (idempotent)

-- profiles
DROP POLICY IF EXISTS "profiles_staff_read" ON public.profiles;
CREATE POLICY "profiles_staff_read"
  ON public.profiles FOR SELECT TO authenticated
  USING (public.is_active_staff());

-- seller_profiles
DROP POLICY IF EXISTS "seller_profiles_staff_read" ON public.seller_profiles;
CREATE POLICY "seller_profiles_staff_read"
  ON public.seller_profiles FOR SELECT TO authenticated
  USING (public.is_active_staff());

-- buyer_profiles
DROP POLICY IF EXISTS "buyer_profiles_staff_read" ON public.buyer_profiles;
CREATE POLICY "buyer_profiles_staff_read"
  ON public.buyer_profiles FOR SELECT TO authenticated
  USING (public.is_active_staff());

-- addresses
DROP POLICY IF EXISTS "addresses_staff_read" ON public.addresses;
CREATE POLICY "addresses_staff_read"
  ON public.addresses FOR SELECT TO authenticated
  USING (public.is_active_staff());

-- categories (staff herhangi bir kategoriyi görür — is_active=FALSE olanlar dahil)
DROP POLICY IF EXISTS "categories_staff_read_all" ON public.categories;
CREATE POLICY "categories_staff_read_all"
  ON public.categories FOR SELECT TO authenticated
  USING (public.is_active_staff());

-- products
DROP POLICY IF EXISTS "products_staff_read" ON public.products;
CREATE POLICY "products_staff_read"
  ON public.products FOR SELECT TO authenticated
  USING (public.is_active_staff());

-- product_images
DROP POLICY IF EXISTS "product_images_staff_read" ON public.product_images;
CREATE POLICY "product_images_staff_read"
  ON public.product_images FOR SELECT TO authenticated
  USING (public.is_active_staff());

-- product_prices
DROP POLICY IF EXISTS "product_prices_staff_read" ON public.product_prices;
CREATE POLICY "product_prices_staff_read"
  ON public.product_prices FOR SELECT TO authenticated
  USING (public.is_active_staff());

-- roles
DROP POLICY IF EXISTS "roles_staff_read_all" ON public.roles;
CREATE POLICY "roles_staff_read_all"
  ON public.roles FOR SELECT TO authenticated
  USING (public.is_active_staff());

-- staff_users: öz-erişim policy zaten var (000021). Staff listesini (başkalarının kaydı)
-- sadece owner/admin görebilir — hassas RBAC verisi.
DROP POLICY IF EXISTS "staff_users_senior_staff_read_all" ON public.staff_users;
CREATE POLICY "staff_users_senior_staff_read_all"
  ON public.staff_users FOR SELECT TO authenticated
  USING (public.has_staff_role(ARRAY['owner', 'admin']));

-- rfqs
DROP POLICY IF EXISTS "rfqs_staff_read" ON public.rfqs;
CREATE POLICY "rfqs_staff_read"
  ON public.rfqs FOR SELECT TO authenticated
  USING (public.is_active_staff());

-- rfq_items
DROP POLICY IF EXISTS "rfq_items_staff_read" ON public.rfq_items;
CREATE POLICY "rfq_items_staff_read"
  ON public.rfq_items FOR SELECT TO authenticated
  USING (public.is_active_staff());

-- rfq_invitations
DROP POLICY IF EXISTS "rfq_invitations_staff_read" ON public.rfq_invitations;
CREATE POLICY "rfq_invitations_staff_read"
  ON public.rfq_invitations FOR SELECT TO authenticated
  USING (public.is_active_staff());

-- rfq_offers
DROP POLICY IF EXISTS "rfq_offers_staff_read" ON public.rfq_offers;
CREATE POLICY "rfq_offers_staff_read"
  ON public.rfq_offers FOR SELECT TO authenticated
  USING (public.is_active_staff());

-- orders
DROP POLICY IF EXISTS "orders_staff_read" ON public.orders;
CREATE POLICY "orders_staff_read"
  ON public.orders FOR SELECT TO authenticated
  USING (public.is_active_staff());

-- order_items
DROP POLICY IF EXISTS "order_items_staff_read" ON public.order_items;
CREATE POLICY "order_items_staff_read"
  ON public.order_items FOR SELECT TO authenticated
  USING (public.is_active_staff());

-- order_status_history
DROP POLICY IF EXISTS "order_status_history_staff_read" ON public.order_status_history;
CREATE POLICY "order_status_history_staff_read"
  ON public.order_status_history FOR SELECT TO authenticated
  USING (public.is_active_staff());

-- subscriptions
DROP POLICY IF EXISTS "subscriptions_staff_read" ON public.subscriptions;
CREATE POLICY "subscriptions_staff_read"
  ON public.subscriptions FOR SELECT TO authenticated
  USING (public.is_active_staff());

-- payments
DROP POLICY IF EXISTS "payments_staff_read" ON public.payments;
CREATE POLICY "payments_staff_read"
  ON public.payments FOR SELECT TO authenticated
  USING (public.is_active_staff());

-- conversations
DROP POLICY IF EXISTS "conversations_staff_read" ON public.conversations;
CREATE POLICY "conversations_staff_read"
  ON public.conversations FOR SELECT TO authenticated
  USING (public.is_active_staff());

-- messages
DROP POLICY IF EXISTS "messages_staff_read" ON public.messages;
CREATE POLICY "messages_staff_read"
  ON public.messages FOR SELECT TO authenticated
  USING (public.is_active_staff());

-- notifications
DROP POLICY IF EXISTS "notifications_staff_read" ON public.notifications;
CREATE POLICY "notifications_staff_read"
  ON public.notifications FOR SELECT TO authenticated
  USING (public.is_active_staff());

-- seller_reviews
DROP POLICY IF EXISTS "seller_reviews_staff_read" ON public.seller_reviews;
CREATE POLICY "seller_reviews_staff_read"
  ON public.seller_reviews FOR SELECT TO authenticated
  USING (public.is_active_staff());

-- admin_audit_logs: sadece owner ve admin görebilir (hassas aksiyon logu)
DROP POLICY IF EXISTS "admin_audit_logs_senior_staff_read" ON public.admin_audit_logs;
CREATE POLICY "admin_audit_logs_senior_staff_read"
  ON public.admin_audit_logs FOR SELECT TO authenticated
  USING (public.has_staff_role(ARRAY['owner', 'admin']));

-- seller_kyc: KYC inceleme yetkisi olan roller (owner, admin, operations)
-- review_notes bu policy ile de görünür — Edge Function/API katmanında filtrelenmeli.
DROP POLICY IF EXISTS "seller_kyc_authorized_staff_read" ON public.seller_kyc;
CREATE POLICY "seller_kyc_authorized_staff_read"
  ON public.seller_kyc FOR SELECT TO authenticated
  USING (public.has_staff_role(ARRAY['owner', 'admin', 'operations']));

-- price_index: zaten public read açık, staff için ekstra policy gerekmez.

-- webhook_events: STAFF DAHİL KAPALI — deny-by-default korunur.
-- ai_cache:       STAFF DAHİL KAPALI — deny-by-default korunur.
-- (Bu tablolara kasıtlı olarak policy eklenmez.)
