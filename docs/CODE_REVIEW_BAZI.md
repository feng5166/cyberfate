# 八字(Bazi)功能改进 Review

> Reviewer:Claude(Opus 4.8)· 日期:2026-06-17 · 范围:`lib/bazi` 算法 + bazi/marriage/chat/timeline 路由 + AI 提示词 + 前端
> 方法:2 路并行审查(算法 / API-AI-前端)+ 头条结论逐条读码核实。标 ✅核实 为 reviewer 亲自验证。

## 摘要

四柱排盘本身可靠(委托 lunar-javascript,立春/节气换月/纳音/生肖都对)。问题集中在**手写的衍生分析**:起运伪造、旺衰评分缺因子、用神简化且未喂给 AI。按影响排序如下。

| 级别 | 数量 | 代表问题 |
|------|------|---------|
| 🔴 准确性 | 3 | 起运伪造、无真太阳时、旺衰缺因子 |
| 🟠 AI 一致性 | 4 | 用神没喂给 AI、伪造甲子时、prompts-v2 死代码、超时/abort |
| 🟡 体验/商业化 | 4 | 假付费墙、合婚白嫖、缓存串用户、JSON→文本→正则 |
| 🟢 代码/缺口 | 多项 | 五行表重复、any、流年/分享/历史缺口 |

---

## 🔴 准确性(命理结果会算错)

### A1 ✅核实 · 起运岁数是伪造的
`src/lib/bazi/calculator.ts:283, 349`
```ts
const startAge = 3 + ((month + day) % 3);  // 3/4/5,生日数字凑出来,无命理意义
```
整个大运时间轴(`getDayunTimeline`)和"当前大运"(`getCurrentDayun`)都锚在它上面 → 大运边界与 `isCurrent` 可能错好几年。**单点最大准确性 bug**。
**改法**:`lunar-javascript` 的 `EightChar.getYun(gender)` 已用正确的"节气数日、三日折一岁、顺/逆行"法算真实起运;`yun.getDaYun()` 直接返回大运数组(干支 + 起运岁)。替换两函数内部即可。注意 `getYun` 需精确时辰,要把 `birthHourNum`/`gender` 透传进去(现在这俩函数只收 date-only,重算时还丢了时辰——见 A2)。

### A2 · 八字无真太阳时校正(紫微却有)
bazi 把 `birthPlace` 当纯文本(`bazi/route.ts:50`)、从不换算;紫微已实现 `ziwei/calculator.ts:60-73` 的 `adjustTrueSolarTime`(`(longitude-120)*4` 分钟)。出生地远离 120°E 或临近时辰边界时**时柱可能错**,连带时干(五鼠遁)、旺衰、用神。`types.ts:135` 的 `trueSolarOffsetMinutes` 声明了却从未赋值。复用紫微 helper,接收结构化 `longitude`。

### A3 · 旺衰评分缺关键因子
`src/lib/bazi/geju.ts:128-185`
- **生我(印)藏支记 0 分**:`getDeDi` 只统计与日主同元素的藏干(`:155`),月支本气"生我"的不计 → 印重命被系统性低估。
- **月令权重不足**:`getDeLing` 最多 +30,而 `getDeDi` 能 +80(4 支×本气 20)→ 根多但月令不利的命会过评。
- **合/冲/三合局未考虑**:被冲掉的根仍算满分;申子辰等三合水局不识别。
- **阈值偏向偏强且无从格出口**:`≥40 偏强 / 10–39 中和 / <10 偏弱`,且 `calculateRizhuStrength` 永远不会输出从强/从弱(尽管 `GejuName` 含这俩),无根失令的命被当偏弱给印比劫——与从弱的正确用神相反。

### A4 · 用神缺调候 + 收敛成单元素
`geju.ts:225-265`(详见 IMPROVEMENT-TASKS T12:扶抑实现正确)。但纯扶抑无**调候**:丙火生子月、庚金生午月需调候用神(火暖/水润)无视旺衰。且中和分支按五行"出现次数最少"取用神,双重惩罚稀有元素。建议加 (日干×月支)→调候 查表,并返回**喜用神排序集**而非固定"我克=财"。

---

## 🟠 AI 一致性

### B1 ✅核实 · 确定性用神/十神没喂给 AI,让大模型自己重算(最大幻觉源)
`src/app/api/bazi/route.ts:233` 已算出权威 `mingGe`(用神/忌神/格局/旺衰)并返回 UI(`:247`),但 `generateBaziAnalysis`(`:160`)只传排盘;`buildBaziPrompt`(`prompts.ts:33,51`)还在指挥 AI"逐项判断得令/得地…自己定用神"。→ **AI 的用神可能和旁边 `DayMasterSummaryCard` 矛盾**。合婚 deep 报告同理(让模型自己找妻星/夫星)。
**改法**:把 `mingGe` + 逐柱十神作为**既定事实**注入 prompt,指令从"判断用神"改为"基于给定用神 X 展开"。消除矛盾 + 缩短 prompt(省钱)+ 提准确率。

### B2 ✅核实 · 未知时辰被伪造成「甲子时」
`bazi/route.ts:196-199`:hour 未知时替换为 `{gan:'甲', zhi:'子'}`。UI/分享卡显示具体甲子时,而 prompt 里写"时柱:未知"——自相矛盾,分享卡会传播错误八字。应端到端可空,显示"—/未知"。

### B3 ✅核实 · `prompts-v2.ts` 是死代码
无人 import,却与线上 `prompts.ts` 同名导出两套发散 prompt,改错文件会"改了没反应"。**直接删**。

### B4 · 超时预算矛盾 + abort 信号未接
外层 `withAiTimeout` 25s(`route.ts:158`)触发兜底,内层 `client.ts:27` 单次 55s×3 重试,且外层 signal 从未传进内层 fetch → 25s 返回兜底后上游仍烧 token。合婚 `?ai=deep`(`marriage/route.ts:889`)完全没接 `req.signal`(chat 路由 `:122` 接了)。统一端到端预算 + 透传 signal。

---

## 🟡 体验 / 商业化

### C1 · 付费墙是假的
`PageClient.tsx:1483-1574`:完整解读已随响应下发、仅用 CSS `max-h-0 opacity-0` 藏起,devtools 即可看全文。要么后端对非会员只返回摘要、升级后再取,要么免费别加弹窗。

### C2 · 合婚 deep 报告可零配额白嫖且无限流
`marriage/route.ts:697-706` 仅在 `!isAiRequest` 时扣配额;`?ai=deep` 跳过配额检查,且整条路由**无 `checkRateLimit`**。非 VIP 可直接拿最贵 5000-token 报告。加限流 + 把 deep 门控在 VIP 或已消耗配额。

### C3 · 缓存键会串用户
`client.ts:126` 只 hash `{birthDate, birthHour, gender}`,**漏农历标志/精确分钟/出生地** → 农历、精确时辰用户拿到别的命盘的缓存。改用**排盘(8 干支+性别)**做键(照搬合婚 `generateCacheKey` 写法)。

### C4 · AI 结构化 JSON → 拍平成文本 → 前端正则拆回
`route.ts:273 formatAnalysis` → `PageClient.tsx:186 extractAiSections` 正则按 `【标题】` 拆,措辞漂移即整段空白,后面还有 ~80 行启发式重排(`renderSectionContent`)补救。直接返回结构化对象,删掉这一整套。

---

## 🟢 代码质量 / 功能缺口

- **五行生克表重复 3–4 份**:`helpers.ts:18`、`geju.ts:56`、`marriage/route.ts:132`、`timeline/route.ts:13`;`calculateYongShen` 还内联第三套**反向**生我表(易写反)。收口到 `constants.ts`。
- **五鼠遁表重复**:`calculator.ts:28` 与 `ziwei/calculator.ts:393` 逐字相同。
- **lunar-javascript 边界全 `any`**(违背 strict);加 `.d.ts` 或薄包装。
- **十神/大运 4 套独立实现**(lib/bazi、timeline、marriage、shishen),改一处不传导。
- **功能缺口**:流年时间轴(timeline API 已算好,只在 /daily 用,没上八字页);真正的分享出图(现为"开发中"占位);登录用户服务端历史(现仅本地存 3 条);`FALLBACK_MODEL` 定义了却没接自动降级。

---

## 建议优先级:5 个「高杠杆 + 低风险」

1. **A1** 用 `getYun()` 替换伪造起运 —— 准确性最大单点提升,库已算好。
2. **B1** 把 mingGe/十神注入 prompt —— 消除 AI 与 UI 用神矛盾,还省 token。
3. **B3** 删 `prompts-v2.ts` —— 纯快赢。
4. **B2** 不再伪造甲子时柱 —— 防止错误八字传播。
5. **C3** 缓存键改用排盘 —— 防止串用户(照搬合婚写法)。

后续可分批做 A2/A3/A4(命理深度,建议先与产品/命理口径对齐)、B4/C1/C2(成本与商业化)、代码收口(五行/十神去重 + 类型化)。

_Bazi review by Claude · 2026-06-17_
