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
      assigned_vehicles: {
        Row: {
          created_at: string
          employee_name: string
          id: string
          license_plates: string[]
          updated_at: string
        }
        Insert: {
          created_at?: string
          employee_name: string
          id?: string
          license_plates: string[]
          updated_at?: string
        }
        Update: {
          created_at?: string
          employee_name?: string
          id?: string
          license_plates?: string[]
          updated_at?: string
        }
        Relationships: []
      }
      department_managers: {
        Row: {
          created_at: string
          department: string
          display_name: string
          email: string
          employee_id: string | null
          id: string
          job_title: string | null
        }
        Insert: {
          created_at?: string
          department: string
          display_name: string
          email: string
          employee_id?: string | null
          id?: string
          job_title?: string | null
        }
        Update: {
          created_at?: string
          department?: string
          display_name?: string
          email?: string
          employee_id?: string | null
          id?: string
          job_title?: string | null
        }
        Relationships: []
      }
      employee_documents: {
        Row: {
          created_at: string
          document_name: string | null
          document_type: string
          document_url: string | null
          employee_email: string | null
          employee_id: string
          employee_name: string | null
          expiry_date: string | null
          id: string
          updated_at: string
          uploaded_at: string
        }
        Insert: {
          created_at?: string
          document_name?: string | null
          document_type: string
          document_url?: string | null
          employee_email?: string | null
          employee_id: string
          employee_name?: string | null
          expiry_date?: string | null
          id?: string
          updated_at?: string
          uploaded_at?: string
        }
        Update: {
          created_at?: string
          document_name?: string | null
          document_type?: string
          document_url?: string | null
          employee_email?: string | null
          employee_id?: string
          employee_name?: string | null
          expiry_date?: string | null
          id?: string
          updated_at?: string
          uploaded_at?: string
        }
        Relationships: []
      }
      event_reports: {
        Row: {
          created_at: string
          description: string | null
          employee_name: string
          event_date: string
          id: string
          location: string
          photo_urls: string[] | null
          severity: string
          status: string
          third_party_insurance: string | null
          third_party_involved: boolean | null
          third_party_license_plate: string | null
          third_party_name: string | null
          third_party_phone: string | null
          updated_at: string
          vehicle_license_plate: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          employee_name: string
          event_date: string
          id?: string
          location: string
          photo_urls?: string[] | null
          severity: string
          status?: string
          third_party_insurance?: string | null
          third_party_involved?: boolean | null
          third_party_license_plate?: string | null
          third_party_name?: string | null
          third_party_phone?: string | null
          updated_at?: string
          vehicle_license_plate: string
        }
        Update: {
          created_at?: string
          description?: string | null
          employee_name?: string
          event_date?: string
          id?: string
          location?: string
          photo_urls?: string[] | null
          severity?: string
          status?: string
          third_party_insurance?: string | null
          third_party_involved?: boolean | null
          third_party_license_plate?: string | null
          third_party_name?: string | null
          third_party_phone?: string | null
          updated_at?: string
          vehicle_license_plate?: string
        }
        Relationships: []
      }
      form_templates: {
        Row: {
          created_at: string | null
          description: string | null
          form_fields: Json | null
          form_title: string
          form_type: string
          id: string
          is_active: boolean | null
          pdf_template_url: string | null
          updated_at: string | null
          usage_type: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          form_fields?: Json | null
          form_title: string
          form_type: string
          id?: string
          is_active?: boolean | null
          pdf_template_url?: string | null
          updated_at?: string | null
          usage_type: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          form_fields?: Json | null
          form_title?: string
          form_type?: string
          id?: string
          is_active?: boolean | null
          pdf_template_url?: string | null
          updated_at?: string | null
          usage_type?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string
          full_name: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          full_name?: string | null
          id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      vehicle_assignments: {
        Row: {
          assigned_by_id: string | null
          assigned_by_name: string | null
          created_at: string
          driver_id: string | null
          driver_name: string | null
          end_date: string | null
          id: string
          license_plate: string
          start_date: string
          status: string
          updated_at: string
        }
        Insert: {
          assigned_by_id?: string | null
          assigned_by_name?: string | null
          created_at?: string
          driver_id?: string | null
          driver_name?: string | null
          end_date?: string | null
          id?: string
          license_plate: string
          start_date: string
          status?: string
          updated_at?: string
        }
        Update: {
          assigned_by_id?: string | null
          assigned_by_name?: string | null
          created_at?: string
          driver_id?: string | null
          driver_name?: string | null
          end_date?: string | null
          id?: string
          license_plate?: string
          start_date?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      vehicle_information: {
        Row: {
          created_at: string
          document_type: string
          document_url: string | null
          email_reminder_enabled: boolean
          expiry_date: string
          id: string
          license_plate: string
          reminder_sent: boolean
          updated_at: string
        }
        Insert: {
          created_at?: string
          document_type: string
          document_url?: string | null
          email_reminder_enabled?: boolean
          expiry_date: string
          id?: string
          license_plate: string
          reminder_sent?: boolean
          updated_at?: string
        }
        Update: {
          created_at?: string
          document_type?: string
          document_url?: string | null
          email_reminder_enabled?: boolean
          expiry_date?: string
          id?: string
          license_plate?: string
          reminder_sent?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      vehicle_requests: {
        Row: {
          created_at: string
          department: string
          department_manager: string | null
          email: string | null
          end_date: string | null
          file_urls: string[] | null
          full_name: string
          id: string
          job_title: string | null
          license_file_url: string | null
          manager_email: string | null
          phone_number: string | null
          priority: string
          purpose: string | null
          signature_url: string | null
          signed_at: string | null
          signed_template_id: string | null
          start_date: string
          status: string
          updated_at: string
          usage_type: string
        }
        Insert: {
          created_at?: string
          department: string
          department_manager?: string | null
          email?: string | null
          end_date?: string | null
          file_urls?: string[] | null
          full_name: string
          id?: string
          job_title?: string | null
          license_file_url?: string | null
          manager_email?: string | null
          phone_number?: string | null
          priority?: string
          purpose?: string | null
          signature_url?: string | null
          signed_at?: string | null
          signed_template_id?: string | null
          start_date: string
          status?: string
          updated_at?: string
          usage_type: string
        }
        Update: {
          created_at?: string
          department?: string
          department_manager?: string | null
          email?: string | null
          end_date?: string | null
          file_urls?: string[] | null
          full_name?: string
          id?: string
          job_title?: string | null
          license_file_url?: string | null
          manager_email?: string | null
          phone_number?: string | null
          priority?: string
          purpose?: string | null
          signature_url?: string | null
          signed_at?: string | null
          signed_template_id?: string | null
          start_date?: string
          status?: string
          updated_at?: string
          usage_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_requests_signed_template_id_fkey"
            columns: ["signed_template_id"]
            isOneToOne: false
            referencedRelation: "form_templates"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_email: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "coordinator" | "employee"
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
      app_role: ["admin", "coordinator", "employee"],
    },
  },
} as const
