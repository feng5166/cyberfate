# CyberFate 项目代码审查报告

> **审查工具：** Claude Code Opus 4.7  
> **审查日期：** 2026-04-18  
> **审查范围：** 183 个 TypeScript 源文件、41 个 API 路由、Prisma Schema、配置与脚本  
> **审查人：** GeekAI 虾 (geekai)

---

## 🔴 一、严重问题（立即处理）

### 【CRIT-1】生产级真实密钥大量泄露于 Git 仓库 ⚠️ **最高优先级**

**文件：** `.env.prod`、`.env.production`、`.env.test`、`.env.prod.tmp`、`.env.vercel`、`.env.pulled`

泄露的生产凭证：

| 凭证 | 风险 |
|---|---|
| Stripe Secret Key (`sk_live_51T9PDd...`) | 可直接发起收费/退款、提取资金 |
| Stripe Webhook Secret (`whsec_*`) | 可伪造支付事件绕过验证 |
| Prisma Postgres 连接串（含密码） | 可全量读写用户数据、订单 |
| Upstash Redis Token | 可读写 Redis |
| Resend API Key | 可冒用账户发邮件 |
| Vercel OIDC Token | 可操作部署权限 |

**修复：**
1. 立即轮换所有上述凭证
2. `git rm --cached` 并用 `git filter-repo`/BFG 清除 Git 历史
3. `.gitignore` 明确 `.env.*` 并加 `!.env.example` 白名单
4. **在轮换完成前视所有服务已被访问。**

---

### 【CRIT-2】Stripe Webhook 幂等与越权缺陷

**文件：** `src/app/api/payment/webhook/route.ts:175-200`

无 Order 的直接支付流程中：
1. 缺少以 `session.id` 为 `transactionId` 的幂等查重 → 网络重投递会重复开通 VIP
2. `userId` 直接取自 `metadata` 未校验数据库存在性 → metadata 被篡改可为任意 userId 开 VIP

**修复：** 事务开头先 `findFirst({ where: { transactionId: session.id }})` 若存在则直接返回；`create` 前先 `user.findUnique({ id: userId })` 验证存在性。

---

### 【CRIT-3】Webhook 签名错误响应泄露签名信息

**文件：** `src/app/api/payment/webhook/route.ts:34-36`

返回体包含预期签名与实际签名前 20 位 —— 构成密码学侧信道。

**修复：** 统一返回 `"Webhook verification failed"`，签名细节只进服务端日志。

---

### 【CRIT-4】Payment Callback 无时间戳签名，可重放

**文件：** `src/app/api/payment/callback/route.ts:17`

`verifyCallbackSignature` 只校验 HMAC，body 无时间戳字段，攻击者捕获一次合法 callback 可无限重放激活订阅。

**修复：** body 中加 `timestamp` 并参与签名，服务端拒绝 ±5 分钟之外的请求。

---

### 【CRIT-5】配额扣减存在 TOCTOU 竞态

**文件：** `src/lib/quota.ts:53-82`；`src/app/api/user/use-quota/route.ts`（整体）

`checkBaziQuota`（读） + `upsert increment`（写）非原子，并发请求可同时通过 check 然后各自 +1。

**修复：** 改为单次原子更新：

```typescript
const updated = await prisma.usageQuota.updateMany({
  where: { userId, date: today, baziAiCount: { lt: limit } },
  data: { baziAiCount: { increment: 1 } },
});
if (updated.count === 0) return false;
```

---

### 【CRIT-6】API 降级结果污染缓存，永久失真

**文件：** `src/lib/utils/api-wrapper.ts:14-29` + `src/lib/ai/client.ts:105-114`

`callExternalAPI` 在失败时仍返回 `{ success: true, data: fallback }`，调用方把降级文本写入 Redis（无 TTL），同 key 后续永远拿不到真实 AI 分析。

**修复：** 返回 `{ success, fromFallback, data }`，只在 `!fromFallback` 时 `setCache`。

---

### 【CRIT-7】CI 构建执行 `prisma db push --accept-data-loss`

**文件：** `scripts/run-build.js:36`

每次部署可能自动删列/截断数据，无回滚。

**修复：** 改为 `prisma migrate deploy`（基于 migration 文件）；移除 `--accept-data-loss`；迁移与构建分离。

---

### 【CRIT-8】CSP 含 `unsafe-inline` + `unsafe-eval`

**文件：** `next.config.ts:18`

完全抵消 CSP 对 XSS 的防护。

**修复：** 使用 nonce-based CSP（`middleware.ts` 生成 nonce 注入）；生产移除 `unsafe-eval`。

---

### 【CRIT-9】根目录调试脚本含真实用户邮箱且修改生产数据

**文件：** `check-db.js`、`check-orders.js`、`fix-vip.js`

硬编码真实邮箱；`fix-vip.js` 直接 `prisma.user.update` 无交互确认；`check-db.js:1` 用 `.env.test`（实际含生产密钥）。

**修复：** `git rm` 全部删除；若需保留则参数化并加确认交互，放入 `scripts/tmp/` 且 gitignore。

---

### 【CRIT-10】`dangerouslySetInnerHTML` + 字符串模板拼接

**文件：** `src/app/knowledge/[slug]/KnowledgeDetailClient.tsx:102, 112-115`

第 112 行把 `item` 直接拼入 HTML 模板；若数据源后续接 CMS/用户输入即 XSS。

**修复：** 引入 DOMPurify 清洗 `section.content`；第 112 行改用纯 JSX 渲染。

---

### 【CRIT-11】前端客户端组件硬编码管理员邮箱

**文件：** `src/app/admin/page.tsx:38`
```typescript
const ADMIN_EMAILS = ['feng5166@gmail.com', 'feng.5166@163.com'];
```
打包进 JS bundle，任何访客 DevTools 可见。

**修复：** 判断移至服务端，客户端仅接收 `isAdmin: boolean`。

---

### 【CRIT-12】项目缺少 `error.tsx` 与 `not-found.tsx`

**文件：** `src/app/`（缺失）

任何未捕获渲染错误显示白屏；404 为默认 Next.js 页。

**修复：** 新增 `src/app/error.tsx`（Client 组件，含 `error`/`reset` props）和 `src/app/not-found.tsx`。

---

## 🟡 二、中等问题（42个）

### 鉴权与输入校验

| 编号 | 文件:行 | 问题 | 修复建议 |
|---|---|---|---|
| M-1 | `src/app/api/auth/register/route.ts:69-71` + `check-email/route.ts:48` | 返回 409/`{exists}` 允许邮箱枚举 | 接入 Cloudflare Turnstile 或合并为登录/注册统一接口 |
| M-2 | `src/app/api/user/birth-info/route.ts:28-36` | POST 无任何 zod 校验（`birthDate`/`birthHour`/`gender`/`name`） | 加 zod schema 校验格式与枚举 |
| M-3 | `src/app/api/bazi/marriage/route.ts:305-307` | `sanitize` 只处理 name，日期/时辰未校验 | 与 `bazi/route.ts` 统一 zod 格式 |
| M-4 | `src/app/api/huangli/ask/route.ts:22-44` | user question 直拼 prompt，存在 prompt 注入 + 超长 token 消耗 | 限长 200 字；过滤注入词；将 system 指令置于 `role: system` |
| M-5 | `src/app/api/ziwei/route.ts:68, 114-117` | `longitude` 无范围校验；`err.message` 直回前端可泄露路径 | 限 ±180；异常统一返回通用错误 |
| M-6 | `src/app/api/admin/fix-vip/route.ts:95` + `check-user/route.ts:70` | `error.any` → `error.message` 回传，暴露 Prisma 内部细节 | 仅入日志，前端返回业务码 |

### 支付与订阅

| 编号 | 文件:行 | 问题 | 修复建议 |
|---|---|---|---|
| M-7 | `src/app/api/admin/create-subscription/route.ts:62-69` | 管理员手动创建时未将旧 active 置为 expired，与 webhook 逻辑不一致 | 先置旧订阅为 expired 再创建 |
| M-8 | `src/app/api/payment/create/route.ts:50` | `baseUrl` 硬编码 `https://www.cyberfate.me` | 改为 `process.env.NEXTAUTH_URL \|\| 默认` |
| M-9 | `src/app/api/payment/create/route.ts:30` | `outTradeNo = Date.now()+Math.random()` 非密码学安全 | `crypto.randomUUID()` |
| M-10 | `src/lib/subscription.ts:6-13` vs `src/lib/quota.ts:15-20` | 一处 `gt: Date`、一处 `gte: Date`，VIP 判断到期时刻不一致 | 统一调用 `isVip`，单一数据源 |
| M-11 | `src/lib/stripe.ts` + `src/lib/stripe-direct.ts` | 两套 Stripe 客户端并存；`stripe-direct.ts:242` 还 export 底层 `stripeRequest` | 保留 SDK 版本；删除 `stripeRequest` export |
| M-12 | `src/app/api/payment/webhook/route.ts:4` | 自实现签名校验而非 `stripe.webhooks.constructEvent` | 改用官方 SDK |

### 基础设施/性能

| 编号 | 文件:行 | 问题 | 修复建议 |
|---|---|---|---|
| M-13 | `src/lib/password-reset.ts:10-23`、`register/route.ts:6`、`check-email/route.ts:5` | 内存 Map 速率限制在 Serverless 多实例下失效，且永不清理造成内存泄漏 | 迁移到 Redis (`INCR`+`EXPIRE`) |
| M-14 | `src/lib/auth.ts:125-143` | session 回调每次请求 2 次 DB 查询 | 把 `isSubscribed`/`avatar` 缓存进 JWT |
| M-15 | `src/lib/cache/redis.ts:51-59` | Redis Proxy `any` 链吞噬运行时错误；顶部和 `getRedis` 两套初始化不同步 | 合并为 `createRedis()`，对外 `Redis \| null` 显式处理 |
| M-16 | `src/lib/ai/cache.ts:59-62` | `clearCache` 空实现但签名承诺清缓存 | 要么实现 SCAN+DEL，要么删除导出 |
| M-17 | `src/lib/ai/client.ts:65-69` | 八字缓存 key 不含 `name`，同生日不同人共享结果，姓名错乱 | name 纳入 key，或从 prompt 中去掉 name |
| M-18 | `prisma/schema.prisma:121-161` | Subscription/Order 缺 `@@index([userId, status])`、`@@index([userId])`；TarotReading `userId` 无索引 | 补索引 |
| M-19 | `prisma/schema.prisma:91-95, 28-31` | enum `yearly` 与业务"终身卡"脱节；`birthHour`/`gender` 用 String 而非 Int/enum | migration 重命名 enum；类型改 Int?/enum |
| M-20 | 缺失 `src/middleware.ts` | 无统一认证层、无法注入 CSP nonce、无 Edge 限流 | 新增 middleware 集中处理 |

### 前端

| 编号 | 文件:行 | 问题 | 修复建议 |
|---|---|---|---|
| M-21 | `src/app/profile/ProfileClient.tsx:124-128` | 前端展示 Stripe `cus_*` 客户 ID | 移除展示，仅保留 admin 内部可见 |
| M-22 | `src/app/liuyao/page.tsx`（1299 行全页 `'use client'`）、`meihua/tarot/bazi/marriage/daily` 同类 | 大量静态 FAQ/常量被迫客户端渲染 | Server Shell + Client Island（`bazi/page.tsx` 已是正确示例） |
| M-23 | `src/app/knowledge/[slug]/KnowledgeDetailClient.tsx:1` | 整文件 `'use client'` 仅为一个 scrollTo | 拆出 `<TocButton>` 小岛，主体回 SSR |
| M-24 | `src/app/daily/page.tsx:229-232` | 出生日期仅能选"日"（1-31），无年月，表单不可用 | 替换为已有 `DatePicker` 组件 |
| M-25 | `src/app/daily/page.tsx:199` | `dayOffset` 状态声明晚于 `handleSubmit`；日期切换与提交逻辑脱节 | 状态上移，提交按 `dayOffset` 计算目标日 |
| M-26 | `src/app/profile/page.tsx` + `ProfileClient.tsx` | `useSearchParams` 未被 `Suspense` 包裹 | 父层加 `<Suspense>` |
| M-27 | `src/app/tarot/page.tsx:126, 181` | 未处理 `status === 'loading'`，已登录用户可能被误跳登录页 | 读取 `status`，loading 时不做跳转 |
| M-28 | `ziwei/meihua/liuyao/tarot/huangli/marriage/history/admin/pricing` pages | 大量核心页缺 `metadata` 导出 | 各页 export metadata（template 已在 root） |
| M-29 | `Header.tsx:83,105,153` | Logo/头像 alt 空、下拉缺 `aria-haspopup`/`aria-expanded` | 加 `aria-label` 与 sr-only 标签 |
| M-30 | 多处 icon-only 按钮（`EmailLoginForm.tsx:133` 等） | 缺 `aria-label`，装饰 icon 缺 `aria-hidden` | 补齐 |
| M-31 | 多处 `<img>`（`Header.tsx:83,153`、`Footer.tsx:76`、`Sidebar.tsx:349`、`ProfileClient.tsx:102`、`PaymentModal.tsx:220`） | 未用 `next/image`，缺懒加载/WebP/CLS 预占位 | 改 `<Image>` + `images.remotePatterns` 注册外部域名 |
| M-32 | `src/app/payment/success/page.tsx:25-30` | 暴露 `cyberfate.vercel.app` 内部域名跳转；遗留 `console.log` | 改用 `next.config.redirects`；清理 log |
| M-33 | `src/app/bazi/marriage/page.tsx:39`、`admin/page.tsx:300,392` | result 类型为 `any` | 定义接口类型 |
| M-34 | `shichenOptions` 在 `bazi/page.tsx:87-102`、`daily/page.tsx:17-32`、`marriage/page.tsx:12-27` | 逐字重复定义 | 提取到 `src/lib/constants/shichen.ts` |
| M-35 | 多页 FAQ 手风琴 + 太极 SVG 背景重复 | 抽 `<Faq>`、`<TaijiBg>` 统一组件 |

### 算法/库

| 编号 | 文件:行 | 问题 | 修复建议 |
|---|---|---|---|
| M-36 | `src/lib/bazi/calculator.ts:214-215` | 起运年龄用 `3 + ((month+day) % 3)`，并非节气数日的正确算法 | UI 明确"估算"，或改为 lunar-javascript 节气 API |
| M-37 | `src/lib/utils/dayun.ts:18-22` | `(year-4) % 10` 对早期年份产生负索引 → undefined | `((year-4)%10+10)%10` 或统一用 lunar-javascript |
| M-38 | `src/lib/ziwei/calculator.ts:67-72` | 真太阳时修正用 `Math.round(offset/120)` 是粗近似 | UI 标注精度局限；或改为分钟级判断 |
| M-39 | `src/lib/huangli/calculator.ts:2` | 单独使用 CJS `require` 混入 ESM | 改 ESM import 统一风格 |
| M-40 | `src/lib/ai/cache.ts:11,22,42` | `any` 滥用，缓存完全丧失类型安全 | 改泛型 `<T>` |
| M-41 | `src/lib/password-reset.ts:109-112`、`forgot-password/route.ts:41` | 错误日志/`detail` 字段含邮箱明文 | 改 `sha256(email).slice(0,8)` 脱敏 |
| M-42 | `src/app/api/debug-feishu/route.ts:46-47` | 响应中包含飞书 `tenant_access_token` 完整值 | 脱敏只返回长度/code |

---

## 🟢 三、建议改进（22个）

| 编号 | 文件:行 | 问题 | 修复建议 |
|---|---|---|---|
| L-1 | `package.json:31` | `prisma` 应在 `devDependencies` | 移动 |
| L-2 | `package.json:13` | `@types/bcryptjs` 应在 `devDependencies` | 移动 |
| L-3 | `tailwind.config.ts:1-100` + `package.json:35` | v3 配置文件与 Tailwind v4 不兼容；`important:'#__next'` 是 Pages Router 遗留 | 迁移到 `@theme`，或锁 tailwind v3 |
| L-4 | `tsconfig.json` | 未开 `noUncheckedIndexedAccess` | 打开 |
| L-5 | `eslint.config.mjs` | 缺 `eslint-plugin-security`/`no-secrets` | 加插件 + CI 检测 |
| L-6 | `vercel.json` | AI 接口无 `maxDuration`，流式响应可能超时 | 配置 bazi/tarot `maxDuration: 60` |
| L-7 | `vercel.json:3-7` | `env` 字段写入版本控制，易被误用 | 迁移到 Vercel 环境变量面板 |
| L-8 | `.env.example:6` | 暴露第三方代理 `hk-api.gptbest.vip` | 改占位符 |
| L-9 | `package.json:5-11` | 缺 `type-check`/`test:e2e` script | 补齐 |
| L-10 | `scripts/run-build.js:5-9` | `DATABASE_URL` 系列变量命名混乱（4 个同值变量） | 统一为 `DATABASE_URL` |
| L-11 | `scripts/init-db.ts:14-16` | 注释误导（Prisma 不会首次查询自动建表） | 补 migrate deploy 或删除 |
| L-12 | `fix-vip.js:7,19-22` | 使用已废弃字段 `user.payments/isPremium/premiumExpiry` | 配合 CRIT-9 一并删除 |
| L-13 | `src/lib/db.ts:8` | 三个 DB URL fallback 静默回退 | 启动时打印使用的变量名并在全空时抛错 |
| L-14 | `src/lib/email-templates/password-reset.ts:60` | resetUrl 未 encodeURI | 加编码 |
| L-15 | `src/lib/wechat-provider.ts:24` + `db.ts:9` | 开发模式可能 log access_token | 移除 `query` 日志级别 |
| L-16 | `src/lib/pricing-config.ts` | lifetime `duration: 36500` 幻数 | 用常量或 DB `null` 表示无限期 |
| L-17 | `src/lib/bazi/geju.ts:56-62` + `helpers.ts:18-28` | `WUXING_*` 与 `*_MAP` 重复定义 | 抽到 `bazi/constants.ts` |
| L-18 | `src/app/api/auth/register/route.ts:74`、`password-reset.ts:14` | bcrypt cost=10 | 提至 12，抽常量 `AUTH_BCRYPT_ROUNDS` |
| L-19 | `src/app/api/huangli/route.ts:9` | 日期只验证年份，未验证月/日合法性 | 用完整正则 `/^\d{4}-(0[1-9]\|1[0-2])-(0[1-9]\|[12]\d\|3[01])$/` |
| L-20 | `src/app/api/init-db/route.ts:24` | 名字暗示"初始化"但只做 `SELECT 1`，返回原始查询结果 | 重命名 `/api/admin/health-db`，仅返回 `{connected:true}` |
| L-21 | `src/app/pricing/PricingClient.tsx:57,64`、`history/page.tsx:68` | `alert()`/`window.confirm` 体验差 | 用行内 UI |
| L-22 | `src/app/daily/page.tsx:57-102` | `RingProgress`/`ProgressBar` 混在 1000+ 行业务中 | 抽到 `src/components/ui/` |

---

## 四、项目亮点 ✅

- Stripe Webhook 签名手动验证 + `timingSafeEqual`，安全意识强
- 密码重置 token 存 SHA-256 哈希，使用数据库事务保证原子性
- 八字 API 有服务端金额校验防价格篡改
- AI 全链路有优雅降级 fallback
- Redis 客户端优雅降级，环境变量缺失不阻塞主流程
- Session 回调鉴权架构清晰
- Prisma Schema 设计相对规范

---

## 五、总体评分

| 维度 | 评分 | 说明 |
|---|---|---|
| **安全性** | ⭐☆☆☆☆ | 生产密钥入库是致命问题；webhook 越权/重放、CSP 形同虚设、管理员邮箱前端暴露 |
| **架构合理性** | ⭐⭐⭐☆☆ | 分层清晰，但 Client Component 滥用、缺 middleware、两套 Stripe 客户端并存 |
| **代码质量** | ⭐⭐⭐☆☆ | TS strict 已开，命名规范；但 `any` 泄漏、大量重复、根目录散落调试脚本 |
| **错误处理** | ⭐⭐⭐☆☆ | try/catch 覆盖率尚可，但 `error.message` 常直回前端；降级设计污染缓存 |
| **性能** | ⭐⭐⭐☆☆ | Redis 缓存基础到位，但 session N+1、`<img>` 未优化、`use client` 过度 |
| **并发与数据一致性** | ⭐⭐☆☆☆ | 配额 TOCTOU、Webhook 非幂等、VIP `gt` vs `gte` 判断不一致 |
| **依赖与构建** | ⭐⭐☆☆☆ | `--accept-data-loss` 进 CI、Tailwind v4 配置不兼容、依赖分组错位 |
| **可访问性 / SEO** | ⭐⭐⭐☆☆ | 语义基础在，但 ARIA 普遍缺失、核心页缺 metadata |

### 综合评分：⭐⭐☆☆☆ **（2.5 / 5）**

> 代码架构和业务层面体现了相对专业的组织能力，但**安全工程严重不及格**，尤其是密钥泄露和支付流程缺陷属于可被真实利用的生产级漏洞。

---

## 六、修复优先级路线图

### 🚨 今日必须（1 天内）
1. **CRIT-1** 轮换所有泄露密钥并清理 Git 历史
2. **CRIT-9** 删除根目录调试脚本
3. **CRIT-11** 前端 admin 邮箱硬编码移至服务端

### ⚡ 本周内（3 天内）
4. **CRIT-2 / CRIT-3 / CRIT-4** Webhook 幂等 + 重放保护 + 错误泄露
5. **CRIT-5** 配额竞态原子化修复
6. **CRIT-6** 降级结果不再写入缓存
7. **CRIT-7** CI 移除 `--accept-data-loss`
8. **CRIT-12** 补 `error.tsx` / `not-found.tsx`

### 📌 两周内
9. **M-10/11/12** Stripe 双实现收敛 + 官方 SDK 替换自签名
10. **M-13** Redis 速率限制替换内存 Map
11. **M-18/19** Prisma 索引补充 + enum 迁移
12. **M-20** 新增 `middleware.ts`（带 CSP nonce）
13. **CRIT-8** CSP 去 `unsafe-*`
14. **M-22/23** Server/Client 组件拆分 + SSR 重构

### 🛠️ 一个月内
清理剩余中等问题、建立 `eslint-plugin-security` + pre-commit hook + CI 密钥扫描防止复发。

---

_报告生成时间：2026-04-18 12:09 GMT+8_
