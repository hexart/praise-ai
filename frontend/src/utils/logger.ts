// 简单的日志级别
const LogLevel = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3
} as const;

type LogLevelType = typeof LogLevel[keyof typeof LogLevel];

// 全局日志配置 - 单例模式，但要简单
class SimpleLogger {
  private level: LogLevelType = LogLevel.INFO;
  private enabled: boolean = true;

  setLevel(level: LogLevelType) {
    this.level = level;
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  // 直接的日志方法
  error(message: string, data?: unknown) {
    if (this.enabled && this.level >= LogLevel.ERROR) {
      console.error(`[ERROR] ${message}`, data || '');
    }
  }

  warn(message: string, data?: unknown) {
    if (this.enabled && this.level >= LogLevel.WARN) {
      console.warn(`[WARN] ${message}`, data || '');
    }
  }

  info(message: string, data?: unknown) {
    if (this.enabled && this.level >= LogLevel.INFO) {
      console.info(`[INFO] ${message}`, data || '');
    }
  }

  debug(message: string, data?: unknown) {
    if (this.enabled && this.level >= LogLevel.DEBUG) {
      console.debug(`[DEBUG] ${message}`, data || '');
    }
  }

  log(message: string, data?: unknown) {
    if (this.enabled && this.level >= LogLevel.INFO) {
      console.log(`[LOG] ${message}`, data || '');
    }
  }

  // 为了兼容性保留一些方法，但实际已不需要
  getHistory() { return []; }
  clearHistory() {}
}

// 全局单例 - 简单直接
export const logger = new SimpleLogger();

// 兼容旧的接口
export function createModuleLogger(module: string) {
  return {
    debug: (msg: string, data?: unknown) => logger.debug(`[${module}] ${msg}`, data),
    info: (msg: string, data?: unknown) => logger.info(`[${module}] ${msg}`, data),
    warn: (msg: string, data?: unknown) => logger.warn(`[${module}] ${msg}`, data),
    error: (msg: string, data?: unknown) => logger.error(`[${module}] ${msg}`, data),
    log: (msg: string, data?: unknown) => logger.log(`[${module}] ${msg}`, data)
  };
}

// 开发环境自动启用调试
if (import.meta.env.DEV) {
  logger.setLevel(LogLevel.DEBUG);
}
