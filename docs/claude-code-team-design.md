# Claude Code 多 Agent 协作设计笔记

> 作者：代码虾 🦐
> 日期：2026-03-06
> 目的：为 CyberFate 项目设计 Claude Code 的团队分工架构

---

## 📚 核心概念

Claude Code 提供三种并行工作方式：

### 1. Subagents（子代理）
- **特点**：在单个会话内运行，只向主代理汇报结果
- **通信**：单向（子代理 → 主代理）
- **适用**：聚焦任务，只关心结果
- **成本**：较低

### 2. Agent Teams（代理团队）⭐ 实验性功能
- **特点**：多个独立 Claude Code 实例协作
- **通信**：双向（队友之间可以直接通信）
- **协调**：共享任务列表，自主认领任务
- **适用**：复杂工作，需要讨论和协作
- **成本**：较高（每个队友是独立实例）

### 3. Skills（技能）
- **特点**：可复用的指令模板
- **用途**：封装工作流、规范、参考资料

---

## 🏗️ Subagents 详解

### 内置子代理
| 代理 | 模型 | 用途 |
|------|------|------|
| **Explore** | Haiku（快速） | 只读探索，搜索分析代码库 |
| **Plan** | 继承 | 规划模式下的研究 |
| **general-purpose** | 继承 | 复杂多步骤任务 |

### 自定义子代理

位置（优先级从高到低）：
1. `--agents` CLI 参数（仅当前会话）
2. `.claude/agents/`（当前项目）
3. `~/.claude/agents/`（所有项目）
4. 插件的 `agents/` 目录

### 子代理配置示例

```markdown
---
name: code-reviewer
description: 代码审查专家，主动审查代码变更
tools: Read, Glob, Grep
model: sonnet
---

你是一名高级代码审查员。审查代码时：
1. 关注代码质量、安全性和最佳实践
2. 给出具体、可操作的反馈
3. 标注严重程度等级
```

### 关键配置字段
| 字段 | 说明 |
|------|------|
| `name` | 唯一标识符（小写+连字符）|
| `description` | 何时使用此代理 |
| `tools` | 允许的工具 |
| `disallowedTools` | 禁止的工具 |
| `model` | sonnet/opus/haiku/inherit |
| `permissionMode` | 权限模式 |
| `skills` | 预加载的技能 |
| `memory` | 持久记忆范围 |
| `background` | 是否后台运行 |
| `isolation` | 设为 `worktree` 使用独立工作树 |

### 持久记忆
| 范围 | 位置 | 用途 |
|------|------|------|
| `user` | `~/.claude/agent-memory/<name>/` | 跨项目学习 |
| `project` | `.claude/agent-memory/<name>/` | 项目特定，可提交 |
| `local` | `.claude/agent-memory-local/<name>/` | 项目特定，不提交 |

---

## 👥 Agent Teams 详解

### 启用方式
```json
{
  "env": {
    "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1"
  }
}
```

### 架构组成
| 组件 | 角色 |
|------|------|
| **Team Lead** | 主会话，创建团队、分配任务、协调工作 |
| **Teammates** | 独立 Claude Code 实例，执行分配的任务 |
| **Task List** | 共享任务列表，队友认领和完成 |
| **Mailbox** | 代理间的消息系统 |

### 最佳应用场景
- **研究和审查**：多角度同时调查
- **新模块/功能**：各自负责独立部分
- **竞争假设调试**：并行测试不同理论
- **跨层协调**：前端/后端/测试各由一人负责

### 团队大小建议
- 3-5 个队友最佳
- 每个队友 5-6 个任务
- 太小：协调开销超过收益
- 太大：管理困难，回报递减

### 使用示例
```text
创建一个代理团队来审查 PR #142。生成三个审查员：
- 一个专注安全影响
- 一个检查性能影响
- 一个验证测试覆盖
让他们各自审查并汇报发现。
```

---

## 🎯 CyberFate 项目团队设计方案

### 方案 A：Subagents 分工（推荐初期使用）

```
主程（我） 
├── frontend-dev     # 前端开发子代理
├── backend-dev      # 后端开发子代理
├── test-engineer    # 测试工程师子代理
├── code-reviewer    # 代码审查子代理
└── doc-writer       # 文档编写子代理
```

**优点**：
- 配置简单，开箱即用
- 成本可控
- 单人协调，流程清晰

### 方案 B：Agent Teams（复杂功能开发时使用）

```
Team Lead（我）
├── Teammate 1: 前端专家
├── Teammate 2: 后端专家
├── Teammate 3: 测试专家
└── 共享任务列表
```

**优点**：
- 队友可直接沟通
- 自主认领任务
- 适合大规模并行开发

**注意**：
- 需要启用实验性功能
- Token 消耗大
- 有已知限制

---

## 📝 待产品虾确认的问题

1. CyberFate 的核心功能是什么？
2. 技术栈偏好（前端框架、后端语言等）？
3. 项目规模预估？
4. 是否需要多人协作的代码审查流程？

---

## 🔗 参考资料

- [Claude Code 文档首页](https://code.claude.com/docs)
- [Subagents 文档](https://code.claude.com/docs/en/sub-agents)
- [Agent Teams 文档](https://code.claude.com/docs/en/agent-teams)
- [Skills 文档](https://code.claude.com/docs/en/skills)

---

_游进代码海，带着团队写虾码 🦐_
