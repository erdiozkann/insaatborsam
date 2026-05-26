"use server";

import { redirect } from "next/navigation";

type FormResult = {
  error: string;
} | null;

export async function submitSellerApplication(
  _prev: FormResult,
  formData: FormData
): Promise<FormResult> {
  const firmaAdi = formData.get("firma-adi")?.toString().trim();
  const adSoyad = formData.get("ad-soyad")?.toString().trim();
  const telefon = formData.get("telefon")?.toString().trim();
  const eposta = formData.get("eposta")?.toString().trim();
  const sehir = formData.get("sehir")?.toString().trim();
  const plan = formData.get("plan")?.toString().trim();
  const kategoriler = formData.getAll("kategoriler").map(String);

  if (!firmaAdi || !adSoyad || !telefon || !eposta || !sehir || !plan) {
    return { error: "Lütfen tüm zorunlu alanları doldurun." };
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(eposta)) {
    return { error: "Geçerli bir e-posta adresi girin." };
  }

  // Log for now — Resend entegrasyonu Sprint 3'te eklenir
  console.log("[Satıcı Başvurusu]", {
    firmaAdi,
    adSoyad,
    telefon,
    eposta,
    sehir,
    plan,
    kategoriler,
    tarih: new Date().toISOString(),
  });

  // TODO Sprint 3: Resend ile hello@insaatborsam.com'a bildirim gönder
  // const resend = new Resend(process.env.RESEND_API_KEY);
  // await resend.emails.send({ ... });

  redirect("/satici-ol?basarili=1");
}
