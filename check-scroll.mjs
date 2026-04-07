import { chromium } from 'playwright';
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
await page.goto('https://www.cyberfate.me/bazi', { waitUntil: 'networkidle', timeout: 30000 });

// 滚动前
const before = await page.evaluate(() => {
  const header = document.querySelector('header');
  const main = document.querySelector('main');
  const hRect = header?.getBoundingClientRect();
  const mRect = main?.getBoundingClientRect();
  const mCs = main ? window.getComputedStyle(main) : null;
  return {
    header_top: hRect?.top,
    header_bottom: hRect?.bottom,
    main_top: mRect?.top,
    main_paddingTop: mCs?.paddingTop,
    scrollY: window.scrollY
  };
});
console.log('Before scroll:', JSON.stringify(before, null, 2));

// 滚动 500px
await page.evaluate(() => window.scrollTo(0, 500));
await page.waitForTimeout(500);
const after500 = await page.evaluate(() => {
  const header = document.querySelector('header');
  return { header_top: header?.getBoundingClientRect().top, scrollY: window.scrollY };
});
console.log('After 500px:', JSON.stringify(after500));
await page.screenshot({ path: '/tmp/cyberfate-after-scroll.png' });

// 滚动 1500px
await page.evaluate(() => window.scrollTo(0, 1500));
await page.waitForTimeout(500);
const after1500 = await page.evaluate(() => {
  const header = document.querySelector('header');
  return { header_top: header?.getBoundingClientRect().top, scrollY: window.scrollY };
});
console.log('After 1500px:', JSON.stringify(after1500));
await page.screenshot({ path: '/tmp/cyberfate-after-1500.png' });

await browser.close();
