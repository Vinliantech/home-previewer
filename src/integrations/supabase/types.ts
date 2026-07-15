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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
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
    }
    Enums: {
      app_role: "admin" | "investor" | "manager"
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
    },
  },
} as const
