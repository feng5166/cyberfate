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

---

# 增补(2026-06-18 ~ 06-22)

## 八字功能 review
- `docs/CODE_REVIEW_BAZI.md`:两轮针对八字的改进 review(算法/AI/前端),含起运、真太阳时、旺衰、用神、缓存串档、prompt 注入等;复审记录上游已按编号修复多条,并定性 T12(geju 用神非 bug)。

## 情绪陪伴 Agent「小满」设计(`docs/agent/`)
- `README.md`(导读)、`PRD-知己-P1.md`、`memory-design.md`(核心壁垒:记忆系统)、`api-chat-design.md`、`system-prompt-小满.md`。
- 定位:工具型→陪伴型;P1 极简验证"它记得我→留存";人设单一温暖知己;记忆每轮异步抽取、P1 不上向量。仅设计,未进实现。

## 测试与 CI
- 补齐 meihua/quota 低覆盖分支(+13 用例);收窄覆盖率统计范围至已测模块(行 95%+)。
- 修复 CI:验签逻辑抽到 `src/lib/payment/signature.ts`(上游移除路由非 handler 导出致测试失败),路由与测试共用 lib。

## 失效代码清理
- 删除 `middleware.ts`(L2:`request.geo` 已废弃、响应头无人消费、单区域部署使其无意义)。

## 订阅计划改造(2026-06-22)
**两档制 + 下架尊享版**,定价页按设计稿重构:
- **单日解锁** $9.99/天(原"基础版"改名,价不变)
- **年费会员** $69.9/年,划线原价 $299 + 早鸟优惠角标 + "永久锁定续费价"banner(原"专业版"$49→$69.9)
- **尊享版(lifetime)祖父条款下架**:Prisma 枚举与配置保留(存量有效、零迁移风险),`SELLABLE_PLAN_IDS` 仅 daily/yearly,`create-checkout` 加 `isSellablePlanId` 防护挡掉直接购买。
- 币种维持 USD/Stripe(图片仅作版式参考)。
- UI:`pricing-config.ts` 增 subtitle/perksTitle/audience/badge/lockPriceNote/originalPrice/sellable 字段;`PricingCard` 重构为竖排全宽卡片;`PricingCardList` 遍历可售列表竖向堆叠;`PricingClient` 标题"选择您的方案"+副标题+底部安全支付/`support@cyberfate.me`,FAQ 去除终身引用;`page.tsx` currentPlan 改传 plan id。
- 测试:`pricing-config.test.ts` 更新新价 + 可售列表断言;全量 310 绿。
- 提交 `95c1d05`(注:该提交因 `git add -A` 误并入维护者未提交的农历 DatePicker WIP,经确认编译/测试通过,用户选择保留)。

_由 Claude(Opus 4.8)整理 · 2026-06-22_
