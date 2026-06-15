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

  console.log("Navigating directly to http://localhost:5173/teacher/teacher_2 ...");
  const response = await page.goto('http://localhost:5173/teacher/teacher_2', { waitUntil: 'networkidle2' });
  console.log("Response status:", response.status());

  await page.evaluate(() => new Promise(resolve => setTimeout(resolve, 2000)));

  console.log("Page title:", await page.title());
  console.log("Body inner text preview:", await page.evaluate(() => document.body.innerText.substring(0, 500)));

  await browser.close();
}

run().catch(console.error);
