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
  console.log("Body HTML structure preview:");
  const bodyHtml = await page.evaluate(() => document.body.innerHTML);
  console.log(bodyHtml.substring(0, 1000));

  await browser.close();
}

run().catch(console.error);
