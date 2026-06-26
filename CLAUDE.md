# CyberFate 赛博命理师

> AI 驱动的东方命理 + 占卜应用

## 项目状态

🟢 **已上线运营** — 9 大命理模块 + 订阅商业化闭环均已落地。

## 技术栈

| 层级 | 技术 |
|------|------|
| 框架 | Next.js 16 (App Router) + React 19 |
| 语言 | TypeScript(严格模式) |
| 样式 | Tailwind CSS v4 |
| 命理计算 | `lunar-javascript` + 自研 `src/lib/*` |
| AI | **DeepSeek v4-pro**(主,经 ModelVerse 网关)+ DeepSeek-V3.2 兜底;Claude Sonnet 仅作为「每日深度分析」的异常兜底 |
| 数据库 | PostgreSQL(生产 = Vercel Postgres,底层 Neon)+ Prisma |
| 缓存/限流 | Upstash Redis |
| 认证 | NextAuth(JWT):邮箱密码 / Google / 微信 |
| 支付 | Stripe(WeChat/Alipay 枚举占位,未启用) |
| 部署 | Vercel · PWA |
| 移动端 | Expo(React Native)+ expo-router,薄 UI 复用 Web API,见 `apps/mobile`(方案 `docs/MOBILE-APP-PLAN.md`) |

> ⚠️ 模型归属:命理解读主链路一律走 DeepSeek v4-pro(经 ModelVerse)。早期误导性命名(如 `callClaudeAPI`)已统一改为 `callDeepSeek*`(见 `docs/IMPROVEMENT-TASKS.md` T3)。当前代码中唯一真实调用 Claude 的是 `src/app/api/daily/detail-analysis`(每日深度分析的异常兜底,模型 `claude-sonnet-4-20250514`)。改动 AI 逻辑前仍以 `src/lib/ai/models.ts` 的实际端点为准。

## 功能模块

八字 / 合婚 / 紫微斗数 / 六爻 / 梅花易数 / 黄历 / 塔罗 / 音乐运势签 / 每日运势;
另有 2026 生肖运势、知识库、认证、个人中心、历史、定价支付、Admin 后台。
详见 `docs/PRD-MODULES-DETAILED.md`。

## 商业化与配额

- 订阅三档:基础版 $9.99/天、专业版 $49/年、尊享版 $199/永久(`src/lib/pricing-config.ts`)。
- 免费配额(`UsageQuota`,按北京时间日重置):八字 AI 1/日、塔罗单/三张各 1/日、每日深度分析 1/日;VIP 不限量。
- 金额一律服务端按配置校验,不信任前端。

## 开发规范

### Git 提交格式
```
feat: 新功能   fix: 修复   docs: 文档
style: 样式    refactor: 重构   test: 测试
```

### 代码规范
- TypeScript 严格模式;优先 Server Components,客户端组件加 `'use client'`。
- 命理排盘走本地确定性算法(`src/lib/<module>`);AI 解读统一经 `src/lib/ai` 模型层 + Redis 缓存 + 失败回退。
- 配额修改走原子操作(`updateMany` 计数),防并发竞态。

## 目录结构

```
src/
├── app/          # 页面路由 + API
├── components/   # 组件
├── lib/          # 命理算法 + AI + 支付/配额
└── hooks/ stores/ data/ types/
apps/mobile/      # Expo 移动端（薄 UI 层，复用后端 API）
docs/             # PRD / 设计 / 运维
.claude/agents/   # 子代理配置
```

## 关键文档

- 整体 PRD(逆向):`docs/PRD-REVERSE-ENGINEERED.md`
- 模块级 PRD:`docs/PRD-MODULES-DETAILED.md`
- 改进任务:`docs/IMPROVEMENT-TASKS.md`
- AI 成本模型:`docs/AI_COST_MODEL.md`
- 部署/运维:`DEPLOY_GUIDE.md` · `docs/DEPLOYMENT.md` · `docs/RUNBOOK.md`

---

_游进代码海,写出好虾码 🦐_
