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
      activity_logs: {
        Row: {
          created_at: string
          entity_id: string | null
          entity_type: string
          event_type: string
          id: string
          metadata: Json | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          entity_id?: string | null
          entity_type: string
          event_type: string
          id?: string
          metadata?: Json | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          event_type?: string
          id?: string
          metadata?: Json | null
          user_id?: string | null
        }
        Relationships: []
      }
      af_taxonomy: {
        Row: {
          concept_id: string
          label: string
          type: string
          updated_at: string | null
          version: number
        }
        Insert: {
          concept_id: string
          label: string
          type: string
          updated_at?: string | null
          version: number
        }
        Update: {
          concept_id?: string
          label?: string
          type?: string
          updated_at?: string | null
          version?: number
        }
        Relationships: []
      }
      application_tag_relations: {
        Row: {
          application_id: string
          created_at: string
          id: string
          tag_id: string
        }
        Insert: {
          application_id: string
          created_at?: string
          id?: string
          tag_id: string
        }
        Update: {
          application_id?: string
          created_at?: string
          id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "application_tag_relations_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "application_tag_relations_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "application_tags"
            referencedColumns: ["id"]
          },
        ]
      }
      application_tags: {
        Row: {
          created_at: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      applications: {
        Row: {
          candidate_name: string
          created_at: string
          cv_url: string | null
          email: string
          gdpr_consent: boolean
          gdpr_consent_timestamp: string | null
          id: string
          interview_link: string | null
          interview_notes: string | null
          interview_scheduled_at: string | null
          job_id: string
          message: string | null
          notes: string | null
          phone: string | null
          pipeline_stage_id: string
          rating: number | null
          reminder_sent: boolean | null
          status: Database["public"]["Enums"]["application_status"]
        }
        Insert: {
          candidate_name: string
          created_at?: string
          cv_url?: string | null
          email: string
          gdpr_consent?: boolean
          gdpr_consent_timestamp?: string | null
          id?: string
          interview_link?: string | null
          interview_notes?: string | null
          interview_scheduled_at?: string | null
          job_id: string
          message?: string | null
          notes?: string | null
          phone?: string | null
          pipeline_stage_id: string
          rating?: number | null
          reminder_sent?: boolean | null
          status?: Database["public"]["Enums"]["application_status"]
        }
        Update: {
          candidate_name?: string
          created_at?: string
          cv_url?: string | null
          email?: string
          gdpr_consent?: boolean
          gdpr_consent_timestamp?: string | null
          id?: string
          interview_link?: string | null
          interview_notes?: string | null
          interview_scheduled_at?: string | null
          job_id?: string
          message?: string | null
          notes?: string | null
          phone?: string | null
          pipeline_stage_id?: string
          rating?: number | null
          reminder_sent?: boolean | null
          status?: Database["public"]["Enums"]["application_status"]
        }
        Relationships: [
          {
            foreignKeyName: "applications_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_pipeline_stage_id_fkey"
            columns: ["pipeline_stage_id"]
            isOneToOne: false
            referencedRelation: "pipeline_stages"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          address: string | null
          city: string | null
          contact_email: string
          contact_person: string
          contact_phone: string
          created_at: string
          description: string | null
          id: string
          logo_url: string | null
          name: string
          org_number: string | null
          postal_code: string | null
          updated_at: string
          website: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          contact_email: string
          contact_person: string
          contact_phone: string
          created_at?: string
          description?: string | null
          id?: string
          logo_url?: string | null
          name: string
          org_number?: string | null
          postal_code?: string | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          contact_email?: string
          contact_person?: string
          contact_phone?: string
          created_at?: string
          description?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          org_number?: string | null
          postal_code?: string | null
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      gdpr_policies: {
        Row: {
          created_at: string
          id: string
          is_active: boolean | null
          policy_text: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          policy_text: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          policy_text?: string
          updated_at?: string
        }
        Relationships: []
      }
      jobs: {
        Row: {
          af_ad_id: string | null
          af_duration_cid: string | null
          af_employment_type_cid: string | null
          af_error: string | null
          af_last_sync: string | null
          af_municipality_cid: string | null
          af_occupation_cid: string | null
          af_published: boolean | null
          af_published_at: string | null
          af_wage_type_code: string | null
          af_worktime_extent_cid: string | null
          category: string | null
          city: string | null
          company_id: string
          contact_person_email: string | null
          contact_person_name: string | null
          contact_person_phone: string | null
          created_at: string
          created_by: string
          description_md: string | null
          driver_license: boolean | null
          employment_type: string | null
          id: string
          kiku_interview_url: string | null
          language: string | null
          last_application_date: string | null
          publish_at: string | null
          region: string | null
          requirements_md: string | null
          slug: string
          status: Database["public"]["Enums"]["job_status"]
          title: string
          total_positions: number | null
          updated_at: string
        }
        Insert: {
          af_ad_id?: string | null
          af_duration_cid?: string | null
          af_employment_type_cid?: string | null
          af_error?: string | null
          af_last_sync?: string | null
          af_municipality_cid?: string | null
          af_occupation_cid?: string | null
          af_published?: boolean | null
          af_published_at?: string | null
          af_wage_type_code?: string | null
          af_worktime_extent_cid?: string | null
          category?: string | null
          city?: string | null
          company_id: string
          contact_person_email?: string | null
          contact_person_name?: string | null
          contact_person_phone?: string | null
          created_at?: string
          created_by: string
          description_md?: string | null
          driver_license?: boolean | null
          employment_type?: string | null
          id?: string
          kiku_interview_url?: string | null
          language?: string | null
          last_application_date?: string | null
          publish_at?: string | null
          region?: string | null
          requirements_md?: string | null
          slug: string
          status?: Database["public"]["Enums"]["job_status"]
          title: string
          total_positions?: number | null
          updated_at?: string
        }
        Update: {
          af_ad_id?: string | null
          af_duration_cid?: string | null
          af_employment_type_cid?: string | null
          af_error?: string | null
          af_last_sync?: string | null
          af_municipality_cid?: string | null
          af_occupation_cid?: string | null
          af_published?: boolean | null
          af_published_at?: string | null
          af_wage_type_code?: string | null
          af_worktime_extent_cid?: string | null
          category?: string | null
          city?: string | null
          company_id?: string
          contact_person_email?: string | null
          contact_person_name?: string | null
          contact_person_phone?: string | null
          created_at?: string
          created_by?: string
          description_md?: string | null
          driver_license?: boolean | null
          employment_type?: string | null
          id?: string
          kiku_interview_url?: string | null
          language?: string | null
          last_application_date?: string | null
          publish_at?: string | null
          region?: string | null
          requirements_md?: string | null
          slug?: string
          status?: Database["public"]["Enums"]["job_status"]
          title?: string
          total_positions?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "jobs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_duration_fk"
            columns: ["af_duration_cid"]
            isOneToOne: false
            referencedRelation: "af_taxonomy"
            referencedColumns: ["concept_id"]
          },
          {
            foreignKeyName: "jobs_emp_type_fk"
            columns: ["af_employment_type_cid"]
            isOneToOne: false
            referencedRelation: "af_taxonomy"
            referencedColumns: ["concept_id"]
          },
          {
            foreignKeyName: "jobs_muni_fk"
            columns: ["af_municipality_cid"]
            isOneToOne: false
            referencedRelation: "af_taxonomy"
            referencedColumns: ["concept_id"]
          },
          {
            foreignKeyName: "jobs_occ_fk"
            columns: ["af_occupation_cid"]
            isOneToOne: false
            referencedRelation: "af_taxonomy"
            referencedColumns: ["concept_id"]
          },
          {
            foreignKeyName: "jobs_wte_fk"
            columns: ["af_worktime_extent_cid"]
            isOneToOne: false
            referencedRelation: "af_taxonomy"
            referencedColumns: ["concept_id"]
          },
        ]
      }
      page_content: {
        Row: {
          content_html: string
          created_at: string | null
          display_order: number | null
          id: string
          page_key: string
          section_key: string
          title: string
          updated_at: string | null
        }
        Insert: {
          content_html: string
          created_at?: string | null
          display_order?: number | null
          id?: string
          page_key: string
          section_key: string
          title: string
          updated_at?: string | null
        }
        Update: {
          content_html?: string
          created_at?: string | null
          display_order?: number | null
          id?: string
          page_key?: string
          section_key?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      pipeline_stages: {
        Row: {
          color: string
          created_at: string | null
          display_order: number
          id: string
          is_default: boolean | null
          name: string
          updated_at: string | null
        }
        Insert: {
          color?: string
          created_at?: string | null
          display_order: number
          id?: string
          is_default?: boolean | null
          name: string
          updated_at?: string | null
        }
        Update: {
          color?: string
          created_at?: string | null
          display_order?: number
          id?: string
          is_default?: boolean | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          id: string
          role: Database["public"]["Enums"]["profile_role"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id: string
          role?: Database["public"]["Enums"]["profile_role"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          role?: Database["public"]["Enums"]["profile_role"]
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
      can_access_application: {
        Args: { _application_id: string; _user_id: string }
        Returns: boolean
      }
      count_active_admins: { Args: never; Returns: number }
      enforce_application_limits: {
        Args: { p_email: string }
        Returns: undefined
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_job_creator: {
        Args: { _job_id: string; _user_id: string }
        Returns: boolean
      }
      is_job_published: {
        Args: { job: Database["public"]["Tables"]["jobs"]["Row"] }
        Returns: boolean
      }
      is_recruiter_or_admin: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "user"
      application_status: "new" | "viewed" | "booked" | "rejected"
      job_status: "draft" | "published" | "archived"
      profile_role: "recruiter" | "admin" | "user"
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
      app_role: ["admin", "user"],
      application_status: ["new", "viewed", "booked", "rejected"],
      job_status: ["draft", "published", "archived"],
      profile_role: ["recruiter", "admin", "user"],
    },
  },
} as const
