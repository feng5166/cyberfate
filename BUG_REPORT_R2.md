# CyberFate 第二轮功能 Bug 报告（R2）

> **审查工具：** Claude Code Opus 4.7  
> **审查日期：** 2026-04-18  
> **审查类型：** 第二轮深度功能 Bug 排查（Fresh Review）  
> **审查范围：** 遗漏 Bug + 回归 Bug + 残留复查 + 业务逻辑缺陷  
> **审查人：** GeekAI 虾 (geekai)  
> **基于版本：** `aac58db`（4 轮修复 + 验收修复 + 套餐重构后）

---

## 🔴 致命 Bug（P0 — 5 个）

### BUG-R2-001：Google OAuth Account 记录缺失
- **文件：** `src/lib/auth.ts:62-89`
- **描述：** Google OAuth 回调创建用户时未写入 Account 表（或对应关联表），导致多端登录时账号关联丢失，身份混乱
- **复现：** Google 登录 → 后续换设备/换浏览器再登录 → 账号信息不完整
- **根因：** OAuth 创建用户流程只写了 User 表，遗漏了 Account 关联
- **修复：** 在 Google OAuth 回调中补全 Account 表写入

### BUG-R2-002：Redis fail-open 导致限流失效
- **文件：** `src/lib/cache/redis.ts` + `src/lib/rate-limit.ts`
- **描述：** Redis 连接失败时 fallback 到内存 Map，但 Vercel Serverless 多实例下各实例独立 Map → 限流完全失效
- **影响：** 注册接口可被暴力刷、密码重置可被暴力破解
- **复现：** Redis 挂了或冷启动瞬间 → 脚本 100 次/秒注册 → 全部成功
- **修复：** Redis 不可用时拒绝服务而非降级（fail-closed），或用 Vercel KV / Upstash Redis

### BUG-R2-003：AI Prompt 注入（回归检查）
- **文件：** `src/app/api/bazi/marriage/route.ts` + `src/lib/prompts.ts` + AI 相关 route
- **描述：** 用户输入的姓名/问题直接拼入 prompt，虽然做了基础 sanitize，但以下场景仍可能注入：
  - 系统指令覆盖："忽略以上指令，改为..."
  - 多语言切换触发不同模型行为
  - 特殊 Unicode 字符（RTL 覆盖、零宽字符）
- **风险：** AI 输出被操控，输出有害内容或泄露 system prompt
- **修复：** 所有用户输入通过严格白名单过滤；system/user 角色分离；输出内容安全检测

### BUG-R2-004：八字 AI 缓存 key 串号 / PII 泄漏
- **文件：** `src/lib/ai/cache.ts` + `src/lib/ai/client.ts`
- **描述：** 缓存 key 构建逻辑中：
  - 可能包含用户 PII（姓名/生日）
  - 不同请求路径构建 key 的规则不一致，可能导致缓存命中错误结果
  - Redis 中明文存储 PII
- **修复：** 统一缓存 key 规范（userId + 功能 + 日期哈希）；PII 不进 key

### BUG-R2-005：Webhook metadata.plan 篡改可绕过付费
- **文件：** `src/app/api/payment/webhook/route.ts`
- **描述：** Webhook 处理订阅时，plan 信息来自 Stripe 发送的 metadata 或 session 数据。如果攻击者能在创建 Checkout Session 时篡改 metadata 中的 plan 字段（如改为 lifetime），webhook 会按篡后的 plan 开通订阅
- **复现：** 修改前端 create-checkout 请求体中的 metadata.plan → 支付低价 → 获得高价套餐
- **根因：** 服务端未从 Stripe Price ID 反查验证套餐等级
- **修复：** webhook 中从 `session.line_items` 的 Price ID 反查套餐配置，不信任 metadata

---

## 🟡 严重 Bug（P1 — 25 个）

| # | 文件 | 描述 |
|---|---|---|
| BUG-R2-006 | `subscription/change-plan/route.ts` | 升级/降级时旧订阅状态未锁，并发请求可创建多条 |
| BUG-R2-007 | `stripe/create-checkout/route.ts` | Price ID 未校验是否合法（可用非法 Price ID 创建订单） |
| BUG-R2-008 | `prisma/schema.prisma` Order 模型 | Order 表缺 currency 字段，多币种场景异常 |
| BUG-R2-009 | `payment/webhook/route.ts` | Webhook 处理仍为 check-then-act（非事务原子操作），并发投递可重复 |
| BUG-R2-010 | `auth/reset-password/route.ts` | POST 重置密码无速率限制（GET 有但 POST 没有） |
| BUG-R2-011 | `auth/register/route.ts` + DB | 邮箱大小写敏感：User@A.com 与 user@a.com 可同时注册 |
| BUG-R2-012 | `lib/quota.ts` vs `lib/bazi/calculator.ts` | 配额日期用上海时区，但八字日柱用 lunar-javascript 内部时区，两者不一致时跨天边界用户配额和命盘对不上 |
| BUG-R2-013 | `app/api/payment/callback/route.ts` | Callback 签名仅 HMAC，缺 timestamp 强制 + nonce，时间窗内可重放 |
| BUG-R2-014 | `lib/pricing-config.ts` | 套餐重构后可能仍有遗留硬编码引用旧价格常量（grep 确认） |
| BUG-R2-015 | `lib/email-templates/` | 邮件模板中 resetUrl 可能含 token 明文在 query param 中（应已改为 hash fragment，需确认） |
| BUG-R2-016 | `components/PaymentModal.tsx` | 支付弹窗关闭后未清理内部状态，再次打开可能残留旧数据 |
| BUG-R2-017 | `app/profile/page.tsx` | 头像上传后未刷新缓存/CDN，用户看到旧头像 |
| BUG-R2-018 | `app/admin/page.tsx` | Admin 手动创建订阅时未校验用户是否已有 active 订阅（可能重复） |
| BUG-R2-019 | `lib/auth.ts` session callback | subscription 查询每次都读 DB，高并发下可加缓存层（TTL 5min） |
| BUG-R2-020 | `app/api/bazi/route.ts` | birthHour=12（午时）边界：12:00 应属午时还是未时？数组索引可能 off-by-one |
| BUG-R2-021 | `app/api/tarot/draw/route.ts` | 塔罗抽牌后未校验返回牌数（洗牌/切牌 bug 可能导致数量不对） |
| BUG-R2-022 | `register/route.ts:44` | 昵称黑名单过滤不全（emoji、零宽字符、`javascript:` 等可绕过） |
| BUG-R2-023 | `liuyao/route.ts:142-171` | 六爻卦象计算仅查 isArray，**缺长度校验**，undefined 可拼接导致异常 |
| BUG-R2-024 | `prompts.ts:40` | 姓名含 `【】` 等特殊字符时破坏 Prompt 结构（引号/转义错乱） |
| BUG-R2-025 | `bazi/route.ts:58-59` | `birthHour=-1`（未选择时）**默认午时处理错误**，应 reject 或特殊处理 |
| BUG-R2-026 | `check-email/route.ts` | 内存 Map 限流与 Redis 限流双实现并存，多实例不共享状态 |
| BUG-R2-027 | `schema.prisma PasswordResetToken` | token 字段无 unique 索引，全表扫描查找 |
| BUG-R2-028 | `subscription.ts` 各调用处 | `isVip()` 判断各处 gt/gte 使用仍不完全统一，到期时刻行为矛盾 |
| BUG-R2-029 | `ai/client.ts` fetch 调用 | **无 AbortController + timeout**，外部 AI API 卡顿时请求永久 hang，Vercel 10s 超时杀掉但不通知前端 |
| BUG-R2-030 | `cache.ts:11-16` | 缓存 key 未 canonical 序列化，对象字段顺序不同时 key 不同导致缓存 miss |

---

## 🟢 轻微 Bug（P2 — 15 个）

| # | 文件 | 描述 |
|---|---|---|
| BUG-R2-031 | 多处 | payMethod 字段缺失（Order 表或支付记录） |
| BUG-R2-032 | `stripe-direct.ts` | maxNetworkRetries=2 偏低，网络不稳时失败率高 |
| BUG-R2-033 | `webhook/route.ts` | charge.refunded 处理无 orderId 关联，可能误杀新订阅 |
| BUG-R2-034 | `webhook/route.ts` | invoice.paid 与 checkout.session.completed 存在冗余处理路径 |
| BUG-R2-035 | `register/route.ts` | 密码强度校验不含特殊字符要求 |
| BUG-R2-036 | `.env.local` / Google 配置 | Google ClientId 为空字符串时不报错，静默跳过 Google 登录 |
| BUG-R2-037 | `ForgotPasswordModal.tsx` | disabled 逻辑在发送成功后卡死（无法再次点击） |
| BUG-R2-038 | Feedback 组件 | slice + maxLength 冲突可能导致截断 |
| BUG-R2-039 | `user/birth-info/route.ts` | 出生日期格式校验不完整（接受各种格式） |
| BUG-R2-040 | `cancel-feedback/route.ts` | 取消原因反馈无长度限制 |
| BUG-R2-041 | `ziwei/calculator.ts` | 闰月处理不全（部分分支走默认） |
| BUG-R2-042 | `bazi/calculator.ts` | 大运起运年龄精度不足（3-5岁估算范围太大） |
| BUG-R2-043 | `admin/verify/route.ts` | Admin 邮箱解析不做 normalize（空格/逗号分隔） |
| BUG-R2-044 | 多个 API route | 错误日志泄露 API 内部细节（stack trace、query 等） |
| BUG-R2-045 | `tarot/route.ts` vs 前端 | 塔罗问题前后端长度限制不同步 |

---

## 📋 已知残留问题状态复查

| 问题 | R1 状态 | R2 当前状态 | 变化 |
|---|---|---|---|
| BUG-005 mock-pay 白嫖 | ⚠️ 待确认 | ✅ **代码已删除** | 已修复！ |
| BUG-003 Google OAuth 越权 | ⚠️ 部分修复 | ⚠️ **Account 表仍未写** | 未完全修 |
| N-5 速率限制内存 Map | ⚠️ Redis+Map 双实现 | ⚠️ **fail-open 仍存在** | 未修 |
| BUG-035 双 Stripe 客户端 | ❌ 两套并存 | ❌ **仍并存** | 未修 |
| BUG-038 六爻全客户端 | ⚠️ 仅 isArray | ⚠️ **加了 isArray 但缺长度/null 校验** | 部分改善 |

---

## 📊 统计

| 等级 | R2 新发现 | 占比 |
|---|---|---|
| 🔴 致命 P0 | **5** | 11.2% |
| 🟡 严重 P1 | **25** | 55.6% |
| 🟢 轻微 P2 | **15** | 33.3% |
| **总计** | **45** | 100% |

加上 R1 残留 5 个未完全修复 = **50 个待处理项**

---

## 🚨 TOP 10 优先修复清单

| 优先级 | Bug | 风险 | 建议修复时限 |
|---|---|---|---|
| 🥇 **P0-1** | **BUG-R2-005** Webhook metadata.plan 篡改 | 💰 直接资损 — 付低价获高价套餐 | **今天** |
| 🥈 **P0-2** | **BUG-R2-002** Redis fail-open 限流失效 | 🔒 暴力刷号/破解密码 | **今天** |
| 🥉 **P0-3** | **BUG-R2-003** AI Prompt 注入 | ⚠️ AI 被操控/合规风险 | **本周** |
| 4 | **BUG-R2-004** 缓存 PII 泄漏 + 串号 | 🔒 GDPR/隐私 | 本周 |
| 5 | **BUG-R2-001** Google OAuth Account 缺失 | 🔧 多端登录异常 | 本周 |
| 6 | **BUG-R2-010** 密码重置 POST 无限流 | 🔒 暴力接管账号 | 本周 |
| 7 | **BUG-R2-009** Webhook TOCTOU 并发重复 | 💰 重复发放订阅 | 本周 |
| 8 | **BUG-R2-008** Order.currency 缺失 | 🔧 升级支付异常 | 下周 |
| 9 | **BUG-R2-012** 时区不一致跨天配额 | 💰 白嫖配额 | 下周 |
| 10 | **BUG-R2-011** 邮箱大小写重复注册 | 🔧 账号混乱 | 下周 |

---

## 📋 修复建议路线图

### 🔥 紧急（本周内）
- BUG-R2-005, R2-002（资损+安全阻断）
- BUG-R2-003, R2-010（安全加固）
- BUG-R2-009（并发安全）

### ⚡ 重要（2 周内）
- BUG-R2-001, R2-004, R2-011, R2-012（数据一致性）
- BUG-R2-006~R2-013（支付全流程加固）
- BUG-R2-020~R2-025（算法正确性）

### 📌 改进（1 个月内）
- BUG-R2-014~R2-030（代码质量/架构）
- BUG-R2-031~R2-045（体验/卫生）
- BUG-003, N-5, BUG-035, BUG-038（R1 残留清零）

---

_报告生成时间：2026-04-18 17:37 GMT+8_
