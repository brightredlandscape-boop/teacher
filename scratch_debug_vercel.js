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
    console.log(`[BROWSER EXCEPTION] ${err.toString()}`);
  });

  console.log("Navigating to https://teacher-eta-one.vercel.app/teacher/adebayo ...");
  const response = await page.goto('https://teacher-eta-one.vercel.app/teacher/adebayo', { waitUntil: 'networkidle2' });
  console.log("Response status:", response.status());

  await page.evaluate(() => new Promise(resolve => setTimeout(resolve, 3000)));

  console.log("Page title:", await page.title());
  
  const screenshotPath = 'C:\\Users\\USER\\.gemini\\antigravity-ide\\brain\\acd841fe-2c3a-4da9-b86c-5f4b2a8d12ae\\vercel_screenshot_final.png';
  await page.screenshot({ path: screenshotPath, fullPage: true });
  console.log("Screenshot saved successfully to:", screenshotPath);

  await browser.close();
}


run().catch(console.error);
