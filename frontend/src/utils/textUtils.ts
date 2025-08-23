/**
文本处理工具类
提供各种文本分析和处理功能
*/

/**
提取文本中的关键词
*/
export function extractKeywords(text: string, maxCount: number = 10): string[] {
  // 简单的关键词提取：去除常用词后按频率排序
  const stopWords = new Set([
    '的', '了', '是', '我', '你', '他', '她', '它', '们', '这', '那', '在', '有', '和',
    '与', '或', '但', '而', '就', '都', '也', '还', '又', '再', '不', '没', '很',
    '非常', '特别', '比较', '更', '最', '可以', '能够', '应该', '可能', '会', '要',
    '想', '觉得', '感觉', '认为', '以为', '知道', '明白', '理解', '发现', '看到'
  ]);

  // 分词（简单按标点符号和空格分割）
  const words = text
    .replace(/[^\u4e00-\u9fa5\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 1 && !stopWords.has(word));
  // 统计词频
  const wordCount: Record<string, number> = {};
  words.forEach(word => {
    wordCount[word] = (wordCount[word] || 0) + 1;
  });
  // 按频率排序并返回前N个
  return Object.entries(wordCount)
    .sort(([, a], [, b]) => b - a)
    .slice(0, maxCount)
    .map(([word]) => word);
}

/**
计算两个文本的相似度（基于字符）
*/
export function calculateTextSimilarity(text1: string, text2: string): number {
  if (text1 === text2) return 1;
  if (!text1 || !text2) return 0;

  const longer = text1.length > text2.length ? text1 : text2;
  const shorter = text1.length > text2.length ? text2 : text1;
  if (longer.length === 0) return 1;
  const editDistance = levenshteinDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
}

/**
计算编辑距离（Levenshtein距离）
*/
export function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = [];

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
          matrix[i - 1][j - 1] + 1, // 替换
          matrix[i][j - 1] + 1,     // 插入
          matrix[i - 1][j] + 1      // 删除
        );
      }
    }
  }
  return matrix[str2.length][str1.length];
}

/**
文本截断（保持完整单词）
*/
export function truncateText(text: string, maxLength: number, suffix: string = '...'): string {
  if (text.length <= maxLength) return text;

  const truncated = text.substring(0, maxLength - suffix.length);
  // 尝试在单词边界截断
  const lastSpace = truncated.lastIndexOf(' ');
  const lastPunctuation = Math.max(
    truncated.lastIndexOf('。'),
    truncated.lastIndexOf('，'),
    truncated.lastIndexOf('！'),
    truncated.lastIndexOf('？')
  );
  const cutPoint = Math.max(lastSpace, lastPunctuation);
  if (cutPoint > maxLength * 0.8) {
    return truncated.substring(0, cutPoint) + suffix;
  }
  return truncated + suffix;
}

/**
检测文本语言（简单的中英文检测）
*/
export function detectLanguage(text: string): 'zh' | 'en' | 'mixed' | 'unknown' {
  const chineseCharCount = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
  const englishCharCount = (text.match(/[a-zA-Z]/g) || []).length;
  const totalChars = chineseCharCount + englishCharCount;

  if (totalChars === 0) return 'unknown';
  const chineseRatio = chineseCharCount / totalChars;
  const englishRatio = englishCharCount / totalChars;
  if (chineseRatio > 0.7) return 'zh';
  if (englishRatio > 0.7) return 'en';
  return 'mixed';
}

/**
清理和格式化文本
*/
export function cleanText(text: string): string {
  return text
    .replace(/\s+/g, ' ')           // 多个空格替换为单个空格
    .replace(/\n\s\n/g, '\n')      // 多个换行替换为单个换行
    .trim();                        // 去除首尾空格
}

/**
提取文本摘要（简单版本）
*/
export function extractSummary(text: string, maxSentences: number = 3): string {
  // 按句号分割句子
  const sentences = text
    .split(/[。！？!?]/)
    .map(s => s.trim())
    .filter(s => s.length > 5);

  if (sentences.length <= maxSentences) {
    return sentences.join('。') + '。';
  }
  // 简单的摘要：取前几句和最后一句
  const summary = [];
  const frontCount = Math.ceil(maxSentences / 2);
  const backCount = maxSentences - frontCount;
  summary.push(...sentences.slice(0, frontCount));
  if (backCount > 0) {
    summary.push(...sentences.slice(-backCount));
  }
  return summary.join('。') + '。';
}

/**
高亮文本中的关键词
*/
export function highlightKeywords(text: string, keywords: string[], className: string = 'highlight'): string {
  if (!keywords.length) return text;

  let highlightedText = text;
  keywords.forEach(keyword => {
    const regex = new RegExp(`(${escapeRegExp(keyword)})`, 'gi');
    highlightedText = highlightedText.replace(regex, `<span class="${className}">$1</span>`);
  });
  return highlightedText;
}

/**
转义正则表达式特殊字符
 */
export function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^{}()|[\]\\]/g, '\\&');
}

/**
 * 统计文本基本信息
 */
export function getTextStats(text: string): {
  characters: number;
  charactersNoSpaces: number;
  words: number;
  sentences: number;
  paragraphs: number;
  averageWordsPerSentence: number;
  language: 'zh' | 'en' | 'mixed' | 'unknown';
} {
  const characters = text.length;
  const charactersNoSpaces = text.replace(/\s/g, '').length;// 分词统计（中英文混合）
  const words = text
    .replace(/[^\u4e00-\u9fa5\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 0);// 句子统计
  const sentences = text
    .split(/[。！？!?]/)
    .filter(s => s.trim().length > 0);// 段落统计
  const paragraphs = text
    .split(/\n\s*\n/)
    .filter(p => p.trim().length > 0); const averageWordsPerSentence = sentences.length > 0
      ? Math.round(words.length / sentences.length * 10) / 10
      : 0; const language = detectLanguage(text); return {
        characters,
        charactersNoSpaces,
        words: words.length,
        sentences: sentences.length,
        paragraphs: paragraphs.length,
        averageWordsPerSentence,
        language
      };
}

/**
验证文本是否包含敏感内容（基础版本）
*/
export function containsSensitiveContent(text: string): {
  isSafe: boolean;
  detectedCategories: string[];
  riskLevel: 'low' | 'medium' | 'high';
} {
  const sensitivePatterns = {
    profanity: ['脏话', '骂人', '粗口'], // 这里应该包含实际的敏感词
    violence: ['暴力', '伤害', '攻击'],
    political: ['政治敏感词'], // 实际应用中需要更完整的词库
    illegal: ['违法', '犯罪']
  };
  const detectedCategories: string[] = [];
  let riskScore = 0; Object.entries(sensitivePatterns).forEach(([category, patterns]) => {
    const matches = patterns.filter(pattern => text.includes(pattern));
    if (matches.length > 0) {
      detectedCategories.push(category);
      riskScore += matches.length;
    }
  }); let riskLevel: 'low' | 'medium' | 'high' = 'low';
  if (riskScore >= 3) riskLevel = 'high';
  else if (riskScore >= 1) riskLevel = 'medium'; return {
    isSafe: detectedCategories.length === 0,
    detectedCategories,
    riskLevel
  };
}

/**
格式化文本为适合显示的格式
*/
export function formatForDisplay(text: string, options: {
  maxLength?: number;
  preserveLineBreaks?: boolean;
  highlightKeywords?: string[];
  highlightClassName?: string;
} = {}): string {
  let formatted = text;
  // 清理文本
  formatted = cleanText(formatted);// 保留换行符
  if (options.preserveLineBreaks) {
    formatted = formatted.replace(/\n/g, '<br>');
  }// 截断文本
  if (options.maxLength && formatted.length > options.maxLength) {
    formatted = truncateText(formatted, options.maxLength);
  }// 高亮关键词
  if (options.highlightKeywords && options.highlightKeywords.length > 0) {
    formatted = highlightKeywords(
      formatted,
      options.highlightKeywords,
      options.highlightClassName
    );
  } return formatted;
}

/**
 * 移除文本中的思考标签内容
 * 支持多种格式的思考标签
 * @param text 原始文本
 * @returns 移除思考内容后的文本
 */
export function removeThinkTags(text: string): string {
  if (!text) return '';
  
  // 移除 <think>...</think> 标签及其内容
  let processed = text.replace(/<think>[\s\S]*?<\/think>/gi, '');
  
  // 移除 <thinking>...</thinking> 标签及其内容
  processed = processed.replace(/<thinking>[\s\S]*?<\/thinking>/gi, '');
  
  // 移除 <thought>...</thought> 标签及其内容
  processed = processed.replace(/<thought>[\s\S]*?<\/thought>/gi, '');
  
  // 移除 <reasoning>...</reasoning> 标签（如果模型用这个）
  processed = processed.replace(/<reasoning>[\s\S]*?<\/reasoning>/gi, '');
  
  // 移除 ```thinking...``` 代码块格式
  processed = processed.replace(/```thinking[\s\S]*?```/gi, '');
  
  // 移除可能的 XML 声明或其他元数据
  processed = processed.replace(/<\?xml[\s\S]*?\?>/gi, '');
  
  // 清理多余的空白
  processed = processed.trim();
  
  return processed;
}

/**
 * 提取 JSON 内容
 * 支持多种 JSON 格式，并自动移除思考标签
 * @param text 包含 JSON 的文本
 * @returns 提取的 JSON 字符串，如果没有找到则返回 null
 */
export function extractJSON(text: string): string | null {
  if (!text) return null;
  
  // 先移除思考标签
  const cleanText = removeThinkTags(text);
  
  // 尝试提取 JSON
  // 1. 尝试 ```json 代码块
  let match = cleanText.match(/```json\s*([\s\S]*?)\s*```/i);
  if (match && match[1]) {
    return match[1].trim();
  }
  
  // 2. 尝试 ``` 代码块（没有指定语言）
  match = cleanText.match(/```\s*([\s\S]*?)\s*```/);
  if (match && match[1]) {
    const content = match[1].trim();
    // 检查是否像 JSON
    if (content.startsWith('{') || content.startsWith('[')) {
      return content;
    }
  }
  
  // 3. 尝试直接的 JSON 对象或数组
  match = cleanText.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
  if (match && match[1]) {
    // 验证是否为有效的 JSON 结构
    try {
      JSON.parse(match[1]);
      return match[1];
    } catch {
      // 不是有效的 JSON，继续尝试其他方法
    }
  }
  
  // 4. 如果整个文本就是 JSON
  try {
    JSON.parse(cleanText);
    return cleanText;
  } catch {
    // 不是有效的 JSON
  }
  
  return null;
}