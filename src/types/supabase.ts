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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      asset_maintenance: {
        Row: {
          asset_id: string
          cost_cents: number | null
          id: string
          notes: string | null
          organization_id: string
          performed_at: string | null
          scheduled_at: string | null
          status: string | null
          type: string | null
        }
        Insert: {
          asset_id: string
          cost_cents?: number | null
          id?: string
          notes?: string | null
          organization_id: string
          performed_at?: string | null
          scheduled_at?: string | null
          status?: string | null
          type?: string | null
        }
        Update: {
          asset_id?: string
          cost_cents?: number | null
          id?: string
          notes?: string | null
          organization_id?: string
          performed_at?: string | null
          scheduled_at?: string | null
          status?: string | null
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "asset_maintenance_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asset_maintenance_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "v_assets_with_primary_image"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asset_maintenance_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      asset_movements: {
        Row: {
          asset_id: string
          from_location_id: string | null
          id: string
          moved_at: string
          notes: string | null
          organization_id: string
          reference_id: string | null
          reference_type: string | null
          to_location_id: string | null
        }
        Insert: {
          asset_id: string
          from_location_id?: string | null
          id?: string
          moved_at?: string
          notes?: string | null
          organization_id: string
          reference_id?: string | null
          reference_type?: string | null
          to_location_id?: string | null
        }
        Update: {
          asset_id?: string
          from_location_id?: string | null
          id?: string
          moved_at?: string
          notes?: string | null
          organization_id?: string
          reference_id?: string | null
          reference_type?: string | null
          to_location_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "asset_movements_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asset_movements_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "v_assets_with_primary_image"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asset_movements_from_location_id_fkey"
            columns: ["from_location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asset_movements_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asset_movements_to_location_id_fkey"
            columns: ["to_location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      assets: {
        Row: {
          acquisition_cost_cents: number | null
          acquisition_date: string | null
          asset_class: Database["public"]["Enums"]["asset_class"]
          category_id: string | null
          id: string
          image_url: string | null
          location_id: string | null
          name: string
          normalized_name: string | null
          organization_id: string | null
          residual_value_cents: number | null
          serial_no: string | null
          status: string | null
          useful_life_months: number | null
        }
        Insert: {
          acquisition_cost_cents?: number | null
          acquisition_date?: string | null
          asset_class: Database["public"]["Enums"]["asset_class"]
          category_id?: string | null
          id?: string
          image_url?: string | null
          location_id?: string | null
          name: string
          normalized_name?: string | null
          organization_id?: string | null
          residual_value_cents?: number | null
          serial_no?: string | null
          status?: string | null
          useful_life_months?: number | null
        }
        Update: {
          acquisition_cost_cents?: number | null
          acquisition_date?: string | null
          asset_class?: Database["public"]["Enums"]["asset_class"]
          category_id?: string | null
          id?: string
          image_url?: string | null
          location_id?: string | null
          name?: string
          normalized_name?: string | null
          organization_id?: string | null
          residual_value_cents?: number | null
          serial_no?: string | null
          status?: string | null
          useful_life_months?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "assets_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assets_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      bank_transactions: {
        Row: {
          company_id: string
          created_at: string | null
          id: string
        }
        Insert: {
          company_id: string
          created_at?: string | null
          id?: string
        }
        Update: {
          company_id?: string
          created_at?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bank_transactions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      bookkeeping: {
        Row: {
          amount_cents: number
          category: string
          company_id: string
          contact_id: string | null
          created_at: string | null
          date: string
          description: string | null
          id: string
          reference_id: string | null
          type: string
        }
        Insert: {
          amount_cents: number
          category: string
          company_id: string
          contact_id?: string | null
          created_at?: string | null
          date: string
          description?: string | null
          id?: string
          reference_id?: string | null
          type: string
        }
        Update: {
          amount_cents?: number
          category?: string
          company_id?: string
          contact_id?: string | null
          created_at?: string | null
          date?: string
          description?: string | null
          id?: string
          reference_id?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookkeeping_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookkeeping_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          category_type: Database["public"]["Enums"]["category_type"]
          id: string
          name: string
          organization_id: string | null
          parent_id: string | null
        }
        Insert: {
          category_type: Database["public"]["Enums"]["category_type"]
          id?: string
          name: string
          organization_id?: string | null
          parent_id?: string | null
        }
        Update: {
          category_type?: Database["public"]["Enums"]["category_type"]
          id?: string
          name?: string
          organization_id?: string | null
          parent_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "categories_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      catering_events: {
        Row: {
          company_id: string | null
          customer_name: string | null
          deal_id: string | null
          event_date: string | null
          financials: Json | null
          guest_count: number | null
          id: string
          organization_id: string | null
          status: string | null
        }
        Insert: {
          company_id?: string | null
          customer_name?: string | null
          deal_id?: string | null
          event_date?: string | null
          financials?: Json | null
          guest_count?: number | null
          id?: string
          organization_id?: string | null
          status?: string | null
        }
        Update: {
          company_id?: string | null
          customer_name?: string | null
          deal_id?: string | null
          event_date?: string | null
          financials?: Json | null
          guest_count?: number | null
          id?: string
          organization_id?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "catering_events_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "catering_events_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "crm_deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "catering_events_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      chart_of_accounts: {
        Row: {
          balance_cents: number | null
          code: string | null
          company_id: string
          created_at: string | null
          id: string
          name: string | null
          subtype: string | null
          type: string | null
        }
        Insert: {
          balance_cents?: number | null
          code?: string | null
          company_id: string
          created_at?: string | null
          id?: string
          name?: string | null
          subtype?: string | null
          type?: string | null
        }
        Update: {
          balance_cents?: number | null
          code?: string | null
          company_id?: string
          created_at?: string | null
          id?: string
          name?: string | null
          subtype?: string | null
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chart_of_accounts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      contacts: {
        Row: {
          address: string | null
          category: string | null
          company_id: string
          contact_person: string | null
          created_at: string | null
          customer_type: string | null
          id: string
          industry: string | null
          job_title: string | null
          name: string | null
          registration_number: string | null
          sentiment_score: number | null
          type: string | null
        }
        Insert: {
          address?: string | null
          category?: string | null
          company_id: string
          contact_person?: string | null
          created_at?: string | null
          customer_type?: string | null
          id?: string
          industry?: string | null
          job_title?: string | null
          name?: string | null
          registration_number?: string | null
          sentiment_score?: number | null
          type?: string | null
        }
        Update: {
          address?: string | null
          category?: string | null
          company_id?: string
          contact_person?: string | null
          created_at?: string | null
          customer_type?: string | null
          id?: string
          industry?: string | null
          job_title?: string | null
          name?: string | null
          registration_number?: string | null
          sentiment_score?: number | null
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contacts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_companies: {
        Row: {
          id: string
          industry: string | null
          name: string
          organization_id: string | null
          sentiment_score: number | null
        }
        Insert: {
          id?: string
          industry?: string | null
          name: string
          organization_id?: string | null
          sentiment_score?: number | null
        }
        Update: {
          id?: string
          industry?: string | null
          name?: string
          organization_id?: string | null
          sentiment_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_companies_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_deals: {
        Row: {
          company_id: string | null
          id: string
          organization_id: string | null
          stage: string | null
          title: string
          value: number | null
        }
        Insert: {
          company_id?: string | null
          id?: string
          organization_id?: string | null
          stage?: string | null
          title: string
          value?: number | null
        }
        Update: {
          company_id?: string | null
          id?: string
          organization_id?: string | null
          stage?: string | null
          title?: string
          value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_deals_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "crm_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_deals_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      departments: {
        Row: {
          created_at: string | null
          id: string
          name: string
          organization_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          organization_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "departments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      employees: {
        Row: {
          address: string | null
          avatar: string | null
          created_at: string | null
          date_of_employment: string | null
          dob: string | null
          email: string | null
          first_name: string | null
          gender: string | null
          health_notes: string | null
          id: string
          kpis: Json | null
          last_name: string | null
          name: string
          organization_id: string
          phone: string | null
          phone_number: string | null
          role: string
          salary_cents: number | null
          staff_id: string | null
          status: string | null
          title: string | null
          user_id: string | null
        }
        Insert: {
          address?: string | null
          avatar?: string | null
          created_at?: string | null
          date_of_employment?: string | null
          dob?: string | null
          email?: string | null
          first_name?: string | null
          gender?: string | null
          health_notes?: string | null
          id?: string
          kpis?: Json | null
          last_name?: string | null
          name: string
          organization_id: string
          phone?: string | null
          phone_number?: string | null
          role: string
          salary_cents?: number | null
          staff_id?: string | null
          status?: string | null
          title?: string | null
          user_id?: string | null
        }
        Update: {
          address?: string | null
          avatar?: string | null
          created_at?: string | null
          date_of_employment?: string | null
          dob?: string | null
          email?: string | null
          first_name?: string | null
          gender?: string | null
          health_notes?: string | null
          id?: string
          kpis?: Json | null
          last_name?: string | null
          name?: string
          organization_id?: string
          phone?: string | null
          phone_number?: string | null
          role?: string
          salary_cents?: number | null
          staff_id?: string | null
          status?: string | null
          title?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employees_company_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      entity_media: {
        Row: {
          bucket: string | null
          entity_id: string
          entity_type: string | null
          id: string
          is_primary: boolean | null
          object_path: string | null
          organization_id: string | null
          storage_object_id: string | null
        }
        Insert: {
          bucket?: string | null
          entity_id: string
          entity_type?: string | null
          id?: string
          is_primary?: boolean | null
          object_path?: string | null
          organization_id?: string | null
          storage_object_id?: string | null
        }
        Update: {
          bucket?: string | null
          entity_id?: string
          entity_type?: string | null
          id?: string
          is_primary?: boolean | null
          object_path?: string | null
          organization_id?: string | null
          storage_object_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "entity_media_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      finance_transactions: {
        Row: {
          amount: number
          category: string | null
          date: string | null
          description: string | null
          id: string
          organization_id: string | null
          type: string | null
        }
        Insert: {
          amount: number
          category?: string | null
          date?: string | null
          description?: string | null
          id?: string
          organization_id?: string | null
          type?: string | null
        }
        Update: {
          amount?: number
          category?: string | null
          date?: string | null
          description?: string | null
          id?: string
          organization_id?: string | null
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "finance_transactions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      hr_employees: {
        Row: {
          first_name: string
          id: string
          last_name: string
          organization_id: string | null
          role: string | null
          salary: number | null
          status: string | null
        }
        Insert: {
          first_name: string
          id?: string
          last_name: string
          organization_id?: string | null
          role?: string | null
          salary?: number | null
          status?: string | null
        }
        Update: {
          first_name?: string
          id?: string
          last_name?: string
          organization_id?: string | null
          role?: string | null
          salary?: number | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hr_employees_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      industries: {
        Row: {
          created_at: string
          id: string
          key: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          key: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          key?: string
          name?: string
        }
        Relationships: []
      }
      ingredient_movements: {
        Row: {
          batch_id: string | null
          created_at: string
          delta_qty: number
          id: string
          ingredient_id: string
          location_id: string | null
          movement_type: Database["public"]["Enums"]["movement_type_ing"]
          notes: string | null
          organization_id: string
          reference_id: string | null
          reference_type: string | null
          unit_id: string
        }
        Insert: {
          batch_id?: string | null
          created_at?: string
          delta_qty: number
          id?: string
          ingredient_id: string
          location_id?: string | null
          movement_type: Database["public"]["Enums"]["movement_type_ing"]
          notes?: string | null
          organization_id: string
          reference_id?: string | null
          reference_type?: string | null
          unit_id: string
        }
        Update: {
          batch_id?: string | null
          created_at?: string
          delta_qty?: number
          id?: string
          ingredient_id?: string
          location_id?: string | null
          movement_type?: Database["public"]["Enums"]["movement_type_ing"]
          notes?: string | null
          organization_id?: string
          reference_id?: string | null
          reference_type?: string | null
          unit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ingredient_movements_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "ingredient_stock_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ingredient_movements_ingredient_id_fkey"
            columns: ["ingredient_id"]
            isOneToOne: false
            referencedRelation: "ingredients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ingredient_movements_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ingredient_movements_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ingredient_movements_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units_of_measure"
            referencedColumns: ["id"]
          },
        ]
      }
      ingredient_stock_batches: {
        Row: {
          expires_at: string | null
          id: string
          ingredient_id: string
          location_id: string | null
          lot_code: string | null
          organization_id: string
          quantity: number
          received_at: string
          status: string | null
          unit_cost_cents: number
          unit_id: string
        }
        Insert: {
          expires_at?: string | null
          id?: string
          ingredient_id: string
          location_id?: string | null
          lot_code?: string | null
          organization_id: string
          quantity?: number
          received_at?: string
          status?: string | null
          unit_cost_cents?: number
          unit_id: string
        }
        Update: {
          expires_at?: string | null
          id?: string
          ingredient_id?: string
          location_id?: string | null
          lot_code?: string | null
          organization_id?: string
          quantity?: number
          received_at?: string
          status?: string | null
          unit_cost_cents?: number
          unit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ingredient_stock_batches_ingredient_id_fkey"
            columns: ["ingredient_id"]
            isOneToOne: false
            referencedRelation: "ingredients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ingredient_stock_batches_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ingredient_stock_batches_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ingredient_stock_batches_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units_of_measure"
            referencedColumns: ["id"]
          },
        ]
      }
      ingredients: {
        Row: {
          category_id: string | null
          id: string
          image_url: string | null
          name: string
          organization_id: string | null
          preferred_supplier_id: string | null
          reorder_point: number | null
          shelf_life_days: number | null
          unit_id: string | null
        }
        Insert: {
          category_id?: string | null
          id?: string
          image_url?: string | null
          name: string
          organization_id?: string | null
          preferred_supplier_id?: string | null
          reorder_point?: number | null
          shelf_life_days?: number | null
          unit_id?: string | null
        }
        Update: {
          category_id?: string | null
          id?: string
          image_url?: string | null
          name?: string
          organization_id?: string | null
          preferred_supplier_id?: string | null
          reorder_point?: number | null
          shelf_life_days?: number | null
          unit_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ingredients_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ingredients_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_deprecated: {
        Row: {
          category: string | null
          company_id: string
          created_at: string | null
          description: string | null
          id: string
          image: string | null
          is_asset: boolean
          is_rental: boolean
          name: string | null
          price_cents: number
          stock_quantity: number
          type: string | null
        }
        Insert: {
          category?: string | null
          company_id: string
          created_at?: string | null
          description?: string | null
          id?: string
          image?: string | null
          is_asset?: boolean
          is_rental?: boolean
          name?: string | null
          price_cents?: number
          stock_quantity?: number
          type?: string | null
        }
        Update: {
          category?: string | null
          company_id?: string
          created_at?: string | null
          description?: string | null
          id?: string
          image?: string | null
          is_asset?: boolean
          is_rental?: boolean
          name?: string | null
          price_cents?: number
          stock_quantity?: number
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_ingredients: {
        Row: {
          category: string | null
          current_cost: number
          id: string
          name: string
          organization_id: string | null
          unit: string
        }
        Insert: {
          category?: string | null
          current_cost: number
          id?: string
          name: string
          organization_id?: string | null
          unit: string
        }
        Update: {
          category?: string | null
          current_cost?: number
          id?: string
          name?: string
          organization_id?: string | null
          unit?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_ingredients_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          company_id: string
          contact_id: string | null
          created_at: string | null
          date: string
          due_date: string | null
          id: string
          lines: Json | null
          number: string
          paid_amount_cents: number | null
          status: string
          total_cents: number | null
          type: string
        }
        Insert: {
          company_id: string
          contact_id?: string | null
          created_at?: string | null
          date: string
          due_date?: string | null
          id?: string
          lines?: Json | null
          number: string
          paid_amount_cents?: number | null
          status: string
          total_cents?: number | null
          type: string
        }
        Update: {
          company_id?: string
          contact_id?: string | null
          created_at?: string | null
          date?: string
          due_date?: string | null
          id?: string
          lines?: Json | null
          number?: string
          paid_amount_cents?: number | null
          status?: string
          total_cents?: number | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      job_roles: {
        Row: {
          band: number
          created_at: string | null
          department_id: string
          id: string
          organization_id: string
          permissions: string[] | null
          salary_max: number
          salary_mid: number
          salary_min: number
          title: string
        }
        Insert: {
          band: number
          created_at?: string | null
          department_id: string
          id?: string
          organization_id: string
          permissions?: string[] | null
          salary_max: number
          salary_mid: number
          salary_min: number
          title: string
        }
        Update: {
          band?: number
          created_at?: string | null
          department_id?: string
          id?: string
          organization_id?: string
          permissions?: string[] | null
          salary_max?: number
          salary_mid?: number
          salary_min?: number
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_roles_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_roles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      leave_requests: {
        Row: {
          applied_date: string | null
          approved_by: string | null
          calendar_synced: boolean | null
          created_at: string | null
          employee_id: string | null
          employee_name: string | null
          end_date: string
          id: string
          organization_id: string | null
          reason: string | null
          start_date: string
          status: string | null
          type: string
        }
        Insert: {
          applied_date?: string | null
          approved_by?: string | null
          calendar_synced?: boolean | null
          created_at?: string | null
          employee_id?: string | null
          employee_name?: string | null
          end_date: string
          id?: string
          organization_id?: string | null
          reason?: string | null
          start_date: string
          status?: string | null
          type: string
        }
        Update: {
          applied_date?: string | null
          approved_by?: string | null
          calendar_synced?: boolean | null
          created_at?: string | null
          employee_id?: string | null
          employee_name?: string | null
          end_date?: string
          id?: string
          organization_id?: string | null
          reason?: string | null
          start_date?: string
          status?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "leave_requests_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leave_requests_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "employees_api"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leave_requests_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leave_requests_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees_api"
            referencedColumns: ["id"]
          },
        ]
      }
      ledger_transactions: {
        Row: {
          created_at: string | null
          date: string
          description: string | null
          entries: Json | null
          id: string
          source: string | null
          status: string | null
          tenant_id: string
        }
        Insert: {
          created_at?: string | null
          date: string
          description?: string | null
          entries?: Json | null
          id?: string
          source?: string | null
          status?: string | null
          tenant_id: string
        }
        Update: {
          created_at?: string | null
          date?: string
          description?: string | null
          entries?: Json | null
          id?: string
          source?: string | null
          status?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ledger_transactions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      locations: {
        Row: {
          id: string
          name: string
          organization_id: string
          parent_id: string | null
          type: string
        }
        Insert: {
          id?: string
          name: string
          organization_id: string
          parent_id?: string | null
          type?: string
        }
        Update: {
          id?: string
          name?: string
          organization_id?: string
          parent_id?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "locations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "locations_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          address: string | null
          annual_turnover_cents: number | null
          brand_color: string | null
          contact_person: Json | null
          contact_phone: string | null
          created_at: string | null
          created_by: string | null
          currency: string | null
          enabled_modules: string[] | null
          firs_tin: string | null
          id: string
          industry_id: string | null
          logo: string | null
          name: string
          owner_id: string | null
          setup_complete: boolean | null
          size: string | null
          type: string | null
        }
        Insert: {
          address?: string | null
          annual_turnover_cents?: number | null
          brand_color?: string | null
          contact_person?: Json | null
          contact_phone?: string | null
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          enabled_modules?: string[] | null
          firs_tin?: string | null
          id?: string
          industry_id?: string | null
          logo?: string | null
          name: string
          owner_id?: string | null
          setup_complete?: boolean | null
          size?: string | null
          type?: string | null
        }
        Update: {
          address?: string | null
          annual_turnover_cents?: number | null
          brand_color?: string | null
          contact_person?: Json | null
          contact_phone?: string | null
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          enabled_modules?: string[] | null
          firs_tin?: string | null
          id?: string
          industry_id?: string | null
          logo?: string | null
          name?: string
          owner_id?: string | null
          setup_complete?: boolean | null
          size?: string | null
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organizations_industry_id_fkey"
            columns: ["industry_id"]
            isOneToOne: false
            referencedRelation: "industries"
            referencedColumns: ["id"]
          },
        ]
      }
      performance_reviews: {
        Row: {
          created_at: string | null
          employee_id: string
          finalized_date: string | null
          id: string
          metrics: Json | null
          organization_id: string
          quarter: string
          status: string | null
          submitted_date: string | null
          total_score: number | null
          year: number
        }
        Insert: {
          created_at?: string | null
          employee_id: string
          finalized_date?: string | null
          id?: string
          metrics?: Json | null
          organization_id: string
          quarter: string
          status?: string | null
          submitted_date?: string | null
          total_score?: number | null
          year: number
        }
        Update: {
          created_at?: string | null
          employee_id?: string
          finalized_date?: string | null
          id?: string
          metrics?: Json | null
          organization_id?: string
          quarter?: string
          status?: string | null
          submitted_date?: string | null
          total_score?: number | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "performance_reviews_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "performance_reviews_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees_api"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "performance_reviews_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      product_categories: {
        Row: {
          created_at: string
          id: string
          name: string
          slug: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          slug: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      product_recipes: {
        Row: {
          ingredient_id: string
          product_id: string
          quantity: number
          unit_id: string | null
          wastage_factor: number | null
        }
        Insert: {
          ingredient_id: string
          product_id: string
          quantity: number
          unit_id?: string | null
          wastage_factor?: number | null
        }
        Update: {
          ingredient_id?: string
          product_id?: string
          quantity?: number
          unit_id?: string | null
          wastage_factor?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "product_recipes_ingredient_id_fkey"
            columns: ["ingredient_id"]
            isOneToOne: false
            referencedRelation: "ingredients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_recipes_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_recipes_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "v_public_products_with_primary_image"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "product_recipes_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units_of_measure"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          category_id: string | null
          created_at: string
          cuisine: string | null
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean
          lead_time_minutes: number | null
          name: string
          normalized_name: string | null
          organization_id: string
          price_cents: number
          product_category_id: string | null
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          cuisine?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          lead_time_minutes?: number | null
          name: string
          normalized_name?: string | null
          organization_id: string
          price_cents?: number
          product_category_id?: string | null
        }
        Update: {
          category_id?: string | null
          created_at?: string
          cuisine?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          lead_time_minutes?: number | null
          name?: string
          normalized_name?: string | null
          organization_id?: string
          price_cents?: number
          product_category_id?: string | null
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
            foreignKeyName: "products_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_product_category_id_fkey"
            columns: ["product_category_id"]
            isOneToOne: false
            referencedRelation: "product_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          email: string | null
          first_name: string | null
          full_name: string | null
          id: string
          is_super_admin: boolean | null
          last_name: string | null
          organization_id: string | null
          role: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          email?: string | null
          first_name?: string | null
          full_name?: string | null
          id: string
          is_super_admin?: boolean | null
          last_name?: string | null
          organization_id?: string | null
          role?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          email?: string | null
          first_name?: string | null
          full_name?: string | null
          id?: string
          is_super_admin?: boolean | null
          last_name?: string | null
          organization_id?: string | null
          role?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          company_id: string
          created_at: string | null
          id: string
          name: string | null
        }
        Insert: {
          company_id: string
          created_at?: string | null
          id?: string
          name?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string | null
          id?: string
          name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      rental_items: {
        Row: {
          category_id: string | null
          id: string
          image_url: string | null
          name: string
          organization_id: string | null
          replacement_cost_cents: number | null
          supplier_id: string | null
          unit_id: string | null
        }
        Insert: {
          category_id?: string | null
          id?: string
          image_url?: string | null
          name: string
          organization_id?: string | null
          replacement_cost_cents?: number | null
          supplier_id?: string | null
          unit_id?: string | null
        }
        Update: {
          category_id?: string | null
          id?: string
          image_url?: string | null
          name?: string
          organization_id?: string | null
          replacement_cost_cents?: number | null
          supplier_id?: string | null
          unit_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rental_items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rental_items_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      rental_movements: {
        Row: {
          created_at: string
          delta_qty: number
          id: string
          location_id: string | null
          movement_type: Database["public"]["Enums"]["movement_type_rental"]
          notes: string | null
          organization_id: string
          reference_id: string | null
          reference_type: string | null
          rental_item_id: string
          unit_id: string | null
        }
        Insert: {
          created_at?: string
          delta_qty: number
          id?: string
          location_id?: string | null
          movement_type: Database["public"]["Enums"]["movement_type_rental"]
          notes?: string | null
          organization_id: string
          reference_id?: string | null
          reference_type?: string | null
          rental_item_id: string
          unit_id?: string | null
        }
        Update: {
          created_at?: string
          delta_qty?: number
          id?: string
          location_id?: string | null
          movement_type?: Database["public"]["Enums"]["movement_type_rental"]
          notes?: string | null
          organization_id?: string
          reference_id?: string | null
          reference_type?: string | null
          rental_item_id?: string
          unit_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rental_movements_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rental_movements_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rental_movements_rental_item_id_fkey"
            columns: ["rental_item_id"]
            isOneToOne: false
            referencedRelation: "rental_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rental_movements_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units_of_measure"
            referencedColumns: ["id"]
          },
        ]
      }
      rental_receipt_lines: {
        Row: {
          condition_notes: string | null
          id: string
          quantity: number
          receipt_id: string
          rental_item_id: string
        }
        Insert: {
          condition_notes?: string | null
          id?: string
          quantity: number
          receipt_id: string
          rental_item_id: string
        }
        Update: {
          condition_notes?: string | null
          id?: string
          quantity?: number
          receipt_id?: string
          rental_item_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rental_receipt_lines_receipt_id_fkey"
            columns: ["receipt_id"]
            isOneToOne: false
            referencedRelation: "rental_receipts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rental_receipt_lines_rental_item_id_fkey"
            columns: ["rental_item_id"]
            isOneToOne: false
            referencedRelation: "rental_items"
            referencedColumns: ["id"]
          },
        ]
      }
      rental_receipts: {
        Row: {
          due_back_at: string | null
          id: string
          organization_id: string
          received_at: string
          reference: string | null
          supplier_id: string | null
        }
        Insert: {
          due_back_at?: string | null
          id?: string
          organization_id: string
          received_at?: string
          reference?: string | null
          supplier_id?: string | null
        }
        Update: {
          due_back_at?: string | null
          id?: string
          organization_id?: string
          received_at?: string
          reference?: string | null
          supplier_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rental_receipts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      rental_return_lines: {
        Row: {
          condition_notes: string | null
          id: string
          quantity: number
          rental_item_id: string
          return_id: string
        }
        Insert: {
          condition_notes?: string | null
          id?: string
          quantity: number
          rental_item_id: string
          return_id: string
        }
        Update: {
          condition_notes?: string | null
          id?: string
          quantity?: number
          rental_item_id?: string
          return_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rental_return_lines_rental_item_id_fkey"
            columns: ["rental_item_id"]
            isOneToOne: false
            referencedRelation: "rental_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rental_return_lines_return_id_fkey"
            columns: ["return_id"]
            isOneToOne: false
            referencedRelation: "rental_returns"
            referencedColumns: ["id"]
          },
        ]
      }
      rental_returns: {
        Row: {
          id: string
          organization_id: string
          reference: string | null
          returned_at: string
          supplier_id: string | null
        }
        Insert: {
          id?: string
          organization_id: string
          reference?: string | null
          returned_at?: string
          supplier_id?: string | null
        }
        Update: {
          id?: string
          organization_id?: string
          reference?: string | null
          returned_at?: string
          supplier_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rental_returns_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      rental_stock: {
        Row: {
          id: string
          location_id: string | null
          organization_id: string
          quantity_on_hand: number
          rental_item_id: string
        }
        Insert: {
          id?: string
          location_id?: string | null
          organization_id: string
          quantity_on_hand?: number
          rental_item_id: string
        }
        Update: {
          id?: string
          location_id?: string | null
          organization_id?: string
          quantity_on_hand?: number
          rental_item_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rental_stock_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rental_stock_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rental_stock_rental_item_id_fkey"
            columns: ["rental_item_id"]
            isOneToOne: false
            referencedRelation: "rental_items"
            referencedColumns: ["id"]
          },
        ]
      }
      requisitions: {
        Row: {
          company_id: string
          created_at: string | null
          id: string
          item_name: string | null
        }
        Insert: {
          company_id: string
          created_at?: string | null
          id?: string
          item_name?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string | null
          id?: string
          item_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "requisitions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      reusable_items: {
        Row: {
          category: string | null
          category_id: string | null
          description: string | null
          id: string
          image: string | null
          image_url: string | null
          name: string
          organization_id: string | null
          price_cents: number | null
          stock_level: number | null
          stock_quantity: number | null
          unit_id: string | null
        }
        Insert: {
          category?: string | null
          category_id?: string | null
          description?: string | null
          id?: string
          image?: string | null
          image_url?: string | null
          name: string
          organization_id?: string | null
          price_cents?: number | null
          stock_level?: number | null
          stock_quantity?: number | null
          unit_id?: string | null
        }
        Update: {
          category?: string | null
          category_id?: string | null
          description?: string | null
          id?: string
          image?: string | null
          image_url?: string | null
          name?: string
          organization_id?: string | null
          price_cents?: number | null
          stock_level?: number | null
          stock_quantity?: number | null
          unit_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reusable_items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reusable_items_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      reusable_movements: {
        Row: {
          created_at: string
          delta_qty: number
          id: string
          item_id: string
          location_id: string | null
          movement_type: Database["public"]["Enums"]["movement_type_reusable"]
          notes: string | null
          organization_id: string
          reference_id: string | null
          reference_type: string | null
          unit_id: string | null
        }
        Insert: {
          created_at?: string
          delta_qty: number
          id?: string
          item_id: string
          location_id?: string | null
          movement_type: Database["public"]["Enums"]["movement_type_reusable"]
          notes?: string | null
          organization_id: string
          reference_id?: string | null
          reference_type?: string | null
          unit_id?: string | null
        }
        Update: {
          created_at?: string
          delta_qty?: number
          id?: string
          item_id?: string
          location_id?: string | null
          movement_type?: Database["public"]["Enums"]["movement_type_reusable"]
          notes?: string | null
          organization_id?: string
          reference_id?: string | null
          reference_type?: string | null
          unit_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reusable_movements_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "reusable_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reusable_movements_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "v_reusable_items_with_primary_image"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reusable_movements_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reusable_movements_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reusable_movements_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units_of_measure"
            referencedColumns: ["id"]
          },
        ]
      }
      reusable_stock: {
        Row: {
          id: string
          item_id: string
          location_id: string | null
          organization_id: string
          quantity_on_hand: number
        }
        Insert: {
          id?: string
          item_id: string
          location_id?: string | null
          organization_id: string
          quantity_on_hand?: number
        }
        Update: {
          id?: string
          item_id?: string
          location_id?: string | null
          organization_id?: string
          quantity_on_hand?: number
        }
        Relationships: [
          {
            foreignKeyName: "reusable_stock_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "reusable_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reusable_stock_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "v_reusable_items_with_primary_image"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reusable_stock_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reusable_stock_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          company_id: string
          created_at: string | null
          id: string
          status: string | null
          title: string | null
        }
        Insert: {
          company_id: string
          created_at?: string | null
          id?: string
          status?: string | null
          title?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string | null
          id?: string
          status?: string | null
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tasks_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      units_of_measure: {
        Row: {
          base_unit_id: string | null
          conversion_factor: number | null
          id: string
          key: string
          name: string
          organization_id: string
        }
        Insert: {
          base_unit_id?: string | null
          conversion_factor?: number | null
          id?: string
          key: string
          name: string
          organization_id: string
        }
        Update: {
          base_unit_id?: string | null
          conversion_factor?: number | null
          id?: string
          key?: string
          name?: string
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "units_of_measure_base_unit_id_fkey"
            columns: ["base_unit_id"]
            isOneToOne: false
            referencedRelation: "units_of_measure"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "units_of_measure_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          company_id: string | null
          created_at: string | null
          email: string | null
          id: string
          name: string | null
          role: string | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string | null
          email?: string | null
          id: string
          name?: string | null
          role?: string | null
        }
        Update: {
          company_id?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          name?: string | null
          role?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "users_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      workspaces: {
        Row: {
          created_at: string
          id: string
          name: string
          owner_id: string
          slug: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          owner_id: string
          slug?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          owner_id?: string
          slug?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      employees_api: {
        Row: {
          address: string | null
          avatar: string | null
          company_id: string | null
          created_at: string | null
          dateOfEmployment: string | null
          dob: string | null
          email: string | null
          firstName: string | null
          gender: string | null
          healthNotes: string | null
          id: string | null
          kpis: Json | null
          lastName: string | null
          name: string | null
          phone: string | null
          phoneNumber: string | null
          role: string | null
          salaryCents: number | null
          status: string | null
        }
        Insert: {
          address?: string | null
          avatar?: string | null
          company_id?: string | null
          created_at?: string | null
          dateOfEmployment?: string | null
          dob?: string | null
          email?: string | null
          firstName?: string | null
          gender?: string | null
          healthNotes?: string | null
          id?: string | null
          kpis?: Json | null
          lastName?: string | null
          name?: string | null
          phone?: string | null
          phoneNumber?: string | null
          role?: string | null
          salaryCents?: number | null
          status?: string | null
        }
        Update: {
          address?: string | null
          avatar?: string | null
          company_id?: string | null
          created_at?: string | null
          dateOfEmployment?: string | null
          dob?: string | null
          email?: string | null
          firstName?: string | null
          gender?: string | null
          healthNotes?: string | null
          id?: string | null
          kpis?: Json | null
          lastName?: string | null
          name?: string | null
          phone?: string | null
          phoneNumber?: string | null
          role?: string | null
          salaryCents?: number | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employees_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_legacy: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          id: string | null
          image_url: string | null
          is_asset: boolean | null
          is_rental: boolean | null
          name: string | null
          organization_id: string | null
          price_cents: number | null
          stock_quantity: number | null
          type: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string | null
          image_url?: string | null
          is_asset?: boolean | null
          is_rental?: boolean | null
          name?: string | null
          organization_id?: string | null
          price_cents?: number | null
          stock_quantity?: number | null
          type?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string | null
          image_url?: string | null
          is_asset?: boolean | null
          is_rental?: boolean | null
          name?: string | null
          organization_id?: string | null
          price_cents?: number | null
          stock_quantity?: number | null
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_company_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      v_assets_with_primary_image: {
        Row: {
          acquisition_cost_cents: number | null
          acquisition_date: string | null
          asset_class: Database["public"]["Enums"]["asset_class"] | null
          category_id: string | null
          id: string | null
          location_id: string | null
          name: string | null
          organization_id: string | null
          primary_image_url: string | null
          residual_value_cents: number | null
          serial_no: string | null
          status: string | null
          useful_life_months: number | null
        }
        Relationships: [
          {
            foreignKeyName: "assets_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assets_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      v_ingredient_inventory: {
        Row: {
          item_id: string | null
          location_id: string | null
          location_name: string | null
          organization_id: string | null
          quantity_on_hand: number | null
          total_quantity: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ingredient_stock_batches_ingredient_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "ingredients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ingredient_stock_batches_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ingredient_stock_batches_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      v_public_products_with_primary_image: {
        Row: {
          organization_id: string | null
          primary_image_url: string | null
          product_id: string | null
          product_name: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      v_rental_inventory: {
        Row: {
          item_id: string | null
          location_id: string | null
          location_name: string | null
          organization_id: string | null
          quantity_on_hand: number | null
          total_quantity: number | null
        }
        Relationships: [
          {
            foreignKeyName: "rental_stock_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rental_stock_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rental_stock_rental_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "rental_items"
            referencedColumns: ["id"]
          },
        ]
      }
      v_reusable_inventory: {
        Row: {
          item_id: string | null
          location_id: string | null
          location_name: string | null
          organization_id: string | null
          quantity_on_hand: number | null
          total_quantity: number | null
        }
        Relationships: [
          {
            foreignKeyName: "reusable_stock_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "reusable_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reusable_stock_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "v_reusable_items_with_primary_image"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reusable_stock_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reusable_stock_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      v_reusable_items_with_primary_image: {
        Row: {
          category_id: string | null
          id: string | null
          name: string | null
          organization_id: string | null
          primary_image_url: string | null
          unit_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reusable_items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reusable_items_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      get_email_by_staff_id: { Args: { lookup_id: string }; Returns: string }
      get_employee_email_by_staff_id: {
        Args: { staff_id: string }
        Returns: string
      }
      get_user_org: { Args: never; Returns: string }
      is_super_admin: { Args: never; Returns: boolean }
      pick_oldest_batch: {
        Args: { p_ingredient: string; p_location: string; p_org: string }
        Returns: string
      }
      post_ingredient_movement: {
        Args: {
          p_delta: number
          p_expires_at?: string
          p_ingredient: string
          p_location: string
          p_notes: string
          p_org: string
          p_ref_id: string
          p_ref_type: string
          p_type: Database["public"]["Enums"]["movement_type_ing"]
          p_unit: string
          p_unit_cost_cents?: number
        }
        Returns: string
      }
      post_rental_movement: {
        Args: {
          p_delta: number
          p_item: string
          p_location: string
          p_notes: string
          p_org: string
          p_ref_id: string
          p_ref_type: string
          p_type: Database["public"]["Enums"]["movement_type_rental"]
          p_unit: string
        }
        Returns: string
      }
      post_reusable_movement: {
        Args: {
          p_delta: number
          p_item: string
          p_location: string
          p_notes: string
          p_org: string
          p_ref_id: string
          p_ref_type: string
          p_type: Database["public"]["Enums"]["movement_type_reusable"]
          p_unit: string
        }
        Returns: string
      }
      seed_common_units_for_org: { Args: { p_org: string }; Returns: undefined }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      slugify: { Args: { "": string }; Returns: string }
      storage_create_signed_urls_asset_inventory: {
        Args: { expires_in_seconds: number; object_paths: string[] }
        Returns: Json
      }
      upsert_primary_media: {
        Args: {
          p_bucket: string
          p_entity_id: string
          p_entity_type: string
          p_object_path: string
          p_organization_id: string
        }
        Returns: undefined
      }
    }
    Enums: {
      asset_class:
        | "fixture"
        | "office"
        | "catering_equipment"
        | "vehicle"
        | "hardware"
      category_type:
        | "menu"
        | "ingredient"
        | "asset"
        | "rental"
        | "livery"
        | "hardware"
        | "vehicle"
        | "fixture"
        | "office"
        | "catering_equipment"
        | "consumable"
      movement_type_ing:
        | "purchase"
        | "production_issue"
        | "adjustment"
        | "waste"
        | "return"
      movement_type_rental:
        | "receipt"
        | "issue_to_event"
        | "return_from_event"
        | "return_to_supplier"
        | "loss"
        | "adjustment"
      movement_type_reusable:
        | "issue"
        | "return"
        | "loss"
        | "adjustment"
        | "laundry_out"
        | "laundry_in"
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
    Enums: {
      asset_class: [
        "fixture",
        "office",
        "catering_equipment",
        "vehicle",
        "hardware",
      ],
      category_type: [
        "menu",
        "ingredient",
        "asset",
        "rental",
        "livery",
        "hardware",
        "vehicle",
        "fixture",
        "office",
        "catering_equipment",
        "consumable",
      ],
      movement_type_ing: [
        "purchase",
        "production_issue",
        "adjustment",
        "waste",
        "return",
      ],
      movement_type_rental: [
        "receipt",
        "issue_to_event",
        "return_from_event",
        "return_to_supplier",
        "loss",
        "adjustment",
      ],
      movement_type_reusable: [
        "issue",
        "return",
        "loss",
        "adjustment",
        "laundry_out",
        "laundry_in",
      ],
    },
  },
} as const
