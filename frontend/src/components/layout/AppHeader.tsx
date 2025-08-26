import React from 'react';
import { Settings, Heart, MessageCircle, Trash2, BarChart3 } from 'lucide-react';
import { Button } from '../ui/Button';

interface AppHeaderProps {
  onSettingsClick: () => void;
  onClearHistory: () => void;
  onStatsClick?: () => void;
  isConnected: boolean;
  providerName: string;
  messageCount: number;
  isLoading?: boolean;
}

/**
应用头部组件 - 居中显示版本
*/
export const AppHeader: React.FC<AppHeaderProps> = ({
  onSettingsClick,
  onClearHistory,
  onStatsClick,
  isConnected,
  providerName,
  messageCount,
  isLoading = false,
}) => {
  return (
    <header className="fixed top-0 md:top-5 left-0 right-0 z-50 flex justify-center">
      {/* 容器wrapper - 控制最大宽度和居中 */}
      <div className="w-full md:max-w-[960px] backdrop-blur-md bg-white/50 border-b md:border md:rounded-full border-gray-200 shadow-sm dark:bg-gray-950/30 dark:border-gray-700">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* 左侧：Logo和标题 */}
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-pink-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <Heart className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    舔狗&夸夸
                  </h1>
                  <p className="text-xs text-gray-500 dark:text-gray-400">情感支持智能助手</p>
                </div>
              </div>
            </div>

            {/* 中间：状态信息 */}
            <div className="hidden md:flex items-center space-x-6">
              {/* 连接状态 */}
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'
                  }`} />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {isConnected ? `已连接 ${providerName}` : '未连接'}
                </span>
              </div>

              {/* 消息计数 */}
              {messageCount > 0 && (
                <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                  <MessageCircle className="w-4 h-4" />
                  <span>{messageCount} 条消息</span>
                </div>
              )}

              {/* 加载状态 */}
              {isLoading && (
                <div className="flex items-center space-x-2 text-sm text-blue-600 dark:text-blue-400">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                  <span>AI思考中...</span>
                </div>
              )}
            </div>

            {/* 右侧：操作按钮 */}
            <div className="flex items-center space-x-2">
              {/* 统计按钮 */}
              {onStatsClick && messageCount > 0 && (
                <Button
                  onClick={onStatsClick}
                  variant="ghost"
                  size="sm"
                  className="dark:text-gray-400 dark:hover:text-gray-300 dark:hover:bg-gray-800"
                >
                  <BarChart3 className="w-4 h-4" />
                </Button>
              )}

              {/* 清空历史 */}
              {messageCount > 0 && (
                <Button
                  onClick={onClearHistory}
                  variant="ghost"
                  size="sm"
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/30"
                >
                  <Trash2 className="w-4 h-4" />
                  <span className="hidden sm:ml-2 sm:inline">清空</span>
                </Button>
              )}

              {/* 设置按钮 */}
              <Button
                onClick={onSettingsClick}
                variant="ghost"
                size="sm"
                className="text-gray-600 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:bg-gray-800"
              >
                <Settings className="w-4 h-4" />
                <span className="hidden sm:ml-2 sm:inline">设置</span>
              </Button>
            </div>
          </div>

          {/* 移动端状态栏 */}
          <div className="md:hidden pb-3 border-t border-gray-100 pt-2 mt-1 dark:border-gray-800">
            <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-1">
                  <div className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'
                    }`} />
                  <span>{isConnected ? providerName : '未连接'}</span>
                </div>

                {messageCount > 0 && (
                  <div className="flex items-center space-x-1">
                    <MessageCircle className="w-3 h-3" />
                    <span>{messageCount} 条消息</span>
                  </div>
                )}
              </div>

              {isLoading && (
                <div className="flex items-center space-x-1 text-blue-600 dark:text-blue-400">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
                  <span>AI思考中...</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};