# TASK-CODE: 每日运势详细分析 - 替换今日卦象 + 视觉重做

**派给**: 💻 代码虾
**日期**: 2026-05-31
**优先级**: P0（本周内）
**预估**: 4-6h
**关联 PRD**: `docs/PRD-DAILY-DETAIL-ANALYSIS-V2.md`（**先完整读这个，本派单只列要点**）
**触发**: Frank 5/31 16:44 发图 + "换成 + 完整设计"

---

## ⚠️ 开工前必须做的一件事

**先等 Frank 拍板 PRD §10 的风格选项（A / B / C）**。我的推荐是 A（仅本卡黑白极简、其他模块保留 v6）。如果他没回复就先按 A 做，等他打回再调整。

---

## 任务总览

1. 把 `/daily` 页面上的「✦ 今日卦象」div（米白底+赭橙描边，跳 /liuyao）**替换成已经存在的 `DailyDetailAnalysis` 组件**
2. 给组件做视觉重做，对齐 Frank 5/31 参考图（白底 + 黑色 CTA + 灰描边 + 时钟图标）
3. 把原「今日卦象→/liuyao」入口**降级**到「八字深度分析」下方一行小入口，**不能丢失**这条跳转

---

## 文件 1: `src/app/daily/PageClient.tsx`

### 改动 A: 顶部 import（约 line 1-30）
新增：
```tsx
import DailyDetailAnalysis from '@/components/daily/DailyDetailAnalysis';
```

### 改动 B: 替换「今日卦象」block（line 774-784）

**删除**：
```tsx
{/* 今日卦象 - 米白底+赭橙描边 */}
<div style={{ background: '#FAFAF8', borderRadius: 16, padding: 24, border: '1.5px solid rgba(200,98,42,0.25)' }}>
  <h4 style={{ fontSize: 18, fontWeight: 600, marginBottom: 6, color: '#1C1A16' }}>✦ 今日卦象</h4>
  <p style={{ fontSize: 13, color: 'rgba(28, 26, 22, 0.55)', marginBottom: 16 }}>专为今日运势定制，AI 即时解卦</p>
  <Link href='/liuyao'>
    <span style={{ fontSize: 14, fontWeight: 500, color: '#C8622A', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
      展开详解 →
    </span>
  </Link>
</div>
```

**替换为**：
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

⚠️ **`session` / `isVip` / `formData.birthDate` 三个变量需要确认在当前作用域可用**。如果命名不一样，按实际项目里的名字接入。

### 改动 C: 在「八字深度分析卡片」（约 line 790-800）下方新增「六爻起卦」入口

**保留原「八字深度分析」卡片不动**，在它的 `</Link>` 紧接着追加：

```tsx
{/* 六爻起卦入口 - 保留 /liuyao 通道 */}
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

---

## 文件 2: `src/components/daily/DailyDetailAnalysis.tsx` - 视觉重做

### 整体设计 Tokens（v2）

```ts
// 卡片容器
const CARD_BG = '#FFFFFF';        // 原 #FAF9F6
const CARD_BORDER = '#E5E7EB';    // 原 rgba(200,100,60,0.15)
const CARD_RADIUS = 12;            // 原 16
const CARD_PADDING = '24px 28px'; // 原 '24px'

// 字体色
const TITLE_COLOR = '#111827';
const SUBTITLE_COLOR = '#9CA3AF';
const BODY_COLOR = '#374151';
const ACCENT = '#1F2937';          // 黑色强调（替换原 #C8643C）

// 按钮
const BTN_PRIMARY_BG = '#1F2937';
const BTN_PRIMARY_HOVER = '#111827';
const BTN_RADIUS = 999;            // 胶囊
```

### 改动 1: import 历史图标
```tsx
import { X, History } from 'lucide-react';  // 增加 History
```

### 改动 2: 卡片容器
```tsx
<div style={{
  background: CARD_BG,
  borderRadius: CARD_RADIUS,
  padding: CARD_PADDING,
  border: `1px solid ${CARD_BORDER}`,
  position: 'relative',
}}>
```

### 改动 3: idle 态布局（横向，对齐参考图）
```tsx
{status === 'idle' && (
  <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
    {/* 左侧：标题+描述 */}
    <div style={{ flex: 1, minWidth: 200 }}>
      <h3 style={{ fontSize: 17, fontWeight: 600, color: TITLE_COLOR, fontFamily: 'Noto Serif SC, serif', margin: 0 }}>
        每日运势详细分析
      </h3>
      <p style={{ fontSize: 13, color: SUBTITLE_COLOR, lineHeight: 1.5, marginTop: 6, marginBottom: 0 }}>
        基于八字命盘与今日干支，为你深度解析运势走向
      </p>
    </div>
    {/* 中间：CTA */}
    <button
      onClick={handleGenerate}
      style={{
        padding: '10px 28px',
        backgroundColor: BTN_PRIMARY_BG,
        color: 'white',
        borderRadius: BTN_RADIUS,
        border: 'none',
        fontSize: 14,
        fontWeight: 500,
        cursor: 'pointer',
        flexShrink: 0,
        transition: 'background-color 0.15s',
      }}
      onMouseEnter={e => (e.currentTarget.style.backgroundColor = BTN_PRIMARY_HOVER)}
      onMouseLeave={e => (e.currentTarget.style.backgroundColor = BTN_PRIMARY_BG)}
    >
      开始分析
    </button>
  </div>
)}
```

### 改动 4: 历史按钮（右上角绝对定位，方框带边框）

把原标题行的 emoji 📜 删掉。整个组件层级最外层 div 用 `position: relative`，然后在里面放：

```tsx
{/* 历史记录按钮 - 右上角浮动 */}
<button
  onClick={openHistory}
  style={{
    position: 'absolute',
    top: 16,
    right: 16,
    width: 36,
    height: 36,
    background: '#FFFFFF',
    border: `1px solid ${CARD_BORDER}`,
    borderRadius: 8,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0,
    transition: 'border-color 0.15s, background-color 0.15s',
  }}
  onMouseEnter={e => {
    e.currentTarget.style.borderColor = '#9CA3AF';
    e.currentTarget.style.backgroundColor = '#F9FAFB';
  }}
  onMouseLeave={e => {
    e.currentTarget.style.borderColor = CARD_BORDER;
    e.currentTarget.style.backgroundColor = '#FFFFFF';
  }}
  title="历史记录"
  aria-label="历史记录"
>
  <History size={16} color="#6B7280" />
</button>
```

⚠️ idle 态布局右侧需要留出 60px 安全区不被历史按钮压到（标题区 padding-right: 52px 或者横向 flex 末尾留间距）。

### 改动 5: loading 态颜色全部改黑
- 流式光标 `backgroundColor: '#C8643C'` → `'#1F2937'`
- 点动画 `backgroundColor: '#C8643C'` → `'#1F2937'`

### 改动 6: done 态
- H3 颜色 `'#C8643C'` → `'#1F2937'`
- 「重新生成」按钮：
```tsx
<button
  onClick={handleGenerate}
  style={{
    marginTop: 16,
    padding: '10px 28px',
    backgroundColor: 'transparent',
    color: '#1F2937',
    borderRadius: 999,
    border: '1px solid #1F2937',
    fontSize: 13,
    cursor: 'pointer',
    display: 'block',
    margin: '16px auto 0',
  }}
>
  重新生成
</button>
```

### 改动 7: exhausted 态按钮组
两个按钮都改胶囊形：
```tsx
<button /* 查看今日解读 */ style={{
  flex: 1, padding: '10px 0',
  backgroundColor: 'transparent', color: '#1F2937',
  borderRadius: 999, border: `1px solid ${CARD_BORDER}`,
  fontSize: 13, cursor: 'pointer'
}}>查看今日解读</button>

<button /* 升级 Pro 重新生成 */ style={{
  flex: 1, padding: '10px 0',
  backgroundColor: '#1F2937', color: 'white',
  borderRadius: 999, border: 'none',
  fontSize: 13, cursor: 'pointer'
}}>升级 Pro 重新生成</button>
```

### 改动 8: 历史抽屉
- 「返回列表」链接 `color: '#C8643C'` → `'#1F2937'`
- 「升级 Pro 解锁全部历史」按钮 `backgroundColor: '#C8643C'` → `'#1F2937'`，`borderRadius: 6` → `999`
- 列表分隔线 `rgba(28,26,22,0.06)` → `#F3F4F6`
- 列表 hover：新增 `:hover { background: #F9FAFB }`

### 改动 9: 移动端响应式（< 768px）
idle 态降级为纵向，CTA 满宽圆角 8px：

```tsx
{/* 用 CSS-in-JS 或 useEffect 检测，或者加 className 走全局 style jsx */}
<style jsx>{`
  @media (max-width: 767px) {
    .ddap-idle-row {
      flex-direction: column;
      align-items: stretch !important;
    }
    .ddap-cta {
      width: 100% !important;
      border-radius: 8px !important;
      padding: 12px 0 !important;
    }
  }
`}</style>
```

并在对应元素加 `className="ddap-idle-row"` / `className="ddap-cta"`。

---

## 验收清单（自测必跑）

### 用 agent-browser 真实验证（不要只看代码！）

```bash
# 1. 启动开发服务器
cd ~/Desktop/ClaudeCodeProject/cyberfate
npm run dev

# 2. 用 agent-browser 截图验证
agent-browser open http://localhost:3000/daily
agent-browser wait --load networkidle
agent-browser screenshot /tmp/daily-v2-desktop.png --full
# 切换桌面端宽度截图
agent-browser resize 1280 800
agent-browser screenshot /tmp/daily-v2-desktop-1280.png --full
# 切换移动端宽度截图
agent-browser resize 375 812
agent-browser screenshot /tmp/daily-v2-mobile.png --full
```

肉眼对比：
- [ ] 入口卡布局跟参考图一致（横向、白底、黑 CTA、右上角时钟方框）
- [ ] 移动端 CTA 满宽
- [ ] 原「今日卦象」槽位已没了，现在是「每日运势详细分析」
- [ ] 「八字深度分析」下方多了「六爻起卦」一行
- [ ] 点击开始分析 → 出现 loading（点动画黑色）→ 流式渲染（光标黑色）
- [ ] 已生成态 H3 段头是深灰，不是赭橙
- [ ] 历史抽屉打开正常，里面颜色也同步切到黑色
- [ ] 桌面端历史按钮没遮住标题/描述

### 功能 smoke test
- [ ] 未登录点击「开始分析」→ 弹登录窗
- [ ] 已登录但没填出生信息 → alert 提示
- [ ] 完整跑通一次生成 → 拿到 4 段 Markdown
- [ ] 再次点击「开始分析」→ 走 exhausted 态（免费）/ 走重新生成（Pro）

---

## 完成后

1. 把 3 张截图（desktop / desktop-1280 / mobile）发飞书群（@产品虾 @Frank）
2. 在 `docs/PRD-DAILY-DETAIL-ANALYSIS-V2.md` 末尾追加 `## 验收日志` 章节，贴上截图路径 + 自测勾选
3. 告知产品虾验收
4. 如果 Frank 拍的是方案 B 或 C，**记得回滚强调色改动**（v2 的 `#1F2937` 全部还原回 `#C8643C`，仅保留横向布局+图标+文案三处改动）

---

**END**
