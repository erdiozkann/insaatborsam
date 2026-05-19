-- Migration: 20260519000060_triggers_updated_at.sql
-- Amaç: updated_at kolonu olan tüm tablolarda otomatik timestamp trigger.
-- Her UPDATE öncesinde NEW.updated_at = NOW() set edilir.
--
-- Kapsanan 17 tablo (updated_at olan):
--   profiles, seller_profiles, buyer_profiles, addresses, categories,
--   products, product_prices, roles, staff_users, rfqs, rfq_invitations,
--   rfq_offers, orders, subscriptions, payments, conversations, seller_kyc
--
-- Kapsanmayan tablolar (updated_at YOK — bilinçli tasarım):
--   Append-only log:  webhook_events, admin_audit_logs, notifications, ai_cache
--   Immutable child:  order_items, order_status_history, messages, seller_reviews
--   Child cascade:    product_images, rfq_items, price_index
--   Status-machine:   rfq_invitations (updated_at VAR — dahil)

-- ─── Reusable trigger function ───────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.set_updated_at() IS
  'BEFORE UPDATE trigger fonksiyonu. updated_at = NOW() set eder. '
  'updated_at kolonu olan tüm tablolarda kullanılır.';

-- ─── Trigger oluşturma (DROP IF EXISTS + CREATE — idempotent) ────────────────

DROP TRIGGER IF EXISTS trg_updated_at ON public.profiles;
CREATE TRIGGER trg_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_updated_at ON public.seller_profiles;
CREATE TRIGGER trg_updated_at
  BEFORE UPDATE ON public.seller_profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_updated_at ON public.buyer_profiles;
CREATE TRIGGER trg_updated_at
  BEFORE UPDATE ON public.buyer_profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_updated_at ON public.addresses;
CREATE TRIGGER trg_updated_at
  BEFORE UPDATE ON public.addresses
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_updated_at ON public.categories;
CREATE TRIGGER trg_updated_at
  BEFORE UPDATE ON public.categories
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_updated_at ON public.products;
CREATE TRIGGER trg_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_updated_at ON public.product_prices;
CREATE TRIGGER trg_updated_at
  BEFORE UPDATE ON public.product_prices
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_updated_at ON public.roles;
CREATE TRIGGER trg_updated_at
  BEFORE UPDATE ON public.roles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_updated_at ON public.staff_users;
CREATE TRIGGER trg_updated_at
  BEFORE UPDATE ON public.staff_users
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_updated_at ON public.rfqs;
CREATE TRIGGER trg_updated_at
  BEFORE UPDATE ON public.rfqs
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_updated_at ON public.rfq_invitations;
CREATE TRIGGER trg_updated_at
  BEFORE UPDATE ON public.rfq_invitations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_updated_at ON public.rfq_offers;
CREATE TRIGGER trg_updated_at
  BEFORE UPDATE ON public.rfq_offers
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_updated_at ON public.orders;
CREATE TRIGGER trg_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_updated_at ON public.subscriptions;
CREATE TRIGGER trg_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_updated_at ON public.payments;
CREATE TRIGGER trg_updated_at
  BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_updated_at ON public.conversations;
CREATE TRIGGER trg_updated_at
  BEFORE UPDATE ON public.conversations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_updated_at ON public.seller_kyc;
CREATE TRIGGER trg_updated_at
  BEFORE UPDATE ON public.seller_kyc
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
