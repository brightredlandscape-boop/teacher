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

  // Intercept response to print network calls
  page.on('response', async response => {
    const url = response.url();
    if (url.includes('/api/')) {
      console.log(`[NETWORK RESPONSE] URL: ${url}, Status: ${response.status()}`);
      try {
        const text = await response.text();
        console.log(`[NETWORK RESPONSE BODY] ${text}`);
      } catch (e) {
        // ignore
      }
    }
  });

  console.log("Navigating to local site...");
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle2' });

  // Open Log In modal
  console.log("Opening login modal...");
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button, nav button'));
    const loginBtn = buttons.find(b => b.textContent.includes('Log In'));
    if (loginBtn) {
      loginBtn.click();
    } else {
      console.log("Log In button not found in page!");
    }
  });

  await page.evaluate(() => new Promise(resolve => setTimeout(resolve, 1000)));

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

  // Wait for login redirection
  await page.evaluate(() => new Promise(resolve => setTimeout(resolve, 3000)));

  console.log("Current URL:", page.url());

  // Click on Billing & Topup tab if it's there
  console.log("Clicking Billing & Topup tab...");
  await page.evaluate(() => {
    const tabs = Array.from(document.querySelectorAll('button, a'));
    const billingTab = tabs.find(t => t.textContent.includes('BILLING & TOPUP'));
    if (billingTab) billingTab.click();
  });

  await page.evaluate(() => new Promise(resolve => setTimeout(resolve, 1000)));

  // Click Bank Direct Transfer
  console.log("Clicking Bank Direct Transfer...");
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const bankBtn = buttons.find(b => b.textContent.includes('Bank Direct Transfer'));
    if (bankBtn) bankBtn.click();
  });

  await page.evaluate(() => new Promise(resolve => setTimeout(resolve, 500)));

  // Click Authorize Wallet Deposit
  console.log("Clicking Authorize Wallet Deposit...");
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const authBtn = buttons.find(b => b.textContent.includes('Authorize Wallet Deposit'));
    if (authBtn) authBtn.click();
  });

  await page.evaluate(() => new Promise(resolve => setTimeout(resolve, 6000)));

  await browser.close();
}

run().catch(console.error);
