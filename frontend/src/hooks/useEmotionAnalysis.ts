import { useState, useCallback, useRef, useMemo } from 'react';
import type { ChatMessage, ChatMode } from '../types/chat';
import type { 
  EmotionAnalysis
} from '../types/emotion';
import { 
  normalizeEmotion,
  getIntensityLabel,
  STANDARD_EMOTIONS,
  USER_NEEDS
} from '../types/emotion';
import { EmotionAnalysisService } from '../services/EmotionAnalysisService';

interface UseEmotionAnalysisOptions {
  userId: string;
  autoAnalyze?: boolean;
  historyLimit?: number;
}

interface UseEmotionAnalysisReturn {
  // 分析结果
  currentAnalysis: EmotionAnalysis | null;
  analysisHistory: Array<{
    message: string;
    analysis: EmotionAnalysis;
    timestamp: number;
  }>;
  
  // 分析操作
  analyzeMessage: (message: string) => Promise<EmotionAnalysis>;
  recommendMode: (analysis?: EmotionAnalysis) => ChatMode;
  
  // 趋势分析
  emotionTrend: {
    trend: 'improving' | 'declining' | 'stable';
    averageIntensity: number;
    dominantEmotion: string;
  } | null;
  
  // 统计信息
  stats: {
    totalAnalyses: number;
    emotionDistribution: Record<string, number>;
    averageConfidence: number;
    modeRecommendations: Record<ChatMode, number>;
  };
  
  // 工具方法
  clearHistory: () => void;
  analyzeEmotionTrend: (messages: ChatMessage[]) => void;
  
  // 扩展方法
  batchAnalyzeHistory: (messages: ChatMessage[]) => void;
  getEmotionKeywords: (emotionType?: string) => string[];
  getIntensityDescription: (intensity?: number) => string;
  getEmotionService: () => EmotionAnalysisService;
}

/**
 * 情感分析Hook
 * 提供情感分析、模式推荐、趋势分析等功能
 */
export function useEmotionAnalysis({
  userId,
  autoAnalyze = true,
  historyLimit = 50
}: UseEmotionAnalysisOptions): UseEmotionAnalysisReturn {
  // 状态管理
  const [currentAnalysis, setCurrentAnalysis] = useState<EmotionAnalysis | null>(null);
  const [analysisHistory, setAnalysisHistory] = useState<Array<{
    message: string;
    analysis: EmotionAnalysis;
    timestamp: number;
  }>>([]);
  const [emotionTrend, setEmotionTrend] = useState<{
    trend: 'improving' | 'declining' | 'stable';
    averageIntensity: number;
    dominantEmotion: string;
  } | null>(null);

  // 服务实例
  const emotionService = useRef(new EmotionAnalysisService());

  // 分析消息情感
  const analyzeMessage = useCallback(async (message: string): Promise<EmotionAnalysis> => {
    try {
      const analysis = await emotionService.current.analyzeEmotion(message);

      console.log('[DEBUG] 分析结果:', {
        输入消息: message,
        主要情感: analysis.primary_emotion,
        强度: analysis.intensity,
        需求: analysis.needs,
        置信度: analysis.confidence,
        关键词: analysis.keywords,
        分析源: analysis.analysis_source,
        推理: analysis.reasoning
      });

      // 更新当前分析结果
      setCurrentAnalysis(analysis);

      // 添加到历史记录
      if (autoAnalyze) {
        setAnalysisHistory(prev => {
          const newHistory = [
            ...prev,
            {
              message: message.substring(0, 100),
              analysis,
              timestamp: Date.now()
            }
          ];

          return newHistory.slice(-historyLimit);
        });
      }

      console.log(`[useEmotionAnalysis] Analyzed message for user ${userId}:`, analysis);
      return analysis;

    } catch (error) {
      console.error('[useEmotionAnalysis] Failed to analyze emotion:', error);

      const defaultAnalysis: EmotionAnalysis = {
        primary_emotion: STANDARD_EMOTIONS.OTHER,  // 使用标准情感常量
        intensity: 0.5,
        needs: USER_NEEDS.MIXED,  // 使用需求常量
        confidence: 0.3,
        keywords: [],
        analysis_source: 'error_fallback'
      };

      setCurrentAnalysis(defaultAnalysis);
      return defaultAnalysis;
    }
  }, [userId, autoAnalyze, historyLimit]);

  // 推荐聊天模式
  const recommendMode = useCallback((analysis?: EmotionAnalysis): ChatMode => {
    const targetAnalysis = analysis || currentAnalysis;
    if (!targetAnalysis) {
      return 'smart'; // 默认智能模式
    }

    return emotionService.current.recommendMode(targetAnalysis);
  }, [currentAnalysis]);

  // 分析情感趋势
  const analyzeEmotionTrend = useCallback((messages: ChatMessage[]) => {
    try {
      const userMessages = messages.filter(msg => msg.role === 'user');
      if (userMessages.length < 2) {
        setEmotionTrend(null);
        return;
      }

      const trend = emotionService.current.analyzeEmotionTrend(userMessages);
      setEmotionTrend(trend);

      console.log(`[useEmotionAnalysis] Emotion trend for user ${userId}:`, trend);

    } catch (error) {
      console.error('[useEmotionAnalysis] Failed to analyze emotion trend:', error);
      setEmotionTrend(null);
    }
  }, [userId]);

  // 清空分析历史
  const clearHistory = useCallback(() => {
    setAnalysisHistory([]);
    setCurrentAnalysis(null);
    setEmotionTrend(null);
    console.log(`[useEmotionAnalysis] Cleared analysis history for user ${userId}`);
  }, [userId]);

  // 计算统计信息
  const stats = useMemo(() => {
    const totalAnalyses = analysisHistory.length;
    if (totalAnalyses === 0) {
      return {
        totalAnalyses: 0,
        emotionDistribution: {},
        averageConfidence: 0,
        modeRecommendations: { praise: 0, comfort: 0, smart: 0 } as Record<ChatMode, number>
      };
    }

    // 情感分布统计（使用标准化的情感）
    const emotionDistribution: Record<string, number> = {};
    let totalConfidence = 0;
    const modeRecommendations: Record<ChatMode, number> = { praise: 0, comfort: 0, smart: 0 };

    analysisHistory.forEach(({ analysis }) => {
      // 统计情感类型（标准化后统计）
      const standardEmotion = normalizeEmotion(analysis.primary_emotion);
      emotionDistribution[standardEmotion] = (emotionDistribution[standardEmotion] || 0) + 1;

      // 累计置信度
      totalConfidence += analysis.confidence;

      // 统计模式推荐
      const recommendedMode = emotionService.current.recommendMode(analysis);
      modeRecommendations[recommendedMode]++;
    });

    // 计算平均置信度
    const averageConfidence = totalConfidence / totalAnalyses;

    return {
      totalAnalyses,
      emotionDistribution,
      averageConfidence,
      modeRecommendations
    };
  }, [analysisHistory]);

  // 批量分析历史消息
  const batchAnalyzeHistory = useCallback(async (messages: ChatMessage[]) => {
    const userMessages = messages.filter(msg => msg.role === 'user');

    // 并行处理所有分析
    const analyses = await Promise.all(
      userMessages.slice(-historyLimit).map(async msg => ({
        message: msg.content.substring(0, 100),
        analysis: await emotionService.current.analyzeEmotion(msg.content),
        timestamp: msg.timestamp
      }))
    );

    setAnalysisHistory(analyses);

    if (analyses.length > 0) {
      setCurrentAnalysis(analyses[analyses.length - 1].analysis);
    }

    analyzeEmotionTrend(messages);

    console.log(`[useEmotionAnalysis] Batch analyzed ${analyses.length} messages`);
  }, [historyLimit, analyzeEmotionTrend]);

  // 获取情感关键词建议
  const getEmotionKeywords = useCallback((): string[] => {
    if (!currentAnalysis) return [];
    return currentAnalysis.keywords || [];
  }, [currentAnalysis]);

  // 获取情感强度描述（使用新的工具函数）
  const getIntensityDescription = useCallback((intensity?: number): string => {
    const targetIntensity = intensity || currentAnalysis?.intensity || 0;
    return getIntensityLabel(targetIntensity);  // 使用 emotion.ts 中的工具函数
  }, [currentAnalysis]);

  return {
    // 分析结果
    currentAnalysis,
    analysisHistory,
    
    // 分析操作
    analyzeMessage,
    recommendMode,
    
    // 趋势分析
    emotionTrend,
    
    // 统计信息
    stats,
    
    // 工具方法
    clearHistory,
    analyzeEmotionTrend,
    
    // 扩展方法
    batchAnalyzeHistory,
    getEmotionKeywords,
    getIntensityDescription,
    getEmotionService: useCallback(() => emotionService.current, [])
  };
}