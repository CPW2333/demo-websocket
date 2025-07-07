# WebSocket 服务器演示项目

这是一个基于 Express 和 WebSocket 的实时通信服务器演示项目，使用 TypeScript 开发。

## 功能特性

- ✅ 基于 Express 的 HTTP 服务器
- ✅ WebSocket 实时通信
- ✅ 客户端订阅/取消订阅机制
- ✅ 服务器主动广播消息（每秒一次）
- ✅ 客户端断开连接时自动停止广播
- ✅ TypeScript 类型安全
- ✅ 详细的中文注释
- ✅ 美观的前端测试界面

## 项目结构

```
ws-demo/
├── src/
│   └── index.ts          # 主要的服务器代码
├── public/
│   └── index.html        # 前端测试页面
├── package.json          # 项目依赖配置
├── tsconfig.json         # TypeScript 配置
└── README.md            # 项目说明文档
```

## 安装依赖

```bash
npm install
```

## 运行项目

### 开发模式（推荐）

```bash
npm run dev
```

### 生产模式

```bash
# 编译 TypeScript
npm run build

# 运行编译后的代码
npm start
```

### 监听模式（自动重启）

```bash
npm run dev
```

### 代码格式化

```bash
# 格式化代码
npm run format

# 检查代码格式
npm run format:check

# 代码检查和自动修复
npm run lint

# 检查代码质量
npm run lint:check
```

## 使用方法

1. **启动服务器**：运行上述任一命令启动服务器
2. **访问测试页面**：在浏览器中打开 `http://localhost:4444`
3. **连接 WebSocket**：点击"连接"按钮建立 WebSocket 连接
4. **订阅广播**：点击"订阅广播"按钮开始接收服务器广播的消息
5. **取消订阅**：点击"取消订阅"按钮停止接收广播消息
6. **断开连接**：点击"断开连接"按钮关闭 WebSocket 连接

## API 端点

- `GET /` - 前端测试页面
- `GET /api/status` - 服务器状态信息
- `GET /health` - 健康检查端点
- `WS /` - WebSocket 连接端点

## WebSocket 消息格式

### 客户端发送的消息

```typescript
// 订阅广播
{
  "type": "subscribe",
  "timestamp": 1234567890
}

// 取消订阅
{
  "type": "unsubscribe",
  "timestamp": 1234567890
}
```

### 服务器发送的消息

```typescript
// 广播消息
{
  "type": "broadcast",
  "data": {
    "message": "这是第 1 条广播消息",
    "counter": 1,
    "timestamp": "2024-01-01T12:00:00.000Z",
    "subscribedClientsCount": 2
  },
  "timestamp": 1234567890
}

// 错误消息
{
  "type": "broadcast",
  "data": {
    "error": "错误信息"
  },
  "timestamp": 1234567890
}
```

## 核心功能说明

### 1. 连接管理

- 每个客户端连接时分配唯一的客户端 ID
- 自动处理连接、断开和错误事件
- 维护客户端连接状态和活动时间

### 2. 订阅机制

- 客户端可以订阅/取消订阅广播服务
- 只有订阅的客户端才会收到广播消息
- 支持多个客户端同时订阅

### 3. 广播系统

- 当有客户端订阅时，服务器开始每秒广播一次消息
- 当所有客户端都取消订阅或断开连接时，自动停止广播
- 广播消息包含计数器、时间戳和订阅客户端数量

### 4. 错误处理

- 完整的错误处理机制
- 消息格式验证
- 连接状态检查

## 技术栈

- **后端**：Node.js + Express + WebSocket (ws)
- **前端**：原生 HTML/CSS/JavaScript
- **语言**：TypeScript
- **开发工具**：ts-node, nodemon
- **代码质量**：ESLint, Prettier

## 开发说明

### 代码结构

1. **WebSocketServerManager 类**：管理所有 WebSocket 连接和广播逻辑
2. **消息处理**：统一的消息格式和处理机制
3. **状态管理**：实时跟踪客户端连接和订阅状态
4. **定时器管理**：控制广播定时器的启动和停止

### 关键特性

- **类型安全**：完整的 TypeScript 类型定义
- **内存管理**：自动清理断开的客户端连接
- **性能优化**：只在有订阅客户端时进行广播
- **可扩展性**：模块化设计，易于扩展新功能
- **代码质量**：ESLint 代码检查和 Prettier 格式化
- **自动格式化**：保存时自动格式化和修复代码问题

## 故障排除

### 常见问题

1. **端口被占用**：修改 `src/index.ts` 中的 `PORT` 变量
2. **依赖安装失败**：删除 `node_modules` 后重新运行 `npm install`
3. **TypeScript 编译错误**：检查 `tsconfig.json` 配置

### 调试技巧

- 查看控制台输出的详细日志信息
- 使用浏览器开发者工具检查 WebSocket 连接状态
- 访问 `/api/status` 端点查看服务器状态

## 许可证

MIT License
