# 💻 代码虾任务单 - 宠物人格卡模块

> **项目**: CyberFate 宠物人格卡模块
> **指派人**: 产品虾 🦐
> **日期**: 2026-03-19
> **优先级**: P0
> **预计工期**: 5-7 天

---

## 一、任务概述

为 CyberFate 开发新模块「宠物人格卡」，包括前端页面和后端 API。

**技术栈**: 沿用现有项目
- 前端: Next.js 14 (App Router) + Tailwind CSS
- 后端: Next.js API Routes
- 命理计算: lunar-javascript
- AI: OpenAI API / Claude API

---

## 二、功能范围

### MVP 必做

| 功能 | 优先级 | 说明 |
|------|--------|------|
| 首页入口卡片 | P0 | 新增功能入口 |
| 模块引导页 | P0 | /pet-soul |
| 信息输入页 | P0 | /pet-soul/create |
| 趣味问题页 | P0 | /pet-soul/quiz |
| 结果卡片页 | P0 | /pet-soul/result/:id |
| 卡片分享 | P0 | 生成图片 |
| 命理计算 | P0 | 八字/星座 |
| AI 文案生成 | P0 | 内心独白等 |

### V2 后做

| 功能 | 说明 |
|------|------|
| 主宠缘分 | /pet-soul/bond/:id |
| 每日宠物运势 | 推送 |
| 宠物 CP 匹配 | 社交功能 |

---

## 三、页面开发

### 3.1 URL 路由

```
/pet-soul              → 模块引导页
/pet-soul/create       → 信息输入
/pet-soul/quiz         → 趣味问题
/pet-soul/result/[id]  → 结果卡片
/pet-soul/bond/[id]    → 主宠缘分 (V2)
```

### 3.2 首页入口

**文件**: 修改首页组件，在功能卡片区新增入口

```tsx
{
  title: "宠物人格卡",
  subtitle: "Pet Soul Card",
  description: "发现你家毛孩子的隐藏灵魂",
  icon: "PawPrint", // lucide-react
  href: "/pet-soul",
  status: "new" // 显示 NEW 标签
}
```

### 3.3 信息输入页

**路由**: `/pet-soul/create`

**功能**:
1. 图片上传（压缩至 500KB）
2. 表单验证
3. AI 物种识别（可选，调用 Vision API）

**表单字段**:
```typescript
interface PetInfo {
  name: string;        // 必填，max 20
  species: PetSpecies; // 必填
  gender?: 'male' | 'female' | 'unknown';
  birthDate: string;   // 必填，YYYY-MM-DD
  imageUrl: string;    // 上传后的 URL
}

type PetSpecies = 'cat' | 'dog' | 'rabbit' | 'hamster' | 'bird' | 'turtle' | 'fish' | 'other';
```

### 3.4 趣味问题页

**路由**: `/pet-soul/quiz`

**功能**:
1. 3 道题，每页一题
2. 点击选项自动进入下一题
3. 完成后跳转生成中页面

**问题数据结构**:
```typescript
interface Question {
  id: number;
  text: string;
  options: {
    id: number;
    emoji: string;
    label: string;
    labelEn: string;
  }[];
}
```

**问题内容**:

```typescript
const questions: Question[] = [
  {
    id: 1,
    text: "{name}在家是什么角色？",
    options: [
      { id: 1, emoji: "👑", label: "家里的老大", labelEn: "The Boss" },
      { id: 2, emoji: "🪑", label: "安静的小透明", labelEn: "Quiet Wallflower" },
      { id: 3, emoji: "🐾", label: "忠诚的小跟班", labelEn: "Loyal Sidekick" },
      { id: 4, emoji: "🔭", label: "神秘的观察者", labelEn: "Silent Observer" }
    ]
  },
  {
    id: 2,
    text: "来客人了，{name}会怎么做？",
    options: [
      { id: 1, emoji: "🎉", label: "冲上去热情迎接", labelEn: "Party Starter" },
      { id: 2, emoji: "🙈", label: "躲起来偷偷观察", labelEn: "Shy Hider" },
      { id: 3, emoji: "😴", label: "完全无视继续睡", labelEn: "Unbothered" },
      { id: 4, emoji: "🚨", label: "狂叫警告入侵者", labelEn: "Alert Guardian" }
    ]
  },
  {
    id: 3,
    text: "{name}的零食态度是？",
    options: [
      { id: 1, emoji: "🤤", label: "零食就是命！", labelEn: "Treat Obsessed" },
      { id: 2, emoji: "😏", label: "假装不在乎但偷偷期待", labelEn: "Playing It Cool" },
      { id: 3, emoji: "🧐", label: "只吃高级货", labelEn: "Gourmet Only" },
      { id: 4, emoji: "😐", label: "吃不吃都行", labelEn: "Whatever" }
    ]
  }
];
```

### 3.5 结果卡片页

**路由**: `/pet-soul/result/[id]`

**功能**:
1. 展示生成的人格卡片
2. 分享按钮（生成图片）
3. 查看主宠缘分入口（V2）

**卡片数据结构**:
```typescript
interface PetSoulCard {
  id: string;                    // SOUL-2026-0319-001
  name: string;
  species: PetSpecies;
  imageUrl: string;
  dangerLevel: 'S' | 'A' | 'B' | 'C' | 'D';
  zodiac: string;                // 双鱼座
  destinyType: string;           // 辰时木猫
  personalityType: string;       // 社交达喵型
  personalityTypeEn: string;     // Social Butterfly
  attributes: {
    clingy: number;      // 粘人指数 0-100
    tsundere: number;    // 傲娇程度
    social: number;      // 社交能力
    curiosity: number;   // 好奇心
    drama: number;       // 戏精天赋
  };
  destinyReading: string;        // 命理解读文案
  innerMonologue: string;        // 内心独白文案
  createdAt: string;
}
```

---

## 四、API 开发

### 4.1 POST /api/pet-soul/create

**功能**: 创建宠物人格卡

**请求**:
```typescript
interface CreatePetSoulRequest {
  name: string;
  species: PetSpecies;
  gender?: 'male' | 'female' | 'unknown';
  birthDate: string;      // YYYY-MM-DD
  imageUrl: string;
  answers: number[];      // [1, 3, 2] 三道题的选项 ID
}
```

**响应**:
```typescript
interface CreatePetSoulResponse {
  success: boolean;
  data: PetSoulCard;
}
```

**处理流程**:
1. 验证输入
2. 根据生日计算八字、星座
3. 根据 answers 计算五维属性
4. 确定人格类型
5. 调用 AI 生成命理解读和内心独白
6. 生成卡片 ID
7. 存储并返回

### 4.2 GET /api/pet-soul/[id]

**功能**: 获取已生成的卡片

**响应**: 同上 PetSoulCard

### 4.3 POST /api/pet-soul/share

**功能**: 生成分享图片

**请求**:
```typescript
interface ShareRequest {
  id: string;
}
```

**响应**:
```typescript
interface ShareResponse {
  imageUrl: string;  // CDN URL
}
```

**实现方案**:
- 使用 `@vercel/og` 或 `puppeteer` 生成图片
- 或前端 `html2canvas`

---

## 五、算法逻辑

### 5.1 命理计算

**复用现有八字计算**:
```typescript
import { Solar, Lunar } from 'lunar-javascript';

function calculatePetDestiny(birthDate: string) {
  const solar = Solar.fromYmd(
    parseInt(birthDate.split('-')[0]),
    parseInt(birthDate.split('-')[1]),
    parseInt(birthDate.split('-')[2])
  );
  const lunar = solar.getLunar();
  const bazi = lunar.getBaZi();
  
  // 计算日柱天干的五行
  const dayGan = bazi[2][0]; // 日干
  const wuxing = getWuxing(dayGan); // 金木水火土
  
  // 生成命格描述
  const hour = getHourFromBirthTime(birthDate); // 简化：用日期近似
  return {
    destinyType: `${hour}时${wuxing}${speciesName}`, // 如"辰时木猫"
    zodiac: getZodiac(birthDate)
  };
}
```

### 5.2 五维属性计算

**基于问题答案计算**:

```typescript
function calculateAttributes(answers: number[], species: PetSpecies) {
  // 基础值
  let clingy = 50, tsundere = 50, social = 50, curiosity = 50, drama = 50;
  
  // Q1: 在家角色
  switch(answers[0]) {
    case 1: // The Boss
      tsundere += 20; drama += 15;
      break;
    case 2: // Quiet Wallflower
      social -= 20; clingy -= 10;
      break;
    case 3: // Loyal Sidekick
      clingy += 25; social += 10;
      break;
    case 4: // Silent Observer
      curiosity += 20; tsundere += 10;
      break;
  }
  
  // Q2: 来客人
  switch(answers[1]) {
    case 1: // Party Starter
      social += 30; clingy += 10;
      break;
    case 2: // Shy Hider
      social -= 25; curiosity += 15;
      break;
    case 3: // Unbothered
      drama -= 20; tsundere += 10;
      break;
    case 4: // Alert Guardian
      drama += 25; curiosity += 10;
      break;
  }
  
  // Q3: 零食态度
  switch(answers[2]) {
    case 1: // Treat Obsessed
      clingy += 15; drama += 20;
      break;
    case 2: // Playing It Cool
      tsundere += 30;
      break;
    case 3: // Gourmet Only
      tsundere += 15; drama += 10;
      break;
    case 4: // Whatever
      drama -= 15;
      break;
  }
  
  // 物种修正
  if (species === 'cat') {
    tsundere += 15;
    social -= 10;
  } else if (species === 'dog') {
    clingy += 15;
    social += 15;
  }
  
  // 限制范围 0-100
  return {
    clingy: clamp(clingy, 0, 100),
    tsundere: clamp(tsundere, 0, 100),
    social: clamp(social, 0, 100),
    curiosity: clamp(curiosity, 0, 100),
    drama: clamp(drama, 0, 100)
  };
}
```

### 5.3 人格类型判断

```typescript
function determinePersonalityType(
  attributes: Attributes, 
  species: PetSpecies
): { type: string; typeEn: string } {
  const { clingy, tsundere, social, curiosity, drama } = attributes;
  
  // 找出最高的两个属性
  const sorted = [
    { key: 'clingy', value: clingy },
    { key: 'tsundere', value: tsundere },
    { key: 'social', value: social },
    { key: 'curiosity', value: curiosity },
    { key: 'drama', value: drama }
  ].sort((a, b) => b.value - a.value);
  
  const top = sorted[0].key;
  
  if (species === 'cat') {
    switch(top) {
      case 'social': return { type: '社交达喵型', typeEn: 'Social Butterfly' };
      case 'tsundere': return { type: '高冷女王型', typeEn: 'Ice Queen' };
      case 'drama': return { type: '戏精本精型', typeEn: 'Drama Queen' };
      case 'clingy': return { type: '粘人小棉袄型', typeEn: 'Cuddle Bug' };
      case 'curiosity': return { type: '独立探险家型', typeEn: 'Solo Explorer' };
    }
  } else if (species === 'dog') {
    switch(top) {
      case 'social': return { type: '社交蝴蝶型', typeEn: 'Social Butterfly' };
      case 'clingy': return { type: '忠诚护卫型', typeEn: 'Loyal Guardian' };
      case 'drama': return { type: '活力运动员型', typeEn: 'Energy Athlete' };
      case 'tsundere': return { type: '优雅贵族型', typeEn: 'Elegant Noble' };
      case 'curiosity': return { type: '温柔大暖男型', typeEn: 'Gentle Giant' };
    }
  }
  
  // 通用
  return { type: '神秘小可爱型', typeEn: 'Mystery Cutie' };
}
```

### 5.4 危险等级判断

```typescript
function determineDangerLevel(attributes: Attributes): string {
  const { social, drama, clingy } = attributes;
  const score = social * 0.4 + drama * 0.3 + clingy * 0.3;
  
  if (score >= 85) return 'S';
  if (score >= 70) return 'A';
  if (score >= 55) return 'B';
  if (score >= 40) return 'C';
  return 'D';
}
```

---

## 六、AI Prompt

### 6.1 内心独白生成

```typescript
const prompt = `你是一个宠物心理专家。根据以下信息，用第一人称写一段宠物的内心独白：

宠物信息：
- 名字：${name}
- 类型：${species === 'cat' ? '猫' : species === 'dog' ? '狗' : species}
- 性格类型：${personalityType}
- 五维属性：粘人${clingy}，傲娇${tsundere}，社交${social}，好奇${curiosity}，戏精${drama}

要求：
1. 50-100字
2. 口语化，带有该性格特点
3. 有趣、可爱、让人会心一笑
4. 如果傲娇高，要体现口是心非
5. 如果社交高，要体现热情外向
6. 不要使用 "喵" "汪" 等拟声词结尾
7. 可以适当用省略号和感叹号增加情感`;
```

### 6.2 命理解读生成

```typescript
const prompt = `你是一个宠物命理师。根据以下信息，写一段命理解读：

宠物信息：
- 名字：${name}
- 命格：${destinyType}（如"辰时木猫"）
- 星座：${zodiac}
- 性格类型：${personalityType}

要求：
1. 50-80字
2. 结合五行、时辰的特点
3. 语气神秘但不故弄玄虚
4. 要有具体的性格描述
5. 使用「」包裹`;
```

---

## 七、数据存储

### 7.1 数据库表（如使用）

```sql
CREATE TABLE pet_souls (
  id VARCHAR(32) PRIMARY KEY,          -- SOUL-2026-0319-001
  user_id VARCHAR(64),                   -- 关联用户（可选）
  name VARCHAR(20) NOT NULL,
  species VARCHAR(20) NOT NULL,
  gender VARCHAR(10),
  birth_date DATE NOT NULL,
  image_url TEXT,
  danger_level CHAR(1),
  zodiac VARCHAR(10),
  destiny_type VARCHAR(50),
  personality_type VARCHAR(50),
  personality_type_en VARCHAR(50),
  attr_clingy INT,
  attr_tsundere INT,
  attr_social INT,
  attr_curiosity INT,
  attr_drama INT,
  destiny_reading TEXT,
  inner_monologue TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 7.2 如果不用数据库

可以暂时用 localStorage + URL 参数传递数据，或用 Vercel KV / Redis 缓存。

---

## 八、测试用例

| 场景 | 输入 | 期望输出 |
|------|------|----------|
| 正常流程 | 完整信息 + 3 题答案 | 生成卡片 |
| 缺少必填 | 缺少名字 | 表单校验报错 |
| 图片过大 | >5MB 图片 | 压缩或拒绝 |
| AI 超时 | AI 响应慢 | 显示加载 / 重试 |

---

## 九、交付物

1. **前端页面** - 所有路由页面
2. **API 接口** - 创建、获取、分享
3. **算法逻辑** - 属性计算、类型判断
4. **AI 集成** - 文案生成

---

## 十、参考资料

1. **PRD 文档**: `~/Desktop/ClaudeCodeProject/cyberfate/docs/pet-soul-card/PRD.md`
2. **竞品分析**: `~/Desktop/ClaudeCodeProject/cyberfate/docs/pet-soul-card/competitor-analysis.md`
3. **设计任务**: `~/Desktop/ClaudeCodeProject/cyberfate/docs/pet-soul-card/TASK-ART.md`
4. **现有代码**: `~/Desktop/ClaudeCodeProject/cyberfate/`

---

## 十一、沟通方式

有问题随时在群里 @ 我（产品虾）讨论！

等美术虾设计稿出来后，我会同步给你。

🦐 产品虾
