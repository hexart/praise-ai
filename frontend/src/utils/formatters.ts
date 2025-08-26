/**
数据格式化工具类
提供各种数据的格式化功能
*/
import { MODE_CONFIGS } from '../constants/modes';

/**
格式化时间戳为可读时间
*/
export function formatTimestamp(timestamp: number, format: 'relative' | 'absolute' | 'full' = 'relative'): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - timestamp;

  if (format === 'relative') {
    // 相对时间格式
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    if (seconds < 60) return '刚刚';
    if (minutes < 60) return `${minutes}分钟前`;
    if (hours < 24) return `${hours}小时前`;
    if (days < 7) return `${days}天前`;

    // 超过7天显示具体日期
    return formatTimestamp(timestamp, 'absolute');
  }
  if (format === 'absolute') {
    // 绝对时间格式（不包含年份，除非不是今年）
    const isThisYear = date.getFullYear() === now.getFullYear();
    if (isThisYear) {
      return date.toLocaleDateString('zh-CN', {
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } else {
      return date.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }
  }
  // 完整时间格式
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

/**
格式化文件大小
*/
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

/**
格式化数字
*/
export function formatNumber(num: number, options: {
  decimals?: number;
  separator?: string;
  prefix?: string;
  suffix?: string;
} = {}): string {
  const {
    decimals = 0,
    separator = ',',
    prefix = '',
    suffix = ''
  } = options;

  const formatted = num.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, separator);
  return prefix + formatted + suffix;
}

/**
格式化百分比
*/
export function formatPercentage(value: number, decimals: number = 1): string {
  return `${(value * 100).toFixed(decimals)}%`;
}

/**
格式化情感强度
*/
export function formatEmotionIntensity(intensity: number): {
  text: string;
  color: string;
  level: 'low' | 'medium' | 'high';
} {
  const percentage = Math.round(intensity * 100);

  if (intensity < 0.3) {
    return {
      text: `轻微(${percentage} %)`,
      color: 'text-green-600',
      level: 'low'
    };
  } else if (intensity < 0.7) {
    return {
      text: `中等(${percentage} %)`,
      color: 'text-yellow-600',
      level: 'medium'
    };
  } else {
    return {
      text: `强烈(${percentage} %)`,
      color: 'text-red-600',
      level: 'high'
    };
  }
}

/**
格式化聊天模式
*/
export function formatChatMode(mode: string): {
  name: string;
  subtitle: string;
  icon: string;
  color: string;
  description: string;
  examples: readonly string[];
} {
  const config = MODE_CONFIGS[mode as keyof typeof MODE_CONFIGS];

  return {
    name: config.name,
    subtitle: config.subtitle,
    icon: config.emoji,
    color: config.color,
    description: config.description,
    examples: config.examples
  };
}

/**
格式化错误信息
*/
export function formatError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }
  if (typeof error === 'object' && error !== null) {
    return JSON.stringify(error);
  }
  return '未知错误';
}

/**
格式化API响应状态
*/
export function formatAPIStatus(success: boolean, error?: string): {
  text: string;
  color: string;
  icon: string;
} {
  if (success) {
    return {
      text: '连接正常',
      color: 'text-green-600',
      icon: '✅'
    };
  } else {
    return {
      text: error ? `连接失败 : ${error}` : '连接失败',
      color: 'text-red-600',
      icon: '❌'
    };
  }
}

/**
格式化用户ID（脱敏显示）
*/
export function formatUserId(userId: string, showLength: number = 8): string {
  if (userId.length <= showLength) {
    return userId;
  }

  return userId.substring(0, showLength) + '...';
}

/**
格式化配置对象为可读字符串
*/
export function formatConfig(config: Record<string, unknown>): string {
  const formatted: string[] = [];

  Object.entries(config).forEach(([key, value]) => {
    if (key.toLowerCase().includes('key') || key.toLowerCase().includes('password')) {
      // 敏感信息脱敏
      formatted.push(`${key}: ****`);
    } else if (typeof value === 'object') {
      formatted.push(`${key}: ${JSON.stringify(value)}`);
    } else {
      formatted.push(`${key}: ${value}`);
    }
  });
  return formatted.join(', ');
}

/**
格式化多样性分数
*/
export function formatDiversityScore(score: number): {
  text: string;
  color: string;
  level: 'poor' | 'fair' | 'good' | 'excellent';
} {
  const percentage = Math.round(score * 100);

  if (score >= 0.8) {
    return {
      text: `优秀 (${percentage}%)`,
      color: 'text-green-600',
      level: 'excellent'
    };
  } else if (score >= 0.6) {
    return {
      text: `良好 (${percentage}%)`,
      color: 'text-blue-600',
      level: 'good'
    };
  } else if (score >= 0.4) {
    return {
      text: `一般 (${percentage}%)`,
      color: 'text-yellow-600',
      level: 'fair'
    };
  } else {
    return {
      text: `需改善 (${percentage}%)`,
      color: 'text-red-600',
      level: 'poor'
    };
  }
}

/**
格式化对话历史为摘要
*/
export function formatChatHistorySummary(history: Array<{ role: string; content: string; timestamp: number }>): string {
  if (history.length === 0) return '暂无对话记录';

  const totalMessages = history.length;
  const userMessages = history.filter(msg => msg.role === 'user').length;
  const aiMessages = history.filter(msg => msg.role === 'assistant').length;
  const firstMessage = history[0];
  const lastMessage = history[history.length - 1];
  const timeSpan = lastMessage.timestamp - firstMessage.timestamp;
  const duration = timeSpan > 0 ? formatDuration(timeSpan) : '刚开始';
  return `共 ${totalMessages} 条消息(用户: ${userMessages}, AI: ${aiMessages}), 持续时间: ${duration}`;
}

/**
格式化持续时间
*/
export function formatDuration(milliseconds: number): string {
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}天${hours % 24} 小时`;
  if (hours > 0) return `${hours}小时${minutes % 60} 分钟`;
  if (minutes > 0) return `${minutes}分钟${seconds % 60} 秒`;
  return `${seconds} 秒`;
}

/**
格式化引用使用统计
*/
export function formatQuoteStats(stats: {
  totalUsed: number;
  categoryStats: Record<string, number>;
}): string {
  const { totalUsed, categoryStats } = stats;

  if (totalUsed === 0) return '暂未使用引用';
  const categories = Object.entries(categoryStats)
    .filter(([, count]) => count > 0)
    .map(([category, count]) => {
      const categoryName = formatChatMode(category).name;
      return `${categoryName}: ${count} 次`;
    });
  return `总计 ${totalUsed} 次(${categories.join(', ')})`;
}