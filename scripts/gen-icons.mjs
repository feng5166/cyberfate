// 从 public/favicon.svg 生成全套 PNG 图标（favicon / apple-touch / PWA icons）。
// 用法：
//   node scripts/gen-icons.mjs            # 只出预览到 scratchpad（不覆盖真图标）
//   node scripts/gen-icons.mjs --write    # 覆盖 public 下真图标
import sharp from 'sharp';
import { readFileSync } from 'fs';

const WRITE = process.argv.includes('--write');
const PREVIEW = process.env.PREVIEW_DIR || '.';
const svg = readFileSync('public/favicon.svg');

// 满铺（无圆角）版本，用于 maskable PWA 图标：背景铺满、命星居中在安全区。
// 直接复用带圆角的 favicon.svg 渲染 PNG 会在 OS 遮罩里出现「双重圆角」，故这里去掉 rx。
const fullBleedSvg = Buffer.from(
  svg.toString().replace('<rect width="512" height="512" rx="116"', '<rect width="512" height="512"'),
);

async function png(src, size) {
  return sharp(src, { density: 512 }).resize(size, size).png().toBuffer();
}

// 真图标清单：[输出路径, 尺寸, 是否满铺(maskable/app-icon)]
const ICONS = [
  ['public/favicon-16x16.png', 16, false],
  ['public/favicon-32x32.png', 32, false],
  ['public/apple-touch-icon.png', 180, true],
  ['public/icons/icon-72x72.png', 72, true],
  ['public/icons/icon-96x96.png', 96, true],
  ['public/icons/icon-128x128.png', 128, true],
  ['public/icons/icon-144x144.png', 144, true],
  ['public/icons/icon-152x152.png', 152, true],
  ['public/icons/icon-192x192.png', 192, true],
  ['public/icons/icon-384x384.png', 384, true],
  ['public/icons/icon-512x512.png', 512, true],
];

if (WRITE) {
  for (const [out, size, full] of ICONS) {
    const buf = await png(full ? fullBleedSvg : svg, size);
    await sharp(buf).toFile(out);
    console.log('wrote', out, `${size}x${size}`);
  }
  console.log('✅ 全套图标已生成');
} else {
  // 预览：大图(奶油底看质感) + 32px(小尺寸清晰度)
  const big = await png(svg, 288);
  await sharp({ create: { width: 360, height: 360, channels: 4, background: '#FAF9F6' } })
    .composite([{ input: big, top: 36, left: 36 }])
    .png().toFile(`${PREVIEW}/logo-big.png`);
  const tiny = await png(svg, 32);
  await sharp(tiny).resize(96, 96, { kernel: 'nearest' }).png().toFile(`${PREVIEW}/logo-32.png`);
  // maskable 满铺预览
  const mask = await png(fullBleedSvg, 192);
  await sharp(mask).png().toFile(`${PREVIEW}/logo-maskable.png`);
  console.log('✅ 预览已出（未覆盖真图标）');
}
