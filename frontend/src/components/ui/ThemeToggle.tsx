import React from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme, type Theme } from '../../hooks/useTheme';

export const ThemeToggle: React.FC = () => {
  const { theme, setTheme } = useTheme();
  
  const buttons: Array<{
    value: Theme;
    icon: React.ElementType;
    label: string;
  }> = [
    { value: 'light', icon: Sun, label: '浅色模式' },
    { value: 'dark', icon: Moon, label: '深色模式' },
    { value: 'system', icon: Monitor, label: '跟随系统' }
  ];
  
  return (
    <div className="flex items-center space-x-2">
      <span className="text-sm text-gray-500 dark:text-gray-400">主题:</span>
      <div className="inline-flex rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 shadow-sm">
        {buttons.map((button, index) => {
          const Icon = button.icon;
          const isActive = theme === button.value;
          
          return (
            <React.Fragment key={button.value}>
              {index > 0 && (
                <div className="w-px bg-gray-300 dark:bg-gray-600" />
              )}
              <button
                type="button"
                onClick={() => setTheme(button.value)}
                className={`
                  relative px-3 py-2 text-sm font-medium transition-colors
                  ${index === 0 ? 'rounded-l-lg' : ''}
                  ${index === buttons.length - 1 ? 'rounded-r-lg' : ''}
                  ${isActive 
                    ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400' 
                    : 'text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700/50'
                  }
                `}
                aria-label={button.label}
                aria-pressed={isActive}
              >
                <Icon className="h-4 w-4" />
              </button>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};