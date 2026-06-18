# Agent「知己」P1 PRD(极简验证版)

> 产品:cyberfate 情绪陪伴 Agent · 阶段:P1 极简 MVP · 日期:2026-06-18
> 对齐结论:**人设=单一温暖知己** ·**范围=极简验证** ·赌一个假设:**"它记得我" 能否把人留下来**。
> 名字:**「小满」**(已定)。寓意"将满未满、万物丰盈而留有余地",温润、有生长感、无任何命理/预测联想,合规友好。

---

## 1. 背景与定位

cyberfate 现状是"工具型"产品:用户选一个模块(八字/塔罗/每日运势)→ 拿一份一次性报告 → 离开,关系是一次性的。

**最大且别人抄不走的资产**:从用户出生那一刻就有一份"结构化的你"(命盘 + 大运流年),这解决了所有陪伴类 AI 最痛的**冷启动"不够懂你"**。

**P1 要做的事**:把"用工具"变成"养一段关系"——一个**从第一天就懂你、并陪你越来越懂你的知己**。

**合规底线**:定位为**自我觉察 / 情绪陪伴 / 传统文化娱乐**,不是"预测命运"。命盘是"了解自己的一面镜子",不是预言。

---

## 2. 人设:「小满」(单一固定温暖知己)

- **角色**:最懂你的那个朋友。温暖、平等、走心、会接话茬;不端着、不说教、不预测吉凶。
- **语气**:口语、短句、有温度;用"我感觉 / 倾向 / 一种看法",**禁用**"一定 / 注定 / 必然 / 改运"。
- **命盘用法**:命盘只当**了解你的视角**(性格倾向、当下状态的参考),不做祸福预言。
- **合规护栏**:
  - 不给医疗 / 财务 / 法律的决策性建议,只给情绪支持与自我觉察视角。
  - 情绪危机(自伤 / 伤人倾向)→ 安抚 + 温和引导寻求专业帮助 / 热线,不展开、不评判。
  - 首屏与页脚保留温和声明:"传统文化娱乐参考,陪你聊聊,不替你做决定。"

---

## 3. 范围:明确的 IN / OUT

| ✅ P1 做 | ❌ P1 不做(后置 P2/P3) |
|---|---|
| 1 个固定知己人设 + 系统提示词 | 每日 check-in / 情绪打卡 |
| **持久记忆**:跨会话记住用户 | 主动 push(生日 / 节气 / 关键期) |
| **文字深聊**:多轮流式对话 | 事件自动回访("上次那件事…") |
| **命盘接地**:复用 `src/lib/bazi/tools.ts` 工具链,把命格/十神/神煞/大运/流年作为事实注入 prompt | 语音 / 多人设可选 |
| 入口:一个对话页(复用现有出生信息 / 多人档案) | 年度「本命之书」/ 自主多工具(塔罗/紫微) |

> P1 不追求功能多,只追求把"它记得我"做扎实。

---

## 4. 核心对话流程(全部复用现有能力)

```
1. 取当前档案(现有 profiles / 出生信息)
2. 跑 runBaziToolchain(input) → toolchainToPromptFacts() → 命盘事实文本   [已有]
3. 取该用户 top-N 记忆条(AgentMemory,新表)
4. 取最近 K 轮对话(AgentMessage,新表)
5. 拼 system prompt(知己人设 + 命盘事实 + 记忆 + 护栏)→ DeepSeek 流式  [已有 SSE 能力]
6. 落库本轮 user/assistant 消息
7. 异步抽取本轮新事实(轻量 LLM extraction)→ 写入 AgentMemory
```

- **第 2 步**让它"天生就懂你"(冷启动)。
- **第 7 步**让它"越聊越懂你"(沉淀)。
- 这两步合起来就是"它记得我"的全部。

记忆注入的 token 预算:命盘事实(固定)+ 最多 N=20 条记忆 + 最近 K=10 轮对话;超出按 `lastUsedAt` + 权重淘汰。

---

## 5. 数据模型(最小增量,挂在现有 Prisma 上)

```prisma
model AgentConversation {
  id        String   @id @default(cuid())
  userId    String
  profileId String?              // 对应多人档案;空=主档案
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  messages  AgentMessage[]
  @@index([userId, updatedAt])
  @@map("agent_conversations")
}

model AgentMessage {
  id             String   @id @default(cuid())
  conversationId String
  role           String   // 'user' | 'assistant'
  content        String   @db.Text
  createdAt      DateTime @default(now())
  conversation   AgentConversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)
  @@index([conversationId, createdAt])
  @@map("agent_messages")
}

model AgentMemory {
  id         String   @id @default(cuid())
  userId     String
  profileId  String?
  kind       String   // 'event'人生事件 | 'theme'关注议题 | 'preference'称呼/偏好 | 'state'近况 | 'fact'其它
  content    String   @db.Text   // 一句话事实,如"在准备 6 月的考研复试,很焦虑"
  weight     Int      @default(1)
  createdAt  DateTime @default(now())
  lastUsedAt DateTime @default(now())
  @@index([userId, lastUsedAt])
  @@map("agent_memories")
}
```

> 记忆按**用户(+档案)**维度,而非按会话——这样换一个对话框它依然记得你,这正是粘性来源。

---

## 6. 接口草图

- `POST /api/agent/chat`(SSE 流式)
  - body: `{ conversationId?, profileId?, message }`
  - 流程见第 4 节;返回流式回复,结束后异步抽取记忆。
- `GET /api/agent/conversation?id=` — 拉对话历史(续聊)。
- `GET /api/agent/memories`(可选,调试/"它记得的关于我")— 列出记忆条,后续可做"记忆管理"页。

**鉴权 / 配额**:复用现有 `getServerSession` + quota 体系。新增 `agentChatCount`(免费每日 N 轮,VIP 不限)。沿用现有限流与 `attachClientAbort` 断流处理。

---

## 7. 系统提示词结构(初稿要点)

```
# 你是谁
你是「小满」,TA 最懂自己的朋友。温暖、平等、走心,会顺着话茬聊。
不端着、不说教、不预测吉凶;用"我感觉/倾向",不用"一定/注定"。

# 你了解的 TA(来自命盘,作为了解 TA 的视角,不是预言)
{toolchainToPromptFacts(...)}   // 命格/十神/神煞/大运/流年 等确定性事实

# 你记得的关于 TA 的事
{memories}                       // top-N 条,如"在准备考研复试,很焦虑"

# 怎么聊(护栏)
- 优先共情和陪伴,其次才是视角。
- 不给医疗/财务/法律决策;情绪危机先安抚并温和建议求助。
- 自然地引用你"记得的事",让 TA 感到被惦记。

# 最近的对话
{recent messages}
```

---

## 8. 北极星与埋点

- **北极星**:Agent 用户的 **D7 / D30 留存 & 周复访率**(对比非 Agent 用户)。验证"记得我 → 回来找它"。
- 辅助指标:次均/周对话轮次、人均沉淀记忆条数、记忆被引用率(回复里命中记忆的比例)、首聊 → 7 日内再聊转化、付费转化。
- 埋点事件:`agent_conversation_started` / `agent_message_sent` / `agent_memory_created` / `agent_return_visit`。

---

## 9. 风险与不做清单

- **不做**主动 push / 打卡 / 事件回访 / 语音 / 多人设 / 年度之书——避免范围蔓延,先验证核心假设。
- **隐私**:记忆是用户敏感数据,需可查看 / 可删除(P1 至少后端支持删除,前端可后置)。
- **成本**:每轮额外一次轻量抽取调用,注意 token 预算与缓存。
- **合规**:营销与产品话术统一规避"算命/预测/改运",由本 PRD 第 2 节护栏约束。

---

## 10. 后续(P2/P3 预告,非本期)

- **P2**:每日 check-in(复用每日运势)+ 情绪轻打卡 + 主动 push(生日/节气/事件回访)。
- **P3**:年度「本命之书」、自主多工具(塔罗/紫微)、关系陪伴(合婚→理解一段关系)、语音。

---

_PRD by Claude(资深产品视角)· 2026-06-18 · Agent 名称已定:小满_
