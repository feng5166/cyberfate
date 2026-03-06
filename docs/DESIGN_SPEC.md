# 赛博命理师 (CyberFate) 视觉设计规范

> **版本**: 1.0  
> **作者**: 美术虾 🎨  
> **创建日期**: 2026-03-06  
> **状态**: 待审核

---

## 一、设计理念

### 1.1 核心调性

**「赛博东方」— 科技感与东方美学的融合**

- **现代科技感**: 深色界面、发光效果、渐变色彩
- **东方神秘感**: 传统纹样、阴阳五行、书法元素
- **专业可信赖**: 简洁克制、层次分明、信息清晰

### 1.2 设计原则

1. **深色优先**: 减少视觉疲劳，营造神秘氛围
2. **金色点睛**: 金色作为强调色，体现东方贵气
3. **留白呼吸**: 适度留白，让信息有节奏感
4. **动静结合**: 微妙动效提升体验，但不喧宾夺主

---

## 二、配色方案

### 2.1 主色板

| 色彩角色 | 色值 | 用途 |
|----------|------|------|
| **主色 - 深夜蓝** | `#1a1a2e` | 主背景、容器底色 |
| **次主色 - 星空紫** | `#16213e` | 次级背景、卡片底色 |
| **深底色** | `#0f0f1a` | 页面最底层背景 |

### 2.2 强调色

| 色彩角色 | 色值 | 用途 |
|----------|------|------|
| **金色 - 皇金** | `#ffd700` | 主按钮、重要标题、图标 |
| **金色 - 暗金** | `#b8860b` | 次要强调、边框 |
| **金色渐变** | `#ffd700 → #f4a460` | 按钮渐变、特殊强调 |

### 2.3 功能色

| 色彩角色 | 色值 | 用途 |
|----------|------|------|
| **成功/木** | `#4ade80` | 成功状态、木元素 |
| **警告/火** | `#f97316` | 警告状态、火元素 |
| **错误** | `#ef4444` | 错误状态 |
| **信息/水** | `#38bdf8` | 信息提示、水元素 |
| **土** | `#a78b5a` | 土元素 |
| **金** | `#ffd700` | 金元素 |

### 2.4 五行配色

命理分析中五行各有专属颜色：

```css
--color-metal: #ffd700;  /* 金 - 金色 */
--color-wood:  #4ade80;  /* 木 - 翠绿 */
--color-water: #38bdf8;  /* 水 - 天蓝 */
--color-fire:  #f97316;  /* 火 - 橙红 */
--color-earth: #a78b5a;  /* 土 - 棕黄 */
```

### 2.5 文字色

| 色彩角色 | 色值 | 用途 |
|----------|------|------|
| **主文字** | `#f5f5f5` | 正文、标题 |
| **次文字** | `#a0a0a0` | 次要信息、描述 |
| **弱文字** | `#666666` | 占位符、禁用态 |
| **高亮文字** | `#ffd700` | 强调文字 |

### 2.6 渐变色

```css
/* 主背景渐变 */
--gradient-bg: linear-gradient(180deg, #1a1a2e 0%, #16213e 50%, #0f0f1a 100%);

/* 金色按钮渐变 */
--gradient-gold: linear-gradient(135deg, #ffd700 0%, #f4a460 100%);

/* 卡片悬停光晕 */
--gradient-glow: radial-gradient(circle at center, rgba(255, 215, 0, 0.1) 0%, transparent 70%);

/* 神秘紫光 */
--gradient-mystic: linear-gradient(135deg, #1a1a2e 0%, #2d1b4e 100%);
```

---

## 三、字体规范

### 3.1 字体家族

```css
/* 标题字体 - 宋体优先，体现东方韵味 */
--font-heading: "Noto Serif SC", "Source Han Serif SC", "思源宋体", 
                "Songti SC", serif;

/* 正文字体 - 系统默认，保证可读性 */
--font-body: "PingFang SC", "Microsoft YaHei", "Noto Sans SC", 
             system-ui, sans-serif;

/* 数字/英文字体 - 等宽字体用于八字显示 */
--font-mono: "SF Mono", "Fira Code", "JetBrains Mono", monospace;
```

### 3.2 字体大小

| 级别 | 桌面端 | 移动端 | 用途 |
|------|--------|--------|------|
| H1 | 48px | 32px | 页面主标题 |
| H2 | 36px | 24px | 区块标题 |
| H3 | 24px | 20px | 卡片标题 |
| H4 | 18px | 16px | 小标题 |
| Body | 16px | 14px | 正文 |
| Small | 14px | 12px | 辅助文字 |
| Tiny | 12px | 10px | 标签、注释 |

### 3.3 字重

| 字重 | 数值 | 用途 |
|------|------|------|
| Light | 300 | 大标题艺术字 |
| Regular | 400 | 正文 |
| Medium | 500 | 次级标题、强调 |
| Semibold | 600 | 按钮文字、标题 |
| Bold | 700 | 主标题 |

### 3.4 行高与字间距

```css
/* 行高 */
--line-height-tight: 1.25;   /* 标题 */
--line-height-normal: 1.5;   /* 正文 */
--line-height-relaxed: 1.75; /* 大段落 */

/* 字间距 */
--letter-spacing-tight: -0.02em;  /* 紧凑标题 */
--letter-spacing-normal: 0;        /* 正文 */
--letter-spacing-wide: 0.05em;     /* 强调文字 */
```

---

## 四、间距系统

### 4.1 基础间距

基于 4px 的倍数系统：

```css
--space-1: 4px;
--space-2: 8px;
--space-3: 12px;
--space-4: 16px;
--space-5: 20px;
--space-6: 24px;
--space-8: 32px;
--space-10: 40px;
--space-12: 48px;
--space-16: 64px;
--space-20: 80px;
```

### 4.2 组件间距

| 场景 | 间距 |
|------|------|
| 表单项之间 | 24px |
| 卡片内边距 | 24px (桌面) / 16px (移动) |
| 卡片之间 | 24px |
| 区块之间 | 48px (桌面) / 32px (移动) |
| 页面边距 | 24px (桌面) / 16px (移动) |

---

## 五、组件规范

### 5.1 按钮 (Button)

#### 主按钮

```css
.btn-primary {
  background: linear-gradient(135deg, #ffd700 0%, #f4a460 100%);
  color: #1a1a2e;
  font-weight: 600;
  padding: 12px 32px;
  border-radius: 8px;
  border: none;
  box-shadow: 0 4px 15px rgba(255, 215, 0, 0.3);
  transition: all 0.3s ease;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(255, 215, 0, 0.4);
}

.btn-primary:active {
  transform: translateY(0);
}

.btn-primary:disabled {
  background: #4a4a5a;
  color: #888;
  box-shadow: none;
  cursor: not-allowed;
}
```

#### 次按钮

```css
.btn-secondary {
  background: transparent;
  color: #ffd700;
  border: 1px solid #ffd700;
  padding: 12px 32px;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.btn-secondary:hover {
  background: rgba(255, 215, 0, 0.1);
}
```

#### 幽灵按钮

```css
.btn-ghost {
  background: transparent;
  color: #a0a0a0;
  border: 1px solid #4a4a5a;
  padding: 12px 32px;
  border-radius: 8px;
}

.btn-ghost:hover {
  border-color: #888;
  color: #f5f5f5;
}
```

#### 按钮尺寸

| 尺寸 | 高度 | 内边距 | 字号 |
|------|------|--------|------|
| Small | 32px | 8px 16px | 14px |
| Medium | 44px | 12px 24px | 16px |
| Large | 56px | 16px 32px | 18px |

### 5.2 卡片 (Card)

```css
.card {
  background: rgba(22, 33, 62, 0.8);
  border: 1px solid rgba(255, 215, 0, 0.1);
  border-radius: 16px;
  padding: 24px;
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
}

.card:hover {
  transform: translateY(-4px);
  border-color: rgba(255, 215, 0, 0.3);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3),
              0 0 40px rgba(255, 215, 0, 0.05);
}

/* 功能卡片（首页） */
.card-feature {
  text-align: center;
  cursor: pointer;
}

.card-feature-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.card-feature-title {
  font-size: 20px;
  font-weight: 600;
  color: #ffd700;
  margin-bottom: 8px;
}

/* 命盘卡片（结果页） */
.card-bazi {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  text-align: center;
}

.card-bazi-pillar {
  padding: 16px;
  background: rgba(26, 26, 46, 0.8);
  border-radius: 12px;
  border: 1px solid rgba(255, 215, 0, 0.2);
}
```

### 5.3 输入框 (Input)

```css
.input {
  background: rgba(15, 15, 26, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 12px 16px;
  color: #f5f5f5;
  font-size: 16px;
  width: 100%;
  transition: all 0.3s ease;
}

.input:focus {
  outline: none;
  border-color: #ffd700;
  box-shadow: 0 0 0 3px rgba(255, 215, 0, 0.1);
}

.input::placeholder {
  color: #666;
}

.input:disabled {
  background: #2a2a3a;
  color: #666;
  cursor: not-allowed;
}

/* 输入框标签 */
.input-label {
  display: block;
  font-size: 14px;
  color: #a0a0a0;
  margin-bottom: 8px;
}

/* 错误状态 */
.input-error {
  border-color: #ef4444;
}

.input-error-message {
  font-size: 12px;
  color: #ef4444;
  margin-top: 4px;
}
```

### 5.4 下拉选择 (Select)

```css
.select {
  background: rgba(15, 15, 26, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 12px 16px;
  color: #f5f5f5;
  font-size: 16px;
  width: 100%;
  cursor: pointer;
  appearance: none;
  background-image: url("data:image/svg+xml,..."); /* 下拉箭头 */
  background-repeat: no-repeat;
  background-position: right 12px center;
}

.select:focus {
  outline: none;
  border-color: #ffd700;
}
```

### 5.5 日期选择器 (Date Picker)

建议使用深色主题的日期选择器，自定义样式与整体风格统一：

```css
.date-picker {
  /* 继承 input 基础样式 */
}

/* 日历弹出层 */
.date-picker-calendar {
  background: #1a1a2e;
  border: 1px solid rgba(255, 215, 0, 0.2);
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
}

.date-picker-day:hover {
  background: rgba(255, 215, 0, 0.2);
}

.date-picker-day-selected {
  background: #ffd700;
  color: #1a1a2e;
}
```

### 5.6 星级评分 (Star Rating)

用于运势展示：

```css
.rating {
  display: flex;
  gap: 4px;
}

.rating-star {
  width: 20px;
  height: 20px;
}

.rating-star-filled {
  color: #ffd700;
}

.rating-star-empty {
  color: #4a4a5a;
}
```

### 5.7 进度条 / 五行条

```css
.wuxing-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.wuxing-label {
  width: 24px;
  text-align: center;
}

.wuxing-track {
  flex: 1;
  height: 8px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  overflow: hidden;
}

.wuxing-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.5s ease;
}

/* 各五行颜色 */
.wuxing-fill-metal { background: #ffd700; }
.wuxing-fill-wood  { background: #4ade80; }
.wuxing-fill-water { background: #38bdf8; }
.wuxing-fill-fire  { background: #f97316; }
.wuxing-fill-earth { background: #a78b5a; }
```

### 5.8 Loading 状态

```css
/* 骨架屏 */
.skeleton {
  background: linear-gradient(
    90deg,
    rgba(255, 255, 255, 0.05) 0%,
    rgba(255, 255, 255, 0.1) 50%,
    rgba(255, 255, 255, 0.05) 100%
  );
  background-size: 200% 100%;
  animation: skeleton-loading 1.5s infinite;
  border-radius: 4px;
}

@keyframes skeleton-loading {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* 加载动画 - 太极旋转 */
.loader-taiji {
  width: 48px;
  height: 48px;
  animation: spin 1.5s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
```

---

## 六、图标与装饰元素

### 6.1 图标风格

使用线性图标为主，笔触粗细 1.5px：

- 推荐图标库: **Lucide Icons** 或 **Heroicons**
- 图标尺寸: 24px (默认)、16px (小)、32px (大)
- 图标颜色: 继承文字颜色或使用金色强调

### 6.2 功能图标映射

| 功能 | 图标 | Emoji 备选 |
|------|------|------------|
| 八字算命 | crystal-ball | 🔮 |
| 紫微斗数 | stars | ⭐ |
| 周易占卜 | yin-yang | ☯️ |
| 塔罗牌 | cards | 🎴 |
| AI黄历 | calendar | 📅 |
| 每日运势 | sun | ☀️ |

### 6.3 装饰元素

#### 背景纹理

```css
/* 星空点缀 */
.bg-stars {
  background-image: radial-gradient(
    2px 2px at 20px 30px, #ffd700, transparent
  ),
  radial-gradient(
    2px 2px at 40px 70px, #ffd700, transparent
  ),
  radial-gradient(
    1px 1px at 90px 40px, #ffffff, transparent
  );
  background-size: 100px 100px;
  opacity: 0.3;
}

/* 太极背景水印 */
.bg-taiji {
  background-image: url('/images/taiji-watermark.svg');
  background-repeat: no-repeat;
  background-position: center;
  background-size: 400px;
  opacity: 0.03;
}
```

#### 分隔线

```css
.divider {
  height: 1px;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(255, 215, 0, 0.3) 50%,
    transparent 100%
  );
  margin: 32px 0;
}
```

---

## 七、响应式布局

### 7.1 断点定义

```css
/* Tailwind CSS 默认断点 */
--breakpoint-sm: 640px;   /* 大手机 */
--breakpoint-md: 768px;   /* 平板 */
--breakpoint-lg: 1024px;  /* 小桌面 */
--breakpoint-xl: 1280px;  /* 桌面 */
--breakpoint-2xl: 1536px; /* 大桌面 */
```

### 7.2 布局规则

| 断点 | 布局 | 内容宽度 | 列数 |
|------|------|----------|------|
| < 640px | 单栏 | 100% - 32px | 1 |
| 640px - 768px | 单栏 | 100% - 48px | 1 |
| 768px - 1024px | 双栏 | 100% - 64px | 2 |
| 1024px - 1280px | 多栏 | 1024px | 3-4 |
| > 1280px | 多栏 | 1200px | 3-4 |

### 7.3 组件响应式调整

#### 首页卡片网格

```css
/* 手机: 1列 */
.feature-grid {
  display: grid;
  gap: 16px;
  grid-template-columns: 1fr;
}

/* 平板: 2列 */
@media (min-width: 768px) {
  .feature-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 24px;
  }
}

/* 桌面: 3列 */
@media (min-width: 1024px) {
  .feature-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
```

#### 八字命盘

```css
/* 手机: 2x2 网格 */
.bazi-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

/* 平板及以上: 4列 */
@media (min-width: 768px) {
  .bazi-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}
```

#### 表单布局

```css
/* 手机: 垂直布局 */
.form-row {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* 桌面: 水平布局 */
@media (min-width: 768px) {
  .form-row {
    flex-direction: row;
    gap: 24px;
  }
  
  .form-row > * {
    flex: 1;
  }
}
```

---

## 八、动效规范

### 8.1 过渡时长

| 场景 | 时长 | 缓动函数 |
|------|------|----------|
| 悬停状态 | 200ms | ease |
| 展开/收起 | 300ms | ease-out |
| 页面切换 | 400ms | ease-in-out |
| 加载动画 | 1500ms | linear |

### 8.2 常用动效

```css
/* 渐显 */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* 向上浮入 */
@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 发光脉冲 */
@keyframes glow-pulse {
  0%, 100% {
    box-shadow: 0 0 20px rgba(255, 215, 0, 0.2);
  }
  50% {
    box-shadow: 0 0 40px rgba(255, 215, 0, 0.4);
  }
}

/* 结果展示的逐项显示 */
.result-item {
  animation: slideUp 0.5s ease-out forwards;
}

.result-item:nth-child(1) { animation-delay: 0.1s; }
.result-item:nth-child(2) { animation-delay: 0.2s; }
.result-item:nth-child(3) { animation-delay: 0.3s; }
```

### 8.3 动效原则

1. **克制使用**: 动效是点缀，不是主角
2. **有意义**: 每个动效都应该传达信息或引导注意力
3. **可访问性**: 尊重用户的 `prefers-reduced-motion` 设置

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 九、实现参考

### 9.1 Tailwind CSS 配置

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        'cyber': {
          'dark': '#0f0f1a',
          'bg': '#1a1a2e',
          'card': '#16213e',
          'gold': '#ffd700',
          'gold-dark': '#b8860b',
        },
        'wuxing': {
          'metal': '#ffd700',
          'wood': '#4ade80',
          'water': '#38bdf8',
          'fire': '#f97316',
          'earth': '#a78b5a',
        }
      },
      fontFamily: {
        'heading': ['Noto Serif SC', 'serif'],
        'body': ['PingFang SC', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        'card': '16px',
      },
      boxShadow: {
        'glow': '0 0 20px rgba(255, 215, 0, 0.2)',
        'glow-lg': '0 0 40px rgba(255, 215, 0, 0.3)',
      }
    }
  }
}
```

### 9.2 CSS 变量定义

```css
:root {
  /* Colors */
  --color-bg-primary: #1a1a2e;
  --color-bg-secondary: #16213e;
  --color-bg-dark: #0f0f1a;
  --color-gold: #ffd700;
  --color-gold-dark: #b8860b;
  --color-text-primary: #f5f5f5;
  --color-text-secondary: #a0a0a0;
  --color-text-muted: #666666;
  
  /* Typography */
  --font-heading: 'Noto Serif SC', serif;
  --font-body: 'PingFang SC', system-ui, sans-serif;
  
  /* Spacing */
  --space-unit: 4px;
  
  /* Border Radius */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-xl: 16px;
  
  /* Transitions */
  --transition-fast: 200ms ease;
  --transition-normal: 300ms ease;
}
```

---

## 十、资源清单

### 10.1 需要制作的资源

| 资源 | 规格 | 说明 |
|------|------|------|
| Logo | SVG | 赛博命理师文字 Logo |
| Favicon | 32x32, 180x180 | 网站图标 |
| OG Image | 1200x630 | 社交分享图 |
| 太极水印 | SVG | 背景装饰 |
| 功能图标 | 24x24 SVG | 5个功能图标 |
| 五行图标 | 24x24 SVG | 金木水火土 |
| Loading 动画 | Lottie/SVG | 太极旋转 |

### 10.2 字体文件

- Noto Serif SC (需要 Web Font 或 CDN)
- 可选: 霞鹜文楷作为标题艺术字

---

## 十一、待确认事项

1. **Logo 设计**: 是否需要专门设计品牌 Logo？还是纯文字？
2. **插画风格**: 是否需要定制插画？（如命盘解读的配图）
3. **暗黑模式**: 当前已是深色主题，是否需要亮色模式切换？
4. **字体授权**: Noto Serif SC 是免费的，如果用其他字体需确认授权

---

**文档状态**: 待 Frank 审核  
**下一步**: 审核通过后，提交给代码虾进行前端实现

---

_用像素和色彩，画出游戏的灵魂。🎨_
