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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      autopen_drivers: {
        Row: {
          created_at: string
          id: string
          link: string
          user_id: string | null
          version: string
        }
        Insert: {
          created_at?: string
          id?: string
          link: string
          user_id?: string | null
          version: string
        }
        Update: {
          created_at?: string
          id?: string
          link?: string
          user_id?: string | null
          version?: string
        }
        Relationships: []
      }
      cards: {
        Row: {
          author_name: string | null
          category: Database["public"]["Enums"]["card_category"]
          cover_image: string | null
          created_at: string | null
          description: string
          files: Json | null
          id: string
          images: string[] | null
          title: string
          updated_at: string | null
          user_id: string | null
          videos: Json | null
        }
        Insert: {
          author_name?: string | null
          category: Database["public"]["Enums"]["card_category"]
          cover_image?: string | null
          created_at?: string | null
          description: string
          files?: Json | null
          id?: string
          images?: string[] | null
          title: string
          updated_at?: string | null
          user_id?: string | null
          videos?: Json | null
        }
        Update: {
          author_name?: string | null
          category?: Database["public"]["Enums"]["card_category"]
          cover_image?: string | null
          created_at?: string | null
          description?: string
          files?: Json | null
          id?: string
          images?: string[] | null
          title?: string
          updated_at?: string | null
          user_id?: string | null
          videos?: Json | null
        }
        Relationships: []
      }
      demands: {
        Row: {
          assignee_id: string | null
          assignee_name: string | null
          attachments: Json
          audio_url: string | null
          category: string | null
          completed_at: string | null
          completed_by: string | null
          completed_by_name: string | null
          created_at: string
          created_by: string
          created_by_name: string | null
          deadline: string | null
          description: string
          id: string
          priority: Database["public"]["Enums"]["demand_priority"]
          status: Database["public"]["Enums"]["demand_status"]
          title: string
          updated_at: string
        }
        Insert: {
          assignee_id?: string | null
          assignee_name?: string | null
          attachments?: Json
          audio_url?: string | null
          category?: string | null
          completed_at?: string | null
          completed_by?: string | null
          completed_by_name?: string | null
          created_at?: string
          created_by: string
          created_by_name?: string | null
          deadline?: string | null
          description?: string
          id?: string
          priority?: Database["public"]["Enums"]["demand_priority"]
          status?: Database["public"]["Enums"]["demand_status"]
          title: string
          updated_at?: string
        }
        Update: {
          assignee_id?: string | null
          assignee_name?: string | null
          attachments?: Json
          audio_url?: string | null
          category?: string | null
          completed_at?: string | null
          completed_by?: string | null
          completed_by_name?: string | null
          created_at?: string
          created_by?: string
          created_by_name?: string | null
          deadline?: string | null
          description?: string
          id?: string
          priority?: Database["public"]["Enums"]["demand_priority"]
          status?: Database["public"]["Enums"]["demand_status"]
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      printer_files: {
        Row: {
          brand: string
          created_at: string
          file_path: string
          file_size: number | null
          file_type: string | null
          file_url: string
          id: string
          title: string
          type: string
          user_id: string | null
        }
        Insert: {
          brand: string
          created_at?: string
          file_path: string
          file_size?: number | null
          file_type?: string | null
          file_url: string
          id?: string
          title: string
          type: string
          user_id?: string | null
        }
        Update: {
          brand?: string
          created_at?: string
          file_path?: string
          file_size?: number | null
          file_type?: string | null
          file_url?: string
          id?: string
          title?: string
          type?: string
          user_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string | null
          id: string
          name: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          id: string
          name: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      repository_files: {
        Row: {
          created_at: string
          file_path: string
          file_size: number | null
          file_type: string | null
          file_url: string
          id: string
          name: string
          observation: string | null
          preview_path: string | null
          preview_paths: string[] | null
          preview_url: string | null
          preview_urls: string[] | null
          repository: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          file_path: string
          file_size?: number | null
          file_type?: string | null
          file_url: string
          id?: string
          name: string
          observation?: string | null
          preview_path?: string | null
          preview_paths?: string[] | null
          preview_url?: string | null
          preview_urls?: string[] | null
          repository: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          file_path?: string
          file_size?: number | null
          file_type?: string | null
          file_url?: string
          id?: string
          name?: string
          observation?: string | null
          preview_path?: string | null
          preview_paths?: string[] | null
          preview_url?: string | null
          preview_urls?: string[] | null
          repository?: string
          user_id?: string | null
        }
        Relationships: []
      }
      store_bank_files: {
        Row: {
          created_at: string
          custom_name: string
          file_category: string
          file_path: string
          file_size: number | null
          file_type: string | null
          file_url: string
          id: string
          original_name: string
          thumbnail_url: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          custom_name: string
          file_category?: string
          file_path: string
          file_size?: number | null
          file_type?: string | null
          file_url: string
          id?: string
          original_name: string
          thumbnail_url?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          custom_name?: string
          file_category?: string
          file_path?: string
          file_size?: number | null
          file_type?: string | null
          file_url?: string
          id?: string
          original_name?: string
          thumbnail_url?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      technical_pdfs: {
        Row: {
          created_at: string
          file_path: string
          file_size: number | null
          file_url: string
          id: string
          name: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          file_path: string
          file_size?: number | null
          file_url: string
          id?: string
          name: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          file_path?: string
          file_size?: number | null
          file_url?: string
          id?: string
          name?: string
          user_id?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
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
      admin_list_users: {
        Args: never
        Returns: {
          avatar_url: string
          email: string
          id: string
          name: string
          role: Database["public"]["Enums"]["app_role"]
        }[]
      }
      admin_set_user_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: undefined
      }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user" | "read"
      card_category:
        | "Impressora"
        | "XD Orders"
        | "Sat"
        | "NFCE"
        | "Dados Fiscais"
        | "Sistema"
        | "Tablet"
        | "Extras"
      demand_priority: "baixa" | "media" | "alta"
      demand_status: "aguardando" | "concluido"
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
      app_role: ["admin", "user", "read"],
      card_category: [
        "Impressora",
        "XD Orders",
        "Sat",
        "NFCE",
        "Dados Fiscais",
        "Sistema",
        "Tablet",
        "Extras",
      ],
      demand_priority: ["baixa", "media", "alta"],
      demand_status: ["aguardando", "concluido"],
    },
  },
} as const
