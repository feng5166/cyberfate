# 派单：每日运势 v3 视觉打磨

**派单时间**：2026-05-28  
**派单人**：产品虾  
**执行人**：代码虾（via Claude Code ACP）  
**文件**：`src/app/daily/PageClient.tsx`  
**优先级**：P1

---

## 问题清单（Frank 截图反馈）

### 1. 运势概览卡片改为左右布局

**当前**：「高」字、干支印章、日期信息全部垂直居中堆叠，结构散乱。

**改为**：左右两列
- 左列：「高/平/低」大字 + 「今日运势」副标题
- 右列：干支印章方块（横排）+ 公历/农历/吉时信息

```tsx
<Card hover={false}>
  <div className="flex items-center gap-8">
    {/* 左：运势等级 */}
    <div className="flex-shrink-0 text-center">
      <div className="text-6xl font-bold" style={{ color: overallColor }}>
        {overallText}
      </div>
      <p className="text-sm text-brand-gray mt-1">今日运势</p>
    </div>
    {/* 右：干支+日期 */}
    <div className="flex-1">
      <div className="flex gap-2 mb-3">
        {result.dayGanzhi.split('').map((char, i) => (
          <div key={i} className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-lg"
            style={{ backgroundColor: '#C2762B' }}>
            {char}
          </div>
        ))}
      </div>
      <div className="space-y-1 text-sm text-brand-gray">
        <p>公历：{result.date}</p>
        <p>农历：{result.lunarDate} · {result.dayGanzhi}日</p>
        {result.luckyHour && <p>吉时：{result.luckyHour}</p>}
      </div>
    </div>
  </div>
</Card>
```

---

### 2. 插画区块加卡片背景

**当前**：六边形图片浮在白底上，无背景，与上下内容割裂。

**改为**：用 Card 包裹插画，居中展示，Card 背景色 `bg-[#F5F0E8]`

```tsx
{result.imageUrl && (
  <Card hover={false} className="bg-[#F5F0E8] border-[#E5D9C0]">
    <div className="flex justify-center py-2">
      <div className="w-[200px] h-[200px]">
        <img
          src={result.imageUrl}
          alt="今日意象"
          className="w-full h-full object-cover"
          style={{
            clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
          }}
        />
      </div>
    </div>
    {result.verse && (
      <div className="text-center mt-4">
        {result.verse.split('\n').map((line, i) => (
          <p key={i} className="text-lg text-brand-black"
            style={{ fontFamily: "'Noto Serif SC', serif" }}>
            {line}
          </p>
        ))}
      </div>
    )}
  </Card>
)}
```

> 注意：把原来单独的 verse 区块和 imageUrl 区块合并进这一个 Card。删除原来分散的两个区块。

---

### 3. 宜忌加左色条 + 项目符号

**当前**：纯文字，视觉太弱。

**改为**：左侧 3px 色条 + 项目符号「·」

```tsx
<div className="grid grid-cols-2 gap-6 my-2">
  <div className="pl-3 border-l-[3px] border-[#2D6A4F]">
    <h4 className="text-base font-semibold mb-2" style={{ color: '#2D6A4F' }}>宜</h4>
    <ul className="space-y-1">
      {result.suitable.map((item, i) => (
        <li key={i} className="text-sm text-brand-gray leading-[1.8]">· {item}</li>
      ))}
    </ul>
  </div>
  <div className="pl-3 border-l-[3px] border-[#9B2335]">
    <h4 className="text-base font-semibold mb-2" style={{ color: '#9B2335' }}>忌</h4>
    <ul className="space-y-1">
      {result.avoid.map((item, i) => (
        <li key={i} className="text-sm text-brand-gray leading-[1.8]">· {item}</li>
      ))}
    </ul>
  </div>
</div>
```

---

### 4. 幸运指南：「贵人星座」改为「吉时」

**当前**：第四格显示「贵人星座」+ 「-」，数据一直为空。

**改为**：显示 `luckyHour` 字段

```tsx
<div>
  <p className="text-xs text-brand-light mb-1">吉时</p>
  <p className="text-sm font-medium text-brand-black">{result.luckyHour || '-'}</p>
</div>
```

---

## 验收要求

改完后：
1. git commit + push
2. 通知产品虾（sessions_send）任务完成或失败，附上 commit hash

---

[回报地址：productshrimp]
