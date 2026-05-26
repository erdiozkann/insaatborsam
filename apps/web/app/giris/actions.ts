'use server'

import { redirect } from 'next/navigation'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

export type LoginState =
  | { phase: 'phone'; error?: string }
  | { phase: 'otp'; phone: string; error?: string }

function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, '')
  if (digits.startsWith('90') && digits.length === 12) return `+${digits}`
  if (digits.startsWith('0') && digits.length === 11) return `+90${digits.slice(1)}`
  if (digits.length === 10) return `+90${digits}`
  return `+${digits}`
}

const phoneSchema = z.object({
  phone: z.string().min(10, 'Geçerli bir telefon numarası girin'),
  full_name: z.string().min(2, 'Ad soyad en az 2 karakter olmalı').max(100),
  role: z.enum(['buyer', 'seller']),
})

const otpSchema = z.object({
  phone: z.string().min(1),
  token: z
    .string()
    .min(6, 'SMS kodu 6 haneli olmalı')
    .max(6, 'SMS kodu 6 haneli olmalı')
    .regex(/^\d{6}$/, 'SMS kodu yalnızca rakamlardan oluşmalı'),
})

export async function loginAction(
  prevState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const step = formData.get('step')

  if (step === 'phone') {
    // KVKK onayı zorunlu — checkbox gönderilmemişse reddet
    if (formData.get('consent_kvkk') !== 'true') {
      return { phase: 'phone', error: 'KVKK Aydınlatma Metni onayı zorunludur.' }
    }

    const parsed = phoneSchema.safeParse({
      phone: String(formData.get('phone') ?? '').trim(),
      full_name: String(formData.get('full_name') ?? '').trim(),
      role: String(formData.get('role') ?? ''),
    })

    if (!parsed.success) {
      return { phase: 'phone', error: parsed.error.issues[0]?.message ?? 'Bilgileri kontrol edin.' }
    }

    const phone = normalizePhone(parsed.data.phone)
    const consentMarketing = formData.get('consent_marketing') === 'true'

    const supabase = await createClient()
    const { error } = await supabase.auth.signInWithOtp({
      phone,
      options: {
        data: {
          role: parsed.data.role,
          full_name: parsed.data.full_name,
          consent_kvkk: true,
          consent_marketing: consentMarketing,
        },
      },
    })

    if (error) {
      return { phase: 'phone', error: 'SMS gönderilemedi. Lütfen tekrar deneyin.' }
    }

    return { phase: 'otp', phone }
  }

  if (step === 'otp') {
    const parsed = otpSchema.safeParse({
      phone: String(formData.get('phone') ?? ''),
      token: String(formData.get('token') ?? '').trim().replace(/\s/g, ''),
    })

    if (!parsed.success) {
      return {
        phase: 'otp',
        phone: String(formData.get('phone') ?? ''),
        error: parsed.error.issues[0]?.message ?? 'Kodu kontrol edin.',
      }
    }

    const supabase = await createClient()
    const { error } = await supabase.auth.verifyOtp({
      phone: parsed.data.phone,
      token: parsed.data.token,
      type: 'sms',
    })

    if (error) {
      return { phase: 'otp', phone: parsed.data.phone, error: 'Kod geçersiz veya süresi dolmuş.' }
    }

    // Redirect after successful OTP — the `redirect` call type-satisfier below is unreachable
    const redirectTo = String(formData.get('redirect_to') ?? '/profil')
    const safe =
      redirectTo.startsWith('/') && !redirectTo.startsWith('//') ? redirectTo : '/profil'
    redirect(safe)
  }

  return { phase: 'phone', error: 'Geçersiz istek.' }
}
