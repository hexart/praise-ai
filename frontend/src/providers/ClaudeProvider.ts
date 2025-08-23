// frontend/src/providers/ClaudeProvider.ts
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
 * Anthropic Claude Provider实现
 */
export class ClaudeProvider extends BaseProvider {
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
    if (!this.config.apiKey) {
      return 'Anthropic API key is required';
    }
    return null;
  }

  /**
   * 构建请求头 - Claude API需要特殊的headers
   */
  protected buildHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...this.config.headers
    };

    if (this.config.apiKey) {
      // Claude 需要特殊的头
      headers['x-api-key'] = this.config.apiKey;
      headers['anthropic-version'] = '2023-06-01';
      headers['anthropic-dangerous-direct-browser-access'] = 'true';
    }

    return headers;
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
      const result = await this.request<{ data: Array<{ id: string }> }>('models');
      
      this.isConnected = result.success;
      return {
        success: result.success,
        data: {
          success: result.success,
          latency: Date.now() - startTime,
          version: 'anthropic-claude-api',
          models_count: result.data?.data?.length || 0,
          server_info: {
            name: 'Anthropic Claude API',
            version: '2023-06-01',
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
    // 使用 Anthropic API 的 models 端点
    const result = await this.request<{
      data: Array<{
        id: string;
        type: string;
        display_name?: string;
        created_at?: string;
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
      name: model.display_name || model.id,
      description: `Claude model: ${model.id}`,
      created_at: model.created_at ? new Date(model.created_at).getTime() : Date.now()
    }));

    return {
      success: true,
      data: {
        models,
        currentModel: this.currentModel || this.config.defaultModel,
        total: models.length,
        hasMore: false
      }
    };
  }
  
  /**
   * 切换模型
   */
  async switchModel(modelName: string): Promise<APIResponse<void>> {
    // 对于Claude，我们只需要记录模型名称
    this.currentModel = modelName;
    return {
      success: true
    };
  }

  /**
   * 构建Claude格式的消息
   */
  private buildMessages(request: ChatRequest): Array<{ role: string; content: string }> {
    const messages: Array<{ role: string; content: string }> = [];

    // Claude API不支持system role在messages中，系统提示需要单独处理
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

          // Claude API的流式响应格式
          if (parsed.type === 'content_block_delta') {
            const content = parsed.delta?.text;
            if (content) {
              onChunk(content, false);
            }
          } else if (parsed.type === 'message_delta') {
            // 处理消息更新
            if (parsed.delta?.stop_reason) {
              onChunk('', true);
              
              if (onMetadata) {
                onMetadata({
                  model: parsed.model,
                  finish_reason: parsed.delta.stop_reason,
                  usage: parsed.usage
                });
              }
            }
          } else if (parsed.type === 'message_stop') {
            onChunk('', true);
            
            if (onMetadata) {
              onMetadata({
                model: parsed.model,
                finish_reason: 'stop',
                usage: parsed.usage
              });
            }
          } else if (parsed.type === 'error') {
            throw new Error(parsed.error?.message || 'Stream error');
          }
        } catch (error) {
          console.warn('Failed to parse stream chunk:', data, error);
          if (line.includes('error')) {
            throw error;
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
    const model = this.currentModel || this.config.defaultModel || 'claude-opus-4-1-20250805';
    const messages = this.buildMessages(request);

    const payload: {
      model: string;
      max_tokens: number;
      messages: Array<{ role: string; content: string }>;
      stream: boolean;
      system?: string;
    } = {
      model,
      max_tokens: 4000,
      messages,
      stream: true
    };

    // Claude API的system参数单独处理
    if (request.systemPrompt) {
      payload.system = request.systemPrompt;
    }

    try {
      const url = `${this.config.apiUrl.replace(/\/+$/, '')}/messages`;
      const response = await fetch(url, {
        method: 'POST',
        headers: this.buildHeaders(),
        body: JSON.stringify(payload),
        mode: 'cors',
        credentials: 'omit',
        cache: 'no-cache'
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      await this.handleStream(response, onChunk, onMetadata);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Stream request failed';
      onChunk(`Error: ${errorMessage}`, true);
      throw error;
    }
  }

  /**
   * 发送普通消息
   */
  async sendMessage(request: ChatRequest): Promise<APIResponse<ChatResponse>> {
    const model = this.currentModel || this.config.defaultModel || 'claude-opus-4-1-20250805';
    const messages = this.buildMessages(request);

    const payload: {
      model: string;
      max_tokens: number;
      messages: Array<{ role: string; content: string }>;
      system?: string;
    } = {
      model,
      max_tokens: 4000,
      messages
    };

    // Claude API的system参数单独处理
    if (request.systemPrompt) {
      payload.system = request.systemPrompt;
    }

    const result = await this.request<{
      id: string;
      type: string;
      role: string;
      content: Array<{ type: string; text: string }>;
      model: string;
      stop_reason: string;
      usage: {
        input_tokens: number;
        output_tokens: number;
      };
    }>('messages', {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    if (!result.success) {
      return {
        success: false,
        error: result.error || 'Request failed'
      };
    }

    const response = result.data!;
    const content = response.content?.[0]?.text || '';

    return {
      success: true,
      data: {
        content,
        done: true,
        usage: {
          promptTokens: response.usage?.input_tokens || 0,
          completionTokens: response.usage?.output_tokens || 0,
          totalTokens: (response.usage?.input_tokens || 0) + (response.usage?.output_tokens || 0)
        },
        model: response.model
      }
    };
  }
}

// 导出一个工厂函数便于创建实例
export function createClaudeProvider(config: ProviderConfig): ClaudeProvider {
  return new ClaudeProvider(config);
}