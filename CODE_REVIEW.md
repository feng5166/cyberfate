# 🔍 CyberFate 代码审查报告

> **审查日期：** 2026-04-17  
> **审查范围：** 全项目源码（排除 node_modules、.next）  
> **项目版本：** v0.1.0 (MVP 阶段)

---

## 📊 项目概览

### 技术栈

| 层级 | 技术 | 版本 |
|------|------|------|
| 框架 | Next.js (App Router) | 16.1.6 |
| 语言 | TypeScript (strict) | 5.x |
| 样式 | Tailwind CSS | 4.x |
| ORM | Prisma | ^5.22.0 |
| 认证 | NextAuth.js | ^4.24.13 |
| 支付 | Stripe SDK + 自研 Direct API | ^22.0.1 / 手写 |
| AI | DeepSeek V3.2 (via modelverse.cn) | 外部 API |
| 缓存 | Upstash Redis | ^1.37.0 |
| 命理计算 | lunar-javascript | ^1.7.7 |
| 数据验证 | Zod | ^4.3.6 |

### 项目规模

| 指标 | 数量 |
|------|------|
| 源码文件总数 | ~130 |
| API 路由 | ~35 个 |
| 页面组件 | ~20 个 |
| UI 组件 | ~15 个 |
| 业务逻辑库 (lib/) | ~25 个 |
| 数据文件 (data/) | 7 个 |

### 架构模式

- **前端：** Server Components + Client Components 混合，App Router
- **状态管理：** React Context (useReducer) 用于认证状态，NextAuth Session 用于服务端会话
- **API 设计：** RESTful 风格的 Route Handlers（`src/app/api/`）
- **数据层：** Prisma ORM → PostgreSQL
- **缓存层：** Upstash Redis（AI 结果缓存）
- **支付：** 双轨制 — Stripe SDK (`/api/payment/create`) + 手写 HTTP (`/api/stripe/*`, `/lib/stripe-direct.ts`)

---

## 🔴 严重问题 (P0)

### P0-1: Admin API 完全无认证保护 ⚠️⚠️⚠️

**文件：** `src/app/api/admin/fix-vip/route.ts`, `src/app/api/admin/create-subscription/route.ts`, `src/app/api/admin/check-user/route.ts`

**问题描述：** 所有三个 admin API 路由**没有任何身份验证或权限检查**。任何知道接口地址的人都可以：

- **`POST /api/admin/fix-vip`** — 修改任意用户的 VIP 状态和到期时间
- **`POST /api/admin/create-subscription`** — 为任意邮箱用户创建付费订阅
- **`POST /api/admin/check-user`** — 查询任意用户的订单和订阅详情（**数据泄露**）

```typescript
// fix-vip/route.ts - 无任何 auth 检查！
export async function POST(req: NextRequest) {
  const { email, correctPlan } = await req.json();
  // 直接操作数据库...
}
```

**风险等级：** 🔴 **极高** — 可被利用免费开通 VIP、窃取用户数据  
**修复建议：**
1. 立即添加 admin 角色验证中间件
2. 考虑使用 API Key 或 IP 白名单
3. 生产环境应移除或严格限制这些调试接口

---

### P0-2: 支付回调接口无签名验证（IDOR 漏洞）⚠️⚠️⚠️

**文件：** `src/app/api/payment/callback/route.ts`

**问题描述：** 支付回调接口仅通过 `outTradeNo` 查找订单，**无任何签名验证、无金额校验、无用户身份确认**。攻击者可以：

1. 通过枚举或猜测 `outTradeNo` 直接将任意订单标记为"已支付"
2. 伪造 `transactionId` 绕过支付流程
3. **零成本获取 VIP 订阅**

```typescript
export async function POST(req: NextRequest) {
  const { outTradeNo, transactionId } = await req.json();
  // ❌ 无签名验证
  // ❌ 无金额比对
  // ❌ 无调用方身份确认
  const order = await prisma.order.findUnique({ where: { outTradeNo } });
  // ...直接标记为 paid 并创建订阅
}
```

**风险等级：** 🔴 **极高** — 直接导致资金损失  
**修复建议：**
1. 对非 Stripe 回调场景必须实现 HMAC 签名验证
2. 校验回调金额与订单金额一致
3. 限制回调来源 IP
4. 如果该接口仅为微信/支付宝回调使用，必须对接官方 SDK 验签

---

### P0-3: 支付状态查询接口存在 IDOR（越权访问）

**文件：** `src/app/api/payment/status/route.ts`

**问题描述：** 登录用户可以通过 `orderId` 查询**任意用户**的订单状态，未验证订单归属。

```typescript
const order = await prisma.order.findUnique({ where: { id: orderId } });
// ❌ 未检查 order.userId === session.user.id
```

**风险等级：** 🔴 **高** — 订单信息泄露  
**修复建议：** 添加 `where: { id: orderId, userId: session.user.id }` 条件

---

### P0-4: Test Webhook 接口泄露敏感配置信息

**文件：** `src/app/api/test-webhook/route.ts`

**问题描述：** 测试接口在响应中返回了 **Stripe Webhook Secret 的前缀和长度**：

```typescript
return NextResponse.json({
  secretConfigured: !!webhookSecret,
  secretPrefix: webhookSecret?.substring(0, 15),  // 泄露密钥前缀！
  secretLength: webhookSecret?.length,               // 泄露密钥长度！
});
```

**风险等级：** 🔴 **高** — 大幅降低暴力破解难度  
**修复建议：** 立即删除此接口或限制仅本地开发环境访问；绝不能返回任何密钥信息

---

### P0-5: Stripe Secret Key 日志泄露

**文件：** `src/lib/stripe.ts`, `src/app/api/payment/webhook/route.ts`

**问题描述：** 多处将 Stripe 密钥信息写入日志：

```typescript
// stripe.ts
console.log('[Stripe] API Key 长度:', apiKey?.length, '前缀:', apiKey?.substring(0, 10));

// webhook/route.ts
console.log('[Webhook] Secret prefix:', webhookSecret.substring(0, 10));
```

**风险等级：** 🔴 **高** — 日志系统可能被未授权访问（如日志聚合平台）  
**修复建议：** 移除所有密钥相关日志输出，仅记录是否配置成功

---

### P0-6: 注册接口缺少速率限制和验证码保护

**文件：** `src/app/api/auth/register/route.ts`

**问题描述：** 用户注册接口：
- **无速率限制** — 可被脚本批量注册垃圾账号
- **无邮箱验证** — 注册后即可直接使用，可被用于滥用免费配额
- **nickname 无输入限制** — 可能存入超长字符串或特殊字符

```typescript
const user = await prisma.user.create({
  data: {
    email,
    passwordHash,
    nickname: nickname || email.split('@')[0],  // ❌ 无长度限制
  },
});
```

**风险等级：** 🔴 **中高** — 批量注册滥用配额、数据库污染  
**修复建议：** 添加速率限制（如 rate limiting middleware）、邮箱验证流程、nickname 长度限制

---

## 🟠 重要问题 (P1)

### P1-1: 双重 Prisma 实例（架构缺陷）

**文件：** 
- `src/lib/db.ts` — 支持 datasourceUrl 配置
- `src/lib/prisma.ts` — 不支持 datasourceUrl，使用默认 DATABASE_URL

**问题描述：** 项目中存在两个 Prisma 客户端实例，不同 API 路由引用不同的实例：

| 引用 `@/lib/db` 的路由 | 引用 `@/lib/prisma` 的路由 |
|---|---|
| auth, payment/webhook, bazi, daily, quota, user/*, subscription/*, stripe/* | admin/*, tarot/*, user/birth-info, subscription/current, subscription/cancel |

这会导致：
- 连接池资源浪费
- 如果两个实例配置不一致（一个有 datasourceUrl 一个没有），可能连接到不同数据库
- 维护混乱

**修复建议：** 统一为一个 Prisma 实例，删除 `prisma.ts`

---

### P1-2: 合婚匹配度算法为随机数（业务逻辑缺陷）

**文件：** `src/app/api/bazi/marriage/route.ts` → `calculateScore()`

**问题描述：** 八字合婚的核心匹配度评分完全是**随机生成**的（70-100 分），与实际八字数据无关：

```typescript
function calculateScore(maleBazi: string, femaleBazi: string) {
  const score = Math.floor(Math.random() * 30) + 70; // 70-100分 ← 完全随机！
  // ...
}
```

**影响：** 用户基于此功能做人生重要决策，但结果毫无依据。从产品诚信角度这是严重问题。

**修复建议：** 实现基于五行互补、生肖相合、日干关系等维度的真实匹配算法

---

### P1-3: 塔罗牌配额检查形同虚设

**文件：** `src/app/api/tarot/draw/route.ts`

**问题描述：** `checkQuota()` 函数中 `used` 硬编码为 0，`useQuota()` 中增量操作被注释掉：

```typescript
const used = 0; // spread === 'single' ? quota.tarotSingleCount : ... : 0;
// ↑ 永远是 0，意味着永远不会触发限额

async function useQuota(...) {
  await prisma.usageQuota.upsert({
    update: { /* tarotSingleCount: { increment: 1 } */ },  // ← 被注释！
    create: { userId, date: today /* , tarotSingleCount: 1 */ },  // ← 被注释！
  });
}
```

同时历史记录保存也被完全注释掉。这意味着：
- 免费用户无限次使用塔罗功能
- VIP 门槛形同虚设
- 无使用记录留存

**修复建议：** 取消注释并正确实现配额扣减逻辑

---

### P1-4: 订阅到期时间计算精度错误

**文件：** 多处（webhook、admin、callback 等）

**问题描述：** 使用 `setDate` / `setMonth` 计算订阅到期时间，存在月份溢出问题：

```typescript
// webhook/route.ts - 使用 setDate
expireAt.setDate(expireAt.getDate() + duration);

// admin 路由 - 使用 setMonth
correctExpiry.setMonth(correctExpiry.getMonth() + 1);
```

对于 `setDate` 方式，如果当前是 1 月 31 日，加 30 天变成 3 月 2 日（而非 2 月 28/29 日后的对应日）。对于 `setMonth` 方式，1 月 31 日加一个月会变成 3 月 3 日（因为 2 月没有 31 日）。

**修复建议：** 统一使用可靠的时间计算库（如 date-fns 的 `addDays`/`addMonths`），项目中已安装 date-fns 但未使用

---

### P1-5: Session 回调中的 N+1 查询问题

**文件：** `src/lib/auth.ts` → `session` callback

**问题描述：** 每次 session 验证都会执行两次数据库查询（查用户头像 + 查订阅状态），在高并发下会成为性能瓶颈：

```typescript
async session({ session, token }) {
  // 查询 1: 获取头像
  const dbUser = await prisma.user.findUnique({...});
  // 查询 2: 检查订阅
  const activeSubscription = await prisma.subscription.findFirst({...});
}
```

**修复建议：** 使用单次查询（`include` 或减少 session callback 调用频率），考虑 JWT 中缓存非关键信息

---

### P1-6: 缺少 CSRF 保护

**问题描述：** 项目使用 NextAuth 的 Credentials Provider 进行邮箱密码登录，但所有 POST API 路由（注册、支付创建、配额使用等）均无 CSRF Token 验证。虽然 SameSite Cookie 提供了一定保护，但在特定场景下仍存在风险。

**修复建议：** 对状态修改操作添加 CSRF Token 校验或使用 NextAuth 内置的 CSRF 保护机制

---

### P1-7: Redis 客户端缺少错误降级的启动保障

**文件：** `src/lib/cache/redis.ts`

**问题描述：** Redis 客户端在模块加载时即初始化，如果环境变量缺失会导致运行时崩溃（使用了 `!` 断言）：

```typescript
export const redis = new Redis({
  url: process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL_URL!,  // ! 可能 crash
  token: process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN!, // ! 可能 crash
});
```

**修复建议：** 添加环境变量存在性检查，Redis 不可用时优雅降级（跳过缓存但不阻塞主流程）

---

### P1-8: AI Prompt 存在注入风险

**文件：** `src/app/api/bazi/marriage/route.ts`, `src/app/api/huangli/ask/route.ts`, `src/app/api/meihua/draw/route.ts`

**问题描述：** 用户输入（姓名、问题等）直接拼接到 AI Prompt 中，虽然目标不是 SQL/命令注入，但：
1. 恶意用户可以注入系统指令操纵 AI 输出（Prompt Injection）
2. 特殊字符可能导致 JSON 解析失败
3. 黄历接口的 `date` 参数未做格式校验就直接传入 `Solar.fromYmd()`

```typescript
// marriage/route.ts - 用户输入直接拼接 prompt
const prompt = `...男方姓名：${maleName || '男方'}\n女方姓名：${femaleName || '女方'}...`;
```

**修复建议：** 对用户输入进行转义/清洗，限制长度和字符集

---

### P1-9: `authStore` 与 NextAuth Session 状态不同步

**文件：** `src/stores/authStore.tsx`

**问题描述：** 项目维护了两套认证状态系统：
1. **NextAuth Session** — 服务端驱动的标准会话（含 isSubscribed）
2. **AuthStore (React Context)** — 客户端的 useReducer 状态

两者之间没有同步机制。`AuthProvider` 包裹了整个应用，但其状态（guest/free/paid）从未被 NextAuth session 更新过。这意味着客户端的 `isSubscribed` 状态可能是过时的。

**修复建议：** 移除 AuthStore 或将其与 NextAuth Session 同步

---

### P1-10: `check-email` 接口可被用于枚举注册邮箱

**文件：** `src/app/api/auth/check-email/route.ts`

**问题描述：** 该接口无速率限制，可被用于批量探测哪些邮箱已注册。

**修复建议：** 添加速率限制或仅在注册/登录流程内部使用

---

## 🟡 建议改进 (P2)

### P2-1: 代码重复

| 重复内容 | 出现位置 |
|----------|----------|
| 时辰映射 `HOUR_TO_SHICHEN` | `bazi/route.ts` 和 `daily/route.ts` 各定义一次 |
| Prisma VIP 检查查询 | `isVip()` 在 `quota.ts`、`subscription.ts`、`tarot/draw/route.ts` 中重复实现 |
| 五行名称映射 `wuxingNames` | `bazi/route.ts` 和 `ai/client.ts` 中各有一个 fallback 分析函数包含相同映射 |
| DeepSeek API 调用 | `marriage/route.ts`、`huangli/ask/route.ts`、`meihua/draw/route.ts` 各自手写 fetch 调用，未复用 `ai/client.ts` 中的 `callDeepSeek()` |
| Fallback 分析文本 | `generateFallbackAnalysis()` 和 `generateFallbackBaziAnalysis()` 功能几乎一致 |
| 降级运势生成 | `generateFallbackFortune()` 在 `daily/route.ts` 中独立定义，与 `ai/client.ts` 中的版本类似但不同 |

**建议：** 统一到共享模块，消除重复

---

### P2-2: 代码风格不一致

- **API 响应风格混用：** 有的用 `Response.json()`，有的用 `NextResponse.json()`
- **错误处理不统一：** 有的用 try-catch + return，有的用 Zod validation，有的裸抛异常
- **导入路径别名不一致：** 有的用 `@/lib/db`，有的用 `@/lib/prisma`
- **类型标注风格：** 有的文件大量使用 `any`（如 `normalizeRatings(ratings: any, ...)`），有的则严格类型化
- **console.log 残留：** 生产代码中大量 `console.log` / `console.warn` 调试语句

---

### P2-3: 缺少测试覆盖

**问题描述：** 整个项目**零单元测试、零集成测试、零 E2E 测试**。虽然 `package.json` 中有 `playwright` 依赖，但未发现任何测试文件。

关键应该测试但未测试的功能：
- 八字计算正确性（核心业务逻辑）
- 支付 Webhook 签名验证
- 配额扣减逻辑
- 输入验证（Zod schema）
- AI 降级逻辑

---

### P2-4: 依赖管理问题

1. **Next.js 版本跳跃过大：** CLAUDE.md 写的是 "Next.js 14"，但 package.json 实际安装的是 `next: 16.1.6`，文档严重滞后
2. **Zod v4：** 使用 `zod: ^4.3.6`（较新版本），需确认生态兼容性
3. **React 19：** 使用 `react: 19.2.3`，部分第三方组件库可能不完全兼容
4. **lunar-javascript 使用 require：** `huangli/calculator.ts` 中使用 `require('lunar-javascript')` 而非 ESM import，在 strict ESM 模式下可能有构建问题

```typescript
// huangli/calculator.ts - 使用 require
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { Solar } = require('lunar-javascript');
```

---

### P2-5: 错误处理不够健壮

| 问题 | 位置 |
|------|------|
| `req.json()` 未全部包裹 try-catch | 部分路由直接 `await req.json()` 若 body 不是 JSON 会 500 |
| 数据库事务失败无回滚补偿 | webhook 处理中若 subscription 创建成功但 order 更新失败会导致数据不一致 |
| AI 响应 JSON 解析使用正则 `/\{[\s\S]*\}/` | 可能匹配到错误的 JSON 块（如 prompt 中包含 JSON 示例时） |
| Redis 连接失败静默吞掉异常 | 缓存读写失败仅 console.warn，不影响主流程（这点做得好，但应有 metrics） |

---

### P2-6: 安全头不完整

**文件：** `next.config.ts`

**问题描述：** 已配置的安全头缺少关键项：

```typescript
// 已有 ✅
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()

// 缺失 ❌
Content-Security-Policy (CSP)           // 防止 XSS
Strict-Transport-Security (HSTS)         // 强制 HTTPS
X-XSS-Protection                        // XSS 过滤（虽已被 CSP 取代但仍推荐）
Cross-Origin-Opener-Policy              // 隔离跨域访问
Cross-Origin-Embedder-Policy            // 控制 CORS 嵌入
```

---

### P2-7: 环境变量管理不规范

**问题描述：**
- 多处使用 `process.env.XXX || ''` 作为 fallback 空字符串（如 Google Provider clientId/secret），空字符串传给 SDK 可能导致奇怪行为
- `getEnvVar()` 工具函数未被全面采用（很多地方直接读 process.env）
- `.env.example` 或环境变量文档未见

---

### P2-8: TypeScript 类型安全问题

1. **`any` 类型泛滥：** `normalizeRatings` 参数、缓存值 `getCache` 返回 `Promise<any>`、多处 `as any` 强制转换
2. **非空断言过度使用：** `user.email!`、`customersRes.data!.data` 等
3. **Prisma 返回类型与业务类型不一致：** 如 Subscription.plan 是 enum 类型但多处当作 `string` 或 `PlanId` 使用

---

### P2-9: 前端组件潜在问题

1. **VipContentMask 仅做视觉模糊：** VIP 内容只是 CSS blur + 遮罩层，数据实际上已经发送到前端，有经验的用户可通过 DevTools 查看
2. **AuthModal / EmailLoginForm：** 密码字段需确认是否有强度要求
3. **CitySearch 组件：** 加载完整中国城市列表到前端，考虑 bundle size 影响

---

### P2-10: 文件组织建议

- `src/lib/ai/prompts-v1-backup.ts` — 备份文件不应进入版本控制
- `src/components/ziwei/mockData.ts` — mock 数据确认不会进入生产构建
- `src/app/test-stripe/page.tsx` — 测试页面不应部署到生产环境

---

## ✅ 做得好的地方

### ✅ 1. 输入验证体系
- 八字 API 和每日运势 API 使用 **Zod Schema** 进行请求体验证，类型安全且自动生成错误消息
- 六爻占卜实现了完整的自定义 `validateRequest()` 函数，对爻数据做了严格的 0/1 校验
- 梅花易数起卦对数字输入做了 `parseNumber()` 安全解析

### ✅ 2. AI 优雅降级策略
- 所有 AI 调用都有 **fallback 机制**：当 DeepSeek API 不可用时，自动切换到本地规则引擎生成结果
- `callExternalAPI()` 包装器统一了错误处理和降级逻辑
- 缓存命中时直接返回，避免重复调用 AI API（节省成本）

### ✅ 3. 缓存架构合理
- 基于 Redis 的多层缓存（八字分析永久缓存、每日运势 24h、塔罗/梅花/六爻 12h）
- 缓存 key 基于输入参数确定性生成，避免缓存穿透
- 缓存失败不影响主流程（fail-open 策略）

### ✅ 4. 安全头基础配置
- `next.config.ts` 中已配置 X-Frame-Options、X-Content-Type-Options、Referrer-Policy、Permissions-Policy
- 显示了一定的安全意识

### ✅ 5. 密码安全
- 使用 **bcryptjs**（salt rounds = 10）进行密码哈希
- 注册时强制密码最小长度 6 位
- Google OAuth 登录用户无 passwordHash 时拒绝密码登录

### ✅ 6. Webhook 签名验证（Stripe 部分）
- `payment/webhook/route.ts` 实现了**自建的 Stripe 签名验证**（HMAC-SHA256 + timing-safe compare）
- 包含时间戳容差检查（300 秒）
- 虽然建议使用官方 SDK，但手工实现基本正确

### ✅ 7. 代码可读性
- 中文变量命名和注释使命理领域逻辑易于理解
- 组件结构清晰（按功能模块分目录：ziwei/, bazi/, tarot/, huangli/）
- Tailwind 主题扩展（五行色系、品牌色、字体）设计规范

### ✅ 8. TypeScript 严格模式
- `tsconfig.json` 启用了 `strict: true`，有助于提前发现类型错误
- 业务数据类型定义完善（`types.ts` 文件覆盖主要领域模型）

---

## 📋 总结与优先级建议

### 🔥 Top 5 最需要修复的问题

| 优先级 | 问题 | 影响 | 工作量 |
|--------|------|------|--------|
| **#1** | **P0-1: Admin API 无认证** | 任何人可操作用户 VIP 状态、查看用户数据 | 小（加中间件） |
| **#2** | **P0-2: 支付回调无签名验证** | 可零成本伪造支付获取 VIP | 中（实现签名验签） |
| **#3** | **P0-4: Test Webhook 泄露密钥信息** | 降低 Stripe 密钥破解难度 | 小（删除接口） |
| **#4** | **P1-1: 双重 Prisma 实例** | 可能连接不同数据库、连接池浪费 | 小（统一引用） |
| **#5** | **P1-3: 塔罗配额系统失效** | VIP 付费动力丧失、资源被滥用 | 小（取消注释） |

### 修复路线图建议

#### 第一阶段：安全紧急修复（1-2 天）
1. 删除或保护 admin API（P0-1）
2. 删除 test-webhook 接口（P0-4）
3. 清理所有密钥日志输出（P0-5）
4. 修复支付状态查询 IDOR（P0-3）
5. 为支付回调添加基本保护（P0-2，至少加 IP 白名单）

#### 第二阶段：核心逻辑修复（3-5 天）
1. 统一 Prisma 实例（P1-1）
2. 修复塔罗配额系统（P1-3）
3. 实现真实合婚算法（P1-2）
4. 修复订阅到期时间计算（P1-4）
5. 添加 CSP 安全头（P2-6）

#### 第三阶段：代码质量提升（1 周）
1. 消除代码重复（P2-1）
2. 统一代码风格和错误处理（P2-2, P2-5）
3. 补充核心模块单元测试（P2-3）
4. 清理生产环境不需要的文件（P2-10）
5. 同步 AuthStore 与 NextAuth（P1-9）

---

## 📊 评分总览

| 维度 | 评分 (1-10) | 说明 |
|------|:-----------:|------|
| **安全性** | 4 | 存在多个高危漏洞，急需修复 |
| **代码质量** | 6 | 结构清晰但有重复和不一致 |
| **可维护性** | 5 | 双实例、双状态系统增加维护成本 |
| **性能** | 7 | 缓存策略好，但 session 有 N+1 问题 |
| **测试覆盖** | 1 | 零测试 |
| **文档完整性** | 5 | CLAUDE.md 有但与实际不符 |
| **综合评分** | **5.0** | MVP 阶段合格，距生产就绪有差距 |

---

_🦐 代码审查完成 by GeekAI 虾 · 2026-04-17_
