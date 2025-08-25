import { useState, useCallback, useEffect, useMemo } from 'react';
import { useProvider } from './useProvider';
import { useChat } from './useChat';
import { useEmotionAnalysis } from './useEmotionAnalysis';
import type { ChatMode } from '../types/chat';
import { getFromStorage, saveToStorage } from '../utils/storage';
import { logger } from '../utils/logger';

interface AppSettings {
  debugMode: boolean;
  defaultMode: ChatMode;
  autoSave: boolean;
  maxHistoryLength: number;
}
interface UseAppReturn {
  // Provider相关
  provider: ReturnType<typeof useProvider>;
  // 聊天相关
  chat: ReturnType<typeof useChat>;
  // 情感分析相关
  emotion: ReturnType<typeof useEmotionAnalysis>;
  // 应用设置
  settings: AppSettings;
  updateSettings: (newSettings: Partial<AppSettings>) => void;
  // 用户ID
  userId: string;
  // 应用状态
  isReady: boolean;
  error: string | null;
  // 工具方法
  resetAll: () => boolean;
  exportData: () => string;
  importData: (data: string) => boolean;
}
const DEFAULT_SETTINGS: AppSettings = {
  debugMode: false,
  defaultMode: 'smart',
  autoSave: true,
  maxHistoryLength: 50
};
const STORAGE_KEYS = {
  SETTINGS: 'app_settings',
  USER_ID: 'app_user_id'
};

/**
应用主Hook
整合所有功能模块，提供统一的应用状态管理
*/
export function useApp(): UseAppReturn {
  // 应用设置
  const [settings, setSettings] = useState<AppSettings>(() =>
    getFromStorage(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS)
  );

  // 用户ID
  const [userId] = useState<string>(() => {
    let id = getFromStorage<string>(STORAGE_KEYS.USER_ID, '');
    if (!id) {
      id = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      saveToStorage(STORAGE_KEYS.USER_ID, id);
    }
    return id;
  });
  const [error, setError] = useState<string | null>(null);

  // Provider Hook
  const provider = useProvider();

  // 情感分析Hook（先声明）
  const emotion = useEmotionAnalysis({
    userId,
    autoAnalyze: true,
    historyLimit: 20
  });

  // 聊天Hook
  const chat = useChat({
    provider: provider.provider,
    currentModel: provider.currentModel,
    userId,
    maxHistoryLength: settings.maxHistoryLength,
    autoSave: settings.autoSave
  });

  // Provider设置（在声明之后）
  useEffect(() => {
    // 让两个系统共享相同的provider，并同步模型
    if (provider.provider && provider.currentModel) {
      const emotionService = emotion.getEmotionService();
      emotionService.setProvider(provider.provider);

      // 确保情感分析服务的Provider也设置了正确的模型
      provider.provider.switchModel(provider.currentModel);

      logger.info('Synced emotion service provider and model', { model: provider.currentModel });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [provider.provider, provider.currentModel]);

  // 应用是否准备就绪
  const isReady = useMemo(() => {
    // 应用就绪条件：有可用的Provider（模型列表可以后续加载）
    return Boolean(provider.provider) && !provider.isLoading;
  }, [provider.provider, provider.isLoading]);

  // 更新设置
  const updateSettings = useCallback((newSettings: Partial<AppSettings>) => {
    setSettings(prev => {
      const updated = { ...prev, ...newSettings };
      saveToStorage(STORAGE_KEYS.SETTINGS, updated);
      return updated;
    });
  }, []);

  // 重置所有数据
  const resetAll = useCallback(() => {
    // 直接执行重置操作，确认逻辑在UI层处理
    try {
      // 清除聊天记录
      chat.clearHistory();
      // 清除情感分析历史
      emotion.clearHistory();

      // 重置设置
      setSettings(DEFAULT_SETTINGS);
      saveToStorage(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);

      // 清除错误状态
      setError(null);

      logger.info('useApp', 'All data has been reset');
      return true; // 返回true表示操作已执行

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to reset data';
      setError(errorMessage);
      logger.error('Failed to reset data: ' + (err instanceof Error ? err.message : String(err)));
      return false; // 返回false表示操作失败
    }
  }, [chat, emotion]);

  // 导出数据
  const exportData = useCallback((): string => {
    try {
      const exportData = {
        version: '2.0.0',
        timestamp: Date.now(),
        userId,
        settings,
        chatHistory: chat.chatHistory,
        analysisHistory: emotion.analysisHistory,
        providerConfig: {
          type: provider.providerType,
          config: provider.config
        }
      };
      return JSON.stringify(exportData, null, 2);

    } catch (err) {
      logger.error('Failed to export data: ' + (err instanceof Error ? err.message : String(err)));
      throw new Error('导出数据失败');
    }
  }, [userId, settings, chat.chatHistory, emotion.analysisHistory, provider.providerType, provider.config]);

  // 导入数据
  const importData = useCallback((data: string): boolean => {
    try {
      const importedData = JSON.parse(data);
      // 验证数据格式
      if (!importedData.version || !importedData.userId) {
        throw new Error('Invalid data format');
      }

      // 导入设置
      if (importedData.settings) {
        updateSettings(importedData.settings);
      }

      // 导入聊天记录（这里需要重新设置状态，因为useChat没有直接的导入方法）
      // 注意：这里简化处理，实际应用中可能需要更复杂的导入逻辑

      logger.info('useApp', 'Data imported successfully');
      return true;

    } catch (err) {
      logger.error('Failed to import data: ' + (err instanceof Error ? err.message : String(err)));
      setError('导入数据失败：格式不正确或数据损坏');
      return false;
    }
  }, [updateSettings]);

  // 监听Provider错误
  useEffect(() => {
    if (provider.error) {
      setError(provider.error);
    }
  }, [provider.error]);

  // 监听Chat错误
  useEffect(() => {
    if (chat.error) {
      setError(chat.error);
    }
  }, [chat.error]);

  // 当聊天历史变化时，更新情感分析趋势
  useEffect(() => {
    if (chat.chatHistory.length > 0) {
      emotion.analyzeEmotionTrend(chat.chatHistory);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chat.chatHistory, emotion.analyzeEmotionTrend]);

  // 开发环境下的调试日志（精简版）
  useEffect(() => {
    if (settings.debugMode) {
      logger.setEnabled(true);
      console.log('[SystemState]', {
        provider: {
          type: provider.providerType,
          hasProvider: !!provider.provider,
          currentModel: provider.currentModel,
          modelCount: provider.models.length
        },
        chat: {
          messageCount: chat.chatHistory.length,
          isLoading: chat.isLoading,
          streamingId: chat.streamingMessageId
        },
        emotion: {
          currentEmotion: emotion.currentAnalysis?.primary_emotion,
          analysisCount: emotion.analysisHistory.length,
          trend: emotion.emotionTrend?.trend
        }
      });
    } else {
      logger.setEnabled(false);
    }
    // 只监听debugMode变化，避免频繁触发
    // 忽略ESLint警告，因为我们只想在debugMode改变时执行，而不是在状态变化时
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.debugMode]);
  return {
    // Provider相关
    provider,
    // 聊天相关
    chat,

    // 情感分析相关
    emotion,

    // 应用设置
    settings,
    updateSettings,

    // 用户ID
    userId,

    // 应用状态
    isReady,
    error: error || provider.error || chat.error,

    // 工具方法
    resetAll,
    exportData,
    importData
  };
}