'use server'

import { redirect } from 'next/navigation'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

export type ProfileEditState = {
  error?: string
}

function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, '')
  if (digits.startsWith('90') && digits.length === 12) return `+${digits}`
  if (digits.startsWith('0') && digits.length === 11) return `+90${digits.slice(1)}`
  if (digits.length === 10) return `+90${digits}`
  return `+${digits}`
}

const schema = z.object({
  full_name: z
    .string()
    .trim()
    .min(2, 'Ad soyad en az 2 karakter olmalı')
    .max(100, 'Ad soyad en fazla 100 karakter olabilir'),
  phone: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v && v.length > 0 ? v : null)),
  consent_marketing: z.boolean(),
})

export async function profileEditAction(
  _prevState: ProfileEditState,
  formData: FormData,
): Promise<ProfileEditState> {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { error: 'Oturum geçersiz. Lütfen yeniden giriş yapın.' }
  }

  const rawPhone = String(formData.get('phone') ?? '').trim()
  const consentMarketing = formData.get('consent_marketing') === 'true'

  const parsed = schema.safeParse({
    full_name: String(formData.get('full_name') ?? '').trim(),
    phone: rawPhone.length > 0 ? rawPhone : undefined,
    consent_marketing: consentMarketing,
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Bilgileri kontrol edin.' }
  }

  const normalizedPhone =
    parsed.data.phone ? normalizePhone(parsed.data.phone) : null

  const now = new Date().toISOString()

  const { error: updateError } = await supabase
    .from('profiles')
    .update({
      full_name: parsed.data.full_name,
      phone: normalizedPhone,
      consent_marketing: parsed.data.consent_marketing,
      consent_marketing_at: now,
      updated_at: now,
    })
    .eq('id', user.id)

  if (updateError) {
    return { error: 'Profil güncellenemedi. Lütfen tekrar deneyin.' }
  }

  redirect('/profil')
}
