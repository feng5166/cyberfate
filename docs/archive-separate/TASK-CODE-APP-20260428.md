# 代码虾任务说明 · CyberFate App MVP

> 创建日期：2026-04-28
> 来自：产品虾 🦐
> 给：代码虾
> 关联：`PRD-APP.md` / `APP-WIREFRAMES.md` / `APP-PUSH-COPY.md`

---

## 一、任务总览

启动 CyberFate **安卓 App MVP** 开发，技术栈 **React Native**，与现有 Next.js Web 项目并行推进。

**目标交付：**
- 10 周内安卓 APK 上架小米/OPPO/vivo/官网 4 个渠道
- 复用 Web 现有命理 API（不重复造轮子）
- iOS 首发 1 个月后再做

---

## 二、技术栈确认（已由 Frank 拍板）

| 项 | 选型 | 理由 |
|----|------|------|
| 框架 | **React Native (Expo)** | 与 Web React 复用 70% 逻辑 |
| 路由 | **Expo Router** | 文件路由，对齐 Next.js 心智模型 |
| 状态 | **Zustand**（与 Web 一致） | 跨端复用 store |
| 网络 | **TanStack Query**（与 Web 一致）| 跨端复用查询逻辑 |
| 样式 | **NativeWind (Tailwind RN)** | 复用 Web Design Tokens v6 |
| 本地存储 | **MMKV** | 比 AsyncStorage 快 30 倍 |
| 数据库 | **Expo SQLite**（命盘缓存）| 离线支持 |
| 推送 | **极光推送**（候选）/ FCM | 国内主用极光，海外 FCM |
| 支付 | **微信支付 + 支付宝原生 SDK** | 安卓必备 |
| 打包 | **Expo EAS Build** | 一键打 APK，免本地环境 |
| 深链接 | **Expo Linking + Branch.io** | 分享卡兜底 |

---

## 三、开发里程碑

### M1: 脚手架（Week 1-2）

- [ ] Expo 项目初始化（TypeScript 模板）
- [ ] 接入 Expo Router 文件路由
- [ ] 配置 NativeWind + Design Tokens v6
- [ ] 配置 Zustand + TanStack Query
- [ ] 配置 EAS Build（输出 APK）
- [ ] 基础 5 Tab Bar 框架（空页面占位）
- [ ] CI/CD：GitHub Actions + EAS（push to main → 自动打 APK）

**验收**：本地能跑出 5 Tab 空壳，EAS 能打出可安装的 APK。

### M2: 核心页面（Week 3-4）

- [ ] **首页 Tab**：问候语 + 今日运势卡 + 九宫格导航
- [ ] **运势 Tab**：日期切换 + 五维条 + 宜忌 + AI 建议
- [ ] **命盘 Tab**：四柱命盘 + 五行雷达 + 解读列表
- [ ] **广场 Tab**：话题墙 + 签到榜（极简）
- [ ] **我的 Tab**：用户信息 + 订单 + 设置
- [ ] **首次启动流程**：启动页 + 引导 3 屏 + 生辰输入 + 首次命盘

**验收**：5 Tab 全部能渲染真实数据，命理 API 走通。

### M3: API 抽象层（Week 3 并行）

需要在 Web 项目里重构出**通用 API Layer**，给 App 共用：

```
项目结构建议：
cyberfate/
  ├── apps/
  │    ├── web/           ← 现有 Next.js
  │    └── mobile/        ← 新建 RN App
  └── packages/
       ├── api-client/    ← 通用 API 封装（axios + types）
       ├── shared-types/  ← 共享 TypeScript 类型
       ├── shared-logic/  ← 八字/紫微/塔罗算法（纯函数）
       └── design-tokens/ ← 共享 Design Tokens
```

**API 抽象优先级：**
- P0：八字计算 / 每日运势 / 用户认证
- P1：紫微 / 塔罗 / 六爻 / 梅花 / 合婚
- P2：分享卡 / 订单 / 会员

**改造方式：**
- 现有 Web `app/api/**` 路由保留
- 新增 `packages/api-client` 作为统一封装层
- Web 和 App 都通过这个 client 调用
- 后端如果有逻辑改动，client 层 hot-fix 即可

### M4: App 差异化能力（Week 5-6）

- [ ] **推送系统**：极光 SDK 接入 + 文案库对接（见 APP-PUSH-COPY.md）
- [ ] **每日签到**：本地 + 云端双写 streak
- [ ] **分享卡生成**：Skia / react-native-view-shot 渲染长图
- [ ] **深链接**：分享卡二维码 → 直达 App 页面
- [ ] **离线命盘**：SQLite 缓存已测命盘
- [ ] **深色模式**：跟随系统 + 手动切换

### M5: 商业化（Week 7-8）

- [ ] 微信支付 SDK 接入（订阅 + 单次解锁）
- [ ] 支付宝 SDK 接入
- [ ] 会员订阅商品（¥28/月、¥198/年、¥498 终身）
- [ ] 单次付费 SKU（八字 ¥9.9 / 紫微 ¥19.9 等）
- [ ] 会员状态同步 Web 端

### M6: 测试 + 上架（Week 9-10）

- [ ] Alpha 内测（团队 + 部分老用户）
- [ ] 性能优化（启动 <2s / 包体 <30MB / 崩溃 <0.2%）
- [ ] 隐私合规 SDK 清单（推送/支付/统计 各一条）
- [ ] 应用商店 4 渠道材料准备（小米/OPPO/vivo/官网）
- [ ] 提审 + 应对反馈

### M7: Widget + 后续（Week 11+）

- [ ] 安卓桌面 Widget（4x1 / 4x2 / 4x4）
- [ ] 吉时提醒
- [ ] 命运日记
- [ ] iOS 版本启动

---

## 四、关键技术注意点

### 4.1 必须避坑
- ❌ 不要用 WebView 套壳（应用商店审核会被打回）
- ❌ 不要用 react-native-web 反向跑 Web（性能差）
- ❌ 不要在 RN 里重写八字算法（直接调 Web API）
- ❌ Expo Go 调试有限制，关键功能用 Dev Client

### 4.2 性能基线
- 冷启动 < 2 秒
- 热启动 < 500ms
- APK 包体积 < 30MB（用 Hermes + ProGuard）
- 崩溃率 < 0.2%
- 列表滚动 60fps（FlashList 替代 FlatList）

### 4.3 隐私合规（重要）
- 启动前弹《用户协议》+《隐私政策》（独立 App 版）
- 三类 SDK 必须披露：推送 / 支付 / 统计
- 生辰数据 AES-256 加密存储
- 删除账号 30 天内物理删除

---

## 五、与美术虾/运维虾配合

### 需要美术虾交付（M1 前）
- App 图标（1024×1024 圆角 + 透明）
- 启动屏（splash screen 横竖两版）
- 5 Tab Bar 图标（默认态 + 选中态，SVG）
- Onboarding 引导页 3 屏插画
- 空状态插画（5 个 Tab 各一）

### 需要运维虾配合（M1 前）
- Expo EAS 账号配置 + GitHub Actions 集成
- 极光推送账号 + 应用 AppKey
- 微信支付/支付宝商户号申请（M5 前完成）
- 4 个安卓应用商店开发者账号（M6 前完成）

---

## 六、开发优先级建议

如果 10 周时间太紧，可以这样取舍：

**必须保（P0）：**
- 5 Tab 框架 + 首次启动流程
- 首页 + 运势 Tab + 命盘 Tab
- 推送系统
- 微信/支付宝支付
- 4 渠道 APK 打包

**可延后（P1）：**
- 广场 Tab（先放占位"敬请期待"）
- 分享卡生成（先用 Web 链接代替）
- 深链接
- 命运日记

**砍掉到 V2（P2）：**
- Widget
- AI 语音
- Face 面相
- 摇一摇抽签

---

## 七、验收标准

每个里程碑结束后我会做产品验收，关注：

1. **功能完整度**：是否覆盖 PRD 要求
2. **性能指标**：启动 / 包体 / 崩溃
3. **设计还原度**：对照线框图 + Web v6 Design Tokens
4. **跨端一致性**：与 Web 数据/账号是否打通
5. **审核合规性**：是否能过 4 个安卓商店

---

## 八、问题反馈

开发中如有以下情况，第一时间在龙虾工作群同步：
- 技术选型遇到瓶颈
- 复用 Web 代码遇到障碍
- 应用商店审核疑问
- 性能优化卡壳

我（产品虾）随时支持。

---

_任务说明 v1.0 · 产品虾 🦐 · 2026-04-28_
