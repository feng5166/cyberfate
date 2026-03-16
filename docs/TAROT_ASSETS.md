# 塔罗牌素材说明

## 📁 文件位置

### 图片资源
`/public/images/tarot/cards/`
- `major/` - 大阿尔卡纳 22张 (maj00.jpg - maj21.jpg)
- `cups/` - 圣杯 14张 (cups01.jpg - cups14.jpg)
- `pentacles/` - 星币 14张 (pents01.jpg - pents14.jpg)
- `swords/` - 宝剑 14张 (swords01.jpg - swords14.jpg)
- `wands/` - 权杖 14张 (wands01.jpg - wands14.jpg)

### 数据文件
`/src/data/`
- `tarot-data.json` - 大阿尔卡纳数据
- `tarot-minor-cups.json` - 圣杯数据
- `tarot-minor-pentacles.json` - 星币数据
- `tarot-minor-swords.json` - 宝剑数据
- `tarot-minor-wands.json` - 权杖数据

### 设计参考
`/design/share-card-template.html` - 分享卡片设计模板

## 🎨 使用示例

### 图片路径
```typescript
const cardImage = `/images/tarot/cards/major/maj00.jpg`
```

### 数据结构
```typescript
interface TarotCard {
  id: number | string;
  name_en: string;
  name_zh: string;
  keywords: string[];
  upright: string;
  reversed: string;
}
```

## 📋 数据说明

每张牌包含：
- `name_zh` - 中文名称
- `name_en` - 英文名称
- `keywords` - 关键词数组（3-4个）
- `upright` - 正位牌意
- `reversed` - 逆位牌意

## 🎴 分享卡片设计

参考 `/design/share-card-template.html`

**推荐方案**：紫色渐变背景
- 尺寸：1080x1920px
- 配色：#8B5CF6 → #6366F1
- 包含：品牌logo、塔罗牌图、牌名、关键词、解读文字、二维码

---

**交付人**: 美术虾 🎨
**日期**: 2026-03-16
