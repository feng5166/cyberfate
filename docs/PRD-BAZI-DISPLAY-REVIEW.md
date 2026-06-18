# 八字命盘展示与 AI 解读 PRD — 代码对齐评审

> 对象：PRD v1.1（2026-06-18《八字命盘展示与AI解读逻辑规范》）
> 评审基准：当前 `main` 代码（截至 2026-06-18）
> 结论：方向正确，命盘（确定性）与 AI（流式）双链路本就分离，PRD 将其显式化是对的。
> 下表区分「已满足 / 待建设 / 必须先修的坑」，并标注精确 file:line。

---

## 一、已满足，无需重做

| PRD 条目 | 现状 | 证据 |
|---|---|---|
| AI 解读 7 章节（§三） | 完全一致：日主/性格/事业/财运/感情/健康/大运流年 | `src/lib/ai/prompts.ts` `BAZI_STREAM_SYSTEM_PROMPT` |
| AI 流式 + 有缓存直接展示 + 重新分析强制刷新（§三） | 已实现，Redis 缓存 + `forceRefresh` | `src/app/api/bazi/stream/route.ts` |
| 「重新分析」不动命盘（§一 核心约束） | **主路径已满足**：有 `baziResult` 时只重跑 AI 流，命盘 state 不变 | `src/app/bazi/PageClient.tsx:1872` |
| 四柱 / 五行 / 十神 / 大运 首屏展示 | 已渲染（十神为前端 `ShishenDetailTab` 现算，大运 `DayunTimeline`） | `src/components/bazi/*` |
| 命盘计算与 AI 解读分两个接口（§四） | `/api/bazi`（排盘，`aiAnalysis:''`） vs `/api/bazi/stream`（AI） | — |

---

## 二、PRD 要、现状缺（待建设）

| 模块 | 现状 | 量级 | 备注 |
|---|---|---|---|
| **神煞分析**（§二） | 算法全量 `lib/bazi/shensha.ts`，但只在 AI 工具链步骤里，**首屏无结构化模块** | 小 | 吉凶分类 `SHENSHA_NATURE` 现成，仅需接口透出 + 新组件 |
| **流年分析**（§二） | `lib/bazi/liunian.ts` + `/api/bazi/timeline` 有，**首屏无结构化模块** | 小 | — |
| **流月 12 个**（§二） | 同上，算法/接口有，首屏无展示 | 中 | 主要是 UI 设计 |
| **终身大运表**（§二） | 现仅取 6 步（`getDayunTimeline` `slice(0,6)`），非终身 | 极小 | 改 slice 到 ~8 步/至 100 岁 |
| **重新分析·档案回填路径** | 档案历史无 `baziResult` 时会重新 POST `/api/bazi` 重算命盘 → 该路径违反「命盘不动」 | 小 | `PageClient.tsx:1841`；把命盘结构存进档案，回填直接用 |

---

## 三、PRD 未提、必须先修的坑

### 1. 【高】AI 缓存 key 会串档
`/api/bazi` 生成 cacheKey 时只 hash 了 `birthDate + birthHour(粗时辰) + gender`，
**漏掉 `birthHourNum / birthMinute / isLunar / lateZiShi`**。

```
src/app/api/bazi/route.ts  （cacheKey 生成处）
.update(JSON.stringify({ birthDate, birthHour, gender }))   // ← 缺精度字段
```

后果：以下三类不同的人会命中**同一份 AI 解读**——
- 精确到分不同（同一粗时辰内）
- 农历/阳历恰好同「年月日」
- 晚子时 vs 早子时

PRD §二「基础信息不变则永久缓存」必须把这些精度字段纳入「基础信息」定义，否则永久缓存 = 永久串档。**建议本期一并修复，并升 cacheKey 版本。**

### 2. 【中】服务端持久化是隐藏的最大工作量
PRD §五要求「命盘 + AI 存服务端、按档案ID绑定」。现状：
- 命盘：localStorage（最多 3 条）+ 每次 `/api/bazi` 重算（确定性，近乎即时）
- AI：Redis（按生辰 hash，非档案ID）
- 档案：已有 `profiles` / `/api/user/birth-info`

要做到 §六「切档案秒出走缓存」需新增 Prisma 表存命盘 JSON 与 AI 文本、绑 `profileId`。
此项与第二节的小模块**不是一个量级**，排期需单列。

### 3. 【中】游客态 —— 已定（2026-06-18）
现游客可试用八字（无账号 → 无档案ID），而 PRD 全篇假设档案ID存在。
**决策：游客继续走 localStorage，不进 DB。** 登录用户才落服务端存档表；
第二档持久化只需处理登录分支，游客沿用现有 localStorage 历史、零改动。
（可选：登录后把游客本地历史一次性迁移上云，非必须。）

---

## 四、给 PRD 的两条补充建议

1. **「基础信息」明确列举**：阳历/农历、精确时分、晚子时归属、是否知时——凡影响排盘者皆属之。
2. **补「游客态」一节**：未登录用户的存储与缓存策略。

---

## 五、建议落地顺序（待决策）

- **第一档（快赢，1~2 天）**：神煞/流年/流月结构化模块 + 终身大运表 + 修 cacheKey 串档。纯前端 + 现有接口透出，不碰持久化。
- **第二档（地基）**：Prisma 命盘/AI 存档表 + 档案ID绑定（仅登录用户；游客已定走 localStorage 不进 DB），满足 §五/§六。
- **第三档**：档案回填路径改造（命盘随档案存取，彻底消除重算/闪烁）。

> 验收点速记：§六 6 条中，「重新分析命盘不闪烁」主路径已过；「切档案秒出走缓存」「编辑后命盘重算+AI清空」依赖第二/三档。
