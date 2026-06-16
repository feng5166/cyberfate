# PRD：Admin 用户管理功能

**版本：** v1.0  
**日期：** 2026-06-16  
**优先级：** P1  
**背景：** 当前 /admin 页面仅有「查询用户/修正VIP/创建订阅」三个手动操作 Tab，缺乏全局用户数据概览和列表管理能力，日常运营需要逐个查邮箱效率极低。

---

## 一、目标

给管理员一个完整的用户管理列表页，支持查看所有用户、筛选VIP状态、搜索、以及直接对用户进行常见操作（创建/延期订阅），不需要跳出页面逐个查询。

---

## 二、新增 Tab：用户列表

在现有三个 Tab 前面增加第一个 Tab：**「用户列表」**

Tab 顺序变更为：
1. 👥 用户列表（新增）
2. 🔍 查询用户（保留）
3. 🔧 修正 VIP（保留）
4. ➕ 创建订阅（保留）

---

## 三、用户列表页功能规格

### 3.1 顶部统计卡片（4个）

横排展示，数据从后端实时拉取：

| 卡片 | 数据字段 | 说明 |
|------|--------|------|
| 总用户数 | User 表 count | 全量 |
| VIP 用户数 | Subscription 表 status=active + expireAt > now | 当前有效 VIP |
| 今日新增 | User.createdAt >= 今日 00:00 (UTC+8) | |
| 本月收入 | Order 表 status=paid + paidAt 在本月 | 单位 USD，金额/100 |

### 3.2 筛选栏

一行排列：

- **搜索框**：placeholder「搜索邮箱或昵称...」，输入 debounce 300ms 触发过滤
- **VIP 状态筛选**：全部 / 仅VIP / 非VIP（三个 pill 按钮）
- **排序**：注册时间倒序（默认）/ 注册时间正序 / 最近活跃（最近有订单）

### 3.3 用户列表表格

分页显示，每页 20 条。

**表格列：**

| 列名 | 数据来源 | 说明 |
|------|--------|------|
| 用户 | email + nickname（如有） | email 为主，nickname 为副 |
| 注册时间 | User.createdAt | 格式 YYYY-MM-DD |
| VIP 状态 | Subscription 最新一条 | 绿色「VIP」徽章 或 灰色「免费」|
| 套餐 | Subscription.plan | daily / yearly / lifetime 对应色彩徽章 |
| 到期时间 | Subscription.expireAt | 已过期显示红色 |
| 操作 | — | 「详情」按钮 |

**行交互：**
- 点击「详情」：在当前页面右侧滑出侧边抽屉（drawer），内容复用现有「查询用户」Tab 的展示结果（用户信息 + 订阅记录 + 订单记录）
- 抽屉内可直接点击「修正VIP」或「创建订阅」按钮，弹出确认 Modal 完成操作，不需要切换 Tab

**空状态：** 搜索无结果时显示「未找到匹配用户」

### 3.4 分页控件

显示「共 N 条 / 第 X 页 / 共 Y 页」，上一页 / 下一页按钮。

---

## 四、新增后端 API

### 4.1 GET `/api/admin/users`

**权限：** isAdminEmail 验证，同现有 admin API

**Query 参数：**

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| page | number | 1 | 当前页 |
| pageSize | number | 20 | 每页条数，最大50 |
| search | string | — | 模糊匹配 email 或 nickname（contains，大小写不敏感） |
| vipFilter | `all` \| `vip` \| `free` | `all` | VIP状态筛选 |
| sort | `newest` \| `oldest` \| `active` | `newest` | 排序方式 |

**返回数据结构：**

```json
{
  "users": [
    {
      "id": "...",
      "email": "user@example.com",
      "nickname": "昵称（可空）",
      "createdAt": "2026-01-01T00:00:00Z",
      "isVip": true,
      "latestSubscription": {
        "plan": "yearly",
        "status": "active",
        "expireAt": "2027-01-01T00:00:00Z"
      }
    }
  ],
  "total": 1234,
  "page": 1,
  "pageSize": 20
}
```

**实现要点：**
- 用 Prisma `include` 关联查询 subscriptions（取最新一条）
- vipFilter=vip 时：where 条件加 `subscriptions.some({ status: 'active', expireAt: { gt: new Date() } })`
- sort=active 时：orderBy `orders.some` 最新 paidAt（可用 `_max` 聚合或关联排序）

### 4.2 GET `/api/admin/stats`

返回顶部统计卡片数据：

```json
{
  "totalUsers": 1234,
  "vipUsers": 89,
  "newUsersToday": 5,
  "monthRevenue": 1280.00
}
```

---

## 五、技术要求

1. **统一复用现有组件**：planBadge 函数、订阅/订单表格样式直接沿用 admin/page.tsx 现有代码
2. **加载状态**：列表拉取时显示 skeleton 占位行（5行），不要 spinner 遮罩
3. **错误处理**：API 失败时显示行内错误提示，不弹 alert
4. **权限**：所有新 API 均需 isAdminEmail 验证，未通过返回 403
5. **性能**：用户列表 API 需加索引；User 表如没有 `createdAt` 索引需在 schema 加 `@@index([createdAt])`
6. **不需要**：不需要删除用户功能，不需要编辑用户邮箱，不需要导出 CSV（后续再说）

---

## 六、UI 风格

延续现有 admin 页面风格：
- 背景色 #FAF9F6（暖米白）
- 主操作按钮 amber-500
- 表格行 hover 显示 bg-gray-50
- 徽章颜色沿用现有 planBadge 函数
- 侧边抽屉从右侧滑入，宽度 480px，有遮罩层，点击遮罩关闭

---

## 七、验收标准

1. /admin 登录后默认显示「用户列表」Tab
2. 4个统计卡片数字正确（可与数据库直接 count 对比）
3. 搜索邮箱关键词可过滤出对应用户
4. VIP 筛选「仅VIP」只显示当前有效订阅用户
5. 点击「详情」抽屉正确展示该用户的订阅+订单记录
6. 分页功能正常，20条/页
7. 现有三个 Tab 功能不受影响
