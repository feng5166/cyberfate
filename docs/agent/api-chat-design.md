# 小满 · /api/agent/chat 接口与时序设计(P1)

> 配套:`PRD-知己-P1.md`、`memory-design.md`、`system-prompt-小满.md`。
> 定义一轮对话请求的完整生命周期:工具链 → 检索 → 流式 → 落库 → 异步抽取,含缓存、断流、错误降级。
> 日期:2026-06-18 · 版本:v0.1

---

## 1. 请求契约

`POST /api/agent/chat`(SSE 流式;鉴权必需)

```jsonc
// body
{
  "message": "最近好累,什么都不想干",   // 必填,1–2000 字
  "conversationId": "cuid",            // 选填,缺省=新建会话
  "profileId": "cuid"                  // 选填,缺省=主档案
}
```

响应:`Content-Type: text/event-stream`。SSE 事件协议:

```
data: {"meta":{"conversationId":"...","memoryUsed":3}}   // 首包,可选
data: {"content":"嗯……"}                                  // 流式增量(多条)
data: {"content":"我在呢。"}
data: {"done":true,"messageId":"..."}                     // 收尾
data: [DONE]
// 出错:
data: {"error":"AI_UNAVAILABLE","message":"小满有点走神,稍后再聊好吗"}
```

---

## 2. 三阶段时序总览

```
Phase A 准备(pre-stream,快,失败要么报错要么降级)
  鉴权 → 校验 → 限流 → 配额 → 取/建会话+档案
  → 命盘事实(缓存) → 检索记忆 → 取近 K 轮 → 拼 system prompt
Phase B 流式(stream)
  开 SSE → attachClientAbort → DeepSeek 流式(传 signal) → 中继增量 → 累积全文
Phase C 收尾(post-stream,部分经 after() 存活)
  落库 user+assistant 消息 → 刷新 lastUsedAt → after():异步抽取→对账→写记忆
```

### 时序图

```
Client            Route(/api/agent/chat)        Redis/PG           DeepSeek
  │  POST message      │                            │                  │
  │───────────────────>│  A1 鉴权/校验/限流/配额      │                  │
  │                    │  A2 取/建会话+档案 ─────────>│ PG               │
  │                    │  A3 命盘事实(读缓存) ───────>│ Redis(miss→算+写) │
  │                    │  A4 检索记忆 ───────────────>│ PG               │
  │                    │  A5 取近K轮 ────────────────>│ PG               │
  │                    │  A6 拼 system prompt         │                  │
  │   SSE open         │  B1 开流 + attachClientAbort │                  │
  │<───────────────────│  B2 fetch(stream, signal) ──┼─────────────────>│
  │   content deltas   │<─── 中继 ───────────────────┼──── deltas ──────│
  │<═══════════════════│                             │                  │
  │   done             │  C1 落库 user+assistant ────>│ PG               │
  │<───────────────────│  C2 刷新 lastUsedAt ────────>│ PG               │
  │   [stream closed]  │  C3 after(): 抽取→对账→写记忆 │ DeepSeek+PG      │
```

---

## 3. Phase A · 准备(逐步 + 降级)

| 步 | 动作 | 失败处理 |
|---|---|---|
| A1 | `getServerSession` → 无则 **401**(记忆需登录用户) | 401 |
| A1 | 校验 `message`(非空、≤2000) | 400 |
| A1 | `checkRateLimit('agent_chat', userId, 20, 60)` | 429 |
| A1 | `checkAgentQuota(userId)`:免费 N/天,VIP 不限 | 403(带升级引导)|
| A2 | 取 `conversationId` 对应会话;无则按 (userId, profileId) 新建。解析 profile(缺省主档案) | 会话建失败→500 |
| A3 | **命盘事实**:Redis 读 `agent:facts:{profileId}:{今日北京}`;miss → `runBaziToolchain` + `toolchainToPromptFacts` 写缓存(TTL 到当日 24:00) | **降级**:取不到则用空事实继续,记 log,不阻断聊天 |
| A4 | **检索记忆**(见 memory-design §8):identity+preference 全带 + active thread 全带 + 近期 resolved 补到预算 | **降级**:失败则空记忆继续 |
| A5 | 取该会话近 K=10 轮 `AgentMessage` | 降级:空历史继续 |
| A6 | 拼 system prompt(小满模板 + `{{baziFacts}}` + `{{memories}}` + `{{recentMessages}}`) | — |

> **关键降级原则**:A3/A4/A5 任一失败都**不该让用户聊不了天**——命盘/记忆是增强项,缺了就退化成"普通但温暖的小满",绝不 500。

---

## 4. Phase B · 流式

- B1:返回 `ReadableStream` 的 SSE 响应;`const abort = attachClientAbort(req)`(复用现有 helper)。
- B2:`fetch(DeepSeek, { signal: abort.signal, stream:true })`,带 wall-clock 超时(如 40s),解析 delta 中继为 `{"content":...}`。
- B3:累积 `fullText`;若**首个 content 到达前**上游失败/超时 → 走兜底(见 §6)。
- 客户端断连:`abort` 触发 → 取消上游 fetch、`reader.cancel()`、释放(复用 `attachClientAbort` 的 cancel/release)。**断连也要落已生成的部分**(见 C1)。

---

## 5. Phase C · 收尾(注意 serverless 存活)

- C1 **落库消息**:写 `AgentMessage`(user)+(assistant=fullText),`conversation.updatedAt` 刷新。
  - 流正常结束:在 stream flush 时写。
  - 客户端断连/中途错:把**已生成的 partial** 也落库(标 `partial`),保证历史一致、可续聊。
- C2 刷新被注入记忆的 `lastUsedAt`(也可放 A4 之后)。
- C3 **异步抽取**:`after(() => extractAndReconcile(turn))`(Next.js App Router `after()` / Vercel `waitUntil`)。

> ⚠️ **Serverless 坑**:响应流关闭后,函数可能被立即冻结,**普通 fire-and-forget 会被掐断**。异步抽取必须放进 Next.js `after()`(或 `event.waitUntil`)里,才能在响应结束后继续跑完抽取的那次 LLM 调用 + 写库。这是 P1 实现最容易踩的点。

抽取本身(memory-design §6–7):取本轮 user+assistant + 相关实体已有记忆 → 抽取 LLM → 按 op 落库。**全程独立 try/catch,任何失败都不影响用户**(用户早已拿到回复)。

---

## 6. 错误处理矩阵

| 阶段 | 故障 | 行为 | 用户感知 |
|---|---|---|---|
| A1 | 未登录 / 校验 / 限流 / 超配额 | 401/400/429/403 | 明确提示(配额给升级引导)|
| A3 | 工具链异常 | **降级**:空事实继续 | 无感(小满略"不那么懂命盘")|
| A4/A5 | 记忆/历史读失败 | **降级**:空继续 | 无感 |
| B3 | 上游**首包前**失败/超时 | **退配额** + 发兜底 SSE | "小满有点走神,稍后再聊" |
| B | 上游**中途**断 | 保留 partial、落库、允许重试 | 回复中断,可重发 |
| C1 | 落库失败 | 记 log,不影响已发回复 | 无感(极端下历史缺一轮)|
| C3 | 抽取失败 | 隔离吞掉 + log | 无感(本轮没沉淀新记忆)|

**配额退还**:仅在"未产出任何内容"时 `refundQuota(userId,'agentChatCount')`(对齐现有 bazi/daily 路由写法)。

---

## 7. 一致性 / 并发

- **记忆最终一致**:turn N 的记忆经 `after()` 异步写;若用户极快发 turn N+1,其检索可能读不到 N 的新记忆 → 可接受(下一轮即可见)。
- **消息顺序**:按 `createdAt` 排;同会话串行语义。
- **抽取幂等**:抽取以 (conversationId, 该轮 messageId) 为去重锚,防 `after()` 重试导致重复写记忆。
- **缓存正确性**:命盘事实键含 `profileId`+`今日北京`,跨档案/跨天不串(对齐已修的 C3 缓存教训)。

---

## 8. 复用现有能力(尽量不造轮子)

| 需要 | 复用 |
|---|---|
| 流式 SSE + 断流 | 现有 `attachClientAbort` + bazi/chat 流式范式 |
| 命盘事实 | `runBaziToolchain` + `toolchainToPromptFacts`(已有)|
| 鉴权 | `getServerSession` + `@/lib/auth` |
| 限流 | `checkRateLimit` |
| 配额 | `quota.ts` 模式,新增 `agentChatCount` + `checkAgentQuota`/`refundQuota` |
| 缓存 | Redis(现有)|
| 模型调用 | DeepSeek(现有 `AI_BASE_URL`/`PRIMARY_MODEL`)|

**P1 唯一新增**:`agent_conversations` / `agent_messages` / `agent_memories` 三表 + `agentChatCount` 配额字段 + `/api/agent/chat` + 异步抽取逻辑。

---

## 9. P1 验收(接口层)

- 正常一轮:首包 < 2s,流式顺畅,结束落库 user+assistant。
- 断连:上游被取消、partial 落库、不泄漏连接。
- 降级:手动让工具链/记忆读失败,聊天仍正常(只是少了命盘/记忆增强)。
- 异步抽取:响应结束后 `after()` 仍跑完抽取并写入记忆(serverless 下验证不被掐)。
- 配额:超额 403 带升级;首包前失败会退配额。

_API design by Claude · 2026-06-18 · v0.1_
