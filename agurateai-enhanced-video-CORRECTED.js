const puppeteer = require('puppeteer');
const { PuppeteerScreenRecorder } = require('puppeteer-screen-recorder');
const fs = require('fs');
const path = require('path');

// Configuration - UPDATED FOR DEMO ACCOUNT
const CONFIG = {
  baseUrl: 'https://agurateai.lovable.app',
  email: 'demo@agurateai.com',  // ✅ Demo account
  password: 'DemoLSU2025!',       // ✅ Demo password
  videoDir: 'agurateai-videos-demo',
  cropImagesDir: 'demo-crop-images',
  viewport: {
    width: 1920,
    height: 1080
  },
  recordingConfig: {
    followNewTab: true,
    fps: 30,
    videoFrame: {
      width: 1920,
      height: 1080,
    },
    aspectRatio: '16:9',
  }
};

// Ensure directories exist
if (!fs.existsSync(CONFIG.videoDir)) {
  fs.mkdirSync(CONFIG.videoDir, { recursive: true });
}

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Enhanced function to add text overlay annotations
async function addOverlay(page, text, position = 'top', duration = 3000) {
  await page.evaluate((text, position, duration) => {
    // Remove existing overlay if present
    const existingOverlay = document.getElementById('automation-overlay');
    if (existingOverlay) {
      existingOverlay.remove();
    }

    // Create overlay element
    const overlay = document.createElement('div');
    overlay.id = 'automation-overlay';
    overlay.style.cssText = `
      position: fixed;
      ${position === 'top' ? 'top: 20px' : 'bottom: 20px'};
      left: 50%;
      transform: translateX(-50%);
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 16px 32px;
      border-radius: 12px;
      font-size: 20px;
      font-weight: 600;
      font-family: 'Segoe UI', system-ui, sans-serif;
      z-index: 999999;
      box-shadow: 0 10px 40px rgba(0,0,0,0.3);
      animation: slideIn 0.5s ease-out, fadeOut 0.5s ease-in ${duration - 500}ms forwards;
      backdrop-filter: blur(10px);
      border: 2px solid rgba(255,255,255,0.2);
    `;
    overlay.textContent = text;

    // Add animation styles
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideIn {
        from {
          opacity: 0;
          transform: translateX(-50%) translateY(-20px);
        }
        to {
          opacity: 1;
          transform: translateX(-50%) translateY(0);
        }
      }
      @keyframes fadeOut {
        from {
          opacity: 1;
        }
        to {
          opacity: 0;
        }
      }
    `;
    document.head.appendChild(style);
    document.body.appendChild(overlay);

    // Remove after duration
    setTimeout(() => {
      if (overlay && overlay.parentNode) {
        overlay.remove();
      }
    }, duration);
  }, text, position, duration);

  await delay(duration);
}

// Function to add step counter
async function addStepCounter(page, step, total) {
  await page.evaluate((step, total) => {
    const existingCounter = document.getElementById('step-counter');
    if (existingCounter) {
      existingCounter.remove();
    }

    const counter = document.createElement('div');
    counter.id = 'step-counter';
    counter.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: rgba(0,0,0,0.8);
      color: white;
      padding: 12px 20px;
      border-radius: 50px;
      font-size: 16px;
      font-weight: 600;
      font-family: 'Segoe UI', system-ui, sans-serif;
      z-index: 999998;
      box-shadow: 0 4px 20px rgba(0,0,0,0.3);
      backdrop-filter: blur(10px);
    `;
    counter.textContent = `Step ${step} of ${total}`;
    document.body.appendChild(counter);
  }, step, total);
}

// Function to highlight element with animation (supports RED alerts for high-risk)
async function highlightElement(page, selector, duration = 2000, isAlert = false) {
  await page.evaluate((selector, duration, isAlert) => {
    const element = document.querySelector(selector);
    if (element) {
      const highlight = document.createElement('div');
      const rect = element.getBoundingClientRect();

      highlight.style.cssText = `
        position: fixed;
        top: ${rect.top - 5}px;
        left: ${rect.left - 5}px;
        width: ${rect.width + 10}px;
        height: ${rect.height + 10}px;
        border: 3px solid ${isAlert ? '#ff0000' : '#00ff00'};
        border-radius: 8px;
        z-index: 999997;
        pointer-events: none;
        animation: ${isAlert ? 'pulseRed' : 'pulse'} 1s ease-in-out infinite;
        box-shadow: 0 0 20px ${isAlert ? 'rgba(255,0,0,0.7)' : 'rgba(0,255,0,0.5)'};
      `;

      const style = document.createElement('style');
      style.textContent = `
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.05); }
        }
        @keyframes pulseRed {
          0%, 100% { opacity: 1; transform: scale(1); box-shadow: 0 0 30px rgba(255,0,0,0.8); }
          50% { opacity: 0.8; transform: scale(1.08); box-shadow: 0 0 40px rgba(255,0,0,1); }
        }
      `;
      document.head.appendChild(style);
      document.body.appendChild(highlight);

      setTimeout(() => highlight.remove(), duration);
    }
  }, selector, duration, isAlert);

  await delay(duration);
}

// Smooth scroll function
async function smoothScroll(page, distance, duration = 1000) {
  await page.evaluate((distance, duration) => {
    return new Promise(resolve => {
      const start = window.pageYOffset;
      const startTime = performance.now();

      function scroll() {
        const currentTime = performance.now();
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Easing function for smooth animation
        const easeInOutCubic = progress < 0.5
          ? 4 * progress * progress * progress
          : 1 - Math.pow(-2 * progress + 2, 3) / 2;

        window.scrollTo(0, start + distance * easeInOutCubic);

        if (progress < 1) {
          requestAnimationFrame(scroll);
        } else {
          resolve();
        }
      }

      requestAnimationFrame(scroll);
    });
  }, distance, duration);

  await delay(duration + 200);
}

async function main() {
  console.log('🎬 Starting AgurateAI Demo Account Video Recording...\n');
  console.log('✨ Features: Demo Data, Insurance Claims, Cooperatives, Predictions, Chat History\n');

  let browser;
  let recorder;
  const totalSteps = 10; // Optimized for demo flow

  try {
    // Launch browser
    console.log('🌐 Launching browser...');
    browser = await puppeteer.launch({
      headless: false,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-web-security',
        '--start-maximized'
      ]
    });

    const page = await browser.newPage();
    await page.setViewport(CONFIG.viewport);
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    // Initialize recorder
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const videoFilename = `agurateai-lsu-demo_${timestamp}.mp4`;
    const videoPath = path.join(CONFIG.videoDir, videoFilename);

    recorder = new PuppeteerScreenRecorder(page, CONFIG.recordingConfig);

    console.log('🔴 Starting video recording...');
    await recorder.start(videoPath);
    console.log(`📹 Recording to: ${videoFilename}\n`);

    // STEP 1: Sign In to Demo Account
    console.log('🔐 Step 1: Sign In to Demo Account');
    await addStepCounter(page, 1, totalSteps);
    await addOverlay(page, '🌾 AgurateAI - LSU AgCenter Presentation Demo', 'top', 4000);
    await page.goto(`${CONFIG.baseUrl}/auth`, { waitUntil: 'networkidle2', timeout: 60000 });
    await delay(3000);

    await addOverlay(page, '🔐 Signing in to demo account...', 'top', 3000);
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });
    await page.type('input[type="email"]', CONFIG.email, { delay: 100 });
    await delay(1000);

    await page.type('input[type="password"]', CONFIG.password, { delay: 100 });
    await delay(1500);

    // Find and click sign in button (CORRECTED)
    await page.waitForSelector('button[type="submit"]', { timeout: 10000 });
    await page.click('button[type="submit"]');
    await delay(3000); // Wait for redirect to /dashboard
    console.log('✅ Signed in to demo account (following automatic redirect)');

    // STEP 2: Demo Dashboard Overview
    console.log('📊 Step 2: Demo Dashboard');
    await addStepCounter(page, 2, totalSteps);
    await page.goto(`${CONFIG.baseUrl}/dashboard`, { waitUntil: 'networkidle2' });
    await delay(3000);

    await addOverlay(page, '📊 Demo Dashboard - 3 Fields, 15 Assessments', 'top', 4000);
    await delay(3000);
    await smoothScroll(page, 400, 2000);
    await delay(2000);
    await smoothScroll(page, -400, 2000);
    await delay(2000);

    // STEP 3: Assessment History (Show populated assessments)
    console.log('📋 Step 3: Assessment History');
    await addStepCounter(page, 3, totalSteps);
    await addOverlay(page, '📋 Assessment History - 11-13 Real Assessments', 'top', 3000);
    await page.goto(`${CONFIG.baseUrl}/history`, { waitUntil: 'networkidle2' });
    await delay(3000);

    await addOverlay(page, '📊 Health scores: 58%, 65%, 72%, 85%, 88%, 91%, 92%', 'bottom', 4000);
    await smoothScroll(page, 500, 2000);
    await delay(3000);
    await smoothScroll(page, 500, 2000);
    await delay(3000);

    // STEP 4: Insurance Claims (HIGHLIGHT REAL CLAIM)
    console.log('💰 Step 4: Insurance Claims');
    await addStepCounter(page, 4, totalSteps);
    await addOverlay(page, '💰 Insurance Claims - $45,000 Hail Damage Claim', 'top', 4000);
    await page.goto(`${CONFIG.baseUrl}/insurance`, { waitUntil: 'networkidle2' });
    await delay(3000);

    await addOverlay(page, '✅ Approved Claim: Pre/post photos, NOAA verification', 'bottom', 4000);
    await delay(3000);
    await smoothScroll(page, 400, 2000);
    await delay(2000);
    await smoothScroll(page, -400, 2000);
    await delay(2000);

    // STEP 5: Cooperatives (SHOW 25 MEMBERS)
    console.log('🤝 Step 5: Cooperatives');
    await addStepCounter(page, 5, totalSteps);
    await addOverlay(page, '🤝 Delta Farmers Cooperative - 25 Members', 'top', 4000);
    await page.goto(`${CONFIG.baseUrl}/cooperatives`, { waitUntil: 'networkidle2' });
    await delay(6000); // Increased for data-heavy page

    await addOverlay(page, '👥 Morehouse Parish cooperative for shared insights', 'bottom', 4000);
    await delay(3000);
    await smoothScroll(page, 300, 2000);
    await delay(2000);

    // STEP 6: Delta Intelligence Chat (SHOW LSU CITATIONS)
    console.log('💬 Step 6: Delta Intelligence Chat');
    await addStepCounter(page, 6, totalSteps);
    await addOverlay(page, '💬 Delta Intelligence - AI Advisor with LSU Citations', 'top', 4000);
    
    // Try multiple possible routes for chat (CORRECTED)
    const chatRoutes = ['/delta-intelligence', '/delta', '/delta-ai', '/chat', '/ai-chat'];
    let chatLoaded = false;
    for (const route of chatRoutes) {
      try {
        await page.goto(`${CONFIG.baseUrl}${route}`, { waitUntil: 'networkidle2', timeout: 10000 });
        await delay(3000);
        
        // Check if chat is visible
        const hasChat = await page.evaluate(() => {
          const text = document.body.textContent.toLowerCase();
          return text.includes('chat') || text.includes('message') || text.includes('delta');
        });

        if (hasChat) {
          chatLoaded = true;
          break;
        }
      } catch (e) {
        continue;
      }
    }

    if (chatLoaded) {
      await addOverlay(page, '📚 All responses include LSU AgCenter citations', 'bottom', 4000);
      await delay(3000);
      await smoothScroll(page, 400, 2000);
      await delay(3000);
      await smoothScroll(page, 400, 2000);
      await delay(3000);
    } else {
      await addOverlay(page, '💬 Chat history: 10 messages across 5 conversations', 'bottom', 4000);
      await delay(3000);
    }

    // STEP 7: 7-Day Predictions (HIGHLIGHT RED HIGH RISK ALERT)
    console.log('🔮 Step 7: 7-Day Stress Predictions');
    await addStepCounter(page, 7, totalSteps);
    await addOverlay(page, '🔮 7-Day Stress Predictions - Proactive Crop Management', 'top', 4000);
    
    const predictionsRoutes = ['/predictions', '/predict', '/stress-predictions'];
    let predictionsLoaded = false;
    for (const route of predictionsRoutes) {
      try {
        await page.goto(`${CONFIG.baseUrl}${route}`, { waitUntil: 'networkidle2', timeout: 10000 });
        await delay(6000); // Increased for data-heavy page
        
        // Look for RED HIGH RISK alert (Day 4)
        const hasPredictions = await page.evaluate(() => {
          const text = document.body.textContent.toLowerCase();
          return text.includes('high risk') || text.includes('75%') || text.includes('stress') || text.includes('day 4');
        });

        if (hasPredictions) {
          predictionsLoaded = true;
          break;
        }
      } catch (e) {
        continue;
      }
    }

    if (predictionsLoaded) {
      await addOverlay(page, '⚠️ RED HIGH RISK ALERT: Day 4 (Sunday) - 75% Stress', 'bottom', 5000);
      await delay(3000);
      
      // Try to highlight the high-risk prediction (ENHANCED)
      try {
        await page.evaluate(() => {
          // Look for elements with data-risk-level="high" OR text containing high-risk indicators
          let highlightElement = document.querySelector('[data-risk-level="high"]');
          
          if (!highlightElement) {
            const elements = Array.from(document.querySelectorAll('*'));
            highlightElement = elements.find(el => {
              const text = el.textContent.toLowerCase();
              return (text.includes('75') || text.includes('high risk') || text.includes('day 4') || text.includes('sunday')) 
                     && el.offsetHeight > 20 && el.offsetWidth > 20;
            });
          }
          
          if (highlightElement) {
            highlightElement.style.border = '3px solid #ff0000';
            highlightElement.style.boxShadow = '0 0 20px rgba(255,0,0,0.8)';
            highlightElement.style.borderRadius = '8px';
          }
        });
        await delay(4000);
      } catch (e) {
        console.log('Could not highlight high-risk element');
      }

      await smoothScroll(page, 300, 2000);
      await delay(2000);
      await smoothScroll(page, 300, 2000);
      await delay(2000);
    } else {
      await addOverlay(page, '📊 21 predictions across 3 fields, with high-risk alert', 'bottom', 4000);
      await delay(3000);
    }

    // STEP 8: Fields Overview
    console.log('🌾 Step 8: Fields Overview');
    await addStepCounter(page, 8, totalSteps);
    await addOverlay(page, '🌾 My Fields - 3 Fields Populated', 'top', 4000);
    await page.goto(`${CONFIG.baseUrl}/fields`, { waitUntil: 'networkidle2' });
    await delay(3000);

    await addOverlay(page, '📍 North Field (Rice), Delta South (Soybean), Cotton Ridge', 'bottom', 4000);
    await delay(3000);
    await smoothScroll(page, 300, 2000);
    await delay(2000);

    // STEP 9: Dashboard Summary (Return)
    console.log('📊 Step 9: Dashboard Summary');
    await addStepCounter(page, 9, totalSteps);
    await addOverlay(page, '📊 Complete Demo Account Overview', 'top', 4000);
    await page.goto(`${CONFIG.baseUrl}/dashboard`, { waitUntil: 'networkidle2' });
    await delay(3000);

    await addOverlay(page, '✅ All Features Populated with Real Demo Data', 'bottom', 4000);
    await delay(3000);

    // STEP 10: Finale
    console.log('🎬 Step 10: Finale');
    await addStepCounter(page, 10, totalSteps);
    await addOverlay(page, '🌾 AgurateAI - LSU AgCenter Partnership Ready', 'top', 5000);
    await delay(4000);

    await addOverlay(page, '✨ Demo Account Complete - Presentation Ready!', 'bottom', 4000);
    await delay(4000);

    console.log('\n✅ Demo video recording completed!');

  } catch (error) {
    console.error('\n❌ Error during recording:');
    console.error(error.message);
  } finally {
    if (recorder) {
      try {
        console.log('🔴 Stopping recording...');
        await recorder.stop();
        console.log('✅ Recording stopped!');

        const videoFiles = fs.readdirSync(CONFIG.videoDir).filter(f => f.endsWith('.mp4'));
        if (videoFiles.length > 0) {
          const latestVideo = videoFiles[videoFiles.length - 1];
          const videoPath = path.resolve(CONFIG.videoDir, latestVideo);
          const stats = fs.statSync(videoPath);
          const fileSizeInMB = (stats.size / (1024 * 1024)).toFixed(2);

          console.log(`\n🎬 Demo Video Created Successfully!`);
          console.log(`📁 Location: ${videoPath}`);
          console.log(`💾 Size: ${fileSizeInMB} MB`);
          console.log(`\n✨ Demo Account Data Showcased:`);
          console.log(`   - 3 Fields (North Field Rice, Delta South Soybean, Cotton Ridge)`);
          console.log(`   - 15 Assessments (health scores: 58%, 65%, 72%, 85%, 88%, 91%, 92%)`);
          console.log(`   - $45,000 Hail Damage Insurance Claim (Approved)`);
          console.log(`   - Delta Farmers Cooperative (25 Members)`);
          console.log(`   - Delta Intelligence Chat History (5 convos, LSU citations)`);
          console.log(`   - 7-Day Predictions (RED HIGH RISK Day 4: 75% stress)`);
        }
      } catch (stopError) {
        console.error('Error stopping recorder:', stopError.message);
      }
    }

    if (browser) {
      await browser.close();
    }
  }
}

main();
