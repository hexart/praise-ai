import type { ChatRequest, ChatResponse } from './chat';

/**
 * Provider类型
 */
export type ProviderType = 'ollama' | 'openai' | 'anthropic' | 'gemini' | 'custom';

/**
 * Provider配置
 */
export interface ProviderConfig {
  type: ProviderType;
  apiUrl: string;
  apiKey?: string;
  timeout?: number;
  maxRetries?: number;
  headers?: Record<string, string>;
  [key: string]: unknown;
}

/**
 * 模型信息
 */
export interface ModelInfo {
  id: string;
  name: string;
  description?: string;
  context_length?: number;
  created_at?: number;
  modified_at?: number;
  size?: number;
  family?: string;
  parameter_size?: string;
  quantization_level?: string;
  // 新增：模型状态相关
  status?: 'available' | 'loading' | 'error';
  tags?: string[];
  capabilities?: string[];
}

/**
 * API响应基础接口
 */
export interface APIResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
  details?: Record<string, unknown>;
}

/**
 * 模型列表响应
 */
export interface ModelsResponse {
  models: ModelInfo[];
  currentModel?: string;
  // 新增：总数和分页信息
  total?: number;
  hasMore?: boolean;
}

/**
 * 连接测试响应
 */
export interface ConnectionTestResponse {
  success: boolean;
  latency?: number;
  version?: string;
  models_count?: number;
  // 新增：服务器信息
  server_info?: {
    name?: string;
    version?: string;
    capabilities?: string[];
  };
}

/**
 * 流式回调函数类型
 */
export type StreamCallback = (content: string, done: boolean) => void;
export type MetadataCallback = (metadata: Record<string, unknown>) => void;

/**
 * Provider接口
 */
export interface IProvider {
  /**
   * 获取配置
   */
  getConfig(): ProviderConfig;

  /**
   * 更新配置
   */
  updateConfig(config: Partial<ProviderConfig>): void;

  /**
   * 获取当前模型
   */
  getCurrentModel(): string | null;

  /**
   * 获取连接状态
   */
  getConnectionStatus(): boolean;

  /**
   * 测试连接
   */
  testConnection(): Promise<APIResponse<ConnectionTestResponse>>;

  /**
   * 获取模型列表
   */
  listModels(): Promise<APIResponse<ModelsResponse>>;

  /**
   * 切换模型
   */
  switchModel(modelName: string): Promise<APIResponse<void>>;

  /**
   * 发送流式消息
   */
  sendStreamMessage(
    request: ChatRequest,
    onChunk: StreamCallback,
    onMetadata?: MetadataCallback
  ): Promise<void>;

  /**
   * 发送普通消息
   */
  sendMessage(request: ChatRequest): Promise<APIResponse<ChatResponse>>;
}

/**
 * Provider支持的功能信息
 */
export interface ProviderCapabilities {
  type: ProviderType;
  name: string;
  description: string;
  features: string[];
  // 新增：详细能力信息
  supports: {
    streaming: boolean;
    modelSwitching: boolean;
    customModels: boolean;
    functionCalling: boolean;
    vision: boolean;
  };
  // 新增：配置要求
  requiredConfig: Array<{
    key: keyof ProviderConfig;
    label: string;
    type: 'text' | 'password' | 'url';
    required: boolean;
    placeholder?: string;
    description?: string;
  }>;
}

/**
 * 模型切换结果
 */
export interface ModelSwitchResult {
  success: boolean;
  previousModel?: string;
  currentModel?: string;
  error?: string;
  // 新增：模型加载时间等信息
  loadTime?: number;
  modelInfo?: Partial<ModelInfo>;
}

/**
 * 扩展的 useProvider 返回类型
 */
export interface UseProviderReturn {
  // Provider状态
  provider: IProvider | null;
  providerType: ProviderType;
  config: ProviderConfig;
  isLoading: boolean;
  error: string | null;

  // 模型管理
  models: ModelInfo[];
  currentModel: string | null;
  isModelLoading: boolean;
  modelError: string | null;

  // Provider操作
  switchProvider: (type: ProviderType, config: ProviderConfig) => Promise<boolean>;
  updateConfig: (newConfig: Partial<ProviderConfig>) => void;

  // 模型操作
  loadModels: () => Promise<void>;
  switchModel: (modelName: string) => Promise<boolean>;
  refreshModel: (modelId: string) => Promise<boolean>;

  // 连接测试
  testConnection: () => Promise<boolean>;

  // 支持的Provider列表
  supportedProviders: ProviderCapabilities[];

  // 新增：工具方法
  isReady: boolean;
  canSwitchModel: boolean;
  getModelById: (id: string) => ModelInfo | undefined;
  getModelsByFamily: (family: string) => ModelInfo[];
}