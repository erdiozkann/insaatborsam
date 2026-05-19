-- Migration: 20260519000066_seed_roles.sql
-- Amaç: Admin RBAC rolleri seed verisi.
--
-- Roller ve kapsam:
--   owner      → tüm yetkiler
--   admin      → kullanıcı/sipariş/ürün/satıcı yönetimi + ayarlar
--   operations → sipariş/kargo yönetimi
--   sales      → satıcı kazanım + CRM
--   moderator  → içerik moderasyonu (ürün, yorum)
--   support    → kullanıcı destek (okuma + bilet)
--   finance    → ödeme/abonelik/payout
--   analyst    → read-only analitik
--
-- Idempotency: ON CONFLICT (id) DO UPDATE — rol adı veya permissions değiştiğinde
-- migration yeniden çalıştırıldığında güncellenir.
--
-- Sabit ID'ler: 00000000-0000-0000-0000-00000000010X (X = 1..8)

INSERT INTO public.roles (id, name, display_name, permissions)
VALUES (
  '00000000-0000-0000-0000-000000000101',
  'owner',
  'Sahip',
  '{
    "*": ["read", "write", "delete", "moderate", "verify", "refund", "export"]
  }'::jsonb
)
ON CONFLICT (id) DO UPDATE
  SET name        = EXCLUDED.name,
      display_name = EXCLUDED.display_name,
      permissions  = EXCLUDED.permissions,
      updated_at   = NOW();

INSERT INTO public.roles (id, name, display_name, permissions)
VALUES (
  '00000000-0000-0000-0000-000000000102',
  'admin',
  'Yönetici',
  '{
    "users":         ["read", "write", "delete"],
    "orders":        ["read", "write", "refund"],
    "products":      ["read", "write", "moderate"],
    "sellers":       ["read", "write", "verify"],
    "rfqs":          ["read", "write"],
    "payments":      ["read"],
    "subscriptions": ["read", "write"],
    "analytics":     ["read"],
    "settings":      ["read", "write"]
  }'::jsonb
)
ON CONFLICT (id) DO UPDATE
  SET name        = EXCLUDED.name,
      display_name = EXCLUDED.display_name,
      permissions  = EXCLUDED.permissions,
      updated_at   = NOW();

INSERT INTO public.roles (id, name, display_name, permissions)
VALUES (
  '00000000-0000-0000-0000-000000000103',
  'operations',
  'Operasyon',
  '{
    "orders":   ["read", "write"],
    "rfqs":     ["read"],
    "sellers":  ["read"],
    "products": ["read"],
    "users":    ["read"]
  }'::jsonb
)
ON CONFLICT (id) DO UPDATE
  SET name        = EXCLUDED.name,
      display_name = EXCLUDED.display_name,
      permissions  = EXCLUDED.permissions,
      updated_at   = NOW();

INSERT INTO public.roles (id, name, display_name, permissions)
VALUES (
  '00000000-0000-0000-0000-000000000104',
  'sales',
  'Satış',
  '{
    "sellers":              ["read", "write"],
    "discovered_businesses": ["read", "write"],
    "users":                ["read"]
  }'::jsonb
)
ON CONFLICT (id) DO UPDATE
  SET name        = EXCLUDED.name,
      display_name = EXCLUDED.display_name,
      permissions  = EXCLUDED.permissions,
      updated_at   = NOW();

INSERT INTO public.roles (id, name, display_name, permissions)
VALUES (
  '00000000-0000-0000-0000-000000000105',
  'moderator',
  'Moderatör',
  '{
    "products": ["read", "moderate"],
    "reviews":  ["read", "moderate"],
    "users":    ["read"]
  }'::jsonb
)
ON CONFLICT (id) DO UPDATE
  SET name        = EXCLUDED.name,
      display_name = EXCLUDED.display_name,
      permissions  = EXCLUDED.permissions,
      updated_at   = NOW();

INSERT INTO public.roles (id, name, display_name, permissions)
VALUES (
  '00000000-0000-0000-0000-000000000106',
  'support',
  'Destek',
  '{
    "users":   ["read"],
    "orders":  ["read"],
    "messages":["read"],
    "tickets": ["read", "write"]
  }'::jsonb
)
ON CONFLICT (id) DO UPDATE
  SET name        = EXCLUDED.name,
      display_name = EXCLUDED.display_name,
      permissions  = EXCLUDED.permissions,
      updated_at   = NOW();

INSERT INTO public.roles (id, name, display_name, permissions)
VALUES (
  '00000000-0000-0000-0000-000000000107',
  'finance',
  'Finans',
  '{
    "payments":      ["read", "refund"],
    "subscriptions": ["read", "write"],
    "payouts":       ["read", "write"],
    "analytics":     ["read"]
  }'::jsonb
)
ON CONFLICT (id) DO UPDATE
  SET name        = EXCLUDED.name,
      display_name = EXCLUDED.display_name,
      permissions  = EXCLUDED.permissions,
      updated_at   = NOW();

INSERT INTO public.roles (id, name, display_name, permissions)
VALUES (
  '00000000-0000-0000-0000-000000000108',
  'analyst',
  'Analist',
  '{
    "analytics": ["read"],
    "orders":    ["read"],
    "users":     ["read"],
    "products":  ["read"]
  }'::jsonb
)
ON CONFLICT (id) DO UPDATE
  SET name        = EXCLUDED.name,
      display_name = EXCLUDED.display_name,
      permissions  = EXCLUDED.permissions,
      updated_at   = NOW();
