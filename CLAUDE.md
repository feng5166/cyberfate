# CyberFate 赛博命理师

> AI 驱动的东方命理分析网站

## 项目状态

🚀 **开发中** - M1 技术搭建阶段

## 技术栈

| 层级 | 技术 |
|------|------|
| 框架 | Next.js 14 (App Router) |
| 语言 | TypeScript |
| 样式 | Tailwind CSS + shadcn/ui |
| 八字计算 | lunar-javascript |
| AI | Claude 3.5 Sonnet (Vercel AI SDK) |
| 部署 | Vercel |

## 团队分工

### 主程：代码虾 🦐

负责：整体架构、任务协调、核心功能

### 子代理 (`.claude/agents/`)

| 代理 | 职责 | 模型 |
|------|------|------|
| `frontend-dev` | 前端开发 (页面/组件/样式) | Sonnet |
| `backend-dev` | 后端开发 (API/业务逻辑) | Sonnet |
| `bazi-engine` | 命理算法 (八字计算) | Sonnet |
| `ai-integrator` | AI 集成 (Claude/Prompt) | Sonnet |
| `test-engineer` | 测试 | Sonnet |
| `code-reviewer` | 代码审查（只读） | Sonnet |
| `explorer` | 代码探索（只读） | Haiku |

## MVP 功能

- ✅ 首页（功能导航）
- ✅ 八字计算页
- ✅ 每日运势页
- ✅ 隐私政策/服务条款

## 开发规范

### Git 提交格式
```
feat: 新功能
fix: 修复
docs: 文档
style: 样式
refactor: 重构
test: 测试
```

### 代码规范
- TypeScript 严格模式
- 优先 Server Components
- 客户端组件加 'use client'

## 目录结构

```
cyberfate/
├── src/
│   ├── app/           # 页面路由
│   ├── components/    # 组件
│   ├── lib/           # 核心库
│   └── hooks/         # Hooks
├── docs/              # 文档
├── .claude/agents/    # 子代理配置
└── CLAUDE.md
```

## 文档

- PRD: `docs/PRD.md`
- 设计规范: `docs/DESIGN_SPEC.md`
- 技术设计: `docs/tech-design.md`

## 排期

| 阶段 | 时间 | 状态 |
|------|------|------|
| M1 技术搭建 | Day 1-3 | 🔄 进行中 |
| M2 核心页面 | Day 4-8 | ⏳ |
| M3 功能完善 | Day 9-11 | ⏳ |
| M4 测试上线 | Day 12-14 | ⏳ |

---

_游进代码海，写出好虾码 🦐_
