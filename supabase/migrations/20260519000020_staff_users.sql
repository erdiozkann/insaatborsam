-- Migration: 20260519000020_staff_users.sql
-- Amaç: Admin/operasyon ekibi hesapları (İnşaat Borsam iç takım).
-- roles (1) -> staff_users (n)
-- profiles (1) -> staff_users (1:1) — staff aynı zamanda auth.users üyesi.

CREATE TABLE IF NOT EXISTS public.staff_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- profiles ile 1:1 — staff aynı auth oturumunu kullanır
  user_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,

  -- RBAC rol (roles tablosunda tanımlı)
  -- ON DELETE RESTRICT: rol silinmeden staff_users silinemez (orphan önlemi)
  role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE RESTRICT,

  -- 2FA — TOTP (Google Authenticator / Authy)
  -- two_factor_secret: Faz 1.5'te Supabase Vault ile şifrelenecek
  two_factor_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  two_factor_secret TEXT,

  -- IP beyaz listesi (opsiyonel — sadece ofis IP'si gibi)
  ip_whitelist TEXT[] NOT NULL DEFAULT '{}',

  -- Son oturum bilgisi
  last_login_at TIMESTAMPTZ,
  last_login_ip TEXT,

  -- Aktiflik durumu (deactivate = is_active = FALSE, hard delete değil)
  is_active BOOLEAN NOT NULL DEFAULT TRUE,

  -- Standart audit kolonları
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_staff_users_user_id
  ON public.staff_users (user_id);

CREATE INDEX IF NOT EXISTS idx_staff_users_role
  ON public.staff_users (role_id) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_staff_users_active
  ON public.staff_users (is_active) WHERE deleted_at IS NULL;

COMMENT ON TABLE public.staff_users IS 'İnşaat Borsam iç ekip hesapları. profiles ile 1:1, roles ile n:1.';
COMMENT ON COLUMN public.staff_users.two_factor_secret IS 'TOTP secret — Faz 1.5''te Supabase Vault ile şifrelenecek. Şimdilik boş.';
COMMENT ON COLUMN public.staff_users.ip_whitelist IS 'Erişime izinli IP listesi. Boş = kısıtlama yok. Edge Function ile enforce edilir.';
