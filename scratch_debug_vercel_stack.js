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
    console.log(`[BROWSER EXCEPTION STACK] ${err.stack || err.toString()}`);
  });

  page.on('request', request => {
    // Optional: console.log(`[REQ] ${request.url()}`);
  });

  page.on('response', response => {
    const status = response.status();
    if (status >= 400) {
      console.log(`[RES ERROR] ${status} for ${response.url()}`);
    }
  });

  console.log("Navigating to https://teacher-eta-one.vercel.app/teacher/adebayo ...");
  const response = await page.goto('https://teacher-eta-one.vercel.app/teacher/adebayo', { waitUntil: 'networkidle2' });
  console.log("Response status:", response.status());

  await page.evaluate(() => new Promise(resolve => setTimeout(resolve, 3000)));

  await browser.close();
}

run().catch(console.error);

