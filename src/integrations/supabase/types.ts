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
          id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
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
      app_role: "admin" | "investor"
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
      app_role: ["admin", "investor"],
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
