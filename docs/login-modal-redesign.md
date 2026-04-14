# 登录/注册弹窗改造 — 代码虾任务说明

> 来源：Frank 2026-04-14 反馈 | PRD位置：4.2 节 | 优先级：P0

## 目标

把当前简陋的登录弹窗改造成 FateMaster 那样的完整登录体验。

## 当前问题（截图对比）

| 项目 | FateMaster（竞品） | 我们当前 |
|------|-------------------|---------|
| 副标题 | 「登录或创建账号以继续使用」 | 「探索你的命运之旅」（不直观） |
| Google 按钮 | 白底描边 + G 图标 + 文字 | 有，但样式可能不一致 |
| 分割线 | 「或使用邮箱登录」 | 有「或使用邮箱」 |
| 密码输入框 | ✅ 完整密码框 + 显示/隐藏切换 | ❌ 缺失 |
| 忘记密码链接 | ✅ 右对齐 | ❌ 缺失 |
| 密码提示 | 「至少8个字符」（error 时变红） | ❌ 缺失 |
| 协议 checkbox | ✅ 勾选后才能提交 | 有但位置可能不对 |
| 提交按钮文案 | 「登录 / 注册」 | 「继续」（不准确） |

## 改造清单

### P0 必须（本次改造）

- [ ] **副标题改为**：「登录或创建账号以继续使用」
- [ ] **新增密码输入框**：`type="password"` + 右侧👁图标点击切换明文/密文
- [ ] **新增密码提示文字**：输入框下方小字「至少8个字符」，校验失败时变红
- [ ] **新增「忘记密码?」链接**：密码区右对齐，点击 toast 提示「请联系客服重置密码」（P0 先占位）
- [ ] **提交按钮文案改为**：「登录 / 注册」（不是「继续」）
- [ ] **协议 checkbox 未勾选时阻止提交**（或 shake 提示）
- [ ] **表单校验**：邮箱格式 + 密码≥8位 + 协议勾选，对应字段红字报错
- [ ] **Google 登录按钮样式对齐**：白底描边 + G 彩色 Logo + 「使用 Google 登录」

### P1 后续优化

- [ ] 忘记密码邮件重置流程
- [ ] 登录成功后自动关闭弹窗 + 无刷新更新 UI 状态
- [ ] API 401 自动弹出登录弹窗
- [ ] loading 态：按钮 spinner + 「登录中...」

## 设计规范速查（Design Tokens v6）

```
弹窗容器: max-w-[420px] rounded-2xl p-8 bg-white shadow-2xl
标题: text-2xl font-semibold text-center text-[#1C1A16]
副标题: text-sm text-center mt-2 text-[#9B9590]
Google按钮: w-full border border-[#E5E2DD] rounded-lg py-3 px-4 flex items-center justify-center gap-3 hover:bg-[#FAF9F6]
分割线: flex items-center gap-4 my-6, 线条 h-px bg-[#E5E2DD], 文字 text-xs text-[#9B9590]
输入标签: text-sm font-medium mb-2 block text-[#1C1A16]
输入框: border border-[#E5E2DD] rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-[#1C1A16]/10 focus:border-[#1C1A16]
提交按钮: w-full bg-[#1C1A16] text-white rounded-lg py-3.5 px-4 font-medium text-sm
错误文字: text-red-500 text-xs mt-1
```

## 组件文件

- `components/auth/AuthModal.tsx` — 主组件（新建或重写现有）
- `components/auth/GoogleLoginButton.tsx` — Google OAuth 按钮
- `components/auth/EmailLoginForm.tsx` — 邮箱密码表单

## 验收标准

1. 弹窗视觉与 FateMaster 截图一致（布局、间距、字号）
2. 密码显示/隐藏切换正常工作
3. 表单校验：空提交、格式错误、密码过短、未勾选协议 → 各有明确红字提示
4. Google 登录和邮箱登录都能走通
5. 移动端表现正常（弹窗不溢出屏幕）
