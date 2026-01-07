import React, { useState, useEffect } from 'react';
import { Settings, Heart, Trash2, BarChart3, Menu, X } from 'lucide-react';
import type { ChatMode } from '../../types/chat';
import { MODE_CONFIGS } from '../../constants/modes';

interface AppHeaderProps {
  // 模式相关
  selectedMode: ChatMode;
  onModeChange: (mode: ChatMode) => void;
  
  // 操作回调
  onSettingsClick: () => void;
  onClearHistory: () => void;
  onStatsClick?: () => void;
  
  // 状态信息
  isConnected: boolean;
  providerName: string;
  messageCount: number;
  isLoading?: boolean;
  disabled?: boolean;
}

/**
 * 模式选择器子组件 - 桌面端
 */
const ModeTabs: React.FC<{
  selectedMode: ChatMode;
  onModeChange: (mode: ChatMode) => void;
  disabled?: boolean;
}> = ({ selectedMode, onModeChange, disabled }) => {
  return (
    <div className="flex items-center space-x-1 p-1 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-xl">
      {Object.values(MODE_CONFIGS).map((config) => {
        const IconComponent = config.icon;
        const isSelected = selectedMode === config.id;
        
        return (
          <button
            key={config.id}
            onClick={() => !disabled && onModeChange(config.id)}
            disabled={disabled}
            className={`
              relative px-3 py-1.5 rounded-lg transition-all duration-200
              flex items-center space-x-2 text-sm font-medium
              ${isSelected
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-white/50 dark:hover:bg-gray-700/50'
              }
              ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `}
            title={config.description}
          >
            <IconComponent className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{config.name}</span>
            
            {/* 选中时的渐变下划线 */}
            {isSelected && (
              <div className={`
                absolute bottom-0 left-2 right-2 h-0.5 
                bg-linear-to-r ${config.gradient} 
                rounded-full
              `} />
            )}
          </button>
        );
      })}
    </div>
  );
};

/**
 * 连接状态指示器 - 紧凑版
 */
const ConnectionStatus: React.FC<{
  isConnected: boolean;
  providerName: string;
  isLoading?: boolean;
  compact?: boolean;
}> = ({ isConnected, providerName, isLoading, compact = false }) => {
  if (compact) {
    // 移动端紧凑版本
    return (
      <div className="flex items-center space-x-1.5">
        <div className={`
          w-2 h-2 rounded-full transition-colors
          ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'}
        `} />
        {isLoading && (
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
        )}
      </div>
    );
  }
  
  // 桌面端完整版本
  return (
    <div className="flex items-center space-x-2 text-xs">
      <div className="flex items-center space-x-1.5">
        <div className={`
          w-1.5 h-1.5 rounded-full transition-colors
          ${isConnected ? 'bg-emerald-500' : 'bg-gray-400'}
        `} />
        <span className="lg:max-w-56 truncate text-gray-600 dark:text-gray-400">
          {providerName}
        </span>
      </div>
      
      {isLoading && (
        <>
          <span className="text-gray-400 dark:text-gray-600">•</span>
          <div className="flex items-center space-x-1.5 text-blue-600 dark:text-blue-400">
            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
            <span>处理中</span>
          </div>
        </>
      )}
    </div>
  );
};

/**
 * 应用头部组件 - 悬浮半透明设计
 */
export const AppHeader: React.FC<AppHeaderProps> = ({
  selectedMode,
  onModeChange,
  onSettingsClick,
  onClearHistory,
  onStatsClick,
  isConnected,
  providerName,
  messageCount,
  isLoading = false,
  disabled = false,
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isModeMenuOpen, setIsModeMenuOpen] = useState(false);
  
  // 点击外部关闭下拉菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.mode-menu-container')) {
        setIsModeMenuOpen(false);
      }
    };
    
    if (isModeMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isModeMenuOpen]);
  
  return (
    <header className="fixed top-2 md:top-4 left-0 right-0 z-50 px-4 md:px-6">
      <div className="max-w-5xl mx-auto">
        <div className={`
          backdrop-blur-xl bg-white/70 dark:bg-gray-900/70 
          border border-gray-200/50 dark:border-gray-700/50
          rounded-2xl shadow-lg
        `}>
          <div className="px-4 sm:px-6">
            <div className="flex items-center justify-between h-14">
              {/* 左侧：Logo + 品牌 */}
              <div className="flex items-center space-x-3 lg:space-x-4">
                {/* Logo和标题 */}
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 bg-linear-to-br from-pink-500 to-purple-600 rounded-xl flex items-center justify-center shadow-md">
                    <Heart className="w-4.5 h-4.5 text-white" />
                  </div>
                  <div className="block">
                    <h1 className="text-base font-semibold text-gray-900 dark:text-white leading-none">
                      舔狗&夸夸
                    </h1>
                    <p className="text-xs truncate text-gray-500 dark:text-gray-400 mt-0.5">
                      AI情感支持助手
                    </p>
                  </div>
                </div>
                
                {/* 移动端连接状态指示器 */}
                <div className="sm:hidden">
                  <ConnectionStatus
                    isConnected={isConnected}
                    providerName={providerName}
                    isLoading={isLoading}
                    compact={true}
                  />
                </div>
                
                {/* 分隔线 */}
                <div className="hidden lg:block h-8 w-px bg-gray-200/50 dark:bg-gray-700/50" />
                
                {/* 桌面端模式选择器 */}
                <div className="hidden lg:block">
                  <ModeTabs
                    selectedMode={selectedMode}
                    onModeChange={onModeChange}
                    disabled={disabled}
                  />
                </div>
              </div>

              {/* 中间：连接状态（平板和桌面端） */}
              <div className="hidden sm:flex items-center">
                <ConnectionStatus
                  isConnected={isConnected}
                  providerName={providerName}
                  isLoading={isLoading}
                />
              </div>

              {/* 右侧：操作按钮 */}
              <div className="flex items-center space-x-2">
                {/* 移动端模式选择按钮 */}
                <div className="lg:hidden relative mode-menu-container">
                  <button
                    onClick={() => setIsModeMenuOpen(!isModeMenuOpen)}
                    disabled={disabled}
                    className={`
                      flex items-center space-x-1.5 px-3 py-1.5 
                      bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-lg
                      text-sm font-medium text-gray-700 dark:text-gray-300
                      hover:bg-white/70 dark:hover:bg-gray-700/70
                      transition-all duration-200
                      ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
                    `}
                  >
                    {(() => {
                      const config = MODE_CONFIGS[selectedMode];
                      const IconComponent = config.icon;
                      return (
                        <>
                          <IconComponent className="w-4 h-4" />
                          <span className="hidden sm:inline truncate">{config.name}</span>
                          <svg 
                            className={`w-3 h-3 transition-transform duration-200 ${isModeMenuOpen ? 'rotate-180' : ''}`}
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </>
                      );
                    })()}
                  </button>
                  
                  {/* 模式下拉菜单 */}
                  {isModeMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 py-1 z-50">
                      {Object.values(MODE_CONFIGS).map((config) => {
                        const IconComponent = config.icon;
                        const isSelected = selectedMode === config.id;
                        
                        return (
                          <button
                            key={config.id}
                            onClick={() => {
                              onModeChange(config.id);
                              setIsModeMenuOpen(false);
                            }}
                            disabled={disabled}
                            className={`
                              w-full flex items-center space-x-3 px-4 py-2.5
                              text-sm transition-colors duration-200
                              ${isSelected 
                                ? 'bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white' 
                                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                              }
                              ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
                            `}
                          >
                            <IconComponent className="w-4 h-4 shrink-0" />
                            <div className="flex-1 text-left">
                              <div className="font-medium">{config.name}</div>
                              <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                {config.description}
                              </div>
                            </div>
                            {isSelected && (
                              <svg className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
                
                {/* 桌面端按钮组 */}
                <div className="hidden sm:flex items-center space-x-2">
                  {/* 统计按钮 */}
                  {onStatsClick && messageCount > 0 && (
                    <button
                      onClick={onStatsClick}
                      className="px-3 py-1.5 text-sm font-medium text-gray-600 bg-white/50 hover:bg-white/70 hover:text-gray-900 dark:text-gray-400 dark:bg-gray-800/50 dark:hover:text-gray-200 dark:hover:bg-gray-800/70 rounded-lg transition-all duration-200"
                    >
                      <BarChart3 className="w-4 h-4 inline mr-1.5" />
                      <span className="hidden lg:inline">统计</span>
                    </button>
                  )}
                  
                  {/* 清空按钮 - 内置消息数量 */}
                  {messageCount > 0 && (
                    <button
                      onClick={onClearHistory}
                      className="flex items-center gap-2 h-8 px-3 py-1.5 text-sm font-medium bg-white/50 text-gray-600 hover:text-gray-900 dark:bg-gray-800/50 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-white/70 dark:hover:bg-gray-800/70 rounded-lg transition-all duration-200"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span className="hidden lg:inline">清空</span>
                      <span className="inline-flex items-center justify-center h-5 px-1.5 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full font-medium">
                        {messageCount}
                      </span>
                    </button>
                  )}
                  
                  {/* 设置按钮 */}
                  <button
                    onClick={onSettingsClick}
                    className="flex items-center gap-2 h-8 px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 dark:bg-gray-800/50 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-white/50 dark:hover:bg-gray-800/50 rounded-lg transition-all duration-200"
                  >
                    <Settings className="w-4 h-4" />
                    <span className="hidden lg:inline">设置</span>
                  </button>
                </div>
                
                {/* 移动端菜单按钮 */}
                <button
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="sm:hidden p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-white/50 dark:hover:bg-gray-800/50 rounded-lg transition-colors"
                >
                  {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
              </div>
            </div>
          </div>
          
          {/* 移动端下拉菜单 */}
          {isMobileMenuOpen && (
            <div className="sm:hidden border-t border-gray-200/50 dark:border-gray-700/50 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm">
              <div className="px-4 py-3 space-y-2">
                {/* 操作按钮 */}
                {onStatsClick && messageCount > 0 && (
                  <button
                    onClick={() => {
                      onStatsClick();
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-white/50 dark:hover:bg-gray-800/50 rounded-lg"
                  >
                    <span className="flex items-center space-x-2">
                      <BarChart3 className="w-4 h-4" />
                      <span>查看统计</span>
                    </span>
                  </button>
                )}
                
                {messageCount > 0 && (
                  <button
                    onClick={() => {
                      onClearHistory();
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-white/50 dark:hover:bg-gray-800/50 rounded-lg"
                  >
                    <span className="flex items-center space-x-2">
                      <Trash2 className="w-4 h-4" />
                      <span>清空聊天</span>
                    </span>
                    <span className="px-2 py-0.5 text-xs bg-gray-100/70 dark:bg-gray-700/70 rounded-md font-medium">
                      {messageCount}
                    </span>
                  </button>
                )}
                
                <button
                  onClick={() => {
                    onSettingsClick();
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-white/50 dark:hover:bg-gray-800/50 rounded-lg"
                >
                  <span className="flex items-center space-x-2">
                    <Settings className="w-4 h-4" />
                    <span>设置</span>
                  </span>
                </button>
                
                {/* 连接状态详情 - 移动端菜单内显示 */}
                <div className="pt-2 border-t border-gray-200/50 dark:border-gray-700/50">
                  <div className="px-3 py-2 text-xs text-gray-600 dark:text-gray-400">
                    <div className="flex items-center justify-between">
                      <span>连接状态</span>
                      <div className="flex items-center space-x-1.5">
                        <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500' : 'bg-gray-400'}`} />
                        <span>{providerName}</span>
                      </div>
                    </div>
                    {isLoading && (
                      <div className="flex items-center justify-between mt-1">
                        <span>AI状态</span>
                        <div className="flex items-center space-x-1.5 text-blue-600 dark:text-blue-400">
                          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                          <span>处理中</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};