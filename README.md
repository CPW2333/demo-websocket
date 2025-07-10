# ws-demo 实时通信服务器

基于 Express + WebSocket + TypeScript 的高性能实时通信后端，支持多主题订阅、日志切分、现代开发与生产部署，配套美观前端测试页面。

---

## 1. 环境准备与运行方式

### 必要环境

- Node.js 18 及以上（建议 LTS 版本）
- pnpm 包管理器（推荐，需全局安装）

```bash
npm install -g pnpm
```

### 安装依赖

```bash
pnpm install
```

### 启动方式

#### 开发模式

- 日志彩色输出到控制台，便于调试
- 热重载支持

```bash
# Linux/macOS
pnpm run dev
# 或自定义端口/参数
PORT=3000 BROADCAST_INTERVAL=500 pnpm run dev

# Windows CMD
pnpm run dev
# 或自定义端口/参数
set PORT=3000 && set BROADCAST_INTERVAL=500 && pnpm run dev

# Windows PowerShell
pnpm run dev
# 或自定义端口/参数
$env:PORT="3000"; $env:BROADCAST_INTERVAL="500"; pnpm run dev
```

#### 生产模式

- 日志写入 logs 目录，按天切分 info/error 日志
- pm2 进程守护，自动重启
- 推荐 cross-env 保证多平台兼容

```bash
# Linux/macOS
pnpm run build
pnpm run start:prod
# 或自定义参数
NODE_ENV=production BROADCAST_INTERVAL=500 pnpm run start:prod

# Windows CMD
pnpm run build
pnpm run start:prod
# 或自定义参数
set NODE_ENV=production && set BROADCAST_INTERVAL=500 && pnpm run start:prod

# Windows PowerShell
pnpm run build
pnpm run start:prod
# 或自定义参数
$env:NODE_ENV="production"; $env:BROADCAST_INTERVAL="500"; pnpm run start:prod

# 推荐：使用 cross-env（跨平台兼容）
pnpm add -D cross-env
# 然后修改 package.json 脚本，在任何系统上都可用相同命令
```

#### 开发/生产模式主要区别

|          | 日志输出       | 进程管理 | 热重载 | 环境变量 | 日志目录 |
| -------- | -------------- | -------- | ------ | -------- | -------- |
| 开发模式 | 控制台（彩色） | 无       | 支持   | 支持     | 无       |
| 生产模式 | logs/ 按天切分 | pm2      | 无     | 支持     | 有       |

---

## 2. 项目结构与说明

```
ws-demo/
├── src/
│   ├── index.ts          # 服务器主入口，Express + WebSocket 实现
│   ├── constants.ts      # 服务器常量配置，支持环境变量覆盖
│   └── logger.ts         # 日志工具，支持多环境、切分、彩色输出
├── public/
│   └── index.html        # 前端测试页面，支持多主题订阅
├── logs/                 # 生产环境日志目录（自动生成，含 info/error 日志和 .audit.json 元数据）
├── package.json          # 项目依赖与脚本配置
├── tsconfig.json         # TypeScript 配置
├── .npmrc                # pnpm 配置文件
├── .eslintrc.js          # ESLint 代码规范配置
├── .prettierrc           # Prettier 代码格式化配置
├── ecosystem.config.js   # pm2 进程管理配置（如有，生产部署用）
└── README.md             # 项目说明文档
```

- **src/**：后端核心代码，含主入口、常量、日志等
- **public/**：前端测试页面，便于本地调试 WebSocket
- **logs/**：生产环境下自动生成，按天切分 info/error 日志，含 .audit.json 元数据（请勿删除）
- **ecosystem.config.js**：pm2 生产部署配置（如存在）
- **package.json / tsconfig.json / .npmrc**：依赖、编译、包管理配置
- **.eslintrc.js / .prettierrc**：代码规范与格式化
- **README.md**：项目说明、用法、部署、FAQ 等

---

## 3. 项目功能亮点

- ✅ 多主题 WebSocket 实时通信，支持一次性订阅/取消多个主题
- ✅ TypeScript 强类型，代码结构清晰
- ✅ 生产环境日志自动切分归档，开发环境彩色输出
- ✅ pm2 进程守护，自动重启与高可用
- ✅ 环境变量灵活配置（端口、广播间隔、最大连接数等）
- ✅ 详细中文注释，易于二次开发
- ✅ 配套美观前端测试页面，支持多主题订阅、日志查看

### 前端调用方式

#### 1. 访问测试页面

浏览器打开 `http://localhost:4444`，使用内置页面测试 WebSocket 功能。

#### 2. WebSocket 消息格式

- 订阅多个主题：
  ```json
  { "type": "subscribe", "topic": ["navsatfix", "compass_hdg"] }
  ```
- 取消多个主题：
  ```json
  { "type": "unsubscribe", "topic": ["navsatfix", "compass_hdg"] }
  ```
- 取消所有订阅：
  ```json
  { "type": "unsubscribe" }
  ```
- 服务器推送示例：
  ```json
  {
    "type": "broadcast",
    "data": {
      "message": "这是第 1 条广播消息",
      "timestamp": "2025-07-08T08:11:40.354Z",
      "topic": "navsatfix",
      "data": { "lat": 40.046992, "lng": 116.28626 }
    }
  }
  ```

#### 3. 其他接口

- `GET /` 前端测试页面
- `GET /api/status` 服务器状态
- `GET /health` 健康检查
- `WS /` WebSocket 连接端点

---

## 4. 后端特性说明

- **多主题订阅机制**：支持客户端一次性订阅/取消多个主题，自动管理订阅关系
- **高性能广播**：仅有订阅客户端时才广播，自动停止/恢复
- **日志系统**：生产环境日志自动切分归档，开发环境彩色输出，支持 info/error 多级别
- **pm2 进程守护**：生产环境推荐 pm2，自动重启、异常恢复
- **环境变量配置**：PORT、BROADCAST_INTERVAL、MAX_CLIENTS、CONNECTION_TIMEOUT 等均可通过环境变量灵活配置
- **TypeScript 类型安全**：全量类型定义，便于维护和扩展
- **错误处理**：消息格式校验、连接状态检查、异常捕获
- **自动清理**：断开连接自动清理资源，防止内存泄漏
- **模块化设计**：易于扩展新主题、业务逻辑

---

## 5. 其他说明

- **日志策略**：生产环境日志写入 logs 目录，按天切分，开发环境仅控制台输出
- **环境变量建议**：多平台部署推荐 cross-env 设置环境变量
- **常见问题**：
  - 日志目录未生成？请用生产模式启动，确保 NODE_ENV=production
  - pm2 命令未找到？请用 pnpm pm2 ... 或 npx pm2 ...
- **贡献与反馈**：欢迎提 Issue 或 PR，完善功能与文档

---

## License

MIT License
