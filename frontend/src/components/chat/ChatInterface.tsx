import React, { useEffect, useRef } from 'react';
import { MessageCircle } from 'lucide-react';
import { MessageBubble } from './MessageBubble';
import { ModeSelector } from './ModeSelector';
import { InputArea } from './InputArea';
import type { ChatMessage, ChatMode } from '../../types/chat';

interface ChatInterfaceProps {
  // 聊天数据
  messages: ChatMessage[];
  currentMessage: string;
  onMessageChange: (message: string) => void;
  onSendMessage: () => void;
  // 模式管理
  selectedMode: ChatMode;
  onModeChange: (mode: ChatMode) => void;
  // 状态
  isLoading: boolean;
  streamingMessageId?: string | null;
  // 调试模式
  debugMode?: boolean;
  debugInfo?: string | null;
  // 键盘事件
  onKeyDown?: (e: React.KeyboardEvent) => void;
  // 样式
  className?: string;
}

/**
空状态组件
*/
const EmptyState: React.FC<{ selectedMode: ChatMode }> = ({ selectedMode }) => {
  const getModeGreeting = (mode: ChatMode) => {
    switch (mode) {
      case 'praise':
        return {
          icon: '🌟',
          title: '夸夸模式已启用',
          subtitle: '分享你的成就，让我发现你的闪光点！',
          examples: ['我今天完成了一个项目', '我学会了新技能', '我帮助了朋友']
        };
      case 'comfort':
        return {
          icon: '💕',
          title: '安慰模式已启用',
          subtitle: '说出你的心声，我会陪伴和理解你',
          examples: ['今天有点累', '遇到了困难', '心情不太好']
        };
      default:
        return {
          icon: '🤖',
          title: '智能模式已启用',
          subtitle: 'AI会自动分析你的情感，提供最合适的回应',
          examples: ['今天过得怎么样？', '想聊聊最近的事', '有什么想法分享']
        };
    }
  };

  const greeting = getModeGreeting(selectedMode);
  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="text-center max-w-md">
        {/* 图标 */}
        <div className="mb-6">
          <div className="w-20 h-20 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <MessageCircle className="w-10 h-10 text-gray-400" />
          </div>
          <div className="text-3xl mb-2">{greeting.icon}</div>
        </div>

        {/* 标题和描述 */}
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {greeting.title}
        </h3>
        <p className="text-gray-600 mb-6">
          {greeting.subtitle}
        </p>

        {/* 示例建议 */}
        <div className="space-y-2">
          <p className="text-sm text-gray-500 mb-3">你可以这样开始：</p>
          {greeting.examples.map((example, index) => (
            <div
              key={index}
              className="text-sm text-gray-700 bg-gray-50 px-3 py-2 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors cursor-pointer"
              onClick={() => {
                // TODO: 可以实现点击填充到输入框的功能
              }}
            >
              "{example}"
            </div>
          ))}
        </div>

        {/* 小贴士 */}
        <div className="mt-6 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-xs text-blue-700 leading-relaxed">
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
  currentMessage,
  onMessageChange,
  onSendMessage,
  selectedMode,
  onModeChange,
  isLoading,
  streamingMessageId,
  debugMode = false,
  debugInfo,
  onKeyDown,
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
    <div className={`flex flex-col h-full bg-gray-50 ${className}`}>
      {/* 模式选择器 */}
      <ModeSelector
        selectedMode={selectedMode}
        onModeChange={onModeChange}
        disabled={isLoading}
      />

      {/* 聊天消息区域 */}
      <div
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto px-4 py-6"
        style={{ scrollBehavior: 'smooth' }}
      >
        <div className="max-w-4xl mx-auto">

          {/* 空状态 */}
          {messages.length === 0 && (
            <EmptyState selectedMode={selectedMode} />
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

      {/* 输入区域 */}
      <InputArea
        value={currentMessage}
        onChange={onMessageChange}
        onSend={onSendMessage}
        onKeyDown={onKeyDown}
        disabled={isLoading}
        currentMode={selectedMode}
        maxLength={2000}
      />
    </div>
  );
};