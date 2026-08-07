# CyberFate 视觉设计系统

> 唯一视觉真源。所有页面与新功能开发遵守本文档；参考实现见 `src/app/page.tsx`（首页）与 `src/app/life-kline/PageClient.tsx`。
> 修订记录：2026-07-06 首版（首页视觉改版定稿后沉淀）。

## 1. 设计基调

**墨色纸面（Ink on Paper）**：温暖纸面底色 + 墨色文字为骨架，彩色只作为「点缀」出现在图标、色条、标签等小面积元素上，永不大面积铺色。整体克制、留白充分、细线条装饰。

## 2. 色彩

### 2.1 基础色（tailwind.config.ts `brand.*`）

| 用途 | 值 | Tailwind |
|---|---|---|
| 页面底色 | `#FAF9F6` | `bg-brand-bg` / `bg-[#FAF9F6]` |
| 墨色（文字/主按钮） | `#1C1A16` | `text-brand-ink` / `bg-brand-accent` |
| 主按钮 hover | `#3A352E` | `bg-brand-accent-hover` |
| 次级文字 | 墨色降透明 | `text-[#1C1A16]/55`（副标题）、`/70`（正文）、`/45`（弱注释） |
| 卡片边框 | 墨色 8% | `border-[#1C1A16]/8` |
| 色带分区底 | `#F6F4F1` | `bg-brand-accent-tint` |
| 浅灰衬底（卡内小块） | `#FAF9F6` | 卡内信息格用 |

### 2.2 模块点缀色板（唯一映射，勿另造）

每个模块一组 `{淡底 bg, 主色 fg}`，用于：图标圆底、hover 顶部色条、模块专属标签/徽章、页内小面积强调。

| 模块 | bg（淡底） | fg（主色） |
|---|---|---|
| 八字分析 | `#DBEAFE` | `#1D4ED8` |
| 每日运势 | `#FBF1D0` | `#B0870F` |
| 合婚配对 | `#FCE7F3` | `#BE185D` |
| 人生K线 | `#D1FAE5` | `#059669` |
| 梅花易数 | `#DCFCE7` | `#15803D` |
| 塔罗占卜 | `#E0E7FF` | `#4338CA` |
| 六爻占卜 | `#F3E7D3` | `#92400E` |
| 紫微斗数 | `#F3E8FF` | `#7E22CE` |
| 黄历/AI黄历 | `#FEE2E2` / `#CFFAFE` | `#DC2626` / `#0E7490` |
| 2026 生肖 | `#FEF3C7` | `#B45309` |

### 2.3 语义色

- 上升/吉/成功：emerald（`#059669`）；下降/凶/警示：red（`#DC2626`）；中性提示：amber（`#D97706`）
- K线图表专用：阳线 `#059669`、阴线 `#DC2626`、均线 `#D97706`（见 dataviz 约定）

## 3. 排版

- 标题：`font-display`，页级 H1 `text-3xl md:text-[40px] font-bold`，区块 H2 `text-2xl md:text-3xl`，卡片 H3/H4 `text-lg font-semibold`
- 标题区统一居中：H1 + `mt-3` 副标题（`text-sm md:text-base text-[#1C1A16]/55 tracking-wider`）
- 中文标题可加 `tracking-[0.08em]` 呼吸感；干支/四柱等符号性文字用 `font-display tracking-[0.12em]`
- 正文 `text-[14px] leading-relaxed text-[#1C1A16]/70`

## 4. 卡片

标准卡：
```
rounded-2xl border border-[#1C1A16]/8 bg-white
```
- 可点击/营销卡加悬停：`transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover`
- 模块色 hover 顶条（可点击卡）：
```jsx
<span aria-hidden className="absolute inset-x-0 top-0 h-[3px] origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300" style={{ background: fg }} />
```
（父元素需 `group relative overflow-hidden`）
- 图标容器：`w-[52px] h-[52px] rounded-full` + `style={{ background: bg }}`，图标 `strokeWidth={1.5}` + `style={{ color: fg }}`
- 卡内信息小格：`rounded-xl bg-[#FAF9F6] border border-[#1C1A16]/6 px-4 py-3`

## 5. 按钮

| 类型 | 样式 |
|---|---|
| 主按钮 | `bg-brand-accent text-white hover:bg-brand-accent-hover rounded-lg font-semibold tracking-[0.08em]` |
| 次按钮 | `bg-white border border-brand-ink/25 text-brand-ink hover:border-brand-ink hover:bg-[#FDFBF7] rounded-lg` |
| 文字链接 | `inline-flex items-center gap-1 hover:gap-2 transition-all`（箭头位移动效） |

**禁止**：大面积深色底块承载 CTA（已验证效果差）；彩色实心大按钮。

**主按钮体量规则**（2026-08-02 补充，多次用户反馈通栏黑条视觉差）：
- 页面级主 CTA **不做通栏全宽黑条**：桌面自适应宽度居中（`mx-auto sm:w-auto sm:min-w-[260px] px-10`），高度 `h-12` 上下；移动端可保留 `w-full` 易点性
- 弹窗/窄容器（≤28rem）内的主操作可用 `w-full` / `flex-1`（面积天然受限，不算大块）
- 营销/引流卡内一律用次按钮 + 模块色箭头（见八字页三张引流卡范式）

## 6. 装饰语言

- **细线罗盘**：品牌级装饰母题（圆环 + 24 刻度 + 可选十二地支字符），`stroke #1C1A16`、透明度 ≤6%、strokeWidth ≤1，可 240s 缓旋。用于 Hero 锚点、CTA 卡半出血角落。实现见 `src/app/page.tsx`
- **首字/干支水印**：卡片右下角超大字符水印 `font-display text-[56px] text-brand-ink/[0.05] select-none`
- **太极纹理**：全页 2.5% 透明度平铺（首页已有），新页面不必重复
- 所有装饰必须 `aria-hidden` + `pointer-events-none`，且放在 `overflow-hidden` 容器内

## 7. 页面骨架与节奏

1. 标题区（居中 H1 + 副标题，可带罗盘装饰）
2. 输入卡（白卡单行表单：DatePicker / Select / SegmentControl / 主按钮）
3. 结果区（白卡堆叠，`gap-4 md:gap-6`）
4. 营销区（核心功能 3 卡 / 使用步骤 3 卡 / FAQ `<details>` 手风琴）
5. 长页面用 `#F6F4F1` 色带区隔至少一个区块，避免整页单色
6. 收尾 CTA：白卡 + 左文右钮 + 罗盘纹理半出血（见首页终版）

## 8. 动效

- 入场：淡入上浮 `cfRise`（0.7s，错峰 0.05/0.16/0.28s）
- 悬停：卡片 `-translate-y-1` + 阴影；箭头 `gap-1→gap-2`；色条 `scale-x-0→100`
- 一律尊重 `prefers-reduced-motion: reduce`（动画关停）
- 禁止：大幅位移、弹跳、彩色闪烁

## 9. Do / Don't

- ✅ 彩色只出现在图标底、3px 色条、小标签上
- ✅ 装饰用 1px 细线 + ≤6% 透明度墨色
- ✅ 每页至少一处模块色点缀，让用户建立「色彩-模块」心智
- ❌ 大面积深色/彩色底块
- ❌ 渐变、玻璃拟态、重阴影
- ❌ 修改 `src/components/ui`、`tailwind.config.ts` 来实现单页效果（点缀色一律 inline style 十六进制，源于 §2.2 色板）
