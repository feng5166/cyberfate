# CyberFate R3 Bug 修复任务单

> **基于：** R2 验收报告（VERIFICATION_REPORT.md）  
> **创建时间：** 2026-04-18 20:16 GMT+8  
> **创建人：** GeekAI 虾 (geekai) QA  
> **执行人：** 代码虾 (codeshrimp)  
> **状态：** 📋 待修复

---

## 📋 任务总览

| 优先级 | 数量 | 说明 |
|---|---|---|
| 🔴 P0 必须修 | 2 | 上线前必须处理 |
| 🟡 P1 本周修 | 5 | 功能/安全/性能 |
| 🟢 P2 下迭代 | 3 | 体验/代码质量 |
| **总计** | **10** | |

---

## 🔴 P0 — 必须修（上线前）

### R3-001：Google OAuth Account 写入缺异常兜底
- **来源：** BUG-R2-001 / R2 验收 ⚠️
- **文件：** `src/lib/auth.ts:62-89`
- **问题：** Google OAuth 回调有 upsert Account，但缺 try-catch 兜底 + 回滚逻辑。如果 Account 写入失败，User 已创建但 Account 无记录，导致多端登录异常
- **修复要求：**
  1. upsert Account 包在 try-catch 中
  2. 失败时 rollback User 创建或标记需补全
  3. 记录错误日志便于排查
- **验收标准：** OAuth 异常路径有兜底，不会产生孤儿 User

### R3-002：双 Stripe 客户端合并
- **来源：** BUG-035 (R1+R2 均未修)
- **文件：** `src/lib/stripe.ts` (SDK) + `src/lib/stripe-direct.ts` (fetch)
- **问题：** 两套 Stripe 客户端并存，行为可能不一致（如错误处理、重试、超时）
- **修复要求：**
  1. 统一使用 SDK 版本 (`stripe.ts`)
  2. 将 `stripe-direct.ts` 中独有的逻辑迁移到 SDK 版本
  3. 删除 `stripe-direct.ts` 或标记 `@deprecated`
  4. 全局搜索确认无其他引用 stripe-direct
- **验收标准：** 只有一套 Stripe 客户端；所有调用走 SDK

---

## 🟡 P1 — 本周内修

### R3-003：Google 空 clientId 静默兜底
- **来源：** BUG-R2-036 ❌
- **文件：** Google OAuth 相关代码
- **问题：** `process.env.GOOGLE_CLIENT_ID \|\| ''` 空字符串静默跳过 Google 登录，无任何提示
- **修复要求：**
  - 未配置时在服务端日志 warn
  - 前端隐藏 Google 登录按钮（而非显示后点没反应）
- **验收标准：** 未配置 Google 时前端不显示该按钮

### R3-004：cancel feedback 无长度限制
- **来源：** BUG-R2-040 ❌
- **文件：** `src/app/api/subscription/cancel/route.ts`
- **问题：** 取消订阅的 feedback 字段 `feedback \|\| null`，无长度上限，用户可提交超长文本
- **修复要求：** 加 `maxLength(500)` 校验
- **验收标准：** feedback 超过 500 字返回 400

### R3-005：Session callback 缓存层
- **来源：** BUG-R2-019 ⚠️
- **文件：** `src/lib/auth.ts:125-143`
- **问题：** 每次 JWT 鉴权都查 2 次 DB（avatar + subscription），高并发下 DB 压力大
- **修复要求：**
  - 方案 A（简单）：结果缓存到内存 Map，TTL 5 分钟
  - 方案 B（更好）：将 isSubscribed + avatar 缓存进 JWT claims
  - 用户资料更新时失效缓存
- **验收标准：** 同一 token 短时间内重复请求不重复查 DB

### R3-006：AI fetch timeout 按功能分级
- **来源：** BUG-R2-029 ⚠️
- **文件：** `src/lib/ai/client.ts`
- **问题：** 统一 8s timeout，但 Celtic（合婚）等复杂分析需要更长时间
- **修复要求：**
  - 八字/每日运势 → 15s
  - 合婚/Celtic → 30s
  - 塔罗/黄历等轻量 → 10s
  - 超时后明确返回降级提示
- **验收标准：** 各功能有独立超时配置；超时不 hang

### R3-007：密码强度校验增强
- **来源：** BUG-R2-035 ⚠️
- **文件：** `src/app/api/auth/register/route.ts` + `reset-password/route.ts`
- **问题：** 只要求字母+数字，未要求特殊字符
- **修复要求：** 保持当前策略（字母+数字 8 位以上）即可，但加一条：
  - 如果要增强：建议 `min 8 位，含大小写+数字`（不强制特殊字符，用户体验更好）
  - 当前其实可以接受，标记为 **已知权衡**
- **验收标准：** 密码策略文档化并在代码注释中说明

---

## 🟢 P2 — 下迭代

### R3-008：feedback slice 与 maxLength 冲突
- **来源：** BUG-R2-038 ⚠️
- **文件：** FeedbackSection 组件
- **问题：** `slice(0, MAX+50)` 与 `maxLength={MAX}` 不一致
- **修复：** 统一为同一个 MAX 常量
- **验收标准：** 只有一个 MAX 来源

### R3-009：起运年龄算法精度
- **来源：** BUG-R2-042 ❌
- **文件：** `src/lib/bazi/calculator.ts:220`
- **问题：** 仍用 `3 + ((month+day)%3)` 近似值
- **修复要求：**
  - 短期：UI 明确标注"估算值，仅供参考"
  - 长期：接入 lunar-javascript 的 `getJieQiDate` 计算节气到出生日的天数，三天折一岁
- **验收标准：** UI 有精度声明或算法升级

### R3-010：错误日志全量排查
- **来源：** BUG-R2-044 ⚠️
- **文件：** 所有 API route
- **问题：** 主路径已修复错误信息脱敏，但未全量普查所有 catch 分支
- **修复要求：**
  - 全局搜索 `catch` + `error.message` / `error` 返回前端的模式
  - 统一替换为通用文案
- **验收标准：** 无 Prisma 内部细节 / stack trace 泄漏到响应体

---

## ✅ 已关闭项（R2 已修复，无需再处理）

以下 R1 残留已在 R2 中修复，**不需要再做**：

| # | 问题 | R2 状态 |
|---|---|---|
| BUG-005 | mock-pay 白嫖路由 | ✅ 代码已删除 |
| N-5 | 速率限制 fail-open | ✅ fail-closed |
| BUG-038 | 六爻缺长度校验 | ✅ isArray+length |

---

## 🎯 修复顺序建议

```
第一批（今天）：R3-001 + R3-002  ← 阻断项
第二批（本周）：R3-003 ~ R3-007    ← 安全+性能
第三批（下周）：R3-008 ~ R3-010   ← 体验+卫生
```

---

## 📝 验收准备

修完后告诉我，我会用 Claude Code Opus 做 **R3 验收**，检查项：

1. 每个 Bug 的实际代码修复是否正确完整
2. 是否引入回归
3. 两轮累计 103 个 Bug 的最终通过率

---

_任务单生成时间：2026-04-18 20:16 GMT+8_
