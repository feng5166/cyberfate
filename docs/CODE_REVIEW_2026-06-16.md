# CyberFate 代码 Review 报告

> Reviewer:Claude(Opus 4.8)· 日期:2026-06-16 · 范围:支付/安全、配额/订阅、AI 集成/输入校验、核心算法/代码质量
> 方法:4 路并行审查 + 对头条问题逐条读码核实。标 ✅核实 的为 reviewer 亲自读码确认。

## 摘要

整体工程质量较高:Stripe Webhook 验签、重置 Token 哈希、服务端定价校验、Admin 鉴权、限流 fail-closed 等都做得规范。但存在 **2 个会直接导致收入损失/越权的问题** 和 **1 个用户每日可见的算法错误**,建议优先修复。

| 级别 | 数量 | 代表问题 |
|------|------|---------|
| 🔴 Critical | 3 | 免费升级套餐、梅花起卦取模错误、多个 AI 接口无配额 |
| 🟠 High | 6 | 配额竞态、pendingPlan 永不生效、时区不一致、流式泄漏、prompt 注入 |
| 🟡 Medium | 8 | 退款不撤权、proration 数学、PrismaClient 滥用等 |
| 🟢 Low | 多项 | 日志泄漏、中间件 geo 失效、CSP 宽松等 |

---

## 🔴 Critical

### C1 ✅核实 · 升级套餐零支付即生效(越权 / 收入损失)
`src/app/api/subscription/upgrade/route.ts:56-81`
注释明写 `// MVP Mock: 直接完成升级，跳过真实支付`。任意持有 `daily`($9.99)订阅的登录用户 POST `{new_plan:'lifetime'}`,直接写入 `status:'paid'` 订单并把订阅升级到 lifetime($199),**实际未收款**。这是直接的付费越权。
**修复**:升级走 Stripe Checkout(项目已有 `stripe/create-checkout`),仅在 `checkout.session.completed` 后授予;删除/禁用该 Mock 路由,或 `NODE_ENV !== 'production'` 门控。
> 注:`subscription/change-plan` 是另一套"走 Stripe"的升级实现,两套并存且 proration 算法不同(见 H2)。应二选一。

### C2 ✅核实 · 梅花易数起卦取模 off-by-one(用户每日可见的算法错误)
`src/app/api/meihua/draw/route.ts:66-68, 74-76`
`BAGUA` 数组为先天八卦序(index0=乾数1 … index7=坤数8),但代码用 `positiveMod(num, 8)` 直接作下标:数字 1→兑(应乾)、数字 8→乾(应坤),**每个卦都错一位**,8 的倍数尤其错。动爻 `positiveMod(sum,6)+1` 同样整体偏移(余 0 应为上爻第 6,代码给第 1)。且与本项目 UI 文案"余 8 得上卦"自相矛盾。
**修复**:下标用 `positiveMod(num - 1, 8)`;动爻用 `sum % 6 === 0 ? 6 : sum % 6`。本卦/变卦/动爻三者全部受影响。
> 根因(M5):梅花重复实现了 `src/lib/liuyao/data.ts` 已有的八卦/线条逻辑,复制后漂移出 bug。应复用 liuyao 模块。

### C3 · 多个 AI 接口完全无配额 / 无 VIP 门(成本与滥用)
`src/app/api/liuyao/route.ts:146,234`、`src/app/api/meihua/decide/route.ts:104,130`、`src/app/api/daily/route.ts:81,121`
六个 AI 模块中,bazi/tarot 有配额、chat/marriage-qa/fortune-qa 限 VIP、music-oracle 限 3/日,但 **六爻、梅花决策、每日运势** 仅有粗粒度 IP/用户限流,等于免费无限调用付费大模型。
**修复**:按 bazi/tarot 的原子 `UsageQuota` 模式给这三个加每日计数或 VIP 门。

---

## 🟠 High

### H1 ✅核实(逻辑) · `pendingPlan`(降级/改套餐)写入后永不被应用
`src/app/api/subscription/downgrade/route.ts:68-74`、`change-plan/route.ts:64-70` 写入 `pendingPlan`/`pendingPlanDate`,但全仓无任何 cron/webhook/续费逻辑读取并在 `expireAt` 时落地。结果:**每一次降级都静默失效**,用户永久保留原(更高)套餐。
**修复**:增加到期任务,当 `now >= pendingPlanDate` 时套用 `pendingPlan` 并清空挂起字段。

### H2 · bazi 配额走 peek-then-deduct,存在竞态;游客几乎不受限
`src/app/api/bazi/route.ts:81,160`(`peekBaziQuota` 读 + `deductBaziQuota` 无条件自增)。`src/lib/quota.ts:40` 已提供正确的原子 `checkBaziQuota`(`updateMany ... { lt: limit }`),但热路径未用。两个并发请求都能过 peek → 都跑 AI → 都自增,免费用户拿到 2+ 次。游客(无 session)跳过配额,仅 IP 限流。
**修复**:AI 调用前用原子 `checkBaziQuota`,失败回退时再决定是否退还。

### H3 · 三套 `isVip` + 配额日期 UTC/北京时间不一致
`src/lib/subscription.ts:7`(canonical,30s 缓存)vs `tarot/draw`、`music-oracle` 各自 `findFirst` 重复实现。更关键:`subscription.ts:40 checkQuota` 用 `toISOString().slice(0,10)`(**UTC**),而 `quota.ts:6`/tarot/detail-analysis 用北京时间(+8h)。北京 00:00–07:59 两套接口对"今天"取不同日期行,用户可在不同 key 上各刷一次配额。
**修复**:统一一个北京时间日期 helper + 一个 `isVip`。

### H4 · 流式接口在客户端断连时泄漏上游 AI 连接(烧 token)
`daily/detail-analysis/route.ts:86`、`bazi/chat/route.ts:77`、`liuyao/qa`、`bazi/marriage/qa`、`daily/fortune-qa`、`huangli/ask`、`meihua/qa`——上游 fetch 均未传 `AbortController.signal`,浏览器断连后 `reader.read()` 继续循环、上游 socket 不关,付费 token 跑到结束。`detail-analysis` 流式路径还无上游超时。
**修复**:建 `AbortController`,上游 fetch 传 `signal`,`req.signal` abort 时 `ac.abort()`,`ReadableStream.cancel` 里 `reader.cancel()`,并加 wall-clock 超时。

### H5 · `bazi/chat` 把未校验的 `baziData` 直接拼进 system prompt(prompt 注入 + 成本)
`src/app/api/bazi/chat/route.ts:50,67` 将客户端 `baziData` 原样 `JSON.stringify` 进系统提示词,无 schema、无长度上限。可注入指令、可超长撑爆上下文。
**修复**:zod 校验 `baziData` 结构并限长,或服务端依存储的出生信息重算(如 `detail-analysis` 已做)。

### H6 · 微信登录 `prisma.user.create` 注入 provider 的 `user.id` 且不写 Account
`src/lib/auth.ts:132-165`、`src/lib/wechat-provider.ts:26-33` 用 `id: user.id`(= openid)建用户,与 Google 路径不一致(不写 `Account` 行,token 刷新/解绑失管);openid 主键碰撞会抛错。
**修复**:让 DB 生成 id,按 `wechatOpenId/UnionId` 查/关联,补 `Account` 行。

---

## 🟡 Medium

| ID | 位置 | 问题 | 修复 |
|----|------|------|------|
| M1 | `payment/webhook:283-294` | 直付分支按 `amount_total` 精确匹配反推套餐;`create-checkout` 升级用 prorated 金额 + 无 orderId,几乎永不等于配置价 → **用户付了款 webhook 却拒绝**(付钱无果) | 信任服务端写入的 `metadata.plan`,勿用金额反推 |
| M2 | `payment/webhook:157-183` | `charge.refunded` 依赖 `charge.metadata.orderId`,但 metadata 在 session/payment_intent 上、Stripe 不会自动拷到 charge → 退款后**仍保留 VIP** | 用 `charge.payment_intent` 匹配 `Order.transactionId` 撤权 |
| M3 | `payment/callback.ts`(整文件) | 仅靠 HMAC(对称密钥)即可标记任意订单已付并发 VIP;无真实 PSP 在其后(Stripe 走 webhook),`addDays(new Date())` 忽略剩余时长。密钥泄漏/弱即可伪造 | 若生产未用则删除;保留则 `NODE_ENV` 门控 |
| M4 | `subscription/change-plan:45-48`、`upgrade:50` | proration 比例未 clamp:`daily`(totalDays=1)用 `Math.ceil` 余数 → 比例可 >1 过额抵扣 | clamp `remainingDays∈[0,totalDays]`、比例 ≤1 |
| M5 | `music-oracle/route.ts:118,269` 等 | 每请求 `new PrismaClient()` + `$disconnect()`,高并发耗尽连接 | 复用 `@/lib/db` 单例 |
| M6 | `stripe/create-*`、`payment/create:49` | Stripe customer 仅按 email 取 `[0]`,同邮箱多 customer 会指错账单门户 | 在 User 上存 `stripeCustomerId` |
| M7 | `detail-analysis:150-214` | 主流式中途失败后,fallback 不重置 `fullContent`,客户端收到 DeepSeek 残段 + Claude 全文拼接 | fallback 前 `fullContent=''`,仅在主路径无输出时回退 |
| M8 | `subscription/current:41` | `currency:'CNY'` 硬编码,但定价配置是 USD,展示错误 | 与 `PRICING_CONFIG` 对齐 |

---

## 🟢 Low(精选)

- **L1 时区面更广**:`music-oracle/wuxing-music-map.ts:94`、`daily-music/route.ts:20`(Redis 缓存键 + TTL)、`huangli/route.ts:6`、`bazi/calculator.ts:279,345`(大运年龄)用服务器本地时间,Vercel UTC 下北京 0-8 点会差一天。统一北京时间 helper。
- **L2 middleware geo 失效**:`middleware.ts:28` 用已移除的 `request.geo`,`country` 恒空 → 区域路由是死逻辑,却给每个请求加 rewrite 开销。改用 `x-vercel-ip-country` 头或删除。
- **L3 生产日志噪声/泄漏**:`music-oracle/generate.ts`、`ai/cache.ts`、`ai/client.ts` 多处 `console.log` 打印缓存键/AI 响应前缀,每请求都跑。加 debug flag。
- **L4 CSP 宽松**:`next.config.ts:72` `script-src` 含 `'unsafe-eval'` + `'unsafe-inline'`,削弱 XSS 防护。核实是否 PostHog 真需 eval,考虑 nonce。
- **L5 circuit breaker 计数非原子**:`ai/circuitBreaker.ts:43-66` read-modify-write 无 `incr`,并发下低计。best-effort 可接受。
- **L6 缓存读不校验**:`ai/client.ts:128,223` 直接 `as` 断言 Redis 值,schema 漂移/坏写会被当命中。加 validator。

---

## ✅ 做得好的地方(平衡视角)

- **Webhook 验签正确**:`${timestamp}.${payload}` HMAC + `timingSafeEqual` + v1 scheme + 时间容差,先 `req.text()` 取原始 body。
- **幂等**:`Order.transactionId @unique` + P2002 处理 + 事务内去重。
- **服务端定价**:`payment/create`、`create-checkout` 从不信任客户端金额,均取 `PRICING_CONFIG`。
- **Admin 鉴权**:`fix-vip`/`create-subscription`/`users`/`stats` 等均 `requireAdmin`,无未授权 admin 接口。
- **密码重置**:Token sha256 存储、15 分钟过期、事务内单次使用、限流,`passwordChangedAt` 失效旧 JWT。
- **VIP 缓存**:`Map<userId,...>` 正确按用户键、30s TTL、`expireAt` UTC 瞬时比较无时区 bug;订阅变更不修改用户态 → 无跨用户泄漏。
- **AI 解析健壮**:正则提取 JSON + 全字段 `buildFallback*` 兜底 + 长度/类型 clamp,模型坏 JSON 不会 500。
- **缓存键无 PII**:bazi 键对出生信息 sha256;daily 键为 `dayMaster:dayun:liunian:date` 派生数据,跨用户共享合理、**无泄漏**。
- **核心算法**:ziwei 一致用 `((x%n)+n)%n` 正取模 + 闰月/时辰边界守卫;bazi 纳音/十神/格局无除零、`未知` 优雅降级;精确时辰路径正确委托 lunar-javascript 处理早晚子时。
- **限流 fail-closed**;**订阅变更均按 `session.user.id` 限定,无 IDOR**。

---

## 修复优先级建议

1. **立刻**:C1(免费升级)、C2(梅花取模)、C3(无配额 AI)、M1/M2(付款无果 / 退款不撤权)——直接影响收入与用户可见正确性。
2. **本迭代**:H1(pendingPlan)、H2(配额竞态)、H3(时区/isVip 统一)、H4(流式泄漏)、H5(prompt 注入)。
3. **随后**:M3–M8、L1 时区收口、L2 middleware。
4. **架构**:统一"AI 调用计量"、统一北京时间 helper、梅花复用 liuyao 模块——可一次性消掉 C2/C3/H3/M5/L1 多个同源问题。

---

## 修复进展(2026-06-17 复核)

复核当前代码,review 系列绝大多数已修复(上游维护者按本报告编号逐条修复,代码内可见 `H1`/`H2`/`H5`/`BUG-007/008` 等标注):

| 编号 | 状态 | 说明 |
|------|------|------|
| C1 免费升级 | ✅ 上游已修 | `subscription/upgrade` mock 路由已删除,全仓无"跳过真实支付" |
| C2 梅花取模 | ✅ 已修(本会话) | 抽到 `lib/meihua/draw` + 修复 + 19 回归用例 |
| C3 无配额 AI | ✅ 上游已修 | liuyao/meihua-decide/daily 均接入原子 `checkXxxQuota`(免费 3/天、VIP 不限、回退退还) |
| H1 pendingPlan | ✅ 上游已修 | `subscription/current` 到期落地 pendingPlan |
| H2 bazi 配额竞态 | ✅ 上游已修 | 改用原子 `checkBaziQuota`(注释标 H2) |
| H4 流式断连泄漏 | ✅ 上游已修 | 抽出 `attachClientAbort(req)`,各流式路由接 signal/cancel/release |
| H5 baziData 注入 | ✅ 上游已修 | bazi/chat 加 zod `baziDataSchema` 限字段+限长 |
| M1 webhook 按金额反推 | ✅ 上游已修 | 改为信任服务端 `metadata.plan` |
| M2 退款不撤权 | ✅ 上游已修 | 改用 `charge.payment_intent` 反查 `Order.transactionId`(BUG-008) |
| M5 PrismaClient/请求 | ✅ 上游已修 | `new PrismaClient` 仅存于 `lib/db.ts` 单例 |
| L2 middleware geo 失效 | ✅ 已修(本会话) | 删除死代码 middleware.ts(`request.geo` 已废弃,响应头无人消费,单区域部署使其无意义) |
| T12 geju 用神/忌神 | ✅ 核查非 bug | "克泄耗"含耗(财=我克),代码取财作代表项合法;测试改为断言正确行为 |

剩余未单独处理:H3(已查 `checkQuota` 现用北京时间,无不一致)、H6(微信登录)、M3/M4/M6/M8、L 系列若干——多为低风险或需产品决策,留待后续。

_Code review by Claude · 2026-06-16(修复进展 2026-06-17 追加)_
