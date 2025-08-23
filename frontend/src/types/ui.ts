export type ButtonVariant = 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';
export interface ButtonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  children: React.ReactNode;
  onClick?: () => void;
}
export type ToastType = 'success' | 'error' | 'warning' | 'info';
export interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}
export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}
export type ThemeMode = 'light' | 'dark' | 'system';