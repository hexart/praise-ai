# 日志系统使用说明

## 📝 简介

项目使用简化的日志系统进行开发调试。所有日志输出到浏览器控制台，便于开发者使用专业的调试工具进行分析。

## 🛠️ 使用方法

### 启用调试模式
1. 打开设置 → 应用设置
2. 开启"调试模式"
3. 打开浏览器开发者工具查看控制台日志

### 代码中使用
```typescript
import { logger, createModuleLogger } from '../utils/logger';

// 模块化日志
const moduleLogger = createModuleLogger('MyModule');
moduleLogger.info('操作完成', { count: 10 });
moduleLogger.error('处理失败', { error: ' 详细错误信息' });
moduleLogger.log('通用日志记录', { status: 'completed' });

// 全局日志
logger.info('应用启动');
logger.warn('警告信息');
logger.error('错误信息', error);
logger.debug('调试信息', { data: 'debug data' });
logger.log('通用日志', { timestamp: Date.now() });
```

## 📊 日志级别

- **error**: 错误信息，红色显示
- **warn**: 警告信息，黄色显示  
- **info**: 一般信息，蓝色显示
- **debug**: 详细调试信息，灰色显示
- **log**: 通用日志信息，等同于info级别

## 🔍 使用规范

### 允许的日志方法
- `logger.error(message, data?)` - 错误日志
- `logger.warn(message, data?)` - 警告日志
- `logger.info(message, data?)` - 信息日志
- `logger.debug(message, data?)` - 调试日志
- `logger.log(message, data?)` - 通用日志（等同于info级别）

### 禁止使用的方法
❌ 不要使用未定义的日志方法，如：
- `logger.emotion()` - 不存在
- `logger.chatFlow()` - 不存在
- `console.log()` - 请使用统一的logger系统

## 💡 最佳实践

### 日志消息规范
- 所有日志消息必须使用中文
- 消息应该简洁明了，包含关键信息
- 错误日志应包含足够的上下文信息

### 模块化日志
```typescript
// 推荐：为每个模块创建专用logger
const chatLogger = createModuleLogger('useChat');
const providerLogger = createModuleLogger('OllamaProvider');
const emotionLogger = createModuleLogger('EmotionAnalysis');

// 使用模块logger记录关键操作
chatLogger.info('🔥 [LLM交互1] 情感分析 - 发送提示词', {
  emotion: '开心',
  intensity: 0.8
});

chatLogger.info('🔥 [LLM交互2] 聊天回复生成 - 接收响应', {
  responseLength: 256,
  mode: 'praise'
});
```

### 浏览器控制台使用技巧
1. **过滤日志**：在控制台中输入模块名或关键词进行过滤
2. **查看对象详情**：点击展开日志中的对象数据
3. **复制日志**：右键复制日志内容用于分析
4. **清空控制台**：使用 `Ctrl/Cmd + K` 清空日志
5. **保留日志**：在Network面板勾选"Preserve log"保留页面刷新前的日志

## 🔧 技术实现

### 日志系统架构
- `SimpleLogger`：核心日志类，提供统一的日志接口
- `createModuleLogger`：模块化日志工厂函数
- 自动环境检测：开发环境启用DEBUG级别，生产环境禁用
- 标准日志方法：`error()`、`warn()`、`info()`、`debug()`、`log()`

### 配置选项
```typescript
// 设置日志级别
logger.setLevel(LogLevel.DEBUG);

// 启用/禁用日志
logger.setEnabled(true);
```

## 🚀 开发建议

1. **使用浏览器开发者工具**：比自定义日志查看器更强大、更专业
2. **合理使用日志级别**：error用于错误，warn用于警告，info用于重要信息，debug用于详细调试，log用于通用记录
3. **结构化日志数据**：传递对象而不是字符串，便于控制台查看和分析
4. **避免日志污染**：生产环境不要输出过多调试信息
5. **关键节点记录**：在重要的业务流程节点添加日志，如LLM交互、情感分析等
6. **使用统一的logger系统**：禁止直接使用console.log，保持日志输出的一致性