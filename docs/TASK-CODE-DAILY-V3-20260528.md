# 派单：每日运势页 v3 重设计

**派单时间**：2026-05-28  
**派单人**：产品虾  
**执行人**：代码虾  
**PRD 来源**：`docs/PRD.md §7.3`（v3 节）  
**优先级**：P1  
**预计工时**：1 天

---

## 背景

Frank 发来竞品 FateTell 截图，现有每日运势页数字仪表盘感太重，缺少东方美学情感温度。本次改版目标：从"数字仪表板"升级为"东方诗意日历"。

---

## 改动范围

### 前端：`src/app/daily/PageClient.tsx`

#### 1. 运势等级大字 + 干支印章（替换环形进度条）

**删除**：`<RingProgress>` 组件及调用

**新增**：
```tsx
// 运势等级大字
<div className="text-5xl font-bold" style={{ color: overallColor }}>
  {result.overallLabel}  {/* "高" | "平" | "低" */}
</div>
<p className="text-sm text-brand-gray mt-1">今日运势</p>

// 干支印章（两个方块）
<div className="flex gap-2 mt-3">
  {result.dayGanzhi.split('').map((char, i) => (
    <div key={i} className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-lg"
      style={{ backgroundColor: '#C2762B' }}>
      {char}
    </div>
  ))}
</div>
```

颜色映射：
- `overallLabel === "高"` → `#C2762B`
- `overallLabel === "平"` → `#6B7280`  
- `overallLabel === "低"` → `#9CA3AF`

#### 2. 今日古诗/格言（新增 verse 展示）

位置：干支印章下方，插画上方

```tsx
{result.verse && (
  <div className="text-center my-4">
    {result.verse.split('\n').map((line, i) => (
      <p key={i} className="text-xl text-brand-black"
        style={{ fontFamily: "'Cormorant Garamond', serif" }}>
        {line}
      </p>
    ))}
  </div>
)}
```

#### 3. 今日意象插画（新增 imageUrl 展示）

位置：格言下方，宜忌上方

```tsx
{result.imageUrl && (
  <div className="flex justify-center my-6">
    <div className="relative" style={{ width: 240, height: 240 }}>
      <img
        src={result.imageUrl}
        alt="今日意象"
        className="w-full h-full object-cover"
        style={{
          clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
          border: '3px solid #8B4513',
          borderRadius: 4
        }}
      />
    </div>
  </div>
)}
```

> 第一期 imageUrl 可能为空，组件需 fallback 优雅降级（不显示该区块）。

#### 4. 宜忌重设计（Tag Pills → 纯文字两列）

**删除**：`<Tag>` 组件的宜忌渲染块

**替换为**：
```tsx
<div className="grid grid-cols-2 gap-6 my-2">
  {/* 宜 */}
  <div>
    <h4 className="text-lg font-semibold mb-2" style={{ color: '#2D6A4F' }}>宜</h4>
    <div className="border-b border-[#E5E0D8] mb-2" />
    {result.suitable.map((item, i) => (
      <p key={i} className="text-sm text-brand-gray leading-[1.8]">{item}</p>
    ))}
  </div>
  {/* 忌 */}
  <div>
    <h4 className="text-lg font-semibold mb-2" style={{ color: '#9B2335' }}>忌</h4>
    <div className="border-b border-[#E5E0D8] mb-2" />
    {result.avoid.map((item, i) => (
      <p key={i} className="text-sm text-brand-gray leading-[1.8]">{item}</p>
    ))}
  </div>
</div>
```

#### 5. AI 今日建议标题微改

```tsx
// 旧
<h4>💡 AI {currentDayText.short}建议</h4>
// 新
<h4>💡 今日指引</h4>
```

#### 6. 今日卦象入口卡片（新增）

位置：AI 建议下方，今日之歌上方

```tsx
<Card hover={false} className="bg-[#F5F0E8] border-[#E5D9C0]">
  <div className="flex items-start justify-between">
    <div>
      <h4 className="text-sm font-medium text-brand-black mb-1">今日卦象</h4>
      <p className="text-xs text-brand-gray mb-3">
        仅为今天占卜，
        <Link href="/liuyao" className="text-brand-black underline">点此开始</Link>
        生成卦象
      </p>
    </div>
    {/* 装饰图案占位，可后续替换为铜钱 SVG */}
    <div className="text-3xl opacity-40">🪙</div>
  </div>
</Card>
```

#### 7. DailyResult 类型新增字段

```ts
interface DailyResult {
  // 原有字段保留...
  verse?: string;        // 今日古诗/格言
  imageUrl?: string;     // 今日意象插画 URL
  overallLabel?: string; // "高" | "平" | "低"
  luckyHour?: string;    // 吉时
}
```

---

### 后端：`src/app/api/daily/route.ts`（或对应 AI prompt）

在 AI prompt 中新增以下输出字段指令：

```
额外输出以下字段（JSON 格式）：
- verse: 根据今日天干地支五行属性，选取一句匹配的古诗词或易经爻辞（2行，换行符分隔），要有意境，不要生硬
- overallLabel: 根据 overall 分数返回 "高"（4-5分）、"平"（3分）、"低"（1-2分）
- luckyHour: 今日最佳行动时辰，格式如 "巳时（09-11时）"
```

`imageUrl` 字段：第一期根据今日地支返回对应静态图片路径：
```ts
const DIZHI_IMAGES: Record<string, string> = {
  '子': '/images/daily/zi.jpg',
  '丑': '/images/daily/chou.jpg',
  '寅': '/images/daily/yin.jpg',
  '卯': '/images/daily/mao.jpg',
  '辰': '/images/daily/chen.jpg',
  '巳': '/images/daily/si.jpg',
  '午': '/images/daily/wu.jpg',
  '未': '/images/daily/wei.jpg',
  '申': '/images/daily/shen.jpg',
  '酉': '/images/daily/you.jpg',
  '戌': '/images/daily/xu.jpg',
  '亥': '/images/daily/hai.jpg',
};
// 从 dayGanzhi 提取地支（第二个字），返回对应图片路径
```

---

### 静态资源：`public/images/daily/`

第一期用 Unsplash 占位图，每张 500×500，按地支命名：
`zi.jpg / chou.jpg / yin.jpg / mao.jpg / chen.jpg / si.jpg / wu.jpg / wei.jpg / shen.jpg / you.jpg / xu.jpg / hai.jpg`

可从 Unsplash 找对应东方意象：
- `zi` → lotus night water (夜荷/月色水面)
- `chou` → morning field cattle (田野晨耕)
- `yin` → bamboo forest mist (竹林晨雾)
- `mao` → peach blossom spring (桃花春溪)
- `chen` → cloud mountain (云海山岳)
- `si` → orchid stone path (幽兰石径)
- `wu` → grassland sunlight (烈日原野)
- `wei` → pasture distant mountain (牧草远山)
- `shen` → waterfall cliff (瀑布峭壁)
- `you` → sunset reed (夕阳芦苇)
- `xu` → autumn leaves bonfire (枯叶篝火)
- `hai` → plum blossom snow (梅花雪)

---

## 验收步骤

1. `pnpm dev` 启动本地，打开 `/daily`
2. 输入任意出生日期，查看结果
3. 逐项核对验收标准（详见 PRD §7.3.11）
4. 截图发给产品虾确认

---

## 不做的事（本期）

- 五行小卡片（保留或删除均可，看视觉空间）
- AI 生成插画（后续接 Gemini Image）
- 今日卦象在页内生成（本期仅做跳转入口）
