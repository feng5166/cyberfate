# 任务单：每日运势页全面 UX 优化

> **派单方**: 产品虾 🦐  
> **执行方**: 代码虾 💻  
> **日期**: 2026-05-29  
> **优先级**: P0+P1 全部完成  
> **文件**: `src/app/daily/PageClient.tsx` 为主入口

---

## 任务概述

对 `/daily` 页面进行全面 UX 优化，涵盖：信息冗余清理、视觉分级配色、CTA 转化强化、交互增强。

---

## 改动清单

---

### 1. 删除"当前查询日期"冗余行 【P0 · 5min】

**位置**：PageClient.tsx 中渲染结果区域顶部

**现状**：有一行 `当前查询日期：2026-XX-XX`

**改动**：直接删掉这一行，日期信息已在周视图日历中清楚展示，完全冗余。

---

### 2. 五维运势进度条改为分级配色 【P0 · 1h】

**位置**：五维运势卡片，`result.ratings` 五个维度

**现状**：所有进度条统一用深色（`bg-brand-black` 或类似）

**改动**：根据分值动态设置进度条颜色，用颜色本身传达信号：

```typescript
function getRatingColor(value: number): string {
  if (value >= 5) return '#2D6A4F';   // 优秀 · 深绿
  if (value >= 4) return '#2563EB';   // 良好 · 蓝色
  if (value >= 3) return '#6B7280';   // 一般 · 灰色
  if (value >= 2) return '#D97706';   // 偏弱 · 橙色
  return '#DC2626';                   // 差   · 红色
}
```

进度条 `style={{ backgroundColor: getRatingColor(value) }}`

右侧评级文字也对应上色：
```typescript
function getRatingLabel(value: number): { text: string; color: string } {
  if (value >= 5) return { text: '优秀', color: '#2D6A4F' };
  if (value >= 4) return { text: '良好', color: '#2563EB' };
  if (value >= 3) return { text: '一般', color: '#6B7280' };
  if (value >= 2) return { text: '偏弱', color: '#D97706' };
  return { text: '较差', color: '#DC2626' };
}
```

---

### 3. 五维运势 · 点击维度展开说明 【P1 · 2h】

**位置**：五维运势卡片每一行

**现状**：只能看进度条，无法展开详情

**改动**：
- 每行右侧加一个 `▾` 展开箭头（默认收起）
- 点击该行，展开一行小字（`ratingComments[key]`，这个字段 API 已返回，只是没渲染）
- 再次点击收起
- 展开时箭头旋转 180°（`transition: rotate 0.2s`）
- 一次只能展开一行（手风琴模式，点击其他行时自动收起当前行）

```tsx
const [expandedRating, setExpandedRating] = useState<string | null>(null);

// 每行
<div onClick={() => setExpandedRating(expandedRating === key ? null : key)}>
  {/* 进度条行 */}
  {expandedRating === key && comment && (
    <p style={{ fontSize: 12, color: '#6B7280', marginTop: 4, paddingLeft: 2 }}>
      {comment}
    </p>
  )}
</div>
```

---

### 4. 底部 CTA 改为实心按钮 【P0 · 30min】

**位置**：页面最底部"想深入了解自己的命盘？"区域

**现状**：`variant="secondary"`（描边按钮，视觉弱）

**改动**：改为实心按钮样式：
```tsx
<Link href="/bazi">
  <button
    style={{
      backgroundColor: '#1C1A16',
      color: 'white',
      padding: '12px 32px',
      borderRadius: 8,
      fontSize: 14,
      fontWeight: 500,
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      border: 'none',
      cursor: 'pointer',
    }}
  >
    八字全面分析 <span>→</span>
  </button>
</Link>
```

---

### 5. 五维运势卡片底部插入转化 CTA 【P0 · 1h】

**位置**：五维运势卡片（`📊 五维运势`）的底部，进度条列表之后

**条件**：只在有运势结果时显示（`result !== null`）

**内容**：

```tsx
{/* 五维卡片底部转化区 */}
<div
  style={{
    marginTop: 16,
    paddingTop: 14,
    borderTop: '1px solid #F3F4F6',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  }}
>
  <p style={{ fontSize: 12, color: '#6B7280', lineHeight: 1.5 }}>
    想了解本月完整运势走势？
  </p>
  <Link href="/bazi">
    <button
      style={{
        backgroundColor: '#1C1A16',
        color: 'white',
        padding: '7px 16px',
        borderRadius: 6,
        fontSize: 12,
        fontWeight: 500,
        border: 'none',
        cursor: 'pointer',
        whiteSpace: 'nowrap',
      }}
    >
      查看完整命盘 →
    </button>
  </Link>
</div>
```

---

### 6. 删除六边形图片区 / 缩小处理 【P1 · 30min】

**位置**：今日运势核心卡片下方的六边形图片 + 诗句区域

**改动方案**：删除六边形图片容器，将诗句/意境文案移入"今日指引"卡片的标题或副标题位置：

```tsx
// 今日指引卡片
<Card hover={false} className="bg-yellow-50 border-yellow-200">
  <h4 ...>💡 今日指引</h4>
  {result.verse && (
    <p style={{ fontSize: 12, color: '#92400E', fontStyle: 'italic', marginBottom: 8 }}>
      「{result.verse}」
    </p>
  )}
  <p ...>{result.advice}</p>
</Card>
```

如果 `result.verse` 字段不存在或为空，则不渲染诗句行，不影响现有内容。

---

### 7. 五行图标改为"今日五行强弱"展示 【P1 · 3h】

**位置**：五行小图标行（现在是 5 个静态图标）

**现状**：纯装饰，5个图标均等展示，没有信息量

**改动**：根据今日日柱干支，计算当日五行旺衰，用视觉强弱区分

计算规则（简化版）：
- 今日干支中包含哪个五行 → 该五行"旺"（高亮）
- 根据五行相生关系，旺的五行所"生"的五行为"相"（次高亮）
- 其余为"休/囚/死"（灰显）

UI 实现：
```tsx
// 五行色系
const WUXING_COLORS = {
  wood:  { bg: '#D1FAE5', text: '#059669', label: '木' },
  fire:  { bg: '#FEE2E2', text: '#DC2626', label: '火' },
  earth: { bg: '#FEF3C7', text: '#D97706', label: '土' },
  metal: { bg: '#F3E8FF', text: '#7C3AED', label: '金' },
  water: { bg: '#DBEAFE', text: '#2563EB', label: '水' },
};

// 旺的五行：用彩色背景 + 深色文字 + "旺"小标签
// 灰显的五行：bg #F9FAFB, text #D1D5DB，opacity 0.5
```

每个格子变为：
```
[五行图标]
  木
 主生
[旺] ← 只有旺的五行显示这个小红标
```

**数据来源**：`result.dayGanzhi`（今日干支），前端自行推算；或在 API 返回中增加 `wuxingStrength: { wood, fire, earth, metal, water }` 字段（每个值为 'strong' | 'medium' | 'weak'）。

推荐方案：在 `/api/daily` 返回数据中增加 `wuxingStrength` 字段，由后端计算后返回，前端直接渲染。

---

### 8. 命理脉络时间轴 · 加 ⓘ tooltip 说明 【P1 · 2h】

**位置**：`TimelineSection.tsx`，三行标签（大运/流年/流月）旁边

**改动**：每行左侧标签后面加一个 ⓘ 图标，hover（PC）/ 点击（移动端）显示 tooltip：

- 大运：「大运每10年换一柱，代表你人生各阶段的整体运势底色」
- 流年：「流年即当年太岁，影响该年整体运势格局」
- 流月：「流月以节气为界，影响当月运势的细节走向」

Tooltip 实现：
```tsx
const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

// ⓘ 图标
<button
  onClick={() => setActiveTooltip(activeTooltip === id ? null : id)}
  style={{ ... }}
>
  ⓘ
</button>

// Tooltip 弹出
{activeTooltip === id && (
  <div style={{
    position: 'absolute',
    top: '100%',
    left: 0,
    zIndex: 50,
    backgroundColor: '#1C1A16',
    color: 'white',
    padding: '8px 12px',
    borderRadius: 8,
    fontSize: 12,
    lineHeight: 1.6,
    maxWidth: 240,
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
  }}>
    {tooltipText}
  </div>
)}
```

---

### 9. 命理脉络 · 当前大运进度指示 【P2 · 2h】

**位置**：`TimelineSection.tsx`，当前高亮的大运卡片

**改动**：在大运卡片底部加一条进度条，显示该10年大运已走了多少：

```tsx
// 计算进度
const totalYears = item.ageEnd - item.ageStart; // 10年
const currentAge = targetYear - item.yearStart + item.ageStart;
const progress = Math.min((currentAge - item.ageStart) / totalYears * 100, 100);

// 渲染（仅在 isCurrent 时显示）
{item.isCurrent && (
  <div style={{ marginTop: 6 }}>
    <div style={{ height: 2, backgroundColor: '#E5E7EB', borderRadius: 2 }}>
      <div style={{
        height: '100%',
        width: `${progress}%`,
        backgroundColor: '#1C1A16',
        borderRadius: 2,
      }} />
    </div>
    <p style={{ fontSize: 10, color: '#9CA3AF', marginTop: 2 }}>
      已走 {Math.round(progress)}%
    </p>
  </div>
)}
```

---

### 10. 分享今日运势按钮 【P2 · 4h】

**位置**：今日之歌卡片底部，或页面底部 CTA 区域

**功能**：点击生成一张分享图（PNG），内容包含：
- 日期 + 运势词（如"平"）
- 今日干支
- 宜 Top3
- 今日之歌歌名
- 品牌 Logo + "CyberFate"

**实现方案**：使用 `html2canvas` 或 `dom-to-image` 库截取页面指定区域，生成图片后调用 `navigator.share()` 或直接下载。

分享按钮样式：
```tsx
<button
  onClick={handleShare}
  style={{
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '8px 16px',
    border: '1px solid #E5E7EB',
    borderRadius: 8,
    backgroundColor: 'white',
    fontSize: 13,
    color: '#1C1A16',
    cursor: 'pointer',
  }}
>
  <ShareIcon size={14} />
  分享今日运势
</button>
```

> 注：P2 优先级，可在 P0/P1 完成后再做。

---

## 验收标准

- [ ] "当前查询日期"行已删除
- [ ] 五维进度条颜色随分值动态变化（绿/蓝/灰/橙/红）
- [ ] 五维维度可点击展开 `ratingComments`，手风琴模式
- [ ] 底部 CTA 改为实心黑底白字按钮
- [ ] 五维卡片底部有"查看完整命盘"转化 CTA
- [ ] 六边形图片区已删除，诗句移入今日指引
- [ ] 五行图标展示强弱（旺的彩色、其他灰显）
- [ ] 命理脉络三行标签有 ⓘ tooltip
- [ ] 当前大运卡片底部有进度条（仅 P1 完成后）
- [ ] 所有颜色用 inline style 或硬编码 hex，不用自定义 Tailwind 类

---

## 注意事项

1. **颜色规范**：所有新增颜色用 inline style hardcode，不用 `bg-brand-xxx` 等 Tailwind 自定义类（已知生产不生效）
2. **不要破坏现有功能**：周视图、命理脉络、运势加载逻辑保持不变
3. **移动端优先**：所有新增交互（展开/tooltip）在 375px 宽度下正常可用
4. **完成后提交并 push**，我这边验收

---

*产品虾 🦐 · 2026-05-29*
