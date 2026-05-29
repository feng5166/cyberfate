# 任务单：每日运势 · 大运/流年/流月时间轴

> **派单方**: 产品虾 🦐  
> **执行方**: 代码虾 💻  
> **日期**: 2026-05-29  
> **优先级**: P0  
> **PRD**: `docs/PRD-DAILY-TIMELINE-V1.md`

---

## 任务目标

在 `/daily` 页面新增「运势全景」模块，展示大运/流年/流月三层命理时间轴。

位置：页面标题下方、周视图上方。

---

## 交付物清单

1. `GET /api/bazi/timeline` 接口（后端）
2. `TimelineSection` 前端组件
3. 集成进 `src/app/daily/PageClient.tsx`

---

## 一、后端：/api/bazi/timeline

### 文件位置
`src/app/api/bazi/timeline/route.ts`

### 请求参数（GET query string）
```
birthDate: string     // YYYY-MM-DD
birthHour: number     // 0-11（十二时辰索引）
gender: string        // male | female
targetDate?: string   // YYYY-MM-DD，默认今天
```

### 返回结构
```typescript
{
  dayun: {
    current: DayunItem,   // 当前所处大运
    list: DayunItem[]     // 共8-10柱（从起运到终老）
  },
  liunian: {
    current: LiunianItem,
    list: LiunianItem[]   // 当前年份前后各5年，共11年
  },
  liuyue: {
    current: LiuyueItem,
    list: LiuyueItem[]    // 当前节气月前后各5个，共11个
  }
}

interface DayunItem {
  index: number           // 第几运（1开始）
  ganzhi: string          // 如「丙午」
  tiangan: string         // 天干
  dizhi: string           // 地支
  shishen: string         // 十神（如「正官」）
  shishenDesc: string     // 十神注释（见下方注释表）
  ageStart: number
  ageEnd: number
  yearStart: number
  yearEnd: number
  isCurrent: boolean
}

interface LiunianItem {
  year: number
  ganzhi: string
  tiangan: string
  dizhi: string
  shishen: string
  shishenDesc: string
  age: number
  isCurrent: boolean
}

interface LiuyueItem {
  jieqi: string           // 节气名（如「小满」）
  ganzhi: string
  tiangan: string
  dizhi: string
  shishen: string
  shishenDesc: string
  dateStart: string       // YYYY-MM-DD
  dateEnd: string         // YYYY-MM-DD
  isCurrent: boolean
}
```

### 十神注释表（hardcode）
```typescript
const SHISHEN_DESC: Record<string, string> = {
  '正官': '贵人助力',
  '七煞': '冲劲竞争',
  '偏官': '冲劲竞争',
  '正印': '贵人庇护',
  '偏印': '直觉敏锐',
  '枭神': '直觉敏锐',
  '比肩': '同辈互助',
  '劫财': '竞争耗损',
  '食神': '才华展现',
  '伤官': '创意突破',
  '正财': '稳健收益',
  '偏财': '意外之财',
}
```

### 计算逻辑要点

**大运计算**：
- 阳年生男 / 阴年生女 → 顺数，生日后数到下一个节气，每3天=1年
- 阴年生男 / 阳年生女 → 逆数，生日前数到上一个节气，每3天=1年
- 起运年龄确定后，往后每10年一柱，按四柱月柱起，顺/逆行
- 如项目中已有八字计算库（lunar-typescript / tyme4ts），优先复用已有逻辑

**流年**：当年太岁，即该年的年柱干支，十神相对日主计算

**流月**：以节气为界（非公历月份），月柱干支，十神相对日主计算。节气精确时间可用现有库或hardcode年度节气表

### 缓存
- 大运：`timeline:dayun:${birthDate}:${birthHour}:${gender}` → 永久缓存（一生不变）
- 流年/流月：按年缓存，`timeline:ln:${year}:${birthDate}:${gender}` 等
- 如无Redis，用内存Map缓存亦可，进程重启后重算

---

## 二、前端：TimelineSection 组件

### 文件位置
`src/components/daily/TimelineSection.tsx`（新建）

### 组件职责
- 调用 `/api/bazi/timeline` 获取数据
- 渲染三行横向滚动卡片轴
- 处理加载中（骨架屏）/ 错误 / 无数据三种状态

### Props
```typescript
interface TimelineSectionProps {
  birthDate: string
  birthHour: string
  gender?: string
  targetDate: string   // 当前查询日期
}
```

### 布局结构
```
<section>
  <SectionHeader title="运势全景" subtitle="从大运、流年、流月全面把握运势节奏" />
  
  <TimelineRow label="大运" badge="当前大运" items={dayun.list} currentIndex={...} />
  <TimelineRow label="流年" badge="当前年份" items={liunian.list} currentIndex={...} />
  <TimelineRow label="流月" badge="当前月份" items={liuyue.list} currentIndex={...} />
</section>
```

### TimelineRow 行为
- `overflow-x: auto`，隐藏滚动条（`scrollbar-hide` 或 CSS）
- 渲染后自动 scroll 到当前高亮卡片，使其在可视区域内（`scrollIntoView` 或手动计算）
- 每行左侧固定显示行标签（「大运」「流年」「流月」）+ 右侧「• 当前XXX」红点标记

### 卡片样式规格

**高亮卡片**（`isCurrent === true`）：
```
border: 1px solid #1C1A16
background: #FAF8F4
border-radius: 12px
padding: 10px
```

**普通卡片**：
```
border: 1px solid #E5E7EB
background: #FFFFFF
border-radius: 12px
padding: 10px
opacity: 0.8
```

**卡片内容排列（上→下）**：
```
[第N运 / 年份 / 节气名]  ← 小标签，text-xs text-gray-400
[天干 地支]              ← 大字，text-xl font-semibold font-serif
[年龄区间 / 年份区间]    ← text-xs text-gray-500
[十神]                   ← 小标签，当前卡片深底白字，普通卡片灰底灰字
[十神注释]               ← text-[10px] text-gray-400（差异化功能）
```

**卡片尺寸**：
- 大运：`w-[120px]`
- 流年：`w-[90px]`
- 流月：`w-[110px]`

**注意**：所有颜色用 inline style 或硬编码 hex，不要用 `bg-brand-black` 等自定义 Tailwind 类（已知生产环境不生效，见今日 bug fix 记录）

### 骨架屏
加载中时三行各显示5个灰色卡片轮廓：
```jsx
<div className="animate-pulse bg-gray-100 rounded-xl w-[120px] h-[100px]" />
```

### 无数据状态
birthDate 或 birthHour 为空时显示：
```
📅 填写出生信息后查看完整命理脉络
```

### 错误状态
API 失败时：静默降级，显示「命理脉络加载失败，刷新重试」，不影响下方每日运势

---

## 三、集成到 PageClient.tsx

在 `src/app/daily/PageClient.tsx` 中：

1. import `TimelineSection`
2. 在周视图 `WeekCalendar` 上方插入：

```tsx
{hasSavedData && (
  <TimelineSection
    birthDate={formData.birthDate}
    birthHour={formData.birthHour}
    gender={formData.gender}
    targetDate={today}
  />
)}
```

条件：`hasSavedData`（用户已有出生数据）才显示，否则不占位

---

## 验收标准

- [ ] 大运/流年/流月三行均正确渲染，当前柱高亮
- [ ] 横向滚动正常，默认高亮卡片可见
- [ ] 十神注释正确显示在十神名称下方
- [ ] 加载中显示骨架屏
- [ ] API 失败不崩溃，静默降级
- [ ] 未填写出生信息时不显示此模块（不占位）
- [ ] 移动端 375px 正常展示
- [ ] 干支字体使用衬线体（font-serif）

---

## 参考

- 完整 PRD：`docs/PRD-DAILY-TIMELINE-V1.md`
- 竞品参考：FateMaster.ai（附图已沟通）
- 项目八字计算现有代码：`src/lib/bazi/` 或 `src/app/api/bazi/`（请自行确认路径）
