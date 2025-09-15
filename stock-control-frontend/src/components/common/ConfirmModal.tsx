// stock-control-frontend/src/components/common/ConfirmModal.tsx
import React from 'react';
import { AlertTriangle } from 'lucide-react';
import BaseModal from './BaseModal';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
  // ✅ TEMPORÁRIO: Aceitar estas props para evitar erro de build
  loading?: boolean;
  isLoading?: boolean;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  type = 'warning',
  loading = false,
  isLoading = false, // ✅ ACEITAR TEMPORARIAMENTE
}) => {
  const getIconColor = () => {
    switch (type) {
      case 'danger': return 'text-red-600';
      case 'warning': return 'text-yellow-600';
      case 'info': return 'text-blue-600';
      default: return 'text-yellow-600';
    }
  };

  const getConfirmButtonStyle = () => {
    switch (type) {
      case 'danger': return 'bg-red-600 hover:bg-red-700 focus:ring-red-500';
      case 'warning': return 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500';
      case 'info': return 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500';
      default: return 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500';
    }
  };

  // ✅ Usar qualquer uma das props de loading
  const isLoadingState = loading || isLoading;

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <div className="p-6">
        <div className="flex items-start gap-4">
          <div className={`flex-shrink-0 w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center ${getIconColor()}`}>
            <AlertTriangle size={20} />
          </div>
          <div className="flex-1">
            <p className="text-sm text-gray-600 leading-relaxed">
              {message}
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            disabled={isLoadingState}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoadingState}
            className={`px-4 py-2 text-white rounded-lg focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${getConfirmButtonStyle()}`}
          >
            {isLoadingState ? 'Processando...' : confirmText}
          </button>
        </div>
      </div>
    </BaseModal>
  );
};

export default ConfirmModal;