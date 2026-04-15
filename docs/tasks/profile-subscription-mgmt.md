# 个人中心订阅管理功能开发任务

**任务来源：** PRD.md § 4.4（第 982 行起）  
**优先级：** P0（核心）+ P1（完整交付）  
**开发者：** 代码虾  
**创建时间：** 2026-04-15  

---

## 任务概述

开发 `/profile` 个人中心页的**订阅管理功能**（区块 B + B-1），包含：
1. 订阅管理卡片（P0）
2. 订阅管理面板（P1）
3. 5 个 API + 7 个组件

---

## 已完成

✅ API: `GET /api/subscription/current` — 获取当前订阅详情

---

## 待实现（按优先级）

### 1. 核心 API（P0）

#### `POST /api/subscription/change-plan`
**功能：** 变更套餐（升级立即生效补差价，降级到期后生效）

**Request:**
```json
{
  "new_plan": "yearly",
  "action": "upgrade" | "downgrade"
}
```

**Response（升级）:**
```json
{
  "ok": true,
  "action": "upgrade",
  "prorated_amount": 130.00,
  "effective_date": "2026-04-15",
  "requires_payment": true,
  "payment_url": "https://stripe.com/checkout/..."
}
```

**Response（降级）:**
```json
{
  "ok": true,
  "action": "downgrade",
  "effective_date": "2026-07-15",
  "message": "新套餐将在当前周期结束后生效"
}
```

**逻辑要点：**
- 升级：计算剩余天数比例补差价，创建新支付订单，返回支付链接
- 降级：在 subscription 表记录 `scheduledPlan` 字段（需新增），到期后由定时任务切换

---

#### `POST /api/subscription/cancel`
**功能：** 取消自动续订

**Request:**
```json
{
  "feedback": "price_too_high" // 可选
}
```

**Response:**
```json
{
  "ok": true,
  "will_expire_at": "2026-07-15T00:00:00Z",
  "message": "订阅将在当前周期结束后取消"
}
```

**逻辑：**
- 更新 subscription 表 `cancelAtPeriodEnd` 字段为 true（需新增）
- 可选：记录取消原因到 feedback 表

---

#### `GET /api/subscription/invoices`
**功能：** 获取账单历史

**Response:**
```json
{
  "invoices": [
    {
      "id": "ord_xxx",
      "date": "2026-04-15",
      "description": "专业版（季卡）",
      "amount": 68,
      "currency": "CNY",
      "status": "paid"
    }
  ]
}
```

**逻辑：**
- 从 Order 表查询当前用户所有已支付订单
- 按时间倒序返回

---

### 2. 核心组件（P0）

#### `components/profile/SubscriptionCard.tsx`
**功能：** 订阅管理卡片（区块 B）

**Props:**
```typescript
interface SubscriptionCardProps {
  subscription: {
    plan: string;
    plan_name: string;
    price: number;
    status: string;
    expireAt: string;
  } | null;
  isSubscribed: boolean;
}
```

**UI 逻辑：**
- 已订阅：显示当前计划/价格/有效期 + 「升级套餐」「管理订阅」按钮
- 免费用户：显示剩余次数 + 「升级到 Pro 会员」按钮

---

#### `components/profile/SubscriptionPanel.tsx`
**功能：** 订阅管理面板（区块 B-1）

**包含子区域：**
1. 当前计划概览
2. 变更套餐（PlanSwitcher）
3. 支付方式（PaymentMethodSection）
4. 订阅操作（CancelSection）
5. 账单历史（InvoiceHistory）

---

#### `components/profile/PlanSwitcher.tsx`
**功能：** 套餐切换卡片组

**逻辑：**
- 3 个卡片：基础版/专业版/尊享版
- 当前套餐标记「★ 当前」+ 禁用按钮
- 更高档套餐显示「升级 →」按钮 → 弹出 UpgradeConfirmModal
- 更低档套餐显示「切换 ↓」按钮 → 弹出 DowngradeConfirmModal

---

#### `components/profile/UpgradeConfirmModal.tsx`
**功能：** 升级确认弹窗

**显示内容：**
- 从当前套餐 → 目标套餐
- 需补差价金额
- 新周期日期范围
- 强制勾选「我理解升级后将立即生效并扣费」
- 确认后调起支付

---

#### `components/profile/DowngradeConfirmModal.tsx`
**功能：** 降级确认弹窗

**显示内容：**
- 从当前套餐 → 目标套餐
- 当前周期剩余时间仍享受原权益
- 新套餐生效日期
- 确认后调用 `POST /api/subscription/change-plan`

---

#### `components/profile/CancelSection.tsx`
**功能：** 取消续订区域

**UI：**
- 危险操作按钮「⚠️ 取消自动续订」（红色文字）
- 点击后弹出二次确认弹窗：
  - 挽留文案
  - 可选反馈表单（价格太贵/功能用不上/使用频率低/其他）
  - 「再想想」「确认取消」按钮

---

#### `components/profile/InvoiceHistory.tsx`
**功能：** 账单历史列表

**UI：**
- 列表展示所有订单（日期/套餐名称/金额/状态）
- 空状态：「暂无支付记录」

---

### 3. 数据库 Schema 扩展（P1）

在 `prisma/schema.prisma` 的 `Subscription` 模型中新增字段：

```prisma
model Subscription {
  // ... 现有字段
  
  cancelAtPeriodEnd Boolean @default(false)  // 是否在周期结束后取消
  scheduledPlan     SubscriptionPlan?        // 预约降级的目标套餐（null = 无降级）
  cancelReason      String?                   // 取消原因
  canceledAt        DateTime?                 // 取消时间
}
```

**迁移命令：**
```bash
npx prisma db push
```

---

### 4. 集成到 /profile 页面

#### `src/app/profile/page.tsx`
修改服务端逻辑，获取订阅详情并传给 ProfileClient：

```typescript
const subscription = await fetch('/api/subscription/current').then(r => r.json());

return (
  <ProfileClient
    // ... 现有 props
    subscription={subscription}
  />
);
```

#### `src/app/profile/ProfileClient.tsx`
新增订阅管理卡片渲染：

```tsx
<SubscriptionCard
  subscription={subscription}
  isSubscribed={vip}
/>
```

---

## 开发顺序建议

1. ✅ API: `GET /api/subscription/current`
2. 📝 API: `POST /api/subscription/cancel`（最简单）
3. 📝 API: `GET /api/subscription/invoices`（查询 Order 表）
4. 📝 组件: `SubscriptionCard.tsx`（P0 核心）
5. 📝 组件: `InvoiceHistory.tsx`（简单列表）
6. 📝 组件: `CancelSection.tsx` + 取消确认弹窗
7. 📝 API: `POST /api/subscription/change-plan`（复杂）
8. 📝 组件: `PlanSwitcher.tsx` + `UpgradeConfirmModal.tsx` + `DowngradeConfirmModal.tsx`
9. 📝 组件: `SubscriptionPanel.tsx`（集成所有子组件）
10. 📝 集成到 `/profile` 页面

---

## 测试要点

- [ ] 免费用户访问 /profile 显示升级入口
- [ ] 已订阅用户显示当前计划详情
- [ ] 点击「管理订阅」展开完整面板
- [ ] 升级套餐：计算补差价正确，支付成功后立即生效
- [ ] 降级套餐：预约成功，到期后自动切换
- [ ] 取消续订：状态正确，到期前仍享受权益
- [ ] 账单历史：显示所有支付记录

---

## 注意事项

- 升级补差价计算公式：`(新套餐价 - 旧套餐价) × (剩余天数 / 旧套餐总天数)`
- 降级不退差价，只是预约到期后切换
- 取消续订后用户在到期前仍是 VIP
- 所有金额单位：分（存储）/ 元（展示）

---

_开发进度持续更新此文档_
