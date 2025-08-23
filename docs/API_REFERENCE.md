# Praise AI API 参考文档

## 📋 目录

- [前端API](#前端api)
- [后端API](#后端api)
- [数据类型定义](#数据类型定义)
- [错误代码](#错误代码)
- [使用示例](#使用示例)

## 🎯 前端API

### Provider接口 (IProvider)

#### testConnection()
测试AI服务连接状态

```typescript
testConnection(): Promise<APIResponse<ConnectionTestResponse>>

// 返回类型
interface ConnectionTestResponse {
  status: 'connected' | 'disconnected';
  message?: string;
  latency?: number;
}

// 使用示例
const result = await provider.testConnection();
if (result.success) {
  console.log('连接状态:', result.data.status);
}
```

#### listModels()
获取可用模型列表

```typescript
listModels(): Promise<APIResponse<ModelsResponse>>

// 返回类型
interface ModelsResponse {
  models: ModelInfo[];
}

interface ModelInfo {
  id: string;
  name: string;
  size?: string;
  description?: string;
  parameters?: string;
}

// 使用示例
const result = await provider.listModels();
if (result.success) {
  console.log('可用模型:', result.data.models);
}
```

#### switchModel()
切换当前使用的模型

```typescript
switchModel(modelName: string): Promise<APIResponse<void>>

// 使用示例
const result = await provider.switchModel('llama2');
if (result.success) {
  console.log('模型切换成功');
}
```

#### sendMessage()
发送普通消息（非流式）

```typescript
sendMessage(request: ChatRequest): Promise<APIResponse<ChatResponse>>

// 请求类型
interface ChatRequest {
  message: string;
  mode: ChatMode;
  userId: string;
  chatHistory: ChatMessage[];
  systemPrompt?: string;
}

// 响应类型
interface ChatResponse {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

// 使用示例
const response = await provider.sendMessage({
  message: "你好",
  mode: "smart",
  userId: "user123",
  chatHistory: []
});
```

#### sendStreamMessage()
发送流式消息

```typescript
sendStreamMessage(
  request: ChatRequest,
  onChunk: StreamCallback,
  onMetadata?: MetadataCallback
): Promise<void>

// 回调类型
type StreamCallback = (chunk: string, isComplete: boolean) => void;
type MetadataCallback = (metadata: StreamMetadata) => void;

// 使用示例
await provider.sendStreamMessage(
  request,
  (chunk, isComplete) => {
    console.log('接收到内容:', chunk);
    if (isComplete) console.log('流式传输完成');
  }
);
```

### Hooks API

#### useApp()
主应用状态管理Hook

```typescript
interface UseAppReturn {
  provider: ReturnType<typeof useProvider>;
  chat: ReturnType<typeof useChat>;
  emotion: ReturnType<typeof useEmotionAnalysis>;
  settings: AppSettings;
  updateSettings: (newSettings: Partial<AppSettings>) => void;
  userId: string;
  isReady: boolean;
  error: string | null;
  resetAll: () => void;
  exportData: () => string;
  importData: (data: string) => boolean;
}

// 使用示例
const {
  provider,
  chat,
  emotion,
  settings,
  updateSettings
} = useApp();
```

#### useProvider()
Provider管理Hook

```typescript
interface UseProviderReturn {
  provider: BaseProvider | null;
  providerType: ProviderType;
  config: ProviderConfig;
  models: ModelInfo[];
  currentModel: string | null;
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  supportedProviders: ProviderInfo[];
  switchProvider: (type: ProviderType, config: ProviderConfig) => Promise<boolean>;
  testConnection: () => Promise<boolean>;
  refreshModels: () => Promise<void>;
  switchModel: (modelName: string) => Promise<boolean>;
}

// 使用示例
const {
  provider,
  models,
  switchProvider,
  testConnection
} = useProvider();
```

#### useChat()
聊天功能Hook

```typescript
interface UseChatReturn {
  chatHistory: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  sendMessage: (message: string, mode: ChatMode) => Promise<void>;
  clearHistory: () => void;
  streamingMessageId: string | null;
  lastDebugInfo: string | null;
}

// 使用示例
const {
  chatHistory,
  isLoading,
  sendMessage,
  clearHistory
} = useChat({
  provider: provider.provider,
  userId: 'user123'
});
```

#### useEmotionAnalysis()
情感分析Hook

```typescript
interface UseEmotionAnalysisReturn {
  analysisHistory: EmotionAnalysis[];
  currentEmotion: EmotionAnalysis | null;
  emotionTrend: EmotionTrend | null;
  isAnalyzing: boolean;
  error: string | null;
  analyzeMessage: (message: string) => Promise<EmotionAnalysis>;
  clearHistory: () => void;
  getEmotionService: () => EmotionAnalysisService;
}

// 使用示例
const {
  analysisHistory,
  currentEmotion,
  analyzeMessage
} = useEmotionAnalysis({
  userId: 'user123',
  autoAnalyze: true
});
```

## 🌐 后端API

### 基础信息

- **基础URL**: `http://localhost:8000`
- **API版本**: v1
- **认证**: 无需认证（本地代理服务）
- **Content-Type**: `application/json`

### 端点说明

#### 健康检查

```http
GET /health
```

**响应示例**:
```json
{
  "status": "healthy",
  "ollama": "connected",
  "api": "openai-compatible",
  "version": "2.0.0"
}
```

#### 获取模型列表

```http
GET /v1/models
GET /models  # 兼容路径
```

**响应示例**:
```json
{
  "object": "list",
  "data": [
    {
      "id": "llama2",
      "object": "model",
      "created": 1234567890,
      "owned_by": "ollama"
    },
    {
      "id": "mistral",
      "object": "model", 
      "created": 1234567890,
      "owned_by": "ollama"
    }
  ]
}
```

#### 聊天完成（非流式）

```http
POST /v1/chat/completions
POST /chat/completions  # 兼容路径
```

**请求体**:
```json
{
  "model": "llama2",
  "messages": [
    {
      "role": "system",
      "content": "You are a helpful assistant."
    },
    {
      "role": "user", 
      "content": "Hello, how are you?"
    }
  ],
  "temperature": 0.7,
  "max_tokens": 1000,
  "top_p": 1.0,
  "frequency_penalty": 0.0,
  "presence_penalty": 0.0,
  "stream": false
}
```

**响应示例**:
```json
{
  "id": "chatcmpl-abc123",
  "object": "chat.completion",
  "created": 1234567890,
  "model": "llama2",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "I'm doing well, thank you! How can I help you today?"
      },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 25,
    "completion_tokens": 15,
    "total_tokens": 40
  }
}
```

#### 聊天完成（流式）

```http
POST /v1/chat/completions
Content-Type: application/json
Accept: text/event-stream
```

**请求体**:
```json
{
  "model": "llama2",
  "messages": [
    {"role": "user", "content": "Write a short story"}
  ],
  "stream": true,
  "temperature": 0.8,
  "max_tokens": 500
}
```

**响应示例** (Server-Sent Events):
```
data: {"id":"chatcmpl-123","object":"chat.completion.chunk","created":1234567890,"model":"llama2","choices":[{"index":0,"delta":{"content":"Once"},"finish_reason":null}]}

data: {"id":"chatcmpl-123","object":"chat.completion.chunk","created":1234567890,"model":"llama2","choices":[{"index":0,"delta":{"content":" upon"},"finish_reason":null}]}

data: {"id":"chatcmpl-123","object":"chat.completion.chunk","created":1234567890,"model":"llama2","choices":[{"index":0,"delta":{"content":" a"},"finish_reason":null}]}

data: {"id":"chatcmpl-123","object":"chat.completion.chunk","created":1234567890,"model":"llama2","choices":[{"index":0,"delta":{},"finish_reason":"stop"}]}

data: [DONE]
```

#### 文本完成

```http
POST /v1/completions
POST /completions  # 兼容路径
```

**请求体**:
```json
{
  "model": "llama2",
  "prompt": "The weather today is",
  "temperature": 0.7,
  "max_tokens": 50,
  "stream": false
}
```

## 📊 数据类型定义

### 核心类型

#### ChatMessage
```typescript
interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  emotion?: EmotionAnalysis;
}
```

#### EmotionAnalysis
```typescript
interface EmotionAnalysis {
  primary_emotion: string;
  intensity: number;         // 0-1
  needs: string;
  confidence: number;        // 0-1
  keywords: string[];
  analysis_source?: string;
  reasoning?: string;
}
```

#### ProviderConfig
```typescript
interface ProviderConfig {
  apiUrl: string;
  apiKey?: string;
  defaultModel?: string;
  timeout?: number;
  headers?: Record<string, string>;
}
```

#### APIResponse
```typescript
interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
}
```

### 枚举类型

#### ChatMode
```typescript
type ChatMode = 'praise' | 'comfort' | 'smart';
```

#### ProviderType
```typescript
type ProviderType = 'ollama' | 'openai';
```

#### EmotionType
```typescript
type EmotionType = 'happy' | 'sad' | 'angry' | 'anxious' | 'calm' | 'confused' | 'other';
```

## ❌ 错误代码

### 前端错误代码

| 代码 | 描述 | 解决方案 |
|------|------|----------|
| `PROVIDER_NOT_AVAILABLE` | Provider不可用 | 检查Provider配置和连接 |
| `MODEL_NOT_SELECTED` | 未选择模型 | 选择一个可用模型 |
| `NETWORK_ERROR` | 网络连接错误 | 检查网络连接 |
| `SEND_ERROR` | 消息发送失败 | 重试或检查Provider状态 |
| `ANALYSIS_ERROR` | 情感分析失败 | 会自动fallback到关键词分析 |

### 后端错误代码

| HTTP状态码 | 描述 | 原因 |
|------------|------|------|
| `400` | 请求参数错误 | 检查请求体格式 |
| `404` | 模型不存在 | 确认模型名称正确 |
| `500` | 服务器内部错误 | 检查Ollama服务状态 |
| `503` | Ollama服务不可用 | 启动Ollama服务 |
| `422` | 请求体验证失败 | 检查必需参数 |

## 🛠️ 使用示例

### JavaScript/Fetch示例

```javascript
// 获取模型列表
async function getModels() {
  const response = await fetch('http://localhost:8000/v1/models');
  const data = await response.json();
  return data.data;
}

// 发送聊天消息
async function sendChat(message) {
  const response = await fetch('http://localhost:8000/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'llama2',
      messages: [
        { role: 'user', content: message }
      ],
      temperature: 0.7,
      max_tokens: 1000
    })
  });
  
  const data = await response.json();
  return data.choices[0].message.content;
}

// 流式聊天
async function streamChat(message, onChunk) {
  const response = await fetch('http://localhost:8000/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'text/event-stream'
    },
    body: JSON.stringify({
      model: 'llama2',
      messages: [{ role: 'user', content: message }],
      stream: true
    })
  });

  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value);
    const lines = chunk.split('\n');
    
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6);
        if (data === '[DONE]') return;
        
        try {
          const parsed = JSON.parse(data);
          const content = parsed.choices[0]?.delta?.content;
          if (content) onChunk(content);
        } catch (e) {
          // 忽略解析错误
        }
      }
    }
  }
}
```

### Python示例

```python
import requests
import json

# 获取模型列表
def get_models():
    response = requests.get('http://localhost:8000/v1/models')
    return response.json()['data']

# 发送聊天消息
def send_chat(message):
    payload = {
        'model': 'llama2',
        'messages': [
            {'role': 'user', 'content': message}
        ],
        'temperature': 0.7,
        'max_tokens': 1000
    }
    
    response = requests.post(
        'http://localhost:8000/v1/chat/completions',
        headers={'Content-Type': 'application/json'},
        data=json.dumps(payload)
    )
    
    data = response.json()
    return data['choices'][0]['message']['content']

# 流式聊天
def stream_chat(message):
    payload = {
        'model': 'llama2',
        'messages': [{'role': 'user', 'content': message}],
        'stream': True
    }
    
    response = requests.post(
        'http://localhost:8000/v1/chat/completions',
        headers={
            'Content-Type': 'application/json',
            'Accept': 'text/event-stream'
        },
        data=json.dumps(payload),
        stream=True
    )
    
    for line in response.iter_lines():
        if line:
            line = line.decode('utf-8')
            if line.startswith('data: '):
                data = line[6:]
                if data == '[DONE]':
                    break
                try:
                    parsed = json.loads(data)
                    content = parsed['choices'][0]['delta'].get('content')
                    if content:
                        print(content, end='', flush=True)
                except json.JSONDecodeError:
                    continue
```

### cURL示例

```bash
# 获取模型列表
curl http://localhost:8000/v1/models

# 发送聊天消息
curl http://localhost:8000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "llama2",
    "messages": [
      {"role": "user", "content": "Hello!"}
    ],
    "temperature": 0.7,
    "max_tokens": 1000
  }'

# 流式聊天
curl http://localhost:8000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Accept: text/event-stream" \
  -d '{
    "model": "llama2",
    "messages": [
      {"role": "user", "content": "Tell me a story"}
    ],
    "stream": true
  }'

# 健康检查
curl http://localhost:8000/health
```

---

## 📞 支持

如有API使用问题，请参考：
- [主要文档](./README.md) - 基础使用指南
- [开发者指南](./DEVELOPER_GUIDE.md) - 详细开发说明
- [GitHub Issues](https://github.com/yourusername/praise-ai/issues) - 问题报告

**API版本**: v1.0.0  
**最后更新**: 2025年8月