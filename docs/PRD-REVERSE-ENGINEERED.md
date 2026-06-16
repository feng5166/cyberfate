# CyberFate 赛博命理师 · 产品需求文档(逆向反推版)

> 本文档由 Claude 阅读 `cyberfate` 代码库后逆向总结,描述"代码里实际存在的产品",而非规划意图。
> 版本:基于 2026-06-16 时点的 main 分支。

---

## 1. 产品定位

**一句话**:AI 驱动的东方命理 + 占卜一站式 Web/PWA 应用,把八字、紫微、六爻、塔罗等传统命理"排盘"能力与大模型"白话解读"结合,按订阅制变现。

- **目标用户**:对命理/玄学有兴趣的华语用户(含海外华人);轻度娱乐 + 决策辅助两类需求。
- **核心价值**:传统命理计算专业、准确(本地算法),解读用 AI 生成、通俗易懂、可追问。
- **形态**:Next.js 16(App Router)Web 应用 + PWA(可安装、离屏缓存);另有 `apps/mobile` 的 Expo 移动端骨架。
- **商业模式**:免费试用(每日配额)+ 订阅解锁(日/年/终身三档)。

---

## 2. 技术架构(实际)

| 层级 | 选型 |
|------|------|
| 框架 | Next.js 16(App Router)+ React 19 + TypeScript 严格模式 |
| 样式 | Tailwind CSS v4 + shadcn 风格 UI |
| 命理计算 | `lunar-javascript`(农历/干支)+ 自研算法库(`src/lib/<module>`) |
| AI 解读 | **DeepSeek v4-pro**(主,经 ModelVerse 网关)+ DeepSeek-V3.2 兜底;**Claude Sonnet** 仅作为「每日深度分析」的异常兜底(`ANTHROPIC_API_KEY`) |
| 数据库 | PostgreSQL + Prisma(本地开发用 SQLite `dev.db`) |
| 缓存/限流 | Upstash Redis(AI 响应缓存、限流) |
| 认证 | NextAuth(JWT 策略):邮箱密码 / Google / 微信 |
| 支付 | Stripe(唯一实际接通);WeChat/Alipay 仅枚举占位 |
| 邮件 | Resend(密码重置等事务邮件) |
| 分析 | PostHog + Google Analytics;Feishu 内部告警 |
| 部署 | Vercel(`vercel.json`、`@vercel/og` 生成分享图) |

> ⚠️ 代码注释里多处写"调用 Claude API",但函数实际请求 DeepSeek 端点(历史遗留命名)。真实主模型是 DeepSeek v4-pro。

---

## 3. 功能模块清单

### A. 命理排盘 / 占卜(核心)

| # | 模块 | 用户输入 | 计算输出 | AI 解读 | 配额 |
|---|------|---------|---------|:------:|------|
| 1 | **八字** `/bazi` | 生日 + 时辰 + 性别 | 四柱、五行分布、日主强弱、格局/用神、五维评分 | ✅ 六大板块白话分析 | 免费 1 次/日 |
| 2 | **合婚** `/bazi/marriage` | 双方生日/时辰/姓名 | 五行互补、天干五合、生肖六合三合、神煞,10–100 分 | ✅ 4 维结构化 + 深度叙事报告 | 付费 |
| 3 | **紫微斗数** `/ziwei` | 生日 + 时辰 + 性别 | 14 主星入 12 宫(三合派)、五行局 | ❌ 纯算法 | 免费 |
| 4 | **六爻** `/liuyao` | 问题 + 六爻阴阳 + 动爻 | 本卦/变卦、卦辞、逐爻爻辞 | ✅ 逐爻 + 总断 + 行动建议(SSE 流式) | — |
| 5 | **梅花易数** `/meihua` | 问题 + 时间/数字起卦 | 上下卦、动爻、变卦、体用关系 | ✅ 按需决策分析 | — |
| 6 | **黄历** `/huangli` | 日期 | 干支、纳音、宜忌、冲煞、太岁、彭祖百忌、廿八宿 | ❌ 排盘;✅ 追问 `/huangli/ask` | 免费 |
| 7 | **塔罗** `/tarot` | 问题 + 牌阵 | 78 张随机抽牌、正逆位(6 种牌阵) | ✅ 流式解读 | 单张/三张各 1 次/日 |
| 8 | **音乐运势签** `/music-oracle` | 问题 + 出生年(选) | 今日天干五行、与用户日主生克、匹配歌单 | ✅ 流式签文 + 可分享 | 3 次/日 |
| 9 | **每日运势** `/daily` `/today` | 生日/时辰/性别 + 目标日期 | 日主 vs 今日干支生克、综合评分 + 6 维(事业/财/情/健康/学业/社交) | ✅ 主运势 + 深度分析 + 运势问答 | 深度分析免费 1 次/日 |

**牌阵(塔罗)**:单张、三张、凯尔特十字(10)、月光(3)、镜像(5)、关系(5)。
**6 种每日运势衍生**:detail-analysis(深度分析)、fortune-qa(运势问答)、timeline(时间线)、calendar、ratings。

### B. 内容/SEO 页

- **2026 生肖运势**:财运 `/2026/caiyun`、事业运 `/2026/shiyeyun`、爱情运 `/2026/aiqingyun`(静态人工内容,12 生肖排名 + 五行/六合三合解析,引流用)。
- **命理知识库** `/knowledge`、`/knowledge/[slug]`。

### C. 账户与商业化

- **认证** `/auth/login`、`/reset-password`:邮箱密码 / Google OAuth / 微信 OAuth(合成内部邮箱)。
- **个人中心** `/profile`:出生信息(供各模块复用)、订阅状态。
- **历史记录** `/history`:塔罗、每日深度分析、运势问答等留存。
- **定价** `/pricing`、**支付** `/payment/success|cancel`、**退款** `/refund`。
- **管理后台** `/admin`:用户、统计、订阅修复、八字校验。

### D. 合规

- 隐私政策 `/privacy`、服务条款 `/terms`、关于 `/about`。

---

## 4. 商业化设计(实际配置)

### 订阅档位(`src/lib/pricing-config.ts`,USD)

| 计划 | 名称 | 价格 | 时长 | 权益 |
|------|------|------|------|------|
| `daily` | 基础版 | $9.99 | 1 天 | 当日解锁:八字、每日运势、AI 报告 |
| `yearly` | 专业版 ⭐推荐 | $49 | 365 天 | 全部 + 紫微、梅花、塔罗牌阵、合婚、优先模型、专属客服 |
| `lifetime` | 尊享版 | $199 | 永久 | 全部 + 未来功能、无到期、配额提升、社群、定制报告 |

### 免费 vs 付费门槛(`UsageQuota`,按北京时间每日重置)

- **未登录**:0 配额。
- **登录免费用户**:八字 AI 1 次/日;塔罗单张 1 次/日;塔罗三张 1 次/日;每日深度分析 1 次/日;超出返回 403。
- **VIP(订阅有效)**:全部不限量。
- **无配额限制**:基础排盘(八字/紫微算法部分)、黄历、知识页。

### 支付能力

- **Stripe**:Checkout、Webhook(签名校验、`checkout.session.completed` 建单建订阅、`charge.refunded` 退款过期、`subscription.deleted` 同步)、Billing Portal、按比例升级(daily→yearly→lifetime)。金额一律服务端按配置校验,不信任前端。
- **微信/支付宝**:`PayMethod` 枚举占位,生产环境未启用。

---

## 5. 数据模型(关键表)

- `User`:认证信息 + 出生信息(birthDate/birthHour/gender,各模块复用)。
- `Account` / `Session` / `VerificationToken`:NextAuth(OAuth、会话)。
- `Subscription`:计划、状态、起止、自动续费、降级/改套餐挂起、取消反馈。
- `Order`:金额(分)、币种、`outTradeNo`/`transactionId` 唯一约束防重复、退款状态。
- `UsageQuota`:`userId+date` 唯一,记 `baziAiCount`/`tarotSingleCount`/`tarotThreeCount`。
- `TarotReading` / `MusicOracleRecord` / `DailyDetailHistory` / `DailyFortuneQaHistory`:各模块结果留存(支持历史、分享、软删除)。
- `PasswordResetToken`:密码重置。

---

## 6. 关键非功能特性

- **AI 工程**:逐功能超时(八字/每日 55s、塔罗 110s);温度 0.3–0.85;Redis 缓存命中复用;模型失败回退模板。模型用 `deepseek-{feature}-v4pro` 命名做熔断 + 缓存键隔离。
- **并发安全**:配额用 `updateMany` 原子计数防竞态;VIP 状态内存缓存 30s;订单交易号唯一约束防重复写。
- **PWA**:`next-pwa` 离线缓存、安装、启动屏(`public/splash`)。
- **安全/合规**:CSP 头、DOMPurify 清洗、bcrypt 密码、退款政策文档化。
- **可观测性**:PostHog/GA 埋点、Feishu 告警、`/api/health` 健康检查。

---

## 7. 我的评估(产品视角)

**强项**
- 命理品类覆盖广(9 大模块),排盘走本地确定性算法,解读走 AI,职责分离合理。
- 商业化闭环完整:配额钩子 → 触发付费墙 → Stripe 升级/退款/Portal 全链路。
- 工程成熟度高于"开发中"自述:熔断、缓存、原子配额、Webhook 幂等都已落地。

**风险 / 待办**
1. **README/CLAUDE.md 严重滞后**——仍写"等待需求""Claude 3.5 Sonnet",与实际(DeepSeek v4-pro、已上线规模)脱节。
2. **注释误导**——多处"调用 Claude"实为 DeepSeek,易误导维护者。
3. **支付仅 Stripe + 定价仅 USD**,但认证/受众含微信用户,海外/国内支付与定价货币策略需要明确。
4. **配额维度有限**——`UsageQuota` 只覆盖八字与塔罗两类;六爻/梅花/音乐签等 AI 功能的免费用量边界在 schema 层不一致。
5. **紫微目前无 AI 解读**,与其他模块体验不对齐,是潜在升级点。

**建议下一步**:统一 README/CLAUDE.md 与真实架构、清理误导注释、明确多币种/微信支付路线、把配额体系抽象成统一的"AI 调用计量"维度。

---

_逆向 PRD by Claude · 2026-06-16_
