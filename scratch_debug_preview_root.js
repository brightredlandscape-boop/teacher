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

  console.log("Navigating to http://localhost:4173/ ...");
  await page.goto('http://localhost:4173/', { waitUntil: 'networkidle2' });
  console.log("Local preview home page loaded.");

  // Click on the teacher card
  try {
    await page.waitForSelector('#marketplace h3.text-lg', { timeout: 5000 });
    console.log("Teacher name element found. Clicking it...");
    await page.click('#marketplace h3.text-lg');
    
    await page.evaluate(() => new Promise(resolve => setTimeout(resolve, 3000)));
    console.log("URL after clicking teacher card:", page.url());
    console.log("Page title after navigation:", await page.title());
    console.log("Body inner text preview after navigation:", await page.evaluate(() => document.body.innerText.substring(0, 500)));
  } catch (e) {
    console.log("Failed to click teacher card:", e.message);
  }

  await browser.close();
}

run().catch(console.error);
