import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('http://localhost:3000');
  
  // Accept cookies
  await page.click('#acceptCookiesBtn');
  
  // Continue as guest
  await page.click('#guestLoginBtn');

  // Test offensive name in initial popup
  await page.fill('#popupNameInput', 'fuck');
  await page.click('#savePopupNameBtn');
  const statusMsg = await page.textContent('#nameStatus');
  console.log('Offensive name status (initial):', statusMsg);

  // Test valid name
  await page.fill('#popupNameInput', 'GoodPlayer');
  await page.click('#savePopupNameBtn');
  await page.waitForSelector('#gamePanel', { state: 'visible' });
  console.log('Valid name accepted.');

  // Test offensive name in rename panel
  await page.fill('#renameInput', 'hitler');
  await page.click('#renameBtn');
  const renameStatus = await page.textContent('#renameStatus');
  console.log('Offensive name status (rename):', renameStatus);

  // Take screenshot for verification
  await page.screenshot({ path: 'verification_filter.png' });

  await browser.close();
})();
