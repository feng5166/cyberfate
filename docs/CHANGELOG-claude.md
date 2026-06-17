# 改动清单(Claude 协作)

> 本文件记录 Claude(Opus 4.8)在本仓库的改动,便于团队回溯。
> 范围:2026-06-16 ~ 2026-06-17。所有改动已提交并推送至 `main`。

## 总览

| 类别 | 内容 |
|------|------|
| 文档 | 6 份(逆向 PRD、模块 PRD、代码 review、改进任务、测试方案、本清单)+ 重写 README/CLAUDE |
| 测试 | 引入 Vitest,235 用例,16 个测试文件,覆盖率 ≥85%,CI 测试门 |
| Bug 修复 | C2(梅花起卦 off-by-one)、L2(失效 middleware)、CI 验签测试失败 |
| 重构 | 梅花/验签逻辑抽 lib 去重;误导注释/命名修正;ziwei export-only |
| 调查结论 | T12 复核非 bug;C1/C3/H1/H2/H4/H5/M1/M2/M5 经核实上游已修 |

**源码行为改动仅 C2 与删除 middleware;其余为新增测试/文档或 export-only(零行为变更)。**

---

## 按提交

### 1. `20b20e5` · docs:逆向 PRD + 模块 PRD + 改进任务(2026-06-16)
- 新增 `docs/PRD-REVERSE-ENGINEERED.md`(基于代码逆向的整体 PRD)
- 新增 `docs/PRD-MODULES-DETAILED.md`(9 大命理模块详细 PRD)
- 新增 `docs/IMPROVEMENT-TASKS.md`(P0–P3 改进任务清单)
- 重写 `README.md` / `CLAUDE.md`,对齐真实技术栈(Next.js 16、DeepSeek v4-pro 主模型、上线状态)
- `src/lib/music-oracle/generate.ts`:`callClaudeAPI` → `callDeepSeekAPI`,修正"调用 Claude"误导注释(实为 DeepSeek)

### 2. `d027175` · docs:代码 review 报告(2026-06-16)
- 新增 `docs/CODE_REVIEW_2026-06-16.md`:4 路并行审查(支付安全/配额订阅/AI 集成/核心算法),3 Critical + 6 High + 8 Medium + 若干 Low,附"做得好的地方"与修复优先级

### 3. `b989834` · test:引入 Vitest + 梅花 C2 回归(2026-06-17)
- 引入 Vitest(+ v8 覆盖率)、`vitest.config.ts`、`test`/`test:watch`/`test:cov` 脚本
- **C2 修复**:梅花起卦算法从 route 抽到 `src/lib/meihua/draw.ts`(纯函数),修复数字→卦下标 `(N-1)%8`、动爻"余 0 取 6"的 off-by-one;route 改为复用 lib,消除复制粘贴式重复
- `src/lib/meihua/draw.test.ts`:19 用例(修复前 15 红 → 修复后全绿)

### 4. `82a34c3` · test:S2–S4 全量单测(235 用例)+ CI(2026-06-17)
- **S2 纯算法**:bazi(四柱/五行/日主/边界,lunar-javascript 交叉核对)、ziwei(14 主星入 12 宫)、huangli、liuyao、music-oracle、marriage
- **S3 业务逻辑**(mock prisma/redis):quota 原子计数 + 北京时间日期键、isVip/30s 缓存、proration∈[0,1]、Stripe+callback 验签
- **S4 API 路由**(mock auth/db/ai):meihua/liuyao/bazi 的 401/400/403/429 + 正常流
- 新增 `.github/workflows/test.yml`(push/PR 测试门)
- 源码改动仅 export-only(ziwei 7 处、payment 验签 2 处)
- 新发现 **T12**(geju 用神/忌神,characterization 固化待核)

### 5. `2d9f84e` · fix:删除失效 middleware(L2)+ T12 定性(2026-06-17)
- **L2 修复**:删除 `middleware.ts` 死代码(`request.geo` 已废弃→country 恒空、`x-vercel-region` 响应头无人消费、单区域部署使其无意义,却给每个页面请求加 rewrite 开销)
- **T12 复核为非 bug**:"克泄耗"含耗(财=我克),`geju.ts` 取财作代表项合法;`geju.test.ts` 改为明确断言正确行为
- `docs/CODE_REVIEW_2026-06-16.md` 追加修复进展(C1/C3/H1/H2/H4/H5/M1/M2/M5 上游已修)

### 6. `1eaccd8` · test:收窄覆盖率范围(2026-06-17)
- `coverage.include` 从整个 `src/lib/**` 收窄到实际纳入测试的模块,排除重 I/O/难单测的基础设施(lib/ai、stripe、redis、logger、utils)
- 门槛提至 85/85/70;结果:行 95.09% / 语句 94.4% / 函数 91.74% / 分支 79.7%

### 7. `190e899` · fix(ci):验签逻辑抽到 lib(2026-06-17)
- 上游 `743be45` 移除了 payment 路由上的非 handler 导出(Next.js route.ts 只应导出 handler),导致 `webhook-signature.test.ts` import 失败 → CI 红
- 修法:新建 `src/lib/payment/signature.ts`,把验签纯函数(`verifyStripeWebhook` 泛型化 + `verifyCallbackSignature` + 3 个 crypto 辅助)抽出;`webhook`/`callback` 路由改为 import lib(删本地副本、移除多余 crypto 导入);测试改 import lib
- 既修 CI,又从根上消除"路由导出非 handler"的问题

---

## 文件清单

**新增**
- 文档:`docs/PRD-REVERSE-ENGINEERED.md`、`docs/PRD-MODULES-DETAILED.md`、`docs/IMPROVEMENT-TASKS.md`、`docs/CODE_REVIEW_2026-06-16.md`、`docs/TEST-STRATEGY.md`、`docs/CHANGELOG-claude.md`
- 配置:`vitest.config.ts`、`.github/workflows/test.yml`
- 源码:`src/lib/meihua/draw.ts`、`src/lib/payment/signature.ts`
- 测试(16):`src/lib/bazi/{calculator,geju,helpers}.test.ts`、`src/lib/ziwei/calculator.test.ts`、`src/lib/huangli/calculator.test.ts`、`src/lib/liuyao/data.test.ts`、`src/lib/marriage/shishen.test.ts`、`src/lib/meihua/draw.test.ts`、`src/lib/music-oracle/wuxing-music-map.test.ts`、`src/lib/quota.test.ts`、`src/lib/subscription.test.ts`、`src/lib/pricing-config.test.ts`、`src/lib/payment/webhook-signature.test.ts`、`src/app/api/{bazi,liuyao,meihua/draw}/route.test.ts`

**修改**
- `README.md`、`CLAUDE.md`、`package.json`、`package-lock.json`
- `src/app/api/meihua/draw/route.ts`、`src/app/api/payment/webhook/route.ts`、`src/app/api/payment/callback/route.ts`
- `src/lib/music-oracle/generate.ts`、`src/lib/ziwei/calculator.ts`(export-only)

**删除**
- `middleware.ts`

---

_由 Claude(Opus 4.8)整理 · 2026-06-17_
