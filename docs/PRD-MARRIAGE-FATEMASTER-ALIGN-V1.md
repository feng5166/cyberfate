# PRD - 合婚页全量对齐 FateMaster V1

> 作者：产品虾 | 日期：2026-06-01 | 状态：待开发
> 触发：Frank 拿 FateMaster 合婚页对比 CyberFate /bazi/marriage，要求改成 FateMaster 那样
> 决策：Frank 已确认「默认先做完整复刻进行全量对齐，后面再来优化」
> 【实现范围 2026-06-01 23:43 拍板】Frank 选 **方案A 真全量对齐**：本期就把阳历/农历切换、时分两级、早晚子时、知道出生时间开关从零实现，并同步加到八字主表单，两边粒度一致。
> 【依赖确认】农历转换库已存在：`lunar-javascript ^1.7.7`（八字/紫微/黄历计算均在用），无需新装，直接复用。

## 一、目标

合婚页 /bazi/marriage 从当前「简单 6 字段表单」全量复刻对齐 FateMaster 的「专业命理工具表单」。
本期=全量功能对齐 + 双栏布局 + 三卡片模块，不做超出 FateMaster 的创新（后面再优化）。

## 二、现状 vs 目标差距

涉及文件：
- 合婚页：`src/app/bazi/marriage/page.tsx`（当前 324 行）
- 合婚接口：`src/app/api/bazi/marriage/route.ts`（需同步扩字段）
- 可复用数据源：`src/app/bazi/PageClient.tsx`（已有 gender/birthPlace/birthHour/lunarDate 完整实现 + localStorage 历史记录系统，最多 3 条）

当前合婚 formData 仅 6 字段：maleName/maleBirthDate/maleBirthHour + female 三项。

| FateMaster 有 | 我们现状 | 本期动作 |
|--------------|---------|---------|
| 阳历/农历 Tab 切换 | 仅阳历 | 补，复用八字主表单 lunar 逻辑 |
| 性别下拉（男女方各一） | 无 | 补 |
| 「从记录填充」按钮（男女方各一） | 无 | 补，复用 localStorage 历史记录系统 |
| 知道出生时间开关 + 时/分两级下拉 | 仅粗时辰下拉 | 补 |
| 早晚子时开关 | 无 | 补 |
| 出生地点输入（真太阳时校正） | 无 | 补，复用八字主表单 birthPlace |
| 男女信息桌面双栏并排 | 上下堆叠 | 改双栏（桌面），移动堆叠 |
| 智能匹配/全面解析/发展参考 三卡片 | 无 | 补 |
| 合婚分析维度 4 项 | 已有 4 项 | 维度名对齐 FateMaster（见下） |

## 三、详细需求

### 3.1 表单字段全量补齐（男女方对称）

每方字段（male/female 各一套）：
1. 姓名（已有，保留）
2. 性别下拉——复用八字主表单 gender 实现，男方默认男、女方默认女，可改。
3. 阳历/农历切换 Tab——复用八字主表单 lunar/solar 切换逻辑。
4. 出生日期（已有 DatePicker，保留，受阳历农历切换影响）。
5. 知道出生时间开关——开=显示时/分两级下拉 + 早晚子时开关；关=按默认（午时）处理，提示精度下降。
6. 出生时辰/时分——复用八字主表单 birthHour（精细化到时分两级）。
7. 早晚子时开关——命理专业项，复用主表单逻辑（若主表单有；无则按 FateMaster 加 boolean）。
8. 出生地点输入——复用八字主表单 birthPlace（真太阳时校正）。
9. 「从记录填充」按钮——读 localStorage 历史命盘记录列表，点击弹选择/直接填最近一条，把该记录的 name/gender/birthDate/birthHour/birthPlace/lunarDate 灌入对应方表单。复用 PageClient 已有的 loadFromHistory 逻辑。

实现优先级：
- 可复用的：性别 SegmentControl、DatePicker、出生地 CitySearch、历史记录系统（@/lib/utils/history，loadRecords/getRecordById，key cyberfate_bazi_history，最多3条）——直接复用。
- 需从零新建的（A 方案本期做）：阳历/农历切换 Tab（用 lunar-javascript 做农历↔阳历转换）、知道出生时间开关、时/分两级下拉、早晚子时开关。
- 一致性要求：这些新字段在「合婚页 + 八字主表单」同步实现，两边粒度一致，避免未来更乱。八字主表单（src/app/bazi/PageClient.tsx）同步升级到相同字段。

### 3.2 布局——桌面双栏并排

- 桌面端（md 以上）：男方表单 | 女方表单 左右双栏并排。
- 移动端：上下堆叠（现状）。
- 沿用 Frank 设计规范：暖米白底 #FAF9F6、衬线标题、禁纯黑底选中态、边框/淡底高亮。

### 3.3 三卡片价值说明模块

在「开始合婚」按钮区附近加三卡片（图标 + 标题 + 一句说明），对齐 FateMaster：
- 智能匹配
- 全面解析
- 发展参考
（文案可参照 FateMaster 语义本地化撰写）

### 3.4 合婚分析维度命名对齐

FateMaster 4 维度：基础契合度 / 性格相容性 / 婚配宫位 / 家庭和谐。
我们现状 4 维度：性格契合 / 感情发展 / 事业财运 / 子女与家庭。
本期：维度名对齐 FateMaster（基础契合度/性格相容性/婚配宫位/家庭和谐），同步改前端展示 + 后端 prompt 输出维度 key。

### 3.5 后端接口同步

`src/app/api/bazi/marriage/route.ts` 接收的 body 扩展新增字段（gender/lunar/birthPlace/birthMinute/早晚子时/knowTime），传给八字计算+AI prompt。prompt 输出维度对齐 3.4。

## 四、验收标准

1. 男女方表单字段全量对齐 FateMaster（性别/阳历农历/从记录填充/知道时间开关/时分两级/早晚子时/出生地点）。
2. 「从记录填充」能正确读 localStorage 历史记录并灌入对应方。
3. 桌面双栏并排、移动堆叠。
4. 三卡片模块存在。
5. 分析维度命名对齐 FateMaster。
6. 后端接口接收并使用新字段，合婚结果正常返回。
7. agent-browser 真机截图：桌面双栏 + 移动堆叠各一张，并实测「从记录填充」+ 提交一次合婚拿到结果。
8. tsc 通过、console 无 error。

## 五、注意事项（A 方案）

- 农历转换统一用项目已有的 lunar-javascript，不另装库。参考 src/lib/bazi/calculator.ts 现有用法保持一致。
- 【全站一致性】新字段（阳历农历切换/时分两级/早晚子时/知道时间开关）同步加到八字主表单 src/app/bazi/PageClient.tsx，两边表单粒度一致。
- 时分两级 + 早晚子时 要同步传到后端排盘（影响时柱），不能只改前端 UI。
- 知道出生时间开关关闭时的降级逻辑（无时辰）要与现有一致，给精度下降提示。
- 历史记录本地最多 3 条，「从记录填充」无记录时给友好空态提示，不报错。
- 不破坏现有合婚结果展示模块。
- 沿用 Frank 设计规范（暖米白底、禁纯黑底选中态、边框淡底高亮）。
