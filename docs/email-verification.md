# 邮箱验证码功能 — 产品需求文档

> 日期：2026-04-15
> 状态：待 Frank 确认
> 关联 PRD：4.2 登录/注册弹窗

---

## 1. 功能概述

### 1.1 目标
非 Google OAuth 用户通过邮箱密码注册/登录时，系统发送验证码到用户邮箱，验证邮箱真实性后才完成注册流程。

### 1.2 为什么需要这个功能
- **防虚假注册**：防止用户用不存在的邮箱批量注册薅免费额度
- **后续运营基础**：验证过的邮箱才能接收营销邮件（每日运势推送、促销通知等）
- **账号安全**：密码重置、账号变更等操作依赖已验证邮箱
- **合规要求**：部分支付渠道要求用户邮箱已验证

### 1.3 范围界定
- **本需求覆盖**：注册时的邮箱验证码验证
- **不在本次范围**：
  - 密码重置邮件（P1 后续迭代）
  - 邮箱变更验证（P1）
  - 营销邮件发送（P2）

---

## 2. 用户流程

### 2.1 完整注册流程（含验证码）

```
用户点击「登录」→ 弹出 AuthModal
    → 输入邮箱 + 密码 + 勾选协议
    → 点击「登录 / 注册」
        ↓
    ┌─────────────────────────────────┐
    │  判断：该邮箱是否已注册且已验证？  │
    └────────┬──────────────┬─────────┘
             │              │
      已注册+已验证     未注册 / 未验证
             │              │
             ▼              ▼
      正常登录流程    进入邮箱验证步骤
    （校验密码即可）
```

### 2.2 邮箱验证步骤（核心新增）

**触发条件**：以下任一情况进入验证码流程：
1. 邮箱在数据库中不存在（新注册）
2. 邮箱存在但 `email_verified: false`（之前注册但未完成验证）

**验证流程**：

```
Step 1: 发送验证码
  前端调用 POST /api/auth/send-code
  → 后端生成6位数字验证码
  → 发送到用户邮箱
  → 返回 { success: true, expires_in: 300 }

Step 2: 弹窗切换为「验证码输入态」
  AuthModal 内容区从「表单态」→「验证码态」

Step 3: 用户输入6位验证码
  6个独立输入框，自动跳转下一格
  支持粘贴（从剪贴板自动填充全部6位）

Step 4: 提交验证
  前端调用 POST /api/auth/verify-code
  → 成功：完成注册/标记已验证 → 自动登录 → 关闭弹窗
  → 失败：显示错误提示
```

### 2.3 流程图（文字版）

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

---

## 3. 验证码态 UI 设计

### 3.1 弹窗内容结构（验证码态）

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
│  ▊▊▊▊▊▊▊▊▊▊▊▊▊▊▊▊▊▊▊▊▊▊▊▊▊▊▊▊▊▊  │  ← 倒计时进度条（可选）
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
│  ← 返回修改邮箱                      │  ← 返回按钮（次要）│
└─────────────────────────────────────┘
```

### 3.2 各元素详细规格

#### ① 标题区

| 元素 | 样式 |
|------|------|
| 标题 | `text-[#1C1A16] text-xl font-semibold text-center` |
| 文案：「验证您的邮箱」 |
| 邮箱提示 | `text-[#6B6560] text-sm text-center mt-2` |
| 邮箱文案 | 「我们已发送 6 位验证码至：」+ 脱敏邮箱 |

**脱敏规则**：保留首字符和 @ 域名，中间用 `***` 替换
- `frank@example.com` → `f***k@example.com`
- `a@b.com` → `a@b.com`（太短不脱敏）

#### ② 验证码输入框（6位）

| 属性 | 值 |
|------|-----|
| 容器 | `flex justify-between gap-2 w-full` |
| 单格宽度 | `w-12 h-14`（桌面）/ `w-10 h-12`（移动）|
| 单格样式 | `border border-[#E5E2DD] rounded-lg text-center text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-[#1C1A16]/10 focus:border-[#1C1A16]` |
| 已填写态 | `border-[#1C1A16] bg-[#FAF9F6]` |
| 错误态 | `border-red-500 bg-red-50` |
| 最大长度 | 每格 1 个字符 |

**交互行为**：

| 行为 | 说明 |
|------|------|
| 输入 | 输入 1 位后自动 focus 到下一格 |
| 删除 | Backspace 删除当前格内容并 focus 到上一格 |
| 粘贴 | Ctrl+V / Cmd+V 粘贴时，自动按顺序填充 6 格（支持纯数字粘贴）|
| 只允许输入 | 数字 0-9（`inputmode="numeric" pattern="[0-9]*"`）|
| 全部填满 | 自动触发提交（可选），或等用户点「完成」|

> **推荐**：不全自动提交，等用户点「完成」，因为用户可能输错想修改。

#### ③ 错误提示

| 场景 | 文案 | 位置 | 样式 |
|------|------|------|------|
| 验证码错误 | 「验证码错误，请重新输入」 | 输入框下方 | `text-red-500 text-xs mt-2 text-center` |
| 验证码过期 | 「验证码已过期，请重新发送」 | 同上 | 同上 |
| 发送失败 | 「发送失败，请稍后重试」 | 同上 | 同上 |
| 请求过多 | 「操作过于频繁，请稍后再试」 | 同上 | 同上 |

错误时：6 个输入框统一变红 + shake 动画（左右抖动 300ms）

#### ④ 重发倒计时

| 属性 | 值 |
|------|-----|
| 容器 | `text-center mt-4` |
| 倒计时文案 | `text-[#9B9590] text-sm`：「XX 秒后可重新发送」|
| 可重发文案 | `text-[#1C1A16] text-sm underline cursor-pointer hover:no-underline`：「重新发送验证码」|
| 倒计时时长 | **60 秒** |
| 最大重发次数 | **5 次 / 小时**（服务端限制）|

交互：点击「重新发送验证码」→ 重新调用 send-code API → 倒计时归零重新开始 → 清空已输入的验证码

#### ⑤ 提交按钮

| 属性 | 值 |
|------|-----|
| 样式 | `w-full bg-[#1C1A16] text-white rounded-lg py-3.5 px-4 font-medium text-sm hover:bg-[#1C1A16]/90 transition-colors` |
| 文案：「完成」 |
| 启用条件 | 6 位验证码全部填写 |
| 未填满态 | `opacity-50 pointer-events-none` |
| loading 态 | spinner + 「验证中...」|

#### ⑥ 返回按钮

| 属性 | 值 |
|------|-----|
| 样式 | `text-[#9B9590] text-sm text-center mt-4 cursor-pointer hover:text-[#1C1A16]` |
| 文案：「← 返回修改邮箱」|
| 行为 | 点击回到表单态（保留已输入的邮箱和密码）|

---

## 4. 与现有登录弹窗的合并方案

### 4.1 架构方案：AuthModal 内 State Machine

推荐用**内部状态机**管理弹窗的两个视图，而非新建独立 Modal 组件。

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

### 4.2 状态转换逻辑

```typescript
type AuthModalState = 'form' | 'verifying';

// 在 AuthModal 内部
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
    // 此时验证码应该已经由后端在 login 接口中一并发出
    // 或者前端单独调 send-code
  } else if (data.ok) {
    // 已验证的老用户 → 正常登录成功
    onClose();
    router.refresh();
  } else {
    // 显示错误（密码错等）
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
      password: pendingPassword  // 注册时需要一起传
    })
  });

  const data = await res.json();

  if (data.ok) {
    onClose();
    router.refresh();
  } else {
    // 显示验证码错误
    setCodeError(data.error);
  }
};
```

### 4.3 API 设计

#### 4.3.1 发送验证码

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

#### 4.3.2 验证验证码

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
  "error": "verification_code_invalid"  // 错误/过期/格式不对
}
```

#### 4.3.3 修改现有 Login API 返回值

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

### 4.4 组件文件清单（新增/修改）

| 操作 | 组件 | 路径 | 说明 |
|------|------|------|------|
| 修改 | AuthModal | components/auth/AuthModal.tsx | 加入 state machine，支持 form/verifying 切换 |
| 新增 | VerificationCodeInput | components/auth/VerificationCodeInput.tsx | 6位验证码输入组件 |
| 修改 | EmailLoginForm | components/auth/EmailLoginForm.tsx | 提交回调改为通知父组件而非自己处理成功 |
| 新增 | CountdownTimer | components/auth/CountdownTimer.tsx | 重发倒计时组件（可复用）|
| 新增 API | app/api/auth/send-code/route.ts | 发送验证码 |
| 新增 API | app/api/auth/verify-code/route.ts | 验证验证码并完成注册 |
| 修改 API | app/api/auth/login/route.ts | 增加 need_verification 返回状态 |

---

## 5. 邮件模板设计

### 5.1 验证码邮件

**主题**：`【CyberFate】您的验证码是 ${code}`

**正文**（HTML 邮件）：

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

---

## 6. 安全策略

### 6.1 验证码生成

| 项目 | 规则 |
|------|------|
| 格式 | 6 位纯数字 |
| 有效期 | **5 分钟**（300 秒）|
| 生成方式 | 加密安全的随机数生成器（crypto.randomInt）|
| 前端不可预测 | 后端生成，永远不返回给前端明文 |

### 6.2 防滥用限制

| 限制项 | 阈值 |
|--------|------|
| 同一邮箱发送频率 | 60 秒 1 次 |
| 同一 IP 每小时发送次数 | 10 次 |
| 同一邮箱每天发送次数 | 20 次 |
| 同一邮箱验证尝试次数 | 10 次（超过锁定 15 分钟）|
| 验证码错误后是否失效 | **是**，错 3 次后当前验证码作废需重新发送 |

### 6.3 存储

| 项目 | 方案 |
|------|------|
| 验证码存储 | Redis（生产）/ 内存 Map（开发）|
| key 格式 | `verify_code:{email}` |
| value | HMAC-SHA256(code) + 过期时间戳 |
| 不过期自动清理 | Redis TTL = 300s |

---

## 7. 边界情况 & 错误处理

| 场景 | 处理 |
|------|------|
| 用户关闭验证码弹窗后重新打开 | 如果未超时且未验证，恢复到 verifying 态；否则回到 form 态 |
| 验码码输入中途用户切走再回来 | localStorage 不保存验证码状态（安全考虑）；回来看到空输入框 |
| 用户已有账号但 email_verified=false | 走验证码流程，验证通过后标记 verified，不重复创建账号 |
| Google OAuth 用户 | 跳过验证码（Google 已验证邮箱）|
| 邮箱是临时邮箱/一次性邮箱 | 服务端做基础域名黑名单检查（可选 P1）|
| 用户多次输错验证码 | 第 3 次错误后当前验证码失效，提示"验证码已失效请重新发送" |
| 网络慢导致重复点击发送 | 前端 loading 态防重复 + 服务端频率限制兜底 |
| 验证码邮件进垃圾箱 | UI 提示"检查垃圾邮件文件夹"，加白名单指引 |

---

## 8. 开发优先级

### P0 — MVP 必须有

| # | 任务 | 说明 |
|---|------|------|
| 1 | send-code API | 生成验证码 + 发送邮件 |
| 2 | verify-code API | 校验验证码 + 完成注册/登录 |
| 3 | VerificationCodeInput 组件 | 6位输入框 + 自动跳转 + 粘贴 |
| 4 | AuthModal state machine | form ↔ verifying 切换 |
| 5 | CountdownTimer | 60秒重发倒计时 |
| 6 | 邮件 HTML 模板 | 验证码邮件 |
| 7 | login API 增加 need_verification 返回 | 状态判断入口 |
| 8 | 基础安全限制 | 频率限制 + 有效期 + 错误次数限制 |

### P1 — 上线后尽快补

| # | 任务 | 说明 |
|---|------|------|
| 9 | 验证码输入满6位高亮提交按钮 | 交互优化 |
| 10 | 进度条动画（倒计时可视化）| 体验优化 |
| 11 | 邮箱域名黑名单 | 拦截临时邮箱 |
| 12 | Resend/AWS SES 邮件送达率监控 | 运营可见 |
| 13 | 已验证/未验证标识在个人中心展示 | 让用户知道自己的状态 |

### P2 — 未来迭代

| # | 任务 | 说明 |
|---|------|------|
| 14 | 忘记密码 → 邮箱重置验证码 | 复用验证码基础设施 |
| 15 | 变更邮箱 → 双邮箱验证（旧邮箱+新邮箱）| 安全升级 |
| 16 | 魔法链接（Magic Link）登录 | 替代密码+验证码方案 |

---

## 9. 技术选型建议

### 邮件发送服务

| 方案 | 优点 | 缺点 | 推荐度 |
|------|------|------|--------|
| **Resend** | 开发者友好、API 简单、免费额度够 MVP | 国内送达率一般 | ⭐⭐⭐ **首选** |
| Nodemailer + SMTP | 完全控制、成本低 | 需要自己配 SMTP（AWS SES/Gmail）| ⭐⭐ 备选 |
| SendGrid | 成熟稳定、送达率高 | 免费额度少、配置复杂 | ⭐⭐ 备选 |
| Mailgun | 好 | 偏贵 | ⭐ 不推荐 |

**建议用 Resend**：
- 免费额度：3000 封/月，MVP 绰绰有余
- API 极简：`resend.emails.send({ to, from, subject, html })`
- Next.js 官方有集成示例
- Vercel 部署零配置

---

## 10. 验收标准 Checklist

### 功能验收

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

### 安全验收

- [ ] 同一邮箱 60 秒内只能发 1 次
- [ ] 验证码错 3 次后当前码失效
- [ ] 验证码为 6 位纯数字（无字母特殊字符）
- [ ] 邮件中验证码清晰可读（大字号等宽）
- [ ] 邮件包含"非本人操作请忽略"提示

### UI/UX 验收

- [ ] 验证码态弹窗尺寸与表单态一致（不闪烁跳动）
- [ ] 脱敏邮箱显示正确（f***k@example.com）
- [ ] 6 个输入框间距均匀、对齐整齐
- [ ] focus 态边框高亮明显
- [ ] 错误态 shake 动画流畅
- [ ] 移动端 6 格输入框不溢出屏幕
- [ ] 中英文界面均显示正常

---

## 附录 A：对现有 PRD 4.2 节的具体修改点

将本文档合并入 PRD 4.2 时，需要在以下位置插入/修改内容：

### A.1 在 4.2 节「弹窗内容结构」之后新增

在当前的 8 步结构图后面，新增第 9 种视图形态：

```
视图 C：验证码态（verifying state）
- 仅在邮箱需要验证时显示
- 替换视图 B（表单）的全部内容，但保持弹窗容器不变
详细规格见本文档第 3 节
```

### A.2 修改 4.2「提交逻辑」

原逻辑第 4-5 步改为：

```
4. 调用 POST /api/auth/login
5. 判断响应：
   - { ok: true, token: "..." } → 已验证老用户 → 关闭弹窗 → 刷新页面
   - { need_verification: true } → 新用户/未验证 → 切换到验证码态
   - { error: "..." } → 显示错误提示
6. （仅在验证码态）用户输入验证码 → 调用 verify-code → 成功后关闭弹窗
```

### A.3 在 4.2「错误状态处理」表中追加

| 错误场景 | 处理方式 |
|---------|---------|
| 验证码错误 | 验证码输入框全部标红 + shake + "验证码错误，请重新输入" |
| 验证码过期 | "验证码已过期，请重新发送" + 清空输入框 |
| 发送频繁 | "发送过于频繁，请 XX 秒后再试" |
| 邮件发送失败 | toast "验证码发送失败，请稍后重试" |

### A.4 在 4.2「组件文件」表中追加

| 组件 | 路径 | 说明 |
|------|------|------|
| VerificationCodeInput | components/auth/VerificationCodeInput.tsx | 6位验证码输入 |
| CountdownTimer | components/auth/CountdownTimer.tsx | 重发倒计时 |

### A.5 新增 4.3 节（或作为 4.2 的子节）

标题：**邮箱验证码流程 (Email Verification)**

内容引用本文档的第 2-7 节。
