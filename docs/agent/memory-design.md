# 小满 · 记忆系统设计(P1)

> 配套:`PRD-知己-P1.md`、`system-prompt-小满.md`。本文件定义 Agent 记忆系统——产品的核心壁垒。
> 日期:2026-06-18 · 版本:v0.1

## 0. 一句话

记忆系统不追求"存得多/检索得准",而追求 **"存得对、更新得及时、引用得自然"**。数据越沉淀,迁移成本越高,壁垒越深。

---

## 1. 认知前提:陪伴记忆 ≠ RAG

我们要的不是"对文档的记忆",而是"对一个**会变化的人**的记忆":

- 文档静态;**人动态**——"在准备考研复试"两个月后就是假的。
- 文档不矛盾;**人会反复**——吵架→分手→复合,记忆要能**更新/作废**,不能只追加。
- RAG 错了答非所问;**陪伴记忆错了 = 信任崩塌**(说错 TA 没说过的事,瞬间出戏)。

→ 系统核心是 **存得对、更新及时、引用自然**,而非检索花哨。

---

## 2. 记忆分层(记什么)

| 类型 `kind` | 例子 | 性质 | 更新方式 | P1 |
|---|---|---|---|---|
| **identity** 身份事实 | 自称"老张"、程序员、在杭州、有个妹妹 | 半静态 | 极少变,变则覆盖 | ✅ 重点 |
| **thread** 进行中的事 | "在准备 6 月考研复试,焦虑"、"和母亲冷战" | **有生命周期**:开启→更新→结束 | resolve/supersede | ✅ 重点 |
| **preference** 偏好 | "喜欢被直说,别安慰"、"别提前任" | 半静态 | 覆盖 | ◻️ 顺带 |
| **pattern** 情绪/行为模式 | "压力大时自我否定"、"提父亲会回避" | 长期归纳,高阶 | 多次对话归纳 | ❌ P2 |

外加 **命盘底色**(静态):不进记忆表,每轮由 `runBaziToolchain` 注入 `{{baziFacts}}`。

> P1 主攻 **identity + thread**——贡献约 90% 的"它记得我"。

---

## 3. 四步管线

```
① 抽取 Extract   每轮对话后,异步 LLM 抽 0–N 条候选(不阻塞流式)
② 对账 Reconcile 和已有记忆比对 → new / update / close / ignore   ← 最难
③ 检索 Retrieve  每轮对话前,分层组装注入 {{memories}}
④ 衰减 Decay     后台:关闭过期 thread、归纳 pattern、淘汰碎片(P1 仅做轻量)
```

---

## 4. 锁定的决策(2026-06-18 对齐)

| 决策点 | 选择 | 理由 |
|---|---|---|
| **抽取时机** | **每轮异步抽** + 低信息轮跳过 | 陪伴讲即时感;异步不阻塞流式;无新信息的寒暄轮跳过省钱 |
| **抽取方式** | **纯 LLM**(能直接判 new/update/close) | P1 不过度工程,LLM 足够灵活 |
| **可见/可删** | **P1 后端支持删除,前端"小满记得的我"页放 P2** | 信任+合规靠后端能力先具备,前端后置控范围 |
| **向量检索** | **P1 不上**,等单用户记忆破 ~50 条再上 pgvector | 早期记忆少,"全带 thread + recency" 足够,省 embedding/运维/调参 |
| **记忆维度** | 按 (userId, profileId) | 换对话框仍记得;多人档案各自独立 |

---

## 5. 数据模型

```prisma
model AgentMemory {
  id           String   @id @default(cuid())
  userId       String
  profileId    String?              // 对应多人档案
  kind         String               // identity | thread | preference | pattern
  content      String   @db.Text    // 一句话事实
  entity       String?              // 归并键:"考研""母亲""工作"——对账靠它
  status       String   @default("active")  // active | resolved | superseded
  weight       Int      @default(1)
  supersededBy String?              // 被哪条新记忆取代
  createdAt    DateTime @default(now())
  lastUsedAt   DateTime @default(now())
  @@index([userId, profileId, status])
  @@map("agent_memories")
}
```

`entity` + `status` 是把"只能追加的日记"升级为"会更新的人物档案"的关键。

---

## 6. ① 抽取引擎(纯 LLM,异步)

每轮对话结束后,后台调一次小模型(可用同 `PRIMARY_MODEL`,低 max_tokens)。

**输入**:本轮 user+assistant 文本 + 相关实体的已有记忆(让它能判 update/close)。
**输出**:JSON 操作数组;**保守**——宁漏勿错,无可记则空数组。

**抽取 prompt 草稿**:
```text
你是「小满」的记忆助理。从下面这轮对话里,抽取**对长期陪伴 TA 有用**的事实。
只抽:身份信息(identity)、正在经历的事(thread)、相处偏好(preference)。
不要抽:寒暄、天气、一次性的闲聊、你(小满)自己说的话、临时情绪波动。
保守优先:不确定是否值得长期记,就别抽。

已知的相关记忆(用于判断是新增还是更新/结束):
{{existingMemoriesForEntities}}

本轮对话:
用户:{{userMsg}}
小满:{{assistantMsg}}

输出 JSON 数组,每项:
{ "op": "new|update|close|ignore",
  "kind": "identity|thread|preference",
  "entity": "归并关键词,如 考研/母亲/工作",
  "content": "一句话事实(从 TA 视角客观陈述)",
  "targetId": "update/close 时填已有记忆 id" }
没有可记的就输出 []。
```

**示例**:
- "我下周考研复试,好慌" → `[{op:new, kind:thread, entity:考研, content:"在准备考研复试,很焦虑"}]`
- (几周后)"复试过了!" → `[{op:update, kind:thread, entity:考研, content:"考研复试通过了", targetId:"..."}]`
- "其实我考上了就不打算继续了" + 已结束 → `[{op:close, entity:考研, targetId:"..."}]`
- "今天天气真好" → `[]`

---

## 7. ② 对账 Reconcile

拿候选按 `op` 落库:
- `new` → 插入 active 记忆。
- `update` → 更新 `targetId` 的 `content`,刷新 `lastUsedAt`。
- `close` → `targetId` 置 `status=resolved`(**不再当"现在"引用**,但保留为历史)。
- `ignore` → 丢弃。
- 兜底:若 LLM 给了 new 但 entity+kind 已存在高度相似 active 记忆,降级为 update(防重复)。

> 让抽取 LLM 直接看到同实体已有记忆来判 op,省掉独立相似度计算——这是 P1 不上向量也能更新记忆的关键技巧。

---

## 8. ③ 检索 Retrieve(组装 {{memories}})

不是纯排序,而是**分层组装**(token 预算内):
1. **永远带**:所有 `identity` + `preference`(数量少、最该被记得)。
2. **永远带**:所有 `status=active` 的 `thread`(进行中的事最该被惦记)。
3. **按需补**:`resolved` 的近期 thread,按 recency 补到预算上限(让它能回访"上次那件事")。
4. 注入后批量更新被选中记忆的 `lastUsedAt`。

P1 排序键:recency(`lastUsedAt`/`createdAt`)。P2 加语义相似(对当前 user message 求 embedding)。

预算:`{{memories}}` 控制在 ~20 条 / 数百 token 内。

---

## 9. 引用安全(防"记错"翻车)

记忆引用是双刃剑:引用对了=亲密,引用错了=出戏。系统提示词里已约束,核心两条:
- **对 thread 用问句 + hedge**:"你之前好像在忙考研的事,现在怎么样啦?"——而非断言"你在考研"。即便记忆略陈旧也不尴尬。
- **resolved 的事只作回访,不当现状**:检索时区分 active/resolved,避免把已结束的事说成正在发生。

---

## 10. ④ 衰减 Decay(P1 仅轻量)

- P1:active thread 超 X 天(如 45 天)未被提及 → 降级提示/软关闭,避免老挂着过期的事。
- P2:旧 thread 归纳成 pattern(如反复"考试焦虑"→"面对评价场景易紧张");低权重碎片淘汰;记忆合并摘要。

---

## 11. 隐私

- 记忆是高敏感个人数据。P1:**后端支持按用户删除**(整体 + 单条);前端"小满记得的关于我"管理页放 P2。
- 删除即真删(或软删 + 定期清);用户登出/注销级联清理。
- 抽取/存储均限本人可见;不跨用户、不进训练。

---

## 12. P1 验收口径

- 跨会话:新开对话框,小满仍记得身份事实与进行中的事。
- 更新:thread 有进展时记忆随之更新,不再说旧状态。
- 自然:引用以问句/hedge 带出,不生硬罗列、不断言已结束的事。
- 安全:无凭空捏造的"记忆"(抽取保守 + 只引用库内事实)。

---

## 13. P2 预告

向量语义检索(pgvector)、pattern 归纳、记忆合并摘要、跨档案/家庭记忆、前端记忆管理页、记忆驱动的主动触达("上次那件事…")。

_Memory design by Claude · 2026-06-18 · v0.1_
