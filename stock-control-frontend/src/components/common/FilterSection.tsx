import React from 'react';
import { Filter, X } from 'lucide-react';

interface FilterSectionProps {
  children: React.ReactNode;
  onClearFilters?: () => void;
  showClearButton?: boolean;
  title?: string;
}

const FilterSection: React.FC<FilterSectionProps> = ({
  children,
  onClearFilters,
  showClearButton = true,
  title = "Filtros"
}) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Filter size={20} className="text-gray-500" />
          <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
        </div>
        {showClearButton && onClearFilters && (
          <button
            onClick={onClearFilters}
            className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
          >
            <X size={16} />
            Limpar filtros
          </button>
        )}
      </div>
      
      {children}
    </div>
  );
};

export default FilterSection;