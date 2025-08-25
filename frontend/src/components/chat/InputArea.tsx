import React, { useState, useRef, useEffect } from 'react';
import { Send, Mic, MicOff, Smile } from 'lucide-react';
import { Button } from '../ui/Button';
import type { ChatMode } from '../../types/chat';

interface InputAreaProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  disabled?: boolean;
  currentMode: ChatMode;
  maxLength?: number;
}

/**
输入区域组件
*/
export const InputArea: React.FC<InputAreaProps> = ({
  value,
  onChange,
  onSend,
  onKeyDown,
  disabled = false,
  currentMode,
  maxLength = 2000
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 自动调整textarea高度
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      const scrollHeight = textarea.scrollHeight;
      const maxHeight = 120; // 最大高度
      textarea.style.height = Math.min(scrollHeight, maxHeight) + 'px';
    }
  }, [value]);
  // 处理键盘事件
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (value.trim() && !disabled) {
        onSend();
      }
    }
    onKeyDown?.(e);
  };
  // 处理发送
  const handleSend = () => {
    if (value.trim() && !disabled) {
      onSend();
    }
  };
  // 语音录制相关（占位实现）
  const handleVoiceToggle = () => {
    setIsRecording(!isRecording);
    // TODO: 实现语音录制功能
  };
  // 表情选择（占位实现）
  const handleEmojiClick = () => {
    // TODO: 实现表情选择功能
  };
  // 获取模式相关的UI配置
  const getModeConfig = (mode: ChatMode) => {
    switch (mode) {
      case 'praise':
        return {
          color: 'border-yellow-300 focus:border-yellow-500',
          darkColor: 'dark:border-yellow-500 dark:focus:border-yellow-400',
          placeholder: '分享你的成就或需要鼓励的事情...',
          icon: '🌟'
        };
      case 'comfort':
        return {
          color: 'border-pink-300 focus:border-pink-500',
          darkColor: 'dark:border-pink-500 dark:focus:border-pink-400',
          placeholder: '说出你的心声，我会陪伴你...',
          icon: '💕'
        };
      default:
        return {
          color: 'border-purple-300 focus:border-purple-500',
          darkColor: 'dark:border-purple-500 dark:focus:border-purple-400',
          placeholder: '告诉我你的想法，我会智能回应...',
          icon: '🤖'
        };
    }
  };
  const modeConfig = getModeConfig(currentMode);
  const isOverLimit = value.length > maxLength;
  const canSend = value.trim() && !disabled && !isOverLimit;
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto">
        {/* 输入框容器 */}
        <div
          className={`
            relative bg-white border rounded-2xl shadow-sm transition-all duration-200
            ${isFocused ? `${modeConfig.color} ring-1 ring-opacity-20 ${modeConfig.darkColor}` : 'border-gray-300 dark:border-gray-600'}
            ${isOverLimit ? 'border-red-300 dark:border-red-500' : ''}
            dark:bg-gray-800
          `}
        >
          {/* 主输入区域 */}
          <div className="flex items-end">

            {/* 文本输入框 */}
            <div className="flex-1 relative">
              <textarea
                ref={textareaRef}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onKeyDown={handleKeyDown}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                placeholder={modeConfig.placeholder}
                disabled={disabled}
                rows={1}
                className={`
              w-full px-4 py-3 bg-transparent resize-none
              focus:outline-none text-gray-900 placeholder-gray-500
              min-h-[48px] max-h-[120px] leading-6
              ${disabled ? 'cursor-not-allowed opacity-50' : ''}
              dark:text-gray-100 dark:placeholder-gray-400
            `}
                style={{ scrollbarWidth: 'thin' }}
              />

              {/* 字符计数 */}
              {value.length > maxLength * 0.8 && (
                <div className={`absolute bottom-2 right-4 text-xs ${isOverLimit ? 'text-red-500' : 'text-gray-400 dark:text-gray-500'
                  }`}>
                  {value.length}/{maxLength}
                </div>
              )}
            </div>

            {/* 工具栏 */}
            <div className="flex items-center space-x-2 p-2">

              {/* 表情按钮 */}
              <button
                onClick={handleEmojiClick}
                disabled={disabled}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors dark:text-gray-500 dark:hover:text-gray-300 dark:hover:bg-gray-700"
                title="添加表情"
              >
                <Smile className="w-4 h-4" />
              </button>

              {/* 语音按钮 */}
              <button
                onClick={handleVoiceToggle}
                disabled={disabled}
                className={`p-2 rounded-lg transition-colors ${isRecording
                  ? 'text-red-500 bg-red-50 hover:bg-red-100 dark:bg-red-900/30 dark:hover:bg-red-800/50'
                  : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:text-gray-500 dark:hover:text-gray-300 dark:hover:bg-gray-700'
                  }`}
                title={isRecording ? '停止录音' : '语音输入'}
              >
                {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>

              {/* 发送按钮 */}
              <Button
                onClick={handleSend}
                disabled={!canSend}
                variant="primary"
                size="sm"
                className={`
              min-w-[60px] ${canSend ? 'scale-100' : 'scale-95 opacity-50'}
              transition-transform duration-200
            `}
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* 底部提示信息 */}
        <div className="mt-3 px-2 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <div className="flex items-center space-x-4">

            {/* 当前模式提示 */}
            <span className="flex items-center space-x-1">
              <span>{modeConfig.icon}</span>
              <span>当前模式: {currentMode === 'smart' ? '智能' : currentMode === 'praise' ? '夸夸' : '安慰'}</span>
            </span>

            {/* 快捷键提示 */}
            <span>Enter 发送，Shift+Enter 换行</span>
          </div>

          {/* 状态指示 */}
          <div className="flex items-center space-x-2">
            {isRecording && (
              <span className="flex items-center space-x-1 text-red-500">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                <span>正在录音</span>
              </span>
            )}

            {disabled && (
              <span className="text-amber-500 dark:text-amber-400">AI正在回复中...</span>
            )}
          </div>
        </div>

        {/* 字符超限警告 */}
        {isOverLimit && (
          <div className="mt-2 text-center">
            <span className="text-xs text-red-500 bg-red-50 px-3 py-1 rounded-full dark:bg-red-900/30">
              输入内容过长，请控制在 {maxLength} 字符以内
            </span>
          </div>
        )}

        {/* 使用提示 */}
        <div className="mt-3 text-center">
          <p className="text-xs text-gray-400 leading-relaxed dark:text-gray-500">
            本AI助手旨在提供情感支持，不构成专业心理或医疗建议
          </p>
        </div>
      </div>
    </div>
  );
};