import React, { useState, useRef } from 'react';
import { Send, Mic, Square, Smile, Paperclip } from 'lucide-react';
import { Sender } from '@ant-design/x';
import type { SenderRef } from '@ant-design/x/es/sender';
import type { ChatMode } from '../../types/chat';
import { MODE_CONFIGS } from '../../constants/modes';
import { useSpeechRecognition } from '../../hooks/useSpeechRecognition';
import { toast } from 'sonner';

interface InputAreaProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  disabled?: boolean;
  currentMode: ChatMode;
  maxLength?: number;
}

/**
 * 输入区域组件 - 使用 Ant Design X Sender
 */
export const InputArea: React.FC<InputAreaProps> = ({
  value,
  onChange,
  onSend,
  disabled = false,
  currentMode,
  maxLength = 2000
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const senderRef = useRef<SenderRef | null>(null);

  // 语音识别
  const speech = useSpeechRecognition({
    language: 'zh-CN',
    continuous: false,
    interimResults: true,
    onResult: (transcript, isFinal) => {
      // 实时显示识别结果（包括临时结果）
      onChange(transcript);

      if (isFinal) {
        // 识别完成，显示提示
        toast.success('语音识别完成', {
          description: '已将语音转换为文字'
        });
      }
    },
    onError: (error) => {
      toast.error('语音识别错误', {
        description: error
      });
    }
  });

  // 处理发送
  const handleSubmit = (message: string) => {
    if (message.trim() && !disabled) {
      onSend();
    }
  };

  // 处理键盘事件
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (value.trim() && !disabled) {
        onSend();
      }
    }
  };

  // 处理值变化
  const handleChange = (val: string) => {
    onChange(val);
  };

  // 语音录制处理
  const handleVoiceToggle = () => {
    if (!speech.isSupported) {
      toast.error('浏览器不支持语音识别', {
        description: '请使用 Chrome 浏览器以使用语音输入功能'
      });
      return;
    }

    speech.toggleListening();
  };

  // 表情选择（占位实现）
  const handleEmojiClick = () => {
    // TODO: 实现表情选择功能
  };

  // 附件上传（占位实现）
  const handleAttachment = () => {
    // TODO: 实现文件上传功能
  };

  // 获取模式相关的UI配置
  const getModeConfig = (mode: ChatMode) => {
    const config = MODE_CONFIGS[mode];
    if (!config) {
      // 默认配置（以防万一）
      return {
        gradient: 'from-blue-500/10 to-indigo-500/10',
        borderGradient: 'from-blue-500 to-indigo-500',
        placeholder: '有什么可以帮助你的吗？',
        accentColor: 'blue'
      };
    }

    // 根据 MODE_CONFIGS 中的 gradient 属性解析颜色
    const gradientMap = {
      'from-purple-400 to-indigo-400': {
        gradient: 'from-purple-500/10 to-indigo-500/10',
        borderGradient: 'from-purple-500 to-indigo-500',
        accentColor: 'purple'
      },
      'from-yellow-400 to-orange-400': {
        gradient: 'from-amber-500/10 to-orange-500/10',
        borderGradient: 'from-amber-500 to-orange-500',
        accentColor: 'yellow'
      },
      'from-pink-400 to-purple-400': {
        gradient: 'from-pink-500/10 to-purple-500/10',
        borderGradient: 'from-pink-500 to-purple-500',
        accentColor: 'pink'
      }
    };

    const gradientConfig = gradientMap[config.gradient] || gradientMap['from-purple-400 to-indigo-400'];

    return {
      ...gradientConfig,
      placeholder: config.subtitle
    };
  };

  const modeConfig = getModeConfig(currentMode);
  const isOverLimit = value.length > maxLength;
  const canSend = value.trim() && !disabled && !isOverLimit;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40">
      {/* 背景渐变效果 */}
      <div className="absolute inset-0 bg-linear-to-t from-white via-white/95 to-transparent dark:from-gray-900 dark:via-gray-900/95 pointer-events-none" />

      <div className="relative max-w-4xl mx-auto px-4 pb-6 pt-2">
        {/* 主输入容器 */}
        <div className={`
          relative group transition-all duration-300
          ${isFocused ? 'scale-[1.005]' : ''}
        `}>
          {/* 渐变边框效果 */}
          {isFocused && (
            <div className={`
              absolute -inset-0.5 bg-linear-to-r ${modeConfig.borderGradient}
              rounded-2xl opacity-30 blur-sm animate-pulse
            `} />
          )}

          {/* 输入框主体 */}
          <div className={`
            relative bg-white dark:bg-gray-800 rounded-2xl
            shadow-lg dark:shadow-black/20
            border border-gray-200 dark:border-gray-700
            ${isFocused ? 'border-opacity-0' : ''}
            transition-all duration-300
          `}>
            {/* 顶部工具栏 */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100 dark:border-gray-700/50">
              <div className="flex items-center space-x-1">
                {/* 模式指示器 - 使用 MODE_CONFIGS 中的图标 */}
                <div className={`
                  flex items-center space-x-2 px-3 py-1 rounded-full
                  bg-linear-to-r ${modeConfig.gradient}
                  text-${modeConfig.accentColor}-600 dark:text-${modeConfig.accentColor}-400
                  text-sm font-medium
                `}>
                  {(() => {
                    const IconComponent = MODE_CONFIGS[currentMode].icon;
                    return <IconComponent className="w-3.5 h-3.5" />;
                  })()}
                  <span>{MODE_CONFIGS[currentMode]?.name || '智能模式'}</span>
                </div>
              </div>

              {/* 字符计数 */}
              {value.length > 0 && (
                <span className={`
                  text-xs transition-all duration-300
                  ${isOverLimit
                    ? 'text-red-500 font-medium'
                    : value.length > maxLength * 0.8
                      ? 'text-amber-500'
                      : 'text-gray-400 dark:text-gray-500'
                  }
                `}>
                  {value.length} / {maxLength}
                </span>
              )}
            </div>

            {/* 使用 Sender 组件 */}
            <Sender
              ref={senderRef}
              value={value}
              onChange={handleChange}
              onSubmit={handleSubmit}
              onKeyDown={handleKeyDown}
              placeholder={modeConfig.placeholder}
              disabled={disabled}
              loading={disabled}
              submitType="enter"
              autoSize={{
                minRows: 1,
                maxRows: 1
              }}
              classNames={{
                input: `
                  px-4 py-3
                  text-gray-900 placeholder-gray-400
                  dark:text-gray-100 dark:placeholder-gray-500
                  ${disabled ? 'cursor-not-allowed opacity-50' : ''}
                `,
                root: 'ant-sender-no-border input-area-sender'
              }}
              styles={{
                input: {
                  minHeight: '48px',
                  fontSize: '16px',
                  lineHeight: '1.5rem'
                },
                // 移除根元素的边框和圆角
                root: {
                  border: 'none',
                  borderRadius: 0
                }
              }}
              // 自定义左侧按钮
              prefix={
                <div className="flex items-center space-x-1 pl-2 h-full">
                  <button
                    onClick={handleAttachment}
                    disabled={disabled}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100
                      rounded-lg transition-all duration-200
                      dark:text-gray-500 dark:hover:text-gray-300 dark:hover:bg-gray-700
                      disabled:opacity-40 disabled:cursor-not-allowed"
                    title="添加附件"
                  >
                    <Paperclip className="w-4 h-4" />
                  </button>

                  <button
                    onClick={handleEmojiClick}
                    disabled={disabled}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100
                      rounded-lg transition-all duration-200
                      dark:text-gray-500 dark:hover:text-gray-300 dark:hover:bg-gray-700
                      disabled:opacity-40 disabled:cursor-not-allowed"
                    title="添加表情"
                  >
                    <Smile className="w-4 h-4" />
                  </button>
                </div>
              }
              // 自定义右侧按钮
              suffix={
                <div className="flex items-center space-x-2 pr-2 h-full">
                  {/* 语音按钮 */}
                  <button
                    onClick={handleVoiceToggle}
                    disabled={disabled}
                    className={`
                      p-2.5 rounded-xl transition-all duration-200
                      ${speech.isListening
                        ? 'text-white bg-red-500 hover:bg-red-600 animate-pulse'
                        : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:text-gray-500 dark:hover:text-gray-300 dark:hover:bg-gray-700'
                      }
                      disabled:opacity-40 disabled:cursor-not-allowed
                    `}
                    title={speech.isListening ? '点击停止录音' : '语音输入'}
                  >
                    {speech.isListening ? <Square className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  </button>

                  {/* 发送按钮 - 自定义样式 */}
                  <button
                    onClick={() => handleSubmit(value)}
                    disabled={!canSend}
                    className={`
                      relative p-2.5 rounded-xl transition-all duration-200
                      ${canSend
                        ? `bg-linear-to-r ${modeConfig.borderGradient} text-white hover:shadow-lg hover:scale-105`
                        : 'bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500'
                      }
                      disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none
                    `}
                    title="发送消息 (Enter)"
                  >
                    <Send className={`w-4 h-4 ${canSend ? 'animate-none' : ''}`} />
                    {canSend && (
                      <div className={`
                        absolute inset-0 rounded-xl bg-linear-to-r ${modeConfig.borderGradient}
                        opacity-20 blur animate-pulse
                      `} />
                    )}
                  </button>
                </div>
              }
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
            />
          </div>
        </div>

        {/* 底部提示信息 */}
        <div className="mt-3 flex items-center justify-between px-4">
          <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
            {/* 快捷键提示 */}
            <span className="flex items-center space-x-2">
              <kbd className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs">Enter</kbd>
              <span>发送</span>
            </span>
            <span className="flex items-center space-x-2">
              <kbd className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs">Shift + Enter</kbd>
              <span>换行</span>
            </span>
          </div>

          {/* 状态指示 */}
          <div className="flex items-center space-x-3 text-xs">
            {speech.isListening && (
              <span className="flex items-center space-x-2 text-red-500">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                </span>
                <span>正在录音...</span>
                {speech.interimTranscript && (
                  <span className="text-gray-500 dark:text-gray-400 ml-2 truncate max-w-xs">
                    {speech.interimTranscript}
                  </span>
                )}
              </span>
            )}

            {disabled && (
              <span className="flex items-center space-x-2 text-blue-500 dark:text-blue-400">
                <span className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-500"></span>
                <span>AI 正在思考...</span>
              </span>
            )}
          </div>
        </div>

        {/* 超限警告 */}
        {isOverLimit && (
          <div className="mt-2 mx-4 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-xs text-red-600 dark:text-red-400 text-center">
              输入内容超出限制，请精简至 {maxLength} 字符以内
            </p>
          </div>
        )}
      </div>
    </div>
  );
};