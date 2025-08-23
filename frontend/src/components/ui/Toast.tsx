import React, { useEffect, useState } from 'react';
import { CheckCircle, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';
import type { ToastMessage } from '../../types/ui';
interface ToastProps {
  message: ToastMessage;
  onClose: (id: string) => void;
}

/**
单个Toast组件
*/
export const Toast: React.FC<ToastProps> = ({ message, onClose }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // 入场动画
    const showTimer = setTimeout(() => setIsVisible(true), 10);
    // 自动关闭
    const duration = message.duration || 4000;
    const hideTimer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => onClose(message.id), 300); // 等待退场动画
    }, duration);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
    };
  }, [message, onClose]);
  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => onClose(message.id), 300);
  };
  const icons = {
    success: <CheckCircle className="w-5 h-5 text-green-500" />,
    error: <AlertCircle className="w-5 h-5 text-red-500" />,
    warning: <AlertTriangle className="w-5 h-5 text-yellow-500" />,
    info: <Info className="w-5 h-5 text-blue-500" />
  };
  const bgColors = {
    success: 'bg-green-50 border-green-200',
    error: 'bg-red-50 border-red-200',
    warning: 'bg-yellow-50 border-yellow-200',
    info: 'bg-blue-50 border-blue-200'
  };

  return (
    <div
      className={`flex items-start space-x-3 p-4 rounded-lg border shadow-sm transition-all duration-300 transform ${bgColors[message.type]} ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}`}
    >
      {/* 图标 */}
      < div className="flex-shrink-0" >
        {icons[message.type]}
      </div >
      {/* 内容 */}
      < div className="flex-1 min-w-0" >
        <p className="text-sm font-medium text-gray-900">
          {message.title}
        </p>
        {
          message.message && (
            <p className="mt-1 text-sm text-gray-600">
              {message.message}
            </p>
          )
        }
      </div >

      {/* 关闭按钮 */}
      < button
        onClick={handleClose}
        className="flex-shrink-0 p-1 hover:bg-white hover:bg-opacity-50 rounded transition-colors"
        aria-label="关闭通知"
      >
        <X className="w-4 h-4 text-gray-500" />
      </button >
    </div >
  );
};

/**
Toast容器组件
*/
interface ToastContainerProps {
  messages: ToastMessage[];
  onRemove: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ messages, onRemove }) => {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm w-full">
      {messages.map((message) => (
        <Toast
          key={message.id}
          message={message}
          onClose={onRemove}
        />
      ))}
    </div>
  );
};