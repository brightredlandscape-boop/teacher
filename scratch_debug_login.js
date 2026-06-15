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

  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle2' });

  // Open Log In modal
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('nav button'));
    const loginBtn = buttons.find(b => b.textContent.includes('Log In'));
    if (loginBtn) loginBtn.click();
  });

  await page.evaluate(() => new Promise(resolve => setTimeout(resolve, 500)));

  // Fill in email and password
  await page.type('input[type="email"]', 'parent@edubridge.com');
  await page.type('input[type="password"]', 'parent123');

  // Submit
  console.log("Form HTML before submit:");
  console.log(await page.evaluate(() => document.querySelector('form').outerHTML));

  await page.evaluate(() => {
    const submitBtn = document.querySelector('form button[type="submit"]');
    if (submitBtn) submitBtn.click();
  });

  // Wait 2 seconds
  await page.evaluate(() => new Promise(resolve => setTimeout(resolve, 2000)));

  console.log("Modal HTML after submit:");
  const modalHTML = await page.evaluate(() => {
    const modal = document.querySelector('div[class*="relative bg-brand-cream border"]');
    return modal ? modal.outerHTML : "Modal not found (closed?)";
  });
  console.log(modalHTML);

  console.log("Is logged in (localStorage edubridge_user):");
  console.log(await page.evaluate(() => localStorage.getItem('edubridge_user')));

  await browser.close();
}

run().catch(console.error);
