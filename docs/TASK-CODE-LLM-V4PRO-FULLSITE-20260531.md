# TASK-CODE: 全站 LLM 统一锁定 DeepSeek-V4 Pro

**派给**: 💻 代码虾
**日期**: 2026-05-31 23:19
**优先级**: P0（今晚搞完）
**预估**: 30-45min
**触发**: Frank 5/31 23:19 拍板"全站统一锁定 V4 Pro"（B 方案）

---

## 背景

23:07 你已经把 daily 主线切到 V4 Pro（commit 4b6759c）。Frank 现在确认意图是**全站统一**，剩 6 个 LLM 调用点都要切。

---

## 改动范围（全部要切）

### 1. 模型 ID 替换（6 个文件）

| 文件 | 行号 | 旧值 | 新值 |
|------|------|------|------|
| `src/app/api/bazi/chat/route.ts` | 10 | `deepseek-v4-flash` | `deepseek-v4-0324-pro` |
| `src/app/api/bazi/marriage/route.ts` | 385 | `deepseek-ai/DeepSeek-V3.2` | `deepseek-v4-0324-pro` |
| `src/app/api/huangli/ask/route.ts` | 74 | `deepseek-ai/DeepSeek-V3.2` | `deepseek-v4-0324-pro` |
| `src/app/api/meihua/draw/route.ts` | 192 | `deepseek-ai/DeepSeek-V3.2` | `deepseek-v4-0324-pro` |
| `src/app/api/music-oracle/route.ts` | 19 | `deepseek-ai/DeepSeek-V3.2` | `deepseek-v4-0324-pro` |
| `src/lib/music-oracle/generate.ts` | 81 | `deepseek-ai/DeepSeek-V3.2` | `deepseek-v4-0324-pro` |

⚠️ **严格不动**：
- `src/lib/ai/client.ts:23` 已经是 V4 Pro（4b6759c 切过了）
- `src/app/api/daily/detail-analysis/route.ts:92` 一直就是 V4 Pro

### 2. 断路器 key 换名（重要！）

防止旧 key 残留 OPEN 状态阻塞新模型，**所有跟 deepseek 相关的断路器 key 都加 `-v4pro` 后缀**：

| 文件 | 行号 | 旧 key | 新 key |
|------|------|--------|--------|
| `src/app/api/bazi/route.ts` | 113 | `deepseek-bazi` | `deepseek-bazi-v4pro` |
| `src/app/api/huangli/ask/route.ts` | 64 | `deepseek-huangli` | `deepseek-huangli-v4pro` |
| `src/app/api/meihua/decide/route.ts` | 94 | `deepseek-meihua` | `deepseek-meihua-v4pro` |
| `src/app/api/liuyao/route.ts` | 203 | `deepseek-liuyao` | `deepseek-liuyao-v4pro` |
| `src/app/api/tarot/draw/route.ts` | 230 | `deepseek-tarot` | `deepseek-tarot-v4pro` |

**不需要改的断路器 key**：
- `src/app/api/daily/route.ts:121` 已经是 `deepseek-daily-v4pro`（4b6759c 改过）
- `src/app/api/ziwei/route.ts:107` 是 `ziwei-calc`（不是 deepseek 相关，不动）

⚠️ 检查这些路由的 `route.ts` 里还有没有别的 `deepseek-XXX` 风格的 key，有就一起加 `-v4pro` 后缀。

---

## 验证

### 1. 本地 build 通过
```bash
cd ~/Desktop/ClaudeCodeProject/cyberfate
npm run build
```

### 2. 线上烟雾测试（部署后）
登录线上账号，**每个模块至少调一次**：
- [ ] /daily（顶部判词）→ 已 4b6759c 验证
- [ ] /bazi（八字主分析 + chat 对话）
- [ ] /bazi/marriage（合婚）
- [ ] /huangli（黄历问答）
- [ ] /meihua（梅花易数）
- [ ] /liuyao（六爻起卦）
- [ ] /tarot（塔罗）
- [ ] 音乐运势签

每个看到的内容都应该是**个性化生成**（不是 fallback 静态文案）、加载时间 5-15s。

### 3. 不必出截图
功能层只要烟雾测试通过即可，不需要重复出三套视觉截图。

---

## commit message 建议
```
chore: 全站 LLM 统一锁定 DeepSeek-V4 Pro

- bazi/chat、bazi/marriage、huangli、meihua、music-oracle、music-oracle/generate
  统一切到 deepseek-v4-0324-pro（共 6 处）
- 同步重置 5 个断路器 key 加 -v4pro 后缀（bazi/huangli/meihua/liuyao/tarot）
  避免旧 OPEN 状态阻塞新模型
- detail-analysis 已是 V4 Pro 不动；daily 主线已 4b6759c 切过不动
- Frank 5/31 23:19 拍板 B 方案全站统一
```

---

## ⚠️ 我会校验的事项

完工后我会跑这 3 条 grep 确认改干净了：
1. `grep -rn "deepseek-v4-flash\|deepseek-ai/DeepSeek" src/ --include="*.ts"` — 应当为 0 行
2. `grep -rn "withCircuitBreaker('deepseek-[a-z]*'" src/ --include="*.ts"` — 应当为 0 行（全部带 -v4pro）
3. `grep -rn "deepseek-v4-0324-pro" src/ --include="*.ts"` — 应当 ≥ 8 行（6 + client.ts + detail-analysis）

通过则收单，不通过我会指出具体哪行漏改。

---

**END**
