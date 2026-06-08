import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('http://localhost:3000');
  
  // Accept cookies if the popup is visible
  if (await page.isVisible('#acceptCookiesBtn')) {
    await page.click('#acceptCookiesBtn');
  }
  
  // Continue as guest if the auth panel is visible
  if (await page.isVisible('#guestLoginBtn')) {
    await page.click('#guestLoginBtn');
  }

  // Enter name if name popup is visible
  if (await page.isVisible('#popupNameInput')) {
    await page.fill('#popupNameInput', 'TestPlayer');
    await page.click('#savePopupNameBtn');
  }

  // Wait for game panel to be visible
  await page.waitForSelector('#gamePanel', { state: 'visible' });

  // Take screenshot of the whole page
  await page.screenshot({ path: 'screenshot_full.png', fullPage: true });

  // Take screenshot of leaderboard specifically
  const leaderboard = await page.$('section:has(h2:text("Leaderboard"))');
  if (leaderboard) {
    await leaderboard.screenshot({ path: 'screenshot_leaderboard.png' });
  }

  // Take screenshot of skin shop specifically
  const skinShop = await page.$('section:has(h2:text("Skins"))');
  if (skinShop) {
    await skinShop.screenshot({ path: 'screenshot_skins.png' });
  }

  await browser.close();
})();
