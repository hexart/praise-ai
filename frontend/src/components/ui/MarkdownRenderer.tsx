import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import type { Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import rehypeRaw from 'rehype-raw';
import { Check, Copy } from 'lucide-react';
import '../../styles/markdown.css'; // 自定义 Markdown 样式

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

/**
 * 代码块组件 - 带复制功能
 */
interface CodeBlockProps {
  children: React.ReactNode;
  className?: string;
  inline?: boolean;
}

const CodeBlock: React.FC<CodeBlockProps> = ({ children, className, inline }) => {
  const [copied, setCopied] = useState(false);
  const language = className?.replace('language-', '') || '';
  const codeString = String(children).replace(/\n$/, '');

  const handleCopy = async () => {
    await navigator.clipboard.writeText(codeString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // 内联代码
  if (inline) {
    return (
      <code className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-sm font-mono text-red-600 dark:text-red-400">
        {children}
      </code>
    );
  }

  // 代码块
  return (
    <div className="relative group my-4">
      {/* 语言标签和复制按钮 */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-800 dark:bg-gray-950 rounded-t-lg border-b border-gray-700">
        {language && (
          <span className="text-xs font-mono text-gray-400 uppercase">{language}</span>
        )}
        <button
          onClick={handleCopy}
          className="ml-auto flex items-center space-x-1 px-2 py-1 rounded bg-gray-700 hover:bg-gray-600 transition-colors text-xs text-gray-300"
          title="复制代码"
        >
          {copied ? (
            <>
              <Check className="w-3 h-3" />
              <span>已复制</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" />
              <span>复制</span>
            </>
          )}
        </button>
      </div>

      {/* 代码内容 */}
      <pre className="mt-0! rounded-t-none! overflow-x-auto">
        <code className={className}>{children}</code>
      </pre>
    </div>
  );
};

/**
 * Markdown 渲染器组件
 */
export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className = '' }) => {
  // 定义自定义组件
  const components: Components = {
    // 代码块
    code: (props) => {
      const { inline, className, children } = props as {
        inline?: boolean;
        className?: string;
        children?: React.ReactNode;
      };
      return (
        <CodeBlock
          inline={inline}
          className={className}
        >
          {children}
        </CodeBlock>
      );
    },

    // 标题
    h1: ({ children }) => (
      <h1 className="text-2xl font-bold mt-6 mb-4 text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 pb-2">
        {children}
      </h1>
    ),
    h2: ({ children }) => (
      <h2 className="text-xl font-bold mt-5 mb-3 text-gray-900 dark:text-gray-100">
        {children}
      </h2>
    ),
    h3: ({ children }) => (
      <h3 className="text-lg font-semibold mt-4 mb-2 text-gray-900 dark:text-gray-100">
        {children}
      </h3>
    ),
    h4: ({ children }) => (
      <h4 className="text-base font-semibold mt-3 mb-2 text-gray-800 dark:text-gray-200">
        {children}
      </h4>
    ),

    // 段落
    p: ({ children }) => (
      <p className="my-3 leading-relaxed text-gray-800 dark:text-gray-200">
        {children}
      </p>
    ),

    // 链接
    a: ({ href, children }) => (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-600 dark:text-blue-400 hover:underline"
      >
        {children}
      </a>
    ),

    // 列表
    ul: ({ children }) => (
      <ul className="my-3 ml-6 list-disc space-y-1 text-gray-800 dark:text-gray-200">
        {children}
      </ul>
    ),
    ol: ({ children }) => (
      <ol className="my-3 ml-6 list-decimal space-y-1 text-gray-800 dark:text-gray-200">
        {children}
      </ol>
    ),
    li: ({ children }) => (
      <li className="leading-relaxed">{children}</li>
    ),

    // 引用
    blockquote: ({ children }) => (
      <blockquote className="my-4 pl-4 border-l-4 border-gray-300 dark:border-gray-600 italic text-gray-700 dark:text-gray-300">
        {children}
      </blockquote>
    ),

    // 表格
    table: ({ children }) => (
      <div className="my-4 overflow-x-auto">
        <table className="min-w-full border-collapse border border-gray-300 dark:border-gray-600">
          {children}
        </table>
      </div>
    ),
    thead: ({ children }) => (
      <thead className="bg-gray-100 dark:bg-gray-800">
        {children}
      </thead>
    ),
    tbody: ({ children }) => (
      <tbody>{children}</tbody>
    ),
    tr: ({ children }) => (
      <tr className="border-b border-gray-200 dark:border-gray-700">
        {children}
      </tr>
    ),
    th: ({ children }) => (
      <th className="px-4 py-2 text-left font-semibold text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600">
        {children}
      </th>
    ),
    td: ({ children }) => (
      <td className="px-4 py-2 text-gray-800 dark:text-gray-200 border border-gray-300 dark:border-gray-600">
        {children}
      </td>
    ),

    // 水平线
    hr: () => (
      <hr className="my-6 border-t border-gray-300 dark:border-gray-600" />
    ),

    // 强调
    strong: ({ children }) => (
      <strong className="font-bold text-gray-900 dark:text-gray-100">
        {children}
      </strong>
    ),
    em: ({ children }) => (
      <em className="italic text-gray-800 dark:text-gray-200">
        {children}
      </em>
    ),

    // 删除线
    del: ({ children }) => (
      <del className="line-through text-gray-600 dark:text-gray-400">
        {children}
      </del>
    ),

    // 图片
    img: ({ src, alt }) => (
      <img
        src={src}
        alt={alt}
        className="my-4 max-w-full h-auto rounded-lg shadow-md"
        loading="lazy"
      />
    ),
  };

  return (
    <div className={`markdown-content ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight, rehypeRaw]}
        components={components}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};
