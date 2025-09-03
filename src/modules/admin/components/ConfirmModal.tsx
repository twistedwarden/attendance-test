import { ReactNode } from 'react';

interface ConfirmModalProps {
  open: boolean;
  title?: string;
  description?: ReactNode;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({ open, title = 'Are you sure?', description, confirmText = 'Confirm', cancelText = 'Cancel', onConfirm, onCancel }: ConfirmModalProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onCancel} />
      <div className="relative bg-white w-full max-w-md mx-4 rounded-xl shadow-xl border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        </div>
        <div className="p-6 text-sm text-gray-700">
          {description}
        </div>
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-end space-x-2">
          <button onClick={onCancel} className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700">{cancelText}</button>
          <button onClick={onConfirm} className="px-4 py-2 rounded-lg bg-red-600 text-white">{confirmText}</button>
        </div>
      </div>
    </div>
  );
} 