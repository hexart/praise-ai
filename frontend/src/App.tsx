import React, { useState, useCallback } from 'react';
import { AppHeader } from './components/layout/AppHeader';
import { ChatInterface } from './components/chat/ChatInterface';
import { InputArea } from './components/chat/InputArea';
import { SettingsModal } from './components/settings/SettingsModal';
import { Loading } from './components/ui/Loading';
import { Toaster } from './components/ui/Toaster';
import { useApp } from './hooks/useApp';
import { toast } from 'sonner';
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
      toast.error('发送失败', {
        description: errorMessage
      });
    }
  }, [currentMessage, selectedMode, chat]);

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
  }, [chat, emotion]);

  // 处理模式切换
  const handleModeChange = useCallback((mode: ChatMode) => {
    setSelectedMode(mode);

    // 根据模式显示不同的提示信息
    const modeNames = {
      'smart': '智能模式',
      'praise': '夸夸模式',
      'comfort': '安慰模式'
    };

    toast.info(`已切换到${modeNames[mode]}`, {
      description: `现在使用${modeNames[mode]}回应你的消息`
    });
  }, []);

  // 处理Provider切换
  const handleProviderChange = useCallback(async (type: ProviderType, config?: ProviderConfig) => {
    try {
      const success = await provider.switchProvider(type, config);
      if (success) {
        toast.success('Provider切换成功', {
          description: `已切换到 ${type}`
        });
        return true;
      } else {
        toast.error('Provider切换失败', {
          description: provider.error || '未知错误'
        });
        return false;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '切换失败';
      toast.error('Provider切换失败', {
        description: errorMessage
      });
      return false;
    }
  }, [provider]);

  // 处理连接测试
  const handleTestConnection = useCallback(async () => {
    try {
      const success = await provider.testConnection();
      if (success) {
        toast.success('连接测试成功');
      } else {
        toast.error('连接测试失败', {
          description: provider.error || '无法连接到服务器'
        });
      }
      return success;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '测试失败';
      toast.error('连接测试失败', {
        description: errorMessage
      });
      return false;
    }
  }, [provider]);

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
      toast.error('数据导入失败', {
        description: errorMessage
      });
      return false;
    }
  }, [importData]);

  // 处理重置所有数据
  const handleResetAll = useCallback(() => {
    const success = resetAll();
    if (success) {
      toast.info('所有数据已重置');
      setIsSettingsOpen(false);
    }
  }, [resetAll]);

  // 错误处理 - 只在错误首次出现时显示toast
  const lastErrorRef = React.useRef<string | null>(null);
  React.useEffect(() => {
    if (error && error !== lastErrorRef.current) {
      toast.error('应用错误', {
        description: error
      });
      lastErrorRef.current = error;
    }
  }, [error]);

  // 如果应用未准备就绪且没有Provider，显示友好的引导界面而不是错误界面
  if (!isReady) {
    // 如果是因为没有Provider导致的未就绪，显示欢迎界面
    if (!provider.provider && !provider.isLoading) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              欢迎使用 AI 智能陪伴助手
            </h3>
            <p className="text-gray-600 mb-4">
              请点击下方按钮配置 AI 服务提供商，选择合适的模型开始对话。
            </p>
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              开始配置
            </button>
          </div>
        </div>
      );
    }

    // 其他情况显示加载界面
    return (
      <Loading size="lg" text='正在初始化AI助手...' />
    );
  }
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col pt-24 md:pt-16">
      {/* 头部 */}
      <AppHeader
        onSettingsClick={() => setIsSettingsOpen(true)}
        onClearHistory={handleClearHistory}
        isConnected={provider.isConnected}
        providerName={provider.isConnected && provider.connectedProvider && provider.connectedModel
          ? `${provider.supportedProviders.find(p => p.type === provider.connectedProvider)?.name || provider.connectedProvider} (${provider.connectedModel})`
          : provider.provider
            ? (provider.supportedProviders.find(p => p.type === provider.providerType)?.name || provider.providerType)
            : '未配置'
        }
        messageCount={chat.chatHistory.length}
        isLoading={chat.isLoading}
      />

      {/* 主内容区 */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <ChatInterface
          messages={chat.chatHistory}
          selectedMode={selectedMode}
          onModeChange={handleModeChange}
          isLoading={chat.isLoading}
          streamingMessageId={chat.streamingMessageId}
          debugMode={settings.debugMode}
          debugInfo={chat.lastDebugInfo}
          hasProvider={!!provider.provider}
          onOpenSettings={() => setIsSettingsOpen(true)}
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
        onSetConnectionStatus={provider.setConnectionStatus}
        settings={settings}
        onSettingsUpdate={updateSettings}
        userId={userId}
        onExportData={exportData}
        onImportData={handleImportData}
        onResetAll={handleResetAll}
        isLoading={provider.isLoading}
        isModelLoading={provider.isModelLoading}
      />

      {/* 叠加式加载组件 - 当Provider正在初始化时显示 */}
      <Loading
        show={provider.isLoading && isSettingsOpen}
        text="正在切换AI服务提供商..."
      />

      {/* 固定输入区域 */}
      <InputArea
        value={currentMessage}
        onChange={setCurrentMessage}
        onSend={handleSendMessage}
        onKeyDown={handleKeyDown}
        disabled={chat.isLoading || !provider.provider}
        currentMode={selectedMode}
        maxLength={2000}
      />

      {/* 使用自定义 Toaster 组件 */}
      <Toaster />
    </div>
  );
};

export default App