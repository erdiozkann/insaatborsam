-- Migration: 20260601000001_order_creation_rpc.sql
-- Amaç: Sprint 7 — Sipariş oluşturma temeli.
--   Alıcı, kendi RFQ'sine gelen 'accepted_pending_order' durumundaki teklifi
--   başlangıç siparişine (pre-payment draft) dönüştürür. SECURITY DEFINER RPC.
--
-- Ödeme YOK. Kargo YOK. Admin YOK. Iyzico/Stripe YOK.
--
-- ─────────────────────────────────────────────────────────────────────────────
-- Tasarım kararları (ön analiz):
--
-- 1) order_items.product_id → DROP NOT NULL.
--    Mevcut NOT NULL kısıtı doğrudan-katalog satın alımı için tasarlanmıştı.
--    RFQ akışında alıcı talebi serbest metin malzemedir (rfq_items.material_name);
--    katalog products kaydı YOKTUR. Bu yüzden RFQ kaynaklı sipariş kaleminde
--    product_id NULL olur. Snapshot kolonları (product_name_snapshot vb.) korunur.
--    Mevcut migration dosyaları DEĞİŞTİRİLMEZ — bu yeni timestamp'li migration ALTER eder.
--
-- 2) orders.delivery_address_id → DROP NOT NULL.
--    Bu sprintte üretilen sipariş bir "başlangıç siparişi / taslak" (pending_payment).
--    Teslimat adresi ödeme/checkout aşamasında (Sprint 8) kesinleşir; seed RFQ'sinde
--    de adres yoktur. Bu yüzden taslak siparişte delivery_address_id NULL olabilir.
--    İleride checkout eklendiğinde backfill + tekrar NOT NULL düşünülebilir.
--
-- 3) Tek kalemli lump-sum snapshot.
--    Mevcut teklif modeli (rfq_offers) RFQ'nun ANA miktarına (rfqs.quantity/unit)
--    karşı tek bir unit_price_cents + total_price_cents tutar. Per-kalem fiyatlama
--    yoktur (offer rfq_items'ı ayrı fiyatlamaz). Bu yüzden order_items'a TEK satır
--    yazılır: rfqs.title + rfqs.quantity/unit + teklif fiyatları. Per-kalem
--    fiyatlama (rfq_items bazlı split) Faz 2 kapsamıdır. Fabrikasyon fiyat yok.
--
-- 4) Para: tüm tutarlar BIGINT cent (float yok). subtotal = total = offer.total_price_cents,
--    shipping = 0, tax = 0. KDV/vergi kırılımı ödeme aşamasında (Sprint 8) hesaplanır;
--    bu taslakta tax_amount_cents = 0 (orders_total_consistency_chk korunur).
--
-- 5) Güvenlik: client'tan SADECE p_offer_id gelir. buyer_id/seller_id/total/status/
--    resulting_order_id hepsi server-side türetilir. Ownership + status + duplicate
--    kontrolleri fonksiyon içinde zorunludur. RLS bypass yalnızca bu kontrollü yoldur.

-- ─────────────────────────────────────────────────────────────────────────────
-- 0. Şema uyarlamaları (RFQ-kaynaklı sipariş için)
-- ─────────────────────────────────────────────────────────────────────────────
-- İdempotent: DROP NOT NULL zaten nullable kolonda hata vermez.
ALTER TABLE public.order_items
  ALTER COLUMN product_id DROP NOT NULL;

ALTER TABLE public.orders
  ALTER COLUMN delivery_address_id DROP NOT NULL;

COMMENT ON COLUMN public.order_items.product_id IS
  'Katalog ürün referansı. RFQ kaynaklı siparişlerde NULL (talep serbest metin '
  'malzemedir, katalog ürünü yoktur). Doğrudan satın alımda dolu olur.';

COMMENT ON COLUMN public.orders.delivery_address_id IS
  'Teslimat adresi. Başlangıç/taslak siparişte (pending_payment) NULL olabilir; '
  'checkout/ödeme aşamasında (Sprint 8) kesinleşir.';

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. SECURITY DEFINER RPC: accepted_pending_order teklifinden sipariş oluştur
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.create_order_from_offer(
  p_offer_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_uid                 UUID := auth.uid();
  v_buyer_id            UUID;
  v_offer_rfq_id        UUID;
  v_offer_seller_id     UUID;
  v_offer_unit_cents    BIGINT;
  v_offer_total_cents   BIGINT;
  v_offer_status        TEXT;
  v_offer_order_id      UUID;
  v_rfq_buyer_id        UUID;
  v_rfq_title           TEXT;
  v_rfq_quantity        NUMERIC(12,2);
  v_rfq_unit            TEXT;
  v_rfq_address_id      UUID;
  v_order_id            UUID;
BEGIN
  -- Oturum zorunlu (anon zaten EXECUTE alamaz; ikinci savunma hattı).
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Yetkisiz islem' USING ERRCODE = 'insufficient_privilege';
  END IF;

  -- Çağıranın alıcı profili. Yoksa = satıcı/anon/diğer → engellenir.
  SELECT id INTO v_buyer_id
  FROM public.buyer_profiles
  WHERE user_id = v_uid
    AND deleted_at IS NULL;

  IF v_buyer_id IS NULL THEN
    RAISE EXCEPTION 'Yetkisiz islem' USING ERRCODE = 'insufficient_privilege';
  END IF;

  -- Teklifi kilitleyerek oku (FOR UPDATE → eşzamanlı çift sipariş yarışını önler).
  SELECT rfq_id, seller_id, unit_price_cents, total_price_cents, status, resulting_order_id
  INTO v_offer_rfq_id, v_offer_seller_id, v_offer_unit_cents,
       v_offer_total_cents, v_offer_status, v_offer_order_id
  FROM public.rfq_offers
  WHERE id = p_offer_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Teklif bulunamadi' USING ERRCODE = 'no_data_found';
  END IF;

  -- Teklifin bağlı olduğu RFQ (silinmemiş).
  SELECT buyer_id, title, quantity, unit, delivery_address_id
  INTO v_rfq_buyer_id, v_rfq_title, v_rfq_quantity, v_rfq_unit, v_rfq_address_id
  FROM public.rfqs
  WHERE id = v_offer_rfq_id
    AND deleted_at IS NULL;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Teklif bulunamadi' USING ERRCODE = 'no_data_found';
  END IF;

  -- Ownership (IDOR koruması): yalnızca RFQ sahibi alıcı sipariş oluşturabilir.
  -- Satıcı (buyer profili olmadığından zaten yukarıda elenir) ve başka alıcı burada elenir.
  IF v_rfq_buyer_id <> v_buyer_id THEN
    RAISE EXCEPTION 'Bu teklif uzerinde yetkiniz yok' USING ERRCODE = 'insufficient_privilege';
  END IF;

  -- Duplicate koruması: zaten sipariş üretilmişse ikincisini yaratma — mevcut id'yi döndür.
  IF v_offer_order_id IS NOT NULL THEN
    RETURN v_offer_order_id;
  END IF;

  -- Durum koruması: yalnızca alıcının seçtiği teklif (accepted_pending_order) dönüştürülebilir.
  IF v_offer_status <> 'accepted_pending_order' THEN
    RAISE EXCEPTION 'Bu teklif siparise donusturulemez' USING ERRCODE = 'check_violation';
  END IF;

  -- Sipariş ana kaydı. order_number trigger ile otomatik üretilir.
  -- Tutarlar teklikten türetilir; tax/shipping bu aşamada 0 (ödeme Sprint 8).
  INSERT INTO public.orders (
    buyer_id, seller_id, source_rfq_id, source_offer_id,
    subtotal_cents, shipping_cost_cents, tax_amount_cents, total_amount_cents,
    currency, delivery_address_id, status, payment_status
  ) VALUES (
    v_buyer_id, v_offer_seller_id, v_offer_rfq_id, p_offer_id,
    v_offer_total_cents, 0, 0, v_offer_total_cents,
    'TRY', v_rfq_address_id, 'pending_payment', 'pending'
  )
  RETURNING id INTO v_order_id;

  -- Sipariş kalemi: teklifin tek-satır snapshot'ı (lump-sum, RFQ ana miktarına karşı).
  INSERT INTO public.order_items (
    order_id, product_id, product_name_snapshot,
    unit_price_snapshot_cents, quantity, unit, line_total_cents, display_order
  ) VALUES (
    v_order_id, NULL, v_rfq_title,
    v_offer_unit_cents, v_rfq_quantity, v_rfq_unit, v_offer_total_cents, 0
  );

  -- Teklifi siparişe bağla (duplicate guard'ın dayanağı). Status'a DOKUNULMAZ.
  UPDATE public.rfq_offers
  SET resulting_order_id = v_order_id,
      updated_at         = NOW()
  WHERE id = p_offer_id;

  -- Durum geçiş günlüğü (append-only). İlk kayıt: NULL → pending_payment, aktör buyer.
  -- actor_id = profiles.id (= auth.uid(); handle_new_user ile profiles.id = user id).
  INSERT INTO public.order_status_history (
    order_id, status_from, status_to, actor_type, actor_id, note
  ) VALUES (
    v_order_id, NULL, 'pending_payment', 'buyer', v_uid, 'Siparis olusturuldu'
  );

  RETURN v_order_id;
END;
$$;

-- Erişim: yalnızca authenticated. Ownership/status/duplicate auth.uid() ile içeride zorunlu.
REVOKE ALL ON FUNCTION public.create_order_from_offer(UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.create_order_from_offer(UUID) FROM anon;
GRANT EXECUTE ON FUNCTION public.create_order_from_offer(UUID) TO authenticated;

COMMENT ON FUNCTION public.create_order_from_offer(UUID) IS
  'Alıcı kendi RFQ''sindeki accepted_pending_order teklifinden başlangıç siparişi '
  '(pending_payment) oluşturur. SECURITY DEFINER: ownership + status + duplicate '
  'kontrolleri içeride zorunlu. Client yalnızca p_offer_id verir; buyer/seller/total/'
  'status/resulting_order_id server-side türetilir. Idempotent: teklif zaten siparişe '
  'bağlıysa mevcut order id döner. Ödeme/kargo YOK.';
