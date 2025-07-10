import fs from 'fs';
import path from 'path';
import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';

const LOG_DIR = path.resolve(process.cwd(), 'logs');
const isProd = process.env.NODE_ENV === 'production';

if (isProd) {
  // 仅生产环境下创建日志目录
  try {
    if (!fs.existsSync(LOG_DIR)) {
      fs.mkdirSync(LOG_DIR, { recursive: true });
    }
  } catch (err) {
    // 目录创建失败也不阻止程序运行，但给出警告
    // eslint-disable-next-line no-console
    console.warn('[logger] 日志目录创建失败:', err);
  }
}

// 彩色格式（保留ANSI码）
const colorFormat = winston.format.combine(
  winston.format.colorize({ all: true }),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message }) => {
    return `[${timestamp}] [${level}] ${message}`;
  })
);

const transports: winston.transport[] = [];

if (isProd) {
  // 生产环境：日志写文件，按天切分，保留颜色
  transports.push(
    new DailyRotateFile({
      filename: path.join(LOG_DIR, 'info-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      level: 'info',
      zippedArchive: false,
      maxSize: '10m',
      maxFiles: '14d',
      format: colorFormat, // 保留颜色
    }),
    new DailyRotateFile({
      filename: path.join(LOG_DIR, 'error-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      zippedArchive: false,
      maxSize: '10m',
      maxFiles: '30d',
      format: colorFormat, // 保留颜色
    })
  );
} else {
  // 开发环境：输出到控制台，彩色
  transports.push(new winston.transports.Console({ format: colorFormat }));
}

const logger = winston.createLogger({
  level: 'info',
  transports,
  exitOnError: false,
});

export default logger;
