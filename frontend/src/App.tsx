import React, { useState, useCallback, useEffect } from 'react';
import { ConfigProvider, theme as antdTheme } from 'antd';
import { AppHeader } from './components/layout/AppHeader';
import { ChatInterface } from './components/chat/ChatInterface';
import { InputArea } from './components/chat/InputArea';
import { SettingsModal } from './components/settings/SettingsModal';
import { Toaster } from './components/ui/Toaster';
import { useApp } from './hooks/useApp';
import { initializeTheme, useTheme } from './hooks/useTheme';
import { toast } from 'sonner';
import type { ChatMode } from './types/chat';
import type { ProviderType, ProviderConfig } from './types/provider';
import { MODE_CONFIGS } from './constants/modes';

initializeTheme();
/**
应用主组件
*/
export const App: React.FC = () => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [currentMessage, setCurrentMessage] = useState('');

  // 获取主题
  const { resolvedTheme } = useTheme();

  // 使用主Hook
  const {
    provider,
    chat,
    emotion,
    settings,
    updateSettings,
    userId,
    error,
    resetAll,
    exportData,
    importData
  } = useApp();

  const [selectedMode, setSelectedMode] = useState<ChatMode>(settings.defaultMode);

  // 当设置中的默认模式变化时，更新selectedMode
  useEffect(() => {
    setSelectedMode(settings.defaultMode);
  }, [settings.defaultMode]);

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

    toast.info(`已切换到${MODE_CONFIGS[mode].name}`, {
      description: `${MODE_CONFIGS[mode].description}`
    });
  }, []);

  // 处理提示点击 - 生成范例提示词
  const handlePromptClick = useCallback((prompt: string) => {
    // 根据不同模式和示例生成合适的用户输入范例
    let examplePrompt = '';

    switch (selectedMode) {
      case 'praise':
        // 夸夸模式：生成积极的分享范例
        if (prompt.includes('完成了一个项目')) {
          examplePrompt = '我今天完成了一个项目，感觉很有成就感！';
        } else if (prompt.includes('学会了新技能')) {
          examplePrompt = '我最近学会了一项新技能，觉得自己进步很大！';
        } else if (prompt.includes('帮助了朋友')) {
          examplePrompt = '我今天帮助了一位朋友解决问题，很开心能帮上忙！';
        } else {
          examplePrompt = `${prompt}，我觉得自己做得不错！`;
        }
        break;

      case 'comfort':
        // 安慰模式：生成需要安慰的表达范例
        if (prompt.includes('有点累')) {
          examplePrompt = '今天有点累，工作压力很大，感觉有点焦虑...';
        } else if (prompt.includes('遇到了困难')) {
          examplePrompt = '最近遇到了一些困难，有点不知道该怎么办了';
        } else if (prompt.includes('心情不太好')) {
          examplePrompt = '今天心情不太好，感觉很低落，想找个人说说话';
        } else {
          examplePrompt = `${prompt}，希望能得到一些安慰和鼓励`;
        }
        break;

      case 'smart':
      default:
        // 智能模式：生成自然的对话范例
        if (prompt.includes('今天过得怎么样')) {
          examplePrompt = '我今天还不错，有些小进展，也有一些挑战';
        } else if (prompt.includes('聊聊最近的事')) {
          examplePrompt = '最近工作上有些变化，想聊聊我的感受和想法';
        } else if (prompt.includes('想法分享')) {
          examplePrompt = '最近有一些新的想法，希望能和你探讨一下';
        } else {
          examplePrompt = prompt;
        }
        break;
    }

    setCurrentMessage(examplePrompt);
  }, [selectedMode]);

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

  return (
    <ConfigProvider
      theme={{
        algorithm: resolvedTheme === 'dark' ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
        token: {
          borderRadius: 8,
        },
      }}
    >
      <div className="min-h-screen flex flex-col pt-24 md:pt-21">
        {/* 头部 */}
        <AppHeader
          selectedMode={selectedMode}
          onModeChange={handleModeChange}
          onSettingsClick={() => setIsSettingsOpen(true)}
          onClearHistory={handleClearHistory}
          // onStatsClick={handleStatsClick} // 如果有统计功能的话
          isConnected={provider.isConnected}
          providerName={
            provider.isConnected && provider.connectedProvider && provider.connectedModel
              ? `${provider.supportedProviders.find(p => p.type === provider.connectedProvider)?.name || provider.connectedProvider} (${provider.connectedModel})`
              : provider.provider
                ? (provider.supportedProviders.find(p => p.type === provider.providerType)?.name || provider.providerType)
                : '未配置'
          }
          messageCount={chat.chatHistory.length}
          isLoading={chat.isLoading}
          disabled={chat.isLoading || !provider.provider}
        />

      {/* 主内容区 */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <ChatInterface
          messages={chat.chatHistory}
          selectedMode={selectedMode}
          isLoading={chat.isLoading}
          streamingMessageId={chat.streamingMessageId}
          debugMode={settings.debugMode}
          debugInfo={chat.lastDebugInfo}
          hasProvider={!!provider.provider}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onPromptClick={handlePromptClick}
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
        isModelLoading={provider.isModelLoading}
      />

      {/* 固定输入区域 */}
      <InputArea
        value={currentMessage}
        onChange={setCurrentMessage}
        onSend={handleSendMessage}
        disabled={chat.isLoading || !provider.provider}
        currentMode={selectedMode}
        maxLength={2000}
      />

      {/* 使用自定义 Toaster 组件 */}
      <Toaster />
    </div>
    </ConfigProvider>
  );
};

export default App