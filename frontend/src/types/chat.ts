/**
聊天模式
*/
export type ChatMode = 'smart' | 'praise' | 'comfort';

/**
消息角色
*/
export type MessageRole = 'user' | 'assistant' | 'system';

/**
聊天消息
*/
export interface ChatMessage {
  /* 消息唯一ID */
  id: string;

  /** 消息角色 */
  role: MessageRole;
  /** 消息内容 */
  content: string;
  /** 时间戳 */
  timestamp: number;
  /** 聊天模式 */
  mode?: ChatMode;
  /** 是否正在流式传输 */
  isStreaming?: boolean;
  /** 情感分析结果 */
  emotionAnalysis?: Record<string, unknown>;
  /** 元数据 */
  metadata?: Record<string, unknown>;
}

/**
聊天请求
*/
export interface ChatRequest {
  /* 用户消息 */
  message: string;

  /** 聊天模式 */
  mode: ChatMode;
  /** 用户ID */
  userId: string;
  /** 聊天历史 */
  chatHistory: ChatMessage[];
  /** 系统提示词 */
  systemPrompt?: string;
  /** 额外配置 */
  options?: {
    maxTokens?: number;
    temperature?: number;
    stream?: boolean;
  };
}

/**
聊天响应
*/
export interface ChatResponse {
  /* 响应内容 */
  content: string;

  /** 是否完成 */
  done: boolean;
  /** 使用的模型 */
  model?: string;
  /** Token使用情况 */
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  /** 元数据 */
  metadata?: Record<string, unknown>;
}