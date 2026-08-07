# 八字分析 V2 · 产品需求文档

> 基线:2026-08-01 main 分支现状(V1 已上线:免费排盘 + 六板块流式 AI 解读(1次/日)+ VIP 追问 + 多人命盘档案 + 合婚/每日引流)。
> V2 主题:**把"命理百科全书"改成"对面坐着的命理师"——资产已算好 80%,接完最后 20% 并变现。**
> 配套阅读:`PRD-LIFE-KLINE-V2.md`(方法论同源)、`DESIGN-SYSTEM.md`(视觉规范)。

---

## 1. 背景与诊断

V1 工程底子全站最强:确定性引擎完整(格局/用神/大运/神煞/流年/刑冲会合),AI 链路成熟(工具链事实注入防幻觉 + 缓存 + 双模型回退 + 失败退配额 + 告警)。但产品形态存在七个结构性问题:

| # | 问题 | 证据 |
|---|------|------|
| D1 | 结果页 14 区块顺序长列表,按工程模块而非用户问题组织 | 议题式 tab 视图已计算未渲染(PageClient L1205 死代码) |
| D2 | AI 解读为 2000 字六板块长文一次性倾倒,免费 1 次/日全花在读不完的长文上 | 阅读完成率必然低(当前无埋点无法证实,见 D5) |
| D3 | 转化漏斗断层:免费长文 → 追问 VIP 硬 403,中间无体验层 | `/api/bazi/chat` 非 VIP 无门可入 |
| D4 | 分享半成品:按钮弹「开发中」,ShareCard 组件已做好但入口断 | `handleSharePlaceholder` |
| D5 | 全页仅 2 处埋点,漏斗全盲 | 对比人生K线页十余处 |
| D6 | 高价值计算结果未呈现:刑冲会合害、完整用神集、旺衰分、应期、闰月输入(引擎全通无 UI) | `analyzeInteractions` 只喂 AI 不给人看 |
| D7 | 「VIP 命盘档案无限」为假承诺,服务端硬卡 5 个 | profiles/route.ts 无 VIP 分支 |

## 2. 目标与非目标

**目标**(按优先序):
1. **首屏即断语**:排盘后 3 秒内让用户知道"我是什么盘、现在什么处境"(零 AI 成本)。
2. **议题式 AI**:长文拆六议题按需生成,免费额度从「1 篇长文」变「3 个议题」——感知更大、成本更低、触发更多。
3. **补齐漏斗中间层**:追问免费 1 次/日,先尝后买。
4. **接完半成品资产**:分享卡、刑冲可视化、应期、档案合盘、农历输入。

**非目标**:
- 不动排盘与 AI 工程链路主体(工具链/缓存/回退保持不变)。
- 亲子六亲缘分报告(基于档案的十神六亲分析)列为 V2.1,本期只做档案一键合盘。
- 不做真人服务、不做「化解」类目(伦理红线同 K线 PRD §8)。

**北极星指标**:议题点击率(排盘完成 → 首个议题生成)。护栏:议题式上线后 AI 解读→订阅转化率不得低于长文时代基线(靠 P0-C 埋点建基线)。

---

## 3. 功能设计

### P0-A 命盘速读 + 议题式 AI(转化根基)

**命盘速读**(免费,零 AI 成本):
- 结果区置顶新卡,模板合成三句话:①盘面定性(「{日主}日主,{格局},身{旺衰},喜{用神}忌{忌神}」白话化);②当下处境(当前大运干支 + `describeDayun` 吉凶 + 主题);③今年流年一句话(流年十神 + 与命局最重刑冲)。
- 全部字段现成(`mingGe`/`dayunTimeline`/`liunian`),新增 `src/lib/bazi/quickRead.ts` 纯模板函数。

**议题式 AI**:
- 六个议题入口卡替代「开始 AI 解读」单按钮:**事业攻守 / 财从何来 / 正缘何时 / 身体软肋 / 性格底色 / 十年大势**。点哪个流式生成哪个(300-400 字,复用 chat 路由已有的分析域 prompt 思路)。
- `/api/bazi/stream` 增加 `topic` 参数:带 topic → 单议题 prompt(max_tokens 1500),缓存键含 topic;不带 → 现有全文(改为 **VIP 专属「全盘详批」**)。
- 配额:**复用 `baziAiCount`,免费 3 议题/日**(游客 1 议题/日 IP 限);全盘详批 VIP 不限量不计数。工具链事实注入、回退、退配额机制沿用。
- 生成过的议题落本地(沿用 history 机制),切回不重复计费(缓存命中不扣配额——现有行为保持)。

**埋点**:`bazi_quickread_show` / `bazi_topic_click {topic}` / `bazi_topic_done {topic}` / `bazi_full_paywall_show`。

### P0-B 命格人设分享卡

- 操作栏「分享」接通现有 ShareCard(弹层形式),内容升级「命格人设卡」:主标题为人设一句话(如「辛金 · 七杀格——刀刃上开花的人」),新增 `src/lib/bazi/persona.ts`:格局 × 日主五行 → 人设文案模板(全组合覆盖,只写正向池,规范同 K线 PRD §8)。
- 卡面:人设标题 + 四柱 + 五行分布迷你条 + 二维码(`/bazi?ref=share`)+ 免责。
- **埋点**:`bazi_share_open` / `bazi_share_export`。

### P0-C 漏斗埋点补齐

六级漏斗:`bazi_paipan_complete` → `bazi_quickread_show` → `bazi_topic_click` → `bazi_topic_done` → `bazi_chat_try` → 订阅支付(已有)。另:`bazi_profile_switch`、`bazi_share_*`、paywall 曝光/点击。全部 `track()` 即打,无新基建。

### P1-A 追问免费 1 次/日

- `UsageQuota` 新增 `baziChatCount`(迁移 007);chat 路由门禁改三层:未登录 401 → 登录非 VIP 走 `atomicCheckAndConsume('baziChatCount', 1)`,超限 403 `SUBSCRIPTION_REQUIRED` → VIP 不限。
- `BaziChatSection` 移除客户端 `!isVip` 预拦截(改为发请求、按 403 弹升级)——**人生K线页问答同步受益**(组件共用)。
- 免费追问回答尾部由服务端追加一行:「今日免费追问已用完,会员不限次继续问 →」(仅非 VIP)。
- **埋点**:`bazi_chat_try {is_vip}` / `bazi_chat_paywall_show`。

### P1-B 档案一键合盘 + VIP 档案上限修复

- 档案选择器每个非当前档案加「与当前命盘合盘」action:把两个档案的出生信息写入 sessionStorage(合婚页已读 `selfBaziData`,新增 `otherBaziData` 预填对方),跳转 `/bazi/marriage` 自动带入双方。
- **修 D7**:档案上限免费 5 个、**VIP 20 个**,服务端 `profiles/route.ts` 按 `isUserVip` 真实生效,客户端文案同步。
- 亲子/六亲缘分报告 → V2.1(PRD 占位,不在本期)。
- **埋点**:`bazi_profile_hepan_click`。

### P1-C 刑冲会合害可视化

- 排盘 API 响应新增 `interactions`(`analyzeInteractions(chart)` 现成)。
- 新组件 `InteractionsCard`:四柱地支横排为节点,两两关系画弧线——合(绿)/会(蓝)/冲(红)/刑(琥珀)/害(灰),线上标关系名,下方逐条白话解释(日支者标「婚姻宫」加重提示,措辞走提醒框架)。无关系时显示「地支安静,命局平稳」。
- 位置:神煞卡之前。这是全站独有的专业感视觉,也是分享素材候选。
- **埋点**:`bazi_interactions_view`(卡片进入视口)。

### P1-D 应期卡(最强付费钩子)

- 新引擎 `src/lib/bazi/yingqi.ts`:扫描未来 10 年 `analyzeLiunian`,确定性提取四类应期:**婚缘**(配偶星透干/日支逢合)、**事业**(正官七杀透干)、**财运**(正偏财透干)、**谨慎年**(刑冲日支/岁运并临)。每条:年份 + 类型 + 一句白话依据。
- 排盘 API 返回 `yingqi`:**VIP 全表;非 VIP 服务端只返回最近 1 条**(权益服务端校验,不信任前端)。
- UI 卡「关键应期」:免费显示最近一条 + 模糊占位若干行 + 「解锁完整应期表」;VIP 全表按年份排。谨慎年措辞一律「提醒-蓄力」框架,禁恐吓词。
- **埋点**:`bazi_yingqi_view` / `bazi_yingqi_paywall_click`。

### P2 收尾三件

- **P2-A 人生K线引流卡**:合婚/每日引流卡旁加第三张,文案「把这个命盘画成百年运势曲线」→ `/life-kline`(出生信息已在 storage,K线页自动出图)。埋点 `bazi_to_kline_click`。
- **P2-B 农历/闰月输入 UI**:表单加「农历生日」checkbox(`isLunar` 全链路已通,只差这一个开关);勾选时日期标签变「出生日期(农历)」。
- **P2-C 死代码清理**:删除未渲染的 tab 视图(`ResultTab`/`tabContent`/`buildPoints`,PageClient L1205 一带)。

---

## 4. 商业化与门槛总表

| 能力 | 游客 | 免费登录 | VIP |
|------|------|------|------|
| 排盘 / 命盘速读 / 刑冲可视化 / 分享卡 | ✓ | ✓ | ✓ |
| 议题式 AI(6 议题) | 1 议题/日 | 3 议题/日 | 不限 |
| 全盘详批(六板块长文) | — | — | ✓ |
| AI 追问 | 弹登录 | **1 次/日** | 不限 |
| 应期表 | 最近 1 条 | 最近 1 条 | 全表 |
| 命盘档案 | 2(本地) | 5 | **20** |
| 档案一键合盘 | — | ✓(合婚页配额另计) | ✓ |

原则同 K线 PRD:**信任与传播免费(速读/可视化/分享),深度与颗粒度付费(全盘/应期全表/不限量)。**

## 5. 技术改动点汇总

| 层 | 文件 | 改动 |
|---|---|---|
| 引擎 | `src/lib/bazi/quickRead.ts`(新) | 速读三句话模板 |
| 引擎 | `src/lib/bazi/persona.ts`(新) | 格局×日主 人设文案 |
| 引擎 | `src/lib/bazi/yingqi.ts`(新) | 未来 10 年四类应期扫描 |
| API | `src/app/api/bazi/route.ts` | 响应加 `interactions` + `yingqi`(VIP 分层) |
| API | `src/app/api/bazi/stream/route.ts` | `topic` 参数/单议题 prompt/全文改 VIP/配额 3 议题 |
| API | `src/app/api/bazi/chat/route.ts` | 非 VIP 1 次/日(`baziChatCount`) |
| API | `src/app/api/bazi/profiles/route.ts` | VIP 上限 20 |
| DB | `prisma/schema.prisma` + 迁移 007 | `UsageQuota.baziChatCount` |
| UI | `src/app/bazi/PageClient.tsx` | 速读卡/议题入口/分享弹层/应期卡/K线引流/农历开关/删死代码/埋点 |
| UI | `src/components/bazi/QuickReadCard.tsx`(新)· `InteractionsCard.tsx`(新)· `YingqiCard.tsx`(新) | 三张新卡 |
| UI | `src/components/bazi/BaziChatSection.tsx` | 移除 `!isVip` 预拦截 |
| UI | `src/app/bazi/marriage/MarriagePageClient.tsx` | 读 `otherBaziData` 预填 |

测试基线:quickRead/persona/yingqi 纯函数确定性 + 边界命盘(无时辰/从格)无空槽;stream topic 模式配额与缓存键隔离;chat 三层门禁状态码。

## 6. 里程碑

| 阶段 | 内容 | 验收口径 |
|------|------|----------|
| M1(转化根基) | P0-A 速读+议题、P0-B 分享、P0-C 埋点 | 议题点击率基线建立;分享导出率基线 |
| M2(变现+专业感) | P1-A 免费追问、P1-B 档案合盘+上限、P1-C 刑冲可视化、P1-D 应期 | 追问尝试→订阅转化;应期 paywall 点击率 |
| M3(收尾) | P2-A K线引流、P2-B 农历、P2-C 清死代码 | 跨模块引流点击率 |

## 7. 风险与表述规范

1. **免费额度换算风险**:老用户习惯 1 篇长文/日,改为 3 议题/日总字数略降但触发次数升——上线后盯议题点击率与投诉;若反弹,可放宽为 4 议题/日(改常量即可)。
2. **表述规范**:应期谨慎年、刑冲解释一律「提醒-蓄力-给建议」框架,禁灾祸词;人设文案只写正向池;禁由任何负面结果导流「化解」消费。
3. **配额兼容**:`baziAiCount` 语义从「长文次数」变「议题次数」,历史数据无需迁移(按日重置);全盘详批不计数,VIP 无感。
4. **分享隐私**:人设卡不含出生日期明文(只有四柱干支),档案合盘 B 方信息仅 sessionStorage 传递。

---

_创建于 2026-08-01。V1 基线细节见本文件 §1 引用的代码位置。_
