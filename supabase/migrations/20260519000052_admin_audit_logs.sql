-- Migration: 20260519000052_admin_audit_logs.sql
-- Amaç: Admin/staff aksiyonlarının denetim günlüğü — append-only.
--
-- Bu tablo YALNIZCA service_role ve yetkili Edge Function'lar tarafından kullanılır.
-- Kullanıcı (buyer/seller/staff-client) INSERT/SELECT/UPDATE/DELETE yapamaz.
-- Staff okuma erişimi: staff_access_policies.sql toplu migration'da rol bazlı eklenecek.
--
-- Append-only: updated_at, deleted_at YOK. Her aksiyon yeni satır ekler.
-- ON DELETE RESTRICT: Staff hesabı silinemez (audit trail korunur).
--   Hesap kapatma: staff_users.is_active = FALSE ve deleted_at ile deaktive edilir.

CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Aksiyonu yapan staff (NOT NULL: sistem aksiyonları ayrı tabloya gider)
  -- ON DELETE RESTRICT: staff hesabı silinmeden önce audit log temizlenemez
  staff_user_id UUID NOT NULL REFERENCES public.staff_users(id) ON DELETE RESTRICT,

  -- Aksiyon tanımı (dot notation: resource.verb)
  --   örn. 'user.suspend', 'order.refund', 'product.reject',
  --         'seller.verify', 'rfq.close', 'review.delete'
  action TEXT NOT NULL,

  -- Etkilenen kaynak tipi
  resource_type TEXT NOT NULL,  -- 'user', 'order', 'product', 'rfq', 'seller', 'review', vb.

  -- Etkilenen kaynak ID (nullable — bazı aksiyonlar kaynak bazlı değil)
  resource_id UUID,

  -- Değişiklik snapshot'ları (JSON diff için)
  before_data JSONB,  -- Önceki durum (UPDATE/DELETE öncesi)
  after_data  JSONB,  -- Sonraki durum (INSERT/UPDATE sonrası)

  -- İstemci bilgisi (güvenlik denetimi için)
  ip_address TEXT,
  user_agent TEXT,

  -- Oturum ID'si (aynı oturumdan birden fazla aksiyon izlemek için)
  session_id TEXT,

  -- Sadece created_at — immutable kayıt
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  -- updated_at YOK — append-only
  -- deleted_at YOK — denetim kaydı silinemez
);

-- Staff bazlı sorgulama (admin panel: "bu operatör ne yaptı?")
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_staff
  ON public.admin_audit_logs (staff_user_id, created_at DESC);

-- Kaynak bazlı sorgulama ("bu siparişe kim dokundu?")
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_resource
  ON public.admin_audit_logs (resource_type, resource_id, created_at DESC);

-- Aksiyon tipi bazlı (özellikle hassas işlemler: 'order.refund', 'user.suspend')
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_action
  ON public.admin_audit_logs (action, created_at DESC);

-- Zaman bazlı genel denetim sorgular
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_time
  ON public.admin_audit_logs (created_at DESC);

COMMENT ON TABLE public.admin_audit_logs IS
  'Admin/staff aksiyon denetim günlüğü. Append-only — INSERT dışında operasyon yok. '
  'Staff hesabı silinemez (ON DELETE RESTRICT): denetim bütünlüğü için.';
COMMENT ON COLUMN public.admin_audit_logs.staff_user_id IS
  'Aksiyonu yapan staff. NOT NULL — sistem olayları buraya değil, '
  'order_status_history gibi spesifik tablolara kaydedilir.';
COMMENT ON COLUMN public.admin_audit_logs.before_data IS
  'Değişiklik öncesi snapshot. PII içerebilir — log erişimi sadece yetkili staff.';
