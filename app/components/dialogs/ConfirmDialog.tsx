'use client';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDanger?: boolean;
}

export default function ConfirmDialog({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message,
  confirmText = 'Bestätigen',
  cancelText = 'Abbrechen',
  isDanger = false
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" 
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8" 
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-2xl font-bold text-gray-800 mb-4">{title}</h3>
        <p className="text-lg text-gray-600 mb-8">{message}</p>
        <div className="flex gap-4">
          <button
            onClick={onConfirm}
            className={`flex-1 ${
              isDanger 
                ? 'bg-gradient-to-r from-red-500 to-red-600' 
                : 'bg-gradient-to-r from-green-500 to-green-600'
            } text-white py-4 px-6 rounded-xl font-semibold text-lg hover:shadow-lg transition-all active:scale-95 touch-manipulation`}
          >
            {confirmText}
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-gray-200 text-gray-800 py-4 px-6 rounded-xl font-semibold text-lg hover:bg-gray-300 transition-all active:scale-95 touch-manipulation"
          >
            {cancelText}
          </button>
        </div>
      </div>
    </div>
  );
}