import { Toaster as SonnerToaster } from 'sonner';
import { useTheme } from '../../hooks/useTheme';

export interface ToasterProps {
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'top-center' | 'bottom-center';
}

export const Toaster = ({ position = 'top-right' }: ToasterProps) => {
  const { theme } = useTheme();
  
  return (
    <SonnerToaster
      expand={true}
      position={position}
      richColors
      duration={2000}
      className="toaster"
      toastOptions={{
        style: {
          top: '0px'
        },
        classNames: {
          toast: theme === 'dark' ? 'bg-gray-800 text-gray-100 border-gray-700' : '',
          title: theme === 'dark' ? 'text-gray-100' : '',
          description: theme === 'dark' ? 'text-gray-300' : '',
          actionButton: theme === 'dark' ? 'bg-gray-700 text-gray-100 hover:bg-gray-600' : '',
          cancelButton: theme === 'dark' ? 'bg-gray-700 text-gray-100 hover:bg-gray-600' : '',
        }
      }}
      closeButton
      theme={theme === 'dark' ? 'dark' : 'light'}
    />
  );
};