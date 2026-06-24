# CyberFate 移动端 APP 方案

> 把现有 Web（Next.js）功能做成移动端 APP 并上架的工程方案。
> v1 定调：**Android 先行 · 先免费（不接 IAP）· 全量 9 模块**。
> 决策依据见文末「决策记录」。

---

## 1. 现状摸底

### 1.1 Web 端（已上线）
- Next.js 16 App Router + React 19 + TS 严格模式，**已是 PWA**（`@ducanh2912/next-pwa` + `public/site.webmanifest` + `sw.js` + `offline.html`）。
- **62 个 API route**，其中约 **49 个用 `getServerSession`（NextAuth，JWT 存 Cookie）** 鉴权。
- 命理排盘为本地确定性算法（`src/lib/<module>`）；AI 解读经 DeepSeek（ModelVerse 网关）+ Redis 缓存 + 失败回退。
- 支付：Stripe Checkout（网页跳转）。

### 1.2 移动端 `apps/mobile`
- **从零开始**。此前存在一份 `feng5166` 的 Expo 原型（UI 骨架完整但基本走 mock、未接通后端），为避免与新实现混淆，已于 2026-06-24 **永久删除**。`apps/` 现为空目录，作为新移动端工程的落点。
- 历史参考：旧原型曾用 Expo SDK 54 + expo-router + NativeWind + zustand + MMKV，bundleId `me.cyberfate.app`、EAS owner `feng5166`、`projectId 8f13cc0f-…`。新工程可沿用同一套技术选型与标识符（如仍由同一开发者账号上架）。

---

## 2. 路线选择

| 路线 | 工作量 | 上架风险 | 体验 | 结论 |
|---|---|---|---|---|
| A. WebView 套壳 | 最小 | 高（iOS Guideline 4.2 易拒） | 一般 | ❌ |
| B. PWA + Android TWA | 小 | Android 可上；iOS 不支持 | 好 | 仅 Android 过渡 |
| **C. 原生 RN（复用后端 API）** | 中 | 低，双端可上 | 最好 | ✅ **采用** |

**采用 C**：新建 `apps/mobile`（Expo + expo-router）作为「薄 UI 层 + 复用现有 62 个 API」的原生壳。命理/AI 逻辑全部留服务端，移动端只做展示与交互，后端几乎不重写。

---

## 3. 核心改造点

### 3.1 [P0] Bearer 鉴权通道（最大改造量）
原生 `fetch` 不带浏览器 Cookie，现有 49 个靠 NextAuth Cookie 鉴权的 route 跑不通。

- 在 `src/lib/auth.ts` 增加统一入口 `getAuthUser(req)`：**先试 NextAuth session，再校验 `Authorization: Bearer <JWT>`**。
- 新增 `POST /api/auth/mobile-login`：邮箱密码 → 签发长效 JWT（与 NextAuth 同密钥/同 payload 结构），移动端存 MMKV。
- 第三方登录：Google 用 `expo-auth-session`；**微信登录 v1 后置**（待国内分发再接开放平台 + URL Scheme）。
- 落地手法：49 个 route 把 `getServerSession(authOptions)` 批量替换为 `getAuthUser(req)`（helper 内部对两种来源归一化为同一 user 对象）。

### 3.2 [P0] 全 9 模块接后端
- 移动端**不做任何命理本地算法**，一律调服务端 route（如 `/api/bazi`），保证与服务端 `src/lib/bazi` 结果一致；离线场景仅做缓存读取，不本地重算。
- 数据层用 `@tanstack/react-query` 封装各 route，统一 loading / error / 缓存。
- 首页采用「模块网格入口」承载 9 模块，各模块走独立详情页路由；底部 Tab 控制在 4–5 个（如 首页 / 运势 / 命盘 / 我的）。

### 3.3 [P1] 配额与错误 UI 对齐
- 统一处理服务端语义：`402`（配额/付费）、`429`（限流）→ 移动端友好提示与引导。
- 配额接口：`/api/user/quota`、`/api/user/use-quota`、`/api/quota/bazi`。

### 3.4 [P1] Google Play 合规
- **删号入口**（Play 强制数据删除）：新增 `POST /api/user/delete` + App 内入口。
- Data Safety 表单；隐私政策复用 Web 的 `/privacy`、`/terms`。
- 命理内容标注「娱乐用途」，避免医疗/投资断言式表述。

---

## 4. 模块 → API 映射表

| # | 模块 | 主要 API route | 备注 |
|---|---|---|---|
| 1 | 八字 | `/api/bazi`、`/api/bazi/stream`、`/api/bazi/chat`、`/api/bazi/timeline`、`/api/bazi/profiles[/:id]`、`/api/quota/bazi` | 移动端删本地重算，统一调服务端 |
| 2 | 合婚 | `/api/bazi/marriage`、`/api/bazi/marriage/qa` | |
| 3 | 紫微斗数 | `/api/ziwei` | |
| 4 | 六爻 | `/api/liuyao`、`/api/liuyao/qa` | |
| 5 | 梅花易数 | `/api/meihua/draw`、`/api/meihua/decide`、`/api/meihua/qa` | |
| 6 | 黄历 | `/api/huangli`、`/api/huangli/ask` | |
| 7 | 塔罗 | `/api/tarot/draw`、`/api/tarot/draw-cards`、`/api/tarot/history`、`/api/tarot/share` | 原型已接近完成 |
| 8 | 音乐运势签 | `/api/music-oracle`、`/api/daily-music`、`/api/music-oracle/share/:recordId` | |
| 9 | 每日运势 | `/api/daily`、`/api/daily/detail-analysis`、`/api/daily/fortune-qa`、`/api/daily/detail-history` | |
| + | 2026 生肖运势 | 页面 `/2026`（沿用 daily 数据） | 轻量引流 |
| + | 用户/认证 | `/api/auth/register`、`/api/auth/mobile-login`(新)、`/api/user/birth-info`、`/api/user/delete`(新) | |

> SSE 流式接口（`/api/bazi/stream`）在 RN 需用 `fetch` + ReadableStream 或 `react-native-sse`，注意 newArch 兼容。

---

## 5. 里程碑（Android 免费版）

| 阶段 | 目标 | 周期(估) |
|---|---|---|
| **M0 主链路** ✅ 代码完成 | 新建 Expo 脚手架（expo-router + react-query + secure-store + EAS）；Bearer 鉴权 + 八字/每日/塔罗 3 高频模块接通；剩待真机 + EAS 出包验证 | ~2 周 |
| **M1 全模块** | 剩余 6 模块 + 合婚 + 2026 生肖全部接后端；首页改模块网格；配额/错误 UI 统一 | ~2–3 周 |
| **M2 合规+上架** | 删号、Data Safety、商店素材（截图/描述/隐私）、内部测试轨 → 正式发布 | ~1.5 周 |
| **M-Later** | 留存验证后再做 IAP（RevenueCat 接 StoreKit + Google Billing + 收据校验）+ iOS 双端（TestFlight） | 后置 |

---

## 6. 上架合规清单

### v1（Android）
- [ ] 账号删除入口（App 内 + `/api/user/delete`）
- [ ] Data Safety 数据安全表单
- [ ] 隐私政策 / 用户协议链接（复用 Web）
- [ ] 命理内容标注「仅供娱乐」
- [ ] 目标 API level 合规（Play 最新要求）
- [ ] 出包 `aab`（上架）/ `apk`（内测）

### M-Later（iOS + 付费）
- [ ] Apple 开发者账号（$99/年）
- [ ] **IAP**：数字订阅必须走 StoreKit，禁止 App 内出现外部支付链接/暗示（Guideline 3.1.1）
- [ ] 收据校验：`POST /api/payment/iap-verify` → 写订阅状态（复用 `subscription` 表与配额逻辑）
- [ ] 在 App Store Connect / Play Console 把三档定价（$9.99/$49/$199）重建为 IAP 商品
- [ ] iOS 4.2 原生功能门槛（路线 C 满足）
- [ ] `PrivacyInfo.xcprivacy` 隐私清单 + App 隐私问卷
- [ ] 微信登录上架审核 + plist URL Scheme（如启用）

---

## 7. 风险

| 风险 | 影响 | 缓解 |
|---|---|---|
| 鉴权改造触及 49 个 route | 回归面大 | helper 归一化 + 批量替换 + 保留 Cookie 通道双跑，先灰度 |
| 移动端误加本地算法 | 排盘结果与服务端分叉 | 约定移动端零命理算法，一律调服务端 route |
| SSE 流式在 RN newArch 兼容 | AI 解读体验 | 优先非流式 `/api/bazi`，流式作增强 |
| IAP 抽成 15–30%（M-Later） | 利润 | v1 免费规避；付费阶段评估「reader app」模型 |

---

## 8. 决策记录

- **平台优先级**：Android 先行（审核宽松、出包快）。
- **付费模式**：先免费试水、付费后置（v1 不接 IAP，规避抽成与收据校验，去掉最大风险项）。
- **首发模块范围**：全量 9 模块（Web 端能力一次搬齐）。
- **旧原型处置（2026-06-24）**：经确认，永久删除 `feng5166` 的 Expo 原型 WIP，移动端从零重建，避免新旧实现混淆。

---

_文档维护：本文件为方案设计文档。移动端将在空的 `apps/mobile` 中从零搭建。_
