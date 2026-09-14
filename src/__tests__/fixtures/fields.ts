/**
 * Test Fixtures - Fields
 * Sample field data for testing
 */

import type { Field } from '@/types';

export const mockField: Field = {
  id: 'field-1',
  user_id: 'user-1',
  name: 'North Rice Field',
  crop_type: 'soybean',
  acreage: 40.5,
  location_lat: 32.73,
  location_lng: -91.76,
  planting_date: '2024-03-15',
  irrigation_type: 'flood',
  rice_variety: 'Jupiter',
  created_at: '2024-01-01T00:00:00Z',
};

export const mockFields: Field[] = [
  mockField,
  {
    id: 'field-2',
    user_id: 'user-1',
    name: 'South Soybean Field',
    crop_type: 'soybean',
    acreage: 25.0,
    location_lat: 32.72,
    location_lng: -91.75,
    created_at: '2024-01-02T00:00:00Z',
  },
];

