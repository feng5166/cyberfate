# P2 Review Report — CyberFate (DB Schema / Chaos / SEO / a11y)

_Reviewer: GeekAI 虾 (geekai) · Date: 2026-04-19 · Branch: `main`_

## Executive Summary

P2 覆盖 4 个板块：**数据库 Schema 完整性**、**第三方故障模拟 (Chaos)**、**SEO 增长就绪度**、**可访问性 a11y**。

| 板块 | 当前评分 | 关键发现数 | 阻断级问题 |
|------|---------|-----------|-----------|
| **DB Schema** | C+ | 8 | 1 (索引缺失) |
| **Chaos 工程** | D | 5 | 2 (无降级/无超时) |
| **SEO** | C- | 6 | 2 (静态 sitemap/缺 Schema.org) |
| **a11y** | D | 7 | 3 (键盘/label/对比度) |

**总体：C (可用但距离生产级有显著差距)**

---

## P2-1: DB Schema 审计

### 现状概览

- **ORM:** Prisma 5.22 + PostgreSQL
- **表数量:** 10 张表（User, Account, Session, VerificationToken, Subscription, Order, UsageQuota, PasswordResetToken, TarotReading）
- **现有索引:** 4 个（subscriptions 复合索引 x2, password_reset_tokens.email, usage_quotas 唯一索引）

### DS-1 🔴 缺失关键索引 — 高优先级

**问题:** 多个高频查询路径缺少索引，用户量增长后会导致全表扫描。

| 查询模式 | 缺失索引 | 影响 |
|---------|---------|------|
| `subscription.findFirst({ where: { userId, ... } })` | `@@index([userId])` | 每次查订阅都扫全表，出现于 10+ 个 API |
| `order.findMany({ where: { userId, status } })` | `@@index([userId, status])` | invoices/billing-history 查询 |
| `tarotReading.findMany({ where: { userId } })` | `@@index([userId])` | 历史记录查询 |

**修复方案:**
```prisma
// Subscription 表添加 userId 单列索引
model Subscription {
  // ...existing fields
  @@index([userId, status, expireAt])
  @@index([userId, createdAt])
  @@index([userId, status])          // 新增
  @@map("subscriptions")
}

// Order 表优化已有索引
model Order {
  // ...existing fields
  @@index([userId, status, createdAt]) // 已有
  @@index([userId, status])           // 新增（简化查询）
  @@map("orders")
}

// TarotReading 表添加 userId 索引
model TarotReading {
  // ...existing fields
  @@index([userId, createdAt])        // 已有
  @@index([userId])                   // 新增（简化查询）
  @@map("tarot_readings")
}
```

### DS-2 🟡 JSON 字段滥用 — 中优先级

**问题:** `TarotReading.cards` 使用 `Json` 类型存储牌组数据。
- **现状:** 仅 1 个 JSON 字段，使用合理（牌组数据结构灵活）
- **风险:** 无法对 cards 内部字段建索引或查询
- **结论:** ✅ 当前使用合理，暂不需要拆分。但如果未来需要"按牌名搜索历史占卜"，需要规范化。

### DS-3 🟡 无 Soft Delete — 中优先级

**问题:** 所有表使用硬删除 (`onDelete: Cascade`)。TarotReading 和 Order 数据删除后无法恢复。
- **建议:** 至少对 TarotReading 和 Order 添加 `deletedAt DateTime?` 字段
- **优先级:** P2 低 / P3 高（当前用户量小，影响不大）

### DS-4 🟢 Migration 兼容性 — 信息收集

**需要确认:**
- [ ] 生产库是否通过 Prisma Migrate 管理？还是直接 `db push`？
- [ ] 是否有 baseline migration？
- [ ] `dev.db` 是 SQLite（开发用），生产是 PostgreSQL？

**建议:** 创建正式的 migration 文件管理所有 schema 变更。

### DS-5 🟢 缺少数据完整性约束

**观察:**
- `UsageQuota.baziAiCount` 等 count 字段无范围约束（可为负数）
- `Order.amount` 无正数校验
- `birthDate` 格式为 String 而非 DateTime（失去 DB 层日期校验）

**建议:** 
- 应用层已做校验（Zod），但建议 DB 层加 CHECK 约束作为最后防线

### DS-6 🟢 备份与恢复

**需要配置:**
- [ ] Supabase 自动备份策略？（如果用 Supabase 托管 PG）
- [ ] Vercel/外部 pg_dump 定时任务？
- [ ] RTO/RPO 目标？

---

## P2-2: Chaos Engineering (第三方故障模拟)

### CE-1 🔴 AI 路由无服务端超时控制 — 阻断级

**问题:** P1 报告已指出（B-1），AI 路由在 Vercel 默认 10s/15s 超时内可能被杀。但即使加了 `maxDuration`，**代码层面也没有对 fetch 调用做 AbortController 包装的统一超时**。

**影响:** 第三方 AI API 挂了 → 用户等很久 → 最终看到 Vercel 504 页面

**需要的降级策略:**

| API | 故障模式 | 降级方案 |
|-----|---------|---------|
| DeepSeek (八字) | 超时/500/限流 | 返回缓存结果 或 静态 fallback 报告 |
| DeepSeek (每日运势) | 同上 | 返回预计算的当日缓存 |
| DeepSeek (塔罗) | 同上 | 返回基础牌意解释（无需 AI） |
| Stripe | Webhook 丢失 | 定时对账任务 reconcile |
| Upstash Redis | 不可用 | 直连 DB（降级性能） |
| Google OAuth | 过期 token | 引导重新登录 |

### CE-2 🔴 无断路器模式 (Circuit Breaker) — 阻断级

**问题:** 如果 DeepSeek API 连续失败，系统会继续尝试每个请求，浪费资源和时间。
- **建议:** 实现简单计数器断路器（Redis 存储）
  - 连续失败 > 5 次 → 开路 30s → 直接返回 fallback
  - 半开状态 → 放行 1 个请求测试 → 成功则关路

### CE-3 🟡 无统一错误处理中间件

**问题:** 每个 API 路由独立 try/catch，错误格式不统一。第三方故障时客户端难以区分"业务错误"和"第三方故障"。
- **建议:** 统一 error code 系统：
  - `AI_SERVICE_UNAVAILABLE` (503)
  - `AI_RATE_LIMITED` (429)
  - `PAYMENT_SERVICE_ERROR` (502)
  - `CACHE_SERVICE_ERROR` (500)

### CE-4 🟡 无故障注入测试能力

**问题:** 无法在 staging 环境模拟第三方故障来验证降级逻辑。
- **建议:** 添加 `?_chaos=timeout` 或 `?_chaos=500` debug 参数（仅非生产环境）
- **工具:** 可写一个简单的 Chaos middleware

### CE-5 🟢 Webhook 幂等性

**✅ 已实现:** `transactionId @unique` 防止 Stripe 重复写入。这是好的实践。

**⚠️ 但需验证:** Webhook 重试时的幂等性——如果同一个 invoice 的 webhook 来两次，是否会重复创建订阅？
- `src/app/api/payment/webhook/route.ts:214` 有 `findFirst` 检查，✅ 基本安全

---

## P2-3: SEO 审计

### SEO-1 🔴 静态 sitemap.xml — 阻塞级

**问题:** `public/sitemap.xml` 是硬编码的静态文件，lastmod 全是 `2026-04-07`。
- 缺少页面：`/liuyao`, `/meihua`, `/bazi/marriage`, `/knowledge`, `/about`, `/profile`
- `/auth/login` 不应该出现在 sitemap（无价值页面）
- lastmod 不会自动更新

**修复方案:** 使用 Next.js App Router 的 **动态 sitemap.ts** 生成：
```typescript
// app/sitemap.ts
import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://www.cyberfate.me'
  return [
    { url: baseUrl, lastmod: new Date(), changeFrequency: 'weekly', priority: 1 },
    { url: `${baseUrl}/bazi`, lastmod: new Date(), changeFrequency: 'weekly', priority: 0.9 },
    { url: `${baseUrl}/daily`, lastmod: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${baseUrl}/tarot`, lastmod: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/ziwei`, lastmod: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/huangli`, lastmod: new Date(), changeFrequency: 'daily', priority: 0.8 },
    { url: `${baseUrl}/meihua`, lastmod: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/liuyao`, lastmod: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/pricing`, lastmod: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/knowledge`, lastmod: new Date(), changeFrequency: 'weekly', priority: 0.6 },
    { url: `${baseUrl}/about`, lastmod: new Date(), changeFrequency: 'monthly', priority: 0.5 },
  ]
}
```

### SEO-2 🔴 缺少 Schema.org 结构化数据 — 高优先级

**问题:** 没有 JSON-LD 结构化数据，搜索引擎无法理解页面内容类型。
- 首页应该是 `WebSite` + `Organization`
- `/bazi` 应该是 `WebApplication` 或自定义 FAQ schema
- `/pricing` 应该是 `Product`
- 需要 `BreadcrumbList` 面包屑

**修复:** 在 layout.tsx 或各页面添加 `<script type="application/ld+json">`

### SEO-3 🟡 OG Image 是 SVG — 中优先级

**问题:** `og-image.svg` 只有 383 bytes，看起来是个 placeholder 而非真正的 OG 图片。社交平台（微信、Twitter）不会渲染 SVG。
- **需要:** 1200x630 的 PNG/JPG OG 图片
- **微信分享:** 需要微信专用的分享图片（建议 500x400 PNG）

### SEO-4 🟡 缺少百度 SEO 配置 — 中优先级

**针对中文市场:**
- [ ] 百度站长平台验证（meta tag 或文件）
- [ ] 百度蜘蛛抓取友好（避免 JS 渲染依赖过重）
- [ ] `robots.txt` 增加 `Crawl-delay`（可选）
- [ ] 百度 Sitemap ping API

### SEO-5 🟡 缺少 canonical URL — 低优先级

**问题:** 没有显式设置 canonical tag。如果有 www / 非 www / http 变体，可能导致重复内容。
- **修复:** 在 layout.tsx 的 metadata 中添加 `alternates: { canonical: '...' }`

### SEO-6 🟢 robots.txt 基本合格

**✅ 正确:** 存在且指向 sitemap
**⚠️ 建议:** 排除管理页面和 API 路径：
```
User-agent: *
Disallow: /api/
Disallow: /admin/
Disallow: /auth/
Disallow: /profile/
Allow: /
Sitemap: https://www.cyberfate.me/sitemap.xml
```

---

## P2-4: 可访问性 (a11y) 审计

### A11Y-1 🔴 键盘导航不完整 — 阻断级

**问题:**
- 自定义组件（Select、Modal、Tab）缺少完整键盘支持
- `src/components/ui/Select.tsx` — 下拉选择缺少 ArrowUp/ArrowDown/Esc 键处理
- Modal 组件（PaymentModal 等）未检测 Focus Trap
- Tab 切换（如 admin 页面）没有 ArrowLeft/Right 支持
- **只有** `ForgotPasswordModal` 有 onKeyDown 处理（Enter 提交）

**WCAG 2.4.3 Focus Order (Level AA)**

### A11Y-2 🔴 表单 label 关联缺失 — 高优先级

**问题:** 大量 `<label>` 没有 `htmlFor`，或输入框没有显式 id：
- `src/app/bazi/page.tsx:766-804` — 姓名/性别/时辰 label 无 htmlFor
- `src/app/daily/page.tsx:240` — 出生日期 label 无 htmlFor
- `src/app/liuyao/page.tsx:457-615` — 多个 label 无 htmlFor
- `src/app/ziwei/page.tsx:378` — 性别 label 无 htmlFor

**影响:** Screen reader 无法正确朗读标签关联

**修复:** 给每个 `<input>` 加 `id`，对应 `<label htmlFor={id}>`

### A11Y-3 🔴 颜色对比度可能不足 — 高优先级

**问题:** 设计使用了大量低对比度的颜色：
- 文字颜色 `#1C1A16/70` (40% opacity), `#1C1A16/60`, `#1C1A16/40` — placeholder 文字
- 边框 `#1C1A16/15` (15% opacity)
- `#D5D0CA`, `#B8B4AE`, `#C4C0BA` — 浅灰文字
- `#D4C9B8` — 黄历输入框边框

这些需要逐个验证 WCAG AA 标准（正文 4.5:1，大字 3:1）。

### A11Y-4 🟡 Alt text 不完整 — 中优先级

**问题:**
- `Header.tsx:83` — Logo `alt=""` （空 alt）
- `Header.tsx:153` — 用户头像 `alt=""`
- `Sidebar.tsx:349` — Logo `alt=""`

空 alt 只能用于装饰性图片。Logo 和头像属于有意义的内容图片。

### A11Y-5 🟡 缺少 Skip Navigation Link — 中优先级

**问题:** 没有 "跳到主要内容" 链接。键盘用户每次都要 Tab 过整个导航栏。

### A11Y-6 🟡 缺少 Live Region — 中优先级

**问题:** AI 加载状态变化（如八字分析中...→完成）没有 `aria-live` 区域。Screen reader 用户不知道页面发生了变化。

### A11Y-7 🟢 Touch target 尺寸 — 信息收集

**问题:** 移动端按钮和链接需要至少 44x44px 的触摸目标。
- 需要逐页验证 min-height/min-width

---

## 执行优先级排序

### 第一批（立即执行）
1. **DS-1** 添加缺失索引（Prisma schema + migration）
2. **CE-1+CE-2** AI 路由超时包装 + 简单断路器
3. **SEO-1** 动态 sitemap.ts 替换静态文件
4. **A11Y-1+A11Y-2** 键盘导航 + label 关联（核心表单）

### 第二批（本周内）
5. **SEO-2** Schema.org JSON-LD
6. **A11Y-3** 颜色对比度审计和修复
7. **CE-3** 统一错误码
8. **SEO-6** robots.txt 增强

### 第三批（持续改进）
9. **SEO-3** OG Image 制作（PNG 版本）
10. **SEO-4** 百度 SEO
11. **A11Y-4~7** Alt text / Skip nav / Live region / Touch target
12. **DS-3** Soft delete
13. **CE-4** Chaos 注入工具

---

_报告生成时间：2026-04-19 09:40 GMT+8_
