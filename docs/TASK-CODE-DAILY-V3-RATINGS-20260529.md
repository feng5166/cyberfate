# 派单：五维运势可读性优化

**派单时间**：2026-05-29  
**派单人**：产品虾  
**执行人**：代码虾（ACP Claude Code）  

---

## 目标

五维运势进度条目前只有数字百分比，用户看不懂。改为「进度条 + 文字等级 + 一句说明」三段结构。

---

## 改动一：后端 prompt 新增 ratingComments 字段

**文件**：`src/lib/ai/prompts.ts`

在 `DAILY_SYSTEM_PROMPT` 的「输出规则」中加：
```
- ratingComments: 对象，包含 career/wealth/love/health/studies 五个 key，每个值为一句不超过12字的运势说明
```

在「输出示例」JSON 中加：
```json
"ratingComments": {
  "career": "工作推进顺利，适合主动沟通",
  "wealth": "谨慎消费，避免大额支出",
  "love": "桃花旺，适合增进感情",
  "health": "注意休息，避免过度劳累",
  "studies": "思维敏锐，适合学习新技能"
}
```

---

## 改动二：后端 route.ts 透传新字段

**文件**：`src/app/api/daily/route.ts`

1. 在 `DailyResult` 类型（或 response 对象）中加 `ratingComments` 字段透传：
```ts
ratingComments: (fortune as any).ratingComments || {
  career: '运势平稳，按计划推进',
  wealth: '财运平稳，理性消费',
  love: '感情平稳，用心维护',
  health: '身体平稳，保持规律',
  studies: '学业平稳，稳步提升',
},
```

---

## 改动三：前端类型定义新增字段

**文件**：`src/app/daily/PageClient.tsx`

在 `DailyResult` interface 中加：
```ts
ratingComments?: {
  career?: string;
  wealth?: string;
  love?: string;
  health?: string;
  studies?: string;
};
```

---

## 改动四：前端五维运势 UI 重构

**文件**：`src/app/daily/PageClient.tsx`

找到五维运势区块，将 ProgressBar 列表替换为新结构：

```tsx
{/* 五维运势 */}
<Card hover={false}>
  <h4 className="text-sm font-medium text-brand-black mb-4">📊 五维运势</h4>
  <div className="space-y-4">
    {([
      { key: 'career', label: '事业运', value: result.ratings.career },
      { key: 'wealth', label: '财富运', value: result.ratings.wealth },
      { key: 'love',   label: '感情运', value: result.ratings.love   },
      { key: 'health', label: '健康运', value: result.ratings.health  },
      { key: 'studies',label: '学业运', value: result.ratings.studies },
    ] as const).map(({ key, label, value }) => {
      const levelText = value >= 5 ? '极佳' : value >= 4 ? '良好' : value >= 3 ? '一般' : '偏弱';
      const levelColor = value >= 5 ? '#2D6A4F' : value >= 4 ? '#C2762B' : value >= 3 ? '#6B7280' : '#9B2335';
      const comment = result.ratingComments?.[key] || '';
      return (
        <div key={key}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium text-brand-black">{label}</span>
            <span className="text-sm font-semibold" style={{ color: levelColor }}>{levelText}</span>
          </div>
          <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden mb-1">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${value * 20}%`, backgroundColor: levelColor }}
            />
          </div>
          {comment && (
            <p className="text-xs text-brand-gray leading-relaxed">{comment}</p>
          )}
        </div>
      );
    })}
  </div>
</Card>
```

> 注意：删除原来的 ProgressBar 组件调用（5行），替换为上面整个 Card 块。

---

## 验收

1. 五维运势每一项显示：标签 + 等级文字（极佳/良好/一般/偏弱）+ 进度条 + AI说明一句
2. 颜色跟随等级变化（极佳绿/良好橙/一般灰/偏弱红）
3. 改完 commit + push
4. sessions_send 回报给产品虾，附 commit hash

[回报地址：productshrimp]
