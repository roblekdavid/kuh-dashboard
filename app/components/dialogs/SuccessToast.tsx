'use client';

import { useEffect } from 'react';
import { CheckCircle } from 'lucide-react';

interface SuccessToastProps {
  message: string;
  isVisible: boolean;
  onClose: () => void;
}

export default function SuccessToast({ message, isVisible, onClose }: SuccessToastProps) {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose();
      }, 1000); // 1 Sekunden

      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  if (!isVisible) return null;

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-2 duration-300">
      <div className="bg-green-500 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 min-w-[280px] justify-center">
        <CheckCircle className="w-6 h-6 flex-shrink-0" />
        <span className="font-semibold text-lg text-center">{message}</span>
      </div>
    </div>
  );
}