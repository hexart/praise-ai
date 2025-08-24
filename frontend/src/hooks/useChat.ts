import { useState, useCallback, useRef, useEffect } from 'react';
import type { ChatMessage, ChatMode } from '../types/chat';
import type { EmotionAnalysis } from '../types/emotion';
import type { BaseProvider } from '../providers/BaseProvider';
import { EmotionAnalysisService } from '../services/EmotionAnalysisService';
import { PromptService } from '../services/PromptService';
import { ResponseDiversityService } from '../services/ResponseDiversityService';
import { getFromStorage, saveToStorage } from '../utils/storage';
import { formatError } from '../utils/formatters';
import { logger, createModuleLogger } from '../utils/logger';

interface UseChatOptions {
  provider: BaseProvider | null;
  currentModel: string | null;
  userId: string;
  maxHistoryLength?: number;
  autoSave?: boolean;
}

interface UseChatReturn {
  // 聊天状态
  chatHistory: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  // 消息操作
  sendMessage: (message: string, mode: ChatMode) => Promise<void>;
  addMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  clearHistory: () => void;
  // 流式消息状态
  streamingMessageId: string | null;
  // 调试信息
  lastDebugInfo: string | null;
}

const STORAGE_KEY = 'chat_history';
const chatLogger = createModuleLogger('useChat');

/**
聊天功能Hook
处理消息发送、接收、历史管理等核心聊天功能
*/
export function useChat({
  provider,
  currentModel,
  userId,
  maxHistoryLength = 50,
  autoSave = true
}: UseChatOptions): UseChatReturn {
  // 基础状态
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>(() => {
    if (autoSave) {
      return getFromStorage<ChatMessage[]>(STORAGE_KEY, []);
    }
    return [];
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null);
  const [lastDebugInfo, setLastDebugInfo] = useState<string | null>(null);

  // 服务实例
  const emotionService = useRef(new EmotionAnalysisService());
  const promptService = useRef(new PromptService());
  const diversityService = useRef(new ResponseDiversityService());

  // 在 useChat.ts 中添加模型同步
  useEffect(() => {
    if (provider && currentModel) {
      emotionService.current.setProvider(provider);
      promptService.current.setProvider(provider);
      // 确保情感分析的Provider实例也有正确的模型
      provider.switchModel(currentModel);
      chatLogger.info('Synced emotion service model', { model: currentModel });
    }
  }, [provider, currentModel]);

  // 自动保存聊天历史
  useEffect(() => {
    if (autoSave && chatHistory.length > 0) {
      saveToStorage(STORAGE_KEY, chatHistory);
    }
  }, [chatHistory, autoSave]);

  // 限制历史记录长度
  useEffect(() => {
    if (chatHistory.length > maxHistoryLength) {
      setChatHistory(prev => prev.slice(-maxHistoryLength));
    }
  }, [chatHistory.length, maxHistoryLength]);

  // 当provider变化时更新情感分析服务
  useEffect(() => {
    if (provider) {
      emotionService.current.setProvider(provider);
    }
  }, [provider]);

  // 添加消息到历史记录
  const addMessage = useCallback((message: Omit<ChatMessage, 'id' | 'timestamp'>) => {
    const newMessage: ChatMessage = {
      ...message,
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now()
    };
    setChatHistory(prev => [...prev, newMessage]);
    return newMessage;
  }, []);
  // 更新消息
  const updateMessage = useCallback((messageId: string, updates: Partial<ChatMessage>) => {
    setChatHistory(prev =>
      prev.map(msg =>
        msg.id === messageId ? { ...msg, ...updates } : msg
      )
    );
  }, []);

  const currentRequestId = useRef<string | null>(null);

  // 发送消息
  const sendMessage = useCallback(async (message: string, mode: ChatMode) => {
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    chatLogger.info('开始发送消息', { message: message.substring(0, 50), requestId });

    // 检查是否已有相同请求在处理
    if (currentRequestId.current) {
      chatLogger.warn('请求已在进行中', { currentRequestId: currentRequestId.current });
      return;
    }

    currentRequestId.current = requestId;

    if (isLoading) {
      chatLogger.warn('消息发送正在进行，忽略重复调用');
      currentRequestId.current = null;
      return;
    }

    if (!provider || !currentModel) {
      setError('Provider或模型不可用');
      currentRequestId.current = null; // 添加这行
      return;
    }

    if (!message.trim()) {
      setError('消息不能为空');
      currentRequestId.current = null; // 添加这行
      return;
    }


    setIsLoading(true);
    setError(null);

    try {
      // 1. 添加用户消息
      addMessage({
        role: 'user',
        content: message.trim(),
        mode,
        isStreaming: false
      });

      // 2. 情感分析（仅对智能模式）
      let emotionAnalysis: EmotionAnalysis | undefined;
      let detectedMode = mode;

      if (mode === 'smart') {
        emotionAnalysis = await emotionService.current.analyzeEmotion(message);
        detectedMode = emotionService.current.recommendMode(emotionAnalysis);
        logger.info('情感分析完成', {
          emotion: emotionAnalysis.primary_emotion,
          intensity: emotionAnalysis.intensity,
          recommendedMode: detectedMode
        });
      }

      // 3. 构建系统提示词
      const systemPrompt = promptService.current.buildSystemPrompt(
        detectedMode,
        emotionAnalysis,
        userId
      );

      // 4. 构建用户消息（包含上下文和引用）
      const enhancedUserMessage = await promptService.current.buildUserMessage(
        message,
        chatHistory,
        emotionAnalysis,
        userId
      );

      // 记录完整的提示词和用户消息
      chatLogger.info('🔥 [LLM交互2] 聊天回复生成 - 发送提示词', {
        systemPrompt,
        userMessage: enhancedUserMessage,
        mode: detectedMode,
        hasEmotion: !!emotionAnalysis,
        emotionContext: emotionAnalysis ? {
          emotion: emotionAnalysis.primary_emotion,
          intensity: emotionAnalysis.intensity,
          needs: emotionAnalysis.needs
        } : null
      });

      // 打印完整提示词用于调试
      logger.info('系统提示词构建完成', { 
        promptLength: systemPrompt.length,
        mode: detectedMode,
        hasEmotion: !!emotionAnalysis
      });

      // 打印增强后的用户消息用于调试
      logger.info('用户消息增强完成', {
        originalLength: message.length,
        enhancedLength: enhancedUserMessage.length,
        hasContext: enhancedUserMessage.includes('最近对话')
      });

      // 5. 生成调试信息
      const debugInfo = promptService.current.buildDebugInfo(
        detectedMode,
        emotionAnalysis,
        systemPrompt,
        enhancedUserMessage
      );
      setLastDebugInfo(debugInfo);

      // 6. 创建AI消息占位符
      const aiMessage = addMessage({
        role: 'assistant',
        content: '',
        mode: detectedMode,
        isStreaming: true,
        emotionAnalysis: emotionAnalysis as unknown as Record<string, unknown>
      });

      setStreamingMessageId(aiMessage.id);

      // 7. 发送流式请求
      const request = {
        message: enhancedUserMessage,
        mode: detectedMode,
        userId,
        chatHistory: chatHistory.filter(msg => msg.role !== 'system')
      };

      let accumulatedContent = '';
      let isComplete = false;

      await provider.sendStreamMessage(
        request,
        // onChunk callback
        (content: string, done: boolean) => {
          if (content) {
            accumulatedContent += content;
            updateMessage(aiMessage.id, {
              content: accumulatedContent,
              isStreaming: !done
            });
          }

          if (done && !isComplete) {
            isComplete = true;
            setStreamingMessageId(null);

            // 记录完整的LLM响应
            chatLogger.info('🔥 [LLM交互2] 聊天回复生成 - 接收响应', {
              fullResponse: accumulatedContent,
              responseLength: accumulatedContent.length,
              mode: detectedMode,
              hasEmotion: !!emotionAnalysis
            });

            // 分析并存储回复多样性
            if (accumulatedContent) {
              diversityService.current.analyzeAndStore(accumulatedContent, userId);
            }

            chatLogger.info('流式传输完成', { totalLength: accumulatedContent.length });
          }
        },
        // onMetadata callback
        (metadata: Record<string, unknown>) => {
          if (metadata.emotion_analysis) {
            updateMessage(aiMessage.id, {
              emotionAnalysis: metadata.emotion_analysis as Record<string, unknown>
            });
          }
          chatLogger.debug('接收到元数据', { 
            hasEmotion: !!metadata.emotion_analysis, 
            model: metadata.model,
            finish_reason: metadata.finish_reason 
          });
        }
      );

      // 确保流式传输已完成
      if (!isComplete) {
        chatLogger.warn('流式传输可能未正常完成');
        updateMessage(aiMessage.id, { isStreaming: false });
        setStreamingMessageId(null);
      }

    } catch (err) {
      chatLogger.error('发送消息失败', { error: err instanceof Error ? err.message : String(err) });
      const errorMessage = formatError(err);
      setError(errorMessage);

      // 如果有正在流式传输的消息，标记为错误
      if (streamingMessageId) {
        updateMessage(streamingMessageId, {
          content: `发送失败：${errorMessage}`,
          isStreaming: false,
          emotionAnalysis: { error: true }
        });
        setStreamingMessageId(null);
      }
    } finally {
      setIsLoading(false);
      currentRequestId.current = null; // 确保在finally中清理
    }
  }, [
    provider,
    currentModel,
    userId,
    chatHistory,
    addMessage,
    updateMessage,
    streamingMessageId,
    isLoading
  ]);

  // 清空聊天历史
  const clearHistory = useCallback(() => {
    setChatHistory([]);
    setError(null);
    setLastDebugInfo(null);
    setStreamingMessageId(null);
    if (autoSave) {
      saveToStorage(STORAGE_KEY, []);
    }

    chatLogger.info('聊天历史已清空');
  }, [autoSave]);
  // 停止当前的流式传输（如果有的话）
  const stopStreaming = useCallback(() => {
    if (streamingMessageId) {
      updateMessage(streamingMessageId, { isStreaming: false });
      setStreamingMessageId(null);
      setIsLoading(false);
    }
  }, [streamingMessageId, updateMessage]);
  // 组件卸载时停止流式传输
  useEffect(() => {
    return () => {
      stopStreaming();
    };
  }, [stopStreaming]);
  return {
    // 聊天状态
    chatHistory,
    isLoading,
    error,
    // 消息操作
    sendMessage,
    addMessage,
    clearHistory,

    // 流式消息状态
    streamingMessageId,

    // 调试信息
    lastDebugInfo
  };
}