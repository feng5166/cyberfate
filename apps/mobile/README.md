# CyberFate Mobile (Expo)

CyberFate 移动端原生壳。**薄 UI 层 + 复用 Web 后端 62 个 API**，命理/AI 逻辑全部留服务端。

## 技术栈
- Expo SDK 54 · expo-router（文件路由）
- @tanstack/react-query（数据层）· zustand（状态）
- expo-secure-store（token/档案本地加密存储）
- 样式：React Native StyleSheet（M0 零构建配置；NativeWind 后置）

## M0 已接通的模块
| 模块 | 路由 | 后端 API | 鉴权 |
|---|---|---|---|
| 八字排盘 | `/bazi` | `POST /api/bazi` | 游客可用 |
| 每日运势（AI） | `/daily` | `POST /api/daily` | **需登录** |
| 塔罗占卜（AI） | `/tarot` | `POST /api/tarot/draw`（SSE） | 游客 1 次/日 |
| 登录/注册 | `/login` | `POST /api/auth/mobile-login`、`/api/auth/register` | — |

其余 6 模块在首页九宫格中占位（「即将上线」），M1 接入。

## 鉴权机制
- 移动端 `POST /api/auth/mobile-login`（邮箱密码）换取**长效 JWT（30 天）**，存 SecureStore。
- 后续请求带 `Authorization: Bearer <token>`，服务端 `src/lib/auth-session.ts` 的 `getAuthSession()` 解析（与 Web Cookie Session 双通道兼容）。
- token 用与 NextAuth 相同的 `NEXTAUTH_SECRET` 签发，格式为标准 JWE。

## 本地联调
1. 启动 Web 后端（在仓库根目录），确保 `NEXTAUTH_SECRET` 已配置、数据库可连。
2. 找到电脑局域网 IP（`ipconfig getifaddr en0`），手机与电脑连同一 Wi-Fi。
3. 启动移动端，指向本地后端：
   ```bash
   cd apps/mobile
   npm install
   EXPO_PUBLIC_API_BASE=http://<你的局域网IP>:3000/api npx expo start
   ```
   用 Expo Go 扫码打开。不传 `EXPO_PUBLIC_API_BASE` 时默认连生产 `https://www.cyberfate.me/api`。

> 注意：真机不能用 `localhost`/`127.0.0.1`，必须用局域网 IP。

## 出内测包（EAS）
```bash
npm i -g eas-cli
eas login            # 需 owner: feng5166 账号
eas build -p android --profile preview   # 产出可分发 APK
```

## 校验
```bash
npm run typecheck    # tsc --noEmit
```
