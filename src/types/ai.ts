/**
 * AI and Unified Intelligence Type Definitions
 * Types for AI analysis, unified context, and intelligence pool
 */

import type { Field, Assessment, WeatherData } from './field';
import type { ConservationPrediction } from './enhanced-features';
import type { VarietyPerformanceMetric } from './enhanced-features';
import type { WaterStressEvent } from './enhanced-features';
import type { CommunityInsight } from './enhanced-features';
import type { PredictiveModel } from './enhanced-features';

export interface VisionAnalysis {
  health_score: number;
  stress_level: string;
  symptoms: string[];
  confidence_score: number;
  visual_patterns?: string[];
  probable_causes?: string[];
  reasoning?: string;
}

export interface WaterStressAnalysis {
  stress_score: number;
  severity: 'mild' | 'moderate' | 'severe';
  confidence: number;
  triggers?: string[];
}

export interface VarietyAnalysis {
  disease_signatures?: Record<string, any>;
  stress_tolerances?: Record<string, any>;
  performance?: Record<string, any>;
  confidence?: number;
}

export interface ConservationAnalysis {
  soil_health_indicator?: number;
  practice_impacts?: Record<string, any>;
  improvements?: string[];
}

export interface WeatherCorrelation {
  patterns?: string[];
  optimal?: Record<string, any>;
}

export interface CommunityAnalysis {
  similar_fields?: string[];
  trending?: string[];
  successes?: string[];
  confidence?: number;
}

export interface PredictiveAnalysis {
  yield?: Record<string, any>;
  disease_risk?: string[];
  windows?: string[];
}

export interface AnalysisData {
  visionAnalysis?: VisionAnalysis;
  waterStress?: WaterStressAnalysis;
  variety?: VarietyAnalysis;
  conservation?: ConservationAnalysis;
  weatherCorrelation?: WeatherCorrelation;
  community?: CommunityAnalysis;
  predictions?: PredictiveAnalysis;
}

export interface IntelligencePool {
  id?: string;
  field_id: string;
  snapshot_date?: string;
  image_analysis_patterns?: {
    symptom_progression?: string[];
    health_score_trend?: number[];
    visual_patterns?: string[];
  };
  variety_intelligence?: {
    disease_signatures?: Record<string, any>;
    stress_tolerances?: Record<string, any>;
    performance_patterns?: Record<string, any>;
  };
  conservation_effectiveness?: {
    soil_health_trend?: number;
    practice_impacts?: Record<string, any>;
    visual_improvements?: string[];
  };
  weather_correlations?: {
    symptom_weather_patterns?: string[];
    stress_triggers?: string[];
    optimal_conditions?: Record<string, any>;
  };
  community_patterns?: {
    similar_field_outcomes?: string[];
    trending_issues?: string[];
    successful_interventions?: string[];
  };
  predictive_insights?: {
    yield_trajectory?: Record<string, any>;
    disease_risk_timeline?: string[];
    intervention_windows?: string[];
  };
  confidence_scores?: {
    vision_analysis?: number;
    water_stress?: number;
    variety_match?: number;
    community_alignment?: number;
  };
}

export interface UnifiedContext {
  fieldData: Field | null;
  assessmentHistory: Assessment[];
  conservationData: ConservationPrediction[];
  varietyData: VarietyPerformanceMetric[];
  weatherData: WeatherData;
  communityData: CommunityInsight[];
  waterStressData: WaterStressEvent[];
  predictiveData: PredictiveModel[];
  intelligencePool: IntelligencePool;
}

export interface AnalysisResult {
  health_score: number;
  stress_level: string;
  symptoms: string[];
  confidence_score: number;
  recommendations?: string[];
  urgency_level?: 'immediate' | 'monitor' | 'routine';
}

