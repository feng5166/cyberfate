# CyberFate.me 投流前运维检查报告

> **检查时间**: 2026-04-07 13:42
> **检查人**: 运维虾 (opshrimp)
> **状态**: 待修复 P0 项后可投流

---

## 一、基础设施总览

| 项目 | 状态 | 详情 |
|------|------|------|
| 域名解析 | ✅ 正常 | DNS CNAME → Vercel (64.29.17.65) |
| HTTPS / SSL | ✅ 正常 | Let's Encrypt (R12)，TLS 1.2 + 1.3，到期 2026-06-08（剩余约 60 天） |
| 首页加载 | ✅ 正常 | HTTP 200，HTML 68KB，Vercel Edge Cache HIT |
| 域名重定向 | ✅ 正常 | cyberfate.me → www.cyberfate.me (307) |
| 性能 (TTFB) | ⚠️ 关注 | ~780ms（海外节点测得），国内待验证 |

## 二、页面可达性

| 页面路径 | HTTP 状态 | 状态 |
|----------|-----------|------|
| `/` 首页 | 200 | ✅ |
| `/bazi` 八字分析 | 200 | ✅ |
| `/pricing` 定价 | 200 | ✅ |
| `/auth/login` 登录 | 200 | ✅ |
| `/daily` 每日运势 | 200 | ✅ |
| `/privacy` 隐私政策 | 200 | ✅ |
| `/terms` 服务条款 | 200 | ✅ |
| `/refund` 退款政策 | 200 | ✅ |
| **`/about` 关于我们** | **404** | ❌ 缺失 |

## 三、SEO 基础设施

| 项目 | 状态 | 详情 |
|------|------|------|
| `<title>` | ✅ | 赛博命理师 CyberFate - AI 驱动的东方智慧 |
| `<meta description>` | ✅ | 有描述，关键词覆盖合理 |
| Twitter Card | ✅ | summary_large_image |
| OG:Locale | ✅ | zh_CN |
| **`robots.txt`** | **❌ 404** | **缺失，搜索引擎无爬取规则** |
| **`sitemap.xml`** | **❌ 404** | **缺失，搜索引擎无法发现完整页面结构** |

## 四、社交分享元数据 (Open Graph)

| 项目 | 当前值 | 问题 |
|------|--------|------|
| `og:url` | `https://cyberfate.vercel.app` | ❌ 使用了 Vercel 默认域名，非正式域名 |
| `og:image` | `https://cyberfate.vercel.app/og-image.png` | ❌ 域名错误 + 图片返回 **404** |
| `twitter:image` | `https://cyberfate.vercel.app/og-image.png` | ❌ 同上 |

> 投流后用户分享链接到微信/小红书等平台时，会因缺少 OG 图片导致无预览图或显示错误域名，**直接影响点击率（CTR）**。

## 五、安全配置

| 安全头 | 状态 | 说明 |
|--------|------|------|
| Strict-Transport-Security | ✅ | max-age=63072000 (2年) |
| Content-Security-Policy | ❌ 缺失 | 建议 CSP 防 XSS |
| X-Frame-Options | ❌ 缺失 | 防点击劫持 |
| X-Content-Type-Options | ❌ 缺失 | 防 MIME 嗅探 |
| Referrer-Policy | ❌ 缺失 | 隐私保护 |
| CORS | ⚠️ 过宽 | `access-control-allow-origin: *` 全局开放 |

---

## 六、待修复任务清单

### 🔴 P0 — 必须在投流前完成

#### 任务 1：修正 OG 元数据域名 + 补充 OG 图片
- **问题**：`og:url` 和 `og:image` 使用了 `cyberfate.vercel.app` 默认域名；OG 图片文件不存在(404)
- **影响**：社交分享无预览图 / 显示错误域名 → CTR 下降
- **修复方案**：
  1. 在 `src/app/layout.tsx`(或 metadata 配置) 中设置 `metadataBase: new URL('https://www.cyberfate.me')`
  2. 制作 1200×630 的 OG 图片放入 `public/og-image.png`
- **预估工作量**：10 分钟
- **负责人**：代码虾

#### 任务 2：添加 robots.txt
- **问题**：`/robots.txt` 返回 404，搜索引擎无法获取爬取规则
- **影响**：SEO 基础缺失，影响搜索索引
- **修复方案**：在 `public/robots.txt` 创建文件：
  ```
  User-agent: *
  Allow: /
  Sitemap: https://www.cyberfate.me/sitemap.xml
  ```
- **预估工作量**：5 分钟
- **负责人**：代码虾

#### 任务 3：生成 sitemap.xml
- **问题**：`/sitemap.xml` 返回 404
- **影响**：搜索引擎无法自动发现所有功能页面
- **修复方案**（二选一）：
  - A) 安装 `next-sitemap` 并配置（推荐，自动生成）
  - B) 手动创建 `public/sitemap.xml` 包含所有页面
- **预估工作量**：20 分钟
- **负责人**：代码虾

#### 任务 4：修复 /about 页面 404
- **问题**：Footer 中"关于我们"链接指向 `/about`，但页面返回 404
- **影响**：用户点击后看到 404，降低产品信任度
- **修复方案**（二选一）：
  - A) 创建关于我们页面 `src/app/about/page.tsx`
  - B) 从 Footer 中移除该链接（临时方案）
- **预估工作量**：15 分钟（建页）/ 1 分钟（去链接）
- **负责人**：代码虾 或 产品虾确认方向

### 🟡 P1 — 建议尽快完成

#### 任务 5：配置安全响应头
- **修复方案**：在 `next.config.ts` 中添加 headers 配置：
  ```ts
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ]
  }
  ```
- **预估工作量**：20 分钟
- **负责人**：代码虾

#### 任务 6：验证国内访问速度
- **当前数据**：TTFB ~780ms（从 Mac Mini 海外节点测得）
- **关注点**：Vercel 边缘节点对国内用户的延迟
- **建议操作**：
  1. 用国内工具（如 https://boce.com/）做多地点测速
  2. 如果延迟 > 2s，考虑前置 Cloudflare CDN 或其他国内加速方案
- **预估工作量**：验证 10 分钟 / 加速配置 30 分钟+
- **负责人**：运维虾

### 🟢 P2 — 有空再补

#### 任务 7：添加 API 健康检查端点
- **当前**：`/api/health` 返回 404
- **建议**：创建 `src/app/api/health/route.ts` 返回 `{ status: "ok", timestamp }`
- **用途**：配合 uptime 监控（UptimeRobot / 自建脚本）
- **预估工作量**：10 分钟
- **负责人**：代码虾

---

## 七、汇总

| 优先级 | 数量 | 关键项 |
|--------|------|--------|
| 🔴 P0 必修 | 4 | OG 元数据、robots.txt、sitemap、/about 页面 |
| 🟡 P1 建议 | 2 | 安全头、国内速度验证 |
| 🟢 P2 可选 | 1 | API 健康检查 |

**P0 总预估工时**：~50 分钟（代码虾）

**结论**：产品主体功能完整、设计质量好。SEO 基础设施和社交分享元数据是投流转化的关键基础，建议在下周投流前修完 P0 项。

---

_由运维虾 (opshrimp) 生成 · 2026-04-07_
