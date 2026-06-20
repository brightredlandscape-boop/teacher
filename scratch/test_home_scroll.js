import puppeteer from 'puppeteer';

async function run() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();

  page.on('console', msg => {
    console.log(`[BROWSER CONSOLE ${msg.type().toUpperCase()}] ${msg.text()}`);
  });

  page.on('pageerror', err => {
    console.log(`[BROWSER EXCEPTION] ${err.stack || err.toString()}`);
  });

  console.log("Navigating to https://teacher-eta-one.vercel.app/ ...");
  await page.goto('https://teacher-eta-one.vercel.app/', { waitUntil: 'networkidle2' });
  console.log("Home page loaded. URL:", page.url());

  // Check initial scroll
  let scrollY = await page.evaluate(() => window.scrollY);
  console.log("Initial scrollY:", scrollY);

  // Take initial screenshot of Hero
  const initialScreenshotPath = 'C:\\Users\\USER\\.gemini\\antigravity-ide\\brain\\acd841fe-2c3a-4da9-b86c-5f4b2a8d12ae\\initial_hero.png';
  await page.screenshot({ path: initialScreenshotPath });
  console.log("Initial Hero screenshot saved to:", initialScreenshotPath);

  // Check if "Find a Teacher Now" button is visible and click it
  try {
    const buttonSelector = 'a[href="#marketplace"]';
    await page.waitForSelector(buttonSelector, { timeout: 5000 });
    console.log("Find a Teacher Now button found. Clicking it...");
    
    // Get button bounding box
    const buttonElement = await page.$(buttonSelector);
    const box = await buttonElement.boundingBox();
    console.log("Button position:", box);

    await page.click(buttonSelector);
    console.log("Button clicked. Waiting for scroll animation...");
    
    await page.evaluate(() => new Promise(resolve => setTimeout(resolve, 2000)));

    scrollY = await page.evaluate(() => window.scrollY);
    console.log("ScrollY after click:", scrollY);

    const afterScreenshotPath = 'C:\\Users\\USER\\.gemini\\antigravity-ide\\brain\\acd841fe-2c3a-4da9-b86c-5f4b2a8d12ae\\after_click.png';
    await page.screenshot({ path: afterScreenshotPath });
    console.log("After-click screenshot saved to:", afterScreenshotPath);

  } catch (e) {
    console.log("Error during click/scroll test:", e.message);
  }

  await browser.close();
}

run().catch(console.error);
