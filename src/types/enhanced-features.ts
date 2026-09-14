// LSU Researcher Types
export interface LSUResearcher {
  id: string;
  name: string;
  /** Not exposed via directory / matching RPC — optional for legacy types only */
  email?: string;
  expertise: string[];
  department: string;
  availability: 'available' | 'busy' | 'unavailable';
  research_areas: string[];
  contact_preferences: Record<string, any>;
  created_at: string;
}

export interface LSUPublication {
  id: string;
  title: string;
  authors: string[];
  year: number;
  url: string;
  crops: string[];
  topics: string[];
  key_findings: string[];
  researcher_id?: string;
  impact_score: number;
  farmer_views: number;
  created_at: string;
}

export interface FarmerResearcherInteraction {
  id: string;
  farmer_id: string;
  researcher_id: string;
  interaction_type: 'question' | 'collaboration' | 'research_participation';
  question?: string;
  response?: string;
  status: 'pending' | 'responded' | 'resolved';
  created_at: string;
}

// Conservation Analytics Types
export interface ConservationPrediction {
  id: string;
  field_id: string;
  practice_type: string;
  current_impact: number;
  predicted_impact_1_year: number;
  predicted_impact_5_year: number;
  climate_factor: number;
  soil_health_improvement: number;
  confidence_score: number;
  created_at: string;
}

export interface ConservationAdoptionMetric {
  id: string;
  practice_type: string;
  total_adopters: number;
  total_acres: number;
  average_savings: number;
  lsu_validation_score: number;
  last_updated: string;
}

// Water Stress Types
export interface WaterStressEvent {
  id: string;
  field_id: string;
  assessment_id: string;
  stress_score: number;
  severity: 'mild' | 'moderate' | 'severe';
  confidence: number;
  weather_context: Record<string, any>;
  symptoms_detected: string[];
  dirt_recommendation: boolean;
  dirt_clicked: boolean;
  irrigation_applied: boolean;
  outcome_improvement?: number;
  created_at: string;
}

export interface DIRTReferralMetric {
  id: string;
  field_id: string;
  water_stress_score: number;
  dirt_clicked: boolean;
  irrigation_scheduled: boolean;
  water_savings?: number;
  lsu_researcher_id?: string;
  created_at: string;
}

// Variety Types
export interface VarietyPerformanceMetric {
  id: string;
  field_id: string;
  variety_name: string;
  crop_type: string;
  performance_score: number;
  disease_resistance: number;
  yield_performance: number;
  input_efficiency: number;
  lsu_variety: boolean;
  lsu_researcher_id?: string;
  created_at: string;
}

export interface VarietyRecommendation {
  id: string;
  field_id: string;
  current_variety?: string;
  recommended_variety: string;
  expected_improvement: number | null;
  risk_assessment: 'low' | 'medium' | 'high' | null;
  lsu_research_basis: string[];
  created_at: string;
}

// Community Intelligence Types
export interface CommunityInsight {
  id: string;
  farmer_id: string;
  field_id: string;
  insight_type: string;
  practice: string;
  outcome: string;
  savings_achieved?: number;
  lsu_validation: boolean;
  community_rating: number;
  created_at: string;
}

export interface BestPractice {
  id: string;
  practice_name: string;
  description: string;
  lsu_research_basis: string[];
  adoption_count: number;
  success_rate: number;
  average_savings: number;
  lsu_researcher_id?: string;
  created_at: string;
}

// Predictive Analytics Types
export interface PredictiveModel {
  id: string;
  model_type: string;
  field_id: string;
  prediction_horizon: number;
  confidence_score: number;
  prediction_data: Record<string, any>;
  accuracy_score?: number;
  lsu_validation: boolean;
  created_at: string;
}

export interface PredictionOutcome {
  id: string;
  prediction_id: string;
  actual_outcome: Record<string, any>;
  accuracy_achieved: number;
  farmer_feedback?: string;
  lsu_researcher_feedback?: string;
  created_at: string;
}

export interface AnalyticsInsight {
  id: string;
  insight_type: string;
  field_id: string;
  insight_data: Record<string, any>;
  actionable_recommendations: string[];
  lsu_research_basis: string[];
  created_at: string;
}
