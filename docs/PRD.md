# 赛博命理师 (CyberFate) 产品需求文档

> **产品名称**: 赛博命理师 / CyberFate
> **版本**: MVP v1.0
> **作者**: 产品虾 🦐
> **创建日期**: 2026-03-06
> **状态**: 开发中

---

## 一、产品概述

### 1.1 产品定位
赛博命理师是一款 **AI 驱动的东方命理分析网站**，融合传统命理学与现代人工智能技术，为用户提供科学、理性、有参考价值的命理分析服务。

### 1.2 产品愿景
让每个人都能便捷地了解自己的命理特征，在人生重要决策时获得有价值的参考。

### 1.3 核心价值
- **AI 智能解读**: 利用大语言模型生成个性化、易理解的命理分析
- **科学理性**: 去神秘化，以理性态度传承东方智慧
- **免费易用**: 基础功能免费，无需注册即可使用

---

## 二、目标用户

### 2.1 用户画像
| 维度 | 描述 |
|------|------|
| 年龄 | 25-40 岁 |
| 职业 | 职场人群、自由职业者、创业者 |
| 特征 | 对传统文化有兴趣但不迷信，理性思考 |
| 场景 | 面临人生选择时寻求参考，日常运势查询 |

### 2.2 用户需求
1. 快速了解自己的命盘特征
2. 查看每日运势作为参考
3. 在重要决策前获得额外视角
4. 娱乐性质的自我探索

---

## 三、功能架构

### 3.1 MVP 功能范围

```
赛博命理师
├── 首页（功能导航）
├── 账户系统 ✅ MVP
│   ├── Google 账号登录 ✅ MVP
│   ├── 邮箱密码登录 ✅ MVP
│   ├── 个人中心 ✅ MVP
│   └── 会员订阅 ✅ MVP
├── 八字分析
│   ├── 八字分析 ✅ MVP
│   ├── 八字合婚 ⏸️ V2
│   └── 每日运势 ✅ MVP
├── 紫微斗数
│   └── 紫微排盘 ⏸️ V2
├── 周易占卜
│   ├── 梅花易数 ⏸️ V2
│   └── 六爻 ⏸️ V2
├── 塔罗牌 ⏸️ V2
├── 实用工具
│   └── AI黄历 ⏸️ V2
└── 其他页面
    ├── 隐私政策 ✅ MVP
    ├── 服务条款 ✅ MVP
    └── 退款政策 ✅ MVP
```

### 3.2 MVP 核心功能

| 功能 | 优先级 | 状态 |
|------|--------|------|
| 首页（功能导航） | P0 | ✅ MVP |
| **Google 账号登录** | P0 | ✅ MVP |
| **邮箱密码登录** | P1 | ✅ MVP |
| **会员订阅** | P0 | ✅ MVP |
| **个人中心** | P1 | ✅ MVP |
| 八字分析 | P0 | ✅ MVP |
| 每日运势 | P1 | ✅ MVP |
| 隐私政策/服务条款 | P0 | ✅ MVP |

> 📄 **账户与支付详细设计**: [PRD-AUTH-PAYMENT.md](./PRD-AUTH-PAYMENT.md)

---

## 三、商业模式

### 3.1 会员体系

#### 免费用户
- 八字分析：每日 1 次 AI 解读
- 每日运势：基础版（无 AI 建议）
- 历史记录：不保存

#### VIP 会员
- 八字分析：无限次 AI 深度解读
- 每日运势：完整版 + AI 个性化建议
- 历史记录：永久保存
- 专属功能：V2 新功能优先体验

### 3.2 定价策略

| 套餐 | 定价 | 折算日均 | 定位 |
|------|------|----------|------|
| 月卡 | ¥29/月 | ¥0.97/天 | 尝鲜用户 |
| 季卡 | ¥69/季 | ¥0.77/天 | 主推套餐 |
| 年卡 | ¥199/年 | ¥0.55/天 | 忠实用户 |

### 3.3 付费触发点

| 场景 | 触发条件 | 引导方式 |
|------|----------|----------|
| 八字 AI 解读 | 免费次数用完 | 弹窗：解锁无限解读 |
| 完整运势建议 | 查看 AI 建议 | 内容遮罩 + 解锁按钮 |
| 历史记录 | 尝试查看历史 | 提示：会员专享 |

---

## 四、页面详细设计

### 4.1 首页

#### 4.1.1 页面目标
展示所有功能入口，引导用户选择感兴趣的功能。

#### 4.1.2 页面结构

**Header 区域**
- Logo: 赛博命理师
- 导航菜单:
  - 八字分析: 八字分析、八字合婚、每日运势
  - 紫微斗数: 紫微排盘
  - 周易占卜: 梅花易数、六爻
  - 塔罗牌
  - 其他功能: AI黄历
  - **订阅**: 跳转订阅页 (/pricing)
- 右侧：登录/用户头像

**Hero 区域**
- 主标题: 赛博命理师
- 副标题: AI 驱动的东方智慧分析系统
- 简介文案: 融合传统命理与现代 AI 技术，为你提供科学、理性的命理分析参考

**引言区**
- 背景：浅灰色背景 (#f8f8f8)
- 内容：卡尔·荣格名言
  ```
  除非你意识到你的潜意识，否则潜意识将主导你的
  人生，而你将其称为命运。
  
  — 卡尔·荣格
  ```
- 样式：居中对齐，优雅的字体排版

**核心理念区**
三个并列的理念卡片：

1. **AI 智能，科学解析**
   - 图标：靶心/目标图标
   - 描述：融合现代 AI 技术与传统命理智慧，通过大数据分析和机器学习，提供客观的命理解读，让玄学不再玄

2. **文化传承，理性态度**
   - 图标：灯泡图标
   - 描述：以开放理性的态度传承东方智慧，去芜存菁、不迷信、不神化，让千年命理文化以更健康的方式融入现代生活

3. **自主探索，独立思考**
   - 图标：和平/平衡图标
   - 描述：我们相信每个人都是自己命运的解读者。通过 AI 工具赋能，让每个人能独立进行命理分析，自主思考人生方向，让每一个选择都源于内心的觉察与智慧

**功能卡片区**

| 卡片 | 图标建议 | 子功能 | MVP状态 |
|------|----------|--------|---------|
| 八字分析 | 简约线条图标，避免过于花哨 | 八字分析、八字合婚、每日运势 | 部分可用 |
| 紫微斗数 | 星星/星盘图标 | 紫微排盘 | 即将上线 |
| 周易占卜 | 太极/八卦图标 | 梅花易数、六爻 | 即将上线 |
| 塔罗牌 | 卡牌图标 | 塔罗占卜 | 即将上线 |
| 实用工具 | 日历图标 | AI黄历 | 即将上线 |

**图标设计原则**：
- 使用简约线条图标（如 lucide-react 图标库）
- 避免使用 emoji 或过于花哨的图标
- 图标大小适中（w-8 h-8 或 w-10 h-10）
- 颜色统一使用主题金色（text-primary）
- 与整体赛博东方风格保持一致

**产品特色区**
- AI 智能解读
- 科学理性分析
- 免费使用

**Footer 区域**
- 功能导航列表
- 免责声明
- 版权信息
- 联系方式

#### 4.1.3 交互说明
- 点击可用功能卡片 → 跳转对应功能页
- 点击"即将上线"功能 → 显示提示"功能开发中，敬请期待"
- 导航菜单 hover 展开下拉列表

---

### 4.2 登录/注册弹窗 (Login/Register Modal)

> 2026-04-14 重写 — 对标 FateMaster 登录体验，从简陋弹窗升级为完整登录流程

#### 触发入口

| 入口 | 触发条件 | 行为 |
|------|---------|------|
| 导航栏「登录」按钮 | 未登录状态点击 | 弹出登录 Modal |
| 侧边栏「登录 / 注册」按钮 | 未登录态点击 | 弹出登录 Modal |
| 功能页付费功能锁定点击 | guest 态点击锁定功能 | 弹出登录 Modal |
| 「解锁全部功能」按钮 | guest / logged_in 点击 | logged_in 弹 Upgrade Modal (4.8)；guest 弹登录 Modal → 登录后弹 Upgrade Modal |
| API 返回 401 | 任意需要登录的接口未授权 | 自动弹出登录 Modal |

#### 弹窗容器规格

| 属性 | 值 |
|------|-----|
| 形式 | 居中 Modal（非全屏、非 Drawer） |
| 遮罩 | `bg-black/50` backdrop-blur-sm，点击遮罩关闭 |
| 宽度 | `w-full max-w-[420px]`（桌面端） |
| 圆角 | `rounded-2xl` |
| 内边距 | `p-8`（桌面）/ `p-6`（移动） |
| 背景 | `#FFFFFF` |
| 阴影 | `shadow-2xl` |
| 关闭按钮 | 右上角 ✕ 图标（20px，muted 色），点击关闭弹窗 |
| 动画 | fade-in + scale(0.95→1)，200ms ease-out |

#### 弹窗内容结构（从上到下）

```
┌─────────────────────────────────────┐
│                                     │
│         ✕                           │  ← 右上角关闭
│                                     │
│       登录 / 注册                    │  ← 标题
│  登录或创建账号以继续使用             │  ← 副标题（muted 色）
│                                     │
│  ┌───────────────────────────────┐  │
│  │  G    使用 Google 登录         │  │  ← Google OAuth 按钮
│  └───────────────────────────────┘  │
│                                     │
│  ────── 或使用邮箱登录 ──────        │  ← 分割线
│                                     │
│  邮箱                               │  ← 输入标签
│  ┌───────────────────────────────┐  │
│  │  example@example.com          │  │  ← 邮箱输入框
│  └───────────────────────────────┘  │
│                                     │
│  密码                               │  ← 输入标签
│  ┌───────────────────────────────┐  │
│  │  ••••••••                 👁   │  │  ← 密码输入框+显示切换
│  └───────────────────────────────┘  │
│  至少8个字符                         │  ← 密码提示（error 时变红）
│                            忘记密码? │  ← 右对齐链接
│                                     │
│  ☐ 我已阅读并同意 用户协议 和 隐私政策 │  ← 协议 checkbox
│                                     │
│  ┌───────────────────────────────┐  │
│  │        登录 / 注册            │  │  ← 主按钮
│  └───────────────────────────────┘  │
│                                     │
└─────────────────────────────────────┘
```

##### ① 标题区

| 元素 | 样式 |
|------|------|
| 标题 | `text-[#1C1A16] text-2xl font-semibold text-center` |
| 副标题 | `text-[#9B9590] text-sm text-center mt-2` |

文案：
- 标题：「登录 / 注册」
- 副标题：「登录或创建账号以继续使用」

##### ② Google 登录按钮

| 属性 | 值 |
|------|-----|
| 样式 | `w-full border border-[#E5E2DD] rounded-lg py-3 px-4 flex items-center justify-center gap-3 hover:bg-[#FAF9F6] transition-colors cursor-pointer` |
| 图标 | Google 官方 G Logo（彩色，20px） |
| 文字 | `text-[#1C1A16] text-sm font-medium` |
| 文案：「使用 Google 登录」 |

交互：点击 → 跳转 Google OAuth 授权 → 回调后自动关闭弹窗 → 刷新页面状态

##### ③ 分割线

```
          或使用邮箱登录
```

| 属性 | 值 |
|------|-----|
| 样式 | `flex items-center gap-4 my-6` |
| 线条 | `flex-1 h-px bg-[#E5E2DD]` |
| 文字 | `text-[#9B9590] text-xs whitespace-nowrap` |

##### ④ 邮箱输入框

| 属性 | 值 |
|------|-----|
| 标签 | `text-[#1C1A16] text-sm font-medium mb-2 block`（左对齐） |
| 文案：「邮箱」 |
| 输入框 | `w-full border border-[#E5E2DD] rounded-lg px-4 py-3 text-sm placeholder:text-[#C4C0BA] focus:outline-none focus:ring-2 focus:ring-[#1C1A16]/10 focus:border-[#1C1A16]` |
| placeholder | `example@example.com` |
| 类型 | `email`（自动触发浏览器邮箱补全） |
| autocomplete | `email` |

##### ⑤ 密码输入框

| 属性 | 值 |
|------|-----|
| 标签 | `text-[#1C1A16] text-sm font-medium mb-2 block`（左对齐） |
| 文案：「密码」 |
| 输入框 | 同邮箱输入框样式 |
| placeholder | `至少8个字符` |
| 类型 | `password`（默认隐藏） |
| autocomplete | `current-password` |
| 右侧图标 | 👁 眼睛图标（16px，muted 色），点击切换 password/text |

密码显示/隐藏切换逻辑：
- 默认 `type="password"`，显示 ••••••••
- 点击眼睛图标 → 切换为 `type="text"`，显示明文密码
- 图标联动：闭眼👁（隐藏态）↔ 睁眼👁‍🗨（显示态）

##### ⑥ 密码提示 + 忘记密码

| 元素 | 样式 | 位置 |
|------|------|------|
| 密码提示 | `text-[#C4C0BA] text-xs mt-1` | 左对齐，输入框下方 |
| 提示文案 | 「至少8个字符」（错误时变 `text-red-500`：「密码至少8个字符」） |
| 忘记密码链接 | `text-[#1C1A16] text-xs hover:underline cursor-pointer` | 右对齐，与提示同行或独立一行右对齐 |
| 链接文案 | 「忘记密码?」 |

> ⚠️ 「忘记密码?」P0 可先做 UI 占位，点击后 toast 提示「请联系客服重置密码」，P1 再接入邮件重置流程。

##### ⑦ 协议勾选

| 属性 | 值 |
|------|-----|
| 容器 | `flex items-start gap-2 mt-5` |
| Checkbox | `mt-0.5 w-4 h-4 rounded border-[#D5D0CA] text-[#1C1A16] focus:ring-[#1C1A16]/10` |
| 文字 | `text-[#6B6560] text-xs leading-relaxed` |
| 文案前缀 | 「我已阅读并同意 」 |
| 「用户协议」链接 | `text-[#1C1A16] underline hover:no-underline cursor-pointer` → 跳转 `/terms` |
| 「 和 」 | 纯文字 |
| 「隐私政策」链接 | `text-[#1C1A16] underline hover:no-underline cursor-pointer` → 跳转 `/privacy` |

交互：
- **未勾选时**：「登录 / 注册」按钮禁用（`opacity-50 pointer-events-none`），或允许点击但 shake 动画提示先勾选
- **推荐方案**：不禁止点击，提交时未勾选则 checkbox 边框闪红 + tooltip 提示

##### ⑧ 提交按钮

| 属性 | 值 |
|------|-----|
| 样式 | `w-full bg-[#1C1A16] text-white rounded-lg py-3.5 px-4 font-medium text-sm hover:bg-[#1C1A16]/90 transition-colors disabled:opacity-50` |
| 文案：「登录 / 注册」 |
| loading 态 | 文字变为 spinner + 「登录中...」，按钮 `pointer-events-none` |

提交逻辑：
1. 校验邮箱格式
2. 校验密码长度 ≥ 8
3. 校验协议已勾选
4. 调用 `/api/auth/login`（或 `/api/auth/register`）
5. 成功 → 关闭弹窗 → 刷新页面/更新登录态
6. 失败 → 对应字段下方显示错误提示（红色小字）

#### 错误状态处理

| 错误场景 | 处理方式 |
|---------|---------|
| 邮箱格式无效 | 邮箱输入框下方红字「请输入有效的邮箱地址」+ 边框变红 |
| 密码不足8位 | 密码提示变红「密码至少8个字符」+ 输入框边框变红 |
| 未勾选协议 | checkbox 闪红 + 下方红字「请先阅读并同意用户协议和隐私政策」 |
| 账号不存在 | 按钮下方红字「该邮箱尚未注册，将自动创建新账号」（或直接静默注册） |
| 密码错误 | 按钮下方红字「邮箱或密码错误」 |
| 网络错误 | 按钮下方红字「网络异常，请稍后重试」+ 重试按钮 |
| Google OAuth 失败 | toast 提示「Google 登录失败，请重试」 |

#### 移动端适配

| 断点 | 调整 |
|------|------|
| < 640px | 弹窗宽度 `w-[90%] max-w-[360px]`，内边距 `p-6` |
| < 640px | 字号整体缩小一档：标题 `text-xl`，正文 `text-sm` |
| 所有断点 | 弹窗最大高度 `max-h-[90vh]`，内容超出时弹窗本身可 scroll |

#### 组件文件

| 组件 | 路径 | 说明 |
|------|------|------|
| AuthModal | components/auth/AuthModal.tsx | 登录/注册弹窗主组件 |
| GoogleLoginButton | components/auth/GoogleLoginButton.tsx | Google OAuth 按钮 |
| EmailLoginForm | components/auth/EmailLoginForm.tsx | 邮箱密码表单 |

#### 开发优先级：P0

登录转化是商业化关键路径，与侧边栏三态逻辑同步开发。

---

### 4.3 邮箱验证码流程 (Email Verification)

> 2026-04-15 新增 — 非 Google OAuth 用户注册时需验证邮箱真实性

#### 功能概述

**目标**：非 Google OAuth 用户通过邮箱密码注册/登录时，系统发送验证码到用户邮箱，验证邮箱真实性后才完成注册流程。

**为什么需要**：
- 防虚假注册（防止用不存在的邮箱批量薅免费额度）
- 后续运营基础（验证过的邮箱才能接收营销邮件）
- 账号安全（密码重置、账号变更依赖已验证邮箱）

**范围界定**：
- **覆盖**：注册时的邮箱验证码验证
- **不在本次范围**：密码重置邮件（P1）、邮箱变更验证（P1）、营销邮件发送（P2）

#### 用户流程

**完整注册流程（含验证码）**：

```
用户点击「登录」→ 弹出 AuthModal
    → 输入邮箱 + 密码 + 勾选协议
    → 点击「登录 / 注册」
        ↓
    判断：该邮箱是否已注册且已验证？
             │
      已注册+已验证     未注册 / 未验证
             │              │
             ▼              ▼
      正常登录流程    进入邮箱验证步骤
    （校验密码即可）
```

**触发条件**（以下任一情况进入验证码流程）：
1. 邮箱在数据库中不存在（新注册）
2. 邮箱存在但 `email_verified: false`（之前注册但未完成验证）

**验证步骤**：

| Step | 动作 | 说明 |
|------|------|------|
| 1 | 发送验证码 | 前端调用 `POST /api/auth/send-code`，后端生成 6 位数字验证码并发送到用户邮箱 |
| 2 | 弹窗切换为验证码输入态 | AuthModal 内容区从「表单态」→「验证码态」 |
| 3 | 用户输入 6 位验证码 | 6 个独立输入框，自动跳转下一格，支持粘贴自动填充全部 6 位 |
| 4 | 提交验证 | 前端调用 `POST /api/auth/verify-code`，成功则完成注册/标记已验证/自动登录/关闭弹窗 |

**状态转换图**：

```
[AuthModal 表单态]
       │
       │ 用户填好邮箱+密码+协议，点提交
       ▼
  [后端判断邮箱状态]
       │
   ┌───┴───┐
   │       │
 已存在   不存在/未验证
 且已验证     │
   │         │
   ▼         ▼
 正常登录  返回 { need_verification: true }
 (校验密码)      │
   │         ▼
   │   [AuthModal 切换为验证码态]
   │         │
   │     用户输入6位验证码
   │         │
   │         ▼
   │   POST /api/auth/verify-code
   │         │
   │    ┌────┴────┐
   │    │         │
   │   成功      失败
   │    │         │
   │    ▼         ▼
   │  完成注册  显示错误
   │  自动登录  可重发
   │  关闭弹窗
   │
   ▼
 [登录成功]
```

#### 验证码态 UI 设计

**弹窗内容结构（验证码态）**：

```
┌─────────────────────────────────────┐
│                                     │
│         ✕                           │
│                                     │
│     验证您的邮箱                      │  ← 标题
│  我们已发送6位验证码至：               │
│  f***k@gmail.com                    │  ← 脱敏邮箱显示
│                                     │
│  ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐│
│  │   │ │   │ │   │ │   │ │   │ │   ││  ← 6位验证码输入框
│  └───┘ └───┘ └───┘ └───┘ └───┘ └───┘│
│                                     │
│  验证码错误或过期?                   │  ← 错误提示区（默认隐藏）
│                                     │
│  没有收到？                          │
│  59秒后可重新发送                     │  ← 重发倒计时
│  或 重新发送验证码                    │  ← 倒计时结束后显示链接
│                                     │
│  ┌───────────────────────────────┐  │
│  │          完成                 │  │  ← 提交按钮（6位全填才启用）
│  └───────────────────────────────┘  │
│                                     │
│  ← 返回修改邮箱                      │  ← 返回按钮（次要）
└─────────────────────────────────────┘
```

**各元素详细规格**：

##### ① 标题区

| 元素 | 样式 |
|------|------|
| 标题 | `text-[#1C1A16] text-xl font-semibold text-center` |
| 文案：「验证您的邮箱」 |
| 邮箱提示 | `text-[#6B6560] text-sm text-center mt-2` |
| 邮箱文案 | 「我们已发送 6 位验证码至：」+ 脱敏邮箱 |

**脱敏规则**：保留首字符和 @ 域名，中间用 `***` 替换
- `frank@example.com` → `f***k@example.com`
- `a@b.com` → `a@b.com`（太短不脱敏）

##### ② 验证码输入框（6位）

| 属性 | 值 |
|------|-----|
| 容器 | `flex justify-between gap-2 w-full` |
| 单格宽度 | `w-12 h-14`（桌面）/ `w-10 h-12`（移动） |
| 单格样式 | `border border-[#E5E2DD] rounded-lg text-center text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-[#1C1A16]/10 focus:border-[#1C1A16]` |
| 已填写态 | `border-[#1C1A16] bg-[#FAF9F6]` |
| 错误态 | `border-red-500 bg-red-50` |
| 最大长度 | 每格 1 个字符 |

**交互行为**：

| 行为 | 说明 |
|------|------|
| 输入 | 输入 1 位后自动 focus 到下一格 |
| 删除 | Backspace 删除当前格内容并 focus 到上一格 |
| 粘贴 | Ctrl+V / Cmd+V 粘贴时，自动按顺序填充 6 格（支持纯数字粘贴） |
| 只允许输入 | 数字 0-9（`inputmode="numeric" pattern="[0-9]*"`） |
| 全部填满 | 不自动提交，等用户点「完成」（用户可能输错想修改） |

##### ③ 错误提示

| 场景 | 文案 | 位置 | 样式 |
|------|------|------|------|
| 验证码错误 | 「验证码错误，请重新输入」 | 输入框下方 | `text-red-500 text-xs mt-2 text-center` |
| 验证码过期 | 「验证码已过期，请重新发送」 | 同上 | 同上 |
| 发送失败 | 「发送失败，请稍后重试」 | 同上 | 同上 |
| 请求过多 | 「操作过于频繁，请稍后再试」 | 同上 | 同上 |

错误时：6 个输入框统一变红 + shake 动画（左右抖动 300ms）

##### ④ 重发倒计时

| 属性 | 值 |
|------|-----|
| 容器 | `text-center mt-4` |
| 倒计时文案 | `text-[#9B9590] text-sm`：「XX 秒后可重新发送」 |
| 可重发文案 | `text-[#1C1A16] text-sm underline cursor-pointer hover:no-underline`：「重新发送验证码」 |
| 倒计时时长 | **60 秒** |
| 最大重发次数 | **5 次 / 小时**（服务端限制） |

交互：点击「重新发送验证码」→ 重新调用 send-code API → 倒计时归零重新开始 → 清空已输入的验证码

##### ⑤ 提交按钮

| 属性 | 值 |
|------|-----|
| 样式 | `w-full bg-[#1C1A16] text-white rounded-lg py-3.5 px-4 font-medium text-sm hover:bg-[#1C1A16]/90 transition-colors` |
| 文案：「完成」 |
| 启用条件 | 6 位验证码全部填写 |
| 未填满态 | `opacity-50 pointer-events-none` |
| loading 态 | spinner + 「验证中...」 |

##### ⑥ 返回按钮

| 属性 | 值 |
|------|-----|
| 样式 | `text-[#9B9590] text-sm text-center mt-4 cursor-pointer hover:text-[#1C1A16]` |
| 文案：「← 返回修改邮箱」 |
| 行为 | 点击回到表单态（保留已输入的邮箱和密码） |

#### 与现有登录弹窗的合并方案

**架构方案：AuthModal 内 State Machine**

推荐用内部状态机管理弹窗的两个视图，而非新建独立 Modal 组件。

```
AuthModal (主组件)
│
├── state: 'form' | 'verifying'
│
├── state === 'form' 时渲染:
│   ├── 标题区
│   ├── GoogleLoginButton
│   ├── 分割线
│   └── EmailLoginForm (邮箱+密码+协议+提交)
│
└── state === 'verifying' 时渲染:
    ├── 标题区（验证您的邮箱）
    ├── 脱敏邮箱显示
    ├── VerificationCodeInput (6位输入)
    ├── 错误提示
    ├── 重发倒计时
    ├── 完成按钮
    └── 返回按钮
```

**状态转换逻辑（伪代码参考）**：

```typescript
type AuthModalState = 'form' | 'verifying';

const [state, setState] = useState<AuthModalState>('form');
const [pendingEmail, setPendingEmail] = useState('');
const [pendingPassword, setPendingPassword] = useState('');

// EmailLoginForm 提交回调
const handleEmailSubmit = async (email: string, password: string) => {
  setPendingEmail(email);
  setPendingPassword(password);

  const res = await fetch('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  });

  const data = await res.json();

  if (data.need_verification) {
    // 新注册或未验证 → 切换到验证码态
    setState('verifying');
  } else if (data.ok) {
    // 已验证的老用户 → 正常登录成功
    onClose();
    router.refresh();
  } else {
    setError(data.error);
  }
};

// 验证码提交回调
const handleVerifyCode = async (code: string) => {
  const res = await fetch('/api/auth/verify-code', {
    method: 'POST',
    body: JSON.stringify({
      email: pendingEmail,
      code,
      password: pendingPassword
    })
  });

  const data = await res.json();

  if (data.ok) {
    onClose();
    router.refresh();
  } else {
    setCodeError(data.error);
  }
};
```

#### API 设计

##### 发送验证码

```
POST /api/auth/send-code

Request:
{
  "email": "user@example.com",
  "purpose": "registration"  // 未来可扩展: "reset_password", "change_email"
}

Response (200):
{
  "ok": true,
  "expires_in": 300  // 验证码有效秒数
}

Response (429):
{
  "error": "发送过于频繁，请XX秒后再试"
}

Response (400):
{
  "error": "请输入有效的邮箱地址"
}
```

##### 验证验证码

```
POST /api/auth/verify-code

Request:
{
  "email": "user@example.com",
  "code": "123456",
  "password": "user-password"  // 注册时传入，已完成验证的老用户可不传
}

Response (200):
{
  "ok": true,
  "token": "jwt-token-here",   // 注册成功直接返回登录 token
  "user": { "id": "...", "email": "...", "plan": "free" }
}

Response (400):
{
  "error": "verification_code_invalid"
}
```

##### 修改现有 Login API 返回值

现有的 `/api/auth/login` 需要增加一种返回状态：

```
POST /api/auth/login (修改)

新增返回情况 (200):
{
  "ok": true,
  "need_verification": true,
  "message": "邮箱验证码已发送"
}

含义：邮箱存在但未验证，或邮箱不存在将自动创建（需要先验邮箱）
前端收到此响应后，切换到 verifying 态
```

#### 组件文件清单（新增/修改）

| 操作 | 组件 | 路径 | 说明 |
|------|------|------|------|
| 修改 | AuthModal | components/auth/AuthModal.tsx | 加入 state machine，支持 form/verifying 切换 |
| 新增 | VerificationCodeInput | components/auth/VerificationCodeInput.tsx | 6 位验证码输入组件 |
| 修改 | EmailLoginForm | components/auth/EmailLoginForm.tsx | 提交回调改为通知父组件而非自己处理成功 |
| 新增 | CountdownTimer | components/auth/CountdownTimer.tsx | 重发倒计时组件（可复用） |
| 新增 API | app/api/auth/send-code/route.ts | 发送验证码 |
| 新增 API | app/api/auth/verify-code/route.ts | 验证验证码并完成注册 |
| 修改 API | app/api/auth/login/route.ts | 增加 need_verification 返回状态 |

#### 邮件模板设计

**主题**：`【CyberFate】您的验证码是 ${code}`

**正文（HTML 邮件）**：

```
┌──────────────────────────────────────────┐
│                                          │
│     🌙 CyberFate                         │  ← Logo + 品牌名
│                                          │
│  ─────────────────────────────────────   │
│                                          │
│  您正在注册 CyberFate 账号                │
│                                          │
│  您的验证码是：                           │
│                                          │
│  ╔═══════════════════════════════╗       │
│  ║                               ║       │
│  ║          4 8 2 7 2 9          ║       │  ← 6位大字
│  ║                               ║       │
│  ╚═══════════════════════════════╝       │
│                                          │
│  有效期 5 分钟                            │
│                                          │
│  如果这不是您的操作，请忽略此邮件。         │
│                                          │
│  ─────────────────────────────────────   │
│                                          │
│  此邮件由系统自动发送，请勿回复。           │
│                                          │
│  CyberFate — 探索命运的另一种方式           │
│                                          │
└──────────────────────────────────────────┘
```

**邮件风格规范**：
- 背景：`#FAF9F6`（与网站 Design Tokens 一致）
- 主色：`#1C1A16`
- 强调色：用于验证码数字，大号等宽字体（`font-family: monospace; font-size: 32px; letter-spacing: 8px`）
- 无外部图片依赖（保证邮件客户端兼容性）
- 纯 HTML + 内联 CSS（不支持外链样式表）

#### 安全策略

**验证码生成**：

| 项目 | 规则 |
|------|------|
| 格式 | 6 位纯数字 |
| 有效期 | **5 分钟**（300 秒） |
| 生成方式 | 加密安全的随机数生成器（crypto.randomInt） |
| 前端不可预测 | 后端生成，永远不返回给前端明文 |

**防滥用限制**：

| 限制项 | 阈值 |
|--------|------|
| 同一邮箱发送频率 | 60 秒 1 次 |
| 同一 IP 每小时发送次数 | 10 次 |
| 同一邮箱每天发送次数 | 20 次 |
| 同一邮箱验证尝试次数 | 10 次（超过锁定 15 分钟） |
| 验证码错误后是否失效 | **是**，错 3 次后当前验证码作废需重新发送 |

**存储**：

| 项目 | 方案 |
|------|------|
| 验证码存储 | Redis（生产）/ 内存 Map（开发） |
| key 格式 | `verify_code:{email}` |
| value | HMAC-SHA256(code) + 过期时间戳 |
| 不过期自动清理 | Redis TTL = 300s |

#### 边界情况 & 错误处理

| 场景 | 处理 |
|------|------|
| 用户关闭验证码弹窗后重新打开 | 如果未超时且未验证，恢复到 verifying 态；否则回到 form 态 |
| 验证码输入中途用户切走再回来 | localStorage 不保存验证码状态（安全考虑）；回来看到空输入框 |
| 用户已有账号但 email_verified=false | 走验证码流程，验证通过后标记 verified，不重复创建账号 |
| Google OAuth 用户 | 跳过验证码（Google 已验证邮箱） |
| 邮箱是临时邮箱/一次性邮箱 | 服务端做基础域名黑名单检查（可选 P1） |
| 用户多次输错验证码 | 第 3 次错误后当前验证码失效，提示"验证码已失效请重新发送" |
| 网络慢导致重复点击发送 | 前端 loading 态防重复 + 服务端频率限制兜底 |
| 验证码邮件进垃圾箱 | UI 提示"检查垃圾邮件文件夹"，加白名单指引 |

#### 对 4.2 节的修改点汇总

以下是对 4.2 登录/注册弹窗节需要同步修改的位置：

**① 弹窗内容结构 — 新增视图 C**

在当前的表单态（视图 B）之后新增第 3 种视图形态：

> 视图 C：验证码态（verifying state）— 仅在邮箱需要验证时显示，替换视图 B 的全部内容，但保持弹窗容器不变。详细规格见本节「验证码态 UI 设计」。

**② 修改提交逻辑**

原 4.2 第 ⑧ 小节「提交逻辑」第 4-5 步改为：

```
4. 调用 POST /api/auth/login
5. 判断响应：
   - { ok: true, token: "..." } → 已验证老用户 → 关闭弹窗 → 刷新页面
   - { need_verification: true } → 新用户/未验证 → 切换到验证码态
   - { error: "..." } → 显示错误提示
6. （仅在验证码态）用户输入验证码 → 调用 verify-code → 成功后关闭弹窗
```

**③ 错误状态处理表追加**

| 错误场景 | 处理方式 |
|---------|---------|
| 验证码错误 | 验证码输入框全部标红 + shake + "验证码错误，请重新输入" |
| 验证码过期 | "验证码已过期，请重新发送" + 清空输入框 |
| 发送频繁 | "发送过于频繁，请 XX 秒后再试" |
| 邮件发送失败 | toast "验证码发送失败，请稍后重试" |

**④ 组件文件表追加**

| 组件 | 路径 | 说明 |
|------|------|------|
| VerificationCodeInput | components/auth/VerificationCodeInput.tsx | 6 位验证码输入 |
| CountdownTimer | components/auth/CountdownTimer.tsx | 重发倒计时 |

#### 技术选型建议

**邮件发送服务对比**：

| 方案 | 优点 | 缺点 | 推荐度 |
|------|------|------|--------|
| **Resend** | 开发者友好、API 简单、免费额度够 MVP | 国内送达率一般 | ⭐⭐⭐ **首选** |
| Nodemailer + SMTP | 完全控制、成本低 | 需要自己配 SMTP（AWS SES/Gmail） | ⭐⭐ 备选 |
| SendGrid | 成熟稳定、送达率高 | 免费额度少、配置复杂 | ⭐⭐ 备选 |
| Mailgun | 好 | 偏贵 | ⭐ 不推荐 |

**建议用 Resend**：免费额度 3000 封/月够 MVP，API 极简，Next.js 官方有集成示例，Vercel 部署零配置。

#### 开发优先级

**P0 — MVP 必须有**：

| # | 任务 | 说明 |
|---|------|------|
| 1 | send-code API | 生成验证码 + 发送邮件 |
| 2 | verify-code API | 校验验证码 + 完成注册/登录 |
| 3 | VerificationCodeInput 组件 | 6 位输入框 + 自动跳转 + 粘贴 |
| 4 | AuthModal state machine | form ↔ verifying 切换 |
| 5 | CountdownTimer | 60 秒重发倒计时 |
| 6 | 邮件 HTML 模板 | 验证码邮件 |
| 7 | login API 增加 need_verification 返回 | 状态判断入口 |
| 8 | 基础安全限制 | 频率限制 + 有效期 + 错误次数限制 |

**P1 — 上线后尽快补**：

| # | 任务 | 说明 |
|---|------|------|
| 9 | 验证码输入满 6 位高亮提交按钮 | 交互优化 |
| 10 | 进度条动画（倒计时可视化） | 体验优化 |
| 11 | 邮箱域名黑名单 | 拦截临时邮箱 |
| 12 | Resend/AWS SES 邮件送达率监控 | 运营可见 |
| 13 | 已验证/未验证标识在个人中心展示 | 让用户知道自己的状态 |

**P2 — 未来迭代**：

| # | 任务 | 说明 |
|---|------|------|
| 14 | 忘记密码 → 邮箱重置验证码 | 复用验证码基础设施 |
| 15 | 变更邮箱 → 双邮箱验证（旧邮箱+新邮箱） | 安全升级 |
| 16 | 魔法链接（Magic Link）登录 | 替代密码+验证码方案 |

#### 验收标准 Checklist

**功能验收**：

- [ ] 新用户邮箱注册 → 收到验证码邮件（检查垃圾箱）
- [ ] 输入正确验证码 → 自动注册并登录成功
- [ ] 输入错误验证码 → 显示错误提示 + 输入框标红
- [ ] 验证码 5 分钟后过期 → 提示过期，需重新发送
- [ ] 60 秒内不能重复发送 → 倒计时正常工作
- [ ] 60 秒后可重发 → 重新收到新验证码（旧码立即失效）
- [ ] 已注册且已验证的老用户 → 直接登录，不走验证码
- [ ] Google OAuth 登录 → 完全跳过验证码流程
- [ ] 粘贴 6 位数字 → 自动填充全部输入框
- [ ] 输入 1 位自动跳下一格，Backspace 返回上一格
- [ ] 点击"返回修改邮箱" → 回到表单态，数据保留

**安全验收**：

- [ ] 同一邮箱 60 秒内只能发 1 次
- [ ] 验证码错 3 次后当前码失效
- [ ] 验证码为 6 位纯数字（无字母特殊字符）
- [ ] 邮件中验证码清晰可读（大字号等宽）
- [ ] 邮件包含"非本人操作请忽略"提示

**UI/UX 验收**：

- [ ] 验证码态弹窗尺寸与表单态一致（不闪烁跳动）
- [ ] 脱敏邮箱显示正确（f***k@example.com）
- [ ] 6 个输入框间距均匀、对齐整齐
- [ ] focus 态边框高亮明显
- [ ] 错误态 shake 动画流畅
- [ ] 移动端 6 格输入框不溢出屏幕
- [ ] 中英文界面均显示正常

---

### 4.4 个人中心页 (/profile)

#### 页面结构
- 用户信息：头像、邮箱
- 会员状态卡片：
  - 免费用户：显示今日剩余次数 + 升级按钮
  - VIP 用户：显示有效期 + 续费按钮
- 我的记录：八字分析记录、每日运势记录
- 账户设置：修改密码、退出登录

---

### 4.7 订阅页 (/pricing)

#### 页面结构
- 会员权益对比表（免费 vs VIP）
- 套餐选择卡片（月卡/季卡/年卡）
- 立即开通按钮
- 支付方式：Stripe / 支付宝

#### 交互说明
- 默认选中季卡（主推）
- 点击开通 → 检查登录 → 选择支付方式 → 完成支付

---

### 4.8 解锁全部功能弹窗 (Upgrade Modal)

> 2026-04-15 新增 — 复用 /pricing 页面功能，以弹窗形式呈现订阅选择

#### 设计目标

用户在侧边栏或功能锁定态点击「解锁全部功能」时，不跳转页面，直接弹出定价选择弹窗。降低转化摩擦（少一次页面跳转 = 少一次流失机会）。

#### 触发入口

| 入口 | 触发条件 | 行为 |
|------|---------|------|
| 侧边栏「解锁全部功能」 | guest 态点击 | 先弹登录 Modal（4.2），登录完成后再弹本 Modal |
| 侧边栏「解锁全部功能」 | logged_in（未订阅）态点击 | **直接弹出本 Modal** |
| 功能列表锁定项点击 | guest 态点击 🔒 功能 | 先弹登录 Modal |
| 功能列表锁定项点击 | logged_in（未订阅）态点击 | **直接弹出本 Modal** |
| 定价页 CTA | 用户主动访问 `/pricing` | **不走弹窗**，正常展示完整定价页（含 FAQ、权益对比表等补充信息） |

> 核心原则：**用户主动访问 `/pricing` 时展示完整页面；被动触发时用弹窗快速转化。**

#### 弹窗容器规格

| 属性 | 值 |
|------|-----|
| 形式 | 居中 Modal |
| 遮罩 | `bg-black/50` backdrop-blur-sm，点击遮罩关闭 |
| 宽度 | `w-full max-w-[900px]`（桌面端，比登录 Modal 更宽） |
| 圆角 | `rounded-2xl` |
| 内边距 | `p-0`（内容区自带 padding） |
| 背景 | `#FFFFFF` |
| 阴影 | `shadow-2xl` |
| 关闭按钮 | 右上角 ✕ 图标（20px，muted 色），点击关闭弹窗 |
| 动画 | fade-in + scale(0.95→1)，200ms ease-out |
| 最大高度 | `max-h-[90vh]`，内容超出时内部 scroll |

#### 弹窗内容结构（从上到下）

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│           ✕                                        │  ← 关闭按钮
│                                                     │
│        解锁全部功能                                  │  ← 标题
│  选择适合您的计划，开启完整体验                       │  ← 副标题
│                                                     │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐            │
│  │  基础版   │ │  专业版   │ │  尊享版   │            │
│  │          │ │ ★ 最受欢迎│ │          │            │
│  │          │ │          │ │          │            │
│  │   ¥29    │ │   ¥69    │ │   ¥199   │            │
│  │  /月     │ │  /季     │ │  /年     │            │
│  │          │ │          │ │          │            │
│  │ [开始使用]│ │ [立即开通]│ │ [开始使用]│            │
│  └──────────┘ └──────────┘ └──────────┘            │
│                                                     │
│  「查看完整权益对比 →」                               │  ← 链接到 /pricing
│                                                     │
└─────────────────────────────────────────────────────┘
```

##### ① 标题区

| 元素 | 样式 |
|------|------|
| 标题 | `text-[#1C1A16] text-2xl font-semibold text-center pt-8 px-8` |
| 副标题 | `text-[#9B9590] text-sm text-center mt-2 pb-4` |

文案：
- 标题：「解锁全部功能」
- 副标题：「选择适合您的计划，开启完整体验」

##### ② 三列套餐卡片（核心：复用 pricing 页组件）

**布局**: `flex flex-col lg:flex-row gap-5 max-w-[800px] mx-auto px-8`

卡片内容与 `/pricing` 页面 **完全一致**，复用同一套组件/数据源：

**基础版（月卡）**
| 属性 | 值 |
|------|-----|
| 名称 | 「基础版」 |
| 价格 | `¥29` + `/月` |
| 折算日均 | `约 ¥0.97/天`（小字 muted） |
| 容器样式 | `bg-white border border-[#E5E2DD] rounded-xl p-6 flex flex-col` |
| 权益列表 | 复用 pricing 页权益数据（见下方） |
| CTA 按钮 | `w-full border border-[#1C1A16] text-[#1C1A16] rounded-lg py-3 font-medium text-sm hover:bg-[#1C1A16]/5` |
| CTA 文案 | 「开始使用」 |

**专业版（季卡）— 推荐**
| 属性 | 值 |
|------|-----|
| 名称 | 「专业版」 |
| 价格 | `¥69` + `/季` |
| 折算日均 | `约 ¥0.77/天` |
| 容器样式 | `bg-white border-2 border-[#1C1A16] rounded-xl p-6 flex flex-col transform lg:scale-[1.03] shadow-lg relative` |
| 推荐标签 | 顶部居中 `bg-[#1C1A16] text-white text-xs px-3 py-1 rounded-full -mt-3 absolute top-0 left-1/2 -translate-x-1/2`，文案「★ 最受欢迎」 |
| 权益 check | 绿色 ✅（`#10B981`） |
| CTA 按钮 | `w-full bg-[#1C1A16] text-white rounded-lg py-3 font-medium text-sm hover:bg-[#1C1A16]/90` |
| CTA 文案 | 「立即开通」 |

**尊享版（年卡）**
| 属性 | 值 |
|------|-----|
| 名称 | 「尊享版」 |
| 价格 | `¥199` + `/年` |
| 折算日均 | `约 ¥0.55/天` |
| 容器样式 | 同基础版 |
| CTA 文案 | 「开始使用」 |

##### ③ 权益列表（三列卡片共用数据源）

每张卡片内的权益项（与 /pricing 页面权益对比表一致）：

| 权益 | 免费用户 | 付费会员 |
|------|---------|---------|
| 八字分析 | 每日 1 次 | 无限次 |
| 每日运势 | 基础版 | AI 完整解读 |
| 合婚分析 | ❌ | 无限次 |
| 梅花易数 | ❌ | 无限次 |
| 塔罗占卜 | 每日 3 次 | 无限次 |
| 六爻占卜 | ❌ | 无限次 |
| 紫微排盘 | ❌ | 无限次 |
| AI 黄历 | ❌ | 无限次 |
| 历史记录 | 7 天 | 永久保存 |
| AI 解读深度 | 基础 | 深度解读 |

卡片内渲染格式：
```
  ✓ 八字分析（无限次）
  ✓ 每日运势（AI 完整解读）
  ✓ 合婚分析
  ...
```
未包含的权益显示为 `+ 更多权益` 或省略号，引导点击「查看完整权益对比」

##### ④ 底部链接

| 元素 | 样式 |
|------|------|
| 容器 | `text-center py-6 border-t border-[#F0EDE8]` |
| 链接 | `text-[#6B6560] text-sm hover:text-[#1C1A16] cursor-pointer inline-flex items-center gap-1` |
| 文案 | 「查看完整权益对比 →」 |
| 点击行为 | 关闭弹窗 + 跳转 `/pricing`（或直接 `window.location.href = '/pricing'`） |

#### 点击 CTA 按钮后的流程

```
用户点击「立即开通」（任意套餐）
       ↓
检查登录状态
       ↓
    ┌─ 未登录 ──→ 弹出登录 Modal (4.2)
    │              ↓
    │         登录成功后重新弹出 Upgrade Modal
    │
    └─ 已登录 ─→ 调用支付接口
                   ↓
           Stripe Checkout Session
           或 支付宝支付页
```

> ⚠️ **关键交互**：未登录用户点 CTA → 弹登录 → 登录成功后 **自动回到 Upgrade Modal**（不要跳去 pricing 页）。这需要传 `?redirect=upgrade` 或类似参数给登录回调。

#### 与 /pricing 页面的关系

| 维度 | Upgrade Modal | /pricing 页面 |
|------|--------------|---------------|
| 触发方式 | 被动（点击解锁/CTA） | 主动（导航/链接） |
| 内容 | 三列卡片 + 简化权益 | 三列卡片 + 完整权益对比表 + FAQ + Footer |
| 宽度 | max-w-[900px] 弹窗 | 全宽页面 |
| 组件复用 | 复用 PricingCard 组件 | PricingCard 完整版 |
| 适用场景 | 快速转化 | 了解详情后决策 |

#### 移动端适配

| 断点 | 调整 |
|------|------|
| < 768px | 弹窗宽度 `w-[95%] max-w-[none]` |
| < 768px | 三列卡片改为 **垂直堆叠**（`flex-col`），不再横排 |
| < 768px | 卡片内 padding 缩小为 `p-5` |
| 所有断点 | 弹窗 `max-h-[95vh]`，内部 `overflow-y-auto` |

#### 组件文件

| 组件 | 路径 | 说明 |
|------|------|------|
| UpgradeModal | components/pricing/UpgradeModal.tsx | 解锁弹窗主组件 |
| PricingCard | components/pricing/PricingCard.tsx | 单个套餐卡片（**与 /pricing 页共用**） |
| PricingCardList | components/pricing/PricingCardList.tsx | 三列卡片容器（**与 /pricing 页共用**） |

> ⚠️ **组件复用是硬性要求**：PricingCard 和 PricingCardList 必须是同一套组件，Upgrade Modal 和 /pricing 页面都引用它。不允许维护两份重复代码。

#### 开发优先级：P0

与侧边栏三态逻辑（7.1.8 补充）、登录弹窗改造（4.2）同步开发，三者构成完整的 登录→解锁→订阅 转化链路。

---

### 4.5 八字分析页

#### 4.5.1 页面目标
收集用户出生信息，计算八字并生成 AI 解读报告。

#### 4.5.2 页面结构

**页面标题**
- 使用简约线条图标（避免 emoji）
- 标题：八字分析
- 副标题：输入出生信息，AI 为你解读命理

**输入表单区**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| 姓名 | 文本输入 | 否 | 用于称呼，不影响计算 |
| 性别 | 下拉选择 | 是 | 男/女，影响大运方向 |
| 出生日期 | 日期选择器 | 是 | 默认阳历，可切换农历(V2) |
| 出生时间 | 下拉选择 | 否 | 时辰选择，可选"不知道" |

**表单 UI 规范**：
- 标签格式：主标签 + 灰色小字"（选填）"，避免使用括号
- 输入框：简洁设计，不添加装饰性图标
- 占位符：使用灰色文字提示
- 错误提示：红色文字显示在字段下方

**日期选择器交互要求**

日期选择器需支持快速切换年份和月份，避免用户逐月翻页：

```
┌────────────────────────────────┐
│  ◀  [1990 ▼]  [3月 ▼]  ▶      │
├────────────────────────────────┤
│  日  一  二  三  四  五  六    │
│                  1   2   3     │
│  4   5   6   7   8   9  10     │
│  11  12  13  14 [15] 16  17    │
│  18  19  20  21  22  23  24    │
│  25  26  27  28  29  30  31    │
└────────────────────────────────┘
```

交互说明：
- **年份下拉**：点击展开下拉菜单，显示年份列表（范围：1940-当前年），可滚动选择
- **月份下拉**：点击展开下拉菜单，显示 1-12 月列表，点击选择
- 左右箭头：逐月切换（可选，主要用下拉）
- 避免使用横向滑动选择月份，交互体验差

**参考实现**：类似图片中的年份选择器，月份也采用相同的下拉列表形式

**时辰选项**
```
不知道
子时 (23:00-01:00)
丑时 (01:00-03:00)
寅时 (03:00-05:00)
卯时 (05:00-07:00)
辰时 (07:00-09:00)
巳时 (09:00-11:00)
午时 (11:00-13:00)
未时 (13:00-15:00)
申时 (15:00-17:00)
酉时 (17:00-19:00)
戌时 (19:00-21:00)
亥时 (21:00-23:00)
```

**结果展示区**

1. **命盘卡片**
```
┌─────────┬─────────┬─────────┬─────────┐
│  年柱   │  月柱   │  日柱   │  时柱   │
│  庚午   │  己卯   │  丙寅   │  壬辰   │
│  金火   │  土木   │  火木   │  水土   │
└─────────┴─────────┴─────────┴─────────┘
```

2. **五行分析**
```
金 ●●○○○ (2)
木 ●●●○○ (3)
水 ●○○○○ (1)
火 ●●○○○ (2)
土 ●●○○○ (2)
```

3. **日主分析**
- 日主类型（如：丙火）
- 日主特征描述
- 身强/身弱判断

4. **详细解读**（AI 生成）
- 性格特点（约100字）
- 事业运势（约100字）
- 财运分析（约100字）
- 感情婚姻（约100字）
- 健康提示（约50字）

5. **免责声明**
> 本分析仅供娱乐参考，不构成任何决策建议。重要决策请结合个人实际情况综合考虑。

#### 4.5.3 交互说明
- 表单即时校验
- 提交按钮点击后显示 loading 状态
- AI 解读生成过程显示加载动画
- 结果可分享（V2）

---

### 4.6 每日运势页

#### 4.6.1 页面目标
根据用户八字，提供当日运势分析。

#### 4.6.2 页面结构

**输入区**（首次使用或无本地存储时显示）

| 字段 | 类型 | 必填 |
|------|------|------|
| 出生日期 | 日期选择器 | 是 |
| 出生时间 | 下拉选择 | 否 |
| 性别 | 下拉选择 | 是 |

**结果展示区**

1. **日期信息**
```
2026年3月6日 星期五
农历：丙午年二月初八
干支：丙寅日
```

2. **整体运势**
```
今日运势: ⭐⭐⭐⭐☆ (不错)
```

3. **分项运势**
```
事业运: ⭐⭐⭐⭐⭐
财运:   ⭐⭐⭐⭐☆
感情运: ⭐⭐⭐☆☆
健康运: ⭐⭐⭐⭐☆
```

4. **今日宜忌**
```
宜: 谈判、签约、见客户、面试
忌: 冲动消费、口舌之争、熬夜
```

5. **幸运提示**
```
幸运色: 红色
幸运数字: 3, 8
幸运方位: 南方
```

6. **今日建议**（AI 生成，约50字）

#### 4.6.3 数据存储
- 使用 localStorage 存储用户生日信息
- 二次访问自动读取，无需重新输入
- 提供"重新输入"按钮

---

### 4.7 其他页面

#### 4.7.1 隐私政策页 (/privacy)
- 标准隐私政策内容
- 说明数据收集和使用方式
- 本地存储说明

#### 4.7.2 服务条款页 (/terms)
- 服务使用条款
- 免责声明
- 知识产权说明

#### 4.7.3 退款政策页 (/refund)
- 退款条件说明
- 退款流程指引
- 特殊情况处理
- 联系方式

---

## 五、技术规格

### 5.1 技术栈
| 层级 | 技术选型 |
|------|----------|
| 前端框架 | Next.js 14 (App Router) |
| UI 框架 | Tailwind CSS |
| 八字分析 | lunar-javascript |
| AI 解读 | OpenAI API / Claude API |
| 部署 | Vercel |

### 5.2 API 设计

#### POST /api/bazi/calculate
**请求**
```json
{
  "name": "张三",
  "gender": "male",
  "birthDate": "1990-03-15",
  "birthTime": "08:00"
}
```

**响应**
```json
{
  "bazi": {
    "year": { "gan": "庚", "zhi": "午" },
    "month": { "gan": "己", "zhi": "卯" },
    "day": { "gan": "丙", "zhi": "寅" },
    "hour": { "gan": "壬", "zhi": "辰" }
  },
  "wuxing": {
    "metal": 2,
    "wood": 3,
    "water": 1,
    "fire": 2,
    "earth": 2
  },
  "dayMaster": "丙火",
  "analysis": {
    "personality": "...",
    "career": "...",
    "wealth": "...",
    "relationship": "...",
    "health": "..."
  }
}
```

#### POST /api/daily
**请求**
```json
{
  "birthDate": "1990-03-15",
  "birthTime": "08:00",
  "gender": "male",
  "targetDate": "2026-03-06"
}
```

**响应**
```json
{
  "date": "2026-03-06",
  "lunarDate": "二月初八",
  "dayGanzhi": "丙寅",
  "overall": 4,
  "ratings": {
    "career": 5,
    "wealth": 4,
    "love": 3,
    "health": 4
  },
  "suitable": ["谈判", "签约", "见客户"],
  "avoid": ["冲动消费", "口舌之争"],
  "lucky": {
    "color": "红色",
    "numbers": [3, 8],
    "direction": "南方"
  },
  "advice": "..."
}
```

### 5.3 本地存储

**Key**: `cyberfate_user`

**Value**:
```json
{
  "birthDate": "1990-03-15",
  "birthTime": "08:00",
  "gender": "male",
  "savedAt": "2026-03-06T10:00:00Z"
}
```

---

## 六、UI 设计规范（Design Tokens v6 — 2026-04-03 美术虾签字确认）

> **来源**: 美术虾 `CYBERFATE-DESIGN-TOKENS.md` (v6)
> **适用范围**: **全站所有页面**（首页、八字、紫微、塔罗、定价、登录等）
> **状态**: ✅ 美术虾签字确认 · Frank 审批通过
> **代码虾开发基准**: 所有页面以此为准，不再参考旧版规范

---

### 6.1 色彩系统（Color）

#### 基础色板（CSS Variables）

```css
:root {
  /* === 背景色 === */
  --color-bg-page:       #FAF9F6;   /* 页面主背景 - 暖米白 */
  --color-bg-white:      #FFFFFF;   /* 纯白 - 卡片/导航底色 */
  --color-bg-card:       #FAFAFA;   /* 卡片背景 - 极浅灰 */
  --color-bg-subtle:     rgba(28, 26, 22, 0.015);  /* 悬停背景 */

  /* === 文字色 === */
  --color-text:          #1C1A16;   /* 主文字 - 暖黑（不是纯黑！） */
  --color-text-secondary: rgba(28, 26, 22, 0.42);   /* 次要文字 - 如副标题 */
  --color-text-muted:    rgba(28, 26, 22, 0.25);    /* 弱化文字 - 如名言、标签 */
  --color-text-on-dark:  #FFFFFF;   /* 深色背景上的文字 */

  /* === 边框色 === */
  --color-border-light:  rgba(28, 26, 22, 0.06);  /* 分割线、极淡边框 */
  --color-border:        rgba(28, 26, 22, 0.08);  /* 默认边框 */
  --color-border-strong: rgba(28, 26, 22, 0.14);  /* 强调边框（按钮描边） */
  --color-border-input:  #D1D5DB;                  /* 表单输入框边框 */

  /* === 强调色 === */
  --color-accent:        #1C1A16;   /* 主强调色 - 暖黑（用于按钮填充等） */
}
```

#### 关键原则

- **永远不用纯黑 `#000000`** 作为文字色，用 `#1C1A16` 暖黑
- **永远不用纯黑 `#000`** 作为边框，用 `rgba(28,26,22, 0.06~0.14)` 系列
- 所有颜色都带一点暖调（偏棕/偏黄），营造"纸张/书卷"气质

#### Tailwind 配置映射

| Design Token | Tailwind 用法 | 说明 |
|-------------|--------------|------|
| `--color-bg-page` (#FAF9F6) | `bg-[#FAF9F6]` 或 `bg-brand-bg` | 全站页面背景 |
| `--color-text` (#1C1A16) | `text-[#1C1A16]` | 全站主文字 |
| `--color-text-secondary` | `text-[#1C1A16]/70` (≈0.42) | 副标题、描述 |
| `--color-text-muted` | `text-[#1C1A16]/45` (≈0.25) | 名言、装饰 |
| `--color-border-light` | `border-[rgba(28,26,22,0.06)]` | 极淡分割线 |
| `--color-border-strong` | `border-[rgba(28,26,22,0.14)]` | 按钮描边 |
| `--color-accent` (#1C1A16) | `bg-[#1C1A16]` | 主按钮背景 |

---

### 6.2 字体系统（Typography）

#### 字体族

| 用途 | 字体 | 回退 | CSS |
|------|------|------|-----|
| **展示字体（标题/logo）** | Cormorant Garamond | Noto Serif SC, serif | `'Cormorant Garamond', 'Noto Serif SC', serif` |
| **中文标题** | Noto Serif SC | 衬线体 | `'Noto Serif SC', serif` |
| **正文/UI** | Inter | -apple-system, sans-serif | `'Inter', -apple-system, sans-serif` |
| **代码/数据** | JetBrains Mono | monospace | （如需要） |

#### Google Fonts 加载

```html
<link href="https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@300;400;600;700&family=Cormorant+Garamond:wght@400;500;600;700&family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet">
```

#### 字号阶梯

| 级别 | 字号 | 字重 | 行高 | 字间距 | 用途 |
|------|------|------|------|--------|------|
| **Display - Hero 标题** | 60px (clamp 44-60) | **700 (Bold)** | 1.15 | **8px** | 首页 "CYBERFATE"（全大写，2026-04-09 加粗修正） |
| **H2 - 区块标题** | 30-32px | 600 | 1.3 | 1px | "分析系统"、CTA 标题 |
| **H3 - 卡片标题** | 17-19px | 600 | 1.4 | 1px | 功能卡片名称 |
| **H4 - 小卡片标题** | 18px | 500 | 1.4 | 0 | 八字页功能项标题 |
| **Body - 正文** | 14-15px | 400 | 1.7-1.8 | 0 | 描述文字 |
| **Body-sm** | 13px | 400-500 | 1.65 | 0-1px | 链接、"进入分析" |
| **Caption** | 11-12px | 400-600 | 1.5 | 2-3px | Section label、Footer 链接 |
| **Quote** | 11-13px | 300 | 1.85-2.2 | 0.6-2.5px | Jung 名言 / 装饰文字 |

#### 字间距核心规则（v6 重点）

| 元素 | 字间距要求 | 当前实现 | 状态 |
|------|-----------|---------|------|
| Hero 标题 "CYBERFATE" | **10px (绝对值)** | tracking-[0.08em] ≈ 1.3px | ❌ 需修复 |
| Hero 副标题 | **5px** | tracking-[0.05em] | ✅ |
| 按钮 | **1px (tracking-wide)** | tracking-[0.08em] | ✅ |
| Caption/Section label | **2-3px** | tracking-[0.05em] | ✅ |
| 名言 Quote | **0.6-2.5px** | italic 默认 | ✅ |

> ⚠️ **Hero 标题字间距 10px 是核心辨识度参数**，当前实现差距最大，必须修复。

---

### 6.3 间距系统（Spacing）

基于 **8px** 倍数体系：

| Token | 值 | Tailwind | 用途 |
|-------|-----|----------|------|
| `--space-xs` | 4px | `gap-1` / `p-1` | 紧凑元素间距 |
| `--space-sm` | 8px | `gap-2` / `p-2` | 图标与文字间距 |
| `--space-md` | 16px | `gap-4` / `p-4` | 按钮组 gap、卡片内小间距 |
| `--space-lg` | 24px | `gap-6` / `p-6` | 段落间距、移动端 padding |
| `--space-xl` | 40px | `gap-10` / `p-10` | 特色卡片之间 gap |
| `--space-2xl` | 56px | `gap-14` / `p-14` | 功能分组间距 |
| `--space-3xl` | 80px | `p-20` | Section 垂直 padding |
| `--space-4xl` | 96px | `p-24` | CTA 区 padding |

#### 区域 Padding 规范

| 区域 | 左右 Padding | 上下 Padding |
|------|-------------|-------------|
| 导航栏 | 80px (`lg:px-20`) / 24px (`px-4`) | 20px |
| Hero | 80px | pt-30~40 / pb-16~20 |
| 特色区（核心理念） | 80px | py-12~16 |
| 功能区（分析系统） | 80px | mt-32 / pb-28 |
| CTA 区 | 80px | py-16 |
| Footer | 80px | py-12 |

#### 移动端断点

| 断点 | 宽度 | Padding |
|------|------|---------|
| Desktop | >= 1024px | 80px (`lg:px-20`) |
| Tablet | 768px - 1023px | 40px (`px-10`) |
| Mobile | < 768px | 24px (`px-4`) / 16px (`px-4`) |

---

### 6.4 圆角系统（Border Radius）

| Token | 值 | Tailwind | 用途 |
|-------|-----|----------|------|
| `--radius-sm` | 6-8px | `rounded-md` / `rounded-lg` | 按钮、标签、输入框 |
| `--radius-md` | 8px | `rounded-lg` | 主按钮、导航元素 |
| `--radius-lg` | 12-16px | `rounded-card` / `rounded-2xl` | 卡片 |
| `--radius-full` | 9999px | `rounded-full` | 头像、图标容器（52px 圆形） |

> ⚠️ 注意：需确认 tailwind.config.js 中 `rounded-card` 的值不为 0px。

---

### 6.5 按钮规范（Buttons）

#### 主按钮（Primary）

| 属性 | 值 | Tailwind |
|------|-----|----------|
| 背景 | `#1C1A16` | `bg-[#1C1A16]` |
| 文字色 | `#FFFFFF` | `text-white` |
| 字号 | **13px** | `text-[13px]` |
| 字重 | 500 | `font-medium` |
| 内边距 | **14px × 38px** | `py-[14px] px-[38px]` |
| 圆角 | 8px | `rounded-lg` |
| 字间距 | 1px | `tracking-wide` |
| 阴影 | `0 2px 10px rgba(28,26,22,0.1)` | `shadow-sm` |
| Hover | translateY(-2px) + shadow 加深 | `hover:-translate-y-0.5 hover:shadow-md` |
| 过渡 | 0.25s cubic-bezier(0.16, 1, 0.3, 1) | `transition-all duration-200` |

#### 次按钮（Secondary / Ghost）

| 属性 | 值 | Tailwind |
|------|-----|----------|
| 背景 | transparent | `bg-transparent` |
| 文字色 | `#1C1A16` | `text-[#1C1A16]` |
| 边框 | 1px solid `rgba(28,26,22,0.14)` | `border border-[rgba(28,26,22,0.14)]` |
| 字号 | **13px** | `text-[13px]` |
| 内边距 | **14px × 38px** | `py-[14px] px-[38px]` |
| Hover | 边框变 `#1C1A16` + 极淡暖底 | `hover:border-[#1C1A16] hover:bg-[rgba(28,26,22,0.015)]` |

#### Text 按钮（链接型）

| 属性 | 值 | Tailwind |
|------|-----|----------|
| 样式 | 无背景无边框 | `border-none shadow-none` |
| 字号 | 14px | `text-sm` |
| 颜色 | `#1C1A16` | `text-[#1C1A16]` |
| Hover | underline + 颜色加深 | `hover:underline` |

---

### 6.6 卡片规范（Cards）

#### 核心原则：**无边框语言**

| 属性 | 值 | 说明 |
|------|-----|------|
| 背景 | `#FFFFFF` 或 `#FAFAFA` | 纯白或极浅灰 |
| 边框 | **无** 或 `1px solid rgba(28,26,22,0.06)` | 极淡到几乎看不见 |
| 圆角 | 12-16px | `rounded-card` / `rounded-2xl` |
| 内边距 | 28-36px | `p-7` ~ `p-9` |
| 阴影 | 无（默认） | 无默认阴影 |
| Hover 阴影 | `0 8px 28px rgba(0,0,0,0.07)` | `hover:shadow-lg` 或 `hover:shadow-card-hover` |
| Hover 位移 | `translateY(-4px)` | `hover:-translate-y-1` |
| 过渡 | 0.3s ease | `transition-all duration-300` |

**禁止：**
```html
<!-- 有边框 = 后台管理感 -->
<div class="border border-gray-300 bg-white rounded p-6">
```

**正确做法：**
```html
<!-- 无边框 = 消费产品感 -->
<div class="bg-white rounded-2xl p-8 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
```

#### 图标规范

| 位置 | 风格 | 尺寸 | 圆形底 |
|------|------|------|--------|
| 特色卡片（3张） | 彩色 lucide 图标 | 30-32px 图标 / 52px 容器 | ✅ bg-gray-100 圆形 |
| 功能卡片（9张） | 彩色 lucide 图标 | 28-32px 图标 / 52px 容器 | ✅ bg-gray-100 圆形 |
| 侧边栏菜单 | 彩色/线条图标 | 18-20px | 无 |

**禁止使用灰色单色冷硬图标。每个图标必须有颜色。**

---

### 6.7 太极水印（Bagua Watermark）

| 属性 | 值 |
|------|-----|
| 符号 | ☯ 太极图（SVG data-uri） |
| 尺寸 | 140×140px（图案单元），background-size 平铺 |
| 颜色 | `#1C1A16` 暖黑（不是 #E5E7EB 浅灰） |
| **Opacity** | **0.02 - 0.04**（推荐 0.03） |
| 层级 | z-index: 0 / -z-10 |
| 定位 | fixed, inset-0, 全屏覆盖 |
| pointer-events | none |
| 核心原则 | **"感觉到的，不是看到的"** |

---

### 6.8 导航栏（Navigation）

| 属性 | 值 | Tailwind |
|------|-----|----------|
| 高度 | 64px 桌面 / 72px 平板 | `h-16 md:h-18` |
| 定位 | fixed top-0 + z-50 | `fixed top-0 z-50` |
| 背景 | `rgba(255,255,255,0.95)` + backdrop-blur | `bg-white/95 backdrop-blur-sm` |
| 底部分割线 | 1px solid `rgba(28,26,22,0.06)` | `border-b border-[rgba(28,26,22,0.06)]` |
| Logo 字体 | Cormorant Garamond, 18px, 700, letter-spacing 4px | `font-display text-xl tracking-widest` |
| 导航链接字号 | 14px | `text-sm` |
| 导航链接颜色 | `rgba(28,26,22,0.42)` | `text-brand-gray` (= text-[#1C1A16]/70) |
| 链接间距 | 32-40px | `gap-8` ~ `gap-10` |
| 登录按钮 | 细边框 + 8px 圆角 + 13px | `border rounded-lg text-[13px]` |

---

### 6.9 Footer

| 属性 | 值 |
|------|-----|
| 背景 | `#FFFFFF` 或 `bg-brand-bg` |
| 顶部分割线 | 1px solid `rgba(28,26,22,0.06)` |
| 列数 | 桌面 4 列 / 手机 1 列 |
| 品牌 slogan | Logo 下方："AI 驱动的东方命理分析平台" |
| 链接字号 | 13-14px, color `rgba(28,26,22,0.42)` |
| Section 标题 | 11-12px, 600, uppercase, letter-spacing 2px |
| 版权区 | 12px, muted 色, 顶部细分割线 |

---

### 6.10 动效规范（Animation / Motion）

#### 入场动画（可选增强，非必须）

| 元素 | 动画 | 时长 | 延迟 |
|------|------|------|------|
| Hero 标题 | fadeUp (opacity 0→1, Y 16→0) | 0.7s | 120ms |
| 副标题 | fadeUp | 0.7s | 260ms |
| 按钮组 | fadeUp | 0.7s | 400ms |
| 名言 | fadeUp | 0.7s | 540ms |
| 特色卡片 | fadeUp staggered | 0.6s | 750ms + i×150ms |
| 功能卡片 | fadeUp (滚动触发) | 0.45s | i×100ms |

#### 缓动函数

- **标准**: `cubic-bezier(0.16, 1, 0.3, 1)` — ease-out-quart
- **Hover**: `transition-all duration-200` ~ `duration-300`

#### 减弱动效

```css
@media (prefers-reduced-motion: reduce) {
  * { animation: none !important; transition: none !important; }
}
```

---

### 6.11 表单规范（Forms）— 八字页等

#### 输入框

| 属性 | 值 | Tailwind |
|------|-----|----------|
| 高度 | 48px | `h-12` |
| 圆角 | 8px | `rounded-lg` |
| 边框 | 1px solid #D1D5DB | `border border-gray-300` |
| 内边距 | 0 16px | `px-4` |
| 字号 | 14px | `text-sm` |
| 文字色 | #1C1A16 | `text-[#1C1A16]` |
| Focus 边框 | #1C1A16 | `focus:border-[#1C1A16]` |
| Focus 光晕 | `0 0 0 3px rgba(28,26,22,0.06)` | `focus:ring...` |
| Placeholder | `rgba(28,26,22,0.25)` | `placeholder:text-[#1C1A16]/25` |

#### 表单容器

| 属性 | 值 |
|------|-----|
| 背景 | white 纯白底 |
| 圆角 | 16px |
| 边框 | **无**（和首页统一） |
| 内边距 | 40px (`p-10`) |
| 阴影 | 可选 `0 2px 20px rgba(0,0,0,0.03)` |

#### 提交按钮（表单内）

- 全宽 `w-full`
- 高度 50px (`h-[50px]`)
- 其他同主按钮规范

---

### 6.12 Tailwind 配置建议

```js
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        brand: {
          black: '#1C1A16',
          gray: 'rgba(28, 26, 22, 0.42)',
          light: 'rgba(28, 26, 22, 0.25)',   // muted text
          muted: 'rgba(28, 26, 22, 0.08)',   // border default
          border: {
            light: 'rgba(28, 26, 22, 0.06)',
            DEFAULT: 'rgba(28, 26, 22, 0.08)',
            strong: 'rgba(28, 26, 22, 0.14)',
          },
          bg: '#FAF9F6',
        },
      },
      fontFamily: {
        display: ['Cormorant Garamond', 'Noto Serif SC', 'serif'],
        body: ['Inter', '-apple-system', 'sans-serif'],
      },
      borderRadius: {
        card: '12px',
      },
      fontSize: {
        display: ['60px', { lineHeight: '69px', letterSpacing: '10px' }],
      },
      boxShadow: {
        card: '0 2px 20px rgba(0,0,0,0.03)',
        'card-hover': '0 8px 28px rgba(0,0,0,0.07)',
      },
      spacing: {
        section: '80px',
      },
    },
  },
};
```

---

### 6.13 快速检查清单（QA Checklist）

每个页面上线前逐项检查：

- [ ] 背景是 `#FAF9F6` 暖米白（不是 `#FFFFFF` 纯白）
- [ ] 文字用 `#1C1A16` 暖黑（不是 `#000000` 纯黑）
- [ ] 标题用了衬线字体（Cormorant Garamond / Noto Serif SC）
- [ ] **Hero 标题字间距 ≥ 10px**（核心辨识度）
- [ ] 副标题是淡灰色（opacity ~0.42），不是纯黑
- [ ] 按钮字号 **13px**，padding **14×38px**
- [ ] **卡片没有明显边框**（border opacity ≤ 0.06）
- [ ] 图标是彩色/有温度的（不是灰色线条）
- [ ] 太极水印 opacity **2-4%**，颜色用 `#1C1A16` 暖黑
- [ ] 名言/装饰文字足够淡（不影响阅读）
- [ ] Section 间有充足留白（≥ 56px）
- [ ] 圆角正常渲染（`rounded-card` 不是 0px）
- [ ] Hover 效果流畅（translateY + shadow）
- [ ] 导航栏底部有极淡分割线
- [ ] Footer 有品牌 slogan

---

_美术虾 🎨签字确认 · Frank 审批通过 · 2026-04-03_
## 七、页面详细设计 (v2 — 2026-04-02 更新)

> 以下页面设计均以美术虾效果图为准。完整开发参数见开发任务书。
> 效果图清单：首页 / 八字分析页 / 定价页 / 每日运势页

### 7.1 首页 `/` （v2 — 完整版，对齐 FateMaster 结构）

> 参考竞品：https://www.fatemaster.ai/
> 设计原则：完整复刻 FateMaster 首页的信息架构和模块顺序，视觉风格用 CyberFate v2 设计语言（太极水印、衬线体、黑白灰）

#### 7.1.1 导航栏 Navbar

```
┌───────────────────────────────────────────────────────────────────┐
│  CYBERFATE   首页   八字分析   知识库   定价   [ 工作台 ]  [ 登录 ] │
└───────────────────────────────────────────────────────────────────┘
```

- sticky top-0, z-50, 高度 64-72px
- 底部 1px 分割线 #F3F4F6
- 背景 white + backdrop-blur-md bg-white/90（滚动时）
- Logo：font-display, text-lg/xl, tracking-widest
- **导航项为平铺链接，无下拉菜单**：

| 导航项 | 路由 | 说明 |
|--------|------|------|
| 首页 | `/` | 网站首页 |
| 八字分析 | `/bazi` | 核心功能入口，直接可点 |
| 知识库 | `/wiki` 或 `/knowledge` | 命理知识文章集合 |
| 定价 | `/pricing` | 会员定价页 |
| 工作台 | `/dashboard` 或进入侧边栏布局 | 图标 + 文字，Text 按钮样式 |

- **「功能」下拉菜单已移除** — 原来藏在下拉里的功能入口全部迁移到侧边栏（Sidebar），Header 只保留最高频的 5 个导航项
- 右侧登录用文字按钮样式（Text 按钮）

> **完整工作台侧边栏设计见下方 7.1.8 ↓**

---

### 7.1.8 工作台侧边栏 Sidebar（Dashboard）

#### 概述

侧边栏是登录后的核心导航容器，承载所有功能入口和用户操作。用户从导航栏点击「工作台」或任意功能页进入后，侧边栏常驻左侧。

#### 布局结构

```
┌─ 浏览器窗口 ───────────────────────────────────────────┐
│                                                          │
│ ┌─ Navbar（sticky top）─────────────────────────────┐   │
│ │  CYBERFATE   功能 ▾   定价   关于        [登出]   │   │
│ └───────────────────────────────────────────────────┘   │
│                                                          │
│ ┌─ Sidebar ─┐ ┌─ Content Area ──────────────────────┐   │
│ │            │ │                                      │   │
│ │  [Logo]    │ │                                      │   │
│ │  CYBERFATE │ │      （当前页面内容）                │   │
│ │            │ │                                      │   │
│ │ ─────────  │ │                                      │   │
│ │            │ │                                      │   │
│ │  首页      │ │                                      │   │
│ │  🏠 首页   │ │                                      │   │
│ │            │ │                                      │   │
│ │  八字命理  │ │                                      │   │
│ │  📊 八字分析│ │                                      │   │
│ │  📅 每日运势│ │                                      │   │
│ │  💑 合婚分析│ │                                      │   │
│ │            │ │                                      │   │
│ │  周易占卜  │ │                                      │   │
│ │  🔮 梅花易数│ │                                      │   │
│ │  🃏 塔罗占卜│ │                                      │   │
│ │  🎯 六爻占卜│ │                                      │   │
│ │            │ │                                      │   │
│ │  更多工具  │ │                                      │   │
│ │  ⭐ 紫微斗数│ │                                      │   │
│ │  📆 AI 黄历│ │                                      │   │
│ │            │ │                                      │   │
│ │ ─────────  │ │                                      │   │
│ │            │ │                                      │   │
│ │  📝 知识库 │ │                                      │   │
│ │  📋 历史记录│ │                                      │   │
│ │            │ │                                      │   │
│ │ ─────────  │ │                                      │   │
│ │            │ │                                      │   │
│ │  [用户]    │ │                                      │   │
│ │  👤 Frank  │ │                                      │   │
│ │  ⚙️ 设置   │ │                                      │   │
│ │  🚪 退出   │ │                                      │   │
│ │            │ │                                      │   │
│ └────────────┘ └──────────────────────────────────────┘   │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

#### 侧边栏规格

| 属性 | 值 |
|------|-----|
| 宽度 | 260px（展开）/ 64px（收起） |
| 背景 | #FFFFFF |
| 右边框 | 1px solid #F3F4F6 |
| 高度 | 100vh（减去 Navbar 高度） |
| 定位 | fixed left-0, top-navbar-height |
| 层级 | z-30（低于 Navbar 的 z-50） |
| 过渡动画 | width 0.25s ease |
| 可折叠 | 是，默认展开 |

#### 菜单分组与菜单项

**第一组：首页**
| 图标 | 名称 | 路由 | 说明 |
|------|------|------|------|
| 🏠 | 首页 | / | 默认入口 |

**第二组：八字命理**
| 图标 | 名称 | 路由 | 说明 |
|------|------|------|------|
| 📊 | 八字分析 | /bazi | 核心功能 P0 |
| 📅 | 每日运势 | /daily | 日活入口 |
| 💑 | 合婚分析 | /bazi/marriage | 社交裂变功能 |

**第三组：周易占卜**
| 图标 | 名称 | 路由 | 说明 |
|------|------|------|------|
| 🔮 | 梅花易数 | /meihua | |
| 🃏 | 塔罗占卜 | /tarot | 海外用户核心入口 |
| 🎯 | 六爻占卜 | /liuyao | 计划中 |

**第四组：更多工具**
| 图标 | 名称 | 路由 | 说明 |
|------|------|------|------|
| ⭐ | 紫微斗数 | /ziwei | |
| 📆 | AI 黄历 | /huangli | |

**第五组：个人中心（分隔线下方）**
| 图标 | 名称 | 路由 | 说明 |
|------|------|------|------|
| 📝 | 知识库 | /knowledge | 计划中 |
| 📋 | 历史记录 | /history | 用户查询历史 |

**第六组：用户信息（底部固定）— 三态设计（2026-04-14 新增）**

侧边栏底部根据用户登录状态和订阅状态，展示不同内容。共三种状态：

##### 状态定义

| 状态 | 条件 | 标识 |
|------|------|------|
| 未登录 (`guest`) | 无有效 token / session 过期 | `guest` |
| 已登录·未订阅 (`logged_in`) | 有 token，无活跃订阅 | `logged_in` |
| 已登录·已订阅 (`subscribed`) | 有 token + 活跃订阅（含免费试用期内） | `subscribed` |

> 注：免费试用期内的用户视为 `subscribed`，不显示付费引导。

##### 状态A：未登录 (`guest`) — 底部区域

```
┌─────────────────────────┐
│  ┌───────────────────┐  │
│  │  🔓 解锁全部功能   │  │  ← 黑色实心按钮 (primary CTA)
│  └───────────────────┘  │
│                         │
│  ┌───────────────────┐  │
│  │  👤 登录 / 注册    │  │  ← 白底描边按钮 (secondary)
│  └───────────────────┘  │
└─────────────────────────┘
```

- **两个按钮都展示** — 未登录用户需要同时看到价值主张和登录入口
- 「解锁全部功能」→ **弹出 Upgrade Modal (4.8)**（不跳转 /pricing）
- 「登录 / 注册」→ 触发登录弹窗 (4.2) 或跳转 `/login`

##### 状态B：已登录·未订阅 (`logged_in`) — 底部区域

```
┌─────────────────────────┐
│  ┌───────────────────┐  │
│  │  🔓 解锁全部功能   │  │  ← 黑色实心按钮 (primary CTA)
│  └───────────────────┘  │
│                         │
│  ┌────────────────────┐ │
│  │ [头像] feng.5166   │ │
│  │         feng@xx.com│ │
│  └────────────────────┘ │
│  👤 个人资料            │  ← 文字链接
│  ↪ 退出登录             │  ← 文字链接
└─────────────────────────┘
```

- 显示用户头像 + 用户名 + 邮箱（头像优先级见下方规范）
- 「解锁全部功能」→ **弹出 Upgrade Modal (4.8)**（不跳转 /pricing）
- 「个人资料」→ 跳转 `/profile` 或弹出面板
- 「退出登录」→ 清除 token → 刷新回到 guest 态

##### 状态C：已登录·已订阅 (`subscribed`) — 底部区域

```
┌─────────────────────────┐
│  ┌────────────────────┐ │
│  │ [头像] feng.5166   │ │
│  │         feng@xx.com│ │
│  │   ✅ Pro 会员       │ │  ← 订阅标识 (小 tag)
│  └────────────────────┘ │
│  👤 个人资料            │
│  ↪ 退出登录             │
└─────────────────────────┘
```

- **不显示「解锁全部功能」按钮** — 用户已付费，不需要转化入口
- 用户信息区增加一行小字：「✅ Pro 会员」或「✅ 会员有效期至 YYYY-MM-DD」

##### 底部区域通用样式规范

| 元素 | Design Tokens v6 规范 |
|------|----------------------|
| 「解锁全部功能」按钮 | `bg-[#1C1A16] text-white rounded-lg py-3 px-4 w-full font-medium text-sm` |
| 「登录/注册」按钮 | `border border-[#E5E2DD] rounded-lg py-2.5 px-4 w-full text-[#1C1A16] text-sm font-medium` |
| 用户信息区容器 | `py-4 px-3 flex items-center gap-3 border-t border-[#F0EDE8]` |
| 头像 | `w-10 h-10 rounded-full bg-[#F0EDE8] flex items-center justify-center text-[#1C1A16] font-medium text-sm overflow-hidden` |
| 用户名 | `text-[#1C1A16] font-medium text-sm` |
| 邮箱 | `text-[#9B9590] text-xs truncate max-w-[140px]` |
| 订阅 Tag | `text-xs text-green-700 bg-green-50 px-2 py-0.5 rounded-full font-medium` |
| 个人资料/退出登录 | `py-2 px-3 text-sm text-[#6B6560] hover:text-[#1C1A16] cursor-pointer transition-colors` |

> ⚠️ **禁止纯黑底选中态**（2026-04-08 Frank 确认的全站规范）。以上按钮样式使用 `bg-[#1C1A16]` 是深炭色主按钮填充（非选中态背景），与禁止纯黑底选中态规则不冲突。

##### 功能列表锁定态（P1 增强体验）

当用户处于 `guest` 或 `logged_in`（未订阅）时，付费功能项显示锁定态：

| 功能 | 免费用户 | 付费用户 |
|------|---------|---------|
| 八字分析 | ✅ 可用 | ✅ 可用 |
| 每日运势 | ✅ 可用（每日1次） | ✅ 无限 |
| 合婚分析 | 🔒 锁定 | ✅ 可用 |
| 梅花易数 | 🔒 锁定 | ✅ 可用 |
| 塔罗占卜 | ✅ 可用（每日3次） | ✅ 无限 |
| 六爻占卜 | 🔒 锁定 | ✅ 可用 |
| 紫微斗数 | 🔒 锁定 | ✅ 可用 |
| AI 黄历 | 🔒 锁定 | ✅ 可用 |

锁定态视觉：
- 功能名右侧小锁图标 🔒（`#9B9590` 色，14px）
- 整行 `opacity: 0.6` + `pointer-events: none`
- hover 时 tooltip：「升级会员解锁此功能」→ 跳转 `/pricing`

> 具体哪些功能收费以最终定价策略为准，上表为建议。

##### 技术要点

- 状态获取：前端从 cookie / localStorage / context 获取登录态；订阅状态通过 `/api/user/subscription` 或 JWT payload 查询
- 组件拆分建议：
  - `SidebarNav` — 功能导航列表（与状态无关）
  - `SidebarFooter` — 底部区域（接收 `authStatus: 'guest' | 'logged_in' | 'subscribed'` prop，三态渲染）
  - `UserCard` — 用户信息卡片（状态 B/C 共用）
- 底部区域 sticky 固定在侧边栏最底部
- 移动端 Drawer 内逻辑一致（Drawer 宽度 280px）

##### 验收标准

**P0 必须实现：**
- [ ] 未登录 → 显示「解锁全部功能」+「登录/注册」两按钮（点解锁→先弹登录→登录后弹 Upgrade Modal）
- [ ] 已登录未订阅 → 显示「解锁全部功能」（点之弹 Upgrade Modal）+ 用户信息 + 个人资料 + 退出登录
- [ ] 已登录已订阅 → 不显示「解锁全部功能」，显示用户信息 + 订阅标识 + 个人资料 + 退出登录
- [ ] 各按钮跳转正确（Upgrade Modal / login / profile / 退出清除 token）
- [ ] 移动端 Drawer 表现一致

**P1 增强体验：**
- [ ] 付费功能带锁定图标和弱化样式
- [ ] 锁定功能 hover 提示升级
- [ ] 头像优先显示真实头像，降级为首字母
- [ ] 订阅用户显示会员有效期

#### 用户头像规范

> ⚠️ **头像来源规则（2026-04-09 Frank 反馈）：**

**头像优先级（从高到低）：**

| 优先级 | 来源 | 说明 |
|--------|------|------|
| 1️⃣ | **第三方 OAuth 头像** | Google 登录 → 拿 Google `picture` 字段（用户自定义头像/照片）；后续其他 OAuth 同理 |
| 2️⃣ | **用户自定义上传** | 用户在个人中心设置里上传的头像 |
| 3️⃣ | **名字首字占位图** | 以上都没有时才用（fallback） |

**Google 登录头像获取：**
- Google OAuth userinfo 返回 `picture` 字段（URL 格式：`https://lh3.googleusercontent.com/a-{hash}=s96-c`）
- 登录成功后**必须存储该 URL**到用户记录
- 侧边栏/导航栏/个人中心统一使用该 URL

**禁止行为：**
- ❌ Google 登录用户显示首字占位图（如截图中的"周"字色块）

**头像组件规格：**

| 属性 | 值 |
|------|-----|
| 形状 | 圆形 rounded-full |
| 尺寸 | 侧边栏展开态 **w-11 h-11 (44px)**（原 40px）；收起态 w-9 h-9 (36px)；导航栏 w-8 h-8 (32px) |
| object-fit | cover |
| 加载失败 | fallback 到首字占位图 |

**用户区域布局（底部固定区）：**

```
┌─────────────────────────────────────┐
│                                     │
│        [头像 44px]                  │
│                                     │
│        周峰                         │
│     zf@example.com    ← text-xs(12px) muted  │
│                                     │
│   ⚙️ 设置    🚪 退出    ← 文字链接+图标  │
│                                     │
└─────────────────────────────────────┘
```

| 属性 | 值 | Tailwind |
|------|-----|----------|
| 头像 | w-11 h-11 rounded-full | `w-11 h-11 rounded-full` |
| 昵称 | text-sm font-medium, mt-1 | `text-sm font-medium mt-1` |
| 邮箱 | **text-xs (12px)**, text-muted, mt-0.5（减小降噪） | `text-xs text-[#9CA3AF] mt-0.5` |
| 设置/退出 | text-xs text-[#6B7280], hover:text-black, hover:underline, flex gap-3 mt-2 | `text-xs hover:underline flex gap-3` |

#### 菜单项交互规则（v2 — 2026-04-09 视觉优化）

1. **当前页面高亮**：文字颜色 #000000 + 左侧 3px 品牌色竖条指示器 `#7C3AED`（紫色），背景 #F9FAFB
2. **非当前页**：文字 color #6B7280，hover 时背景 #F9FAFB + 文字变 #000000
3. **字体**：text-sm (14px), font-medium
4. **内边距**：left 20px, vertical **12px**（紧凑化，原 10-16px）
5. **图标尺寸**：18-20px，位于文字左侧，间距 **12px**（紧凑化，原 ~16px）
6. **分组标题**：text-[13px]（增强可见性，原 12px）, font-semibold, text-[#9CA3AF]（中灰，原极浅灰）, uppercase tracking-wider, padding-left 20px, margin-top **20px**（增加呼吸感，原 16px）, margin-bottom 8px
7. **分割线**：1px solid #F3F4F6，上下 margin 12px

> **变更说明（2026-04-09 美术虾建议 + 产品虾审核）：**
> - 菜单项紧凑化：icon 间距 16→12px，padding 16→12px
> - 分组标签增强：字号 12→13px，颜色 gray-400→#9CA3AF，上边距 16→20px
> - 选中态指示器：纯黑 → 品牌紫色 #7C3AED（品牌点缀，图标保持黑色不变）

#### 收起态（Collapsed）

- 宽度缩至 64px
- 只显示图标，隐藏文字和分组标题
- 图标居中显示
- hover 时 tooltip 显示完整名称（右侧弹出）
- 底部用户区只显示头像（圆形 **w-9 h-9 36px**）+ hover tooltip 显示昵称

#### 折叠/展开切换按钮

> ⚠️ **设计规范（2026-04-09 Frank 反馈）：**
> 参考竞品 FateMaster，收起/展开按钮必须是一个**小型图标按钮**，不能是带边框的大按钮条。

**正确样式（参考 FateMaster）：**

```
展开态侧边栏右上角：
┌─────────────────────────────┐
│  Logo/标题              [⏸] │  ← 小图标，无背景无边框
└─────────────────────────────┘
```

**错误样式（禁止）：**

```
展开态侧边栏顶部：
┌─────────────────────────────┐
│  ┌───────────────────────┐  │
│  │   <  收起导航          │  │  ← 带边框的大按钮条，占空间
│  └───────────────────────┘  │
└─────────────────────────────┘
```

**按钮规格：**

| 属性 | 值 | Tailwind |
|------|-----|----------|
| 类型 | IconButton（纯图标，无文字） | |
| 图标 | 收起：`PanelLeftClose` 或 `≡`；展开：`PanelLeft` | lucide-icon, w-4 h-4 |
| 位置 | 侧边栏**右上角**，absolute 定位 | `absolute top-3 right-2` 或 `top-4 right-3` |
| 尺寸 | w-7 h-7 (28px) | `w-7 h-7` |
| 背景 | 无 / 极淡 hover 底色 | `hover:bg-gray-100 rounded-md` |
| 边框 | 无 | |
| 文字 | 无 | |
| tooltip | hover 时显示"收起导航"/"展开导航" | |
| z-index | 确保不被其他元素遮挡 | |

> **设计理由：** FateMaster 的方案证明小图标足够直观，用户一看就知道是收起。大按钮条在视觉上喧宾夺主，占用宝贵的侧边栏宽度，且与整体简洁风格不协调。

**收起后的展开按钮：**
- 收起态（64px 宽）时，图标按钮位于顶部区域居中
- 同样是小图标（w-7 h-7），无背景无边框
- 图标改为展开方向（如 `PanelLeft` 或 `☰`）

#### 移动端适配

| 断点 | 行为 |
|------|------|
| >= 1024px (Desktop) | 侧边栏常驻左侧，内容区右侧自适应 |
| 640-1023px (Tablet) | 侧边栏默认收起（64px），hover 展开，或覆盖层模式 |
| < 640px (Mobile) | 侧边栏隐藏，由汉堡菜单触发，以 Drawer/Overlay 形式从左侧滑出，宽度 280px，点击遮罩或菜单项后自动收回 |

#### 内容区（Content Area）

| 属性 | 值 |
|------|-----|
| margin-left | 260px（展开时）/ 64px（收起时）|
| 过渡动画 | margin-left 0.25s ease（与侧边栏同步）|
| min-height | calc(100vh - navbar-height) |
| 背景 | #FAFAFA 或 #FFFFFF（按具体页面）|

> ⚠️ **Bug 修复要求（2026-04-09 Frank 反馈）：**
> 截图显示侧边栏展开后内容区**没有被推开**，导致内容被侧边栏遮挡一半。
>
> **根因排查方向：**
> - 内容区容器必须有 `transition: margin-left 0.25s ease`
> - 侧边栏展开时 → 内容区 `ml-[260px]`（或 `ml-65`）
> - 侧边栏收起时 → 内容区 `ml-[64px]`（或 `ml-16`）
> - 如果用 flex 布局：父容器 `flex row`，侧边栏固定宽度 + 内容区 `flex-1`
> - **禁止**：内容区用 `position: absolute` 且 left 值不随侧边栏状态变化
> - **检查**：DashboardLayout 组件中是否正确绑定了 sidebar 状态到内容区的 margin/left
>
> **推荐布局方案（二选一）：**
> - 方案 A（margin）：`<div style={{ marginLeft: isOpen ? 260 : 64, transition: 'margin-left 0.25s' }}>`
> - 方案 B（flex）：`<div className="flex"><Sidebar /><main className="flex-1 ml-0">` — Sidebar 自身占宽度，main 自动填充剩余空间

#### 工作台入口逻辑

1. 用户未登录：导航栏「工作台」按钮点击 → 跳转登录页
2. 用户已登录：导航栏「工作台」按钮点击 → 进入 /dashboard（侧边栏 + 默认内容页）
3. 用户直接访问功能页（如 /bazi）：已登录则自动展示侧边栏；未登录则不展示侧边栏，显示独立页面 + 导航栏
4. 首页 `/` ：始终不展示侧边栏（首页有独立的营销布局）

#### 组件文件

| 组件 | 路径 | 说明 |
|------|------|------|
| Sidebar | components/layout/Sidebar.tsx | 侧边栏主组件 |
| SidebarMenuItem | components/layout/SidebarMenuItem.tsx | 单个菜单项 |
| SidebarGroup | components/layout/SidebarGroup.tsx | 分组容器 |
| DashboardLayout | components/layout/DashboardLayout.tsx | 侧边栏+内容区布局容器 |

#### 开发优先级：P1

侧边栏是用户登录后的核心导航体验，建议在首页 UI 改版验收通过后立即开发。

---

#### 7.1.2 Hero 区域

**从上到下结构：**

```
┌──────────────────────────────────────────────────┐
│                                                  │
│          (padding-top: 80-100px)                 │
│                                                  │
│            CYBERFATE                            │
│        (font-display, 52-56px, 衬线体)           │
│                                                  │
│       解码命运 · 智见未来                         │
│     (text-gray, 18-20px)                        │
│                                                  │
│    [ 开始分析 ]   [ 了解更多 ]                   │
│                                                  │
│                                                  │
│  "When the inner situation is not made           │
│   conscious, it happens outside, as fate."       │
│                    — C.G. Jung                  │
│             (text-light, 14px, 金句)             │
│                                                  │
│         (padding-bottom: 60-80px)                │
└──────────────────────────────────────────────────┘
```

**详细规格：**

1. **顶部留白**: padding-top 80-100px
2. **主标题**: `CYBERFATE`
   - font-display (衬线体), **52-56px (桌面) / 36px (移动)**
   - **font-weight: 700 (Bold)**（2026-04-09 修正：原 400 太弱，参考 FateMaster 粗衬线体冲击力）
   - **text-transform: uppercase**（全大写，增强品牌感）
   - letter-spacing **0.08em** (tracking-[0.08em])（全大写后间距可稍收窄，原 0.15em 针对小写）
   - color #0F0F0F
   - text-center
   - **❌ 禁止任何边框/描边/outline 包裹标题文字**（2026-04-09 Frank 反馈：截图出现红色边框像输入框，严重降低品质感）

> ⚠️ **Hero 标题视觉规范（2026-04-09 Frank 反馈 + FateMaster 对标）：**
>
> **当前问题（截图对比 FateMaster）：**
> - 字重太轻（400），存在感不够
> - 可能有边框包裹（必须去掉）
> - 整体视觉偏弱，撑不起 Hero 区域
>
> **对标 FateMaster 的改进：**
> | 属性 | 当前值 | 目标值 | 理由 |
> |------|--------|--------|------|
> | font-weight | 400 | **700 (Bold)** | FateMaster 用粗衬线体，冲击力强 |
> | 边框 | 有（红色/橙色）| **无** | 边框让标题像输入框 |
> | 大小写 | CYBERFATE（混排） | **CYBERFATE（全大写）** | 全大写更有品牌权威感 |
> | letter-spacing | 0.15em | **0.08em** | 全大写后自然间距大，稍收窄 |
> | font-family | Cormorant Garamond | **保持 Cormorant Garamond, wght:700** | 字体不变，加粗即可 |
>
> **字体加载确认：** Google Fonts 引用必须包含 `wght@700`
> ```html
> <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@700&family=..." />
> ```
> 如果 Cormorant Garamond 700 不够有力，备选：**Playfair Display** (wght:700-900)，粗细对比更强，更有高级感
3. **副标题**: `解码命运 · 智见未来`
   - font-sans-serif, 18-20px, font-weight 400
   - color #6B7280 (brand-gray)
   - text-center, margin-top 24px (mt-6)
4. **双按钮组**（距副标题 40px / mt-10）:
   - Primary 黑色实心「开始分析」→ 跳转 /bazi
   - Secondary 描边「了解更多」→ 锚点跳转到 #features 功能区
   - 两按钮水平 gap 16px (gap-4), justify-center
5. **英文金句**（距按钮 60-80px / mt-16~20）:
   - "When the inner situation is not made conscious, it happens outside, as fate." — C.G. Jung
   - 或替换为中文金句：「当潜意识没有被意识到时，它就成了命运。」— 荣格
   - font-size 14px, color #9CA3AF (brand-light)
   - max-width 480px, mx-auto, text-center, leading-relaxed
6. **底部留白**: padding-bottom **40-48px**（v6 修正：原 60-80px 过大，导致 Hero 与特色卡之间空白太多。金句到特色卡的视觉间距控制在 60-80px 即可）

**背景**: 白色 + 太极图阵列水印（透明度 5-8%），absolute 定位覆盖 Hero 区域，z-0，内容区 z-10

> **太极水印全局规范（整个首页共用，v6 美术虾审核修正）**：
> 太极底纹平铺整个首页 body 背景。
> - 使用 CSS `background-image` + `background-repeat: repeat` 实现全页平铺
> - 或用 fixed 定位的伪元素/层，覆盖 100vw x 100vh
> - 太极图标：**极浅灰色，opacity 3-4%**（当前线上约 8-12%，太浓了）
> - 尺寸：每个太极约 120-160px，间距均匀
> - 层级：z-index 0（或 -1），所有内容在其上方
> - **核心原则："感觉到的，不是看到的"** — 水印是品牌氛围层，不能干扰任何内容的阅读
> - 当前版问题：opacity 过高导致视觉噪音，必须降到 3-4%

---

#### 7.1.3 核心理念区（新增！参考 FateMaster）

**位置**: Hero 区域下方，功能展示区上方

**区块间距（v6 修正）**:
- 上边距（距 Hero 金句）：**py-12~16 (48-64px)**，不要 py-20~24 (80-96px)
- 目标：Hero 底部到本区域顶部的视觉距离控制在 **60-80px**
- 原因：之前留白过大（Hero pb-80px + 本区 pt-96px = 176px 总间距），用户滚动时感觉"断层"
- 背景：`bg-brand-bg/60`（极浅灰，和白色主体区分即可）

**布局**: 3 列卡片并排（桌面端），每列一个理念

```
┌─────────────────────────────────────────────────────────────┐
│                      核心理念                                │
│                                                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                 │
│  │  ○ 图标   │  │  ○ 图标   │  │  ○ 图标   │                 │
│  │          │  │          │  │          │                 │
│  │ AI 智能   │  │ 文化传承  │  │ 自主探索  │                 │
│  │ 科学解析  │  │ 理性态度  │  │ 独立思考  │                 │
│  │          │  │          │  │          │                 │
│  │ 融合AI与  │  │ 以开放理性│  │ 我们相信  │                 │
│  │ 传统命理  │  │ 的态度传承│  │ 每个人都是│                 │
│  │ ...描述   │  │ ...描述   │  │ ...描述   │                 │
│  │          │  │          │  │          │                 │
│  └──────────┘  └──────────┘  └──────────┘                 │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**区块标题**: `核心理念` — H2 级别, 28-32px, font-semibold, text-center, margin-bottom 48px (mb-12)

**3 个理念卡片**:

| # | 标题 | 图标方向 | 描述文案（参考，可调整） |
|---|------|---------|----------------------|
| 1 | AI 智能，科学解析 | 大脑/芯片图标 | 融合现代 AI 技术与传统命理智慧，通过大数据分析与机器学习，提供客观的命理解读，让玄学不再玄 |
| 2 | 文化传承，理性态度 | 灯卷/天平图标 | 以开放理性的态度传承东方智慧，去芜存菁、不迷信、不神化，让千年命理文化以更健康的方式融入现代生活 |
| 3 | 自主探索，独立思考 | 指南针/眼睛图标 | 我们相信每个人都是自己命运的解读者。通过 AI 工具赋能，让每个人能独立进行命理分析，自主思考人生方向 |

**卡片规格**:
- 不带背景色、不带边框、不带阴影（纯文字 + 图标排列）
- 或者极浅的背景 #FAFAFA + rounded-card，看美术虾效果定
- 文字居中对齐
- 图标：48x48px，颜色 #374151（中灰）或 #0F0F0F
- 标题：H3 级别, 18-20px, font-medium, color #1A1A1A, margin-top 20px, margin-bottom 12px
- 描述：Body Small, 14px, color #6B7280, line-height 1.7, max-width 280px mx-auto
- 整体：flex flex-col items-center text-center, padding 32px 24px

**Grid**: `grid grid-cols-1 md:grid-cols-3 gap-8`，max-width 1000px mx-auto

**区块上下间距**: margin-top 80-100px (mt-20~24), margin-bottom 80-100px

---

#### 7.1.4 分析系统功能区（核心功能展示区，参考 FateMaster + 美术虾效果图）

**位置**: 核心理念区下方

**这是首页最核心的区域，按功能分类分组展示所有功能入口。以美术虾效果图为准。**

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│                      分 析 系 统                            │
│               探索我们全面的智能分析服务                     │
│                                                             │
│  ─────────────────────────────────────────────────────────  │
│                                                             │
│  八字分析                                                    │
│                                                             │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│  │    ┌───────┐    │  │    ┌───────┐    │  │    ┌───────┐    │
│  │    │ 📋图标 │    │  │    │ 📅图标 │    │  │    │ 💑图标 │    │
│  │    └───────┘    │  │    └───────┘    │  │    └───────┘    │
│  │                 │  │                 │  │                 │
│  │   命盘解析       │  │   每日运势       │  │   合婚分析       │
│  │                 │  │                 │  │                 │
│  │  AI智能八字分析  │  │  基于八字的每日  │  │  基于八字的深度  │
│  │  系统，揭示个人  │  │  运势分析，助你  │  │  匹配分析，揭示  │
│  │  命盘特质与发    │  │  把握每日吉凶    │  │  双方关系契合度  │
│  │  展规律          │  │                 │  │                 │
│  │                 │  │                 │  │                 │
│  │  进入分析  →     │  │  进入分析  →     │  │  进入分析  →     │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘
│                                                             │
│  周易占卜                                                    │
│                                                             │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│  │    ┌───────┐    │  │    ┌───────┐    │  │    ┌───────┐    │
│  │    │ 🔮图标 │    │  │    │ 🃏图标 │    │  │    │ 🎯图标 │    │
│  │    └───────┘    │  │    └───────┘    │  │    └───────┘    │
│  │                 │  │                 │  │                 │
│  │   梅花易数       │  │   塔罗占卜       │  │   六爻占卜       │
│  │                 │  │                 │  │                 │
│  │  （描述文字2行）  │  │  （描述文字2行）  │  │  （描述文字2行）  │
│  │                 │  │                 │  │                 │
│  │  进入分析  →     │  │  进入分析  →     │  │  进入分析  →     │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘
│                                                             │
│  更多工具                                                    │
│                                                             │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│  │    ┌───────┐    │  │    ┌───────┐    │  │    ┌───────┐    │
│  │    │ ⭐图标 │    │  │    │ 📆图标 │    │  │    │ 🔮图标 │    │
│  │    └───────┘    │  │    └───────┘    │  │    └───────┘    │
│  │                 │  │                 │  │                 │
│  │   紫微斗数       │  │   黄历查询       │  │   AI 黄历        │
│  │                 │  │                 │  │                 │
│  │  （描述文字2行）  │  │  （描述文字2行）  │  │  （描述文字2行）  │
│  │                 │  │                 │  │                 │
│  │  进入分析  →     │  │  进入分析  →     │  │  进入分析  →     │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

##### 区块头部

| 属性 | 规格 |
|------|------|
| 区块总标题 | "分析系统"，H2, 32px, font-semibold/font-display, color #0F0F0F, text-center |
| 区块副标题 | "探索我们全面的智能分析服务"，14px, color #6B7280, text-center |
| 总标题下边距 | margin-bottom 12px (mb-3) |
| 副标题下边距 | margin-bottom 48px (mb-12) |
| 整区块上边距 | padding-top 60-80px (pt-16~20) |

##### 分组 1：八字分析（3 个功能）

**组标题**: `八字分析` — H3, 18-20px, font-semibold, text-left, color #0F0F0F, margin-bottom 20px (mb-5)

| 功能 | 描述文案（2行） | 路由 |
|------|----------------|------|
| 命盘解析 | AI智能八字分析系统，揭示个人命盘特质与发展规律 | /bazi |
| 每日运势 | 基于八字的每日运势分析，助你把握每日吉凶 | /daily |
| 合婚分析 | 基于八字的深度匹配分析，揭示双方关系契合度 | /bazi/marriage |

##### 分组 2：周易占卜（3 个功能）

**组标题**: `周易占卜` — 同上样式

| 功能 | 描述文案（2行） | 路由 |
|------|----------------|------|
| 梅花易数 | 基于梅花易数的每日决策指导，助你做出重要选择 | /meihua |
| 塔罗占卜 | 塔罗牌参考配合AI观察，从不同角度思考当前处境 | /tarot |
| 六爻占卜 | 传统六爻预测，结合AI深度解析卦象变化 | /liuyao |

> 注：六爻占卜如未开发，卡片显示灰色 + "即将上线"标签

##### 分组 3：更多工具（3 个功能）

**组标题**: `更多工具` — 同上样式

| 功能 | 描述文案（2行） | 路由 |
|------|----------------|------|
| 紫微斗数 | 根据出生时间排出紫微命盘，分析十二宫位与主星格局 | /ziwei |
| 黄历查询 | 传统中国黄历，查询各类活动的吉日 | /huangli |
| AI 黄历 | AI驱动的智能黄历，结合现代生活场景给出建议 | /huangli |

> 注：未上线功能卡片灰色 + "即将上线"标签

##### 统一卡片规格（所有9张卡片共用，以美术虾 v6 效果图为准）

> ⚠️ **v6 美术虾审核修正（2026-04-03）**：
> 卡片风格必须走 **C端消费产品感**，禁止 B端管理后台感。
> - 有边框 + 线框图标 = 后台管理系统 ❌
> - 无边框 + 彩色图标 = 消费级产品 ✅

```
┌────────────────────────────────────┐
│                                    │
│     ┌─────────────┐               │
│     │             │               │
│     │  彩色图标    │  ← 直径48-56px │
│     │  (无背景底)  │     彩色/emoji  │
│     │             │               │
│     └─────────────┘               │
│                                    │
│     功能名称                        │
│     (font-semibold, 16-18px, 暖黑) │
│                                    │
│     第一行描述文字                   │
│     第二行描述文字                   │
│     (14px, #6B7280, 行高1.6)       │
│                                    │
│     进入分析  →                     │
│     (14px, 暖黑字, arrow)          │
│                                    │
└────────────────────────────────────┘
        ↑ 无边框、无阴影、纯白底融入页面
```

**详细属性**：

| 属性 | 值 |
|------|-----|
| 容器 | background **#FFFFFF**（纯白） |
| 边框 | **无边框 (border-none)** — v6 修正，旧版 1px solid #E5E7EB 已废弃 |
| 阴影 | **无阴影 (shadow-none)** — v6 修正 |
| 圆角 | rounded-2xl (16px)，靠背景色差异区分（白卡 vs 页面 #FAFAFA） |
| 内边距 | p-6~p-8 (24-32px) |
| Hover 效果 | transform translateY(-4px) + **微弱 shadow-sm**（不要 shadow-lg） |
| 过渡动画 | transition-all duration-300 ease |
| 内容排列 | flex flex-col, items-start (左对齐) |

**图标区域（关键！v6 美术虾审核核心改动）**：

> 旧版：灰色线条图标（lucide-react 风格）→ 废弃
> 新版：**彩色/有温度的图标**

| 属性 | 值 |
|------|-----|
| 形状 | 可选圆形底或直接展示（参考设计稿） |
| 尺寸 | 40-48px |
| 样式 | **彩色图标 / emoji 风格 / 柔和色系图标** |
| 配色原则 | 每个功能一个主色，柔和不刺眼。如：命盘解析用蓝灰、每日运势用橙粉、合婚用玫瑰红等 |
| 禁止 | 纯灰色线条图标（#374151 单色 lucide 图标）❌ |
| 居中 | flex items-center justify-center |
| 卡片内边距(图标→标题) | margin-top 16-20px (mt-4~5) |

**标题**：

| 属性 | 值 |
|------|-----|
| 字号 | 16-18px |
| 字重 | font-semibold |
| 颜色 | **rgb(28,26,22) 暖黑**（v6 修正，非 #000000） |
| 上边距 | mt-4 (图标下方) |
| 下边距 | mb-3 (描述上方) |

**描述文字（2行）**：

| 属性 | 值 |
|------|-----|
| 字号 | 13-14px |
| 颜色 | #6B7280（灰色） |
| 行高 | 1.6 (leading-relaxed) |
| 行数 | 2行（不超过） |
| 下边距 | mb-5 (链接上方) |

**"进入分析 →" 链接**：

| 属性 | 值 |
|------|-----|
| 字号 | 14px |
| 颜色 | **rgb(28,26,22) 暖黑**（v6 修正） |
| 字重 | font-medium |
| 箭头 | "→" 或 SVG arrow icon |
| Hover | underline 或 color 变深 |

**Grid 布局**：

| 属性 | 值 |
|------|-----|
| 网格 | grid grid-cols-1 md:grid-cols-3 gap-5~6 (20-24px) |
| 最大宽度 | max-w-6xl (1152px) mx-auto |
| 组间距 | 每个分组之间 mt-48~64px (mt-12~16) |

---

#### 7.1.5 底部 CTA 区域（新增！参考 FateMaster）

**位置**: 所有功能卡片下方，Footer 上方

**重要：浅色背景风格（以美术虾效果图为准）**

```
┌────────────────────────────────────────────────────────────┐
│                                                            │
│                                                            │
│          AI 分析个人特质，洞察发展潜力                       │
│          (H2, 28-32px, font-semibold, 居中, 黑色字)       │
│                                                            │
│          运用 AI 技术分析性格优势，为您的生涯规划            │
│          提供科学参考                                      │
│          (Body Small, 14px, text-gray, 居中)              │
│                                                            │
│        [ 开始查看 ]         [ 了解更多 , ]                 │
│        (黑底白字圆角)       (白底黑字描边圆角)             │
│                                                            │
│          免费使用 · 无需注册 · 即刻体验                     │
│          (Caption, 12px, text-light gray, 居中)           │
│                                                            │
│                                                    (页面底)│
└────────────────────────────────────────────────────────────┘
```

**详细规格**:

0. **背景色**: **#FAFAFA（浅灰米白），与页面整体背景一致。不是深黑色背景。不需要外层卡片容器包裹。**
1. **顶部留白**: padding-top 80-100px (pt-20~24)
2. **主标题**: `AI 分析个人特质，洞察发展潜力`
   - H2, 28-32px, font-semibold (可用 font-display 衬线体)
   - **color #0F0F0F（黑色）**, text-center
3. **副标题**: `运用 AI 技术分析性格优势，为您的生涯规划提供科学参考`
   - Body Small, 14-16px, color #6B7280
   - text-center, margin-top 16px (mt-4)
   - max-width 560px, mx-auto, leading-relaxed
4. **双按钮组**（距副标题 32-40px / mt-8~10）:
   - Primary: **黑底白字**「开始查看 ▸」(→ /bazi)，background #0F0F0F, color white, 圆角 8px, padding 14px 32px
   - Secondary: **白底黑字+细边框**「了解更多 ▸」(→ /pricing)，background white, border 1px solid #D1D5DB, color #0F0F0F, 圆角 8px, padding 14px 32px
   - 居中, gap-4
5. **信任提示**: `免费使用 · 无需注册 · 即刻体验`
   - Caption, 12px, color #9CA3AF
   - text-center, margin-top 24px (mt-6)
6. **底部留白**: padding-bottom 60-80px

> ⚠️ 注意：此区域是**浅色轻量风格**，不要做成深色/暗色背景区块。参考美术虾效果图。

**背景**: 继承首页全局太极水印背景（opacity 4-6%），不需要额外处理。整个首页底纹统一。

---

#### 7.1.6 Footer

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│   CYBERFATE                                             │
│                                                         │
│   八字功能        实用工具          公司               │
│   八字分析        AI 老黄历          博客               │
│   每日运势        历史记录          隐私政策            │
│   八字合婚        命理 AI Agent     服务条款            │
│   事业合盘                          关于               │
│   婆媳合盘                                             │
│   闺蜜合盘                                             │
│   父子关系                                             │
│                                                         │
│   © 2026 CyberFate. All rights reserved.              │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**规格**:
- 背景: #FAFAFA 或 white
- 上边框: 1px solid #F3F4F6
- 内边距: py-16 px-20 (桌面端) / py-10 px-6 (移动端)
- Logo: font-display, text-base, #0F0F0F, mb-8
- 链接分 3 列（Grid grid-cols-2 md:grid-cols-3 gap-8）
- 每列有小标题（Caption, 12px, font-medium, uppercase tracking-wider, text-gray, mb-3）
- 链接项: Text 按钮, 14px, color #4B5563, hover color #0F0F0F, mb-2
- 版权行: Caption, 12px, #9CA3AF, text-center, border-t border-gray-100 pt-8 mt-8
- 语言切换（可选）：简体中文 | English

**Footer 链接完整清单**:

| 列名 | 链接 | 路径 |
|------|------|------|
| 八字功能 | 八字分析 | /bazi |
| | 每日运势 | /daily |
| | 八字合婚 | /bazi/marriage |
| | 事业合作 | /bazi/career（如有）|
| | 婆媳关系 | /bazi/mil（如有）|
| | 闺蜜合盘 | /bazi/friend（如有）|
| | 父子关系 | /bazi/family（如有）|
| 实用工具 | AI 老黄历 | /huangli |
| | 历史记录 | /history（如有）|
| | 命理 AI Agent | /agent（如有）|
| 公司 | 博客 | /blog（如有）|
| | 隐私政策 | /privacy |
| | 服务条款 | /terms |
| | 关于 | /about |

> 未上线的功能链接可以暂时隐藏，不显示在 Footer 中

---

#### 7.1.7 首页完整结构总览（自上而下）

```
┌─ Navbar（sticky）─────────────────────────────────────┐
│  Logo  功能▾  定价  关于                    登录      │
└───────────────────────────────────────────────────────┘

┌─ Hero 区域 ──────────────────────────────────────────┐
│                                                      │
│              CYBERFATE（衬线体大标题）                │
│              解码命运 · 智见未来                     │
│           [开始分析]  [了解更多]                     │
│                                                      │
│     "When the inner situation is not made..."       │
│                       — C.G. Jung                   │
│                                                      │
│     （太极图阵列水印背景）                           │
└───────────────────────────────────────────────────────┘

┌─ 核心理念区（3列理念卡片）────────────────────────────┐
│                                                      │
│    [AI智能·科学解析]  [文化传承·理性态度]  [自主探索]  │
│                                                      │
└───────────────────────────────────────────────────────┘

┌─ 分析系统功能区（分组功能卡片）────────────────────────┐
│                                                      │
│  八字分析                                            │
│  [命盘解析]  [每日运势]  [合婚分析]                  │
│                                                      │
│  周易占卜                                            │
│  [每日决策]  [六爻占卜]  [塔罗解读]                  │
│                                                      │
│  更多工具                                            │
│  [紫微排盘]  [黄历查询]  [AI老黄历]                 │
│                                                      │
└───────────────────────────────────────────────────────┘

┌─ 底部 CTA 区域 ─────────────────────────────────────┐
│                                                      │
│      AI 分析个人特质，洞察发展潜力                    │
│                                              [探索]  │
│      免费使用 · 无需注册 · 即刻体验                 │
│                                                      │
└───────────────────────────────────────────────────────┘

┌─ Footer ─────────────────────────────────────────────┐
│  八字功能  |  实用工具  |  公司                      │
│  链接清单...                                        │
│  © 2026 CyberFate                                 │
└───────────────────────────────────────────────────────┘
```

---

### 7.2 八字分析页 `/bazi` （v2 — 2026-04-03 对标 FateMaster 补充）

> **参考竞品**: https://www.fatemaster.ai/ （八字分析页）
> **设计规范**: 遵循第六章 Design Tokens v6
> **效果图**: 待美术虾输出

#### 7.2.0 页面概述

八字分析是 CyberFate 的 **核心功能 P0**，也是用户转化的关键页面。用户路径：首页 → 八字分析 → 输入信息 → 查看结果 → 付费/注册。

**设计原则（对标 FateMaster + Design Tokens v6）**:
1. 输入表单用**无边框语言**（不是后台管理风格）
2. 结果展示区层次分明，信息密度适中
3. 四柱命盘和五行属性必须可视化展示
4. AI 解读要有独立分区，不能混在一起
5. 移动端上下堆叠，桌面端左右分栏

#### 7.2.1 导航栏

- 复用全局 Navbar 组件
- 当前页面高亮：「八字分析」
- 面包屑导航（可选）：首页 > 八字分析

#### 2.2.2 页面标题区

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│              八 字 分 析                             │
│     输入您的出生信息，AI 将为您解读命盘             │
│                                                     │
└─────────────────────────────────────────────────────┘
```

| 属性 | 值 | Tailwind |
|------|-----|----------|
| 上边距 | pt-16 md:pt-20 | `pt-16 md:pt-20` |
| 标题 | "八字分析" | H1, font-semibold, text-[28-32px], text-[#1C1A16], text-center |
| 副标题 | "输入您的出生信息，AI 将为您解读命盘" | text-[14-15px], text-[#1C1A16]/70, text-center, mt-3 |
| 对齐 | 居中 | `max-w-3xl mx-auto` |
| 背景 | #FAF9F6 暖米白（全站统一） | `bg-[#FAF9F6]` |

#### 7.2.3 主体布局

**桌面端左右分栏，移动端上下堆叠**:

```
┌─ Desktop Layout ───────────────────────────────────────┐
│                                                      │
│  ┌─ 左侧输入表单 ───┐    ┌─ 右侧结果展示区 ──────┐   │
│  │                   │    │                     │   │
│  │   性别 / 出生日期   │    │   （初始空状态/      │   │
│  │   出生时间 / 出生地 │    │    分析完成后展示）   │   │
│  │                   │    │                     │   │
│  │   [ 开始分析 ]      │    │                     │   │
│  └───────────────────┘    └─────────────────────┘   │
│                                                      │
└──────────────────────────────────────────────────────┘
```

| 属性 | 值 | Tailwind |
|------|-----|----------|
| 容器 | flex, gap-8 lg:gap-12 | `flex flex-col lg:flex-row gap-8 lg:gap-12` |
| 左侧宽度 | max-w-[440px], w-full lg:w-auto | `max-w-[440px] w-full lg:w-auto` |
| 右侧 | flex-1, min-w-0 | `flex-1 min-w-0` |
| 对齐 | items-start (顶部对齐) | `items-start` |
| 内边距 | px-4 sm:px-6 lg:px-20 | `px-4 sm:px-6 lg:px-20` |
| 上边距 | pt-16 md:pt-18 | `pt-16 md:pt-18` |

#### 7.2.4 左侧输入表单

> **2026-04-04 更新**: Frank 审核效果图后要求表单轻量化，从"后台管理风格"改为"C端消费产品感"
> **核心原则**: 输入区是辅助区，右侧结果区才是主角。左侧要轻、薄、不抢戏。

**容器样式（遵循 Design Tokens v6 无边框语言 + 轻量化修正）**:

| 属性 | 值 | Tailwind |
|------|-----|----------|
| 背景 | #FFFFFF 纯白 | `bg-white` |
| 边框 | **无** | `border-none` （⚠️ 不是 border-brand-border） |
| 阴影 | **无** | `shadow-none` （⚠️ 不是 shadow-form） |
| 圆角 | 16px | `rounded-2xl` |
| 内边距 | p-8 ~ p-10 | `p-8 md:p-10` |

**表单项（每项间距 mb-4）**:
- ⚠️ 注意：间距从旧版 mb-6 缩小到 **mb-4**，更紧凑

##### 字段 1：性别选择

| 属性 | 值 |
|------|-----|
| 类型 | SegmentControl（分段控制器） |
| 选项 | 男 / 女 |
| 必填 | 是 |
| 样式 | 两等宽并排, gap-3, 高度 40px |
| 选中态 | bg-[#1C1A16] text-white |
| 未选中态 | bg-[#FAFAFA] text-[#1C1A16]/70 |
| 圆角 | rounded-lg (8px) |
| 字号 | text-sm (14px), font-medium |

##### 字段 2：出生日期

| 属性 | 值 |
|------|-----|
| 类型 | Date Input (type="date") |
| 必填 | 是 |
| 样式 | **h-10 (40px)**, **rounded-lg (8px)**, border 1px solid #D1D5DB |
| ⚠️ 高度从旧版 h-12(48px) 降到 h-10(40px)，圆角从 rounded-xl(16px) 降到 rounded-lg(8px) |
| Focus | border-[#1C1A16], ring 2px rgba(28,26,22,0.06) |
| Placeholder | "请选择日期" (text-[#1C1A16]/25) |
| 字号 | text-sm (14px) |

##### 字段 3：出生时间

| 属性 | 值 |
|------|-----|
| 类型 | Time Input (type="time") |
| 必填 | 否（可选，不选则默认午时） |
| 样式 | 同上（h-10, rounded-lg） |
| 说明文字 | "可选，不填默认正午 12:00" (text-xs text-[#1C1A16]/45) |

##### 字段 4：出生地

| 属性 | 值 |
|------|-----|
| 类型 | 搜索输入框（带地点图标） |
| 必填 | 是 |
| 样式 | 同上（h-10, rounded-lg） |
| Placeholder | "搜索并选择出生地" |
| 图标 | 左侧地图 pin 图标 |

##### 开关：使用早晚子时

| 属性 | 值 |
|------|-----|
| 类型 | Switch/Toggle |
| 默认 | 关（false） |
| 说明 | 开启后时柱计算自动调整 |

##### 提交按钮（Ghost 轻量样式）

> **2026-04-04 更新**: 从 Primary 黑底白字改为 Ghost 次按钮。原因：表单内不需要重按钮抢视觉焦点。

| 属性 | 值 | Tailwind |
|------|-----|----------|
| 文字 | "开始分析" | `开始分析` |
| 样式 | **Ghost 次按钮**（不是 Primary） |
| 背景 | transparent | `bg-transparent` |
| 边框 | 1px solid rgba(28,26,22,0.14) | `border border-[rgba(28,26,22,0.14)]` |
| 文字色 | #1C1A16 | `text-[#1C1A16]` |
| 尺寸 | w-full, **h-[44px]** | `w-full h-[44px]` |
| ⚠️ 高度从旧版 h-[50px] 降到 **h-[44px]** |
| 位置 | 表单最底部, mt-6（从 mt-8 缩小） |
| 字号 | text-[13px], tracking-wide | `text-[13px] tracking-wide` |
| Padding | py-[12px] px-[38px] | `py-[12px] px-[38px]` |
| ⚠️ padding 从旧版 py-[14px] 缩到 **py-[12px]** |
| Hover | 极淡暖底 + 边框加深 | `hover:bg-[rgba(28,26,22,0.015)] hover:border-[#1C1A16]` |
| 圆角 | rounded-2xl | `rounded-2xl` |

**Input 统一样式（遵循 6.11 表单规范 + 轻量化修正）**:
- 高度: **h-10 (40px)** — ⚠️ 从旧版 h-12(48px) 改
- 圆角: **rounded-lg (8px)** — ⚠️ 从旧版 rounded-xl(16px) 改
- 边框: 1px solid #D1D5DB
- Focus: border-[#1C1A16] + ring 2px rgba(28,26,22,0.06)
- Placeholder: text-[#1C1A16]/25 (muted)
- 字号: text-sm (14px)
- 文字色: text-[#1C1A16]

**左右分栏布局参数（轻量化修正）**:

| 属性 | 旧值 | 新值 | Tailwind |
|------|------|------|----------|
| 左右间距 | gap-8 lg:gap-12 | **gap-6 lg:gap-8** | `gap-6 lg:gap-8` |
| 左侧上边距 | pt-16 | **pt-10** | `pt-10` |
| 表单项间距 | mb-6 | **mb-4** | `mb-4` |

#### 7.2.5 右侧结果展示区

> **2026-04-04 重写**: 基于美术虾八字页效果图逐像素对齐。所有布局、样式以效果图为准。
> **效果图参考**: 美术虾 v6 八字页效果图（Frank 已确认）

**初始状态（未分析时）：**

- 居中显示，bg-white 或 bg-[#FAFAFA] 极淡底
- 文字: text-[#1C1A16]/50, text-sm
- 最小高度: min-h-[400px]
- 内容: 太极图标 + "输入您的出生信息，点击「开始分析」AI 将为您生成专属命盘解读"

**分析完成后（有内容时）：**

结果区从上到下依次为以下区块。每个区块间距 **mb-10 ~ mb-12**。

---

##### 区块 A — 四柱命盘（4 个独立卡片横排）

> **效果图对照**: 效果图明确为 4 个等宽圆角小卡片横向排列，每个卡片内含天干+地支+十神。

**标题**: "四柱命盘" — H3, text-lg (18px), font-semibold, text-[#1C1A16], mb-5

**布局**: 4 等宽卡片横排 — `grid grid-cols-4 gap-3` 或 `flex gap-3`

**每个卡片规格**:

| 属性 | 值 | Tailwind |
|------|-----|----------|
| 背景 | #FFFFFF 白色 | `bg-white` |
| 边框 | 无 | `border-none` |
| 圆角 | 12-14px | `rounded-xl` or `rounded-[14px]` |
| 内边距 | py-4 px-4 | `p-4` |
| 阴影 | 无默认 | `shadow-none` |
| Hover | 微浮 + 浅影 | `hover:-translate-y-0.5 hover:shadow-card-hover transition-all duration-300` |

**每个卡片内部结构（从上到下）**:

| 行 | 内容 | 样式 |
|----|------|------|
| 第1行 | 天干地支大字（如"乙亥"） | text-xl (20px), font-semibold, text-[#1C1A16], text-center |
| 第2行 | 空行间距 | mt-2 |
| 第3行 | 柱名称（如"年柱"/"日主"） | text-xs, text-[#1C1A16]/50 (muted), text-center |
| 第4行 | 日主标记（仅日柱显示） | text-xs, bg-yellow-50 text-yellow-700, px-1.5 py-0.5 rounded, inline-flex |
| 第5行 | 十神信息（如"十神:偏财"） | text-xs, text-[#1C1A16]/70 (secondary), text-center, mt-2 |

> 注意：日柱卡片需要特殊处理——显示"日主"而非"日柱"，并加日主高亮标记。

---

##### 区块 B — 五行属性（圆形图标 + 文字标签）

> **效果图对照**: 效果图为 5 个彩色圆形图标横向排列，每个圆下方有文字标签。

**标题**: "五行属性" — H3, text-lg (18px), font-semibold, text-[#1C1A16], mb-5

**布局**: 5 等宽横向排列 — `flex justify-around` or `grid grid-cols-5 gap-4`

**每个五行项规格**:

| 属性 | 值 |
|------|-----|
| 图标容器 | 圆形, w-12 h-12 rounded-full, 居中对齐 |
| 图标颜色(金) | #F3E8FF 紫 |
| 图标颜色(木) | #D1FAE5 绿 |
| 图标颜色(水) | #DBEAFE 蓝 |
| 图标颜色(火) | #FEE2E2 红 |
| 图标颜色(土) | #FEF3C7 黄 |
| 图标尺寸 | 24px (w-6 h-6) |
| 元素名 | text-sm, font-medium, text-[#1C1A16], text-center, mt-2 |
| 旺弱标注 | text-xs, text-[#1C1A16]/45 (muted), text-center, mt-0.5 |

---

##### 区块 C — 日主 / 生肖 / 纳音补充信息

> **效果图对照**: 效果图在四柱和五行之间有一行补充信息。

**布局**: 横向排列，用竖线 `|` 分割

| 属性 | 值 |
|------|-----|
| 分割线 | 1px solid rgba(28,26,22,0.08) |
| Label | text-xs, text-[#1C1A16]/50 (muted) |
| Value | text-sm, font-medium, text-[#1C1A16] |
| 日主高亮 | 大字 + 暖黑底色 bg-[#1C1A16]/5 rounded px-1 |

示例内容: `日主：癸水  |  生肖：兔  |  纳音：大海水（癸亥）`

---

##### 区块 D — AI 解读区（Tab 切换 + 正文）

> **效果图对照**: 效果图有明确的 3 个 Tab 切换器，下方是 AI 生成的正文。

**标题**: "✦ AI 解读" — H3, text-lg (18px), font-semibold, text-[#1C1A16], mb-4

**Tab 切换器规格**:

| 属性 | 值 | Tailwind |
|------|-----|----------|
| 容器 | 横向排列 + 底部分割线 | `flex border-b border-[rgba(28,26,22,0.08)]` |
| Tab 未选中 | 透明底, muted 文字 | `px-4 py-2.5 text-sm text-[#1C1A16]/50 cursor-pointer` |
| Tab 选中 | 底部品牌色下划线 | `text-[#1C1A16] font-medium border-b-2 border-[#1C1A16] -mb-[1px]` |
| Tab 选项 | "命理解读" / "性格分析" / "科学客观" | 3 个 |
| 默认激活 | "命理解读" | 第一个 |

**正文区域**:

| 属性 | 值 | Tailwind |
|------|-----|----------|
| 上边距 | mt-6 | `mt-6` |
| 字号 | 14-15px | `text-[14px]` or `text-base` |
| 行高 | 1.7 | `leading-relaxed` |
| 颜色 | #1C1A16 | `text-[#1C1A16]` |
| 段落间距 | mb-4 | 解读内部分段 |

**三个 Tab 的内容来源**:

| Tab | 内容 | 来源 |
|-----|------|------|
| 命理解读 | 综合四柱+五行+大运的整体解读 | LLM API (DeepSeek V3) |
| 性格分析 | 专注性格特质、行为模式、优劣势 | LLM API |
| 科学客观 | 客观事实：日主五行、十神格局、强弱旺衰 | 算法引擎提取 |

---

##### 区块 E — 全方位命理分析（2x3 网格卡片）

> **效果图对照**: 效果图明确为 2 行 3 列网格，每格有彩色图标 + 标题 + 描述文字。

**标题**: "全方位命理分析" — H3, text-lg (18px), font-semibold, text-[#1C1A16], mb-5

**布局**: 2x3 网格 — `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4`

**卡片规格（遵循 Design Tokens v6 无边框语言）**:

| 属性 | 值 | Tailwind |
|------|-----|----------|
| 背景 | #FFFFFF | `bg-white` |
| 边框 | 无 | `border-none` |
| 圆角 | 12-14px | `rounded-xl` or `rounded-[14px]` |
| 内边距 | p-5 or p-6 | `p-5 md:p-6` |
| 阴影 | 无默认 | `shadow-none` |
| Hover | 微浮 + 浅影 | `hover:-translate-y-0.5 hover:shadow-card-hover transition-all duration-300` |

**每个卡片内部结构**:

| 行 | 内容 | 样式 |
|----|------|------|
| 图标 | 彩色 lucide 图标 | w-8 h-8 (32px) |
| 标题 | 如"性格洞察" | text-base (15-16px), font-semibold, text-[#1C1A16], mt-3 |
| 描述 | AI 生成 2-3 行描述 | text-sm (13-14px), text-[#1C1A16]/70, leading-relaxed, mt-2 |

**6 个卡片内容**:

| 卡片 | 推荐图标色 | 图标建议 |
|------|-----------|---------|
| 性格洞察 | 紫/靛蓝 | Brain / User |
| 事业方向 | 蓝 | Briefcase / TrendingUp |
| 财运特征 | 金黄 | Coins / Wallet |
| 婚姻感情 | 粉红 | Heart |
| 健康运势 | 绿 | HeartPulse / Activity |
| 人际关系 | 橙 | Users / Handshake |

---

##### 区块 F — 五维运势评分（横向进度条）

> **效果图对照**: 效果图有 5 条横向进度条，右侧带分数数字。

**标题**: "五维运势评分" — H3, text-lg (18px), font-semibold, text-[#1C1A16], mb-5

**布局**: 纵向堆叠 — `flex flex-col gap-4`

**每行结构**: 左侧维度名(w-16~20) + 中间进度条(flex-1) + 右侧分数(w-8)

**进度条规格**:

| 属性 | 值 | Tailwind |
|------|-----|----------|
| 容器高度 | 8px | `h-2` |
| 底色 | gray-100 | `bg-gray-100` |
| 圆角 | full | `rounded-full` |
| 维度名 | text-sm font-medium text-[#1C1A16] | 左对齐 |
| 分数数字 | text-sm font-semibold text-[#1C1A16] | 右对齐 |

**5 个维度及填充色**:

| 维度 | 进度条填充色 | 数据来源 |
|------|------------|---------|
| 事业运 | 蓝色 #3B82F6 | 八字月柱/年柱 |
| 财富运 | 金黄 #EAB308 | 八字财星 |
| 感情运 | 粉红 #EC4899 | 日柱 + 合化 |
| 健康运 | 绿色 #22C55E | 日柱 + 十神 |
| 学业运 | 靛蓝 #6366F1 | 印星/文昌 |

---

##### 区块 G — 操作按钮行

> **效果图对照**: 结果区底部有 3 个 Ghost 按钮。

**布局**: 横向居中 — `flex justify-center gap-4`

**按钮规格**: Ghost 次按钮
- `border border-[rgba(28,26,22,0.14)] bg-transparent text-[#1C1A16]`
- `text-[13px] px-[28px] py-[10px] rounded-xl`
- hover: `hover:bg-[rgba(28,26,22,0.015)] hover:border-[#1C1A16]`

**3 个按钮**: "保存报告" / "重新分析" / "分享结果"

---

##### 区块 H — FAQ 常见问题（手风琴折叠）

> **效果图对照**: 效果图最底部有 5 个可折叠问答项。

**标题**: "常见问题" — H3, text-lg (18px), font-semibold, text-center, text-[#1C1A16], mt-12 mb-6

**容器最大宽度**: max-w-[800px] mx-auto（不撑满全宽）

**5 个问答项**:

| # | 问题 | 答案要点 |
|---|------|---------|
| Q1 | 八字分析准确吗？ | 基于传统子平术 + AI 辅助验证，准确度高于纯人工排盘。但任何命理工具都仅供参考，不做唯一决策依据。 |
| Q2 | 如果不知道准确的出生时间怎么办？ | 可以填写大致的中午 12:00。误差在 2 小时以内影响较小。 |
| Q3 | 八字和西方星座有什么区别？ | 八字看时间线上的能量分布（四柱），星座看空间能量（黄道十二宫）。两者互补不矛盾。 |
| Q4 | 多久查看一次八字分析？ | 大运每 10 年变一次（重要节点），流年每年变。日常可看每日运势即可。 |
| Q5 | 八字能帮助做重要决定吗？ | 可以提供参考维度。最终决定权在你。 |

**Accordion 样式**:
- 标题: text-left, font-medium, text-sm, text-[#1C1A16]
- 图标: chevron-down icon, 展开 180° 旋转
- 内容: text-sm, text-[#1C1A16]/70, leading-relaxed, pt-3 pb-4
- 分割线: 底部 1px solid rgba(28,26,22,0.06)
#### 7.2.6 FAQ 区块（新增 — 对标 FateMaster）

**位置**: 结果区下方，操作引导上方

**标题**: "常见问题" — H3, 20px, font-semibold, text-center, text-[#1C1C16], mt-16 mb-8

**手风琴折叠项（Accordion）**:

| # | 问题 | 答案要点 |
|---|------|---------|
| Q1 | 八字分析准确吗？ | 基于传统子平术 + AI 辅助验证，准确度高于纯人工排盘。但任何命理工具都仅供参考，不做唯一决策依据。 |
| Q2 | 如果不知道准确的出生时间怎么办？ | 可以用起卦法（如六爻）做参考，或填写大致的中午 12:00。误差在 2 小时以内影响较小。 |
| Q3 | 八字和西方星座有什么区别？ | 八字看时间线上的能量分布（四柱），星座看空间能量（黄道十二宫）。两者互补不矛盾。 |
| Q4 | 多久查看一次八字分析？ | 大运每 10 年变一次（重要节点），流年每年变。日常可看每日运势即可。 |
| Q5 | 八字能帮助做重要决定吗？ | 可以提供参考维度（如某天适合签合同、某月注意健康）。最终决定权在你。 |

Accordion 样式:
- 触发行: 点击展开/收起
- 标题: text-left, font-medium, text-sm, text-[#1C1C1A16]
- 图标: chevron-down icon, 展开 180° 旋转
- 内容: text-sm, text-[#1C1A16]/70, leading-relaxed, mt-2, pb-4
- 分割线: 底部 1px solid rgba(28,26,22,0.06)

---

#### 7.2.7 使用指南（新增 — 对标 FateMaster）

**位置**: FAQ 下方或侧边栏

**标题**: "使用指南" — H3, 20px, font-semibold, text-center, text-[#1C1C16], mt-16 mb-8

**步骤卡片（横向或纵向排列）**:

| 步骤 | 内容 | 图标 |
|------|------|------|
| 1 | 选择性别 | 👤 |
| 2 | 选择出生日期和时间 | 📅 |
| 3 | （可选）搜索出生地 | 📍 |
| 4 | 点击「开始分析」 | 🔮 |
| 5 | 等待 5-10 秒 | ⏳ |
| 6 | 向下滚动查看结果 | ⬇ |

---

#### 7.2.8 移动端适配

| 断点 | 行为 |
|------|------|
| >= 1024px (Desktop) | 左右分栏（输入左 + 结果右） |
| 640-1023px (Tablet) | 保持分栏但缩小间距 (gap-6) |
| < 640px (Mobile) | 上下堆叠（表单在上，结果在下）|

移动端特殊处理:
- 输入表单宽度 100%（不再限 440px）
- 按钮保持 w-full h-[50px]
- 结果区各区块间距适当压缩（mb-6 → mb-4）
- 五维进度条改为纵向排列（如果横向太挤）

---

#### 7.2.9 错误状态与边界情况

| 场景 | 处理方式 |
|------|---------|
| 日期无效（如 2月30日） | 输入框抖动 + 提示文字 "请选择有效日期" |
| 时间为空 | 默认 12:00 正午 |
| 未填必填项（性别/日期） | 必填项标红 * 或边框变 brand 色，提交按钮禁用 |
| API 错误 | Toast 提示 "分析失败，请稍后重试" |
| 网络超时 | Loading skeleton + 超时重试按钮 |
| 未登录 | 结果区显示摘要 + "登录查看完整报告" CTA |

---

### 7.2.10 八字页 vs FateMaster 差异总结

| 功能/区块 | FateMaster | CyberFate | 状态 |
|----------|-----------|-----------|------|
| 导航栏 + 标题区 | ✅ | ✅ | 一致 |
| 输入表单（性别/日期/时间/出生地） | ✅ | ✅ | 一致 |
| 早晚子时开关 | ✅ | ⚠️ 需确认 |
| **四柱命盘展示（年/月/日/时+十神）** | ✅ | ❌ 缺 | **需补** |
| **五行属性可视化（Tag 或圆环图）** | ✅ | ❌ 缺 | **需补** |
| **AI 解读独立分区（Tab 切换）** | ✅ | 部分 | **需补** |
| **全方位命理解析（性格/事业/财运/健康/婚姻/人际）** | ✅ 6 格 | 部分 3 格 | **需补** |
| **五维运势评分（进度条或雷达图）** | ✅ | ❌ 缺 | **建议补** |
| **FAQ 手风琴（5 个常见问题）** | ✅ | ❌ 缺 | **需补** |
| **使用指南** | ✅ | ❌ 缺 | **建议补** |
| 操作引导（保存/分享/重分析） | ✅ | ❌ 缺 | **建议补** |
| 表单容器无边框 | ✅ 设计稿要求 | ⚠️ 当前有 border+shadow 需改 |

---

> **开发优先级建议**:
> - **第一批（P0）**: 四柱展示 + 五行可视化 + AI 解读分区 + 表单去边框 + FAQ
> - **第二批（P1）: 五维评分 + 全方位命理解析扩展 + 使用指南 + 操作引导
> - **第三批（P2）: 入场动画 + 雷达图

---

#### 7.2.10.1 新增大运流年表格区块（区块 I）

> **触发原因**: 2026-04-12 Frank 提供竞品八字结果页截图，对比发现大运流年表是竞品占比最大的核心模块，我们 PRD 完全缺失。
> **定位**: 八字产品的**核心价值模块**，用户最关心的长期运势走向。

**标题**: "大运流年" — H3, text-lg (18px), font-semibold, text-[#1C1A16], mb-5

**布局**: 纵向时间轴式表格，从当前大运开始向后展示 5~6 步大运。

**表格结构**:

| 列 | 内容 | 样式 |
|---|------|------|
| 大运序号 | "第一步大运"、"第二步大运"... | text-xs, text-[#1C1A16]/50, w-20 |
| 起止年龄 | "3岁 ~ 12岁"、"13岁 ~ 22岁"... | text-sm, font-medium, text-[#1C1A16], w-24 |
| 天干地支 | "丙寅"、"丁卯"... | text-base, font-semibold, text-[#1C1A16] |
| 大运十神 | 如"正官"、"偏财" | text-sm, text-[#1C1A16]/70 |
| 运势描述 | AI 生成的 1~2 句运势概括 | text-sm, text-[#1C1A16]/70, leading-relaxed |
| 旺衰标记 | 吉/平/凶 小 Tag | text-xs, px-1.5 py-0.5 rounded; 吉=green bg, 凶=red bg, 平=gray bg |

**每行规格**:

| 属性 | 值 | Tailwind |
|------|-----|----------|
| 容器 | 白色卡片，每行一个卡片或表格一行 | `bg-white rounded-xl p-4` 或 `border-b border-[rgba(28,26,22,0.06)]` |
| 行间距 | mb-3 | `mb-3` |
| 当前大运高亮 | 左侧 3px 品牌色竖条 + 极淡底色填充 | `border-l-3 border-[#1C1A16] bg-[rgba(28,26,22,0.02)]` |
| Hover | 微浮 | `hover:-translate-y-0.5 transition-all duration-200` |

**数据来源**:
- 大运起止年龄：由 lunar-javascript 库计算（基于出生八字）
- 天干地支十神：同上
- 运势描述：LLM API 按每步大运生成一句话概括
- 旺衰标记：根据大运五行与日主五行关系算法判断

**移动端适配**:
- < 640px: 表格改为纵向卡片堆叠（每个大运一张独立卡片）
- 卡片内字段上下排列：天干地支大字 → 起止年龄 → 十神 → 描述 → 旺衰 Tag

---

#### 7.2.10.2 新增命格/格局判断（区块 C 扩展）

> **触发原因**: 竞品截图顶部有明确的格局判定，这是专业性的基础标志。我们区块 C 只有日主/生肖/纳音，缺格局。

**在现有区块 C（日主/生肖/纳音）中新增一行**:

```
现有: 日主：癸水  |  生肖：兔  |  纳音：大海水（癸亥）
新增: 命格：正财格  |  日主强弱：偏弱  |  用神：火  |  忌神：水
```

**新增字段规格**:

| 字段 | 说明 | 数据来源 |
|------|------|---------|
| 命格 | 如"正财格"、"七杀格"、"食神生财格"等 | 算法引擎根据四柱十神配置判断 |
| 日主强弱 | "偏强"/"中和"/"偏弱" 三档 | 得令+得地+得势综合计算 |
| 用神 | 对日主有利的五行，如"火" | 算法引擎 |
| 忌神 | 对日主不利的五行，如"水" | 算法引擎 |

**样式**:
- 与现有区块 C 同风格：横向排列，竖线分割
- 命格值加粗高亮：text-sm, font-semibold, text-[#1C1A16]
- 用神/忌神用五行色圆点标识（用神绿、忌神红）
- 整体作为区块 C 的第二行，与第一行（日主/生肖/纳音）间距 mt-3

---

#### 7.2.10.3 五行属性升级为量化展示（区块 B 升级）

> **触发原因**: 竞品截图的五行不只是图标标签，还有具体数量统计和旺弱判定。我们的区块 B 太简单。

**从"纯定性"升级为"定量+定性"双模式**:

**方案 A（推荐）：Tag + 数量 + 圆环图**

布局改为上下两部分：

**上半部分 — 5 个五行 Tag（保留现有设计但增强）**:

| 属性 | 旧值 | 新值 |
|------|------|------|
| 图标容器 | 圆形 w-12 h-12 | 圆形 w-14 h-14（稍大） |
| 元素名 | text-sm font-medium | text-sm font-medium（不变） |
| 旺弱标注 | text-xs muted | **text-xs font-medium + 颜色编码**（旺=绿/强=蓝/弱=橙/衰=红） |
| **新增：数量统计** | 无 | 图标下方显示 "X个"，如 "金 1个" |

**下半部分 — 圆环图（新增）**:

| 属性 | 值 |
|------|-----|
| 类型 | Donut Chart（环形图） |
| 尺寸 | w-48 h-48 (192px) |
| 位置 | 居中，五行 Tags 下方 |
| 数据 | 五行各元素数量占比 |
| 配色 | 金=#F59E0B / 木=#22C55E / 水=#3B82F6 / 火=#EF4444 / 土=#EAB308 |
| 中心文字 | 日主五行大字 + "日主"标注 |
| Tooltip | hover 显示 "金：1个（16.7%）" |

**方案 B（备选）：纯横向进度条**

如果圆环图开发成本高，退而用 5 条横向进度条替代：
- 每行：五行名(左) + 进度条(中) + 数量(右)
- 进度条长度 = 该五行数量 / 8（总天干地支数）
- 填充色 = 该五行对应颜色

**推荐方案 A**，圆环图视觉冲击力强，适合分享传播。

---

#### 7.2.10.4 新增十神详细解读（区块 D 扩展）

> **触发原因**: 竞品截图有专门的十神分析区（每种十神一段解读文字）。我们只在四柱卡片里标注了名称，用户看不懂"偏财"意味着什么。

**位置**: 区块 D（AI 解读区）内新增第四个 Tab —— "十神详解"

**Tab 切换器更新**:

| 旧 Tab 列表 | 新 Tab 列表 |
|-------------|-------------|
| 命理解读 / 性格分析 / 科学客观 | 命理解读 / 性格分析 / 十神详解 / 科学客观 |

**"十神详解" Tab 内容**:

布局为 2x3 或 2x4 网格卡片（视实际出现的十神数量动态渲染），每个卡片：

| 行 | 内容 | 样式 |
|----|------|------|
| 十神名 | 如"正财"、"偏财"、"正官"... | text-base, font-semibold, text-[#1C1A16] |
| 是否出现 | "✓ 命盘出现" / "— 未透出" | text-xs; 出现=green / 未出现=muted |
| 基本含义 | 一句话解释该十神代表什么 | text-sm, text-[#1C1A16]/70, leading-relaxed |
| 对命主的影响 | 结合本命盘的具体影响描述 | text-sm, text-[#1C1A16], mt-2 |

**十神列表（共 10 个，按重要性排序）**:

| 十神 | 含义简述 |
|------|---------|
| 正财 | 正常收入、稳定财富、保守理财 |
| 偏财 | 投资收益、意外之财、商业机会 |
| 正官 | 地位、权力、纪律、上司缘 |
| 七杀 | 压力、挑战、魄力、变革动力 |
| 正印 | 学历、名誉、母亲、保护力 |
| 偏印 | 独特思维、专业技能、偏门学问 |
| 食神 | 才艺、享受、口福、表达力 |
| 伤官 | 创造力、叛逆、才华外露 |
| 劫财 | 竞争、朋友、花销、冒险 |
| 比肩 | 自信、独立、同行、合伙 |

**数据来源**: 算法引擎提取四柱十神配置 + LLM 生成个性化影响描述

---

#### 7.2.10.5 新增分享卡片物料规范（区块 G 扩展）

> **触发原因**: 竞品底部有适合社交分享的精炼总结卡。我们有"分享结果"按钮但没有定义分享出去的内容长什么样。

**分享卡片设计规范**:

**尺寸**: 750 x 1334 px（iPhone 全屏分享比例，适配微信朋友圈）

**内容结构（从上到下）**:

| 区域 | 内容 | 样式 |
|------|------|------|
| 顶部品牌区 | CyberFate logo + "赛博命理师" | 居中, 顶部留白 80px |
| 主标题 | "我的八字命盘" | text-2xl, font-bold, 居中 |
| 四柱摘要 | "乙亥 / 丙戌 / 癸卯 / 原文" | text-xl, font-semibold, 居中, 字间距宽 |
| 日主信息 | "日主：癸水 \| 生肖：兔" | text-sm, muted, 居中, 竖线分割 |
| 一句话命运总结 | AI 生成的一句话（如"水木相生，聪慧灵动，宜顺势而为"） | text-base, 居中, 主色调 |
| 二维码 | 跳转 cyberfate.me/bazi | 居中, 120x120px |
| 底部 CTA | "扫码查看你的命盘 →" | text-xs, muted, 底部留白 60px |

**背景**: 使用全站 Design Tokens 渐变背景（暖米白 #FAF9F6 到极淡金 #FEF9E7）

**技术实现方式**:
- 前端用 html2canvas 截 DOM 生成图片
- 或后端用 Puppeteer/Playwright 渲染生成
- 推荐前端 html2canvas 方案（实时、无需后端 API）

---

### 7.2.11 八字页 vs 竞品差异更新（2026-04-12）

> **基于 Frank 提供的竞品八字结果页截图做第二轮对比，补充 7.2.10.1 ~ 7.2.10.5 后的状态更新。

| 功能/区块 | 竞品截图 | CyberFate PRD 更新后 | 状态 |
|----------|---------|---------------------|------|
| 四柱命盘展示 | ✅ | ✅ 区块 A | 已覆盖 |
| 五行属性可视化 | ✅ 数量+圆环 | ✅ 区块 B 升级 (7.2.10.3) | **已补** |
| 日主/生肖/纳音 | ✅ | ✅ 区块 C | 已覆盖 |
| **命格/格局判断** | ✅ | ✅ 区块 C 扩展 (7.2.10.2) | **已补** |
| **用神/忌神** | ✅ | ✅ 区块 C 扩展 (7.2.10.2) | **已补** |
| AI 解读分区 | ✅ | ✅ 区块 D (3 Tab) | 已覆盖 |
| **十神详细解读** | ✅ 独立区 | ✅ 区块 D 第四 Tab (7.2.10.4) | **已补** |
| 全方位命理分析 6 维 | ✅ | ✅ 区块 E | 已覆盖 |
| 五维运势评分 | ✅ | ✅ 区块 F | 已覆盖 |
| **大运流年表格** | ✅ 核心模块 | ✅ 新增区块 I (7.2.10.1) | **已补** |
| FAQ 手风琴 | ✅ | ✅ 区块 H | 已覆盖 |
| **分享卡片物料** | ✅ | ✅ 区块 G 扩展 (7.2.10.5) | **已补** |
| 操作引导 | ✅ | ✅ 区块 G | 已覆盖 |

---

## 7.2.12 八字结果页改版 v3（2026-04-07）

> **触发原因**: Frank 基于当前线上结果页截图提出改版需求
> **核心问题**: 当前结果页信息堆砌、层级扁平、缺乏交互、无历史记录
> **改版目标**: 从"信息堆砌" → 自然分层 + 新增基本信息模块 + 历史记录功能
> **参考**: Frank 提供的竞品「基本信息」卡片截图

### 当前页面问题诊断

基于截图分析，当前结果页存在以下问题：

| # | 问题 | 严重度 | 说明 |
|---|------|--------|------|
| P0-1 | 信息密度过高 | 高 | 一页塞入四柱+五行+性格+事业+财运+婚姻+健康+人际+大运流年，用户不知道重点看哪里 |
| P0-2 | 视觉层级扁平 | 高 | 所有区块样式雷同，没有主次之分 |
| P1-1 | 缺乏交互设计 | 中 | 纯静态展示，用户无法深入探索感兴趣的部分 |
| P1-2 | 移动端体验差 | 中 | 超长页面在手机上需滑动极久 |
| P2-1 | 无历史记录 | 中 | 算过的命盘无法回看 |
| P2-2 | 看不到自己填了什么 | 中 | 点完分析后，输入信息消失，用户无法确认是否正确 |

### 改版后页面结构（从上到下自然流动）

 结果页（点击「开始分析」后展示）
 │
 ├─ ① 基本信息 ← 新增，确认你填了什么
 │
 ├─ ② 四柱命盘（4 卡片横排）
 │
 ├─ ③ 五行属性（圆环图 + Tag）
 │
 ├─ ④ 日主摘要（一句话概括你是谁）
 │
 ├─ ⑤ AI 解读（Tab 切换：性格 / 事业财运 / 婚姻健康 / 大运流年）
 │
 ├─ ⑥ FAQ（手风琴）
 │
 └─ ⑦ 底部操作栏（保存 / 分享 / 重算 / 查看历史）

**设计原则：**
1. 首屏给结论 — 用户最关心"我是什么命"
2. 先确认再解读 — 基本信息让用户确认输入无误
3. 信息按需折叠 — AI 解读用 Tab，不强制全量铺开
4. 操作收底 — 不单独占区，自然放在页面底部

---

#### ① 基本信息（新增）

> 用户点了「开始分析」后，第一个看到的模块。确认"我到底填了什么"。
> 参考 Frank 提供的竞品截图风格。

**位置**: 结果区最顶部，四柱命盘之前

┌─ 基本信息 ───────────────────────────────────────────┐
│                                                        │
│  基本信息                           ✎ (编辑)  🗑 (删除)│
│                                                        │
│  八字：癸亥  庚申  辛巳  甲午    [📋 复制八字]          │
│  ─────────────────────────────────────────────────    │
│  姓名          周峰                                     │
│  性别          男                                      │
│  出生时间  ⓘ   1983/08/21 11:44                        │
│  真太阳时修正    -0.26 分钟                             │
│  对应农历      农历一九八三年七月十三                    │
│  生肖          猪                                      │
│  大运起运时间    出生4年4个月6天6小时后起运              │
│               1987/12/28 01:44                         │
│                                                        │
└────────────────────────────────────────────────────────┘

**容器规格：**

| 属性 | 值 | Tailwind |
|------|-----|----------|
| 背景 | #FFFFFF 白色 | \ |
| 圆角 | 16px | \ |
| 内边距 | p-5 md:p-6 | \ |
| 边框 | 无 | \ |
| 阴影 | 无 | \ |

**标题行：**

| 属性 | 值 |
|------|-----|
| 标题文字 | "基本信息" |
| 标题样式 | text-base (16px), font-semibold, text-[#1C1A16] |
| 右侧操作 | 编辑图标(✎) + 删除图标(🗑)，各 w-8 h-8，muted 色，hover 变深 |
| 编辑行为 | 点击后回到输入表单并回填当前数据 |
| 删除行为 | 二次确认弹窗 → 清除结果回到空白态 |

**八字行（标题下方）：**

| 属性 | 值 |
|------|-----|
| Label | "八字：" + 四柱干支（如"癸亥 庚申 辛巳 甲午"） |
| 干支字号 | text-base, font-medium, monospace（等宽字体） |
| 复制按钮 | 小 Ghost 按钮 \，点击复制到剪贴板 + Toast 提示 |
| 分割线 | 下方 1px solid rgba(28,26,22,0.08), my-4 |

**信息列表（键值对）：**

| 行 | Label | Value 样式 | 说明 |
|----|-------|-----------|------|
| 姓名 | text-sm text-[#1C1A16]/60, w-20 | text-sm font-medium text-[#1C1A16] | 用户填的昵称，未填则显示"未填写" |
| 性别 | 同上 | 同上 | 男/女 |
| 出生时间 | 同上 + ⓘ 图标(可选提示) | 同上 | 格式 YYYY/MM/DD HH:mm |
| 真太阳时修正 | 同上 | 同上 | 数值 + "分钟"，无数据则不显示此行 |
| 对应农历 | 同上 | 同上 | 如"农历一九八三年七月十三" |
| 生肖 | 同上 | 同上 | 如"猪" |
| 大运起运时间 | 同上（两行：描述 + 具体时间） | 同上 | 描述行 + ISO 时间行 |

**特殊处理：**
- 未登录用户：「姓名」显示为"—"
- 未填时间的项：Label 显示但 Value 为"—"
- 真太阳时修正：仅当用户开启早晚子时开关且有时差时显示
- 移动端：Label 和 Value 改为上下堆叠（非左右并排），节省横向空间

---

#### ② 四柱命盘（4 卡片横排）

沿用现有 7.2.5 区块 A 设计，微调：

| 调整项 | 旧版 | 新版 v3 |
|--------|------|---------|
| 卡片间距 | gap-3 | gap-2.5（更紧凑） |
| 天干地支字号 | text-xl (20px) | **text-2xl (24px)**（更醒目） |
| Hover 效果 | 微浮+浅影 | 保持不变 |
| 日主标记 | 小 Tag | **加脉冲动画**（吸引注意日主在哪柱） |

---

#### ③ 五行属性可视化

沿用区块 B 设计，新增改动：

**双展示模式（同时存在）：**
- 上方：五行圆环图（SVG，直径 120px，居中）— 直观看占比
- 下方：5 个五行 Tag 横排（金/木/水/火/土）— 精确看旺弱

**圆环图规格：**

| 属性 | 值 |
|------|-----|
| 类型 | SVG Donut Chart（环形图） |
| 尺寸 | w-[120px] h-[120px] |
| 描边宽度 | 16px |
| 颜色 | 金#A78BFA / 木#34D399 / 水#60A5FA / 火#F87171 / 土#FBBF24 |
| 中心文字 | 日主五行大字（如"木"）+ "命" |
| 动画 | 入场时从 0° 渐变到目标角度（1s ease-out） |

**五行 Tag 规格：**

| 属性 | 值 |
|------|-----|
| 布局 | flex justify-center gap-2 |
| 每个 Tag | rounded-full px-3 py-1 text-xs font-medium |
| 旺(>30%) | 对应色 bg-opacity-20 + 文字对应色深 |
| 弱(<10%) | gray-100 底 + gray-400 文字 |
| 正常 | 对应色 bg-opacity-10 + 文字对应色 |

---

#### ④ 日主摘要卡（新增）

> 一句话告诉用户"你是谁"。这是用户最有获得感的模块。

┌──────────────────────────────────────────────┐
│                                              │
│   你是「甲木命人」                            │
│                                              │
│   如同一棵参天大树，向阳而生，根深叶茂。       │
│   性格正直坚韧，有领导力，但有时过于固执。     │
│                                              │
│   喜用神：水（滋润）忌神：金（砍伐）          │
│                                              │
└──────────────────────────────────────────────┘

| 属性 | 值 | Tailwind |
|------|-----|----------|
| 容器 | 全宽卡片 | \ |
| 背景 | 渐变暖底 | \ |
| 边框 | 左侧 4px 品牌色竖线 | \ |
| 标题字号 | text-lg (18px), font-semibold | \ |
| 正文 | text-sm, leading-relaxed | \ |
| 喜忌神 | 行内 Tag | \ |
| 喜用神 Tag 色 | 绿色系 | \ |
| 忌神 Tag 色 | 红色系 | \ |

**内容来源：** LLM API 根据八字数据生成一句话人格概括 + 喜忌神判断。

---

#### ⑤ AI 解读（Tab 切换）

将原来铺开的 6 个分析维度（性格/事业/财运/婚姻/健康/人际）+ 大运流年，全部收进 **Tab 切换器**。

**标题**: "AI 解读" — H3, text-lg (18px), font-semibold, text-[#1C1A16], mb-4

##### Tab 导航栏

| 属性 | 值 |
|------|-----|
| 类型 | 可横向滑动的 SegmentControl |
| Tab 选项 | 性格特质 / 事业财运 / 婚姻健康 / 大运流年 |
| 默认激活 | 第一个 Tab |
| 样式 | 同 7.2.5 区块 D 的 Tab 规格 |

**Tab 图标（可选增强）：**

| Tab | 图标建议 | 配色 |
|-----|---------|------|
| 性格特质 | Brain / User | 紫 #8B5CF6 |
| 事业财运 | TrendingUp / Coins | 蓝 #3B82F6 |
| 婚姻健康 | Heart / HeartPulse | 粉 #EC4899 |
| 大运流年 | Clock / Calendar | 橙 #F97316 |

##### 每个 Tab 的内部结构（统一模板）

每个 Tab 打开后，结构一致：

┌─ Tab 内容区 ─────────────────────────────────────┐
│                                                    │
│  ┌─ 评分概览 ──────────────────────────────────┐  │
│  │  综合评分：82分                               │  │
│  │  ████████████░░░░░                           │  │
│  └─────────────────────────────────────────────┘  │
│                                                    │
│  ┌─ AI 要点列表（3-5 条）──────────────────────┐  │
│  │  ✓ 你的性格中正直和坚韧是最突出的特质        │  │
│  │  ✓ 天生具备领导力，适合独立决策的工作环境     │  │
│  │  ⚠ 有时过于固执，容易忽视他人意见             │  │
│  │  💡 建议：多听取身边人的反馈，保持开放心态     │  │
│  └─────────────────────────────────────────────┘  │
│                                                    │
│  ┌─ AI 详细解读（默认折叠，点击展开）───────────┐  │
│  │  ▶ 展开详细解读（AI 生成的完整段落）          │  │
│  └─────────────────────────────────────────────┘  │
│                                                    │
└────────────────────────────────────────────────────┘

**评分进度条规格：**

| 属性 | 值 |
|------|-----|
| 综合评分 | 大字 text-3xl font-bold + 百分数 |
| 进度条 | h-3 rounded-full, 底色 gray-100 |
| 分数段配色 | >=80 绿 #22C55E / 60-79 黄 #EAB308 / <60 红 #EF4444 |

**AI 要点列表规格：**

| 属性 | 值 |
|------|-----|
| 布局 |纵向列表, gap-3 |
| 每行 | 图标(✓/⚠/💡) + 文字 |
| 正面要点 | ✓ 前缀, text-[#1C1A16] |
| 注意事项 | ⚠ 前缀, text-amber-700 bg-amber-50 px-2 py-1 rounded |
| 建议项 | 💡 前解, text-blue-700 bg-blue-50 px-2 py-1 rounded |
| 字号 | text-sm (14px), leading-relaxed |

**详细解读折叠区：**

| 属性 | 值 |
|------|-----|
| 默认状态 | 收起，显示"▶ 展开详细解读" |
| 展开后 | 显示 AI 完整段落（2-4段文字） |
| 样式 | text-sm text-[#1C1A16]/80 leading-relaxed, pt-3, border-t |
| 动画 | 高度展开动画 300ms |

##### 大运流年 Tab 特殊处理

大运流年与其他三个 Tab 不同，是时间序列数据。

**布局：时间轴 + 横向卡片滑动**

┌─ 大运流年 Tab ───────────────────────────────────┐
│                                                     │
│  当前大运：戊辰大运（2025-2035）◀ 活跃             │
│                                                     │
│  ← [庚寅] [辛卯] [壬辰] [癸巳] [甲午] [乙未] →      │
│   15-25   25-35  35-45  45-55  55-65  65-75       │
│                                                     │
│  ┌─ 当前大运详情 ──────────────────────────────┐   │
│  │  戊辰大运 · 土旺之运                          │   │
│  │  这十年你的事业发展...（AI 解读）             │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
└─────────────────────────────────────────────────────┘

| 属性 | 值 |
|------|-----|
| 时间轴 | 横向可滑动卡片列表 \ |
| 每张卡片 | w-[100px], rounded-xl, p-3, text-center |
| 当前大运卡片 | 特殊高亮：品牌色边框 + 浅黑底 |
| 过往大运 | muted 态（透明度 60%） |
| 未来大运 | 正常态 |
| 点击行为 | 点击任意卡片 → 下方显示该步大运的 AI 解读 |
| 默认显示 | 当前所在大运的详情 |

---

#### ⑥ FAQ（保持现有 7.2.5 区块 H 设计不变）

手风琴折叠 5 个问答项，规格同前。

---

#### ⑦ 底部操作栏

> 不单独成区，自然放在页面最后。FAQ 下方，Footer 之前。

**布局**: 横向居中 — 
**按钮规格**: Ghost 次按钮
- - 
| 按钮 | 行为 | 优先级 |
|------|------|--------|
| 保存命盘 | 登录后保存到历史记录；未登录弹注册引导 | P0 |
| 分享结果 | 生成分享图片/链接（P2 阶段实现，先放按钮占位） | P1 |
| 重新测算 | 清空结果回到输入态 | P0 |
| 查看历史 | 跳转 \ 页面 | P0 |

---

> **入口**: (1) 结果页底部操作栏 ⑦ (2) 导航栏/Footer (3) 首页

#### 功能概述

用户完成八字测算后，可以保存命盘到历史记录，随时回看之前的测算结果。

#### 数据模型

```typescript
interface BaziHistoryRecord {
  id: string;               // UUID
  userId?: string;           // 未登录用 device_id
  deviceId: string;          // 浏览器指纹/localStorage key
  name: string;              // 用户自定义昵称（可选），如"我自己""小明"
  gender: 'male' | 'female';
  birthDate: string;         // ISO date
  birthTime: string;         // HH:mm 或空
  birthPlace: string;        // 出生地
  fourPillars: {             // 四柱数据
    year: { stem: string; branch: string; };
    month: { stem: string; branch: string; };
    day: { stem: string; branch: string; };
    hour: { stem: string; branch: string; };
  };
  fiveElements: {            // 五行统计
    metal: number; wood: number; water: number; fire: number; earth: number;
  };
  dayMaster: string;         // 日干
  dayMasterElement: string;  // 日主五行
  aiSummary: string;         // AI 一句话摘要（日主摘要卡内容）
  createdAt: string;         // ISO timestamp
  source: 'bazi';           // 来源类型
}
```

#### 存储方案

| 方案 | 说明 | 适用场景 |
|------|------|---------|
| 未登录 | localStorage（浏览器本地） | 免费用户，最多存 3 条 |
| 已登录 | 云端数据库（Supabase/Firebase） | 注册用户，无限条 |

**localStorage Key 规范：**
- Key: `cyberfate_bazi_history`
- Value: JSON array (BaziHistoryRecord[])
- 最大条数（未登录）：3 条，超出删除最早的
- 已登录用户：同步到云端，本地作为缓存

#### 页面设计：`/history`

##### 页面标题区

| 属性 | 值 |
|------|-----|
| 标题 | "历史记录" |
| 副标题 | "您保存的所有命盘记录" |
| 样式 | 同全局页面标题区规范（暖米白底 #FAF9F6） |

##### 空状态（无记录时）

```
┌──────────────────────────────────────────────┐
│                                              │
│              📋                              │
│                                              │
│         还没有保存的命盘记录                   │
│   完成八字分析后，点击「保存命盘」即可在这里查看 │
│                                              │
│         [ 去测算八字 → ]                       │
│                                              │
└──────────────────────────────────────────────┘
```

- 居中显示，min-h-[400px]
- 图标尺寸 64px，muted 色
- CTA 按钮：Primary 样式，跳转 `/bazi`

##### 记录列表（有记录时）

**布局：** 纵向卡片列表，每条记录一张卡片

```
┌─ 记录卡片 ──────────────────────────────────────┐
│                                                     │
│  📅 2026-04-07 20:05                    [...]     │
│  ─────────────────────────────────────────────     │
│  甲子年  丙寅月  壬辰日  乙未时                    │
│                                                     │
│  日主：壬水  |  生肖：龙  |  纳音：长流水           │
│                                                     │
│  🔮 你是「水命人」— 如同一泓清泉...                 │
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │  [ 查看详情 ]     [ 删除 ]                   │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**卡片规格：**

| 属性 | 值 | Tailwind |
|------|-----|----------|
| 容器 | bg-white rounded-2xl | `bg-white rounded-2xl p-5 md:p-6` |
| 边框 | 无 | `border-none` |
| 阴影 | 无默认 | `shadow-none` |
| 间距 | mb-4 | `mb-4 last:mb-0` |
| Hover | 浅影 | `hover:shadow-md transition-shadow` |

**卡片内部结构：**

| 行 | 内容 | 样式 |
|----|------|------|
| 第1行 | 日期时间 + 更多操作(⋮) | flex justify-between, 日期 text-xs text-muted |
| 第2行 | 分割线 | h-px bg-gray-100 |
| 第3行 | 四柱文字 | text-base font-medium monospace（等宽字体显示干支） |
| 第4行 | 日主/生肖/纳音 | text-sm text-secondary, 用 \| 分割 |
| 第5行 | AI 摘要（截断 1 行） | text-sm text-[#1C1A16]/70 italic, line-clamp-1 |
| 第6行 | 操作按钮行 | flex gap-3 mt-4 |

**操作按钮：**

| 按钮 | 样式 | 行为 |
|------|------|------|
| 查看详情 | Primary 小按钮 | 跳转 `/bazi?record=xxx` 并自动填充+展示该记录结果 |
| 删除 | Text 危险按钮 | 二次确认弹窗后删除 |

**"查看详情"的交互逻辑：**
1. 跳转到 `/bazi` 页面
2. URL 带 `?record=xxx` 参数
3. 页面自动：a) 填充表单 b) 隐藏表单 c) 直接展示结果区
4. 用户可以在此基础上点"重新测算"

##### 记录命名（可选增强）

用户保存时可选择给记录起名：
- 默认名：按日期自动生成，如"04月07日的命盘"
- 自定义：弹出 input 让用户输入，如"我的命盘""女朋友的命盘"
- 字数限制：最多 10 个字

**存储字段：** `record.name`

#### 权限与限制

| 用户类型 | 保存上限 | 查看历史 | 删除 |
|----------|---------|---------|------|
| 未登录（游客） | 3 条（localStorage） | ✅ 本地 | ✅ |
| 免费注册用户 | 10 条 | ✅ | ✅ |
| 付费会员 | 无限条 | ✅ | ✅ |

超限提示：
- 保存时超限 → Toast "已达到保存上限，注册登录可获得更多空间"
- 引导 CTA → 注册/定价页

#### 入口汇总

| 入口位置 | 形式 | 说明 |
|----------|------|------|
| 八字结果页底部 | "查看历史 →" 按钮 | 最主要入口，操作引导区 C.1 |
| 导航栏 | 导航链接（移动端汉堡菜单内） | 次要入口 |
| Footer | "历史记录" 链接 | 辅助入口 |
| 八字输入页 | "之前算过？查看历史 →" 文字链 | 表单上方小提示（未登录且有历史时显示） |

#### 开发优先级

| 优先级 | 功能 | 说明 |
|--------|------|------|
| **P0** | 结果页重构（①~⑦ 模块） | 基本信息 + 四柱 + 五行 + 日主摘要 + AI Tab + FAQ + 底部操作 |
| **P0** | 基本信息（①） | 确认用户输入，含编辑/删除/复制八字 |
| **P0** | 日主摘要（④） | 一句话概括，差异化亮点 |
| **P0** | 历史记录基础功能 | localStorage 存储 + /history 页面 + 保存/查看/删除 |
| **P0** | 大运流年 Tab 时间轴 | 横向滑动卡片 |
| **P1** | 五行圆环图（③） | SVG 动画，提升视觉 |
| **P1** | 记录命名 | 自定义命盘名称 |
| **P1** | 历史记录云同步 | 登录用户同步到 Supabase |
| **P2** | 分享图片生成 | canvas 生成分享卡片图 |
| **P2** | 历史记录对比 | 选两条记录对比差异 |

---

### 7.3 每日运势页 `/daily` （v2）

#### 7.3.1 日期切换器

- SegmentControl 样式：昨天 / 今天 / 明天 / 后天
- 「今天」默认黑色选中态
- 居中显示

#### 7.3.2 运势概览（大卡片）

- 综合运势分数：大字号 text-4xl font-semibold + 环形进度指示器（SVG conic-gradient）
- 今日总评：text-base text-brand-gray
- 一段简短描述文字

#### 7.3.3 五行小卡片

- 5 个横向排列小卡片, flex gap-3, 每个 flex-1
- 样式: bg-brand-bg rounded-xl p-4
- 含五行颜色 icon + 文字描述
- 移动端可横向滑动

#### 7.3.4 宜忌 Tag 行

- 宜：绿色系 Tag（木色系）
- 忌：红色系 Tag（火色系）
- flex flex-wrap gap-2

#### 7.3.5 幸运指南

- 幸运颜色 / 数字 / 方位 / 贵人星座
- 2 列或 4 列网格

#### 7.3.6 五维运势进度条

- 同八字结果区的五维运势格式
- 事业运 / 感情运 / 财富运 / 健康运 / 学业运

#### 7.3.7 AI 今日建议

- 黄色提示框: bg-yellow-50 border-yellow-200 rounded-xl p-5
- 标题：「💡 AI 今日建议」text-sm font-medium
- AI 生成建议正文

---

### 7.3.7b AI 黄历页 `/huangli` （v3 — 2026-04-09 新增）

> **参考竞品**: https://www.fatemaster.ai/zh/workspace/huangli
> **触发原因**: Frank 发来 FateMaster AI 黄历截图，要求对标优化我们的 /huangli 页面
> **核心定位**: 从"简单宜忌展示"升级为"AI 智能黄历系统"——传统黄历数据 + AI 场景化问答 + 现代生活建议

#### 当前问题

| # | 问题 | 说明 |
|---|------|------|
| 1 | 视觉风格不一致 | 早期 V2 用了暗色赛博紫+英文，与全站 Design Tokens v6 暖米白风格冲突（已标记 P0 Bug） |
| 2 | 功能过于单薄 | 只有 PageHeader + 宜忌 Tag，缺少日历选择器、详细干支数据、AI 交互 |
| 3 | 无 AI 交互 | 名为"AI 黄历"但没有 AI 问答能力，与竞品差距大 |
| 4 | 信息密度低 | 缺少五行、冲煞、胎神、彭祖百忌、二十八宿等传统黄历数据 |

#### 设计原则

1. **Design Tokens v6 全面对齐**：暖米白底 #FAF9F6、深墨文字 #1C1A16、衬线体标题 Cormorant Garamond
2. **分层信息架构**：顶层（宜忌+AI 问答）→ 展开层（详细神煞数据）→ 底层（使用指南）
3. **禁止纯黑底选中态**：统一用边框高亮 + 极淡暖底填充 `border-2 border-[#1C1A16] bg-[rgba(28,26,22,0.03)]`
4. **中文界面**：所有文案中文，命理术语保留中文 + 可选拼音注释

#### 7.3.7b.1 页面整体布局

**桌面端（≥1024px）：**
```
┌─────────────────────────────────────────────┐
│  导航栏（全站通用）                              │
├──────────┬──────────────────────────────────┤
│          │  标题区：AI 老黄历                   │
│  日历     │  副标题：智能择吉 · 避忌提醒            │
│  选择器   ├──────────────────────────────────┤
│  (左侧)   │  当日详情主卡片                        │
│  固定     │  ┌────────────────────────────┐    │
│  280px   │  │ 基础信息 + 五行 + 宜忌        │    │
│          │  │ 冲煞 + 扩展神煞数据           │    │
│          │  └────────────────────────────┘    │
│          ├──────────────────────────────────┤
│          │  AI 问答交互区                       │
│          │  ┌────────────────────────────┐    │
│          │  │ "今天适合搬家吗？" [发送]     │    │
│          │  │ AI 回复区域                  │    │
│          │  └────────────────────────────┘    │
│          ├──────────────────────────────────┤
│          │  特性介绍 + 使用指南                   │
└──────────┴──────────────────────────────────┘
```

**移动端（<1024px）：**
- 日历选择器改为顶部横向日期快捷条（昨天/今天/明天/后天 + 选日期按钮）
- 日历完整视图收起到"选日期"弹窗中
- 其余内容上下堆叠

#### 7.3.7b.2 导航栏

- 复用全站通用导航栏组件
- 面包屑：首页 / AI 黄历
- 高亮当前页面"AI 黄历"

#### 7.3.7b.3 标题区

- 主标题：「AI 老黄历」text-3xl font-semibold font-serif（Cormorant Garamond）
- 副标题：「智能择吉 · 避忌提醒」text-base text-brand-gray mt-2
- 背景：暖米白 #FAF9F6（与首页 Hero 区同色）
- 内边距：py-10 px-6 text-center

#### 7.3.7b.4 日历选择器（左侧固定栏 / 移动端弹窗）

**核心组件：月历网格**

- 宽度：280px 固定（桌面端）
- 高度：随内容自适应，最大不超出视口

**头部控制区：**
- 年份切换：`<< 2026 >>`（左右箭头 + 年份文字，点击年份可快速跳转）
- 月份切换：`< 4月 >`（左右箭头）
- 「回到今天」按钮：小尺寸 text-sm text-link 色

**月历网格：**
- 7 列（日/一/二/三/四/五/六），表头文字 xs 号 muted 色
- 日期格子：aspect-ratio 1:1 正方形
  - 当月日期：正常显示公历数字 + 小字农历（如"初三"）text-xs muted
  - 今天：圆角 Tag 高亮 `bg-[#1C1A16] text-white rounded-full w-8 h-8 flex-center`
  - 选中非今天：边框高亮 `border-2 border-[#1C1A16] rounded-full w-8 h-8 flex-center`（注意：不是纯黑底！）
  - 非当月日期：muted 色 opacity-40，不可点击
  - 周末列：可选微红色调提示（subtle，不用强红）
- 点击日期 → 右侧详情区刷新为该日数据

**底部快捷操作：**
- 选日期按钮（展开 DatePicker）
- 节气标注：当月有节气时在对应日期格右上角显示小圆点提示

#### 7.3.7b.5 当日详情主卡片（页面核心）

**容器样式：**
- `bg-white rounded-2xl shadow-sm border border-[#F0EDE8] p-6 md:p-8`

**区块 A：基础信息行**

布局：横向 flex 折行，gap-4

| 字段 | 格式 | 说明 |
|------|------|------|
| 公历 | 2026年4月9日 | text-lg font-semibold |
| 星期 | 星期四 | Tag 样式 muted 底色 |
| 农历 | 丙午年 三月初三 | Tag 样式 |
| 干支 | 丙申年 壬辰月 癸亥日 | Tag 样式，日柱高亮 |
| 纳音 | [年]山下火 / [月]长流水 / [日]大海水 | 小字 muted |
| 十二建星 | 成 日 | 特殊 Tag 色（成/开日绿系，破/危日红系） |

**区块 B：五行与冲煞**

横向 3 列网格（grid grid-cols-3 gap-4）：

| 格子 | 内容 | 样式 |
|------|------|------|
| 日五行 | 大字显示「水」+ 小字「日主五行」 | 配五行蓝色系背景 `bg-blue-50` |
| 年五行 | 「火」+ 「年五行」 | 配五行红色系背景 `bg-red-50` |
| 冲煞 | 「冲猪(辛亥)」+ 「煞东」 | 配警示色背景 `bg-orange-50` |

五行颜色规范：
- 金：#D4A574（暖金）
- 木：#5B8C5A（绿）
- 水：#4A7C9B（蓝）
- 火：#C75B4B（红）
- 土：#B8956A（土黄）

**区块 C：宜 / 忌 Tag 云**

- 标题：「宜」text-base font-medium + 「忌」text-base font-medium 并排
- 宜 Tag：`bg-green-50 text-green-700 border border-green-200 rounded-full px-3 py-1 text-sm`
- 忌 Tag：`bg-red-50 text-red-700 border border-red-200 rounded-full px-3 py-1 text-sm`
- flex flex-wrap gap-2
- 至少展示 4-6 条宜 + 4-6 条忌
- 如果数据很长，显示前 N 条 +「展开全部」链接

**区块 D：扩展神煞数据（默认折叠）**

折叠面板（Accordion），标题「📋 详细黄历数据」，默认收起：

| 数据项 | 说明 |
|--------|------|
| 胎神 | 如「占门床」 |
| 彭祖百忌 | 如「癸不词讼理弱敌强」 |
| 二十八宿 | 如「壁宿（木）」 |
| 吉神宜趋 | 列表，绿色系 |
| 凶神宜忌 | 列表，红色系 |
| 值神 | 如「天德」 |

展开后以紧凑表格或 Tag 组形式呈现，muted 色调，不抢主视觉。

#### 7.3.7b.6 AI 问答交互区（差异化亮点）

**这是"AI 黄历"区别于普通黄历的核心功能。**

**输入区：**
- 容器：`bg-gradient-to-r from-yellow-50 to-amber-50 rounded-2xl p-6 border border-yellow-200`
- 标题：「💡 AI 黄历助手」text-lg font-medium font-serif mb-3
- Placeholder：「今天适合搬家吗？」或「这天签合同好吗？」
- 输入框：无边框 Design Tokens 规范 `bg-white rounded-xl px-4 py-3 border border-[#E8E4DD] focus:border-[#1C1A16]`
- 发送按钮：右侧图标按钮，主色调 `bg-[#1C1A16] text-white rounded-xl`

**AI 回复区：**
- 显示在输入框下方
- 加载态：骨架屏 / 脉冲动画
- 回复格式：
  - 开头直接回答（如"今天适合搬家。宜搬家，且冲煞方位不在您家方向..."）
  - 结合当日黄历数据给出理由（引用宜忌、冲煞、五行等）
  - 结尾给 1-2 条具体行动建议
- 字数：100-300 字，简洁实用
- 支持连续多轮对话（同一会话内）

**预设快捷问题（输入框下方横向标签）：**
- 5-6 个热门问题 Tag，点击直接发送：
  - 「今天适合签约吗？」
  - 「今天适合出行吗？」
  - 「今天适合求婚吗？」
  - 「今天开市好不好？」
  - 「今天适合装修吗？」

#### 7.3.7b.7 底部特性介绍区

3 列卡片网格（grid grid-cols-3 gap-6 md:mt-12）：

| 卡片 | 图标 | 标题 | 描述 |
|------|------|------|------|
| 精准算法 | 📊 | 传统历法引擎 | 融合万年历、干支纪年、节气算法，数据精准可靠 |
| AI 解读 | 🤖 | 智能场景分析 | 结合当日黄历数据，针对你的具体问题给出个性化建议 |
| 科学参考 | 🔬 | 理性参考工具 | 黄历为文化参考，重要决策请结合实际情况理性判断 |

卡片样式：`bg-white rounded-xl p-6 text-center shadow-sm border border-[#F0EDE8]`

#### 7.3.7b.8 使用指南

3 步骤横向排列（flex justify-center gap-8 md:mt-10）：

| 步骤 | 图标 | 标题 | 描述 |
|------|------|------|------|
| 1 | 📅 | 选择日期 | 在日历中选择你想查询的日期 |
| 2 | 👁️ | 查看分析 | 浏览当日的宜忌、五行、冲煞等信息 |
| 3 | 💬 | AI 建议 | 输入你的计划，获取个性化建议 |

步骤间用箭头 → 连接。

#### 7.3.7b.9 移动端适配

| 断点 | 调整 |
|------|------|
| ≥1280px | 桌面端完整布局：左侧日历 280px 固定 + 右侧内容区 |
| 768-1279px | 日历收窄到 240px，内容区自适应 |
| <768px | 日历变为顶部日期快捷条（昨天/今天/明天/后天线性排列）+「选日期」按钮弹出 Modal；其余内容上下堆叠；Tag 云横向可滑动 |

移动端特殊处理：
- 基础信息行改为 2 列网格
- 五行与冲煞 改为横向滚动
- AI 输入框宽度 100%
- 预设快捷问题 横向可滑动

#### 7.3.7b.10 错误状态与边界情况

| 场景 | 处理方式 |
|------|----------|
| 日期超出范围（如 1900 年前） | 提示"支持的查询范围：1920-2100 年"，回到今天 |
| API 加载失败 | 显示 Skeleton 骨架屏 + 错误提示"数据加载失败，请稍后重试"+ 重试按钮 |
| AI 问答超时 | 15s 超时提示"AI 思考较久，请稍后再试" |
| 无网络 | 缓存最近一次查看的日期数据，显示离线提示条 |
| 日期无黄历数据（极罕见） | 显示"该日暂无数据"空状态插图 |

#### 7.3.7b.11 vs FateMaster 差异总结

| 维度 | FateMaster | CyberFate（我们） | 策略 |
|------|-----------|-------------------|------|
| 信息密度 | 极高，堆砌全部神煞 | 分层展示，默认精简可展开 | 降低认知负担 |
| AI 能力 | 简单问答 | 多轮对话 + 场景化建议 + 预设问题 | 强化 AI 差异化 |
| 视觉风格 | 自家风格（偏传统） | Design Tokens v6 暖米白简约风 | 统一全站语言 |
| 目标用户 | 传统命理爱好者 | 年轻人 + 海外华人 | 更现代、更轻量 |
| 交互深度 | 单次查询 | 连续对话 + 日期切换即时刷新 | 提升停留时长 |
| 分享功能 | 有 | P2 阶段补上 | 后续迭代 |

#### 开发优先级

**P0（必须做）：**
- [ ] 日历选择器组件（月历网格 + 日期选中 + 农历显示）
- [ ] 当日详情主卡片：基础信息行 + 五行冲煞 + 宜忌 Tag 云
- [ ] 视觉风格完全重构（取消暗色赛博紫，对齐 Design Tokens v6）
- [ ] 全站通用 Header/Footer 复用
- [ ] 中文界面

**P1（应该做）：**
- [ ] AI 问答交互区（输入框 + 预设快捷问题 + AI 回复渲染）
- [ ] 扩展神煞数据折叠面板
- [ ] 底部特性介绍 3 卡片
- [ ] 使用指南 3 步骤
- [ ] 移动端适配（日历→快捷条 + 弹窗）

**P2（锦上添花）：**
- [ ] 生成当日黄历卡图片分享朋友圈/社交媒体
- [ ] 节气/节日特殊皮肤（如春节当天卡片换装）
- [ ] 历史日期对比（选两天对比宜忌差异）
- [ ] 入场动画（日历格子 staggered fade-in）

---

### 7.3.7c 紫微斗数页 `/ziwei` （v3 — 2026-04-09 新增）

> **参考竞品**: https://www.fatemaster.ai/zh/workspace/ziwei
> **触发原因**: Frank 发来 FateMaster AI 紫微斗数排盘截图，要求对标优化我们的 /ziwei 页面
> **核心定位**: 从"简单表格展示"升级为"AI 紫微命盘系统"——十二宫交互式命盘 + 分宫位 AI 解读 + 现代化呈现

#### 当前问题

| # | 问题 | 说明 |
|---|------|------|
| 1 | 功能过于单薄 | PRD 中仅标注 V2，改动范围只有"PageHeader + 表格细线样式"，无独立详细设计 |
| 2 | 缺少十二宫命盘图 | 紫微的核心是十二宫命盘，没有命盘图等于没有灵魂 |
| 3 | 无 AI 解读 | FateMaster 有完整 AI 解读，我们缺失 |
| 4 | 新手不友好 | 紫微本身门槛高（14 主星 + 辅星 + 煞星），没有引导用户看不懂 |

#### 设计原则

1. **Design Tokens v6 全面对齐**：暖米白 #FAF9F6、深墨 #1C1A16、衬线体标题
2. **命盘为核心视觉资产**：十二宫命盘图是页面主角，占最大视觉比重
3. **渐进式信息展示**：默认只显示主星 + 一句话解读，点击展开详细星曜（降低认知门槛）
4. **禁止纯黑底选中态**：统一用边框高亮 + 极淡暖底填充
5. **中文界面**：所有文案中文

#### 7.3.7c.1 页面整体布局

**桌面端（≥1024px）：**
```
┌──────────────────────────────────────────────────┐
│  导航栏（全站通用）                                 │
├──────────────────────────────────────────────────┤
│  标题区：AI 紫微斗数排盘                             │
│  副标题：十二宫命盘 · 智能解读                       │
├─────────────┬────────────────────────────────────┤
│  输入区      │  十二宫命盘图（核心区域）               │
│  (顶部横条)  │  ┌────┬────┬────┐                   │
│             │  │命宫│兄弟│夫妻│ ... (4×3)          │
│  日期/性别   │  ├────┼────┼────┤                   │
│  时辰       │  │子女│财帛│疾厄│                    │
│  [排盘]     │  ├────┼────┼────┤                   │
│             │  │迁移│交友│官禄│                    │
│             │  ├────┼────┼────┤                   │
│             │  │田宅│福德│父母│                    │
│             │  └────┴────┴────┘                   │
│             ├────────────────────────────────────┤
│             │  选中宫位详情面板                      │
│             │  ┌────────────────────────────┐     │
│             │  │ 宫名 + 星曜列表 + AI 解读    │     │
│             │  └────────────────────────────┘     │
│             ├────────────────────────────────────┤
│             │  AI 命盘总览解读区                     │
│             │  特性介绍 + 使用指南                   │
└─────────────┴────────────────────────────────────┘
```

**移动端（<768px）：**
- 输入区：上下堆叠表单
- 命盘图：改为**纵向十二宫列表**（每宫一行卡片）或**缩放可滑动命盘**
- 宫位详情：点击展开 Accordion 面板
- 其余内容上下堆叠

#### 7.3.7c.2 导航栏 + 标题区

- 复用全站通用导航栏
- 面包屑：首页 / 紫微斗数
- 标题：「AI 紫微斗数排盘」text-3xl font-serif
- 副标题：「十二宫命盘 · 智能解读」text-base text-brand-gray mt-2
- 背景：暖米白 #FAF9F6，py-10 px-6 text-center

#### 7.3.7c.3 输入区

**布局：横向排列的紧凑输入组**

| 字段 | 类型 | 说明 |
|------|------|------|
| 出生日期 | DatePicker | 年/月/日 选择器，支持农历切换（可选） |
| 出生时辰 | Select | 十二时辰下拉（子时/丑时/.../亥时），必填（紫微对时辰敏感） |
| 性别 | SegmentedControl | 男 / 女，必填（影响大限计算） |
| 排盘按钮 | Button | 「开始排盘」主按钮，`bg-[#1C1A16] text-white rounded-xl px-8 py-3` |

**设计规范：**
- 输入框用 Design Tokens 无边框规范：`bg-white border border-[#E8E4DD] rounded-xl px-4 py-3 focus:border-[#1C1A16]`
- 整体居中排列，flex gap-4 items-end
- 移动端改为竖向堆叠

**默认行为：**
- 首次进入显示输入区 + 示例命盘（预填一个示例日期如 2000-01-01）
- 用户修改后点"开始排盘" → 加载动画 → 刷新命盘

#### 7.3.7c.4 十二宫命盘图（核心组件 ⭐）

这是整个页面的技术难点和视觉核心。

**桌面端布局：4×3 网格**

宫位排列顺序（紫微传统排法）：

```
        巳        午         未
    ┌──────┬──────┬──────┐
 辰 │ 父母 │ 福德 │ 田宅 │ 申
    ├──────┼──────┼──────┤
 卯 │ 官禄 │ 命宫 ←起点  │ 交友 │ 酉  ← 命宫在此
    ├──────┼──────┼──────┤
 寅 │ 迁移 │ 兄弟 │ 夫妻 │ 戌
    └──────┴──────┴──────┘
        丑        子         亥
```

注：以上为常见紫微排盘格局示意。实际开发中按标准紫微安星法确定宫位。

**每个宫格（Cell）内容：**

```
┌─────────────────┐
│ 夫女            │ ← 宫位名称（左上小字）
│ 戌              │ ← 地支（右上）
│                 │
│    太阳 ☀       │ ← 主星（大字居中，带图标/色点）
│    天机 ☆       │ ← 第二主星（如有）
│ ─────────────── │ ← 分隔线
│ 铃星 · 天魁    │ ← 辅星/煞星（小字 muted 色）
└─────────────────┘
```

**宫格样式：**
- 默认态：`bg-white border border-[#E8EDE5] rounded-xl p-3 min-h-[120px]`
- hover 态：`border-[#1C1A16] shadow-sm`（提示可点击）
- 选中态：`border-2 border-[#1C1A16] bg-[rgba(28,26,22,0.03)]`（注意：边框高亮+极淡暖底，禁止纯黑底！）
- 命宫特殊标记：默认轻微高亮或加「命」字 Tag 提示这是命宫

**十四主星颜色标识（帮助用户快速识别）：**

| 星曜 | 颜色 | 色值 |
|------|------|------|
| 紫微 | 紫 | #7C3AED |
| 天机 | 绿 | #059669 |
| 太阳 | 金橙 | #D97706 |
| 武曲 | 白灰 | #6B7280 |
| 天同 | 粉 | #DB2777 |
| 廉贞 | 红 | #DC2626 |
| 天府 | 黄 | #CA8A04 |
| 太阴 | 银蓝 | #3B82F6 |
| 贪狼 | 深绿 | #047857 |
| 巨门 | 黑墨 | #374151 |
| 相夫 | 土棕 | #A16207 |
| 七杀 | 暗红 | #991B1B |
| 破军 | 深紫 | #6D28D9 |
| （天梁/天相视实现情况补充） | | |

> 注：颜色用于命盘图中星名旁的小圆点/图标色，辅助快速扫描。不要给宫格上色。

**移动端命盘方案（二选一，推荐方案 A）：**

方案 A — **纵向宫位列表**（更实用）：
- 12 个宫位从上到下排列为卡片列表
- 每个卡片：宫名（标题）+ 地支 + 主星 Tag + 点击展开详情
- 默认收起，点击展开该宫所有星曜和解读
- 优点：移动端阅读性好，每宫信息不被压缩

方案 B — **缩放滑动命盘**：
- 保持 4×3 格局但整体 scale 缩小至屏幕宽度内
- 双指捏合放大缩小
- 点击宫位弹出底部 Sheet 显示详情
- 优点：保留完整命盘形态；缺点：文字可能太小

**建议**：桌面端用 4×3 网格，移动端用方案 A（纵向列表），两者信息等价只是展现形式不同。

#### 7.3.7c.5 选中宫位详情面板

当用户点击命盘中某个宫格后，在命盘下方（桌面端）或以展开面板形式（移动端）显示该宫的详细信息。

**面板容器：** `bg-white rounded-2xl shadow-sm border border-[#F0EDE8] p-6`

**内容结构：**

**区块 1：宫位基本信息**
- 宫位名称大标题：「夫妻宫」text-xl font-semibold font-serif
- 地支 + 天干：「戌土 · 辛金」text-sm text-brand-gray
- 宫位属性 Tag 组：如「庙旺」「得地」「有主星」

**区块 2：星曜列表**

表格/结构化列表：

| 类型 | 星曜 | 亮度 | 入庙/陷 | 简要说明 |
|------|------|------|---------|----------|
| 主星 | 太阳 | ★★★★☆ | 庙（卯） | 光明磊落、贵气 |
| 同系 | 天梁 | ★★★☆☆ | 得地 | 荫护、稳重 |
| 辅星 | 文昌 | ★★☆☆☆ | 平 | 才学、才艺 |
| 煞星 | 地劫 | ★☆☆☆☆ | 陷 | 破耗、意外 |

亮度用星级或进度条可视化。

**区块 3：AI 宫位解读（差异化亮点）**
- `bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-5 border border-purple-100`
- 标题：「💡 夫妻宫解读」
- AI 针对**这个具体宫位的星曜组合**给出 150-250 字解读
- 内容方向：
  - 该宫整体强弱评分（如 85/100）
  - 主要特征 2-3 句
  - 建议 1-2 条
- 如果尚未请求过该宫的解读，显示「点击获取 AI 解读」按钮；已解读则直接展示

**关闭方式：** 点击其他宫位自动切换；桌面端可加 × 关闭按钮恢复总览态。

#### 7.3.7c.6 AI 命盘总览解读区

位于宫位详情面板下方，提供全局性的命盘分析。

**Tab 切换：** 3 个 Tab

| Tab | 内容 |
|------|------|
| 命盘总览 | 一段 200-300 字的整体命盘描述（格局定性、命宫主星、核心特质） |
| 人生四化 | 四化飞星的关键影响（化禄/化权/化科/化忌在各宫的影响链） |
| 大运流年 | 当前大运 + 流年简要（可选，数据允许的话） |

**默认展示第一个 Tab，其余按需切换。**

**样式：**
- Tab 栏：SegmentControl 样式（与八字页一致）
- 内容区：`bg-white rounded-2xl p-6 text-brand-gray leading-relaxed`
- 支持「复制」按钮（右上角小 icon）

#### 7.3.7c.7 底部功能区

**特性介绍 — 3 列卡片：**

| 卡片 | 图标 | 标题 | 描述 |
|------|------|------|------|
| 精准排盘 | 📊 | 传统安星法 | 严格遵循紫微斗数安星法则，十四主星 + 辅星煞星精准定位 |
| 十二宫详解 | 🏛️ | 逐宫深度解读 | 命宫到父母宫，每一宫都有独立的星曜分析和 AI 解读 |
| 智能分析 | 🤖 | AI 格局判断 | 自动识别您的命盘格局（如紫府同宫、杀破狼等）并给出人生建议 |

卡片样式与其他页面特性卡统一：`bg-white rounded-xl p-6 text-center shadow-sm border border-[#F0EDE8]`

**使用指南 — 4 步骤：**

| 步骤 | 标题 | 描述 |
|------|------|------|
| 1 | 输入生辰 | 填写出生日期、时辰和性别 |
| 2 | 查看命盘 | 十二宫命盘自动排出，查看各宫星曜分布 |
| 3 | 点击宫位 | 点击感兴趣的宫位查看详细解读 |
| 4 | AI 分析 | 获取 AI 对您命盘的全方位分析 |

步骤间用箭头连接，flex 横向排列（移动端改为 2×2 网格）。

**FAQ 区块（手风琴）：**

| # | 问题 | 回答摘要 |
|---|------|----------|
| 1 | 什么是紫微斗数？ | 中国传统命理学，通过出生时间排出十二宫命盘，分析人生命运各维度 |
| 2 | 紫微斗数准确吗？ | 命理工具供文化参考和自我探索，重要决策请结合实际情况理性判断 |
| 3 | 十四主星是什么？ | 紫微、天机、太阳、武曲、天同、廉贞、天府、太阴、贪狼、巨门、天相、七杀、破军、天梁 |
| 4 | 为什么需要精确时辰？ | 紫微排盘对时辰敏感，不同时辰可能导致命盘完全不同 |
| 5 | 和八字有什么区别？ | 八字看五行能量分布，紫微看十二宫位星曜组合，两者互补 |

#### 7.3.7c.8 移动端适配

| 断点 | 命盘形态 | 输入区 | 详情面板 |
|------|----------|--------|----------|
| ≥1280px | 4×3 网格，每宫 120px+ 高 | 横向排列 | 命盘下方固定面板 |
| 768-1279px | 4×3 网格，每宫 100px 高 | 横向排列（稍窄） | 命盘下方面板 |
| <768px | 纵向 12 宫卡片列表 | 竖向堆叠 | 点击展开 Accordion |

移动端额外处理：
- 星曜名称过长时截断加省略号（tooltip 显示全名）
- AI 解读区默认收起到"查看完整解读"
- FAQ 手风琴默认全部收起
- 命盘分享按钮固定在底部工具栏

#### 7.3.7c.9 错误状态与边界情况

| 场景 | 处理方式 |
|------|----------|
| 未填写完整信息 | "请填写完整的出生日期、时辰和性别"，对应字段红色边框提示 |
| 日期超出合理范围 | 提示"支持的年份范围：1920-2030"，清空重填 |
| 排盘 API 失败 | Skeleton 骨架屏 + "排盘失败，请检查信息后重试"+ 重试按钮 |
| 数据异常（某宫无星） | 该宫显示"空宫"muted 文字 + 提示"此宫无主星落入" |
| AI 解读超时 | 15s 超时提示"AI 思考较久，请稍后再试" |
| 无网络 | 缓存最近一次排盘结果，显示离线提示条 |

#### 7.3.7c.10 共享组件复用清单

本页需复用的全站组件：

| 组件 | 来源 | 用途 |
|------|------|------|
| PageHeader | 全站通用 | 标题区 |
| Input / Select / DatePicker | Design Tokens | 输入区表单 |
| Button (Primary) | Design Tokens | 排盘按钮 |
| Card | Design Tokens | 详情面板/特性卡/AI 区容器 |
| SegmentControl | 八字页已有 | AI 解读 Tab 切换 |
| Accordion | 新建或复用 | FAQ / 扩展神煞 / 移动端宫位详情 |
| Tag / Badge | Design Tokens | 五行/吉凶/亮度标签 |
| StarIcon | **新建** | 十四主星颜色圆点图标 |
| PalaceGrid | **新建** | 4×3 十二宫网格容器 |
| PalaceCell | **新建** | 单个宫格组件 |
| PalaceDetailPanel | **新建** | 宫位详情面板 |

其中 **加粗的 4 个是紫微专属新组件**，其他复用全站已有的。

#### 7.3.7c.11 vs FateMaster 差异总结

| 维度 | FateMaster | CyberFate（我们） | 策略 |
|------|-----------|-------------------|------|
| 命盘呈现 | 4×3 网格，信息密度极高 | 4×3 网格 + 渐进式 disclosure | 降低新手门槛 |
| 信息密度 | 所有星曜一次性铺开 | 默认主星+一句话，点击才展开详细 | 减少认知过载 |
| AI 能力 | 一段性总览解读 | 总览 + **分宫位逐个 AI 解读** | 更深度的 AI 价值 |
| 视觉风格 | 自家传统风 | Design Tokens v6 暖米白简约 | 统一全站语言 |
| 移动端体验 | 缩放命盘（文字极小） | 纵向宫位列表（每宫独立卡片） | 移动端体验优先 |
| 社交传播 | 有基础分享 | P2 加命盘卡图片生成 | 病毒传播潜力 |
| 新手引导 | 无 | 内置使用指南 + 星曜颜色标识 + FAQ | 降低紫微入门门槛 |

#### 开发优先级

**P0（必须做）：**
- [ ] 输入区组件（日期+时辰+性别+排盘按钮）
- [ ] 十二宫命盘图 4×3 网格组件（PalaceGrid + PalaceCell）
- [ ] 宫格内容渲染（宫名+地支+主星+辅星煞星）
- [ ] 选中态交互（点击宫格→高亮+显示详情）
- [ ] Design Tokens v6 全面对齐（暖米白风格，禁止纯黑底）
- [ ] 全站 Header/Footer 复用 + 中文界面

**P1（应该做）：**
- [ ] 宫位详情面板（星曜列表表格 + AI 宫位解读）
- [ ] AI 命盘总览解读区（3 Tab：总览/四化/大运）
- [ ] 移动端纵向宫位列表方案
- [ ] 十四主星颜色标识系统
- [ ] 底部特性介绍 + 使用指南 + FAQ
- [ ] 示例命盘（首次进入预填充）

**P2（锦上添花）：**
- [ ] 命盘卡图片生成（分享朋友圈/社交媒体）
- [ ] 四化飞星可视化（箭头连线动画）
- [ ] 大限/流年切换器（查看不同时期命盘变化）
- [ ] 命盘对比（两个人的命盘并列对比）
- [ ] 星曜字典（点击任意星名弹出解释卡片）
- [ ] 入场动画（宫格 staggered fade-in）

---

### 7.3.8 梅花易数·每日决策页 `/meihua` （v3 — 2026-04-07 新增）

> **参考竞品**: https://www.fatemaster.ai/zh/workspace/meihua/daily-decision
> **触发原因**: Frank 要求学习 FateMaster 的「梅花易数·每日决策」功能，优化我们的梅花易数页面
> **核心定位**: 从"占卜工具"升级为"AI 决策助手"——用户输入具体问题，梅花易数 + AI 联合给出决策建议

#### 当前问题

| # | 问题 | 说明 |
|---|------|------|
| P1-1 | 功能单一 | 当前梅花易数只有"起卦→看结果"，缺少场景化引导 |
| P1-2 | 缺少问题输入 | 用户不知道该问什么，没有决策场景感 |
| P1-3 | 结果展示扁平 | 卦象+解卦文字堆在一起，缺乏结构化解读 |
| P2-1 | 无历史回顾 | 无法回看之前的决策记录 |

#### 页面结构（从上到下）

```
 /meihua 梅花易数·每日决策
 │
 ├─ ① 标题区
 │
 ├─ ② 问题输入区（核心交互）
 │   └─ 文本框 + 示例提示 + 起卦方式选择
 │
 ├─ ③ 解卦结果区（提交后展示）
 │   ├─ ③-a 本卦/变卦信息
 │   ├─ ③-b AI 辅助观察（3 卡片）
 │   └─ ③-c 决策建议（结构化输出）
 │
 ├─ ④ 特色功能介绍（4 宫格）
 │
 └─ ⑤ FAQ
```

##### ① 标题区

| 属性 | 值 |
|------|-----|
| 主标题 | "梅花易数 · 每日决策" |
| 副标题 | "结合古老的梅花易数和现代 AI 分析，为您的日常决策提供参考。" |
| 样式 | 同全局页面标题区规范（暖米白底 #FAF9F6） |

##### ② 问题输入区

**这是整个页面的核心交互。**

```
┌─ 提出您的决策问题 ───────────────────────────────────┐
│                                                        │
│  输入一个令你纠结的问题，系统将自动为你起卦             │
│                                                        │
│  ┌──────────────────────────────────────────────────┐  │
│  │ 例如：我是否应该接受这份工作机会？                │  │
│  └──────────────────────────────────────────────────┘  │
│                                                        │
│  起卦方式：  (○) 时间起卦  ( ) 数字起卦  ( ) 手动起卦   │
│                                                        │
│  [ 🀄 开始解卦 ]                                       │
│                                                        │
└────────────────────────────────────────────────────────┘
```

**问题输入框规格：**

| 属性 | 值 | Tailwind |
|------|-----|----------|
| 类型 | textarea（多行文本） |
| 最小高度 | h-[100px] | `min-h-[100px]` |
| 最大高度 | h-[200px]（超出滚动） | `max-h-[200px]` |
| 圆角 | rounded-xl (12px) | `rounded-xl` |
| 边框 | 1px solid #D1D5DB | `border border-gray-300` |
| 内边距 | p-4 | `p-4` |
| 字号 | text-sm (14px) | `text-sm` |
| Placeholder | "输入一个令你纠结的问题，系统将自动为你起卦..." | muted 色 |
| Focus | border-[#1C1A16], ring 2px rgba(28,26,22,0.06) | |
| 字数限制 | 最大 200 字 | 右下角显示字数统计 "0/200" |

**示例提示（输入框下方）：**

当输入框为空时，显示可点击的示例问题标签：

| 示例问题 | 点击行为 |
|----------|---------|
| "我是否应该接受这份工作机会？" | 填入输入框 |
| "今天适合签约吗？" | 填入输入框 |
| "这段感情值得继续吗？" | 填入输入框 |

样式：`flex flex-wrap gap-2 mt-2`，每个示例是 `text-xs text-[#1C1A16]/60 px-3 py-1.5 rounded-full bg-gray-50 hover:bg-gray-100 cursor-pointer`

**起卦方式选择：**

| 选项 | 说明 | 默认 |
|------|------|------|
| 时间起卦 | 基于当前时间自动起卦（最常用） | 默认选中 ✅ |
| 数字起卦 | 用户输入 1-4 个数字手动起卦 | |
| 手动起卦 | 高级用户自行指定上卦/下卦/动爻 | |

样式：SegmentControl（同八字页性别选择），3 个选项横排。

**提交按钮：**

| 属性 | 值 | Tailwind |
|------|-----|----------|
| 文字 | "开始解卦" 或 "🀄 开始解卦" | Primary 按钮 |
| 样式 | **Primary 黑底白字**（不是 Ghost） | `bg-[#1C1A16] text-white w-full h-[44px] rounded-xl` |
| Loading | 显示 spinner + "正在解卦..." | 禁用点击 |

> 注意：这里是全页面的主 CTA，用 Primary 样式（与八字页表单的 Ghost 不同）。因为这是梅花易数页面的唯一核心操作。

##### ③ 解卦结果区（提交后展示）

默认隐藏，提交后从上方滑入展示。

##### ③-a 本卦/变卦信息卡片

```
┌─ 卦象信息 ───────────────────────────────────────────┐
│                                                        │
│   ⿊ 山风蛊（本卦） → ⿍ 地天泰（变卦）               │
│                                                        │
│   上卦：☴ 巽（风）  下卦：☶ 艮（山）  动爻：六爻     │
│                                                        │
│   卦辞：元亨，利涉大川...                              │
│                                                        │
└────────────────────────────────────────────────────────┘
```

| 属性 | 值 |
|------|-----|
| 容器 | bg-white rounded-2xl p-6 |
| 本卦名 | text-xl font-semibold, text-[#1C1A16] |
| 箭头 | text-muted, mx-3 |
| 变卦名 | text-xl font-semibold, text-brand（或 muted 表示未变） |
| 八卦符号 | text-2xl（Unicode 卦符） |
| 卦辞 | text-sm text-[#1C1A16]/70 leading-relaxed, mt-3 |

##### ③-b AI 辅助观察（3 张卡片）

> 参考 FateMaster 的三卡片布局，但内容更贴合梅花易数。

```
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│    ◎        │  │    ◷        │  │    ✧        │
│   思考参考   │  │   卦象分析   │  │   时机参考   │
│             │  │             │  │             │
│ 从理性角度帮  │  │ 结合梅花易数  │  │ 不仅看做什么  │
│ 你梳理问题核  │  │ 的传统释义与  │  │ 还要看什么时  │
│ 心要点，帮助  │  │ 现代视角结合  │  │ 候做更合适。  │
│ 你跳出情绪盲  │  │ 给出客观解读。 │  │             │
│ 区。         │  │             │  │             │
└─────────────┘  └─────────────┘  └─────────────┘
```

**布局**: `grid grid-cols-1 md:grid-cols-3 gap-4`

**每张卡片规格：**

| 属性 | 值 | Tailwind |
|------|-----|----------|
| 容器 | bg-white rounded-xl p-5 | `bg-white rounded-xl p-5` |
| 图标 | text-3xl, 居中, mt-2 | 图标颜色各不同 |
| 标题 | text-base font-semibold, text-center, mt-3 | |
| 描述 | text-xs text-[#1C1A16]/70, leading-relaxed, mt-2 | |

**3 张卡片内容定义：**

| 卡片 | 标题 | 内容来源 | 图标色 |
|------|------|---------|--------|
| 思考参考 | "思考参考" | LLM 分析用户问题的利弊框架，不直接给答案而是帮用户理清思路 | 蓝 #3B82F6 |
| 卦象分析 | "卦象分析" | 基于本卦/变卦的传统释义 + 现代白话解读 | 紫 #8B5CF6 |
| 时机参考 | "时机参考" | 结合当前运势（五行/宜忌）判断时机是否合适 | 绿 #22C55E |

##### ③-c 决策建议（结构化输出）

> 这是用户最关心的部分——"所以我到底该怎么办？"

```
┌─ 决策建议 ────────────────────────────────────────────┐
│                                                         │
│  综合建议：倾向于【去做】，但需注意以下几点              │
│                                                         │
│  ✓ 有利因素                                             │
│  1. 卦象显示"元亨"，整体趋势向好                       │
│  2. 你的八字当前走财运大运，适合主动出击                 │
│                                                         │
│  ⚠ 需要注意                                             │
│  1. 动爻在上六，暗示结果需要较长时间显现                 │
│  2. 今日五行火旺，不宜急躁决策                           │
│                                                         │
│  💡 下一步行动                                           │
│  建议在未来 7-14 天内做最终决定，不宜拖过本月。          │
│  如果决定去做，最佳启动时间为下周三前后。                │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

| 属性 | 值 |
|------|-----|
| 容器 | bg-white rounded-2xl p-6 |
| 综合建议行 | text-base font-medium, mb-4。关键词高亮：倾向色(绿=去做/红=不做/黄=观望) |
| 有利因素 | ✓ 前缀, text-green-700, 编号列表 |
| 需要注意 | ⚠ 前缀, text-amber-700, 编号列表 |
| 下一步行动 | 💡 前缀, text-blue-700, 段落文字 |
| 整体字号 | text-sm (14px), leading-relaxed |

**内容来源**: LLM API 输入 = 用户问题 + 本卦/变卦数据 + 当日运势数据（可选）

**输出格式约束（System Prompt 要求）：**
- 综合建议：1 句话，不超过 50 字
- 有利因素：2-3 条，每条不超过 40 字
- 需要注意：1-2 条，每条不超过 40 字
- 下一步行动：1-2 段，每段不超过 60 字
- 总输出控制在 400 字以内

##### ④ 特色功能介绍

> 在结果区下方（或无结果时的页面下半部），展示产品能力说明。

**布局**: 2x2 网格 — `grid grid-cols-1 md:grid-cols-2 gap-4`

| 功能 | 图标 | 标题 | 描述 |
|------|------|------|------|
| 多角度观察 | 🎯 | 多角度观察 | 结合易理框架的多层次洞察，既看文化背景又看实际落地 |
| 个性化参考 | ✨ | 个性化参考 | 基于您的问题和当前状态提供定制化的参考要点 |
| 清晰表达 | 💬 | 清晰表达 | 用简洁易懂的语言将传统文化转化为易于理解的参考信息 |
| 模式观察 | 🔮 | 模式观察 | 我们的 AI 易数系统试图捕捉模式化线索，供您思考参考 |

**每个格子规格：**
- flex items-start gap-3
- 图标 w-8 h-8
- 标题 text-sm font-semibold
- 描述 text-xs text-[#1C1A16]/70 leading-relaxed

##### ⑤ FAQ

| # | 问题 | 答案要点 |
|---|------|---------|
| Q1 | 梅花易数的参考价值如何？ | 梅花易数是中国古代占卜方法之一，基于《易经》八卦体系。我们结合传统易理和现代 AI 分析提供参考视角，但任何占卜结果仅供参考，不做唯一决策依据。 |
| Q2 | AI 的辅助解读可靠吗？ | 我们的 AI 解读基于梅花易数的传统规则库和现代语言模型共同生成，融合了古代智慧与现代分析视角。但请将其作为参考而非绝对指导。 |
| Q3 | 哪类问题适合这个系统？ | 面临选择、需要额外视角的问题都适合尝试。关注一点：表述越清晰具体，参考质量越高。关于医疗、法律等专业问题，请优先咨询专业人士。 |

Accordion 样式同八字页 FAQ 规格。

#### 移动端适配

| 断点 | 行为 |
|------|------|
| >= 1024px (Desktop) | 正常布局 |
| < 1024px (Tablet) | AI 辅助观察 3 卡片保持横排但缩小间距 |
| < 640px (Mobile) | 3 卡片改为纵向堆叠；特色功能 2 列保持 |

#### 与现有梅花易数的关系

| 项目 | 现有 /meihua | 改版后 |
|------|-------------|--------|
| 入口路径 | 导航栏 → 梅花易数 | 不变 |
| 核心变化 | 纯起卦工具 | 增加"问题输入 + 决策建议"层 |
| 起卦功能 | 保留 | 保留并增强（时间/数字/手动三种） |
| 结果展示 | 卦象 + 文字 | 卦象 + AI 三卡片 + 结构化决策建议 |
| 向后兼容 | — | 不填问题也可直接起卦（跳过决策建议，只展示卦象解读） |

**关键设计：问题输入是可选的。** 不填问题直接点"开始解卦" = 传统起卦模式（只展示卦象+基础解读）。填了问题 = 决策模式（完整展示 AI 辅助观察 + 决策建议）。

#### 开发优先级

| 优先级 | 功能 | 说明 |
|--------|------|--------|
| **P0** | 问题输入区（②） | textarea + 示例提示 + 起卦方式选择 |
| **P0** | 本卦/变卦信息卡（③-a） | 已有基础，优化为卡片样式 |
| **P0** | 决策建议（③-c） | 核心差异化，LLM 结构化输出 |
| **P1** | AI 辅助观察三卡片（③-b） | 思考参考/卦象分析/时机参考 |
| **P1** | 特色功能介绍（④） | 静态展示模块 |
| **P1** | FAQ（⑤） | 手风琴折叠 |
| **P2** | 数字起卦 / 手动起卦 | 时间起卦先上，后补两种 |

---

### 7.3.9 塔罗占卜页 `/tarot` （v3 — 2026-04-07 新增）

> **参考竞品**: https://www.fatemaster.ai/zh/workspace/tarot （AI 塔罗占卜）
> **触发原因**: Frank 要求学习 FateMaster 的塔罗占卜功能，优化我们的塔罗页面
> **核心定位**: 从"抽牌看结果"升级为"AI 塔罗解读系统"——问题驱动 + 多模式体验 + 结构化解读

#### 当前问题

| # | 问题 | 说明 |
|---|------|------|
| P1-1 | 缺少问题输入 | 用户直接抽牌，缺少决策场景感 |
| P1-2 | 模式单一 | 只有一种抽牌方式，无法满足不同用户需求 |
| P1-3 | 结果展示扁平 | 抽到的牌 + 解读文字堆在一起，缺乏结构化呈现 |
| P2-1 | 无场景引导 | 新用户不知道塔罗能解决什么类型的问题 |

#### 页面结构（从上到下）

```
 /tarot AI 塔罗占卜
 │
 ├─ ① 标题区
 │
 ├─ ② 问题输入区
 │   └─ textarea + 示例提示 + 开始解读按钮
 │
 ├─ ③ 塔罗体验模式选择（4 卡片横排）
 │   └─ 经典 / 天牌 / 月光 / 镜像
 │
 ├─ ④ 抽牌 & 结果展示区（提交后展示）
 │   ├─ ④-a 抽中的牌（牌面图 + 正逆位）
 │   ├─ ④-b AI 牌意解读（3 层结构）
 │   └─ ④-c 行动建议
 │
 ├─ ⑤ 应用场景介绍（4 宫格）
 │
 ├─ ⑥ FAQ
 │
 └─ ⑦ 底部 CTA
```

##### ① 标题区

| 属性 | 值 |
|------|-----|
| 主标题 | "AI 塔罗占卜" |
| 副标题 | "人工智能驱动的塔罗牌解读系统，更准确、更有深度的占卜体验。" |
| 样式 | 同全局页面标题区规范（暖米白底 #FAF9F6） |

##### ② 问题输入区

**与梅花易数类似的设计模式，保持一致。**

```
┌─ 最想咨询的问题 ─────────────────────────────────────┐
│                                                        │
│  请输入一个你想通过塔罗牌探索的问题或主题               │
│                                                        │
│  ┌──────────────────────────────────────────────────┐  │
│  │ 我的感情走向会如何？                              │  │
│  └──────────────────────────────────────────────────┘  │
│                                                        │
│  示例：                                               │
│  [我的感情走向如何？] [这份工作值得去吗？] [他怎么想？] │
│                                                        │
│  [ 🃏 开始解读 ]                                      │
│                                                        │
└────────────────────────────────────────────────────────┘
```

**输入框规格：**

| 属性 | 值 | Tailwind |
|------|-----|----------|
| 类型 | textarea |
| 高度 | min-h-[100px] max-h-[200px] | `min-h-[100px] max-h-[200px]` |
| 圆角 | rounded-xl (12px) | `rounded-xl` |
| 边框 | 1px solid #D1D5DB | `border border-gray-300` |
| 内边距 | p-4 | `p-4` |
| 字号 | text-sm (14px) | `text-sm` |
| Placeholder | "请输入一个你想通过塔罗牌探索的问题或主题..." | muted 色 |
| 字数限制 | 最大 200 字 | 右下角 "0/200" |

**示例提示标签：**

| 示例问题 | 场景分类 |
|----------|---------|
| "我的感情走向如何？" | 爱情 |
| "这份工作值得去吗？" | 事业 |
| "他/她是怎么想的？" | 人际 |
| "我该如何做这个决定？" | 决策 |

样式同梅花易数：`flex flex-wrap gap-2 mt-2`，圆角 Tag，点击填入。

**提交按钮：**

| 属性 | 值 | Tailwind |
|------|-----|----------|
| 文字 | "🃏 开始解读" | Primary 按钮 |
| 样式 | **Primary 黑底白字** | `bg-[#1C1A16] text-white w-full h-[44px] rounded-xl` |
| Loading | spinner + "正在解读..." | |

##### ③ 塔罗体验模式选择（核心差异化）

> 这是 FateMaster 最大的亮点，我们直接学过来并做本地化优化。

**标题**: "选择你的塔罗体验" — H3, text-lg, font-semibold, text-center, mb-6

**4 种模式卡片横排（每卡右上角带 ⓘ Info 图标，hover 出 tooltip）：**

```
┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐
│    ⚫   ⓘ │  │    ☀️   ⓘ │  │    🌙   ⓘ │  │    ✧   ⓘ │
│   经典    │  │   天牌    │  │   月光    │  │   镜像    │
│          │  │          │  │          │  │          │
│ 传统三张  │  │ 单张聚焦  │  │ 柔和内省  │  │ 深度反思  │
│ 牌阵解读  │  │ 直击核心  │  │ 潜意识探索│  │ 多角度透视│
│          │  │          │  │          │  │          │
│ [ 选择 → ]│  [ 选择 → ]│  [ 选择 → ]│  [ 选择 → ]│
└──────────┘  └──────────┘  └──────────┘  └──────────┘
```

**ℹ Tooltip 说明（hover 触发，卡片右上角 ⓘ 图标）：**

| 模式 | Tooltip 文案 |
|------|-------------|
| **经典** | 最经典的塔罗解读方式，抽取 3 张牌分别代表过去、现在、未来，适合首次体验和日常问题 |
| **天牌** | 只抽 1 张大牌，直击问题核心，给你一个清晰的行动方向，适合快速决策 |
| **月光** | 温柔的内在探索模式，AI 语气更柔和，适合情感困惑、内心矛盾、睡前思考 |
| **镜像** | 从多个角度深度剖析同一问题，抽 5 张牌做交叉验证，适合复杂决策和自我认知 |

> **实现方式（二选一）：**
> - **方案 A（推荐）**: 卡片右上角放 `ⓘ` 圆形图标（16px，muted 色），鼠标 hover 弹出 tooltip（暗色底白字，最大宽度 240px，2 行以内文案），使用 CSS `:hover` + 伪元素或轻量 tooltip 组件
> - **方案 B**: 卡片标题旁直接展示一行简短说明文字（不折叠），牺牲卡片简洁度但零交互成本
>
> **推荐方案 A**，理由：卡片保持简洁，用户主动 hover 才展开，不增加视觉噪音；移动端可改为 click 触发 tooltip

**布局**: `grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4`

**卡片规格：**

| 属性 | 值 | Tailwind |
|------|-----|----------|
| 容器 | bg-white rounded-xl p-4 md:p-5 relative | `bg-white rounded-xl p-4 md:p-5 relative` |
| 边框 | 默认无；选中态 2px solid #1C1A16 | `border-2 border-transparent` 选中: `border-[#1C1A16]` |
| Info 图标 | 右上角绝对定位 `ⓘ`，w-4 h-4，muted 色，cursor-pointer | `absolute top-3 right-3 text-[#1C1A16]/40 hover:text-[#1C1A16]/70` |
| 图标 | text-3xl, 居中 | |
| 标题 | text-sm font-semibold, text-center, mt-2 | |
| 描述 | text-xs text-[#1C1A16]/60, text-center, mt-1, leading-relaxed | line-clamp-2 |
| 选择按钮 | text-xs text-[#1C1A1`6]/70, mt-3, hover 变深 | |

**Tooltip 规格（方案 A）：**

| 属性 | 值 |
|------|-----|
| 触发方式 | 桌面端 hover / 移动端 click（或 touch） |
| 位置 | 图标上方弹出（避免遮挡卡片内容） |
| 容器 | bg-[#1C1A16] text-white text-xs rounded-lg p-3 |
| 最大宽度 | max-w-[240px] |
| 行数 | 最大 2 行，超出省略 |
| 动画 | fade-in 150ms |
| 箭头 | 底部居中小三角指向 ⓘ 图标 |
| 遮罩层 | 无需 backdrop，tooltip 本身足够小不干扰 |

**4 种模式详细定义：**

| 模式 | 图标 | 说明 | 抽牌数量 | 适用场景 |
|------|------|------|---------|---------|
| **经典** | ⚫ | 传统三张牌阵（过去/现在/未来），最经典的塔罗解读方式 | 3 张 | 新手首选、通用场景 |
| **凯尔特十字** | ✝︎ | 凯尔特十字牌阵，塔罗界最权威的深度解读布局，10 张牌全方位分析 | 10 张 | 重大人生决策、深度自我探索、VIP 用户核心功能 |
| **月光** | 🌙 | 柔和内省风格，关注潜意识与内在感受，解读语气更温柔 | 3 张 | 情感困惑、内心探索、睡前思考 |
| **镜像** | ✧ | 多角度透视模式，从不同维度分析同一问题，给出更犀利的判断 | 5 张 | 复杂决策、深度自我认知 |

**交互逻辑：**
- 默认选中「经典」模式
- 点击任意卡片切换选中态（边框高亮）
- 凯尔特十字模式标注 "VIP" 或 "深度" 标签（P1 阶段可做付费门槛）
- 月光和镜像模式上线前显示"即将上线"态（置灰 + 标签）
- 切换模式时重置抽牌状态
- 移动端 2x2 网格（桌面端 4 列横排）

##### ④ 抽牌 & 结果展示区

默认隐藏，点"开始解读"后展示。

##### ④-a 抽中的牌

**经典模式（3 张）：**

```
┌──────────────────────────────────────────────────┐
│                                                    │
│   过去              现在              未来         │
│  ┌──────┐         ┌──────┐         ┌──────┐      │
│  │      │         │      │         │      │      │
│  │ 愚人  │         │ 魔术师│         │ 女皇  │      │
│  │ ○正位 │         │ ●逆位 │         │ ○正位 │      │
│  └──────┘         └──────┘         └──────┘      │
│                                                    │
└──────────────────────────────────────────────────┘
```

**布局**: `flex justify-around items-end gap-4`

**每张牌规格：**

| 属性 | 值 |
|------|-----|
| 牌面容器 | w-[100px] h-[170px] md:w-[120px] md:h-[200px]（塔罗标准比例约 0.6） |
| 圆角 | rounded-lg (8px) |
| 边框 | 1px solid rgba(28,26,22,0.1) |
| 阴影 | shadow-md |
| 牌面图 | 塔罗牌图片（78 张之一），铺满容器 |
| 正位/逆位标记 | 牌下方小 Tag：正位=绿底绿字，逆位=红底红字 |
| 牌名 | text-sm font-medium, text-center, mt-2 |
| 时间标签 | "过去"/"现在"/"未来"，text-xs text-muted, text-center, mt-1 |

**天牌模式（1 张）：**
- 单张大牌居中显示，w-[140px] h-[240px]
- 下方显示牌名 + 正逆位 + 一句话核心提示

**抽牌动效（重要体验细节）：**
- 点"开始解读"后，先展示牌背（统一背面图案）
- 1.5s 后牌面翻转动画（CSS 3D transform rotateY）
- 翻牌顺序：经典模式从左到右依次翻开，间隔 0.3s
- 翻牌时有微弱音效（可选，P2）

##### ④-b AI 牌意解读（3 层结构）

> 类似梅花易数的 AI 解读，但针对塔罗牌调整内容框架。

```
┌─ AI 牌意解读 ───────────────────────────────────────┐
│                                                      │
│  ┌─ 牌面含义 ──────────────────────────────────┐    │
│  │ 愚人（正位）：新的开始、纯真、冒险精神        │    │
│  │ 代表你正处于人生新阶段的起点...              │    │
│  └──────────────────────────────────────────────┘    │
│                                                      │
│  ┌─ 综合解读 ──────────────────────────────────┐    │
│  │ 三张牌整体来看，你的能量流向是...            │    │
│  │ 从愚人到魔术师再到女皇，暗示了一段...        │    │
│  └──────────────────────────────────────────────┘    │
│                                                      │
│  ▶ 展开详细解读                                     │
│                                                      │
└──────────────────────────────────────────────────────┘
```

**3 层结构：**

| 层级 | 内容 | 默认状态 |
|------|------|---------|
| 第1层 牌面含义 | 每张牌的单独释义（牌名+正逆位+传统含义+现代解读） | 展开 |
| 第2层 综合解读 | 结合所有牌的整体叙事，把牌串成一个故事 | 展开 |
| 第3层 详细解读 | AI 生成的完整段落分析（结合用户问题） | **折叠**，点击展开 |

**输出格式约束（System Prompt）：**
- 牌面含义：每张牌 50-80 字
- 综合解读：100-150 字
- 详细解读：200-300 字
- 总输出控制在 500 字以内

##### ④-c 行动建议

> 与梅花易数的决策建议对等，但用塔罗语境表达。

```
┌─ 行动指引 ─────────────────────────────────────────┐
│                                                      │
│  💡 塔罗的建议                                       │
│                                                      │
│  牌面整体能量偏向正向发展。愚人正位提示你应勇敢迈出   │
│  第一步，不必过度担忧未知的 outcome...                │
│                                                      │
│  ⚠ 注意事项                                         │
│  魔术师逆位提醒你在执行层面可能遇到阻碍，避免好高骛远。│
│                                                      │
└──────────────────────────────────────────────────────┘
```

| 属性 | 值 |
|------|-----|
| 容器 | bg-white rounded-2xl p-6 |
| 建议标题 | "💡 塔罗的建议"，text-base font-semibold |
| 建议正文 | text-sm leading-relaxed, text-[#1C1A16]/75 |
| 注意事项 | ⚠ 前缀, text-amber-700 bg-amber-50 px-2 py-1 rounded |

##### ⑤ 应用场景介绍

**标题**: "AI 塔罗占卜应用场景" — H3, text-center, font-semibold, mt-12 mb-6

**布局**: 2x2 网格 — `grid grid-cols-1 md:grid-cols-2 gap-4`

| 场景 | 图标 | 标题 | 描述 |
|------|------|------|------|
| 爱情关系 | 💕 | 爱情关系探索 | 探索感情走向、了解伴侣想法、处理情感困惑 |
| 事业决策 | 💼 | 事业发展与决策 | 职业选择、项目前景、职场人际关系判断 |
| 重大选择 | 🔀 | 重要抉择参考 | 面临人生十字路口时获取额外视角 |
| 日常生活 | 🌟 | 日常灵感指引 | 每日一牌、寻找生活灵感、自我对话与觉察 |

**每个格子规格：** flex items-start gap-3, 图标 w-8 h-8, 标题 text-sm font-semibold, 描述 text-xs text-muted

##### ⑥ FAQ

| # | 问题 | 答案要点 |
|---|------|---------|
| Q1 | AI 塔罗占卜和小程序抽牌有什么区别？| 我们的系统结合了传统塔罗牌意数据库与大语言模型，不是随机抽取固定文案，而是根据你的问题和抽到的牌实时生成个性化解读。每次解读都是独一无二的。 |
| Q2 | 如果抽到"不好"的牌怎么办？| 塔罗牌没有绝对的好坏。所谓"负面"牌往往是在提醒你注意某些方面，是一种保护和指引。我们的 AI 会以建设性的方式帮你理解牌面的参考价值。 |
| Q3 | AI 塔罗占卜适合频繁使用吗？| 建议对同一个问题不要频繁重复占卜。塔罗更适合作为定期自我反思的工具（如每周一次），而非反复确认同一件事。频繁占卜容易导致依赖和焦虑。 |

Accordion 样式同前。

##### ⑦ 底部 CTA

```
┌──────────────────────────────────────────────────┐
│                                                    │
│       体验 AI 塔罗占卜的智慧                       │
│                                                    │
│   FateMaster 的 AI 塔罗系统融合了传统塔罗智慧       │
│   与现代 AI 技术，为你提供更准确、更有深度的解读。  │
│   无论你是塔罗新手还是资深爱好者，都能从中获得启发。 │
│                                                    │
│   [ 开始我的塔罗解读 → ]    [ 了解更多 ↑ ]          │
│                                                    │
└──────────────────────────────────────────────────┘
```

| 属性 | 值 |
|------|-----|
| 背景 | 暖米白渐变 | `bg-gradient-to-b from-[#FAF9F6] to-white` |
| 主标题 | text-xl font-semibold, text-center |
| 描述文字 | text-sm text-[#1C1A16]/60, text-center, max-w-xl mx-auto, mt-3, leading-relaxed |
| CTA 按钮 | Primary 黑底白字 `bg-[#1C1A16] text-white px-8 py-3 rounded-xl` |
| 副按钮 | Ghost 样式 "了解更多 ↑" |

#### 不同模式的差异对照

| 维度 | 经典 | 凯尔特十字 | 月光 | 镜像 |
|------|------|-----------|------|------|
| 抽牌数 | 3 | 10 | 3 | 5 |
| 牌阵 | 过去/现在/未来 | 凯尔特十字（10位置） | 身心灵/潜意识/指引 | 多角度自定义 |
| AI 语气 | 中性客观 | 深度权威 | 温柔治愈 | 深度犀利 |
| 解读长度 | 标准(500字) | 长(1000字) | 标准(500字) | 长(700字) |
| 适合用户 | 新手/首次 | 进阶/VIP | 情感型用户 | 深度探索者 |
| 默认推荐 | 是 | 否 | 否 | 否 |
| 付费门槛 | 免费 | VIP / 付费 | 免费 | P1 后定 |

##### 凯尔特十字牌阵布局（10 个位置）

> 凯尔特十字是塔罗界最经典的深度牌阵，10 张牌各有固定含义。

```
┌─────────────────────────────────────────────┐
│                       ┌──────┐               │
│                       │  ①   │  当前现状     │
│                       └──────┘               │
│  ┌──────┐        ┌──────┐        ┌──────┐    │
│  │  ②   │────────│  ①+② │────────│  ③   │    │
│  │挑战  │        │ 核心  │        │ 意识  │    │
│  └──────┘        └──────┘        └──────┘    │
│                                               │
│          ┌──────┐                             │
│          │  ④   │  基础/根源                 │
│          └──────┘                             │
│                                               │
│   ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐    │
│   │  ⑦   │  │  ⑥   │  │  ⑤   │  │  ⑧   │    │
│   │可能   │  │ 近期  │  │ 希望  │  │ 外部  │    │
│   │结果   │  │ 发展  │  │/恐惧  │  │ 环境  │    │
│   └──────┘  └──────┘  └──────┘  └──────┘    │
│                                               │
│              ┌──────┐                         │
│              │  ⑨   │  心态/信念              │
│              └──────┘                         │
│              ┌──────┐                         │
│              │  ⑩   │  最终结局               │
│              └──────┘                         │
└─────────────────────────────────────────────┘
```

**10 个位置定义：**

| 位置 | 名称 | 含义 |
|------|------|------|
| ① | 当前现状 | 问题的核心，你现在的状态和处境 |
| ② | 挑战/阻碍 | 影响问题的负面因素或障碍 |
| ③ | 意识层面 | 你表面上看到的、理性认知的部分 |
| ④ | 基础/根源 | 问题的深层原因、潜意识根源 |
| ⑤ | 希望/恐惧 | 你内心期望或担忧的结果 |
| ⑥ | 近期发展 | 未来短期内（数天~数周）的发展方向 |
| ⑦ | 可能结果 | 按当前趋势最可能出现的情况 |
| ⑧ | 外部环境 | 周围的人和环境因素如何影响问题 |
| ⑨ | 心态/信念 | 你的内心态度和信念系统 |
| ⑩ | 最终结局 | 问题长期发展的最终走向 |

**凯尔特十字展示规格：**

| 属性 | 值 |
|------|-----|
| 整体容器 | bg-white rounded-2xl p-6, max-w-2xl mx-auto |
| 牌尺寸 | w-[70px] h-[120px]（比经典模式小，因为 10 张要放下） |
| 中心十字区（①-④） | flex 居中十字排列，②在左 ①+②在中 ③在右 ④在下 |
| 纵向列（⑤-⑥-⑦） | 在右侧纵向排列 |
| 底部行（⑧-⑨-⑩） | 横向三等分排列 |
| 每张牌下方标注位置名 + 小字号牌名 | text-xs text-muted |
| 点击任意牌 → 弹出该位置的详细解读（Modal 或展开面板） |

**移动端凯尔特十字适配：**
- 10 张牌改为 **上下两排各 5 张**的简化布局
- 或改为**纵向列表**：每张牌一行（左侧牌面 + 右侧位置名+解读摘要）
- 推荐：纵向列表方案，更适合手机屏幕

#### 移动端适配

| 断点 | 行为 |
|------|------|
| >= 1024px (Desktop) | 4 模式横排 / 3 牌横排 |
| < 1024px (Tablet) | 4 模式保持 2x2 网格 |
| < 640px (Mobile) | 2x2 模式网格 / 3 牌纵向堆叠或缩小横向滑动 |

#### 开发优先级

| 优先级 | 功能 | 说明 |
|--------|------|--------|
| **P0** | 问题输入区（②） | textarea + 示例标签 + Primary 按钮 |
| **P0** | 经典模式（③） | 3 张牌阵（过去/现在/未来），作为唯一可用模式先上线 |
| **P0** | 抽牌展示（④-a） | 牌面图 + 正逆位 + 翻牌动效 |
| **P0** | AI 牌意解读（④-b） | 3 层结构（牌面含义+综合解读+详细折叠） |
| **P0** | 行动建议（④-c） | 塔罗语境的行动指引 |
| **P1** | 凯尔特十字模式（③） | 10 张牌深度牌阵，VIP 功能 |
| **P1** | 月光模式（③） | 柔和内省模式 |
| **P1** | 镜像模式（③） | 多角度透视 5 张牌 |
| **P1** | 应用场景（⑤）+ FAQ（⑥）+ 底部 CTA（⑦） | 静态模块 |
| **P2** | 翻牌音效 | 音频资源 |
| **P2** | 自定义牌背图案 | 品牌化设计 |

#### 塔罗牌视觉规范（美术虾交付物）

> **风格决策**: Frank 已确认采用 **日系线描/浮世绘风格**（参考已提供的 THE FOOL 愚人牌样图）
> **核心特征**: 极简黑色线描 + 暖白底色 + 少量点缀色 + 东方化人物表达

**整体视觉语言：**

| 属性 | 规范 |
|------|------|
| 风格定位 | 日系线描 / 浮世绘风 / 东方塔罗 |
| 主色调 | 黑色线条（描边）+ 暖白/米白底 (#FAF9F6) |
| 点缀色 | 每张牌限用 1-2 个点缀色，保持克制 |
| 点缀色参考 | 酒红 #991B1B / 深蓝 #1E3A5F / 暗红 #7F1D1D / 金 #B45309 / 墨绿 #14532D |
| 人物风格 | 和服/东方服饰（非西方长袍），东方化面孔 |
| 排版 | 牌名用衬线体英文（如 "THE FOOL"），底部装饰分割线 |
| 外框 | 圆角矩形卡片，无边框或极细边框 |
| 与全站关系 | 天然匹配 Design Tokens v6 暖黑+暖白体系 |

**牌面规格：**

| 属性 | 值 |
|------|-----|
| 比例 | 约 0.6 (宽:高 = 3:5) |
| 分辨率 | 300dpi，显示尺寸 240x400px（@2x: 480x800px） |
| 格式 | PNG（透明背景）或 WebP |
| 底色 | #FAF8F5 暖白（与全站一致） |
| 内边距 | 各边留 8px 安全区 |

**美术虾交付清单：**

| 批次 | 内容 | 数量 | 用途 | 优先级 |
|------|------|------|------|--------|
| 第1批 | 大阿卡纳（Major Arcana）牌面 | 22 张 | P0 经典模式只用大阿卡纳 | **P0** |
| 第2批 | 牌背设计 | 1 张 | 抽牌时展示的背面 | **P0** |
| 第3批 | 小阿卡纳（Minor Arcana）牌面 | 56 张 | P1 全部模式可用 | P1 |
| 合计 | 总计 | **79 张** | | |

**大阿卡纳 22 张清单（P0 必须先出）：**

| # | 英文名 | 中文名 | 建议点缀色 |
|---|--------|--------|-----------|
| 0 | THE FOOL | 愚人 | 酒红 |
| I | THE MAGICIAN | 魔术师 | 深蓝 |
| II | HIGH PRIESTESS | 女祭司 | 靛蓝 |
| III | EMPRESS | 皇后 | 粉绿 |
| IV | EMPEROR | 皇帝 | 金 |
| V | HIEROPHANT | 教皇 | 紫 |
| VI | LOVERS | 恋人 | 玫红 |
| VII | CHARIOT | 战车 | 红 |
| VIII | STRENGTH | 力量 | 橙 |
| IX | HERMIT | 隐者 | 墨绿 |
| X | WHEEL OF FORTUNE | 命运之轮 | 金+深蓝 |
| XI | JUSTICE | 正义 | 深蓝 |
| XII | HANGED MAN | 倒吊人 | 靛蓝 |
| XIII | DEATH | 死亡 | 黑+墨绿 |
| XIV | TEMPERANCE | 节制 | 蓝+绿 |
| XV | DEVIL | 恶魔 | 暗红 |
| XVI | TOWER | 高塔 | 灰黑 |
| XVII | STAR | 星星 | 靛蓝+金 |
 XVIII | MOON | 月亮 | 深紫 |
| XIX | SUN | 太阳 | 金黄 |
| XX | JUDGEMENT | 审判 | 白+金 |
| XXI | WORLD | 世界 | 彩虹点缀(克制) |

**牌背设计要求：**
- 统一几何纹样
- 可融入太极/八卦/五行元素（CyberFate 品牌符号）
- 同一线描风格，不喧宾夺主
- 深色底（#1C1A16 或近黑）+ 线描暗纹

**技术对接：**
- 图片存放路径：`public/images/tarot/` 目录
- 命名规范：`major-00-fool.png`, `major-01-magician.png` ... `back.png`
- 代码虾先用占位图开发，美术虾出图后替换即可

---

### 7.3.10 六爻占卜页 `/liuyao` （v3 — 2026-04-08 新增）

> **参考竞品**: https://www.fatemaster.ai/zh/workspace/liuyao （AI 六爻占卜）
> **当前线上**: https://www.cyberfate.me/liuyao（已有基础页面，需升级）
> **触发原因**: Frank 要求学习 FateMaster 的六爻占卜功能，优化我们的六爻页面
> **核心定位**: 从"简单起卦"升级为"AI 六爻预测系统"——多种起卦方式 + 卦象可视化 + 结构化 AI 分析

#### 当前问题

| # | 问题 | 说明 |
|---|------|------|
| P1-1 | 起卦方式单一 | 可能只有一种起卦方式，缺少手动/铜钱/时间/数字等多种选择 |
| P1-2 | 缺少问题输入 | 用户无法带着具体问题来起卦 |
| P1-3 | 卦象展示不够直观 | 缺少六十四卦的图形化展示（八卦符号） |
| P1-4 | 结果展示扁平 | 卦辞+爻辞堆在一起，缺乏结构化分析 |

#### 页面结构（从上到下）

```
 /liuyao AI 六爻占卜
 │
 ├─ ① 标题区
 │
 ├─ ② 问题输入区
 │   └─ textarea + 示例提示标签
 │
 ├─ ③ 起卦方式选择（4 选 1）
 │   ├─ 手动起卦（6 爻逐爻选阴阳）
 │   ├─ 铜钱起卦（模拟抛铜钱）
 │   ├─ 时间起卦（基于时间自动）
 │   └─ 数字起卦（输入数字）
 │
 ├─ ④ 起卦参数区（根据方式动态切换）
 │   ├─ 手动模式：6 行爻选择器 + 卦象预览
 │   ├─ 铜钱模式：抛币动画 / 记录界面
 │   ├─ 时间模式：时间选择器
 │   └─ 数字模式：数字输入框
 │
 ├─ ⑤ 占卜时间显示
 │
 ├─ ⑥ 开始解卦按钮
 │
 ├─ ⑦ 解卦结果区（提交后展示）
 │   ├─ ⑦-a 本卦/变卦信息卡（含八卦符号图）
 │   ├─ ⑦-b 各爻详解（6 条爻辞+解读）
 │   ├─ ⑦-c AI 三卡片分析（卦象框架/AI分析/对运分析）
 │   └─ ⑦-d 行动建议
 │
 ├─ ⑧ 特色功能介绍（4 宫格）
 │
 └─ ⑨ FAQ
```

##### ① 标题区

| 属性 | 值 |
|------|-----|
| 主标题 | "AI 六爻占卜 · 智能预测分析" |
| 副标题 | "融合传统六爻占卜与人工智能技术，为你提供更深度的卦象分析和趋势预测。" |
| 样式 | 同全局页面标题区规范（暖米白底 #FAF9F6） |

##### ② 问题输入区

与梅花易数、塔罗保持一致的设计语言：

**输入框规格：**

| 属性 | 值 | Tailwind |
|------|-----|----------|
| 类型 | textarea |
| 高度 | min-h-[100px] max-h-[200px] | `min-h-[100px] max-h-[200px]` |
| 圆角 | rounded-xl (12px) | `rounded-xl` |
| 边框 | 1px solid #D1D5DB | `border border-gray-300` |
| 内边距 | p-4 | `p-4` |
| 字号 | text-sm (14px) | `text-sm` |
| Placeholder | "最想咨询的问题或主题..." | muted 色 |
| 字数限制 | 最大 200 字 | 右下角 "0/200" |

**示例提示标签：**

| 示例问题 | 场景 |
|----------|------|
| "我近期的工作运势如何？" | 事业 |
| "这件事能成吗？" | 决策 |
| "他和我的关系走向？" | 感情 |
| "最近需要注意什么？" | 日常 |

样式同前：圆角 Tag，点击填入。

##### ③ 起卦方式选择

> 这是六爻的核心差异化——比梅花易数和塔罗更丰富的起卦方式。

**标题**: "起卦方式" — H3, text-base font-semibold, mb-3

**4 种方式（图标卡片横排，全部可用）：**

```
┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐
│    ✋     │  │    🪙     │  │    ⏰     │  │    🔢     │
│   手动起卦 │  │  铜钱起卦  │  │  时间起卦  │  │  数字起卦  │
│          │  │          │  │          │  │          │
│ 逐爻选阴阳│  │ 模拟抛铜钱│  │ 时间自动起│  │ 输入数字起│
│          │  │          │  │          │  │          │
│ [ 选择 → ]│  [ 选择 → ]│  [ 选择 → ]│  [ 选择 → ]│
└──────────┘  └──────────┘  └──────────┘  └──────────┘
```

**布局**: `grid grid-cols-2 md:grid-cols-4 gap-3`

**卡片规格：**

| 属性 | 值 | Tailwind |
|------|-----|----------|
| 容器 | bg-white rounded-xl p-4 relative | `bg-white rounded-xl p-4 relative` |
| **选中态** | **边框 2px #1C1A16 + 极淡暖底填充** | **`border-2 border-[#1C1A16] bg-[rgba(28,26,22,0.03)]`** |
| 未选中态 | border 1px #E5E5E5 | `border border-[#E5E5E5]` |
| 图标 | text-2xl, 居中 | |
| 标题 | text-sm font-medium, text-center, mt-2 | |
| 描述 | text-xs text-muted, text-center, mt-1 | line-clamp-1 |

> ⚠️ **设计规范（2026-04-08 Frank 反馈修正）：**
> - **选中态禁止使用纯黑底**，统一用边框高亮 + 极淡暖底填充
> - 四种模式全部为可交互状态，无"即将上线"

**交互逻辑：**
- 切换起卦方式 → 下方的「④ 起卦参数区」动态切换内容
- 默认选中「手动起卦」（六爻最传统的方式）
- 四种方式均可自由切换使用

##### ④ 起卦参数区（动态面板）

###### ④-a 手动起卦面板（默认）

```
┌─ 手动起卦 ────────────────────────────────────────┐
│                                                     │
│  请从下往上依次选择六爻的阴阳                       │
│                                                     │
│  上六爻  ──────────  ○ 阴爻  ● 阳爻               │
│  五爻    ──────────  ○ 阴爻  ● 阳爻               │
│  四爻    ──────────  ○ 阴爻  ● 阳爻               │
│  三爻    ──────────  ○ 阴爻  ● 阳爻               │
│  二爻    ──────────  ○ 阴爻  ● 阳爻               │
│  初爻    ──────────  ○ 阴爻  ● 阳爻               │
│                                                     │
│  ┌──────────────┐  ┌──────────────┐                │
│  │    ☰  ☶     │  │   〇  X      │                │
│  │  上卦  下卦  │  │  本卦  变卦  │                │
│  └──────────────┘  └──────────────┘                │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**6 行爻选择器规格：**

| 属性 | 值 |
|------|-----|
| 布局 | flex flex-col gap-3 |
| 每行 | 左侧：爻位名（初爻~上爻）+ 右侧：两个选项（阴爻/阳爻） |
| 爻位名 | text-sm text-[#1C1A16]/60, w-16 |
| 选项样式 | SegmentControl 小型，gap-2, h-8 |
| 阴爻选项 | "○ 阴爻"（断开的线 ── ──） |
| 阳爻选项 | "● 阳爻"（实线 ━━━━） |
| 未选态 | 两者都 muted 色 |
| 选中态 | 品牌色填充 |

**右侧实时卦象预览：**

| 属性 | 值 |
|------|-----|
| 布局 | 与爻选择器并排（桌面端）或在下方（移动端） |
| 本卦区 | 显示上卦(三爻) + 下卦(三爻)的八卦符号（☰☱☲☳☴☵☶☷） |
| 变卦区 | 如果有动爻则显示变卦；无动爻则显示"纯静卦" |
| 卦名 | 显示本卦名（如"天山遁"）+ 变卦名（如"天地否"） |
| 动爻标记 | 动爻位置用红色小点标注 |

**动爻规则（可选增强）：**
- 用户可以选择某爻为"动爻"（点击已选的爻切换动静状态）
- 或者系统默认：不设动爻 = 纯静卦；随机动爻 = 系统指定一根
- P0 建议：先不做动爻选择，默认纯静卦（降低复杂度）

###### ④-b 铜钱起卦面板

```
┌─ 铜钱起卦 ────────────────────────────────────────┐
│                                                     │
│  模拟传统三枚铜钱起卦，请依次为每一爻抛币            │
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │                                             │   │
│  │        🪙 🪙 🪙                             │   │
│  │       (背面) (正面) (背面)                   │   │
│  │                                             │   │
│  │         二爻：一阴一阳 → 少阳 ☴             │   │
│  │                                             │   │
│  │      [ 抛下一爻的铜钱 ]                      │   │
│  │                                             │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  进度：●●●○○○  3/6 爻已完成                        │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**铜钱规则（传统朱熹法）：**
- 3 枚铜钱抛一次 = 得到 1 爻
- 3 背 = 老阳（○ 动阳）= ━━━━ → 变 ── ──
- 3 正 = 老阴（✕ 动阴）= ── ── → 变 ━━━━
- 1 背 2 正 = 少阳（• 阳爻）= ━━━━
- 1 正 2 背 = 少阴（✧ 阴爻）= ── ──
- 从初爻（最下）开始，依次抛 6 次 = 完整一卦

**交互：**
- 点击"抛铜钱"按钮 → 3 枚铜钱翻转动画（CSS 3D）
- 显示正/反面结果 → 自动判定阴阳
- 进度条显示当前第几爻
- 6 爻完成后自动显示完整卦象
- 可随时"重新抛币"重来

**P0 阶段实现（2026-04-09 Frank 决策升级）。**

> **完整交互流程：**

```
┌─ 铜钱起卦 ────────────────────────────────────────┐
│                                                     │
│  模拟传统三枚铜钱起卦，请依次为每一爻抛币            │
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │                                             │   │
│  │        🪙 🪙 🪙                             │   │
│  │       (背面) (正面) (背面)                   │   │
│  │                                             │   │
│  │         二爻：一阴一阳 → 少阳 ☴             │   │
│  │                                             │   │
│  │      [ 抛下一爻的铜钱 ]                      │   │
│  │                                             │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  进度：●●●○○○  3/6 爻已完成                        │
│                                                     │
│           [ 🔄 重新抛币 ]                           │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**铜钱规则（传统朱熹法）：**
- 3 枚铜钱抛一次 = 得到 1 爻
- 3 背 = 老阳（○ 动阳）= ━━━━ → 变 ── ──
- 3 正 = 老阴（✕ 动阴）= ── ── → 变 ━━━━
- 1 背 2 正 = 少阳（• 阳爻）= ━━━━
- 1 正 2 背 = 少阴（✧ 阴爻）= ── ──
- 从初爻（最下）开始，依次抛 6 次 = 完整一卦

**交互细节：**
- 入场状态：显示"开始抛币"主按钮（替代上面的面板）
- 点击"开始抛币"→ 进入第一爻抛币状态
- 点击"抛下一爻的铜钱"按钮 → 3 枚铜钱翻转动画（CSS 3D transform rotateX，duration 800ms）
- 动画结束 → 显示正/反面结果 → 自动判定阴阳（带文字说明如"二背一正 → 少阳"）
- 自动推进到下一爻，0.5s 后更新 UI
- 进度指示器：6 个圆点 `●●○○○○`，已完成的实心，当前进行中脉冲动画
- 6 爻全部完成 → 自动展示完整卦象 + 解卦结果区
- 过程中可随时点"重新抛币"清零重来
- 每次抛币结果用前端伪随机（Math.random），不需要后端参与

**铜钱视觉规格：**

| 属性 | 值 |
|------|-----|
| 铜钱容器 | flex justify-center gap-4 my-4 |
| 单枚铜钱 | w-16 h-16 rounded-full |
| 正面 | bg-[#D4A574]（铜色渐变）+ 中文字"乾隆通宝"或简化为"通宝" |
| 背面 | bg-[#8B6914]（深铜色）+ 简单八卦纹 ✦ |
| 翻转动效 | rotateY(0) → rotateY(720deg) + scale(1.1→1)，ease-in-out, 800ms |

**面板规格：**

| 属性 | 值 | Tailwind |
|------|-----|----------|
| 容器 | bg-white rounded-xl p-5 border border-gray-100 | |
| 标题 | text-base font-semibold mb-3 | "🪙 铜钱起卦" |
| 进度条 | flex gap-2 justify-center my-3 | 6 个圆点 w-3 h-3 rounded-full |
| 抛币按钮 | Primary 黑底白字 h-10 rounded-lg px-6 | `[ 抛下一爻的铜钱 ]` |
| 重置按钮 | text-sm text-muted underline mt-2 | `[ 🔄 重新抛币 ]` |

###### ④-c 时间起卦面板

> **P0 阶段实现（2026-04-09 Frank 决策升级）。**

```
┌─ 时间起卦 ────────────────────────────────────────┐
│                                                     │
│  基于当前时间自动起卦，这是最便捷的方式              │
│                                                     │
│  占卜时间                                          │
│  ┌──────────────────────────────────────┐          │
│  │  📅 2026/04/09  00:09        ▼ 🕐    │          │
│  └──────────────────────────────────────┘          │
│                                                     │
│  ☰ 天风姤                                         │
│  上卦：☰ 乾（天）  下卦：☴ 巽（风）                │
│                                                     │
│  [ 使用当前时间 ]  [ 🔲 自定义时间 ]               │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**两种模式：**

| 模式 | 说明 | 触发方式 |
|------|------|---------|
| **快速模式** | 一键使用当前时间，自动起卦 | 点击"使用当前时间"按钮 |
| **自定义模式** | 用户选择年月日时，基于所选时间起卦 | 点击日期/时间选择器修改 |

**默认行为（快速模式）：**
- 入场即显示当前时间
- 卦象预览实时计算（时间变 → 卦象跟着变）
- 主按钮："立即起卦"（Primary），点击直接进入解卦结果

**自定义模式：**
- 日期选择器：原生 date input 或轻量日期 picker
- 时间选择器：原生 time input，精度到小时（时辰级别即可）
- 可选范围：1900-01-01 ~ 当前时间（不能选未来）
- 修改时间后实时预览卦象变化

**起卦算法（先天伏羲数法）：**
```
上卦 = (年 + 月 + 日) % 8
下卦 = (年 + 月 + 日 + 时) % 8
动爻 = (年 + 月 + 日 + 时) % 6
```
- 八卦映射：0=☰乾 1=☱兑 2=☲离 3=☳震 4=☴巽 5=☵坎 6=☶艮 7=☷坤
- 劭爻从初爻（1）开始数，0 对应上六爻（循环）

**面板规格：**

| 属性 | 值 | Tailwind |
|------|-----|----------|
| 容器 | bg-white rounded-xl p-5 border border-gray-100 | |
| 标题 | text-base font-semibold mb-3 | "⏰ 时间起卦" |
| 日期输入 | date input, w-full h-10 border rounded-lg px-3 | |
| 时间输入 | time input, w-full h-10 border rounded-lg px-3 | |
| 卦象预览 | 实时计算，text-center, my-4 | 上卦符号+下卦符号+卦名 |
| 主按钮 | Primary 黑底白字 h-[44px] w-full rounded-xl | "[ ⏰ 立即起卦 ]" |
| 说明文字 | text-xs text-muted mt-2 | "基于年月日时数字按易数规律自动生成卦象" |

###### ④-d 数字起卦面板

> **P0 阶段实现（2026-04-09 Frank 决策升级）。**

```
┌─ 数字起卦 ────────────────────────────────────────┐
│                                                     │
│  输入数字来生成卦象，适合有特定数字灵感时使用        │
│                                                     │
│  ┌────────────────┐  ┌────────────────┐            │
│  │ 上卦数字        │  │ 下卦数字        │            │
│  │ ┌───────────┐  │  │ ┌───────────┐  │            │
│  │ │     3     │  │  │ │     7     │  │            │
│  │ └───────────┘  │  │ └───────────┘  │            │
│  │ (1-9999)      │  │ (1-9999)      │            │
│  └────────────────┘  └────────────────┘            │
│                                                     │
│  ┌────────────────┐  ┌────────────────┐            │
│  │ 动爻位置        │  │ 参考数字        │            │
│  │ ┌───────────┐  │  │ ┌───────────┐  │            │
│  │ │     2     │  │  │ │     5     │  │            │
│  │ └───────────┘  │  │ └───────────┘  │            │
│  │ (1-6)         │  │ (可选)        │            │
│  └────────────────┘  └────────────────┘            │
│                                                     │
│  ☰ 天地否                                         │
│  上卦：☰ 乾（天）  下卦：☷坤（地）  动爻：二爻    │
│                                                     │
│  [ 🎲 随机生成 ]          [ 🔮 开始解卦 ]          │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**字段定义：**

| 字段 | 类型 | 默认值 | 范围 | 必填 | 说明 |
|------|------|--------|------|------|------|
| 上卦数字 | number input | 空 | 1-9999 | ✅ | 用于计算上卦 |
| 下卦数字 | number input | 空 | 1-9999 | ✅ | 用于计算下卦 |
| 动爻位置 | number input | 无（无动爻） | 1-6 或空 | ❌ | 不填则纯静卦；填了则该爻为动爻 |
| 参考数字 | number input | 空 | 1-9999 | ❌ | 备用参数，可用于变卦计算 |

**起卦算法：**
```
上卦 = 上卦数字 % 8
下卦 = 下卦数字 % 8
动爻 = 动爻位置（用户指定，1=初爻 ~ 6=上爻）
```
- 八卦映射同时间起卦
- 如果动爻位置为空 → 纯静卦（无变卦）
- 如果参考数字有值 → 变卦下卦 = 参考数字 % 8

**快捷操作：**
- 「🎲 随机生成」按钮：一键填充 4 个随机数字，用户可直接点解卦或微调
- 随机范围：上卦/下卦 1-999，动爻 1-6（50%概率为空/纯静卦），参考 1-999

**面板规格：**

| 属性 | 值 | Tailwind |
|------|-----|----------|
| 容器 | bg-white rounded-xl p-5 border border-gray-100 | |
| 标题 | text-base font-semibold mb-3 | "🔢 数字起卦" |
| 输入框网格 | grid grid-cols-2 gap-3 | |
| 单个输入框 | h-12 border rounded-lg px-3 text-center text-lg font-medium | |
| Label | text-xs text-muted mb-1 | |
| Placeholder | 例: "3", "7" | |
| 卦象预览 | 实时计算（上卦+下卦都有值时触发），text-center my-4 | |
| 随机按钮 | Secondary 按钮（白底黑边）h-10 rounded-lg px-4 | |
| 主按钮 | Primary 黑底白字 h-[44px] rounded-xl | "[ 🔮 开始解卦 ]" |
| 校验 | 上卦和下卦必填；动爻和参考选填；超范围提示 | |

##### ⑤ 占卜时间

| 属性 | 值 |
|------|-----|
| Label | "占卜时间" |
| 格式 | YYYY/MM/DD HH:mm |
| 默认 | 当前时间 |
| 可修改 | 是，DateTimeLocal input |
| 说明 | "占卜时间会影响卦象的时效性参考" |

##### ⑥ 开始解卦按钮

| 属性 | 值 | Tailwind |
|------|-----|----------|
| 文字 | "开始解卦 🔮" | Primary 按钮 |
| 样式 | **Primary 黑底白字** | `bg-[#1C1A16] text-white w-full h-[44px] rounded-xl` |
| Loading | spinner + "正在解卦..." | |
| 校验 | 手动模式下必须选完 6 爻才能提交 | 未完成时按钮禁用 + 提示 |

##### ⑦ 解卦结果区

默认隐藏，提交后展示。

##### ⑦-a 本卦/变卦信息卡

```
┌─ 卦象信息 ───────────────────────────────────────────┐
│                                                        │
│   ☰ 天风姤（本卦） → ☶ 天山遁（变卦）                │
│                                                        │
│   上卦：☰ 乾（天）  下卦：☴ 巽（风）                  │
│   动爻：九三爻（第三爻为老阳动爻）                     │
│                                                        │
│   卦辞：女壮，勿用取女...                              │
│                                                        │
│   ┌──────┐  ┌──────┐                                 │
│   │▄▄▄▄▄▄│  │▓▓▓▓▓▓│  ← 六爻卦符图                  │
│   │ ▤▤▤▤▤ │  │░░░░░░│                                │
│   │▄▄▄▄▄▄│  │▓▓▓▓▓▓│                                │
│   └──────┘  └──────┘                                 │
│   本卦      变卦                                    │
│                                                        │
└────────────────────────────────────────────────────────┘
```

| 属性 | 值 |
|------|-----|
| 容器 | bg-white rounded-2xl p-6 |
| 本卦名 | text-xl font-semibold |
| 八卦符号 | text-4xl（Unicode: ☰☱☲☳☴☵☶☷） |
| 卦符图 | 用 CSS 绘制六爻线段（实线=阳爻 ━━━━，断线=阴爻 ── ──），w-full h-auto |
| 动爻标记 | 对应爻位用红色/橙色高亮 |
| 卦辞 | text-sm text-[#1C1A16]/70 leading-relaxed |

**六爻卦符绘制规范：**

```
阳爻（实线）：████████  （粗实线，高度 6px，宽度 80%）
阴爻（断线）：███   ███  （两段，中间空隙 30%）
爻间距：8px
整体：居中排列，从上六爻到初爻（从上到下）
```

##### ⑦-b 各爻详解

> 六爻区别于其他占卜的核心——逐爻解读。

**布局**: 纵向列表，6 条爻从**初爻（下）到上爻（上）**排列（注意：显示顺序与选择顺序相反，符合传统阅读习惯）

**每条爻的结构：**

```
┌─ 九三（第三爻）— 动爻 ─────────────────────────────┐
│                                                      │
│  ━━━━  （阳爻实线，动爻标红）                         │
│                                                      │
│  爻辞：君子终日乾乾，夕惕若厉，无咎。                 │
│                                                      │
│  AI 解读：此爻为动爻，暗示当前阶段需要持续努力...      │
│                                                      │
└──────────────────────────────────────────────────────┘
```

| 属性 | 值 |
|------|-----|
| 容器 | bg-gray-50 rounded-xl p-4（交替底色：奇数行 bg-gray-50，偶数行 bg-white） |
| 爻位标题 | text-sm font-semibold，如"初九（第一爻）"/"六三（第三爻）" |
| 动爻标记 | 动爻额外显示橙红 Tag "动爻"，pulse 动画 |
| 爻符 | CSS 绘制单根阳爻/阴爻线段（放大版，高度 8px） |
| 爻辞 | text-xs text-[#1C1A16]/60 italic, mt-2（传统原文） |
| AI 解读 | text-sm text-[#1C1A16]/75 leading-relaxed, mt-2（白话解读） |

**输出约束：**
- 爻辞：传统原文（从数据库取）
- AI 解读：每爻 40-60 字
- 总计 6 爻 ≤ 360 字

##### ⑦-c AI 三卡片分析

**标题**: "AI 六爻占卜分析" — H3, text-lg font-semibold, text-center, mt-10 mb-2

**副标题说明**: 一段文字说明 AI 分析的方法论

**3 张卡片横排：**

| 卡片 | 标题 | 内容 | 图标色 |
|------|------|------|--------|
| **卦象框架** | 卦象框架 | 基于传统六爻体系，结合本卦、变卦、动爻等要素构建完整的卦象分析框架，提供结构化的参考视角 | 蓝 #3B82F6 |
| **AI 分析** | AI 分析 | 结合大语言模型对卦象进行深度解读，融合传统智慧与现代视角，给出个性化的分析建议 | 紫 #8B5CF6 |
| **对运分析** | 对运分析 | 基于卦象的时间维度分析，判断当前时机是否适合行动，以及未来短期内的趋势走向 | 绿 #22C55E |

**布局 & 规格**: 同梅花易数的 AI 三卡片（grid grid-cols-3, rounded-xl, p-5）

##### ⑦-d 行动建议

与梅花易数、塔罗一致的行动建议模块：

| 属性 | 值 |
|------|-----|
| 容器 | bg-white rounded-2xl p-6 |
| 标题 | "💡 六爻指引" |
| 综合 | 1 句话结论（倾向色高亮） |
| 有利因素 | ✓ 前缀, 2-3 条 |
| 注意事项 | ⚠ 前缀, 1-2 条 |
| 下一步行动 | 💡 前缀, 1-2 段 |
| 总字数 | ≤ 350 字 |

##### ⑧ 特色功能介绍

**标题**: "AI 六爻占卜的特色功能" — H3, text-center, mt-12 mb-6

**布局**: 2x2 网格

| 功能 | 图标 | 标题 | 描述 |
|------|------|------|------|
| 多维度卦象分析 | 🎯 | 多维度卦象分析 | 结合本卦、变卦、互卦、综卦等多维度信息，全方位解析卦象含义 |
| 现代化易学解读 | 💬 | 现代化易学解读 | 将古老的爻辞转化为现代易懂的白话文，让每个人都能理解六爻智慧 |
| 个性化参考 | ✨ | 个性化参考 | 基于你的问题和当前状态提供定制化的卦象解读和建议 |
| 智能趋势预测 | 📊 | 智能趋势预测 | 通过 AI 分析卦象变化趋势，预测可能的发展方向和关键节点 |

##### ⑨ FAQ

| # | 问题 | 答案要点 |
|---|------|---------|
| Q1 | AI 六爻占卜的结果准确吗？| 六爻占卜是中国最古老、体系最完备的占卜方法之一。我们的 AI 系统基于传统纳甲、世应、六亲等完整体系进行分析，并结合现代语言模型提供个性化解读。但任何占卜结果仅供参考。 |
| Q2 | AI 如何分析六爻卦象？| 我们的系统首先按照传统规则排盘（定世应、配六亲、找用神），然后由 AI 基于这些结构化数据结合你的问题进行深度分析。不是随机生成，而是有据可依。 |
| Q3 | 适合用六爻占卜的问题类型？| 六爻特别适合"具体事件"的吉凶判断——如"这件事能不能成""这个合同要不要签""这几天出行顺不顺"。相比八字看终身命运，六爻更聚焦于当下具体事项。 |

Accordion 样式同前。

#### 移动端适配

| 断点 | 行为 |
|------|------|
| >= 1024px (Desktop) | 爻选择器左 + 卦象预览右（左右分栏）；AI 三卡片横排 |
| < 1024px (Tablet) | 保持分栏但缩小间距 |
| < 640px (Mobile) | 爻选择器纵向排列，卦象预览在下方；三卡片改为纵向堆叠；爻详解全宽 |

#### 开发优先级

| 优先级 | 功能 | 说明 |
|--------|------|--------|
| **P0** | 问题输入区（②） | textarea + 示例标签 |
| **P0** | 起卦方式选择器（③） | 4 种方式 UI（全部可用） |
| **P0** | 手动起卦面板（④-a） | 6 爻逐爻选择 + 实时卦象预览（上卦/下卦/卦名/卦符图） |
| **P0** | 铜钱起卦面板（④-b） | 3 枚铜钱抛掷动画 + 传统朱熹判定逻辑 + 进度指示器 |
| **P0** | 时间起卦面板（④-c） | DateTime 选择器（快速模式+自定义模式）+ 先天伏羲数算法 + 实时预览 |
| **P0** | 数字起卦面板（④-d） | 4 个数字输入框 + 随机生成按钮 + 实时卦象预览 |
| **P0** | 占卜时间（⑤） + 解卦按钮（⑥） | |
| **P0** | 本卦/变卦信息卡（⑦-a） | 含 Unicode 八卦符号 + CSS 六爻卦符图 + 卦辞 |
| **P0** | 各爻详解（⑦-b） | 6 条爻从初爻到上爻，每条含爻符+爻辞+AI 白话解读 |
| **P0** | 行动建议（⑦-d） | 结构化输出 |
| **P1** | AI 三卡片分析（⑦-c） | 卦象框架/AI分析/对运分析 |
| **P1** | 特色功能（⑧）+ FAQ（⑨） | 静态模块 |
| **P2** | 动爻选择 | 手动起卦时可指定哪根爻为动爻 |

---

### 7.3.11 命理知识库 `/knowledge` （v1 — 2026-04-09 新增）

> **触发原因**: Frank 要求规划知识库 /knowledge 的页面建设方案
> **核心定位**: SEO 流量入口 + 用户教育中心 + CyberFate 内容护城河

#### 当前状态

| 项目 | 状态 |
|------|------|
| 知识库首页 /knowledge | ✅ 已有 — 9 篇文章列表（标题+描述+emoji） |
| 文章详情页（9 篇） | ❌ 全部 404 — 路由存在但页面未创建 |
| 文章内容 | ❌ 无 — 需要从零编写 |

#### 设计原则

1. **SEO 优先**：每篇文章针对特定长尾关键词优化，结构化数据（JSON-LD）
2. **内容质量**：1500-3000 字/篇，专业准确 + 通俗易懂
3. **Design Tokens v6 对齐**：暖米白风格，阅读体验优先（大行高、舒适字间距）
4. **转化引导**：每篇文章底部关联 CyberFate 功能 CTA，自然不硬推销
5. **内链网络**：文章间互相链接，提升 SEO 权重和用户停留时长

#### 7.3.11.1 知识库首页 `/knowledge`

**当前已有，需微调优化：**

**现有结构（保持不变）：**
- H1「命理知识库」
- 9 篇文章卡片网格（grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6）

**需要优化的点：**
- 增加**分类标签筛选**（Tab 切换）：全部 / 基础概念 / 八字进阶 / 实用工具
- 每篇文章卡片增加**阅读时长**标识（如"5 分钟阅读"）
- 增加**搜索框**（顶部居中，圆角输入框）
- 底部增加**知识库简介区**：一段文字说明知识库的定位和价值

**分类归属：**

| 分类 | 包含文章 |
|------|----------|
| 基础概念 | 五行理论、十天干理论、十二地支理论 |
| 八字进阶 | 八字格局、刑冲会合法则、神煞大全、大运理论 |
| 实用工具 | 真太阳时理论、早晚子时理论 |

#### 7.3.11.2 文章详情页模板（通用规范）

**路由规则：** `/knowledge/[slug]`
- slug 映射：wuxing → 五行理论, tiangan → 十天干, dizhi → 十二地支, shensha → 神煞大全, geju → 八字格局, xingchong → 刑冲合合法, dayun → 大运理论, zhenyang → 真太阳时, zaowan → 早晚子时

**页面结构（从上到下）：**

```
┌────────────────────────────────────────────┐
│  导航栏（全站通用）                           │
├────────────────────────────────────────────┤
│  面包屑：首页 > 知识库 > [文章名]              │
├────────────────────────────────────────────┤
│  文章标题区                                   │
│  ┌──────────────────────────────────┐       │
│  │ [emoji] 文章名  (H1, font-serif) │       │
│  │ 副标题：一句话描述                  │       │
│  │ 发布日期 · 阅读时长 · 分类 Tag     │       │
│  └──────────────────────────────────┘       │
├────────────────────────────────────────────┤
│  目录锚点导航（侧边桌面端 / 顶部移动端粘性）    │
│  · 概念定义  · 核心内容  · 实例  · 关联功能   │
├──────────┬─────────────────────────────────┤
│          │  正文区域                          │
│  （桌面端 │  ┌──────────────────────────┐   │
│   侧边栏） │  │ §1 概念定义               │   │
│          │  │ 正文内容...                │   │
│  相关推荐  │  │ §2 核心内容（分小节）      │   │
│  3-4 篇   │  │ 正文内容...                │   │
│          │  │ §3 生活实例                │   │
│          │  │ 正文内容...                │   │
│          │  │ §4 与 CyberFate 功能关联   │   │
│          │  └──────────────────────────┘   │
│          ├─────────────────────────────────┤
│          │  CTA 卡片                         │
│          │  「立即体验 [相关功能] →」         │
│          ├─────────────────────────────────┤
│          │  相关文章推荐（3-4 篇卡片横排）    │
└──────────┴─────────────────────────────────┘
│  Footer（全站通用）                           │
└────────────────────────────────────────────┘
```

**样式规范：**

- **正文容器**：max-w-3xl（约 720px）居中，阅读最佳宽度
- **正文字体**：text-base leading-relaxed（行高 1.75），颜色 #374151
- **H2 小节标题**：text-xl font-semibold font-serif mt-8 mb-4, 颜色 #1C1A16
- **H3 子标题**：text-lg font-medium mt-6 mb-3
- **段落间距**：mb-4
- **列表**：list-disc list-inside space-y-2 mb-6
- **重点标注**：bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r（引用块样式）
- **表格**：border-collapse w-full text-sm（五行生克表等用）
- **代码/术语**：bg-gray-100 rounded px-1.5 py-0.5 text-sm font-mono（如"甲木""午火"等术语）
- **图片**：rounded-xl shadow-sm max-w-full（配图用）

**侧边栏（桌面端 ≥1024px）：**

| 区块 | 内容 |
|------|------|
| 文章信息 | 发布日期、阅读时长、分类、标签 |
| 目录 | 自动生成 h2/h3 锚点目录，sticky 定位跟随滚动高亮当前章节 |
| 相关推荐 | 3-4 篇同分类文章卡片（缩略版：标题+emoji+阅读时长） |

移动端：侧边栏隐藏，目录改为页面顶部 sticky Tab 栏。

#### 7.3.11.3 文章内容大纲（9 篇）

---

##### 文章 1：🌟 五行理论

**slug:** `wuxing`
**目标关键词:** 五行理论、五行生克、金木水火土特性
**预估字数:** 2000 字
**阅读时长:** 8 分钟

**大纲：**

```
# 五行理论：金木水火土的生克关系与特性

## 什么是五行？
- 定义：中国古代哲学中构成世界的五种基本元素
- 起源：《尚书·洪范》，距今 3000+ 年
- 与命理的关系：八字和紫微斗数的基础框架

## 五行的基本特性

### 金（Metal）
- 方位：西；季节：秋；颜色：白/金
- 特性：刚强、肃杀、收敛
- 性格投射：果断、有原则、硬朗
- 对应脏腑：肺、大肠

### 木（Wood）
- 方位：东；季节：春；颜色：绿
- 特性：生长、舒展、向上
- 性格投射：仁慈、进取、有创造力
- 对应脏腑：肝、胆

### 水（Water）
- 方位：北；季节：冬；颜色：黑/蓝
- 特性：润下、寒冷、闭藏
- 性格投射：智慧、灵活、深沉
- 对应脏腑：肾、膀胱

### 火（Fire）
- 方位：南；季节：夏；颜色：红
- 特性：炎上、热烈、发散
- 性格投射：热情、积极、急躁
- 对应脏腑：心、小肠

### 土（Earth）
- 方位：中；季节：长夏（季末）；颜色：黄
- 特性：承载、化育、稳重
- 性格投射：诚信、包容、踏实
- 对应脏腑：脾、胃

## 五行相生（循环滋生）
- 木生火 → 火生土 → 土生金 → 金生水 → 水生木
- 用生活比喻解释每个相生关系
- 相生的意义：能量流动、助力、资源

## 五行相克（相互制约）
- 木克土 → 土克水 → 水克火 → 火克金 → 金克木
- 用生活比喻解释每个相克关系
- 相克的意义：制衡、挑战、成长阻力

## 五行在八字中的应用
- 日主五行决定你的本命属性
- 五行强弱分析判断命运趋势
- 五行喜忌指导人生决策
- 【CTA】→ 在 CyberFate 八字分析中查看您的五行分布

## 常见问题
Q1: 五行缺某个元素要不要补？
Q2: 五行和西方四元素有什么区别？
Q3: 现代人还信五行吗？

## 相关文章
- 十天干理论 →
- 八字格局 →
```

---

##### 文章 2：☀️ 十天干理论

**slug:** `tiangan`
**目标关键词:** 十天干、甲乙丙丁戊己庚辛壬癸、天干含义
**预估字数:** 2500 字
**阅读时长:** 10 分钟

**大纲：**

```
# 十天干理论：甲乙丙丁戊己庚辛壬癸的含义

## 什么是天干？
- 定义：中国古代纪年法的十个符号
- 作用：与地支配合组成六十甲子，记录时间
- 在八字中：代表外在表现、先天资质

## 十天干详解

### 阳干（奇数位）
1. **甲木（jiǎ）** — 参天之树
   - 象征：大树、栋梁、领袖
   - 性格：正直、自信、不服输
   - 甲木日主的人特征

2. **丙火（bǐng）** — 太阳之火
   - 象征：太阳、光芒、热情
   - 性格：开朗、慷慨、急躁
   - 丙火日主的人特征

3. **戊土（wù）** — 高山之土
   - 象征：山脉、城墙、稳固
   - 性格：守信、厚重、固执
   - 戊土日主的人特征

4. **庚金（gēng）** — 斧钺之金
   - 象征：刀剑、钢铁、决断
   - 性格：刚毅、讲义气、不服软
   - 庚金日主的人特征

5. **壬水（rén）** — 大海之水
   - 象征：江河湖海、智慧、流动
   - 性格：聪明、灵活、善变
   - 壬水日主的人特征

### 阴干（偶数位）
6. **乙木（yǐ）** — 花草之木
7. **丁火（dīng）** — 灯烛之火
8. **己土（jǐ）** — 田园之土
9. **辛金（xīn）** — 首饰之金
10. **癸水（guǐ）** — 雨露之水
（每干格式同上：象征/性格/日主特征）

## 天干的阴阳属性
- 阳干：甲丙戊庚壬（主动、外放）
- 阴干：乙丁己辛癸（内敛、承接）
- 阴阳搭配的平衡美学

## 天干五合
- 甲与己合（中正之合）
- 乙与庚合（仁义之合）
- 丙与辛合（威权之合）
- 丁与壬合（淫慼之合）
- 戊与癸合（无情之合）
- 天干合化的条件与影响

## 天干在八字中的关键作用
- 日干 = 日主（命主自己），是八字的轴心
- 天干透出看显性的能力和机遇
- 【CTA】→ 使用 CyberFate 八字分析了解您的日主天干

## 相关文章
- 十二地支理论 →
- 五行理论 →
- 八字格局 →
```

---

##### 文章 3：🌙 十二地支理论

**slug:** `dizhi`
**目标关键词:** 十二地支、子丑寅卯辰巳午未申酉戌亥、地支含义
**预估字数:** 2500 字
**阅读时长:** 10 分钟

**大纲：**

```
# 十二地支理论：子丑寅卯辰巳午未申酉戌亥的奥秘

## 什么是地支？
- 定义：十二个符号，最初用于记时（十二时辰）
- 与天干的关系：天干为阳（天），地支为阴（地）
- 在八字中：代表内在本质、环境、根基

## 十二地支详解

### 子鼠（zǐ）— 夜半之时
- 时间：23:00-01:00 | 月份：十一月 | 方位：正北
- 五行：水 | 藏干：癸
- 象征：智慧、神秘、潜伏
- 性格：灵活机敏、善于隐忍

### 丑牛（chǒu）— 鸡鸣之时
（格式同上：时间/月份/方位/五行/藏干/象征/性格）

### 寅寅 ~ 戌戌 ~ 亥猪
（其余十支，每支完整介绍）

## 地支的三合会局
- 申子辰（水局）、巳酉丑（金局）、寅午戌（火局）
- 亥卯未（木局）、辰戌丑未（土局）
- 三合的条件与力量

## 地支的六冲关系
- 子午冲、丑未冲、寅申冲、卯酉冲、辰戌冲、巳亥冲
- 六冲在八字中的含义：变动、冲突、不稳定

## 地支的六合
- 子丑合、寅亥合、卯戌合、辰酉合、巳申合、午未合
- 合而化与合而不化的区别

## 地支藏干（本气/中气/余气）
- 每个地支藏 1-3 个天干
- 为什么藏干很重要？——它决定了地支的真实五行属性

## 地支 vs 天干：内外之别
- 天干如树枝（外在可见），地支如树根（内在深层）
- "天干看一生运势，地支看晚年归宿"

## 【CTA】→ 排一盘八字，看看您的地支藏了什么

## 相关文章
- 十天干理论 →
- 刑冲会合法则 →
- 八字格局 →
```

---

##### 文章 4：⭐ 神煞大全

**slug:** `shensha`
**目标关键词:* 神煞、神煞查询、桃花、华盖、驿马、天乙贵人
**预估字数:** 2500 字
**阅读时长:** 10 分钟

**大纲：**

```
# 神煞大全：各种神煞的意义与影响

## 什么是神煞？
- 定义：八字/紫微中的特殊标记，类似"成就"或"警告"
- 不是迷信：神煞是对某种能量组合的概括性命名
- 正确态度：参考但不执迷

## 吉神（带来好运的能量标记）

### 天乙贵人 — 最尊贵的吉神
- 查法：以日干或年干查
- 含义：逢凶化吉、得贵人相助
- 口诀："甲戊庚牛羊路..."

### 桃花 — 人缘与感情
- 查法：以年支或日支查
- 含义：魅力、人缘、异性缘
- 辩证看：桃花好但太多也可能烂桃花

### 华盖 — 艺术与灵性
- 含义：艺术天赋、宗教缘分、独处能力
- "命带华盖，艺术天才"

### 驿马 — 远行与变动
- 含义：出差、移民、职业变动
- 现代解读：适合经常出差/远程工作的行业

### 其他吉神简表
- 太极贵人、文昌、禄神、国印印绶等（各 2-3 句话）

## 凶神（需要注意的能量标记）

### 孤辰寡宿 — 感情孤独倾向
- 含义：容易感到孤独、晚婚倾向
- 化解方法：主动社交、培养兴趣

### 元辰（羊刃）— 急躁与冲突
- 含义：性格刚烈、容易冲动
- 正面解读：魄力、执行力强

### 其他凶神简表
- 劫煞、灾煞、天罗地网等（各 2-3 句话）

## 神煞在黄历中的应用
- 每日的神煞决定了当日的宜忌
- 【CTA】→ 查看 CyberFate AI 黄历，了解今日神煞

## 常见误区
Q1: 有凶神是不是命不好？
Q2: 神煞多好还是少好？
Q3: 能不能通过改运化解凶神？

## 相关文章
- 五行理论 →
- AI 黄历使用指南 →
```

---

##### 文章 5：📊 八字格局

**slug:** `geju`
**目标关键词:* 八字格局、从格、正格八字、特殊格局
**预估字数:** 2200 字
**阅读时长:** 9 分钟

**大纲：**

```
# 八字格局：正格、从格等命局格局

## 什么是格局？
- 定义：对八字整体结构的高度概括
- 类比：如果说八字是一幅画，格局就是这幅画的风格流派
- 为什么重要：格局定层次，决定人生的大方向

## 正格（绝大多数人的命局属于正格）

### 正官格
- 条件：月令中有正官星，不被冲破
- 特征：守规矩、有责任感、适合公职/管理
- 典型人物特征

### 七杀格
- 条件：月令中有七杀，有食神制杀为佳
- 特征：魄力强、有开拓精神、抗压能力强
- "杀印相生格" — 最贵的七杀变格

### 财格（偏财格/正财格）
- 特征：重金钱、有商业头脑
- 偏财：偏财运、投资回报；正财：工资收入

### 印绶格（正印/偏印）
- 特重：重学习、思考、学术
- 正印：正统学历、名誉；偏印：专业技能、偏门学问

### 食伤格（食神/伤官）
- 特征：创造力强、表达欲旺、才华型
- 食神：温和的才华；伤官：叛逆的才华

## 从格（特殊格局，相对少见）

### 从财格
- 条件：满盘皆财，日主无根气
- 特征：极度务实、金钱导向

### 从杀格 / 从儿格 / 从强格
（各 3-4 句要点）

## 如何判断自己的格局？
- 三步法：① 定月令 ② 看强弱 ③ 辨格局
- 格局不是一成不变的：大运会引发格局变化

## 【CTA】→ 使用 CyberFate 八字分析，AI 自动识别您的格局

## 相关文章
- 十天干理论 →
- 十二地支理论 →
- 大运理论 →
```

---

##### 文章 6：🔀 刑冲会合法则

**slug:** `xingchong`
**目标关键词:* 六冲、三合、刑害、地支关系、八字刑冲
**预估字数:** 2000 字
**阅读时长:** 8 分钟

**大纲：**

```
# 刑冲会合法则：地支六冲、三合、刑害关系

## 为什么地支之间会有"关系"？
- 地支不是孤立的，它们之间存在相互作用
- 这些作用力会影响八字的能量走向
- 就像人际关系：有的合作、有的冲突、有的克制

## 六冲（最激烈的地支关系）

### 六冲总览表
| 冲对 | 含义 | 影响 |
|------|------|------|
| 子午冲 | 水火不容 | 情绪波动、住址变动 |
| 丑未冲 | 土土相冲 | 固有观念受冲击 |
| ... | ... | ... |

### 六冲一定不好吗？
- 不一定！冲也代表动力、突破、改变
- 年日支冲：内心矛盾；月日支冲：家庭/事业冲突
- 关键看是否有解冲（合来解冲）

## 三合（最强力的地支联盟）

### 三合局一览
- 申子辰合水局（最强）
- 巳酉丑合金局
- 寅午戌合火局
- 亥卯未合木局
- 辰戌丑未合土局（特殊的四库全）

### 三合的条件
- 必须三字齐全（有时二字也成半合）
- 合而化 vs 合而不化

## 刑（暗中伤害）

### 三刑
- 寅巳申三刑（无恩之刑）
- 丑戌未三刑（恃势之刑）
- 子卯刑（无礼之刑）

### 自刑：辰辰、午午、酉酉、亥亥
- 内耗、自我纠结

## 六合（最和谐的地支关系）
- 六合总览（6 组）
- 合的力量 > 冲的力量（合能解冲）

## 害（暗中的不和）
- 子未害、丑午害、寅巳害...
- 害的影响比冲轻，但也不可忽视

## 实战应用：如何看自己的地支关系
- 排出八字后检查四柱地支间的所有关系
- 分清主次：合 > 冲 > 刑 > 害
- 【CTA】→ 在 CyberFate 八字报告中查看详细地支关系分析

## 相关文章
- 十二地支理论 →
- 八字格局 →
```

---

##### 文章 7：📈 大运理论

**slug:** `dayun`
**目标关键词:* 大运、十年大运、流年、八字大运怎么算
**预估字数:** 1800 字
**阅读时长:** 7 分钟

**大纲：**

```
# 大运理论：十年一运的运程变化规律

## 什么是大运？
- 定义：人生命运的"十年周期"
- 类比：如果八字是一辆车，大运就是行驶的道路
- 每步大运管 10 年（前 5 年影响力渐增，后 5 年渐减）

## 大运是怎么排出来的？
- 阳年男/阴年女：顺排（从月柱往后数）
- 阴年男/阳年女：逆排（从月柱往前数）
- 起运岁数：从出生到交运的时间

## 大运与原局的关系
- 喜用神大运：顺风顺水的十年
- 忌神大运：挑战较多的十年
- 但大运不是绝对的：同一大运每个人的体验不同

## 流年 vs 大运
- 大运：10 年大背景（宏观）
- 流年：每年的具体事件（微观）
- 叠加效应：好运大运 + 好流年 = 极佳年份

## 如何看待自己的大运？
- 坦然接受：没有永远的好运也没有永远的坏运
- 趋利避害：知道趋势后做更有利的选择
- 主观能动性：三分天注定，七分靠打拼

## 【CTA】→ CyberFate 八字分析包含大运走势图

## 相关文章
- 八字格局 →
- 五行理论 →
```

---

##### 文章 8：🌅 真太阳时理论

**slug:** `zhenyang`
**目标关键词:* 真太阳时、北京时间校正、出生时间精确
**预估字数:** 1200 字
**阅读时长:** 5 分钟

**大纲：**

```
# 真太阳时理论：什么是真太阳时，为何要修正

## 问题引入
- 你说的"中午 12 点"，真的是太阳最高的时候吗？
- 答案：不一定。取决于你所在的经度。

## 什么是真太阳时？
- 定义：以当地太阳实际位置为基准的时间
- vs 平太阳时（钟表时间/北京时间）
- 中国统一用北京时间（东经 120°），但国土跨度 60+ 经度

## 为什么排八字必须用真太阳时？
- 八字的时柱是根据太阳位置定的
- 北京时间 ≠ 真太阳时（尤其东西部地区差异大）
- 举例：
  - 新疆喀什（东经 75°）比北京晚约 3 小时
  - 喀什北京时间 12 点 ≈ 真太阳时 9 点左右（仍属巳时而非午时）

## 各主要城市时差参考表
| 城市 | 经度 | 与北京时差 |
|------|------|-----------|
| 哈尔滨 | 126.5° | +26 分钟 |
| 上海 | 121.5° | +14 分钟 |
| 成都 | 104° | -64 分钟 |
| 西安 | 108.9° | -44 分钟 |
| 拉萨 | 91° | -116 分钟 |
| 乌鲁木齐 | 87.5° | -132 分钟 |

## CyberFate 的处理方式
- 自动根据出生地点计算真太阳时修正
- 用户无需手动换算
- 【CTA】→ 试试 CyberFate 八字分析，自动为您校正

## 相关文章
- 早晚子时理论 →
```

---

##### 文章 9：⏰ 早晚子时理论

**slug:** `zaowan`
**目标关键词:* 早子时、晚子时、子时怎么算、23点出生
**预估字数:** 1000 字
**阅读时长:** 4 分钟

**大纲：**

```
# 早晚子时理论：子时的特殊计日方法

## 什么是子时？
- 时间段：23:00 - 01:00（跨两天）
- 十二时辰的起点，也是新一天的开始
- 特殊性：唯一跨越两天的时辰

## 早子时 vs 晚子时

### 晚子时（夜子时）
- 时间：23:00 - 24:00（当天）
- 归属：算作**当天**的子时
- 俗称"子时初"

### 早子时（早子时）
- time: 00:00 - 01:00（次日）
- 归属：算作**次日**的子时
- 俗称"子时末"

## 为什么区分早晚子时很重要？
- 同样是"子时出生"，早晚不同可能导致：
  - 日柱不同（跨天）
  - 整个八字完全改变
- 举例：23:30 出生 vs 00:30 出生

## 实用建议
- 如果您出生在 23:00-01:00 之间，请尽量确认具体时间
- 不确定的话可以两个都排一下对比
- CyberFate 支持早晚子时选择
- 【CTA】→ 去试试

## 相关文章
- 真太阳时理论 →
- 十二地支理论 →
```

---

#### 7.3.11.4 SEO 规范（每篇文章必遵）

**On-Page SEO Checklist：**

| 项目 | 规范 |
|------|------|
| Title Tag | `[文章名] | 赛博命理师 CyberFate — AI 命理知识库`（≤60 字符） |
| Meta Description | 第一段内容的精炼摘要（≤160 字符），含目标关键词 |
| H1 | 每页仅 1 个，含目标关键词 |
| H2/H3 | 层级清晰，含长尾词变体 |
| URL | /knowledge/[英文slug]，短且语义化 |
| 内链 | 每篇文章至少链接 3 篇其他知识库文章 |
| 外链到功能页 | 至少 1 个链接指向 /bazi /ziwei /huangli 等 |
| 图片 alt | 所有配图必须有描述性 alt 文字 |
| 结构化数据 | Article schema（headline/image/datePublished/author） |
| 面包屑 | BreadcrumbList schema |
| Open Graph | og:title / og:description / og:image（分享卡片） |

**关键词布局策略：**
- 目标关键词出现在：Title、H1、首段、URL、Meta Description
- 长尾词变体出现在：H2、图片 alt、正文自然语境
- 关键词密度控制在 1-2%，不要堆砌

#### 7.3.11.5 移动端适配

| 断点 | 布局调整 |
|------|----------|
| ≥1280px | 双栏：左侧正文 max-w-3xl + 右侧 sticky 侧边栏（目录+推荐） |
| 768-1279px | 单栏正文 + 目录收起到顶部 sticky Tab |
| <768px | 单栏全宽 + 目录变为可折叠 Accordion + 字号稍增大（text-lg 正文） |

移动端特别处理：
- 表格横向滑动（overflow-x-auto）
- CTA 按钮 fixed 底部或紧贴文末
- 阅读进度条（页面顶部细线）

#### 7.3.11.6 后续扩展路线图

**第二期新增内容（紫微专栏 + 塔罗专栏）：**

| 文章 | slug | 目标关键词 |
|------|------|-----------|
| 紫微十四主星 | ziwei-14-stars | 紫微十四主星、紫微星曜 |
| 紫微十二宫详解 | ziwei-12-palaces | 紫微十二宫、命宫夫妻宫 |
| 紫微格局论 | ziwei-patterns | 紫微格局、杀破狼、紫府 |
| 塔罗78张牌意 | tarot-78-cards | 塔罗牌意、塔罗牌解读 |
| 塔罗牌阵介绍 | tarot-spreads | 塔罗牌阵、凯尔特十字 |
| 黄历术语词典 | huangli-glossary | 黄历术语、宜忌、彭祖百忌 |

**第三期功能升级：**
- 知识库全文搜索
- 用户收藏/书签功能
- "相关概念"知识图谱可视化
- 评论/问答区
- 国际化英文版

#### 开发优先级

**P0（首批完成）：**
- [ ] 文章详情页路由 + 模板组件（面包屑+正文+侧边栏+CTA+推荐）
- [ ] 9 篇文章内容编写并填入
- [ ] Design Tokens v6 风格对齐
- [ ] SEO 基础设施（Title/Meta/OG/Schema）
- [ ] 知识库首页增加分类筛选 + 搜索框

**P1（后续迭代）：**
- [ ] 阅读进度条
- [ ] 目录锚点导航（sticky）
- [ ] 侧边栏相关推荐
- [ ] 6 篇新文章（紫微 3 + 塔罗 3）
- [ ] 移动端阅读体验优化

**P2（长期）：**
- [ ] 全文搜索
- [ ] 用户互动功能（评论/收藏）
- [ ] 英文版知识库
- [ ] 知识图谱

---

### 7.4 定价页 `/pricing` （v2）

#### 7.4.1 页面标题区

- 标题「选择您的计划」（可用 font-display 衬线体, text-4xl, 居中）
- 副标题「灵活订阅，随时取消」（text-brand-gray, 居中）
- padding-top 80-100px

#### 7.4.2 三列定价卡片

布局: `flex flex-col lg:flex-row gap-6 max-w-[1000px] mx-auto`

**左侧基础版 + 右侧尊享版**:
- bg-white, border border-brand-border, rounded-card, p-9
- CTA: btn-secondary w-full

**中间专业版（推荐）**:
- bg-white, **border-2 border-brand-black**, rounded-card, p-9
- **transform lg:scale-[1.03] lg:-translate-y-2**（放大+上浮）
- **shadow-pricing**
- 顶部标签: `inline-block bg-brand-black text-white text-xs px-3 py-1 rounded-full -mt-8`（"★ 最受欢迎"）
- 权益前绿色 check ✅（#10B981）
- CTA: **btn-primary w-full**

价格展示：
- 数字: text-[40px] font-semibold
- 货币: **¥ (CNY)** — ⚠️ 不是 HK$！
- 周期: text-sm text-brand-gray

#### 7.4.3 FAQ 区块

- 标题「常见问题」text-2xl font-semibold text-center mt-20 mb-8
- 手风琴折叠（accordion）样式
- 4-6 个 FAQ 项
- 边框分割线隔开

#### 7.4.4 Footer

同首页 Footer 规范。

---

### 7.5 其余页面统一要求

以下页面不需要独立设计稿，但需套用新组件和全局规范：

| 页面 | 路径 | 改动范围 |
|------|------|---------|
| 八字合婚 | /bazi/marriage | PageHeader + Card + Button 组件替换 |
| 紫微斗数 | /ziwei | PageHeader + 表格细线样式 |
| 梅花易数 | /meihua | PageHeader + Card 容器 |
| 塔罗占卜 | /tarot | PageHeader + Card 容器 |
| AI 黄历 | /huangli | PageHeader + 宜忌 Tag |
| 登录/注册 | /auth/login | PageHeader + 表单组件 |
| 个人中心 | /profile | PageHeader + Card 容器 |
| 隐私政策 | /privacy | 排版 max-w-[720px] mx-auto, 段落间距加大 |
| 服务条款 | /terms | 同上 |
| 退款政策 | /refund | 同上 |

每个页面统一改动：
1. 替换导航栏为新 Navbar
2. 替换 Footer 为新 Footer
3. 内容外套 Container 组件
4. 所有按钮换为 Button 组件
5. 间距检查确保不挤

---

## 八、共用组件清单

代码虾需创建/更新以下组件：

| 组件 | 路径 | 说明 |
|------|------|------|
| Button | components/ui/Button.tsx | variant: primary / secondary / text / small |
| Card | components/ui/Card.tsx | 通用卡片容器（含 hover 动效）|
| Tag | components/ui/Tag.tsx | 彩色 pill tag（五行/宜忌）|
| SegmentControl | components/ui/SegmentControl.tsx | 分段控制器（性别/日期选择）|
| PageHeader | components/ui/PageHeader.tsx | 子页面通用标题区 |
| Container | components/ui/Container.tsx | 页面宽度限制 + 居中 |
| Navbar | components/layout/Navbar.tsx | 全站导航栏（sticky + 下拉 + backdrop-blur）|
| Footer | components/layout/Footer.tsx | 全站页脚 |

---

## 九、Bug 修复（UI 改版必修）

| # | 问题 | 位置 | 修复方式 | 优先级 |
|---|------|------|---------|--------|
| B1 | 货币单位错误 | /pricing | HK$ → ¥ (CNY) | P0 |
| B2 | 定价权益表过时 | /pricing | 对照最新功能更新权益清单 | P0 |

---

## 七、验收标准

### 7.1 功能验收

| 测试项 | 验收标准 |
|--------|----------|
| 首页加载 | 3秒内完成首屏渲染 |
| 功能导航 | 所有链接可点击，正确跳转 |
| 八字分析 | 输入有效日期，正确输出四柱 |
| AI 解读 | 10秒内返回解读结果 |
| 每日运势 | 正确显示当日运势 |
| 本地存储 | 刷新页面后保留用户数据 |
| 响应式 | 手机/平板/桌面正常显示 |

### 7.2 兼容性测试

| 浏览器 | 版本要求 |
|--------|----------|
| Chrome | 最新2个版本 |
| Safari | 最新2个版本 |
| Firefox | 最新2个版本 |
| Edge | 最新2个版本 |
| iOS Safari | iOS 14+ |
| Android Chrome | Android 10+ |

---

## 八、项目排期

| 阶段 | 时间 | 交付物 |
|------|------|--------|
| M1: 技术搭建 | Day 1-3 | 项目框架、八字引擎 |
| M2: 核心页面 | Day 4-8 | 首页、八字分析页 |
| M3: 功能完善 | Day 9-11 | 每日运势、AI接入 |
| M4: 测试上线 | Day 12-14 | 测试、部署、上线 |
| M5: 账户系统 | Day 15-19 | Google/邮箱登录、个人中心 |
| M6: 支付系统 | Day 20-25 | 订阅、支付集成、付费限制 |

---

## 九、附录

### 9.1 URL 规划

| 页面 | URL | MVP |
|------|-----|-----|
| 首页 | / | ✅ |
| 登录/注册 | /auth/login | ✅ |
| 个人中心 | /profile | ✅ |
| 订阅页 | /pricing | ✅ |
| 支付成功 | /payment/success | ✅ |
| 八字分析 | /bazi | ✅ |
| 每日运势 | /daily | ✅ |
| 八字合婚 | /bazi/marriage | V2 |
| 紫微排盘 | /ziwei | V2 |
| 梅花易数 | /meihua | V2 |
| 六爻 | /liuyao | V2 |
| 塔罗牌 | /tarot | V2 |
| AI黄历 | /huangli | V2 |
| 隐私政策 | /privacy | ✅ |
| 服务条款 | /terms | ✅ |
| 退款政策 | /refund | ✅ |

### 9.2 参考资料
- 竞品研究: research.md
- 项目计划: plan.md
- lunar-javascript: https://github.com/6tail/lunar-javascript

---

**文档版本**: 2.0
**最后更新**: 2026-04-02 (UI 改版 v2 — 对齐美术虾效果图)

---

## 十、产品验收报告 (2026-03-29)

> **验收人**: 产品虾 🦐
> **验收环境**: cyberfate.vercel.app（桌面端 Chrome + 移动端模拟 375×812）
> **验收日期**: 2026-03-29

### 10.1 验收总览

| 页面 | 功能可用 | 视觉一致性 | 备注 |
|------|----------|-----------|------|
| 首页 / | ✅ | ✅ | 整体良好 |
| 八字分析 /bazi | ✅ | ✅ | 核心功能正常 |
| 每日运势 /daily | ✅ | ✅ | localStorage 记忆正常 |
| 八字合婚 /bazi/marriage | ✅ | ❌ **P0** | 视觉风格完全不一致 |
| 紫微斗数 /ziwei | ✅ | ✅ | |
| 梅花易数 /meihua | ✅ | ✅ | |
| AI 黄历 /huangli | ✅ | ❌ **P0** | 视觉风格完全不一致 |
| 塔罗占卜 /tarot | ✅ | ✅ | 抽牌动效很好 |
| 登录页 /auth/login | ✅ | ✅ | |
| 定价页 /pricing | ✅ | ⚠️ P1 | 货币单位/金额与 PRD 不一致 |
| 个人中心 /profile | — | — | 需登录后验收 |
| 隐私政策 /privacy | ✅ | ⚠️ P1 | 联系方式乱码 |
| 服务条款 /terms | ✅ | ✅ | |
| 退款政策 /refund | ✅ | ✅ | 内容完整 |
| 移动端适配 | ✅ | ✅ | 首页/八字/运势已验证 |

### 10.2 P0 — 阻塞上线（必须修复）

#### Bug #1: 八字合婚页视觉风格严重不一致
- **页面**: /bazi/marriage
- **现象**: 使用了暗色赛博紫色主题 + 英文界面 ("Compatibility Analysis")，与全站黑白简约风格完全脱节
- **期望**: 应与 /bazi、/daily 等页面保持一致的 FateMaster 简约风格，全中文界面
- **修复要求**:
  1. 统一为黑白简约设计风格（参照 DESIGN_FATEMASTER.md）
  2. 所有文案改为中文
  3. 复用全站通用的 Header/Footer 组件
  4. 表单风格与 /bazi 页面一致

#### Bug #2: AI 黄历页视觉风格严重不一致
- **页面**: /huangli
- **现象**: 同样使用了暗色赛博紫色主题 + 英文界面 ("AI Calendar")，与全站风格不匹配
- **期望**: 统一为 FateMaster 简约风格，全中文界面
- **修复要求**: 同 Bug #1

### 10.3 P1 — 上线前应修复

#### Bug #3: 定价页货币与金额不一致
- **页面**: /pricing
- **现象**: 显示 HK$30/月、HK$78/季、HK$238/年
- **PRD 定价**: ¥29/月、¥69/季、¥199/年
- **修复要求**: 确认最终定价货币（人民币 or 港币），统一价格。如果面向国际用户用 USD，也可以，但需要更新 PRD 并保持一致

#### Bug #4: 隐私政策页联系方式乱码
- **页面**: /privacy
- **现象**: 第八节"联系我们"显示："请通过网站反馈渠道联◆◆◆我们"，出现乱码字符
- **修复要求**: 替换为正确的联系方式文案，如 "请通过邮箱 support@cyberfate.com 联系我们"

#### Bug #5: 定价页权益描述与实际不符
- **页面**: /pricing 权益对比表
- **现象**: 紫微斗数、周易占卜标注"即将开放"，但实际这些功能已经上线可用
- **修复要求**: 更新权益对比表，反映实际已上线的功能状态

#### Bug #6: 导航栏"每日运势"入口缺失
- **页面**: 全站 Header 导航
- **现象**: 导航菜单有八字分析、八字合婚、紫微斗数、梅花易数、AI黄历、塔罗占卜，但缺少"每日运势"的直接入口
- **修复要求**: 在导航菜单中添加"每日运势"链接（/daily），建议放在"八字分析"旁边

### 10.4 P2 — 后续优化

#### 优化 #1: 八字分析页性别字段标注
- **页面**: /bazi
- **现象**: 性别字段显示"（选填）"，但 PRD 中性别是必填项（影响大运方向计算）
- **建议**: 去掉"选填"标注，或者改为必填 + 默认值

#### 优化 #2: 每日运势星级视觉区分度
- **页面**: /daily
- **现象**: 星级评分 ★ 的亮/灰区分度不够明显，不易快速判断几颗星
- **建议**: 用金色填充星 ★ 和灰色空心星 ☆ 做更强对比

#### 优化 #3: 导航栏"博客(即将上线)"
- **页面**: 全站 Header
- **现象**: "博客(即将上线)"占据导航位但无法点击
- **建议**: MVP 阶段可暂时隐藏，减少导航噪音

#### 优化 #4: 八字分析页日期选择器
- **页面**: /bazi
- **现象**: 日期默认值为 1990-01-01，对于新用户来说可能产生困惑
- **建议**: 首次访问时日期字段留空或使用 placeholder 提示"请选择出生日期"

### 10.5 验收结论

**整体评价**: 🟡 **基本可用，需修复 P0 后可上线**

核心功能（八字分析、每日运势、塔罗占卜等）全部可用且体验流畅。主要问题集中在 **2 个页面的视觉风格不一致**（八字合婚 + AI 黄历），这是上线前必须修复的。

**建议修复顺序**:
1. P0: 八字合婚 + AI 黄历页面重构（统一风格）
2. P1: 定价/隐私页文案修正
3. P1: 导航 + 权益表更新
4. P2: 体验细节优化

**预估修复工时**: P0 + P1 约 2-3 天

---

## 十一、产品迭代记录

### 11.1 2026-03-31 优化任务

#### 任务 A: AI 解读模型切换（已完成）

背景：
经过产品评估和成本分析，决定将 AI 解读模型从 Claude 3.5 Sonnet 切换到 DeepSeek V3。

决策依据：
- DeepSeek V3 输出成本：0.42 美元/百万 token
- Claude 3.5 Sonnet 输出成本：15 美元/百万 token
- 成本差异：35 倍
- 一次命理解读约 800 token 输出 → DeepSeek 成本约 0.003 元/次，Claude 约 0.11 元/次
- 1 万次调用：DeepSeek 30 元 vs Claude 1100 元

执行内容：
1. 接入 DeepSeek API（Base URL: https://api.deepseek.com）
2. 模型名：deepseek-chat（对应 DeepSeek-V3.2）
3. 替换所有命理解读功能的 API 调用
4. 验证输出质量没有明显退步

状态：已通知代码虾实现

#### 任务 B: AI 解读稳定性优化（进行中）

背景：
当前 AI 解读存在"抽卡"问题，同样的八字多次查询结果差异很大，影响用户体验。

根因分析：
1. callDeepSeek 函数未设置 temperature，使用模型默认值（1.0），随机性太高
2. Prompt 约束不足，给模型太多发挥空间

解决方案：

子任务 B1: 降低 Temperature（P0）
- 修改 src/lib/ai/client.ts 的 callDeepSeek 函数
- 添加 temperature: 0.3 参数
- 预期效果：立即减少 70% 的随机性

子任务 B2: 优化 Prompt 结构（P0）
- 替换 src/lib/ai/prompts.ts 为优化版 prompts-v2.ts
- 优化点：
  - 加入 Few-shot 示例，锚定语言风格
  - 明确字数限制（每个字段强制限定字数）
  - 固定输出条数（suitable 3条、avoid 2条）
  - 锚定评分标准（1-5分明确参照）
- 预期效果：解决 80% 的内容不稳定问题

子任务 B3: 加缓存机制（P1，可选）
- 对每日运势加当日缓存，避免同一天重复调用 API
- 预期效果：同一天重复查询返回完全一致结果，成本降低约 60%

验收标准：
用同一个八字连续测试 5 次，要求：
- 输出格式完全一致（字段名、条数、顺序不变）
- 核心内容高度相似（关键词重合度 > 80%）
- 评分波动 <= 1 分

状态：已通知代码虾实现

相关文档：
- 详细方案：docs/AI-OPTIMIZATION.md
- 优化后的 Prompt：src/lib/ai/prompts-v2.ts

#### 任务 C: 八字解读缓存系统（进行中）

背景：
同一个生日的八字解读结果应该是一致的，没必要每次都调用 DeepSeek API。通过加缓存可以：
1. 保证同一生日结果一致（彻底解决"抽卡"问题）
2. 大幅降低 API 调用成本（热门生日只算一次）
3. 提升响应速度（缓存命中直接返回）

技术方案：
使用 Upstash Redis（Vercel Marketplace 集成）

免费额度：
- 存储：256 MB（约 13 万条解读）
- 每日请求：10,000 次
- 数据永久保存

执行内容：

子任务 C1: 集成 Upstash Redis
- 在 Vercel Dashboard 添加 Upstash Redis 集成
- 安装客户端：npm install @upstash/redis
- 创建 Redis 客户端封装文件：src/lib/cache/redis.ts

子任务 C2: 八字分析缓存
- 修改 generateBaziAnalysis 函数
- 缓存 key 格式：bazi:YYYY-MM-DD-HH:mm
- 缓存策略：永久保存
- 降级策略：Redis 操作失败不影响主流程，降级到直接调用 API

子任务 C3: 每日运势缓存
- 修改 generateDailyFortune 函数
- 缓存 key 格式：daily:日主:YYYY-MM-DD
- 缓存策略：24 小时过期
- 降级策略：同上

验收标准：
1. 同一生日连续查询 3 次八字分析
   - 第 1 次：调用 DeepSeek API，console 显示 [Cache Set]
   - 第 2、3 次：直接返回缓存，console 显示 [Cache Hit]，_source 为 'cache'
2. 同一日主同一天连续查询 3 次每日运势
   - 第 1 次：调用 API
   - 第 2、3 次：返回缓存
3. Redis 操作失败不影响功能

状态：已通知代码虾实现

相关文档：
- 任务单：/tmp/task-cache-for-codeshrimp.md
- Upstash Redis 文档：https://upstash.com/docs/redis

#### 任务 D: 回归测试（已完成）

验收日期：2026-03-31
验收工具：agent-browser 真实 Chromium 渲染
验收结果：

核心路由确认：
- 首页: /
- 八字分析: /bazi
- 八字合婚: /bazi/marriage
- 每日运势: /daily
- AI 黄历: /huangli
- 紫微斗数: /ziwei
- 梅花易数: /meihua
- 塔罗占卜: /tarot
- 定价: /pricing
- 隐私政策: /privacy
- 服务条款: /terms
- 退款政策: /refund

发现问题：
- P0（已修复）：八字合婚视觉风格不一致 ✅
- P0（已修复）：隐私页乱码 ✅
- P0（待修复）：定价页货币仍显示 HK$，未改成 ¥

结论：
除定价货币问题外，所有核心功能页面可正常访问和渲染。

#### 任务 E: 紫微/梅花/塔罗稳定性优化（进行中）

背景：
Frank 测试发现紫微斗数、梅花易数、塔罗占卜也存在"抽卡"问题，同样输入多次查询结果不稳定。

当前状态：
1. 这三个功能已经用了 DeepSeek V3 + temperature: 0.3
2. 梅花易数和塔罗有缓存，但用的是内存缓存（重启丢失）
3. 紫微斗数没有缓存
4. 所有功能的 Prompt 结构化约束不足

解决方案：

子任务 E1: 优化 Prompt 结构（P0）
针对紫微斗数、梅花易数、塔罗各写一版结构化 System Prompt

优化原则：
- 明确字数限制
- 固定输出结构
- 加 Few-shot 示例（可选）
- 禁止发散性表达

具体改动：
- 紫微斗数：固定 4 段（性格 60 字 + 事业 60 字 + 感情 60 字 + 建议 40 字）
- 梅花易数：固定 3 段（卦象 50 字 + 吉凶 40 字 + 建议 60 字）
- 塔罗占卜：
  - 单张牌：固定 3 段（现状 60 字 + 建议 40 字 + 总结 30 字）
  - 三张牌：固定 4 段（过去 40 字 + 现在 50 字 + 未来 50 字 + 建议 40 字）
  - 凯尔特十字：固定 5 段（格局 80 字 + 挑战 70 字 + 因素 70 字 + 结果 60 字 + 建议 50 字）

子任务 E2: 紫微斗数加缓存（P0）
参考梅花易数和塔罗的缓存逻辑，给紫微斗数也加上缓存

缓存 key 格式：ziwei:birthDate:birthHour:gender
缓存内容：{ chart, analysis }
缓存策略：永久保存

子任务 E3: 迁移到 Redis 缓存（P1）
当前梅花易数和塔罗用的是内存缓存（src/lib/ai/cache.ts 的 getCache/setCache），重启就丢失，需要迁移到 Redis

改造内容：
- 改造 src/lib/ai/cache.ts 的 getCache/setCache 函数，从内存改成调用 Redis
- getCache 和 setCache 改为 async 函数
- 更新所有调用方（梅花/塔罗/紫微）加 await
- Redis 操作失败不影响主流程

验收标准：
1. Prompt 优化验收：同样输入测 3 次，输出结构一致，字数稳定，内容相似
2. 缓存验收：同样输入测 3 次，第 1 次调 API，第 2、3 次命中缓存
3. Redis 迁移验收：重启服务后，再次查询之前查过的内容，仍能命中缓存

排期：
- 子任务 E1 + E2：今晚完成（1.5 小时）
- 子任务 E3：明天完成（1 小时）

状态：已通知代码虾实现

相关文档：
- 任务单：/tmp/task-ziwei-meihua-tarot.md

### 11.2 后续规划

#### Phase 2: 功能增强
- 付费会员体系完善
- 深度解读功能（年度运势、流年分析）
- 用户个人历史记录
- 分享功能优化

#### Phase 3: 国际化
- 英文版本上线
- 命理术语翻译
- 海外支付接入
- SEO 优化

#### Phase 4: 新功能模块
- 宠物人格卡
- 更多命理工具
- 社区互动功能

---

## Bug Fix: /settings 路由 404（2026-04-13）

### 问题描述

用户从侧边栏点击"设置"按钮后跳转到 `/settings`，返回 **404 页面不存在**。

### 根因

**文件**: `src/components/layout/Sidebar.tsx` 第 153 行

```tsx
// 当前代码（错误）
<Link
  href="/settings"
  className="inline-flex items-center gap-1.5 text-xs ..."
  onClick={onMobileClose}
>
  <Settings className="h-3.5 w-3.5" />
  <span>设置</span</span>
</Link>
```

侧边栏链接指向 `/settings`，但该路由**在项目中不存在**。

实际存在的个人设置页面路由是 **`/profile`**（文件：`src/app/profile/page.tsx`）。

### 修复方案

将 Sidebar.tsx 第 153 行的 `href="/settings"` 改为 `href="/profile"`：

```tsx
// 修复后
<Link
  href="/profile"    // ← 改这里
  className="inline-flex items-center gap-1.5 text-xs ..."
  onClick={onMobileClose}
>
  <Settings className="h-3.5 w-3.5" />
  <span>设置</span</span>
</Link>
```

### 涉及文件

| 文件 | 改动 |
|------|------|
| `src/components/layout/Sidebar.tsx` | 第 153 行，`href="/settings"` → `href="/profile"` |

### 验收标准

- [ ] 点击侧边栏"设置"按钮正常跳转到 `/profile` 页面
- [ ] 不再出现 404
- [ ] 移动端侧边栏同样正常（`onMobileClose` 回调不受影响）

### 排查备注

同时检查了全项目是否还有其他地方引用 `/settings`：
- Header.tsx — 无引用（Header 的账户菜单指向 `/profile`，正确）
- 其他组件 — 无引用

仅此一处需要修改。
