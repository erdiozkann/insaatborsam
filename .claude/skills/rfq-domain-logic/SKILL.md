---
name: rfq-domain-logic
description: RFQ (Teklif Talebi), teklif, sipariş, fatura, KDV, komisyon, sevkiyat ile ilgili iş mantığı yazılırken otomatik tetiklenir. İnşaat sektörü domain bilgisi — birimler, metraj, hak ediş, lifecycle state machine. "rfq", "teklif", "sipariş", "fatura", "kdv", "metraj", "sevkiyat", "order", "quote", "invoice", "shipping" geçen istekler için.
---

# RFQ + Sipariş Domain Mantığı

İnşaat sektörü kendine özgü kurallarla çalışır. Generic e-commerce kodu yetmez.

## RFQ + TEKLİF + SİPARİŞ LİFECYCLE (State Machines)

> Üç ayrı tablo, üç ayrı status enum'ı var. Karıştırma. Gerçek CHECK
> constraint değerleri (migration'lardan):

```
rfqs.status:           open → evaluating → closed
                       open → expired (süre doldu)
                       open/evaluating → cancelled

rfq_invitations.status: invited → seen → responded
                        invited/seen → declined
                        invited/seen → expired

rfq_offers.status:     pending → shortlisted → accepted_pending_order
                       pending/shortlisted → rejected
                       pending → withdrawn (satıcı geri çeker)
                       pending → expired
                       (accepted = legacy, yeni akışta kullanılmaz)

orders.status:         pending_payment → paid → confirmed → preparing
                       → ready_to_ship → shipped → delivered
                       herhangi bir nokta → cancelled
                       paid sonrası → refunded
```

Alıcı `accepted_pending_order` teklifi `create_order_from_offer` RPC'si ile
`pending_payment` siparişe dönüştürür (Sprint 6-7).

### Valid transitions (gerçek enum değerleriyle)

```ts
const RFQ_TRANSITIONS = {
  open: ['evaluating', 'closed', 'expired', 'cancelled'],
  evaluating: ['closed', 'cancelled'],
  closed: [],     // terminal
  expired: [],    // terminal
  cancelled: [],  // terminal
} as const

const OFFER_TRANSITIONS = {
  pending: ['shortlisted', 'accepted_pending_order', 'rejected', 'withdrawn', 'expired'],
  shortlisted: ['accepted_pending_order', 'rejected'],
  accepted_pending_order: [], // sipariş RPC ile oluşur
  accepted: [],   // legacy
  rejected: [],
  withdrawn: [],
  expired: [],
} as const

const ORDER_TRANSITIONS = {
  pending_payment: ['paid', 'cancelled'],
  paid: ['confirmed', 'refunded', 'cancelled'],
  confirmed: ['preparing', 'cancelled'],
  preparing: ['ready_to_ship', 'cancelled'],
  ready_to_ship: ['shipped', 'cancelled'],
  shipped: ['delivered', 'cancelled'],
  delivered: [],
  cancelled: [],
  refunded: [],
} as const

function canTransition<T extends Record<string, readonly string[]>>(
  machine: T, from: keyof T, to: string,
): boolean {
  return machine[from]?.includes(to) ?? false
}
```

## TEKLİF GEÇERLİLİK SÜRESİ

```ts
const DEFAULT_OFFER_VALIDITY_DAYS = 7

// RFQ oluşturulurken
const rfq = {
  // ...
  expires_at: addDays(new Date(), DEFAULT_OFFER_VALIDITY_DAYS),
  status: 'open',
}

// Cron her gün
async function expireOverdueRfqs() {
  await supabase
    .from('rfqs')
    .update({ status: 'expired' })
    .lt('expires_at', new Date().toISOString())
    .eq('status', 'open')
}
```

Alıcı `expires_at`'i uzatabilir (max +14 gün).

## ÇOKLU SATICIDAN TEKLİF BİRLEŞTİRME (Split Order)

Alıcı 1 RFQ'da 10 kalem ister. 3 satıcı tüm kalemler için teklif veremez ama kısmi teklif verebilir.

```ts
// rfq_items + rfq_offers tablo modeli
type RfqOffer = {
  id: string
  rfq_id: string
  seller_id: string
  items: {
    rfq_item_id: string
    unit_price: number
    quantity_available: number
    delivery_days: number
  }[]
}
```

### Alıcı kararı
1. **Tek satıcıdan al** (tüm kalemler bir seller'dan)
2. **Split sipariş** (her kalem en iyi teklif veren seller'dan)
3. **Manuel seçim** (her kalem için seller seç)

```ts
async function awardRfq(rfqId: string, awards: AwardSelection[]) {
  // awards: [{ rfq_item_id, seller_id, accepted_offer_id }]
  
  // Her seller için ayrı order oluştur
  const orderMap = new Map<string, OrderDraft>()
  
  for (const award of awards) {
    if (!orderMap.has(award.seller_id)) {
      orderMap.set(award.seller_id, {
        rfq_id: rfqId,
        seller_id: award.seller_id,
        buyer_id: rfq.buyer_id,
        items: [],
      })
    }
    orderMap.get(award.seller_id)!.items.push(...)
  }
  
  // Her order'ı oluştur (1 RFQ → N order)
  for (const order of orderMap.values()) {
    await createOrder(order)
  }
  
  await transitionRfq(rfqId, 'closed') // RFQ kapanır; teklif accepted_pending_order → sipariş
}
```

## METRAJ BİRİMLERİ

İnşaat sektörü birim çeşitliliği geniş. Her ürün **birden fazla birim** destekleyebilir.

```ts
type ProductUnit = {
  unit: 'm2' | 'm3' | 'kg' | 'ton' | 'adet' | 'paket' | 'metre' | 'litre'
  conversion_to_base: number // base unit'e çevirme katsayısı
  is_base: boolean
}

// Örnek: Seramik 60x60
const seramik = {
  base_unit: 'm2',
  units: [
    { unit: 'm2', conversion: 1, is_base: true },
    { unit: 'paket', conversion: 1.44, is_base: false }, // 1 paket = 1.44 m²
    { unit: 'adet', conversion: 0.36, is_base: false }, // 1 fayans = 0.36 m²
  ],
  price_per_base_unit: 250, // ₺250/m²
}
```

### Fiyat hesaplama
```ts
function calculatePrice(product: Product, quantity: number, unit: Unit): number {
  const u = product.units.find(u => u.unit === unit)
  const baseQuantity = quantity * u.conversion_to_base
  return baseQuantity * product.price_per_base_unit
}
```

### UI gösterim
```tsx
<div>
  <Price>{formatTRY(unitPrice)}</Price>
  <Label>/ {unit.toUpperCase()}</Label>
</div>
```

## KDV HESAPLAMA (Türkiye)

Türkiye'de inşaat malzemesi:
- **Genel KDV: %20** (2026 mevcut oran)
- **İstisnalar:**
  - Konut teslimi (alıcı kişiyse) → %1 veya %8
  - Tarımsal yapı → farklı
- **B2B'de tam KDV alınır**, alıcı indirme hakkına sahip

```ts
const DEFAULT_VAT_RATE = 0.20 // %20

function calculateOrderTotals(items: OrderItem[]): OrderTotals {
  let subtotal = 0
  let vat = 0
  
  for (const item of items) {
    const lineSubtotal = item.unit_price * item.quantity
    const lineVat = lineSubtotal * (item.vat_rate ?? DEFAULT_VAT_RATE)
    
    subtotal += lineSubtotal
    vat += lineVat
  }
  
  return {
    subtotal: roundCurrency(subtotal),
    vat: roundCurrency(vat),
    total: roundCurrency(subtotal + vat),
  }
}

function roundCurrency(amount: number): number {
  return Math.round(amount * 100) / 100
}
```

### UI'da KDV gösterimi (B2B)

```tsx
<div className="text-right">
  <div>Ara Toplam: ₺10.000,00</div>
  <div>KDV (%20): ₺2.000,00</div>
  <div className="font-bold text-price-md">Toplam: ₺12.000,00</div>
</div>
```

### Fatura için
- KDV hariç (subtotal) — ana tutar
- KDV oranı + tutarı ayrı satır
- Toplam (subtotal + KDV)

## KOMİSYON HESAPLAMA SIRASI

```
1. Sipariş subtotal: ₺10.000 (KDV hariç)
2. KDV: ₺2.000 (%20)
3. Total: ₺12.000 (alıcı öder)
4. Komisyon: ₺10.000 × %4 = ₺400 (satıcı plan'a göre)
5. Satıcıya giden: ₺12.000 - ₺400 = ₺11.600
6. Platform: ₺400 (komisyon)
```

> **KDV komisyondan kesilmez** — KDV doğrudan satıcı geliridir.

```ts
function calculateMarketplaceSplit(order: Order, seller: Seller) {
  const commissionRate = COMMISSION_RATES[seller.plan]
  const commission = order.subtotal * commissionRate // KDV hariç
  
  return {
    buyer_pays: order.total,        // KDV dahil tutar
    seller_receives: order.total - commission,
    platform_commission: commission,
  }
}
```

## E-FATURA / E-ARŞİV (Faz 2+)

Türkiye **5M TL ciroyu aşan B2B** platformlar e-fatura zorunlu.

```
Faz 1: Manuel fatura (Excel'den), 5M aşmıyoruz
Faz 2-3: GİB entegrasyonu (Foriba, Logo, Mikro)
```

Komisyon faturası (platform → satıcı):
- Aylık toplam komisyon
- KDV %20 dahil
- E-fatura veya e-arşiv

Satıcı-alıcı arası fatura:
- Satıcının sorumluluğu
- Platform sadece **kolaylaştırıcı**
- Veri export edilebilir formatta (XML/PDF)

## HAK EDİŞ KAVRAMI (Sektörel)

İnşaat projelerinde ödeme **aşamalı**dır:
- Sipariş onayı: %30 peşin
- Sevkiyat: %60
- Teslim onay: %10

Faz 1'de **tek seferlik tam ödeme** kullan, hak ediş Faz 2-3'e bırak.

```ts
// Faz 2+ için planlanmış model
type PaymentSchedule = {
  order_id: string
  installments: {
    percentage: number // 0.30
    trigger: 'order_confirmed' | 'shipped' | 'delivered'
    due_date: Date
    status: 'pending' | 'paid' | 'overdue'
  }[]
}
```

## SEVKIYAT (Cargo)

Faz 1: **Manuel** — satıcı kendi nakliyesini ayarlar, takip numarası girer.

```ts
type Shipping = {
  order_id: string
  carrier: 'aras' | 'yurtici' | 'mng' | 'ptt' | 'manual'
  tracking_number: string
  estimated_delivery: Date
  status: 'preparing' | 'in_transit' | 'delivered' | 'returned'
}
```

Faz 2: Nakliyeci marketplace aktive olur, otomatik teklif/match.

## RFQ İŞ MANTIK CHECKS

### Min/max kontroller
```ts
const RFQ_LIMITS = {
  min_items: 1,
  max_items: 50,
  min_amount: 100, // TRY
  max_amount: 10_000_000, // 10M TRY
  min_validity_days: 1,
  max_validity_days: 30,
  min_delivery_days: 1,
  max_delivery_days: 90,
}
```

### Teklif min/max
```ts
function validateOffer(offer: Offer, rfq: Rfq) {
  // Teklif tutarı RFQ tahmini bütçenin ±%50 dışında olmasın
  if (rfq.estimated_budget) {
    const minAllowed = rfq.estimated_budget * 0.5
    const maxAllowed = rfq.estimated_budget * 1.5
    if (offer.total < minAllowed || offer.total > maxAllowed) {
      throw new Error('Teklif RFQ bütçesinin ±%50 dışında.')
    }
  }
  
  // Teslimat süresi RFQ'da belirtilen max'tan büyük olmasın
  if (offer.delivery_days > rfq.required_delivery_days) {
    throw new Error('Teslimat süresi RFQ gereksinimini aşıyor.')
  }
}
```

## SATICI ELEMENINE LİSE GİDEN BİLDİRİMLER

Satıcıya **gerçek zamanlı** bildirim:
- Yeni RFQ (kategoriye eşleşen)
- Teklif kabul edildi (awarded)
- Sipariş onay bekliyor
- Sipariş ödeme tamamlandı

```ts
// Supabase Realtime + Push notification
supabase.channel('seller_notifications')
  .on('postgres_changes', { 
    event: 'INSERT', 
    schema: 'public', 
    table: 'rfq_invitations',
    filter: `seller_id=eq.${seller.id}`,
  }, payload => {
    sendPushNotification({
      seller_id: seller.id,
      title: 'Yeni Teklif Talebi',
      body: `${payload.new.rfq.title}`,
      data: { rfq_id: payload.new.rfq_id },
    })
  })
  .subscribe()
```

## YAYGIN HATALAR

### ❌ Float ile para hesaplama
```ts
const total = 100.10 + 200.20 // 300.3000000000001
```
**Çözüm:** Cent integer kullan (cent ya da kuruş).

### ❌ KDV'yi komisyona dahil etme
```ts
const commission = order.total * 0.04 // ❌ KDV de komisyona giriyor
```
**Çözüm:**
```ts
const commission = order.subtotal * 0.04 // ✅ KDV hariç
```

### ❌ Birim dönüştürmesini ihmal
```ts
// Müşteri "10 paket" istedi, satıcı "m²" üzerinden teklif verdi
const total = 10 * unitPrice // ❌ yanlış, birim uyumsuz
```
**Çözüm:** Her zaman base unit'e çevir.

### ❌ State machine kontrolsüz geçişler
```ts
// ❌ Cancelled olan order'ı tekrar shipped yapmak
order.status = 'shipped'
```
**Çözüm:** `canTransition()` kontrolü zorunlu.

## YAZIM ÖNCESİ CHECK

RFQ/sipariş kodu yazmadan önce:
- [ ] State machine valid transition kontrolü var mı?
- [ ] Para birimi integer (cent/kuruş) mu?
- [ ] KDV hesaplaması ayrı satırda mı?
- [ ] Komisyon KDV hariç tutardan hesaplanıyor mu?
- [ ] Birim dönüştürmesi yapılıyor mu?
- [ ] Min/max kontrolleri var mı?
- [ ] Deadline/expiry cron'a bağlı mı?
- [ ] Audit log yazılıyor mu?
- [ ] Bildirim tetikleyici doğru çalışıyor mu?

## REFERANS

- `docs/02-SPEC.md` — RFQ ekran akışları
- `docs/04-DATABASE.md` — rfqs, rfq_offers, rfq_invitations, orders tabloları
- `docs/07-BUSINESS.md` — Komisyon oranları, fiyatlandırma
