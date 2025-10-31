import { z } from 'zod';

/**
 * Input validation schemas for conversational forms
 * CRITICAL SECURITY: All user inputs must be validated to prevent injection attacks
 */

// Field Registration Schema
export const fieldRegistrationSchema = z.object({
  name: z.string()
    .trim()
    .min(1, 'Field name is required')
    .max(100, 'Field name must be less than 100 characters')
    .regex(/^[a-zA-Z0-9\s\-_]+$/, 'Field name can only contain letters, numbers, spaces, hyphens, and underscores'),
  
  crop_type: z.union([
    z.literal('rice'),
    z.literal('soybeans'),
    z.literal('cotton'),
    z.literal('corn')
  ]),
  
  acreage: z.number()
    .positive('Acreage must be greater than 0')
    .max(10000, 'Acreage must be less than 10,000 acres')
    .finite('Acreage must be a valid number'),
  
  location_lat: z.number()
    .min(-90, 'Latitude must be between -90 and 90')
    .max(90, 'Latitude must be between -90 and 90')
    .optional(),
  
  location_lng: z.number()
    .min(-180, 'Longitude must be between -180 and 180')
    .max(180, 'Longitude must be between -180 and 180')
    .optional(),
  
  rice_variety: z.string()
    .trim()
    .max(50, 'Variety name must be less than 50 characters')
    .optional(),
  
  soybean_variety: z.string()
    .trim()
    .max(50, 'Variety name must be less than 50 characters')
    .optional(),
  
  cotton_variety: z.string()
    .trim()
    .max(50, 'Variety name must be less than 50 characters')
    .optional(),
  
  corn_hybrid: z.string()
    .trim()
    .max(50, 'Hybrid name must be less than 50 characters')
    .optional(),
  
  notes: z.string()
    .trim()
    .max(1000, 'Notes must be less than 1000 characters')
    .optional()
});

// Insurance Claim Schema
export const insuranceClaimSchema = z.object({
  field_id: z.string()
    .uuid('Invalid field ID'),
  
  event_type: z.union([
    z.literal('flood'),
    z.literal('drought'),
    z.literal('hail'),
    z.literal('wind'),
    z.literal('pest'),
    z.literal('disease')
  ]),
  
  event_date: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
    .refine((date) => {
      const d = new Date(date);
      const now = new Date();
      return d <= now;
    }, 'Event date cannot be in the future'),
  
  description: z.string()
    .trim()
    .min(10, 'Description must be at least 10 characters')
    .max(2000, 'Description must be less than 2000 characters'),
  
  estimated_loss_percentage: z.number()
    .min(0, 'Loss percentage must be between 0 and 100')
    .max(100, 'Loss percentage must be between 0 and 100')
    .optional(),
  
  assessment_ids: z.array(z.string().uuid()).optional()
});

// Conservation Practices Schema
export const conservationPracticesSchema = z.object({
  field_id: z.string()
    .uuid('Invalid field ID'),
  
  tillage_type: z.union([
    z.literal('no-till'),
    z.literal('reduced-till'),
    z.literal('conventional')
  ]),
  
  cover_crops: z.boolean(),
  crop_rotation: z.boolean(),
  buffer_strips: z.boolean(),
  precision_fertilization: z.boolean(),
  
  notes: z.string()
    .trim()
    .max(1000, 'Notes must be less than 1000 characters')
    .optional()
});

// Onboarding Schema
export const onboardingSchema = z.object({
  farm_name: z.string()
    .trim()
    .min(1, 'Farm name is required')
    .max(100, 'Farm name must be less than 100 characters')
    .regex(/^[a-zA-Z0-9\s\-_&'.]+$/, 'Farm name contains invalid characters'),
  
  full_name: z.string()
    .trim()
    .min(1, 'Full name is required')
    .max(100, 'Full name must be less than 100 characters')
    .regex(/^[a-zA-Z\s\-'.]+$/, 'Name can only contain letters, spaces, hyphens, and apostrophes'),
  
  parish: z.string()
    .trim()
    .min(1, 'Parish is required')
    .max(50, 'Parish name must be less than 50 characters'),
  
  primary_crops: z.array(z.union([
    z.literal('rice'),
    z.literal('soybeans'),
    z.literal('cotton'),
    z.literal('corn')
  ]))
    .min(1, 'At least one crop must be selected')
    .max(4, 'Maximum 4 crops allowed'),
  
  total_acreage: z.number()
    .positive('Total acreage must be greater than 0')
    .max(10000, 'Total acreage must be less than 10,000 acres')
    .optional(),
  
  phone: z.string()
    .trim()
    .regex(/^[\d\s\-()]+$/, 'Phone number contains invalid characters')
    .min(10, 'Phone number must be at least 10 digits')
    .max(20, 'Phone number must be less than 20 characters')
    .optional()
});

// Message Input Schema (for user messages)
export const messageInputSchema = z.object({
  message: z.string()
    .trim()
    .min(1, 'Message cannot be empty')
    .max(2000, 'Message must be less than 2000 characters')
});

/**
 * Validates extracted data against form schema
 */
export function validateExtractedData(formType: string, data: any) {
  try {
    switch (formType) {
      case 'field-registration':
        return fieldRegistrationSchema.parse(data);
      case 'insurance-claim':
        return insuranceClaimSchema.parse(data);
      case 'conservation-practices':
        return conservationPracticesSchema.parse(data);
      case 'onboarding':
        return onboardingSchema.parse(data);
      default:
        throw new Error(`Unknown form type: ${formType}`);
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.issues.map(e => e.message).join(', ');
      throw new Error(errorMessages);
    }
    throw error;
  }
}

/**
 * Sanitizes user input to prevent XSS and injection attacks
 */
export function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/[\x00-\x1F\x7F]/g, ''); // Remove control characters
}
