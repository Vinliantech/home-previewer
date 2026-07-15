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
      affiliate_profiles: {
        Row: {
          affiliate_code: string
          bank_details: Json
          bio: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          member_number: number
          phone: string | null
          photo_url: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          affiliate_code?: string
          bank_details?: Json
          bio?: string | null
          created_at?: string
          email: string
          full_name: string
          id?: string
          member_number?: number
          phone?: string | null
          photo_url?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          affiliate_code?: string
          bank_details?: Json
          bio?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          member_number?: number
          phone?: string | null
          photo_url?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      client_applications: {
        Row: {
          admin_notes: string | null
          application_ref_no: string | null
          assigned_plot_id: string | null
          assigned_user_id: string | null
          building_categories: string[] | null
          city_town: string | null
          company_name: string | null
          contact_state: string | null
          created_at: string
          date_of_birth: string | null
          email: string | null
          employer_name: string | null
          employment_status: string | null
          first_name: string | null
          gender: string | null
          house_number: string | null
          id: string
          id_number: string | null
          id_type: string | null
          is_company: boolean | null
          local_government_area: string | null
          nationality: string | null
          nok_name: string | null
          nok_phone: string | null
          nok_relationship: string | null
          office_address: string | null
          other_names: string | null
          passport_url: string | null
          payment_mode: string | null
          phone_number_1: string | null
          phone_number_2: string | null
          position_held: string | null
          processed_at: string | null
          processed_by: string | null
          state_of_origin: string | null
          status: string
          street_name: string | null
          surname: string | null
          title: string | null
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          application_ref_no?: string | null
          assigned_plot_id?: string | null
          assigned_user_id?: string | null
          building_categories?: string[] | null
          city_town?: string | null
          company_name?: string | null
          contact_state?: string | null
          created_at?: string
          date_of_birth?: string | null
          email?: string | null
          employer_name?: string | null
          employment_status?: string | null
          first_name?: string | null
          gender?: string | null
          house_number?: string | null
          id?: string
          id_number?: string | null
          id_type?: string | null
          is_company?: boolean | null
          local_government_area?: string | null
          nationality?: string | null
          nok_name?: string | null
          nok_phone?: string | null
          nok_relationship?: string | null
          office_address?: string | null
          other_names?: string | null
          passport_url?: string | null
          payment_mode?: string | null
          phone_number_1?: string | null
          phone_number_2?: string | null
          position_held?: string | null
          processed_at?: string | null
          processed_by?: string | null
          state_of_origin?: string | null
          status?: string
          street_name?: string | null
          surname?: string | null
          title?: string | null
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          application_ref_no?: string | null
          assigned_plot_id?: string | null
          assigned_user_id?: string | null
          building_categories?: string[] | null
          city_town?: string | null
          company_name?: string | null
          contact_state?: string | null
          created_at?: string
          date_of_birth?: string | null
          email?: string | null
          employer_name?: string | null
          employment_status?: string | null
          first_name?: string | null
          gender?: string | null
          house_number?: string | null
          id?: string
          id_number?: string | null
          id_type?: string | null
          is_company?: boolean | null
          local_government_area?: string | null
          nationality?: string | null
          nok_name?: string | null
          nok_phone?: string | null
          nok_relationship?: string | null
          office_address?: string | null
          other_names?: string | null
          passport_url?: string | null
          payment_mode?: string | null
          phone_number_1?: string | null
          phone_number_2?: string | null
          position_held?: string | null
          processed_at?: string | null
          processed_by?: string | null
          state_of_origin?: string | null
          status?: string
          street_name?: string | null
          surname?: string | null
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_applications_assigned_plot_id_fkey"
            columns: ["assigned_plot_id"]
            isOneToOne: false
            referencedRelation: "plots"
            referencedColumns: ["id"]
          },
        ]
      }
      client_leads: {
        Row: {
          affiliate_id: string
          created_at: string
          email: string | null
          full_name: string
          id: string
          notes: string | null
          phone: string | null
          property_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          affiliate_id: string
          created_at?: string
          email?: string | null
          full_name: string
          id?: string
          notes?: string | null
          phone?: string | null
          property_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          affiliate_id?: string
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          notes?: string | null
          phone?: string | null
          property_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_leads_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliate_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_leads_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "available_properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_leads_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "tokenized_properties"
            referencedColumns: ["id"]
          },
        ]
      }
      commissions: {
        Row: {
          affiliate_id: string
          amount: number
          created_at: string
          id: string
          lead_id: string | null
          notes: string | null
          status: string
          updated_at: string
        }
        Insert: {
          affiliate_id: string
          amount: number
          created_at?: string
          id?: string
          lead_id?: string | null
          notes?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          affiliate_id?: string
          amount?: number
          created_at?: string
          id?: string
          lead_id?: string | null
          notes?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "commissions_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliate_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commissions_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "client_leads"
            referencedColumns: ["id"]
          },
        ]
      }
      company_account: {
        Row: {
          account_name: string
          account_number: string
          account_type: string | null
          bank_name: string
          created_at: string
          id: string
          purpose: string | null
          updated_at: string
        }
        Insert: {
          account_name: string
          account_number: string
          account_type?: string | null
          bank_name: string
          created_at?: string
          id?: string
          purpose?: string | null
          updated_at?: string
        }
        Update: {
          account_name?: string
          account_number?: string
          account_type?: string | null
          bank_name?: string
          created_at?: string
          id?: string
          purpose?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      documents: {
        Row: {
          approval_status: string | null
          created_at: string
          document_type: string
          file_name: string
          file_url: string
          id: string
          notes: string | null
          payment_category: string | null
          user_id: string | null
        }
        Insert: {
          approval_status?: string | null
          created_at?: string
          document_type?: string
          file_name: string
          file_url: string
          id?: string
          notes?: string | null
          payment_category?: string | null
          user_id?: string | null
        }
        Update: {
          approval_status?: string | null
          created_at?: string
          document_type?: string
          file_name?: string
          file_url?: string
          id?: string
          notes?: string | null
          payment_category?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      estates: {
        Row: {
          created_at: string
          description: string | null
          id: string
          location: string
          name: string
          total_land_size: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          location: string
          name: string
          total_land_size?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          location?: string
          name?: string
          total_land_size?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      exit_requests: {
        Row: {
          admin_notes: string | null
          asking_price: number
          created_at: string
          id: string
          investor_id: string
          property_id: string
          status: Database["public"]["Enums"]["exit_status"]
          tokens_to_sell: number
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          asking_price: number
          created_at?: string
          id?: string
          investor_id: string
          property_id: string
          status?: Database["public"]["Enums"]["exit_status"]
          tokens_to_sell: number
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          asking_price?: number
          created_at?: string
          id?: string
          investor_id?: string
          property_id?: string
          status?: Database["public"]["Enums"]["exit_status"]
          tokens_to_sell?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "exit_requests_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "available_properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exit_requests_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "tokenized_properties"
            referencedColumns: ["id"]
          },
        ]
      }
      group_pools: {
        Row: {
          admin_notes: string | null
          closing_date: string | null
          created_at: string
          created_by: string
          description: string | null
          id: string
          member_cap: number | null
          min_contribution: number
          name: string
          property_id: string | null
          property_name: string | null
          status: Database["public"]["Enums"]["pool_status"]
          target_amount: number
          updated_at: string
          visibility: Database["public"]["Enums"]["pool_visibility"]
        }
        Insert: {
          admin_notes?: string | null
          closing_date?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          member_cap?: number | null
          min_contribution?: number
          name: string
          property_id?: string | null
          property_name?: string | null
          status?: Database["public"]["Enums"]["pool_status"]
          target_amount: number
          updated_at?: string
          visibility?: Database["public"]["Enums"]["pool_visibility"]
        }
        Update: {
          admin_notes?: string | null
          closing_date?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          member_cap?: number | null
          min_contribution?: number
          name?: string
          property_id?: string | null
          property_name?: string | null
          status?: Database["public"]["Enums"]["pool_status"]
          target_amount?: number
          updated_at?: string
          visibility?: Database["public"]["Enums"]["pool_visibility"]
        }
        Relationships: []
      }
      investment_certificates: {
        Row: {
          certificate_number: string
          created_at: string
          id: string
          investment_id: string
          issued_at: string
          pdf_url: string | null
          verification_token: string
        }
        Insert: {
          certificate_number: string
          created_at?: string
          id?: string
          investment_id: string
          issued_at?: string
          pdf_url?: string | null
          verification_token?: string
        }
        Update: {
          certificate_number?: string
          created_at?: string
          id?: string
          investment_id?: string
          issued_at?: string
          pdf_url?: string | null
          verification_token?: string
        }
        Relationships: [
          {
            foreignKeyName: "investment_certificates_investment_id_fkey"
            columns: ["investment_id"]
            isOneToOne: false
            referencedRelation: "investments"
            referencedColumns: ["id"]
          },
        ]
      }
      investments: {
        Row: {
          admin_notes: string | null
          agreement_accepted_at: string | null
          approved_amount: number | null
          created_at: string
          id: string
          investor_id: string
          ownership_pct: number | null
          payment_evidence_url: string | null
          payment_reference: string | null
          property_id: string
          proposed_amount: number
          status: Database["public"]["Enums"]["investment_status"]
          tokens_count: number | null
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          agreement_accepted_at?: string | null
          approved_amount?: number | null
          created_at?: string
          id?: string
          investor_id: string
          ownership_pct?: number | null
          payment_evidence_url?: string | null
          payment_reference?: string | null
          property_id: string
          proposed_amount: number
          status?: Database["public"]["Enums"]["investment_status"]
          tokens_count?: number | null
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          agreement_accepted_at?: string | null
          approved_amount?: number | null
          created_at?: string
          id?: string
          investor_id?: string
          ownership_pct?: number | null
          payment_evidence_url?: string | null
          payment_reference?: string | null
          property_id?: string
          proposed_amount?: number
          status?: Database["public"]["Enums"]["investment_status"]
          tokens_count?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "investments_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "available_properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "investments_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "tokenized_properties"
            referencedColumns: ["id"]
          },
        ]
      }
      investor_notifications: {
        Row: {
          category: string | null
          created_at: string
          id: string
          investor_id: string
          link: string | null
          message: string | null
          read_at: string | null
          title: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          id?: string
          investor_id: string
          link?: string | null
          message?: string | null
          read_at?: string | null
          title: string
        }
        Update: {
          category?: string | null
          created_at?: string
          id?: string
          investor_id?: string
          link?: string | null
          message?: string | null
          read_at?: string | null
          title?: string
        }
        Relationships: []
      }
      investor_profiles: {
        Row: {
          address: string | null
          admin_notes: string | null
          bank_details: Json
          country: string | null
          created_at: string
          dob: string | null
          email: string
          full_name: string
          id: string
          id_doc_url: string | null
          id_number: string | null
          id_type: string | null
          kyc_status: Database["public"]["Enums"]["kyc_status"]
          nationality: string | null
          next_of_kin: Json
          phone: string | null
          photo_url: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          admin_notes?: string | null
          bank_details?: Json
          country?: string | null
          created_at?: string
          dob?: string | null
          email: string
          full_name: string
          id?: string
          id_doc_url?: string | null
          id_number?: string | null
          id_type?: string | null
          kyc_status?: Database["public"]["Enums"]["kyc_status"]
          nationality?: string | null
          next_of_kin?: Json
          phone?: string | null
          photo_url?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          admin_notes?: string | null
          bank_details?: Json
          country?: string | null
          created_at?: string
          dob?: string | null
          email?: string
          full_name?: string
          id?: string
          id_doc_url?: string | null
          id_number?: string | null
          id_type?: string | null
          kyc_status?: Database["public"]["Enums"]["kyc_status"]
          nationality?: string | null
          next_of_kin?: Json
          phone?: string | null
          photo_url?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      investor_wallets: {
        Row: {
          available_balance: number
          created_at: string
          id: string
          investor_id: string
          total_returns: number
          total_withdrawn: number
          updated_at: string
        }
        Insert: {
          available_balance?: number
          created_at?: string
          id?: string
          investor_id: string
          total_returns?: number
          total_withdrawn?: number
          updated_at?: string
        }
        Update: {
          available_balance?: number
          created_at?: string
          id?: string
          investor_id?: string
          total_returns?: number
          total_withdrawn?: number
          updated_at?: string
        }
        Relationships: []
      }
      leads: {
        Row: {
          created_at: string
          email: string
          full_name: string
          id: string
          investment_type: string | null
          notes: string | null
          phone: string | null
          property_name: string | null
          raw_payload: Json | null
        }
        Insert: {
          created_at?: string
          email: string
          full_name: string
          id?: string
          investment_type?: string | null
          notes?: string | null
          phone?: string | null
          property_name?: string | null
          raw_payload?: Json | null
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          investment_type?: string | null
          notes?: string | null
          phone?: string | null
          property_name?: string | null
          raw_payload?: Json | null
        }
        Relationships: []
      }
      payment_records: {
        Row: {
          amount: number
          created_at: string
          id: string
          payment_date: string | null
          payment_type: string | null
          status: string
          transaction_reference: string | null
          user_id: string | null
        }
        Insert: {
          amount?: number
          created_at?: string
          id?: string
          payment_date?: string | null
          payment_type?: string | null
          status?: string
          transaction_reference?: string | null
          user_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          payment_date?: string | null
          payment_type?: string | null
          status?: string
          transaction_reference?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      payment_requirements: {
        Row: {
          amount_paid: number
          amount_required: number
          created_at: string
          id: string
          payment_category: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount_paid?: number
          amount_required?: number
          created_at?: string
          id?: string
          payment_category: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount_paid?: number
          amount_required?: number
          created_at?: string
          id?: string
          payment_category?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      payout_requests: {
        Row: {
          admin_notes: string | null
          affiliate_id: string
          amount: number
          bank_details: Json
          created_at: string
          id: string
          status: string
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          affiliate_id: string
          amount: number
          bank_details?: Json
          created_at?: string
          id?: string
          status?: string
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          affiliate_id?: string
          amount?: number
          bank_details?: Json
          created_at?: string
          id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payout_requests_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliate_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      plot_allocations: {
        Row: {
          admin_id: string | null
          allocation_date: string
          allocation_type: string
          approval_status: string
          created_at: string
          id: string
          notes: string | null
          plot_id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_id?: string | null
          allocation_date?: string
          allocation_type?: string
          approval_status?: string
          created_at?: string
          id?: string
          notes?: string | null
          plot_id: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_id?: string | null
          allocation_date?: string
          allocation_type?: string
          approval_status?: string
          created_at?: string
          id?: string
          notes?: string | null
          plot_id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "plot_allocations_plot_id_fkey"
            columns: ["plot_id"]
            isOneToOne: false
            referencedRelation: "plots"
            referencedColumns: ["id"]
          },
        ]
      }
      plots: {
        Row: {
          block_number: string | null
          created_at: string
          estate_id: string | null
          id: string
          location: string
          plot_number: string
          price: number
          property_type: string
          size_sqm: number
          status: string
          updated_at: string
        }
        Insert: {
          block_number?: string | null
          created_at?: string
          estate_id?: string | null
          id?: string
          location: string
          plot_number: string
          price?: number
          property_type?: string
          size_sqm?: number
          status?: string
          updated_at?: string
        }
        Update: {
          block_number?: string | null
          created_at?: string
          estate_id?: string | null
          id?: string
          location?: string
          plot_number?: string
          price?: number
          property_type?: string
          size_sqm?: number
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "plots_estate_id_fkey"
            columns: ["estate_id"]
            isOneToOne: false
            referencedRelation: "estates"
            referencedColumns: ["id"]
          },
        ]
      }
      pool_members: {
        Row: {
          committed_amount: number
          created_at: string
          id: string
          invited_email: string | null
          is_founder: boolean
          joined_at: string | null
          pool_id: string
          status: Database["public"]["Enums"]["pool_member_status"]
          updated_at: string
          user_id: string | null
        }
        Insert: {
          committed_amount?: number
          created_at?: string
          id?: string
          invited_email?: string | null
          is_founder?: boolean
          joined_at?: string | null
          pool_id: string
          status?: Database["public"]["Enums"]["pool_member_status"]
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          committed_amount?: number
          created_at?: string
          id?: string
          invited_email?: string | null
          is_founder?: boolean
          joined_at?: string | null
          pool_id?: string
          status?: Database["public"]["Enums"]["pool_member_status"]
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pool_members_pool_id_fkey"
            columns: ["pool_id"]
            isOneToOne: false
            referencedRelation: "group_pools"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          google_drive_folder_url: string | null
          id: string
          id_document_url: string | null
          id_verification_status: string
          nok_address: string | null
          nok_name: string | null
          nok_phone: string | null
          nok_relationship: string | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          google_drive_folder_url?: string | null
          id: string
          id_document_url?: string | null
          id_verification_status?: string
          nok_address?: string | null
          nok_name?: string | null
          nok_phone?: string | null
          nok_relationship?: string | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          google_drive_folder_url?: string | null
          id?: string
          id_document_url?: string | null
          id_verification_status?: string
          nok_address?: string | null
          nok_name?: string | null
          nok_phone?: string | null
          nok_relationship?: string | null
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      property_documents: {
        Row: {
          category: string | null
          created_at: string
          file_url: string
          id: string
          is_public: boolean
          property_id: string
          title: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          file_url: string
          id?: string
          is_public?: boolean
          property_id: string
          title: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          file_url?: string
          id?: string
          is_public?: boolean
          property_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "property_documents_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "available_properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "property_documents_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "tokenized_properties"
            referencedColumns: ["id"]
          },
        ]
      }
      property_tokens: {
        Row: {
          average_token_value: number | null
          created_at: string
          id: string
          investor_id: string
          property_id: string
          tokens_count: number
          updated_at: string
        }
        Insert: {
          average_token_value?: number | null
          created_at?: string
          id?: string
          investor_id: string
          property_id: string
          tokens_count?: number
          updated_at?: string
        }
        Update: {
          average_token_value?: number | null
          created_at?: string
          id?: string
          investor_id?: string
          property_id?: string
          tokens_count?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "property_tokens_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "available_properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "property_tokens_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "tokenized_properties"
            referencedColumns: ["id"]
          },
        ]
      }
      rental_distributions: {
        Row: {
          created_at: string
          distribution_date: string
          gross_income: number
          id: string
          maintenance: number
          mgmt_fee: number
          net_distributable: number
          notes: string | null
          other_expenses: number
          property_id: string
          taxes: number
        }
        Insert: {
          created_at?: string
          distribution_date: string
          gross_income: number
          id?: string
          maintenance?: number
          mgmt_fee?: number
          net_distributable: number
          notes?: string | null
          other_expenses?: number
          property_id: string
          taxes?: number
        }
        Update: {
          created_at?: string
          distribution_date?: string
          gross_income?: number
          id?: string
          maintenance?: number
          mgmt_fee?: number
          net_distributable?: number
          notes?: string | null
          other_expenses?: number
          property_id?: string
          taxes?: number
        }
        Relationships: [
          {
            foreignKeyName: "rental_distributions_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "available_properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rental_distributions_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "tokenized_properties"
            referencedColumns: ["id"]
          },
        ]
      }
      rental_payouts: {
        Row: {
          amount: number
          created_at: string
          distribution_id: string | null
          id: string
          investor_id: string
          paid_at: string | null
          property_id: string
          reference: string | null
          status: Database["public"]["Enums"]["payout_status"]
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          distribution_id?: string | null
          id?: string
          investor_id: string
          paid_at?: string | null
          property_id: string
          reference?: string | null
          status?: Database["public"]["Enums"]["payout_status"]
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          distribution_id?: string | null
          id?: string
          investor_id?: string
          paid_at?: string | null
          property_id?: string
          reference?: string | null
          status?: Database["public"]["Enums"]["payout_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rental_payouts_distribution_id_fkey"
            columns: ["distribution_id"]
            isOneToOne: false
            referencedRelation: "rental_distributions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rental_payouts_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "available_properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rental_payouts_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "tokenized_properties"
            referencedColumns: ["id"]
          },
        ]
      }
      reservations: {
        Row: {
          admin_notes: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          message: string | null
          phone: string
          plot_size: string | null
          property_type: string | null
          status: string
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          email: string
          full_name: string
          id?: string
          message?: string | null
          phone: string
          plot_size?: string | null
          property_type?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          message?: string | null
          phone?: string
          plot_size?: string | null
          property_type?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      spvs: {
        Row: {
          created_at: string
          id: string
          jurisdiction: string | null
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          jurisdiction?: string | null
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          jurisdiction?: string | null
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      support_tickets: {
        Row: {
          category: string
          created_at: string
          id: string
          priority: string
          status: string
          subject: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string
          created_at?: string
          id?: string
          priority?: string
          status?: string
          subject: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          priority?: string
          status?: string
          subject?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ticket_messages: {
        Row: {
          created_at: string
          id: string
          is_internal: boolean
          message: string
          sender_id: string | null
          ticket_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_internal?: boolean
          message: string
          sender_id?: string | null
          ticket_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_internal?: boolean
          message?: string
          sender_id?: string | null
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      tokenized_properties: {
        Row: {
          created_at: string
          created_by: string | null
          current_value: number
          description: string | null
          exit_terms: string | null
          expected_appreciation: number | null
          expected_rental_yield: number | null
          funding_deadline: string | null
          id: string
          images: string[]
          initial_value: number
          legal_title: string | null
          location: string
          management_fee_pct: number | null
          max_investment: number | null
          max_investors: number | null
          min_investment: number
          min_investors: number
          name: string
          property_type: string | null
          risk_disclosure: string | null
          spv_id: string | null
          status: Database["public"]["Enums"]["property_status"]
          token_value: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          current_value: number
          description?: string | null
          exit_terms?: string | null
          expected_appreciation?: number | null
          expected_rental_yield?: number | null
          funding_deadline?: string | null
          id?: string
          images?: string[]
          initial_value: number
          legal_title?: string | null
          location: string
          management_fee_pct?: number | null
          max_investment?: number | null
          max_investors?: number | null
          min_investment?: number
          min_investors?: number
          name: string
          property_type?: string | null
          risk_disclosure?: string | null
          spv_id?: string | null
          status?: Database["public"]["Enums"]["property_status"]
          token_value?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          current_value?: number
          description?: string | null
          exit_terms?: string | null
          expected_appreciation?: number | null
          expected_rental_yield?: number | null
          funding_deadline?: string | null
          id?: string
          images?: string[]
          initial_value?: number
          legal_title?: string | null
          location?: string
          management_fee_pct?: number | null
          max_investment?: number | null
          max_investors?: number | null
          min_investment?: number
          min_investors?: number
          name?: string
          property_type?: string | null
          risk_disclosure?: string | null
          spv_id?: string | null
          status?: Database["public"]["Enums"]["property_status"]
          token_value?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tokenized_properties_spv_id_fkey"
            columns: ["spv_id"]
            isOneToOne: false
            referencedRelation: "spvs"
            referencedColumns: ["id"]
          },
        ]
      }
      training_videos: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          id: string
          sort_order: number
          title: string
          updated_at: string
          url: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          sort_order?: number
          title: string
          updated_at?: string
          url: string
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          sort_order?: number
          title?: string
          updated_at?: string
          url?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      wallet_transactions: {
        Row: {
          amount: number
          created_at: string
          id: string
          investor_id: string
          notes: string | null
          property_id: string | null
          reference: string | null
          type: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          investor_id: string
          notes?: string | null
          property_id?: string | null
          reference?: string | null
          type: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          investor_id?: string
          notes?: string | null
          property_id?: string | null
          reference?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "wallet_transactions_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "available_properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wallet_transactions_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "tokenized_properties"
            referencedColumns: ["id"]
          },
        ]
      }
      withdrawal_requests: {
        Row: {
          admin_notes: string | null
          amount: number
          bank_details: Json
          created_at: string
          id: string
          investor_id: string
          reference: string | null
          status: Database["public"]["Enums"]["withdrawal_status"]
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          amount: number
          bank_details?: Json
          created_at?: string
          id?: string
          investor_id: string
          reference?: string | null
          status?: Database["public"]["Enums"]["withdrawal_status"]
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          amount?: number
          bank_details?: Json
          created_at?: string
          id?: string
          investor_id?: string
          reference?: string | null
          status?: Database["public"]["Enums"]["withdrawal_status"]
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      available_properties: {
        Row: {
          created_at: string | null
          current_value: number | null
          description: string | null
          expected_appreciation: number | null
          expected_rental_yield: number | null
          funding_deadline: string | null
          id: string | null
          images: string[] | null
          initial_value: number | null
          location: string | null
          max_investment: number | null
          min_investment: number | null
          name: string | null
          property_type: string | null
          status: Database["public"]["Enums"]["property_status"] | null
          token_value: number | null
        }
        Insert: {
          created_at?: string | null
          current_value?: number | null
          description?: string | null
          expected_appreciation?: number | null
          expected_rental_yield?: number | null
          funding_deadline?: string | null
          id?: string | null
          images?: string[] | null
          initial_value?: number | null
          location?: string | null
          max_investment?: number | null
          min_investment?: number | null
          name?: string | null
          property_type?: string | null
          status?: Database["public"]["Enums"]["property_status"] | null
          token_value?: number | null
        }
        Update: {
          created_at?: string | null
          current_value?: number | null
          description?: string | null
          expected_appreciation?: number | null
          expected_rental_yield?: number | null
          funding_deadline?: string | null
          id?: string | null
          images?: string[] | null
          initial_value?: number | null
          location?: string | null
          max_investment?: number | null
          min_investment?: number | null
          name?: string | null
          property_type?: string | null
          status?: Database["public"]["Enums"]["property_status"] | null
          token_value?: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      admin_approve_investment: {
        Args: {
          _approved_amount: number
          _investment_id: string
          _notes: string
        }
        Returns: undefined
      }
      admin_approve_withdrawal: {
        Args: { _reference: string; _withdrawal_id: string }
        Returns: undefined
      }
      admin_mark_rental_payout_paid: {
        Args: { _payout_id: string; _reference: string }
        Returns: undefined
      }
      admin_record_property_valuation: {
        Args: {
          _new_value: number
          _notes: string
          _property_id: string
          _report_url: string
          _valuation_date: string
          _valuer: string
        }
        Returns: number
      }
      admin_record_rental_distribution: {
        Args: {
          _distribution_date: string
          _gross_income: number
          _maintenance: number
          _management_fee: number
          _notes: string
          _other_expenses: number
          _property_id: string
          _taxes: number
        }
        Returns: string
      }
      admin_reject_investment: {
        Args: { _investment_id: string; _notes: string }
        Returns: undefined
      }
      admin_reject_withdrawal: {
        Args: { _notes: string; _withdrawal_id: string }
        Returns: undefined
      }
      admin_review_investor_kyc: {
        Args: {
          _notes: string
          _profile_id: string
          _status: Database["public"]["Enums"]["kyc_status"]
        }
        Returns: undefined
      }
      admin_review_pool: {
        Args: { _approve: boolean; _notes: string; _pool_id: string }
        Returns: undefined
      }
      admin_set_pool_member_status: {
        Args: {
          _member_id: string
          _status: Database["public"]["Enums"]["pool_member_status"]
        }
        Returns: undefined
      }
      admin_update_exit_request: {
        Args: {
          _exit_id: string
          _notes: string
          _status: Database["public"]["Enums"]["exit_status"]
        }
        Returns: undefined
      }
      create_group_pool: {
        Args: {
          _closing_date: string
          _description: string
          _founder_commitment: number
          _member_cap: number
          _min_contribution: number
          _name: string
          _property_id: string
          _property_name: string
          _target_amount: number
          _visibility: Database["public"]["Enums"]["pool_visibility"]
        }
        Returns: string
      }
      get_estate_ops_summary: {
        Args: never
        Returns: {
          allocated_plots: number
          available_plots: number
          open_tickets: number
          pending_applications: number
          pending_receipts: number
          pending_reservations: number
          total_estates: number
          total_plots: number
          total_reservations: number
          total_revenue: number
        }[]
      }
      get_pool_summaries: {
        Args: { _pool_ids: string[] }
        Returns: {
          approved: number
          approved_members: number
          committed: number
          members: number
          pool_id: string
        }[]
      }
      get_public_property_funding: {
        Args: { _property_ids: string[] }
        Returns: {
          approved: number
          investors: number
          pending: number
          property_id: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      invite_pool_member: {
        Args: { _email: string; _pool_id: string }
        Returns: undefined
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      is_pool_founder: {
        Args: { _pool_id: string; _user_id: string }
        Returns: boolean
      }
      is_pool_member: {
        Args: { _pool_id: string; _user_id: string }
        Returns: boolean
      }
      join_group_pool: {
        Args: { _amount: number; _pool_id: string }
        Returns: undefined
      }
      request_property_token_exit: {
        Args: {
          _asking_price: number
          _property_id: string
          _tokens_to_sell: number
        }
        Returns: string
      }
      submit_investment_payment_evidence: {
        Args: {
          _evidence_url: string
          _investment_id: string
          _reference: string
        }
        Returns: undefined
      }
      submit_investor_kyc: { Args: { _profile: Json }; Returns: undefined }
      verify_investment_certificate: {
        Args: { _token: string }
        Returns: {
          approved_amount: number
          certificate_number: string
          issued_at: string
          ownership_pct: number
          property_location: string
          property_name: string
          tokens_count: number
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "investor" | "manager"
      exit_status:
        | "submitted"
        | "under_review"
        | "approved_for_listing"
        | "buyer_found"
        | "payment_pending"
        | "transfer_in_progress"
        | "completed"
        | "rejected"
        | "cancelled"
      investment_status:
        | "submitted"
        | "payment_pending"
        | "payment_received"
        | "under_review"
        | "approved"
        | "rejected"
        | "cancelled"
      kyc_status: "pending" | "more_info" | "verified" | "rejected"
      payout_status: "pending" | "paid" | "cancelled"
      pool_member_status:
        | "invited"
        | "pending"
        | "committed"
        | "approved"
        | "declined"
        | "removed"
      pool_status:
        | "pending_approval"
        | "open"
        | "threshold_met"
        | "closing"
        | "completed"
        | "cancelled"
        | "rejected"
      pool_visibility: "private" | "open"
      property_status:
        | "draft"
        | "under_review"
        | "approved"
        | "open"
        | "partially_funded"
        | "fully_funded"
        | "acquisition_in_progress"
        | "operating"
        | "exited"
        | "cancelled"
      withdrawal_status: "pending" | "approved" | "rejected" | "paid"
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
      app_role: ["admin", "investor", "manager"],
      exit_status: [
        "submitted",
        "under_review",
        "approved_for_listing",
        "buyer_found",
        "payment_pending",
        "transfer_in_progress",
        "completed",
        "rejected",
        "cancelled",
      ],
      investment_status: [
        "submitted",
        "payment_pending",
        "payment_received",
        "under_review",
        "approved",
        "rejected",
        "cancelled",
      ],
      kyc_status: ["pending", "more_info", "verified", "rejected"],
      payout_status: ["pending", "paid", "cancelled"],
      pool_member_status: [
        "invited",
        "pending",
        "committed",
        "approved",
        "declined",
        "removed",
      ],
      pool_status: [
        "pending_approval",
        "open",
        "threshold_met",
        "closing",
        "completed",
        "cancelled",
        "rejected",
      ],
      pool_visibility: ["private", "open"],
      property_status: [
        "draft",
        "under_review",
        "approved",
        "open",
        "partially_funded",
        "fully_funded",
        "acquisition_in_progress",
        "operating",
        "exited",
        "cancelled",
      ],
      withdrawal_status: ["pending", "approved", "rejected", "paid"],
    },
  },
} as const
