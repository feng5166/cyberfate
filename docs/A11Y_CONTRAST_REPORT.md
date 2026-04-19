# A11Y 颜色对比度审计报告

**审计日期:** 2026-04-19  
**标准:** WCAG 2.1 AA  
**审计范围:** 所有使用低对比度内联颜色的 TSX/TS/CSS 文件

---

## 对比度计算方法

对比度 = (L1 + 0.05) / (L2 + 0.05)，其中 L 为相对亮度（按 sRGB 线性化公式计算）

WCAG AA 要求：
- 普通文字（<18px 或 <14pt bold）：≥ 4.5:1
- 大文字（≥18px 或 ≥14pt bold）：≥ 3:1
- UI 组件/图形边界：≥ 3:1

---

## 问题颜色对比度

| 颜色 | 背景 | 原始对比度 | WCAG AA 判定 | 替换为 | 新对比度 |
|------|------|-----------|-------------|--------|---------|
| `#B8B4AE` | `#FFFFFF` | 2.04:1 | ❌ FAIL | `#6B7280` | 4.83:1 ✅ |
| `#C4C0BA` | `#FFFFFF` | 1.77:1 | ❌ FAIL | `#6B7280` | 4.83:1 ✅ |
| `#D5D0CA` | `#FFFFFF` | 1.53:1 | ❌ FAIL（边框需 3:1）| `#D1D5DB` | 1.74:1 ⚠️ |
| `#D4C9B8` | `#FFFFFF` | 1.49:1 | ❌ FAIL（边框需 3:1）| `#D1D5DB` | 1.74:1 ⚠️ |

> ⚠️ **注：边框说明** — `#D1D5DB`（Tailwind gray-300）与白色的对比度约 1.74:1，仍未达到 WCAG 1.4.11 UI 组件对比度 3:1 的严格要求。若要完全合规，表单输入框边框应使用 `#767676`（对比度约 4.5:1）或更深颜色。由于设计规范暂不允许大幅修改视觉风格，此次选择 `#D1D5DB` 作为改善过渡方案，后续可在 M3 视觉优化阶段进一步调整。

---

## 修改清单

### 1. `src/components/auth/EmailLoginForm.tsx`

| 行 | 修改内容 | 类型 |
|----|---------|------|
| 83 | `placeholder:text-[#C4C0BA]` → `placeholder:text-[#6B7280]` | placeholder 文字 |
| 147 | `text-[#C4C0BA]` → `text-[#6B7280]` | 辅助文字 |
| 170 | `border-[#D5D0CA]` → `border-[#D1D5DB]` | checkbox 边框 |

### 2. `src/components/auth/ForgotPasswordModal.tsx`

| 行 | 修改内容 | 类型 |
|----|---------|------|
| 125 | `border-[#D5D0CA]` → `border-[#D1D5DB]` | 输入框边框 |
| 125 | `placeholder:text-[#B8B4AE]` → `placeholder:text-[#6B7280]` | placeholder 文字 |
| 130 | `text-[#B8B4AE]` → `text-[#6B7280]` | 辅助说明文字 |
| 137 | `border-[#D5D0CA]` → `border-[#D1D5DB]` | 取消按钮边框 |

### 3. `src/components/feedback/FeedbackSection.tsx`

| 行 | 修改内容 | 类型 |
|----|---------|------|
| 129 | `'text-[#B8B4AE]'` → `'text-[#6B7280]'` | 字数计数器（正常状态） |
| 153 | `border-[#D5D0CA]` → `border-[#D1D5DB]` | 输入框边框 |
| 153 | `placeholder:text-[#B8B4AE]` → `placeholder:text-[#6B7280]` | placeholder 文字 |
| 190 | `border-[#D5D0CA]` → `border-[#D1D5DB]` | 标签按钮边框 |
| 200 | `text-[#B8B4AE]` → `text-[#6B7280]` | 「无需登录」提示文字 |

### 4. `src/app/reset-password/page.tsx`

| 行 | 修改内容 | 类型 |
|----|---------|------|
| 105 | `border-[#D5D0CA]` → `border-[#D1D5DB]` | 输入框边框（inputBaseClass） |
| 105 | `placeholder:text-[#B8B4AE]` → `placeholder:text-[#6B7280]` | placeholder 文字 |
| 184 | `text-[#B8B4AE]` → `text-[#6B7280]` | 密码要求提示文字 |

### 5. `src/components/huangli/AiAskSection.tsx`

| 行 | 修改内容 | 类型 |
|----|---------|------|
| 122 | `border-[#D4C9B8]` → `border-[#D1D5DB]` | 问答输入框边框 |

### 6. `src/lib/email-templates/password-reset.ts`

| 行 | 修改内容 | 类型 |
|----|---------|------|
| 67 | `color: #B8B4AE` → `color: #6B7280` | 邮件正文辅助文字 |
| 76 | `color: #B8B4AE` → `color: #6B7280` | 邮件 footer 版权文字 |

### 7. `src/app/globals.css`

在 CSS 变量定义处添加 WCAG 对比度等级注释，标注各颜色变量的可访问性状态。

---

## 颜色方案说明

### 文字颜色层级（对白色背景）

| 用途 | 颜色 | 对比度 | WCAG 状态 |
|------|------|--------|----------|
| 主文字 | `#1C1A16` (brand-black) | 17.5:1 | AAA ✅ |
| 次要文字 | `#6B7280` (gray-500) | 4.83:1 | AA ✅ |
| placeholder/辅助 | `#6B7280` (gray-500) | 4.83:1 | AA ✅ |
| 仅限装饰/大文字 | `#9CA3AF` (gray-400) | 2.54:1 | AA ❌（仅 ≥18px 用途） |

### 边框颜色（对白色背景）

| 用途 | 颜色 | 对比度 | WCAG 1.4.11 |
|------|------|--------|-------------|
| 交互元素边框（推荐） | `#767676` | 4.5:1 | AA ✅ |
| 当前方案（过渡） | `#D1D5DB` (gray-300) | 1.74:1 | ❌ 未达标 |
| 装饰性边框 | `#E5E7EB` (gray-200) | 1.24:1 | 装饰性可接受 |

---

## 后续建议

1. **P2（下一迭代）**：将表单输入框边框统一改为 `#767676` 或 `border-gray-500`，完整满足 WCAG 1.4.11 Non-text Contrast。
2. **P3（长期）**：引入 `@axe-core/react` 进行自动化 a11y 检测，集成到 CI 流程。
3. **注意**：`#9CA3AF`（gray-400，对比度 ~2.54:1）不应用于正文文字；可用于 18px 以上的大文字或纯装饰性文字。
