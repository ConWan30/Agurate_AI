import { SupabaseClient } from '@supabase/supabase-js';
import type { FormType } from '@/types/conversational';

/**
 * Gathers unified AI intelligence context for conversational forms
 * Integrates with unified-ai-intelligence system for context awareness
 */
interface FormContextParams {
  fieldId?: string;
  [key: string]: unknown;
}

interface FormContextData {
  formType: FormType;
  userId: string;
  timestamp: string;
  profile?: {
    farmName: string | null;
    parish: string | null;
    primaryCrops: string[] | null;
    totalAcreage: number | null;
  };
  existingFields?: Array<{
    id: string;
    name: string;
    cropType: string;
    acreage: number | null;
    variety: string | null;
  }>;
  recentAssessments?: Array<{
    fieldId: string;
    healthScore: number;
    stressLevel: string;
    date: string;
  }>;
  cooperatives?: Array<{
    id: string;
    name: string | null;
  }>;
  targetField?: {
    id: string;
    name: string;
    cropType: string;
    acreage: number | null;
  };
  targetFieldAssessments?: unknown[];
}

export async function gatherFormContext(
  userId: string,
  formType: FormType,
  contextParams: FormContextParams,
  supabase: SupabaseClient
): Promise<FormContextData> {
  const context: FormContextData = {
    formType,
    userId,
    timestamp: new Date().toISOString(),
  };

  try {
    // Fetch user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (profile) {
      context.profile = {
        farmName: profile.farm_name,
        parish: profile.parish,
        primaryCrops: profile.primary_crops,
        totalAcreage: profile.total_acreage,
      };
    }

    // Fetch existing fields for reference
    const { data: fields } = await supabase
      .from('fields')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (fields && fields.length > 0) {
      context.existingFields = fields.map(field => ({
        id: field.id,
        name: field.name,
        cropType: field.crop_type,
        acreage: field.acreage,
        variety: field.rice_variety || field.soybean_variety || field.cotton_variety || field.corn_hybrid,
      }));
    }

    // Fetch recent assessments
    if (fields && fields.length > 0) {
      const fieldIds = fields.map(f => f.id);
      const { data: assessments } = await supabase
        .from('assessments')
        .select('*')
        .in('field_id', fieldIds)
        .order('analyzed_at', { ascending: false })
        .limit(5);

      if (assessments && assessments.length > 0) {
        context.recentAssessments = assessments.map(a => ({
          fieldId: a.field_id,
          healthScore: a.health_score,
          stressLevel: a.stress_level,
          date: a.analyzed_at,
        }));
      }
    }

    // Fetch cooperative memberships
    const { data: coopMemberships } = await supabase
      .from('cooperative_members')
      .select('cooperative_id, cooperatives(name)')
      .eq('user_id', userId);

    if (coopMemberships && coopMemberships.length > 0) {
      context.cooperatives = coopMemberships
        .filter((m: any) => m.cooperatives)
        .map((m: any) => ({
          id: m.cooperative_id,
          name: m.cooperatives?.name || null,
        }));
    }

    // Form-specific context enrichment
    if (formType === 'insurance_claim' || formType === 'insurance-claim' && contextParams?.fieldId) {
      const { data: field } = await supabase
        .from('fields')
        .select('*')
        .eq('id', contextParams.fieldId)
        .single();

      if (field) {
        context.targetField = {
          id: field.id,
          name: field.name,
          cropType: field.crop_type,
          acreage: field.acreage,
        };

        // Get recent assessments for this field
        const { data: fieldAssessments } = await supabase
          .from('assessments')
          .select('*')
          .eq('field_id', field.id)
          .order('analyzed_at', { ascending: false })
          .limit(10);

        if (fieldAssessments) {
          context.targetFieldAssessments = fieldAssessments;
        }
      }
    }

    return context;
  } catch (error) {
    console.error('Error gathering form context:', error);
    return context; // Return partial context if error
  }
}

/**
 * Enriches unified AI intelligence pool after form completion
 */
export async function enrichFormContext(
  formType: FormType,
  extractedData: Record<string, unknown>,
  supabase: SupabaseClient
): Promise<boolean> {
  try {
    // Log form completion analytics in development only
    if (import.meta.env.DEV) {
      console.log(`Form completed: ${formType}`, extractedData);
    }

    // Future: Add to intelligence pool for pattern recognition
    // This would integrate with unified-ai-intelligence.ts enrichUnifiedContext()

    return true;
  } catch (error) {
    console.error('Error enriching form context:', error);
    return false;
  }
}
