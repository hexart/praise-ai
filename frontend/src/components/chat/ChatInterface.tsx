import React, { useState, useMemo } from 'react';
import { Bubble, CodeHighlighter, Actions, Welcome, Prompts, type BubbleItemType } from '@ant-design/x';
import { XMarkdown } from '@ant-design/x-markdown';
import { oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import type { ChatMessage, ChatMode } from '../../types/chat';
import { MODE_CONFIGS } from '../../constants/modes';
import { formatTimestamp } from '../../utils/formatters';
import { useTheme } from '../../hooks/useTheme';
import { Brain, Eye, ChevronDown, ChevronUp, User, Bot } from 'lucide-react';
import '@ant-design/x-markdown/themes/light.css';
import '@ant-design/x-markdown/themes/dark.css';

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

  // 提示点击回调
  onPromptClick?: (prompt: string) => void;

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
            className="bg-linear-to-r from-purple-600 to-indigo-600 text-white px-6 py-3 rounded-xl hover:shadow-lg transition-all duration-200 font-medium"
          >
            立即配置
          </button>
        )}

        {/* 小贴士 */}
        <div className="mt-6 p-3 bg-linear-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 dark:from-blue-900/20 dark:to-indigo-900/20 dark:border-blue-800">
          <p className="text-xs text-blue-700 leading-relaxed dark:text-blue-300">
            💡 <strong>提示:</strong> 支持 OpenAI、Claude、Ollama 等多种 AI 服务，可根据需要选择最适合的方案
          </p>
        </div>
      </div>
    </div>
  );
};

/**
 * 空状态组件 - 使用官方 Welcome 和 Prompts 组件
 */
const EmptyState: React.FC<{ selectedMode: ChatMode; onPromptClick?: (prompt: string) => void }> = ({ selectedMode, onPromptClick }) => {
  const modeConfig = MODE_CONFIGS[selectedMode];

  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="w-full max-w-2xl flex flex-col items-center">
        {/* Welcome 组件 */}
        <Welcome
          title={
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <span style={{ fontSize: '24px' }}>{modeConfig.emoji}</span>
              <span>{modeConfig.name}</span>
            </div>
          }
          description={modeConfig.subtitle}
          variant="borderless"
          styles={{
            title: {
              textAlign: 'center'
            },
            description: {
              textAlign: 'center'
            }
          }}
        />

        {/* Prompts 组件 */}
        <div className="mt-6 flex justify-center">
          <div style={{ width: '100%', maxWidth: '320px' }}>
            <Prompts
              title="你可以试试："
              items={modeConfig.examples.map((example, index) => ({
                key: `example-${index}`,
                label: example,
                description: modeConfig.description
              }))}
              vertical
              onItemClick={(info) => {
                onPromptClick?.(info.data.label as string);
              }}
              styles={{
                list: {
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px'
                },
                title: {
                  textAlign: 'center'
                },
                item: {
                  padding: '12px 16px',
                  borderRadius: '8px',
                  width: '100%',
                  textAlign: 'center'
                }
              }}
            />
          </div>
        </div>

        {/* 模式说明 */}
        <div className="mt-4 p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 w-full max-w-md">
          <div className="flex items-start space-x-2">
            <span className="text-sm">{modeConfig.emoji}</span>
            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
              <strong className="font-semibold">模式特点：</strong>
              {modeConfig.description}
            </p>
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
  hasProvider = true,
  onOpenSettings,
  debugMode = false,
  debugInfo,
  onPromptClick,
  className = ''
}) => {
  const { resolvedTheme } = useTheme();
  const [expandedDebug, setExpandedDebug] = useState(false);

  // 转换消息为 Bubble.List 格式
  const bubbleItems = useMemo(() => {
    return messages.map((msg) => {
      const isUser = msg.role === 'user';
      const bubbleItem: BubbleItemType = {
        key: msg.id,
        role: msg.role,
        content: isUser ? msg.content : (
          <div className={`markdown-content x-markdown-${resolvedTheme}`}>
            <XMarkdown
              content={msg.content}
              streaming={{
                hasNextChunk: msg.isStreaming,
                enableAnimation: msg.isStreaming
              }}
              openLinksInNewTab
              components={{
                code: (props: unknown) => {
                  const propsWithNode = props as { children?: React.ReactNode; domNode?: { parent?: { name?: string } }; className?: string };
                  const { children, domNode } = propsWithNode;
                  const className = propsWithNode.className || '';

                  // 检查是否是代码块（父节点是 pre）
                  const isCodeBlock = domNode?.parent?.name === 'pre';

                  // 如果是内联代码，使用默认样式
                  if (!isCodeBlock) {
                    return <code className={className}>{children}</code>;
                  }

                  // 代码块使用 CodeHighlighter
                  const language = className.replace('language-', '') || 'text';

                  return (
                    <CodeHighlighter
                      lang={language}
                      highlightProps={{
                        style: resolvedTheme === 'dark' ? oneDark : oneLight
                      }}
                    >
                      {String(children)}
                    </CodeHighlighter>
                  );
                }
              }}
            />
          </div>
        ),
        typing: msg.isStreaming
      };

      // 添加 footer
      if (msg.role !== 'user') {
        bubbleItem.footer = (
          <div className={`flex items-center justify-between`}>
            {/* 时间戳 */}
            <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
              {formatTimestamp(msg.timestamp, 'absolute')}
              {msg.isStreaming && (
                <span className="ml-2 inline-flex items-center">
                  <div className="w-2 h-2 bg-current rounded-full animate-pulse" />
                  <span className="ml-1">实时回复中</span>
                </span>
              )}
            </div>

            {/* 官方复制按钮 - 仅在流式完成后显示，带渐进效果 */}
            {!msg.isStreaming && (
              <Actions
                fadeIn
                items={[
                  {
                    key: 'copy',
                    label: '复制',
                    actionRender: () => <Actions.Copy text={msg.content} />
                  }
                ]}
              />
            )}
          </div>
        );
      }

      // 添加 extra (情感分析和调试信息)
      if (msg.role === 'assistant' && debugMode) {
        const extraElements: React.ReactNode[] = [];

        // 情感分析
        if (msg.emotionAnalysis) {
          const emotion = String(msg.emotionAnalysis.primary_emotion || '未知');
          const intensity = msg.emotionAnalysis.intensity ? Number(msg.emotionAnalysis.intensity).toFixed(2) : null;
          const needs = msg.emotionAnalysis.needs ? String(msg.emotionAnalysis.needs) : null;

          extraElements.push(
            <div key="emotion" className="flex items-center space-x-2 text-xs px-2 py-1 bg-purple-50 rounded border border-purple-200 dark:bg-purple-900/30 dark:border-purple-700">
              <Brain className="w-3 h-3 text-purple-500 dark:text-purple-400" />
              <span className="text-purple-700 font-medium dark:text-purple-300">
                情感: {emotion}
              </span>
              {intensity && (
                <span className="text-gray-600 dark:text-gray-400">
                  强度: {intensity}
                </span>
              )}
              {needs && (
                <span className="text-gray-600 dark:text-gray-400">
                  • 需求: {needs}
                </span>
              )}
            </div>
          );
        }

        // 调试信息
        if (debugInfo && msg.id === messages[messages.length - 1]?.id) {
          extraElements.push(
            <div key="debug" className="border border-gray-200 rounded bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
              <button
                onClick={() => setExpandedDebug(!expandedDebug)}
                className="w-full px-3 py-2 flex items-center space-x-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <Eye className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">调试信息</span>
                {expandedDebug ? <ChevronUp className="w-4 h-4 ml-auto text-gray-500 dark:text-gray-400" /> : <ChevronDown className="w-4 h-4 ml-auto text-gray-500 dark:text-gray-400" />}
              </button>
              {expandedDebug && (
                <div className="px-3 py-2 border-t border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
                  <pre className="text-xs text-gray-600 whitespace-pre-wrap font-mono leading-relaxed overflow-x-auto dark:text-gray-400">
                    {debugInfo}
                  </pre>
                </div>
              )}
            </div>
          );
        }

        if (extraElements.length > 0) {
          bubbleItem.extra = <div className="mt-2 space-y-2">{extraElements}</div>;
        }
      }

      return bubbleItem;
    });
  }, [messages, debugMode, debugInfo, expandedDebug, resolvedTheme]);

  // 模式配色配置 - 根据主题动态调整
  const roleConfig = {
    user: {
      placement: 'end' as const,
      avatar: () => (
        <div className="w-8 h-8 rounded-full flex items-center justify-center bg-sky-500 shadow-sm">
          <User className="w-4 h-4 text-white" />
        </div>
      ),
      styles: {
        content: {
          background: 'linear-gradient(to right, rgb(59 130 246), rgb(37 99 235))',
          color: 'white',
          borderRadius: '16px'
        }
      }
    },
    assistant: {
      placement: 'start' as const,
      avatar: (info: { typing?: boolean } | undefined) => (
        <div className={`w-8 h-8 rounded-full flex items-center justify-center shadow-sm ${
          resolvedTheme === 'dark' ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
        }`}>
          <Bot className={`w-4 h-4 ${info?.typing ? 'text-blue-500' : 'text-gray-600 dark:text-gray-400'}`} />
        </div>
      ),
      styles: {
        content: {
          backgroundColor: resolvedTheme === 'dark' ? 'rgb(31 41 55)' : 'white',
          border: resolvedTheme === 'dark' ? '1px solid rgb(55 65 81)' : '1px solid rgb(229 231 235)',
          borderRadius: '16px'
        }
      }
    },
    system: {
      variant: 'borderless' as const,
      styles: {
        content: {
          backgroundColor: 'rgb(243 244 246)',
          borderRadius: '9999px',
          textAlign: 'center' as const,
          padding: '8px 16px'
        }
      }
    }
  };

  return (
    <div className={`flex flex-col h-full bg-gray-50 ${className} dark:bg-gray-900`}>
      {/* 聊天消息区域 */}
      <div className="flex-1 overflow-y-auto px-4 py-6 pb-48">
        <div className="max-w-4xl mx-auto">
          {/* 空状态 */}
          {messages.length === 0 && (
            <>
              {/* 如果Provider未配置，优先显示配置提示 */}
              {!hasProvider ? (
                <NoProviderState onOpenSettings={onOpenSettings} />
              ) : (
                <EmptyState selectedMode={selectedMode} onPromptClick={onPromptClick} />
              )}
            </>
          )}

          {/* 消息列表 - 使用 Bubble.List */}
          {messages.length > 0 && (
            <Bubble.List
              items={bubbleItems}
              role={roleConfig}
              autoScroll
            />
          )}
        </div>
      </div>
    </div>
  );
};
