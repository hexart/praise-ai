import { Toaster as SonnerToaster } from 'sonner';

export interface ToasterProps {
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'top-center' | 'bottom-center';
}

export const Toaster = ({ position = 'top-right' }: ToasterProps) => {
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
        }
      }}
      closeButton
    />
  );
};