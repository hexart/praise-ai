# Ollama OpenAI 兼容代理服务

## 概述

本服务是一个将本地 Ollama 服务转换为 OpenAI API 兼容格式的代理层，使得任何支持 OpenAI API 的应用程序都可以无缝接入本地运行的 Ollama 模型。

### 主要特性

- ✅ **完全兼容 OpenAI API 格式** - 支持 `/v1/models`、`/v1/chat/completions` 等标准端点
- ✅ **流式响应支持** - 支持 Server-Sent Events (SSE) 格式的流式输出
- ✅ **自动格式转换** - 自动将 Ollama 格式转换为 OpenAI 格式
- ✅ **零配置** - 开箱即用，无需复杂配置
- ✅ **CORS 支持** - 支持浏览器端直接调用
- ✅ **错误处理** - 统一的错误响应格式

## 快速开始

### 前置要求

1. **安装 Ollama**
```bash
# macOS/Linux
curl -fsSL https://ollama.com/install.sh | sh

# 或访问 https://ollama.com/download 下载安装
```

2. **下载模型**
```bash
# 下载 Llama2 模型
ollama pull llama2

# 下载其他模型
ollama pull mistral
ollama pull codellama
```

3. **启动 Ollama 服务**
```bash
# Ollama 默认运行在 11434 端口
ollama serve
```

### 安装代理服务

1. **安装依赖**
```bash
pip install fastapi uvicorn httpx pydantic
```

2. **运行代理服务**
```bash
python main.py
# 服务将在 http://localhost:8000 启动
```

## API 端点

### 1. 获取模型列表

**请求**
```http
GET /v1/models
```

**响应示例**
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

### 2. 聊天完成（非流式）

**请求**
```http
POST /v1/chat/completions
Content-Type: application/json

{
  "model": "llama2",
  "messages": [
    {"role": "system", "content": "You are a helpful assistant."},
    {"role": "user", "content": "Hello, how are you?"}
  ],
  "temperature": 0.7,
  "max_tokens": 1000,
  "stream": false
}
```

**响应示例**
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
    "prompt_tokens": 15,
    "completion_tokens": 12,
    "total_tokens": 27
  }
}
```

### 3. 聊天完成（流式）

**请求**
```http
POST /v1/chat/completions
Content-Type: application/json

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

**响应示例（SSE 格式）**
```
data: {"id":"chatcmpl-123","object":"chat.completion.chunk","created":1234567890,"model":"llama2","choices":[{"index":0,"delta":{"content":"Once"},"finish_reason":null}]}

data: {"id":"chatcmpl-123","object":"chat.completion.chunk","created":1234567890,"model":"llama2","choices":[{"index":0,"delta":{"content":" upon"},"finish_reason":null}]}

data: {"id":"chatcmpl-123","object":"chat.completion.chunk","created":1234567890,"model":"llama2","choices":[{"index":0,"delta":{"content":" a"},"finish_reason":null}]}

data: {"id":"chatcmpl-123","object":"chat.completion.chunk","created":1234567890,"model":"llama2","choices":[{"index":0,"delta":{},"finish_reason":"stop"}]}

data: [DONE]
```

### 4. 文本完成

**请求**
```http
POST /v1/completions
Content-Type: application/json

{
  "model": "llama2",
  "prompt": "The weather today is",
  "temperature": 0.7,
  "max_tokens": 50,
  "stream": false
}
```

### 5. 健康检查

**请求**
```http
GET /health
```

**响应示例**
```json
{
  "status": "healthy",
  "ollama": "connected",
  "api": "openai-compatible"
}
```

## 集成示例

### Python (使用 OpenAI SDK)

```python
from openai import OpenAI

# 配置客户端指向本地代理
client = OpenAI(
    base_url="http://localhost:8000/v1",
    api_key="not-needed"  # Ollama 不需要 API key
)

# 获取模型列表
models = client.models.list()
for model in models.data:
    print(f"Model: {model.id}")

# 非流式对话
response = client.chat.completions.create(
    model="llama2",
    messages=[
        {"role": "system", "content": "You are a helpful assistant."},
        {"role": "user", "content": "Hello!"}
    ],
    temperature=0.7,
    max_tokens=1000
)
print(response.choices[0].message.content)

# 流式对话
stream = client.chat.completions.create(
    model="llama2",
    messages=[
        {"role": "user", "content": "Tell me a joke"}
    ],
    stream=True
)

for chunk in stream:
    if chunk.choices[0].delta.content:
        print(chunk.choices[0].delta.content, end="")
```

### JavaScript/TypeScript (使用 OpenAI SDK)

```javascript
import OpenAI from 'openai';

// 配置客户端
const openai = new OpenAI({
  baseURL: 'http://localhost:8000/v1',
  apiKey: 'not-needed',
  dangerouslyAllowBrowser: true // 如果在浏览器中使用
});

// 获取模型列表
async function listModels() {
  const models = await openai.models.list();
  console.log('Available models:', models.data);
}

// 非流式对话
async function chat() {
  const response = await openai.chat.completions.create({
    model: 'llama2',
    messages: [
      { role: 'user', content: 'Hello!' }
    ],
    temperature: 0.7,
    max_tokens: 1000
  });
  
  console.log(response.choices[0].message.content);
}

// 流式对话
async function streamChat() {
  const stream = await openai.chat.completions.create({
    model: 'llama2',
    messages: [
      { role: 'user', content: 'Write a haiku' }
    ],
    stream: true
  });
  
  for await (const chunk of stream) {
    process.stdout.write(chunk.choices[0]?.delta?.content || '');
  }
}
```

### cURL 示例

```bash
# 获取模型列表
curl http://localhost:8000/v1/models

# 非流式对话
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

# 流式对话
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
```

### LangChain 集成

```python
from langchain.chat_models import ChatOpenAI
from langchain.schema import HumanMessage, SystemMessage

# 配置 LangChain 使用本地 Ollama
chat = ChatOpenAI(
    openai_api_base="http://localhost:8000/v1",
    openai_api_key="not-needed",
    model_name="llama2",
    temperature=0.7
)

# 使用
messages = [
    SystemMessage(content="You are a helpful assistant."),
    HumanMessage(content="What is the capital of France?")
]

response = chat(messages)
print(response.content)
```

## 配置选项

### 环境变量

```bash
# 设置 Ollama 服务地址（默认：http://localhost:11434）
OLLAMA_BASE_URL=http://localhost:11434

# 设置代理服务端口（默认：8000）
PORT=8000

# 设置请求超时时间（秒，默认：60）
TIMEOUT=60
```

### 修改默认配置

编辑 `main.py` 中的配置：

```python
# Ollama 配置
OLLAMA_BASE_URL = "http://localhost:11434"  # Ollama 服务地址
TIMEOUT = 60.0  # 请求超时时间

# 服务器配置
if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=False)
```

## 支持的参数

### Chat Completions 参数

| 参数 | 类型 | 说明 | 默认值 |
|------|------|------|--------|
| model | string | 模型名称（必须） | - |
| messages | array | 消息列表（必须） | - |
| temperature | float | 温度参数 (0-2) | 0.7 |
| max_tokens | integer | 最大生成 token 数 | 1000 |
| top_p | float | Top-p 采样参数 | 1.0 |
| stream | boolean | 是否流式输出 | false |
| frequency_penalty | float | 频率惩罚 | 0.0 |
| presence_penalty | float | 存在惩罚 | 0.0 |

### Message 格式

```json
{
  "role": "system" | "user" | "assistant",
  "content": "消息内容"
}
```

## 错误处理

所有错误响应都遵循 OpenAI API 格式：

```json
{
  "error": {
    "message": "错误描述",
    "type": "error_type",
    "code": "error_code"
  }
}
```

常见错误代码：
- `400` - 请求参数错误
- `404` - 模型不存在
- `500` - 服务器内部错误
- `503` - Ollama 服务不可用

## 性能优化

### 1. 调整超时时间

对于大模型或长文本，可能需要增加超时时间：

```python
TIMEOUT = 120.0  # 增加到 120 秒
```

### 2. 并发处理

使用 `uvicorn` 的 workers 参数增加并发处理能力：

```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
```

### 3. 模型预加载

在 Ollama 中预加载常用模型：

```bash
# 预加载模型到内存
ollama run llama2 "test"
```

## 故障排除

### 1. 连接被拒绝

**问题**：`Connection refused` 错误

**解决方案**：
- 确认 Ollama 服务正在运行：`ollama list`
- 检查 Ollama 端口：`curl http://localhost:11434/api/version`
- 确认防火墙设置

### 2. 模型未找到

**问题**：`Model not found` 错误

**解决方案**：
- 列出可用模型：`ollama list`
- 下载所需模型：`ollama pull model-name`

### 3. 响应超时

**问题**：请求超时错误

**解决方案**：
- 增加 `TIMEOUT` 配置
- 使用更小的 `max_tokens` 值
- 考虑使用流式响应

### 4. CORS 错误

**问题**：浏览器 CORS 错误

**解决方案**：
- 确认代理服务正在运行
- 使用正确的 URL（包含端口）
- 检查 CORS 中间件配置

## 安全建议

1. **生产环境部署**
   - 不要在公网直接暴露服务
   - 使用反向代理（如 Nginx）
   - 添加身份验证机制

2. **API Key 管理**
   - 可以修改代码添加 API Key 验证
   - 使用环境变量管理敏感信息

3. **访问控制**
   - 限制 CORS 来源
   - 添加请求频率限制
   - 记录访问日志

## 扩展功能

### 添加认证

```python
from fastapi import Header, HTTPException

async def verify_api_key(x_api_key: str = Header(...)):
    if x_api_key != "your-secret-key":
        raise HTTPException(status_code=401, detail="Invalid API Key")

# 在需要认证的端点添加依赖
@app.post("/v1/chat/completions", dependencies=[Depends(verify_api_key)])
async def chat_completions(request: ChatCompletionRequest):
    # ...
```

### 添加请求日志

```python
@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    logger.info(f"{request.method} {request.url.path} - {process_time:.3f}s")
    return response
```

## 许可证

MIT License

## 贡献

欢迎提交 Issue 和 Pull Request！

## 联系方式

- 作者：hexart
- 邮箱：hexart@126.com
- GitHub：[项目地址]

---

**注意**：本项目是 Ollama 的第三方代理实现，不隶属于 Ollama 或 OpenAI 官方。