# AgurateAI System Architecture

**Version:** 0.1 (Morehouse soybean public access)
**Last Updated:** 2026-09-14
**Status:** Pilot wedge — fail-closed invent locks; live publish/migrate still operator-gated

> Health / confidence scores are **0–100** (not 0.00–1.00). Missing scores must not invent `0`.
> Pilot geography/crop: **Morehouse Parish × soybean**. Deferred modules render `PilotDeferred`.

---

## 🏗️ High-Level Architecture

```
┌─────────────┐
│   Farmer    │
│  (Browser)  │
└──────┬──────┘
       │
       ↓
┌──────────────────────────────────────┐
│      Lovable Frontend Platform       │
│  ┌────────────────────────────────┐  │
│  │  Upload Interface              │  │
│  │  Dashboard & Visualizations    │  │
│  │  Recommendation Display        │  │
│  └────────────────────────────────┘  │
└──────┬───────────────────────┬───────┘
       │                       │
       ↓                       ↓
┌──────────────┐      ┌────────────────┐
│ Lovable AI   │      │   Open-Meteo   │
│   Actions    │      │   Weather API  │
└──────┬───────┘      └────────────────┘
       │
       ↓
┌──────────────────────┐
│   Supabase Backend   │
│  ┌────────────────┐  │
│  │   PostgreSQL   │  │
│  │   Database     │  │
│  └────────────────┘  │
└──────────────────────┘
```

---

## 📊 Data Flow

### 1. Image Upload & Analysis

```
User uploads crop image
    ↓
Lovable stores image + metadata
    ↓
Lovable AI Action analyzes image
    ↓
Health score + stress level returned
    ↓
Results saved to Supabase
    ↓
Dashboard updated with visual feedback
```

### 2. Recommendation Generation

```
Health score from image analysis
    ↓
Weather data fetched from Open-Meteo
    ↓
Crop type + location context added
    ↓
Lovable AI Action generates recommendations
    ↓
Recommendations displayed to user
    ↓
User provides feedback (helpful/not helpful)
    ↓
Feedback stored for future AI tuning
```

---

## 🗄️ Database Schema (Supabase)

### **users**
```sql
id              UUID PRIMARY KEY
email           TEXT UNIQUE NOT NULL
name            TEXT
created_at      TIMESTAMP DEFAULT NOW()
```

### **fields**
```sql
id              UUID PRIMARY KEY
user_id         UUID REFERENCES users(id)
name            TEXT NOT NULL
crop_type       TEXT  -- soybean, cotton, corn
location_lat    DECIMAL
location_lng    DECIMAL
created_at      TIMESTAMP DEFAULT NOW()
```

### **assessments**
```sql
id              UUID PRIMARY KEY
field_id        UUID REFERENCES fields(id)
image_url       TEXT
health_score    DECIMAL(3,2)  -- 0.00 to 1.00
stress_level    TEXT  -- Healthy, Moderate, Severe
symptoms        TEXT[]
analyzed_at     TIMESTAMP DEFAULT NOW()
```

### **recommendations**
```sql
id              UUID PRIMARY KEY
assessment_id   UUID REFERENCES assessments(id)
recommendation  TEXT NOT NULL
priority        TEXT  -- urgent, normal
created_at      TIMESTAMP DEFAULT NOW()
```

### **feedback**
```sql
id              UUID PRIMARY KEY
recommendation_id UUID REFERENCES recommendations(id)
rating          INTEGER  -- 1-5 stars or thumbs up/down
user_comment    TEXT
created_at      TIMESTAMP DEFAULT NOW()
```

---

## 🤖 AI Integration Strategy

### Image Analysis (Lovable AI Action)

**Input:**
- Crop image (uploaded by user)
- Crop type (soybean, cotton, corn)

**AI Prompt Template:**
```
Analyze this farm field image and identify signs of crop stress:
- Look for color changes (yellowing, browning)
- Detect dry or wilted areas
- Identify spotting or disease patterns

Rate the overall crop health on a scale of 0.0 to 1.0.
Return JSON: { health_score, stress_level, symptoms[] }
```

**Output:**
- Health score (0.0-1.0)
- Stress category (Healthy/Moderate/Severe)
- List of observed symptoms

### Recommendation Engine (Lovable AI Action)

**Input:**
- Health score from image analysis
- Crop type
- Weather forecast data
- Location (Morehouse Parish, LA)

**AI Prompt Template:**
```
Given:
- Crop: {crop_type}
- Health: {health_score}/1.0
- Weather: {temperature}°F, {precipitation}mm expected
- Location: Morehouse Parish, Louisiana

Provide 3 specific recommendations for the farmer.
Focus on: irrigation, fertilization, pest management.
Use simple, actionable language.
```

**Output:**
- List of 3 prioritized recommendations
- Timing guidance (immediate, within 5 days, etc.)

---

## 🌐 External API Integration

### Open-Meteo Weather API

**Endpoint:**
```
https://api.open-meteo.com/v1/forecast
```

**Parameters:**
- `latitude`: 32.73 (Morehouse Parish)
- `longitude`: -91.76
- `current_weather`: true
- `daily`: temperature_2m_max, precipitation_sum

**Response Used:**
- Current temperature
- 7-day precipitation forecast
- Max/min temperatures

**No authentication required** (free tier)

---

## 🔐 Security Considerations

### Data Privacy
- User images stored in Supabase Storage with row-level security
- User data isolated per account (RLS policies)
- No personally identifiable information required beyond email

### API Security
- Open-Meteo API: No credentials needed (public API)
- Lovable AI Actions: Managed by Lovable platform
- Supabase: JWT-based authentication

### Future Enhancements
- Add field-level encryption for sensitive farm data
- Implement API rate limiting
- Add audit logging for AI recommendations

---

## 📈 Scalability Plan

### MVP (Current)
- Single-user or small team usage
- Lovable platform handles hosting
- Supabase free tier (sufficient for testing)

### Phase 2 (Post-MVP)
- Multi-tenant architecture
- Custom backend API (FastAPI) for advanced features
- Batch processing for multiple field analysis
- Historical trend analysis

### Phase 3 (Production)
- Integration with satellite imagery APIs
- Real-time IoT sensor data (soil moisture, etc.)
- Mobile app (React Native or Progressive Web App)
- Partnership with Louisiana AgCenter for validation

---

## 🧪 Testing Strategy

### Manual Testing
- Upload sample crop images (healthy, moderate stress, severe stress)
- Verify AI analysis accuracy
- Check weather data integration
- Test recommendation quality

### Automated Testing
- Unit tests for backend functions (when custom backend is added)
- Integration tests for API endpoints
- E2E tests for critical user flows

### User Acceptance Testing
- Pilot with 5-10 Morehouse Parish farmers
- Gather feedback on recommendation usefulness
- Refine AI prompts based on real-world results

---

## 🚀 Deployment

### Current (MVP)
- **Frontend:** Lovable platform (auto-deployed)
- **Backend:** Supabase (managed service)
- **AI:** Lovable AI Actions (managed)

### Future (Custom Backend)
- **Hosting:** Railway, Render, or AWS Lambda
- **CI/CD:** GitHub Actions (already configured)
- **Monitoring:** Sentry for error tracking
- **Analytics:** PostHog or Mixpanel for user insights

---

## 📋 Technology Stack Summary

| Layer            | Technology                  | Purpose                          |
| ---------------- | --------------------------- | -------------------------------- |
| **Frontend**     | Lovable (React-based)       | UI/UX, no-code builder           |
| **AI Engine**    | Lovable AI Actions          | Image analysis, recommendations  |
| **Database**     | Supabase (PostgreSQL)       | Data storage, authentication     |
| **Weather API**  | Open-Meteo                  | Weather forecasts                |
| **Hosting**      | Lovable Platform            | Managed deployment               |
| **Future API**   | FastAPI (Python)            | Custom backend logic (Phase 2)   |
| **CI/CD**        | GitHub Actions              | Automated testing and deployment |

---

## 🔄 Feedback Loop for AI Improvement

```
User receives recommendation
    ↓
User rates accuracy (helpful/not helpful)
    ↓
Feedback stored in database
    ↓
[Manual Review by Admin]
    ↓
AI prompts refined based on patterns
    ↓
Updated prompts deployed to Lovable
    ↓
Improved recommendations for future users
```

**Target:** 80%+ "helpful" rating within first month of pilot

---

## 📞 Support & Maintenance

### Documentation
- User guide for farmers (simple, visual)
- Technical documentation (this file)
- API reference (when custom backend is built)

### Support Channels
- GitHub Issues for bug reports
- Email support for farmers
- Monthly check-ins during pilot phase

---

**End of Architecture Document**
