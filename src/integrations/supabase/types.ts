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
          archived_at: string | null
          candidate_name: string
          created_at: string
          cv_url: string | null
          email: string
          email_sent: boolean
          gdpr_consent: boolean
          gdpr_consent_timestamp: string | null
          id: string
          interview_link: string | null
          interview_notes: string | null
          interview_scheduled_at: string | null
          is_demo: boolean
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
          archived_at?: string | null
          candidate_name: string
          created_at?: string
          cv_url?: string | null
          email: string
          email_sent?: boolean
          gdpr_consent?: boolean
          gdpr_consent_timestamp?: string | null
          id?: string
          interview_link?: string | null
          interview_notes?: string | null
          interview_scheduled_at?: string | null
          is_demo?: boolean
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
          archived_at?: string | null
          candidate_name?: string
          created_at?: string
          cv_url?: string | null
          email?: string
          email_sent?: boolean
          gdpr_consent?: boolean
          gdpr_consent_timestamp?: string | null
          id?: string
          interview_link?: string | null
          interview_notes?: string | null
          interview_scheduled_at?: string | null
          is_demo?: boolean
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
      candidate_assessments: {
        Row: {
          application_id: string
          assessment_type: Database["public"]["Enums"]["assessment_type"]
          concerns: Json | null
          created_at: string
          id: string
          job_match_score: number | null
          match_score: number | null
          recommendation:
            | Database["public"]["Enums"]["screening_recommendation"]
            | null
          role_match_score: number | null
          role_profile_id: string
          soft_skills_assessment: string | null
          strengths: Json | null
          summary: string | null
          technical_assessment: string | null
          transcript_id: string
          updated_at: string
        }
        Insert: {
          application_id: string
          assessment_type: Database["public"]["Enums"]["assessment_type"]
          concerns?: Json | null
          created_at?: string
          id?: string
          job_match_score?: number | null
          match_score?: number | null
          recommendation?:
            | Database["public"]["Enums"]["screening_recommendation"]
            | null
          role_match_score?: number | null
          role_profile_id: string
          soft_skills_assessment?: string | null
          strengths?: Json | null
          summary?: string | null
          technical_assessment?: string | null
          transcript_id: string
          updated_at?: string
        }
        Update: {
          application_id?: string
          assessment_type?: Database["public"]["Enums"]["assessment_type"]
          concerns?: Json | null
          created_at?: string
          id?: string
          job_match_score?: number | null
          match_score?: number | null
          recommendation?:
            | Database["public"]["Enums"]["screening_recommendation"]
            | null
          role_match_score?: number | null
          role_profile_id?: string
          soft_skills_assessment?: string | null
          strengths?: Json | null
          summary?: string | null
          technical_assessment?: string | null
          transcript_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "candidate_assessments_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "candidate_assessments_role_profile_id_fkey"
            columns: ["role_profile_id"]
            isOneToOne: false
            referencedRelation: "role_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "candidate_assessments_transcript_id_fkey"
            columns: ["transcript_id"]
            isOneToOne: false
            referencedRelation: "candidate_transcripts"
            referencedColumns: ["id"]
          },
        ]
      }
      candidate_presentations: {
        Row: {
          application_id: string
          created_at: string
          final_assessment_id: string
          id: string
          presentation_html: string | null
          published_at: string | null
          recruiter_notes: string | null
          share_token: string | null
          skill_scores: Json | null
          soft_values_notes: string | null
          status: Database["public"]["Enums"]["presentation_status"]
          updated_at: string
        }
        Insert: {
          application_id: string
          created_at?: string
          final_assessment_id: string
          id?: string
          presentation_html?: string | null
          published_at?: string | null
          recruiter_notes?: string | null
          share_token?: string | null
          skill_scores?: Json | null
          soft_values_notes?: string | null
          status?: Database["public"]["Enums"]["presentation_status"]
          updated_at?: string
        }
        Update: {
          application_id?: string
          created_at?: string
          final_assessment_id?: string
          id?: string
          presentation_html?: string | null
          published_at?: string | null
          recruiter_notes?: string | null
          share_token?: string | null
          skill_scores?: Json | null
          soft_values_notes?: string | null
          status?: Database["public"]["Enums"]["presentation_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "candidate_presentations_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: true
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "candidate_presentations_final_assessment_id_fkey"
            columns: ["final_assessment_id"]
            isOneToOne: false
            referencedRelation: "candidate_assessments"
            referencedColumns: ["id"]
          },
        ]
      }
      candidate_transcripts: {
        Row: {
          application_id: string
          created_at: string
          id: string
          imported_at: string
          interview_type: Database["public"]["Enums"]["interview_type"]
          source: string | null
          structured_data: Json | null
          transcript_text: string
        }
        Insert: {
          application_id: string
          created_at?: string
          id?: string
          imported_at?: string
          interview_type: Database["public"]["Enums"]["interview_type"]
          source?: string | null
          structured_data?: Json | null
          transcript_text: string
        }
        Update: {
          application_id?: string
          created_at?: string
          id?: string
          imported_at?: string
          interview_type?: Database["public"]["Enums"]["interview_type"]
          source?: string | null
          structured_data?: Json | null
          transcript_text?: string
        }
        Relationships: [
          {
            foreignKeyName: "candidate_transcripts_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
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
      company_users: {
        Row: {
          calendar_url: string | null
          company_id: string
          created_at: string
          id: string
          name: string
          role: string
          user_id: string
        }
        Insert: {
          calendar_url?: string | null
          company_id: string
          created_at?: string
          id?: string
          name?: string
          role?: string
          user_id: string
        }
        Update: {
          calendar_url?: string | null
          company_id?: string
          created_at?: string
          id?: string
          name?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_users_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
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
          hide_company_in_emails: boolean
          id: string
          kiku_interview_url: string | null
          language: string | null
          last_application_date: string | null
          publish_at: string | null
          region: string | null
          requirement_profile: Json | null
          requirements_md: string | null
          slug: string
          status: Database["public"]["Enums"]["job_status"]
          title: string
          total_positions: number | null
          updated_at: string
        }
        Insert: {
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
          hide_company_in_emails?: boolean
          id?: string
          kiku_interview_url?: string | null
          language?: string | null
          last_application_date?: string | null
          publish_at?: string | null
          region?: string | null
          requirement_profile?: Json | null
          requirements_md?: string | null
          slug: string
          status?: Database["public"]["Enums"]["job_status"]
          title: string
          total_positions?: number | null
          updated_at?: string
        }
        Update: {
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
          hide_company_in_emails?: boolean
          id?: string
          kiku_interview_url?: string | null
          language?: string | null
          last_application_date?: string | null
          publish_at?: string | null
          region?: string | null
          requirement_profile?: Json | null
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
      portal_candidates: {
        Row: {
          audio_url: string | null
          created_at: string
          email: string | null
          experience_years: number | null
          id: string
          name: string
          position_id: string
          presentation_id: string | null
          presented_at: string | null
          skill_level: string | null
          status: string
          strengths: string[] | null
          summary: string | null
          video_url: string | null
        }
        Insert: {
          audio_url?: string | null
          created_at?: string
          email?: string | null
          experience_years?: number | null
          id?: string
          name: string
          position_id: string
          presentation_id?: string | null
          presented_at?: string | null
          skill_level?: string | null
          status?: string
          strengths?: string[] | null
          summary?: string | null
          video_url?: string | null
        }
        Update: {
          audio_url?: string | null
          created_at?: string
          email?: string | null
          experience_years?: number | null
          id?: string
          name?: string
          position_id?: string
          presentation_id?: string | null
          presented_at?: string | null
          skill_level?: string | null
          status?: string
          strengths?: string[] | null
          summary?: string | null
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "portal_candidates_position_id_fkey"
            columns: ["position_id"]
            isOneToOne: false
            referencedRelation: "positions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "portal_candidates_presentation_id_fkey"
            columns: ["presentation_id"]
            isOneToOne: false
            referencedRelation: "candidate_presentations"
            referencedColumns: ["id"]
          },
        ]
      }
      portal_interview_proposals: {
        Row: {
          candidate_id: string
          chosen_option: number | null
          company_user_id: string
          created_at: string
          duration_minutes: number
          id: string
          location_details: string | null
          location_type: string
          notes: string | null
          option_1_at: string
          option_2_at: string
          respond_token: string
          responded_at: string | null
          status: string
        }
        Insert: {
          candidate_id: string
          chosen_option?: number | null
          company_user_id: string
          created_at?: string
          duration_minutes?: number
          id?: string
          location_details?: string | null
          location_type?: string
          notes?: string | null
          option_1_at: string
          option_2_at: string
          respond_token?: string
          responded_at?: string | null
          status?: string
        }
        Update: {
          candidate_id?: string
          chosen_option?: number | null
          company_user_id?: string
          created_at?: string
          duration_minutes?: number
          id?: string
          location_details?: string | null
          location_type?: string
          notes?: string | null
          option_1_at?: string
          option_2_at?: string
          respond_token?: string
          responded_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "portal_interview_proposals_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "portal_candidates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "portal_interview_proposals_company_user_id_fkey"
            columns: ["company_user_id"]
            isOneToOne: false
            referencedRelation: "company_users"
            referencedColumns: ["id"]
          },
        ]
      }
      portal_interviews: {
        Row: {
          candidate_id: string
          company_user_id: string
          created_at: string
          duration_minutes: number
          email_sent: boolean | null
          id: string
          location_details: string | null
          location_type: string
          notes: string | null
          scheduled_at: string
          status: string
        }
        Insert: {
          candidate_id: string
          company_user_id: string
          created_at?: string
          duration_minutes?: number
          email_sent?: boolean | null
          id?: string
          location_details?: string | null
          location_type?: string
          notes?: string | null
          scheduled_at: string
          status?: string
        }
        Update: {
          candidate_id?: string
          company_user_id?: string
          created_at?: string
          duration_minutes?: number
          email_sent?: boolean | null
          id?: string
          location_details?: string | null
          location_type?: string
          notes?: string | null
          scheduled_at?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "portal_interviews_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "portal_candidates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "portal_interviews_company_user_id_fkey"
            columns: ["company_user_id"]
            isOneToOne: false
            referencedRelation: "company_users"
            referencedColumns: ["id"]
          },
        ]
      }
      portal_notifications: {
        Row: {
          company_user_id: string
          created_at: string
          id: string
          message: string
          read: boolean
          related_candidate_id: string | null
          title: string
          type: string
        }
        Insert: {
          company_user_id: string
          created_at?: string
          id?: string
          message?: string
          read?: boolean
          related_candidate_id?: string | null
          title: string
          type?: string
        }
        Update: {
          company_user_id?: string
          created_at?: string
          id?: string
          message?: string
          read?: boolean
          related_candidate_id?: string | null
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "portal_notifications_company_user_id_fkey"
            columns: ["company_user_id"]
            isOneToOne: false
            referencedRelation: "company_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "portal_notifications_related_candidate_id_fkey"
            columns: ["related_candidate_id"]
            isOneToOne: false
            referencedRelation: "portal_candidates"
            referencedColumns: ["id"]
          },
        ]
      }
      positions: {
        Row: {
          company_id: string
          created_at: string
          description: string | null
          experience_level: string | null
          id: string
          status: string
          title: string
        }
        Insert: {
          company_id: string
          created_at?: string
          description?: string | null
          experience_level?: string | null
          id?: string
          status?: string
          title: string
        }
        Update: {
          company_id?: string
          created_at?: string
          description?: string | null
          experience_level?: string | null
          id?: string
          status?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "positions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          first_name: string | null
          id: string
          last_name: string | null
          role: Database["public"]["Enums"]["profile_role"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          first_name?: string | null
          id: string
          last_name?: string | null
          role?: Database["public"]["Enums"]["profile_role"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          role?: Database["public"]["Enums"]["profile_role"]
          updated_at?: string
        }
        Relationships: []
      }
      requirement_templates: {
        Row: {
          created_at: string
          display_name: string
          id: string
          is_active: boolean
          role_key: string
          template_data: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_name: string
          id?: string
          is_active?: boolean
          role_key: string
          template_data?: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_name?: string
          id?: string
          is_active?: boolean
          role_key?: string
          template_data?: Json
          updated_at?: string
        }
        Relationships: []
      }
      role_profiles: {
        Row: {
          created_at: string
          description: string | null
          display_name: string
          id: string
          knowledge_areas: Json | null
          role_key: string
          screening_criteria: Json | null
          soft_skills: Json | null
          technical_skills: Json | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_name: string
          id?: string
          knowledge_areas?: Json | null
          role_key: string
          screening_criteria?: Json | null
          soft_skills?: Json | null
          technical_skills?: Json | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          display_name?: string
          id?: string
          knowledge_areas?: Json | null
          role_key?: string
          screening_criteria?: Json | null
          soft_skills?: Json | null
          technical_skills?: Json | null
          updated_at?: string
        }
        Relationships: []
      }
      saved_requirement_profiles: {
        Row: {
          company_name: string
          contact_person: string | null
          created_at: string
          created_by: string
          desired_start_date: string | null
          id: string
          linked_job_id: string | null
          profile_data: Json
          salary_range: string | null
          section_notes: Json | null
          template_id: string
          updated_at: string
        }
        Insert: {
          company_name: string
          contact_person?: string | null
          created_at?: string
          created_by: string
          desired_start_date?: string | null
          id?: string
          linked_job_id?: string | null
          profile_data?: Json
          salary_range?: string | null
          section_notes?: Json | null
          template_id: string
          updated_at?: string
        }
        Update: {
          company_name?: string
          contact_person?: string | null
          created_at?: string
          created_by?: string
          desired_start_date?: string | null
          id?: string
          linked_job_id?: string | null
          profile_data?: Json
          salary_range?: string | null
          section_notes?: Json | null
          template_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_requirement_profiles_linked_job_id_fkey"
            columns: ["linked_job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saved_requirement_profiles_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "requirement_templates"
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
      can_access_application: {
        Args: { _application_id: string; _user_id: string }
        Returns: boolean
      }
      count_active_admins: { Args: never; Returns: number }
      enforce_application_limits: {
        Args: { p_email: string }
        Returns: undefined
      }
      get_user_company_id: { Args: { _user_id: string }; Returns: string }
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
      assessment_type: "screening" | "final"
      interview_type: "screening" | "full_interview"
      job_status: "draft" | "published" | "archived" | "demo" | "inactive"
      presentation_status: "draft" | "published" | "archived"
      profile_role: "recruiter" | "admin" | "user"
      screening_recommendation: "proceed" | "maybe" | "reject"
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
      assessment_type: ["screening", "final"],
      interview_type: ["screening", "full_interview"],
      job_status: ["draft", "published", "archived", "demo", "inactive"],
      presentation_status: ["draft", "published", "archived"],
      profile_role: ["recruiter", "admin", "user"],
      screening_recommendation: ["proceed", "maybe", "reject"],
    },
  },
} as const
