# 解锁全部功能弹窗 (Upgrade Modal) — 代码虾任务说明

> 来源：Frank 2026-04-15 反馈 | PRD位置：4.8 节 | 优先级：P0

## 目标

点击「解锁全部功能」时，**不跳转 /pricing 页面**，而是弹出订阅选择弹窗。弹窗内容复用 pricing 页的三列套餐卡片组件。

## 核心要求：组件复用（硬性）

```
UpgradeModal (新)
  └── PricingCardList (已有/抽取)  ← 与 /pricing 页共用
        └── PricingCard (已有/抽取) ← 与 /pricing 页共用

/pricing 页面
  └── PricingCardList (同一个组件)
        └── PricingCard (同一个组件)
```

**不允许维护两份重复代码。** 如果当前 /pricing 的卡片是内联写的，先抽取为共用组件。

## 弹窗规格

- 居中 Modal，`max-w-[900px]`（比登录弹窗宽）
- 遮罩 `bg-black/50 backdrop-blur-sm`，点击关闭
- `rounded-2xl`，`max-h-[90vh]`，超出内部 scroll

## 弹窗内容（从上到下）

1. **标题区**：「解锁全部功能」+ 副标题「选择适合您的计划，开启完整体验」
2. **三列套餐卡片**（月卡 ¥29 / 季卡 ¥69 推荐 / 年卡 ¥199）— 够用 PricingCardList
3. **底部链接**：「查看完整权益对比 →」→ 关闭弹窗跳 /pricing

## 触发逻辑（重要！）

| 用户状态 | 点击「解锁全部功能」 |
|---------|-------------------|
| 未登录 | → 先弹 **登录 Modal (4.2)** → 登录成功后 **自动回到 Upgrade Modal**（不跳走） |
| 已登录·未订阅 | → **直接弹 Upgrade Modal** |
| 已登录·已订阅 | → 不显示此按钮（无触发入口） |

## CTA 按钮流程

```
点「立即开通」(任意套餐)
  ↓
检查登录态
  ↓
未登录 → 弹登录 Modal → 登录成功 → 回到 Upgrade Modal → 发起支付
已登录 → 直接发支付请求 (Stripe/支付宝)
```

> 登录成功后必须回到 Upgrade Modal，需要传 redirect 参数或状态管理。

## 移动端

- < 768px: 三列卡片改为垂直堆叠
- 弹窗宽度 `w-[95%]`

## 组件文件（新建/抽取）

| 组件 | 路径 | 说明 |
|------|------|------|
| UpgradeModal | components/pricing/UpgradeModal.tsx | 解锁弹窗主组件 |
| PricingCard | components/pricing/PricingCard.tsx | 单个套餐卡片（**与 /pricing 共用**） |
| PricingCardList | components/pricing/PricingCardList.tsx | 三列卡片容器（**与 /pricing 共用**） |

## 验收标准

1. 侧边栏点「解锁全部功能」→ 弹出套餐选择弹窗（不跳页）
2. 弹窗内三列卡片与 /pricing 页面数据一致、样式一致
3. 未登录用户点解锁 → 登录 → 登录后自动回到升级弹窗
4. 已订阅用户侧边栏不显示「解锁全部功能」按钮
5. 点「查看完整权益对比」→ 跳转 /pricing 完整页面
6. 移动端卡片垂直堆叠正常
7. PricingCard/PricingCardList 是真正的共用组件（非 copy-paste）
