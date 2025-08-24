import type {
  ProviderConfig,
  APIResponse,
  ModelsResponse,
  ConnectionTestResponse,
  StreamCallback,
  MetadataCallback,
  IProvider
} from '../types/provider';
import type { ChatRequest, ChatResponse } from '../types/chat';

/**
Provider基础抽象类
定义所有Provider的通用接口和基础实现
*/
export abstract class BaseProvider implements IProvider {
  protected config: ProviderConfig;
  protected currentModel: string | null = null;
  protected isConnected = false;

  constructor(config: ProviderConfig) {
    this.config = { ...config };
    this.currentModel = null;
  }

  /**
  获取当前配置
  */
  getConfig(): ProviderConfig {
    return { ...this.config };
  }

  /**
  更新配置
  */
  updateConfig(newConfig: Partial<ProviderConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.isConnected = false; // 配置变更后需要重新测试连接
  }

  /**
  获取当前模型
  */
  getCurrentModel(): string | null {
    return this.currentModel;
  }

  /**
  获取连接状态
  */
  getConnectionStatus(): boolean {
    return this.isConnected;
  }

  /**
  构建请求头
  */
  protected buildHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...this.config.headers
    };

    if (this.config.apiKey) {
      headers['Authorization'] = `Bearer ${this.config.apiKey}`;
    }

    return headers;
  }

  /**
  发送HTTP请求
  */
  protected async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<APIResponse<T>> {
    try {
      const url = `${this.config.apiUrl.replace(/\/+$/, '')}/${endpoint.replace(/^\/+/, '')}`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeout || 30000);
      
      const response = await fetch(url, {
        signal: controller.signal,
        headers: this.buildHeaders(),
        mode: 'cors',
        credentials: 'omit',
        cache: 'no-cache',
        ...options
      });

      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        return {
          success: false,
          error: `HTTP ${response.status}: ${errorText}`,
          code: response.status.toString()
        };
      }
      
      const data = await response.json();
      return {
        success: true,
        data
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
        code: 'NETWORK_ERROR'
      };
    }
  }

  /**
  处理流式响应
  */
  protected async handleStream(
    response: Response,
    onChunk: StreamCallback,
    onMetadata?: MetadataCallback
  ): Promise<void> {
    if (!response.body) {
      throw new Error('No response body for streaming');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    try {
      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          onChunk('', true);
          break;
        }

        const chunk = decoder.decode(value, { stream: true });
        this.processStreamChunk(chunk, onChunk, onMetadata);
      }
    } finally {
      reader.releaseLock();
    }
  }

  /**
  处理流式数据块（子类实现）
  */
  protected abstract processStreamChunk(
    chunk: string,
    onChunk: StreamCallback,
    onMetadata?: MetadataCallback
  ): void;

  /**
  验证配置（子类实现）
  */
  protected abstract validateConfig(): string | null;

  // 抽象方法 - 子类必须实现
  abstract testConnection(): Promise<APIResponse<ConnectionTestResponse>>;
  abstract listModels(): Promise<APIResponse<ModelsResponse>>;
  abstract switchModel(modelName: string): Promise<APIResponse<void>>;
  abstract sendStreamMessage(
    request: ChatRequest,
    onChunk: StreamCallback,
    onMetadata?: MetadataCallback
  ): Promise<void>;
  abstract sendMessage(request: ChatRequest): Promise<APIResponse<ChatResponse>>;
}