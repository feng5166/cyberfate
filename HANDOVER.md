# 交接说明 · 致并行维护者（desktop-optimize 分支）

> 2026-07-04 · 关于「品牌黑白化」的对齐 + 一处需你核对的丢失改动

## 1. 品牌方向已改为「黑白」——请对齐

业主 2026-07-04 拍板:全站强调色由**暖古铜橙 `#C2762B` → 墨黑黑白极简**。这是最终方向,已落地 `main` + `desktop-optimize` 两条分支。请**不要再引入橙色 / amber**。

规则:
- 唯一强调色 token `brand.accent = #1C1A16`(hover `#3A352E`),`accent-soft/tint` 为中性浅灰。强调靠「墨色实心块 + 白字 / 加粗 / 边框」,不靠色相。
- 用 `stone-*` + 墨黑做强调,**不要用** `amber-*` / `orange-*` / `#C2762B` / `#A86425` / `#FBEEDD` / `#FAF3EC`。
- **保留(勿动)**:五行数据色(金黄/青绿/朱红等)、语义红绿、紫微 `yellow-500` 星图标、土 `#D97706`(五行数据)。

## 2. 先 pull 再继续

```bash
git checkout desktop-optimize
git pull origin desktop-optimize
```

已把 main 的黑白改动 **merge 进 desktop-optimize**(0 冲突,你的桌面布局工作全部保留),分支现与 main 同一黑白基线。直接在这基础上继续即可。

## 3. 抱歉——两处未提交编辑丢了,麻烦你核对

我在做黑白改造时 git 误操作(`reset --hard`),丢了你对这两个文件的**未提交**改动(git 无法找回;你编辑器缓冲若还在可直接存回):

- `src/app/knowledge/page.tsx`
- `src/app/profile/ProfileClient.tsx`

**已提交的工作都在,不受影响。** 请核对这两个文件是否缺了你的改动,必要时重做。给你添麻烦了。

---

_看完可删本文件。有疑问在此留言或找业主。_
