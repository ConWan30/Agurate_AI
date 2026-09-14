/**
 * Agricultural Utilities for AgurateAI
 * Consistent helper functions for crop health indicators, colors, and terminology
 */

// Health status types
export type HealthStatus = 'healthy' | 'moderate' | 'severe' | 'unknown';
export type CropType = 'rice' | 'soybean' | 'cotton' | 'corn';

/**
 * Get health status badge classes using semantic health colors
 */
export function getHealthBadgeClass(stressLevel: string): string {
  const normalized = stressLevel?.toLowerCase();
  switch (normalized) {
    case 'healthy':
      return 'bg-health-good/10 text-health-good border-health-good/30';
    case 'moderate':
      return 'bg-health-moderate/10 text-health-moderate border-health-moderate/30';
    case 'severe':
      return 'bg-health-severe/10 text-health-severe border-health-severe/30';
    default:
      return 'bg-muted text-muted-foreground border-border';
  }
}

/**
 * Get health status text color class
 */
export function getHealthTextColor(stressLevel: string): string {
  const normalized = stressLevel?.toLowerCase();
  switch (normalized) {
    case 'healthy':
      return 'text-health-good';
    case 'moderate':
      return 'text-health-moderate';
    case 'severe':
      return 'text-health-severe';
    default:
      return 'text-muted-foreground';
  }
}

/**
 * Get health status background color class
 */
export function getHealthBgColor(stressLevel: string): string {
  const normalized = stressLevel?.toLowerCase();
  switch (normalized) {
    case 'healthy':
      return 'bg-health-good';
    case 'moderate':
      return 'bg-health-moderate';
    case 'severe':
      return 'bg-health-severe';
    default:
      return 'bg-muted';
  }
}

/**
 * Format health score with appropriate color
 */
export function formatHealthScore(score: number): {
  formatted: string;
  status: HealthStatus;
  colorClass: string;
} {
  let status: HealthStatus;
  let colorClass: string;

  if (score >= 80) {
    status = 'healthy';
    colorClass = 'text-health-good';
  } else if (score >= 60) {
    status = 'moderate';
    colorClass = 'text-health-moderate';
  } else {
    status = 'severe';
    colorClass = 'text-health-severe';
  }

  return {
    formatted: `${Math.round(score)}%`,
    status,
    colorClass
  };
}

/**
 * Get farmer-friendly crop type label
 */
export function getCropLabel(cropType: string): string {
  const normalized = cropType?.toLowerCase();
  const labels: Record<string, string> = {
    rice: 'Rice',
    soybeans: 'Soybeans',
    soybean: 'Soybeans',
    cotton: 'Cotton',
    corn: 'Corn'
  };
  return labels[normalized] || cropType;
}

/**
 * Get soil type label with Louisiana context
 */
export function getSoilTypeLabel(soilType: string): string {
  const normalized = soilType?.toLowerCase();
  const labels: Record<string, string> = {
    alluvial: 'Alluvial (Well-drained)',
    claypan: 'Claypan (Poor drainage)',
    mixed: 'Mixed'
  };
  return labels[normalized] || soilType;
}

/**
 * Format acreage for display
 */
export function formatAcreage(acres: number): string {
  return `${acres.toLocaleString()} acres`;
}

/**
 * Format currency for Louisiana farmers
 */
export function formatCurrency(amount: number): string {
  return `$${amount.toLocaleString()}`;
}

/**
 * Crop $/acre is farm-specific — never invent Louisiana commodity defaults.
 * Callers must require a farmer-entered value when USD math is needed.
 */
export function getCropValuePerAcre(_cropType: string): number | null {
  return null;
}
