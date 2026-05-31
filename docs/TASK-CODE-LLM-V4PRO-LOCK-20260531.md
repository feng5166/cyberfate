# TASK-CODE: 锁定 daily 主接口为 DeepSeek-V4 Pro

**派给**: 💻 代码虾
**日期**: 2026-05-31 23:08
**优先级**: P0（今晚）
**预估**: 30min
**触发**: Frank 5/31 23:07 拍板"把 LLM 锁定 DeepSeek-V4 Pro，切换过来吧"

---

## 背景

今天的事故链：
1. 5/31 早上原本 daily 用 `deepseek-v4-flash`，但 flash 是推理模型导致结果固定（每天每用户都一样）
2. 你今天 cfb1f1a 切到 `deepseek-ai/DeepSeek-V3.2` 暂避
3. Frank 现在拍板：daily 主接口锁定 `deepseek-v4-0324-pro`（即 PRD v1 §6.3 当初定的"DeepSeek-V4 Pro"）

---

## 改动范围（**仅限 daily 主接口**，不要扩散到其他模块）

### 文件 1: `src/lib/ai/client.ts`

```diff
- const DEEPSEEK_MODEL = 'deepseek-ai/DeepSeek-V3.2';
+ const DEEPSEEK_MODEL = 'deepseek-v4-0324-pro';
```

⚠️ 注意模型 ID 命名空间：
- `deepseek-ai/DeepSeek-V3.2` 是 modelverse.cn 的 HuggingFace 风格命名
- `deepseek-v4-0324-pro` 是 modelverse.cn 自己的别名
- **跟 `src/app/api/daily/detail-analysis/route.ts` 第 92 行保持一致**（那里就是 `deepseek-v4-0324-pro`，已验证可用）

### 不要动的文件（明确范围）
- ❌ `src/app/api/bazi/chat/route.ts`（v4-flash 不动）
- ❌ `src/app/api/bazi/marriage/route.ts`（V3.2 不动）
- ❌ `src/app/api/huangli/ask/route.ts`（V3.2 不动）
- ❌ `src/app/api/meihua/draw/route.ts`（V3.2 不动）
- ❌ `src/app/api/music-oracle/route.ts`（V3.2 不动）
- ❌ `src/lib/music-oracle/generate.ts`（V3.2 不动）

理由：Frank 这次只是切 daily 主接口（顶部判词结论那条），其他模块当前没出问题，避免引入新风险。

---

## 配套验证

### 1. 本地 build 通过
```bash
cd ~/Desktop/ClaudeCodeProject/cyberfate
npm run build
```

### 2. 你今天还在排查的"断路器卡 OPEN"问题
- 模型从 v4-flash → V3.2 已经把断路器键 `deepseek-daily` 的失败计数继承下来
- 现在再切到 V4 Pro，那个 Redis key 状态可能依然 OPEN
- **建议**：commit 前先 `redis-cli` 或在代码里临时加一行启动时强制 reset 该 key（**或者改个新的断路器 key 名**，比如 `deepseek-daily-v4pro`）
- 这步如果你已经在直聊那条线上修了，请告诉我现在 Redis 状态

### 3. 线上验证
部署完后用真实账号登录 https://www.cyberfate.me/daily：
- 填生辰 → 点"查看今日运势"
- 看顶部判词结论是不是"个性化内容"（不是固定的"日常工作、学习提升"）
- 看 `/daily` 加载时长 < 15s（避开 withAiTimeout 触发 fallback）

### 4. 截图上报
不需要重新出三套截图（视觉没变），但请在飞书群（@产品虾 @Frank）发一张：
- 顶部判词结论的截图
- 加上一句话说明"模型已切换到 V4 Pro，断路器状态 OK"

---

## commit message 建议
```
chore: daily 主接口锁定 DeepSeek-V4 Pro

- src/lib/ai/client.ts: V3.2 → deepseek-v4-0324-pro
- 与 detail-analysis 模块统一
- Frank 5/31 23:07 拍板锁定决策
```

---

**END**
