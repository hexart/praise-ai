import type { ChatMode } from '../types/chat';
import { Sparkles, Star, Heart } from 'lucide-react';

export const CHAT_MODES = {
  PRAISE: 'praise' as const,
  COMFORT: 'comfort' as const,
  SMART: 'smart' as const,
} as const;

export const MODE_CONFIGS = {
  [CHAT_MODES.SMART]: {
    id: 'smart' as ChatMode,
    name: '智能模式',
    icon: Sparkles,
    emoji: '🤖',
    subtitle: 'AI会自动分析你的情感，提供最合适的回应',
    examples: ['今天过得怎么样？', '想聊聊最近的事', '有什么想法分享'],
    description: '智能分析情感，自动选择最佳回应方式',
    color: 'text-purple-600 bg-purple-100 hover:bg-purple-200 dark:bg-purple-900/30 dark:hover:bg-purple-800/50',
    gradient: 'from-purple-400 to-indigo-400'
  },
  [CHAT_MODES.PRAISE]: {
    id: 'praise' as ChatMode,
    name: '夸夸模式',
    icon: Star,
    emoji: '🌟',
    subtitle: '分享你的成就，让我发现你的闪光点！',
    examples: ['我今天完成了一个项目', '我学会了新技能', '我帮助了朋友'],
    description: '发现你的闪光点，给予积极鼓励和肯定',
    color: 'text-yellow-600 bg-yellow-100 hover:bg-yellow-200 dark:bg-yellow-900/30 dark:hover:bg-yellow-800/50',
    gradient: 'from-yellow-400 to-orange-400'
  },
  [CHAT_MODES.COMFORT]: {
    id: 'comfort' as ChatMode,
    name: '安慰模式',
    icon: Heart,
    emoji: '💕',
    subtitle: '说出你的心声，我会陪伴和理解你',
    examples: ['今天有点累', '遇到了困难', '心情不太好'],
    description: '温暖陪伴，提供情感支持和理解',
    color: 'text-pink-600 bg-pink-100 hover:bg-pink-200 dark:bg-pink-900/30 dark:hover:bg-pink-800/50',
    gradient: 'from-pink-400 to-purple-400'
  },
} as const;