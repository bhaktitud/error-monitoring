import { useEffect } from 'react';
import { FiCheckCircle, FiAlertCircle } from 'react-icons/fi';

interface ToastProps {
  message: string;
  type?: 'success' | 'error';
  onClose: () => void;
}

export default function Toast({ message, type = 'success', onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, 2500);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div
      className={`fixed top-8 right-8 z-50 flex items-center space-x-3 px-6 py-4 rounded-xl shadow-lg text-white text-base font-semibold animate-fade-in-up transition-all duration-300
        ${type === 'success' ? 'bg-green-500' : 'bg-red-500'}`}
      style={{ minWidth: 260 }}
    >
      {type === 'success' ? (
        <FiCheckCircle className="text-2xl" />
      ) : (
        <FiAlertCircle className="text-2xl" />
      )}
      <span>{message}</span>
    </div>
  );
} 