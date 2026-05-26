"use server";

import { redirect } from "next/navigation";

type FormResult = { error: string } | null;

export async function submitContactForm(
  _prev: FormResult,
  formData: FormData
): Promise<FormResult> {
  const ad = formData.get("ad")?.toString().trim();
  const eposta = formData.get("eposta")?.toString().trim();
  const konu = formData.get("konu")?.toString().trim();
  const mesaj = formData.get("mesaj")?.toString().trim();

  if (!ad || !eposta || !konu || !mesaj) {
    return { error: "Lütfen tüm alanları doldurun." };
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(eposta)) {
    return { error: "Geçerli bir e-posta adresi girin." };
  }

  // Log for now — Resend entegrasyonu Sprint 3'te eklenir
  console.log("[İletişim Formu]", { ad, eposta, konu, tarih: new Date().toISOString() });

  redirect("/iletisim?gonderildi=1");
}
