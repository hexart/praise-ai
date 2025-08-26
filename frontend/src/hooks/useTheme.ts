import { useCallback, useSyncExternalStore } from 'react';

export type Theme = 'light' | 'dark' | 'system';

// 主题管理器 - 单例模式，全局共享
class ThemeManager {
  private listeners = new Set<() => void>();
  
  // 获取当前存储的主题设置
  getStoredTheme(): Theme {
    if (typeof window === 'undefined') return 'system';
    
    const stored = localStorage.getItem('theme');
    if (stored === 'light' || stored === 'dark') return stored;
    return 'system';
  }
  
  // 获取实际应用的主题（light 或 dark）
  getResolvedTheme(): 'light' | 'dark' {
    const stored = this.getStoredTheme();
    
    if (stored === 'system') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    
    return stored;
  }
  
  // 设置主题
  setTheme(theme: Theme) {
    // 保存到 localStorage
    if (theme === 'system') {
      localStorage.removeItem('theme');
    } else {
      localStorage.setItem('theme', theme);
    }
    
    // 应用到 DOM
    this.applyTheme();
    
    // 通知所有监听器
    this.listeners.forEach(listener => listener());
  }
  
  // 应用主题到 DOM
  private applyTheme() {
    const resolved = this.getResolvedTheme();
    
    // 使用 toggle 方法，更高效
    document.documentElement.classList.toggle('dark', resolved === 'dark');
  }
  
  // 订阅主题变化
  subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
  
  // 初始化 - 在应用启动时调用一次
  init() {
    // 应用初始主题
    this.applyTheme();
    
    // 监听系统主题变化
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', () => {
      if (this.getStoredTheme() === 'system') {
        this.applyTheme();
        this.listeners.forEach(listener => listener());
      }
    });
  }
}

// 创建全局实例
const themeManager = new ThemeManager();

// 导出初始化函数
export const initializeTheme = () => themeManager.init();

// React Hook - 使用 useSyncExternalStore 实现完美的同步
export function useTheme() {
  // 使用 React 18 的 useSyncExternalStore 来订阅外部存储
  // 这确保了服务端渲染和客户端渲染的一致性
  const theme = useSyncExternalStore(
    themeManager.subscribe.bind(themeManager),
    () => themeManager.getStoredTheme(),
    () => 'system' // 服务端默认值
  );
  
  const setTheme = useCallback((newTheme: Theme) => {
    themeManager.setTheme(newTheme);
  }, []);
  
  return {
    theme,
    setTheme,
    resolvedTheme: themeManager.getResolvedTheme()
  };
}