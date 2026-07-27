export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      affiliate_profiles: {
        Row: {
          account_name: string | null;
          account_number: string | null;
          affiliate_code: string;
          avatar_url: string | null;
          bank_name: string | null;
          commission_rate: number;
          created_at: string;
          email: string;
          full_name: string;
          id: string;
          member_number: number;
          phone: string | null;
          sort_code: string | null;
          status: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          account_name?: string | null;
          account_number?: string | null;
          affiliate_code: string;
          avatar_url?: string | null;
          bank_name?: string | null;
          commission_rate?: number;
          created_at?: string;
          email: string;
          full_name?: string;
          id?: string;
          member_number?: number;
          phone?: string | null;
          sort_code?: string | null;
          status?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          account_name?: string | null;
          account_number?: string | null;
          affiliate_code?: string;
          avatar_url?: string | null;
          bank_name?: string | null;
          commission_rate?: number;
          created_at?: string;
          email?: string;
          full_name?: string;
          id?: string;
          member_number?: number;
          phone?: string | null;
          sort_code?: string | null;
          status?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      assignment_rules: {
        Row: {
          active: boolean;
          assign_agent_id: string | null;
          created_at: string;
          created_by: string | null;
          id: string;
          match_budget_max: number | null;
          match_budget_min: number | null;
          match_campaign_id: string | null;
          match_investment_type: Database["public"]["Enums"]["investment_type"] | null;
          match_location: string | null;
          name: string;
          priority: number;
          updated_at: string;
          use_round_robin: boolean;
        };
        Insert: {
          active?: boolean;
          assign_agent_id?: string | null;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          match_budget_max?: number | null;
          match_budget_min?: number | null;
          match_campaign_id?: string | null;
          match_investment_type?: Database["public"]["Enums"]["investment_type"] | null;
          match_location?: string | null;
          name: string;
          priority?: number;
          updated_at?: string;
          use_round_robin?: boolean;
        };
        Update: {
          active?: boolean;
          assign_agent_id?: string | null;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          match_budget_max?: number | null;
          match_budget_min?: number | null;
          match_campaign_id?: string | null;
          match_investment_type?: Database["public"]["Enums"]["investment_type"] | null;
          match_location?: string | null;
          name?: string;
          priority?: number;
          updated_at?: string;
          use_round_robin?: boolean;
        };
        Relationships: [];
      };
      automation_enrollments: {
        Row: {
          current_step: number;
          enrolled_at: string;
          id: string;
          lead_id: string;
          next_run_at: string | null;
          sequence_id: string;
          status: string;
          stop_reason: string | null;
          updated_at: string;
        };
        Insert: {
          current_step?: number;
          enrolled_at?: string;
          id?: string;
          lead_id: string;
          next_run_at?: string | null;
          sequence_id: string;
          status?: string;
          stop_reason?: string | null;
          updated_at?: string;
        };
        Update: {
          current_step?: number;
          enrolled_at?: string;
          id?: string;
          lead_id?: string;
          next_run_at?: string | null;
          sequence_id?: string;
          status?: string;
          stop_reason?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "automation_enrollments_lead_id_fkey";
            columns: ["lead_id"];
            isOneToOne: false;
            referencedRelation: "leads";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "automation_enrollments_sequence_id_fkey";
            columns: ["sequence_id"];
            isOneToOne: false;
            referencedRelation: "automation_sequences";
            referencedColumns: ["id"];
          },
        ];
      };
      automation_sequences: {
        Row: {
          active: boolean;
          created_at: string;
          created_by: string | null;
          description: string | null;
          id: string;
          name: string;
          stop_on_reply: boolean;
          stop_on_unsubscribe: boolean;
          stop_statuses: string[];
          trigger_investment_type: Database["public"]["Enums"]["investment_type"] | null;
          trigger_source: string | null;
          updated_at: string;
        };
        Insert: {
          active?: boolean;
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          id?: string;
          name: string;
          stop_on_reply?: boolean;
          stop_on_unsubscribe?: boolean;
          stop_statuses?: string[];
          trigger_investment_type?: Database["public"]["Enums"]["investment_type"] | null;
          trigger_source?: string | null;
          updated_at?: string;
        };
        Update: {
          active?: boolean;
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          id?: string;
          name?: string;
          stop_on_reply?: boolean;
          stop_on_unsubscribe?: boolean;
          stop_statuses?: string[];
          trigger_investment_type?: Database["public"]["Enums"]["investment_type"] | null;
          trigger_source?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      automation_steps: {
        Row: {
          action_type: string;
          active: boolean;
          created_at: string;
          delay_minutes: number;
          id: string;
          sequence_id: string;
          step_order: number;
          task_title: string | null;
          template_id: string | null;
        };
        Insert: {
          action_type?: string;
          active?: boolean;
          created_at?: string;
          delay_minutes?: number;
          id?: string;
          sequence_id: string;
          step_order: number;
          task_title?: string | null;
          template_id?: string | null;
        };
        Update: {
          action_type?: string;
          active?: boolean;
          created_at?: string;
          delay_minutes?: number;
          id?: string;
          sequence_id?: string;
          step_order?: number;
          task_title?: string | null;
          template_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "automation_steps_sequence_id_fkey";
            columns: ["sequence_id"];
            isOneToOne: false;
            referencedRelation: "automation_sequences";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "automation_steps_template_id_fkey";
            columns: ["template_id"];
            isOneToOne: false;
            referencedRelation: "email_templates";
            referencedColumns: ["id"];
          },
        ];
      };
      crm_audit_logs: {
        Row: {
          action: string;
          actor_id: string | null;
          after_data: Json | null;
          before_data: Json | null;
          created_at: string;
          entity_id: string;
          entity_type: string;
          id: string;
        };
        Insert: {
          action: string;
          actor_id?: string | null;
          after_data?: Json | null;
          before_data?: Json | null;
          created_at?: string;
          entity_id: string;
          entity_type: string;
          id?: string;
        };
        Update: {
          action?: string;
          actor_id?: string | null;
          after_data?: Json | null;
          before_data?: Json | null;
          created_at?: string;
          entity_id?: string;
          entity_type?: string;
          id?: string;
        };
        Relationships: [];
      };
      crm_events: {
        Row: {
          capacity: number | null;
          created_at: string;
          created_by: string | null;
          description: string | null;
          ends_at: string | null;
          event_type: string;
          id: string;
          meeting_url: string | null;
          name: string;
          owner_id: string | null;
          property_id: string | null;
          property_name: string | null;
          starts_at: string;
          status: string;
          updated_at: string;
          venue: string | null;
        };
        Insert: {
          capacity?: number | null;
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          ends_at?: string | null;
          event_type?: string;
          id?: string;
          meeting_url?: string | null;
          name: string;
          owner_id?: string | null;
          property_id?: string | null;
          property_name?: string | null;
          starts_at: string;
          status?: string;
          updated_at?: string;
          venue?: string | null;
        };
        Update: {
          capacity?: number | null;
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          ends_at?: string | null;
          event_type?: string;
          id?: string;
          meeting_url?: string | null;
          name?: string;
          owner_id?: string | null;
          property_id?: string | null;
          property_name?: string | null;
          starts_at?: string;
          status?: string;
          updated_at?: string;
          venue?: string | null;
        };
        Relationships: [];
      };
      crm_integrations: {
        Row: {
          catalogue_property_id: string | null;
          created_at: string;
          display_name: string;
          id: string;
          last_checked_at: string | null;
          non_secret_config: Json;
          provider: string;
          status: string;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          catalogue_property_id?: string | null;
          created_at?: string;
          display_name: string;
          id?: string;
          last_checked_at?: string | null;
          non_secret_config?: Json;
          provider: string;
          status?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          catalogue_property_id?: string | null;
          created_at?: string;
          display_name?: string;
          id?: string;
          last_checked_at?: string | null;
          non_secret_config?: Json;
          provider?: string;
          status?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "available_properties_catalogue_property_id_fkey";
            columns: ["catalogue_property_id"];
            isOneToOne: false;
            referencedRelation: "tokenized_properties";
            referencedColumns: ["id"];
          },
        ];
      };
      crm_settings: {
        Row: {
          business_hours: Json;
          consent_copy: string;
          default_country: string;
          id: string;
          response_sla_minutes: number;
          timezone: string;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          business_hours?: Json;
          consent_copy: string;
          default_country?: string;
          id?: string;
          response_sla_minutes?: number;
          timezone?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          business_hours?: Json;
          consent_copy?: string;
          default_country?: string;
          id?: string;
          response_sla_minutes?: number;
          timezone?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [];
      };
      email_deliveries: {
        Row: {
          clicked_at: string | null;
          created_at: string;
          delivered_at: string | null;
          enrollment_id: string | null;
          error_message: string | null;
          id: string;
          lead_id: string | null;
          opened_at: string | null;
          provider: string;
          provider_message_id: string | null;
          queued_at: string;
          recipient_email: string;
          sent_at: string | null;
          status: string;
          subject: string;
          template_id: string | null;
        };
        Insert: {
          clicked_at?: string | null;
          created_at?: string;
          delivered_at?: string | null;
          enrollment_id?: string | null;
          error_message?: string | null;
          id?: string;
          lead_id?: string | null;
          opened_at?: string | null;
          provider: string;
          provider_message_id?: string | null;
          queued_at?: string;
          recipient_email: string;
          sent_at?: string | null;
          status?: string;
          subject: string;
          template_id?: string | null;
        };
        Update: {
          clicked_at?: string | null;
          created_at?: string;
          delivered_at?: string | null;
          enrollment_id?: string | null;
          error_message?: string | null;
          id?: string;
          lead_id?: string | null;
          opened_at?: string | null;
          provider?: string;
          provider_message_id?: string | null;
          queued_at?: string;
          recipient_email?: string;
          sent_at?: string | null;
          status?: string;
          subject?: string;
          template_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "email_deliveries_lead_id_fkey";
            columns: ["lead_id"];
            isOneToOne: false;
            referencedRelation: "leads";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "email_deliveries_template_id_fkey";
            columns: ["template_id"];
            isOneToOne: false;
            referencedRelation: "email_templates";
            referencedColumns: ["id"];
          },
        ];
      };
      email_templates: {
        Row: {
          active: boolean;
          available_fields: string[];
          category: string;
          created_at: string;
          created_by: string | null;
          html_body: string;
          id: string;
          name: string;
          preview_text: string | null;
          subject: string;
          text_body: string | null;
          updated_at: string;
        };
        Insert: {
          active?: boolean;
          available_fields?: string[];
          category?: string;
          created_at?: string;
          created_by?: string | null;
          html_body: string;
          id?: string;
          name: string;
          preview_text?: string | null;
          subject: string;
          text_body?: string | null;
          updated_at?: string;
        };
        Update: {
          active?: boolean;
          available_fields?: string[];
          category?: string;
          created_at?: string;
          created_by?: string | null;
          html_body?: string;
          id?: string;
          name?: string;
          preview_text?: string | null;
          subject?: string;
          text_body?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      event_registrations: {
        Row: {
          checked_in_at: string | null;
          consent_at: string | null;
          consent_given: boolean;
          event_id: string;
          id: string;
          lead_id: string;
          notes: string | null;
          preferred_contact_method: string | null;
          registered_at: string;
          status: string;
        };
        Insert: {
          checked_in_at?: string | null;
          consent_at?: string | null;
          consent_given?: boolean;
          event_id: string;
          id?: string;
          lead_id: string;
          notes?: string | null;
          preferred_contact_method?: string | null;
          registered_at?: string;
          status?: string;
        };
        Update: {
          checked_in_at?: string | null;
          consent_at?: string | null;
          consent_given?: boolean;
          event_id?: string;
          id?: string;
          lead_id?: string;
          notes?: string | null;
          preferred_contact_method?: string | null;
          registered_at?: string;
          status?: string;
        };
        Relationships: [
          {
            foreignKeyName: "event_registrations_event_id_fkey";
            columns: ["event_id"];
            isOneToOne: false;
            referencedRelation: "crm_events";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "event_registrations_lead_id_fkey";
            columns: ["lead_id"];
            isOneToOne: false;
            referencedRelation: "leads";
            referencedColumns: ["id"];
          },
        ];
      };
      audit_logs: {
        Row: {
          action: string;
          actor_id: string | null;
          created_at: string;
          entity_id: string | null;
          entity_type: string;
          id: string;
          new_value: Json | null;
          notes: string | null;
          previous_value: Json | null;
        };
        Insert: {
          action: string;
          actor_id?: string | null;
          created_at?: string;
          entity_id?: string | null;
          entity_type: string;
          id?: string;
          new_value?: Json | null;
          notes?: string | null;
          previous_value?: Json | null;
        };
        Update: {
          action?: string;
          actor_id?: string | null;
          created_at?: string;
          entity_id?: string | null;
          entity_type?: string;
          id?: string;
          new_value?: Json | null;
          notes?: string | null;
          previous_value?: Json | null;
        };
        Relationships: [];
      };
      available_properties: {
        Row: {
          created_at: string;
          description: string | null;
          id: string;
          is_active: boolean;
          location: string;
          plot_sizes: string[];
          price_range_max: number;
          price_range_min: number;
          property_name: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          id?: string;
          is_active?: boolean;
          location: string;
          plot_sizes?: string[];
          price_range_max?: number;
          price_range_min?: number;
          property_name: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          id?: string;
          is_active?: boolean;
          location?: string;
          plot_sizes?: string[];
          price_range_max?: number;
          price_range_min?: number;
          property_name?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      client_leads: {
        Row: {
          affiliate_id: string;
          client_budget_max: number | null;
          client_budget_min: number | null;
          client_email: string;
          client_full_name: string;
          client_phone: string;
          client_requirements: string | null;
          contact_method: string;
          created_at: string;
          id: string;
          property_of_interest: string | null;
          status: string;
          submission_date: string;
          updated_at: string;
        };
        Insert: {
          affiliate_id: string;
          client_budget_max?: number | null;
          client_budget_min?: number | null;
          client_email: string;
          client_full_name: string;
          client_phone: string;
          client_requirements?: string | null;
          contact_method: string;
          created_at?: string;
          id?: string;
          property_of_interest?: string | null;
          status?: string;
          submission_date?: string;
          updated_at?: string;
        };
        Update: {
          affiliate_id?: string;
          client_budget_max?: number | null;
          client_budget_min?: number | null;
          client_email?: string;
          client_full_name?: string;
          client_phone?: string;
          client_requirements?: string | null;
          contact_method?: string;
          created_at?: string;
          id?: string;
          property_of_interest?: string | null;
          status?: string;
          submission_date?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "client_leads_affiliate_id_fkey";
            columns: ["affiliate_id"];
            isOneToOne: false;
            referencedRelation: "affiliate_profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      commissions: {
        Row: {
          affiliate_id: string;
          approved_at: string | null;
          client_lead_id: string;
          commission_amount: number;
          commission_rate: number;
          created_at: string;
          id: string;
          paid_at: string | null;
          sale_amount: number;
          sale_date: string;
          status: Database["public"]["Enums"]["commission_status"];
          updated_at: string;
        };
        Insert: {
          affiliate_id: string;
          approved_at?: string | null;
          client_lead_id: string;
          commission_amount: number;
          commission_rate: number;
          created_at?: string;
          id?: string;
          paid_at?: string | null;
          sale_amount: number;
          sale_date?: string;
          status?: Database["public"]["Enums"]["commission_status"];
          updated_at?: string;
        };
        Update: {
          affiliate_id?: string;
          approved_at?: string | null;
          client_lead_id?: string;
          commission_amount?: number;
          commission_rate?: number;
          created_at?: string;
          id?: string;
          paid_at?: string | null;
          sale_amount?: number;
          sale_date?: string;
          status?: Database["public"]["Enums"]["commission_status"];
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "commissions_affiliate_id_fkey";
            columns: ["affiliate_id"];
            isOneToOne: false;
            referencedRelation: "affiliate_profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "commissions_client_lead_id_fkey";
            columns: ["client_lead_id"];
            isOneToOne: false;
            referencedRelation: "client_leads";
            referencedColumns: ["id"];
          },
        ];
      };
      crm_notifications: {
        Row: {
          body: string | null;
          created_at: string;
          id: string;
          lead_id: string | null;
          opportunity_id: string | null;
          read_at: string | null;
          title: string;
          type: string;
          user_id: string;
        };
        Insert: {
          body?: string | null;
          created_at?: string;
          id?: string;
          lead_id?: string | null;
          opportunity_id?: string | null;
          read_at?: string | null;
          title: string;
          type: string;
          user_id: string;
        };
        Update: {
          body?: string | null;
          created_at?: string;
          id?: string;
          lead_id?: string | null;
          opportunity_id?: string | null;
          read_at?: string | null;
          title?: string;
          type?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "crm_notifications_lead_id_fkey";
            columns: ["lead_id"];
            isOneToOne: false;
            referencedRelation: "leads";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "crm_notifications_opportunity_id_fkey";
            columns: ["opportunity_id"];
            isOneToOne: false;
            referencedRelation: "opportunities";
            referencedColumns: ["id"];
          },
        ];
      };
      exit_requests: {
        Row: {
          admin_notes: string | null;
          asking_price: number;
          buyer_investment_id: string | null;
          created_at: string;
          id: string;
          investor_id: string;
          property_id: string;
          status: Database["public"]["Enums"]["exit_status"];
          tokens_to_sell: number;
          updated_at: string;
        };
        Insert: {
          admin_notes?: string | null;
          asking_price: number;
          buyer_investment_id?: string | null;
          created_at?: string;
          id?: string;
          investor_id: string;
          property_id: string;
          status?: Database["public"]["Enums"]["exit_status"];
          tokens_to_sell: number;
          updated_at?: string;
        };
        Update: {
          admin_notes?: string | null;
          asking_price?: number;
          buyer_investment_id?: string | null;
          created_at?: string;
          id?: string;
          investor_id?: string;
          property_id?: string;
          status?: Database["public"]["Enums"]["exit_status"];
          tokens_to_sell?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "exit_requests_buyer_investment_id_fkey";
            columns: ["buyer_investment_id"];
            isOneToOne: false;
            referencedRelation: "investments";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "exit_requests_property_id_fkey";
            columns: ["property_id"];
            isOneToOne: false;
            referencedRelation: "tokenized_properties";
            referencedColumns: ["id"];
          },
        ];
      };
      fb_ads: {
        Row: {
          ad_id: string;
          ad_name: string;
          campaign_id: string | null;
          clicks: number | null;
          created_at: string;
          form_id: string | null;
          form_name: string | null;
          id: string;
          impressions: number | null;
          last_synced_at: string | null;
          spend: number | null;
          updated_at: string;
        };
        Insert: {
          ad_id: string;
          ad_name: string;
          campaign_id?: string | null;
          clicks?: number | null;
          created_at?: string;
          form_id?: string | null;
          form_name?: string | null;
          id?: string;
          impressions?: number | null;
          last_synced_at?: string | null;
          spend?: number | null;
          updated_at?: string;
        };
        Update: {
          ad_id?: string;
          ad_name?: string;
          campaign_id?: string | null;
          clicks?: number | null;
          created_at?: string;
          form_id?: string | null;
          form_name?: string | null;
          id?: string;
          impressions?: number | null;
          last_synced_at?: string | null;
          spend?: number | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "fb_ads_campaign_id_fkey";
            columns: ["campaign_id"];
            isOneToOne: false;
            referencedRelation: "fb_campaigns";
            referencedColumns: ["campaign_id"];
          },
        ];
      };
      fb_campaigns: {
        Row: {
          campaign_id: string;
          campaign_name: string;
          clicks: number | null;
          created_at: string;
          daily_budget: number | null;
          id: string;
          impressions: number | null;
          last_synced_at: string | null;
          objective: string | null;
          source_id: string | null;
          spend: number | null;
          status: string | null;
          updated_at: string;
        };
        Insert: {
          campaign_id: string;
          campaign_name: string;
          clicks?: number | null;
          created_at?: string;
          daily_budget?: number | null;
          id?: string;
          impressions?: number | null;
          last_synced_at?: string | null;
          objective?: string | null;
          source_id?: string | null;
          spend?: number | null;
          status?: string | null;
          updated_at?: string;
        };
        Update: {
          campaign_id?: string;
          campaign_name?: string;
          clicks?: number | null;
          created_at?: string;
          daily_budget?: number | null;
          id?: string;
          impressions?: number | null;
          last_synced_at?: string | null;
          objective?: string | null;
          source_id?: string | null;
          spend?: number | null;
          status?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "fb_campaigns_source_id_fkey";
            columns: ["source_id"];
            isOneToOne: false;
            referencedRelation: "fb_lead_sources";
            referencedColumns: ["id"];
          },
        ];
      };
      fb_lead_sources: {
        Row: {
          access_token: string;
          active: boolean;
          ad_account_id: string | null;
          connected_by: string | null;
          created_at: string;
          id: string;
          last_sync_at: string | null;
          page_id: string;
          page_name: string;
          updated_at: string;
          webhook_verify_token: string;
        };
        Insert: {
          access_token: string;
          active?: boolean;
          ad_account_id?: string | null;
          connected_by?: string | null;
          created_at?: string;
          id?: string;
          last_sync_at?: string | null;
          page_id: string;
          page_name: string;
          updated_at?: string;
          webhook_verify_token: string;
        };
        Update: {
          access_token?: string;
          active?: boolean;
          ad_account_id?: string | null;
          connected_by?: string | null;
          created_at?: string;
          id?: string;
          last_sync_at?: string | null;
          page_id?: string;
          page_name?: string;
          updated_at?: string;
          webhook_verify_token?: string;
        };
        Relationships: [];
      };
      follow_up_tasks: {
        Row: {
          assigned_to: string | null;
          completed_at: string | null;
          completed_by: string | null;
          created_at: string;
          created_by: string | null;
          due_at: string;
          escalated_at: string | null;
          id: string;
          lead_id: string;
          notes: string | null;
          outcome: string | null;
          priority: string;
          reminder_at: string | null;
          snoozed_until: string | null;
          status: string;
          task_type: Database["public"]["Enums"]["task_type"];
          title: string;
          updated_at: string;
        };
        Insert: {
          assigned_to?: string | null;
          completed_at?: string | null;
          completed_by?: string | null;
          created_at?: string;
          created_by?: string | null;
          due_at?: string;
          escalated_at?: string | null;
          id?: string;
          lead_id: string;
          notes?: string | null;
          outcome?: string | null;
          priority?: string;
          reminder_at?: string | null;
          snoozed_until?: string | null;
          status?: string;
          task_type?: Database["public"]["Enums"]["task_type"];
          title: string;
          updated_at?: string;
        };
        Update: {
          assigned_to?: string | null;
          completed_at?: string | null;
          completed_by?: string | null;
          created_at?: string;
          created_by?: string | null;
          due_at?: string;
          escalated_at?: string | null;
          id?: string;
          lead_id?: string;
          notes?: string | null;
          outcome?: string | null;
          priority?: string;
          reminder_at?: string | null;
          snoozed_until?: string | null;
          status?: string;
          task_type?: Database["public"]["Enums"]["task_type"];
          title?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "follow_up_tasks_lead_id_fkey";
            columns: ["lead_id"];
            isOneToOne: false;
            referencedRelation: "leads";
            referencedColumns: ["id"];
          },
        ];
      };
      investment_certificates: {
        Row: {
          certificate_number: string;
          id: string;
          investment_id: string;
          issued_at: string;
          issued_by: string | null;
          pdf_url: string | null;
          qr_token: string;
        };
        Insert: {
          certificate_number: string;
          id?: string;
          investment_id: string;
          issued_at?: string;
          issued_by?: string | null;
          pdf_url?: string | null;
          qr_token: string;
        };
        Update: {
          certificate_number?: string;
          id?: string;
          investment_id?: string;
          issued_at?: string;
          issued_by?: string | null;
          pdf_url?: string | null;
          qr_token?: string;
        };
        Relationships: [
          {
            foreignKeyName: "investment_certificates_investment_id_fkey";
            columns: ["investment_id"];
            isOneToOne: true;
            referencedRelation: "investments";
            referencedColumns: ["id"];
          },
        ];
      };
      investments: {
        Row: {
          admin_notes: string | null;
          agreement_accepted_at: string | null;
          approved_amount: number | null;
          approved_at: string | null;
          approved_by: string | null;
          certificate_number: string | null;
          created_at: string;
          id: string;
          investor_id: string;
          ownership_pct: number | null;
          payment_evidence_url: string | null;
          payment_reference: string | null;
          property_id: string;
          proposed_amount: number;
          status: Database["public"]["Enums"]["investment_status"];
          tokens_count: number | null;
          updated_at: string;
        };
        Insert: {
          admin_notes?: string | null;
          agreement_accepted_at?: string | null;
          approved_amount?: number | null;
          approved_at?: string | null;
          approved_by?: string | null;
          certificate_number?: string | null;
          created_at?: string;
          id?: string;
          investor_id: string;
          ownership_pct?: number | null;
          payment_evidence_url?: string | null;
          payment_reference?: string | null;
          property_id: string;
          proposed_amount: number;
          status?: Database["public"]["Enums"]["investment_status"];
          tokens_count?: number | null;
          updated_at?: string;
        };
        Update: {
          admin_notes?: string | null;
          agreement_accepted_at?: string | null;
          approved_amount?: number | null;
          approved_at?: string | null;
          approved_by?: string | null;
          certificate_number?: string | null;
          created_at?: string;
          id?: string;
          investor_id?: string;
          ownership_pct?: number | null;
          payment_evidence_url?: string | null;
          payment_reference?: string | null;
          property_id?: string;
          proposed_amount?: number;
          status?: Database["public"]["Enums"]["investment_status"];
          tokens_count?: number | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "investments_property_id_fkey";
            columns: ["property_id"];
            isOneToOne: false;
            referencedRelation: "tokenized_properties";
            referencedColumns: ["id"];
          },
        ];
      };
      investor_notifications: {
        Row: {
          body: string | null;
          created_at: string;
          id: string;
          investor_id: string;
          link: string | null;
          read_at: string | null;
          title: string;
          type: string;
        };
        Insert: {
          body?: string | null;
          created_at?: string;
          id?: string;
          investor_id: string;
          link?: string | null;
          read_at?: string | null;
          title: string;
          type: string;
        };
        Update: {
          body?: string | null;
          created_at?: string;
          id?: string;
          investor_id?: string;
          link?: string | null;
          read_at?: string | null;
          title?: string;
          type?: string;
        };
        Relationships: [];
      };
      investor_profiles: {
        Row: {
          address: string | null;
          bank_details: Json | null;
          country: string | null;
          created_at: string;
          dob: string | null;
          email: string | null;
          full_name: string | null;
          id: string;
          id_doc_url: string | null;
          id_number: string | null;
          id_type: string | null;
          kyc_notes: string | null;
          kyc_reviewed_at: string | null;
          kyc_reviewed_by: string | null;
          kyc_status: Database["public"]["Enums"]["kyc_status"];
          nationality: string | null;
          next_of_kin: Json | null;
          phone: string | null;
          photo_url: string | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          address?: string | null;
          bank_details?: Json | null;
          country?: string | null;
          created_at?: string;
          dob?: string | null;
          email?: string | null;
          full_name?: string | null;
          id?: string;
          id_doc_url?: string | null;
          id_number?: string | null;
          id_type?: string | null;
          kyc_notes?: string | null;
          kyc_reviewed_at?: string | null;
          kyc_reviewed_by?: string | null;
          kyc_status?: Database["public"]["Enums"]["kyc_status"];
          nationality?: string | null;
          next_of_kin?: Json | null;
          phone?: string | null;
          photo_url?: string | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          address?: string | null;
          bank_details?: Json | null;
          country?: string | null;
          created_at?: string;
          dob?: string | null;
          email?: string | null;
          full_name?: string | null;
          id?: string;
          id_doc_url?: string | null;
          id_number?: string | null;
          id_type?: string | null;
          kyc_notes?: string | null;
          kyc_reviewed_at?: string | null;
          kyc_reviewed_by?: string | null;
          kyc_status?: Database["public"]["Enums"]["kyc_status"];
          nationality?: string | null;
          next_of_kin?: Json | null;
          phone?: string | null;
          photo_url?: string | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      investor_wallets: {
        Row: {
          available_balance: number;
          created_at: string;
          id: string;
          investor_id: string;
          pending_balance: number;
          total_deposits: number;
          total_returns: number;
          total_withdrawn: number;
          updated_at: string;
        };
        Insert: {
          available_balance?: number;
          created_at?: string;
          id?: string;
          investor_id: string;
          pending_balance?: number;
          total_deposits?: number;
          total_returns?: number;
          total_withdrawn?: number;
          updated_at?: string;
        };
        Update: {
          available_balance?: number;
          created_at?: string;
          id?: string;
          investor_id?: string;
          pending_balance?: number;
          total_deposits?: number;
          total_returns?: number;
          total_withdrawn?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      lead_interests: {
        Row: {
          budget_max: number | null;
          budget_min: number | null;
          captured_at: string;
          created_at: string;
          id: string;
          investment_type: Database["public"]["Enums"]["investment_type"] | null;
          lead_id: string;
          message: string | null;
          metadata: Json;
          property_id: string | null;
          property_name: string | null;
          source: string;
          source_reference: string | null;
        };
        Insert: {
          budget_max?: number | null;
          budget_min?: number | null;
          captured_at?: string;
          created_at?: string;
          id?: string;
          investment_type?: Database["public"]["Enums"]["investment_type"] | null;
          lead_id: string;
          message?: string | null;
          metadata?: Json;
          property_id?: string | null;
          property_name?: string | null;
          source: string;
          source_reference?: string | null;
        };
        Update: {
          budget_max?: number | null;
          budget_min?: number | null;
          captured_at?: string;
          created_at?: string;
          id?: string;
          investment_type?: Database["public"]["Enums"]["investment_type"] | null;
          lead_id?: string;
          message?: string | null;
          metadata?: Json;
          property_id?: string | null;
          property_name?: string | null;
          source?: string;
          source_reference?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "lead_interests_lead_id_fkey";
            columns: ["lead_id"];
            isOneToOne: false;
            referencedRelation: "leads";
            referencedColumns: ["id"];
          },
        ];
      };
      lead_activities: {
        Row: {
          activity_type: Database["public"]["Enums"]["activity_type"];
          actor_id: string | null;
          body: string | null;
          created_at: string;
          id: string;
          lead_id: string;
          meta: Json | null;
        };
        Insert: {
          activity_type: Database["public"]["Enums"]["activity_type"];
          actor_id?: string | null;
          body?: string | null;
          created_at?: string;
          id?: string;
          lead_id: string;
          meta?: Json | null;
        };
        Update: {
          activity_type?: Database["public"]["Enums"]["activity_type"];
          actor_id?: string | null;
          body?: string | null;
          created_at?: string;
          id?: string;
          lead_id?: string;
          meta?: Json | null;
        };
        Relationships: [
          {
            foreignKeyName: "lead_activities_lead_id_fkey";
            columns: ["lead_id"];
            isOneToOne: false;
            referencedRelation: "leads";
            referencedColumns: ["id"];
          },
        ];
      };
      lead_status_history: {
        Row: {
          changed_by: string | null;
          created_at: string;
          from_status: Database["public"]["Enums"]["lead_status"] | null;
          id: string;
          lead_id: string;
          to_status: Database["public"]["Enums"]["lead_status"];
        };
        Insert: {
          changed_by?: string | null;
          created_at?: string;
          from_status?: Database["public"]["Enums"]["lead_status"] | null;
          id?: string;
          lead_id: string;
          to_status: Database["public"]["Enums"]["lead_status"];
        };
        Update: {
          changed_by?: string | null;
          created_at?: string;
          from_status?: Database["public"]["Enums"]["lead_status"] | null;
          id?: string;
          lead_id?: string;
          to_status?: Database["public"]["Enums"]["lead_status"];
        };
        Relationships: [
          {
            foreignKeyName: "lead_status_history_lead_id_fkey";
            columns: ["lead_id"];
            isOneToOne: false;
            referencedRelation: "leads";
            referencedColumns: ["id"];
          },
        ];
      };
      leads: {
        Row: {
          ad_id: string | null;
          ad_name: string | null;
          assigned_at: string | null;
          assigned_to: string | null;
          budget_max: number | null;
          budget_min: number | null;
          campaign_id: string | null;
          campaign_name: string | null;
          captured_at: string;
          consent_at: string | null;
          consent_given: boolean;
          consent_source: string | null;
          cost_per_lead: number | null;
          country_of_residence: string | null;
          created_at: string;
          do_not_contact: boolean;
          email: string | null;
          expected_timeline: string | null;
          facebook_adset_id: string | null;
          facebook_adset_name: string | null;
          fb_lead_id: string | null;
          fb_profile_url: string | null;
          form_id: string | null;
          form_name: string | null;
          full_name: string;
          grade_reason: string | null;
          grade_score: number;
          id: string;
          investment_type: Database["public"]["Enums"]["investment_type"] | null;
          last_activity_at: string | null;
          last_contacted_at: string | null;
          lead_grade: string;
          lead_source: string;
          location: string | null;
          notes: string | null;
          page_id: string | null;
          phone: string | null;
          preferred_contact_method: string | null;
          preferred_location: string | null;
          property_id: string | null;
          property_name: string | null;
          property_type: string | null;
          raw_payload: Json | null;
          recommended_grade: string;
          source_detail: string | null;
          status: Database["public"]["Enums"]["lead_status"];
          unsubscribed_at: string | null;
          updated_at: string;
          whatsapp_number: string | null;
        };
        Insert: {
          ad_id?: string | null;
          ad_name?: string | null;
          assigned_at?: string | null;
          assigned_to?: string | null;
          budget_max?: number | null;
          budget_min?: number | null;
          campaign_id?: string | null;
          campaign_name?: string | null;
          captured_at?: string;
          consent_at?: string | null;
          consent_given?: boolean;
          consent_source?: string | null;
          cost_per_lead?: number | null;
          country_of_residence?: string | null;
          created_at?: string;
          do_not_contact?: boolean;
          email?: string | null;
          expected_timeline?: string | null;
          facebook_adset_id?: string | null;
          facebook_adset_name?: string | null;
          fb_lead_id?: string | null;
          fb_profile_url?: string | null;
          form_id?: string | null;
          form_name?: string | null;
          full_name: string;
          grade_reason?: string | null;
          grade_score?: number;
          id?: string;
          investment_type?: Database["public"]["Enums"]["investment_type"] | null;
          last_activity_at?: string | null;
          last_contacted_at?: string | null;
          lead_grade?: string;
          lead_source?: string;
          location?: string | null;
          notes?: string | null;
          page_id?: string | null;
          phone?: string | null;
          preferred_contact_method?: string | null;
          preferred_location?: string | null;
          property_id?: string | null;
          property_name?: string | null;
          property_type?: string | null;
          raw_payload?: Json | null;
          recommended_grade?: string;
          source_detail?: string | null;
          status?: Database["public"]["Enums"]["lead_status"];
          unsubscribed_at?: string | null;
          updated_at?: string;
          whatsapp_number?: string | null;
        };
        Update: {
          ad_id?: string | null;
          ad_name?: string | null;
          assigned_at?: string | null;
          assigned_to?: string | null;
          budget_max?: number | null;
          budget_min?: number | null;
          campaign_id?: string | null;
          campaign_name?: string | null;
          captured_at?: string;
          consent_at?: string | null;
          consent_given?: boolean;
          consent_source?: string | null;
          cost_per_lead?: number | null;
          country_of_residence?: string | null;
          created_at?: string;
          do_not_contact?: boolean;
          email?: string | null;
          expected_timeline?: string | null;
          facebook_adset_id?: string | null;
          facebook_adset_name?: string | null;
          fb_lead_id?: string | null;
          fb_profile_url?: string | null;
          form_id?: string | null;
          form_name?: string | null;
          full_name?: string;
          grade_reason?: string | null;
          grade_score?: number;
          id?: string;
          investment_type?: Database["public"]["Enums"]["investment_type"] | null;
          last_activity_at?: string | null;
          last_contacted_at?: string | null;
          lead_grade?: string;
          lead_source?: string;
          location?: string | null;
          notes?: string | null;
          page_id?: string | null;
          phone?: string | null;
          preferred_contact_method?: string | null;
          preferred_location?: string | null;
          property_id?: string | null;
          property_name?: string | null;
          property_type?: string | null;
          raw_payload?: Json | null;
          recommended_grade?: string;
          source_detail?: string | null;
          status?: Database["public"]["Enums"]["lead_status"];
          unsubscribed_at?: string | null;
          updated_at?: string;
          whatsapp_number?: string | null;
        };
        Relationships: [];
      };
      opportunities: {
        Row: {
          assigned_to: string | null;
          budget: number | null;
          buyer_name: string;
          created_at: string;
          created_by: string | null;
          deal_value_naira: number;
          expected_close_at: string | null;
          id: string;
          investment_amount: number | null;
          lead_id: string | null;
          lost_reason: string | null;
          probability: number;
          property_id: string | null;
          property_name: string | null;
          purchase_model: Database["public"]["Enums"]["investment_type"];
          stage: Database["public"]["Enums"]["opportunity_stage"];
          unit_type: string | null;
          updated_at: string;
          won_at: string | null;
        };
        Insert: {
          assigned_to?: string | null;
          budget?: number | null;
          buyer_name: string;
          created_at?: string;
          created_by?: string | null;
          deal_value_naira?: number;
          expected_close_at?: string | null;
          id?: string;
          investment_amount?: number | null;
          lead_id?: string | null;
          lost_reason?: string | null;
          probability?: number;
          property_id?: string | null;
          property_name?: string | null;
          purchase_model?: Database["public"]["Enums"]["investment_type"];
          stage?: Database["public"]["Enums"]["opportunity_stage"];
          unit_type?: string | null;
          updated_at?: string;
          won_at?: string | null;
        };
        Update: {
          assigned_to?: string | null;
          budget?: number | null;
          buyer_name?: string;
          created_at?: string;
          created_by?: string | null;
          deal_value_naira?: number;
          expected_close_at?: string | null;
          id?: string;
          investment_amount?: number | null;
          lead_id?: string | null;
          lost_reason?: string | null;
          probability?: number;
          property_id?: string | null;
          property_name?: string | null;
          purchase_model?: Database["public"]["Enums"]["investment_type"];
          stage?: Database["public"]["Enums"]["opportunity_stage"];
          unit_type?: string | null;
          updated_at?: string;
          won_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "opportunities_lead_id_fkey";
            columns: ["lead_id"];
            isOneToOne: false;
            referencedRelation: "leads";
            referencedColumns: ["id"];
          },
        ];
      };
      payout_requests: {
        Row: {
          affiliate_id: string;
          bank_details: Json | null;
          created_at: string;
          id: string;
          notes: string | null;
          processed_at: string | null;
          requested_amount: number;
          requested_at: string;
          status: Database["public"]["Enums"]["payout_status"];
          updated_at: string;
        };
        Insert: {
          affiliate_id: string;
          bank_details?: Json | null;
          created_at?: string;
          id?: string;
          notes?: string | null;
          processed_at?: string | null;
          requested_amount: number;
          requested_at?: string;
          status?: Database["public"]["Enums"]["payout_status"];
          updated_at?: string;
        };
        Update: {
          affiliate_id?: string;
          bank_details?: Json | null;
          created_at?: string;
          id?: string;
          notes?: string | null;
          processed_at?: string | null;
          requested_amount?: number;
          requested_at?: string;
          status?: Database["public"]["Enums"]["payout_status"];
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "payout_requests_affiliate_id_fkey";
            columns: ["affiliate_id"];
            isOneToOne: false;
            referencedRelation: "affiliate_profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          address: string | null;
          created_at: string;
          email: string;
          full_name: string;
          id: string;
          id_document_url: string | null;
          id_verification_status: string | null;
          phone: string | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          address?: string | null;
          created_at?: string;
          email: string;
          full_name?: string;
          id?: string;
          id_document_url?: string | null;
          id_verification_status?: string | null;
          phone?: string | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          address?: string | null;
          created_at?: string;
          email?: string;
          full_name?: string;
          id?: string;
          id_document_url?: string | null;
          id_verification_status?: string | null;
          phone?: string | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      property_documents: {
        Row: {
          created_at: string;
          doc_type: string;
          file_url: string;
          id: string;
          is_public: boolean;
          property_id: string;
          title: string | null;
          uploaded_by: string | null;
        };
        Insert: {
          created_at?: string;
          doc_type: string;
          file_url: string;
          id?: string;
          is_public?: boolean;
          property_id: string;
          title?: string | null;
          uploaded_by?: string | null;
        };
        Update: {
          created_at?: string;
          doc_type?: string;
          file_url?: string;
          id?: string;
          is_public?: boolean;
          property_id?: string;
          title?: string | null;
          uploaded_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "property_documents_property_id_fkey";
            columns: ["property_id"];
            isOneToOne: false;
            referencedRelation: "tokenized_properties";
            referencedColumns: ["id"];
          },
        ];
      };
      property_tokens: {
        Row: {
          created_at: string;
          id: string;
          investment_id: string;
          investor_id: string;
          issued_at: string;
          property_id: string;
          status: Database["public"]["Enums"]["token_status"];
          tokens_count: number;
          unit_value: number;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          investment_id: string;
          investor_id: string;
          issued_at?: string;
          property_id: string;
          status?: Database["public"]["Enums"]["token_status"];
          tokens_count: number;
          unit_value: number;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          investment_id?: string;
          investor_id?: string;
          issued_at?: string;
          property_id?: string;
          status?: Database["public"]["Enums"]["token_status"];
          tokens_count?: number;
          unit_value?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "property_tokens_investment_id_fkey";
            columns: ["investment_id"];
            isOneToOne: false;
            referencedRelation: "investments";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "property_tokens_property_id_fkey";
            columns: ["property_id"];
            isOneToOne: false;
            referencedRelation: "tokenized_properties";
            referencedColumns: ["id"];
          },
        ];
      };
      property_valuations: {
        Row: {
          approved_by: string | null;
          change_pct: number | null;
          created_at: string;
          id: string;
          new_value: number;
          notes: string | null;
          previous_value: number;
          property_id: string;
          report_url: string | null;
          valuation_date: string;
          valuer: string | null;
        };
        Insert: {
          approved_by?: string | null;
          change_pct?: number | null;
          created_at?: string;
          id?: string;
          new_value: number;
          notes?: string | null;
          previous_value: number;
          property_id: string;
          report_url?: string | null;
          valuation_date: string;
          valuer?: string | null;
        };
        Update: {
          approved_by?: string | null;
          change_pct?: number | null;
          created_at?: string;
          id?: string;
          new_value?: number;
          notes?: string | null;
          previous_value?: number;
          property_id?: string;
          report_url?: string | null;
          valuation_date?: string;
          valuer?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "property_valuations_property_id_fkey";
            columns: ["property_id"];
            isOneToOne: false;
            referencedRelation: "tokenized_properties";
            referencedColumns: ["id"];
          },
        ];
      };
      rental_distributions: {
        Row: {
          created_at: string;
          created_by: string | null;
          distribution_date: string;
          gross_income: number;
          id: string;
          maintenance: number | null;
          mgmt_fee: number | null;
          net_distributable: number;
          notes: string | null;
          other_expenses: number | null;
          property_id: string;
          taxes: number | null;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          distribution_date: string;
          gross_income: number;
          id?: string;
          maintenance?: number | null;
          mgmt_fee?: number | null;
          net_distributable: number;
          notes?: string | null;
          other_expenses?: number | null;
          property_id: string;
          taxes?: number | null;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          distribution_date?: string;
          gross_income?: number;
          id?: string;
          maintenance?: number | null;
          mgmt_fee?: number | null;
          net_distributable?: number;
          notes?: string | null;
          other_expenses?: number | null;
          property_id?: string;
          taxes?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "rental_distributions_property_id_fkey";
            columns: ["property_id"];
            isOneToOne: false;
            referencedRelation: "tokenized_properties";
            referencedColumns: ["id"];
          },
        ];
      };
      rental_payouts: {
        Row: {
          amount: number;
          created_at: string;
          distribution_id: string;
          id: string;
          investor_id: string;
          ownership_pct_snapshot: number;
          paid_at: string | null;
          property_id: string;
          reference: string | null;
          status: string;
        };
        Insert: {
          amount: number;
          created_at?: string;
          distribution_id: string;
          id?: string;
          investor_id: string;
          ownership_pct_snapshot: number;
          paid_at?: string | null;
          property_id: string;
          reference?: string | null;
          status?: string;
        };
        Update: {
          amount?: number;
          created_at?: string;
          distribution_id?: string;
          id?: string;
          investor_id?: string;
          ownership_pct_snapshot?: number;
          paid_at?: string | null;
          property_id?: string;
          reference?: string | null;
          status?: string;
        };
        Relationships: [
          {
            foreignKeyName: "rental_payouts_distribution_id_fkey";
            columns: ["distribution_id"];
            isOneToOne: false;
            referencedRelation: "rental_distributions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "rental_payouts_property_id_fkey";
            columns: ["property_id"];
            isOneToOne: false;
            referencedRelation: "tokenized_properties";
            referencedColumns: ["id"];
          },
        ];
      };
      sales_agents: {
        Row: {
          active: boolean;
          assigned_investment_types: Database["public"]["Enums"]["investment_type"][];
          assigned_locations: string[];
          avatar_url: string | null;
          created_at: string;
          email: string;
          full_name: string;
          id: string;
          monthly_target_naira: number | null;
          phone: string | null;
          round_robin_cursor: number;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          active?: boolean;
          assigned_investment_types?: Database["public"]["Enums"]["investment_type"][];
          assigned_locations?: string[];
          avatar_url?: string | null;
          created_at?: string;
          email: string;
          full_name: string;
          id?: string;
          monthly_target_naira?: number | null;
          phone?: string | null;
          round_robin_cursor?: number;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          active?: boolean;
          assigned_investment_types?: Database["public"]["Enums"]["investment_type"][];
          assigned_locations?: string[];
          avatar_url?: string | null;
          created_at?: string;
          email?: string;
          full_name?: string;
          id?: string;
          monthly_target_naira?: number | null;
          phone?: string | null;
          round_robin_cursor?: number;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      spvs: {
        Row: {
          created_at: string;
          docs: Json | null;
          id: string;
          incorporation_date: string | null;
          name: string;
          registration_number: string | null;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          docs?: Json | null;
          id?: string;
          incorporation_date?: string | null;
          name: string;
          registration_number?: string | null;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          docs?: Json | null;
          id?: string;
          incorporation_date?: string | null;
          name?: string;
          registration_number?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      tokenized_properties: {
        Row: {
          created_at: string;
          created_by: string | null;
          current_value: number;
          description: string | null;
          exit_terms: string | null;
          expected_appreciation: number | null;
          expected_rental_yield: number | null;
          features: string[];
          funding_deadline: string | null;
          highlight: string | null;
          home_order: number;
          id: string;
          images: string[] | null;
          initial_value: number;
          investment_models: string[];
          is_public: boolean;
          legal_title: string | null;
          location: string;
          management_fee_pct: number | null;
          max_investment: number | null;
          max_investors: number | null;
          min_investment: number;
          min_investors: number;
          name: string;
          overview: string[];
          price_label: string | null;
          price_note: string | null;
          property_type: string | null;
          public_funding_status: string;
          public_property_types: string[];
          public_slug: string | null;
          public_tag: string | null;
          public_units: Json;
          risk_disclosure: string | null;
          service_charge: number | null;
          show_on_home: boolean;
          spv_id: string | null;
          status: Database["public"]["Enums"]["property_status"];
          tagline: string | null;
          token_value: number;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          current_value: number;
          description?: string | null;
          exit_terms?: string | null;
          expected_appreciation?: number | null;
          expected_rental_yield?: number | null;
          features?: string[];
          funding_deadline?: string | null;
          highlight?: string | null;
          home_order?: number;
          id?: string;
          images?: string[] | null;
          initial_value: number;
          investment_models?: string[];
          is_public?: boolean;
          legal_title?: string | null;
          location: string;
          management_fee_pct?: number | null;
          max_investment?: number | null;
          max_investors?: number | null;
          min_investment?: number;
          min_investors?: number;
          name: string;
          overview?: string[];
          price_label?: string | null;
          price_note?: string | null;
          property_type?: string | null;
          public_funding_status?: string;
          public_property_types?: string[];
          public_slug?: string | null;
          public_tag?: string | null;
          public_units?: Json;
          risk_disclosure?: string | null;
          service_charge?: number | null;
          show_on_home?: boolean;
          spv_id?: string | null;
          status?: Database["public"]["Enums"]["property_status"];
          tagline?: string | null;
          token_value?: number;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          current_value?: number;
          description?: string | null;
          exit_terms?: string | null;
          expected_appreciation?: number | null;
          expected_rental_yield?: number | null;
          features?: string[];
          funding_deadline?: string | null;
          highlight?: string | null;
          home_order?: number;
          id?: string;
          images?: string[] | null;
          initial_value?: number;
          investment_models?: string[];
          is_public?: boolean;
          legal_title?: string | null;
          location?: string;
          management_fee_pct?: number | null;
          max_investment?: number | null;
          max_investors?: number | null;
          min_investment?: number;
          min_investors?: number;
          name?: string;
          overview?: string[];
          price_label?: string | null;
          price_note?: string | null;
          property_type?: string | null;
          public_funding_status?: string;
          public_property_types?: string[];
          public_slug?: string | null;
          public_tag?: string | null;
          public_units?: Json;
          risk_disclosure?: string | null;
          service_charge?: number | null;
          show_on_home?: boolean;
          spv_id?: string | null;
          status?: Database["public"]["Enums"]["property_status"];
          tagline?: string | null;
          token_value?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "tokenized_properties_spv_id_fkey";
            columns: ["spv_id"];
            isOneToOne: false;
            referencedRelation: "spvs";
            referencedColumns: ["id"];
          },
        ];
      };
      training_videos: {
        Row: {
          category: string;
          created_at: string;
          created_by: string | null;
          description: string | null;
          id: string;
          is_published: boolean;
          title: string;
          updated_at: string;
          youtube_url: string;
        };
        Insert: {
          category?: string;
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          id?: string;
          is_published?: boolean;
          title: string;
          updated_at?: string;
          youtube_url: string;
        };
        Update: {
          category?: string;
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          id?: string;
          is_published?: boolean;
          title?: string;
          updated_at?: string;
          youtube_url?: string;
        };
        Relationships: [];
      };
      staff_members: {
        Row: {
          approved_at: string | null;
          approved_by: string | null;
          created_at: string;
          department: string | null;
          email: string;
          full_name: string;
          id: string;
          intended_role: Database["public"]["Enums"]["app_role"] | null;
          invite_accepted_at: string | null;
          invited_at: string | null;
          invited_by: string | null;
          notes: string | null;
          phone: string | null;
          position: string | null;
          rejected_reason: string | null;
          signed_in_at: string | null;
          started_on: string | null;
          status: string;
          updated_at: string;
          user_id: string | null;
          whatsapp_number: string | null;
        };
        Insert: {
          approved_at?: string | null;
          approved_by?: string | null;
          created_at?: string;
          department?: string | null;
          email: string;
          full_name: string;
          id?: string;
          intended_role?: Database["public"]["Enums"]["app_role"] | null;
          invite_accepted_at?: string | null;
          invited_at?: string | null;
          invited_by?: string | null;
          notes?: string | null;
          phone?: string | null;
          position?: string | null;
          rejected_reason?: string | null;
          signed_in_at?: string | null;
          started_on?: string | null;
          status?: string;
          updated_at?: string;
          user_id?: string | null;
          whatsapp_number?: string | null;
        };
        Update: {
          approved_at?: string | null;
          approved_by?: string | null;
          created_at?: string;
          department?: string | null;
          email?: string;
          full_name?: string;
          id?: string;
          intended_role?: Database["public"]["Enums"]["app_role"] | null;
          invite_accepted_at?: string | null;
          invited_at?: string | null;
          invited_by?: string | null;
          notes?: string | null;
          phone?: string | null;
          position?: string | null;
          rejected_reason?: string | null;
          signed_in_at?: string | null;
          started_on?: string | null;
          status?: string;
          updated_at?: string;
          user_id?: string | null;
          whatsapp_number?: string | null;
        };
        Relationships: [];
      };
      staff_change_requests: {
        Row: {
          created_at: string;
          id: string;
          note: string | null;
          requested_department: string | null;
          requested_position: string | null;
          requested_role: Database["public"]["Enums"]["app_role"] | null;
          review_note: string | null;
          reviewed_at: string | null;
          reviewed_by: string | null;
          staff_id: string;
          status: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          note?: string | null;
          requested_department?: string | null;
          requested_position?: string | null;
          requested_role?: Database["public"]["Enums"]["app_role"] | null;
          review_note?: string | null;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          staff_id: string;
          status?: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          note?: string | null;
          requested_department?: string | null;
          requested_position?: string | null;
          requested_role?: Database["public"]["Enums"]["app_role"] | null;
          review_note?: string | null;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          staff_id?: string;
          status?: string;
        };
        Relationships: [
          {
            foreignKeyName: "staff_change_requests_staff_id_fkey";
            columns: ["staff_id"];
            isOneToOne: false;
            referencedRelation: "staff_members";
            referencedColumns: ["id"];
          },
        ];
      };
      user_roles: {
        Row: {
          created_at: string;
          id: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          role?: Database["public"]["Enums"]["app_role"];
          user_id?: string;
        };
        Relationships: [];
      };
      wallet_transactions: {
        Row: {
          amount: number;
          created_at: string;
          evidence_url: string | null;
          id: string;
          investment_id: string | null;
          investor_id: string;
          method: string | null;
          notes: string | null;
          property_id: string | null;
          reference: string | null;
          status: string;
          type: Database["public"]["Enums"]["wallet_txn_type"];
        };
        Insert: {
          amount: number;
          created_at?: string;
          evidence_url?: string | null;
          id?: string;
          investment_id?: string | null;
          investor_id: string;
          method?: string | null;
          notes?: string | null;
          property_id?: string | null;
          reference?: string | null;
          status?: string;
          type: Database["public"]["Enums"]["wallet_txn_type"];
        };
        Update: {
          amount?: number;
          created_at?: string;
          evidence_url?: string | null;
          id?: string;
          investment_id?: string | null;
          investor_id?: string;
          method?: string | null;
          notes?: string | null;
          property_id?: string | null;
          reference?: string | null;
          status?: string;
          type?: Database["public"]["Enums"]["wallet_txn_type"];
        };
        Relationships: [
          {
            foreignKeyName: "wallet_transactions_investment_id_fkey";
            columns: ["investment_id"];
            isOneToOne: false;
            referencedRelation: "investments";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "wallet_transactions_property_id_fkey";
            columns: ["property_id"];
            isOneToOne: false;
            referencedRelation: "tokenized_properties";
            referencedColumns: ["id"];
          },
        ];
      };
      withdrawal_requests: {
        Row: {
          admin_notes: string | null;
          amount: number;
          approved_at: string | null;
          approved_by: string | null;
          bank_details: Json | null;
          created_at: string;
          id: string;
          investor_id: string;
          reference: string | null;
          status: string;
          updated_at: string;
        };
        Insert: {
          admin_notes?: string | null;
          amount: number;
          approved_at?: string | null;
          approved_by?: string | null;
          bank_details?: Json | null;
          created_at?: string;
          id?: string;
          investor_id: string;
          reference?: string | null;
          status?: string;
          updated_at?: string;
        };
        Update: {
          admin_notes?: string | null;
          amount?: number;
          approved_at?: string | null;
          approved_by?: string | null;
          bank_details?: Json | null;
          created_at?: string;
          id?: string;
          investor_id?: string;
          reference?: string | null;
          status?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      admin_approve_investment: {
        Args: {
          _approved_amount: number;
          _investment_id: string;
          _notes?: string | null;
        };
        Returns: undefined;
      };
      admin_approve_withdrawal: {
        Args: { _reference?: string | null; _withdrawal_id: string };
        Returns: undefined;
      };
      admin_mark_rental_payout_paid: {
        Args: { _payout_id: string; _reference?: string | null };
        Returns: undefined;
      };
      admin_record_property_valuation: {
        Args: {
          _new_value: number;
          _notes?: string | null;
          _property_id: string;
          _report_url?: string | null;
          _valuation_date: string;
          _valuer?: string | null;
        };
        Returns: number;
      };
      admin_record_rental_distribution: {
        Args: {
          _distribution_date: string;
          _gross_income: number;
          _maintenance: number;
          _management_fee: number;
          _notes?: string | null;
          _other_expenses: number;
          _property_id: string;
          _taxes: number;
        };
        Returns: string;
      };
      admin_reject_investment: {
        Args: { _investment_id: string; _notes?: string | null };
        Returns: undefined;
      };
      admin_reject_withdrawal: {
        Args: { _notes: string; _withdrawal_id: string };
        Returns: undefined;
      };
      admin_review_investor_kyc: {
        Args: {
          _notes?: string | null;
          _profile_id: string;
          _status: Database["public"]["Enums"]["kyc_status"];
        };
        Returns: undefined;
      };
      admin_update_exit_request: {
        Args: {
          _exit_id: string;
          _notes?: string | null;
          _status: Database["public"]["Enums"]["exit_status"];
        };
        Returns: undefined;
      };
      generate_certificate_number: { Args: never; Returns: string };
      get_admin_summary: {
        Args: never;
        Returns: {
          active_affiliates: number;
          pending_affiliates: number;
          pending_commissions_amount: number;
          pending_commissions_count: number;
          pending_payouts_amount: number;
          pending_payouts_count: number;
          total_affiliates: number;
          total_leads: number;
        }[];
      };
      get_affiliate_earnings: {
        Args: { _affiliate_id: string };
        Returns: {
          pending_commissions: number;
          pending_payout: number;
          total_commissions: number;
          total_earned: number;
          total_paid: number;
        }[];
      };
      get_affiliate_leaderboard: {
        Args: never;
        Returns: {
          affiliate_id: string;
          avatar_url: string;
          full_name: string;
          member_number: number;
          rank: number;
          successful_sales: number;
          total_earned: number;
          total_sales_amount: number;
        }[];
      };
      approve_staff_member: {
        Args: { _role?: string | null; _staff_id: string };
        Returns: undefined;
      };
      find_lead_by_contact: {
        Args: { _email?: string | null; _phone?: string | null };
        Returns: string | null;
      };
      grant_user_role: {
        Args: { _role: string; _user_id: string };
        Returns: undefined;
      };
      log_admin_action: {
        Args: {
          _action: string;
          _actor?: string | null;
          _details?: Json;
          _entity_id?: string | null;
          _entity_type: string;
        };
        Returns: undefined;
      };
      revoke_user_role: {
        Args: { _role: string; _user_id: string };
        Returns: undefined;
      };
      request_staff_change: {
        Args: {
          _department?: string | null;
          _note?: string | null;
          _position?: string | null;
          _role?: string | null;
        };
        Returns: string;
      };
      update_my_staff_contact: {
        Args: { _phone?: string | null; _whatsapp?: string | null };
        Returns: undefined;
      };
      get_public_property_funding: {
        Args: { _property_ids: string[] };
        Returns: {
          approved: number;
          investors: number;
          pending: number;
          property_id: string;
        }[];
      };
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"];
          _user_id: string;
        };
        Returns: boolean;
      };
      is_admin: { Args: { _user_id: string }; Returns: boolean };
      is_crm_admin: { Args: { _uid: string }; Returns: boolean };
      is_sales_agent: { Args: { _uid: string }; Returns: boolean };
      recalc_property_funding: {
        Args: { _property_id: string };
        Returns: undefined;
      };
      request_property_token_exit: {
        Args: {
          _asking_price: number;
          _property_id: string;
          _tokens_to_sell: number;
        };
        Returns: string;
      };
      submit_investment_payment_evidence: {
        Args: {
          _evidence_url: string;
          _investment_id: string;
          _reference?: string | null;
        };
        Returns: undefined;
      };
      submit_investor_kyc: {
        Args: { _profile: Json };
        Returns: undefined;
      };
      verify_investment_certificate: {
        Args: { _token: string };
        Returns: {
          approved_amount: number;
          certificate_number: string;
          issued_at: string;
          ownership_pct: number;
          property_location: string;
          property_name: string;
          tokens_count: number;
        }[];
      };
    };
    Enums: {
      activity_type:
        | "call"
        | "sms"
        | "email"
        | "note"
        | "brochure_sent"
        | "inspection_booked"
        | "inspection_completed"
        | "status_change"
        | "assignment"
        | "payment_note"
        | "fb_message_in"
        | "fb_message_out"
        | "whatsapp"
        | "event_registration"
        | "task"
        | "document"
        | "grade_change"
        | "automation"
        | "system";
      app_role:
        | "super_admin"
        | "admin"
        | "client"
        | "sales_agent"
        | "property_manager"
        | "finance_officer"
        | "compliance_officer"
        | "manager"
        | "crm_manager"
        | "content_manager"
        | "content_editor"
        | "content_author"
        | "seo_manager"
        | "social_media_manager";
      commission_status: "pending" | "approved" | "paid" | "rejected";
      exit_status:
        | "submitted"
        | "under_review"
        | "approved_for_listing"
        | "buyer_found"
        | "payment_pending"
        | "transfer_in_progress"
        | "completed"
        | "rejected"
        | "cancelled";
      investment_status:
        | "draft"
        | "submitted"
        | "payment_pending"
        | "payment_received"
        | "under_review"
        | "approved"
        | "rejected"
        | "refunded"
        | "cancelled";
      investment_type:
        | "full_purchase"
        | "group_purchase"
        | "fractional"
        | "tokenized"
        | "land_purchase"
        | "residential_property"
        | "commercial_property"
        | "rental_income"
        | "not_decided";
      kyc_status: "not_submitted" | "pending" | "verified" | "rejected" | "more_info";
      lead_status:
        | "new"
        | "auto_response_sent"
        | "assigned_to_adviser"
        | "contact_attempted"
        | "contacted"
        | "interested"
        | "qualified"
        | "property_information_sent"
        | "brochure_sent"
        | "investment_pack_sent"
        | "inspection_booked"
        | "inspection_completed"
        | "kyc_pending"
        | "payment_pending"
        | "payment_discussion"
        | "payment_submitted"
        | "payment_received"
        | "payment_approved"
        | "converted"
        | "not_interested"
        | "follow_up_later"
        | "lost";
      opportunity_stage: "qualification" | "proposal" | "negotiation" | "closing" | "won" | "lost";
      payout_status: "pending" | "processing" | "completed" | "rejected";
      property_status:
        | "open"
        | "partially_funded"
        | "fully_funded"
        | "under_review"
        | "approved"
        | "acquisition_in_progress"
        | "acquired"
        | "income_generating"
        | "available_for_resale"
        | "sold"
        | "closed";
      task_type:
        | "call"
        | "whatsapp"
        | "email_followup"
        | "brochure"
        | "payment_plan"
        | "inspection"
        | "event_reminder"
        | "document_request"
        | "group_plan"
        | "tokenized_explain"
        | "allocation"
        | "payment_followup"
        | "kyc_reminder"
        | "adviser_meeting"
        | "other";
      token_status:
        | "reserved"
        | "pending_payment"
        | "pending_approval"
        | "active"
        | "locked"
        | "listed_for_resale"
        | "transferred"
        | "redeemed"
        | "cancelled";
      wallet_txn_type:
        | "deposit"
        | "investment_payment"
        | "rental_income"
        | "sale_proceeds"
        | "withdrawal"
        | "refund"
        | "adjustment";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      activity_type: [
        "call",
        "sms",
        "email",
        "note",
        "brochure_sent",
        "inspection_booked",
        "inspection_completed",
        "status_change",
        "assignment",
        "payment_note",
        "fb_message_in",
        "fb_message_out",
        "whatsapp",
        "event_registration",
        "task",
        "document",
        "grade_change",
        "automation",
        "system",
      ],
      app_role: [
        "super_admin",
        "admin",
        "client",
        "sales_agent",
        "property_manager",
        "finance_officer",
        "compliance_officer",
        "manager",
        "crm_manager",
        "content_manager",
        "content_editor",
        "content_author",
        "seo_manager",
        "social_media_manager",
      ],
      commission_status: ["pending", "approved", "paid", "rejected"],
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
        "draft",
        "submitted",
        "payment_pending",
        "payment_received",
        "under_review",
        "approved",
        "rejected",
        "refunded",
        "cancelled",
      ],
      investment_type: [
        "full_purchase",
        "group_purchase",
        "fractional",
        "tokenized",
        "land_purchase",
        "residential_property",
        "commercial_property",
        "rental_income",
        "not_decided",
      ],
      kyc_status: ["not_submitted", "pending", "verified", "rejected", "more_info"],
      lead_status: [
        "new",
        "auto_response_sent",
        "assigned_to_adviser",
        "contact_attempted",
        "contacted",
        "interested",
        "qualified",
        "property_information_sent",
        "brochure_sent",
        "investment_pack_sent",
        "inspection_booked",
        "inspection_completed",
        "kyc_pending",
        "payment_pending",
        "payment_discussion",
        "payment_submitted",
        "payment_received",
        "payment_approved",
        "converted",
        "not_interested",
        "follow_up_later",
        "lost",
      ],
      opportunity_stage: ["qualification", "proposal", "negotiation", "closing", "won", "lost"],
      payout_status: ["pending", "processing", "completed", "rejected"],
      property_status: [
        "open",
        "partially_funded",
        "fully_funded",
        "under_review",
        "approved",
        "acquisition_in_progress",
        "acquired",
        "income_generating",
        "available_for_resale",
        "sold",
        "closed",
      ],
      task_type: [
        "call",
        "whatsapp",
        "email_followup",
        "brochure",
        "payment_plan",
        "inspection",
        "event_reminder",
        "document_request",
        "group_plan",
        "tokenized_explain",
        "allocation",
        "payment_followup",
        "kyc_reminder",
        "adviser_meeting",
        "other",
      ],
      token_status: [
        "reserved",
        "pending_payment",
        "pending_approval",
        "active",
        "locked",
        "listed_for_resale",
        "transferred",
        "redeemed",
        "cancelled",
      ],
      wallet_txn_type: [
        "deposit",
        "investment_payment",
        "rental_income",
        "sale_proceeds",
        "withdrawal",
        "refund",
        "adjustment",
      ],
    },
  },
} as const;
