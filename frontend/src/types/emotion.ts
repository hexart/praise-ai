/**
 * emotion.ts - 渐进式升级版本
 */

// ===== 保留原有的类型定义 =====
/**
 * 情感分析结果 (保持向后兼容)
 */
export interface EmotionAnalysis {
  /* 主要情感类型 */
  primary_emotion: string;
  /** 情感强度 (0-1) */
  intensity: number;
  /** 用户需求类型 */
  needs: string;
  /** 分析置信度 (0-1) */
  confidence: number;
  /** 关键词列表 */
  keywords: string[];
  /** 分析来源 */
  analysis_source?: string;
  reasoning?: string;
}

/**
情感类型枚举
*/
export type EmotionType =
  | '焦虑' | '沮丧' | '愤怒' | '悲伤' | '孤独' | '压力'
  | '开心' | '兴奋' | '满足' | '感激' | '自豪' | '平静'
  | '困惑' | '担心' | '紧张' | '疲惫' | '失望' | '其他';

/**
情感分析详细结果
*/
export interface EmotionResult {
  analysis: EmotionAnalysis;
  recommended_mode: string;
  confidence_breakdown: {
    keyword_confidence: number;
    context_confidence: number;
    overall_confidence: number;
  };
  detected_keywords: Array<{
    word: string;
    emotion: string;
    weight: number;
  }>;
}

/**
情感趋势分析
*/
export interface EmotionTrend {
  trend: 'improving' | 'declining' | 'stable';
  averageIntensity: number;
  dominantEmotion: string;
  timespan: number;
  dataPoints: Array<{
    timestamp: number;
    emotion: string;
    intensity: number;
  }>;
}


// ===== 新增的增强类型 (使用 const assertion 替代 enum) =====
/**
 * emotion.ts - 完整的类型定义文件
 */

// ... 保留原有的 EmotionAnalysis 等接口定义 ...

/**
 * 标准化的情感类型常量
 */
export const STANDARD_EMOTIONS = {
  // 积极情感
  HAPPY: 'happy',
  EXCITED: 'excited',
  GRATEFUL: 'grateful',
  PROUD: 'proud',
  CONTENT: 'content',
  CALM: 'calm',
  
  // 消极情感
  ANXIOUS: 'anxious',
  SAD: 'sad',
  ANGRY: 'angry',
  FRUSTRATED: 'frustrated',
  LONELY: 'lonely',
  STRESSED: 'stressed',
  DISAPPOINTED: 'disappointed',
  TIRED: 'tired',
  
  // 中性/复杂
  CONFUSED: 'confused',
  WORRIED: 'worried',
  NERVOUS: 'nervous',
  NEUTRAL: 'neutral',
  MIXED: 'mixed',
  OTHER: 'other'
} as const;

export type StandardEmotionType = typeof STANDARD_EMOTIONS[keyof typeof STANDARD_EMOTIONS];

/**
 * 用户需求类型常量
 */
export const USER_NEEDS = {
  COMFORT: 'comfort',       // 安慰
  PRAISE: 'praise',         // 鼓励/夸奖
  GUIDANCE: 'guidance',     // 指导
  LISTENING: 'listening',   // 倾听
  VALIDATION: 'validation', // 认可
  CARE: 'care',            // 关心
  MIXED: 'mixed'           // 混合
} as const;

export type UserNeedType = typeof USER_NEEDS[keyof typeof USER_NEEDS];

/**
 * 中文到标准情感的映射
 */
export const ChineseToStandardEmotion: Record<string, StandardEmotionType> = {
  '开心': STANDARD_EMOTIONS.HAPPY,
  '快乐': STANDARD_EMOTIONS.HAPPY,
  '高兴': STANDARD_EMOTIONS.HAPPY,
  '兴奋': STANDARD_EMOTIONS.EXCITED,
  '激动': STANDARD_EMOTIONS.EXCITED,
  '满足': STANDARD_EMOTIONS.CONTENT,
  '满意': STANDARD_EMOTIONS.CONTENT,
  '感激': STANDARD_EMOTIONS.GRATEFUL,
  '感恩': STANDARD_EMOTIONS.GRATEFUL,
  '感谢': STANDARD_EMOTIONS.GRATEFUL,
  '自豪': STANDARD_EMOTIONS.PROUD,
  '骄傲': STANDARD_EMOTIONS.PROUD,
  '平静': STANDARD_EMOTIONS.CALM,
  '平和': STANDARD_EMOTIONS.CALM,
  
  '焦虑': STANDARD_EMOTIONS.ANXIOUS,
  '不安': STANDARD_EMOTIONS.ANXIOUS,
  '悲伤': STANDARD_EMOTIONS.SAD,
  '难过': STANDARD_EMOTIONS.SAD,
  '伤心': STANDARD_EMOTIONS.SAD,
  '沮丧': STANDARD_EMOTIONS.FRUSTRATED,
  '挫败': STANDARD_EMOTIONS.FRUSTRATED,
  '愤怒': STANDARD_EMOTIONS.ANGRY,
  '生气': STANDARD_EMOTIONS.ANGRY,
  '恼怒': STANDARD_EMOTIONS.ANGRY,
  '孤独': STANDARD_EMOTIONS.LONELY,
  '寂寞': STANDARD_EMOTIONS.LONELY,
  '压力': STANDARD_EMOTIONS.STRESSED,
  '紧张': STANDARD_EMOTIONS.NERVOUS,
  '失望': STANDARD_EMOTIONS.DISAPPOINTED,
  '疲惫': STANDARD_EMOTIONS.TIRED,
  '疲劳': STANDARD_EMOTIONS.TIRED,
  '累': STANDARD_EMOTIONS.TIRED,
  
  '困惑': STANDARD_EMOTIONS.CONFUSED,
  '迷茫': STANDARD_EMOTIONS.CONFUSED,
  '担心': STANDARD_EMOTIONS.WORRIED,
  '担忧': STANDARD_EMOTIONS.WORRIED,
  '中性': STANDARD_EMOTIONS.NEUTRAL,
  '平淡': STANDARD_EMOTIONS.NEUTRAL,
  '混合': STANDARD_EMOTIONS.MIXED,
  '复杂': STANDARD_EMOTIONS.MIXED,
  '其他': STANDARD_EMOTIONS.OTHER
};

/**
 * 中文到用户需求的映射
 */
export const ChineseToUserNeed: Record<string, UserNeedType> = {
  '安慰': USER_NEEDS.COMFORT,
  '安抚': USER_NEEDS.COMFORT,
  '鼓励': USER_NEEDS.PRAISE,
  '夸奖': USER_NEEDS.PRAISE,
  '表扬': USER_NEEDS.PRAISE,
  '赞美': USER_NEEDS.PRAISE,
  '指导': USER_NEEDS.GUIDANCE,
  '建议': USER_NEEDS.GUIDANCE,
  '倾听': USER_NEEDS.LISTENING,
  '理解': USER_NEEDS.LISTENING,
  '倾听与支持': USER_NEEDS.LISTENING,
  '认可': USER_NEEDS.VALIDATION,
  '肯定': USER_NEEDS.VALIDATION,
  '关心': USER_NEEDS.CARE,
  '关怀': USER_NEEDS.CARE,
  '支持': USER_NEEDS.CARE,
  '混合': USER_NEEDS.MIXED,
  '多种': USER_NEEDS.MIXED
};

/**
 * 工具函数：转换情感类型
 */
export function normalizeEmotion(emotion: string): StandardEmotionType {
  // 先尝试中文映射
  if (ChineseToStandardEmotion[emotion]) {
    return ChineseToStandardEmotion[emotion];
  }
  
  // 尝试直接匹配英文值
  const lowerEmotion = emotion.toLowerCase();
  const emotionValues = Object.values(STANDARD_EMOTIONS);
  if (emotionValues.includes(lowerEmotion as StandardEmotionType)) {
    return lowerEmotion as StandardEmotionType;
  }
  
  // 默认返回 OTHER
  return STANDARD_EMOTIONS.OTHER;
}

/**
 * 工具函数：获取情感类别
 */
export function getEmotionCategory(emotion: string): 'positive' | 'negative' | 'neutral' {
  const standardEmotion = normalizeEmotion(emotion);
  
  const positive: StandardEmotionType[] = [
    STANDARD_EMOTIONS.HAPPY,
    STANDARD_EMOTIONS.EXCITED,
    STANDARD_EMOTIONS.GRATEFUL,
    STANDARD_EMOTIONS.PROUD,
    STANDARD_EMOTIONS.CONTENT,
    STANDARD_EMOTIONS.CALM
  ];
  
  const negative: StandardEmotionType[] = [
    STANDARD_EMOTIONS.SAD,
    STANDARD_EMOTIONS.ANXIOUS,
    STANDARD_EMOTIONS.ANGRY,
    STANDARD_EMOTIONS.FRUSTRATED,
    STANDARD_EMOTIONS.LONELY,
    STANDARD_EMOTIONS.STRESSED,
    STANDARD_EMOTIONS.DISAPPOINTED,
    STANDARD_EMOTIONS.TIRED
  ];
  
  if (positive.includes(standardEmotion)) return 'positive';
  if (negative.includes(standardEmotion)) return 'negative';
  return 'neutral';
}

/**
 * 工具函数：判断是否为标准情感类型
 */
export function isStandardEmotion(value: string): value is StandardEmotionType {
  return Object.values(STANDARD_EMOTIONS).includes(value as StandardEmotionType);
}

/**
 * 工具函数：获取情感强度描述
 */
export function getIntensityLabel(intensity: number): string {
  if (intensity < 0.3) return '轻微';
  if (intensity < 0.6) return '中等';
  if (intensity < 0.8) return '强烈';
  return '非常强烈';
}