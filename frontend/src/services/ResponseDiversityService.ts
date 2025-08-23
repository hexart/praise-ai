import { getFromStorage, saveToStorage } from '../utils/storage';

interface ResponsePattern {
  opening: string;
  hasQuestion: boolean;
  hasExclamation: boolean;
  commonWords: string[];
  sentenceCount: number;
  length: number;
}
interface StoredResponse {
  content: string;
  timestamp: number;
  patterns: ResponsePattern;
  userId: string;
}

/**
响应多样性管理服务
跟踪AI回复模式，避免重复表达，提升回复质量
*/
export class ResponseDiversityService {
  private readonly storageKey = 'response_diversity_cache';
  private readonly maxCacheSize = 1000;
  private readonly userCacheLimit = 15;

  /**
  分析并存储AI回复
  */
  analyzeAndStore(response: string, userId: string): void {
    const patterns = this.extractPatterns(response);
    const storedResponse: StoredResponse = {
      content: response.substring(0, 200), // 只存储前200字符
      timestamp: Date.now(),
      patterns,
      userId
    };

    this.storeResponse(storedResponse);
  }

  /**
  检查回复相似度
  */
  checkSimilarity(newResponse: string, userId: string): number {
    const userResponses = this.getUserResponses(userId);
    if (userResponses.length === 0) return 0;

    const newPatterns = this.extractPatterns(newResponse);
    let maxSimilarity = 0;

    // 只检查最近5条回复
    const recentResponses = userResponses.slice(-5);

    for (const stored of recentResponses) {
      const similarity = this.calculateSimilarity(newPatterns, stored.patterns);
      maxSimilarity = Math.max(maxSimilarity, similarity);
    }

    return maxSimilarity;
  }

  /**
  获取多样性提示指令
  */
  getDiversityInstructions(userId: string): string {
    const userResponses = this.getUserResponses(userId);
    if (userResponses.length < 2) return '';

    const recent = userResponses.slice(-3);
    const usedOpenings = recent.map(r => r.patterns.opening).filter(o => o);
    const usedWords = recent.flatMap(r => r.patterns.commonWords);

    let instructions = '';

    if (usedOpenings.length > 0) {
      instructions += `- 避免使用这些开头：${usedOpenings.join('、')}\n`;
    }

    if (usedWords.length > 0) {
      const uniqueWords = [...new Set(usedWords)];
      instructions += `- 少用这些词汇：${uniqueWords.join('、')}\n`;
    }

    instructions += '- 尝试使用不同的句式结构和表达方式';

    return instructions;
  }

  /**
  计算用户的多样性分数
  */
  calculateDiversityScore(userId: string): number {
    const userResponses = this.getUserResponses(userId);
    if (userResponses.length < 2) return 1.0;

    // 基于开头模式的多样性
    const openings = userResponses.map(r => r.patterns.opening).filter(o => o);
    const uniqueOpenings = new Set(openings);
    const openingDiversity = openings.length > 0 ? uniqueOpenings.size / openings.length : 1;

    // 基于常用词的多样性
    const allWords = userResponses.flatMap(r => r.patterns.commonWords);
    const uniqueWords = new Set(allWords);
    const wordDiversity = allWords.length > 0 ? uniqueWords.size / allWords.length : 1;

    // 基于句子结构的多样性
    const questionRatio = userResponses.filter(r => r.patterns.hasQuestion).length / userResponses.length;
    const exclamationRatio = userResponses.filter(r => r.patterns.hasExclamation).length / userResponses.length;
    const structureDiversity = 1 - Math.abs(0.3 - questionRatio) - Math.abs(0.2 - exclamationRatio);

    // 综合评分
    const finalScore = (openingDiversity * 0.4 + wordDiversity * 0.3 + structureDiversity * 0.3);
    return Math.max(0, Math.min(1, finalScore));
  }

  /**
  获取用户统计信息
  */
  getUserStats(userId: string): {
    responseCount: number;
    diversityScore: number;
    averageLength: number;
    recentPatterns: string[];
  } {
    const userResponses = this.getUserResponses(userId);

    return {
      responseCount: userResponses.length,
      diversityScore: this.calculateDiversityScore(userId),
      averageLength: userResponses.length > 0
        ? userResponses.reduce((sum, r) => sum + r.patterns.length, 0) / userResponses.length
        : 0,
      recentPatterns: userResponses.slice(-5).map(r => r.patterns.opening).filter(o => o)
    };
  }

  /**
  清除用户数据
  */
  clearUserData(userId: string): void {
    const allData = getFromStorage<StoredResponse[]>(this.storageKey, []);
    const filteredData = allData.filter(item => item.userId !== userId);
    saveToStorage(this.storageKey, filteredData);
  }

  /**
  提取回复模式特征
  */
  private extractPatterns(text: string): ResponsePattern {
    const sentences = text.split(/[。！？!?]/).filter(s => s.trim());
    const firstSentence = sentences[0]?.trim() || '';

    return {
      opening: firstSentence.substring(0, 20),
      hasQuestion: /[？?]/.test(text),
      hasExclamation: /[！!]/.test(text),
      commonWords: this.extractCommonWords(text),
      sentenceCount: sentences.length,
      length: text.length
    };
  }

  /**
  提取常用词汇
  */
  private extractCommonWords(text: string): string[] {
    const commonWords = [
      '真的', '其实', '确实', '或许', '也许', '一定', '肯定', '可能',
      '感觉', '觉得', '听起来', '看起来', '似乎', '好像', '特别',
      '非常', '很', '太', '超', '特别', '相当', '挺', '还',
      '就是', '这样', '那样', '这种', '那种', '这个', '那个'
    ];

    return commonWords.filter(word => text.includes(word));
  }

  /**
  计算两个模式的相似度
  */
  private calculateSimilarity(pattern1: ResponsePattern, pattern2: ResponsePattern): number {
    // 开头相似度
    const openingSimilarity = pattern1.opening && pattern2.opening
      ? this.stringSimilarity(pattern1.opening, pattern2.opening)
      : 0;

    // 常用词相似度
    const commonWords1 = new Set(pattern1.commonWords);
    const commonWords2 = new Set(pattern2.commonWords);
    const wordIntersection = new Set([...commonWords1].filter(x => commonWords2.has(x)));
    const wordSimilarity = commonWords1.size > 0 || commonWords2.size > 0
      ? wordIntersection.size / Math.max(commonWords1.size, commonWords2.size)
      : 0;

    // 结构相似度
    const structureSimilarity = (
      (pattern1.hasQuestion === pattern2.hasQuestion ? 0.5 : 0) +
      (pattern1.hasExclamation === pattern2.hasExclamation ? 0.5 : 0)
    );

    // 综合相似度
    return (openingSimilarity * 0.5 + wordSimilarity * 0.3 + structureSimilarity * 0.2);
  }

  /**
  字符串相似度计算
  */
  private stringSimilarity(str1: string, str2: string): number {
    if (str1 === str2) return 1;

    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;

    if (longer.length === 0) return 1;

    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  /**
  计算编辑距离
  */
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = [];

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
  }

  /**
  获取用户的回复记录
  */
  private getUserResponses(userId: string): StoredResponse[] {
    const allData = getFromStorage<StoredResponse[]>(this.storageKey, []);
    return allData.filter(item => item.userId === userId);
  }

  /**
  存储回复记录
  */
  private storeResponse(response: StoredResponse): void {
    const allData = getFromStorage<StoredResponse[]>(this.storageKey, []);

    // 添加新记录
    allData.push(response);

    // 按用户限制缓存大小
    const userResponses = allData.filter(item => item.userId === response.userId);
    if (userResponses.length > this.userCacheLimit) {
      // 移除该用户最旧的记录
      const oldestIndex = allData.findIndex(item =>
        item.userId === response.userId &&
        item.timestamp === Math.min(...userResponses.map(r => r.timestamp))
      );
      if (oldestIndex !== -1) {
        allData.splice(oldestIndex, 1);
      }
    }

    // 限制总缓存大小
    if (allData.length > this.maxCacheSize) {
      allData.splice(0, allData.length - this.maxCacheSize);
    }

    saveToStorage(this.storageKey, allData);
  }
}