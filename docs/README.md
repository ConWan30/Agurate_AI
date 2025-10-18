# AgurateAI Documentation

This folder contains the core documentation and development framework for AgurateAI.

## 📚 Documentation Files

### [DELTA_CODE_CULTIVATION_SYSTEM.md](./DELTA_CODE_CULTIVATION_SYSTEM.md)
The complete development methodology for AgurateAI, using agricultural metaphors that resonate with our Morehouse Parish farmer audience. This framework guides all code organization, naming conventions, and development practices.

**Key sections:**
- Delta Philosophy - Why agricultural metaphors matter
- Crop Rotation Principles - Code organization patterns
- Planting Seasons - Development lifecycle
- Weather-Based Workflows - Adapting to external conditions

### [architecture.md](./architecture.md)
System architecture documentation including:
- High-level architecture diagrams
- Data flow patterns
- Database schema overview
- AI integration strategy
- Weather API integration

### [research-findings.md](./research-findings.md)
Comprehensive research about Morehouse Parish agriculture:
- Agricultural profile (180,000+ acres)
- Primary crops: Rice, Soybeans, Cotton, Corn
- Soil types and climate characteristics
- LSU AgCenter resources
- Weather API options

### [dataset-setup-guide.md](./dataset-setup-guide.md)
Instructions for downloading and organizing crop health image datasets for testing and training:
- Rice Leaf Diseases Dataset
- Multi-Class Crop Disease Images
- Recommended Kaggle datasets
- Folder structure guidelines

### [supabase-schema.sql](./supabase-schema.sql)
Reference SQL schema showing the complete database structure with:
- All tables (profiles, fields, assessments, recommendations, feedback)
- RLS policies
- Performance indexes
- Helper views
- Triggers and functions

## 🎯 Implementation Status

### ✅ Completed (as of latest migration)
- Database schema normalized to lowercase stress levels (`healthy`, `moderate`, `severe`)
- Performance indexes added for optimal query speed
- DELETE policy for assessments implemented
- Database views created with proper security settings (`security_invoker=on`)
- RLS policies properly configured for all tables
- Edge function `analyze-crop` integrated with Lovable AI Gateway
- Dashboard with color-coded stress level visualization

### 🔧 Core Principles Applied
1. **Louisiana Focus**: All AI prompts reference Morehouse Parish and LSU AgCenter guidelines
2. **Normalized Data**: All enums stored in lowercase for consistency
3. **Weather Integration**: Open-Meteo API for real-time weather context
4. **Security First**: All views use `security_invoker=on`, proper RLS policies
5. **Performance**: Strategic indexes on frequently queried columns

## 🌾 Delta Code Cultivation in Practice

Following the DCCS framework, this project:
- Uses **soil-first** approach (database foundation before features)
- Implements **crop rotation** (systematic development cycles)
- Applies **weather awareness** (adapting to user feedback and external APIs)
- Follows **LSU AgCenter alignment** (expert agricultural guidance)

## 📖 How to Use This Documentation

1. **For New Features**: Review `architecture.md` to understand data flow
2. **For Database Changes**: Reference `supabase-schema.sql` for proper structure
3. **For Development Approach**: Follow `DELTA_CODE_CULTIVATION_SYSTEM.md` methodology
4. **For Testing**: Use `dataset-setup-guide.md` to prepare test images
5. **For Context**: Consult `research-findings.md` for Louisiana agricultural insights

## 🚜 Development Commands

All database migrations are handled automatically through Lovable Cloud. The schema stays synchronized with your development environment.

## 🔐 Security Notes

- All tables have RLS enabled
- Views use `security_invoker=on` to respect user permissions
- Edge functions normalize AI outputs before database writes
- Sensitive data (API keys) stored in Supabase secrets

---

**Last Updated**: 2025-10-18  
**Version**: 1.0 (MVP)  
**Framework**: Delta Code Cultivation System™
