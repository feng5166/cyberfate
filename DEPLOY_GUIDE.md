# CyberFate Vercel 部署指南

## 问题诊断

当前错误：**Server configuration error**

原因：缺少必要的环境变量

## 解决方案

### 1. 在 Vercel 项目中添加环境变量

访问：https://vercel.com/feng5166s-projects/cyberfate/settings/environment-variables

添加以下环境变量（Production）：

```bash
# NextAuth 配置
NEXTAUTH_URL=https://cyberfate.vercel.app
NEXTAUTH_SECRET=1PRR0lFHKfgyzhPDEKL5P34vx2B8BvQw4dgxPQVwFM8=

# Anthropic API
ANTHROPIC_API_KEY=sk-iNy7FZIY8kS38wmAqvvrMu2iIHS22R3vvn2xBTNI8IesVnqO
ANTHROPIC_BASE_URL=https://hk-api.gptbest.vip

# 数据库（需要创建）
DATABASE_URL=postgresql://...
```

### 2. 创建 PostgreSQL 数据库

**选项 A：使用 Vercel Postgres（推荐）**

1. 在 Vercel 项目页面，点击 "Storage" 标签
2. 点击 "Create Database" → 选择 "Postgres"
3. 创建后会自动添加 DATABASE_URL 环境变量

**选项 B：使用 Supabase（免费）**

1. 访问 https://supabase.com
2. 创建新项目
3. 在 Settings → Database 中找到连接字符串
4. 复制 "Connection string" 并添加到 Vercel 环境变量

### 3. 重新部署

环境变量配置完成后，在 Vercel 项目页面点击 "Redeploy" 即可。

## 快速修复命令

如果你想先用 Vercel Postgres：

```bash
# 1. 在 Vercel 项目中创建 Postgres 数据库
# 2. 添加其他环境变量
# 3. 重新部署
```
