// frontend/src/providers/UnifiedProvider.ts
import { BaseProvider } from './BaseProvider';
import type {
  ProviderConfig,
  APIResponse,
  ModelsResponse,
  ConnectionTestResponse,
  StreamCallback,
  MetadataCallback,
  ModelInfo
} from '../types/provider';
import type { ChatRequest, ChatResponse } from '../types/chat';

// 扩展 ProviderConfig 类型定义
interface UnifiedProviderConfig extends ProviderConfig {
  providerType?: 'openai' | 'ollama';
}

/**
 * 统一的 OpenAI 兼容 Provider
 * 支持 OpenAI API 和 OpenAI 兼容的服务（如改造后的 Ollama）
 */
// 扩展 ProviderConfig 类型定义
interface UnifiedProviderConfig extends ProviderConfig {
  providerType?: 'openai' | 'ollama';
}

export class UnifiedProvider extends BaseProvider {
  private providerType: 'openai' | 'ollama';
  
  constructor(config: UnifiedProviderConfig) {
    super(config);
    // 根据配置判断提供商类型
    this.providerType = config.providerType || 'openai';
  }

  /**
   * 验证配置
   */
  protected validateConfig(): string | null {
    if (!this.config.apiUrl) {
      return 'API URL is required';
    }
    
    // OpenAI 需要 API Key，本地 Ollama 不需要
    if (this.providerType === 'openai' && !this.config.apiKey) {
      return 'API key is required for OpenAI';
    }
    
    return null;
  }

  /**
   * 构建请求头
   */
  protected buildHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    // 只有真正的 OpenAI 或需要认证的服务才添加 Authorization
    if (this.config.apiKey) {
      headers['Authorization'] = `Bearer ${this.config.apiKey}`;
    }
    
    return headers;
  }

  /**
   * 获取 API 基础路径
   */
  private getApiBasePath(): string {
    const baseUrl = this.config.apiUrl.replace(/\/$/, '');
    
    // 检查 URL 是否已包含版本路径
    if (baseUrl.includes('/v1') || baseUrl.includes('/chat') || baseUrl.includes('/models')) {
      return baseUrl;
    }
    
    // 默认添加 /v1 路径
    return `${baseUrl}/v1`;
  }

  /**
   * 测试连接
   */
  async testConnection(): Promise<APIResponse<ConnectionTestResponse>> {
    const validationError = this.validateConfig();
    if (validationError) {
      return {
        success: false,
        error: validationError
      };
    }

    const startTime = Date.now();
    
    try {
      const response = await fetch(`${this.getApiBasePath()}/models`, {
        method: 'GET',
        headers: this.buildHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      this.isConnected = true;
      return {
        success: true,
        data: {
          success: true,
          latency: Date.now() - startTime,
          version: this.providerType === 'ollama' ? 'ollama-openai-compatible' : 'openai',
          models_count: data.data?.length || 0
        }
      };
    } catch (error) {
      this.isConnected = false;
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Connection test failed'
      };
    }
  }

  /**
   * 获取模型列表
   */
  async listModels(): Promise<APIResponse<ModelsResponse>> {
    try {
      const response = await fetch(`${this.getApiBasePath()}/models`, {
        method: 'GET',
        headers: this.buildHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      const models: ModelInfo[] = data.data.map((model: {
        id: string;
        owned_by?: string;
        created?: number;
      }) => ({
        id: model.id,
        name: model.id,
        description: `${model.owned_by || 'unknown'} model`,
        created_at: model.created ? model.created * 1000 : Date.now()
      }));

      return {
        success: true,
        data: {
          models,
          currentModel: this.currentModel || this.config.defaultModel || models[0]?.id
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch models'
      };
    }
  }

  /**
   * 切换模型
   */
  async switchModel(modelName: string): Promise<APIResponse<void>> {
    this.currentModel = modelName;
    return {
      success: true
    };
  }

  /**
   * 构建 OpenAI 格式的消息
   */
  private buildMessages(request: ChatRequest): Array<{ role: string; content: string }> {
    const messages: Array<{ role: string; content: string }> = [];

    // 添加系统提示词
    if (request.systemPrompt) {
      messages.push({
        role: 'system',
        content: request.systemPrompt
      });
    }

    // 添加历史对话（保留最近的对话以避免超出上下文限制）
    const maxHistory = this.providerType === 'ollama' ? 5 : 10;
    const recentHistory = request.chatHistory.slice(-maxHistory);
    
    for (const msg of recentHistory) {
      if (msg.role === 'user' || msg.role === 'assistant') {
        messages.push({
          role: msg.role,
          content: msg.content
        });
      }
    }

    // 添加当前消息
    messages.push({
      role: 'user',
      content: request.message
    });

    return messages;
  }

  /**
   * 处理流式数据块
   */
  protected processStreamChunk(
    chunk: string,
    onChunk: StreamCallback,
    onMetadata?: MetadataCallback
  ): void {
    const lines = chunk.split('\n').filter(line => line.trim());

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6).trim();

        if (data === '[DONE]') {
          onChunk('', true);
          return;
        }

        try {
          const parsed = JSON.parse(data);
          const delta = parsed.choices?.[0]?.delta;

          if (delta?.content) {
            onChunk(delta.content, false);
          }

          if (parsed.choices?.[0]?.finish_reason && onMetadata) {
            onMetadata({
              model: parsed.model,
              finish_reason: parsed.choices[0].finish_reason,
              usage: parsed.usage
            });
          }
        } catch (error) {
          console.warn('Failed to parse stream chunk:', data, error);
        }
      }
    }
  }

  /**
   * 发送流式消息
   */
  async sendStreamMessage(
    request: ChatRequest,
    onChunk: StreamCallback,
    onMetadata?: MetadataCallback
  ): Promise<void> {
    const model = this.currentModel || this.config.defaultModel;
    if (!model) {
      throw new Error('No model selected');
    }

    const payload = {
      model,
      messages: this.buildMessages(request),
      stream: true,
      temperature: request.options?.temperature || 0.7,
      max_tokens: request.options?.maxTokens || 1000
    };

    const response = await fetch(`${this.getApiBasePath()}/chat/completions`, {
      method: 'POST',
      headers: this.buildHeaders(),
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    await this.handleStream(response, onChunk, onMetadata);
  }

  /**
   * 发送普通消息
   */
  async sendMessage(request: ChatRequest): Promise<APIResponse<ChatResponse>> {
    const model = this.currentModel || this.config.defaultModel;
    if (!model) {
      return {
        success: false,
        error: 'No model selected'
      };
    }

    const payload = {
      model,
      messages: this.buildMessages(request),
      stream: false,
      temperature: request.options?.temperature || 0.7,
      max_tokens: request.options?.maxTokens || 1000
    };

    try {
      const response = await fetch(`${this.getApiBasePath()}/chat/completions`, {
        method: 'POST',
        headers: this.buildHeaders(),
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      
      const choice = data.choices?.[0];
      if (!choice) {
        return {
          success: false,
          error: 'No response generated'
        };
      }

      return {
        success: true,
        data: {
          content: choice.message.content,
          done: true,
          model: data.model,
          usage: data.usage ? {
            promptTokens: data.usage.prompt_tokens,
            completionTokens: data.usage.completion_tokens,
            totalTokens: data.usage.total_tokens
          } : undefined
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send message'
      };
    }
  }
}

// 导出便利的工厂函数
export function createProvider(config: UnifiedProviderConfig): UnifiedProvider {
  return new UnifiedProvider(config);
}

// 为了向后兼容，也导出为 OpenAIProvider 和 OllamaProvider
export class OpenAIProvider extends UnifiedProvider {
  constructor(config: ProviderConfig) {
    super({ ...config, providerType: 'openai' });
  }
}

export class OllamaProvider extends UnifiedProvider {
  constructor(config: ProviderConfig) {
    super({ ...config, providerType: 'ollama' });
  }
}