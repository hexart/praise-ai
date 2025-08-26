import React, { useEffect, useRef } from 'react';
import { MessageCircle } from 'lucide-react';
import { MessageBubble } from './MessageBubble';
import { ModeSelector } from './ModeSelector';
import type { ChatMessage, ChatMode } from '../../types/chat';
import { formatChatMode } from '../../utils/formatters';

interface ChatInterfaceProps {
  // 聊天数据
  messages: ChatMessage[];
  // 模式管理
  selectedMode: ChatMode;
  onModeChange: (mode: ChatMode) => void;
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
未配置Provider时的状态组件
*/
const NoProviderState: React.FC<{ onOpenSettings?: () => void }> = ({ onOpenSettings }) => {
  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="text-center max-w-md">
        {/* 图标 */}
        <div className="mb-6">
          <div className="w-20 h-20 mx-auto bg-yellow-100 rounded-full flex items-center justify-center mb-4 dark:bg-yellow-900/30">
            <svg className="w-10 h-10 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <div className="text-3xl mb-2">🔧</div>
        </div>

        {/* 标题和描述 */}
        <h3 className="text-lg font-semibold text-gray-900 mb-2 dark:text-gray-100">
          需要配置 AI 服务提供商
        </h3>
        <p className="text-gray-600 mb-6 dark:text-gray-400">
          请先配置 AI 服务提供商和模型，然后就可以开始聊天了。
        </p>

        {/* 配置按钮 */}
        {onOpenSettings && (
          <button
            onClick={onOpenSettings}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium dark:bg-blue-700 dark:hover:bg-blue-600"
          >
            去配置
          </button>
        )}

        {/* 小贴士 */}
        <div className="mt-6 p-3 bg-blue-50 rounded-lg border border-blue-200 dark:bg-blue-900/30 dark:border-blue-800">
          <p className="text-xs text-blue-700 leading-relaxed dark:text-blue-300">
            💡 <strong>小贴士:</strong> 支持 OpenAI、Claude、Ollama 等多种 AI 服务提供商，你可以根据需要选择最适合的方案。
          </p>
        </div>
      </div>
    </div>
  );
};

/**
空状态组件
*/
const EmptyState: React.FC<{ selectedMode: ChatMode }> = ({ selectedMode }) => {
  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="text-center max-w-md">
        {/* 图标 */}
        <div className="mb-6">
          <div className="w-20 h-20 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4 dark:bg-gray-800">
            <MessageCircle className="w-10 h-10 text-gray-400 dark:text-gray-500" />
          </div>
          <div className="text-3xl mb-2">{formatChatMode(selectedMode).icon}</div>
        </div>

        {/* 标题和描述 */}
        <h3 className="text-lg font-semibold text-gray-900 mb-2 dark:text-gray-100">
          {formatChatMode(selectedMode).name}已启用
        </h3>
        <p className="text-gray-600 mb-6 dark:text-gray-400">
          {formatChatMode(selectedMode).subtitle}
        </p>

        {/* 示例建议 */}
        <div className="space-y-2">
          <p className="text-sm text-gray-500 mb-3 dark:text-gray-400">你可以这样开始：</p>
          {formatChatMode(selectedMode).examples.map((example, index) => (
            <div
              key={index}
              className="text-sm text-gray-700 bg-gray-50 px-3 py-2 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors cursor-pointer dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700 dark:hover:bg-gray-700"
              onClick={() => {
                // TODO: 可以实现点击填充到输入框的功能
              }}
            >
              "{example}"
            </div>
          ))}
        </div>

        {/* 小贴士 */}
        <div className="mt-6 p-3 bg-blue-50 rounded-lg border border-blue-200 dark:bg-blue-900/30 dark:border-blue-800">
          <p className="text-xs text-blue-700 leading-relaxed dark:text-blue-300">
            💡 <strong>小贴士:</strong> 尽量具体描述你的感受或情况，这样我能给出更贴心的回应
          </p>
        </div>
      </div>
    </div>
  );
};

/**
聊天界面主组件
*/
export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  messages,
  selectedMode,
  onModeChange,
  isLoading,
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
      {/* 模式选择器 */}
      <ModeSelector
        selectedMode={selectedMode}
        onModeChange={onModeChange}
        disabled={isLoading}
      />

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
            <div className="space-y-4">
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