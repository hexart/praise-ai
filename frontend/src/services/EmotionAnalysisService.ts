import type { EmotionAnalysis } from '../types/emotion';
import type { ChatMessage, ChatMode } from '../types/chat';
import type { BaseProvider } from '../providers/BaseProvider';
import {
  STANDARD_EMOTIONS,
  USER_NEEDS,
  ChineseToStandardEmotion,
  ChineseToUserNeed,
  normalizeEmotion,
  getEmotionCategory,
  type StandardEmotionType,
  type UserNeedType
} from '../types/emotion';
import {
  removeThinkTags,
  extractJSON
} from '../utils/textUtils';

interface LLMEmotionResponse {
  primary_emotion: string;
  intensity: number;
  needs: string;
  confidence: number;
  keywords: string[];
  reasoning: string;
}

/**
 * 基于LLM的情感分析服务
 */
export class EmotionAnalysisService {
  private provider: BaseProvider | null = null;

  /**
   * 设置LLM Provider
   */
  setProvider(provider: BaseProvider | null) {
    this.provider = provider;
  }

  /**
   * 使用LLM分析用户输入的情感状态
   */
  async analyzeEmotion(message: string): Promise<EmotionAnalysis> {
    // 如果没有provider，使用fallback分析
    if (!this.provider || !this.provider.getCurrentModel()) {
      return this.getFallbackAnalysis(message);
    }

    try {
      const response = await this.provider.sendMessage({
        message: this.buildEmotionAnalysisPrompt(message),
        mode: 'smart',
        userId: 'emotion_analysis',
        chatHistory: [],
        systemPrompt: '你是一个情感分析API。分析用户文本的情感并返回JSON格式结果。'
      });

      if (response.success && response.data?.content) {
        const analysis = this.parseEmotionResponse(response.data.content);
        console.log('[EmotionAnalysis] Analysis result:', analysis);
        return analysis;
      }
      
      return this.getFallbackAnalysis(message);
      
    } catch (error) {
      console.error('[EmotionAnalysis] Analysis error:', error);
      return this.getFallbackAnalysis(message);
    }
  }

  /**
   * 构建情感分析提示词
   */
  private buildEmotionAnalysisPrompt(message: string): string {
    return `分析文本的情感状态："${message}"

情感类型：happy, excited, grateful, proud, content, calm, sad, anxious, angry, frustrated, lonely, stressed, disappointed, tired, confused, worried, nervous, neutral, mixed, other

需求类型：comfort, praise, guidance, listening, validation, care, mixed

请返回JSON格式：
{
  "primary_emotion": "情感类型",
  "intensity": 0.7,
  "needs": "需求类型",
  "confidence": 0.8,
  "keywords": ["关键词"],
  "reasoning": "分析理由"
}`;
  }

  /**
   * 解析LLM响应
   */
  private parseEmotionResponse(content: string): EmotionAnalysis {
    try {
      // 移除思考标签
      const cleanContent = removeThinkTags(content);
      console.info('LLM Response:', cleanContent);
      
      // 提取JSON
      const jsonString = extractJSON(cleanContent);
      if (!jsonString) {
        throw new Error('No JSON found');
      }
      
      const parsed: LLMEmotionResponse = JSON.parse(jsonString);
      
      return {
        primary_emotion: this.standardizeEmotion(parsed.primary_emotion),
        intensity: Math.max(0, Math.min(1, parsed.intensity || 0.5)),
        needs: this.standardizeNeed(parsed.needs),
        confidence: Math.max(0, Math.min(1, parsed.confidence || 0.5)),
        keywords: Array.isArray(parsed.keywords) ? parsed.keywords.slice(0, 5) : [],
        analysis_source: 'llm_analysis',
        reasoning: parsed.reasoning
      };
      
    } catch (error) {
      console.error('[EmotionAnalysis] Analysis error:', error);
      // 解析失败，使用fallback
      return this.getFallbackAnalysis(content);
    }
  }

  /**
   * 标准化情感类型
   */
  private standardizeEmotion(emotion: string): string {
    if (Object.values(STANDARD_EMOTIONS).includes(emotion as StandardEmotionType)) {
      return emotion;
    }
    if (ChineseToStandardEmotion[emotion]) {
      return ChineseToStandardEmotion[emotion];
    }
    return normalizeEmotion(emotion);
  }

  /**
   * 标准化需求类型
   */
  private standardizeNeed(need: string): string {
    if (Object.values(USER_NEEDS).includes(need as UserNeedType)) {
      return need;
    }
    if (ChineseToUserNeed[need]) {
      return ChineseToUserNeed[need];
    }
    return USER_NEEDS.MIXED;
  }

  /**
   * Fallback分析（基于关键词）
   */
  private getFallbackAnalysis(message: string): EmotionAnalysis {
    // 定义简单的关键词模式
    const patterns = [
      { keywords: ['悬崖', '危险'], emotion: STANDARD_EMOTIONS.ANXIOUS, needs: USER_NEEDS.CARE, intensity: 0.8 },
      { keywords: ['开心', '高兴'], emotion: STANDARD_EMOTIONS.HAPPY, needs: USER_NEEDS.PRAISE, intensity: 0.7 },
      { keywords: ['难过', '伤心'], emotion: STANDARD_EMOTIONS.SAD, needs: USER_NEEDS.COMFORT, intensity: 0.7 },
      { keywords: ['焦虑', '担心'], emotion: STANDARD_EMOTIONS.ANXIOUS, needs: USER_NEEDS.COMFORT, intensity: 0.7 },
      { keywords: ['生气', '愤怒'], emotion: STANDARD_EMOTIONS.ANGRY, needs: USER_NEEDS.LISTENING, intensity: 0.8 },
      { keywords: ['累', '疲惫'], emotion: STANDARD_EMOTIONS.TIRED, needs: USER_NEEDS.COMFORT, intensity: 0.6 },
      { keywords: ['感谢', '谢谢'], emotion: STANDARD_EMOTIONS.GRATEFUL, needs: USER_NEEDS.MIXED, intensity: 0.6 }
    ];

    // 查找匹配
    for (const pattern of patterns) {
      const matched = pattern.keywords.find(kw => message.includes(kw));
      if (matched) {
        return {
          primary_emotion: pattern.emotion,
          intensity: pattern.intensity,
          needs: pattern.needs,
          confidence: 0.5,
          keywords: [matched],
          analysis_source: 'fallback_analysis'
        };
      }
    }

    // 默认返回
    return {
      primary_emotion: STANDARD_EMOTIONS.NEUTRAL,
      intensity: 0.5,
      needs: USER_NEEDS.MIXED,
      confidence: 0.3,
      keywords: [],
      analysis_source: 'fallback_analysis'
    };
  }

  /**
   * 推荐聊天模式
   */
  recommendMode(emotionAnalysis: EmotionAnalysis): ChatMode {
    const { needs, intensity, primary_emotion } = emotionAnalysis;
    
    // 基于需求
    if (needs === USER_NEEDS.COMFORT || needs === 'comfort') return 'comfort';
    if (needs === USER_NEEDS.PRAISE || needs === 'praise') return 'praise';
    if (needs === USER_NEEDS.CARE || needs === 'care') return 'smart';
    
    // 基于情感类别
    const category = getEmotionCategory(normalizeEmotion(primary_emotion));
    if (category === 'negative' && intensity > 0.6) return 'comfort';
    if (category === 'positive' && intensity > 0.5) return 'praise';
    
    return 'smart';
  }

  /**
   * 分析情感趋势（简化版）
   */
  analyzeEmotionTrend(messages: ChatMessage[]): {
    trend: 'improving' | 'declining' | 'stable';
    averageIntensity: number;
    dominantEmotion: string;
  } {
    if (messages.length < 2) {
      return { 
        trend: 'stable', 
        averageIntensity: 0.5, 
        dominantEmotion: STANDARD_EMOTIONS.NEUTRAL 
      };
    }

    // 简单统计最近消息的情感倾向
    const recentMessages = messages.slice(-3).map(msg => msg.content).join(' ');
    let positiveCount = 0;
    let negativeCount = 0;
    
    for (const [chinese, standard] of Object.entries(ChineseToStandardEmotion)) {
      if (recentMessages.includes(chinese)) {
        const category = getEmotionCategory(standard);
        if (category === 'positive') positiveCount++;
        if (category === 'negative') negativeCount++;
      }
    }
    
    const trend = positiveCount > negativeCount ? 'improving' : 
                  negativeCount > positiveCount ? 'declining' : 'stable';
    
    return {
      trend,
      averageIntensity: 0.5,
      dominantEmotion: STANDARD_EMOTIONS.NEUTRAL
    };
  }
}