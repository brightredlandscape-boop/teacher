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

  console.log("Navigating to http://localhost:5173/ ...");
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle2' });

  // Click Log In button in Navbar
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('nav button'));
    const loginBtn = buttons.find(b => b.textContent.includes('Log In'));
    if (loginBtn) loginBtn.click();
  });

  console.log("Waiting for auth modal to open...");
  await page.waitForSelector('div[class*="relative bg-brand-cream border"] input[type="email"]', { timeout: 5000 });

  // Type credentials specifically inside the modal
  console.log("Typing parent credentials...");
  await page.focus('div[class*="relative bg-brand-cream border"] input[type="email"]');
  await page.type('div[class*="relative bg-brand-cream border"] input[type="email"]', 'parent@edubridge.com');
  await page.focus('div[class*="relative bg-brand-cream border"] input[type="password"]');
  await page.type('div[class*="relative bg-brand-cream border"] input[type="password"]', 'parent123');

  // Click submit Log In button inside the modal
  console.log("Submitting login form...");
  await page.evaluate(() => {
    const modalForm = document.querySelector('div[class*="relative bg-brand-cream border"] form');
    const submitBtn = modalForm.querySelector('button[type="submit"]');
    if (submitBtn) submitBtn.click();
  });

  console.log("Waiting for dashboard to load...");
  await page.evaluate(() => new Promise(resolve => setTimeout(resolve, 3000)));

  // Print current page URL and preview of body text to confirm login
  console.log("Current URL after login:", page.url());
  
  // Click the 'Find & Book Tutors' tab
  console.log("Clicking 'Find & Book Tutors' tab in Parent Dashboard...");
  const clickedTab = await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const tab = buttons.find(b => b.textContent.includes('Find & Book Tutors') || b.textContent.includes('Marketplace'));
    if (tab) {
      tab.click();
      return true;
    }
    return false;
  });
  console.log("Clicked tab:", clickedTab);

  await page.evaluate(() => new Promise(resolve => setTimeout(resolve, 2000)));

  // Check if marketplace loaded inside parent dashboard
  const marketplacePreview = await page.evaluate(() => {
    const el = document.querySelector('#marketplace');
    return el ? el.innerText.substring(0, 300) : "Marketplace element NOT found inside dashboard";
  });
  console.log("Marketplace content inside dashboard:", marketplacePreview);

  await browser.close();
}

run().catch(console.error);
