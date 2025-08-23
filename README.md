# AI 情感陪伴聊天应用

一个基于 React + TypeScript 的智能情感陪伴聊天应用，具备情感分析、多模式对话、响应多样性等先进功能。

## 🌟 核心功能

### 情感智能对话
- **智能情感分析**：基于 LLM 分析用户输入的情感状态、强度和需求
- **三种聊天模式**：
  - 🤖 **智能模式**：自动分析情感并提供合适的回应
  - 🌟 **夸夸模式**：发现用户亮点，给予积极肯定和鼓励
  - 💕 **安慰模式**：提供温暖理解和情感支持

### 多 Provider 支持
- **本地 Ollama**：支持本地部署的开源模型（通过 OpenAI 兼容接口）
- **OpenAI 兼容 API**：支持 OpenAI 官方或兼容的 API 服务
- **动态切换**：实时切换不同的 AI 服务提供商

### 高级特性
- **流式对话**：支持实时流式输出，提升对话体验
- **响应多样性**：避免模板化回复，确保每次对话的独特性
- **智能引用**：根据情感状态智能插入相关名言警句
- **情感趋势分析**：追踪用户情感变化趋势
- **调试模式**：开发者可查看详细的情感分析和处理过程

### 用户体验
- **个性化设置**：支持个人偏好配置和数据导入导出
- **对话历史管理**：自动保存聊天记录，支持清空和搜索
- **响应式设计**：适配桌面和移动设备
- **实时连接状态**：显示 AI 服务连接状态和模型信息

## 🛠️ 技术栈

- **前端框架**：React 19.1.1 + TypeScript
- **构建工具**：Vite 7.1.3
- **样式方案**：Tailwind CSS 4.1.12
- **图标库**：Lucide React 0.541.0
- **包管理器**：PNPM 10.15.0

## 📋 系统要求

- **Node.js**：>= 16.0.0
- **PNPM**：>= 8.0.0（推荐使用 PNPM）
- **现代浏览器**：Chrome 90+、Firefox 88+、Safari 14+、Edge 90+

## 🚀 快速开始

### 1. 克隆项目

```bash
git clone <your-repo-url>
cd frontend
```

### 2. 安装依赖

```bash
# 使用 PNPM（推荐）
pnpm install

# 或使用 npm
npm install

# 或使用 yarn
yarn install
```

### 3. 环境配置

创建 `.env.local` 文件并配置环境变量：

```env
# Ollama 配置（本地模型服务）
VITE_OLLAMA_URL=http://localhost:8000
VITE_OLLAMA_DEFAULT_MODEL=llama2

# OpenAI 配置（可选）
VITE_OPENAI_URL=https://api.openai.com/v1
VITE_OPENAI_KEY=your-openai-api-key
VITE_OPENAI_DEFAULT_MODEL=gpt-3.5-turbo
```

### 4. 启动开发服务器

```bash
pnpm dev
```

应用将在 `http://localhost:5173` 启动。

### 5. 构建生产版本

```bash
# 构建
pnpm build

# 预览构建结果
pnpm preview
```

## ⚙️ 配置说明

### 环境变量

| 变量名 | 说明 | 默认值 | 必需 |
|--------|------|--------|------|
| `VITE_OLLAMA_URL` | Ollama 服务地址 | `http://localhost:8000` | 否 |
| `VITE_OLLAMA_DEFAULT_MODEL` | Ollama 默认模型 | `llama2` | 否 |
| `VITE_OPENAI_URL` | OpenAI API 地址 | `https://api.openai.com/v1` | 否 |
| `VITE_OPENAI_KEY` | OpenAI API 密钥 | - | 使用 OpenAI 时必需 |
| `VITE_OPENAI_DEFAULT_MODEL` | OpenAI 默认模型 | `gpt-3.5-turbo` | 否 |

### Provider 配置

应用支持多种 AI 服务提供商：

#### 本地 Ollama（推荐）
- **优势**：本地运行、隐私保护、免费使用
- **要求**：需要先启动 Ollama 代理服务
- **配置**：设置 `VITE_OLLAMA_URL` 指向代理服务地址

#### OpenAI 兼容 API
- **优势**：云端服务、高质量回复、快速响应
- **要求**：需要有效的 API 密钥
- **配置**：设置 `VITE_OPENAI_URL` 和 `VITE_OPENAI_KEY`

## 🎮 使用指南

### 首次使用

1. **选择 Provider**：在设置中选择并配置 AI 服务提供商
2. **测试连接**：点击"测试连接"确保服务可用
3. **选择模型**：从可用模型列表中选择合适的模型
4. **开始对话**：选择聊天模式并开始与 AI 对话

### 聊天模式说明

#### 🤖 智能模式
- **适用场景**：日常对话、复杂情感状态
- **工作原理**：AI 自动分析您的情感并选择最合适的回应方式
- **特点**：平衡共情与鼓励，提供个性化响应

#### 🌟 夸夸模式
- **适用场景**：分享成就、需要鼓励时
- **工作原理**：专注发现您的亮点和优势
- **特点**：积极正面、具体肯定、激发自信

#### 💕 安慰模式
- **适用场景**：情绪低落、遇到困难时
- **工作原理**：提供温暖理解和情感支持
- **特点**：温柔接纳、不批判、纯粹陪伴

### 高级功能

#### 情感分析
- 应用会自动分析您的情感状态（开启调试模式可查看详情）
- 支持多维度情感识别：情感类型、强度、需求等
- 基于分析结果提供个性化回应

#### 响应多样性
- AI 会记住最近的对话模式，避免重复表达
- 自动调整语言风格和句式结构
- 确保每次对话都有新鲜感

#### 智能引用
- 根据情感状态智能插入相关名言警句
- 支持安慰、鼓励、混合等多种引用类型
- 避免重复使用相同引用

## 🔧 开发指南

### 项目结构

```
frontend/
├── src/
│   ├── components/          # React 组件
│   │   ├── chat/           # 聊天相关组件
│   │   ├── layout/         # 布局组件
│   │   ├── settings/       # 设置组件
│   │   └── ui/             # 通用 UI 组件
│   ├── hooks/              # React Hooks
│   │   ├── useApp.ts       # 主应用 Hook
│   │   ├── useChat.ts      # 聊天功能 Hook
│   │   ├── useProvider.ts  # Provider 管理 Hook
│   │   └── useEmotionAnalysis.ts # 情感分析 Hook
│   ├── providers/          # AI 服务提供商
│   ├── services/           # 业务服务
│   │   ├── EmotionAnalysisService.ts    # 情感分析服务
│   │   ├── PromptService.ts             # 提示词服务
│   │   ├── QuoteService.ts              # 引用服务
│   │   └── ResponseDiversityService.ts  # 响应多样性服务
│   ├── types/              # TypeScript 类型定义
│   ├── utils/              # 工具函数
│   └── App.tsx             # 主应用组件
├── public/                 # 静态资源
├── package.json           # 项目配置
└── README.md              # 项目说明
```

### 可用脚本

```bash
# 开发
pnpm dev          # 启动开发服务器
pnpm build        # 构建生产版本
pnpm preview      # 预览构建结果
pnpm lint         # 代码检查
```

### 调试模式

开启调试模式可以查看：
- 详细的情感分析结果
- Provider 连接状态
- 聊天处理流程
- 系统提示词和用户消息

在设置中开启"调试模式"即可使用。

## 📱 部署说明

### 静态部署

构建后的文件可以部署到任何静态文件服务器：

```bash
pnpm build
# dist/ 目录包含所有构建文件
```

支持的部署平台：
- Vercel
- Netlify  
- GitHub Pages
- 任何支持静态文件的服务器

### 环境变量配置

在部署平台设置相应的环境变量，确保应用能正确连接到 AI 服务。

## 🐛 故障排除

### 常见问题

#### 1. 无法连接到 Ollama 服务
**问题**：显示"Provider 不可用"或连接失败

**解决方案**：
- 确认 Ollama 代理服务正在运行
- 检查 `VITE_OLLAMA_URL` 配置是否正确
- 确认防火墙和网络设置

#### 2. OpenAI API 连接失败
**问题**：API 密钥错误或连接超时

**解决方案**：
- 验证 API 密钥是否有效
- 检查账户余额和使用限制
- 确认网络连接和代理设置

#### 3. 模型加载失败
**问题**：无法获取模型列表

**解决方案**：
- 检查 Provider 配置
- 重新测试连接
- 查看浏览器控制台错误信息

#### 4. 情感分析不准确
**问题**：AI 理解不准确或响应不合适

**解决方案**：
- 尝试更清晰地表达情感和需求
- 切换到更强大的模型
- 在设置中调整默认模式

### 获取帮助

如果遇到其他问题：
1. 查看浏览器控制台的错误信息
2. 开启调试模式查看详细信息
3. 检查网络连接和服务状态
4. 提交 Issue 或联系开发者

## 🔒 隐私和安全

- **本地优先**：推荐使用本地 Ollama 服务保护隐私
- **数据存储**：聊天记录仅存储在浏览器本地存储中
- **API 安全**：API 密钥通过环境变量管理，不会暴露给第三方
- **数据导出**：支持导出个人数据，便于备份和迁移

## 📄 许可证

MIT License

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📞 联系方式

如有问题或建议，请通过以下方式联系：
- GitHub Issues
- 邮箱：[your-email@example.com]

---

**享受与 AI 的温暖对话吧！** ❤️