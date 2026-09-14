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
  !tip.startsWith('2026091428') &&
  tip < '20260914280000_lock_claim_loss_priority_form_complete'
) {
  fail(
    `tip migration ${tip} should include claim-loss / priority / form-complete invent lock (20260914280000+)`
  );
}

if (process.exitCode) {
  console.error('\nLock migration static verification failed.');
  process.exit(process.exitCode);
}

console.log('\nAll lock-migration static checks passed.');
