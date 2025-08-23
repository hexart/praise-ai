import React, { useState } from 'react';
import { User, Bot, Eye, Brain, ChevronDown, ChevronUp } from 'lucide-react';
import type { ChatMessage } from '../../types/chat';
import { formatTimestamp, formatEmotionIntensity, formatChatMode } from '../../utils/formatters';

interface MessageBubbleProps {
  message: ChatMessage;
  isStreaming?: boolean;
  debugMode?: boolean;
  debugInfo?: string;
}

/**
打字指示器组件
*/
const TypingIndicator: React.FC = () => (

  <div className="flex space-x-1">
    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
  </div>
);

/**
情感分析显示组件
*/
interface EmotionDisplayProps {
  emotionAnalysis: Record<string, unknown>;
}

const EmotionDisplay: React.FC<EmotionDisplayProps> = ({ emotionAnalysis }) => {
  if (!emotionAnalysis || typeof emotionAnalysis !== 'object') return null;
  const emotion = emotionAnalysis.primary_emotion as string;
  const intensity = emotionAnalysis.intensity as number;
  const needs = emotionAnalysis.needs as string;
  if (!emotion) return null;
  const intensityInfo = formatEmotionIntensity(intensity || 0.5);
  return (
    <div className="mt-2 p-2 bg-purple-50 rounded-lg border border-purple-200">
      <div className="flex items-center space-x-2 text-xs">
        <Brain className="w-3 h-3 text-purple-500" />
        <span className="text-purple-700 font-medium">情感分析:</span>
        <span className="text-gray-700">{emotion}</span>
        <span className={`${intensityInfo.color} font-medium`}>
          {intensityInfo.text}
        </span>
        {needs && (
          <>
            <span className="text-gray-400">•</span>
            <span className="text-gray-600">需求: {needs}</span>
          </>
        )}
      </div>
    </div >
  );
};

/**
调试信息显示组件
*/
interface DebugInfoProps {
  debugInfo: string;
}

const DebugInfo: React.FC<DebugInfoProps> = ({ debugInfo }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  return (
    <div className="mt-2 border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-3 py-2 flex items-center space-x-2 text-left hover:bg-gray-100 transition-colors"
      >
        <Eye className="w-4 h-4 text-gray-500" />
        <span className="text-sm font-medium text-gray-700">调试信息</span>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-gray-500 ml-auto" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-500 ml-auto" />
        )}
      </button>
      {isExpanded && (
        <div className="px-3 py-2 border-t border-gray-200 bg-white">
          <pre className="text-xs text-gray-600 whitespace-pre-wrap font-mono leading-relaxed overflow-x-auto">
            {debugInfo}
          </pre>
        </div>
      )}
    </div>
  );
};

/**
消息气泡组件
*/
export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isStreaming = false,
  debugMode = false,
  debugInfo
}) => {
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';

  // 系统消息特殊处理
  if (isSystem) {
    return (
      <div className="flex justify-center my-4">
        <div className="px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded-full border border-gray-200">
          {message.content}
        </div>
      </div>
    );
  }
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`max-w-md lg:max-w-xl xl:max-w-2xl ${isUser ? 'order-2' : 'order-1'}`}>
        {/* 模式和情感分析指示器 (AI消息) */}
        {!isUser && message.mode && debugMode && (
          <div className="mb-2 flex items-center space-x-2">
            {/* 模式指示器 */}
            <div className="inline-flex items-center space-x-1 text-xs px-2 py-1 rounded-full bg-gradient-to-r from-purple-100 to-indigo-100 text-purple-700">
              <span>{formatChatMode(message.mode).icon}</span>
              <span>{formatChatMode(message.mode).name}</span>
            </div>

            {/* 情感分析指示器 */}
            {message.emotionAnalysis && (
              <EmotionDisplay emotionAnalysis={message.emotionAnalysis} />
            )}
          </div>
        )}

        {/* 消息气泡 */}
        <div
          className={`
        relative px-4 py-3 rounded-2xl shadow-sm
        ${isUser
              ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white'
              : 'bg-white text-gray-800 border border-gray-200'
            }
      `}
        >
          {/* 头像指示器 */}
          <div className={`absolute -top-4 ${isUser ? '-right-4' : '-left-4'} w-8 h-8 rounded-full flex items-center justify-center shadow-sm ${isUser ? 'bg-sky-500' : 'bg-white border border-gray-200'
            }`}>
            {isUser ? (
              <User className="w-4 h-4 text-white" />
            ) : (
              <Bot className={`w-4 h-4 ${isStreaming ? 'text-blue-500' : 'text-gray-600'}`} />
            )}
          </div>

          {/* 消息内容 */}
          <div className="text-sm leading-relaxed whitespace-pre-wrap">
            {message.content}
            {isStreaming && message.content === '' && (
              <div className="flex items-center space-x-2">
                <span className="text-gray-500">AI正在思考</span>
                <TypingIndicator />
              </div>
            )}
            {isStreaming && message.content !== '' && (
              <span className="inline-block w-2 h-4 bg-current animate-pulse ml-1" />
            )}
          </div>

          {/* 时间戳 */}
          <div className={`text-xs mt-2 ${isUser ? 'text-blue-100' : 'text-gray-500'}`}>
            {formatTimestamp(message.timestamp, 'absolute')}
            {isStreaming && (
              <span className="ml-2 inline-flex items-center">
                <div className="w-2 h-2 bg-current rounded-full animate-pulse" />
                <span className="ml-1">实时回复中</span>
              </span>
            )}
          </div>
        </div>

        {/* 调试信息 */}
        {!isUser && debugMode && debugInfo && (
          <DebugInfo debugInfo={debugInfo} />
        )}
      </div>
    </div>
  );
};