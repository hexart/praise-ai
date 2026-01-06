import React from 'react';
import { XMarkdown } from '@ant-design/x-markdown';
import { useTheme } from '../../hooks/useTheme';

interface MarkdownRendererProps {
  content: string;
  className?: string;
  isStreaming?: boolean;
}

/**
 * Markdown 渲染器组件
 * 使用 XMarkdown 内置功能(代码高亮、语言标签)
 */
export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({
  content,
  className = '',
  isStreaming = false
}) => {
  const { resolvedTheme } = useTheme();
  const themeClass = resolvedTheme === 'dark' ? 'x-markdown-dark' : 'x-markdown-light';

  return (
    <div className={`markdown-content ${themeClass} ${className}`}>
      <XMarkdown
        content={content}
        streaming={{
          hasNextChunk: isStreaming,
          enableAnimation: isStreaming
        }}
        openLinksInNewTab
      />
    </div>
  );
};
