import React from 'react';

interface ToastNotificationProps {
  message: string;
  type?: 'success' | 'error' | 'info';
}

const ToastNotification = ({ message, type = 'success' }: ToastNotificationProps) => {
  const colors = {
    success: 'bg-success text-success-foreground',
    error: 'bg-destructive text-destructive-foreground',
    info: 'bg-primary text-primary-foreground',
  };

  return (
    <div className={`fixed top-4 right-4 ${colors[type]} px-5 py-3 rounded-lg shadow-lg toast-slide z-50`}>
      {message}
    </div>
  );
};

export const useToast = () => {
  const [toast, setToast] = React.useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const ToastComponent = toast ? <ToastNotification message={toast.message} type={toast.type} /> : null;

  return { showToast, ToastComponent };
};

export default ToastNotification;
