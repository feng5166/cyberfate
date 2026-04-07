import { chromium } from 'playwright';
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

// 测试首页
await page.goto('https://www.cyberfate.me/', { waitUntil: 'networkidle', timeout: 30000 });
await page.screenshot({ path: '/tmp/home-before.png' });
const homeBefore = await page.evaluate(() => {
  const h = document.querySelector('header');
  return { pos: window.getComputedStyle(h).position, top: h.getBoundingClientRect().top };
});
console.log('Home before:', JSON.stringify(homeBefore));

await page.evaluate(() => window.scrollTo(0, 800));
await page.waitForTimeout(500);
await page.screenshot({ path: '/tmp/home-after-scroll.png' });
const homeAfter = await page.evaluate(() => {
  const h = document.querySelector('header');
  return { top: h.getBoundingClientRect().top, scrollY: window.scrollY };
});
console.log('Home after 800px scroll:', JSON.stringify(homeAfter));

await browser.close();
