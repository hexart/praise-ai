import { getFromStorage, saveToStorage } from '../utils/storage';
import {
  getEmotionCategory,
  normalizeEmotion,
  type StandardEmotionType
} from '../types/emotion';

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

/**
引用库管理服务
管理名言警句，提供智能引用选择
*/
export class QuoteService {
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

  private readonly storageKey = 'quote_usage_history';

  /**
  根据情感类型获取合适的引用
  */
  getRelevantQuote(
    emotionTypeOrCategory: StandardEmotionType | 'comfort' | 'praise' | 'mixed' | string,
    userId: string,
    probability: number = 0.25
  ): string | null {
    // 按概率决定是否返回引用
    if (Math.random() > probability) {
      return null;
    }

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

    // 根据情感类型选择引用池
    if (quoteCategory === 'mixed') {
      quotePool = [...this.quotes]; // 混合模式可以使用所有引用
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

    // 选择随机引用
    const selectedQuote = this.selectRandomQuote(availableQuotes);
    if (selectedQuote) {
      this.markAsUsed(selectedQuote, userId);
      return selectedQuote;
    }

    return null;
  }

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