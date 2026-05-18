---
name: iyzico-marketplace-flow
description: Ödeme akışı, abonelik, sipariş, refund, webhook, payout işlemleri yazılırken otomatik tetiklenir. Iyzico Marketplace + Stripe Connect entegrasyon kuralları, 3D Secure, idempotency, komisyon hesaplama. "payment", "checkout", "subscription", "iyzico", "stripe", "refund", "webhook", "payout", "ödeme", "abonelik", "sipariş tutar" geçen istekler için.
---

# Iyzico Marketplace + Stripe Connect Akışı

İnşaat Borsam **iki ödeme altyapısı** kullanır:
- **Iyzico Marketplace** — Türkiye (TRY)
- **Stripe Connect** — Avrupa/uluslararası (EUR)

## ROUTING KURALI

```ts
function selectPaymentProvider(user: User, transaction: Transaction): Provider {
  // Abonelik (sadece web'de!)
  if (transaction.type === 'subscription') {
    return user.country === 'TR' ? 'iyzico' : 'stripe'
  }
  
  // Sipariş (alıcı + satıcı arası)
  if (transaction.type === 'order') {
    // Her iki taraf da TR ise Iyzico
    if (transaction.buyer_country === 'TR' && transaction.seller_country === 'TR') {
      return 'iyzico'
    }
    // Aksi halde Stripe
    return 'stripe'
  }
}
```

## IYZICO MARKETPLACE — TEMEL

Marketplace modu = **alt-üye (sub-merchant)** sistemi. Her satıcı Iyzico'da kayıtlı, biz sadece kolaylaştırıcıyız.

### Satıcı onboarding

```ts
// Satıcı sub-merchant kaydı (Edge Function)
const subMerchant = await iyzico.subMerchant.create({
  name: seller.company_name,
  email: seller.email,
  gsmNumber: seller.phone,
  address: seller.address,
  iban: seller.iban,
  identityNumber: seller.tax_number, // VKN
  taxOffice: seller.tax_office,
  legalCompanyTitle: seller.legal_name,
  subMerchantExternalId: seller.id,
  subMerchantType: 'LIMITED_OR_JOINT_STOCK_COMPANY', // veya PERSONAL
  currency: 'TRY',
})

// Sonucu DB'ye kaydet
await supabase.from('sellers').update({
  iyzico_sub_merchant_key: subMerchant.subMerchantKey,
  iyzico_status: 'pending', // approved/rejected → webhook ile
}).eq('id', seller.id)
```

### Ödeme başlatma (sipariş)

```ts
// Edge Function: create_payment.ts
const payment = await iyzico.checkoutForm.create({
  locale: 'tr',
  conversationId: order.id, // ÖNEMLİ: tracking için
  price: order.subtotal, // KDV hariç
  paidPrice: order.total, // KDV dahil
  currency: 'TRY',
  basketId: order.id,
  paymentGroup: 'PRODUCT',
  callbackUrl: `${BASE_URL}/api/payments/iyzico/callback`,
  
  buyer: {
    id: order.buyer_id,
    name: order.buyer.name,
    surname: order.buyer.surname,
    gsmNumber: order.buyer.phone,
    email: order.buyer.email,
    identityNumber: order.buyer.tax_number || '11111111111', // VKN/TC
    registrationAddress: order.shipping_address.full,
    ip: req.ip,
    city: order.shipping_address.city,
    country: 'Turkey',
  },
  
  shippingAddress: order.shipping_address,
  billingAddress: order.billing_address,
  
  // Marketplace: her ürün ayrı sub-merchant
  basketItems: order.items.map(item => ({
    id: item.id,
    name: item.product_name,
    category1: item.category,
    itemType: 'PHYSICAL',
    price: item.subtotal, // KDV hariç
    subMerchantKey: item.seller.iyzico_sub_merchant_key,
    subMerchantPrice: calculateSubMerchantPrice(item), // komisyon düşülmüş
  })),
})

// payment.paymentPageUrl → kullanıcıyı yönlendir
```

### Komisyon hesaplama

```ts
function calculateSubMerchantPrice(item: OrderItem): number {
  const commissionRate = getSellerCommissionRate(item.seller) // %3-5
  const subtotalExclVat = item.subtotal
  const commission = subtotalExclVat * commissionRate
  // Sub-merchant'a giden: subtotal - komisyon
  return Number((subtotalExclVat - commission).toFixed(2))
}

function getSellerCommissionRate(seller: Seller): number {
  switch (seller.plan) {
    case 'starter': return 0.05    // %5
    case 'pro': return 0.04        // %4
    case 'enterprise': return 0.03 // %3
    default: return 0.05
  }
}
```

> **Detay:** `docs/07-BUSINESS.md` Bölüm 2.4

### 3D Secure (zorunlu)

Türkiye'de B2B ödemelerde 3DS varsayılan açık. `secure3D: true` set et veya `checkoutForm` kullan (zaten 3DS).

```ts
// Düşük tutar (< 100 TL) için 3DS atlama
const force3DS = order.total >= 100

if (force3DS) {
  // ÖNERILEN: checkoutForm (her zaman 3DS)
  await iyzico.checkoutForm.create({ ... })
} else {
  // Direct API + non-3DS
  await iyzico.payment.create({ ..., secure3D: false })
}
```

## STRIPE CONNECT — TEMEL

EU/uluslararası için. Connect "Express" tier kullan.

### Satıcı onboarding

```ts
// Stripe Express account
const account = await stripe.accounts.create({
  type: 'express',
  country: 'TR', // veya seller country
  email: seller.email,
  capabilities: {
    card_payments: { requested: true },
    transfers: { requested: true },
  },
  business_type: 'company',
})

// Onboarding link → satıcı tamamlar
const accountLink = await stripe.accountLinks.create({
  account: account.id,
  refresh_url: `${BASE_URL}/satici/stripe-yenile`,
  return_url: `${BASE_URL}/satici/stripe-tamam`,
  type: 'account_onboarding',
})

// DB'ye kaydet
await supabase.from('sellers').update({
  stripe_account_id: account.id,
  stripe_status: 'onboarding',
}).eq('id', seller.id)
```

### Checkout Session (abonelik)

```ts
const session = await stripe.checkout.sessions.create({
  mode: 'subscription',
  line_items: [{
    price: PLAN_PRICE_ID[plan], // önceden tanımlı price ID
    quantity: 1,
  }],
  customer_email: user.email,
  client_reference_id: user.id, // ÖNEMLİ: webhook'ta match için
  success_url: `${BASE_URL}/satici/abone-oldun?session_id={CHECKOUT_SESSION_ID}`,
  cancel_url: `${BASE_URL}/satici/plan-sec`,
  locale: 'tr',
  metadata: {
    user_id: user.id,
    plan: plan,
  },
})
```

### Checkout Session (sipariş — Connect transfer)

```ts
const session = await stripe.checkout.sessions.create({
  mode: 'payment',
  payment_intent_data: {
    application_fee_amount: Math.round(order.commission_amount * 100), // cent
    transfer_data: {
      destination: seller.stripe_account_id, // sub-account
    },
  },
  line_items: order.items.map(item => ({
    price_data: {
      currency: 'eur',
      product_data: { name: item.product_name },
      unit_amount: Math.round(item.unit_price * 100),
    },
    quantity: item.quantity,
  })),
  // ...
})
```

## WEBHOOK İŞLEME (KRİTİK)

Webhook'lar **idempotent** olmalı — Iyzico/Stripe aynı eventi 2+ kez gönderebilir.

### Iyzico Webhook

```ts
// Edge Function: iyzico_webhook.ts
serve(async (req) => {
  const signature = req.headers.get('x-iyz-signature')
  const body = await req.text()
  
  // 1. SIGNATURE DOĞRULA
  if (!verifyIyzicoSignature(body, signature)) {
    return new Response('Invalid signature', { status: 401 })
  }
  
  const event = JSON.parse(body)
  
  // 2. IDEMPOTENCY — daha önce işlendi mi?
  const { data: existing } = await supabase
    .from('webhook_events')
    .select('id')
    .eq('provider', 'iyzico')
    .eq('event_id', event.iyziEventTime + '_' + event.paymentConversationId)
    .single()
  
  if (existing) {
    return new Response('Already processed', { status: 200 })
  }
  
  // 3. KAYDET
  await supabase.from('webhook_events').insert({
    provider: 'iyzico',
    event_id: event.iyziEventTime + '_' + event.paymentConversationId,
    payload: event,
    processed_at: null,
  })
  
  // 4. İŞLE
  try {
    switch (event.status) {
      case 'SUCCESS':
        await handlePaymentSuccess(event)
        break
      case 'FAILURE':
        await handlePaymentFailure(event)
        break
      case 'REFUND':
        await handleRefund(event)
        break
    }
    
    // 5. İŞLENDİ İŞARETLE
    await supabase
      .from('webhook_events')
      .update({ processed_at: new Date().toISOString() })
      .eq('event_id', event.iyziEventTime + '_' + event.paymentConversationId)
    
    return new Response('OK', { status: 200 })
  } catch (err) {
    // Hata — webhook tekrar denenir
    Sentry.captureException(err)
    return new Response('Processing error', { status: 500 })
  }
})
```

### Stripe Webhook

```ts
serve(async (req) => {
  const signature = req.headers.get('stripe-signature')
  const body = await req.text()
  
  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(
      body, signature, WEBHOOK_SECRET
    )
  } catch {
    return new Response('Invalid signature', { status: 401 })
  }
  
  // Idempotency — event.id zaten unique
  const { data: existing } = await supabase
    .from('webhook_events')
    .select('id')
    .eq('provider', 'stripe')
    .eq('event_id', event.id)
    .single()
  
  if (existing) return new Response('OK', { status: 200 })
  
  await supabase.from('webhook_events').insert({
    provider: 'stripe',
    event_id: event.id,
    payload: event,
  })
  
  switch (event.type) {
    case 'checkout.session.completed':
      await handleCheckoutComplete(event.data.object)
      break
    case 'customer.subscription.updated':
      await handleSubscriptionUpdate(event.data.object)
      break
    case 'customer.subscription.deleted':
      await handleSubscriptionCancel(event.data.object)
      break
    // ...
  }
  
  return new Response('OK', { status: 200 })
})
```

## REFUND

```ts
async function refundOrder(orderId: string, reason: string) {
  const order = await getOrder(orderId)
  
  if (order.payment_provider === 'iyzico') {
    // Iyzico refund
    const refund = await iyzico.refund.create({
      paymentTransactionId: order.iyzico_transaction_id,
      price: order.total.toString(),
      currency: 'TRY',
      reason: 'BUYER_REQUEST',
      description: reason,
    })
  } else if (order.payment_provider === 'stripe') {
    // Stripe refund + reverse transfer
    const refund = await stripe.refunds.create({
      payment_intent: order.stripe_payment_intent_id,
      reverse_transfer: true, // satıcı hesabından geri al
      refund_application_fee: true, // komisyonu da iade et
    })
  }
  
  // Order status güncelle
  await supabase.from('orders').update({
    status: 'refunded',
    refunded_at: new Date(),
    refund_reason: reason,
  }).eq('id', orderId)
}
```

## SİPARİŞ DURUMU (state machine)

```
pending_payment → paid → confirmed → shipped → delivered
                ↓
              failed
              cancelled
              refunded
```

```ts
// Status değişikliği için tek noktadan geç
async function transitionOrderStatus(
  orderId: string, 
  newStatus: OrderStatus,
  metadata?: object
) {
  const order = await getOrder(orderId)
  
  // Valid transition kontrolü
  if (!isValidTransition(order.status, newStatus)) {
    throw new Error(`Invalid: ${order.status} → ${newStatus}`)
  }
  
  await supabase.rpc('transition_order_status', {
    p_order_id: orderId,
    p_new_status: newStatus,
    p_metadata: metadata,
  })
  
  // Side effects
  await emitOrderEvent(order, newStatus)
}
```

## PARA BİRİMİ — KESİNLİK

```ts
// ❌ JavaScript float
const total = 1.1 + 2.2 // 3.3000000000000003

// ✅ Sayıyı her zaman cent/kuruş integer olarak sakla
const totalInCents = 110 + 220 // 330 (yani 3.30)

// Gösterirken Intl.NumberFormat
new Intl.NumberFormat('tr-TR', {
  style: 'currency',
  currency: 'TRY',
}).format(totalInCents / 100) // "₺3,30"
```

DB'de **BIGINT** olarak sakla (cent/kuruş):
```sql
price_cents BIGINT NOT NULL, -- 12500 = ₺125.00
```

## DENEME ORTAMI

```ts
// .env
IYZICO_API_KEY=sandbox-...
IYZICO_SECRET=sandbox-...
IYZICO_BASE_URL=https://sandbox-api.iyzipay.com

STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_test_...
```

**Production'a geçmeden önce:**
- [ ] Tüm webhook'lar test edildi (Stripe CLI, Iyzico test panel)
- [ ] Idempotency test edildi (aynı event 3 kez gönder)
- [ ] Refund flow test edildi
- [ ] Failed payment flow test edildi
- [ ] 3DS hatalı kart test edildi
- [ ] Sub-merchant onboarding test edildi
- [ ] Komisyon hesaplama unit test'i var

## YAZIM ÖNCESİ CHECK

Ödeme kodu yazmadan önce:
- [ ] Provider routing doğru mu (Iyzico vs Stripe)?
- [ ] Webhook idempotent mi (event_id unique)?
- [ ] Webhook signature doğrulanıyor mu?
- [ ] Para birimi integer cent/kuruş mu?
- [ ] Sub-merchant key kullanılıyor mu (marketplace)?
- [ ] Komisyon doğru hesaplanıyor mu (satıcı plan'a göre)?
- [ ] 3DS açık mı (high-value tx için zorunlu)?
- [ ] Audit log yazılıyor mu (compliance için)?
- [ ] State machine valid transition kontrolü var mı?
- [ ] PII webhook payload'da log'lanmıyor mu (KVKK)?

## REFERANS

- `docs/07-BUSINESS.md` Bölüm 4 — Ödeme altyapı kararı
- `docs/04-DATABASE.md` — orders, payments, webhook_events tabloları
- Iyzico docs: https://docs.iyzico.com (en güncel kontrol et)
- Stripe docs: https://stripe.com/docs/connect
