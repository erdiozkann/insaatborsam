# 04 — Veritabanı Şeması

**Status:** Draft v1 | **Last Updated:** 2026-05-18 | **Owner:** Erdi

> **Supabase Postgres + pgvector.** Her tabloda RLS aktif. Migration'lar `supabase/migrations/` altında timestamped olarak.

---

## Genel İlkeler

1. **Naming:** `snake_case` (tablolar, kolonlar)
2. **Primary Key:** UUID v7 (`gen_random_uuid()` veya time-ordered için `uuidv7()`)
3. **Timestamps:** Her tabloda `created_at`, `updated_at` (TIMESTAMPTZ, default `now()`)
4. **Soft Delete:** `deleted_at TIMESTAMPTZ NULL` — silinmiş satırlar görünmez ama 30 gün saklanır
5. **RLS:** Her tabloda aktif, **istisnasız**
6. **Foreign Keys:** ON DELETE davranışı her ilişkide belirtilir
7. **Index:** Foreign key kolonları, sık WHERE kullanılan kolonlar
8. **Enum:** Sık değişen değerler için ENUM type
9. **JSON:** Esnek meta veri için `jsonb` (örn. ürün özellikleri)

---

## Şema Genel Görünüm

```
[auth.users] (Supabase Auth)
    │
    ├──< profiles (1:1, kullanıcı uzantısı)
    │       │
    │       ├──< buyer_profiles
    │       ├──< seller_profiles
    │       ├──< transporter_profiles (Faz 2)
    │       └──< admin_profiles
    │
    ├──< addresses
    └──< notification_preferences

[categories] (ürün kategorileri)
    └──< products
            │
            ├──< product_images
            ├──< product_variants
            └──< product_prices (tier bazlı)

[seller_profiles]
    ├──< products (1:n)
    ├──< orders (satıcı tarafı)
    ├──< rfq_offers
    └──< seller_reviews

[buyer_profiles]
    ├──< projects
    │       └──< project_materials (BOM)
    ├──< rfqs
    ├──< orders (alıcı tarafı)
    └──< buyer_reviews

[rfqs] (RFQ — Teklif Talebi)
    └──< rfq_offers (1:n)
            └──< order (kabul edilirse)

[orders]
    ├──< order_items
    ├──< order_status_history
    ├──< payments
    └──< shipments (Faz 2)

[shipments] (Faz 2)
    ├──< shipment_offers
    └──< shipment_tracking

[conversations]
    └──< messages

[admin]
    ├──< staff_users (RBAC)
    ├──< roles
    ├──< permissions
    ├──< audit_logs
    └──< discovered_businesses (satıcı kazanım)

[subscriptions]
    ├──< subscription_plans
    └──< subscription_invoices

[analytics]
    ├──< price_index (canlı fiyat endeksi)
    ├──< metrics_daily
    └──< user_events
```

---

## Tablolar — Faz 1

### 1. `profiles` (Kullanıcı uzantısı)

```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  phone TEXT UNIQUE,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  role TEXT NOT NULL CHECK (role IN ('buyer', 'seller', 'transporter', 'staff')),
  preferred_language TEXT NOT NULL DEFAULT 'tr',
  
  -- KVKK
  consent_marketing BOOLEAN NOT NULL DEFAULT FALSE,
  consent_marketing_at TIMESTAMPTZ,
  consent_kvkk BOOLEAN NOT NULL DEFAULT FALSE,
  consent_kvkk_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_profiles_role ON profiles(role) WHERE deleted_at IS NULL;
CREATE INDEX idx_profiles_phone ON profiles(phone) WHERE deleted_at IS NULL;
```

**RLS:**
```sql
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Kullanıcı kendi profilini okuyabilir
CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Kullanıcı kendi profilini güncelleyebilir
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Staff hepsini okuyabilir (Mission Control)
CREATE POLICY "Staff can read all profiles"
  ON profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM staff_users 
      WHERE user_id = auth.uid() AND deleted_at IS NULL
    )
  );
```

### 2. `seller_profiles`

```sql
CREATE TABLE seller_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  company_name TEXT NOT NULL,
  company_type TEXT NOT NULL CHECK (company_type IN ('nalbur', 'toptan', 'bayi', 'distributor', 'uretici')),
  tax_id TEXT NOT NULL, -- Vergi numarası
  trade_registry_no TEXT, -- Ticaret sicil
  iban TEXT, -- Encrypted (Supabase Vault)
  
  -- Doğrulama
  is_verified BOOLEAN NOT NULL DEFAULT FALSE,
  verified_at TIMESTAMPTZ,
  verification_documents JSONB, -- Vergi levhası vs URL'leri
  
  -- Mağaza
  store_name TEXT NOT NULL,
  store_slug TEXT UNIQUE NOT NULL,
  store_description TEXT,
  store_logo_url TEXT,
  store_cover_url TEXT,
  
  -- Lokasyon
  primary_city TEXT NOT NULL,
  primary_district TEXT NOT NULL,
  service_areas TEXT[] DEFAULT '{}', -- ['Istanbul', 'Kocaeli', 'Bursa']
  
  -- Metrikler (cached)
  rating_avg NUMERIC(3,2) DEFAULT 0,
  rating_count INT DEFAULT 0,
  successful_orders_count INT DEFAULT 0,
  
  -- Üyelik (subscription tablosundan referans alır)
  subscription_tier TEXT CHECK (subscription_tier IN ('basic', 'pro', 'enterprise')),
  subscription_expires_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_seller_profiles_user_id ON seller_profiles(user_id);
CREATE INDEX idx_seller_profiles_city ON seller_profiles(primary_city) WHERE deleted_at IS NULL;
CREATE INDEX idx_seller_profiles_verified ON seller_profiles(is_verified) WHERE deleted_at IS NULL;
```

### 3. `buyer_profiles`

```sql
CREATE TABLE buyer_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  
  company_name TEXT,
  company_type TEXT CHECK (company_type IN ('muteahhit', 'usta', 'muhendis', 'mimar', 'bireysel')),
  tax_id TEXT,
  
  -- Üyelik
  subscription_tier TEXT NOT NULL DEFAULT 'free' CHECK (subscription_tier IN ('free', 'pro', 'business')),
  subscription_expires_at TIMESTAMPTZ,
  
  -- Limit takibi (free tier için)
  monthly_searches_used INT DEFAULT 0,
  monthly_searches_reset_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '1 month',
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_buyer_profiles_subscription ON buyer_profiles(subscription_tier);
```

### 4. `categories`

```sql
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  icon TEXT, -- icon name (lucide)
  image_url TEXT,
  
  display_order INT DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  
  -- SEO
  meta_title TEXT,
  meta_description TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_categories_parent ON categories(parent_id);
CREATE INDEX idx_categories_active ON categories(is_active);
```

**Seed (Faz 1, 3 ana kategori + alt kategoriler):**
```
- Seramik & Vitrifiye
  - Yer Seramiği
  - Duvar Seramiği
  - Klozet
  - Lavabo
  - Küvet & Duş
- Yapı Kimyasalları
  - Yapıştırıcılar
  - Derz Dolguları
  - Su Yalıtım
  - Astar & Boya
- Elektrik Malzemesi
  - Kablo
  - Anahtar & Priz
  - Aydınlatma
  - Pano & Sigorta
```

### 5. `products`

```sql
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES seller_profiles(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  brand TEXT,
  sku TEXT,
  
  -- Specs (esnek JSON)
  specifications JSONB DEFAULT '{}', -- {boyut: "60x60", kalinlik: "9mm", ...}
  
  -- Fiyatlama
  base_price NUMERIC(12,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'TRY',
  unit TEXT NOT NULL, -- 'm²', 'ton', 'adet', 'kg', 'paket'
  
  -- Stok
  stock_quantity INT NOT NULL DEFAULT 0,
  min_order_quantity INT NOT NULL DEFAULT 1,
  
  -- Durum
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'out_of_stock', 'rejected')),
  is_featured BOOLEAN NOT NULL DEFAULT FALSE,
  
  -- AI Embedding (semantic search)
  embedding vector(1536), -- OpenAI text-embedding-3-small dimension
  
  -- Metrikler
  view_count INT DEFAULT 0,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  
  UNIQUE(seller_id, slug)
);

CREATE INDEX idx_products_seller ON products(seller_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_products_category ON products(category_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_products_status ON products(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_products_featured ON products(is_featured) WHERE status = 'active';

-- pgvector index (HNSW)
CREATE INDEX idx_products_embedding ON products USING hnsw (embedding vector_cosine_ops);

-- Full text search (Turkish)
CREATE INDEX idx_products_fts ON products USING gin(to_tsvector('turkish', name || ' ' || COALESCE(description, '') || ' ' || COALESCE(brand, '')));
```

### 6. `product_images`

```sql
CREATE TABLE product_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  
  url TEXT NOT NULL,
  alt_text TEXT,
  display_order INT NOT NULL DEFAULT 0,
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_product_images_product ON product_images(product_id, display_order);
```

### 7. `product_prices` (Tier bazlı fiyatlama)

```sql
CREATE TABLE product_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  
  tier TEXT NOT NULL CHECK (tier IN ('retail', 'wholesale', 'dealer')),
  min_quantity INT NOT NULL DEFAULT 1,
  price NUMERIC(12,2) NOT NULL,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(product_id, tier, min_quantity)
);
```

### 8. `addresses`

```sql
CREATE TABLE addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  label TEXT, -- "Şantiye", "Depo", "Ofis"
  recipient_name TEXT NOT NULL,
  recipient_phone TEXT NOT NULL,
  
  country TEXT NOT NULL DEFAULT 'TR',
  city TEXT NOT NULL,
  district TEXT NOT NULL,
  neighborhood TEXT,
  street_address TEXT NOT NULL,
  postal_code TEXT,
  
  latitude NUMERIC(10,7),
  longitude NUMERIC(10,7),
  
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_addresses_user ON addresses(user_id) WHERE deleted_at IS NULL;
```

### 9. `rfqs` (Teklif Talepleri)

```sql
CREATE TABLE rfqs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id UUID NOT NULL REFERENCES buyer_profiles(id) ON DELETE CASCADE,
  
  -- Talep detayları
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category_id UUID REFERENCES categories(id),
  brand_preference TEXT,
  
  quantity NUMERIC(12,2) NOT NULL,
  unit TEXT NOT NULL,
  
  -- Teslimat
  delivery_address_id UUID REFERENCES addresses(id),
  delivery_deadline DATE NOT NULL,
  
  -- AI-parsed structured data
  parsed_data JSONB DEFAULT '{}', -- Claude Haiku ile çıkarılan yapılandırılmış veri
  
  -- Embedding (satıcı eşleştirme için)
  embedding vector(1536),
  
  -- Foto
  reference_image_url TEXT,
  
  -- Durum
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'evaluating', 'closed', 'expired', 'cancelled')),
  
  -- Sayaçlar
  sent_to_count INT DEFAULT 0,
  viewed_count INT DEFAULT 0,
  offer_count INT DEFAULT 0,
  
  expires_at TIMESTAMPTZ NOT NULL,
  closed_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_rfqs_buyer ON rfqs(buyer_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_rfqs_status ON rfqs(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_rfqs_expires ON rfqs(expires_at) WHERE status = 'open';
CREATE INDEX idx_rfqs_embedding ON rfqs USING hnsw (embedding vector_cosine_ops);
```

### 10. `rfq_offers`

```sql
CREATE TABLE rfq_offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rfq_id UUID NOT NULL REFERENCES rfqs(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES seller_profiles(id) ON DELETE CASCADE,
  
  unit_price NUMERIC(12,2) NOT NULL,
  total_price NUMERIC(12,2) NOT NULL,
  delivery_time_days INT NOT NULL,
  notes TEXT,
  
  -- Durum
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'expired', 'withdrawn')),
  
  -- Eğer kabul edilirse, sipariş yarat
  resulting_order_id UUID REFERENCES orders(id),
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(rfq_id, seller_id) -- Bir satıcı bir RFQ'ya bir teklif
);

CREATE INDEX idx_rfq_offers_rfq ON rfq_offers(rfq_id, status);
CREATE INDEX idx_rfq_offers_seller ON rfq_offers(seller_id, status);
```

### 11. `orders`

```sql
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT UNIQUE NOT NULL, -- "ORD-8492-X"
  
  buyer_id UUID NOT NULL REFERENCES buyer_profiles(id) ON DELETE RESTRICT,
  seller_id UUID NOT NULL REFERENCES seller_profiles(id) ON DELETE RESTRICT,
  
  -- Eğer RFQ'dan geliyorsa
  source_rfq_id UUID REFERENCES rfqs(id),
  source_offer_id UUID REFERENCES rfq_offers(id),
  
  -- Tutarlar
  subtotal NUMERIC(12,2) NOT NULL,
  shipping_cost NUMERIC(12,2) NOT NULL DEFAULT 0,
  tax_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_amount NUMERIC(12,2) NOT NULL,
  platform_commission NUMERIC(12,2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'TRY',
  
  -- Adres
  delivery_address_id UUID NOT NULL REFERENCES addresses(id),
  
  -- Teslimat
  shipping_method TEXT CHECK (shipping_method IN ('seller_own', 'platform_cargo')),
  estimated_delivery_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  
  -- Durum
  status TEXT NOT NULL DEFAULT 'pending_payment' CHECK (status IN (
    'pending_payment', 'paid', 'confirmed', 'preparing', 
    'ready_to_ship', 'shipped', 'delivered', 'cancelled', 'refunded'
  )),
  
  -- Ödeme
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
  
  -- Notlar
  buyer_notes TEXT,
  seller_notes TEXT,
  internal_notes TEXT, -- Sadece staff görür
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_orders_buyer ON orders(buyer_id);
CREATE INDEX idx_orders_seller ON orders(seller_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created ON orders(created_at DESC);

-- Order number sequence
CREATE SEQUENCE order_number_seq START 1000;

CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.order_number := 'ORD-' || LPAD(nextval('order_number_seq')::TEXT, 4, '0') || '-' || 
                       SUBSTRING(MD5(RANDOM()::TEXT), 1, 1);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_order_number
  BEFORE INSERT ON orders
  FOR EACH ROW
  WHEN (NEW.order_number IS NULL)
  EXECUTE FUNCTION generate_order_number();
```

### 12. `order_items`

```sql
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  
  -- Snapshot (ürün değişse bile sipariş kayıtlı kalır)
  product_name_snapshot TEXT NOT NULL,
  product_image_snapshot TEXT,
  unit_price_snapshot NUMERIC(12,2) NOT NULL,
  
  quantity NUMERIC(12,2) NOT NULL,
  unit TEXT NOT NULL,
  line_total NUMERIC(12,2) NOT NULL,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_order_items_order ON order_items(order_id);
```

### 13. `order_status_history`

```sql
CREATE TABLE order_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  
  from_status TEXT,
  to_status TEXT NOT NULL,
  changed_by UUID REFERENCES profiles(id),
  changed_by_role TEXT, -- 'buyer', 'seller', 'system', 'admin'
  note TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_order_status_history_order ON order_status_history(order_id, created_at);
```

### 14. `payments`

```sql
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE RESTRICT,
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE RESTRICT,
  
  -- En az birine bağlı olmalı
  CHECK (order_id IS NOT NULL OR subscription_id IS NOT NULL),
  
  -- Provider
  provider TEXT NOT NULL CHECK (provider IN ('iyzico', 'stripe', 'bank_transfer')),
  provider_payment_id TEXT, -- Iyzico/Stripe payment ID
  provider_response JSONB, -- Tam yanıt
  
  amount NUMERIC(12,2) NOT NULL,
  currency TEXT NOT NULL,
  
  status TEXT NOT NULL CHECK (status IN ('pending', 'succeeded', 'failed', 'refunded', 'partially_refunded')),
  failure_reason TEXT,
  
  -- 3DS
  is_3d_secure BOOLEAN DEFAULT FALSE,
  
  -- Kart bilgileri (masked, son 4 hane)
  card_last_four TEXT,
  card_brand TEXT,
  
  paid_at TIMESTAMPTZ,
  refunded_at TIMESTAMPTZ,
  refunded_amount NUMERIC(12,2) DEFAULT 0,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_payments_order ON payments(order_id);
CREATE INDEX idx_payments_subscription ON payments(subscription_id);
CREATE INDEX idx_payments_provider_id ON payments(provider, provider_payment_id);
```

### 15. `subscriptions`

```sql
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Plan
  plan_id TEXT NOT NULL, -- 'buyer_pro', 'seller_basic', 'seller_pro', 'seller_enterprise'
  user_role TEXT NOT NULL CHECK (user_role IN ('buyer', 'seller', 'transporter')),
  
  -- Stripe / Iyzico
  provider TEXT NOT NULL CHECK (provider IN ('iyzico', 'stripe')),
  provider_subscription_id TEXT,
  provider_customer_id TEXT,
  
  -- Tutarlar
  amount NUMERIC(12,2) NOT NULL,
  currency TEXT NOT NULL,
  billing_cycle TEXT NOT NULL DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'yearly')),
  
  -- Durum
  status TEXT NOT NULL CHECK (status IN ('trialing', 'active', 'past_due', 'canceled', 'unpaid')),
  
  current_period_start TIMESTAMPTZ NOT NULL,
  current_period_end TIMESTAMPTZ NOT NULL,
  cancel_at TIMESTAMPTZ,
  canceled_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
```

### 16. `conversations` + `messages`

```sql
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- 2 katılımcı (buyer + seller genelde)
  participant_1_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  participant_2_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Context (opsiyonel — hangi sipariş/RFQ/ürün hakkında)
  related_order_id UUID REFERENCES orders(id),
  related_rfq_id UUID REFERENCES rfqs(id),
  related_product_id UUID REFERENCES products(id),
  
  last_message_at TIMESTAMPTZ,
  last_message_preview TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CHECK (participant_1_id != participant_2_id)
);

CREATE INDEX idx_conversations_p1 ON conversations(participant_1_id, last_message_at DESC);
CREATE INDEX idx_conversations_p2 ON conversations(participant_2_id, last_message_at DESC);

CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES profiles(id),
  
  content TEXT NOT NULL,
  message_type TEXT NOT NULL DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'product_card', 'rfq_card', 'price_quote', 'system')),
  metadata JSONB DEFAULT '{}', -- For special message types
  
  read_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_messages_conversation ON messages(conversation_id, created_at);
```

### 17. `seller_reviews`

```sql
CREATE TABLE seller_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES seller_profiles(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL REFERENCES buyer_profiles(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  
  rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  
  -- Boyutlar
  quality_rating INT CHECK (quality_rating BETWEEN 1 AND 5),
  delivery_rating INT CHECK (delivery_rating BETWEEN 1 AND 5),
  communication_rating INT CHECK (communication_rating BETWEEN 1 AND 5),
  
  is_verified_purchase BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(order_id, buyer_id) -- Bir alıcı bir siparişe bir yorum
);

CREATE INDEX idx_seller_reviews_seller ON seller_reviews(seller_id, created_at DESC);
```

### 18. `projects` + `project_materials` (BOM)

```sql
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id UUID NOT NULL REFERENCES buyer_profiles(id) ON DELETE CASCADE,
  
  name TEXT NOT NULL,
  description TEXT,
  cover_image_url TEXT,
  
  address_id UUID REFERENCES addresses(id),
  
  start_date DATE,
  estimated_completion DATE,
  actual_completion DATE,
  
  budget_total NUMERIC(14,2),
  budget_spent NUMERIC(14,2) DEFAULT 0,
  
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('draft', 'active', 'paused', 'completed', 'cancelled')),
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_projects_buyer ON projects(buyer_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_projects_status ON projects(status);

CREATE TABLE project_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id),
  
  material_name TEXT NOT NULL,
  brand TEXT,
  specifications JSONB DEFAULT '{}',
  
  planned_quantity NUMERIC(12,2) NOT NULL,
  unit TEXT NOT NULL,
  estimated_unit_price NUMERIC(12,2),
  
  -- Sipariş bağlantısı
  ordered_quantity NUMERIC(12,2) DEFAULT 0,
  delivered_quantity NUMERIC(12,2) DEFAULT 0,
  related_order_ids UUID[] DEFAULT '{}',
  
  status TEXT NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'ordered', 'partial_delivered', 'delivered')),
  
  -- AI ile oluşturuldu mu?
  ai_generated BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_project_materials_project ON project_materials(project_id);
```

### 19. Admin tabloları

```sql
-- Roller
CREATE TABLE roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL, -- 'owner', 'admin', 'operations', 'sales', 'moderator', 'support', 'finance', 'analyst'
  display_name TEXT NOT NULL,
  permissions JSONB NOT NULL DEFAULT '{}', -- {users: ['read', 'write'], orders: ['read']}
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Staff users (Admin kullanıcıları)
CREATE TABLE staff_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES roles(id),
  
  -- 2FA
  two_factor_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  two_factor_secret TEXT, -- TOTP secret (encrypted)
  
  -- IP whitelist (opsiyonel)
  ip_whitelist TEXT[],
  
  last_login_at TIMESTAMPTZ,
  last_login_ip TEXT,
  
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_staff_users_user ON staff_users(user_id);

-- Audit logs
CREATE TABLE admin_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_user_id UUID NOT NULL REFERENCES staff_users(id),
  
  action TEXT NOT NULL, -- 'user.suspend', 'order.refund', 'product.delete'
  resource_type TEXT NOT NULL, -- 'user', 'order', 'product'
  resource_id UUID,
  
  before_data JSONB,
  after_data JSONB,
  
  ip_address TEXT,
  user_agent TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_admin_audit_staff ON admin_audit_logs(staff_user_id, created_at DESC);
CREATE INDEX idx_admin_audit_resource ON admin_audit_logs(resource_type, resource_id);
```

### 20. `discovered_businesses` (Satıcı Kazanım Aracı)

```sql
CREATE TABLE discovered_businesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Discovery source
  source TEXT NOT NULL CHECK (source IN ('google_maps', 'trade_registry', 'manual', 'instagram', 'other')),
  source_id TEXT, -- External ID (Google Place ID etc)
  
  -- İşletme bilgisi
  company_name TEXT NOT NULL,
  category TEXT, -- 'elektrikci', 'nalbur', 'seramikci', ...
  
  -- İletişim
  phone TEXT,
  email TEXT,
  website TEXT,
  whatsapp TEXT,
  instagram TEXT,
  
  -- Lokasyon
  city TEXT,
  district TEXT,
  address TEXT,
  latitude NUMERIC(10,7),
  longitude NUMERIC(10,7),
  
  -- Funnel durumu
  funnel_stage TEXT NOT NULL DEFAULT 'discovered' CHECK (funnel_stage IN (
    'discovered', 'contacted', 'interested', 'demo_scheduled', 'demo_done', 
    'registered', 'active', 'rejected', 'lost'
  )),
  
  -- Outreach
  last_contacted_at TIMESTAMPTZ,
  contact_attempts_count INT DEFAULT 0,
  
  -- Eğer kayıt olursa
  registered_seller_id UUID REFERENCES seller_profiles(id),
  
  -- Notlar
  notes TEXT,
  assigned_to UUID REFERENCES staff_users(id),
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_discovered_businesses_funnel ON discovered_businesses(funnel_stage);
CREATE INDEX idx_discovered_businesses_city_category ON discovered_businesses(city, category);
CREATE INDEX idx_discovered_businesses_assigned ON discovered_businesses(assigned_to);

-- Outreach logs (gönderilen email/WhatsApp)
CREATE TABLE outreach_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES discovered_businesses(id) ON DELETE CASCADE,
  
  channel TEXT NOT NULL CHECK (channel IN ('email', 'whatsapp', 'sms', 'phone_call')),
  campaign_id UUID,
  template_id TEXT,
  
  status TEXT NOT NULL CHECK (status IN ('sent', 'delivered', 'opened', 'clicked', 'replied', 'bounced', 'failed')),
  
  message_content TEXT,
  metadata JSONB DEFAULT '{}',
  
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  replied_at TIMESTAMPTZ
);

CREATE INDEX idx_outreach_logs_business ON outreach_logs(business_id, sent_at DESC);
```

### 21. `price_index` (Canlı Fiyat Endeksi)

```sql
CREATE TABLE price_index (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Hangi malzeme
  material_key TEXT NOT NULL, -- 'cement_42_5_ton', 'rebar_8mm_kg', 'ceramic_60x60_m2'
  category_id UUID REFERENCES categories(id),
  unit TEXT NOT NULL,
  
  -- Lokasyon (opsiyonel)
  city TEXT, -- NULL ise Türkiye geneli
  
  -- Fiyat
  price NUMERIC(12,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'TRY',
  
  -- Veri kaynağı
  sample_size INT NOT NULL DEFAULT 1, -- Kaç satışta hesaplandı
  computation_method TEXT, -- 'median', 'mean', 'manual'
  
  -- Zaman
  date DATE NOT NULL,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(material_key, city, date)
);

CREATE INDEX idx_price_index_material_date ON price_index(material_key, date DESC);
CREATE INDEX idx_price_index_city_date ON price_index(city, date DESC) WHERE city IS NOT NULL;
```

---

## RLS Politikaları (Genel Pattern)

Her tabloda **3 tip policy** olmalı:

```sql
-- Pattern: products tablosu

-- 1. Public read (aktif ürünleri herkes görebilir)
CREATE POLICY "Active products are viewable by everyone"
  ON products FOR SELECT
  USING (status = 'active' AND deleted_at IS NULL);

-- 2. Owner CRUD (satıcı kendi ürününü yönetir)
CREATE POLICY "Sellers manage own products"
  ON products FOR ALL
  USING (
    seller_id IN (
      SELECT id FROM seller_profiles WHERE user_id = auth.uid()
    )
  );

-- 3. Staff access (admin'ler her şeyi görebilir)
CREATE POLICY "Staff can manage all products"
  ON products FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM staff_users 
      WHERE user_id = auth.uid() AND is_active = TRUE
    )
  );
```

---

## Database Functions (RPC)

### `search_products_semantic(query_text TEXT, limit_count INT)`

```sql
CREATE OR REPLACE FUNCTION search_products_semantic(
  query_text TEXT,
  limit_count INT DEFAULT 20
) RETURNS SETOF products AS $$
DECLARE
  query_embedding vector(1536);
BEGIN
  -- OpenAI embedding API çağırılması Edge Function tarafında yapılır
  -- Bu fonksiyon embedding'i parametre olarak alır
  -- Veya: TODO: cache strategy
  RETURN QUERY
  SELECT *
  FROM products
  WHERE status = 'active' AND deleted_at IS NULL
  ORDER BY embedding <=> query_embedding
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### `match_sellers_for_rfq(rfq_id_param UUID, limit_count INT)`

```sql
CREATE OR REPLACE FUNCTION match_sellers_for_rfq(
  rfq_id_param UUID,
  limit_count INT DEFAULT 10
) RETURNS TABLE(seller_id UUID, match_score NUMERIC) AS $$
BEGIN
  RETURN QUERY
  WITH rfq_data AS (
    SELECT embedding, category_id 
    FROM rfqs WHERE id = rfq_id_param
  )
  SELECT 
    s.id,
    -- Embedding similarity + category match + rating + verified
    (
      (1 - (p.embedding <=> (SELECT embedding FROM rfq_data))) * 0.5 +
      CASE WHEN p.category_id = (SELECT category_id FROM rfq_data) THEN 0.3 ELSE 0 END +
      (s.rating_avg / 5.0) * 0.15 +
      CASE WHEN s.is_verified THEN 0.05 ELSE 0 END
    ) AS score
  FROM seller_profiles s
  JOIN products p ON p.seller_id = s.id
  WHERE s.deleted_at IS NULL AND s.is_verified = TRUE
  GROUP BY s.id
  ORDER BY score DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### `complete_order_payment(order_id_param UUID, payment_id_param UUID)`

```sql
CREATE OR REPLACE FUNCTION complete_order_payment(
  order_id_param UUID,
  payment_id_param UUID
) RETURNS VOID AS $$
BEGIN
  -- Order'ı paid yap
  UPDATE orders 
  SET 
    status = 'paid',
    payment_status = 'paid',
    updated_at = NOW()
  WHERE id = order_id_param;
  
  -- Status history kaydet
  INSERT INTO order_status_history (order_id, from_status, to_status, changed_by_role, note)
  VALUES (order_id_param, 'pending_payment', 'paid', 'system', 'Ödeme alındı');
  
  -- Stok düş (her order_item için)
  UPDATE products p
  SET stock_quantity = stock_quantity - oi.quantity
  FROM order_items oi
  WHERE oi.order_id = order_id_param AND oi.product_id = p.id;
  
  -- Satıcıya bildirim (Edge Function trigger Realtime üzerinden)
  PERFORM pg_notify('order_paid', json_build_object(
    'order_id', order_id_param
  )::TEXT);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## Migrations Sırası (İlk Setup)

```
20260518_001_extensions.sql       # pgvector, pg_trgm vs.
20260518_002_profiles.sql
20260518_003_buyer_profiles.sql
20260518_004_seller_profiles.sql
20260518_005_categories.sql
20260518_006_products.sql
20260518_007_addresses.sql
20260518_008_rfqs.sql
20260518_009_orders.sql
20260518_010_payments.sql
20260518_011_subscriptions.sql
20260518_012_conversations.sql
20260518_013_reviews.sql
20260518_014_projects.sql
20260518_015_admin.sql
20260518_016_discovered_businesses.sql
20260518_017_price_index.sql
20260518_018_functions.sql
20260518_019_rls_policies.sql
20260518_020_seed_categories.sql
```

---

## Faz 2+ Tablolar

İleride eklenecekler — şimdilik şema yok:

- `shipments` + `shipment_offers` + `shipment_tracking` (Cargo App)
- `transporter_profiles` + `transporter_vehicles`
- `ai_agents` + `ai_agent_runs` (AI Ajan kontrol paneli)
- `escrow_accounts` + `escrow_transactions` (fintech)
- `invoices` (e-Fatura entegrasyonu)

---

## Performance Notları

- `vector` index'leri **HNSW** (IVFFlat değil — modern best practice)
- Aggregate queries için materialized view düşün (Faz 2)
- Realtime channel'larda RLS aktif olduğundan emin ol
- Çok büyük tablolar için partitioning (Faz 3'te `order_items`, `messages`)

---

## Data Lifecycle & Saklama

| Tablo | Saklama Süresi | KVKK |
|---|---|---|
| `profiles` | Hesap silinene kadar + 30 gün soft delete | Kullanıcı talebi ile hard delete |
| `orders` | 10 yıl (yasal zorunluluk) | Anonimize edilir, hesap silinse bile |
| `payments` | 10 yıl | Aynı |
| `messages` | 2 yıl | Sonra silinir |
| `admin_audit_logs` | 1 yıl | Aynı |
| `outreach_logs` | 6 ay | Aynı |
| `user_events` | 1 yıl | Aggregate'e döner |

---

**Sonraki adım:** AI özellikleri için `05-AI.md`, roadmap için `06-ROADMAP.md`.
