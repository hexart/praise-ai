import React, { useEffect, useRef } from 'react';
import { MessageBubble } from './MessageBubble';
import type { ChatMessage, ChatMode } from '../../types/chat';
import { MODE_CONFIGS } from '../../constants/modes';

interface ChatInterfaceProps {
  // 聊天数据
  messages: ChatMessage[];
  selectedMode: ChatMode;

  // 状态
  isLoading: boolean;
  streamingMessageId?: string | null;

  // Provider状态
  hasProvider?: boolean;
  onOpenSettings?: () => void;

  // 调试模式
  debugMode?: boolean;
  debugInfo?: string | null;

  // 样式
  className?: string;
}

/**
 * 未配置Provider时的状态组件
 */
const NoProviderState: React.FC<{ onOpenSettings?: () => void }> = ({ onOpenSettings }) => {
  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="text-center max-w-md">
        {/* 图标 */}
        <div className="mb-6">
          <div className="w-20 h-20 mx-auto bg-amber-100 rounded-full flex items-center justify-center mb-4 dark:bg-amber-900/30">
            <svg className="w-10 h-10 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <div className="text-3xl mb-2">🔧</div>
        </div>

        {/* 标题和描述 */}
        <h3 className="text-lg font-semibold text-gray-900 mb-2 dark:text-gray-100">
          需要配置 AI 服务
        </h3>
        <p className="text-gray-600 mb-6 dark:text-gray-400">
          请先配置 AI 服务提供商和模型，然后就可以开始聊天了。
        </p>

        {/* 配置按钮 */}
        {onOpenSettings && (
          <button
            onClick={onOpenSettings}
            className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-3 rounded-xl hover:shadow-lg transition-all duration-200 font-medium"
          >
            立即配置
          </button>
        )}

        {/* 小贴士 */}
        <div className="mt-6 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 dark:from-blue-900/20 dark:to-indigo-900/20 dark:border-blue-800">
          <p className="text-xs text-blue-700 leading-relaxed dark:text-blue-300">
            💡 <strong>提示:</strong> 支持 OpenAI、Claude、Ollama 等多种 AI 服务，可根据需要选择最适合的方案
          </p>
        </div>
      </div>
    </div>
  );
};

/**
 * 空状态组件
 */
const EmptyState: React.FC<{ selectedMode: ChatMode }> = ({ selectedMode }) => {
  const modeConfig = MODE_CONFIGS[selectedMode];
  const IconComponent = modeConfig.icon;

  // 根据模式获取配色方案
  const getColorScheme = (mode: ChatMode) => {
    switch (mode) {
      case 'praise':
        return {
          iconBg: 'from-amber-400 to-orange-500',
          iconShadow: 'shadow-amber-200 dark:shadow-amber-900/50',
          exampleBg: 'bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20',
          exampleBorder: 'border-amber-200 dark:border-amber-800/50',
          exampleHover: 'hover:from-amber-100 hover:to-orange-100 dark:hover:from-amber-900/30 dark:hover:to-orange-900/30',
          exampleText: 'text-amber-800 dark:text-amber-200',
          tipBg: 'from-amber-50 via-orange-50 to-yellow-50 dark:from-amber-950/30 dark:via-orange-950/30 dark:to-yellow-950/30',
          tipBorder: 'border-amber-300 dark:border-amber-700/50',
          tipText: 'text-amber-800 dark:text-amber-200'
        };
      case 'comfort':
        return {
          iconBg: 'from-pink-400 to-purple-500',
          iconShadow: 'shadow-pink-200 dark:shadow-pink-900/50',
          exampleBg: 'bg-gradient-to-r from-pink-50 to-purple-50 dark:from-pink-950/20 dark:to-purple-950/20',
          exampleBorder: 'border-pink-200 dark:border-pink-800/50',
          exampleHover: 'hover:from-pink-100 hover:to-purple-100 dark:hover:from-pink-900/30 dark:hover:to-purple-900/30',
          exampleText: 'text-pink-800 dark:text-pink-200',
          tipBg: 'from-pink-50 via-purple-50 to-indigo-50 dark:from-pink-950/30 dark:via-purple-950/30 dark:to-indigo-950/30',
          tipBorder: 'border-pink-300 dark:border-pink-700/50',
          tipText: 'text-pink-800 dark:text-pink-200'
        };
      default: // smart
        return {
          iconBg: 'from-purple-400 to-indigo-500',
          iconShadow: 'shadow-purple-200 dark:shadow-purple-900/50',
          exampleBg: 'bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-950/20 dark:to-indigo-950/20',
          exampleBorder: 'border-purple-200 dark:border-purple-800/50',
          exampleHover: 'hover:from-purple-100 hover:to-indigo-100 dark:hover:from-purple-900/30 dark:hover:to-indigo-900/30',
          exampleText: 'text-purple-800 dark:text-purple-200',
          tipBg: 'from-purple-50 via-indigo-50 to-blue-50 dark:from-purple-950/30 dark:via-indigo-950/30 dark:to-blue-950/30',
          tipBorder: 'border-purple-300 dark:border-purple-700/50',
          tipText: 'text-purple-800 dark:text-purple-200'
        };
    }
  };

  const colors = getColorScheme(selectedMode);

  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="text-center max-w-md">
        {/* 图标 */}
        <div className="mb-6">
          <div className={`
            w-20 h-20 mx-auto rounded-2xl flex items-center justify-center mb-4
            bg-gradient-to-br ${colors.iconBg} shadow-lg ${colors.iconShadow}
          `}>
            <IconComponent className="w-10 h-10 text-white" />
          </div>
          <div className="text-3xl mb-2 animate-bounce">{modeConfig.emoji}</div>
        </div>

        {/* 标题和描述 */}
        <h3 className="text-lg font-semibold text-gray-900 mb-2 dark:text-gray-100">
          {modeConfig.name}已就绪
        </h3>
        <p className="text-gray-600 mb-6 dark:text-gray-400">
          {modeConfig.subtitle}
        </p>

        {/* 示例建议 - 渐变卡片 */}
        <div className="space-y-2 mb-6">
          <p className="text-sm text-gray-500 mb-3 dark:text-gray-400 font-medium">你可以试试：</p>
          {modeConfig.examples.map((example, index) => (
            <div
              key={index}
              className={`
                relative overflow-hidden
                text-sm font-medium ${colors.exampleText}
                ${colors.exampleBg} 
                px-4 py-3 rounded-xl 
                border ${colors.exampleBorder}
                ${colors.exampleHover}
                cursor-pointer
                hover:shadow-md
                group
              `}
            >
              {/* 装饰性渐变光晕 */}
              <div className={`
                absolute inset-0 bg-gradient-to-r ${modeConfig.gradient}
                opacity-0 group-hover:opacity-10 transition-opacity duration-300
              `} />

              {/* 左侧装饰线 */}
              <div className={`
                absolute left-0 top-0 bottom-0 w-1 
                bg-gradient-to-b ${colors.iconBg}
                opacity-60
              `} />

              <span className="relative pl-2">"{example}"</span>
            </div>
          ))}
        </div>

        {/* 模式说明 - 精美渐变卡片 */}
        <div className={`
          relative overflow-hidden
          p-4 rounded-xl border ${colors.tipBorder}
          bg-gradient-to-br ${colors.tipBg}
          backdrop-blur-sm
          transform transition-all duration-300
          group
        `}>

          {/* 内容 */}
          <div className="relative">
            <div className="flex items-start space-x-2">
              <span className="text-xs mt-0.5">{modeConfig.emoji}</span>
              <p className={`text-xs ${colors.tipText} leading-relaxed text-left`}>
                <strong className="font-semibold">模式特点：</strong>
                {modeConfig.description}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * 聊天界面主组件
 */
export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  messages,
  selectedMode,
  streamingMessageId,
  hasProvider = true,
  onOpenSettings,
  debugMode = false,
  debugInfo,
  className = ''
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // 自动滚动到底部
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // 当消息变化时滚动到底部
  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingMessageId]);

  // 当开始流式传输时也滚动到底部
  useEffect(() => {
    if (streamingMessageId) {
      const timer = setTimeout(scrollToBottom, 100);
      return () => clearTimeout(timer);
    }
  }, [streamingMessageId]);

  return (
    <div className={`flex flex-col h-full bg-gray-50 ${className} dark:bg-gray-900`}>
      {/* 聊天消息区域 */}
      <div
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto px-4 py-6 pb-48"
        style={{ scrollBehavior: 'smooth' }}
      >
        <div className="max-w-4xl mx-auto">
          {/* 空状态 */}
          {messages.length === 0 && (
            <>
              {/* 如果Provider未配置，优先显示配置提示 */}
              {!hasProvider ? (
                <NoProviderState onOpenSettings={onOpenSettings} />
              ) : (
                <EmptyState selectedMode={selectedMode} />
              )}
            </>
          )}

          {/* 消息列表 */}
          {messages.length > 0 && (
            <div className="space-y-4 mx-5 sm:mx-15">
              {messages.map((message, index) => (
                <MessageBubble
                  key={message.id || index}
                  message={message}
                  isStreaming={streamingMessageId === message.id}
                  debugMode={debugMode}
                  debugInfo={
                    debugMode &&
                      message.role === 'assistant' &&
                      index === messages.length - 1
                      ? debugInfo || undefined
                      : undefined
                  }
                />
              ))}
            </div>
          )}

          {/* 滚动锚点 */}
          <div ref={messagesEndRef} />
        </div>
      </div>
    </div>
  );
};