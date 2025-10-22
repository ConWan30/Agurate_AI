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
      assessments: {
        Row: {
          analyzed_at: string | null
          canopy_coverage_percent: number | null
          captured_offline: boolean | null
          confidence_score: number | null
          created_at: string | null
          detailed_visual_analysis: string | null
          disease_identified: string[] | null
          estimated_yield_impact_percent: number | null
          field_id: string
          field_uniformity_score: number | null
          gps_accuracy_meters: number | null
          growth_stage: string | null
          health_score: number | null
          id: string
          image_url: string
          nutrient_deficiencies: Json | null
          pest_identified: string[] | null
          photo_location_lat: number | null
          photo_location_lng: number | null
          plant_density_assessment: string | null
          root_health_indicators: string[] | null
          severity_ratings: Json | null
          stress_level: string | null
          symptoms: string[] | null
          synced_at: string | null
          weather_precipitation_mm: number | null
          weather_temp_f: number | null
        }
        Insert: {
          analyzed_at?: string | null
          canopy_coverage_percent?: number | null
          captured_offline?: boolean | null
          confidence_score?: number | null
          created_at?: string | null
          detailed_visual_analysis?: string | null
          disease_identified?: string[] | null
          estimated_yield_impact_percent?: number | null
          field_id: string
          field_uniformity_score?: number | null
          gps_accuracy_meters?: number | null
          growth_stage?: string | null
          health_score?: number | null
          id?: string
          image_url: string
          nutrient_deficiencies?: Json | null
          pest_identified?: string[] | null
          photo_location_lat?: number | null
          photo_location_lng?: number | null
          plant_density_assessment?: string | null
          root_health_indicators?: string[] | null
          severity_ratings?: Json | null
          stress_level?: string | null
          symptoms?: string[] | null
          synced_at?: string | null
          weather_precipitation_mm?: number | null
          weather_temp_f?: number | null
        }
        Update: {
          analyzed_at?: string | null
          canopy_coverage_percent?: number | null
          captured_offline?: boolean | null
          confidence_score?: number | null
          created_at?: string | null
          detailed_visual_analysis?: string | null
          disease_identified?: string[] | null
          estimated_yield_impact_percent?: number | null
          field_id?: string
          field_uniformity_score?: number | null
          gps_accuracy_meters?: number | null
          growth_stage?: string | null
          health_score?: number | null
          id?: string
          image_url?: string
          nutrient_deficiencies?: Json | null
          pest_identified?: string[] | null
          photo_location_lat?: number | null
          photo_location_lng?: number | null
          plant_density_assessment?: string | null
          root_health_indicators?: string[] | null
          severity_ratings?: Json | null
          stress_level?: string | null
          symptoms?: string[] | null
          synced_at?: string | null
          weather_precipitation_mm?: number | null
          weather_temp_f?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "assessments_field_id_fkey"
            columns: ["field_id"]
            isOneToOne: false
            referencedRelation: "assessment_details"
            referencedColumns: ["field_id"]
          },
          {
            foreignKeyName: "assessments_field_id_fkey"
            columns: ["field_id"]
            isOneToOne: false
            referencedRelation: "fields"
            referencedColumns: ["id"]
          },
        ]
      }
      claim_assessments: {
        Row: {
          assessment_id: string
          claim_id: string
          created_at: string | null
          id: string
        }
        Insert: {
          assessment_id: string
          claim_id: string
          created_at?: string | null
          id?: string
        }
        Update: {
          assessment_id?: string
          claim_id?: string
          created_at?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "claim_assessments_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "assessment_details"
            referencedColumns: ["assessment_id"]
          },
          {
            foreignKeyName: "claim_assessments_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "claim_assessments_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "recommendation_details"
            referencedColumns: ["assessment_id"]
          },
          {
            foreignKeyName: "claim_assessments_claim_id_fkey"
            columns: ["claim_id"]
            isOneToOne: false
            referencedRelation: "insurance_claims"
            referencedColumns: ["id"]
          },
        ]
      }
      cooperative_invitations: {
        Row: {
          accepted_at: string | null
          cooperative_id: string
          created_at: string | null
          email: string
          expires_at: string | null
          id: string
          invite_code: string
          invited_by: string
          status: string | null
        }
        Insert: {
          accepted_at?: string | null
          cooperative_id: string
          created_at?: string | null
          email: string
          expires_at?: string | null
          id?: string
          invite_code?: string
          invited_by: string
          status?: string | null
        }
        Update: {
          accepted_at?: string | null
          cooperative_id?: string
          created_at?: string | null
          email?: string
          expires_at?: string | null
          id?: string
          invite_code?: string
          invited_by?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cooperative_invitations_cooperative_id_fkey"
            columns: ["cooperative_id"]
            isOneToOne: false
            referencedRelation: "cooperatives"
            referencedColumns: ["id"]
          },
        ]
      }
      cooperative_members: {
        Row: {
          cooperative_id: string
          id: string
          joined_at: string | null
          role: string
          user_id: string
        }
        Insert: {
          cooperative_id: string
          id?: string
          joined_at?: string | null
          role?: string
          user_id: string
        }
        Update: {
          cooperative_id?: string
          id?: string
          joined_at?: string | null
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cooperative_members_cooperative_id_fkey"
            columns: ["cooperative_id"]
            isOneToOne: false
            referencedRelation: "cooperatives"
            referencedColumns: ["id"]
          },
        ]
      }
      cooperatives: {
        Row: {
          created_at: string | null
          created_by: string
          description: string | null
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      delta_conversations: {
        Row: {
          created_at: string | null
          id: string
          title: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          title?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          title?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      delta_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string | null
          id: string
          role: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string | null
          id?: string
          role: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string | null
          id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "delta_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "delta_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      feedback: {
        Row: {
          assessment_id: string | null
          created_at: string | null
          id: string
          rating: number | null
          recommendation_id: string | null
          user_comment: string | null
          was_helpful: boolean | null
        }
        Insert: {
          assessment_id?: string | null
          created_at?: string | null
          id?: string
          rating?: number | null
          recommendation_id?: string | null
          user_comment?: string | null
          was_helpful?: boolean | null
        }
        Update: {
          assessment_id?: string | null
          created_at?: string | null
          id?: string
          rating?: number | null
          recommendation_id?: string | null
          user_comment?: string | null
          was_helpful?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "feedback_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "assessment_details"
            referencedColumns: ["assessment_id"]
          },
          {
            foreignKeyName: "feedback_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feedback_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "recommendation_details"
            referencedColumns: ["assessment_id"]
          },
          {
            foreignKeyName: "feedback_recommendation_id_fkey"
            columns: ["recommendation_id"]
            isOneToOne: false
            referencedRelation: "recommendation_details"
            referencedColumns: ["recommendation_id"]
          },
          {
            foreignKeyName: "feedback_recommendation_id_fkey"
            columns: ["recommendation_id"]
            isOneToOne: false
            referencedRelation: "recommendations"
            referencedColumns: ["id"]
          },
        ]
      }
      fields: {
        Row: {
          acreage: number | null
          cooperative_id: string | null
          created_at: string | null
          crop_type: string
          id: string
          location_lat: number | null
          location_lng: number | null
          name: string
          notes: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          acreage?: number | null
          cooperative_id?: string | null
          created_at?: string | null
          crop_type: string
          id?: string
          location_lat?: number | null
          location_lng?: number | null
          name: string
          notes?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          acreage?: number | null
          cooperative_id?: string | null
          created_at?: string | null
          crop_type?: string
          id?: string
          location_lat?: number | null
          location_lng?: number | null
          name?: string
          notes?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fields_cooperative_id_fkey"
            columns: ["cooperative_id"]
            isOneToOne: false
            referencedRelation: "cooperatives"
            referencedColumns: ["id"]
          },
        ]
      }
      insurance_claims: {
        Row: {
          assessment_id: string | null
          claim_number: string | null
          created_at: string | null
          description: string | null
          estimated_loss_percentage: number | null
          event_date: string
          event_type: string
          field_id: string
          id: string
          notes: string | null
          status: string | null
          submitted_at: string | null
          updated_at: string | null
        }
        Insert: {
          assessment_id?: string | null
          claim_number?: string | null
          created_at?: string | null
          description?: string | null
          estimated_loss_percentage?: number | null
          event_date: string
          event_type: string
          field_id: string
          id?: string
          notes?: string | null
          status?: string | null
          submitted_at?: string | null
          updated_at?: string | null
        }
        Update: {
          assessment_id?: string | null
          claim_number?: string | null
          created_at?: string | null
          description?: string | null
          estimated_loss_percentage?: number | null
          event_date?: string
          event_type?: string
          field_id?: string
          id?: string
          notes?: string | null
          status?: string | null
          submitted_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "insurance_claims_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "assessment_details"
            referencedColumns: ["assessment_id"]
          },
          {
            foreignKeyName: "insurance_claims_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "insurance_claims_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "recommendation_details"
            referencedColumns: ["assessment_id"]
          },
          {
            foreignKeyName: "insurance_claims_field_id_fkey"
            columns: ["field_id"]
            isOneToOne: false
            referencedRelation: "assessment_details"
            referencedColumns: ["field_id"]
          },
          {
            foreignKeyName: "insurance_claims_field_id_fkey"
            columns: ["field_id"]
            isOneToOne: false
            referencedRelation: "fields"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string | null
          farm_name: string | null
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          farm_name?: string | null
          full_name?: string | null
          id: string
          phone?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          farm_name?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      recommendations: {
        Row: {
          assessment_id: string
          category: string | null
          created_at: string | null
          id: string
          priority: string | null
          recommendation_text: string
        }
        Insert: {
          assessment_id: string
          category?: string | null
          created_at?: string | null
          id?: string
          priority?: string | null
          recommendation_text: string
        }
        Update: {
          assessment_id?: string
          category?: string | null
          created_at?: string | null
          id?: string
          priority?: string | null
          recommendation_text?: string
        }
        Relationships: [
          {
            foreignKeyName: "recommendations_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "assessment_details"
            referencedColumns: ["assessment_id"]
          },
          {
            foreignKeyName: "recommendations_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recommendations_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "recommendation_details"
            referencedColumns: ["assessment_id"]
          },
        ]
      }
      weather_events: {
        Row: {
          created_at: string | null
          description: string | null
          event_date: string
          event_type: string | null
          id: string
          location_lat: number | null
          location_lng: number | null
          precipitation_inches: number | null
          temperature_f: number | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          event_date: string
          event_type?: string | null
          id?: string
          location_lat?: number | null
          location_lng?: number | null
          precipitation_inches?: number | null
          temperature_f?: number | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          event_date?: string
          event_type?: string | null
          id?: string
          location_lat?: number | null
          location_lng?: number | null
          precipitation_inches?: number | null
          temperature_f?: number | null
        }
        Relationships: []
      }
    }
    Views: {
      assessment_details: {
        Row: {
          acreage: number | null
          analyzed_at: string | null
          assessment_id: string | null
          confidence_score: number | null
          crop_type: string | null
          farm_name: string | null
          farmer_name: string | null
          field_id: string | null
          field_name: string | null
          health_score: number | null
          image_url: string | null
          location_lat: number | null
          location_lng: number | null
          stress_level: string | null
          symptoms: string[] | null
          user_id: string | null
          weather_precipitation_mm: number | null
          weather_temp_f: number | null
        }
        Relationships: []
      }
      recommendation_details: {
        Row: {
          assessment_id: string | null
          category: string | null
          created_at: string | null
          crop_type: string | null
          field_name: string | null
          health_score: number | null
          priority: string | null
          recommendation_id: string | null
          recommendation_text: string | null
          stress_level: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      can_view_invitation: {
        Args: { inv_id: string; user_id: string }
        Returns: boolean
      }
      is_cooperative_admin: {
        Args: { coop_id: string; user_id: string }
        Returns: boolean
      }
      is_cooperative_member: {
        Args: { coop_id: string; user_id: string }
        Returns: boolean
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
