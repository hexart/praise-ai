import React, { useState, useEffect } from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme, type Theme } from '../../hooks/useTheme';

export const ThemeToggle: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // 确保组件在客户端渲染，避免SSR期间的主题不匹配
  useEffect(() => {
    // 检查是否已经应用了主题类
    const isDark = document.documentElement.classList.contains('dark');
    const storedTheme = localStorage.getItem('theme') as Theme | null;
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    // 如果已经应用了暗色主题，或者存储的主题是暗色，或者系统偏好是暗色
    if (isDark || storedTheme === 'dark' || (storedTheme === 'system' && systemPrefersDark)) {
      // 立即设置mounted为true，避免闪烁
      setMounted(true);
    } else {
      // 延迟设置mounted为true，确保主题已经正确应用
      const timer = setTimeout(() => {
        setMounted(true);
      }, 0);
      
      return () => clearTimeout(timer);
    }
  }, []);

  const handleThemeChange = (newTheme: Theme) => {
    setTheme(newTheme);
  };

  // 在组件未挂载时不渲染任何内容，避免闪烁
  if (!mounted) {
    return <div className="w-32 h-8" />; // 占位符，避免布局跳动
  }

  return (
    <div className="flex items-center space-x-2">
      <span className="text-sm text-gray-500 dark:text-gray-400">主题:</span>
      <div className="flex rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 shadow-sm transition-all duration-200">
        <button
          type="button"
          className={`rounded-r-none border-0 px-3 py-2 text-sm transition-all duration-200 ${
            theme === 'light' 
              ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-200' 
              : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
          }`}
          onClick={() => handleThemeChange('light')}
          aria-label="浅色模式"
        >
          <Sun className="h-4 w-4" />
        </button>
        <div className="border-l border-gray-300 dark:border-gray-600" />
        <button
          type="button"
          className={`rounded-none border-0 px-3 py-2 text-sm transition-all duration-200 ${
            theme === 'dark' 
              ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-200' 
              : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
          }`}
          onClick={() => handleThemeChange('dark')}
          aria-label="深色模式"
        >
          <Moon className="h-4 w-4" />
        </button>
        <div className="border-l border-gray-300 dark:border-gray-600" />
        <button
          type="button"
          className={`rounded-l-none border-0 px-3 py-2 text-sm transition-all duration-200 ${
            theme === 'system' 
              ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-200' 
              : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
          }`}
          onClick={() => handleThemeChange('system')}
          aria-label="跟随系统"
        >
          <Monitor className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};