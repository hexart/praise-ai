// frontend/src/providers/OllamaProvider.ts
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

/**
 * Ollama Provider - 与 OpenAI 兼容的后端 API 代理通信
 */
export class OllamaProvider extends BaseProvider {
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
    return null;
  }

  /**
   * 测试连接 - 使用 OpenAI 格式的端点
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
      const modelsResult = await this.request<{
        object?: string;
        data?: Array<{ id: string }>
      }>('v1/models');

      if (modelsResult.success && modelsResult.data?.data) {
        this.isConnected = true;
        return {
          success: true,
          data: {
            success: true,
            latency: Date.now() - startTime,
            version: 'ollama-openai-compatible',
            models_count: modelsResult.data.data.length
          }
        };
      }

      // 连接失败
      this.isConnected = false;
      return {
        success: false,
        error: modelsResult.error || 'Connection test failed'
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
   * 获取模型列表 - 使用 OpenAI 格式的端点
   */
  async listModels(): Promise<APIResponse<ModelsResponse>> {
    const result = await this.request<{
      object: string;
      data: Array<{
        id: string;
        object: string;
        created: number;
        owned_by: string;
      }>
    }>('v1/models');

    if (!result.success) {
      return {
        success: false,
        error: result.error || 'Failed to fetch models'
      };
    }

    // 转换为前端期望的格式
    const models = result.data!.data.map(model => ({
      id: model.id,
      name: model.id,
      description: `${model.owned_by} model`,
      created_at: model.created * 1000 // 转换为毫秒
    }));

    return {
      success: true,
      data: {
        models,
        currentModel: this.currentModel || models[0]?.id
      }
    };
  }

  /**
   * 切换模型
   */
  async switchModel(modelName: string): Promise<APIResponse<void>> {
    // 对于 OpenAI 兼容接口，我们只需要记录模型名称
    // 实际的模型切换在发送消息时进行
    this.currentModel = modelName;
    return {
      success: true
    };
  }

  /**
   * 处理流式数据块 - 现在处理 OpenAI 格式的 SSE
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
            console.error('[OllamaProvider] Stream error:', parsed.error);
            throw new Error(parsed.error);
          }

          // OpenAI 格式的响应
          const delta = parsed.choices?.[0]?.delta;
          if (delta?.content) {
            onChunk(delta.content, false);
          }

          // 检查是否完成
          if (parsed.choices?.[0]?.finish_reason) {
            if (parsed.choices[0].finish_reason === 'stop') {
              onChunk('', true);
            }

            if (onMetadata) {
              onMetadata({
                model: parsed.model,
                finish_reason: parsed.choices[0].finish_reason,
                usage: parsed.usage
              });
            }
          }
        } catch (parseError) {
          console.warn('Failed to parse stream chunk:', line, parseError);
          // 如果是错误，直接抛出
          if (line.includes('error')) {
            throw parseError;
          }
        }
      }
    }
  }

  /**
   * 构建 OpenAI 格式的消息数组
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

    // 添加历史对话（保留最近5轮对话以节省 token）
    const recentHistory = request.chatHistory.slice(-5);
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
   * 发送消息 - 使用 OpenAI 格式的 chat/completions 端点
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
    }>('v1/chat/completions', {
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
   * 发送流式消息 - 使用 OpenAI 格式的 chat/completions 端点
   */
  async sendStreamMessage(
    request: ChatRequest,
    onChunk: StreamCallback,
    onMetadata?: MetadataCallback
  ): Promise<void> {
    console.log('[OllamaProvider] sendStreamMessage - currentModel:', this.currentModel);
    console.log('[OllamaProvider] sendStreamMessage - config.defaultModel:', this.config.defaultModel);

    if (!this.currentModel) {
      // 尝试使用默认模型
      this.currentModel = this.config.defaultModel || null;
      console.log('[OllamaProvider] Auto-set currentModel to:', this.currentModel);
    }

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

    const response = await fetch(`${this.config.apiUrl}/v1/chat/completions`, {
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
   * 构建请求头 - Ollama 通常不需要认证
   */
  protected buildHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      // Ollama 本地服务通常不需要 API Key
      // 如果需要，可以在配置中添加
      ...(this.config.apiKey ? { 'Authorization': `Bearer ${this.config.apiKey}` } : {})
    };
  }
}

// 导出一个工厂函数便于创建实例
export function createOllamaProvider(config: ProviderConfig): OllamaProvider {
  return new OllamaProvider(config);
}