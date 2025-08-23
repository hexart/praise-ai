import type { ChatMessage, ChatMode } from '../types/chat';
import type { EmotionAnalysis } from '../types/emotion';
import { QuoteService } from './QuoteService';
import { ResponseDiversityService } from './ResponseDiversityService';
/**

提示词构建和管理服务
负责根据模式、情感分析和上下文构建完整的提示词
*/
export class PromptService {
  private quoteService: QuoteService;
  private diversityService: ResponseDiversityService;

  constructor() {
    this.quoteService = new QuoteService();
    this.diversityService = new ResponseDiversityService();
  }
  /**
  
  构建完整的系统提示词
  */
  buildSystemPrompt(
    mode: ChatMode,
    emotionAnalysis?: EmotionAnalysis,
    userId?: string
  ): string {
    const basePersonality = "你是一位具有敏锐情感洞察力的AI陪伴者，能够提供真诚、温暖、富有共鸣的情感支持。";

    const modeInstruction = this.getModeInstruction(mode, emotionAnalysis);
    const diversityHints = userId ? this.diversityService.getDiversityInstructions(userId) : '';

    let prompt = `${basePersonality}\n\n${modeInstruction}\n\n重要要求：\n`;
    prompt += "1. 每次回复都要有独特的表达方式，避免模板化\n";
    prompt += "2. 根据用户情感状态调整语言风格\n";
    prompt += "3. 保持自然对话感，不要过度分析\n";
    prompt += "4. 回复长度适中，通常100-300字\n";
    prompt += "5. 使用温暖、口语化的表达\n";

    if (diversityHints) {
      prompt += `\n多样性提示：\n${diversityHints}\n`;
    }

    prompt += "\n请基于以上要求，给出最合适的回应。记住：真诚和共情比技巧更重要。";

    return prompt;
  }
  /**
  
  构建用户消息（包含上下文和引用）
  */
  buildUserMessage(
    originalMessage: string,
    chatHistory: ChatMessage[],
    emotionAnalysis?: EmotionAnalysis,
    userId?: string
  ): string {
    let userMessage = originalMessage;

    // 添加历史上下文
    if (chatHistory.length > 0) {
      const contextInfo = this.formatChatHistory(chatHistory);
      userMessage = `最近对话：\n${contextInfo}\n\n当前用户输入：${originalMessage}`;
    }

    // 添加相关引用（可选）
    if (emotionAnalysis && userId) {
      const quote = this.getRelevantQuote(emotionAnalysis, userId);
      if (quote) {
        userMessage += `\n\n【可选引用，自然融入】：${quote}`;
      }
    }

    return userMessage;
  }

  /**
   * 根据模式获取指令
   */
  private getModeInstruction(mode: ChatMode, emotionAnalysis?: EmotionAnalysis): string {
    const emotionInfo = emotionAnalysis ?
      `\n- 用户当前情感：${emotionAnalysis.primary_emotion}（强度：${emotionAnalysis.intensity.toFixed(1)}）` : '';
    switch (mode) {
      case 'praise':
        return `当前模式：【夸夸模式】${emotionInfo}

回应策略：发现亮点，给予具体肯定，激发信心
语言风格：积极、真诚、有力量
重点：帮助用户看到自己的价值和潜力
避免：空洞的赞美，要聚焦具体的努力或特质`;
      case 'comfort':
        return `当前模式：【安慰模式】${emotionInfo}

回应策略：温柔接纳，不评判，提供情感支持和陪伴
语言风格：温暖、理解、包容
重点：让用户感受到被理解和接纳
避免：说教、建议或急于解决问题`;
      case 'smart':
        return `当前模式：【智能模式】${emotionInfo}

回应策略：先理解接纳，再温和鼓励
语言风格：理解而不失力量，既温暖又积极
重点：平衡共情与激励
智能判断：根据情感状态灵活调整回应方式`;
      default:
        return `当前模式：【默认模式】${emotionInfo}

回应策略：温暖理解，适度鼓励
语言风格：自然、友善、支持性
重点：提供合适的情感支持`;
    }
  }
  /**
  格式化聊天历史为上下文
  */
  private formatChatHistory(chatHistory: ChatMessage[]): string {
    const recentHistory = chatHistory.slice(-6); // 最近6条消息 
    return recentHistory.map(msg => `${msg.role === 'user' ? '用户' : 'AI'}：${msg.content.substring(0, 50)}...`).join('\n');
  }

  /**
  - 获取相关引用
  */
  private getRelevantQuote(emotionAnalysis: EmotionAnalysis, userId: string): string | null {
    const { needs } = emotionAnalysis;

    let quoteType: 'comfort' | 'praise' | 'mixed'; if (needs === '安慰') { quoteType = 'comfort'; } else if (needs === '鼓励') { quoteType = 'praise'; } else { quoteType = 'mixed'; } return this.quoteService.getRelevantQuote(quoteType, userId, 0.25);
  }
  /**
  - 构建调试信息（开发模式使用）
  */
  buildDebugInfo(mode: ChatMode, emotionAnalysis?: EmotionAnalysis, systemPrompt?: string, userMessage?: string): string {
    let debug = `=== 调试信息 ===\n`; debug += `模式：${mode}\n`;

    if (emotionAnalysis) {
      debug += `情感分析：\n`;
      debug += `- 主要情感：${emotionAnalysis.primary_emotion}\n`;
      debug += `- 强度：${emotionAnalysis.intensity.toFixed(2)}\n`;
      debug += `- 需求：${emotionAnalysis.needs}\n`;
      debug += `- 置信度：${emotionAnalysis.confidence.toFixed(2)}\n`;
      debug += `- 关键词：${emotionAnalysis.keywords.join(', ')}\n`;
    }
    if (systemPrompt) { debug += `\n系统提示词：\n${systemPrompt}\n`; }
    if (userMessage) { debug += `\n用户消息：\n${userMessage}\n`; } debug += `================`;
    return debug;
  }
}