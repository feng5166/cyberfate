# CyberFate · 改进任务清单

> 来源:`PRD-REVERSE-ENGINEERED.md` 第 7 节"风险/待办"。按优先级排序。
> 状态:☐ 待办 / ◐ 进行中 / ☑ 完成。生成于 2026-06-16。

## P0 · 文档与认知一致性(低成本、高收益)

- [ ] **T1 重写 README.md**:删除"等待需求""技术栈待确定";补真实技术栈、功能、启动命令。(本轮已处理)
- [ ] **T2 重写 CLAUDE.md**:状态从"M1 技术搭建"更新为实际上线规模;AI 由"Claude 3.5 Sonnet"改为"DeepSeek v4-pro 为主 + Claude Sonnet 仅深度分析";Next.js 14→16。(本轮已处理)
- [x] **T3 清理误导注释**:`src/lib/music-oracle/generate.ts` 的 `callClaudeAPI` → `callDeepSeekAPI`,两处"调用 Claude API"注释改为 DeepSeek。`daily/detail-analysis` 经核实主用 DeepSeek、Claude 仅兜底,文档措辞已同步修正。

## P1 · 商业化策略缺口

- [ ] **T4 多币种与国内支付**:受众含微信用户,但定价仅 USD、支付仅 Stripe。
  - 决策:是否对国内用户启用微信/支付宝(`PayMethod` 枚举已占位)+ CNY 定价?
  - 若是:打通 `payment/callback`、回调验签、对账;`pricing-config` 增加币种维度。
- [ ] **T5 配额维度统一**:`UsageQuota` 仅覆盖八字 + 塔罗(单/三张)。六爻、梅花、音乐签、合婚 QA 等 AI 功能免费用量边界不一致。
  - 方案:抽象统一的"AI 调用计量"(按 feature 维度计数),付费墙逻辑集中化。

## P2 · 体验对齐与功能补强

- [ ] **T6 紫微斗数加 AI 解读**:目前纯算法,与八字/塔罗体验落差大。
  - 复用 `src/lib/ai` 模型层 + 缓存,新增 `/api/ziwei` 解读分支与配额。
- [ ] **T7 每日运势模型统一性评估**:深度分析用 Claude、主运势用 DeepSeek,成本/体验需评估是否统一或保留分层。
- [ ] **T8 时区一致性审计**:多模块以北京时间定义"今日"。审计跨时区用户的每日重置/缓存键是否一致(配额、daily、today、music-oracle)。

## P3 · 工程健壮性

- [ ] **T9 AI 回退可观测**:统计各模块模板回退率(模型不稳定信号),接入 PostHog/Feishu 告警阈值。
- [ ] **T10 分享隐私审计**:塔罗/音乐签分享图(`@vercel/og`)确认不泄露账号/生辰隐私。
- [ ] **T11 配额竞态回归测试**:为 `updateMany` 原子计数补并发测试(已有 `*.mjs` 批测脚本可扩展)。

---

## 建议执行顺序

1. **本周**:T1–T3(文档/注释,已动手)→ 立即消除认知偏差。
2. **下个迭代**:T4–T5(商业化策略,需产品决策)。
3. **随后**:T6–T8(体验对齐)。
4. **持续**:T9–T11(健壮性)。

> T4、T7 含产品/商业决策,建议先与产品方对齐再排期。

---

## 测试落地进展(2026-06-17 追加)

- [x] **S1** Vitest 接入 + 梅花 C2 回归(红→绿,已修复并去重)。
- [x] **S2** 纯算法层:bazi / ziwei / huangli / liuyao / music-oracle / marriage 共 ~190 用例(黄金值经 lunar-javascript 交叉核对,复杂派生值标注 characterization)。
- [x] **S3** 业务逻辑层:quota 原子性、isVip/缓存、proration 不变量、Stripe/callback 验签共 46 用例(mock prisma/redis)。
- [x] **S4** API 路由层:meihua/liuyao/bazi 的校验/鉴权/配额门 20 用例(mock auth/db/ai)+ GitHub Actions 测试门(`.github/workflows/test.yml`)。
- 合计 **235 用例全绿**。源码改动仅 export-only(ziwei 7 处、payment 验签 2 处),零行为变更。

### T12 ✅已核查—非 bug · geju 用神/忌神语义
初判 `calculateYongShen` 把"克泄耗"的克写成了我克。复核后确认**实现正确**:"克泄耗"含克(官杀)、泄(食伤)、耗(财)三类,代码以"财(耗)= WUXING_CONTROL[日主]"作为代表项,财本就是克泄耗之一,属合法简化。身强用财(耗)、身弱忌财(耗),内部逻辑自洽。测试已改为明确断言正确行为(`geju.test.ts`),无需改源码。

_任务清单 by Claude · 2026-06-16(测试进展 2026-06-17 追加)_
