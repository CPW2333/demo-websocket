/**
 * 服务器常量配置文件
 * 集中管理所有配置常量，便于维护和修改
 */

export interface ServerConfig {
  /** 服务器端口 */
  PORT: number;
  /** 是否启用调试模式 */
  DEBUG: boolean;
  /** 广播消息间隔（毫秒） */
  BROADCAST_INTERVAL: number;
  /** 最大客户端连接数 */
  MAX_CLIENTS: number;
  /** 连接超时时间（毫秒） */
  CONNECTION_TIMEOUT: number;
}

/**
 * 默认配置常量
 */
export const DEFAULT_CONFIG: ServerConfig = {
  PORT: 4444,
  DEBUG: process.env.NODE_ENV !== 'production',
  BROADCAST_INTERVAL: 1000, // 1秒
  MAX_CLIENTS: 100,
  CONNECTION_TIMEOUT: 30000, // 30秒
};

/**
 * 从环境变量加载配置常量
 * 支持通过环境变量覆盖默认配置
 */
export function loadConfig(): ServerConfig {
  return {
    PORT: parseInt(process.env.PORT || DEFAULT_CONFIG.PORT.toString(), 10),
    DEBUG: process.env.DEBUG === 'true' || DEFAULT_CONFIG.DEBUG,
    BROADCAST_INTERVAL: parseInt(
      process.env.BROADCAST_INTERVAL || DEFAULT_CONFIG.BROADCAST_INTERVAL.toString(),
      10
    ),
    MAX_CLIENTS: parseInt(process.env.MAX_CLIENTS || DEFAULT_CONFIG.MAX_CLIENTS.toString(), 10),
    CONNECTION_TIMEOUT: parseInt(
      process.env.CONNECTION_TIMEOUT || DEFAULT_CONFIG.CONNECTION_TIMEOUT.toString(),
      10
    ),
  };
}

/**
 * 获取当前配置常量
 */
export const CONFIG = loadConfig();

/**
 * 验证配置常量的有效性
 */
export function validateConfig(config: ServerConfig): void {
  if (config.PORT < 1 || config.PORT > 65535) {
    throw new Error(`无效的端口号: ${config.PORT}`);
  }

  if (config.BROADCAST_INTERVAL < 100) {
    throw new Error(`广播间隔不能小于100毫秒: ${config.BROADCAST_INTERVAL}`);
  }

  if (config.MAX_CLIENTS < 1) {
    throw new Error(`最大客户端数不能小于1: ${config.MAX_CLIENTS}`);
  }

  if (config.CONNECTION_TIMEOUT < 1000) {
    throw new Error(`连接超时不能小于1000毫秒: ${config.CONNECTION_TIMEOUT}`);
  }
}

// 在模块加载时验证配置
validateConfig(CONFIG);
