---
trigger: manual
---
# Praise-AI 项目开发规则

## 项目概述
Praise-AI 是一个基于 React + TypeScript 的智能情感陪伴聊天应用，旨在通过 AI 提供情感支持和互动对话。

## 技术栈
- 前端: React 19.1.1 + TypeScript
- 构建工具: Vite 7.1.3
- 样式: Tailwind CSS 4.1.12
- 图标: Lucide React 0.541.0
- 包管理: PNPM 10.15.0
- 通知: Sonner (替代了自定义 Toast 组件)

## 代码规范

### 组件设计
- 遵循单一职责原则
- 使用简洁的文件名（避免 New 等后缀）
- 及时删除重构后不再使用的组件

### Hook 使用
- 避免不必要的依赖项
- 优先使用 useCallback 包装的函数引用
- 不要将整个对象作为依赖项

### Toast 通知
- 使用 Sonner 库
- 直接导入 toast 方法（避免包装）
- 使用 description 属性传递详细信息

### 类型安全
- 删除不必要的抽象层
- 合并分散的状态
- 保持向后兼容性
- 禁止使用 any 类型，优先使用具体类型或 unknown

### ESLint 配置
- 禁止使用 any 类型（@typescript-eslint/no-explicit-any）
- 使用 TypeScript 严格模式
- 保持类型安全性和代码质量

## Git 提交规范
- 包含功能描述、变更文件列表和特性说明
- 使用 feat: 前缀表示新增功能
- 详细描述变更内容和调整原因

## 项目特定规则

### Provider 管理
- 支持动态切换 AI 服务提供商
- 兼容 Ollama（本地）和 OpenAI API
- 必须保留标准网络请求配置
- 必须重写 buildHeaders 方法
- 必须直接调用官方 API

### 情感分析与回复
- 采用两次大模型交互设计
- 第一次交互：情感分析
- 第二次交互：基于分析结果生成回复

### 并发防护
- 防止用户在请求处理时发送新请求
- 避免多个流式传输导致消息混乱

### 主题支持
- 支持暗色模式
- 使用 useTheme Hook 管理主题状态
- 使用 Tailwind CSS 的 dark: 前缀

## 最佳实践

### 代码优化
- 删除不必要的抽象层
- 合并分散状态
- 保持功能统一性

### 组件交互
- Loading 组件应叠加在主页面上
- 下拉菜单使用状态管理控制
- 点击外部自动关闭功能

### 状态管理
- 切换 Provider 时重置连接状态
- 清空选中的模型
- 重置相关组件状态

## 开发环境
- Node.js >= 16.0.0
- PNPM >= 8.0.0
- Git
- Python（后端）

## 构建与部署
```bash
# 构建生产版本
pnpm build

# 预览构建结果
pnpm preview

# 启动开发服务器
pnpm dev

# 清理缓存
pnpm clean
```