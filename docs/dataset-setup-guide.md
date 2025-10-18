# Dataset Setup Guide for AgurateAI

**Purpose:** Download and organize crop health image datasets for testing and training
**Target Crops:** Rice, Soybean, Cotton, Corn
**Goal:** Build `/data-samples/` folder with labeled crop stress images

---

## 📦 Recommended Datasets

### 1. Rice Leaf Diseases Dataset ⭐ **PRIMARY FOR RICE**

**Source:** Kaggle
**URL:** https://www.kaggle.com/datasets/vbookshelf/rice-leaf-diseases

**Details:**
- **Size:** 400+ images
- **Categories:** Healthy, Bacterial Leaf Blight, Brown Spot, Leaf Smut
- **Accuracy Reported:** 99.68% in ML models
- **License:** Check Kaggle dataset page

**Download Instructions:**
1. Create free Kaggle account: https://www.kaggle.com/
2. Go to dataset page: https://www.kaggle.com/datasets/vbookshelf/rice-leaf-diseases
3. Click "Download" button (requires Kaggle login)
4. Extract ZIP file
5. Organize into `/data-samples/rice/` folder

**Folder Structure:**
```
data-samples/
└── rice/
    ├── healthy/
    ├── bacterial-blight/
    ├── brown-spot/
    └── leaf-smut/
```

---

### 2. 20k+ Multi-Class Crop Disease Images ⭐ **COMPREHENSIVE**

**Source:** Kaggle
**URL:** https://www.kaggle.com/datasets/jawadali1045/20k-multi-class-crop-disease-images

**Details:**
- **Size:** 20,000+ images
- **Crops Covered:** Multiple crops including soybean, cotton, corn
- **Categories:** Various diseases and healthy samples
- **License:** Check Kaggle dataset page

**Download Instructions:**
1. Visit: https://www.kaggle.com/datasets/jawadali1045/20k-multi-class-crop-disease-images
2. Click "Download" (Kaggle login required)
3. Extract ZIP file
4. Filter and organize relevant crops into `/data-samples/`

**Folder Structure:**
```
data-samples/
├── soybean/
│   ├── healthy/
│   └── diseased/
├── cotton/
│   ├── healthy/
│   └── diseased/
└── corn/
    ├── healthy/
    └── diseased/
```

---

### 3. New Plant Diseases Dataset

**Source:** Kaggle
**URL:** https://www.kaggle.com/datasets/vipoooool/new-plant-diseases-dataset

**Details:**
- **Size:** Large dataset with healthy and diseased images
- **Crops:** Includes rice, soybean, cotton, corn
- **Organization:** Pre-categorized by health status

**Download Instructions:**
1. Visit Kaggle dataset page
2. Download and extract
3. Copy relevant crop categories to `/data-samples/`

---

### 4. Five Crop Diseases Dataset

**Source:** Kaggle
**URL:** https://www.kaggle.com/datasets/shubham2703/five-crop-diseases-dataset

**Details:**
- **Size:** Focused dataset on 5 common diseases
- **Use Case:** Specific disease identification

---

## 🗂️ Recommended Folder Structure

Create this structure in your AgurateAI repository:

```
agurateai/
└── data-samples/
    ├── README.md  (this file)
    ├── rice/
    │   ├── healthy/
    │   ├── nitrogen-deficiency/
    │   ├── water-stress/
    │   ├── blast-disease/
    │   └── leaf-blight/
    ├── soybean/
    │   ├── healthy/
    │   ├── nitrogen-deficiency/
    │   ├── frogeye-leaf-spot/
    │   ├── cercospora-blight/
    │   └── rust/
    ├── cotton/
    │   ├── healthy/
    │   ├── nitrogen-deficiency/
    │   ├── water-stress/
    │   └── verticillium-wilt/
    ├── corn/
    │   ├── healthy/
    │   ├── nitrogen-deficiency/
    │   ├── water-stress/
    │   ├── gray-leaf-spot/
    │   └── northern-corn-leaf-blight/
    └── test-uploads/  (for user testing)
```

---

## 🛠️ Step-by-Step Setup

### Step 1: Create Kaggle Account

1. Go to https://www.kaggle.com/
2. Click "Register" and create free account
3. Verify your email

### Step 2: Accept Dataset Terms

- Some datasets require accepting terms of use
- Read and accept on each dataset page before downloading

### Step 3: Download Datasets

**Option A: Manual Download (Easiest)**
- Click "Download" button on each dataset page
- Extract ZIP files locally

**Option B: Kaggle API (Advanced)**
```bash
pip install kaggle

# Configure API token (from Kaggle Account settings)
kaggle datasets download -d vbookshelf/rice-leaf-diseases
kaggle datasets download -d jawadali1045/20k-multi-class-crop-disease-images
```

### Step 4: Organize Files

1. Create `/data-samples/` folder in agurateai repository
2. Extract downloaded datasets
3. Organize by crop type and condition
4. Rename folders for consistency

### Step 5: Create Sample README

```
cd data-samples
echo "# AgurateAI Sample Crop Images" > README.md
echo "Downloaded from Kaggle datasets for testing" >> README.md
```

---

## 📝 Dataset Usage Guidelines

### For Testing AI Image Analysis

1. **Select Diverse Samples:**
   - Pick 10-20 images per crop type
   - Include healthy, moderate stress, and severe stress examples
   - Ensure variety in lighting, angles, and growth stages

2. **Test Image Upload Flow:**
   - Upload to Lovable Storage bucket
   - Verify AI analysis accuracy
   - Compare AI output against known labels

3. **Validate Prompts:**
   - Use labeled images to test prompt accuracy
   - Adjust prompts based on misclassifications
   - Target >80% accuracy on known conditions

### For MVP Demo

Create a "demo-set" folder with:
- 3-5 clearly labeled healthy images (per crop)
- 3-5 clearly labeled stressed images (per crop)
- Use for stakeholder presentations

---

## 🔒 Licensing & Attribution

### Important Notes:

1. **Check Individual Dataset Licenses:**
   - Each Kaggle dataset has its own license
   - Common licenses: CC BY-SA 4.0, CC0, MIT
   - Read terms before using commercially

2. **Attribution Requirements:**
   - Some datasets require attribution
   - Include dataset source in your documentation
   - Example: "Rice images from Kaggle user vbookshelf"

3. **Non-Commercial Use:**
   - AgurateAI MVP is non-commercial (research/pilot)
   - Commercial deployment may require license review

---

## ⚠️ .gitignore Reminder

**DO NOT commit large image datasets to Git!**

Add to `.gitignore`:
```
# Crop image datasets
data-samples/**/*.jpg
data-samples/**/*.jpeg
data-samples/**/*.png
data-samples/**//*.tif
data-samples/**//*.bmp

# But keep folder structure
!data-samples/README.md
!data-samples/**/README.md
```

**Why?**
- Image datasets are large (100s of MB to GBs)
- GitHub has file size limits
- Datasets should be downloaded separately by each developer

---

## 🚀 Quick Start for MVP

**Minimum Viable Dataset (for initial testing):**

1. Download **Rice Leaf Diseases Dataset** (400 images, manageable size)
2. Extract to `/data-samples/rice/`
3. Select 20 representative images:
   - 5 healthy
   - 5 bacterial blight
   - 5 brown spot
   - 5 leaf smut
4. Upload these 20 to Lovable Storage bucket
5. Test AI image analysis with known labels
6. Iterate on prompts until accuracy >80%

---

## 📊 Alternative: Public Domain Images

**If Kaggle datasets have licensing concerns:**

### Google Images (Public Domain Filter)
1. Search: "rice crop stress public domain"
2. Tools → Usage Rights → "Creative Commons licenses"
3. Download and verify license

### USDA Image Library
- URL: https://www.usda.gov/media/images
- Public domain government images
- Search for crop stress, disease, etc.

### LSU AgCenter Publications
- URL: https://www.lsuagcenter.com/
- Extension publications often include example images
- Contact for permission if needed

---

## ✅ Validation Checklist

Before using dataset in production:

- [ ] Downloaded at least 1 comprehensive dataset
- [ ] Organized images by crop type and condition
- [ ] Created clear folder structure
- [ ] Added `.gitignore` rules to exclude images
- [ ] Tested sample images with AI prompts
- [ ] Validated AI accuracy on known labels
- [ ] Documented dataset sources and licenses
- [ ] Created demo-set for stakeholder presentations

---

## 📞 Support & Resources

**Kaggle Help:**
- Documentation: https://www.kaggle.com/docs
- Datasets: https://www.kaggle.com/datasets

**AgurateAI Dataset Questions:**
- Review research-findings.md for dataset details
- Check architecture.md for data flow

---

**End of Dataset Setup Guide**
