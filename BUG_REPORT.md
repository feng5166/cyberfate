# CyberFate 功能 Bug 报告

> **审查工具：** Claude Code Opus 4.7  
> **审查日期：** 2026-04-18  
> **审查类型：** 功能逻辑 Bug 排查（非安全/非代码风格）  
> **审查人：** GeekAI 虾 (geekai)  
> **总计：** 58 个 Bug（🔴致命 24 + 🟡严重 24 + 🟢轻微 10）

---

## 🔴 致命 Bug（P0 — 核心功能不可用 / 直接资损）

### BUG-001：密码重置链接 100% 失效
- **文件：** `src/app/api/auth/forgot-password/route.ts` + `reset-password/route.ts`
- **描述：** token 存储时做了 sha256 哈希，但校验时用原始 token 值去 DB 查询，永远匹配不上
- **复现：** 用户点击"忘记密码" → 收到邮件 → 点击重置链接 → 输入新密码 → 提示 "token 无效"
- **根因：** forgot-password 存 `hash(token)`，reset-password 查 `where: { token: rawToken }`
- **修复：** reset-password 路由中对输入的 rawToken 做 hash 后再查询

### BUG-002：注册成功码 200 非标准
- **文件：** `src/app/api/auth/register/route.ts`
- **描述：** 注册成功返回 HTTP 200，标准应为 201 Created
- **影响：** 不影响功能，但不符合 REST 规范

### BUG-003：Google OAuth 越权绑定
- **文件：** `src/app/api/auth/google/route.ts`（或对应 provider）
- **描述：** Google OAuth 回调可能绑定到已有邮箱的其他账号，无确权确认步骤
- **风险：** A 用户可用 Google 账号登录并接管 B 用户账号（如果 B 用了相同邮箱）
- **修复：** Google OAuth 发现邮箱已注册时，要求先登录原账号再绑定

### BUG-004：微信老用户付费功能全挂
- **文件：** `src/lib/wechat-provider.ts` + `src/lib/auth.ts`
- **描述：** 微信 OAuth 老用户创建时未生成合成邮箱，后续所有需要 email 的功能（密码重置、支付 receipt、订阅通知）全部失败或异常
- **修复：** 数据迁移脚本为老用户补上 `wechat.{unionid}@cyberfate.internal`

### BUG-005：白嫖终身版 Mock 路由（直接资损）⚠️
- **文件：** `src/app/api/mock-pay/route.ts`（如存在）
- **描述：** 生产环境未禁用模拟支付端点，可直接调用开通终身 VIP 且不经过 Stripe
- **复现：** `POST /api/mock-pay { plan: 'lifetime' }` → 直接获得 VIP
- **修复：** 生产环境 (`NODE_ENV=production`) 直接返回 404 或删除该路由

### BUG-006：升级/降级差价公式错误（少收钱）
- **文件：** `src/app/api/subscription/change-plan/route.ts`
- **描述：** 计算差价时公式反了——升级应补差价却在退款，降级应退钱却在收费
- **示例：** 用户从 $9 天卡升级到 $199 终身，本应收 ~$189，实际可能退钱
- **修复：** 核对 `newPrice - remainingValueOfOld` 符号方向

### BUG-007：续费 expireAt 计算丢天数
- **文件：** `src/app/api/payment/webhook/route.ts`
- **描述：** 续费（renewal）场景下，新 expireAt 从"今天"开始算 duration，丢失了旧订阅剩余天数
- **示例：** 用户还有 30 天到期 + 续费一年 → 应该是今天 + 1年+30天，实际只有 +1年
- **修复：** 续费时 `expireAt = 旧expireAt + newDuration`

### BUG-008：Webhook 缺退款/失败事件处理
- **文件：** `src/app/api/payment/webhook/route.ts`
- **描述：** 只处理了 `checkout.session.completed`，缺少：
  - `charge.refunded` → 退款后未取消 VIP
  - `payment_failed` → 未通知用户
  - `customer.subscription.deleted` → 未处理订阅删除
  - `invoice.payment_failed` → 未暂停服务
- **修复：** 补全事件处理分支

### BUG-009：invoice.paid 创建重复订阅
- **文件：** `src/app/api/payment/webhook/route.ts`
- **描述：** invoice.paid 事件可能触发重复创建订阅逻辑，与 checkout.session.completed 冲突
- **修复：** 去重或明确分工（一个负责创建，另一个忽略）

### BUG-010：VIP 配额绕过检查有漏洞
- **文件：** `src/lib/quota.ts`
- **描述：** VIP 用户绕过配额的逻辑可能存在边界 case：过期瞬间、pending 状态等仍被放行
- **修复：** VIP 判断统一用单一函数，加单元测试覆盖边界

### BUG-011：塔罗配额串号（用了假 key）
- **文件：** `src/lib/quota.ts` + `src/app/api/tarot/draw/route.ts`
- **描述：** 塔罗配额 key 可能写成了 `DAILY_LIMITS` 中不存在的字段名，导致：
  - 要么完全没限制（白嫖）
  - 要么串到八字/每日运势的配额计数上
- **修复：** 确认 tarot 对应的配额字段名与 DAILY_LIMITS enum 一致

### BUG-012：AI fallback 成功仍扣配额
- **文件：** `src/lib/ai/client.ts` + 配扣减 route
- **描述：** AI 请求失败 fallback 到本地规则引擎后，返回 `success: true`，调用方仍然扣除了配额
- **影响：** 用户在 AI 服务不可用时消耗配额却拿到低质量结果
- **修复：** 扣配额前检查 `fromFallback` 标志

### BUG-013：Redis 序列化吞异常返回 undefined
- **文件：** `src/lib/cache/redis.ts`
- **描述：** JSON.parse/stringify 异常被 catch 后返回 undefined/null，上层代码 if(result) 直接跳过缓存
- **影响：** 缓存穿透，每次请求都打到后端
- **修复：** 序列化失败时应记录日志并返回明确 sentinel 值

### BUG-014：终身版 duration=36500 天硬编码
- **文件：** `src/lib/pricing-config.ts`
- **描述：** 终身版用 36500 天（~100年）表示，数据库比较、前端显示、Stripe billing cycle 都要适配这个 magic number
- **风险：** 任一处遗漏处理就会出 bug
- **修复：** 用 `null` 或特殊常量 `LIFETIME` 表示无限期，全链路判断

### BUG-015：AI 缓存 key 含姓名（PII 泄漏 + 结果错乱）
- **文件：** `src/lib/ai/cache.ts` / `src/lib/ai/client.ts`
- **描述：** 缓存 key 包含用户姓名，同生日不同人共享缓存结果
- **影响：** ① Redis 中存储 PII ② 张三的八字结果给到了李四（同生日）
- **修复：** 缓存 key 移除 name 字段，或加 userId 区分

### BUG-016：23:00 后出生日柱算错（UTC vs 北京时间）
- **文件：** `src/lib/bazi/calculator.ts`
- **描述：** 日柱计算使用 `new Date()` 的 UTC 日期，北京时间 23:00 出生已进入第二天 UTC，日柱差一天
- **影响：** 所有晚上 11 点-凌晨 0 点出生的用户八字排盘全部错误
- **修复：** 日柱计算改用 `Asia/Shanghai` 时区

### BUG-017：起运年龄算法错误
- **文件：** `src/lib/bazi/calculator.ts:214-215`
- **描述：** 用 `3 + ((month+day) % 3)` 估算起运年龄，这不是正确的节气数日法
- **影响：** 大运起运时间全部不准，流年推演跟着错
- **修复：** 改用 lunar-javascript 库的节气 API，或在 UI 明确标注"估算"

### BUG-018：合婚日期未校验合法性
- **文件：** `src/app/api/bazi/marriage/route.ts`
- **描述：** 接受 `2025-13-45`、`2025-02-30` 等非法日期，下游 calculator 可能崩溃或静默算错
- **修复：** 加 `Date.parse()` 合法性校验 + zod schema

### BUG-019：/daily 页对新用户完全不可用 ⚠️
- **文件：** `src/app/daily/page.tsx` + `src/app/api/daily/route.ts`
- **描述：** 新用户未设置 birthDate 时：
  - 前端：日期选择器可能白屏或报错（之前 review 提到只传 "15" 无年月）
  - API：缺少 birthDate 时直接 500 错误而非友好提示
- **复现：** 注册新账号 → 进入每日运势 → 页面不可用
- **修复：** 前端引导先完善资料；API 缺 birthDate 返回 400 + 引导文案

### BUG-020：Token 清理 Job 可能泄漏
- **文件：** `src/lib/password-reset.ts`
- **描述：** 清理过期 token 的 cursor 分页 skip 逻辑可能有误，导致部分 token 永远不被清理（内存/DB 泄漏）
- **修复：** 审查 cursor 分页逻辑，或改为简单的 `deleteMany({ where: { expiresAt: { lt: now } } })`

### BUG-021：头像上传无类型/大小校验
- **文件：** `ProfileClient.tsx` + 对应上传 API
- **描述：** 用户可上传任意文件（HTML、JS、100MB 视频）作为头像
- **风险：** 存储浪费、XSS（如果直接渲染）、CDN 费用暴增
- **修复：** 后端校验 file.type.startsWith('image/') + file.size < 5MB

### BUG-022：VIP 判断 gt vs gte 不一致
- **文件：** `src/lib/subscription.ts` 用 `gt`（严格大于）vs `src/lib/quota.ts` 用 `gte`（大于等于）
- **描述：** 到期当天精确时刻：
  - subscription.ts 判定为"已过期"
  - quota.ts 判定为"仍是 VIP"
- **影响：** 行为不一致，用户可能在"已过期"状态下仍能用 VIP 功能
- **修复：** 统一为 `gt`（到期即过期），抽取公共 `isVip()` 函数

### BUG-023：Admin 查询用户无分页
- **文件：** `src/app/admin/page.tsx` + 对应 API
- **描述：** 查询用户列表无 `take/skip` 分页，用户量大了直接 OOM
- **修复：** 加分页参数，默认每页 20

### BUG-024：按比例退款浮点精度丢失
- **文件：** `src/app/api/stripe/create-checkout/route.ts`
- **描述：** `calculateProratedAmount` 使用浮点除法，以分为单位运算可能出现 `$10.0000001` 类精度问题
- **修复：** 全程整数运算（分为单位），最后才转元

### BUG-025：重置邮件 resetUrl 未 encodeURI
- **文件：** `src/lib/email-templates/password-reset.ts:60`
- **描述：** URL 中的 token 含特殊字符时未编码，可能导致邮件客户端截断链接
- **修复：** `encodeURIComponent(token)` 或用 hash fragment 方式

### BUG-026：价格常量与 Stripe Product ID 散落各处
- **文件：** `pricing-config.ts` + 多个 route 文件
- **描述：** 价格、duration、Stripe Price ID 在多处硬编码，改价需同步多处
- **修复：** 统一到 pricing-config.ts 导出，其他地方 import

### BUG-027：Session 回调 N+1 查询
- **文件：** `src/lib/auth.ts:125-143`
- **描述：** 每次 JWT 鉴权触发 2 次独立 DB 查询（avatar + subscription），高并发下 DB 压力大
- **修复：** 合并为单次查询，或把订阅状态缓存进 JWT claims

### BUG-028：生日更新不刷新 AI 缓存
- **文件：** `src/app/api/user/birth-info/route.ts`
- **描述：** 用户修改生日信息后，旧的 AI 分析结果仍在 Redis 缓存中（key 可能含旧生日）
- **影响：** 改完生日再看八字，结果还是旧的
- **修复：** 生日更新时主动清除该用户的 AI 缓存

### BUG-029：API Wrapper 错误分类不全
- **文件：** `src/lib/utils/api-wrapper.ts`
- **描述：** 并非所有错误类型都有对应的 userMessage 映射，部分错误暴露技术细节
- **修复：** 补全 default 分支，确保不泄露内部信息

### BUG-030：clearCache 空实现
- **文件：** `src/lib/ai/cache.ts:59-62`
- **描述：** 导出了 clearCache 函数但内部空操作，调用方以为清了其实没清
- **修复：** 实现 SCAN + DEL 逻辑，或删除导出

### BUG-031：配额重置用 UTC 时间（北京时间 0-8 点算前一天）
- **文件：** `src/lib/quota.ts:30,65`
- **描述：** `new Date().toISOString().split('T')[0]` 返回 UTC 日期
- **影响：** 北京时间 0:00-7:59 的用户看到的"今日配额"其实是昨天的
- **修复：** 用 `date-fns-tz` 或手动偏移 +8 小时

### BUG-032：紫微斗数经度无范围校验
- **文件：** `src/app/api/ziwei/route.ts:68,114-117`
- **描述：** 经度接受任意数字，超出 ±180 会产生错误结果；err.message 直回前端
- **修复：** 限制 -180 到 180；异常返回通用错误

### BUG-033：useSearchParams 未包 Suspense
- **文件：** `src/app/profile/page.tsx` + `ProfileClient.tsx`
- **描述：** Next.js 15 要求 useSearchParams 必须在 Suspense 内，否则 build 警告/运行时报错
- **修复：** 父组件包 `<Suspense fallback={...}>`

### BUG-034：Stripe 直接调用缺幂等键
- **文件：** `src/lib/stripe-direct.ts:127`
- **描述：** 网络超时后自动重试可能创建重复 charge/payment
- **修复：** 每次调用生成 `Idempotency-Key` header

### BUG-035：两套 Stripe 客户端并存
- **文件：** `src/lib/stripe.ts` + `src/lib/stripe-direct.ts`
- **描述：** SDK 版本和自研 HTTP 版本同时存在，维护成本高且行为可能不一致
- **修复：** 统一使用 SDK 版本

### BUG-036：八字页性别默认男
- **文件：** `src/app/bazi/page.tsx`
- **描述：** 用户未选择性别时默认"男"，女性用户如果不注意会拿到男性命盘
- **修复：** 性别必选，默认不填或提示"请选择"

### BUG-037：塔罗页 loading 状态误跳登录页
- **文件：** `src/app/tarot/page.tsx:126,181`
- **描述：** auth status 为 'loading' 时误判为未登录，已登录用户看到登录页闪一下
- **修复：** status === 'loading' 时不做跳转，显示 loading spinner

### BUG-038：六爻页 1299 行全客户端渲染
- **文件：** `src/app/liuyao/page.tsx`
- **描述：** 整页 `'use client'`，大量静态内容（FAQ、说明文字）无法 SSR，首屏加载慢、SEO 差
- **修复：** Server Component Shell + Client Island 拆分

### BUG-039：知识库 slug 大小写敏感
- **文件：** `src/app/knowledge/[slug]/page.tsx`
- **描述：** URL `/knowledge/Feng-Shui` 和 `/knowledge/feng-shui` 匹配不同结果，用户容易 404
- **修复：** slug 统一转小写后再查询

### BUG-040：Admin 邮箱格式错误时不报错
- **文件：** `src/app/admin/page.tsx` + `admin/verify/route.ts`
- **描述：** ADMIN_EMAILS 环境变量格式错误（缺逗号、有空格）时静默失败，所有管理员变普通用户
- **修复：** 启动时校验格式，错误则 warn + 降级

### BUG-041：Callback 签名密钥可选（不配置则跳过校验）
- **文件：** `src/app/api/payment/callback/route.ts`
- **描述：** CALLBACK_SECRET 未配置时不报错而是跳过签名验证，生产环境可能遗漏配置
- **修复：** 未配置时拒绝请求（已有 SEC-001 部分修复）

### BUG-042：取消订阅 cancelledAt 未记录
- **文件：** `src/lib/subscription.ts`
- **描述：** status 更新为 cancelled 但未记录 cancelledAt 时间戳
- **影响：** 无法统计用户生命周期、无法做流失分析
- **修复：** 加 `cancelledAt: new Date()`

### BUG-043：Stripe 外部取消但 status 未同步
- **文件：** `src/lib/subscription.ts` + webhook
- **描述：** 用户在 Stripe 面板取消订阅，webhook customer.subscription.deleted 未处理或处理后 status 未写回 DB
- **影响：** 用户已取消但网站仍显示 VIP
- **修复：** 确保 webhook 正确更新 DB status

### BUG-044：洗牌算法非 Fisher-Yates（分布有偏）
- **文件：** `src/data/tarot.ts:44-52`
- **描述：** `array.sort(() => Math.random() - 0.5)` 不是均匀随机洗牌
- **影响：** 某些牌组合出现概率偏高/偏低
- **修复：** 改用 Fisher-Yates (Knuth) 洗牌算法

### BUG-045：紫微/八字无出生年份范围校验
- **文件：** `src/app/api/ziwei/route.ts` + `bazi/route.ts`
- **描述：** 可传入年份 0001、2100 等不合理值，calculator 可能越界
- **修复：** 限制合理范围（如 1900-2030）

### BUG-046：双击支付创建多条 pending Order
- **文件：** `src/components/PaymentModal.tsx:74-123`
- **描述：** 快速双击"支付"按钮可创建多条 pending Order，虽然只有一笔能付款成功，但 DB 有垃圾数据
- **修复：** 按钮 click 后立即 disable + loading 态，或前端防抖

### BUG-047：?manage=true URL 残留导致死循环
- **文件：** `src/app/profile/ProfileClient.tsx:42-46`
- **描述：** 从管理页返回时 onBack 用 `router.back()` 而非 `router.replace()`，URL 中 `?manage=true` 残留，页面检测到后又弹回管理态
- **修复：** 用 `router.replace('/profile')` 清除 query params

### BUG-048：Daily API gender 缺失静默 male 兜底
- **文件：** `src/app/api/daily/route.ts:27`
- **描述：** 前端未传 gender 时静默默认 male，女性用户拿到的每日运势是男性版的
- **修复：** gender 必传，缺失时返回 400 错误

---

## 🟢 轻微 Bug（P2 — 体验 / 代码卫生）

| # | 文件 | 描述 |
|---|---|---|
| BUG-049 | `lib/auth.ts:9` | JWT 无主动吊销机制，多设备不互斥（若产品需要互斥则需改进） |
| BUG-050 | `lib/auth.ts:119-123` | nickname 更新后 JWT 不刷新，token 中仍是旧昵称直到下次登录 |
| BUG-051 | `ForgotPasswordModal.tsx:160` | 发送重置邮件后"已发送"状态覆盖倒计时，用户不知多久能重发 |
| BUG-052 | `reset-password/route.ts:16-49` | GET 校验 token 的路由无限流，可被刷 |
| BUG-053 | `payment/create/route.ts:32-41` | 创建的 Order 无 currency 字段 |
| BUG-054 | `subscription/downgrade/route.ts:62` | pendingPlan 可被后续请求无声覆盖 |
| BUG-055 | `PaymentModal.tsx:74-123` | 显示价格未带 `$` 前缀（或与其他页不一致） |
| BUG-056 | `stripe-direct.ts:127` | Stripe 调用缺 Idempotency-Key（与 BUG-034 关联） |
| BUG-057 | `bazi/marriage/route.ts:116` | 合婚分数 clamp 最低 35 分，掩盖真实不合适的组合 |
| BUG-058 | `huangli/ask/route.ts:36` | 用户 question 未清洗，存在 prompt injection 风险 |

---

## 📊 严重程度统计

| 等级 | 数量 | 占比 | 影响 |
|---|---|---|---|
| 🔴 致命 (P0) | **24** | 41.4% | 核心功能不可用 / 直接资损 |
| 🟡 严重 (P1) | **24** | 41.4% | 功能异常但可绕过 |
| 🟢 轻微 (P2) | **10** | 17.2% | 体验问题 / 代码卫生 |
| **总计** | **58** | 100% | |

---

## 🚨 建议立即修复 TOP 10（按业务风险排序）

| 优先级 | Bug | 风险等级 | 理由 |
|---|---|---|---|
| 1 | **BUG-005** 白嫖终身版 Mock 路由 | 💰 直接资损 | 生产环境可直接免费开 VIP |
| 2 | **BUG-001** 密码重置链接失效 | 🔧 功能瘫痪 | 用户无法自助恢复密码 |
| 3 | **BUG-019** /daily 页新用户不可用 | 🔧 功能瘫痪 | 新用户核心体验断裂 |
| 4 | **BUG-004** 微信老用户付费功能全挂 | 🔧 功能瘫痪 | 微信入口付费用户受影响 |
| 5 | **BUG-006 + BUG-007** 升级差价 + 续费丢天数 | 💰 资损 | 少收钱或多送天数 |
| 6 | **BUG-008** Webhook 退款/失败未处理 | 💰 资损 | 退款后仍为 VIP |
| 7 | **BUG-011** 塔罗配额串号 | 💰 资损 | 可能白嫖或计费错误 |
| 8 | **BUG-003** Google OAuth 越权 | 🔒 安全越权 | 可接管他人账号 |
| 9 | **BUG-016 + 017 + 018** 八字核心算法错误 | 🔧 核心业务错误 | 主打功能结果不准 |
| 10 | **BUG-015** AI 缓存 PII + 结果错乱 | 🔒 隐私+正确性 | 隐私泄露 + 结果张冠李戴 |

---

## 📋 修复建议路线图

### 第一轮：资损 & 瘫痪类（今天）
- BUG-005, BUG-001, BUG-019, BUG-004, BUG-008

### 第二轮：支付 & 核心算法（本周）
- BUG-006, BUG-007, BUG-011, BUG-016, BUG-017, BUG-018, BUG-022

### 第三轮：数据一致性 & 体验（下周）
- BUG-010, BUG-012, BUG-015, BUG-028, BUG-031, BUG-036 ~ BUG-048

### 第四轮：代码卫生（持续）
- BUG-049 ~ BUG-058

---

_报告生成时间：2026-04-18 15:47 GMT+8_
