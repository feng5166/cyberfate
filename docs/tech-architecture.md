# CyberFate 技术架构设计

> 基于 FateMaster.ai 的竞品分析
> 作者：代码虾 🦐
> 日期：2026-03-06

---

## 📊 FateMaster.ai 竞品分析

### 产品功能矩阵

| 分类 | 功能 | 描述 |
|------|------|------|
| **八字系统** | 八字计算 | 基于出生年月日时的命盘分析 |
| | 每日运势 | 结合八字的每日吉凶分析 |
| | 八字合婚 | 双方八字匹配度分析 |
| | 事业合盘 | 商业伙伴关系分析 |
| | 各种关系分析 | 婆媳、朋友、领导下属等 |
| **紫微斗数** | 紫微排盘 | 十二宫位与主星格局分析 |
| **周易占卜** | 梅花易数 | 每日决策指导 |
| | 六爻占卜 | 传统六爻预测 + AI 解析 |
| **塔罗牌** | 塔罗解读 | AI 辅助塔罗牌解读 |
| **其他工具** | 黄历查询 | AI 增强的传统黄历 |

### 技术栈识别

**前端技术**：
- ✅ **Next.js** - React 全栈框架（App Router）
- ✅ **Tailwind CSS** - 原子化 CSS 框架
- ✅ **TypeScript** - 类型安全
- ✅ 部署在 **Vercel**（从 URL 路径 `dpl_` 识别）

**推测后端技术**：
- 🔮 Next.js API Routes / Server Actions
- 🔮 AI API（可能是 OpenAI / Claude / 国产大模型）
- 🔮 数据库（用户数据、历史记录）
- 🔮 支付系统（微信/支付宝）

### 商业模式

| 套餐 | 价格 | 特点 |
|------|------|------|
| 单日解锁 | ¥89.8/天 | 临时使用 |
| 年费会员 | ¥399/年（原价 ¥1,999） | 无限制使用 + 早鸟优惠 |

### 核心特点
1. **多语言支持**：中/英/日/繁体中文
2. **无需注册**：部分功能免费体验
3. **AI 驱动**：所有分析结果由 AI 生成
4. **丰富内容**：详细的理论知识库（五行、天干地支等）

---

## 🏗️ CyberFate 技术架构设计

### 推荐技术栈

#### 前端
```
Next.js 14+ (App Router)
├── TypeScript          # 类型安全
├── Tailwind CSS        # 样式方案
├── shadcn/ui           # UI 组件库
├── Framer Motion       # 动画效果
└── Zustand / Jotai     # 状态管理
```

#### 后端
```
Next.js API Routes / Server Actions
├── Prisma              # ORM（数据库操作）
├── PostgreSQL          # 主数据库
├── Redis               # 缓存（可选）
└── NextAuth.js         # 认证
```

#### AI 集成
```
AI Provider
├── OpenAI GPT-4        # 主力模型（国际版）
├── Claude              # 备选
├── 通义千问 / 文心一言   # 国内版备选
└── AI SDK (Vercel)     # 统一 AI 调用接口
```

#### 基础设施
```
Infrastructure
├── Vercel              # 部署平台
├── Supabase / PlanetScale  # 托管数据库
├── Stripe / 支付宝 / 微信  # 支付
└── Cloudflare          # CDN / 防护
```

### 系统架构图

```
┌─────────────────────────────────────────────────────────────┐
│                        用户层                                │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐        │
│  │   Web   │  │ Mobile  │  │  微信   │  │  小程序  │        │
│  └────┬────┘  └────┬────┘  └────┬────┘  └────┬────┘        │
└───────┴────────────┴────────────┴────────────┴──────────────┘
                              │
┌─────────────────────────────┴───────────────────────────────┐
│                     Next.js 应用层                           │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                   App Router                         │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐          │   │
│  │  │ 八字模块 │  │ 塔罗模块 │  │ 黄历模块 │  ...     │   │
│  │  └──────────┘  └──────────┘  └──────────┘          │   │
│  └─────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │               API Routes / Server Actions            │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐          │   │
│  │  │ 命理计算 │  │ AI 分析  │  │ 用户管理 │  ...     │   │
│  │  └──────────┘  └──────────┘  └──────────┘          │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────┴───────────────────────────────┐
│                        服务层                                │
│  ┌───────────┐  ┌───────────┐  ┌───────────┐               │
│  │  AI 服务  │  │ 命理引擎  │  │ 支付服务  │               │
│  │  (LLM)    │  │ (算法库)  │  │           │               │
│  └───────────┘  └───────────┘  └───────────┘               │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────┴───────────────────────────────┐
│                        数据层                                │
│  ┌───────────┐  ┌───────────┐  ┌───────────┐               │
│  │ PostgreSQL│  │   Redis   │  │   S3/OSS  │               │
│  │ (用户数据) │  │  (缓存)   │  │  (文件)   │               │
│  └───────────┘  └───────────┘  └───────────┘               │
└─────────────────────────────────────────────────────────────┘
```

### 核心模块设计

#### 1. 命理计算引擎
```typescript
// 天干地支计算
interface BaziCalculator {
  // 根据阳历日期计算八字
  calculateFromSolar(date: Date, location?: GeoLocation): BaziResult;
  // 根据农历日期计算八字
  calculateFromLunar(lunarDate: LunarDate): BaziResult;
  // 计算大运流年
  calculateFortune(bazi: BaziResult, targetYear: number): FortuneResult;
}

// 八字结果
interface BaziResult {
  yearPillar: Pillar;   // 年柱
  monthPillar: Pillar;  // 月柱
  dayPillar: Pillar;    // 日柱
  hourPillar: Pillar;   // 时柱
  wuxing: WuxingBalance; // 五行平衡
  shiShen: ShiShenMap;   // 十神关系
}
```

#### 2. AI 分析服务
```typescript
// AI 分析接口
interface AIAnalysisService {
  // 八字命盘分析
  analyzeBazi(bazi: BaziResult, question?: string): Promise<AnalysisResult>;
  // 塔罗牌解读
  analyzeTarot(cards: TarotCard[], spread: SpreadType): Promise<AnalysisResult>;
  // 每日运势
  getDailyFortune(bazi: BaziResult, date: Date): Promise<FortuneResult>;
}
```

#### 3. 用户系统
```typescript
interface UserService {
  // 认证
  signIn(provider: AuthProvider): Promise<User>;
  // 保存命盘
  saveBazi(userId: string, bazi: BaziResult): Promise<void>;
  // 历史记录
  getHistory(userId: string): Promise<AnalysisHistory[]>;
  // 订阅管理
  getSubscription(userId: string): Promise<Subscription>;
}
```

### 目录结构（建议）

```
cyberfate/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (marketing)/        # 营销页面
│   │   │   ├── page.tsx        # 首页
│   │   │   ├── pricing/        # 定价
│   │   │   └── about/          # 关于
│   │   ├── (workspace)/        # 工作台
│   │   │   ├── bazi/           # 八字分析
│   │   │   ├── tarot/          # 塔罗牌
│   │   │   ├── liuyao/         # 六爻
│   │   │   └── huangli/        # 黄历
│   │   ├── api/                # API Routes
│   │   │   ├── bazi/           # 八字相关 API
│   │   │   ├── ai/             # AI 分析 API
│   │   │   └── user/           # 用户 API
│   │   └── layout.tsx
│   ├── components/             # 组件
│   │   ├── ui/                 # 基础 UI 组件
│   │   ├── bazi/               # 八字相关组件
│   │   └── shared/             # 共享组件
│   ├── lib/                    # 工具库
│   │   ├── bazi/               # 八字计算库
│   │   ├── lunar/              # 农历转换
│   │   ├── ai/                 # AI 集成
│   │   └── utils/              # 通用工具
│   ├── hooks/                  # React Hooks
│   ├── stores/                 # 状态管理
│   └── types/                  # TypeScript 类型
├── prisma/
│   └── schema.prisma           # 数据库模型
├── public/
│   ├── images/
│   └── fonts/
├── docs/                       # 文档
├── tests/                      # 测试
├── package.json
├── tailwind.config.ts
├── next.config.js
└── CLAUDE.md
```

---

## 🎯 开发路线图（建议）

### Phase 1: MVP（2-3 周）
- [ ] 项目初始化 + 技术栈搭建
- [ ] 八字计算核心算法
- [ ] 基础 UI（输入表单 + 结果展示）
- [ ] AI 分析集成（基础版）
- [ ] 部署到 Vercel

### Phase 2: 功能扩展（2-3 周）
- [ ] 用户系统（登录/注册）
- [ ] 历史记录保存
- [ ] 塔罗牌模块
- [ ] 黄历模块
- [ ] 响应式设计优化

### Phase 3: 商业化（2-3 周）
- [ ] 支付系统集成
- [ ] 会员订阅系统
- [ ] 更多命理功能
- [ ] SEO 优化
- [ ] 多语言支持

---

## 📝 待确认事项

1. **产品定位**：与 FateMaster 差异化在哪里？
2. **目标用户**：国内还是国际？（影响 AI 选型和支付方案）
3. **功能优先级**：先做哪些功能？
4. **设计风格**：赛博朋克？传统中国风？现代简约？

---

## 🔧 技术难点预估

| 难点 | 描述 | 解决方案 |
|------|------|----------|
| 八字计算 | 天干地支、五行、十神的复杂算法 | 使用现有开源库 / 自研 |
| 真太阳时 | 需要根据经纬度计算真太阳时 | 天文算法库 |
| 农历转换 | 阳历农历互转 | lunar-javascript 等库 |
| AI Prompt | 让 AI 输出专业且准确的命理分析 | 精细的 Prompt Engineering |

---

_技术调研完成，等待产品需求确定后开始实施 🦐_
