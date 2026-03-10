# CyberFate 运维分析报告

**项目:** CyberFate（赛博命理师）  
**分析日期:** 2026-03-10  
**分析人:** 运维虾 (OpShrimp)

---

## 1. 系统架构分析

### 整体架构

```
用户浏览器
    ↓
Vercel CDN + Edge Network
    ↓
Next.js 14 应用 (SSR + API Routes)
    ↓
    ├─→ Prisma Postgres (db.prisma.io) - 用户数据、订阅、配额
    ├─→ Claude API (via gptbest.vip) - AI 分析服务
    └─→ NextAuth - 认证服务 (Google/微信/邮箱)
```

### 技术栈

- **前端框架:** Next.js 14 (React 19)
- **样式:** Tailwind CSS 4
- **数据库:** PostgreSQL (Prisma Postgres)
- **ORM:** Prisma 5.22
- **认证:** NextAuth 4.24
- **AI 服务:** Claude 3.5 Sonnet (via @ai-sdk/anthropic)
- **支付:** Stripe (已集成但未完全启用)
- **部署:** Vercel

### 关键依赖

1. **数据库:** Prisma Postgres (托管服务)
   - 连接字符串在 DATABASE_URL
   - 单点依赖，无备库

2. **AI API:** Claude via gptbest.vip 代理
   - 香港节点中转
   - 有降级机制（AI 失败时返回通用分析）

3. **部署平台:** Vercel
   - 自动 CI/CD
   - 环境变量托管
   - 无服务器架构

### 数据流

- **八字分析:** 用户输入 → API 计算八字 → Claude 生成分析 → 检查配额 → 返回结果
- **每日运势:** 用户选择日期 → 计算干支 → Claude 生成运势 → 返回结果
- **会员订阅:** 用户购买 → Stripe 支付 → Webhook 回调 → 更新数据库

---

## 2. 性能监控方案

### 当前监控状态

**已有:**
- Vercel Analytics (基础访问统计)
- Vercel Logs (应用日志)
- Console.error 日志记录

**缺失:**
- ❌ API 响应时间监控
- ❌ 数据库查询性能追踪
- ❌ AI API 调用成功率和延迟
- ❌ 错误率和异常告警
- ❌ 用户体验指标 (Core Web Vitals)
- ❌ 配额使用趋势分析

### 建议监控指标

**关键指标 (P0):**
1. **可用性:** 服务正常运行时间 (目标 99.9%)
2. **响应时间:** API 平均响应时间 (目标 < 2s)
3. **错误率:** 5xx 错误占比 (目标 < 0.1%)
4. **AI API 成功率:** Claude 调用成功率 (目标 > 95%)

**业务指标 (P1):**
5. **八字分析请求量:** 每日/每小时请求数
6. **配额消耗:** 免费用户配额使用情况
7. **数据库连接数:** 连接池使用率
8. **支付成功率:** Stripe 支付完成率

### 推荐工具

**方案 A: 轻量级 (推荐)**
- **Vercel Analytics** (已有，免费) - 基础性能
- **Sentry** (免费额度 5k errors/月) - 错误追踪
- **Better Uptime** (免费) - 可用性监控和告警
- **成本:** $0/月

**方案 B: 进阶**
- 方案 A +
- **Axiom** (免费 500MB/月) - 结构化日志分析
- **成本:** $0-25/月

**实施优先级:**
1. 先接入 Sentry (错误追踪)
2. 配置 Better Uptime (健康检查)
3. 在关键 API 添加性能日志

---

## 3. 容灾备份策略

### 数据库备份现状

**当前状态:**
- ❌ 无自动备份
- ❌ 无备份验证
- ❌ 无恢复演练

**风险评估:** 🔴 高风险
- Prisma Postgres 托管服务可能有平台级备份，但不透明
- 数据丢失会导致用户账号、订阅、配额全部丢失
- 无法快速恢复

### 建议备份策略

**方案 1: 定时导出 (推荐)**

```bash
# 每日凌晨 3:00 执行
0 3 * * * pg_dump $DATABASE_URL | gzip > ~/backups/cyberfate-$(date +\%Y\%m\%d).sql.gz
```

- **频率:** 每日 1 次
- **保留:** 最近 30 天 + 每月 1 号归档
- **存储:** 本地 + 云存储 (S3/OSS)
- **成本:** < $5/月

**方案 2: 实时复制 (进阶)**
- 迁移到支持 Point-in-Time Recovery 的数据库服务
- 例如: Supabase (免费额度) 或 Neon (分支功能)
- **成本:** $0-25/月

### 恢复流程

1. **数据恢复:**
   ```bash
   gunzip < backup.sql.gz | psql $DATABASE_URL
   ```

2. **验证:**
   - 检查用户数量
   - 验证订阅状态
   - 测试登录功能

3. **RTO/RPO 目标:**
   - RTO (恢复时间): < 1 小时
   - RPO (数据丢失): < 24 小时

---

## 4. 成本优化建议

### 当前资源使用

**Vercel:**
- 部署: Hobby 计划 (免费)
- 流量: 100GB/月免费额度
- 函数执行: 100GB-小时/月
- **预估:** 当前免费，流量增长后约 $20/月

**数据库:**
- Prisma Postgres (托管)
- 连接数限制未知
- **预估:** 免费或 $5-15/月

**AI API:**
- Claude 3.5 Sonnet via gptbest.vip
- 每次八字分析约 2k tokens
- **预估:** 100 次分析/天 ≈ $3-5/月

**总成本:** 当前 < $10/月，增长后约 $30-50/月

### 成本浪费点

1. **AI Token 浪费:**
   - 每次请求都调用 AI，无缓存
   - 相同生辰八字重复计算
   - **优化:** 添加结果缓存 (Redis/KV)

2. **数据库查询:**
   - 每次请求都查配额
   - 订阅状态查询未缓存
   - **优化:** Session 中缓存 VIP 状态

3. **构建产物:**
   - .next 目录 268MB (较大)
   - node_modules 649MB
   - **优化:** 检查是否有未使用的依赖

### 优化建议

**立即可做:**
1. 添加八字结果缓存 (Vercel KV，免费额度)
2. 在 JWT 中存储 VIP 状态，减少数据库查询
3. 清理未使用的依赖

**中期优化:**
4. 对高频查询添加索引
5. 实施 API 限流 (防止滥用)
6. 静态资源 CDN 优化

**预期收益:** 降低 30-50% 的 AI API 成本

---

## 5. 安全加固检查

### 环境变量管理

**当前状态:**
- ✅ .env* 文件已加入 .gitignore
- ✅ 生产环境变量在 Vercel 加密存储
- ⚠️ 本地有多个 .env 文件 (.env, .env.local, .env.production)
- ⚠️ .env.production 包含真实数据库连接串

**风险:**
- 🟡 中等风险：本地 .env 文件可能被误提交
- 🟡 DATABASE_URL 在 .env.production 中明文存储

**建议:**
1. 删除本地 .env.production，仅保留 .env.local
2. 确认 .gitignore 覆盖所有 .env* 文件
3. 定期轮换 NEXTAUTH_SECRET

### API 密钥安全

**当前状态:**
- ✅ ANTHROPIC_API_KEY 存储在 Vercel 环境变量
- ✅ 前端无法直接访问密钥
- ⚠️ 无 API 限流机制
- ⚠️ 无请求来源验证

**风险:**
- 🟡 中等风险：恶意用户可能滥用 API
- 🟡 无法防止爬虫或自动化攻击

**建议:**
1. 添加 Rate Limiting (每 IP 每小时限制)
2. 实施 CAPTCHA (注册/登录/高频操作)
3. 监控异常流量模式

### 数据库访问控制

**当前状态:**
- ✅ 使用 Prisma ORM，防止 SQL 注入
- ✅ 密码使用 bcrypt 加密存储
- ⚠️ 数据库连接串包含明文密码
- ⚠️ 无数据库访问日志审计

**风险:**
- 🟢 低风险：Prisma 提供基础安全保障
- 🟡 中等风险：连接串泄露会导致数据库完全暴露

**建议:**
1. 启用数据库连接 SSL (已有 sslmode=require，✅)
2. 定期审计数据库访问日志
3. 考虑使用 Prisma Accelerate (连接池 + 缓存)

### 其他安全检查

**HTTPS/SSL:**
- ✅ Vercel 自动提供 HTTPS
- ✅ NEXTAUTH_URL 使用 https://

**CORS:**
- ⚠️ 未明确配置 CORS 策略
- **建议:** 在 API routes 中添加 CORS 头限制

**依赖安全:**
- ⚠️ 未定期检查依赖漏洞
- **建议:** 启用 `npm audit` 或 Dependabot

---

## 总结与优先级

### 🔴 高优先级 (本周完成)

1. **备份:** 配置数据库每日自动备份
2. **监控:** 接入 Sentry 错误追踪
3. **安全:** 清理本地 .env.production 文件

### 🟡 中优先级 (本月完成)

4. **性能:** 添加八字结果缓存 (Vercel KV)
5. **监控:** 配置 Better Uptime 健康检查
6. **安全:** 添加 API Rate Limiting

### 🟢 低优先级 (按需)

7. **成本:** 清理未使用依赖
8. **监控:** 接入 Axiom 日志分析
9. **容灾:** 数据库迁移到支持 PITR 的服务

---

## 下一步行动

Frank，报告已完成。建议我们先从高优先级的三项开始：

1. 我可以帮你写一个备份脚本
2. 指导你接入 Sentry
3. 清理敏感的本地环境文件

需要我立即开始执行哪一项？还是你想先讨论一下方案？
