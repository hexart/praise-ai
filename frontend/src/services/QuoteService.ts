import { getFromStorage, saveToStorage } from '../utils/storage';
import {
  getEmotionCategory,
  normalizeEmotion,
  type StandardEmotionType
} from '../types/emotion';
import type { BaseProvider } from '../providers/BaseProvider';
import type { EmotionAnalysis } from '../types/emotion';
import {
  removeThinkTags,
  extractJSON
} from '../utils/textUtils';
import { createModuleLogger } from '../utils/logger';

interface Quote {
  content: string;
  author?: string;
  category: 'comfort' | 'praise' | 'mixed';
}

interface QuoteUsageHistory {
  quote: string;
  timestamp: number;
  userId: string;
}

interface LLMQuoteResponse {
  quote: string;
  author: string;
  relevance_reasoning: string;
}

/**
引用库管理服务
管理名言警句，提供智能引用选择
*/
export class QuoteService {
  private provider: BaseProvider | null = null;
  private readonly logger = createModuleLogger('QuoteService');
  private readonly quotes: Quote[] = [
    // 安慰类引用
    {
      content: "海明威说：'我们必须习惯，站在人生的交叉路口，却没有红绿灯。'",
      category: 'comfort'
    },
    {
      content: "村上春树说：'暴风雨结束后，你不会记得自己是怎样活下来的，但有一点是确定的，当你穿越了暴风雨，你就不再是原来那个人。'",
      category: 'comfort'
    },
    {
      content: "余华在《活着》中写道：'人是为了活着本身而活着，而不是为了活着之外的任何事物而活着。'",
      category: 'comfort'
    },
    {
      content: "三毛说过：'今日的事情，尽心、尽意、尽力去做了，无论成绩如何，都应该高高兴兴地上床恬睡。'",
      category: 'comfort'
    },
    {
      content: "罗曼·罗兰说：'世界上只有一种真正的英雄主义，那就是认清生活的真相后依然热爱生活。'",
      category: 'comfort'
    },
    {
      content: "有人说：'当你感到悲哀痛苦时，最好是去学些什么东西。学习会使你永远立于不败之地。'",
      category: 'comfort'
    },
    {
      content: "龙应台说：'有些路，只能一个人走。'",
      category: 'comfort'
    },
    {
      content: "林清玄说：'在穿过林间的时候，我觉得麻雀的死亡给我一些启示，我们虽然在尘网中生活，但永远不要失去想飞的心，不要忘记飞翔的姿态。'",
      category: 'comfort'
    },
    // 鼓励类引用
    {
      content: "乔布斯说：'你的时间有限，不要浪费在重复别人的生活上。'",
      category: 'praise'
    },
    {
      content: "查理·芒格说：'要得到你想要的某样东西，最可靠的办法是让你自己配得上它。'",
      category: 'praise'
    },
    {
      content: "马云曾说：'今天很残酷，明天更残酷，后天很美好，但绝大多数人死在明天晚上。'",
      category: 'praise'
    },
    {
      content: "李嘉诚说过：'鸡蛋，从外打破是食物，从内打破是生命。'",
      category: 'praise'
    },
    {
      content: "王阳明说：'志不立，天下无可成之事。'",
      category: 'praise'
    },
    {
      content: "稻盛和夫说：'不要有感性的烦恼，要做持理性的思考和行动。'",
      category: 'praise'
    },
    {
      content: "有人说过：'成功就是从失败到失败，却不失去热情。'",
      category: 'praise'
    },
    {
      content: "尼采说：'每一个不曾起舞的日子，都是对生命的辜负。'",
      category: 'praise'
    },
    // 混合类引用
    {
      content: "泰戈尔说：'你今天受的苦，吃的亏，担的责，扛的罪，忍的痛，到最后都会变成光，照亮你的路。'",
      category: 'mixed'
    },
    {
      content: "周国平说过：'人生最好的境界是丰富的安静。'",
      category: 'mixed'
    },
    {
      content: "木心说：'岁月不饶人，我亦未曾饶过岁月。'",
      category: 'mixed'
    },
    {
      content: "史铁生说：'这世界不止眼前的苟且，还有诗和远方。'",
      category: 'mixed'
    },
    {
      content: "林语堂说：'人生在世，还不是有时笑笑人家，有时给人家笑笑。'",
      category: 'mixed'
    },
    {
      content: "三毛说：'心若没有栖息的地方，到哪里都是流浪。'",
      category: 'mixed'
    },
    {
      content: "王尔德说：'生活是一出没有人彩排过的戏剧。'",
      category: 'mixed'
    },
    {
      content: "纪伯伦说：'当你向着光走去时，你不会看到自己的影子。'",
      category: 'mixed'
    }
  ];

  /**
   * 设置LLM Provider
   */
  setProvider(provider: BaseProvider | null) {
    this.provider = provider;
  }

  /**
   * 根据情感和上下文智能获取引用
   */
  async getIntelligentQuote(
    emotionAnalysis: EmotionAnalysis,
    userMessage: string,
    chatContext: string,
    userId: string,
    probability: number = 0.25
  ): Promise<string | null> {
    // 按概率决定是否返回引用
    if (Math.random() > probability) {
      return null;
    }

    // 优先使用大模型生成引用
    if (this.provider && this.provider.getCurrentModel()) {
      try {
        const aiQuote = await this.generateQuoteWithLLM(
          emotionAnalysis,
          userMessage,
          chatContext,
          userId
        );
        
        if (aiQuote) {
          this.logger.info('AI引用生成成功', { 
            quoteLength: aiQuote.length,
            emotion: emotionAnalysis.primary_emotion
          });
          this.markAsUsed(aiQuote, userId);
          return aiQuote;
        }
      } catch (error) {
        this.logger.warn('AI引用生成失败，使用fallback', { 
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }

    // Fallback到硬编码引用库
    return this.getFallbackQuote(emotionAnalysis.primary_emotion, userId);
  }

  /**
   * 使用大模型生成贴合情景的引用
   */
  private async generateQuoteWithLLM(
    emotionAnalysis: EmotionAnalysis,
    userMessage: string,
    chatContext: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _userId: string
  ): Promise<string | null> {
    const prompt = this.buildQuoteGenerationPrompt(
      emotionAnalysis,
      userMessage,
      chatContext
    );
    const systemPrompt = '你是一个智能引用推荐专家。根据用户情感和对话情景，选择最贴合的名言警句。';

    try {
      // 记录完整的提示词
      this.logger.info('🔥 [LLM交互3] 引用生成 - 发送提示词', {
        systemPrompt,
        userPrompt: prompt,
        emotionContext: {
          emotion: emotionAnalysis.primary_emotion,
          intensity: emotionAnalysis.intensity,
          needs: emotionAnalysis.needs
        },
        userMessage: userMessage.substring(0, 100),
        contextLength: chatContext.length
      });

      const response = await this.provider!.sendMessage({
        message: prompt,
        mode: 'smart',
        userId: 'quote_generation',
        chatHistory: [],
        systemPrompt
      });

      if (response.success && response.data?.content) {
        // 记录完整的LLM响应
        this.logger.info('🔥 [LLM交互3] 引用生成 - 接收响应', {
          fullResponse: response.data.content,
          responseLength: response.data.content.length,
          model: response.data.model || '未知模型'
        });
        
        const quote = this.parseQuoteResponse(response.data.content);
        if (quote) {
          this.logger.info('AI引用生成成功', { quote: quote.substring(0, 100) });
        } else {
          this.logger.warn('AI引用生成失败，使用fallback');
        }
        return quote;
      }
      
      return null;
      
    } catch (error) {
      this.logger.error('引用生成错误', { error: error instanceof Error ? error.message : String(error) });
      return null;
    }
  }

  /**
   * 构建引用生成提示词
   */
  private buildQuoteGenerationPrompt(
    emotionAnalysis: EmotionAnalysis,
    userMessage: string,
    chatContext: string
  ): string {
    const emotionDesc = this.getEmotionDescription(emotionAnalysis);
    const categoryDesc = this.getCategoryDescription(emotionAnalysis.primary_emotion);
    
    return `请为以下情况推荐一句最贴合的名言警句：

用户消息："${userMessage}"
对话背景：${chatContext || '无特殊背景'}
用户情感：${emotionDesc}
需要的支持类型：${categoryDesc}

要求：
1. 选择真实存在的名言警句（来自知名作家、哲学家、名人等）
2. 引用要与用户当前的情感状态和情景高度贴合
3. 语言要温暖、有启发性，能够提供情感支持
4. 优先选择中文名言或中文翻译的经典引用
5. 避免过于说教或空洞的话语

请返回JSON格式：
{
  "quote": "完整的引用内容",
  "author": "作者姓名",
  "relevance_reasoning": "为什么这句话适合当前情景的简短说明"
}`;
  }

  /**
   * 获取情感描述
   */
  private getEmotionDescription(emotionAnalysis: EmotionAnalysis): string {
    const intensity = emotionAnalysis.intensity;
    let intensityDesc = '';
    if (intensity > 0.8) intensityDesc = '非常强烈';
    else if (intensity > 0.6) intensityDesc = '比较明显';
    else if (intensity > 0.4) intensityDesc = '中等程度';
    else intensityDesc = '轻微';

    return `${emotionAnalysis.primary_emotion}（${intensityDesc}）`;
  }

  /**
   * 获取类别描述
   */
  private getCategoryDescription(emotion: string): string {
    const category = getEmotionCategory(normalizeEmotion(emotion));
    
    switch (category) {
      case 'negative':
        return '需要安慰和支持，帮助走出低谷';
      case 'positive':
        return '分享喜悦，延续美好感受';
      case 'neutral':
      default:
        return '提供智慧启发，引导思考';
    }
  }

  /**
   * 解析LLM响应中的引用
   */
  private parseQuoteResponse(content: string): string | null {
    try {
      // 移除思考标签
      const cleanContent = removeThinkTags(content);
      
      // 提取JSON
      const jsonString = extractJSON(cleanContent);
      if (!jsonString) {
        throw new Error('No JSON found');
      }
      
      const parsed: LLMQuoteResponse = JSON.parse(jsonString);
      
      if (parsed.quote && parsed.author) {
        return `${parsed.author}说："${parsed.quote}"`;
      }
      
      return null;
      
    } catch (error) {
      this.logger.error('解析引用响应失败', { error: error instanceof Error ? error.message : String(error) });
      return null;
    }
  }

  /**
   * Fallback到硬编码引用库
   */
  private getFallbackQuote(
    emotionTypeOrCategory: StandardEmotionType | 'comfort' | 'praise' | 'mixed' | string,
    userId: string
  ): string | null {
    // 确定引用类别
    let quoteCategory: 'comfort' | 'praise' | 'mixed';

    // 如果直接传入了类别
    if (emotionTypeOrCategory === 'comfort' ||
      emotionTypeOrCategory === 'praise' ||
      emotionTypeOrCategory === 'mixed') {
      quoteCategory = emotionTypeOrCategory;
    } else {
      // 根据情感类型决定类别
      quoteCategory = this.determineQuoteCategory(emotionTypeOrCategory);
    }
    
    const usageHistory = this.getUsageHistory(userId);
    
    let quotePool: Quote[] = [];
    if (quoteCategory === 'mixed') {
      quotePool = [...this.quotes];
    } else {
      quotePool = this.quotes.filter(quote => quote.category === quoteCategory);
    }

    // 过滤已使用的引用
    const availableQuotes = quotePool.filter(quote =>
      !this.isRecentlyUsed(quote.content, usageHistory)
    );

    // 如果没有可用的引用，重置历史记录
    if (availableQuotes.length === 0) {
      this.resetUsageHistory(userId);
      return this.selectRandomQuote(quotePool);
    }

    const selectedQuote = this.selectRandomQuote(availableQuotes);
    if (selectedQuote) {
      this.markAsUsed(selectedQuote, userId);
      return selectedQuote;
    }

    return null;
  }

  private readonly storageKey = 'quote_usage_history';

  /**
   * 原有的引用获取方法（兼容性接口）
   */
  getRelevantQuote(
    emotionTypeOrCategory: StandardEmotionType | 'comfort' | 'praise' | 'mixed' | string,
    userId: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _probability: number = 0.25
  ): string | null {
    return this.getFallbackQuote(emotionTypeOrCategory, userId);
  }

  // ... existing code ...

  /**
   * 根据情感类型决定引用类别
   */
  private determineQuoteCategory(emotion: string): 'comfort' | 'praise' | 'mixed' {
    // 标准化情感
    const standardEmotion = normalizeEmotion(emotion);

    // 根据情感类别决定引用类型
    const category = getEmotionCategory(standardEmotion);

    switch (category) {
      case 'negative':
        return 'comfort';  // 消极情感需要安慰
      case 'positive':
        return 'praise';   // 积极情感给予夸奖
      case 'neutral':
      default:
        return 'mixed';    // 中性或复杂情感使用混合
    }
  }

  /**
  根据关键词搜索相关引用
  */
  searchQuotes(keywords: string[], category?: 'comfort' | 'praise' | 'mixed'): Quote[] {
    let searchPool = this.quotes;

    if (category) {
      searchPool = this.quotes.filter(quote => quote.category === category);
    }

    return searchPool.filter(quote => {
      const content = quote.content.toLowerCase();
      return keywords.some(keyword => content.includes(keyword.toLowerCase()));
    });
  }

  /**
  获取所有引用（按类别分组）
  */
  getAllQuotes(): Record<'comfort' | 'praise' | 'mixed', Quote[]> {
    return {
      comfort: this.quotes.filter(q => q.category === 'comfort'),
      praise: this.quotes.filter(q => q.category === 'praise'),
      mixed: this.quotes.filter(q => q.category === 'mixed')
    };
  }

  /**
  获取用户的引用使用统计
  */
  getUsageStats(userId: string): {
    totalUsed: number;
    categoryStats: Record<string, number>;
    recentUsage: QuoteUsageHistory[];
  } {
    const history = this.getUsageHistory(userId);
    const categoryStats: Record<string, number> = { comfort: 0, praise: 0, mixed: 0 };

    // 统计各类别使用次数
    history.forEach(usage => {
      const quote = this.quotes.find(q => q.content.includes(usage.quote.substring(0, 50)));
      if (quote) {
        categoryStats[quote.category]++;
      }
    });

    return {
      totalUsed: history.length,
      categoryStats,
      recentUsage: history.slice(-10) // 最近10次使用
    };
  }

  /**
  清除用户的使用历史
  */
  clearUsageHistory(userId: string): void {
    const allHistory = getFromStorage<QuoteUsageHistory[]>(this.storageKey, []);
    const filteredHistory = allHistory.filter(item => item.userId !== userId);
    saveToStorage(this.storageKey, filteredHistory);
  }

  /**
  获取用户的引用使用历史
  */
  private getUsageHistory(userId: string): QuoteUsageHistory[] {
    const allHistory = getFromStorage<QuoteUsageHistory[]>(this.storageKey, []);
    return allHistory.filter(item => item.userId === userId);
  }

  /**
  检查引用是否最近被使用过
  */
  private isRecentlyUsed(quoteContent: string, history: QuoteUsageHistory[]): boolean {
    const recentHistory = history.slice(-20); // 检查最近20次使用
    const quoteKey = quoteContent.substring(0, 50); // 使用前50字符作为标识

    return recentHistory.some(item => item.quote === quoteKey);
  }

  /**
  随机选择引用
  */
  private selectRandomQuote(quotes: Quote[]): string | null {
    if (quotes.length === 0) return null;

    const randomIndex = Math.floor(Math.random() * quotes.length);
    return quotes[randomIndex].content;
  }

  /**
  标记引用为已使用
  */
  private markAsUsed(quoteContent: string, userId: string): void {
    const allHistory = getFromStorage<QuoteUsageHistory[]>(this.storageKey, []);
    const quoteKey = quoteContent.substring(0, 50);

    const newUsage: QuoteUsageHistory = {
      quote: quoteKey,
      timestamp: Date.now(),
      userId
    };

    allHistory.push(newUsage);

    // 限制总历史记录数量
    if (allHistory.length > 1000) {
      allHistory.splice(0, allHistory.length - 1000);
    }

    saveToStorage(this.storageKey, allHistory);
  }

  /**
  
  重置用户的使用历史
  */
  private resetUsageHistory(userId: string): void {
    this.clearUsageHistory(userId);
  }
}