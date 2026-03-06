# 赛博命理师 (CyberFate) 视觉设计规范

> **作者**: 美术虾 🎨
> **版本**: MVP v1.0
> **创建日期**: 2026-03-06
> **状态**: 待审核

---

## 一、设计理念

### 1.1 核心概念
**"赛博东方"** —— 将东方命理的神秘感与赛博朋克的科技感融合。

**关键词**: 神秘、科技、东方、理性、可信赖

### 1.2 视觉调性
- 深色系为主，营造神秘感和高级感
- 金色点缀，呼应传统命理的"贵气"
- 几何图形暗示八卦、星盘等东方符号
- 适度的光效和渐变，增加科技感

---

## 二、配色方案

### 2.1 主色板

| 用途 | 颜色名 | 色值 | 使用场景 |
|------|--------|------|----------|
| 主背景 | 深空蓝 | `#0a0a1a` | 页面底色 |
| 次背景 | 星夜紫 | `#1a1a2e` | 卡片、容器背景 |
| 强调色 | 命理金 | `#ffd700` | 按钮、重点文字、图标 |
| 辅助色 | 玄光青 | `#00d4aa` | 次要强调、成功状态 |
| 警示色 | 朱砂红 | `#ff4757` | 错误提示、警告 |

### 2.2 中性色板

| 用途 | 色值 | 使用场景 |
|------|------|----------|
| 纯白 | `#ffffff` | 主要文字 |
| 浅灰 | `#a0a0b0` | 次要文字、说明 |
| 中灰 | `#666680` | 占位符、禁用文字 |
| 深灰 | `#2a2a3e` | 边框、分割线 |
| 纯黑 | `#000000` | 深层背景 |

### 2.3 渐变色

```css
/* 主背景渐变 */
background: linear-gradient(135deg, #0a0a1a 0%, #1a1a2e 50%, #0a0a1a 100%);

/* 卡片发光效果 */
box-shadow: 0 0 20px rgba(255, 215, 0, 0.1);

/* 金色按钮渐变 */
background: linear-gradient(135deg, #ffd700 0%, #ffaa00 100%);

/* 神秘光晕 */
background: radial-gradient(ellipse at center, rgba(255, 215, 0, 0.1) 0%, transparent 70%);
```

### 2.4 五行配色

用于八字结果展示，与传统五行对应：

| 五行 | 色值 | 说明 |
|------|------|------|
| 金 | `#f5f5dc` | 米白/浅金 |
| 木 | `#4ade80` | 青绿色 |
| 水 | `#60a5fa` | 水蓝色 |
| 火 | `#f87171` | 朱红色 |
| 土 | `#fbbf24` | 土黄色 |

---

## 三、字体规范

### 3.1 字体选择

| 用途 | 中文字体 | 英文字体 | 备选 |
|------|----------|----------|------|
| 标题 | 思源宋体 | Noto Serif | 宋体 |
| 正文 | 思源黑体 | Noto Sans | 系统默认 |
| 装饰 | 站酷仓耳渔阳体 | — | 思源宋体 |
| 代码/数字 | — | JetBrains Mono | monospace |

### 3.2 字体大小

```css
/* 字体大小系统 (rem) */
--text-xs: 0.75rem;    /* 12px - 辅助说明 */
--text-sm: 0.875rem;   /* 14px - 次要文字 */
--text-base: 1rem;     /* 16px - 正文 */
--text-lg: 1.125rem;   /* 18px - 小标题 */
--text-xl: 1.25rem;    /* 20px - 中标题 */
--text-2xl: 1.5rem;    /* 24px - 大标题 */
--text-3xl: 2rem;      /* 32px - 页面标题 */
--text-4xl: 2.5rem;    /* 40px - Hero 标题 */
--text-5xl: 3rem;      /* 48px - 超大标题 */
```

### 3.3 字重

| 字重 | 数值 | 使用场景 |
|------|------|----------|
| Regular | 400 | 正文 |
| Medium | 500 | 小标题、强调 |
| Semibold | 600 | 按钮文字 |
| Bold | 700 | 大标题 |

### 3.4 行高

| 类型 | 行高 | 使用场景 |
|------|------|----------|
| 紧凑 | 1.25 | 标题 |
| 正常 | 1.5 | 短文本 |
| 宽松 | 1.75 | 长段落阅读 |

---

## 四、间距系统

### 4.1 基础间距

基于 4px 网格系统：

```css
--space-0: 0;
--space-1: 0.25rem;   /* 4px */
--space-2: 0.5rem;    /* 8px */
--space-3: 0.75rem;   /* 12px */
--space-4: 1rem;      /* 16px */
--space-5: 1.25rem;   /* 20px */
--space-6: 1.5rem;    /* 24px */
--space-8: 2rem;      /* 32px */
--space-10: 2.5rem;   /* 40px */
--space-12: 3rem;     /* 48px */
--space-16: 4rem;     /* 64px */
--space-20: 5rem;     /* 80px */
--space-24: 6rem;     /* 96px */
```

### 4.2 组件间距推荐

| 场景 | 间距 |
|------|------|
| 卡片内边距 | 24px (space-6) |
| 卡片间距 | 24px (space-6) |
| 表单项间距 | 16px (space-4) |
| 段落间距 | 16px (space-4) |
| 页面区块间距 | 64px (space-16) |
| 页面边距（桌面） | 80px (space-20) |
| 页面边距（移动） | 16px (space-4) |

---

## 五、组件样式

### 5.1 按钮 (Button)

#### 主按钮

```css
.btn-primary {
  background: linear-gradient(135deg, #ffd700 0%, #ffaa00 100%);
  color: #0a0a1a;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 1rem;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 20px rgba(255, 215, 0, 0.4);
}

.btn-primary:active {
  transform: translateY(0);
}

.btn-primary:disabled {
  background: #666680;
  color: #a0a0b0;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}
```

#### 次按钮

```css
.btn-secondary {
  background: transparent;
  color: #ffd700;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 1rem;
  border: 1px solid #ffd700;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-secondary:hover {
  background: rgba(255, 215, 0, 0.1);
}
```

#### 幽灵按钮

```css
.btn-ghost {
  background: transparent;
  color: #a0a0b0;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 500;
  border: 1px solid #2a2a3e;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-ghost:hover {
  color: #ffffff;
  border-color: #666680;
}
```

#### 按钮尺寸

| 尺寸 | padding | font-size |
|------|---------|-----------|
| Small | 8px 16px | 14px |
| Medium | 12px 24px | 16px |
| Large | 16px 32px | 18px |

---

### 5.2 卡片 (Card)

```css
.card {
  background: rgba(26, 26, 46, 0.8);
  border: 1px solid rgba(255, 215, 0, 0.1);
  border-radius: 16px;
  padding: 24px;
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
}

.card:hover {
  transform: translateY(-4px);
  border-color: rgba(255, 215, 0, 0.3);
  box-shadow: 0 8px 32px rgba(255, 215, 0, 0.1);
}

/* 功能入口卡片 - 带图标 */
.card-feature {
  text-align: center;
  cursor: pointer;
}

.card-feature .icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.card-feature .title {
  font-size: 20px;
  font-weight: 600;
  color: #ffffff;
  margin-bottom: 8px;
}

.card-feature .desc {
  font-size: 14px;
  color: #a0a0b0;
}

/* 命盘卡片 */
.card-bazi {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  text-align: center;
}

.card-bazi .pillar {
  padding: 16px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 8px;
}

.card-bazi .pillar-title {
  font-size: 12px;
  color: #a0a0b0;
  margin-bottom: 8px;
}

.card-bazi .pillar-ganzhi {
  font-size: 24px;
  font-weight: 700;
  color: #ffd700;
  font-family: 'Noto Serif', serif;
}
```

---

### 5.3 输入框 (Input)

```css
.input-group {
  margin-bottom: 16px;
}

.input-label {
  display: block;
  font-size: 14px;
  color: #a0a0b0;
  margin-bottom: 8px;
  font-weight: 500;
}

.input-field {
  width: 100%;
  padding: 12px 16px;
  background: rgba(10, 10, 26, 0.8);
  border: 1px solid #2a2a3e;
  border-radius: 8px;
  color: #ffffff;
  font-size: 16px;
  transition: all 0.2s ease;
}

.input-field:focus {
  outline: none;
  border-color: #ffd700;
  box-shadow: 0 0 0 2px rgba(255, 215, 0, 0.1);
}

.input-field:hover:not(:focus) {
  border-color: #666680;
}

.input-field::placeholder {
  color: #666680;
}

/* 错误状态 */
.input-field.error {
  border-color: #ff4757;
}

.input-error {
  font-size: 12px;
  color: #ff4757;
  margin-top: 4px;
}
```

---

### 5.4 下拉选择 (Select)

```css
.select-field {
  width: 100%;
  padding: 12px 16px;
  padding-right: 40px;
  background: rgba(10, 10, 26, 0.8);
  border: 1px solid #2a2a3e;
  border-radius: 8px;
  color: #ffffff;
  font-size: 16px;
  appearance: none;
  cursor: pointer;
  background-image: url("data:image/svg+xml,..."); /* 下拉箭头 */
  background-repeat: no-repeat;
  background-position: right 16px center;
}

.select-field:focus {
  outline: none;
  border-color: #ffd700;
}
```

---

### 5.5 星级评分 (Rating)

用于运势展示：

```css
.rating {
  display: flex;
  gap: 4px;
}

.rating-star {
  font-size: 20px;
  color: #2a2a3e;
}

.rating-star.active {
  color: #ffd700;
}

/* 带标签的评分 */
.rating-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 0;
}

.rating-label {
  color: #a0a0b0;
  font-size: 14px;
}
```

---

### 5.6 标签 (Tag)

用于宜忌、幸运提示：

```css
.tag {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 16px;
  font-size: 14px;
  font-weight: 500;
}

.tag-suitable {
  background: rgba(0, 212, 170, 0.1);
  color: #00d4aa;
  border: 1px solid rgba(0, 212, 170, 0.3);
}

.tag-avoid {
  background: rgba(255, 71, 87, 0.1);
  color: #ff4757;
  border: 1px solid rgba(255, 71, 87, 0.3);
}

.tag-lucky {
  background: rgba(255, 215, 0, 0.1);
  color: #ffd700;
  border: 1px solid rgba(255, 215, 0, 0.3);
}
```

---

### 5.7 加载动画 (Loading)

```css
/* 圆形旋转 */
.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #2a2a3e;
  border-top-color: #ffd700;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* 八卦旋转（特色加载） */
.bagua-spinner {
  width: 60px;
  height: 60px;
  background-image: url('/bagua.svg');
  animation: bagua-spin 2s linear infinite;
}

@keyframes bagua-spin {
  to { transform: rotate(360deg); }
}

/* 骨架屏 */
.skeleton {
  background: linear-gradient(
    90deg,
    #2a2a3e 25%,
    #3a3a4e 50%,
    #2a2a3e 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: 4px;
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
```

---

## 六、响应式布局

### 6.1 断点定义

```css
/* Tailwind CSS 断点 */
--screen-sm: 640px;   /* 手机横屏 */
--screen-md: 768px;   /* 平板竖屏 */
--screen-lg: 1024px;  /* 平板横屏/小笔记本 */
--screen-xl: 1280px;  /* 桌面 */
--screen-2xl: 1536px; /* 大屏 */
```

### 6.2 容器宽度

```css
.container {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 16px;
}

@media (min-width: 768px) {
  .container { padding: 0 24px; }
}

@media (min-width: 1024px) {
  .container { padding: 0 40px; }
}
```

### 6.3 布局网格

```css
/* 功能卡片网格 */
.card-grid {
  display: grid;
  gap: 24px;
  grid-template-columns: 1fr;
}

@media (min-width: 640px) {
  .card-grid { grid-template-columns: repeat(2, 1fr); }
}

@media (min-width: 1024px) {
  .card-grid { grid-template-columns: repeat(3, 1fr); }
}

/* 命盘四柱 */
.bazi-grid {
  display: grid;
  gap: 8px;
  grid-template-columns: repeat(2, 1fr);
}

@media (min-width: 640px) {
  .bazi-grid { grid-template-columns: repeat(4, 1fr); }
}
```

---

## 七、特殊元素

### 7.1 装饰元素

#### 背景星点

```css
.stars-bg {
  position: fixed;
  inset: 0;
  background-image: 
    radial-gradient(2px 2px at 20px 30px, rgba(255, 215, 0, 0.3), transparent),
    radial-gradient(2px 2px at 40px 70px, rgba(255, 255, 255, 0.2), transparent),
    radial-gradient(1px 1px at 90px 40px, rgba(255, 215, 0, 0.2), transparent);
  background-size: 200px 200px;
  animation: twinkle 4s ease-in-out infinite;
  pointer-events: none;
  z-index: 0;
}

@keyframes twinkle {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}
```

#### 光晕效果

```css
.glow-effect {
  position: absolute;
  width: 400px;
  height: 400px;
  background: radial-gradient(
    circle,
    rgba(255, 215, 0, 0.15) 0%,
    transparent 70%
  );
  filter: blur(60px);
  pointer-events: none;
}
```

### 7.2 东方元素

- 八卦图标：用于加载动画、装饰
- 祥云图案：页脚、分割线装饰
- 龙纹/云纹：卡片边框装饰（微妙）

---

## 八、图标规范

### 8.1 功能图标

| 功能 | 图标 | 备选 |
|------|------|------|
| 八字算命 | 🔮 | 自定义 SVG |
| 紫微斗数 | ⭐ | 自定义 SVG |
| 周易占卜 | ☯️ | 自定义 SVG |
| 塔罗牌 | 🎴 | 自定义 SVG |
| 黄历 | 📅 | 自定义 SVG |

### 8.2 图标尺寸

| 场景 | 尺寸 |
|------|------|
| 导航图标 | 20px |
| 功能卡片图标 | 48px |
| 内联图标 | 16px |

---

## 九、动效规范

### 9.1 过渡时间

| 类型 | 时间 | 使用场景 |
|------|------|----------|
| 快速 | 150ms | hover 状态变化 |
| 正常 | 200ms | 按钮、输入框 |
| 较慢 | 300ms | 卡片、模态框 |
| 慢速 | 500ms | 页面切换 |

### 9.2 缓动函数

```css
--ease-default: ease;
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
--ease-out: cubic-bezier(0, 0, 0.2, 1);
--ease-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55);
```

### 9.3 动画原则

1. **有意义**：动画要传达信息或引导注意力
2. **不打扰**：避免过度动画，影响使用
3. **可关闭**：尊重 `prefers-reduced-motion`

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 十、Tailwind CSS 配置参考

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        'cyber': {
          'bg': '#0a0a1a',
          'card': '#1a1a2e',
          'gold': '#ffd700',
          'cyan': '#00d4aa',
          'red': '#ff4757',
        },
        'wuxing': {
          'metal': '#f5f5dc',
          'wood': '#4ade80',
          'water': '#60a5fa',
          'fire': '#f87171',
          'earth': '#fbbf24',
        }
      },
      fontFamily: {
        'serif': ['Noto Serif SC', 'serif'],
        'sans': ['Noto Sans SC', 'sans-serif'],
      },
      boxShadow: {
        'glow': '0 0 20px rgba(255, 215, 0, 0.1)',
        'glow-lg': '0 0 40px rgba(255, 215, 0, 0.2)',
      },
      animation: {
        'spin-slow': 'spin 3s linear infinite',
        'twinkle': 'twinkle 4s ease-in-out infinite',
      }
    }
  }
}
```

---

## 十一、设计资产清单

### MVP 需要准备

| 资产 | 格式 | 说明 |
|------|------|------|
| Logo | SVG | 「赛博命理师」文字 Logo |
| Favicon | ICO/PNG | 16x16, 32x32, 180x180 |
| OG Image | PNG | 1200x630 社交分享图 |
| 功能图标 | SVG | 5 个功能入口图标 |
| 八卦 Loading | SVG | 加载动画用 |
| 五行图标 | SVG | 金木水火土 5 个 |

---

## 十二、审核清单

- [ ] 配色方案确认
- [ ] 字体方案确认
- [ ] 按钮样式确认
- [ ] 卡片样式确认
- [ ] 输入框样式确认
- [ ] 响应式断点确认
- [ ] 特效方案确认

---

**等待大总管和 Frank 审核！** 🎨

有任何修改意见请告诉我～
