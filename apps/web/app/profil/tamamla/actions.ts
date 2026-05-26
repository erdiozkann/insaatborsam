'use server'

import { redirect } from 'next/navigation'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

export type ProfileCompleteState = {
  error?: string
}

const BUYER_COMPANY_TYPES = ['muteahhit', 'usta', 'muhendis', 'mimar', 'bireysel'] as const

const schema = z.object({
  company_name: z
    .string()
    .trim()
    .max(200, 'Firma adı en fazla 200 karakter olabilir')
    .optional()
    .transform((v) => (v && v.length > 0 ? v : null)),
  company_type: z
    .enum(BUYER_COMPANY_TYPES)
    .optional()
    .nullable()
    .transform((v) => v ?? null),
  tax_id: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v && v.length > 0 ? v : null))
    .refine((v) => v === null || /^[0-9]{10,11}$/.test(v), {
      message: 'Vergi numarası 10 veya 11 haneli olmalıdır',
    }),
})

export async function profileCompleteAction(
  _prevState: ProfileCompleteState,
  formData: FormData,
): Promise<ProfileCompleteState> {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { error: 'Oturum geçersiz. Lütfen yeniden giriş yapın.' }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  if (!profile || profile.role !== 'buyer') {
    return { error: 'Bu sayfa sadece alıcı hesaplar içindir.' }
  }

  const rawCompanyType = formData.get('company_type')
  const parsed = schema.safeParse({
    company_name: formData.get('company_name') ? String(formData.get('company_name')) : '',
    company_type:
      rawCompanyType && BUYER_COMPANY_TYPES.includes(rawCompanyType as (typeof BUYER_COMPANY_TYPES)[number])
        ? rawCompanyType
        : null,
    tax_id: formData.get('tax_id') ? String(formData.get('tax_id')) : '',
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Bilgileri kontrol edin.' }
  }

  const { data: existing } = await supabase
    .from('buyer_profiles')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!existing) {
    const { error: insertError } = await supabase.from('buyer_profiles').insert({
      user_id: user.id,
      company_name: parsed.data.company_name,
      company_type: parsed.data.company_type,
      tax_id: parsed.data.tax_id,
    })

    if (insertError) {
      return { error: 'Profil kaydedilemedi. Lütfen tekrar deneyin.' }
    }
  } else {
    const { error: updateError } = await supabase
      .from('buyer_profiles')
      .update({
        company_name: parsed.data.company_name,
        company_type: parsed.data.company_type,
        tax_id: parsed.data.tax_id,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id)

    if (updateError) {
      return { error: 'Profil güncellenemedi. Lütfen tekrar deneyin.' }
    }
  }

  redirect('/profil')
}
