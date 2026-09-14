import { createContext, useContext, ReactNode } from 'react';
import { useLocation } from 'react-router-dom';

interface DemoField {
  id: string;
  name: string;
  crop_type: string;
  acreage: number;
  location_lat: number;
  location_lng: number;
  user_id: string;
  created_at: string;
}

interface DemoAssessment {
  id: string;
  field_id: string;
  health_score: number;
  stress_level: string;
  created_at: string;
  image_url: string;
  symptoms: string[];
  field: DemoField;
}

interface DemoDataContextType {
  isDemoMode: boolean;
  fields: DemoField[];
  assessments: DemoAssessment[];
}

const DemoDataContext = createContext<DemoDataContextType | undefined>(undefined);

const mockFields: DemoField[] = [
  {
    id: 'demo-field-1',
    name: 'North Field',
    crop_type: 'rice',
    acreage: 150,
    location_lat: 32.6875,
    location_lng: -91.8292,
    user_id: 'demo-user',
    created_at: '2025-01-15T10:00:00Z'
  },
  {
    id: 'demo-field-2',
    name: 'Delta South',
    crop_type: 'soybean',
    acreage: 200,
    location_lat: 32.6800,
    location_lng: -91.8400,
    user_id: 'demo-user',
    created_at: '2025-01-14T10:00:00Z'
  },
  {
    id: 'demo-field-3',
    name: 'Cotton Ridge',
    crop_type: 'cotton',
    acreage: 125,
    location_lat: 32.6950,
    location_lng: -91.8200,
    user_id: 'demo-user',
    created_at: '2025-01-13T10:00:00Z'
  }
];

const mockAssessments: DemoAssessment[] = [
  {
    id: 'demo-assess-1',
    field_id: 'demo-field-1',
    health_score: 92,
    stress_level: 'healthy',
    created_at: '2025-01-18T14:30:00Z',
    image_url: 'https://images.unsplash.com/photo-1574943320219-553eb213f72d',
    symptoms: ['No significant stress detected', 'Healthy growth patterns observed'],
    field: mockFields[0]
  },
  {
    id: 'demo-assess-2',
    field_id: 'demo-field-2',
    health_score: 75,
    stress_level: 'moderate',
    created_at: '2025-01-17T11:15:00Z',
    image_url: 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449',
    symptoms: ['Minor drought stress indicators', 'Recommend irrigation assessment'],
    field: mockFields[1]
  },
  {
    id: 'demo-assess-3',
    field_id: 'demo-field-3',
    health_score: 88,
    stress_level: 'healthy',
    created_at: '2025-01-16T09:45:00Z',
    image_url: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef',
    symptoms: ['Excellent crop vigor', 'Optimal growth conditions'],
    field: mockFields[2]
  },
  {
    id: 'demo-assess-4',
    field_id: 'demo-field-1',
    health_score: 65,
    stress_level: 'moderate',
    created_at: '2025-01-15T16:20:00Z',
    image_url: 'https://images.unsplash.com/photo-1560493676-04071c5f467b',
    symptoms: ['Nutrient deficiency detected in lower leaves', 'Consider nitrogen supplementation'],
    field: mockFields[0]
  },
  {
    id: 'demo-assess-5',
    field_id: 'demo-field-2',
    health_score: 57,
    stress_level: 'severe',
    created_at: '2025-01-14T13:00:00Z',
    image_url: 'https://images.unsplash.com/photo-1506368249639-73a05d6f6488',
    symptoms: ['Significant pest damage observed', 'Immediate intervention recommended'],
    field: mockFields[1]
  }
];

export function DemoDataProvider({ children }: { children: ReactNode }) {
  const location = useLocation();
  const isDemoMode = location.pathname.startsWith('/demo');

  const value: DemoDataContextType = {
    isDemoMode,
    fields: mockFields,
    assessments: mockAssessments,
  };

  return <DemoDataContext.Provider value={value}>{children}</DemoDataContext.Provider>;
}

export function useDemoData() {
  const context = useContext(DemoDataContext);
  if (context === undefined) {
    throw new Error('useDemoData must be used within a DemoDataProvider');
  }
  return context;
}
