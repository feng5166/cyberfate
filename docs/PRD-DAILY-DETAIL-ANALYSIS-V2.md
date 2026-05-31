# PRD: 每日运势详细分析 v2.0 - 替换今日卦象 + 完整视觉设计

**模块代号**: `daily-detail-analysis`
**所属页面**: `/daily`
**版本**: v2.0（v1 基础上：替换今日卦象 + 视觉全面落地 + 风格决策）
**作者**: 🦐 产品虾
**日期**: 2026-05-31
**来源**: Frank 5/31 16:44 飞书参考图
**优先级**: P0（本周）
**状态**: 待开发（代码虾主，美术虾配合视觉走查）

---

## 0. 本次版本要做什么

Frank 5/31 发的参考图 = 「每日运势详细分析」入口卡片视觉规范。

**v2 相对 v1 的三个变化：**

1. **页面集成**：原 `/daily` 页面的「今日卦象」卡片（米白底+赭橙描边，跳 `/liuyao`）→ **替换为** `DailyDetailAnalysis` 组件（已经写好但未挂载）
2. **视觉重做**：组件现有视觉（暖米白底+赭橙 CTA）不符合 Frank 参考图（白底+黑色 CTA+灰描边）→ **重做 4 个状态的视觉**
3. **风格决策点**：是否全站走向"黑白极简"风？还是仅本卡片采用？（见 §10 - 必须 Frank 拍板）

---

## 1. 现状盘点

### 1.1 已存在的资产
| 资产 | 路径 | 状态 |
|------|------|------|
| `DailyDetailAnalysis` 组件 | `src/components/daily/DailyDetailAnalysis.tsx` | ✅ 功能完整（idle/loading/done/exhausted 4 态、流式、历史抽屉、限频 UI） |
| 生成 API | `src/app/api/daily/detail-analysis/route.ts` | ✅（v1 验收过） |
| 历史 API | `src/app/api/daily/detail-history/route.ts` | ✅ |
| Prompt 模板 | `src/lib/ai/prompts-daily-detail.ts` | ✅ 4 段式 |
| PRD v1 | `docs/PRD-DAILY-DETAIL-ANALYSIS-V1.md` | ✅ 已对齐 |

### 1.2 缺失项（本次解决）
| 缺失 | 解决 |
|------|------|
| 组件**没挂载**到 `/daily` 页 | 在 PageClient.tsx 用本组件替换「今日卦象」div |
| 组件视觉**跟 Frank 图差距大** | 重做 4 个状态视觉 |
| 「今日卦象 → /liuyao」入口**会消失** | 在「八字深度分析」下方新增一行 `/liuyao` 小入口（不丢失功能） |

---

## 2. 视觉规范（按 Frank 参考图落地）

### 2.1 入口卡片 - 整体（idle 态，对应参考图）

```
┌──────────────────────────────────────────────────────────┐
│                                                          │
│   每日运势详细分析                                  ┌──┐ │
│   基于八字命盘与今日干支,为你深度解析运势走向       │🕐│ │
│                                                    └──┘ │
│                          ┌─────────────┐                 │
│                          │   开始分析  │                 │
│                          └─────────────┘                 │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

### 2.2 视觉 Tokens（v2 - 黑白极简版）

| 元素 | 数值 | 备注 |
|------|------|------|
| 卡片背景 | `#FFFFFF` | 纯白 |
| 卡片边框 | `1px solid #E5E7EB` | 浅灰 |
| 卡片圆角 | `12px` | 中等圆角 |
| 卡片内边距 | `24px 28px` | 宽松 |
| 卡片 padding 左标题区 | `flex: 1` | 文字撑开 |
| 主标题 | `font-size: 17px; font-weight: 600; color: #111827; font-family: 'Noto Serif SC', serif` | 衬线黑 |
| 副标题 | `font-size: 13px; color: #9CA3AF; line-height: 1.5; margin-top: 6px` | 中灰 |
| CTA 按钮（开始分析） | `bg: #1F2937; color: #FFFFFF; padding: 10px 28px; border-radius: 999px; font-size: 14px; font-weight: 500` | **黑色胶囊** |
| CTA hover | `bg: #111827` | 深一档 |
| 历史图标按钮 | `36×36px; bg: #FFFFFF; border: 1px solid #E5E7EB; border-radius: 8px` | 方形带圆角 |
| 历史图标 | lucide-react `<History size={16} color="#6B7280" />` | **替换 📜 emoji** |
| 历史图标 hover | `border: 1px solid #9CA3AF; bg: #F9FAFB` | 边框加深 |

### 2.3 横向布局规则

- **桌面端（≥ 768px）**：标题+描述左对齐占左侧 flex:1；CTA 居中；历史按钮右上角
- **移动端（< 768px）**：标题+描述顶部；CTA 满宽；历史按钮悬浮右上

```css
/* desktop */
.card { display: flex; align-items: center; gap: 16px; }
.text { flex: 1; }
.cta { flex-shrink: 0; }
.history { position: absolute; top: 16px; right: 16px; }

/* mobile */
@media (max-width: 767px) {
  .card { flex-direction: column; align-items: stretch; }
  .cta { width: 100%; padding: 12px 0; border-radius: 8px; }
}
```

---

## 3. 四个状态完整设计

### 3.1 idle 态（首次/未生成）
- 见 §2.1 布局
- 副标文案：**"基于八字命盘与今日干支，为你深度解析运势走向"**（采用 Frank 图原话）
- CTA：「开始分析」

### 3.2 loading 态（生成中）
```
┌──────────────────────────────────────────────────────────┐
│   每日运势详细分析                                  [🕐] │
│                                                          │
│   ⏳ 正在为您调取今日命盘...                              │
│        ● ● ●  (脉冲点动画)                                │
│   （3s 后切换：AI 正在结合八字与流年分析...）            │
│   （8s 后切换：正在生成专属解读...）                      │
│                                                          │
│   ↓ 收到首字 token 后切换为流式渲染：                     │
│                                                          │
│   ## 今日运势综述                                         │
│   今日干支甲子，水势充盈...│                              │
│                       （光标闪烁，颜色 #1F2937）          │
└──────────────────────────────────────────────────────────┘
```

**变更点**：
- 点动画颜色：`#1F2937`（原 `#C8643C` 改黑色）
- 流式光标颜色：`#1F2937`（原 `#C8643C` 改黑色）
- 文案不变

### 3.3 done 态（已生成 + 展开）
```
┌──────────────────────────────────────────────────────────┐
│   每日运势详细分析                                  [🕐] │
│                                                          │
│   ## 今日运势综述                                         │
│   今日整体气运平稳偏吉，...                              │
│                                                          │
│   ### 事业运                                              │
│   工作上易得贵人提携，...                                │
│                                                          │
│   ### 财运 / 感情运 / 健康运 / 重点提醒 / 时辰指引       │
│                                                          │
│   ─────────────────────────────────────                  │
│   [仅 Pro] ┌─────────────┐                                │
│            │  重新生成   │                                │
│            └─────────────┘                                │
└──────────────────────────────────────────────────────────┘
```

**Markdown 渲染调整**：
- H2：`font-size: 17px; color: #111827; font-family: 'Noto Serif SC'; margin-top: 24px; margin-bottom: 12px`
- H3：`font-size: 14px; color: #1F2937; font-weight: 600; margin-top: 16px; margin-bottom: 8px`（**原赭橙 #C8643C 改深灰**）
- 正文：`font-size: 14px; color: #374151; line-height: 1.8`
- 列表点：`#1F2937`
- 「重新生成」按钮：`bg: transparent; color: #1F2937; border: 1px solid #1F2937; border-radius: 999px`（胶囊空心黑）

### 3.4 exhausted 态（免费用户已用完今日 1 次）
```
┌──────────────────────────────────────────────────────────┐
│   每日运势详细分析                                  [🕐] │
│                                                          │
│   ✓ 今日已为您生成详细解读                                │
│                                                          │
│   ┌───────────┐  ┌──────────────────┐                    │
│   │查看今日解读│  │升级 Pro 重新生成│                    │
│   └───────────┘  └──────────────────┘                    │
└──────────────────────────────────────────────────────────┘
```

**调整**：
- ✓ 图标颜色：`#10B981` 不变（绿色检查标更直观）
- 「查看今日解读」：`bg: transparent; color: #1F2937; border: 1px solid #E5E7EB; border-radius: 999px`
- 「升级 Pro 重新生成」：`bg: #1F2937; color: #FFFFFF; border-radius: 999px`
- 移动端按钮纵向叠放，桌面端横向并列

---

## 4. 历史抽屉视觉调整

| 元素 | v1 | v2 |
|------|----|----|
| 抽屉背景 | #FFFFFF | #FFFFFF（不变） |
| 标题字体 | 默认 | 衬线 `Noto Serif SC` |
| 「返回列表」链接色 | #C8643C | **#1F2937** |
| 「升级 Pro」按钮 | 赭橙满宽 | **黑色胶囊** |
| 选中列表项 | 默认 hover | hover: `bg: #F9FAFB` |
| 列表分隔线 | rgba(28,26,22,0.06) | `#F3F4F6` |

---

## 5. /daily 页面集成

### 5.1 替换位置（精确）
**文件**：`src/app/daily/PageClient.tsx`
**位置**：第 774-784 行（当前的「✦ 今日卦象」div）

**替换前**：
```tsx
{/* 今日卦象 - 米白底+赭橙描边 */}
<div style={{ background: '#FAFAF8', borderRadius: 16, padding: 24, border: '1.5px solid rgba(200,98,42,0.25)' }}>
  <h4>✦ 今日卦象</h4>
  <p>专为今日运势定制，AI 即时解卦</p>
  <Link href='/liuyao'>展开详解 →</Link>
</div>
```

**替换后**：
```tsx
{/* 每日运势详细分析 - v2 黑白极简卡 */}
<DailyDetailAnalysis
  isLoggedIn={!!session}
  isVip={isVip}
  onLoginRequired={() => setAuthOpen(true)}
  targetDate={(() => {
    const d = new Date(today + 'T00:00:00');
    d.setDate(d.getDate() + Number(dayOffset));
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  })()}
  hasBirthInfo={!!formData.birthDate}
/>
```

### 5.2 「今日卦象→/liuyao」功能不能丢
在「八字深度分析卡片」（约 791 行）**下方**新增一行「六爻起卦」小入口（同款灰底卡片）：

```tsx
<Link href="/liuyao">
  <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', backgroundColor: 'white', borderRadius: 12, border: '1px solid #E5E7EB', cursor: 'pointer' }}>
    <span style={{ fontSize: 24, flexShrink: 0 }}>☷</span>
    <div style={{ flex: 1 }}>
      <div style={{ fontSize: 14, fontWeight: 500, color: '#1C1A16' }}>六爻起卦</div>
      <div style={{ fontSize: 12, color: 'rgba(28,26,22,0.55)', marginTop: 2 }}>AI 即时解卦，针对具体事项</div>
    </div>
    <button style={{ backgroundColor: '#1F2937', color: 'white', padding: '6px 12px', borderRadius: 6, fontSize: 12, fontWeight: 500, border: 'none', cursor: 'pointer', flexShrink: 0 }}>起卦</button>
  </div>
</Link>
```

> 说明：原「今日卦象」入口的真实价值 = 把用户导到 `/liuyao` 起卦。换成本模块后，必须保留这条入口（位置往下移到「八字深度分析」边上）。

---

## 6. 关键文案（采用 Frank 图原话）

| 位置 | v1 文案 | **v2 文案（采用 Frank 图）** |
|------|---------|----------------------------|
| 主标题 | 每日运势详细分析 | 每日运势详细分析（不变） |
| 副标题 | AI 结合您的八字与今日流年，为您生成一份专属的详细运势解读 | **基于八字命盘与今日干支，为你深度解析运势走向** |
| CTA | 开始分析 | 开始分析（不变） |

---

## 7. 技术实现要点（不动 v1 已落地的部分）

### 7.1 不改的部分
- 后端 API（生成、历史）
- 限频逻辑（免费 1 次/天）
- SSE 流式
- Prompt 4 段式模板
- 数据库 schema

### 7.2 要改的部分
**仅 `DailyDetailAnalysis.tsx` 组件**：
- 卡片容器：背景 `#FAF9F6` → `#FFFFFF`、边框 `rgba(200,100,60,0.15)` → `#E5E7EB`、圆角 `16` → `12`
- 标题行布局：vertical → horizontal（flex + align-items: center）
- 历史图标：📜 emoji → `<History size={16} />`（来自 `lucide-react`，包已安装）
- 历史图标容器：纯按钮 → 36×36 灰边框方框
- 副标文案：替换为 Frank 图原话
- CTA 按钮：满宽赭橙 → 黑色胶囊（非满宽）；移动端降级为满宽
- loading 点 & 光标：`#C8643C` → `#1F2937`
- done 态 H3 颜色：`#C8643C` → `#1F2937`
- exhausted 按钮组：胶囊形 + 黑色主按钮

**`PageClient.tsx`**：
- 第 774-784 行替换为组件调用
- 新增 import `DailyDetailAnalysis from '@/components/daily/DailyDetailAnalysis'`
- 在「八字深度分析」下方追加「六爻起卦」入口（保留 `/liuyao` 入口）

---

## 8. 验收清单

### 8.1 视觉验收（按 Frank 图）
- [ ] idle 态左右布局：标题+描述 / CTA 黑胶囊 / 右上角历史图标
- [ ] 卡片白底+浅灰描边+12px 圆角
- [ ] 主标题衬线体 17px、副标 13px 中灰
- [ ] CTA 黑色胶囊，hover 加深
- [ ] 历史图标 = lucide History 图标，36×36 浅灰描边方框
- [ ] 移动端响应式：CTA 满宽、布局纵向

### 8.2 功能验收（沿用 v1）
- [ ] 替换位置正确（原"今日卦象"槽位）
- [ ] `/liuyao` 入口未丢失（在八字深度分析下方）
- [ ] 4 状态切换正常
- [ ] 限频生效
- [ ] 流式 + 3 段 loading 文案

### 8.3 风格一致性验收
- [ ] 本卡所有强调色（按钮/光标/H3/链接）统一为 `#1F2937`，不再出现赭橙 `#C8643C`
- [ ] 历史抽屉同步切到黑白风
- [ ] **整页其他模块（顶部 hero、宜忌、八字深度分析卡）保持现有 v6 暖米白+赭橙风**（直到 Frank §10 拍板）

---

## 9. 派单分工

| 角色 | 任务 | 工时预估 |
|------|------|---------|
| 💻 代码虾 | DailyDetailAnalysis 视觉重做（4 态+抽屉）+ PageClient 替换 + /liuyao 入口下移 + 真机验收截图 | 4-6h |
| 🦐 产品虾 | 跟踪验收 + 上线后埋点回看 + 风格一致性走查 | 1h |
| 🎨 美术虾 | 暂不参与（视觉规范已在 PRD 内全部落地） | 0h |

---

## 10. ⚠️ 必须 Frank 拍板的风格决策

**核心冲突**：

| 项目 | 现状（Design Tokens v6 + MEMORY 铁律） | Frank 5/31 参考图 |
|------|----------------------------------------|--------------------|
| 主色 | 赭橙 #C8643C | 黑 #1F2937 |
| 底色 | 暖米白 #FAF9F6 | 纯白 #FFFFFF |
| 选中态 | 边框高亮 + 极淡暖底（禁纯黑底） | 黑色实心 CTA |
| 字体 | Cormorant Garamond + 思源宋体 | Noto Sans / 默认无衬线 |

**三个选项**：

- **方案 A（保守）**：**仅本卡片** 采用黑白极简风（孤岛存在），其他模块维持 v6 暖米白赭橙。优点：风险低；缺点：风格不统一，用户感知"为什么这块特殊"。
- **方案 B（折中）**：本卡片采用**白底+赭橙 CTA（不变 v1 视觉精神）**，仅改布局（横向、历史图标方框化）。**忽略 Frank 图的黑色 CTA**。优点：守住 Design Tokens v6 铁律；缺点：跟 Frank 视觉参考有偏差，可能要返工。
- **方案 C（激进）**：以 Frank 5/31 图为信号，**全站启动「黑白极简化」改版**（v7 Design Tokens）。本卡只是第一站。优点：彻底统一；缺点：工程量巨大（hero、八字深度分析、宜忌、所有 CTA 都要改），影响 i18n、定价等并行任务。

**🦐 产品虾推荐方案 A**：
- 本卡是"AI 智能分析入口"，跟其他静态模块定位不同，**作为"科技+理性"视觉标签存在合理**
- 类似 Notion AI / Apple Intelligence 的处理方式
- 不会牵动 v6 整体改版风险
- 留有"如果后续 Pro 转化数据好，再扩展到其他 CTA"的弹性

**等 Frank 确认后开干**。

---

## 11. 时间线

- 5/31 16:44 — Frank 发图 + "完整设计"指令
- 5/31 17:00 — 产品虾产出 v2 PRD（本文档）+ 派单代码虾
- 5/31 等回复 — Frank 拍板 §10 风格方案
- 6/1 - 6/2 — 代码虾视觉重做 + PageClient 替换 + 真机自测
- 6/2 — 产品虾验收 + Frank 验收
- 6/3 上线 + 7 天数据回看（沿用 v1 §11.2 指标）

---

**END**
