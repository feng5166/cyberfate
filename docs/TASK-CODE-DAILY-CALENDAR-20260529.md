# 派单：每日运势日期选择器改为横向周视图

**派单时间**：2026-05-29  
**派单人**：产品虾  
**文件**：`src/app/daily/PageClient.tsx`

---

## 目标效果

参考苹果日历横条样式，显示本周 7 天，当前选中日期圆圈高亮，右侧「月历」按钮展开完整日历。

```
周三  周四  周五  周六  周日  周一  周二  │ 月历
 27    28   (29)  30    31    1     2    │  📅
```

---

## 删除原有组件

删除现有的「昨天/今天/明天/后天」SegmentControl（找到 `<SegmentControl` 那段，整块删除）。

---

## 新增 WeekCalendar 组件（内联在 PageClient.tsx 里）

在 `DailyPage` 组件前面，加一个内联的周视图组件：

```tsx
function WeekCalendar({
  selectedDate,
  onSelect,
}: {
  selectedDate: string; // YYYY-MM-DD
  onSelect: (date: string) => void;
}) {
  const [showMonthPicker, setShowMonthPicker] = useState(false);

  // 计算本周一到本周日（以选中日期所在周为中心）
  const getWeekDays = (base: string) => {
    const d = new Date(base + 'T00:00:00');
    const day = d.getDay(); // 0=周日
    const monday = new Date(d);
    monday.setDate(d.getDate() - (day === 0 ? 6 : day - 1));
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      const yyyy = date.getFullYear();
      const mm = String(date.getMonth() + 1).padStart(2, '0');
      const dd = String(date.getDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    });
  };

  const weekDays = getWeekDays(selectedDate);
  const weekLabels = ['一', '二', '三', '四', '五', '六', '日'];

  const todayStr = (() => {
    const t = new Date();
    return `${t.getFullYear()}-${String(t.getMonth()+1).padStart(2,'0')}-${String(t.getDate()).padStart(2,'0')}`;
  })();

  return (
    <div className="relative">
      <div className="flex items-stretch bg-white rounded-card border border-brand-border-light shadow-card overflow-hidden">
        {/* 7天横向列表 */}
        <div className="flex flex-1">
          {weekDays.map((date, i) => {
            const isSelected = date === selectedDate;
            const isToday = date === todayStr;
            const dayNum = date.split('-')[2].replace(/^0/, '');
            return (
              <button
                key={date}
                onClick={() => onSelect(date)}
                className={`flex-1 flex flex-col items-center py-3 gap-1 transition-colors ${
                  isSelected ? 'bg-brand-black' : 'hover:bg-gray-50'
                }`}
              >
                <span className={`text-xs ${isSelected ? 'text-white/70' : 'text-brand-gray'}`}>
                  周{weekLabels[i]}
                </span>
                <span className={`text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full ${
                  isSelected
                    ? 'text-white'
                    : isToday
                    ? 'bg-brand-black text-white'
                    : 'text-brand-black'
                }`}>
                  {dayNum}
                </span>
              </button>
            );
          })}
        </div>

        {/* 分割线 */}
        <div className="w-px bg-brand-border-light self-stretch" />

        {/* 月历按钮 */}
        <button
          onClick={() => setShowMonthPicker(!showMonthPicker)}
          className="flex flex-col items-center justify-center px-4 gap-1 hover:bg-gray-50 transition-colors"
        >
          <span className="text-xs text-brand-gray">月历</span>
          <span className="text-base">📅</span>
        </button>
      </div>

      {/* 月历下拉（用现有 DatePicker） */}
      {showMonthPicker && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1">
          <DatePicker
            value={selectedDate}
            onChange={(date) => {
              onSelect(date);
              setShowMonthPicker(false);
            }}
            placeholder=""
          />
        </div>
      )}
    </div>
  );
}
```

---

## 替换日期选择区域

找到现有的 SegmentControl 用于日期选择的那段（大约在 `dayOffset` 相关代码附近），替换为：

```tsx
<WeekCalendar
  selectedDate={today && dayOffset !== undefined
    ? (() => {
        const d = new Date(today + 'T00:00:00');
        d.setDate(d.getDate() + Number(dayOffset));
        return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
      })()
    : today
  }
  onSelect={(date) => {
    if (!today) return;
    const base = new Date(today + 'T00:00:00');
    const sel = new Date(date + 'T00:00:00');
    const diff = Math.round((sel.getTime() - base.getTime()) / 86400000);
    setDayOffset(String(diff));
  }}
/>
```

> 注意：如果 `dayOffset` 当前是 string 类型（'0','1','-1','2'），需要 `Number(dayOffset)` 转换。

---

## 注意事项

1. `DatePicker` 已存在于 `@/components/ui/DatePicker`，直接用，不用重新写
2. 月历下拉点击日期后自动关闭（`setShowMonthPicker(false)`）
3. 周视图当天有黑圈标记（即使没被选中），选中态整列变黑底白字
4. 不要删除原有的 `dayOffset` state 和相关逻辑，只是替换 UI 组件

---

## 验收

1. 横向显示本周7天，周一到周日
2. 当前选中日期黑底白字高亮
3. 今天（非选中状态）有黑圈标记
4. 右侧月历按钮点击后弹出日历选择器
5. 选择日期后触发运势重新查询
6. commit + push，sessions_send 回报给产品虾

[回报地址：productshrimp]
