import { useState, useCallback, useRef, useEffect } from 'react';
import type { ChatMessage, ChatMode } from '../types/chat';
import type { BaseProvider } from '../providers/BaseProvider';
import { EmotionAnalysisService } from '../services/EmotionAnalysisService';
import { PromptService } from '../services/PromptService';
import { ResponseDiversityService } from '../services/ResponseDiversityService';
import { getFromStorage, saveToStorage } from '../utils/storage';
import { formatError } from '../utils/formatters';

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
      // 确保情感分析的Provider实例也有正确的模型
      provider.switchModel(currentModel);
      console.log('[useChat] Synced emotion service model:', currentModel);
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
    console.log('[useChat] Starting message send:', message, 'ID:', requestId);

    // 检查是否已有相同请求在处理
    if (currentRequestId.current) {
      console.log('[useChat] Request already in progress:', currentRequestId.current);
      return;
    }

    currentRequestId.current = requestId;

    if (isLoading) {
      console.log('[useChat] Message sending in progress, ignoring duplicate call');
      currentRequestId.current = null; // 添加这行
      return;
    }

    if (!provider || !currentModel) {
      setError('Provider or model not available');
      currentRequestId.current = null; // 添加这行
      return;
    }

    if (!message.trim()) {
      setError('Message cannot be empty');
      currentRequestId.current = null; // 添加这行
      return;
    }

    console.log('[useChat] Starting message send:', message)
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
      let emotionAnalysis;
      let detectedMode = mode;

      if (mode === 'smart') {
        emotionAnalysis = await emotionService.current.analyzeEmotion(message);
        detectedMode = emotionService.current.recommendMode(emotionAnalysis);
        console.log('[useChat] Emotion analysis:', emotionAnalysis);
        console.log('[useChat] Recommended mode:', detectedMode);
      }

      // 3. 构建系统提示词
      const systemPrompt = promptService.current.buildSystemPrompt(
        detectedMode,
        emotionAnalysis,
        userId
      );

      // 4. 构建用户消息（包含上下文和引用）
      const enhancedUserMessage = promptService.current.buildUserMessage(
        message,
        chatHistory,
        emotionAnalysis,
        userId
      );

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

            // 分析并存储回复多样性
            if (accumulatedContent) {
              diversityService.current.analyzeAndStore(accumulatedContent, userId);
            }

            console.log(`[useChat] Streaming completed, total length: ${accumulatedContent.length}`);
          }
        },
        // onMetadata callback
        (metadata: Record<string, unknown>) => {
          if (metadata.emotion_analysis) {
            updateMessage(aiMessage.id, {
              emotionAnalysis: metadata.emotion_analysis as Record<string, unknown>
            });
          }
          console.log('[useChat] Received metadata:', metadata);
        }
      );

      // 确保流式传输已完成
      if (!isComplete) {
        console.warn('[useChat] Stream may not have completed properly');
        updateMessage(aiMessage.id, { isStreaming: false });
        setStreamingMessageId(null);
      }

    } catch (err) {
      console.error('[useChat] Failed to send message:', err);
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

    console.log('[useChat] Chat history cleared');
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