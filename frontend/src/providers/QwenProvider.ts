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
import { createModuleLogger } from '../utils/logger';

/**
 * 阿里千问 Provider
 */
export class QwenProvider extends BaseProvider {
  private readonly logger = createModuleLogger('QwenProvider');
  
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
    
    // 对于内置 Provider，可以使用环境变量中的 API key
    if (this.config.type === 'qwen' && !this.config.apiKey && !import.meta.env.VITE_QWEN_KEY) {
      return 'API key is required';
    }
    
    // 验证URL格式
    try {
      new URL(this.config.apiUrl);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_error) {
      return 'Invalid API URL format';
    }
    
    return null;
  }

  /**
   * 构建请求头
   */
  protected buildHeaders(): Record<string, string> {
    // 使用基类的实现
    return super.buildHeaders();
  }

  /**
   * 构建消息格式 - 使用 OpenAI 格式
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
   * 处理流式数据块 - 处理 OpenAI 格式的 SSE
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
            console.error('[QwenProvider] Stream error:', parsed.error);
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
      // 尝试调用一个简单的API来测试连接
      const url = this.buildUrl('chat/completions');
      this.logger.debug('Testing connection to URL:', url);
      
      const headers = this.buildHeaders();
      this.logger.debug('Request headers:', headers);
      
      const requestBody = {
        model: 'qwen-turbo', // 使用一个常见的模型进行测试
        messages: [{ role: 'user', content: 'Hello' }],
        max_tokens: 10
      };
      
      this.logger.debug('Request body:', requestBody);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(requestBody)
      });

      this.logger.debug('Test connection response status:', response.status);
      this.logger.debug('Test connection response headers:', [...response.headers.entries()]);

      // 检查响应状态
      if (response.ok) {
        this.isConnected = true;
        // 尝试解析响应，但即使解析失败也认为连接成功
        try {
          const responseText = await response.text();
          this.logger.debug('Test connection response text:', responseText);
          
          if (responseText) {
            const result = JSON.parse(responseText);
            this.logger.debug('Test connection response parsed:', result);
          }
        } catch (parseError) {
          this.logger.warn('Failed to parse test connection response:', parseError);
        }
        
        return {
          success: true,
          data: {
            success: true,
            latency: Date.now() - startTime,
            version: 'qwen-provider',
            models_count: 0, // 实际模型数量需要通过其他方式获取
            server_info: {
              name: 'Qwen API',
              version: '1.0',
              capabilities: ['chat', 'streaming']
            }
          }
        };
      } else {
        const errorText = await response.text();
        this.logger.warn(`Test connection failed with status ${response.status}:`, errorText);
        this.isConnected = false;
        return {
          success: false,
          error: `HTTP ${response.status}: ${errorText}`
        };
      }
    } catch (error) {
      this.logger.error('Test connection failed with exception:', error);
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
      // 首先尝试使用OpenAI兼容接口获取模型列表
      // 确保使用正确的兼容模式URL
      const url = this.buildUrl('models');
      
      // 检查URL是否正确
      if (!url || url === '/models') {
        throw new Error('Invalid URL constructed for models API');
      }
      
      const response = await fetch(url, {
        method: 'GET',
        headers: this.buildHeaders()
      });

      if (response.ok) {
        // 先获取响应文本，再尝试解析JSON
        const responseText = await response.text();
        
        // 检查响应是否是HTML（说明URL不正确）
        if (responseText.trim().startsWith('<!doctype html') || responseText.trim().startsWith('<html')) {
          throw new Error('Received HTML response instead of JSON. Check if the URL is correct.');
        }
        
        // 检查响应文本是否为空
        if (!responseText) {
          throw new Error('Empty response from models API');
        }
        
        // 尝试解析JSON
        let result: { data?: Array<{ 
          id: string; 
          name?: string;
          description?: string;
          owned_by?: string;
        }> };
        try {
          result = JSON.parse(responseText);
        } catch (parseError) {
          throw new Error(`Failed to parse JSON response: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`);
        }
        
        // 转换模型数据格式（OpenAI兼容格式）
        let models: ModelInfo[] = [];
        
        if (result.data && Array.isArray(result.data)) {
          models = result.data.map((model) => ({
            id: model.id,
            name: model.name || model.id,
            description: model.description || model.owned_by || 'Qwen model'
          }));
        }

        return {
          success: true,
          data: {
            models,
            currentModel: this.currentModel || undefined
          }
        };
      } else {
        // 如果OpenAI兼容接口获取失败，记录错误并回退到硬编码列表
        // 读取响应文本但不使用（避免未使用变量错误）
        await response.text();
        
        // 返回硬编码的常用模型列表
        const commonModels = [
          { id: 'qwen-turbo', name: 'Qwen Turbo', description: '快速推理模型' },
          { id: 'qwen-plus', name: 'Qwen Plus', description: '平衡推理模型' },
          { id: 'qwen-max', name: 'Qwen Max', description: '复杂任务模型' },
          { id: 'qwen-long', name: 'Qwen Long', description: '长文本处理模型' }
        ];

        return {
          success: true,
          data: {
            models: commonModels,
            currentModel: this.currentModel || undefined
          }
        };
      }
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_error) {
      // 如果出现异常，返回硬编码的常用模型列表
      const commonModels = [
        { id: 'qwen-turbo', name: 'Qwen Turbo', description: '快速推理模型' },
        { id: 'qwen-plus', name: 'Qwen Plus', description: '平衡推理模型' },
        { id: 'qwen-max', name: 'Qwen Max', description: '复杂任务模型' },
        { id: 'qwen-long', name: 'Qwen Long', description: '长文本处理模型' }
      ];

      return {
        success: true,
        data: {
          models: commonModels,
          currentModel: this.currentModel || undefined
        }
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

    // 检查是否有响应体
    if (!response.body) {
      throw new Error('No response body for streaming');
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

    // 检查是否有数据返回
    if (!result.data) {
      return {
        success: false,
        error: 'No response data received'
      };
    }

    const choice = result.data!.choices?.[0];
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
export function createQwenProvider(config: ProviderConfig): QwenProvider {
  return new QwenProvider(config);
}