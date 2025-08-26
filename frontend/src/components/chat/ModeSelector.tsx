import React from 'react';
import { Sparkles, Star, Heart } from 'lucide-react';
import type { ChatMode } from '../../types/chat';
interface ModeSelectorProps {
  selectedMode: ChatMode;
  onModeChange: (mode: ChatMode) => void;
  disabled?: boolean;
  className?: string;
}
interface ModeConfig {
  id: ChatMode;
  name: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  hoverColor: string;
  darkBgColor: string;
  darkHoverColor: string;
  description: string;
  gradient: string;
}
const modeConfigs: ModeConfig[] = [
  {
    id: 'smart',
    name: '智能模式',
    icon: <Sparkles className="w-4 h-4" />,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
    hoverColor: 'hover:bg-purple-200',
    darkBgColor: 'dark:bg-purple-900/30',
    darkHoverColor: 'dark:hover:bg-purple-800/50',
    description: '智能分析情感，自动选择最佳回应方式',
    gradient: 'from-purple-400 to-indigo-400'
  },
  {
    id: 'praise',
    name: '夸夸模式',
    icon: <Star className="w-4 h-4" />,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100',
    hoverColor: 'hover:bg-yellow-200',
    darkBgColor: 'dark:bg-yellow-900/30',
    darkHoverColor: 'dark:hover:bg-yellow-800/50',
    description: '发现你的闪光点，给予积极鼓励和肯定',
    gradient: 'from-yellow-400 to-orange-400'
  },
  {
    id: 'comfort',
    name: '安慰模式',
    icon: <Heart className="w-4 h-4" />,
    color: 'text-pink-600',
    bgColor: 'bg-pink-100',
    hoverColor: 'hover:bg-pink-200',
    darkBgColor: 'dark:bg-pink-900/30',
    darkHoverColor: 'dark:hover:bg-pink-800/50',
    description: '温暖陪伴，提供情感支持和理解',
    gradient: 'from-pink-400 to-purple-400'
  }
];
/**

模式选择器组件
*/
export const ModeSelector: React.FC<ModeSelectorProps> = ({
  selectedMode,
  onModeChange,
  disabled = false,
  className = ''
}) => {
  return (
    <div className={`mt-4 p-4 bg-white border-y border-gray-200 ${className} dark:bg-gray-800/50 dark:border-gray-700`}>
      <div className="max-w-4xl mx-auto">
        {/* 标题 */}
        <div className="text-center">
          {/* <h3 className="text-sm font-medium text-gray-700 mb-2 dark:text-gray-300">选择AI回应模式</h3> */}
          {/* 模式按钮组 */}
          <div className="flex items-center justify-center space-x-2">
            {modeConfigs.map((config) => (
              <button
                key={config.id}
                onClick={() => !disabled && onModeChange(config.id)}
                disabled={disabled}
                className={`
              relative px-4 py-2 rounded-full transition-all duration-200
              flex items-center space-x-2 text-sm font-medium
              ${selectedMode === config.id
                    ? `bg-gradient-to-r ${config.gradient} text-white shadow-md scale-105`
                    : `${config.bgColor} ${config.color} ${config.hoverColor} ${config.darkBgColor} ${config.darkHoverColor}`
                  }
              ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `}
                title={config.description}
              >
                {config.icon}
                <span>{config.name}</span>

                {/* 选中指示器 */}
                {selectedMode === config.id && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full flex items-center justify-center dark:bg-gray-900">
                    <div className={`w-1.5 h-1.5 rounded-full bg-gradient-to-r ${config.gradient}`} />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* 智能模式特殊说明 */}
        {selectedMode === 'smart' && (
          <div className="mt-4 text-center">
            <div className="inline-flex items-center space-x-1 text-xs text-purple-600 bg-purple-50 px-3 py-1 rounded-full dark:text-purple-400 dark:bg-purple-900/30">
              <Sparkles className="w-3 h-3" />
              <span>AI会自动分析你的情感状态，智能选择最合适的回应方式</span>
            </div>
          </div>
        )}
      </div>
    </div >
  );
};