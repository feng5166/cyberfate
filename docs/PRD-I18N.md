# 赛博命理师 国际化 PRD (i18n)

> **产品名称**: CyberFate / 赛博命理师
> **版本**: i18n v1.0
> **作者**: 产品虾 🦐
> **创建日期**: 2026-03-29
> **状态**: 待开发

---

## 一、背景与目标

### 1.1 为什么要做国际化

1. **市场机会巨大**: 全球占星 App 市场 2025 年约 $50 亿，CAGR 20%+
2. **中国命理是蓝海**: BaZi/四柱 在西方市场几乎没有好用的英文产品，竞品（FateMaster.AI、ShenShu、OpenBaZi）都还是小团队
3. **差异化明显**: 西方用户已经用腻了星座，中国命理的"异域神秘感"是天然卖点
4. **技术基础已有**: Next.js App Router 原生支持 i18n，改造成本可控

### 1.2 目标

- **第一阶段**: 支持中文 (zh) + 英文 (en) 双语
- **第二阶段**: 根据用户数据决定是否加日文 (ja)、韩文 (ko)、繁体中文 (zh-TW)
- **商业目标**: 英文版上线后开始投放海外广告，验证付费转化

---

## 二、目标用户（海外）

### 2.1 三层用户画像

#### 画像 A：海外华人 / 亚裔（P0，先打这群人）
| 维度 | 描述 |
|------|------|
| 年龄 | 25-45 岁 |
| 地区 | 美/加/澳/新/东南亚华人社区 |
| 语言 | 中英双语，倾向英文界面+中文命理术语 |
| 特征 | 有文化认同，懂八字但找不到好用的双语工具 |
| 动机 | 给自己算 + 给外国朋友/伴侣科普中国命理 |
| 触达渠道 | Google Ads (中文关键词)、小红书海外版 |

#### 画像 B：灵性探索的 Gen Z 女性（P1，英文版主力）
| 维度 | 描述 |
|------|------|
| 年龄 | 18-28 岁 |
| 性别 | 女性为主（Pew Research: 43% 18-49岁女性信占星） |
| 地区 | 美国 > 英国 > 加拿大 > 澳洲 |
| 特征 | 已经用 Co-Star/The Pattern，对西方星座熟悉，寻求新体系 |
| 动机 | "我知道我是双鱼座了，但中国命理怎么说？" |
| 触达渠道 | TikTok、Instagram、Pinterest |

#### 画像 C：自我提升型 Millennial（P2，高付费意愿）
| 维度 | 描述 |
|------|------|
| 年龄 | 28-40 岁 |
| 性别 | 男女均衡 |
| 地区 | 美欧为主 |
| 特征 | 关注 self-improvement、MBTI 玩家、理性但开放 |
| 动机 | 人生决策参考、自我探索 |
| 触达渠道 | YouTube、Google Search、Reddit |

---

## 三、功能范围

### 3.1 i18n 第一阶段（MVP）

| 功能 | 要求 | 说明 |
|------|------|------|
| URL 路由 | /en/bazi, /zh/bazi | 基于 URL 前缀的语言路由 |
| 语言切换器 | Header 右上角 | 🌐 图标 + 下拉选择 |
| 默认语言 | 根据浏览器语言自动检测 | Accept-Language header |
| 翻译文件 | JSON 格式 | /messages/en.json, /messages/zh.json |
| SEO | 每种语言独立的 meta 标签 | title、description、og:locale |
| hreflang | 标准 hreflang 标签 | 告诉搜索引擎不同语言版本 |

### 3.2 需要翻译的内容

#### 3.2.1 UI 文案（所有页面的按钮、标签、提示等）

| 页面 | 预估文案量 |
|------|-----------|
| 通用组件（Header/Footer/导航） | ~50 条 |
| 首页 | ~30 条 |
| 八字分析 /bazi | ~60 条 |
| 每日运势 /daily | ~40 条 |
| 八字合婚 /bazi/marriage | ~50 条 |
| 紫微斗数 /ziwei | ~40 条 |
| 梅花易数 /meihua | ~30 条 |
| AI 黄历 /huangli | ~30 条 |
| 塔罗占卜 /tarot | ~50 条 |
| 登录/注册 /auth/login | ~20 条 |
| 定价页 /pricing | ~40 条 |
| 隐私/条款/退款 | ~各 200 字 |
| **合计** | **~500+ 条** |

#### 3.2.2 命理术语翻译策略

**核心原则**: 保留拼音 + 英文解释，营造"东方智慧"的品牌感

| 中文 | 英文翻译 | 策略 |
|------|----------|------|
| 八字 | BaZi (Four Pillars of Destiny) | 拼音为主，括号解释 |
| 四柱 | Four Pillars | 直译 |
| 天干 | Heavenly Stems | 直译 |
| 地支 | Earthly Branches | 直译 |
| 五行 | Five Elements | 直译 |
| 金木水火土 | Metal, Wood, Water, Fire, Earth | 直译 |
| 日主 | Day Master | 直译 |
| 身旺/身弱 | Strong/Weak Day Master | 意译 |
| 紫微斗数 | Zi Wei Dou Shu (Purple Star Astrology) | 拼音 + 意译 |
| 梅花易数 | Meihua Yishu (Plum Blossom Numerology) | 拼音 + 意译 |
| 黄历 | Chinese Almanac | 意译 |
| 运势 | Fortune / Destiny Reading | 意译 |
| 宜 | Auspicious | 意译 |
| 忌 | Inauspicious | 意译 |
| 子丑寅卯... | Zi, Chou, Yin, Mao... (Rat, Ox, Tiger, Rabbit...) | 拼音 + 生肖 |

#### 3.2.3 AI 解读的语言

| 场景 | 策略 |
|------|------|
| AI 生成内容（八字解读、运势建议等） | 根据用户当前语言设置，在 prompt 中指定输出语言 |
| Prompt 模板 | 需要中英双版本 |
| 术语保留 | AI 输出中保留关键术语拼音（如 "Your Day Master is Bing Fire (丙火)"） |

---

## 四、技术方案

### 4.1 推荐方案: next-intl

**理由**:
- Next.js App Router 原生最佳支持
- 社区活跃，文档完善
- 支持 Server Components + Client Components
- 支持 URL 前缀路由

### 4.2 目录结构

```
src/
├── app/
│   └── [locale]/          # 语言路由
│       ├── page.tsx        # 首页
│       ├── bazi/
│       │   └── page.tsx
│       ├── daily/
│       │   └── page.tsx
│       └── ...
├── messages/
│   ├── en.json             # 英文翻译
│   └── zh.json             # 中文翻译
├── i18n/
│   ├── config.ts           # i18n 配置
│   ├── request.ts          # 请求级 i18n
│   └── routing.ts          # 路由配置
└── middleware.ts            # 语言检测 + 重定向
```

### 4.3 翻译文件结构

```json
// messages/en.json
{
  "common": {
    "nav": {
      "home": "Home",
      "bazi": "BaZi Analysis",
      "daily": "Daily Fortune",
      "marriage": "Compatibility",
      "ziwei": "Purple Star",
      "meihua": "Plum Blossom",
      "huangli": "Chinese Almanac",
      "tarot": "Tarot Reading",
      "pricing": "Pricing",
      "login": "Sign In",
      "blog": "Blog (Coming Soon)"
    },
    "footer": {
      "privacy": "Privacy Policy",
      "terms": "Terms of Service",
      "refund": "Refund Policy",
      "disclaimer": "Disclaimer: All readings are for entertainment purposes only and do not constitute professional advice."
    }
  },
  "home": {
    "title": "CyberFate",
    "subtitle": "AI-Powered Chinese Destiny Analysis",
    "description": "Combining ancient Chinese wisdom with modern AI for scientific, rational destiny readings.",
    "quote": "Until you make the unconscious conscious, it will direct your life and you will call it fate. — Carl Jung"
  },
  "bazi": {
    "title": "BaZi Analysis",
    "subtitle": "Enter your birth details for an AI-powered destiny reading",
    "form": {
      "name": "Name",
      "nameOptional": "(Optional)",
      "gender": "Gender",
      "male": "Male",
      "female": "Female",
      "birthDate": "Date of Birth",
      "birthTime": "Birth Hour",
      "unknownTime": "Don't know (default: Noon)",
      "submit": "Analyze My Destiny"
    }
  }
}
```

### 4.4 URL 结构

| 中文 | 英文 | 说明 |
|------|------|------|
| /zh | /en | 首页 |
| /zh/bazi | /en/bazi | 八字分析 |
| /zh/daily | /en/daily | 每日运势 |
| /zh/bazi/marriage | /en/bazi/marriage | 八字合婚 |
| /zh/ziwei | /en/ziwei | 紫微斗数 |
| /zh/meihua | /en/meihua | 梅花易数 |
| /zh/huangli | /en/huangli | AI 黄历 |
| /zh/tarot | /en/tarot | 塔罗占卜 |
| /zh/pricing | /en/pricing | 定价 |
| /zh/auth/login | /en/auth/login | 登录 |

**默认行为**:
- 访问 `/` → 检测浏览器语言 → 自动跳转 `/en` 或 `/zh`
- 英文浏览器访问 `/bazi` → 301 到 `/en/bazi`

### 4.5 定价国际化

| 地区 | 货币 | 月卡 | 季卡 | 年卡 |
|------|------|------|------|------|
| 中国大陆 | ¥ CNY | ¥29 | ¥69 | ¥199 |
| 国际 | $ USD | $3.99 | $9.99 | $29.99 |

- Stripe 已集成，添加 USD 价格配置即可
- 根据语言/IP 自动显示对应货币

---

## 五、SEO 优化

### 5.1 英文 SEO 关键词

| 优先级 | 关键词 | 搜索意图 |
|--------|--------|----------|
| P0 | chinese astrology | 品类认知 |
| P0 | bazi calculator | 工具搜索 |
| P0 | four pillars of destiny | 品类搜索 |
| P0 | chinese birth chart | 工具搜索 |
| P1 | chinese zodiac compatibility | 功能搜索 |
| P1 | chinese daily horoscope | 高频使用 |
| P1 | bazi reading free | 免费引流 |
| P2 | zi wei dou shu | 品类搜索 |
| P2 | chinese fortune telling | 泛搜索 |
| P2 | ai astrology | 趋势搜索 |

### 5.2 页面 Meta 标签

```html
<!-- 英文版首页 -->
<title>CyberFate - AI Chinese Astrology & BaZi Calculator | Free</title>
<meta name="description" content="Discover your destiny with AI-powered Chinese BaZi analysis. Free Four Pillars of Destiny calculator, daily fortune, and personalized readings." />

<!-- hreflang -->
<link rel="alternate" hreflang="en" href="https://cyberfate.com/en" />
<link rel="alternate" hreflang="zh" href="https://cyberfate.com/zh" />
<link rel="alternate" hreflang="x-default" href="https://cyberfate.com/en" />
```

---

## 六、英文版落地页文案

### 6.1 Hero 区域

**主标题**: CyberFate
**副标题**: AI-Powered Chinese Destiny Analysis
**描述**: Discover what ancient Chinese wisdom reveals about your life path. Powered by AI, backed by 3,000 years of Eastern philosophy.

**CTA**: Discover Your Destiny — Free

### 6.2 核心理念卡片

1. **AI-Powered Insights**
   Ancient wisdom meets modern AI. Our algorithms analyze your birth data using traditional BaZi methodology, delivering clear and personalized readings.

2. **3,000 Years of Wisdom**
   BaZi (Four Pillars of Destiny) is one of the oldest personality systems in the world — and almost entirely unknown in the West. Until now.

3. **Your Destiny, Your Choice**
   We believe everyone is the interpreter of their own fate. Use AI tools to gain perspective, think independently, and make decisions from a place of awareness.

### 6.3 「BaZi 是什么」教育区块（英文版首页新增）

> **What is BaZi?**
>
> BaZi (八字) — literally "Eight Characters" — is the Chinese Four Pillars of Destiny system. Based on your birth date and time, it maps the cosmic energy present at the moment you were born into a chart of Heavenly Stems and Earthly Branches.
>
> Think of it as Chinese astrology's answer to your birth chart — but instead of planets and houses, it uses the Five Elements: Metal, Wood, Water, Fire, and Earth.
>
> **Over 1 billion people** in Asia consult BaZi for major life decisions. Now you can too.

---

## 七、排期建议

| 阶段 | 时间 | 交付物 |
|------|------|--------|
| Phase 1: 框架搭建 | Day 1-2 | next-intl 集成、路由改造、语言切换器 |
| Phase 2: 核心页面翻译 | Day 3-5 | 首页、八字、每日运势英文版 |
| Phase 3: 全量翻译 | Day 6-8 | 所有页面英文版 + AI Prompt 双语 |
| Phase 4: SEO + 落地页 | Day 9-10 | meta 标签、hreflang、教育区块 |
| Phase 5: 定价国际化 | Day 11-12 | USD 定价、Stripe 多币种 |
| Phase 6: 测试上线 | Day 13-14 | 全量测试、部署 |

**可与 P0 Bug 修复并行**：代码虾修合婚+黄历页面风格时，可以同时做 i18n 框架搭建。

---

## 八、验收标准

| 测试项 | 标准 |
|--------|------|
| 语言切换 | 中英切换流畅，无页面刷新闪烁 |
| URL 路由 | /en/bazi 和 /zh/bazi 分别显示对应语言 |
| 浏览器检测 | 英文浏览器首次访问自动跳转 /en |
| AI 解读语言 | 英文模式下 AI 输出纯英文（保留术语拼音） |
| SEO | 每个页面有正确的 hreflang 标签 |
| 定价 | 英文版显示 USD，中文版显示 CNY |
| 命理术语 | 英文版中 BaZi、Five Elements 等术语准确 |
| 移动端 | 语言切换器在移动端可用 |

---

**文档版本**: 1.0
**最后更新**: 2026-03-29
