# AgurateAI Research Findings

**Compiled:** 2025-10-17
**Focus Area:** Morehouse Parish, Louisiana
**Target Crops:** Rice, Soybeans, Cotton, Corn

---

## 📍 Morehouse Parish Agricultural Profile

### Geography & Scale
- **Total Crop Production:** 180,000+ acres
- **Location:** Northeast Louisiana
- **Key Agricultural Region:** Louisiana Delta

### Primary Crops

#### 1. **Rice** 🌾
- **Status:** Growing interest in row-rice production in Northeast Louisiana
- **Recent Study:** LSU AgCenter agent Keith Collins conducted row-rice study in Morehouse Parish
  - Jason Waller's farm: 231 lbs nitrogen/acre → 216 bushels (60 barrels) per acre
- **Role:** Alternative crop when markets are less favorable for corn, soybeans, or cotton
- **Production Method:** Furrow irrigated rice (relatively new practice in the region)
- **Resources:** LSU AgCenter publishes annual enterprise budgets and production guides

#### 2. **Soybeans** 🫘
- **Status:** Declining slightly but still major crop
- **Challenges:**
  - Fungi cause most diseases; thrive in Louisiana's warm, wet subtropical climate
  - Louisiana farmers face more disease pressure than other US regions
- **Acreage:** Significant production (exact numbers vary year-to-year)

#### 3. **Cotton** 🌿
- **Status:** Increasing over last few years
- **Soil Preference:** Alluvial soils along rivers and deltas (excellent for cotton)
- **Growing Trend:** Production expansion in parish

#### 4. **Corn** 🌽
- **Status:** Increasing over last few years
- **Production:** Part of annual crop rotation mix
- **Demonstration:** Variety plots conducted by LSU AgCenter

### Soil Types

**Alluvial Soils**
- Location: Along rivers and in deltas
- Characteristics: Fertile, excellent drainage
- Best for: Cotton, soybeans

**Claypan Soils**
- Location: Common in northeastern Louisiana
- Characteristics: Less permeable, drainage challenges
- Consideration: May require enhanced irrigation management

### Climate Characteristics
- **Classification:** Subtropical
- **Growing Season:** Extended due to warm temperatures
- **Precipitation:** High humidity, warm and wet conditions
- **Disease Pressure:** Higher than most US farming regions due to climate

---

## 🌤️ Weather API Options for Louisiana

### Option 1: Open-Meteo API ⭐ **RECOMMENDED**

**Overview:**
- Free, open-source weather API
- No API key required
- Non-commercial use allowed

**Coverage for Louisiana:**
- Combines NOAA GFS model with HRRR (Hourly Rapid Refresh) model
- HRRR updates every hour (excellent for real-time decisions)
- 9km resolution for detailed local forecasts

**Agricultural Features:**
- Hourly precipitation forecasts
- 7-16 day forecasts available
- Soil temperature and moisture data
- Differentiates between rain and shower types
- Simple JSON format

**API Endpoint Example:**
```
https://api.open-meteo.com/v1/forecast?latitude=32.73&longitude=-91.76&current_weather=true&daily=temperature_2m_max,precipitation_sum
```

**Parameters for Agriculture:**
- `temperature_2m_max` - Daily max temperature
- `precipitation_sum` - Total daily precipitation
- `soil_temperature_0cm` - Surface soil temperature
- `soil_moisture_0_to_1cm` - Shallow soil moisture

**2025 Update:**
- ECMWF data now available as open-data (CC-BY 4.0 license)
- Enhanced resolution and accuracy

### Option 2: NOAA National Weather Service API

**Overview:**
- Free public service of US Government
- No usage fees
- API: api.weather.gov

**Features:**
- Critical forecasts, alerts, and observations
- Gridpoint data for any US location
- Precipitation forecasts
- Open data for any purpose

**Limitations:**
- 5 requests per second limit
- May require API token for higher usage

**Agricultural Resources:**
- Weekly Weather and Crop Bulletin (WWCB)
- Precipitation Frequency Data Server (PFDS)
- Historical climate data via CDO API

### Option 3: NOAA Climate Data Online (CDO)

**Overview:**
- Historical weather and climate data
- Free with API token

**Limits:**
- 5 requests per second
- 10,000 requests per day

**Best For:**
- Historical analysis
- Trend identification
- Long-term planning

### **Recommendation:**
**Use Open-Meteo as primary API** for real-time forecasts and current conditions. Supplement with NOAA CDO for historical data analysis if needed.

---

## 🖼️ Free Crop Health Image Datasets

### Dataset 1: Rice Leaf Diseases Dataset (Kaggle) ⭐

**Source:** https://www.kaggle.com/datasets/vbookshelf/rice-leaf-diseases

**Details:**
- **Focus:** Disease-infected rice plant leaves
- **Relevance:** HIGH - Direct rice application
- **Accuracy Reported:** 99.68% in disease detection models
- **Size:** 400+ images
- **License:** Kaggle standard (check individual dataset)

**Use Case:** Train AI to detect rice-specific diseases in Morehouse Parish

---

### Dataset 2: 20k+ Multi-Class Crop Disease Images (Kaggle) ⭐⭐

**Source:** https://www.kaggle.com/datasets/jawadali1045/20k-multi-class-crop-disease-images

**Details:**
- **Size:** 20,000+ images
- **Scope:** Multi-crop, multi-disease
- **Relevance:** HIGH - Comprehensive agricultural dataset
- **Use Case:** Visual diagnosis across multiple crop types

---

### Dataset 3: New Plant Diseases Dataset (Kaggle)

**Source:** https://www.kaggle.com/datasets/vipoooool/new-plant-diseases-dataset

**Details:**
- **Content:** Healthy and unhealthy crop leaves
- **Crops Covered:** Tomatoes, cotton, citrus, rice, corn, soybean, apple, grape, cassava
- **Directly Relevant Crops:** Cotton, rice, corn, soybean ✅
- **Use Case:** Training classification models for healthy vs. stressed plants

---

### Dataset 4: Five Crop Diseases Dataset (Kaggle)

**Source:** https://www.kaggle.com/datasets/shubham2703/five-crop-diseases-dataset

**Details:**
- **Focus:** 5 common crop diseases
- **Size:** Smaller, focused dataset
- **Use Case:** Specific disease identification

---

### Dataset 5: CCMT Dataset (Research)

**Source:** PMC/NCBI - https://pmc.ncbi.nlm.nih.gov/articles/PMC10285554/

**Details:**
- **Focus:** Crop pest and disease detection
- **Format:** Research-grade dataset
- **Use Case:** Advanced machine learning applications

---

### Commercial API (Optional Future Integration)

**crop.health AI by Kindwise**

**Crops Covered:** Corn, cotton, rice, soybean (exact match for AgurateAI!)

**Note:** This is a paid API, but could be considered for Phase 2 if self-trained models need supplementation

---

### **NDVI & Vegetation Index Resources**

**Key Indices for Crop Stress Detection:**
- **MSAVI** (Modified Soil-Adjusted Vegetation Index)
- **NDVI** (Normalized Difference Vegetation Index)
- **ExG** (Excess Green Index)

**Application:** These indices distinguish healthy from infected/stressed crops and can be calculated from standard RGB or multispectral imagery.

---

## 📚 LSU AgCenter Resources

### Rice Production

**Louisiana Rice Production Handbook**
- **URL:** www.lsuagcenter.com/topics/crops/rice
- **Content:** Official LSU AgCenter recommendations
  - Variety selection
  - Agronomy and fertility
  - Disease management
  - Insect control
  - Weed management

**2025 Rice Varieties & Management Tips**
- **URL:** www.lsuagcenter.com/articles/page1732221663902
- **Content:**
  - Annual updates on varieties
  - Pest management products
  - Recent production practices

**Furrow Irrigated Rice Enterprise Budgets - 2025**
- **URL:** www.lsuagcenter.com/articles/page1735745511560
- **Focus:** Northeast Louisiana
- **Content:** Expected returns, competitiveness analysis for rice vs. other crops

---

### Soybean Production

**LSU Soybean Research**
- **URL:** www.lsu.edu/research/news/2022/0118-soybeans.php
- **Focus:** Nanotechnology for disease resistance and environmental protection
- **Relevance:** Cutting-edge research applicable to Louisiana growers

---

### Cotton & Corn

**General Crop Resources**
- **URL:** www.lsuagcenter.com/topics/crops
- **Content:** Production guides, variety trials, pest management

**Demonstration Plots**
- Conducted annually in Morehouse Parish
- Varieties: corn, cotton, soybean, rice
- Access results through parish extension office

---

### Morehouse Parish Extension Office

**Resource:** LSU AgCenter Morehouse Parish Profile
- **URL:** www.lsuagcenter.com/portals/our_offices/parishes/morehouse/features/parish_profile/morehouse-parish-profile
- **Content:**
  - Local agricultural statistics
  - Parish-specific recommendations
  - Contact information for extension agents

**Contact:** Keith Collins (LSU AgCenter Agent - conducted row-rice study)

---

## 🌾 Crop-Specific Stress Indicators

### Rice Stress Symptoms

**Water Stress:**
- Leaf rolling
- Wilting
- Reduced tillering
- Delayed flowering

**Nutrient Deficiency:**
- Yellowing (chlorosis) - often nitrogen deficiency
- Stunted growth
- Poor panicle development

**Disease:**
- Brown spots (blast disease)
- Leaf blight
- Sheath blight (tan lesions)

---

### Soybean Stress Symptoms

**Fungal Diseases (common in Louisiana):**
- Frogeye leaf spot (circular lesions)
- Cercospora leaf blight (purple/brown spots)
- Asian soybean rust (tan lesions with pustules)

**Nutrient Deficiency:**
- Yellowing between veins (iron or manganese deficiency)
- Overall pale color (nitrogen deficiency)

**Water Stress:**
- Wilting
- Leaf drop
- Reduced pod set

---

### Cotton Stress Symptoms

**Water Stress:**
- Wilting in heat of day
- Leaf curling
- Boll shedding

**Nutrient Deficiency:**
- Yellowing lower leaves (nitrogen deficiency)
- Reddish-purple leaves (phosphorus deficiency)

**Disease:**
- Leaf spots
- Verticillium wilt (yellowing, wilting)

---

### Corn Stress Symptoms

**Water Stress:**
- Leaf rolling
- Tassel delay
- Poor kernel fill

**Nutrient Deficiency:**
- Yellowing starting at leaf tips (nitrogen deficiency)
- Purple leaves (phosphorus deficiency)

**Disease:**
- Gray leaf spot
- Northern corn leaf blight

---

## 🎯 Recommendations for AgurateAI MVP

### Immediate Priorities

1. **Integrate Open-Meteo API**
   - No authentication required
   - Louisiana-optimized (HRRR model)
   - Free for non-commercial use

2. **Download Kaggle Datasets**
   - Start with Rice Leaf Diseases Dataset (rice-specific)
   - Add 20k+ Multi-Class Crop Disease Images (comprehensive)
   - Focus on rice, soybean, cotton, corn images

3. **Reference LSU AgCenter Materials**
   - Use crop-specific stress indicators for AI prompt training
   - Link to production handbooks in app for farmer education
   - Consider partnership with Morehouse Parish extension office for pilot testing

4. **Target Crop Coverage**
   - **Phase 1 (MVP):** Rice + one other crop (soybeans or cotton)
   - **Phase 2:** All four crops with expanded disease/stress detection

---

## 📊 Data Integration Strategy

### Lovable Platform Integration

**Image Analysis:**
1. User uploads crop image
2. Lovable AI Action analyzes image against dataset patterns
3. Identifies crop type (rice, soybean, cotton, corn)
4. Detects stress symptoms using visual indicators
5. Assigns health score (0.0-1.0)

**Weather Context:**
1. Fetch current conditions from Open-Meteo API
2. Get 7-day precipitation forecast
3. Factor weather into recommendations (e.g., "No rain expected - increase irrigation")

**Recommendations:**
1. Combine health score + weather + crop type
2. Generate context-aware advice using Lovable AI Action
3. Reference LSU AgCenter best practices in prompts
4. Provide simple, actionable language for farmers

---

## 🚀 Next Steps

1. ✅ Download sample images from Kaggle datasets → Store in `/data-samples/`
2. ✅ Test Open-Meteo API with Morehouse Parish coordinates
3. ✅ Create AI prompts that reference stress indicators from this research
4. ✅ Build Supabase schema to store analysis results and farmer feedback
5. ✅ Design Lovable UI using crop images and API integration

---

**End of Research Findings**
