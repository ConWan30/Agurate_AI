# AgurateAI Application Pages Documentation

## Overview

AgurateAI is a comprehensive precision agriculture platform specifically designed for Louisiana Delta farmers. The application features a responsive web interface with mobile-first design, real-time AI analysis, and seamless integration with LSU AgCenter research data.

**Navigation Structure:**
- Bottom navigation bar (mobile)
- Left sidebar navigation (desktop)
- Three main categories: Core Features, Command Center, Business Tools

**Authentication:**
All pages except `/auth` and `/404` require user authentication via Supabase Auth.

## Screenshots and Demo Routes

**Important**: Due to authentication requirements, screenshots cannot be captured via automated tools for protected pages. However, **demo routes** have been created at `/demo/*` paths that bypass authentication for documentation purposes.

### Available Demo Routes

All screenshots were captured from these public demo routes with realistic mock data:

- `/demo/auth` - Authentication (Sign In/Sign Up pages)
- `/demo/dashboard` - Main dashboard with 3 sample fields and 5 recent assessments
- `/demo/upload` - Image/video upload interface
- `/demo/scanner` - Mobile field scanner with GPS and AR modes
- `/demo/fields` - Field management (North Field 150ac, Delta South 200ac, Cotton Ridge 125ac)
- `/demo/field-map` - Interactive Leaflet map centered on Morehouse Parish
- `/demo/history` - 5 assessment history records with health scores 58-92
- `/demo/predictions` - AI-powered 7-day stress forecasts
- `/demo/weather-timeline` - 30-day weather correlation timeline
- `/demo/delta` - Delta Intelligence AI chatbot
- `/demo/insurance` - Insurance claims management
- `/demo/cooperatives` - Cooperative management system
- `/demo/profile` - User profile settings (John Farmer @ Green Acres Farm)
- `/demo/how-it-works` - Platform tutorial and AI pipeline

**Screenshot Highlights:**
- **Dashboard**: Quick Actions, Business Tools, field overview, recent assessments
- **Fields**: 3 field cards with crop icons, acreage, GPS coordinates
- **History**: Health score progression from healthy (92) to severe (58) statuses
- **Delta AI**: LSU AgCenter-trained chatbot with quick questions
- **Scanner**: Mobile camera interface with AR overlay toggle
- **How It Works**: 6-step AI pipeline visualization

---

## Public Pages

### Authentication Page
**Route:** `/auth`  
**Component:** `src/pages/Auth.tsx`

**Purpose:**  
Primary entry point for user sign-in and sign-up.

**Key Features:**
- Tabbed interface for Sign In / Sign Up
- Split-screen layout with hero branding
- Email/password authentication
- Profile creation with farm details

**User Actions:**
- Sign in with existing credentials
- Create new account with email, password, full name, and farm name
- Automatic redirect to dashboard upon successful authentication

**Data Collected:**
- Email (auth.users table)
- Password (encrypted)
- Full name (profiles table)
- Farm name (profiles table)
- Phone number (profiles table)

**Integration Points:**
- Supabase Auth for authentication
- Profiles table for extended user data

**Visual Elements:**
- Louisiana Delta hero imagery
- AgurateAI branding
- Responsive card-based form layout

---

### Not Found (404)
**Route:** `*` (catch-all)  
**Component:** `src/pages/NotFound.tsx`

**Purpose:**  
Error handling for non-existent routes.

**Key Features:**
- Simple error message display
- Navigation back to home
- Console logging for debugging

**User Actions:**
- Click "Return to Home" link to navigate back to dashboard

---

## Protected Pages - Core Features

### Dashboard
**Route:** `/`  
**Component:** `src/pages/Dashboard.tsx`

**Purpose:**  
Central hub providing quick access to all platform features and overview of farm health.

**Key Features:**
- Quick action cards for primary workflows (Upload Image, Scan Crop, View Fields)
- Recent assessments feed with health scores and stress levels
- Interactive tutorial system with progress tracking
- Mobile-optimized floating action buttons
- Louisiana Delta-branded hero section

**Data Displayed:**
- Latest 5 crop health assessments
- Health scores (0-100 scale)
- Stress levels (Healthy, Moderate, Severe)
- Crop types (Corn, Cotton, Rice, Soybeans)
- Assessment timestamps
- Field names and locations

**User Actions:**
- Navigate to Upload page
- Navigate to Scanner page
- Navigate to Fields page
- View detailed assessment history
- Start interactive tutorial
- Mark tutorial steps as complete

**Integration Points:**
- Supabase `crop_health_assessments` table
- Tutorial progress tracking in localStorage
- Real-time data fetching with React Query

**Technical Notes:**
- Uses `useQuery` for data fetching
- Responsive grid layout (1-2-3 columns)
- Card-based UI components
- Badge components for stress levels

---

### Upload Image
**Route:** `/upload`  
**Component:** `src/pages/Upload.tsx`

**Purpose:**  
Desktop/web interface for uploading crop images for AI analysis.

**Key Features:**
- Drag-and-drop file upload
- Image preview before analysis
- Field selection dropdown
- Real-time AI analysis with streaming results
- Analysis history display

**Data Displayed:**
- Uploaded image preview
- Analysis results (health score, stress level, recommendations)
- List of registered fields for selection
- Processing status and progress

**User Actions:**
- Select image file from device
- Choose field for assessment
- Submit for AI analysis
- View analysis results
- Navigate to history for past assessments

**Integration Points:**
- Supabase `analyze-crop` edge function
- AI image analysis models
- `crop_health_assessments` table for storing results
- `fields` table for field selection

**Technical Notes:**
- Supports JPEG, PNG image formats
- Streaming AI responses for real-time feedback
- Automatic field association with assessments
- Mobile-responsive design

---

### Mobile Scanner
**Route:** `/scanner`  
**Component:** `src/pages/Scanner.tsx`

**Purpose:**  
Mobile-optimized camera interface for real-time crop scanning with GPS auto-tagging.

**Key Features:**
- Native device camera integration
- GPS coordinate auto-capture
- Field auto-detection based on location
- Real-time AI analysis
- AR visualization overlay (planned)

**Data Displayed:**
- Live camera feed
- GPS coordinates
- Detected field name
- Analysis results with health metrics
- Recommendations for farmer action

**User Actions:**
- Capture photo using device camera
- Auto-submit for analysis
- View GPS-tagged results
- Review recommendations

**Integration Points:**
- Browser Geolocation API
- Device camera API
- Supabase `ar-analyze` edge function
- GPS coordinate storage in assessments table

**Technical Notes:**
- Mobile-first design
- Automatic field matching via GPS proximity
- AR capabilities through edge function
- Real-time streaming analysis

---

### Assessment History
**Route:** `/history`  
**Component:** `src/pages/History.tsx`

**Purpose:**  
Comprehensive archive of all crop health assessments with filtering and search.

**Key Features:**
- Chronological list of all assessments
- Crop type filtering (All, Corn, Cotton, Rice, Soybeans)
- Health score visualization
- Stress level indicators
- Detailed recommendation display

**Data Displayed:**
- Assessment date and time
- Field name and location
- Crop type
- Health score (0-100)
- Stress level classification
- AI-generated recommendations
- Weather conditions at time of assessment

**User Actions:**
- Filter by crop type
- View detailed assessment cards
- Sort chronologically
- Export data (planned)

**Integration Points:**
- `crop_health_assessments` table
- `fields` table for field details
- Date formatting with date-fns library

**Technical Notes:**
- Real-time data fetching
- Responsive grid layout
- Color-coded health indicators
- Badge components for stress levels

---

## Protected Pages - Command Center

### Fields Management
**Route:** `/fields`  
**Component:** `src/pages/Fields.tsx`

**Purpose:**  
Field registration and management system for tracking farm locations and acreage.

**Key Features:**
- Field registration form
- GPS coordinate input
- Crop type selection
- Acreage tracking
- Field status overview

**Data Displayed:**
- List of registered fields
- Field names and locations
- GPS coordinates
- Crop types
- Total acreage
- Field health status

**User Actions:**
- Register new field
- Enter GPS coordinates manually
- Select crop type
- Specify acreage
- View field details
- Edit field information

**Integration Points:**
- `fields` table in Supabase
- GPS coordinate validation
- Crop type enumeration

**Technical Notes:**
- Form validation with React Hook Form
- Coordinate format validation
- Louisiana Delta-focused defaults

---

### Field Map (Interactive)
**Route:** `/field-map`  
**Component:** `src/pages/FieldMap.tsx`  
**Map Component:** `src/components/FieldMapLeaflet.tsx`

**Purpose:**  
Visual representation of all fields on an interactive Leaflet map with health overlays.

**Key Features:**
- Interactive Leaflet.js map
- Field markers with GPS coordinates
- Health score color coding
- Field detail cards below map
- Legend for health status interpretation

**Data Displayed:**
- Field locations on map
- Health score indicators
- Crop type icons
- Acreage per field
- Stress level badges
- Total field count
- Healthy field count
- Fields needing attention count

**User Actions:**
- Pan and zoom map
- Click field markers for details
- View field statistics
- Navigate to individual fields

**Integration Points:**
- `fields` table
- `crop_health_assessments` table (latest per field)
- Leaflet mapping library
- React-Leaflet components

**Technical Notes:**
- Real-time health data merging
- Color-coded markers (green/yellow/red)
- Responsive map container
- Grid view backup for mobile
- Custom map styling for Louisiana Delta

---

### 7-Day Predictions
**Route:** `/predictions`  
**Component:** `src/pages/Predictions.tsx`

**Purpose:**  
AI-powered predictive analytics for crop stress forecasting over next 7 days.

**Key Features:**
- Daily stress level predictions
- Confidence scores
- Weather factor integration
- Risk level classification
- Actionable daily recommendations
- Summary overview with high-risk day count

**Data Displayed:**
- 7-day forecast with dates
- Predicted stress levels (%)
- Risk levels (Low, Medium, High)
- Confidence scores (%)
- Weather factors (temperature, precipitation)
- Tailored recommendations per day
- Summary insights

**User Actions:**
- View daily predictions
- Review recommendations
- Refresh predictions for updated data
- Track high-risk days

**Integration Points:**
- Supabase `predict-stress` edge function
- Historical assessment data analysis
- Weather API integration
- Machine learning model for stress prediction

**Technical Notes:**
- Requires minimum historical data (7-14 assessments)
- Real-time prediction generation
- Color-coded risk indicators
- Icon-based visual cues (Cloud, CloudRain, AlertTriangle)
- Streaming results from edge function

---

### Weather Timeline
**Route:** `/weather-timeline`  
**Component:** `src/pages/WeatherTimeline.tsx`

**Purpose:**  
30-day correlation analysis between weather events and crop health scores.

**Key Features:**
- Interactive Recharts line chart
- Dual-axis visualization (health score + temperature)
- Significant weather event timeline
- Recent assessment list
- Event categorization (heatwave, frost, heavy rain, drought)

**Data Displayed:**
- Health score trends over 30 days
- Temperature correlation
- Weather event markers
- Event dates and types
- Meteorological details (temperature, precipitation)
- Assessment history with weather context

**User Actions:**
- Hover over chart for detailed data points
- View weather event details
- Navigate to full history
- Analyze health-weather correlations

**Integration Points:**
- `crop_health_assessments` table
- `weather_events` table
- Recharts charting library
- Date-based data aggregation

**Technical Notes:**
- Responsive chart sizing
- Color-coded event badges
- Icon mapping for event types
- 30-day rolling window
- Empty state handling

---

## Protected Pages - AI Intelligence

### Delta Intelligence
**Route:** `/delta`  
**Component:** `src/pages/DeltaIntelligence.tsx`

**Purpose:**  
AI-powered farming advisor trained on LSU AgCenter research and Louisiana Delta expertise.

**Key Features:**
- Conversational AI chatbot interface
- LSU AgCenter research integration
- Louisiana Delta-specific advice
- Streaming response generation
- Quick question prompts
- Chat history persistence
- Mobile-responsive design

**Data Displayed:**
- Chat message history (user + AI)
- Real-time streaming responses
- Typing indicators
- Quick question suggestions
- Knowledge base information cards

**User Actions:**
- Ask agriculture questions
- View AI responses in real-time
- Use quick question templates
- Review chat history
- Get LSU AgCenter-backed recommendations

**Integration Points:**
- Supabase `delta-chat` edge function
- Lovable AI (Google Gemini 2.5 Flash)
- LSU AgCenter research database
- Louisiana Delta climate data
- Crop-specific knowledge base

**Quick Questions Available:**
- "What are the best practices for cotton irrigation in the Delta?"
- "How do I identify early signs of soybean stress?"
- "What's the optimal planting schedule for corn in Louisiana?"

**Knowledge Base Coverage:**
- LSU AgCenter Extension publications
- Louisiana Delta climate patterns
- Regional soil composition data
- Crop-specific disease databases
- Pest management strategies
- Irrigation best practices

**Technical Notes:**
- Streaming SSE responses
- Message state management
- Auto-scroll to latest message
- Loading state indicators
- Error handling for AI failures
- System prompt tuned for Louisiana Delta agriculture

---

## Protected Pages - Business Tools

### Insurance Claims
**Route:** `/insurance`  
**Component:** `src/pages/Insurance.tsx`  
**Detail Component:** `src/components/InsuranceClaimDetail.tsx`

**Purpose:**  
Comprehensive insurance claim documentation and management system with AI-generated supporting evidence.

**Key Features:**
- Multi-field claim creation
- AI-generated claim documentation
- Assessment evidence linking
- Status tracking (Draft, Submitted, Under Review, Approved, Denied)
- Field-level loss calculations
- Photo evidence management
- Claim detail modal views

**Data Displayed:**
- Active and past claims
- Claim status and dates
- Field names and crop types
- Estimated loss amounts
- Assessment evidence count
- AI-generated descriptions
- Claim submission timeline
- Supporting photo gallery

**User Actions:**
- Create new insurance claim
- Select affected fields (multi-select)
- Enter estimated loss amount
- Add description and notes
- Link assessment evidence
- Submit claim
- View claim details
- Track claim status
- Update claim information

**Integration Points:**
- `insurance_claims` table
- `crop_health_assessments` for evidence
- `fields` table for field data
- Multi-select field association
- AI documentation generation

**Technical Notes:**
- Status-based badge colors
- Modal dialog for claim details
- Form validation for loss amounts
- Evidence count indicators
- Responsive card layout
- Date formatting with date-fns

**Claim Workflow:**
1. Farmer identifies crop damage
2. Creates claim with affected fields
3. System auto-links relevant assessments
4. AI generates supporting documentation
5. Farmer reviews and submits
6. Status tracked through resolution

---

### Cooperatives Dashboard
**Route:** `/cooperatives`  
**Component:** `src/pages/Cooperatives.tsx`  
**Invite Component:** `src/components/CooperativeInviteDialog.tsx`

**Purpose:**  
Cooperative intelligence network for farmer collaboration, data sharing, and collective insights.

**Key Features:**
- Cooperative membership management
- Invitation system with unique codes
- Member directory
- Aggregated data insights
- Collective intelligence sharing
- Create and join cooperatives

**Data Displayed:**
- User's cooperative memberships
- Cooperative names and descriptions
- Member count
- Join date
- Role (member/admin)
- Invitation codes
- Member list with details
- Available cooperatives to join

**User Actions:**
- Create new cooperative
- Generate invitation codes
- Share invite links
- View member directory
- Leave cooperative
- Join via invitation code
- Manage cooperative settings (admin)

**Integration Points:**
- `cooperatives` table
- `cooperative_members` table
- `cooperative_invitations` table
- Row-level security for data access
- Multi-member association

**Invitation System:**
- Unique alphanumeric codes (8 characters)
- Shareable URLs: `/cooperatives/join/:code`
- Expiration tracking
- Usage limits
- Acceptance/decline tracking

**Benefits for Farmers:**
- Share successful practices
- Collective bargaining power
- Regional disease/pest alerts
- Aggregated yield data
- Resource sharing
- Knowledge exchange

**Technical Notes:**
- Real-time membership updates
- Invitation code generation
- QR code support (planned)
- Role-based permissions
- Duplicate membership prevention

---

### Cooperative Join
**Route:** `/cooperatives/join/:code`  
**Component:** `src/pages/CooperativeJoin.tsx`

**Purpose:**  
Dedicated landing page for joining a cooperative via invitation link.

**Key Features:**
- Invitation code validation
- Cooperative details preview
- Accept/decline interface
- Manual code entry fallback
- Automatic membership creation

**Data Displayed:**
- Cooperative name
- Cooperative description
- Membership benefits
- Invitation status
- Inviting farmer information (planned)

**User Actions:**
- Accept invitation
- Decline invitation
- Enter code manually
- Return to cooperatives dashboard

**Integration Points:**
- `cooperative_invitations` table lookup
- `cooperative_members` insertion
- Invitation status update
- Duplicate check
- Navigation after acceptance

**Technical Notes:**
- URL parameter parsing
- Loading states
- Error handling for invalid codes
- Toast notifications for success/failure
- Automatic redirect after joining

---

## Protected Pages - User Management

### Profile Settings
**Route:** `/profile`  
**Component:** `src/pages/Profile.tsx`

**Purpose:**  
User account and farm information management.

**Key Features:**
- Profile data editing
- Farm information updates
- Account settings
- Contact information management

**Data Displayed:**
- Email address (read-only)
- Full name
- Farm name
- Phone number
- Account creation date
- Profile completeness

**User Actions:**
- Update full name
- Update farm name
- Update phone number
- Save changes
- View account information

**Integration Points:**
- `profiles` table
- Supabase Auth user data
- Form validation
- Real-time updates

**Technical Notes:**
- Read-only email field
- Form state management
- Save confirmation toasts
- Loading states during updates
- Error handling

---

### How It Works
**Route:** `/how-it-works`  
**Component:** `src/pages/HowItWorks.tsx`

**Purpose:**  
Platform tutorial and feature explanation page for new users.

**Key Features:**
- Step-by-step platform guide
- Feature walkthroughs
- Video tutorials (planned)
- FAQ section
- Getting started checklist

**Data Displayed:**
- Platform overview
- Feature descriptions
- Usage instructions
- Best practices
- Tips for Louisiana Delta farmers

**User Actions:**
- Read feature guides
- Watch tutorial videos
- Review FAQ
- Navigate to specific features
- Download user manual (planned)

**Integration Points:**
- Static content
- Tutorial completion tracking
- Help documentation

**Technical Notes:**
- Scroll-based navigation
- Accordion components for FAQ
- Responsive layout
- Print-friendly formatting

---

## Navigation Architecture

### Mobile Navigation (Bottom Bar)
**Component:** `src/components/Layout.tsx`

**Visible on:** Screens < 768px width

**Navigation Items:**
- Home (Dashboard)
- Upload
- Scanner
- Fields
- More (Menu)

### Desktop Navigation (Left Sidebar)
**Component:** `src/components/Layout.tsx`

**Visible on:** Screens ≥ 768px width

**Categories:**

**Command Center:**
- Dashboard
- Fields
- Field Map
- Weather Timeline
- Predictions

**Core Features:**
- Upload
- Scanner
- History
- How It Works

**Business Tools:**
- Insurance
- Cooperatives
- Delta Intelligence

**User:**
- Profile
- Logout

---

## Mobile-Specific Features

### Floating Action Buttons
**Component:** `src/components/MobileFloatingActions.tsx`

**Purpose:**  
Quick access to primary actions on mobile devices.

**Actions Available:**
- Quick Scan (opens Scanner)
- Upload Image (opens Upload)
- Emergency Contact (planned)

**Visibility:**
- Mobile only (< 768px)
- Positioned bottom-right
- Floating above content
- Accessible from all pages

---

## Authentication Flow

### Protected Route Logic
**Component:** `src/App.tsx` - `ProtectedRoute` wrapper

**Behavior:**
1. Check for active Supabase session
2. If authenticated → Render page content
3. If not authenticated → Redirect to `/auth`
4. During check → Show loading state

**Session Management:**
- Automatic session persistence
- Real-time auth state changes
- Token refresh handling
- Logout cleanup

---

## Data Tables Referenced

### Primary Tables:
- `profiles` - Extended user information
- `fields` - Farm field registry
- `crop_health_assessments` - AI analysis results
- `weather_events` - Weather data for correlations
- `insurance_claims` - Claim documentation
- `cooperatives` - Cooperative organizations
- `cooperative_members` - Membership associations
- `cooperative_invitations` - Invitation codes

### Auth Tables (Supabase):
- `auth.users` - Authentication credentials

---

## AI Integration Points

### Edge Functions:
1. **analyze-crop** - Image analysis for uploaded photos
2. **ar-analyze** - Mobile scanner with AR capabilities
3. **predict-stress** - 7-day predictive analytics
4. **delta-chat** - LSU AgCenter AI advisor

### AI Models Used:
- Google Gemini 2.5 Flash (via Lovable AI Gateway)
- Custom crop health detection models
- Predictive stress forecasting models
- Natural language processing for chat

---

## Design System

### Color Scheme:
- Primary: Louisiana Delta earth tones
- Accent: Agricultural green
- Status colors: Health-based (green/yellow/red)
- Dark mode support: Yes

### Typography:
- Headings: Geist Sans
- Body: System font stack
- Monospace: Code blocks only

### Component Library:
- Shadcn UI components
- Custom Louisiana Delta theming
- Responsive breakpoints (sm/md/lg/xl)
- Tailwind CSS utility classes

---

## Technical Architecture

### Frontend Framework:
- React 18.3.1
- TypeScript
- Vite build tool
- React Router DOM 6.30.1

### State Management:
- TanStack Query (React Query) for server state
- React useState/useEffect for local state
- Supabase real-time subscriptions

### Styling:
- Tailwind CSS
- CSS variables for theming
- Responsive design patterns
- Mobile-first approach

### Mapping:
- Leaflet.js
- React-Leaflet
- Custom marker icons
- GPS coordinate handling

### Charts:
- Recharts library
- Line charts for trends
- Responsive sizing
- Interactive tooltips

---

## Screenshot Limitations

**Note:** Due to authentication requirements, automated screenshots cannot capture the actual page content of protected routes. All pages except `/auth` require an active user session.

**To View Actual Pages:**
1. Sign up for an AgurateAI account at the deployed URL
2. Log in with credentials
3. Navigate through the application
4. Use browser developer tools to capture screenshots

**For Demo Purposes:**
- Refer to `docs/LIVE-DEMO-SCRIPT.md` for detailed visual walkthroughs
- Contact development team for authenticated screenshot access
- Review component code in `src/pages/` directory

---

## Additional Resources

### Related Documentation:
- `docs/LSU-AGCENTER-PITCH.md` - Full pitch document
- `docs/LIVE-DEMO-SCRIPT.md` - Video demo script
- `docs/DELTA_CODE_CULTIVATION_SYSTEM.md` - AI architecture
- `docs/DELTA_FIELD_COMMAND_CENTER.md` - Field management spec
- `docs/architecture.md` - Technical architecture
- `docs/research-findings.md` - LSU AgCenter integration research

### External Links:
- [LSU AgCenter](https://www.lsuagcenter.com/)
- [Louisiana Delta Region](https://www.lsuagcenter.com/portals/our_offices/research_stations/northeast)
- [Supabase Documentation](https://supabase.com/docs)
- [React Documentation](https://react.dev/)

---

## Future Enhancements (Roadmap)

### Planned Features:
- [ ] Drone imagery integration
- [ ] Soil sensor data integration
- [ ] Multi-season yield tracking
- [ ] Export reports (PDF/CSV)
- [ ] Push notifications for alerts
- [ ] Offline mode for mobile scanner
- [ ] Spanish language support
- [ ] Integration with USDA Farm Service Agency
- [ ] Equipment maintenance tracking
- [ ] Financial analytics dashboard

### Under Development:
- Enhanced AR visualization in scanner
- Real-time weather alerts
- Cooperative marketplace
- Crop insurance rate calculator
- Satellite imagery overlays

---

**Document Version:** 1.0  
**Last Updated:** 2025  
**Maintained By:** AgurateAI Development Team  
**For Questions:** Contact LSU AgCenter Partnership Team
