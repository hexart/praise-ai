export const CHAT_MODES = {
  PRAISE: 'praise' as const,
  COMFORT: 'comfort' as const, 
  SMART: 'smart' as const,
} as const;

export const MODE_CONFIGS = {
  [CHAT_MODES.PRAISE]: {
    name: '夸夸模式',
    icon: '🌟',
    description: '发现你的闪光点，给予积极鼓励',
    color: 'yellow',
  },
  [CHAT_MODES.COMFORT]: {
    name: '安慰模式', 
    icon: '💕',
    description: '温暖陪伴，提供情感支持',
    color: 'pink',
  },
  [CHAT_MODES.SMART]: {
    name: '智能模式',
    icon: '🤖', 
    description: '智能分析情感，自动选择最佳回应',
    color: 'purple',
  },
} as const;