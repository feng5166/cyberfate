import { chromium } from 'playwright';
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
await page.goto('https://www.cyberfate.me/bazi', { waitUntil: 'networkidle', timeout: 30000 });

const info = await page.evaluate(() => {
  const header = document.querySelector('header');
  if (!header) return JSON.stringify({ error: 'no header found' });
  const cs = window.getComputedStyle(header);
  return JSON.stringify({
    position: cs.position,
    top: cs.top,
    left: cs.left,
    right: cs.right,
    zIndex: cs.zIndex,
    style_attr: header.getAttribute('style'),
    class_name: header.className.substring(0, 200),
    parent_tag: header.parentElement?.tagName,
    parent_class: header.parentElement?.className?.substring(0, 100)
  }, null, 2);
});

console.log(info);

// Also check all header elements
const allHeaders = await page.evaluate(() => {
  return Array.from(document.querySelectorAll('header')).map(h => ({
    style: h.getAttribute('style'),
    className: h.className.substring(0, 100),
    position: window.getComputedStyle(h).position
  }));
});
console.log('All headers:', JSON.stringify(allHeaders));

await browser.close();
