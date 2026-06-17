# CyberFate 单元测试设计方案

> 目标:从"无单测 + 复制粘贴式 .mjs 脚本"演进到"导入源码、可断言、可 CI"的分层测试体系。
> 日期:2026-06-16。配套:`CODE_REVIEW_2026-06-16.md`(多个 bug 正是缺测试所致)。

## 0. 现状与核心问题

| 现状 | 问题 |
|------|------|
| 无单测框架,仅 Playwright(轻量) | 业务/算法零回归保护 |
| `*.mjs` 脚本把 `constants.ts`/`calculator.ts` **复制**进脚本再跑 | **测的是副本不是源码**;源码 bug(如梅花取模 C2)抓不到 |
| `smoke-test.sh` 用 curl grep 页面 | 只能验"页面没挂",验不了正确性 |
| `quota/subscription/pricing/webhook` 零覆盖 | 收入/越权相关逻辑无保护(C1/H1/H2/M1/M2) |

**第一原则:测试必须 `import` 源码,严禁复制逻辑。** 否则等于没测。

---

## 1. 工具选型:Vitest

选 **Vitest**(而非 Jest / node:test):
- ESM + TS 原生(esbuild),无需 babel/ts-jest 配置,契合本项目 `"type":"module"` 风格与 Next 16。
- Jest 兼容 API(`describe/it/expect/vi`),迁移成本低。
- 内置 `vi.useFakeTimers()`/`vi.setSystemTime()`/`vi.mock()`,正好解决本项目的时间与外部依赖测试难点。
- 内置覆盖率(v8)、watch、并发。

```bash
npm i -D vitest @vitest/coverage-v8
# 可选(API/组件层):@testing-library/react jsdom msw
```

`package.json` 增加:
```json
"scripts": {
  "test": "vitest run",
  "test:watch": "vitest",
  "test:cov": "vitest run --coverage"
}
```

`vitest.config.ts`:
```ts
import { defineConfig } from 'vitest/config'
import path from 'node:path'

export default defineConfig({
  test: {
    environment: 'node',           // lib 层用 node;组件测试再单独配 jsdom
    include: ['src/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/lib/**'],     // 先聚焦核心库
      thresholds: { lines: 80, functions: 80, branches: 70 },
    },
  },
  resolve: { alias: { '@': path.resolve(__dirname, 'src') } }, // 复用 tsconfig 的 @ 别名
})
```

---

## 2. 测试金字塔(按 ROI 排序)

```
        ┌─────────────┐
        │  E2E (少)    │  Playwright:登录→付费→出报告 等关键流
        ├─────────────┤
        │ API 路由 (中) │  校验/鉴权/配额门/错误路径(mock auth+db+ai)
        ├─────────────┤
        │ 业务逻辑 (重) │  配额原子性/订阅/proration/验签(mock prisma+redis)
        ├─────────────┤
        │ 纯算法 (最重) │  八字/紫微/黄历/六爻/梅花/五行/定价 —— 无 mock,确定性
        └─────────────┘
```

**优先级 P0 = 最底层"纯算法"**:确定性、无外部依赖、bug 密度最高(review 的 C2/L1 都在这层),投入产出比最高。

---

## 3. 分层设计

### 3.1 纯算法层(P0,先做)

对象:`src/lib/bazi`、`ziwei`、`huangli`、`liuyao`、`marriage`、`music-oracle/wuxing-music-map`、`meihua`(建议先抽算法出 route)、`pricing-config`。

手法:
- **表驱动 / 黄金用例(golden tests)**:已知输入 → 已知正确输出。把现有 `.mjs` 的批量数据转成带断言的 fixture。
- **属性测试(property tests)**:对取模/区间类逻辑,断言不变量,覆盖 `.mjs` 漏掉的边界:
  - 八卦下标永远 ∈ [0,7] 且 `数字↔卦` 双射;
  - 动爻 ∈ [1,6];天干 `year%10`、地支 `%12` 永不越界;
  - 任意生日 → 四柱干支都在合法集合内。
- **边界用例**:时辰"未知"/`-1`、晚子时、闰月、1920/2100 边界、跨年龄大运切换。

**示例 A — 能抓到 C2 梅花取模 bug 的测试**(数字起卦 1↔乾、8↔坤):
```ts
// src/lib/meihua/draw.test.ts  (前提:把算法从 route 抽到 lib)
import { resolveNumberDraw, BAGUA } from '@/lib/meihua/draw'
import { describe, it, expect } from 'vitest'

describe('梅花数字起卦', () => {
  // 先天八卦数:乾1 兑2 离3 震4 巽5 坎6 艮7 坤8
  it.each([
    [1, '乾'], [2, '兑'], [3, '离'], [4, '震'],
    [5, '巽'], [6, '坎'], [7, '艮'], [8, '坤'],
    [9, '乾'], [16, '坤'],          // 取模回绕
  ])('数字 %i → 上卦 %s', (num, name) => {
    const { upperIndex } = resolveNumberDraw(num, num)
    expect(BAGUA[upperIndex].name).toBe(name)   // 当前实现这里会红 → 暴露 off-by-one
  })

  it('动爻恒在 1..6', () => {
    for (let a = 1; a <= 50; a++) for (let b = 1; b <= 50; b++) {
      const { movingLine } = resolveNumberDraw(a, b)
      expect(movingLine).toBeGreaterThanOrEqual(1)
      expect(movingLine).toBeLessThanOrEqual(6)
    }
  })
})
```

**示例 B — 八字四柱黄金用例**(导入真实 `calculateBazi`):
```ts
// src/lib/bazi/calculator.test.ts
import { calculateBazi } from '@/lib/bazi'
import { describe, it, expect } from 'vitest'

// 用权威排盘/lunar-javascript 交叉核对后固化为 fixture
const CASES = [
  { birthDate: '1990-06-15', birthHour: '午时', gender: 'male',
    expect: { year: '庚午', month: '壬午', day: '丙子', hour: '甲午' } },
  // ...把 bazi-batch-test.mjs 的批量数据迁移到这里,带断言
]

it.each(CASES)('八字四柱 $birthDate', (c) => {
  const r = calculateBazi(c.birthDate, c.birthHour, c.gender)
  expect(`${r.year.gan}${r.year.zhi}`).toBe(c.expect.year)
  expect(`${r.day.gan}${r.day.zhi}`).toBe(c.expect.day)
})

it('时辰"未知"不抛错且时柱降级', () => {
  expect(() => calculateBazi('1990-06-15', '未知', 'male')).not.toThrow()
})
```

### 3.2 时间 / 随机性 —— 先让代码可测,再测

本项目大量 `new Date()` 与 tarot 的 `Math.random()` 抽牌,既是 review 里的时区 bug 源(L1/H1),也让测试不确定。两步走:

1. **重构为可注入**:计算函数接收 `now: Date`(或注入 `getBeijingNow()`);抽牌接收 `rng: () => number`。改完同时修掉时区 bug——一举两得。
2. 测试用 `vi.setSystemTime(new Date('2026-06-16T00:30:00+08:00'))` 固定时间,断言"北京 0:30 仍算 6-16",专门覆盖 UTC 0–8 点回退 bug。

```ts
it('北京时间 00:30 的"今天"是当天而非前一天(防 UTC 回退)', () => {
  vi.useFakeTimers(); vi.setSystemTime(new Date('2026-06-16T00:30:00+08:00'))
  expect(getBeijingDateString()).toBe('2026-06-16')
  vi.useRealTimers()
})
```

### 3.3 业务逻辑层(P1,mock 外部依赖)

对象:`quota.ts`、`subscription.ts`、proration 计算、webhook 验签。Mock Prisma 与 Upstash。

- **配额原子性(H2)**:断言 `checkBaziQuota` 的 `updateMany({where:{baziAiCount:{lt:limit}}})` 在超限时返回 0 行 → 拒绝;并发场景用并行 Promise 模拟。
- **isVip / 过期(H3)**:`expireAt` 临界、缓存 TTL、跨用户不串。
- **proration(M4)**:属性测试——抵扣比例恒 ∈ [0,1]、`proratedAmount ≥ 0`、daily(duration=1)不溢出。
- **Webhook 验签**:正确签名通过、篡改 body/错签名拒绝、时间戳超窗拒绝、重复 `transactionId` 幂等。

```ts
// src/lib/pricing-config.test.ts —— 纯函数 proration 属性测试
it.each([['daily','lifetime'],['daily','yearly'],['yearly','lifetime']])(
  '%s→%s 的 proration 比例恒在 [0,1]', (from, to) => {
    for (let d = 0; d <= PRICING_CONFIG[from].duration; d++) {
      const ratio = computeRemainingRatio(from, d)   // 建议抽出的纯函数
      expect(ratio).toBeGreaterThanOrEqual(0)
      expect(ratio).toBeLessThanOrEqual(1)
    }
})
```

Mock 示例:
```ts
vi.mock('@/lib/db', () => ({ prisma: { usageQuota: { updateMany: vi.fn() } } }))
```

### 3.4 AI 集成层(P1,只测确定性部分,绝不调真模型)

`src/lib/ai/client.ts` 的非网络部分恰好是最该测的:
- **JSON 解析 + 兜底**:喂入"合法 JSON / 截断 JSON / 含 reasoning_content / 纯文本",断言 `buildFallback*` 优雅降级、字段长度 clamp。
- **缓存键**:同输入同键、不同用户出生信息不同键、键里无明文 PII(断言是 sha256)。
- **超时/重试/熔断**:`vi.useFakeTimers` 推进时间,mock `fetch` 抛 Abort,断言重试次数与 4xx 不重试。

```ts
it('模型返回截断 JSON 时走 fallback 不抛错', () => {
  const r = parseBaziAnalysis('{"日主":"丙火","事业":')  // 残缺
  expect(r).toMatchObject({ 日主: expect.any(String) })   // 兜底结构存在
})
```

### 3.5 API 路由层(P2,集成-lite)

Mock `getServerSession`/`prisma`/AI client,直接调用路由 handler,断言:
- **输入校验**:非法 `birthDate`/超长 `question`/六爻非 6 位 → 400。
- **鉴权/配额门**:未登录 → 401;超配额 → 403(C3:六爻/梅花/每日运势补门后回归测试)。
- **越权(IDOR)**:用户 A 改 B 的订阅 → 拒绝。

### 3.6 E2E(P3,Playwright,少而关键)

3–5 条主干:注册登录、八字出盘、塔罗抽牌出解读、付费 checkout(Stripe test mode)、配额耗尽提示。

---

## 4. 目录与命名

- **库/逻辑**:与源码同目录 `src/lib/bazi/calculator.test.ts`(就近,易维护)。
- **fixtures**:`src/lib/<mod>/__fixtures__/*.ts`(黄金用例数据)。
- **E2E**:`e2e/*.spec.ts`(Playwright,与 vitest `include` 隔离)。
- 退役根目录 `*.mjs`:把数据迁入 fixtures 后删除,杜绝"复制粘贴测试"复活。

---

## 5. 落地路线(建议 4 个迭代)

| 阶段 | 内容 | 验收 |
|------|------|------|
| **S1** 框架+止血 | 装 Vitest、配 alias、迁移 1 个模块(meihua 抽算法 + 测试抓 C2) | `npm test` 跑通,C2 用例红→修复后绿 |
| **S2** 纯算法全覆盖 | bazi/ziwei/huangli/liuyao/marriage/music 黄金+属性用例;时间可注入修 L1 | `src/lib` 计算类覆盖 ≥85% |
| **S3** 业务逻辑 | quota/subscription/proration/webcheck + mock 回归 C1/H1/H2/M1/M2 | 收入相关逻辑全绿 |
| **S4** API+CI | 路由校验/鉴权层 + GitHub Actions 跑 `test:cov`,纳入 `scripts/run-build.js` 前置 | PR 必过测试门 |

**覆盖率目标**:`src/lib` 计算/业务 ≥85%,整体 lib ≥70%;UI 不强求。质量看"是否覆盖分支与边界",不唯数字。

---

## 6. 关键收益

- 每个 review 发现的 bug 都配一个回归用例,改完永不复发(C2/H2/M1/M2/L1…)。
- 重构(统一时间 helper、统一 isVip、梅花复用 liuyao)有了安全网。
- 把"复制粘贴 .mjs"换成"导入源码的断言测试",测试才真正有意义。

_测试方案 by Claude · 2026-06-16_
