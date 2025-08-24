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
- **Anthropic Claude**：支持 Claude 系列模型，包括 Claude 4 Sonnet、Opus 等
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

## 📚 项目文档

本项目提供了完整的文档体系，涵盖用户使用、开发指南和API参考：

- **[PROJECT_DOCUMENTATION.md](./docs/PROJECT_DOCUMENTATION.md)** - 完整项目文档，包含详细的架构说明、部署指南和故障排除
- **[DEVELOPER_GUIDE.md](./docs/DEVELOPER_GUIDE.md)** - 开发者指南，包含扩展开发、测试和最佳实践
- **[API_REFERENCE.md](./docs/API_REFERENCE.md)** - API参考文档，详细的接口说明和使用示例
- **[backend/README.md](./backend/README.md)** - 后端代理服务详细说明

## 🚀 快速开始

### 1. 克隆项目

```bash
git clone https://github.com/hexart/praise-ai.git
cd praise-ai/frontend
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

复制环境变量模板并配置：

```bash
# 复制环境变量模板
cp .env.example .env.local
```

编辑 `.env.local` 文件，根据需要填入相应的 API 密钥：

```env
# Ollama 配置（本地模型服务）
VITE_OLLAMA_URL=http://localhost:8000
VITE_OLLAMA_DEFAULT_MODEL=llama2

# OpenAI 配置（如需使用 OpenAI 服务）
VITE_OPENAI_URL=https://api.openai.com/v1
VITE_OPENAI_KEY=your-actual-openai-api-key
VITE_OPENAI_DEFAULT_MODEL=gpt-4-0613

# Anthropic Claude 配置（如需使用 Claude 服务）
VITE_CLAUDE_URL=https://api.anthropic.com/v1
VITE_CLAUDE_KEY=your-actual-anthropic-api-key
VITE_CLAUDE_DEFAULT_MODEL=claude-opus-4-1-20250805
```

> **注意**：
> - `.env.local` 文件包含敏感信息，已被 `.gitignore` 忽略，不会提交到版本控制
> - 如果只使用本地 Ollama 服务，可以不填写 OpenAI 和 Claude 的 API 密钥
> - API 密钥请从对应服务商的官网获取

### 4. 启动开发服务器

#### 方式一：使用开发脚本（推荐）

项目提供了便捷的开发脚本，可以同时启动前端和后端服务：

```bash
# macOS/Linux 用户
./dev.sh

# Windows 用户
dev.bat
```

开发脚本功能：
- 🔍 **自动环境检查**：检查虚拟环境和依赖是否存在
- 📡 **后端启动**：自动激活虚拟环境并启动 Flask 服务
- 🎨 **前端启动**：自动安装依赖并启动 Vite 开发服务器
- 🛑 **优雅退出**：按 Ctrl+C 可同时关闭所有服务
- 📝 **状态提示**：显示服务启动状态和访问地址

服务地址：
- 前端服务：`http://localhost:5173`
- 后端服务：`http://localhost:5000`

#### 方式二：手动启动

如果需要单独启动前端服务：

```bash
# 在 frontend 目录下
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
| `VITE_CLAUDE_URL` | Claude API 地址 | `https://api.anthropic.com/v1` | 否 |
| `VITE_CLAUDE_KEY` | Anthropic API 密钥 | - | 使用 Claude 时必需 |
| `VITE_CLAUDE_DEFAULT_MODEL` | Claude 默认模型 | `claude-opus-4-1-20250805` | 否 |

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

#### Anthropic Claude
- **优势**：高级推理、长上下文、安全可靠、创意写作
- **支持模型**：Claude 4 Sonnet、Claude 4 Opus、Claude 3 Sonnet、Claude 3 Haiku
- **要求**：需要 Anthropic API 密钥
- **配置**：设置 `VITE_CLAUDE_URL` 和 `VITE_CLAUDE_KEY`

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
praise-ai/
├── frontend/                # 前端项目
│   ├── src/
│   │   ├── components/          # React 组件
│   │   │   ├── chat/           # 聊天相关组件
│   │   │   ├── layout/         # 布局组件
│   │   │   ├── settings/       # 设置组件
│   │   │   └── ui/             # 通用 UI 组件
│   │   ├── hooks/              # React Hooks
│   │   │   ├── useApp.ts       # 主应用 Hook
│   │   │   ├── useChat.ts      # 聊天功能 Hook
│   │   │   ├── useProvider.ts  # Provider 管理 Hook
│   │   │   └── useEmotionAnalysis.ts # 情感分析 Hook
│   │   ├── providers/          # AI 服务提供商
│   │   ├── services/           # 业务服务
│   │   │   ├── EmotionAnalysisService.ts    # 情感分析服务
│   │   │   ├── PromptService.ts             # 提示词服务
│   │   │   ├── QuoteService.ts              # 引用服务
│   │   │   └── ResponseDiversityService.ts  # 响应多样性服务
│   │   ├── types/              # TypeScript 类型定义
│   │   ├── utils/              # 工具函数
│   │   └── App.tsx             # 主应用组件
│   ├── public/                 # 静态资源
│   ├── package.json           # 项目配置
│   └── README.md              # 项目说明
├── backend/                 # 后端项目
│   ├── main.py             # Flask 代理服务
│   ├── requirements.txt    # Python 依赖
│   └── README.md           # 后端说明
├── dev.sh                  # 开发启动脚本 (macOS/Linux)
├── dev.bat                 # 开发启动脚本 (Windows)
└── README.md               # 项目总览
```

### 可用脚本

```bash
# 开发
./dev.sh          # 启动完整开发环境（macOS/Linux）
dev.bat           # 启动完整开发环境（Windows）
pnpm dev          # 仅启动前端开发服务器
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

## 🔧 项目架构

### 核心设计理念

本项目采用现代化的前后端分离架构，具有以下特点：

- **模块化设计**: 前端采用Hook-based架构，后端采用微服务理念
- **可扩展性**: 支持多种AI服务提供商，易于添加新的Provider
- **类型安全**: 全面使用TypeScript，确保代码质量和开发效率
- **响应式设计**: 适配多种设备，提供一致的用户体验

### 技术选型理由

- **React 19.1.1**: 最新的React版本，支持并发特性和性能优化
- **TypeScript**: 提供强类型支持，减少运行时错误
- **Vite**: 快速的构建工具，开发体验优秀
- **Tailwind CSS**: 实用优先的CSS框架，快速开发现代UI
- **FastAPI**: 高性能的Python Web框架，自动生成API文档

### 核心架构设计

#### 双情感分析系统
- **useChat中的情感分析**: 用于智能模式下的实时情感检测和模式推荐
- **useEmotionAnalysis**: 用于情感历史追踪、趋势分析和统计
- **Provider共享机制**: 两个系统共享同一个Provider实例，确保配置一致性

#### Hook-based状态管理
- **useApp**: 主应用状态管理，整合所有子系统
- **useProvider**: Provider管理，支持多Provider切换
- **useChat**: 聊天功能，支持流式响应和历史管理
- **useEmotionAnalysis**: 情感分析和历史追踪

#### Provider模式设计
- **BaseProvider**: 抽象基类，定义通用接口
- **具体实现**: OllamaProvider、OpenAIProvider等
- **统一接口**: 屏蔽不同AI服务的差异

### 已完成的核心功能

#### ✅ 情感分析系统优化
- EmotionAnalysisService 独立化，支持fallback机制
- 双情感分析系统架构，职责清晰分离
- 详细的调试日志和错误处理

#### ✅ Provider管理系统增强
- 多Provider支持（Ollama、OpenAI、Claude）
- 动态Provider切换和模型管理
- 统一的Provider接口设计

#### ✅ 设置面板系统
- 完整的设置界面，支持API配置、模型管理、数据管理
- 分标签页界面，实时状态显示
- 用户体验优化，错误提示和成功反馈

#### ✅ 类型系统完善
- 增强的ModelInfo接口和Provider类型定义
- Hook返回类型规范化
- TypeScript严格模式支持

#### ✅ 架构优化
- 依赖解耦，各Hook独立管理服务实例
- 状态同步机制，Provider实例在多系统间共享
- 调试和开发工具支持

## 🛠️ 开发指南扩展

### 扩展开发指南

#### 1. 添加新的AI Provider

1. 继承`BaseProvider`类
```typescript
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
}
```

2. 在`useProvider.ts`中注册
3. 更新`ProviderType`类型定义
4. 在设置面板中添加配置项

#### 2. 扩展情感分析

1. 修改`EmotionAnalysis`接口
2. 更新`EmotionAnalysisService`处理逻辑
3. 调整`useEmotionAnalysis`统计计算
4. 更新UI显示组件

#### 3. 添加新设置项

1. 更新`AppSettings`接口
2. 在`useApp.ts`中添加处理逻辑
3. 在`SettingsModal.tsx`中添加UI
4. 更新存储和导入导出逻辑

### 开发最佳实践

#### 1. 代码组织
- 保持Hook职责单一，避免过度耦合
- 使用TypeScript严格类型检查，避免使用`any`
- 遵循React Hooks最佳实践
- 保持组件粒度适中

#### 2. 错误处理
- 总是提供fallback机制，确保服务稳定性
- 记录详细的错误日志，便于调试
- 为用户提供有意义的错误信息
- 实现优雅的错误恢复

#### 3. 性能考虑
- 避免不必要的re-render，使用`React.memo`优化组件
- 合理使用`useCallback`和`useMemo`
- 控制聊天历史长度，避免内存泄漏
- 监控组件性能指标

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

## 📈 项目状态

### 当前版本
- **前端版本**: v0.2.0
- **后端版本**: v2.0.0
- **最后更新**: 2025年8月

### 开发状态
- ✅ 核心功能完成
- ✅ 情感分析系统
- ✅ 多Provider支持（Ollama、OpenAI、Claude）
- ✅ 响应多样性
- 🚀 Claude API集成完成（v0.2.1）
- 🚧 高级功能开发中
- 🚧 性能优化进行中

### 版本规划
- **v0.3.0**: 增强UI/UX，添加Google Gemini Provider，模型性能指标
- **v0.4.0**: 情感分析可视化，高级统计功能，模型性能指标
- **v0.5.0**: 高级聊天功能（主题标签、全文搜索、对话模板）
- **v1.0.0**: 正式版本，完整功能集，生产环境优化

### 开发路线图

#### 近期计划 (优先级: 高)
- 模型加载进度指示器和性能优化
- 网络连接失败重试机制
- 用户友好的错误提示信息
- 模型搜索和过滤功能

#### 中期计划 (优先级: 中)
- 情感分析准确率统计和可视化图表
- 模型性能指标显示和分组管理
- Provider性能对比功能
- 数据导出格式优化（CSV、Excel）

#### 长期计划 (优先级: 低)
- 云端数据同步和多用户配置管理
- 个性化设置和用户偏好学习
- 协作和分享功能

## 📞 联系方式

如有问题或建议，请通过以下方式联系：
- **GitHub Issues**: https://github.com/hexart/praise-ai/issues
- **项目主页**: https://github.com/hexart/praise-ai
- **邮箱**: your-email@example.com
- **文档**: 查看 [PROJECT_DOCUMENTATION.md](./docs/PROJECT_DOCUMENTATION.md) 获取详细文档

---

**享受与 AI 的温暖对话吧！** ❤️