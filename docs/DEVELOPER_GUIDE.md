# Praise AI 开发者指南

## 📋 目录

- [快速上手](#快速上手)
- [架构概览](#架构概览)
- [核心模块](#核心模块)
- [扩展开发](#扩展开发)
- [测试与部署](#测试与部署)
- [最佳实践](#最佳实践)

## 🚀 快速上手

### 开发环境设置

```bash
# 1. 环境检查
node --version    # >= 16.0.0
pnpm --version    # >= 8.0.0
python --version  # >= 3.8

# 2. 项目初始化
git clone https://github.com/hexart/praise-ai.git
cd praise-ai

# 3. 前端设置
cd frontend
pnpm install
cp .env.example .env.local

# 4. 后端设置 (使用Ollama时)
cd ../backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# 5. 启动开发服务器
# 终端1: 后端
python main.py

# 终端2: 前端
cd frontend && pnpm dev
```

### 推荐工具

- **VS Code扩展**: React snippets, TypeScript Importer, Tailwind IntelliSense
- **浏览器工具**: React DevTools, Network面板

## 🏗️ 架构概览

### 前端架构

```
App (useApp) - 主状态管理
├── Provider管理 (useProvider)
├── 聊天功能 (useChat)
└── 情感分析 (useEmotionAnalysis)
```

### 数据流

```
用户输入 → 情感分析 → 模式推荐 → Provider → AI服务 → 流式响应 → UI更新
```

### 核心设计模式

- **Hook-based状态管理**: 各功能模块通过自定义Hook管理状态
- **Provider模式**: 统一AI服务接口，支持多种AI服务商
- **Service层**: 独立的业务服务，如情感分析、提示词管理等

## 🔧 核心模块

### 1. Provider系统

```typescript
// 基础Provider类
export abstract class BaseProvider implements IProvider {
  abstract testConnection(): Promise<APIResponse<ConnectionTestResponse>>;
  abstract listModels(): Promise<APIResponse<ModelsResponse>>;
  abstract sendMessage(request: ChatRequest): Promise<APIResponse<ChatResponse>>;
  abstract sendStreamMessage(
    request: ChatRequest,
    onChunk: StreamCallback
  ): Promise<void>;
}

// 使用示例
const provider = useProvider();
await provider.switchProvider('ollama', config);
```

### 2. 情感分析系统

```typescript
// EmotionAnalysisService核心方法
export class EmotionAnalysisService {
  async analyzeEmotion(message: string): Promise<EmotionAnalysis> {
    // 1. 尝试LLM分析
    if (this.provider) {
      try {
        return await this.llmAnalysis(message);
      } catch (error) {
        console.warn('LLM分析失败，使用fallback');
      }
    }
    
    // 2. Fallback关键词分析
    return this.getFallbackAnalysis(message);
  }

  recommendMode(analysis: EmotionAnalysis): ChatMode {
    // 根据情感分析推荐聊天模式
  }
}
```

### 3. 聊天系统

```typescript
// useChat Hook核心流程
const sendMessage = async (message: string, mode: ChatMode) => {
  // 1. 添加用户消息
  addUserMessage(message);
  
  // 2. 智能模式下进行情感分析
  if (mode === 'smart') {
    const emotion = await analyzeEmotion(message);
    mode = recommendMode(emotion);
  }
  
  // 3. 构建提示词并发送流式请求
  const systemPrompt = buildSystemPrompt(mode);
  await provider.sendStreamMessage(request, handleStreamChunk);
};
```

## 🎯 扩展开发

### 添加新的AI Provider

```typescript
// 1. 创建Provider类
export class CustomProvider extends BaseProvider {
  async testConnection() {
    const response = await this.request<any>('health');
    return {
      success: true,
      data: { status: 'connected' }
    };
  }
  
  async listModels() {
    const response = await this.request<ModelsResponse>('models');
    return response;
  }
  
  async sendMessage(request: ChatRequest) {
    // 实现消息发送逻辑
  }
  
  async sendStreamMessage(request: ChatRequest, onChunk: StreamCallback) {
    // 实现流式响应逻辑
  }
}

// 2. 注册Provider
// hooks/useProvider.ts
const supportedProviders = [
  { type: 'custom', name: 'Custom AI', provider: CustomProvider }
];

// 3. 更新类型定义
// types/provider.ts
export type ProviderType = 'ollama' | 'openai' | 'custom';
```

### 添加新的聊天模式

```typescript
// 1. 更新常量定义
// constants/modes.ts
export const CHAT_MODES = {
  CREATIVE: 'creative' // 新增创意模式
} as const;

export const MODE_CONFIGS = {
  [CHAT_MODES.CREATIVE]: {
    name: '创意模式',
    icon: '🎨',
    description: '激发创意思维',
    color: 'purple',
  }
};

// 2. 更新提示词服务
// services/PromptService.ts
private getModeInstruction(mode: ChatMode): string {
  switch (mode) {
    case 'creative':
      return `当前模式：【创意模式】
回应策略：激发想象力，提供创意角度
语言风格：富有想象力、启发性`;
  }
}
```

### 创建自定义服务

```typescript
// 1. 定义服务接口
export interface ICustomService {
  processData(input: string): Promise<ProcessResult>;
  configure(options: ServiceOptions): void;
}

// 2. 实现服务类
export class CustomService implements ICustomService {
  async processData(input: string): Promise<ProcessResult> {
    try {
      const result = await this.performCustomLogic(input);
      return { success: true, data: result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

// 3. 创建Hook
export function useCustomService() {
  const [service] = useState(() => new CustomService());
  
  const processData = useCallback(async (input: string) => {
    return await service.processData(input);
  }, [service]);
  
  return { service, processData };
}
```

## 🧪 测试与部署

### 单元测试示例

```typescript
// Provider测试
describe('OllamaProvider', () => {
  it('should test connection successfully', async () => {
    const provider = new OllamaProvider(config);
    jest.spyOn(provider as any, 'request').mockResolvedValue({
      success: true,
      data: { status: 'healthy' }
    });

    const result = await provider.testConnection();
    expect(result.success).toBe(true);
  });
});

// Hook测试
describe('useChat', () => {
  it('should send message and update history', async () => {
    const { result } = renderHook(() => useChat({ provider: mockProvider }));
    
    await act(async () => {
      await result.current.sendMessage('Hi', 'smart');
    });
    
    expect(result.current.chatHistory).toHaveLength(2);
  });
});
```

### Docker部署

```dockerfile
# 前端Dockerfile
FROM node:18-alpine as builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80

# 后端Dockerfile
FROM python:3.9-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

```yaml
# docker-compose.yml
version: '3.8'
services:
  frontend:
    build: ./frontend
    ports: ["3000:80"]
  
  backend:
    build: ./backend
    ports: ["8000:8000"]
    environment:
      - OLLAMA_BASE_URL=http://host.docker.internal:11434
```

## 💡 最佳实践

### TypeScript使用

```typescript
// 严格类型定义
interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  emotion?: EmotionAnalysis;
}

// Hook返回类型
interface UseProviderReturn {
  provider: BaseProvider | null;
  models: ModelInfo[];
  switchProvider: (type: ProviderType, config: ProviderConfig) => Promise<boolean>;
}
```

### 性能优化

```typescript
// 使用React.memo避免重渲染
export const MessageBubble = React.memo<MessageBubbleProps>(({ message }) => {
  return <div className="message">{message.content}</div>;
});

// 使用useCallback稳定函数引用
const handleSendMessage = useCallback(async () => {
  await chat.sendMessage(currentMessage, selectedMode);
}, [currentMessage, selectedMode, chat]);

// 限制聊天历史长度
const addMessage = useCallback((message: ChatMessage) => {
  setChatHistory(prev => {
    const newHistory = [...prev, message];
    return newHistory.slice(-MAX_HISTORY_LENGTH);
  });
}, []);
```

### 错误处理

```typescript
// 统一错误处理格式
async function apiCall(): Promise<APIResponse<T>> {
  try {
    const result = await performAPICall();
    return { success: true, data: result };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      code: 'API_ERROR'
    };
  }
}

// 用户友好的错误提示
const handleError = (error: string) => {
  toast.error('操作失败', error);
  console.error('[Chat] Error:', error);
};
```

### 代码组织

```typescript
// 清晰的模块导出
export {
  useApp,
  useChat,
  useProvider,
  useEmotionAnalysis
} from './hooks';

export {
  BaseProvider,
  OllamaProvider,
  OpenAIProvider
} from './providers';

export * from './types';
```

## 📚 参考资源

### 官方文档
- [React](https://react.dev/) - 前端框架
- [TypeScript](https://www.typescriptlang.org/) - 类型系统
- [Tailwind CSS](https://tailwindcss.com/) - 样式框架
- [FastAPI](https://fastapi.tiangolo.com/) - 后端框架

### 相关项目
- [Ollama](https://ollama.com/) - 本地AI服务
- [OpenAI API](https://platform.openai.com/) - 云端AI服务

### 开发工具
- [VS Code](https://code.visualstudio.com/) - 推荐编辑器
- [React DevTools](https://react.dev/learn/react-developer-tools) - React调试工具

---

## 🤝 贡献指南

1. Fork项目并创建功能分支
2. 遵循现有代码风格和TypeScript规范
3. 添加必要的测试用例
4. 更新相关文档
5. 提交Pull Request

**联系方式**: 通过GitHub Issues报告问题或提出建议

---

**Happy Coding! 🚀**