# CyberFate 部署流程

> 避免再次出现"代码 commit 一个月都没上线"的事故。

## 当前架构

| 项目 | 说明 |
|------|------|
| 托管平台 | Vercel (Team: feng5166s-projects) |
| 仓库 | github.com/feng5166/cyberfate |
| Production Branch | `main` |
| 自动部署 | ✅ Git Integration 已连接 (2026-05-25) |
| 线上域名 | https://www.cyberfate.me / https://cyberfate.me |
| 备用域名 | cyberfate.vercel.app |

## 正常部署流程（全自动）

```
git push origin main  →  Vercel 自动检测  →  Build  →  Production 上线
```

**你不需要做任何额外操作。** Push 到 main 就会自动部署。

### 验证部署状态

```bash
# 查看最近部署（需要 token）
TOKEN=$(cat ~/.vercel/auth.json | python3 -c "import json,sys; print(json.load(sys.stdin)['token'])")
curl -s -H "Authorization: Bearer $TOKEN" \
  "https://api.vercel.com/v6/deployments?projectId=prj_oBbHY2383VkHlvtqocH1n6rti09p&teamId=team_jtd9iaSsudfuaBGTVFc1bbeG&limit=3" \
  | python3 -m json.tool
```

或直接访问 Vercel Dashboard:
https://vercel.com/feng5166s-projects/cyberfate/deployments

## 部署失败排查

### 常见原因

1. **TypeScript 编译错误** — 最常见，Next.js build 时 strict 检查不通过
2. **环境变量缺失** — Vercel Dashboard → Settings → Environment Variables
3. **依赖安装失败** — package-lock.json 不同步

### 排查步骤

```bash
# 1. 本地先 build 验证
cd ~/Desktop/ClaudeCodeProject/cyberfate
npm run build

# 2. 如果本地通过但 Vercel 失败，查 Vercel build 日志
# Dashboard → Deployments → 点击失败的部署 → Build Logs
```

## ⚠️ 已知坑

### apps/mobile 目录

项目是 monorepo 结构，`apps/mobile/` 是 Expo/React Native app。
**tsconfig.json 的 exclude 必须包含 `apps/**`**，否则 Next.js build 会尝试编译 RN 代码导致失败。

```json
{
  "exclude": ["node_modules", "apps/**"]
}
```

### Vercel CLI 部署（不再推荐）

旧方式：`vercel --prod --yes`。现在有 Git Integration 后**不再需要**。
CLI 部署的问题：
- 需要手动执行，容易遗忘
- token 可能过期
- 不会自动检测新 commit

## 事故复盘 (2026-05-25)

**问题**：4/22 ~ 5/25 期间有多次 commit 但都没上线（33 天）。

**根因**：
1. 之前一直用 `vercel --prod` CLI 手推，没有 Git Integration
2. 后续开发完成后忘记手动部署
3. 无人发现线上版本落后

**修复**：
1. 连接 GitHub Git Integration（自动部署）
2. 修复 tsconfig exclude（排除 apps/mobile）
3. 本文档作为流程保障

**教训**：
- 永远用自动部署，不要依赖人工记忆
- Monorepo 要注意 TypeScript 编译范围
- 部署后验证线上版本

## 快速参考

| 操作 | 命令 |
|------|------|
| 正常部署 | `git push origin main`（自动） |
| 手动触发重新部署 | Vercel Dashboard → Redeploy |
| 查看部署状态 | https://vercel.com/feng5166s-projects/cyberfate/deployments |
| 本地验证 build | `npm run build` |
| Git Integration 设置 | https://vercel.com/feng5166s-projects/cyberfate/settings/git |
