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

  // Type credentials specifically inside the modal (using correct password 'password123')
  console.log("Typing parent credentials...");
  await page.focus('div[class*="relative bg-brand-cream border"] input[type="email"]');
  await page.type('div[class*="relative bg-brand-cream border"] input[type="email"]', 'parent@edubridge.com');
  await page.focus('div[class*="relative bg-brand-cream border"] input[type="password"]');
  await page.type('div[class*="relative bg-brand-cream border"] input[type="password"]', 'password123');

  // Click submit Log In button inside the modal
  console.log("Submitting login form...");
  await page.evaluate(() => {
    const modalForm = document.querySelector('div[class*="relative bg-brand-cream border"] form');
    const submitBtn = modalForm.querySelector('button[type="submit"]');
    if (submitBtn) submitBtn.click();
  });

  console.log("Waiting for dashboard to load...");
  await page.evaluate(() => new Promise(resolve => setTimeout(resolve, 3000)));

  console.log("Current URL after login:", page.url());
  
  // Click the 'Find & Book Tutors' tab
  console.log("Clicking 'Find & Book Tutors' tab...");
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const tab = buttons.find(b => b.textContent.includes('Find & Book Tutors') || b.textContent.includes('Marketplace'));
    if (tab) tab.click();
  });

  await page.evaluate(() => new Promise(resolve => setTimeout(resolve, 1000)));

  // Click on a teacher's card (Adebayo Okafor)
  console.log("Clicking Adebayo Okafor's card...");
  const clickedCard = await page.evaluate(() => {
    const headers = Array.from(document.querySelectorAll('h3'));
    const adebayoHeader = headers.find(h => h.textContent.includes('Adebayo Okafor'));
    if (adebayoHeader) {
      adebayoHeader.click();
      return true;
    }
    return false;
  });
  console.log("Clicked card:", clickedCard);

  await page.evaluate(() => new Promise(resolve => setTimeout(resolve, 2000)));
  console.log("Current URL after clicking profile:", page.url());

  // Click back to home button
  console.log("Clicking 'Back to Home' button...");
  const clickedBack = await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const backBtn = buttons.find(b => b.textContent.toLowerCase().includes('back to home') || b.textContent.toLowerCase().includes('return to homepage'));
    if (backBtn) {
      backBtn.click();
      return true;
    }
    return false;
  });
  console.log("Clicked back:", clickedBack);

  await page.evaluate(() => new Promise(resolve => setTimeout(resolve, 2000)));
  console.log("Current URL after going back:", page.url());

  // Get body inner text preview to check if it's blank
  const bodyText = await page.evaluate(() => document.body.innerText.substring(0, 300));
  console.log("Body preview after going back:", bodyText);

  await browser.close();
}

run().catch(console.error);
