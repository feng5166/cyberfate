# Chaos Testing Guide

仅在 `NODE_ENV=development` 环境下激活。生产环境中 `_chaos` 参数会被忽略。

## 使用方法

在任意 API 请求的 query string 中添加 `_chaos=<mode>`：

```
GET /api/bazi/analyze?_chaos=timeout
GET /api/daily?_chaos=500
GET /api/tarot/draw?_chaos=empty
GET /api/huangli/ask?_chaos=slow
```

## 故障模式

| 模式 | 行为 | 用途 |
|------|------|------|
| `timeout` | 挂起 60 秒后返回 504 | 测试超时处理、AbortController |
| `500` | 立即返回 500 Internal Error | 测试错误边界、fallback UI |
| `empty` | 返回 204 No Content（空体） | 测试空响应解析 |
| `slow` | 延迟 3 秒后正常执行 | 测试 loading 状态、骨架屏 |

## 集成示例

```typescript
import { withChaos } from '@/lib/chaos-middleware';

// 单函数包装
export const GET = withChaos(async (req) => {
  // ... 正常逻辑
});

// 手动注入（更细粒度控制）
import { applyChaos } from '@/lib/chaos-middleware';

export async function POST(req: NextRequest) {
  const chaosRes = await applyChaos(req);
  if (chaosRes) return chaosRes;
  // ... 正常逻辑
}
```

## 与断路器联动

可结合 `withCircuitBreaker` 触发熔断：

1. 先用 `_chaos=500` 连续请求 5 次
2. 断路器进入 OPEN 状态
3. 后续请求直接返回 503（CircuitOpenError），无需等待 AI
4. 30 秒后自动进入 HALF_OPEN，下次成功请求恢复

## 注意事项

- 仅 `NODE_ENV=development` 生效，无需担心误入生产
- `slow` 模式不拦截请求，只增加延迟，仍执行真实业务逻辑
- `timeout` 会挂起整个 handler，注意测试客户端的超时配置
