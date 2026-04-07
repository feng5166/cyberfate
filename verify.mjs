import { chromium } from 'playwright';
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
await page.goto('https://www.cyberfate.me/', { waitUntil: 'networkidle', timeout: 30000 });

// 等待 hydration 完成
await page.waitForTimeout(2000);

// 检查 Header 的父元素结构
const structure = await page.evaluate(() => {
  const header = document.querySelector('header');
  if (!header) return { error: 'no header' };
  
  // 向上遍历 DOM 树
  let el = header;
  const chain = [];
  while (el && chain.length < 6) {
    const cs = window.getComputedStyle(el);
    chain.push({
      tag: el.tagName,
      class: (el.className || '').toString().substring(0, 80),
      position: cs.position,
      style_attr: el.getAttribute('style') || '',
      overflow: cs.overflow
    });
    el = el.parentElement;
  }
  
  // 滚动后检查
  return { domChain: chain };
});
console.log('DOM Chain:');
console.log(JSON.stringify(structure, null, 2));

// 滚动测试
await page.evaluate(() => window.scrollTo(0, 1000));
await page.waitForTimeout(1000);
await page.screenshot({ path: '/tmp/verify-scroll-1000.png' });

const afterScroll = await page.evaluate(() => {
  const header = document.querySelector('header');
  return {
    header_top: header.getBoundingClientRect().top,
    scrollY: window.scrollY,
    header_visible: header.getBoundingClientRect().top >= -100 && header.getBoundingClientRect().top <= 100
  };
});
console.log('\nAfter scroll 1000px:', JSON.stringify(afterScroll));
await browser.close();
