-- Migration: 20260519000036_order_status_history.sql
-- Amaç: Sipariş durum geçişleri — append-only denetim günlüğü.
-- orders (1) -> order_status_history (n)
--
-- APPEND-ONLY: Hiçbir satır güncellenmez veya silinmez.
-- updated_at YOK — satır yaratıldıktan sonra değişmez.
-- deleted_at YOK — denetim günlükleri silinmez (yasal zorunluluk).
-- Her durum geçişinde yeni bir satır INSERT edilir; tarihe bakarak tam yol izlenir.

CREATE TABLE IF NOT EXISTS public.order_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Ait olduğu sipariş
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,

  -- Durum geçişi
  -- status_from: ilk kayıt için NULL (sipariş henüz bir önceki duruma sahip değil)
  status_from TEXT,
  status_to   TEXT NOT NULL,

  -- Geçişi kim / ne yaptı?
  --   buyer  : Alıcı aksiyonu (ödeme, iptal talebi vb.)
  --   seller : Satıcı aksiyonu (kargoya verdi, hazır vb.)
  --   staff  : Admin/operasyon aksiyonu
  --   system : Otomatik geçiş (ödeme webhook, cron süresi dolma, vb.)
  actor_type TEXT NOT NULL CHECK (
    actor_type IN ('buyer', 'seller', 'staff', 'system')
  ),

  -- Aksiyonu yapan kullanıcı (sistem işlemlerinde NULL)
  -- ON DELETE SET NULL: profil silinse bile geçmiş kaydı kalır (actor_id NULL olur)
  actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,

  -- Opsiyonel açıklama (örn. "Ödeme alındı", "Alıcı iptal etti", "Stok tükendi")
  note TEXT,

  -- Sadece created_at — immutable kayıt
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- actor_type 'system' değilse actor_id dolu olmalı
  CONSTRAINT order_status_history_actor_consistency_chk CHECK (
    actor_type = 'system' OR actor_id IS NOT NULL
  )
);

-- Siparişin tam geçmişi (kronolojik)
CREATE INDEX IF NOT EXISTS idx_order_status_history_order_time
  ON public.order_status_history (order_id, created_at ASC);

-- Belirli bir duruma geçişleri bulmak için (örn. tüm 'paid' geçişleri)
CREATE INDEX IF NOT EXISTS idx_order_status_history_to_status
  ON public.order_status_history (status_to, created_at DESC);

-- Actor bazlı sorgular (staff audit: "bu admin ne yaptı?")
CREATE INDEX IF NOT EXISTS idx_order_status_history_actor
  ON public.order_status_history (actor_id, created_at DESC)
  WHERE actor_id IS NOT NULL;

COMMENT ON TABLE public.order_status_history IS
  'Sipariş durum geçiş günlüğü. Append-only — INSERT dışında operasyon yok. '
  'Her geçişte yeni satır eklenir; geçmişe bakarak tam timeline izlenir.';
COMMENT ON COLUMN public.order_status_history.status_from IS
  'Önceki durum. NULL = siparişin ilk durum kaydı.';
COMMENT ON COLUMN public.order_status_history.actor_type IS
  '''system'': ödeme webhook, cron vb. otomatik geçiş. '
  '''buyer''/''seller''/''staff'': insan aksiyonu.';
