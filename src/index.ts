import express from 'express';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import cors from 'cors';
import chalk from 'chalk';
import { CONFIG } from './constants';

// 解构出需要用到的常量
const { PORT, BROADCAST_INTERVAL } = CONFIG;

// 定义NodeJS类型
declare global {
  namespace NodeJS {
    interface Timeout {}
  }
}

// 定义消息类型接口
interface Message {
  type: 'subscribe' | 'unsubscribe' | 'broadcast';
  data?: Record<string, unknown>;
  timestamp?: number; // 改为可选
  topic?: string; // 新增：支持订阅主题
}

// 定义客户端连接信息接口
interface ClientInfo {
  ws: WebSocket;
  isSubscribed: boolean;
  lastActivity: number;
  messageCounter: number;
  coordinateIndex: number;
  subscribedTopic?: string; // 新增：记录订阅的主题
  headingIndex?: number; // 新增：记录艏向索引
}

class WebSocketServerManager {
  private wss: WebSocketServer;
  private clients: Map<string, ClientInfo> = new Map();
  private broadcastInterval: ReturnType<typeof setInterval> | null = null;
  private messageCounter: number = 0;

  // 经纬度测试坐标点数组
  private coordinates = [
    { lat: 40.046992, lng: 116.28626 },
    { lat: 40.046992, lng: 116.286496 },
    { lat: 40.047483, lng: 116.286615 },
    { lat: 40.047276, lng: 116.286094 },
  ];
  private coordinateIndex = 0;

  // 新增：艏向测试数组
  private headings = [90, 45, 230, 160];
  private headingIndex = 0;

  constructor(server: ReturnType<typeof createServer>) {
    // 创建WebSocket服务器实例
    this.wss = new WebSocketServer({ server });

    // 设置WebSocket连接事件处理
    this.setupWebSocketHandlers();

    console.log(chalk.green.bold('🚀 WebSocket服务器已启动'));
  }

  /**
   * 设置WebSocket事件处理器
   */
  private setupWebSocketHandlers(): void {
    // 处理新的WebSocket连接
    this.wss.on('connection', (ws: WebSocket, _request) => {
      const clientId = this.generateClientId();
      console.log(chalk.cyan.bold(`🔗 新的客户端连接: ${chalk.yellow(clientId)}`));

      // 初始化客户端信息
      this.clients.set(clientId, {
        ws,
        isSubscribed: false,
        lastActivity: Date.now(),
        messageCounter: 0,
        coordinateIndex: 0,
      });

      // 处理来自客户端的消息
      ws.on('message', (data: Buffer) => {
        try {
          const message: Message = JSON.parse(data.toString());
          this.handleClientMessage(clientId, message);
        } catch (error) {
          console.error(chalk.red.bold('❌ 解析客户端消息失败:'), error);
          this.sendError(ws, '消息格式错误');
        }
      });

      // 处理客户端断开连接
      ws.on('close', () => {
        console.log(chalk.magenta.bold(`🔌 客户端断开连接: ${chalk.yellow(clientId)}`));
        this.handleClientDisconnect(clientId);
      });

      // 处理连接错误
      ws.on('error', error => {
        console.error(chalk.red.bold(`💥 客户端连接错误 ${chalk.yellow(clientId)}:`), error);
        this.handleClientDisconnect(clientId);
      });
    });
  }

  /**
   * 处理来自客户端的消息
   * @param clientId 客户端ID
   * @param message 客户端发送的消息
   */
  private handleClientMessage(clientId: string, message: Message): void {
    const client = this.clients.get(clientId);
    if (!client) {
      console.error(chalk.red.bold(`❌ 未找到客户端: ${chalk.yellow(clientId)}`));
      return;
    }

    // 更新最后活动时间
    client.lastActivity = Date.now();

    switch (message.type) {
      case 'subscribe':
        this.handleSubscribe(clientId, client, message.topic);
        break;
      case 'unsubscribe':
        this.handleUnsubscribe(clientId, client);
        break;
      default:
        console.log(chalk.yellow.bold(`⚠️  收到未知消息类型: ${chalk.gray(message.type)}`));
        this.sendError(client.ws, '未知的消息类型');
    }
  }

  /**
   * 处理订阅请求
   * @param clientId 客户端ID
   * @param client 客户端信息
   * @param topic 订阅主题
   */
  private handleSubscribe(clientId: string, client: ClientInfo, topic?: string): void {
    if (client.isSubscribed && client.subscribedTopic === topic) {
      console.log(chalk.blue.bold(`ℹ️  客户端 ${chalk.yellow(clientId)} 已经订阅了`));
      this.sendMessage(client.ws, {
        type: 'broadcast',
        data: { message: '您已经订阅了广播服务' },
        timestamp: Date.now(),
      });
      return;
    }

    // 设置订阅状态和主题
    client.isSubscribed = true;
    client.subscribedTopic = topic;
    client.messageCounter = 0; // 订阅时重置计数
    client.coordinateIndex = 0; // 订阅时重置坐标索引
    client.headingIndex = 0; // 新增：订阅时重置艏向索引
    console.log(
      chalk.green.bold(
        `✅ 客户端 ${chalk.yellow(clientId)} 订阅了广播服务，主题: ${topic || '默认'}`
      )
    );

    // 如果这是第一个订阅的客户端，启动广播定时器
    if (this.getSubscribedClientsCount() === 1) {
      this.startBroadcast();
    }
  }

  /**
   * 处理取消订阅请求
   * @param clientId 客户端ID
   * @param client 客户端信息
   */
  private handleUnsubscribe(clientId: string, client: ClientInfo): void {
    if (!client.isSubscribed) {
      console.log(chalk.blue.bold(`ℹ️  客户端 ${chalk.yellow(clientId)} 未订阅`));
      this.sendMessage(client.ws, {
        type: 'broadcast',
        data: { message: '您尚未订阅广播服务' },
        timestamp: Date.now(),
      });
      return;
    }

    // 取消订阅状态
    client.isSubscribed = false;
    client.messageCounter = 0; // 取消订阅时重置计数
    client.coordinateIndex = 0; // 取消订阅时重置坐标索引
    client.headingIndex = 0; // 新增：取消订阅时重置艏向索引
    console.log(chalk.magenta.bold(`🚫 客户端 ${chalk.yellow(clientId)} 取消订阅`));

    // 发送确认消息
    this.sendMessage(client.ws, {
      type: 'broadcast',
      data: { message: '已取消订阅广播服务' },
      timestamp: Date.now(),
    });

    // 如果没有订阅的客户端了，停止广播并重置计数器和坐标索引
    if (this.getSubscribedClientsCount() === 0) {
      this.stopBroadcast();
      this.messageCounter = 0; // 全局计数器已废弃，但保留兼容
      this.coordinateIndex = 0; // 重置坐标索引
    }
  }

  /**
   * 处理客户端断开连接
   * @param clientId 客户端ID
   */
  private handleClientDisconnect(clientId: string): void {
    const client = this.clients.get(clientId);
    if (client) {
      // 如果客户端已订阅，需要从订阅列表中移除
      if (client.isSubscribed) {
        console.log(chalk.red.bold(`📡 订阅客户端 ${chalk.yellow(clientId)} 断开连接`));
        // 检查是否还有其他订阅的客户端
        if (this.getSubscribedClientsCount() === 1) {
          this.stopBroadcast();
          this.messageCounter = 0; // 全局计数器已废弃，但保留兼容
          this.coordinateIndex = 0; // 重置坐标索引
        }
      }
      client.messageCounter = 0; // 断开连接时重置计数
      client.coordinateIndex = 0; // 断开连接时重置坐标索引
      client.headingIndex = 0; // 断开连接时重置艏向索引
    }

    // 从客户端列表中移除
    this.clients.delete(clientId);
    console.log(chalk.gray.bold(`🗑️  客户端 ${chalk.yellow(clientId)} 已从列表中移除`));

    // 如果所有客户端都断开连接，也重置计数器和坐标索引
    if (this.clients.size === 0) {
      this.messageCounter = 0;
      this.coordinateIndex = 0;
    }
  }

  /**
   * 启动广播定时器
   */
  private startBroadcast(): void {
    if (this.broadcastInterval) {
      console.log(chalk.blue.bold('⏰ 广播定时器已经在运行'));
      return;
    }

    console.log(chalk.green.bold('🎬 启动广播定时器'));
    this.broadcastInterval = setInterval(() => {
      this.broadcastMessage();
    }, BROADCAST_INTERVAL); // 使用配置的广播间隔
  }

  /**
   * 停止广播定时器
   */
  private stopBroadcast(): void {
    if (this.broadcastInterval) {
      console.log(chalk.red.bold('⏹️  停止广播定时器'));
      clearInterval(this.broadcastInterval);
      this.broadcastInterval = null;
    }
  }

  /**
   * 广播消息给所有订阅的客户端
   */
  private broadcastMessage(): void {
    const subscribedClients = Array.from(this.clients.entries()).filter(
      ([_, client]) => client.isSubscribed
    );

    if (subscribedClients.length === 0) {
      return;
    }

    subscribedClients.forEach(([clientId, client], idx) => {
      client.messageCounter++;
      let broadcastMessage: Message;
      const now = new Date().toISOString();
      const topic = client.subscribedTopic;
      if (topic === 'navsatfix') {
        // 经纬度类型
        const coordinate = this.coordinates[client.coordinateIndex];
        client.coordinateIndex = (client.coordinateIndex + 1) % this.coordinates.length;
        broadcastMessage = {
          type: 'broadcast',
          data: {
            message: `这是第 ${client.messageCounter} 条广播消息`,
            timestamp: now,
            topic,
            data: coordinate,
          },
          timestamp: Date.now(),
        };
        this.sendMessage(client.ws, broadcastMessage);
        console.log(
          chalk.cyan.bold(`给第 ${idx + 1} 个客户端（${clientId}）发送经纬度:`),
          chalk.magenta(`坐标: ${JSON.stringify(coordinate)}`)
        );
      } else if (topic === 'compass_hdg') {
        // 艏向类型，轮询数组
        const heading = this.headings[client.headingIndex ?? 0];
        client.headingIndex = ((client.headingIndex ?? 0) + 1) % this.headings.length;
        broadcastMessage = {
          type: 'broadcast',
          data: {
            message: `这是第 ${client.messageCounter} 条广播消息`,
            timestamp: now,
            topic,
            data: heading,
          },
          timestamp: Date.now(),
        };
        this.sendMessage(client.ws, broadcastMessage);
        console.log(
          chalk.cyan.bold(`给第 ${idx + 1} 个客户端（${clientId}）发送艏向:`),
          chalk.magenta(`heading: ${heading}`)
        );
      } else {
        // 其他类型
        broadcastMessage = {
          type: 'broadcast',
          data: {
            message: `这是第 ${client.messageCounter} 条广播消息`,
            timestamp: now,
            topic,
            data: null,
          },
          timestamp: Date.now(),
        };
        this.sendMessage(client.ws, broadcastMessage);
        console.log(
          chalk.cyan.bold(`给第 ${idx + 1} 个客户端（${clientId}）发送:`),
          chalk.gray(`counter=${client.messageCounter}`)
        );
      }
    });
  }

  /**
   * 发送消息给指定客户端
   * @param ws WebSocket连接
   * @param message 要发送的消息
   */
  private sendMessage(ws: WebSocket, message: Message): void {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  /**
   * 发送错误消息给客户端
   * @param ws WebSocket连接
   * @param errorMessage 错误信息
   */
  private sendError(ws: WebSocket, errorMessage: string): void {
    this.sendMessage(ws, {
      type: 'broadcast',
      data: { error: errorMessage },
      timestamp: Date.now(),
    });
  }

  /**
   * 生成唯一的客户端ID
   * @returns 客户端ID
   */
  private generateClientId(): string {
    return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 获取订阅客户端的数量
   * @returns 订阅客户端数量
   */
  private getSubscribedClientsCount(): number {
    return Array.from(this.clients.values()).filter(client => client.isSubscribed).length;
  }

  /**
   * 获取服务器状态信息
   * @returns 服务器状态
   */
  public getServerStatus(): {
    totalClients: number;
    subscribedClients: number;
    isBroadcasting: boolean;
    messageCounter: number;
    uptime: number;
  } {
    const totalClients = this.clients.size;
    const subscribedClients = this.getSubscribedClientsCount();
    const isBroadcasting = this.broadcastInterval !== null;

    return {
      totalClients,
      subscribedClients,
      isBroadcasting,
      messageCounter: this.messageCounter,
      uptime: process.uptime(),
    };
  }
}

// 创建Express应用
const app = express();

// 中间件配置
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// 创建HTTP服务器
const server = createServer(app);

// 创建WebSocket服务器管理器
const wsManager = new WebSocketServerManager(server);

// 定义API路由
app.get('/api/status', (req, res) => {
  res.json({
    status: 'running',
    ...wsManager.getServerStatus(),
  });
});

// 健康检查端点
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 启动服务器
server.listen(PORT, () => {
  const localIP = getLocalIP();
  console.log(chalk.green.bold('🌐 服务器运行在'), chalk.cyan(`http://localhost:${PORT}`));
  if (localIP) {
    console.log(chalk.green.bold('🌐 局域网访问:'), chalk.cyan(`http://${localIP}:${PORT}`));
  }
  console.log(chalk.green.bold('🔌 WebSocket服务器运行在'), chalk.cyan(`ws://localhost:${PORT}`));
  if (localIP) {
    console.log(chalk.green.bold('🔌 WebSocket局域网:'), chalk.cyan(`ws://${localIP}:${PORT}`));
  }
  console.log(
    chalk.green.bold('📊 API状态端点:'),
    chalk.cyan(`http://localhost:${PORT}/api/status`)
  );
  console.log(chalk.green.bold('🏥 健康检查端点:'), chalk.cyan(`http://localhost:${PORT}/health`));
  console.log(chalk.yellow.bold('✨ 暗黑主题测试界面:'), chalk.cyan(`http://localhost:${PORT}`));
  console.log(chalk.gray('='.repeat(60)));
});

// 获取本机局域网IP地址
function getLocalIP(): string | null {
  const { networkInterfaces } = require('os');
  const nets = networkInterfaces();

  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      // 跳过内部地址和非IPv4地址
      if (net.family === 'IPv4' && !net.internal) {
        return net.address;
      }
    }
  }
  return null;
}

// 优雅关闭处理
process.on('SIGINT', () => {
  console.log(chalk.yellow.bold('🛑 正在关闭服务器...'));
  server.close(() => {
    console.log(chalk.green.bold('✅ 服务器已关闭'));
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  console.log(chalk.yellow.bold('🛑 正在关闭服务器...'));
  server.close(() => {
    console.log(chalk.green.bold('✅ 服务器已关闭'));
    process.exit(0);
  });
});
