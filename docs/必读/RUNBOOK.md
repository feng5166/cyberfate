# CyberFate 运行手册

> 面向值班工程师的故障排查与应急处理手册

---

## 1. 告警规则

| 指标 | 阈值 | 严重级别 | 通知方式 |
|------|------|---------|---------|
| AI 调用错误率 | >5% | P1 | 飞书/短信 |
| Stripe Webhook 失败 | 任何 | P0 | 飞书 |
| DB 连接错误 | >1/min | P0 | 飞书 |
| Vercel 504 错误 | >10/min | P1 | 飞书 |
| 配额异常消耗 | 单用户 >50/h | P2 | 飞书 |
| Redis 连接失败 | 任何 | P2 | 飞书 |
| 断路器开路 | 任何服务 | P1 | 飞书 |

---

## 2. 常见故障处理

### AI 服务不可用

**现象**：用户报告八字分析、每日运势、塔罗等 AI 功能报错或返回通用内容

**排查**：
1. 检查 DeepSeek/Modelverse API 状态（api.modelverse.cn）
2. 检查 Redis 中断路器状态：`circuit:deepseek-bazi`、`circuit:deepseek-daily`、`circuit:deepseek-tarot`
3. 检查 Vercel Function logs 中 `[AI]` 前缀的错误日志

**临时解决**：系统自动降级到 fallback 逻辑：
- 八字：基于五行分布生成通用解读
- 每日运势：基于日主与当日干支的生克关系生成基础运势
- 塔罗：直接返回牌的正/逆位牌义原文

**根本解决**：
- 等待 DeepSeek API 恢复
- 或在 `.env` 中更换备用 API Key / 端点

**重置断路器**（Redis 中删除对应 key）：
```bash
# 通过 Upstash 控制台或 CLI
redis-cli DEL circuit:deepseek-bazi circuit:deepseek-daily circuit:deepseek-tarot
```

---

### 支付回调延迟/用户支付未开通 VIP

**现象**：用户反馈支付成功但未开通 VIP，订单状态仍为 `pending`

**排查**：
1. 登录 Stripe Dashboard → Webhooks → 查看该 `checkout.session.completed` 事件是否成功送达
2. 检查 Vercel logs 中 `webhook.checkout` 事件的 JSON 日志
3. 查看数据库 `Order` 表中该 `transactionId` 的状态

**手动修复**：
- 在 Stripe Dashboard 中对该 Webhook 事件点击「Resend」重放
- 或通过管理员页面手动开通 VIP（fix-vip 功能）

**幂等性保障**：Webhook 已实现幂等处理，重放不会重复创建订阅（P2002 约束 + 事务内查重）

---

### Redis 不可用

**现象**：API 响应正常但较慢，日志中出现 `[Redis] 操作 X 跳过：Redis 未初始化`

**影响**：
- AI 缓存失效 → 每次请求都调用 DeepSeek（成本上升，但不崩溃）
- 断路器状态丢失 → 断路器默认为 CLOSED（允许通过）
- 速率限制失效 → 所有请求被拒绝（rate-limit.ts 失败关闭策略）

**排查**：
1. 检查 Vercel 环境变量 `KV_REST_API_URL` / `KV_REST_API_TOKEN` 是否正确
2. 登录 Upstash 控制台验证 Redis 实例状态

**恢复**：环境变量正确配置后，下次冷启动自动恢复

---

### DB 性能下降

**现象**：API 响应时间显著增加（>2s），用户体验变差

**排查**：
1. 检查 Vercel Postgres Dashboard 中的连接数和查询延迟
2. 检查 Prisma 查询日志（开启 `DEBUG=prisma:query`）
3. 重点检查 `UsageQuota` 表的 `upsert` 操作（高频写入）

**解决**：
- 确认 `userId_date` 联合索引存在
- 检查连接池配置（Prisma `connection_limit`）
- 必要时重启 Vercel 函数实例清除连接泄漏

---

### Vercel 504 超时

**现象**：用户请求返回 504 Gateway Timeout

**常见原因**：
- AI API 调用超时（八字分析上限 25s，已有 `withAiTimeout` 保护）
- 数据库查询超时（Prisma 事务锁等待）
- 冷启动 + 重型计算（lunar-javascript 八字计算）

**排查**：Vercel Analytics 中查看 P95/P99 响应时间，定位超时函数

---

## 3. 日志格式说明

所有 Webhook 事件使用结构化 JSON 日志，字段说明：

```json
{
  "event": "webhook.checkout.duplicate_tx",
  "orderId": "order_xxx",
  "sessionId": "cs_xxx",
  "ts": 1713456789000
}
```

常见 event 值：
- `webhook.charge.refunded` — 退款处理完成
- `webhook.charge.refunded.no_order` — 退款事件缺少 orderId
- `webhook.subscription.deleted` — 订阅取消
- `webhook.invoice.paid.skipped` — invoice 已由 checkout 处理，跳过
- `webhook.invoice.paid.duplicate` — 重复 invoice 事件
- `webhook.checkout.duplicate_tx` — 重复 checkout 事件（幂等拦截）
- `webhook.error` — 顶层异常

---

## 4. 关键服务 URL

| 服务 | 控制台地址 |
|------|-----------|
| Vercel（部署/日志） | vercel.com/dashboard |
| Upstash Redis | console.upstash.com |
| Stripe Webhooks | dashboard.stripe.com/webhooks |
| Vercel Postgres | vercel.com/storage |

---

## 5. 紧急联系

- **开发者**：Frank / GeekAI 虾
- **平台支持**：Vercel Support / Stripe Support / Supabase Support
