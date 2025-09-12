// frontend/src/providers/CustomProvider.ts
import { BaseProvider } from './BaseProvider';
import type {
  ProviderConfig,
  APIResponse,
  ModelsResponse,
  ConnectionTestResponse,
  StreamCallback,
  MetadataCallback
} from '../types/provider';
import type { ChatRequest, ChatResponse } from '../types/chat';
import { createModuleLogger } from '../utils/logger';

/**
 * 自定义 Provider - 允许用户接入自己的各种模型
 */
export class CustomProvider extends BaseProvider {
  private readonly logger = createModuleLogger('CustomProvider');
  
  constructor(config: ProviderConfig) {
    super(config);
  }

  /**
   * 验证配置
   */
  protected validateConfig(): string | null {
    if (!this.config.apiUrl) {
      return 'API URL is required';
    }
    // 对于自定义 Provider，API key 是可选的，取决于用户的服务是否需要认证
    return null;
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
      // 尝试获取模型列表来测试连接
      const result = await this.request<unknown>('models');
      
      this.isConnected = result.success;
      return {
        success: result.success,
        data: {
          success: result.success,
          latency: Date.now() - startTime,
          version: 'custom-provider',
          models_count: result.success ? 1 : 0, // 自定义 Provider 可能不返回模型列表
          server_info: {
            name: 'Custom API',
            version: '1.0',
            capabilities: ['chat', 'streaming']
          }
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
    // 尝试从 API 获取模型列表，如果失败则返回空列表
    try {
      const result = await this.request<{
        data: Array<{
          id: string;
          object: string;
          created: number;
          owned_by: string;
        }>
      }>('models');

      if (!result.success) {
        // 如果请求失败，返回空列表让用户手动输入模型名称
        return {
          success: true,
          data: {
            models: [],
            currentModel: this.currentModel || undefined
          }
        };
      }

      // 转换模型数据格式
      const models = result.data!.data.map(model => ({
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
    } catch (error) {
      this.logger.warn('Failed to list models:', error);
      // 如果出现异常，也返回空列表让用户手动输入模型名称
      return {
        success: true,
        data: {
          models: [],
          currentModel: this.currentModel || undefined
        }
      };
    }
  }
  
  /**
   * 切换模型
   */
  async switchModel(modelName: string): Promise<APIResponse<void>> {
    // 对于自定义 Provider，我们只需要记录模型名称
    this.currentModel = modelName;
    return {
      success: true
    };
  }

  /**
   * 构建消息格式 - 默认使用 OpenAI 格式
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
   * 处理流式数据块 - 默认处理 OpenAI 格式的 SSE
   */
  protected processStreamChunk(
    chunk: string,
    onChunk: StreamCallback,
    onMetadata?: MetadataCallback
  ): void {
    const lines = chunk.split('\n').filter(line => line.trim());

    for (const line of lines) {
      // OpenAI 格式：data: {...}
      if (line.startsWith('data: ')) {
        const data = line.slice(6).trim();

        // 结束标记
        if (data === '[DONE]') {
          onChunk('', true);
          return;
        }

        try {
          const parsed = JSON.parse(data);

          // 检查错误
          if (parsed.error) {
            console.error('[CustomProvider] Stream error:', parsed.error);
            throw new Error(parsed.error.message || 'Stream error');
          }

          // OpenAI 格式的响应
          const delta = parsed.choices?.[0]?.delta;
          if (delta?.content) {
            onChunk(delta.content, false);
          }

          // 检查是否完成
          if (parsed.choices?.[0]?.finish_reason) {
            if (onMetadata) {
              onMetadata({
                model: parsed.model,
                finish_reason: parsed.choices[0].finish_reason,
                usage: parsed.usage
              });
            }
            
            if (parsed.choices[0].finish_reason === 'stop') {
              onChunk('', true);
            }
          }
        } catch (parseError) {
          this.logger.warn('Failed to parse stream chunk:', { line, parseError });
          // 如果是错误，直接抛出
          if (line.includes('error')) {
            throw parseError;
          }
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
    this.logger.debug('Sending stream message', {
      model: this.currentModel,
      messageLength: request.message.length
    });

    if (!this.currentModel) {
      throw new Error('No model selected');
    }

    const payload = {
      model: this.currentModel,
      messages: this.buildMessages(request),
      stream: true,
      temperature: request.options?.temperature || 0.7,
      max_tokens: request.options?.maxTokens || 1000
    };

    const response = await fetch(this.buildUrl('chat/completions'), {
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
    if (!this.currentModel) {
      return {
        success: false,
        error: 'No model selected'
      };
    }

    const payload = {
      model: this.currentModel,
      messages: this.buildMessages(request),
      stream: false,
      temperature: request.options?.temperature || 0.7,
      max_tokens: request.options?.maxTokens || 1000
    };

    const result = await this.request<{
      id: string;
      object: string;
      created: number;
      model: string;
      choices: Array<{
        index: number;
        message: {
          role: string;
          content: string;
        };
        finish_reason: string;
      }>;
      usage: {
        prompt_tokens: number;
        completion_tokens: number;
        total_tokens: number;
      };
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
          promptTokens: result.data!.usage?.prompt_tokens || 0,
          completionTokens: result.data!.usage?.completion_tokens || 0,
          totalTokens: result.data!.usage?.total_tokens || 0
        }
      }
    };
  }
}

// 导出一个工厂函数便于创建实例
export function createCustomProvider(config: ProviderConfig): CustomProvider {
  return new CustomProvider(config);
}