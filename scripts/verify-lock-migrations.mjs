#!/usr/bin/env node
/**
 * Static assertions that tip SQL lock migrations still contain protect triggers /
 * policy drops. Catches accidental deletion of invent-path locks without a DB.
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const MIGRATIONS = path.join(ROOT, 'supabase', 'migrations');

function fail(msg) {
  console.error(`FAIL  ${msg}`);
  process.exitCode = 1;
}

function pass(msg) {
  console.log(`PASS  ${msg}`);
}

if (!existsSync(MIGRATIONS)) {
  fail('supabase/migrations missing');
  process.exit(1);
}

const files = readdirSync(MIGRATIONS).filter((f) => f.endsWith('.sql')).sort();
const byId = Object.fromEntries(files.map((f) => [f.replace(/\.sql$/, ''), f]));

const required = [
  {
    id: '20260914190000_protect_claim_status_and_invitation_columns',
    needles: [
      'protect_insurance_claim_status',
      'protect_cooperative_invitation_columns',
    ],
  },
  {
    id: '20260914200000_claim_insert_status_and_coop_alert_insert',
    needles: [
      'protect_insurance_claim_status',
      'Members can create cooperative alerts',
    ],
  },
  {
    id: '20260914210000_protect_assessment_ai_scores',
    needles: [
      'protect_assessment_ai_scores',
      'Users can insert own assessments',
      'Users can insert own recommendations',
      'protect_recommendation_inserts',
    ],
  },
  {
    id: '20260914220000_lock_ai_metric_client_writes',
    needles: [
      'reject_client_ai_metric_insert',
      'mark_water_stress_dirt_clicked',
      'protect_water_stress_ai_columns',
      'Users can insert water stress events for own fields',
      'Users can insert predictive models for own fields',
      'System can create community insights',
    ],
  },
  {
    id: '20260914230000_peer_effectiveness_score_check',
    needles: [
      'peer_treatment_outcomes_effectiveness_score_check',
      'effectiveness_score >= 0',
      'effectiveness_score <= 100',
    ],
  },
  {
    id: '20260914240000_protect_critical_alerts_and_claim_link',
    needles: [
      'protect_critical_alerts_ai_columns',
      'critical_alerts content columns may only be updated by trusted backends',
      'a.field_id = ic.field_id',
    ],
  },
  {
    id: '20260914250000_lock_conversational_form_and_request_logs',
    needles: [
      'protect_conversational_form_session_metrics',
      'Users can create user messages in their sessions',
      'reject_client_insert_request_logs_trg',
      'reject_client_insert_form_completion_analytics_trg',
      "role = 'user'",
    ],
  },
  {
    id: '20260914260000_lock_delta_peer_expert_invent',
    needles: [
      'Users can create user messages in own conversations',
      'Farmers can insert treatment outcomes for own fields',
      'protect_expert_consultation_response_columns',
      'protect_farmer_researcher_interaction_columns',
      "role = 'user'",
    ],
  },
  {
    id: '20260914270000_lock_alert_ack_and_conversation_memory',
    needles: [
      'Users can create acknowledgments',
      'reject_client_insert_alert_acknowledgments_trg',
      'Users can create own conversation memory',
      'reject_client_insert_conversation_memory_trg',
    ],
  },
  {
    id: '20260914280000_lock_claim_loss_priority_form_complete',
    needles: [
      'insurance_claims_estimated_loss_percentage_check',
      'estimated_loss_percentage must be between 0 and 100',
      "NEW.priority := 'medium'",
      'cannot be marked completed below 100%% completion',
      'assessments_field_uniformity_score_check',
    ],
  },
  {
    id: '20260914290000_lock_yield_feedback_event_bug_acreage',
    needles: [
      'assessments_estimated_yield_impact_percent_check',
      'assessments_canopy_coverage_percent_check',
      'Users can insert own feedback',
      'insurance_claims_event_type_check',
      'protect_bug_report_status',
      'fields_acreage_check',
    ],
  },
  {
    id: '20260914300000_lock_success_peer_cost_recommendation_update',
    needles: [
      'success_stories_estimated_savings_check',
      'success_stories_acres_protected_check',
      'peer_treatment_outcomes_cost_usd_check',
      'recommendations may only be created by trusted backends',
      'NEW.recommendation_text := OLD.recommendation_text',
    ],
  },
  {
    id: '20260914310000_lock_expert_coop_variety_extracted',
    needles: [
      'Farmers can create consultations for own fields',
      'cooperative_alerts_affected_area_acres_check',
      'cooperative_alerts content columns may only be updated by trusted backends',
      'variety_recommendations_expected_improvement_check',
      "NEW.extracted_data := '{}'::jsonb",
    ],
  },
  {
    id: '20260914320000_lock_water_claim_conservation_acreage',
    needles: [
      'water_stress_events_severity_check',
      'water_stress_events_stress_score_check',
      'NEW.estimated_loss_percentage := OLD.estimated_loss_percentage',
      'conservation_predictions_confidence_score_check',
      'profiles_total_acreage_check',
    ],
  },
  {
    id: '20260914330000_lock_claim_story_peer_link_metrics',
    needles: [
      'NEW.assessment_id := OLD.assessment_id',
      'NEW.claim_number := OLD.claim_number',
      'Users can create stories',
      'Farmers can insert treatment outcomes for own fields',
      'variety_performance_metrics_performance_score_check',
      'prediction_outcomes_accuracy_achieved_check',
      'NEW.outcome_improvement := OLD.outcome_improvement',
    ],
  },
  {
    id: '20260914340000_lock_coop_member_insert_and_insight_metrics',
    needles: [
      'Admins can insert members',
      'protect_cooperative_member_insert',
      'cooperative_members.user_id must equal the authenticated user',
      'community_insights_savings_achieved_check',
      'community_insights_community_rating_check',
      'NEW.lsu_validation := OLD.lsu_validation',
    ],
  },
  {
    id: '20260914350000_lock_coop_alert_field_expert_link_money_metrics',
    needles: [
      'Cooperative admins can create alerts for owned fields',
      'a.field_id = expert_consultations.field_id',
      'dirt_referral_metrics_water_stress_score_check',
      'NEW.lsu_validation := OLD.lsu_validation',
      'critical_alerts_estimated_loss_usd_check',
      'best_practices_network_average_savings_check',
      'farmer_testimonials_roi_achieved_check',
    ],
  },
  {
    id: '20260914360000_lock_coop_member_update_field_coop_predictive_outcomes',
    needles: [
      'protect_cooperative_member_update',
      'NEW.user_id := OLD.user_id',
      'fields.cooperative_id requires membership in that cooperative',
      'predictive_models_confidence_score_check',
      'NEW.prediction_data := OLD.prediction_data',
      'reject_client_insert_prediction_outcomes_trg',
      'NEW.accuracy_achieved := OLD.accuracy_achieved',
    ],
  },
  {
    id: '20260914370000_lock_coop_alert_coop_match_money_caps_ai_update_dirt',
    needles: [
      'f.cooperative_id = cooperative_alerts.cooperative_id',
      'success_stories_estimated_savings_upper_check',
      'peer_treatment_outcomes_cost_usd_upper_check',
      'NEW.assessment_id := OLD.assessment_id',
      'protect_analytics_insight_ai_columns',
      'protect_ai_intelligence_pool_columns',
      'protect_conservation_prediction_ai_columns',
      'protect_variety_recommendation_ai_columns',
      'app.allow_dirt_referral_insert',
    ],
  },
  {
    id: '20260914380000_lock_catalog_community_variety_money_caps',
    needles: [
      'critical_alerts_estimated_loss_usd_upper_check',
      'community_insights_savings_achieved_upper_check',
      'reject_client_insert_best_practices_network_trg',
      'protect_best_practices_network_columns',
      'protect_conservation_adoption_metrics_columns',
      'protect_lsu_publication_columns',
      'NEW.savings_achieved := OLD.savings_achieved',
      'protect_variety_performance_metrics_columns',
      'protect_success_story_money_columns',
      'NEW.roi_achieved := OLD.roi_achieved',
      'protect_peer_treatment_outcome_metrics',
    ],
  },
  {
    id: '20260914390000_lock_peer_sample_success_insert_weather_money',
    needles: [
      'COUNT(DISTINCT pto.farmer_id) >= 3',
      'pto.farmer_id IS DISTINCT FROM auth.uid()',
      'NEW.estimated_savings := NULL',
      'NEW.acres_protected := NULL',
      'NEW.roi_achieved := NULL',
      'cooperative_alerts_affected_area_acres_upper_check',
      'ALTER COLUMN location_lat DROP DEFAULT',
      'reject_client_insert_weather_events_trg',
    ],
  },
  {
    id: '20260914400000_lock_peer_insert_beta_metrics_coop_dirt',
    needles: [
      'peer_treatment_outcomes.recommendation_id is required',
      'peer_treatment_outcomes.recommendation_id must belong to the same owned field',
      'COUNT(DISTINCT pto.farmer_id) AS farmer_count',
      'CREATE OR REPLACE VIEW public.beta_metrics',
      'NEW.status := \'active\'',
      'NEW.water_savings := NULL',
      'app.allow_dirt_referral_insert',
    ],
  },
  {
    id: '20260914410000_lock_peer_crop_bind_cost_strip',
    needles: [
      'NEW.crop_type := field_crop',
      'NEW.cost_usd := NULL',
      'NEW.crop_type := OLD.crop_type',
      'peer_treatment_outcomes.recommendation_id is required',
    ],
  },
  {
    id: '20260914420000_lock_coop_alert_severity_crop_acres',
    needles: [
      "NEW.severity := 'info'",
      'NEW.crop_type := field_crop',
      'NEW.affected_area_acres := field_acres',
      'cooperative_alerts.field_id must be owned by the authenticated user',
    ],
  },
];

for (const req of required) {
  const file = byId[req.id];
  if (!file) {
    fail(`missing required lock migration ${req.id}`);
    continue;
  }
  const sql = readFileSync(path.join(MIGRATIONS, file), 'utf8');
  const missing = req.needles.filter((n) => !sql.includes(n));
  if (missing.length) {
    fail(`${req.id} missing markers: ${missing.join(', ')}`);
  } else {
    pass(`${req.id} lock markers present`);
  }
}

const tip = files.at(-1)?.replace(/\.sql$/, '') ?? '(none)';
pass(`tip migration ${tip}`);
if (
  !tip.startsWith('2026091442') &&
  tip < '20260914420000_lock_coop_alert_severity_crop_acres'
) {
  fail(
    `tip migration ${tip} should include coop-alert severity/crop/acres invent lock (20260914420000+)`
  );
}

if (process.exitCode) {
  console.error('\nLock migration static verification failed.');
  process.exit(process.exitCode);
}

console.log('\nAll lock-migration static checks passed.');
