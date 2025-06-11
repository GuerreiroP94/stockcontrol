import React from 'react';
import LoadingSpinner from './LoadingSpinner';
import EmptyState from './EmptyState';
import { LucideIcon } from 'lucide-react';

interface TableWrapperProps {
  children: React.ReactNode;
  loading?: boolean;
  isEmpty?: boolean;
  loadingMessage?: string;
  emptyIcon?: LucideIcon;
  emptyTitle?: string;
  emptyDescription?: string;
  headerMessage?: React.ReactNode;
  className?: string;
}

const TableWrapper: React.FC<TableWrapperProps> = ({
  children,
  loading = false,
  isEmpty = false,
  loadingMessage = "Carregando dados...",
  emptyIcon,
  emptyTitle = "Nenhum item encontrado",
  emptyDescription,
  headerMessage,
  className = ""
}) => {
  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden ${className}`}>
      {headerMessage && (
        <div className="bg-orange-50 border-b border-orange-200 p-3 text-center">
          {headerMessage}
        </div>
      )}
      
      {loading ? (
        <div className="p-12 text-center">
          <LoadingSpinner size="lg" message={loadingMessage} />
        </div>
      ) : isEmpty ? (
        emptyIcon && (
          <EmptyState
            icon={emptyIcon}
            title={emptyTitle}
            description={emptyDescription}
          />
        )
      ) : (
        <div className="overflow-x-auto">
          {children}
        </div>
      )}
    </div>
  );
};

export default TableWrapper;