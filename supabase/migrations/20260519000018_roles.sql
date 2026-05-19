-- Migration: 20260519000018_roles.sql
-- Amaç: Staff (admin) rolleri — RBAC için.
-- staff_users.role_id buraya bağlanır.
-- Soft delete YOK — sistem verisi (Faz 1 sabit set: owner/admin/operations/sales/moderator/support/finance/analyst).
-- Seed migration ayrı (000033 sonrası eklenecek).

CREATE TABLE IF NOT EXISTS public.roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Rol ismi (sabit set — kod tarafında string olarak kullanılır)
  name TEXT NOT NULL,

  -- UI'da gösterilecek isim (Türkçe)
  display_name TEXT NOT NULL,

  -- Yetki matrisi (JSON)
  --   örn. {"users": ["read", "write"], "orders": ["read"], "products": ["read", "moderate"]}
  permissions JSONB NOT NULL DEFAULT '{}'::jsonb,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  -- deleted_at YOK — sabit sistem verisi
);

-- Role ismi case-insensitive unique
CREATE UNIQUE INDEX IF NOT EXISTS idx_roles_name_unique
  ON public.roles (LOWER(name));

COMMENT ON TABLE public.roles IS 'Staff RBAC rolleri. Faz 1 seti: owner/admin/operations/sales/moderator/support/finance/analyst.';
COMMENT ON COLUMN public.roles.permissions IS 'Yetki matrisi JSON: {"resource": ["action1", "action2"]}. Uygulama katmanı parse eder.';
