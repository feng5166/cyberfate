# CyberFate 赛博命理师

> 🔮 AI 驱动的东方命理 + 占卜一站式应用

CyberFate 把八字、紫微、六爻、塔罗等传统命理的**排盘算法**与**大模型白话解读**结合,提供 Web/PWA 体验,按订阅制变现。

## 功能

**命理 / 占卜(9 大模块)**

| 模块 | 路径 | AI 解读 |
|------|------|:------:|
| 八字 | `/bazi` | ✅ |
| 合婚 | `/bazi/marriage` | ✅(付费) |
| 紫微斗数 | `/ziwei` | ❌(纯算法) |
| 六爻 | `/liuyao` | ✅ |
| 梅花易数 | `/meihua` | ✅ |
| 黄历 | `/huangli`·`/today` | 追问 ✅ |
| 塔罗 | `/tarot` | ✅ |
| 音乐运势签 | `/music-oracle` | ✅ |
| 每日运势 | `/daily` | ✅ |

**内容/账户**:2026 生肖运势、命理知识库、登录(邮箱/Google/微信)、个人中心、历史、定价/支付、退款、Admin 后台。

## 技术栈

| 层级 | 技术 |
|------|------|
| 框架 | Next.js 16(App Router)+ React 19 + TypeScript |
| 样式 | Tailwind CSS v4 |
| 命理计算 | `lunar-javascript` + 自研 `src/lib/*` |
| AI | **DeepSeek v4-pro**(主,经 ModelVerse 网关)+ DeepSeek-V3.2 兜底;Claude Sonnet 仅作为「每日深度分析」的异常兜底 |
| 数据库 | PostgreSQL + Prisma(本地开发 SQLite `dev.db`) |
| 缓存/限流 | Upstash Redis |
| 认证 | NextAuth(JWT) |
| 支付 | Stripe |
| 邮件 | Resend |
| 分析 | PostHog + Google Analytics |
| 部署 | Vercel · PWA(`next-pwa`) |

## 商业化

| 计划 | 价格 | 时长 |
|------|------|------|
| 基础版 | $9.99 | 1 天 |
| 专业版 ⭐ | $49 | 1 年 |
| 尊享版 | $199 | 永久 |

免费用户有每日配额(如八字 AI 1 次/日、塔罗单/三张各 1 次/日);订阅解锁不限量与高级功能。

## 本地开发

```bash
# 1. 安装依赖(postinstall 会自动 prisma generate)
npm install

# 2. 配置环境变量(参考 .env.example)
cp .env.example .env.local
#   必填:DATABASE_URL、DEEPSEEK_API_KEY、NEXTAUTH_SECRET
#   可选:GOOGLE_*、微信、STRIPE_*、RESEND_*、UPSTASH_*、POSTHOG_*

# 3. 初始化数据库
npx prisma migrate dev

# 4. 启动开发服务器
npm run dev        # http://localhost:3000
```

其他命令:`npm run build`(经 `scripts/run-build.js`)、`npm start`、`npm run lint`。

## 目录结构

```
cyberfate/
├── src/
│   ├── app/          # 页面路由 + API(App Router)
│   ├── components/   # 组件(按模块划分)
│   ├── lib/          # 命理算法 + AI + 支付/配额核心
│   ├── stores/ hooks/ data/ types/
├── apps/mobile/      # Expo 移动端
├── prisma/           # 数据库 schema
├── docs/             # PRD / 设计 / 运维文档
└── public/           # 静态资源(塔罗牌图、splash 等)
```

## 文档

- 整体 PRD(逆向):`docs/PRD-REVERSE-ENGINEERED.md`
- 模块级 PRD:`docs/PRD-MODULES-DETAILED.md`
- 改进任务:`docs/IMPROVEMENT-TASKS.md`
- 部署:`DEPLOY_GUIDE.md` · `docs/DEPLOYMENT.md`

---

Made with 🦐 by 代码虾
