import React from 'react';
import type { ButtonProps } from '../../types/ui';

/**
基础按钮组件
支持多种变体、尺寸和状态
*/
export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  className = '',
  children,
  onClick,
  ...props
}) => {
  const baseClasses = [
    'inline-flex items-center justify-center',
    'font-medium rounded-lg transition-all duration-200',
    'focus:outline-none focus:ring-2 focus:ring-offset-2',
    'disabled:opacity-50 disabled:cursor-not-allowed',
    'active:scale-95'
  ];
  const variantClasses = {
    primary: [
      'bg-blue-600 text-white hover:bg-blue-700',
      'focus:ring-blue-500 shadow-sm hover:shadow-md'
    ],
    secondary: [
      'bg-gray-200 text-gray-900 hover:bg-gray-300',
      'focus:ring-gray-500'
    ],
    success: [
      'bg-green-600 text-white hover:bg-green-700',
      'focus:ring-green-500 shadow-sm hover:shadow-md'
    ],
    warning: [
      'bg-yellow-500 text-white hover:bg-yellow-600',
      'focus:ring-yellow-500 shadow-sm hover:shadow-md'
    ],
    danger: [
      'bg-red-600 text-white hover:bg-red-700',
      'focus:ring-red-500 shadow-sm hover:shadow-md'
    ],
    ghost: [
      'bg-transparent text-gray-700 hover:bg-gray-100',
      'focus:ring-gray-500 border border-gray-300'
    ]
  };
  const sizeClasses = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  };
  const classes = [
    ...baseClasses,
    ...variantClasses[variant],
    sizeClasses[size],
    className
  ].join(' ');
  const handleClick = () => {
    if (!disabled && !loading && onClick) {
      onClick();
    }
  }; return (
    <button
      type="button"
      className={classes}
      disabled={disabled || loading}
      onClick={handleClick}
      {...props}
    >
      {loading && (
        <svg
          className="animate-spin -ml-1 mr-2 h-4 w-4"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      {children}
    </button>
  );
};