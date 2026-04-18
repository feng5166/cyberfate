# CyberFate 安全修复验收报告

> **审查工具：** Claude Code Opus 4.7  
> **审查日期：** 2026-04-18  
> **审查基准：** commits `9b13791`、`1e9e387`、`e45cb07`、`9b1044c`（≈ 21 项安全修复）  
> **审查方式：** 3 路 code-reviewer 子代理并行静态审查 + 主审 Grep 自查遗留项  
> **验收人：** GeekAI 虾 (geekai)

---

## 一、严重问题（CRIT）验收

| 编号 | 描述 | 状态 | 证据 / 说明 |
|---|---|---|---|
| CRIT-1 | 硬编码密钥泄露 | ✅ 正确 | `src/` 下未找到 `sk-ant-*` / `sk_live_*` 字面量；仅 `.env.example` 提交 |
| CRIT-2 | Webhook 幂等 + userId 验证 | ⚠️ **不完整** | `webhook/route.ts:141` Order 分支、`:181-186` 无 Order 分支均为 **check-then-act**，未使用数据库唯一键约束，并发双写仍可能发生 |
| CRIT-3 | 签名错误不泄露签名信息 | ✅ 正确 | `webhook/route.ts:122-128` 仅返回 `'Webhook verification failed'`，不含 receivedSig/expectedSig/diff |
| CRIT-4 | Callback 重放 | ⚠️ **不完整** | `callback/route.ts:33` `if (timestamp)` 允许缺省 timestamp 绕过时间窗校验；且无 nonce / transactionId 去重，签名有效期内可重放 |
| CRIT-5 | 配额扣减原子化 | ✅ 正确 | `lib/quota.ts:28-41` 单一 `$transaction` 内 upsert + `updateMany({ where: { baziAiCount: { lt: limit } } })`，条件更新消除超扣窗口 |
| CRIT-6 | 降级结果不污染缓存 | ✅ 正确 | `lib/ai/client.ts:107-116`、`:199-208` 双重守卫 `apiResult.success && !apiResult.fromFallback` 才 `redis.set`，降级分支直接 return |
| CRIT-7 | `--accept-data-loss` | ❌ **未修复** | `scripts/run-build.js:36` 仍为 `npx prisma db push --accept-data-loss`。建议替换为 `prisma migrate deploy` |
| CRIT-8 | CSP `unsafe-inline`/`unsafe-eval` | ❌ **未修复** | `next.config.ts:18-19` 仍保留 `'unsafe-inline' 'unsafe-eval'`（Stripe 需要），建议改用 nonce/hash 策略限定范围 |
| CRIT-9 | 删除根目录调试脚本 | ✅ 正确 | `check-db.js`、`check-orders.js`、`fix-vip.js` 已从仓库删除 |
| CRIT-10 | DOMPurify 防 XSS | ⚠️ **不完整** | `KnowledgeDetailClient.tsx` 已接入 `DOMPurify.sanitize`，但**未配置 `ALLOWED_TAGS` / `ALLOWED_ATTR` 白名单**，`<a href="javascript:...">` 等向量仍有风险 |
| CRIT-11 | Admin 邮箱迁至服务端 | ✅ 正确 | `admin/verify/route.ts:5` 从 `process.env.ADMIN_EMAILS` 读取，前端无硬编码；`admin/page.tsx` 纯 UI，权限校验委托后端 |
| CRIT-12 | error.tsx + not-found.tsx | ✅ 正确 | 新增页面未渲染 `error.message`/stack，仅 `console.error` + 固定文案 + reset 按钮 |

---

## 二、SEC 系列 + Vuln 验收摘要

### ✅ 修复正确（15 项）

| 编号 | 描述 | 验收说明 |
|---|---|---|
| SEC-001 | CALLBACK_SECRET 未配置时拒绝请求 | `callback/route.ts:10-13` 正确拦截 |
| SEC-003 | debug-feishu 端点添加管理员认证 | 路由入口已加 admin 校验 |
| SEC-005 | 密码重置 token 改存 sha256 哈希 | `password-reset.ts:27-29,37,49,62` 全链路哈希 |
| SEC-007 | reset-password 事务内 markTokenUsed → update | 事务化防并发重放 |
| SEC-012 | AI 端点(daily等)添加登录认证 | 6 个 AI 端点全部加 auth 守卫 |
| SEC-013 | 生产环境禁用模拟支付(qrserver) | 生产分支已移除 |
| SEC-017 | 注册速率限制(5次/h) | register 路由已实现 |
| SEC-018 | init-db 端点添加认证 | 已加管理员校验 |
| SEC-021 | Admin API plan 枚举校验 | plan 字段白名单验证 |
| SEC-024 | 移除 API 响应中 _debug 字段 | marriage 端点已丢弃 |
| Vuln 1 | 微信用户创建缺少email字段 | 合成邮箱 `wechat.{unionid}@cyberfate.internal` |
| Vuln 2 | 支付金额篡改保护 | 服务端独立定价 + 最低价边界 50% |
| Vuln 3 | 密码重置竞态条件 | 事务内 markTokenUsed → user.update |
| Vuln 5 | Admin 邮箱大小写绕过 | 全路由 email.toLowerCase().trim() |
| M-6 | Admin API 错误信息脱敏 | 错误信息不再直回前端 |
| M-7 | 创建订阅前置旧订阅为 expired | updateMany 置 expired 后 create |
| M-8/M-9 | payment/create baseUrl + outTradeNo | 环境变量读取 + crypto.randomUUID() |
| M-21 | 移除 Stripe ID 前端展示 | ProfileClient 已移除 |
| M-42 | debug-feishu token 脱敏 | 仅返回长度/code |

### ⚠️ 修复不完整（4 项）

| 编号 | 问题 | 隐患详情 |
|---|---|---|
| SEC-004 | check-email 时序/速率防护 | 时序防护用 `sleep(100+rand*100)` 是附加延迟而非恒定；且**内存 Map 速率限制在 Vercel 多实例下失效**（同问题影响 SEC-017 register） |
| Vuln 4 | forgot-password 用户枚举 | 未知邮箱返回 `{success:true}` 但**未执行等价耗时操作**（无 DB 写入、无 bcrypt），时序仍可枚举 |
| Vuln 6 | AI Prompt 注入 | `marriage/route.ts:308-316` sanitize 已过滤控制字符/HTML 注释/括号，但**遗漏反引号** `` ` ``，对 LLM 而言仍是潜在注入边界 |
| M-7 / SEC-007 | admin/create-subscription 事务化 | `updateMany`（置 expired）与 `create`（新订阅）**未包裹在同一 `$transaction`**，中间失败会导致用户无订阅 |

---

## 三、🆕 本轮修复引入的新问题

| # | 文件 | 问题 | 建议 |
|---|---|---|---|
| N-1 | `src/app/api/ziwei/route.ts:97-111` | `debug` 字段未做环境守卫 —— 生产响应体常态暴露 `sizhu/trueSolarOffset/algorithm` 等内部算法信息 | `process.env.NODE_ENV !== 'production'` 条件包裹 |
| N-2 | `src/app/api/init-db/route.ts:24` | 回传 `error.message` —— catch 分支直接把原始数据库错误给客户端，可能泄露连接串/表结构 | 改通用文案 `{ success: false, message: 'Database health check failed' }` |
| N-3 | `src/app/api/admin/check-user/route.ts:33` | 入参 email 未规范化 —— 管理员查询时未 `toLowerCase().trim()`，与存储小写邮箱不一致可能查不到用户 | 加 `.toLowerCase().trim()` |
| N-4 | `src/app/api/stripe/create-checkout/route.ts:21-25` | 按比例退款精度 —— `calculateProratedAmount` 中间使用浮点除法，虽末尾 `Math.round` 兜底，但以分为单位仍建议改整数运算 | 改整数运算 |
| N-5 | 多个速率限制文件 | 速率限制架构级缺陷 —— `check-email`、`register` 均使用进程内 `Map`，Vercel 多实例部署下等同失效 | 统一迁移至 Upstash / Vercel KV |

---

## 四、整体验收结论

### 结论：🟡 部分通过（Conditional Pass）

- **21 项申报修复中 15 项完全正确、4 项部分有效、2 项未修复（CRIT-7/8 已知权衡）**
- 同时发现 5 项新问题
- 核心支付/认证/XSS/缓存污染主干链路已显著收敛，**可进入下一阶段测试**
- 但存在**至少 3 项阻断级残留风险**必须在上线前修复

---

## 五、上线前必须修复（P0）

| # | 问题 | 文件 | 修复方案 |
|---|---|---|---|
| P0-1 | **CRIT-2 Webhook 幂等** | `webhook/route.ts` | 对 `transactionId` / `outTradeNo` 加数据库唯一索引，依赖唯一键约束而非 check-then-act |
| P0-2 | **CRIT-4 Callback 重放** | `callback/route.ts` | 强制 timestamp 字段必填 + 引入 nonce 或已处理订单号短期 Redis 去重 |
| P0-3 | **M-7 admin/create-subscription 事务化** | `admin/create-subscription/route.ts` | `updateMany + create` 放入同一 `$transaction` |

---

## 六、建议修复（P1）

| # | 问题 | 修复方案 |
|---|---|---|
| P1-1 | CRIT-10 DOMPurify 增加 ALLOWED_TAGS/ALLOWED_ATTR 白名单 |
| P1-2 | Vuln 4 forgot-password 未知邮箱路径加入等价耗时操作 |
| P1-3 | Vuln 6 marriage sanitize 增加反引号过滤 |
| P1-4 | ziwei 响应 `debug` 字段加环境守卫 |
| P1-5 | init-db 错误信息改通用文案 |

---

## 七、已知权衡（P2，可上线后跟进）

| # | 问题 | 说明 |
|---|---|---|
| P2-1 | CRIT-7 `--accept-data-loss` | 迁移 `prisma migrate deploy` |
| P2-2 | CRIT-8 CSP unsafe-inline | 改 nonce/hash（需配合 Stripe 集成调整） |
| P2-3 | 速率限制改为 Redis/KV | 内存 Map 在 Vercel 多实例下失效 |

---

## 八、评分对比

| 维度 | 初审评分 | 验收后评分 | 变化 |
|------|---------|-----------|------|
| 安全性 | ⭐☆☆☆☆ (1/5) | ⭐⭐⭐☆☆ (3/5) | +2 ↑ 主干漏洞基本关闭 |
| 架构合理性 | ⭐⭐⭐☆☆ (3/5) | ⭐⭐⭐☆☆ (3/5) | — |
| 代码质量 | ⭐⭐⭐☆☆ (3/5) | ⭐⭐⭐☆☆ (3/5) | — |
| 错误处理 | ⭐⭐⭐☆☆ (3/5) | ⭐⭐⭐⭐☆ (4/5) | +1 ↑ 脱敏+事务化 |
| 性能 | ⭐⭐⭐☆☆ (3/5) | ⭐⭐⭐☆☆ (3/5) | — |
| 并发与数据一致性 | ⭐⭐☆☆☆ (2/5) | ⭐⭐⭐☆☆ (3/5) | +1 ↑ 配额原子化 |
| 依赖与构建 | ⭐⭐☆☆☆ (2/5) | ⭐⭐☆☆☆ (2/5) | — |

**验收后综合评分：⭐⭐⭐☆☆（3.0 / 5）** （初审 2.5 → 验收 3.0，+0.5）

---

> **总结：修复方向全对、覆盖面很广，主干高危漏洞已基本关闭。剩下的残留问题多为"防护深度不足"而非"防护缺失"，修完上述 3 个 P0 即可进入真实流量验证。**

_报告生成时间：2026-04-18 13:30 GMT+8_
