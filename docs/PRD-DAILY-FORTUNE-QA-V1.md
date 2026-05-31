# PRD: AI 运势问答（Daily Fortune Q&A）v1.0

**模块代号**: `daily-fortune-qa`
**所属页面**: `/daily`
**版本**: v1.0
**作者**: 🦐 产品虾
**日期**: 2026-05-31 23:50
**来源**: Frank 5/31 23:47 飞书参考图
**优先级**: P0
**状态**: 待开发（代码虾）

---

## 1. 背景与目标

### 1.1 为什么做
- 现有 /daily 已有「每日运势详细分析」（AI 生成的固定 4 段式解读），但那是**单向输出**
- 用户看完后常有**具体疑问**："这个月财运怎么样""最近适合签合同吗"——现在无处可问
- 本模块提供**交互式 AI 问答**，让用户能针对自己的八字+近期天干地支**主动追问**

### 1.2 与「每日运势详细分析」的区别（避免职能重叠）
| 模块 | 形态 | 触发 | 内容 |
|------|------|------|------|
| 每日运势详细分析 | 单向推送 | 点"开始分析" | 固定 4 段式（综述/四维/提醒/时辰）|
| **AI 运势问答（本模块）** | **双向对话** | **用户输入问题 / 点预设问题** | **针对具体问题的个性化回答** |

定位清晰：一个是"今日详解"，一个是"我有问题问 AI"。

### 1.3 目标
- 用户价值：把"被动看运势"升级为"主动问运势"，提升停留时长和复访
- 业务价值：Pro 转化新触点（问答限频 + 历史回看）
- 数据指标：模块使用率 ≥ 30%（进入 /daily 的用户），人均提问 ≥ 1.5 次

---

## 2. 位置与入口

### 2.1 在 /daily 页的位置
```
顶部 Hero（今日判词结论）
       ↓
每日运势详细分析
       ↓
【AI 运势问答】← 本模块（新增，插在这里）
       ↓
🎵 今日之歌
       ↓
八字深度分析卡片
       ↓
六爻起卦入口
```

**精确插入点**：`src/app/daily/PageClient.tsx` 第 806 行「🎵 今日之歌」(`<DailyMusicCard />`) **之前**。

---

## 3. 视觉规范（黑白极简 - 延续方案 A）

> 沿用 5/31 锁定的「方案 A：本类 AI 模块走黑白极简」。配色与「每日运势详细分析」卡片完全一致。

### 3.1 卡片整体
| 元素 | 规范 |
|------|------|
| 卡片背景 | `#FFFFFF` |
| 卡片边框 | `1px solid #E5E7EB` |
| 卡片圆角 | `12px` |
| 卡片内边距 | `24px 28px` |
| position | `relative`（容纳右上角历史按钮）|

### 3.2 标题区
- 主标题「AI 运势问答」：`font-size: 17px; font-weight: 600; color: #111827; font-family: 'Noto Serif SC', serif`
- 副标题「基于您的八字和近期天干地支信息，AI 可以为您提供更全面的运势分析和建议」：`font-size: 13px; color: #9CA3AF; line-height: 1.6; margin-top: 6px`

### 3.3 历史按钮（右上角，带角标）
- 方框按钮：`36×36px; bg: #FFFFFF; border: 1px solid #E5E7EB; border-radius: 8px`
- 图标：lucide-react `<History size={16} color="#6B7280" />`
- **红色数字角标**（参考图右上角"15"）：
  - 绝对定位在方框右上角，`top: -6px; right: -6px`
  - `min-width: 18px; height: 18px; padding: 0 5px; border-radius: 999px`
  - `background: #EF4444; color: #FFFFFF; font-size: 11px; font-weight: 600`
  - `display: flex; align-items: center; justify-content: center`
  - 数字 = 用户历史提问总数；> 99 显示 "99+"；为 0 时**不显示角标**
- hover：方框 `border-color: #9CA3AF; bg: #F9FAFB`

### 3.4 输入区（横向）
```
┌────────────────────────────────────────────┐  ┌─────────┐
│ 请输入您的问题，例如：近期我的整体运势... │  │ ✈ 提问 │
└────────────────────────────────────────────┘  └─────────┘
```
- 输入框：`flex: 1; padding: 12px 16px; border: 1px solid #E5E7EB; border-radius: 10px; font-size: 14px`
  - placeholder：「请输入您的问题，例如：近期我的整体运势如何？最近适合做什么事情？」
  - placeholder 色：`#9CA3AF`
  - focus：`border-color: #9CA3AF`
- 提问按钮：`padding: 12px 24px; bg: #6B7280; color: #FFFFFF; border-radius: 10px; font-size: 14px; font-weight: 500`
  - 图标：lucide `<Send size={15} />` + 文字「提问」，gap 6px
  - hover：`bg: #4B5563`
  - disabled（输入空 / 加载中）：`bg: #D1D5DB; cursor: not-allowed`

> 注：参考图提问按钮用的是中灰 `#6B7280`（不是纯黑 #1F2937），跟"每日运势详细分析"的黑色 CTA 略有区别——**按参考图用中灰**，因为这是次级操作（问答比"开始分析"轻量）。

### 3.5 预设问题区（2列 × 3行）
- 标题：「您可以询问以下方面的问题：」`font-size: 13px; color: #6B7280; margin: 20px 0 12px`
- 网格：`display: grid; grid-template-columns: 1fr 1fr; gap: 12px`
- 每个预设按钮：
  - `padding: 14px 16px; border: 1px solid #E5E7EB; border-radius: 10px; bg: #FFFFFF`
  - 左侧 lucide `<Send size={14} color="#9CA3AF" />` + 文字 `font-size: 14px; color: #374151`，gap 8px
  - 文字左对齐
  - hover：`border-color: #9CA3AF; bg: #F9FAFB`
  - 点击 = 直接把该问题填入输入框并提交

### 3.6 六个预设问题文案（采用参考图原文）
1. 近期我的整体运势如何？
2. 最近适合我做什么事情？
3. 近期有哪些需要注意避开的事情？
4. 这个月我的财运怎么样？
5. 近期人际关系和社交运势如何？
6. 最近哪些日子比较适合做重要决定？

### 3.7 移动端响应式（< 768px）
- 输入区：输入框 + 按钮纵向堆叠，按钮满宽
- 预设问题：`grid-template-columns: 1fr`（单列）

---

## 4. 交互流程

### 4.1 状态机
```
[idle 待提问] →(输入问题/点预设并提交)→ [loading 思考中] →(流式)→ [answer 回答展示]
                                                                      ↓
                                                          [可继续追问 / 查看历史]
```

### 4.2 提交问答
- 用户输入文字或点预设问题 → 点「提问」/ 回车
- 卡片下方展开回答区（在预设问题区上方插入"对话流"）
- loading：复用「每日运势详细分析」的脉冲点 + 流式光标（颜色 `#1F2937`）
- 流式输出 AI 回答（Markdown 渲染，复用 detail-analysis 的 renderContent）

### 4.3 回答区结构
```
┌────────────────────────────────────────────┐
│ 你问：这个月我的财运怎么样？               │  ← 用户问题（灰底气泡）
│                                            │
│ AI 答：本月财运... （流式渲染）            │  ← AI 回答
│                                            │
└────────────────────────────────────────────┘
[继续追问输入框保留在底部]
```
- 用户问题：右对齐或带"你问"标识，`bg: #F3F4F6; border-radius: 10px; padding: 10px 14px`
- AI 回答：左对齐，正文 `color: #374151; line-height: 1.8`
- 支持多轮：每次提问追加到对话流，可滚动

---

## 5. 权限与限频策略（与全站对齐）

| 用户 | 策略 |
|------|------|
| 未登录 | 点提问 → 弹登录窗（复用 onLoginRequired）|
| 已登录免费用户 | **每日 3 次问答**，用完显示「今日问答次数已用完，升级 Pro 无限提问」|
| Pro 用户 | 无限提问 |
| 未填生辰 | 提问时 alert「请先在个人中心填写出生信息」|

> 注：参考的 `/api/bazi/chat` 现在是 **Pro 专属（403 SUBSCRIPTION_REQUIRED）**。本模块要改成**免费 3 次/天 + Pro 无限**（跟 daily-detail 一致），不要直接照搬 bazi/chat 的付费墙。

### 5.1 限频实现
- 复用 `checkRateLimit`，key 用 `daily_fortune_qa`，免费用户额度 3/天
- Pro 用户跳过

---

## 6. 历史记录

### 6.1 角标数字
右上角红色角标 = 用户累计提问总数（参考图"15"）。

### 6.2 历史抽屉
点历史按钮 → 右侧抽屉（复用 detail-analysis 的 Drawer 视觉）：
- 列表每条：问题摘要 + 时间
- 点击展开该轮完整问答
- 免费用户看最近 3 条 + Pro 引导卡；Pro 看全部

---

## 7. 技术实现

### 7.1 后端 API（新增）
```
POST /api/daily/fortune-qa
Body: { question: string, date?: "YYYY-MM-DD" }
Response: SSE Stream（流式）
```
**逻辑**：
1. 鉴权（未登录 401）
2. 检查限频（免费 3/天，Pro 跳过）
3. 读取用户八字 profile + 当日干支
4. 拼 Prompt：系统角色（命理师）+ 八字上下文 + 用户问题
5. 调 V4 Pro 流式返回
6. 写 `daily_fortune_qa_history` 表

```
GET /api/daily/fortune-qa-history?limit=3|all
Response: { count: number, records: [{ id, question, answer, createdAt }] }
```
（count 用于角标数字）

### 7.2 数据库（新增表）
```sql
CREATE TABLE daily_fortune_qa_history (
  id          String   @id @default(cuid())
  userId      String
  question    String   @db.Text
  answer      String?  @db.Text
  llmModel    String?
  createdAt   DateTime @default(now())
  @@index([userId])
  @@map("daily_fortune_qa_history")
);
```
⚠️ Prisma：加 model 后必须 `npx prisma generate` + 线上 `db push`/migration（昨天 detail-analysis 就是漏了这步出事，别重蹈覆辙）。

### 7.3 LLM 配置
- 模型：`deepseek-v4-pro`（与全站统一，见下方 §9 待确认项）
- 流式 SSE，temperature 0.7，max_tokens 1200
- 系统 prompt 要约束：只回答运势/命理相关问题；拒答政治/医疗/违法等越界问题，引导回运势话题
- 断路器 key：`deepseek-fortune-qa-v4pro`

### 7.4 复用现有资产
- 可参考 `/api/bazi/chat/route.ts` 的鉴权+八字上下文+流式骨架（但改限频策略，见 §5）
- 前端复用 `DailyDetailAnalysis.tsx` 的：renderContent（Markdown）、loading 动画、历史抽屉、流式解析逻辑

---

## 8. 验收标准

### 8.1 视觉（按参考图）
- [ ] 卡片白底+灰描边+12px 圆角，插在「今日之歌」上方
- [ ] 标题「AI 运势问答」衬线 17px + 副标中灰
- [ ] 右上角历史方框 + 红色数字角标（数字=提问总数，0 时隐藏）
- [ ] 输入框 + 中灰「提问」按钮（带纸飞机图标）横向
- [ ] 6 个预设问题 2列×3行，每个带纸飞机图标
- [ ] 移动端：输入纵向、预设单列

### 8.2 功能
- [ ] 点预设问题 → 自动填入并提交
- [ ] 输入问题 → 流式 AI 回答
- [ ] 多轮追问可滚动
- [ ] 未登录弹登录；未填生辰 alert
- [ ] 免费 3 次/天限频，用完显示升级引导
- [ ] 历史抽屉 + 角标数字正确

### 8.3 工程（昨天的教训）
- [ ] Prisma model 已 `generate` + 线上表已建（不能只定义不迁移）
- [ ] npm run build 零错误
- [ ] 真机三套截图（1280/默认/375），带回答态可见

---

## 9. ⚠️ 一个需要代码虾确认的遗留项（非本任务阻塞）

5/31 全站切 V4 Pro 后，模型 ID 现在线上是 `deepseek-v4-pro`（短别名），但我 PRD-DETAIL-V1 §6.3 锁的是 `deepseek-v4-pro`（长别名）。两者是否指向同一模型？
- 如果是同一个 → 统一用 `deepseek-v4-pro`，我改 PRD 记录
- 如果不是 → 需要明确哪个是 Frank 要的"V4 Pro"
- 本模块先跟随线上现状用 `deepseek-v4-pro`，但请代码虾回报这俩别名关系

---

## 10. 派单

| 角色 | 任务 |
|------|------|
| 💻 代码虾 | 新 API + 新 Prisma 表 + 前端组件 `DailyFortuneQA.tsx` + PageClient 插入 + 真机截图 |
| 🦐 产品虾 | 跟踪验收 + Prompt 调优 + 视觉走查 |

---

**END**
