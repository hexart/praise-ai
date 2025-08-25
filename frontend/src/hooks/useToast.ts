import { toast } from 'sonner';

/**
 * Toast Hook - 直接导出 Sonner 的 toast 方法
 */
export function useToast() {
  return {
    toast
  };
}