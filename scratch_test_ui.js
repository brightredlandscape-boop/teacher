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

  // 1. Wait and check home page
  console.log("Homepage loaded.");

  // 2. Click the teacher card
  console.log("Looking for a teacher profile link...");
  // Let's find links to teacher profiles. In Marketplace.jsx, clicking on the card/name calls handleTutorProfileSelect
  // We can just evaluate standard click or look for cards.
  // Let's wait for the teacher card or click it.
  try {
    await page.waitForSelector('#marketplace div[class*="cursor-pointer"] h3', { timeout: 5000 });
    console.log("Teacher name element found. Clicking it...");
    await page.click('#marketplace div[class*="cursor-pointer"] h3');
    await page.evaluate(() => new Promise(resolve => setTimeout(resolve, 2000)));
    console.log("URL after clicking teacher card:", page.url());
  } catch (e) {
    console.log("Failed to click teacher card:", e.message);
  }

  // 3. Go back
  console.log("Clicking browser back button...");
  await page.goBack();
  await page.evaluate(() => new Promise(resolve => setTimeout(resolve, 2000)));
  console.log("URL after going back:", page.url());

  // 4. Log in as a parent
  console.log("Reloading homepage and logging in as parent...");
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle2' });
  
  try {
    // Click login button in navbar
    const loginBtnText = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('nav button'));
      const loginBtn = buttons.find(b => b.textContent.includes('Log In'));
      if (loginBtn) {
        loginBtn.click();
        return true;
      }
      return false;
    });
    console.log("Clicked login button:", loginBtnText);
    
    // Wait for auth modal and click parent autofill demo account
    await page.waitForSelector('button', { timeout: 5000 });
    const clickedParentAutofill = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const parentBtn = buttons.find(b => b.textContent.includes('Parent') && b.textContent.includes('parent@edubridge.com'));
      if (parentBtn) {
        parentBtn.click();
        return true;
      }
      return false;
    });
    console.log("Clicked parent autofill:", clickedParentAutofill);

    // Wait a bit for the autofill click to update fields and submit the login
    await page.evaluate(() => new Promise(resolve => setTimeout(resolve, 1000)));
    
    // Click submit/login button inside modal
    const clickedSubmit = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('form button'));
      const submitBtn = buttons.find(b => b.textContent.includes('Log In') || b.textContent.includes('Processing'));
      if (submitBtn) {
        submitBtn.click();
        return true;
      }
      return false;
    });
    console.log("Clicked submit login form:", clickedSubmit);

    // Wait for login redirection / dashboard load
    await page.evaluate(() => new Promise(resolve => setTimeout(resolve, 3000)));
    console.log("Page content after login (role check):", await page.evaluate(() => document.body.innerText.substring(0, 300)));

    // Now click the Marketplace tab inside Parent Dashboard
    console.log("Clicking 'Find & Book Tutors' / Marketplace tab in Parent Dashboard...");
    const clickedMarketplaceTab = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const tab = buttons.find(b => b.textContent.includes('Find & Book Tutors') || b.textContent.includes('Marketplace'));
      if (tab) {
        tab.click();
        return true;
      }
      return false;
    });
    console.log("Clicked Marketplace tab:", clickedMarketplaceTab);

    // Wait and log any errors
    await page.evaluate(() => new Promise(resolve => setTimeout(resolve, 2000)));
    console.log("Marketplace tab content preview:", await page.evaluate(() => {
      const mp = document.querySelector('#marketplace');
      return mp ? mp.innerText.substring(0, 300) : "Marketplace element not found";
    }));

  } catch (e) {
    console.log("Failed to simulate parent login and marketplace check:", e.message);
  }

  await browser.close();
}

run().catch(console.error);
