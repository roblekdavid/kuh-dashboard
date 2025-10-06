'use client';

import { useEffect } from 'react';
import { CheckCircle, X } from 'lucide-react';

interface SuccessToastProps {
  message: string;
  isVisible: boolean;
  onClose: () => void;
}

export default function SuccessToast({ 
  message, 
  isVisible, 
  onClose 
}: SuccessToastProps) {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(onClose, 3000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  if (!isVisible) return null;

  return (
    <div className="fixed top-8 right-8 bg-green-500 text-white px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-4 z-50">
      <CheckCircle className="w-6 h-6" />
      <span className="text-lg font-semibold">{message}</span>
      <button 
        onClick={onClose} 
        className="ml-4 hover:bg-green-600 rounded-full p-1 transition-colors"
      >
        <X className="w-5 h-5" />
      </button>
    </div>
  );
}