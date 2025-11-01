# Pre-Launch Critical Tasks - LSU AgCenter Presentation

## Status: ⚠️ 2 Critical Gaps to Address Before Publishing

**Last Updated:** January 2025  
**Priority:** HIGH - Required before LSU AgCenter presentation

---

## 🔴 Gap 1: LSU Research Citations Replacement

### Problem
Placeholder citations like "LSU AgCenter Publication #3412" appear in:
- Supabase Edge Functions (analyze-crop, delta-chat, predict-stress)
- Frontend components (LSUResearchers page)

### Solution
Replace all placeholders with real publications from `phase-0-implementation/lsu-research-citations.ts`

### Files to Update

#### 1. Supabase Edge Function: `analyze-crop`

**Location:** Supabase Dashboard → Edge Functions → `analyze-crop`

**Search for:**
- `Publication #3412`
- `Publication #1234`
- `LSU AgCenter Publication #`
- Any placeholder publication numbers

**Replace with:**
Use real publications from the database. See **"Real Citations Reference"** section below.

**Example Replacement:**
```typescript
// BEFORE (Placeholder):
"Based on LSU AgCenter Publication #3412, Rice Nutrient Management Guide"

// AFTER (Real):
"Based on LSU AgCenter Publication Pub. 2945, 'Fertilizer Recommendations for Field Crops in Louisiana: N-P-K-S' (2024). Key finding: Rice requires 120-150 lbs N/acre in split applications."
```

**How to Update:**
1. Go to Supabase Dashboard → Edge Functions
2. Click `analyze-crop` function
3. Click "Edit Function"
4. Search for placeholder citations
5. Replace with real citations (see reference below)
6. Click "Deploy"

---

#### 2. Supabase Edge Function: `delta-chat`

**Location:** Supabase Dashboard → Edge Functions → `delta-chat`

**Search for:**
- `Publication #3412`
- `Dr. [Name]`
- Generic citations

**Replace with:**
```typescript
// Example citation in delta-chat response:
"For rice blast management in Louisiana, refer to LSU AgCenter Publication 'Rice Varieties and Management Tips 2025' (LSU AgCenter Rice Research Station, 2024). Key finding: Blast-resistant varieties reduce fungicide needs by 40% and improve net returns. Source: https://www.lsuagcenter.com/profiles/astrahan/articles/page1701362113346"
```

**How to Update:**
1. Supabase Dashboard → Edge Functions → `delta-chat`
2. Edit function code
3. Find AI prompt section where citations are added
4. Replace placeholder citations with real ones
5. Deploy

---

#### 3. Supabase Edge Function: `predict-stress`

**Location:** Supabase Dashboard → Edge Functions → `predict-stress`

**Search for:**
- Generic LSU references
- Placeholder publications

**Replace with:**
Reference to water management or stress-related publications:
```typescript
// Example:
"Based on LSU AgCenter research: 'Water Management for Louisiana Rice Production' (LSU Rice Research Station, 2024). Water stress during reproductive stages causes 20-40% yield reduction."
```

---

#### 4. Frontend Component: `src/pages/LSUResearchers.tsx` (if exists)

**If this file exists:**
1. Check for placeholder researcher names
2. Replace with real researchers:
   - Dr. Don Groth (Rice Pathology)
   - Dr. Jim Jian Wang (Soil Science)
   - Dr. Stacia L. Davis Conger (Engineering/DIRT)
   - Dr. Syam K. Dodla (Soil Science/Climate-Smart)
   - Dennis Burns (Northeast Research Station)

---

### Real Citations Reference

Use these REAL publications (from `phase-0-implementation/lsu-research-citations.ts`):

**For Rice Diseases/Blast:**
- **Publication:** "Rice Varieties and Management Tips 2025"
- **Authors:** LSU AgCenter Rice Research Station
- **Year:** 2024
- **Publication #:** Rice Varieties 2025
- **URL:** https://www.lsuagcenter.com/profiles/astrahan/articles/page1701362113346
- **Key Finding:** "Blast-resistant varieties reduce fungicide needs by 40%"

**For Fertilizer/Nitrogen:**
- **Publication:** "Fertilizer Recommendations for Field Crops in Louisiana: N-P-K-S"
- **Authors:** LSU AgCenter Soil Science Team
- **Year:** 2024
- **Publication #:** Pub. 2945
- **URL:** https://www.lsuagcenter.com/articles/page1753969451254
- **Key Finding:** "Rice: 120-150 lbs N/acre in split applications (60% preflood, 40% mid-season)"

**For Water Management:**
- **Publication:** "Water Management for Louisiana Rice Production"
- **Authors:** LSU Rice Research Station
- **Year:** 2024
- **Publication #:** Rice Water Management 2024
- **URL:** https://www.lsuagcenter.com/topics/crops/rice
- **Key Finding:** "Water stress during reproductive stages causes 20-40% yield reduction"

**For Soybean Diseases:**
- **Publication:** "Louisiana Plant Disease Management Guide - Soybeans"
- **Authors:** LSU AgCenter Plant Pathology Department
- **Year:** 2024
- **Publication #:** Plant Disease Guide - Soybeans
- **URL:** https://www.lsuagcenter.com/portals/communications/publications/management_guides/plant_disease_guide
- **Key Finding:** "Frogeye-resistant soybean varieties are most cost-effective control method"

**Complete list of 12 publications:**
See `phase-0-implementation/lsu-research-citations.ts` for all publications with full details.

---

### Verification Checklist

After updating citations:
- [ ] `analyze-crop` function uses real publication titles and numbers
- [ ] `delta-chat` function references real publications in responses
- [ ] `predict-stress` function cites real research (if applicable)
- [ ] All "Publication #3412" or similar placeholders removed
- [ ] All citations include real authors, years, and URLs
- [ ] Test Edge Functions with sample requests to verify citations appear correctly

---

## 🔴 Gap 2: Demo Account Setup

### Problem
No production-ready demo account exists with realistic data for LSU presentation.

### Solution
Create comprehensive demo account with all required data.

---

### Demo Account Specifications

**Account Credentials:**
- Email: `demo@agurateai.com`
- Password: `DemoPassword123!` (or secure equivalent)
- Display Name: "Demo Farmer Account"

---

### Required Demo Data

#### 1. Three Pre-Populated Fields

**Field 1: North Rice Field**
- **Name:** "North Rice Field"
- **Crop Type:** Rice
- **Acreage:** 120 acres
- **Soil Type:** Alluvial
- **Location:** Morehouse Parish, Louisiana
- **GPS:** 32.7340°N, -91.7573°W
- **Planting Date:** April 15, 2025
- **Field Status:** Active

**Field 2: South Soybean Field**
- **Name:** "South Soybean Field"
- **Crop Type:** Soybeans
- **Acreage:** 180 acres
- **Soil Type:** Claypan
- **Location:** Morehouse Parish, Louisiana
- **GPS:** 32.7300°N, -91.7600°W
- **Planting Date:** May 1, 2025
- **Field Status:** Active

**Field 3: West Cotton Field**
- **Name:** "West Cotton Field"
- **Crop Type:** Cotton
- **Acreage:** 90 acres
- **Soil Type:** Mixed (Sandy Loam)
- **Location:** Morehouse Parish, Louisiana
- **GPS:** 32.7380°N, -91.7550°W
- **Planting Date:** April 20, 2025
- **Field Status:** Active

---

#### 2. 10-15 Realistic Assessments

**Assessment Distribution:**
- 4-5 assessments for North Rice Field (varied health scores: 65%, 72%, 85%, 58%, 91%)
- 4-5 assessments for South Soybean Field (varied health scores: 68%, 74%, 82%, 55%, 88%)
- 3-4 assessments for West Cotton Field (varied health scores: 71%, 79%, 63%)

**Sample Assessment Details:**

**Assessment 1: Rice - Nitrogen Deficiency**
- Field: North Rice Field
- Health Score: 68%
- Stress Level: Moderate
- Date: 5 days ago
- Symptoms: Yellowing lower leaves, stunted growth
- Detection: Nitrogen deficiency
- Confidence: 94%
- Recommendation: "Apply 80 lbs N/acre foliar spray within 48 hours"
- Citation: "Based on LSU AgCenter Publication Pub. 2945, Fertilizer Recommendations for Field Crops in Louisiana (2024)"

**Assessment 2: Rice - Healthy**
- Field: North Rice Field
- Health Score: 91%
- Stress Level: Healthy
- Date: 2 days ago
- Symptoms: None detected
- Recommendation: "Continue current management practices"

**Assessment 3: Soybean - Potassium Deficiency**
- Field: South Soybean Field
- Health Score: 72%
- Stress Level: Moderate
- Date: 4 days ago
- Symptoms: Yellowing leaf margins, brown spots
- Detection: Potassium deficiency
- Confidence: 89%
- Recommendation: "Apply 60-80 lbs K₂O/acre foliar spray"
- Citation: "Based on LSU AgCenter Publication Pub. 2945 (2024)"

**Assessment 4: Rice - Rice Blast (High Urgency)**
- Field: North Rice Field
- Health Score: 58%
- Stress Level: Severe
- Date: 1 day ago
- Symptoms: Diamond-shaped lesions, gray centers
- Detection: Rice blast (Magnaporthe oryzae)
- Confidence: 96%
- Urgency: Immediate
- Recommendation: "Apply azoxystrobin fungicide within 24-48 hours"
- Citation: "Based on LSU AgCenter Publication 'Rice Varieties and Management Tips 2025' (LSU Rice Research Station, 2024). Blast-resistant varieties reduce fungicide needs by 40%."

**Assessment 5: Cotton - Water Stress**
- Field: West Cotton Field
- Health Score: 63%
- Stress Level: Moderate
- Date: 3 days ago
- Symptoms: Wilting leaves, reduced growth
- Detection: Water stress
- Confidence: 87%
- Recommendation: "Increase irrigation frequency by 20%"
- Citation: "Based on LSU AgCenter Publication 'Water Management for Louisiana Rice Production' (2024)"

*Continue pattern for remaining 10 assessments with varied scenarios...*

---

#### 3. Complete Insurance Claim

**Claim Details:**
- **Field:** North Rice Field
- **Event Type:** Hail Damage
- **Event Date:** 2 weeks ago
- **Status:** Completed

**Pre-Storm Baseline:**
- 23 photos showing 68% health before storm
- Dates: 15 days ago (before storm)

**Post-Storm Damage:**
- 18 GPS-tagged photos showing 41% health after storm
- Dates: 14 days ago (immediately after)
- AI Damage Assessment: 87% confidence, severe damage
- Weather Correlation: Hail event confirmed by NOAA data (verified)

**Claim Package:**
- Complete timeline: 14 days documented
- PDF export ready
- All evidence GPS-tagged
- Weather data correlated

---

#### 4. Delta Intelligence Chat History

**Conversation 1: Rice Yellowing Question**
- **Question:** "Why are my rice leaves turning yellow in Morehouse Parish soil?"
- **Response:** (Include field-aware context, weather data, LSU citation)
- **Date:** 3 days ago

**Conversation 2: Fertilizer Timing**
- **Question:** "When should I apply nitrogen to my rice field?"
- **Response:** (Include LSU Pub. 2945 citation, split application recommendation)
- **Date:** 6 days ago

**Conversation 3: Disease Identification**
- **Question:** "I see brown spots on my soybeans. What is it?"
- **Response:** (Include frogeye leaf spot diagnosis, LSU citation)
- **Date:** 8 days ago

*Add 5-7 more realistic conversations showing Delta Intelligence capabilities*

---

#### 5. Cooperative Data

**Cooperative Name:** "Delta Farmers Cooperative"
- **Members:** 25 mock members
- **Your Role:** Member
- **Location:** Morehouse Parish

**Cooperative Insights:**
- Aggregate health scores: Rice 78% average (your field: 82%)
- Early warning: "3 members reported rice blast in past 48 hours"
- Best practices shared: "Top 25% of farmers using split nitrogen application"
- Anonymous benchmarking data visible

**Mock Member Data:**
- 25 anonymous members (don't expose individual farm data)
- Aggregate statistics only
- Disease alerts (3 rice blast reports in past 48 hours)

---

#### 6. 7-Day Stress Predictions

**For North Rice Field:**
- **Today-Thursday:** Low Risk (15%)
- **Friday-Saturday:** Medium Risk (45%)
- **Sunday-Monday:** High Risk (68%) - Heat Wave Alert ⚠️

**Prediction Details:**
- Alert: "98°F+ temperatures forecasted Sunday-Monday. Recommend irrigation increase by 20% before Friday."
- Weather Source: Open-Meteo, Morehouse Parish specific
- Field History Correlation: How this field responded to past heat

**For South Soybean Field:**
- Similar 7-day forecast with varied risk levels

**For West Cotton Field:**
- Similar 7-day forecast with varied risk levels

---

### Demo Account Setup Methods

#### Method 1: Manual Setup via Platform (Recommended for First-Time)

**Steps:**
1. Create account: `demo@agurateai.com`
2. Navigate to `/fields` - Create 3 fields (North Rice, South Soybean, West Cotton)
3. Upload crop images (use images from `demo-crop-images/` folder)
4. Generate assessments for each field (10-15 total)
5. Create insurance claim manually (upload pre/post storm photos)
6. Use Delta Intelligence chat (ask questions to build history)
7. Create/join cooperative
8. View predictions dashboard (should auto-generate 7-day forecasts)

**Time Required:** 2-3 hours

---

#### Method 2: SQL Seeding Script (Faster, Requires Database Access)

**See:** `database-migrations/demo-account-seed.sql` (create this file)

**Benefits:**
- Faster setup (10 minutes vs 2-3 hours)
- Consistent demo data
- Can reset/recreate easily

**Requirements:**
- Supabase database access
- Knowledge of table structure

---

#### Method 3: Edge Function Script (Automated)

Create Supabase Edge Function `setup-demo-account` that:
1. Creates demo user if not exists
2. Creates 3 fields
3. Generates 10-15 assessments
4. Creates insurance claim
5. Seeds chat history
6. Creates cooperative

**Benefits:**
- Fully automated
- Can be called anytime
- Can reset demo account easily

---

### Demo Account Verification Checklist

Before presentation:
- [ ] Demo account login works (`demo@agurateai.com`)
- [ ] All 3 fields visible and populated
- [ ] 10-15 assessments visible with varied health scores
- [ ] Insurance claim complete with photos
- [ ] Delta Intelligence chat has 7-10 conversation history
- [ ] Cooperative shows 25 members and insights
- [ ] 7-day predictions showing RED high-risk alert (for demo impact)
- [ ] All assessments have real LSU citations (not placeholders)
- [ ] Mobile experience works (test on phone)
- [ ] All features accessible without errors

---

## 🎯 Priority Order

1. **FIRST:** Replace LSU citation placeholders (2-3 hours)
   - Update Edge Functions
   - Verify citations appear correctly
   - Test with sample requests

2. **SECOND:** Create demo account (2-3 hours)
   - Manual setup recommended for first time
   - Or use SQL script if comfortable with database

3. **THIRD:** Verify everything works (1 hour)
   - Test all features with demo account
   - Ensure citations are real (not placeholders)
   - Check mobile experience

---

## 📅 Timeline Recommendation

**If presenting in 1 week:**
- Day 1-2: Replace citations in Edge Functions
- Day 3-4: Create demo account
- Day 5: Verify and test everything
- Day 6-7: Final polish and practice demo

**If presenting in 2 weeks:**
- Week 1: Citations + Demo Account Setup
- Week 2: Verification + Testing + Practice

---

## ✅ Success Criteria

You're ready to publish when:
1. ✅ All placeholder citations replaced with real publications
2. ✅ Demo account has all required data (fields, assessments, claims, chat, cooperative, predictions)
3. ✅ Demo account login works perfectly
4. ✅ All features demonstrate real LSU citations (not placeholders)
5. ✅ 7-day predictions show realistic RED high-risk alert
6. ✅ Mobile experience tested and working

---

## 🆘 Need Help?

If you need help with:
- **Supabase Edge Function updates:** Provide function code, I'll help identify placeholders
- **Demo account SQL script:** I can create the seeding script
- **Verification testing:** I can create a checklist

**Status:** Ready to proceed with both tasks  
**Estimated Time:** 4-6 hours total  
**Priority:** CRITICAL - Required before LSU presentation

