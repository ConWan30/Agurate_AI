/**
 * Field and Assessment Type Definitions
 * Core types for field management and crop health assessments
 */

export type CropType = 'rice' | 'soybean' | 'cotton' | 'corn';
export type StressLevel = 'healthy' | 'moderate' | 'severe' | 'Healthy' | 'Moderate' | 'Severe';
export type SoilType = 'alluvial' | 'claypan' | 'mixed';

export interface Field {
  id: string;
  user_id: string;
  name: string;
  crop_type: CropType;
  acreage?: number | null;
  soil_type?: SoilType | null;
  location_lat?: number | null;
  location_lng?: number | null;
  planting_date?: string | null;
  irrigation_type?: string | null;
  rice_variety?: string | null;
  soybean_variety?: string | null;
  cotton_variety?: string | null;
  corn_hybrid?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at?: string | null;
}

export interface Assessment {
  id: string;
  field_id: string;
  image_url: string;
  health_score: number; // canonical 0-100 (AI 0-1 inputs normalized via toHealthPercent)
  stress_level: StressLevel;
  symptoms?: string[] | null;
  confidence_score?: number | null;
  photo_location_lat?: number | null;
  photo_location_lng?: number | null;
  gps_accuracy_meters?: number | null;
  captured_offline?: boolean | null;
  weather_temp_f?: number | null;
  weather_precipitation_mm?: number | null;
  analyzed_at: string;
  created_at?: string | null;
}

export interface WeatherData {
  current_temp?: number;
  humidity?: number;
  precipitation_forecast?: number[];
  days_since_rain?: number;
  wind_speed?: number;
  wind_direction?: string;
  forecast_date?: string;
}

export interface Recommendation {
  id: string;
  assessment_id: string;
  recommendation_text: string;
  priority?: 'urgent' | 'normal' | 'low' | null;
  category?: 'irrigation' | 'fertilization' | 'pest_management' | 'weather_alert' | 'general' | null;
  created_at: string;
}

