-- Migration: 20260530000001_rfq_offer_count_trigger.sql
-- Amaç: rfq_offers değiştiğinde rfqs.offer_count cache'ini güvenli şekilde senkronla.
--
-- Sprint 5.1 — Sprint 5'te offer insert akışı eklendi ama offer_count'u artıran
-- trigger yoktu (client/service_role ile elle artırmak yasaktı). Bu migration onu kapatır.
--
-- Tasarım: INCREMENT yerine RECOMPUTE (yeniden say).
--   - Idempotent: tetikleyici kaç kez çalışırsa çalışsın count her zaman doğru.
--   - Duplicate offer (UNIQUE(rfq_id, seller_id)) insert'i başarısız olursa trigger
--     hiç çalışmaz → count bozulmaz.
--   - withdrawn teklif otomatik düşülür (status <> 'withdrawn' sayılır).
--   - DELETE durumunda da doğru (OLD.rfq_id üzerinden yeniden sayılır).
--
-- Güvenlik:
--   - SECURITY DEFINER: rfqs UPDATE için. Satıcının rfqs üzerinde UPDATE RLS'i yok;
--     count'u yalnızca bu trigger (postgres yetkisiyle) günceller. Client erişmez.
--   - SET search_path = public, pg_temp (injection önlemi).
--   - REVOKE ALL FROM PUBLIC — fonksiyon doğrudan çağrılamaz; sadece trigger tetikler.

CREATE OR REPLACE FUNCTION public.sync_rfq_offer_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_rfq_id UUID;
BEGIN
  -- INSERT/UPDATE'te NEW, DELETE'te OLD geçerli.
  v_rfq_id := COALESCE(NEW.rfq_id, OLD.rfq_id);

  UPDATE public.rfqs
  SET offer_count = (
    SELECT COUNT(*)
    FROM public.rfq_offers o
    WHERE o.rfq_id = v_rfq_id
      AND o.status <> 'withdrawn'
  )
  WHERE id = v_rfq_id;

  RETURN NULL;  -- AFTER trigger; dönüş değeri yok sayılır
END;
$$;

-- Yalnızca trigger çağırır — hiçbir uygulama rolüne EXECUTE gerekmez.
-- (Supabase, anon/authenticated'a default EXECUTE verir; Security Advisor için explicit REVOKE.)
REVOKE ALL ON FUNCTION public.sync_rfq_offer_count() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.sync_rfq_offer_count() FROM anon, authenticated;

COMMENT ON FUNCTION public.sync_rfq_offer_count() IS
  'rfq_offers INSERT/DELETE/status-UPDATE sonrası rfqs.offer_count yeniden hesaplar '
  '(withdrawn hariç). SECURITY DEFINER — client rfqs UPDATE edemez, sayacı trigger tutar.';

-- Trigger: teklif eklendiğinde, silindiğinde veya durumu değiştiğinde senkronla.
DROP TRIGGER IF EXISTS trg_sync_rfq_offer_count ON public.rfq_offers;
CREATE TRIGGER trg_sync_rfq_offer_count
  AFTER INSERT OR DELETE OR UPDATE OF status ON public.rfq_offers
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_rfq_offer_count();

-- Backfill: mevcut tekliflere göre tüm RFQ'ların offer_count'unu düzelt.
UPDATE public.rfqs r
SET offer_count = (
  SELECT COUNT(*)
  FROM public.rfq_offers o
  WHERE o.rfq_id = r.id
    AND o.status <> 'withdrawn'
);
