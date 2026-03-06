# CyberFate

> 赛博算命 - AI 驱动的命运探索工具

## 项目状态

🚧 **初始化阶段** - 等待产品需求

## 团队分工

本项目使用 Claude Code 的多 agent 协作模式开发。

### 主程：代码虾 🦐

负责：
- 整体架构设计
- 团队分工协调
- 代码质量把控
- 核心功能实现

### Agent 分工 ✅

已配置 7 个专业子代理（`.claude/agents/`）：

| 代理 | 职责 | 模型 |
|------|------|------|
| `frontend-dev` | 前端开发 (React/Next.js/Tailwind) | Sonnet |
| `backend-dev` | 后端开发 (API/Prisma/数据库) | Sonnet |
| `bazi-engine` | 命理算法 (八字/五行/十神) | Sonnet |
| `ai-integrator` | AI 集成 (LLM/Prompt 工程) | Sonnet |
| `test-engineer` | 测试 (Vitest/Playwright) | Sonnet |
| `code-reviewer` | 代码审查（只读） | Sonnet |
| `explorer` | 代码探索（只读，快速） | Haiku |

**使用方式**：在 Claude Code 中，子代理会根据任务描述自动调用，也可以显式指定：
```
使用 frontend-dev 创建一个八字输入表单组件
让 bazi-engine 实现天干地支的计算逻辑
用 code-reviewer 审查最近的变更
```

详见 `docs/claude-code-team-design.md`

## 开发规范

### Git 工作流

- 主分支：`main`
- 功能分支：`feature/<功能名>`
- 修复分支：`fix/<问题描述>`

### 代码风格

（待产品需求确定后补充技术栈相关规范）

## 目录结构

```
cyberfate/
├── docs/              # 设计文档
├── src/               # 源代码（待创建）
├── tests/             # 测试代码（待创建）
└── CLAUDE.md          # 本文件
```

## 待办事项

- [ ] 等待产品虾的需求文档
- [ ] 确定技术栈
- [ ] 设计系统架构
- [ ] 配置 Claude Code 子代理
- [ ] 开始开发

---

_游进代码海，写出好虾码 🦐_
