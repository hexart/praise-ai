import { useState } from 'react';
import type { ToastMessage } from '../types/ui';

/**
Toast Hook
*/
export function useToast() {
  const [messages, setMessages] = useState<ToastMessage[]>([]);

  const addToast = (toast: Omit<ToastMessage, 'id'>) => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newToast: ToastMessage = { ...toast, id };
    setMessages(prev => [...prev, newToast]);
    return id;
  };
  const removeToast = (id: string) => {
    setMessages(prev => prev.filter(msg => msg.id !== id));
  };
  const clearAll = () => {
    setMessages([]);
  };
  // 便捷方法
  const toast = {
    success: (title: string, message?: string, duration?: number) =>
      addToast({ type: 'success', title, message, duration }),
    error: (title: string, message?: string, duration?: number) =>
      addToast({ type: 'error', title, message, duration }),
    warning: (title: string, message?: string, duration?: number) =>
      addToast({ type: 'warning', title, message, duration }),
    info: (title: string, message?: string, duration?: number) =>
      addToast({ type: 'info', title, message, duration })
  };
  return {
    messages,
    addToast,
    removeToast,
    clearAll,
    toast
  };
}