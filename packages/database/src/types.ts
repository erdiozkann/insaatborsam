export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      addresses: {
        Row: {
          city: string
          country: string
          created_at: string
          deleted_at: string | null
          district: string
          id: string
          is_default: boolean
          label: string | null
          latitude: number | null
          longitude: number | null
          neighborhood: string | null
          postal_code: string | null
          recipient_name: string
          recipient_phone: string
          street_address: string
          updated_at: string
          user_id: string
        }
        Insert: {
          city: string
          country?: string
          created_at?: string
          deleted_at?: string | null
          district: string
          id?: string
          is_default?: boolean
          label?: string | null
          latitude?: number | null
          longitude?: number | null
          neighborhood?: string | null
          postal_code?: string | null
          recipient_name: string
          recipient_phone: string
          street_address: string
          updated_at?: string
          user_id: string
        }
        Update: {
          city?: string
          country?: string
          created_at?: string
          deleted_at?: string | null
          district?: string
          id?: string
          is_default?: boolean
          label?: string | null
          latitude?: number | null
          longitude?: number | null
          neighborhood?: string | null
          postal_code?: string | null
          recipient_name?: string
          recipient_phone?: string
          street_address?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "addresses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_audit_logs: {
        Row: {
          action: string
          after_data: Json | null
          before_data: Json | null
          created_at: string
          id: string
          ip_address: string | null
          resource_id: string | null
          resource_type: string
          session_id: string | null
          staff_user_id: string
          user_agent: string | null
        }
        Insert: {
          action: string
          after_data?: Json | null
          before_data?: Json | null
          created_at?: string
          id?: string
          ip_address?: string | null
          resource_id?: string | null
          resource_type: string
          session_id?: string | null
          staff_user_id: string
          user_agent?: string | null
        }
        Update: {
          action?: string
          after_data?: Json | null
          before_data?: Json | null
          created_at?: string
          id?: string
          ip_address?: string | null
          resource_id?: string | null
          resource_type?: string
          session_id?: string | null
          staff_user_id?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_audit_logs_staff_user_id_fkey"
            columns: ["staff_user_id"]
            isOneToOne: false
            referencedRelation: "staff_users"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_cache: {
        Row: {
          cache_type: string
          created_at: string
          embedding: string | null
          expires_at: string
          hit_count: number
          id: string
          input_hash: string
          model: string
          provider: string
          response_data: Json | null
          response_text: string | null
          token_count_input: number | null
          token_count_output: number | null
        }
        Insert: {
          cache_type: string
          created_at?: string
          embedding?: string | null
          expires_at: string
          hit_count?: number
          id?: string
          input_hash: string
          model: string
          provider: string
          response_data?: Json | null
          response_text?: string | null
          token_count_input?: number | null
          token_count_output?: number | null
        }
        Update: {
          cache_type?: string
          created_at?: string
          embedding?: string | null
          expires_at?: string
          hit_count?: number
          id?: string
          input_hash?: string
          model?: string
          provider?: string
          response_data?: Json | null
          response_text?: string | null
          token_count_input?: number | null
          token_count_output?: number | null
        }
        Relationships: []
      }
      buyer_profiles: {
        Row: {
          company_name: string | null
          company_type: string | null
          created_at: string
          deleted_at: string | null
          id: string
          monthly_searches_reset_at: string
          monthly_searches_used: number
          subscription_expires_at: string | null
          subscription_tier: string
          tax_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          company_name?: string | null
          company_type?: string | null
          created_at?: string
          deleted_at?: string | null
          id?: string
          monthly_searches_reset_at?: string
          monthly_searches_used?: number
          subscription_expires_at?: string | null
          subscription_tier?: string
          tax_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          company_name?: string | null
          company_type?: string | null
          created_at?: string
          deleted_at?: string | null
          id?: string
          monthly_searches_reset_at?: string
          monthly_searches_used?: number
          subscription_expires_at?: string | null
          subscription_tier?: string
          tax_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "buyer_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string
          description: string | null
          display_order: number
          icon: string | null
          id: string
          image_url: string | null
          is_active: boolean
          meta_description: string | null
          meta_title: string | null
          name: string
          parent_id: string | null
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_order?: number
          icon?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          meta_description?: string | null
          meta_title?: string | null
          name: string
          parent_id?: string | null
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          display_order?: number
          icon?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          meta_description?: string | null
          meta_title?: string | null
          name?: string
          parent_id?: string | null
          slug?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          buyer_id: string
          buyer_unread_count: number
          created_at: string
          deleted_at: string | null
          id: string
          last_message_at: string | null
          last_message_preview: string | null
          related_order_id: string | null
          related_product_id: string | null
          related_rfq_id: string | null
          seller_id: string
          seller_unread_count: number
          status: string
          updated_at: string
        }
        Insert: {
          buyer_id: string
          buyer_unread_count?: number
          created_at?: string
          deleted_at?: string | null
          id?: string
          last_message_at?: string | null
          last_message_preview?: string | null
          related_order_id?: string | null
          related_product_id?: string | null
          related_rfq_id?: string | null
          seller_id: string
          seller_unread_count?: number
          status?: string
          updated_at?: string
        }
        Update: {
          buyer_id?: string
          buyer_unread_count?: number
          created_at?: string
          deleted_at?: string | null
          id?: string
          last_message_at?: string | null
          last_message_preview?: string | null
          related_order_id?: string | null
          related_product_id?: string | null
          related_rfq_id?: string | null
          seller_id?: string
          seller_unread_count?: number
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "buyer_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_related_order_id_fkey"
            columns: ["related_order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_related_product_id_fkey"
            columns: ["related_product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_related_rfq_id_fkey"
            columns: ["related_rfq_id"]
            isOneToOne: false
            referencedRelation: "rfqs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "seller_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          attachments: Json
          body: string
          conversation_id: string
          created_at: string
          deleted_at: string | null
          edited_at: string | null
          id: string
          message_type: string
          metadata: Json
          read_at: string | null
          sender_profile_id: string | null
          sender_type: string
        }
        Insert: {
          attachments?: Json
          body: string
          conversation_id: string
          created_at?: string
          deleted_at?: string | null
          edited_at?: string | null
          id?: string
          message_type?: string
          metadata?: Json
          read_at?: string | null
          sender_profile_id?: string | null
          sender_type: string
        }
        Update: {
          attachments?: Json
          body?: string
          conversation_id?: string
          created_at?: string
          deleted_at?: string | null
          edited_at?: string | null
          id?: string
          message_type?: string
          metadata?: Json
          read_at?: string | null
          sender_profile_id?: string | null
          sender_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_profile_id_fkey"
            columns: ["sender_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string
          channel: string
          created_at: string
          data: Json
          failure_reason: string | null
          id: string
          notification_type: string
          read_at: string | null
          recipient_id: string
          sent_at: string | null
          status: string
          title: string
        }
        Insert: {
          body: string
          channel?: string
          created_at?: string
          data?: Json
          failure_reason?: string | null
          id?: string
          notification_type: string
          read_at?: string | null
          recipient_id: string
          sent_at?: string | null
          status?: string
          title: string
        }
        Update: {
          body?: string
          channel?: string
          created_at?: string
          data?: Json
          failure_reason?: string | null
          id?: string
          notification_type?: string
          read_at?: string | null
          recipient_id?: string
          sent_at?: string | null
          status?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          created_at: string
          display_order: number
          id: string
          line_total_cents: number
          order_id: string
          product_id: string
          product_image_snapshot: string | null
          product_name_snapshot: string
          product_sku_snapshot: string | null
          quantity: number
          unit: string
          unit_price_snapshot_cents: number
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          line_total_cents: number
          order_id: string
          product_id: string
          product_image_snapshot?: string | null
          product_name_snapshot: string
          product_sku_snapshot?: string | null
          quantity: number
          unit: string
          unit_price_snapshot_cents: number
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          line_total_cents?: number
          order_id?: string
          product_id?: string
          product_image_snapshot?: string | null
          product_name_snapshot?: string
          product_sku_snapshot?: string | null
          quantity?: number
          unit?: string
          unit_price_snapshot_cents?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      order_status_history: {
        Row: {
          actor_id: string | null
          actor_type: string
          created_at: string
          id: string
          note: string | null
          order_id: string
          status_from: string | null
          status_to: string
        }
        Insert: {
          actor_id?: string | null
          actor_type: string
          created_at?: string
          id?: string
          note?: string | null
          order_id: string
          status_from?: string | null
          status_to: string
        }
        Update: {
          actor_id?: string | null
          actor_type?: string
          created_at?: string
          id?: string
          note?: string | null
          order_id?: string
          status_from?: string | null
          status_to?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_status_history_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_status_history_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          buyer_id: string
          buyer_notes: string | null
          created_at: string
          currency: string
          delivered_at: string | null
          delivery_address_id: string
          estimated_delivery_at: string | null
          id: string
          internal_notes: string | null
          order_number: string | null
          payment_status: string
          platform_commission_cents: number
          seller_id: string
          seller_notes: string | null
          shipping_cost_cents: number
          shipping_method: string | null
          source_offer_id: string | null
          source_rfq_id: string | null
          status: string
          subtotal_cents: number
          tax_amount_cents: number
          total_amount_cents: number
          updated_at: string
        }
        Insert: {
          buyer_id: string
          buyer_notes?: string | null
          created_at?: string
          currency?: string
          delivered_at?: string | null
          delivery_address_id: string
          estimated_delivery_at?: string | null
          id?: string
          internal_notes?: string | null
          order_number?: string | null
          payment_status?: string
          platform_commission_cents?: number
          seller_id: string
          seller_notes?: string | null
          shipping_cost_cents?: number
          shipping_method?: string | null
          source_offer_id?: string | null
          source_rfq_id?: string | null
          status?: string
          subtotal_cents: number
          tax_amount_cents?: number
          total_amount_cents: number
          updated_at?: string
        }
        Update: {
          buyer_id?: string
          buyer_notes?: string | null
          created_at?: string
          currency?: string
          delivered_at?: string | null
          delivery_address_id?: string
          estimated_delivery_at?: string | null
          id?: string
          internal_notes?: string | null
          order_number?: string | null
          payment_status?: string
          platform_commission_cents?: number
          seller_id?: string
          seller_notes?: string | null
          shipping_cost_cents?: number
          shipping_method?: string | null
          source_offer_id?: string | null
          source_rfq_id?: string | null
          status?: string
          subtotal_cents?: number
          tax_amount_cents?: number
          total_amount_cents?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "buyer_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_delivery_address_id_fkey"
            columns: ["delivery_address_id"]
            isOneToOne: false
            referencedRelation: "addresses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "seller_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_source_offer_id_fkey"
            columns: ["source_offer_id"]
            isOneToOne: false
            referencedRelation: "rfq_offers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_source_rfq_id_fkey"
            columns: ["source_rfq_id"]
            isOneToOne: false
            referencedRelation: "rfqs"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount_cents: number
          card_brand: string | null
          card_last_four: string | null
          created_at: string
          currency: string
          failure_code: string | null
          failure_reason: string | null
          id: string
          idempotency_key: string | null
          is_3d_secure: boolean
          order_id: string | null
          paid_at: string | null
          payment_type: string
          provider: string
          provider_payment_id: string | null
          provider_response: Json | null
          refunded_amount_cents: number
          refunded_at: string | null
          status: string
          subscription_id: string | null
          updated_at: string
        }
        Insert: {
          amount_cents: number
          card_brand?: string | null
          card_last_four?: string | null
          created_at?: string
          currency: string
          failure_code?: string | null
          failure_reason?: string | null
          id?: string
          idempotency_key?: string | null
          is_3d_secure?: boolean
          order_id?: string | null
          paid_at?: string | null
          payment_type: string
          provider: string
          provider_payment_id?: string | null
          provider_response?: Json | null
          refunded_amount_cents?: number
          refunded_at?: string | null
          status?: string
          subscription_id?: string | null
          updated_at?: string
        }
        Update: {
          amount_cents?: number
          card_brand?: string | null
          card_last_four?: string | null
          created_at?: string
          currency?: string
          failure_code?: string | null
          failure_reason?: string | null
          id?: string
          idempotency_key?: string | null
          is_3d_secure?: boolean
          order_id?: string | null
          paid_at?: string | null
          payment_type?: string
          provider?: string
          provider_payment_id?: string | null
          provider_response?: Json | null
          refunded_amount_cents?: number
          refunded_at?: string | null
          status?: string
          subscription_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      price_index: {
        Row: {
          category_id: string | null
          city: string | null
          computation_method: string | null
          created_at: string
          currency: string
          data_source: string | null
          id: string
          material_key: string
          max_price_cents: number | null
          min_price_cents: number | null
          observed_at: string
          price_cents: number
          price_change_pct: number | null
          region: string | null
          sample_size: number
          unit: string
        }
        Insert: {
          category_id?: string | null
          city?: string | null
          computation_method?: string | null
          created_at?: string
          currency?: string
          data_source?: string | null
          id?: string
          material_key: string
          max_price_cents?: number | null
          min_price_cents?: number | null
          observed_at: string
          price_cents: number
          price_change_pct?: number | null
          region?: string | null
          sample_size?: number
          unit: string
        }
        Update: {
          category_id?: string | null
          city?: string | null
          computation_method?: string | null
          created_at?: string
          currency?: string
          data_source?: string | null
          id?: string
          material_key?: string
          max_price_cents?: number | null
          min_price_cents?: number | null
          observed_at?: string
          price_cents?: number
          price_change_pct?: number | null
          region?: string | null
          sample_size?: number
          unit?: string
        }
        Relationships: [
          {
            foreignKeyName: "price_index_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      product_images: {
        Row: {
          alt_text: string | null
          created_at: string
          display_order: number
          id: string
          is_primary: boolean
          product_id: string
          url: string
        }
        Insert: {
          alt_text?: string | null
          created_at?: string
          display_order?: number
          id?: string
          is_primary?: boolean
          product_id: string
          url: string
        }
        Update: {
          alt_text?: string | null
          created_at?: string
          display_order?: number
          id?: string
          is_primary?: boolean
          product_id?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_images_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_prices: {
        Row: {
          created_at: string
          id: string
          min_quantity: number
          price_cents: number
          product_id: string
          tier: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          min_quantity?: number
          price_cents: number
          product_id: string
          tier: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          min_quantity?: number
          price_cents?: number
          product_id?: string
          tier?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_prices_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          base_price_cents: number
          brand: string | null
          category_id: string
          created_at: string
          currency: string
          deleted_at: string | null
          description: string | null
          embedding: string | null
          id: string
          is_featured: boolean
          min_order_quantity: number
          name: string
          seller_id: string
          sku: string | null
          slug: string
          specifications: Json
          status: string
          stock_quantity: number
          unit: string
          updated_at: string
          view_count: number
        }
        Insert: {
          base_price_cents: number
          brand?: string | null
          category_id: string
          created_at?: string
          currency?: string
          deleted_at?: string | null
          description?: string | null
          embedding?: string | null
          id?: string
          is_featured?: boolean
          min_order_quantity?: number
          name: string
          seller_id: string
          sku?: string | null
          slug: string
          specifications?: Json
          status?: string
          stock_quantity?: number
          unit: string
          updated_at?: string
          view_count?: number
        }
        Update: {
          base_price_cents?: number
          brand?: string | null
          category_id?: string
          created_at?: string
          currency?: string
          deleted_at?: string | null
          description?: string | null
          embedding?: string | null
          id?: string
          is_featured?: boolean
          min_order_quantity?: number
          name?: string
          seller_id?: string
          sku?: string | null
          slug?: string
          specifications?: Json
          status?: string
          stock_quantity?: number
          unit?: string
          updated_at?: string
          view_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "seller_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          consent_kvkk: boolean
          consent_kvkk_at: string | null
          consent_marketing: boolean
          consent_marketing_at: string | null
          created_at: string
          deleted_at: string | null
          email: string
          full_name: string
          id: string
          phone: string | null
          preferred_language: string
          role: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          consent_kvkk?: boolean
          consent_kvkk_at?: string | null
          consent_marketing?: boolean
          consent_marketing_at?: string | null
          created_at?: string
          deleted_at?: string | null
          email: string
          full_name: string
          id: string
          phone?: string | null
          preferred_language?: string
          role: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          consent_kvkk?: boolean
          consent_kvkk_at?: string | null
          consent_marketing?: boolean
          consent_marketing_at?: string | null
          created_at?: string
          deleted_at?: string | null
          email?: string
          full_name?: string
          id?: string
          phone?: string | null
          preferred_language?: string
          role?: string
          updated_at?: string
        }
        Relationships: []
      }
      rfq_invitations: {
        Row: {
          created_at: string
          declined_at: string | null
          id: string
          invite_method: string
          responded_at: string | null
          rfq_id: string
          seen_at: string | null
          seller_id: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          declined_at?: string | null
          id?: string
          invite_method?: string
          responded_at?: string | null
          rfq_id: string
          seen_at?: string | null
          seller_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          declined_at?: string | null
          id?: string
          invite_method?: string
          responded_at?: string | null
          rfq_id?: string
          seen_at?: string | null
          seller_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rfq_invitations_rfq_id_fkey"
            columns: ["rfq_id"]
            isOneToOne: false
            referencedRelation: "rfqs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rfq_invitations_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "seller_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      rfq_items: {
        Row: {
          brand_preference: string | null
          category_id: string | null
          created_at: string
          display_order: number
          estimated_unit_price_cents: number | null
          id: string
          material_name: string
          notes: string | null
          quantity: number
          rfq_id: string
          specifications: Json
          unit: string
        }
        Insert: {
          brand_preference?: string | null
          category_id?: string | null
          created_at?: string
          display_order?: number
          estimated_unit_price_cents?: number | null
          id?: string
          material_name: string
          notes?: string | null
          quantity: number
          rfq_id: string
          specifications?: Json
          unit: string
        }
        Update: {
          brand_preference?: string | null
          category_id?: string | null
          created_at?: string
          display_order?: number
          estimated_unit_price_cents?: number | null
          id?: string
          material_name?: string
          notes?: string | null
          quantity?: number
          rfq_id?: string
          specifications?: Json
          unit?: string
        }
        Relationships: [
          {
            foreignKeyName: "rfq_items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rfq_items_rfq_id_fkey"
            columns: ["rfq_id"]
            isOneToOne: false
            referencedRelation: "rfqs"
            referencedColumns: ["id"]
          },
        ]
      }
      rfq_offers: {
        Row: {
          created_at: string
          delivery_time_days: number
          id: string
          notes: string | null
          resulting_order_id: string | null
          rfq_id: string
          seller_id: string
          status: string
          total_price_cents: number
          unit_price_cents: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          delivery_time_days: number
          id?: string
          notes?: string | null
          resulting_order_id?: string | null
          rfq_id: string
          seller_id: string
          status?: string
          total_price_cents: number
          unit_price_cents: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          delivery_time_days?: number
          id?: string
          notes?: string | null
          resulting_order_id?: string | null
          rfq_id?: string
          seller_id?: string
          status?: string
          total_price_cents?: number
          unit_price_cents?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rfq_offers_resulting_order_id_fkey"
            columns: ["resulting_order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rfq_offers_rfq_id_fkey"
            columns: ["rfq_id"]
            isOneToOne: false
            referencedRelation: "rfqs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rfq_offers_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "seller_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      rfqs: {
        Row: {
          brand_preference: string | null
          buyer_id: string
          category_id: string | null
          closed_at: string | null
          created_at: string
          deleted_at: string | null
          delivery_address_id: string | null
          delivery_deadline: string
          description: string
          embedding: string | null
          estimated_budget_cents: number | null
          expires_at: string
          id: string
          offer_count: number
          parsed_data: Json
          quantity: number
          reference_image_url: string | null
          sent_to_count: number
          status: string
          title: string
          unit: string
          updated_at: string
          viewed_count: number
        }
        Insert: {
          brand_preference?: string | null
          buyer_id: string
          category_id?: string | null
          closed_at?: string | null
          created_at?: string
          deleted_at?: string | null
          delivery_address_id?: string | null
          delivery_deadline: string
          description: string
          embedding?: string | null
          estimated_budget_cents?: number | null
          expires_at: string
          id?: string
          offer_count?: number
          parsed_data?: Json
          quantity: number
          reference_image_url?: string | null
          sent_to_count?: number
          status?: string
          title: string
          unit: string
          updated_at?: string
          viewed_count?: number
        }
        Update: {
          brand_preference?: string | null
          buyer_id?: string
          category_id?: string | null
          closed_at?: string | null
          created_at?: string
          deleted_at?: string | null
          delivery_address_id?: string | null
          delivery_deadline?: string
          description?: string
          embedding?: string | null
          estimated_budget_cents?: number | null
          expires_at?: string
          id?: string
          offer_count?: number
          parsed_data?: Json
          quantity?: number
          reference_image_url?: string | null
          sent_to_count?: number
          status?: string
          title?: string
          unit?: string
          updated_at?: string
          viewed_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "rfqs_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "buyer_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rfqs_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rfqs_delivery_address_id_fkey"
            columns: ["delivery_address_id"]
            isOneToOne: false
            referencedRelation: "addresses"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          created_at: string
          display_name: string
          id: string
          name: string
          permissions: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_name: string
          id?: string
          name: string
          permissions?: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_name?: string
          id?: string
          name?: string
          permissions?: Json
          updated_at?: string
        }
        Relationships: []
      }
      seller_kyc: {
        Row: {
          approved_at: string | null
          created_at: string
          iban_document_path: string | null
          id: string
          id_document_path: string | null
          rejection_reason: string | null
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          seller_id: string
          signature_circular_path: string | null
          status: string
          submitted_at: string | null
          tax_certificate_path: string | null
          trade_registry_path: string | null
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          created_at?: string
          iban_document_path?: string | null
          id?: string
          id_document_path?: string | null
          rejection_reason?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          seller_id: string
          signature_circular_path?: string | null
          status?: string
          submitted_at?: string | null
          tax_certificate_path?: string | null
          trade_registry_path?: string | null
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          created_at?: string
          iban_document_path?: string | null
          id?: string
          id_document_path?: string | null
          rejection_reason?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          seller_id?: string
          signature_circular_path?: string | null
          status?: string
          submitted_at?: string | null
          tax_certificate_path?: string | null
          trade_registry_path?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "seller_kyc_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "staff_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seller_kyc_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: true
            referencedRelation: "seller_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      seller_profiles: {
        Row: {
          company_name: string
          company_type: string
          created_at: string
          deleted_at: string | null
          iban_encrypted: string | null
          id: string
          is_verified: boolean
          primary_city: string
          primary_district: string
          rating_avg: number
          rating_count: number
          service_areas: string[]
          store_cover_url: string | null
          store_description: string | null
          store_logo_url: string | null
          store_name: string
          store_slug: string
          subscription_expires_at: string | null
          subscription_tier: string | null
          successful_orders_count: number
          tax_id: string
          trade_registry_no: string | null
          updated_at: string
          user_id: string
          verified_at: string | null
        }
        Insert: {
          company_name: string
          company_type: string
          created_at?: string
          deleted_at?: string | null
          iban_encrypted?: string | null
          id?: string
          is_verified?: boolean
          primary_city: string
          primary_district: string
          rating_avg?: number
          rating_count?: number
          service_areas?: string[]
          store_cover_url?: string | null
          store_description?: string | null
          store_logo_url?: string | null
          store_name: string
          store_slug: string
          subscription_expires_at?: string | null
          subscription_tier?: string | null
          successful_orders_count?: number
          tax_id: string
          trade_registry_no?: string | null
          updated_at?: string
          user_id: string
          verified_at?: string | null
        }
        Update: {
          company_name?: string
          company_type?: string
          created_at?: string
          deleted_at?: string | null
          iban_encrypted?: string | null
          id?: string
          is_verified?: boolean
          primary_city?: string
          primary_district?: string
          rating_avg?: number
          rating_count?: number
          service_areas?: string[]
          store_cover_url?: string | null
          store_description?: string | null
          store_logo_url?: string | null
          store_name?: string
          store_slug?: string
          subscription_expires_at?: string | null
          subscription_tier?: string | null
          successful_orders_count?: number
          tax_id?: string
          trade_registry_no?: string | null
          updated_at?: string
          user_id?: string
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "seller_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      seller_reviews: {
        Row: {
          buyer_id: string
          comment: string | null
          communication_rating: number | null
          created_at: string
          delivery_rating: number | null
          id: string
          is_verified_purchase: boolean
          order_id: string
          quality_rating: number | null
          rating: number
          seller_id: string
        }
        Insert: {
          buyer_id: string
          comment?: string | null
          communication_rating?: number | null
          created_at?: string
          delivery_rating?: number | null
          id?: string
          is_verified_purchase?: boolean
          order_id: string
          quality_rating?: number | null
          rating: number
          seller_id: string
        }
        Update: {
          buyer_id?: string
          comment?: string | null
          communication_rating?: number | null
          created_at?: string
          delivery_rating?: number | null
          id?: string
          is_verified_purchase?: boolean
          order_id?: string
          quality_rating?: number | null
          rating?: number
          seller_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "seller_reviews_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "buyer_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seller_reviews_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seller_reviews_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "seller_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_users: {
        Row: {
          created_at: string
          deleted_at: string | null
          id: string
          ip_whitelist: string[]
          is_active: boolean
          last_login_at: string | null
          last_login_ip: string | null
          role_id: string
          two_factor_enabled: boolean
          two_factor_secret: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          ip_whitelist?: string[]
          is_active?: boolean
          last_login_at?: string | null
          last_login_ip?: string | null
          role_id: string
          two_factor_enabled?: boolean
          two_factor_secret?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          ip_whitelist?: string[]
          is_active?: boolean
          last_login_at?: string | null
          last_login_ip?: string | null
          role_id?: string
          two_factor_enabled?: boolean
          two_factor_secret?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_users_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_users_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          billing_cycle: string
          buyer_id: string | null
          cancel_at: string | null
          canceled_at: string | null
          created_at: string
          currency: string
          current_period_end: string
          current_period_start: string
          id: string
          plan_id: string
          price_cents: number
          provider: string
          provider_customer_id: string | null
          provider_subscription_id: string | null
          seller_id: string | null
          status: string
          trial_ends_at: string | null
          updated_at: string
        }
        Insert: {
          billing_cycle?: string
          buyer_id?: string | null
          cancel_at?: string | null
          canceled_at?: string | null
          created_at?: string
          currency?: string
          current_period_end: string
          current_period_start: string
          id?: string
          plan_id: string
          price_cents: number
          provider: string
          provider_customer_id?: string | null
          provider_subscription_id?: string | null
          seller_id?: string | null
          status: string
          trial_ends_at?: string | null
          updated_at?: string
        }
        Update: {
          billing_cycle?: string
          buyer_id?: string | null
          cancel_at?: string | null
          canceled_at?: string | null
          created_at?: string
          currency?: string
          current_period_end?: string
          current_period_start?: string
          id?: string
          plan_id?: string
          price_cents?: number
          provider?: string
          provider_customer_id?: string | null
          provider_subscription_id?: string | null
          seller_id?: string | null
          status?: string
          trial_ends_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "buyer_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "seller_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      webhook_events: {
        Row: {
          created_at: string
          event_id: string
          event_type: string
          id: string
          payload: Json
          processed_at: string | null
          processing_error: string | null
          processing_status: string
          provider: string
          received_at: string
          retry_count: number
        }
        Insert: {
          created_at?: string
          event_id: string
          event_type: string
          id?: string
          payload: Json
          processed_at?: string | null
          processing_error?: string | null
          processing_status?: string
          provider: string
          received_at?: string
          retry_count?: number
        }
        Update: {
          created_at?: string
          event_id?: string
          event_type?: string
          id?: string
          payload?: Json
          processed_at?: string | null
          processing_error?: string | null
          processing_status?: string
          provider?: string
          received_at?: string
          retry_count?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_order_from_offer: {
        Args: { p_offer_id: string }
        Returns: string
      }
      has_staff_role: { Args: { p_role_names: string[] }; Returns: boolean }
      is_active_row: { Args: { p_deleted_at: string }; Returns: boolean }
      is_active_staff: { Args: never; Returns: boolean }
      show_limit: { Args: never; Returns: number }
      set_rfq_offer_status: {
        Args: { p_next_status: string; p_offer_id: string }
        Returns: undefined
      }
      show_trgm: { Args: { "": string }; Returns: string[] }
      update_buyer_order_note: {
        Args: { p_note: string; p_order_id: string }
        Returns: undefined
      }
      update_seller_order_note: {
        Args: { p_note: string; p_order_id: string }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
