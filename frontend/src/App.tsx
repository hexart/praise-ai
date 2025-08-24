import React, { useState, useCallback } from 'react';
import { AppHeader } from './components/layout/AppHeader';
import { ChatInterface } from './components/chat/ChatInterface';
import { SettingsModal } from './components/settings/SettingsModal';
import { ToastContainer } from './components/ui/Toast';
import { FullScreenLoading } from './components/ui/Loading';
import { useApp } from './hooks/useApp';
import { useToast } from './hooks/useToast';
import type { ChatMode } from './types/chat';
import type { ProviderType, ProviderConfig } from './types/provider';

/**
应用主组件
*/
export const App: React.FC = () => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [currentMessage, setCurrentMessage] = useState('');
  const [selectedMode, setSelectedMode] = useState<ChatMode>('smart');

  // 使用主Hook
  const {
    provider,
    chat,
    emotion,
    settings,
    updateSettings,
    userId,
    isReady,
    error,
    resetAll,
    exportData,
    importData
  } = useApp();
  // 使用Toast
  const { messages: toastMessages, removeToast, toast } = useToast();
  // 处理消息发送
  const handleSendMessage = useCallback(async () => {
    if (!currentMessage.trim() || chat.isLoading) return;
    try {
      await chat.sendMessage(currentMessage.trim(), selectedMode);
      setCurrentMessage('');

      // 成功发送后的提示（可选）
      // toast.success('消息已发送');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '发送失败';
      toast.error('发送失败', errorMessage);
    }
  }, [currentMessage, selectedMode, chat, toast]);
  // 处理键盘事件
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }, [handleSendMessage]);
  // 处理清空历史
  const handleClearHistory = useCallback(() => {
    if (confirm('确定要清空所有聊天记录吗？')) {
      chat.clearHistory();
      emotion.clearHistory();
      toast.info('聊天记录已清空');
    }
  }, [chat, emotion, toast]);
  // 处理Provider切换
  const handleProviderChange = useCallback(async (type: ProviderType, config: ProviderConfig) => {
    try {
      const success = await provider.switchProvider(type, config);
      if (success) {
        toast.success('Provider切换成功', `已切换到 ${type}`);
        return true;
      } else {
        toast.error('Provider切换失败', provider.error || '未知错误');
        return false;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '切换失败';
      toast.error('Provider切换失败', errorMessage);
      return false;
    }
  }, [provider, toast]);
  // 处理连接测试
  const handleTestConnection = useCallback(async () => {
    try {
      const success = await provider.testConnection();
      if (success) {
        toast.success('连接测试成功');
      } else {
        toast.error('连接测试失败', provider.error || '无法连接到服务器');
      }
      return success;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '测试失败';
      toast.error('连接测试失败', errorMessage);
      return false;
    }
  }, [provider, toast]);
  // 处理数据导入
  const handleImportData = useCallback((data: string) => {
    try {
      const success = importData(data);
      if (success) {
        toast.success('数据导入成功');
        setIsSettingsOpen(false);
      }
      return success;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '导入失败';
      toast.error('数据导入失败', errorMessage);
      return false;
    }
  }, [importData, toast]);

  // 处理重置所有数据
  const handleResetAll = useCallback(() => {
    resetAll();
    toast.info('所有数据已重置');
    setIsSettingsOpen(false);
  }, [resetAll, toast]);

  // 错误处理 - 只在错误首次出现时显示toast
  const lastErrorRef = React.useRef<string | null>(null);
  React.useEffect(() => {
    if (error && error !== lastErrorRef.current) {
      toast.error('应用错误', error);
      lastErrorRef.current = error;
    }
  }, [error, toast]);

  // 如果应用未准备就绪，显示加载界面
  if (!isReady && !error) {
    return (
      <FullScreenLoading
        text="正在初始化AI助手..."
      />
    );
  }
  // 如果有严重错误且Provider不可用，显示错误界面
  if (!provider.provider && error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            初始化失败
          </h3>
          <p className="text-gray-600 mb-4">
            {error}
          </p>
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            打开设置
          </button>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* 头部 */}
      <AppHeader
        onSettingsClick={() => setIsSettingsOpen(true)}
        onClearHistory={handleClearHistory}
        isConnected={!!provider.provider}
        providerName={provider.supportedProviders.find(p => p.type === provider.providerType)?.name || provider.providerType}
        messageCount={chat.chatHistory.length}
        isLoading={chat.isLoading}
      />

      {/* 主内容区 */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <ChatInterface
          messages={chat.chatHistory}
          currentMessage={currentMessage}
          onMessageChange={setCurrentMessage}
          onSendMessage={handleSendMessage}
          selectedMode={selectedMode}
          onModeChange={setSelectedMode}
          isLoading={chat.isLoading}
          streamingMessageId={chat.streamingMessageId}
          debugMode={settings.debugMode}
          debugInfo={chat.lastDebugInfo}
          onKeyDown={handleKeyDown}
          className="flex-1"
        />
      </main>

      {/* 设置模态框 */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        providers={provider.supportedProviders}
        currentProvider={provider.providerType}
        currentConfig={provider.config}
        onProviderChange={handleProviderChange}
        onConfigUpdate={provider.updateConfig}
        onTestConnection={handleTestConnection}
        models={provider.models}
        currentModel={provider.currentModel}
        onModelSwitch={provider.switchModel}
        onLoadModels={provider.loadModels}
        settings={settings}
        onSettingsUpdate={updateSettings}
        userId={userId}
        onExportData={exportData}
        onImportData={handleImportData}
        onResetAll={handleResetAll}
        isLoading={provider.isLoading}
      />

      {/* Toast通知 */}
      <ToastContainer
        messages={toastMessages}
        onRemove={removeToast}
      />
    </div>
  );
};

export default App