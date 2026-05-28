# 派单：每日运势 v3 视觉打磨第二轮

**派单时间**：2026-05-28  
**派单人**：产品虾  
**执行人**：代码虾（ACP Claude Code）  
**文件**：`src/app/daily/PageClient.tsx` + `src/app/api/daily/route.ts`  

---

## 改动清单

### 1. 运势等级字体放大加粗（PageClient.tsx）

找到：
```tsx
className="text-6xl font-bold"
```
改为：
```tsx
className="text-7xl font-black"
```

---

### 2. 干支印章方块加大（PageClient.tsx）

找到：
```tsx
className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-lg"
```
改为：
```tsx
className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-black text-xl"
```

---

### 3. 插画+古诗合并进暖色 Card（PageClient.tsx）

找到现有的插画区块（imageUrl 判断那段），**整体替换**为：

```tsx
{/* 今日意象 + 古诗（合并暖色卡片） */}
{(result.imageUrl || result.verse) && (
  <Card hover={false} className="bg-[#F5F0E8] border-[#E5D9C0]">
    {result.imageUrl && (
      <div className="flex justify-center py-4">
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
    )}
    {result.verse && (
      <div className="text-center mt-2 pb-2">
        {result.verse.split('\n').map((line: string, i: number) => (
          <p key={i} className="text-lg text-brand-black leading-relaxed"
            style={{ fontFamily: "'Noto Serif SC', serif" }}>
            {line}
          </p>
        ))}
      </div>
    )}
  </Card>
)}
```

同时删除原来单独的 verse 区块（`{result.verse && (<div className="text-center my-4">...` 那段）。

---

### 4. 宜忌去掉卡片外框，只保留色条（PageClient.tsx）

找到宜忌区块的外层 div，去掉任何 Card 包裹（如果有的话），直接用裸 div，确保只有左侧色条无多余边框：

```tsx
{/* 宜忌（纯文字两列） */}
<div className="grid grid-cols-2 gap-6 px-1">
  <div className="pl-3 border-l-[3px] border-[#2D6A4F]">
    <h4 className="text-base font-semibold mb-2" style={{ color: '#2D6A4F' }}>宜</h4>
    <ul className="space-y-1">
      {result.suitable.map((item: string, i: number) => (
        <li key={i} className="text-sm text-brand-gray leading-[1.8]">· {item}</li>
      ))}
    </ul>
  </div>
  <div className="pl-3 border-l-[3px] border-[#9B2335]">
    <h4 className="text-base font-semibold mb-2" style={{ color: '#9B2335' }}>忌</h4>
    <ul className="space-y-1">
      {result.avoid.map((item: string, i: number) => (
        <li key={i} className="text-sm text-brand-gray leading-[1.8]">· {item}</li>
      ))}
    </ul>
  </div>
</div>
```

---

### 5. 今日卦象入口卡片加强视觉权重（PageClient.tsx）

找到今日卦象 Card，替换为：

```tsx
<Card hover={false} className="bg-[#F5F0E8] border-[#E5D9C0]">
  <div className="flex items-center justify-between">
    <div>
      <h4 className="text-base font-semibold text-brand-black mb-1">🔮 今日卦象</h4>
      <p className="text-sm text-brand-gray">
        仅为今天占卜，
        <Link href="/liuyao" className="text-brand-black font-medium underline underline-offset-2">点此开始</Link>
        {' '}生成卦象
      </p>
    </div>
    <div className="text-4xl opacity-30">🪙</div>
  </div>
</Card>
```

---

### 6. 修复 luckyHour 为空的问题（route.ts）

检查 `generateFallbackFortune` 函数返回对象里是否有 `luckyHour` 字段。  
如果没有，加上：
```ts
luckyHour: '午时（11-13时）',
```

同时检查 AI prompt 返回解析这里：
```ts
luckyHour: (fortune as any).luckyHour || null,
```
改为：
```ts
luckyHour: (fortune as any).luckyHour || '午时（11-13时）',
```
确保即使 AI 没返回也有兜底值。

---

### 7. 卡片间距优化（PageClient.tsx）

找到结果区最外层：
```tsx
<div className="space-y-6 pb-20 ...">
```
改为：
```tsx
<div className="space-y-5 pb-20 ...">
```

运势概览卡片和插画卡片之间加大间距，在插画 Card 上加 `mt-2`。

---

## 验收

1. 改完 commit + push
2. sessions_send 回报给产品虾，附 commit hash

[回报地址：productshrimp]
