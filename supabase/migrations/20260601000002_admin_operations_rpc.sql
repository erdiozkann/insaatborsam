-- Migration: 20260601000002_admin_operations_rpc.sql
-- Amaç: Sprint 9 — Admin Operations MVP. İki staff write aksiyonu için SECURITY DEFINER RPC.
--   1) admin_set_seller_verification  → satıcı verify / unverify
--   2) admin_invite_seller_to_rfq     → RFQ'ya manuel satıcı daveti (duplicate-safe)
--
-- NEDEN MIGRATION (alternatifsiz):
--   - Admin READ tamamen mevcut staff RLS policy'leriyle çalışır (000064) — yeni policy YOK.
--   - Ancak iki WRITE:
--       seller_profiles: yalnızca owner UPDATE + is_verified KİLİTLİ (000005). Staff UPDATE policy yok.
--       rfq_invitations: INSERT policy YOK (yalnızca service_role/RPC).
--     Bu yüzden client-side update/insert imkânsız; service_role da kullanılmayacağından
--     (kural) tek güvenli yol SECURITY DEFINER RPC + içeride staff yetki kontrolü.
--
-- GÜVENLİK (000064 + sprint28 pattern):
--   - SECURITY DEFINER + SET search_path = public, pg_temp
--   - REVOKE ALL FROM PUBLIC + REVOKE EXECUTE FROM anon + GRANT EXECUTE TO authenticated
--   - Yetki: has_staff_role(ARRAY['owner','admin']) — staff değilse 'Yetkisiz islem'
--   - Client'tan buyer_id/seller_id serbest değil; verify bool sabit (action true/false çağırır)
--   - admin_audit_logs'a PII'siz denetim kaydı (staff_user_id + resource + before/after)
--   - Duplicate invite UNIQUE(rfq_id, seller_id) + ON CONFLICT DO NOTHING ile güvenli

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. admin_set_seller_verification
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.admin_set_seller_verification(
  p_seller_id UUID,
  p_verified  BOOLEAN
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_staff_id   UUID;
  v_old_value  BOOLEAN;
BEGIN
  -- Yalnızca aktif owner/admin staff.
  IF NOT public.has_staff_role(ARRAY['owner', 'admin']) THEN
    RAISE EXCEPTION 'Yetkisiz islem' USING ERRCODE = 'insufficient_privilege';
  END IF;

  SELECT id INTO v_staff_id
  FROM public.staff_users
  WHERE user_id = auth.uid() AND is_active = TRUE AND deleted_at IS NULL;

  -- Satıcı mevcut mu (silinmemiş) + mevcut değer.
  SELECT is_verified INTO v_old_value
  FROM public.seller_profiles
  WHERE id = p_seller_id AND deleted_at IS NULL;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Satici bulunamadi' USING ERRCODE = 'no_data_found';
  END IF;

  -- Idempotent: değer zaten istenen durumda ise tekrar yazma/loglama yapma.
  IF v_old_value IS NOT DISTINCT FROM p_verified THEN
    RETURN;
  END IF;

  UPDATE public.seller_profiles
  SET is_verified = p_verified,
      verified_at = CASE WHEN p_verified THEN NOW() ELSE NULL END,
      updated_at  = NOW()
  WHERE id = p_seller_id;

  INSERT INTO public.admin_audit_logs (
    staff_user_id, action, resource_type, resource_id, before_data, after_data
  ) VALUES (
    v_staff_id,
    CASE WHEN p_verified THEN 'seller.verify' ELSE 'seller.unverify' END,
    'seller',
    p_seller_id,
    jsonb_build_object('is_verified', v_old_value),
    jsonb_build_object('is_verified', p_verified)
  );
END;
$$;

REVOKE ALL     ON FUNCTION public.admin_set_seller_verification(UUID, BOOLEAN) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.admin_set_seller_verification(UUID, BOOLEAN) FROM anon;
GRANT EXECUTE  ON FUNCTION public.admin_set_seller_verification(UUID, BOOLEAN) TO authenticated;

COMMENT ON FUNCTION public.admin_set_seller_verification(UUID, BOOLEAN) IS
  'Staff (owner/admin) bir satıcının is_verified durumunu ayarlar. SECURITY DEFINER: '
  'yetki içeride has_staff_role ile zorunlu. Idempotent; admin_audit_logs''a PII''siz kayıt yazar.';

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. admin_invite_seller_to_rfq
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.admin_invite_seller_to_rfq(
  p_rfq_id    UUID,
  p_seller_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_staff_id      UUID;
  v_invitation_id UUID;
BEGIN
  -- Yalnızca aktif owner/admin staff.
  IF NOT public.has_staff_role(ARRAY['owner', 'admin']) THEN
    RAISE EXCEPTION 'Yetkisiz islem' USING ERRCODE = 'insufficient_privilege';
  END IF;

  SELECT id INTO v_staff_id
  FROM public.staff_users
  WHERE user_id = auth.uid() AND is_active = TRUE AND deleted_at IS NULL;

  -- RFQ mevcut + silinmemiş mi.
  IF NOT EXISTS (SELECT 1 FROM public.rfqs WHERE id = p_rfq_id AND deleted_at IS NULL) THEN
    RAISE EXCEPTION 'RFQ bulunamadi' USING ERRCODE = 'no_data_found';
  END IF;

  -- Satıcı mevcut + silinmemiş mi.
  IF NOT EXISTS (SELECT 1 FROM public.seller_profiles WHERE id = p_seller_id AND deleted_at IS NULL) THEN
    RAISE EXCEPTION 'Satici bulunamadi' USING ERRCODE = 'no_data_found';
  END IF;

  -- Duplicate-safe: aynı (rfq, seller) zaten davetliyse yeni satır yaratma.
  INSERT INTO public.rfq_invitations (rfq_id, seller_id, invite_method, status)
  VALUES (p_rfq_id, p_seller_id, 'manual', 'invited')
  ON CONFLICT (rfq_id, seller_id) DO NOTHING
  RETURNING id INTO v_invitation_id;

  IF v_invitation_id IS NULL THEN
    -- Zaten davetli → mevcut daveti döndür, ikinci kayıt/log yok.
    SELECT id INTO v_invitation_id
    FROM public.rfq_invitations
    WHERE rfq_id = p_rfq_id AND seller_id = p_seller_id;
    RETURN v_invitation_id;
  END IF;

  -- Yalnızca gerçekten yeni davet oluştuğunda denetim kaydı.
  INSERT INTO public.admin_audit_logs (
    staff_user_id, action, resource_type, resource_id, after_data
  ) VALUES (
    v_staff_id,
    'rfq.invite',
    'rfq',
    p_rfq_id,
    jsonb_build_object('seller_id', p_seller_id, 'invitation_id', v_invitation_id)
  );

  RETURN v_invitation_id;
END;
$$;

REVOKE ALL     ON FUNCTION public.admin_invite_seller_to_rfq(UUID, UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.admin_invite_seller_to_rfq(UUID, UUID) FROM anon;
GRANT EXECUTE  ON FUNCTION public.admin_invite_seller_to_rfq(UUID, UUID) TO authenticated;

COMMENT ON FUNCTION public.admin_invite_seller_to_rfq(UUID, UUID) IS
  'Staff (owner/admin) bir satıcıyı bir RFQ''ya manuel davet eder (invite_method=manual). '
  'SECURITY DEFINER: yetki içeride has_staff_role ile zorunlu. Duplicate-safe (ON CONFLICT); '
  'mevcut davet varsa onun id''sini döndürür, ikinci kayıt/log yazmaz.';
