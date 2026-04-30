# CyberFate App 任务派发消息 · Frank 转发用

> 创建日期：2026-04-28
> 作者：产品虾 🦐
> 用途：以下 3 段消息分别转发给代码虾 / 美术虾 / 运维虾
> 主文档：`~/Desktop/ClaudeCodeProject/cyberfate/docs/PRD-APP-ALL.md`

---

## 🔧 给代码虾（转发这段）

```
代码虾，CyberFate App MVP 启动，你负责 Android 端开发。

📄 完整文档：~/Desktop/ClaudeCodeProject/cyberfate/docs/PRD-APP-ALL.md
   直接看 Part 4「代码虾任务说明」，其余部分作为背景了解。

核心要点：
1. 技术栈：React Native (Expo) + Expo Router + NativeWind + Zustand
2. 发布目标：10 周内 APK 上架 4 渠道（小米/OPPO/vivo/官网）
3. 与 Web 关系：Monorepo 重构，复用 70% 逻辑（八字算法、API、类型）
4. iOS 先不做，安卓首发 1 个月后再启动

M1（Week 1-2）必交：
- Expo 项目脚手架 + TypeScript
- 5 Tab 框架（首页/运势/命盘/广场/我的）
- NativeWind 对齐 Web Design Tokens v6
- EAS Build CI/CD（push 自动打 APK 发飞书）
- Monorepo 结构规划（apps/web + apps/mobile + packages/*）

先动手做：
1. 回复一下技术选型细节有没有疑问
2. 本周先完成脚手架 + 5 Tab 空壳 + 打出第一个可安装 APK
3. 同步给 @产品虾 看看再推进下一步

有问题随时群里 @ 我或 @产品虾。
```

---

## 🎨 给美术虾（转发这段）

```
美术虾，CyberFate App MVP 视觉资产启动。

📄 完整文档：~/Desktop/ClaudeCodeProject/cyberfate/docs/PRD-APP-ALL.md
   直接看 Part 5「美术虾任务说明」+ Part 2「线框图」。

核心要点：
1. 整体沿用 Web v6 Design Tokens（暖米白 + 深藏蓝 + 赭橙 + 衬线字体）
2. 移动端适配紧凑场景，但调性不变
3. 禁止：赛博暗紫、纯黑底、堆 emoji、渐变霓虹

Week 1-2（P0 必交，代码虾搭骨架要用）：
- App 图标（1024×1024 圆角 + 透明两版）
- 启动屏 Splash Screen（竖版 1080×2400 + 横版）
- 5 Tab Bar 图标（默认态 + 选中态，SVG + PNG 三档）

Week 3-4（P0）：
- Onboarding 引导页 3 屏（晨曦山水 / 星图命盘 / 命运卡片）
- 空状态插画 5 张

Week 5-8（P1）：
- 运势分享卡 + 命盘分享卡模板
- 会员页 Hero 视觉

交付方式：
- 设计稿：Figma / 飞书云盘
- 资产文件：~/.openclaw/shared/cyberfate-app-assets/
- 命名规范见文档 Part 5 第 5.3 节

先从 App 图标开始出 2-3 版方向备选，这周内完成第一轮 review。
```

---

## ⚙️ 给运维虾（转发这段）

```
运维虾，CyberFate App MVP 基础设施启动。

📄 完整文档：~/Desktop/ClaudeCodeProject/cyberfate/docs/PRD-APP-ALL.md
   直接看 Part 6「运维虾任务说明」。

核心要点：
1. CI/CD：Expo EAS + GitHub Actions
2. 推送：极光（国内主用）+ 厂商通道（小米/华为/OPPO/vivo Push）
3. 支付：微信支付 + 支付宝原生 SDK
4. 4 渠道上架：小米 / OPPO / vivo / 官网直下

Week 1-2（P0 必交）：
- Expo EAS 项目配置 + eas.json（preview + production）
- GitHub Actions 工作流（push develop → 打 APK → 飞书通知）
- 极光推送账号申请 + AppKey 获取
- 飞书构建通知机器人

Week 5-6（P0，不能拖）：
- 微信支付商户号申请（需营业执照 + 订阅续费资质）
- 支付宝开放平台账号 + APP 支付 + 周期扣款
- ⚠️ 命理类申请支付有风险，提前准备"文化传播/软件服务"定位材料

Week 7-8：
- dl.cyberfate.me 下载页 + APK CDN 分发（Cloudflare R2）

Week 9-10：
- 4 个安卓商店开发者账号注册
- 上架材料汇总（图标/截图/隐私政策/SDK 清单）
- 分类填"生活服务"或"娱乐"，避开"占卜"

先反馈：
1. Expo 账号建好后把 AppID 同步给代码虾
2. 支付商户号申请流程有没有障碍（营业执照范围）
3. 极光账号本周搞定
```

---

## 📋 产品虾自用 · 任务跟踪表

| 虾 | 本周任务 | M1 目标 | 状态 |
|----|---------|---------|------|
| 代码虾 | 脚手架 + 5 Tab 空壳 + 首个 APK | Week 1-2 | 待启动 |
| 美术虾 | App 图标 2-3 版方向 | Week 1-2 全交付 | 待启动 |
| 运维虾 | EAS + GitHub Actions + 极光账号 | Week 1-2 | 待启动 |

每周五我出一次进度简报。

---

_派发文案 · 产品虾 🦐 · 2026-04-28_
