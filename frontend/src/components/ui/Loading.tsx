import React from 'react';

interface LoadingProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  className?: string;
}

/**
加载动画组件
*/
export const Loading: React.FC<LoadingProps> = ({
  size = 'md',
  text,
  className = ''
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  return (
    <div className={`flex items-center justify-center space-x-2 ${className}`}>
      <svg
        className={`animate - spin ${sizeClasses[size]} text-blue-600`}
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
      {
        text && (
          <span className="text-sm text-gray-600">
            {text}
          </span>
        )
      }
    </div >
  );
};

/**
骨架屏组件
*/
interface SkeletonProps {
  className?: string;
  rows?: number;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = '', rows = 1 }) => {
  return (
    <div className={`animate-pulse ${className}`}>
      {Array.from({ length: rows }).map((_, index) => (
        <div
          key={index}
          className={`bg-gray-200 rounded ${rows > 1 && index > 0 ? 'mt-2' : ''}`}
          style={{
            height: '1rem',
            width: index === rows - 1 && rows > 1 ? '60%' : '100%'
          }}
        />
      ))}
    </div>
  );
};

/**
全屏加载组件
*/
interface FullScreenLoadingProps {
  text?: string;
}

export const FullScreenLoading: React.FC<FullScreenLoadingProps> = ({ text = '加载中...' }) => {
  return (
    <div className="fixed inset-0 bg-white bg-opacity-90 flex items-center justify-center z-50">
      <div className="text-center">
        <Loading size="lg" />
        <p className="mt-4 text-gray-600 text-lg">{text}</p>
      </div>
    </div>
  );
};