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

/**
OpenAI Provider实现
*/
export class OpenAIProvider extends BaseProvider {
  constructor(config: ProviderConfig) {
    super(config);
  }

  /**
  验证配置
  */
  protected validateConfig(): string | null {
    if (!this.config.apiUrl) {
      return 'API URL is required';
    }
    // 对于内置 Provider，可以使用环境变量中的 API key
    if (this.config.type === 'openai' && !this.config.apiKey && !import.meta.env.VITE_OPENAI_KEY) {
      return 'API key is required';
    }
    return null;
  }

  /**
  测试连接
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
    const result = await this.request<{ data: Array<{ id: string }> }>('models');

    if (result.success) {
      this.isConnected = true;
      return {
        success: true,
        data: {
          success: true,
          latency: Date.now() - startTime,
          version: 'openai-compatible',
          models_count: result.data?.data?.length || 0
        }
      };
    }

    this.isConnected = false;
    return {
      success: false,
      error: result.error || 'Connection test failed'
    };
  }

  /**
  获取模型列表
  */
  async listModels(): Promise<APIResponse<ModelsResponse>> {
    const result = await this.request<{
      data: Array<{
        id: string;
        object: string;
        created: number;
        owned_by: string;
      }>
    }>('models');

    if (!result.success) {
      return {
        success: false,
        error: result.error || 'Failed to fetch models'
      };
    }
    const models: ModelInfo[] = result.data!.data.map(model => ({
      id: model.id,
      name: model.id,
      description: `${model.owned_by} model`,
      created_at: model.created * 1000 // 转换为毫秒时间戳
    }));

    return {
      success: true,
      data: {
        models,
        currentModel: this.currentModel || undefined
      }
    };
  }

  /**
  切换模型
  */
  async switchModel(modelName: string): Promise<APIResponse<void>> {
    // 对于OpenAI，我们只需要记录模型名称
    this.currentModel = modelName;
    return {
      success: true
    };
  }

  /**
  处理流式数据块
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
  构建OpenAI格式的消息
  */
  private buildMessages(request: ChatRequest): Array<{ role: string; content: string; }> {
    const messages: Array<{ role: string; content: string }> = [];

    // 添加系统提示词
    if (request.systemPrompt) {
      messages.push({
        role: 'system',
        content: request.systemPrompt
      });
    }

    // 添加历史对话
    const recentHistory = request.chatHistory.slice(-10); // 保留最近10轮对话
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
  发送普通消息
  */
  async sendMessage(request: ChatRequest): Promise<APIResponse<ChatResponse>> {
    const model = this.currentModel;
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

    const result = await this.request<{
      choices: Array<{
        message: {
          content: string;
          role: string;
        };
        finish_reason: string;
      }>;
      usage: {
        prompt_tokens: number;
        completion_tokens: number;
        total_tokens: number;
      };
      model: string;
    }>('chat/completions', {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    if (!result.success) {
      return {
        success: false,
        error: result.error || 'Failed to send message'
      };
    }
    const choice = result.data!.choices[0];
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
        model: result.data!.model,
        usage: {
          promptTokens: result.data!.usage.prompt_tokens,
          completionTokens: result.data!.usage.completion_tokens,
          totalTokens: result.data!.usage.total_tokens
        }
      }
    };
  }

  /**
  发送流式消息
  */
  async sendStreamMessage(
    request: ChatRequest,
    onChunk: StreamCallback,
    onMetadata?: MetadataCallback
  ): Promise<void> {
    const model = this.currentModel;
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

    const response = await fetch(`${this.config.apiUrl}/chat/completions`, {
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

  buildHeaders(): Record<string, string> {
    // 使用基类的实现
    return super.buildHeaders();
  }
}

// 导出一个工厂函数便于创建实例
export function createOpenAIProvider(config: ProviderConfig): OpenAIProvider {
  return new OpenAIProvider(config);
}