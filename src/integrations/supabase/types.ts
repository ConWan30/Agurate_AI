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
      ai_intelligence_pool: {
        Row: {
          community_patterns: Json
          confidence_scores: Json
          conservation_effectiveness: Json
          created_at: string | null
          field_id: string
          id: string
          image_analysis_patterns: Json
          predictive_insights: Json
          snapshot_date: string | null
          updated_at: string | null
          variety_intelligence: Json
          weather_correlations: Json
        }
        Insert: {
          community_patterns?: Json
          confidence_scores?: Json
          conservation_effectiveness?: Json
          created_at?: string | null
          field_id: string
          id?: string
          image_analysis_patterns?: Json
          predictive_insights?: Json
          snapshot_date?: string | null
          updated_at?: string | null
          variety_intelligence?: Json
          weather_correlations?: Json
        }
        Update: {
          community_patterns?: Json
          confidence_scores?: Json
          conservation_effectiveness?: Json
          created_at?: string | null
          field_id?: string
          id?: string
          image_analysis_patterns?: Json
          predictive_insights?: Json
          snapshot_date?: string | null
          updated_at?: string | null
          variety_intelligence?: Json
          weather_correlations?: Json
        }
        Relationships: [
          {
            foreignKeyName: "ai_intelligence_pool_field_id_fkey"
            columns: ["field_id"]
            isOneToOne: false
            referencedRelation: "fields"
            referencedColumns: ["id"]
          },
        ]
      }
      alert_acknowledgments: {
        Row: {
          acknowledged_at: string | null
          alert_id: string
          alert_type: string
          id: string
          user_id: string
        }
        Insert: {
          acknowledged_at?: string | null
          alert_id: string
          alert_type: string
          id?: string
          user_id: string
        }
        Update: {
          acknowledged_at?: string | null
          alert_id?: string
          alert_type?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      analytics_insights: {
        Row: {
          actionable_recommendations: string[]
          created_at: string | null
          field_id: string
          id: string
          insight_data: Json
          insight_type: string
          lsu_research_basis: string[]
        }
        Insert: {
          actionable_recommendations: string[]
          created_at?: string | null
          field_id: string
          id?: string
          insight_data: Json
          insight_type: string
          lsu_research_basis: string[]
        }
        Update: {
          actionable_recommendations?: string[]
          created_at?: string | null
          field_id?: string
          id?: string
          insight_data?: Json
          insight_type?: string
          lsu_research_basis?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "analytics_insights_field_id_fkey"
            columns: ["field_id"]
            isOneToOne: false
            referencedRelation: "fields"
            referencedColumns: ["id"]
          },
        ]
      }
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
            referencedRelation: "fields"
            referencedColumns: ["id"]
          },
        ]
      }
      best_practices_network: {
        Row: {
          adoption_count: number | null
          average_savings: number | null
          created_at: string | null
          description: string
          id: string
          lsu_research_basis: string[]
          lsu_researcher_id: string | null
          practice_name: string
          success_rate: number | null
        }
        Insert: {
          adoption_count?: number | null
          average_savings?: number | null
          created_at?: string | null
          description: string
          id?: string
          lsu_research_basis: string[]
          lsu_researcher_id?: string | null
          practice_name: string
          success_rate?: number | null
        }
        Update: {
          adoption_count?: number | null
          average_savings?: number | null
          created_at?: string | null
          description?: string
          id?: string
          lsu_research_basis?: string[]
          lsu_researcher_id?: string | null
          practice_name?: string
          success_rate?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "best_practices_network_lsu_researcher_id_fkey"
            columns: ["lsu_researcher_id"]
            isOneToOne: false
            referencedRelation: "lsu_researchers"
            referencedColumns: ["id"]
          },
        ]
      }
      beta_feedback: {
        Row: {
          category: string
          created_at: string | null
          feature_context: string | null
          id: string
          message: string
          rating: number
          user_id: string
        }
        Insert: {
          category: string
          created_at?: string | null
          feature_context?: string | null
          id?: string
          message: string
          rating: number
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string | null
          feature_context?: string | null
          id?: string
          message?: string
          rating?: number
          user_id?: string
        }
        Relationships: []
      }
      bug_reports: {
        Row: {
          created_at: string | null
          description: string
          id: string
          page_url: string | null
          screenshot_url: string | null
          status: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          description: string
          id?: string
          page_url?: string | null
          screenshot_url?: string | null
          status?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          description?: string
          id?: string
          page_url?: string | null
          screenshot_url?: string | null
          status?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
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
      community_insights: {
        Row: {
          community_rating: number | null
          created_at: string | null
          farmer_id: string
          field_id: string
          id: string
          insight_type: string
          lsu_validation: boolean | null
          outcome: string
          practice: string
          savings_achieved: number | null
        }
        Insert: {
          community_rating?: number | null
          created_at?: string | null
          farmer_id: string
          field_id: string
          id?: string
          insight_type: string
          lsu_validation?: boolean | null
          outcome: string
          practice: string
          savings_achieved?: number | null
        }
        Update: {
          community_rating?: number | null
          created_at?: string | null
          farmer_id?: string
          field_id?: string
          id?: string
          insight_type?: string
          lsu_validation?: boolean | null
          outcome?: string
          practice?: string
          savings_achieved?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "community_insights_field_id_fkey"
            columns: ["field_id"]
            isOneToOne: false
            referencedRelation: "fields"
            referencedColumns: ["id"]
          },
        ]
      }
      conservation_adoption_metrics: {
        Row: {
          average_savings: number | null
          id: string
          last_updated: string | null
          lsu_validation_score: number | null
          practice_type: string
          total_acres: number | null
          total_adopters: number | null
        }
        Insert: {
          average_savings?: number | null
          id?: string
          last_updated?: string | null
          lsu_validation_score?: number | null
          practice_type: string
          total_acres?: number | null
          total_adopters?: number | null
        }
        Update: {
          average_savings?: number | null
          id?: string
          last_updated?: string | null
          lsu_validation_score?: number | null
          practice_type?: string
          total_acres?: number | null
          total_adopters?: number | null
        }
        Relationships: []
      }
      conservation_predictions: {
        Row: {
          climate_factor: number
          confidence_score: number
          created_at: string | null
          current_impact: number
          field_id: string
          id: string
          practice_type: string
          predicted_impact_1_year: number
          predicted_impact_5_year: number
          soil_health_improvement: number
        }
        Insert: {
          climate_factor: number
          confidence_score: number
          created_at?: string | null
          current_impact: number
          field_id: string
          id?: string
          practice_type: string
          predicted_impact_1_year: number
          predicted_impact_5_year: number
          soil_health_improvement: number
        }
        Update: {
          climate_factor?: number
          confidence_score?: number
          created_at?: string | null
          current_impact?: number
          field_id?: string
          id?: string
          practice_type?: string
          predicted_impact_1_year?: number
          predicted_impact_5_year?: number
          soil_health_improvement?: number
        }
        Relationships: [
          {
            foreignKeyName: "conservation_predictions_field_id_fkey"
            columns: ["field_id"]
            isOneToOne: false
            referencedRelation: "fields"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_memory: {
        Row: {
          context_data: Json
          context_type: string
          conversation_id: string
          created_at: string | null
          id: string
          last_referenced_at: string | null
          relevance_score: number | null
          user_id: string
        }
        Insert: {
          context_data?: Json
          context_type: string
          conversation_id: string
          created_at?: string | null
          id?: string
          last_referenced_at?: string | null
          relevance_score?: number | null
          user_id: string
        }
        Update: {
          context_data?: Json
          context_type?: string
          conversation_id?: string
          created_at?: string | null
          id?: string
          last_referenced_at?: string | null
          relevance_score?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_memory_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "delta_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      conversational_form_messages: {
        Row: {
          content: string
          created_at: string | null
          field_mapping: Json | null
          id: string
          role: string
          session_id: string
          validation_status: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          field_mapping?: Json | null
          id?: string
          role: string
          session_id: string
          validation_status?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          field_mapping?: Json | null
          id?: string
          role?: string
          session_id?: string
          validation_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conversational_form_messages_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "conversational_form_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      conversational_form_sessions: {
        Row: {
          abandoned_at: string | null
          completed_at: string | null
          completion_percentage: number | null
          context_data: Json | null
          created_at: string | null
          extracted_data: Json | null
          form_type: string
          id: string
          started_at: string | null
          status: string
          user_id: string
        }
        Insert: {
          abandoned_at?: string | null
          completed_at?: string | null
          completion_percentage?: number | null
          context_data?: Json | null
          created_at?: string | null
          extracted_data?: Json | null
          form_type: string
          id?: string
          started_at?: string | null
          status?: string
          user_id: string
        }
        Update: {
          abandoned_at?: string | null
          completed_at?: string | null
          completion_percentage?: number | null
          context_data?: Json | null
          created_at?: string | null
          extracted_data?: Json | null
          form_type?: string
          id?: string
          started_at?: string | null
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      cooperative_alerts: {
        Row: {
          affected_area_acres: number | null
          alert_type: string
          cooperative_id: string
          created_at: string | null
          created_by: string
          crop_type: string | null
          field_id: string | null
          id: string
          message: string
          recommended_action: string | null
          resolved_at: string | null
          severity: string
          status: string
          title: string
        }
        Insert: {
          affected_area_acres?: number | null
          alert_type: string
          cooperative_id: string
          created_at?: string | null
          created_by: string
          crop_type?: string | null
          field_id?: string | null
          id?: string
          message: string
          recommended_action?: string | null
          resolved_at?: string | null
          severity?: string
          status?: string
          title: string
        }
        Update: {
          affected_area_acres?: number | null
          alert_type?: string
          cooperative_id?: string
          created_at?: string | null
          created_by?: string
          crop_type?: string | null
          field_id?: string | null
          id?: string
          message?: string
          recommended_action?: string | null
          resolved_at?: string | null
          severity?: string
          status?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "cooperative_alerts_cooperative_id_fkey"
            columns: ["cooperative_id"]
            isOneToOne: false
            referencedRelation: "cooperatives"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cooperative_alerts_field_id_fkey"
            columns: ["field_id"]
            isOneToOne: false
            referencedRelation: "fields"
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
      critical_alerts: {
        Row: {
          acknowledged: boolean | null
          acknowledged_at: string | null
          alert_type: string
          assessment_id: string | null
          created_at: string | null
          estimated_loss_usd: number | null
          field_id: string | null
          id: string
          message: string
          severity: string
          sms_sent: boolean | null
          title: string
          urgency_score: number
          voice_call_attempted: boolean | null
        }
        Insert: {
          acknowledged?: boolean | null
          acknowledged_at?: string | null
          alert_type: string
          assessment_id?: string | null
          created_at?: string | null
          estimated_loss_usd?: number | null
          field_id?: string | null
          id?: string
          message: string
          severity?: string
          sms_sent?: boolean | null
          title: string
          urgency_score: number
          voice_call_attempted?: boolean | null
        }
        Update: {
          acknowledged?: boolean | null
          acknowledged_at?: string | null
          alert_type?: string
          assessment_id?: string | null
          created_at?: string | null
          estimated_loss_usd?: number | null
          field_id?: string | null
          id?: string
          message?: string
          severity?: string
          sms_sent?: boolean | null
          title?: string
          urgency_score?: number
          voice_call_attempted?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "critical_alerts_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "assessment_details"
            referencedColumns: ["assessment_id"]
          },
          {
            foreignKeyName: "critical_alerts_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "critical_alerts_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "recommendation_details"
            referencedColumns: ["assessment_id"]
          },
          {
            foreignKeyName: "critical_alerts_field_id_fkey"
            columns: ["field_id"]
            isOneToOne: false
            referencedRelation: "fields"
            referencedColumns: ["id"]
          },
        ]
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
      dirt_referral_metrics: {
        Row: {
          created_at: string | null
          dirt_clicked: boolean | null
          field_id: string
          id: string
          irrigation_scheduled: boolean | null
          lsu_researcher_id: string | null
          water_savings: number | null
          water_stress_score: number
        }
        Insert: {
          created_at?: string | null
          dirt_clicked?: boolean | null
          field_id: string
          id?: string
          irrigation_scheduled?: boolean | null
          lsu_researcher_id?: string | null
          water_savings?: number | null
          water_stress_score: number
        }
        Update: {
          created_at?: string | null
          dirt_clicked?: boolean | null
          field_id?: string
          id?: string
          irrigation_scheduled?: boolean | null
          lsu_researcher_id?: string | null
          water_savings?: number | null
          water_stress_score?: number
        }
        Relationships: [
          {
            foreignKeyName: "dirt_referral_metrics_field_id_fkey"
            columns: ["field_id"]
            isOneToOne: false
            referencedRelation: "fields"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dirt_referral_metrics_lsu_researcher_id_fkey"
            columns: ["lsu_researcher_id"]
            isOneToOne: false
            referencedRelation: "lsu_researchers"
            referencedColumns: ["id"]
          },
        ]
      }
      expert_consultations: {
        Row: {
          assessment_id: string | null
          created_at: string | null
          farmer_id: string
          field_id: string | null
          id: string
          priority: string
          question: string
          researcher_id: string
          responded_at: string | null
          response: string | null
          status: string
        }
        Insert: {
          assessment_id?: string | null
          created_at?: string | null
          farmer_id: string
          field_id?: string | null
          id?: string
          priority?: string
          question: string
          researcher_id: string
          responded_at?: string | null
          response?: string | null
          status?: string
        }
        Update: {
          assessment_id?: string | null
          created_at?: string | null
          farmer_id?: string
          field_id?: string | null
          id?: string
          priority?: string
          question?: string
          researcher_id?: string
          responded_at?: string | null
          response?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "expert_consultations_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "assessment_details"
            referencedColumns: ["assessment_id"]
          },
          {
            foreignKeyName: "expert_consultations_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expert_consultations_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "recommendation_details"
            referencedColumns: ["assessment_id"]
          },
          {
            foreignKeyName: "expert_consultations_field_id_fkey"
            columns: ["field_id"]
            isOneToOne: false
            referencedRelation: "fields"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expert_consultations_researcher_id_fkey"
            columns: ["researcher_id"]
            isOneToOne: false
            referencedRelation: "lsu_researchers"
            referencedColumns: ["id"]
          },
        ]
      }
      farmer_researcher_interactions: {
        Row: {
          created_at: string | null
          farmer_id: string
          id: string
          interaction_type: string
          question: string | null
          researcher_id: string
          response: string | null
          status: string | null
        }
        Insert: {
          created_at?: string | null
          farmer_id: string
          id?: string
          interaction_type: string
          question?: string | null
          researcher_id: string
          response?: string | null
          status?: string | null
        }
        Update: {
          created_at?: string | null
          farmer_id?: string
          id?: string
          interaction_type?: string
          question?: string | null
          researcher_id?: string
          response?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "farmer_researcher_interactions_researcher_id_fkey"
            columns: ["researcher_id"]
            isOneToOne: false
            referencedRelation: "lsu_researchers"
            referencedColumns: ["id"]
          },
        ]
      }
      farmer_testimonials: {
        Row: {
          approved: boolean | null
          created_at: string | null
          farm_location: string | null
          farmer_name: string
          feature_mentioned: string[] | null
          id: string
          roi_achieved: number | null
          testimonial_text: string
        }
        Insert: {
          approved?: boolean | null
          created_at?: string | null
          farm_location?: string | null
          farmer_name: string
          feature_mentioned?: string[] | null
          id?: string
          roi_achieved?: number | null
          testimonial_text: string
        }
        Update: {
          approved?: boolean | null
          created_at?: string | null
          farm_location?: string | null
          farmer_name?: string
          feature_mentioned?: string[] | null
          id?: string
          roi_achieved?: number | null
          testimonial_text?: string
        }
        Relationships: []
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
          corn_hybrid: string | null
          cotton_variety: string | null
          created_at: string | null
          crop_type: string
          id: string
          location_lat: number | null
          location_lng: number | null
          name: string
          notes: string | null
          rice_variety: string | null
          soybean_variety: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          acreage?: number | null
          cooperative_id?: string | null
          corn_hybrid?: string | null
          cotton_variety?: string | null
          created_at?: string | null
          crop_type: string
          id?: string
          location_lat?: number | null
          location_lng?: number | null
          name: string
          notes?: string | null
          rice_variety?: string | null
          soybean_variety?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          acreage?: number | null
          cooperative_id?: string | null
          corn_hybrid?: string | null
          cotton_variety?: string | null
          created_at?: string | null
          crop_type?: string
          id?: string
          location_lat?: number | null
          location_lng?: number | null
          name?: string
          notes?: string | null
          rice_variety?: string | null
          soybean_variety?: string | null
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
      form_completion_analytics: {
        Row: {
          completion_time_seconds: number | null
          created_at: string | null
          form_type: string
          id: string
          message_count: number | null
          session_id: string
          success: boolean | null
        }
        Insert: {
          completion_time_seconds?: number | null
          created_at?: string | null
          form_type: string
          id?: string
          message_count?: number | null
          session_id: string
          success?: boolean | null
        }
        Update: {
          completion_time_seconds?: number | null
          created_at?: string | null
          form_type?: string
          id?: string
          message_count?: number | null
          session_id?: string
          success?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "form_completion_analytics_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "conversational_form_sessions"
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
            referencedRelation: "fields"
            referencedColumns: ["id"]
          },
        ]
      }
      lsu_publications: {
        Row: {
          authors: string[]
          created_at: string | null
          crops: string[]
          farmer_views: number | null
          id: string
          impact_score: number | null
          key_findings: string[]
          researcher_id: string | null
          title: string
          topics: string[]
          url: string
          year: number
        }
        Insert: {
          authors: string[]
          created_at?: string | null
          crops: string[]
          farmer_views?: number | null
          id: string
          impact_score?: number | null
          key_findings: string[]
          researcher_id?: string | null
          title: string
          topics: string[]
          url: string
          year: number
        }
        Update: {
          authors?: string[]
          created_at?: string | null
          crops?: string[]
          farmer_views?: number | null
          id?: string
          impact_score?: number | null
          key_findings?: string[]
          researcher_id?: string | null
          title?: string
          topics?: string[]
          url?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "lsu_publications_researcher_id_fkey"
            columns: ["researcher_id"]
            isOneToOne: false
            referencedRelation: "lsu_researchers"
            referencedColumns: ["id"]
          },
        ]
      }
      lsu_researchers: {
        Row: {
          availability: string | null
          contact_preferences: Json | null
          created_at: string | null
          department: string
          email: string
          expertise: string[]
          id: string
          name: string
          research_areas: string[]
        }
        Insert: {
          availability?: string | null
          contact_preferences?: Json | null
          created_at?: string | null
          department: string
          email: string
          expertise: string[]
          id?: string
          name: string
          research_areas: string[]
        }
        Update: {
          availability?: string | null
          contact_preferences?: Json | null
          created_at?: string | null
          department?: string
          email?: string
          expertise?: string[]
          id?: string
          name?: string
          research_areas?: string[]
        }
        Relationships: []
      }
      peer_treatment_outcomes: {
        Row: {
          applied_at: string
          cost_usd: number | null
          created_at: string | null
          crop_type: string
          effectiveness_score: number | null
          evaluated_at: string
          farmer_id: string
          field_id: string
          id: string
          notes: string | null
          outcome: string
          problem_addressed: string
          recommendation_id: string | null
          treatment_type: string
        }
        Insert: {
          applied_at: string
          cost_usd?: number | null
          created_at?: string | null
          crop_type: string
          effectiveness_score?: number | null
          evaluated_at: string
          farmer_id: string
          field_id: string
          id?: string
          notes?: string | null
          outcome: string
          problem_addressed: string
          recommendation_id?: string | null
          treatment_type: string
        }
        Update: {
          applied_at?: string
          cost_usd?: number | null
          created_at?: string | null
          crop_type?: string
          effectiveness_score?: number | null
          evaluated_at?: string
          farmer_id?: string
          field_id?: string
          id?: string
          notes?: string | null
          outcome?: string
          problem_addressed?: string
          recommendation_id?: string | null
          treatment_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "peer_treatment_outcomes_field_id_fkey"
            columns: ["field_id"]
            isOneToOne: false
            referencedRelation: "fields"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "peer_treatment_outcomes_recommendation_id_fkey"
            columns: ["recommendation_id"]
            isOneToOne: false
            referencedRelation: "recommendation_details"
            referencedColumns: ["recommendation_id"]
          },
          {
            foreignKeyName: "peer_treatment_outcomes_recommendation_id_fkey"
            columns: ["recommendation_id"]
            isOneToOne: false
            referencedRelation: "recommendations"
            referencedColumns: ["id"]
          },
        ]
      }
      prediction_outcomes: {
        Row: {
          accuracy_achieved: number
          actual_outcome: Json
          created_at: string | null
          farmer_feedback: string | null
          id: string
          lsu_researcher_feedback: string | null
          prediction_id: string
        }
        Insert: {
          accuracy_achieved: number
          actual_outcome: Json
          created_at?: string | null
          farmer_feedback?: string | null
          id?: string
          lsu_researcher_feedback?: string | null
          prediction_id: string
        }
        Update: {
          accuracy_achieved?: number
          actual_outcome?: Json
          created_at?: string | null
          farmer_feedback?: string | null
          id?: string
          lsu_researcher_feedback?: string | null
          prediction_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "prediction_outcomes_prediction_id_fkey"
            columns: ["prediction_id"]
            isOneToOne: false
            referencedRelation: "predictive_models"
            referencedColumns: ["id"]
          },
        ]
      }
      predictive_models: {
        Row: {
          accuracy_score: number | null
          confidence_score: number
          created_at: string | null
          field_id: string
          id: string
          lsu_validation: boolean | null
          model_type: string
          prediction_data: Json
          prediction_horizon: number
        }
        Insert: {
          accuracy_score?: number | null
          confidence_score: number
          created_at?: string | null
          field_id: string
          id?: string
          lsu_validation?: boolean | null
          model_type: string
          prediction_data: Json
          prediction_horizon: number
        }
        Update: {
          accuracy_score?: number | null
          confidence_score?: number
          created_at?: string | null
          field_id?: string
          id?: string
          lsu_validation?: boolean | null
          model_type?: string
          prediction_data?: Json
          prediction_horizon?: number
        }
        Relationships: [
          {
            foreignKeyName: "predictive_models_field_id_fkey"
            columns: ["field_id"]
            isOneToOne: false
            referencedRelation: "fields"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          beta_farmer: boolean | null
          beta_feedback_provided: boolean | null
          beta_signup_date: string | null
          beta_welcome_dismissed: boolean | null
          beta_welcome_shown: boolean | null
          created_at: string | null
          email: string | null
          farm_name: string | null
          full_name: string | null
          id: string
          lifetime_discount: number | null
          onboarding_completed: boolean | null
          onboarding_completed_at: string | null
          parish: string | null
          phone: string | null
          primary_crops: string[] | null
          subscription_status: string | null
          subscription_tier: string | null
          total_acreage: number | null
          updated_at: string | null
        }
        Insert: {
          beta_farmer?: boolean | null
          beta_feedback_provided?: boolean | null
          beta_signup_date?: string | null
          beta_welcome_dismissed?: boolean | null
          beta_welcome_shown?: boolean | null
          created_at?: string | null
          email?: string | null
          farm_name?: string | null
          full_name?: string | null
          id: string
          lifetime_discount?: number | null
          onboarding_completed?: boolean | null
          onboarding_completed_at?: string | null
          parish?: string | null
          phone?: string | null
          primary_crops?: string[] | null
          subscription_status?: string | null
          subscription_tier?: string | null
          total_acreage?: number | null
          updated_at?: string | null
        }
        Update: {
          beta_farmer?: boolean | null
          beta_feedback_provided?: boolean | null
          beta_signup_date?: string | null
          beta_welcome_dismissed?: boolean | null
          beta_welcome_shown?: boolean | null
          created_at?: string | null
          email?: string | null
          farm_name?: string | null
          full_name?: string | null
          id?: string
          lifetime_discount?: number | null
          onboarding_completed?: boolean | null
          onboarding_completed_at?: string | null
          parish?: string | null
          phone?: string | null
          primary_crops?: string[] | null
          subscription_status?: string | null
          subscription_tier?: string | null
          total_acreage?: number | null
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
      request_logs: {
        Row: {
          created_at: string | null
          function_name: string
          id: string
          ip_address: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          function_name: string
          id?: string
          ip_address?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          function_name?: string
          id?: string
          ip_address?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      success_stories: {
        Row: {
          acres_protected: number | null
          action_taken: string
          allow_farm_name: boolean | null
          allow_name: boolean | null
          allow_public_use: boolean | null
          assessment_id: string | null
          created_at: string | null
          estimated_savings: number | null
          id: string
          outcome: string
          problem_encountered: string
          testimonial: string
          user_id: string
        }
        Insert: {
          acres_protected?: number | null
          action_taken: string
          allow_farm_name?: boolean | null
          allow_name?: boolean | null
          allow_public_use?: boolean | null
          assessment_id?: string | null
          created_at?: string | null
          estimated_savings?: number | null
          id?: string
          outcome: string
          problem_encountered: string
          testimonial: string
          user_id: string
        }
        Update: {
          acres_protected?: number | null
          action_taken?: string
          allow_farm_name?: boolean | null
          allow_name?: boolean | null
          allow_public_use?: boolean | null
          assessment_id?: string | null
          created_at?: string | null
          estimated_savings?: number | null
          id?: string
          outcome?: string
          problem_encountered?: string
          testimonial?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "success_stories_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "assessment_details"
            referencedColumns: ["assessment_id"]
          },
          {
            foreignKeyName: "success_stories_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "success_stories_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "recommendation_details"
            referencedColumns: ["assessment_id"]
          },
        ]
      }
      tutorial_completions: {
        Row: {
          action: string | null
          completed_at: string | null
          id: string
          step_id: string | null
          time_spent_seconds: number | null
          tutorial_id: string
          user_id: string
        }
        Insert: {
          action?: string | null
          completed_at?: string | null
          id?: string
          step_id?: string | null
          time_spent_seconds?: number | null
          tutorial_id: string
          user_id: string
        }
        Update: {
          action?: string | null
          completed_at?: string | null
          id?: string
          step_id?: string | null
          time_spent_seconds?: number | null
          tutorial_id?: string
          user_id?: string
        }
        Relationships: []
      }
      tutorial_feedback: {
        Row: {
          comment: string | null
          created_at: string | null
          id: string
          rating: number | null
          tutorial_id: string
          user_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string | null
          id?: string
          rating?: number | null
          tutorial_id: string
          user_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string | null
          id?: string
          rating?: number | null
          tutorial_id?: string
          user_id?: string
        }
        Relationships: []
      }
      variety_performance_metrics: {
        Row: {
          created_at: string | null
          crop_type: string
          disease_resistance: number
          field_id: string
          id: string
          input_efficiency: number
          lsu_researcher_id: string | null
          lsu_variety: boolean | null
          performance_score: number
          variety_name: string
          yield_performance: number
        }
        Insert: {
          created_at?: string | null
          crop_type: string
          disease_resistance: number
          field_id: string
          id?: string
          input_efficiency: number
          lsu_researcher_id?: string | null
          lsu_variety?: boolean | null
          performance_score: number
          variety_name: string
          yield_performance: number
        }
        Update: {
          created_at?: string | null
          crop_type?: string
          disease_resistance?: number
          field_id?: string
          id?: string
          input_efficiency?: number
          lsu_researcher_id?: string | null
          lsu_variety?: boolean | null
          performance_score?: number
          variety_name?: string
          yield_performance?: number
        }
        Relationships: [
          {
            foreignKeyName: "variety_performance_metrics_field_id_fkey"
            columns: ["field_id"]
            isOneToOne: false
            referencedRelation: "fields"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "variety_performance_metrics_lsu_researcher_id_fkey"
            columns: ["lsu_researcher_id"]
            isOneToOne: false
            referencedRelation: "lsu_researchers"
            referencedColumns: ["id"]
          },
        ]
      }
      variety_recommendations: {
        Row: {
          created_at: string | null
          current_variety: string | null
          expected_improvement: number
          field_id: string
          id: string
          lsu_research_basis: string[]
          recommended_variety: string
          risk_assessment: string
        }
        Insert: {
          created_at?: string | null
          current_variety?: string | null
          expected_improvement: number
          field_id: string
          id?: string
          lsu_research_basis: string[]
          recommended_variety: string
          risk_assessment: string
        }
        Update: {
          created_at?: string | null
          current_variety?: string | null
          expected_improvement?: number
          field_id?: string
          id?: string
          lsu_research_basis?: string[]
          recommended_variety?: string
          risk_assessment?: string
        }
        Relationships: [
          {
            foreignKeyName: "variety_recommendations_field_id_fkey"
            columns: ["field_id"]
            isOneToOne: false
            referencedRelation: "fields"
            referencedColumns: ["id"]
          },
        ]
      }
      water_stress_events: {
        Row: {
          assessment_id: string
          confidence: number
          created_at: string | null
          dirt_clicked: boolean | null
          dirt_recommendation: boolean | null
          field_id: string
          id: string
          irrigation_applied: boolean | null
          outcome_improvement: number | null
          severity: string
          stress_score: number
          symptoms_detected: string[]
          weather_context: Json
        }
        Insert: {
          assessment_id: string
          confidence: number
          created_at?: string | null
          dirt_clicked?: boolean | null
          dirt_recommendation?: boolean | null
          field_id: string
          id?: string
          irrigation_applied?: boolean | null
          outcome_improvement?: number | null
          severity: string
          stress_score: number
          symptoms_detected: string[]
          weather_context: Json
        }
        Update: {
          assessment_id?: string
          confidence?: number
          created_at?: string | null
          dirt_clicked?: boolean | null
          dirt_recommendation?: boolean | null
          field_id?: string
          id?: string
          irrigation_applied?: boolean | null
          outcome_improvement?: number | null
          severity?: string
          stress_score?: number
          symptoms_detected?: string[]
          weather_context?: Json
        }
        Relationships: [
          {
            foreignKeyName: "water_stress_events_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "assessment_details"
            referencedColumns: ["assessment_id"]
          },
          {
            foreignKeyName: "water_stress_events_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "water_stress_events_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "recommendation_details"
            referencedColumns: ["assessment_id"]
          },
          {
            foreignKeyName: "water_stress_events_field_id_fkey"
            columns: ["field_id"]
            isOneToOne: false
            referencedRelation: "fields"
            referencedColumns: ["id"]
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
      active_cooperative_alerts: {
        Row: {
          affected_area_acres: number | null
          alert_type: string | null
          cooperative_id: string | null
          cooperative_name: string | null
          created_at: string | null
          created_by: string | null
          created_by_name: string | null
          crop_type: string | null
          field_id: string | null
          field_name: string | null
          id: string | null
          message: string | null
          recommended_action: string | null
          resolved_at: string | null
          severity: string | null
          status: string | null
          title: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cooperative_alerts_cooperative_id_fkey"
            columns: ["cooperative_id"]
            isOneToOne: false
            referencedRelation: "cooperatives"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cooperative_alerts_field_id_fkey"
            columns: ["field_id"]
            isOneToOne: false
            referencedRelation: "fields"
            referencedColumns: ["id"]
          },
        ]
      }
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
          photo_location_lat: number | null
          photo_location_lng: number | null
          stress_level: string | null
          symptoms: string[] | null
          user_id: string | null
          weather_precipitation_mm: number | null
          weather_temp_f: number | null
        }
        Relationships: [
          {
            foreignKeyName: "assessments_field_id_fkey"
            columns: ["field_id"]
            isOneToOne: false
            referencedRelation: "fields"
            referencedColumns: ["id"]
          },
        ]
      }
      beta_metrics: {
        Row: {
          active_users_30d: number | null
          active_users_7d: number | null
          avg_rating: number | null
          completed_onboarding: number | null
          feedback_count: number | null
          public_success_stories: number | null
          total_assessments: number | null
          total_signups: number | null
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
      unacknowledged_critical_alerts: {
        Row: {
          acknowledged: boolean | null
          acknowledged_at: string | null
          alert_type: string | null
          assessment_id: string | null
          created_at: string | null
          crop_type: string | null
          estimated_loss_usd: number | null
          field_id: string | null
          field_name: string | null
          id: string | null
          message: string | null
          severity: string | null
          sms_sent: boolean | null
          title: string | null
          urgency_score: number | null
          voice_call_attempted: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "critical_alerts_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "assessment_details"
            referencedColumns: ["assessment_id"]
          },
          {
            foreignKeyName: "critical_alerts_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "critical_alerts_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "recommendation_details"
            referencedColumns: ["assessment_id"]
          },
          {
            foreignKeyName: "critical_alerts_field_id_fkey"
            columns: ["field_id"]
            isOneToOne: false
            referencedRelation: "fields"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      acknowledge_cooperative_alert: {
        Args: { alert_id: string }
        Returns: undefined
      }
      acknowledge_critical_alert: {
        Args: { alert_id: string }
        Returns: undefined
      }
      can_view_invitation: {
        Args: { inv_id: string; user_id: string }
        Returns: boolean
      }
      cleanup_old_request_logs: { Args: never; Returns: undefined }
      find_matching_researcher: {
        Args: { p_crop_type: string; p_issue_type: string }
        Returns: {
          availability: string
          department: string
          email: string
          expertise: string[]
          id: string
          name: string
        }[]
      }
      get_beta_farmer_count: { Args: never; Returns: number }
      get_conversation_memory: {
        Args: { p_conversation_id: string; p_user_id: string }
        Returns: {
          context_data: Json
          context_type: string
          id: string
          last_referenced_at: string
          relevance_score: number
        }[]
      }
      get_peer_comparison: {
        Args: { p_crop_type: string; p_field_id: string; p_problem: string }
        Returns: {
          avg_effectiveness: number
          sample_size: number
          success_rate: number
          treatment_type: string
        }[]
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
