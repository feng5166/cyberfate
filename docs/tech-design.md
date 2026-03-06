# 赛博命理师 技术设计文档

> **作者**: 代码虾 🦐
> **日期**: 2026-03-06
> **版本**: v1.0
> **状态**: 待审核

---

## 一、技术栈确认

基于 PRD 要求、竞品分析和美术虾的设计规范 (`DESIGN_SPEC.md`)，确认以下技术栈：

### 1.1 前端技术

| 技术 | 版本 | 用途 | 选型理由 |
|------|------|------|----------|
| **Next.js** | 14+ | 全栈框架 | App Router、SSR/SSG、API Routes 一体化 |
| **TypeScript** | 5.x | 类型安全 | 减少 bug，提升可维护性 |
| **Tailwind CSS** | 3.x | 样式方案 | 原子化 CSS，快速开发 |
| **shadcn/ui** | latest | UI 组件库 | 高质量、可定制、无运行时依赖 |

### 1.2 核心依赖

| 库 | 用途 | 说明 |
|------|------|------|
| **lunar-javascript** | 八字计算 | 成熟的农历/八字计算库 |
| **date-fns** | 日期处理 | 轻量级日期工具 |
| **zod** | 数据校验 | 类型安全的 schema 验证 |
| **ai** (Vercel AI SDK) | AI 集成 | 统一的 LLM 调用接口 |

### 1.3 基础设施

| 服务 | 用途 | 备注 |
|------|------|------|
| **Vercel** | 部署 | Next.js 官方推荐，自动 CI/CD |
| **OpenAI API** | AI 解读 | GPT-4-turbo，按需切换 Claude |

### 1.4 MVP 不做的技术

| 技术 | 原因 | 计划 |
|------|------|------|
| 数据库 | MVP 无账号系统 | V2 加 PostgreSQL |
| 认证 | MVP 无登录需求 | V2 加 NextAuth.js |
| 缓存 | 数据量小 | V2 按需添加 |
| 真太阳时 | 复杂度高 | V2 迭代 |

---

## 二、项目结构设计

```
cyberfate/
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── layout.tsx            # 根布局
│   │   ├── page.tsx              # 首页
│   │   ├── bazi/
│   │   │   └── page.tsx          # 八字计算页
│   │   ├── daily/
│   │   │   └── page.tsx          # 每日运势页
│   │   ├── privacy/
│   │   │   └── page.tsx          # 隐私政策
│   │   ├── terms/
│   │   │   └── page.tsx          # 服务条款
│   │   ├── api/
│   │   │   ├── bazi/
│   │   │   │   └── route.ts      # 八字计算 API
│   │   │   └── daily/
│   │   │       └── route.ts      # 每日运势 API
│   │   └── globals.css           # 全局样式
│   │
│   ├── components/
│   │   ├── ui/                   # shadcn/ui 组件
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── input.tsx
│   │   │   ├── select.tsx
│   │   │   └── ...
│   │   ├── layout/               # 布局组件
│   │   │   ├── Header.tsx
│   │   │   ├── Footer.tsx
│   │   │   └── NavMenu.tsx
│   │   ├── home/                 # 首页组件
│   │   │   ├── Hero.tsx
│   │   │   ├── FeatureCard.tsx
│   │   │   └── FeatureGrid.tsx
│   │   ├── bazi/                 # 八字相关组件
│   │   │   ├── BaziForm.tsx      # 输入表单
│   │   │   ├── BaziChart.tsx     # 命盘展示
│   │   │   ├── WuxingChart.tsx   # 五行分析图
│   │   │   └── AnalysisCard.tsx  # 分析结果卡片
│   │   └── daily/                # 运势相关组件
│   │       ├── DailyForm.tsx
│   │       └── FortuneCard.tsx
│   │
│   ├── lib/
│   │   ├── bazi/                 # 八字计算核心
│   │   │   ├── calculator.ts     # 计算逻辑封装
│   │   │   ├── types.ts          # 类型定义
│   │   │   └── constants.ts      # 常量定义
│   │   ├── ai/                   # AI 相关
│   │   │   ├── client.ts         # AI 客户端
│   │   │   └── prompts.ts        # Prompt 模板
│   │   ├── storage.ts            # localStorage 封装
│   │   └── utils.ts              # 工具函数
│   │
│   ├── hooks/                    # 自定义 Hooks
│   │   ├── useBaziForm.ts
│   │   └── useLocalStorage.ts
│   │
│   └── types/                    # 全局类型定义
│       └── index.ts
│
├── public/
│   ├── favicon.ico
│   └── images/
│
├── .claude/                      # Claude Code 配置
│   └── agents/                   # 子代理配置
│
├── docs/                         # 项目文档
│
├── package.json
├── tailwind.config.ts
├── tsconfig.json
├── next.config.js
└── CLAUDE.md
```

---

## 三、核心模块设计

### 3.1 八字计算模块

#### 类型定义 (`src/lib/bazi/types.ts`)

```typescript
// 天干
export type TianGan = '甲' | '乙' | '丙' | '丁' | '戊' | '己' | '庚' | '辛' | '壬' | '癸';

// 地支
export type DiZhi = '子' | '丑' | '寅' | '卯' | '辰' | '巳' | '午' | '未' | '申' | '酉' | '戌' | '亥';

// 五行
export type WuXing = '金' | '木' | '水' | '火' | '土';

// 柱
export interface Pillar {
  gan: TianGan;
  zhi: DiZhi;
  ganWuxing: WuXing;
  zhiWuxing: WuXing;
}

// 八字命盘
export interface BaziChart {
  year: Pillar;
  month: Pillar;
  day: Pillar;
  hour: Pillar | null; // 不知道时辰时为 null
}

// 五行统计
export interface WuxingCount {
  metal: number;  // 金
  wood: number;   // 木
  water: number;  // 水
  fire: number;   // 火
  earth: number;  // 土
}

// 计算输入
export interface BaziInput {
  name?: string;
  gender: 'male' | 'female';
  birthDate: string;      // YYYY-MM-DD
  birthTime?: string;     // HH:mm 或时辰
  isLunar?: boolean;      // 是否农历 (V2)
}

// 计算结果
export interface BaziResult {
  chart: BaziChart;
  wuxing: WuxingCount;
  dayMaster: string;        // 日主描述，如 "丙火"
  dayMasterElement: WuXing; // 日主五行
}
```

#### 计算逻辑 (`src/lib/bazi/calculator.ts`)

```typescript
import { Solar, Lunar } from 'lunar-javascript';
import { BaziInput, BaziResult, Pillar, WuxingCount } from './types';
import { TIANGAN_WUXING, DIZHI_WUXING } from './constants';

/**
 * 计算八字
 */
export function calculateBazi(input: BaziInput): BaziResult {
  const { birthDate, birthTime, gender } = input;
  
  // 解析日期
  const [year, month, day] = birthDate.split('-').map(Number);
  
  // 解析时间（如果有）
  let hour = -1; // -1 表示不知道
  if (birthTime && birthTime !== 'unknown') {
    hour = parseHour(birthTime);
  }
  
  // 使用 lunar-javascript 计算
  const solar = Solar.fromYmd(year, month, day);
  const lunar = solar.getLunar();
  const eightChar = lunar.getEightChar();
  
  // 构建四柱
  const chart: BaziChart = {
    year: buildPillar(eightChar.getYearGan(), eightChar.getYearZhi()),
    month: buildPillar(eightChar.getMonthGan(), eightChar.getMonthZhi()),
    day: buildPillar(eightChar.getDayGan(), eightChar.getDayZhi()),
    hour: hour >= 0 ? buildPillarFromHour(eightChar, hour) : null,
  };
  
  // 统计五行
  const wuxing = countWuxing(chart);
  
  // 日主信息
  const dayMasterElement = TIANGAN_WUXING[chart.day.gan];
  const dayMaster = `${chart.day.gan}${dayMasterElement}`;
  
  return {
    chart,
    wuxing,
    dayMaster,
    dayMasterElement,
  };
}

/**
 * 构建单柱
 */
function buildPillar(gan: string, zhi: string): Pillar {
  return {
    gan: gan as TianGan,
    zhi: zhi as DiZhi,
    ganWuxing: TIANGAN_WUXING[gan],
    zhiWuxing: DIZHI_WUXING[zhi],
  };
}

/**
 * 统计五行数量
 */
function countWuxing(chart: BaziChart): WuxingCount {
  const count: WuxingCount = { metal: 0, wood: 0, water: 0, fire: 0, earth: 0 };
  const wuxingMap: Record<WuXing, keyof WuxingCount> = {
    '金': 'metal', '木': 'wood', '水': 'water', '火': 'fire', '土': 'earth'
  };
  
  const pillars = [chart.year, chart.month, chart.day, chart.hour].filter(Boolean);
  
  for (const pillar of pillars) {
    if (pillar) {
      count[wuxingMap[pillar.ganWuxing]]++;
      count[wuxingMap[pillar.zhiWuxing]]++;
    }
  }
  
  return count;
}

/**
 * 解析时间为时辰索引 (0-11)
 */
function parseHour(time: string): number {
  // 支持 "HH:mm" 格式或时辰名
  if (time.includes(':')) {
    const hour = parseInt(time.split(':')[0]);
    return Math.floor(((hour + 1) % 24) / 2);
  }
  // 时辰名处理...
  return -1;
}
```

### 3.2 AI 解读模块

#### Prompt 模板 (`src/lib/ai/prompts.ts`)

```typescript
import { BaziResult } from '../bazi/types';

export function buildBaziAnalysisPrompt(result: BaziResult, name?: string): string {
  const { chart, wuxing, dayMaster } = result;
  
  return `你是一位专业的命理分析师，精通八字命理学。请根据以下八字信息，为用户提供分析报告。

## 用户八字信息
${name ? `姓名：${name}` : ''}

### 四柱八字
- 年柱：${chart.year.gan}${chart.year.zhi}
- 月柱：${chart.month.gan}${chart.month.zhi}
- 日柱：${chart.day.gan}${chart.day.zhi}
${chart.hour ? `- 时柱：${chart.hour.gan}${chart.hour.zhi}` : '- 时柱：未知'}

### 五行分布
- 金：${wuxing.metal}个
- 木：${wuxing.wood}个
- 水：${wuxing.water}个
- 火：${wuxing.fire}个
- 土：${wuxing.earth}个

### 日主
${dayMaster}

## 分析要求
请按以下结构输出分析报告，使用 JSON 格式：

{
  "dayMasterAnalysis": "日主分析（约100字，解释日主特性）",
  "personality": "性格特点（约100字，包含优势和注意点）",
  "career": "事业运势（约100字，适合的发展方向）",
  "wealth": "财运分析（约100字，理财建议）",
  "relationship": "感情婚姻（约100字，感情特点和建议）",
  "health": "健康提示（约50字，需要注意的方面）"
}

## 分析原则
1. 语言通俗易懂，避免过于专业的术语
2. 分析要有命理依据，说明为什么
3. 保持客观，用"倾向于"、"可能"等词，避免绝对化
4. 给出积极、有建设性的建议
5. 注意五行的平衡和相生相克关系`;
}

export function buildDailyFortunePrompt(result: BaziResult, targetDate: string): string {
  // 每日运势的 prompt...
  return `...`;
}
```

#### AI 客户端 (`src/lib/ai/client.ts`)

```typescript
import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';
import { buildBaziAnalysisPrompt } from './prompts';
import { BaziResult } from '../bazi/types';

export interface BaziAnalysis {
  dayMasterAnalysis: string;
  personality: string;
  career: string;
  wealth: string;
  relationship: string;
  health: string;
}

export async function generateBaziAnalysis(
  result: BaziResult,
  name?: string
): Promise<BaziAnalysis> {
  const prompt = buildBaziAnalysisPrompt(result, name);
  
  const response = await generateText({
    model: openai('gpt-4-turbo'),
    prompt,
    maxTokens: 1500,
  });
  
  // 解析 JSON 响应
  try {
    const analysis = JSON.parse(response.text);
    return analysis as BaziAnalysis;
  } catch (error) {
    // 如果解析失败，返回默认响应
    console.error('Failed to parse AI response:', error);
    throw new Error('AI 解读生成失败，请重试');
  }
}
```

### 3.3 API 设计

#### 八字计算 API (`src/app/api/bazi/route.ts`)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { calculateBazi } from '@/lib/bazi/calculator';
import { generateBaziAnalysis } from '@/lib/ai/client';

const requestSchema = z.object({
  name: z.string().optional(),
  gender: z.enum(['male', 'female']),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  birthTime: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const input = requestSchema.parse(body);
    
    // 1. 计算八字
    const baziResult = calculateBazi(input);
    
    // 2. 生成 AI 解读
    const analysis = await generateBaziAnalysis(baziResult, input.name);
    
    return NextResponse.json({
      success: true,
      data: {
        bazi: baziResult,
        analysis,
      },
    });
  } catch (error) {
    console.error('Bazi API error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: '输入数据格式错误' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: '服务器错误，请稍后重试' },
      { status: 500 }
    );
  }
}
```

### 3.4 本地存储

```typescript
// src/lib/storage.ts
const STORAGE_KEY = 'cyberfate_user';

export interface StoredUserData {
  birthDate: string;
  birthTime?: string;
  gender: 'male' | 'female';
  savedAt: string;
}

export function saveUserData(data: Omit<StoredUserData, 'savedAt'>): void {
  if (typeof window === 'undefined') return;
  
  const stored: StoredUserData = {
    ...data,
    savedAt: new Date().toISOString(),
  };
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
}

export function getUserData(): StoredUserData | null {
  if (typeof window === 'undefined') return null;
  
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function clearUserData(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
}
```

---

## 四、任务拆分与排期

### 4.1 任务清单

基于 PRD 的 14 天计划，拆分为以下任务：

#### M1: 技术搭建 (Day 1-3)

| 任务 | 预估 | 优先级 | 子代理 |
|------|------|--------|--------|
| 项目初始化 (Next.js + TS + Tailwind) | 2h | P0 | - |
| shadcn/ui 配置和基础组件安装 | 1h | P0 | frontend-dev |
| lunar-javascript 集成和验证 | 3h | P0 | bazi-engine |
| 八字计算模块开发 | 4h | P0 | bazi-engine |
| 八字计算单元测试 | 2h | P0 | test-engineer |
| AI API 接入测试 | 2h | P1 | ai-integrator |
| Prompt 初稿编写 | 2h | P1 | ai-integrator |

**M1 总计**: ~16h (约 2-3 天)

#### M2: 核心页面 (Day 4-8)

| 任务 | 预估 | 优先级 | 子代理 |
|------|------|--------|--------|
| 布局组件 (Header/Footer/NavMenu) | 4h | P0 | frontend-dev |
| 首页 Hero 区域 | 2h | P0 | frontend-dev |
| 首页功能卡片区 | 3h | P0 | frontend-dev |
| 首页产品特色区 | 1h | P1 | frontend-dev |
| 八字计算页 - 输入表单 | 4h | P0 | frontend-dev |
| 八字计算页 - 结果展示 | 4h | P0 | frontend-dev |
| 八字计算 API 开发 | 3h | P0 | backend-dev |
| 响应式适配 | 3h | P1 | frontend-dev |
| Loading 状态和错误处理 | 2h | P1 | frontend-dev |

**M2 总计**: ~26h (约 4-5 天)

#### M3: 功能完善 (Day 9-11)

| 任务 | 预估 | 优先级 | 子代理 |
|------|------|--------|--------|
| 每日运势页 - 表单 | 2h | P1 | frontend-dev |
| 每日运势页 - 结果展示 | 3h | P1 | frontend-dev |
| 每日运势 API | 2h | P1 | backend-dev |
| localStorage 功能 | 1h | P1 | frontend-dev |
| AI Prompt 优化调试 | 3h | P1 | ai-integrator |
| 隐私政策/服务条款页 | 2h | P2 | frontend-dev |
| 免责声明组件 | 1h | P0 | frontend-dev |

**M3 总计**: ~14h (约 2-3 天)

#### M4: 测试上线 (Day 12-14)

| 任务 | 预估 | 优先级 | 子代理 |
|------|------|--------|--------|
| 功能测试 | 4h | P0 | test-engineer |
| 兼容性测试 | 2h | P1 | test-engineer |
| Bug 修复 | 4h | P0 | - |
| 性能优化 | 2h | P2 | - |
| Vercel 部署配置 | 2h | P0 | backend-dev |
| 环境变量配置 | 1h | P0 | backend-dev |
| 最终验收 | 2h | P0 | - |

**M4 总计**: ~17h (约 2-3 天)

### 4.2 里程碑检查点

| 日期 | 里程碑 | 交付物 |
|------|--------|--------|
| Day 3 | M1 完成 | 八字计算可运行，AI 可调通 |
| Day 8 | M2 完成 | 首页 + 八字计算页可用 |
| Day 11 | M3 完成 | 每日运势可用，全功能完整 |
| Day 14 | M4 完成 | 线上可访问 |

---

## 五、技术风险与对策

### 5.1 风险清单

| 风险 | 可能性 | 影响 | 对策 |
|------|--------|------|------|
| **八字计算不准确** | 中 | 高 | 使用成熟库 lunar-javascript，多案例交叉验证 |
| **AI 响应延迟** | 中 | 中 | 加 loading 动画，设置 timeout，优化体验 |
| **AI 输出格式不稳定** | 中 | 中 | JSON 格式要求 + 解析容错 + 重试机制 |
| **AI 解读质量不稳定** | 中 | 中 | Prompt 反复调优，人工审核首批输出 |
| **API 调用费用超预期** | 低 | 中 | 监控用量，设置 rate limit |
| **移动端适配问题** | 中 | 中 | 移动端优先设计，充分测试 |
| **lunar-javascript 库问题** | 低 | 高 | 备选方案：自实现核心算法 |

### 5.2 关键技术验证（Day 1 优先）

在正式开发前，需要先验证以下技术点：

1. **lunar-javascript 准确性验证**
   - 准备 10 个已知正确的八字案例
   - 验证计算结果一致性
   - 文档记录任何偏差

2. **AI 输出稳定性验证**
   - 测试 Prompt 在不同输入下的输出
   - 确认 JSON 格式解析成功率
   - 评估输出质量

---

## 六、设计规范落地

基于美术虾的 `DESIGN_SPEC.md`，以下是技术实现要点：

### 6.1 Tailwind 配置扩展

```typescript
// tailwind.config.ts
import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        cyber: {
          dark: '#0f0f1a',
          bg: '#1a1a2e',
          card: '#16213e',
          gold: '#ffd700',
          'gold-dark': '#b8860b',
        },
        wuxing: {
          metal: '#ffd700',
          wood: '#4ade80',
          water: '#38bdf8',
          fire: '#f97316',
          earth: '#a78b5a',
        },
      },
      fontFamily: {
        heading: ['Noto Serif SC', 'serif'],
        body: ['PingFang SC', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        card: '16px',
      },
      boxShadow: {
        glow: '0 0 20px rgba(255, 215, 0, 0.2)',
        'glow-lg': '0 0 40px rgba(255, 215, 0, 0.3)',
      },
      backgroundImage: {
        'gradient-gold': 'linear-gradient(135deg, #ffd700 0%, #f4a460 100%)',
        'gradient-bg': 'linear-gradient(180deg, #1a1a2e 0%, #16213e 50%, #0f0f1a 100%)',
      },
    },
  },
  plugins: [],
};

export default config;
```

### 6.2 CSS 变量定义

```css
/* src/app/globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  /* Colors */
  --color-bg-primary: #1a1a2e;
  --color-bg-secondary: #16213e;
  --color-bg-dark: #0f0f1a;
  --color-gold: #ffd700;
  --color-text-primary: #f5f5f5;
  --color-text-secondary: #a0a0a0;
  
  /* Typography */
  --font-heading: 'Noto Serif SC', serif;
  --font-body: 'PingFang SC', system-ui, sans-serif;
  
  /* Transitions */
  --transition-fast: 200ms ease;
  --transition-normal: 300ms ease;
}

/* 深色背景基础 */
body {
  background: var(--color-bg-dark);
  color: var(--color-text-primary);
  font-family: var(--font-body);
}
```

### 6.3 核心组件样式

参照设计规范实现以下组件：

| 组件 | 样式要点 | 参考 DESIGN_SPEC 章节 |
|------|----------|----------------------|
| Button (主) | 金色渐变背景，hover 上浮 | 5.1 |
| Button (次) | 透明背景，金色边框 | 5.1 |
| Card | 半透明深色背景，金色边框，hover 发光 | 5.2 |
| Input | 深色背景，focus 金色边框 | 5.3 |
| 命盘卡片 | 4列网格，移动端2x2 | 5.2 |
| 五行条 | 带颜色的进度条 | 5.7 |
| Loading | 太极旋转动画 | 5.8 |

### 6.4 响应式断点

遵循设计规范的断点设置：

```typescript
// 使用 Tailwind 默认断点
// sm: 640px, md: 768px, lg: 1024px, xl: 1280px

// 首页卡片: 手机1列 → 平板2列 → 桌面3列
// 命盘: 手机2x2 → 平板+4列
// 表单: 手机垂直 → 桌面水平
```

### 6.5 字体加载

```typescript
// src/app/layout.tsx
import { Noto_Serif_SC } from 'next/font/google';

const notoSerifSC = Noto_Serif_SC({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  variable: '--font-heading',
});

export default function RootLayout({ children }) {
  return (
    <html lang="zh-CN" className={notoSerifSC.variable}>
      <body>{children}</body>
    </html>
  );
}
```

---

## 七、开发规范

### 6.1 代码规范

- 使用 TypeScript 严格模式
- 所有函数必须有类型标注
- 组件使用函数式组件 + Hooks
- 优先使用 Server Components
- 客户端组件添加 'use client' 指令

### 6.2 Git 规范

```
feat: 新功能
fix: 修复
docs: 文档
style: 样式
refactor: 重构
test: 测试
chore: 杂项
```

示例：
```
feat(bazi): 实现八字计算核心逻辑
fix(api): 修复 AI 响应解析错误
docs: 更新技术设计文档
```

### 6.3 文件命名

- 组件：PascalCase (`BaziForm.tsx`)
- 工具函数：camelCase (`calculator.ts`)
- 类型文件：`types.ts`
- 常量文件：`constants.ts`

---

## 八、待确认事项

请 Frank 确认以下事项：

### 7.1 技术选型

- [ ] **AI 模型**：默认使用 GPT-4-turbo，是否需要备选方案（Claude）？
- [ ] **部署平台**：确认使用 Vercel？
- [ ] **域名**：是否已准备好域名？

### 7.2 产品细节

- [ ] **时辰输入**：MVP 使用时辰选择（12时辰）还是具体时间（HH:mm）？
- [ ] **农历输入**：PRD 提到 MVP 暂不支持农历输入，确认？
- [ ] **出生地点**：MVP 不做真太阳时计算，确认不需要地点输入？

### 7.3 资源

- [ ] **OpenAI API Key**：需要提供或使用已有的？
- [ ] **设计稿**：是否有 UI 设计稿，还是按 PRD 描述开发？

---

## 九、下一步行动

Frank 审核通过后，我将：

1. **Day 1 上午**：项目初始化 + 技术验证
2. **Day 1 下午**：八字计算模块开发
3. **Day 2-3**：完成 M1 全部任务
4. 每日结束时在群里汇报进度

---

**文档状态**: 待审核  
**提交时间**: 2026-03-06 18:45  
**作者**: 代码虾 🦐

_等待 Frank 审核，准备开工！_
