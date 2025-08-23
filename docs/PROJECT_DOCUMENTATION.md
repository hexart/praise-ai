# Praise AI - 智能情感陪伴聊天应用

## 📋 目录

- [项目概述](#项目概述)
- [核心功能](#核心功能)
- [技术架构](#技术架构)
- [快速开始](#快速开始)
- [详细部署](#详细部署)
- [开发指南](#开发指南)
- [API接口](#api接口)
- [故障排除](#故障排除)

## 📖 项目概述

### 项目背景

Praise AI 是一个基于 React + TypeScript 的智能情感陪伴聊天应用，通过先进的 AI 技术为用户提供个性化的情感支持和互动对话体验。

### 核心价值

- **情感智能**: 基于 LLM 的深度情感分析，准确识别用户情感状态
- **个性化响应**: 三种专业聊天模式，满足不同情感需求
- **隐私保护**: 支持本地 AI 服务，用户数据完全本地化
- **响应多样性**: 避免模板化回复，确保每次对话的独特性

### 技术栈概览

| 层级 | 技术 | 版本 | 用途 |
|------|------|------|------|
| 前端 | React + TypeScript | 19.1.1 + 5.9.2 | 主框架 |
| 构建 | Vite | 7.1.3 | 构建工具 |
| 样式 | Tailwind CSS | 4.1.12 | 样式框架 |
| 后端 | Python + FastAPI | 3.8+ + 0.104.1 | API代理服务 |
| 包管理 | PNPM | 10.15.0+ | 依赖管理 |

## ✨ 核心功能

### 1. 三种智能聊天模式

#### 🌟 夸夸模式
- **功能**: 发现用户亮点，给予积极肯定和鼓励
- **适用场景**: 分享成就、需要信心支持、情绪低落时
- **语言风格**: 积极、真诚、有力量

#### 💕 安慰模式
- **功能**: 提供温暖理解和情感支持
- **适用场景**: 遇到困难、情绪低落、需要陪伴时
- **语言风格**: 温暖、理解、包容

#### 🤖 智能模式
- **功能**: 自动分析情感并选择最合适的回应方式
- **适用场景**: 复杂情感状态、日常对话
- **语言风格**: 平衡共情与激励，灵活调整

### 2. 深度情感分析系统

#### 情感维度分析
- **情感类型**: 支持20+种情感识别（开心、悲伤、焦虑、愤怒等）
- **情感强度**: 0-1数值表示情感强烈程度
- **用户需求**: 识别安慰、鼓励、倾听、指导等需求类型
- **分析置信度**: 评估分析结果的可信程度

#### 双分析系统架构
- **实时分析**: 用于智能模式的即时情感检测和模式推荐
- **历史追踪**: 用于情感趋势分析和长期统计

### 3. 多AI服务支持

#### 本地Ollama（推荐）
- **优势**: 本地运行、隐私保护、免费使用
- **支持模型**: Llama2、Mistral、CodeLlama等开源模型
- **连接方式**: 通过OpenAI兼容代理服务

#### OpenAI兼容API
- **优势**: 云端服务、高质量回复、快速响应
- **支持模型**: GPT-3.5-turbo、GPT-4等
- **连接方式**: 直接API调用

### 4. 高级对话功能

- **流式对话**: 支持实时流式输出，提升用户体验
- **响应多样性**: 避免模板化回复，确保每次对话独特性
- **智能引用**: 根据情感状态智能插入相关名言警句
- **历史管理**: 自动保存聊天记录，支持导入导出

## 🏗️ 技术架构

### 系统架构图

```
┌─────────────────────────────────────────────────────────────┐
│                        前端 (React)                          │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   useApp     │  │   useChat    │  │useEmotion    │     │
│  │   (主管理)    │  │   (聊天)     │  │  (情感分析)   │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│            │                │                │             │
│  ┌─────────┴────────────────┴────────────────┴─────────┐   │
│  │              useProvider (AI服务管理)               │   │
│  └─────────────────────────┬───────────────────────────┘   │
│                            │                               │
├────────────────────────────┼───────────────────────────────┤
│                            │                               │
│  ┌─────────────────────────┴───────────────────────────┐   │
│  │            后端代理 (FastAPI)                        │   │
│  │        OpenAI兼容API转换层                          │   │
│  └─────────────────────────┬───────────────────────────┘   │
│                            │                               │
├────────────────────────────┼───────────────────────────────┤
│                            │                               │
│  ┌──────────────┐         │         ┌──────────────┐     │
│  │  本地Ollama   │◄────────┼────────►│  OpenAI API  │     │
│  │   (本地AI)    │         │         │   (云端AI)   │     │
│  └──────────────┘         │         └──────────────┘     │
│                            │                               │
└────────────────────────────┼───────────────────────────────┘
                             │
                    ┌────────┴────────┐
                    │   AI模型服务     │
                    │ (Llama2, GPT等) │
                    └─────────────────┘
```

### 核心模块说明

#### 前端核心Hooks
- **`useApp`**: 主应用状态管理，整合所有子系统
- **`useProvider`**: AI服务提供商管理，支持多Provider切换
- **`useChat`**: 聊天功能管理，支持流式响应和历史记录
- **`useEmotionAnalysis`**: 情感分析和历史追踪

#### 服务层架构
- **`EmotionAnalysisService`**: 独立的情感分析服务
- **`PromptService`**: 提示词构建和管理
- **`QuoteService`**: 智能引用系统
- **`ResponseDiversityService`**: 响应多样性管理

#### Provider模式
- **`BaseProvider`**: 抽象基类，定义通用接口
- **`OllamaProvider`**: Ollama服务实现
- **`OpenAIProvider`**: OpenAI API实现

## 🚀 快速开始

### 系统要求

**最低要求**
- Node.js >= 16.0.0
- PNPM >= 8.0.0
- Python >= 3.8 (使用本地AI时)
- 现代浏览器 (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)

### 一键启动（推荐新手）

#### 使用OpenAI API（最简单）

1. **克隆项目**
```bash
git clone https://github.com/yourusername/praise-ai.git
cd praise-ai/frontend
```

2. **安装依赖**
```bash
pnpm install
```

3. **配置API密钥**
创建 `.env.local` 文件：
```env
VITE_OPENAI_KEY=your-openai-api-key
VITE_OPENAI_URL=https://api.openai.com/v1
VITE_OPENAI_DEFAULT_MODEL=gpt-3.5-turbo
```

4. **启动应用**
```bash
pnpm dev
```

访问 `http://localhost:5173` 开始使用！

#### 使用本地Ollama（推荐高级用户）

1. **安装Ollama**
```bash
# macOS/Linux
curl -fsSL https://ollama.com/install.sh | sh

# 或访问 https://ollama.com/download 下载
```

2. **下载模型**
```bash
ollama pull llama2
ollama pull mistral
```

3. **启动后端代理**
```bash
cd praise-ai/backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python main.py
```

4. **启动前端**
```bash
cd ../frontend
pnpm install
pnpm dev
```

## 📚 详细部署

### 环境变量配置

#### 前端环境变量 (`.env.local`)
```env
# Ollama配置（本地AI服务）
VITE_OLLAMA_URL=http://localhost:8000
VITE_OLLAMA_DEFAULT_MODEL=llama2

# OpenAI配置
VITE_OPENAI_URL=https://api.openai.com/v1
VITE_OPENAI_KEY=your-openai-api-key
VITE_OPENAI_DEFAULT_MODEL=gpt-3.5-turbo

# 其他配置
VITE_DEBUG_MODE=false
VITE_MAX_HISTORY_LENGTH=50
```

#### 后端环境变量
```bash
# Ollama服务地址
OLLAMA_BASE_URL=http://localhost:11434

# 代理服务端口
PORT=8000

# 请求超时时间（秒）
TIMEOUT=60
```

### 生产环境部署

#### 前端部署到Vercel
```bash
# 安装Vercel CLI
npm i -g vercel

# 部署
cd frontend
vercel --prod
```

在Vercel控制台配置环境变量。

#### 前端部署到Netlify
1. 连接GitHub仓库
2. 设置构建命令: `pnpm build`
3. 设置发布目录: `frontend/dist`
4. 配置环境变量

#### 后端Docker部署
```dockerfile
FROM python:3.9-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .
EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

```bash
docker build -t praise-ai-backend .
docker run -p 8000:8000 praise-ai-backend
```

## 🛠️ 开发指南

### 项目结构

```
frontend/src/
├── components/          # React组件
│   ├── chat/           # 聊天相关组件
│   ├── layout/         # 布局组件
│   ├── settings/       # 设置组件
│   └── ui/             # 通用UI组件
├── hooks/              # React Hooks
├── providers/          # AI服务提供商
├── services/           # 业务服务
├── types/              # TypeScript类型
├── utils/              # 工具函数
└── constants/          # 常量配置
```

### 添加新的AI Provider

1. **创建Provider类**
```typescript
// providers/CustomProvider.ts
import { BaseProvider } from './BaseProvider';

export class CustomProvider extends BaseProvider {
  async testConnection() {
    // 实现连接测试
  }
  
  async listModels() {
    // 实现模型列表获取
  }
  
  async sendMessage(request: ChatRequest) {
    // 实现消息发送
  }
  
  // ... 其他必需方法
}
```

2. **注册Provider**
```typescript
// hooks/useProvider.ts
const supportedProviders = [
  { type: 'ollama', name: 'Ollama', provider: OllamaProvider },
  { type: 'openai', name: 'OpenAI', provider: OpenAIProvider },
  { type: 'custom', name: 'Custom', provider: CustomProvider }, // 添加这行
];
```

3. **更新类型定义**
```typescript
// types/provider.ts
export type ProviderType = 'ollama' | 'openai' | 'custom';
```

### 自定义聊天模式

1. **定义新模式**
```typescript
// constants/modes.ts
export const CHAT_MODES = {
  PRAISE: 'praise',
  COMFORT: 'comfort',
  SMART: 'smart',
  CUSTOM: 'custom', // 新模式
} as const;

export const MODE_CONFIGS = {
  [CHAT_MODES.CUSTOM]: {
    name: '自定义模式',
    icon: '⚡',
    description: '自定义的聊天模式',
    color: 'blue',
  },
};
```

2. **更新提示词服务**
```typescript
// services/PromptService.ts
private getModeInstruction(mode: ChatMode) {
  switch (mode) {
    case 'custom':
      return `当前模式：【自定义模式】
回应策略：根据自定义规则处理
语言风格：自定义风格`;
    // ... 其他模式
  }
}
```

### 开发最佳实践

#### 1. TypeScript使用
- 严格类型检查，避免使用 `any`
- 为所有Hook定义清晰的返回类型
- 使用接口定义复杂数据结构

#### 2. 性能优化
- 使用 `useCallback` 和 `useMemo` 优化渲染
- 合理使用 `React.memo` 包装组件
- 控制聊天历史长度，避免内存泄漏

#### 3. 错误处理
- 统一错误响应格式
- 提供用户友好的错误信息
- 实现优雅的服务降级

#### 4. 代码规范
- 遵循ESLint规则
- 使用Prettier格式化代码
- 编写清晰的注释和文档

## 📡 API接口

### Provider接口

#### 连接测试
```typescript
interface ConnectionTestResponse {
  status: 'connected' | 'disconnected';
  message?: string;
  latency?: number;
}

// 使用方式
const result = await provider.testConnection();
if (result.success) {
  console.log('连接成功:', result.data.status);
}
```

#### 模型管理
```typescript
interface ModelInfo {
  id: string;
  name: string;
  size?: string;
  description?: string;
  parameters?: string;
}

// 获取模型列表
const models = await provider.listModels();

// 切换模型
await provider.switchModel('llama2');
```

#### 消息发送
```typescript
interface ChatRequest {
  message: string;
  mode: ChatMode;
  userId: string;
  chatHistory: ChatMessage[];
  systemPrompt?: string;
}

// 普通消息
const response = await provider.sendMessage(request);

// 流式消息
await provider.sendStreamMessage(
  request,
  (chunk, isComplete) => {
    console.log('收到内容:', chunk);
    if (isComplete) console.log('发送完成');
  }
);
```

### 后端API

#### 健康检查
```http
GET /health

Response:
{
  "status": "healthy",
  "ollama": "connected",
  "api": "openai-compatible"
}
```

#### 模型列表
```http
GET /v1/models

Response:
{
  "object": "list",
  "data": [
    {
      "id": "llama2",
      "object": "model",
      "created": 1234567890,
      "owned_by": "ollama"
    }
  ]
}
```

#### 聊天完成
```http
POST /v1/chat/completions
Content-Type: application/json

{
  "model": "llama2",
  "messages": [
    {"role": "user", "content": "Hello"}
  ],
  "stream": false,
  "temperature": 0.7
}
```

## 🔧 故障排除

### 常见问题

#### 1. 无法连接Ollama
**症状**: `Connection refused` 错误

**解决方案**:
```bash
# 检查Ollama服务
ollama list

# 启动Ollama
ollama serve

# 检查端口
curl http://localhost:11434/api/version
```

#### 2. 模型加载失败
**症状**: `No model selected` 错误

**解决方案**:
```bash
# 下载模型
ollama pull llama2

# 检查模型列表
ollama list
```

#### 3. 前端构建失败
**症状**: 依赖安装或构建错误

**解决方案**:
```bash
# 清理并重新安装
rm -rf node_modules pnpm-lock.yaml
pnpm install

# 检查Node版本
node --version  # 确保 >= 16.0.0
```

#### 4. API密钥错误
**症状**: `Unauthorized` 错误

**解决方案**:
1. 检查API密钥是否正确
2. 验证账户余额
3. 确认API权限设置

### 调试技巧

#### 启用调试模式
在设置中开启调试模式，可以查看：
- 详细的情感分析结果
- Provider连接状态
- 聊天处理流程
- 系统提示词和用户消息

#### 查看浏览器控制台
```javascript
// 查看详细日志
console.log('[Debug] 当前状态:', {
  provider: provider.providerType,
  model: provider.currentModel,
  isConnected: provider.provider?.getConnectionStatus()
});
```

### 性能监控

#### 前端性能
- 使用React DevTools监控组件渲染
- 检查内存使用情况
- 监控网络请求

#### 后端性能
- 查看API响应时间
- 监控内存和CPU使用
- 检查并发请求处理

## 📄 许可证和贡献

### 许可证
本项目采用 MIT 许可证。详情请查看 LICENSE 文件。

### 贡献指南

我们欢迎所有形式的贡献！

#### 如何贡献
1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

#### 报告问题
- 使用 GitHub Issues 报告 bug
- 提供详细的复现步骤
- 包含系统信息和错误日志

### 联系方式

- **项目主页**: https://github.com/yourusername/praise-ai
- **问题反馈**: GitHub Issues
- **邮箱**: your-email@example.com

---

**感谢使用 Praise AI！享受与AI的温暖对话吧！** ❤️