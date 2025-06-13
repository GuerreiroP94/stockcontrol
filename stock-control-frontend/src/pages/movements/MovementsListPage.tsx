import React, { useEffect, useState } from 'react';
import { 
  TrendingUp, 
  TrendingDown,
  Calendar,
  User
} from 'lucide-react';
import movementsService from '../../services/movements.service';
import componentsService from '../../services/components.service';
import { StockMovement, StockMovementQueryParameters, Component } from '../../types';
import { MOVEMENT_TYPES, PAGINATION } from '../../utils/constants';
import { formatDateTime } from '../../utils/helpers';
import ErrorMessage from '../../components/common/ErrorMessage';
import PageHeader from '../../components/common/PageHeader';
import FilterSection from '../../components/common/FilterSection';
import TableWrapper from '../../components/common/TableWrapper';
import StatsCard from '../../components/dashboard/StatsCard';
import { getMovementTypeClasses } from '../../utils/tableHelpers';
import Pagination from '../../components/common/Pagination';

const MovementsListPage: React.FC = () => {
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [components, setComponents] = useState<Component[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [totalItems, setTotalItems] = useState(0);
  
  // Filters
  const [queryParams, setQueryParams] = useState<StockMovementQueryParameters>({
    componentId: undefined,
    movementType: '',
    startDate: '',
    endDate: '',
    page: 1,
    pageSize: PAGINATION.DEFAULT_PAGE_SIZE
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [movementsData, componentsData] = await Promise.all([
        movementsService.getAll(queryParams),
        componentsService.getAll()
      ]);
      setMovements(movementsData);
      setComponents(componentsData);
      setTotalItems(movementsData.length === queryParams.pageSize ? 
        queryParams.page * queryParams.pageSize + 1 : (queryParams.page - 1) * queryParams.pageSize + movementsData.length);
    } catch (error) {
      setError('Erro ao carregar movimentações');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [queryParams]); // eslint-disable-line react-hooks/exhaustive-deps

  const handlePageSizeChange = (newPageSize: number) => {
    setQueryParams(prev => ({ ...prev, pageSize: newPageSize, page: 1 }));
  };

  const handleFilterChange = (field: keyof StockMovementQueryParameters, value: any) => {
    setQueryParams(prev => ({ ...prev, [field]: value, page: 1 }));
  };

  const getComponent = (componentId: number): Component | undefined => {
    return components.find(c => c.id === componentId);
  };

  const getTotalQuantity = (type: 'Entrada' | 'Saida') => {
    return movements
      .filter(m => m.movementType === type)
      .reduce((sum, m) => sum + Math.abs(m.quantity), 0);
  };

  const clearFilters = () => {
    setQueryParams({
      componentId: undefined,
      movementType: '',
      startDate: '',
      endDate: '',
      page: 1,
      pageSize: PAGINATION.DEFAULT_PAGE_SIZE
    });
  };

  return (
    <div className="p-6">
      {/* Header */}
      <PageHeader
        title="Movimentações"
        subtitle="Histórico de entradas e saídas do estoque"
        icon={TrendingUp}
        iconColor="from-purple-500 to-purple-600"
      />

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <StatsCard
          title="Total de Entradas"
          value={`+${getTotalQuantity('Entrada')}`}
          subtitle="unidades adicionadas"
          icon={TrendingUp}
          iconBgColor="bg-green-100"
          iconColor="text-green-600"
        />

        <StatsCard
          title="Total de Saídas"
          value={`-${getTotalQuantity('Saida')}`}
          subtitle="unidades removidas"
          icon={TrendingDown}
          iconBgColor="bg-red-100"
          iconColor="text-red-600"
        />
      </div>

      {/* Messages */}
      {error && <ErrorMessage message={error} onClose={() => setError('')} className="mb-6" />}

      {/* Filters */}
      <FilterSection
        onClearFilters={clearFilters}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Component Filter */}
          <select
            value={queryParams.componentId || ''}
            onChange={(e) => handleFilterChange('componentId', e.target.value ? Number(e.target.value) : undefined)}
            className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 bg-white"
          >
            <option value="">Todos os Componentes</option>
            {components.map(comp => (
              <option key={comp.id} value={comp.id}>
                {comp.device || comp.name} {comp.value ? `- ${comp.value}` : ''}
              </option>
            ))}
          </select>

          {/* Movement Type Filter */}
          <select
            value={queryParams.movementType || ''}
            onChange={(e) => handleFilterChange('movementType', e.target.value)}
            className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 bg-white"
          >
            <option value="">Todos os Tipos</option>
            <option value={MOVEMENT_TYPES.ENTRADA}>Entrada</option>
            <option value={MOVEMENT_TYPES.SAIDA}>Saída</option>
          </select>

          {/* Start Date */}
          <input
            type="date"
            value={queryParams.startDate || ''}
            onChange={(e) => handleFilterChange('startDate', e.target.value)}
            className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
          />

          {/* End Date */}
          <input
            type="date"
            value={queryParams.endDate || ''}
            onChange={(e) => handleFilterChange('endDate', e.target.value)}
            className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
          />
        </div>
      </FilterSection>

      {/* Table */}
      <TableWrapper
        loading={loading}
        isEmpty={movements.length === 0}
        loadingMessage="Carregando movimentações..."
        emptyIcon={TrendingUp}
        emptyTitle="Nenhuma movimentação encontrada"
        emptyDescription={
          queryParams.componentId || queryParams.movementType || queryParams.startDate || queryParams.endDate
            ? "Tente ajustar os filtros de busca" 
            : "Ainda não há movimentações registradas no sistema"
        }
      >
        {/* Paginação no topo */}
        {movements.length > 0 && (
          <div className="border-b border-gray-200 bg-gray-50">
            <Pagination
              currentPage={queryParams.page}
              pageSize={queryParams.pageSize}
              totalItems={totalItems}
              onPageChange={(page) => handleFilterChange('page', page)}
              onPageSizeChange={handlePageSizeChange}
              loading={loading}
            />
          </div>
        )}
        
        <table className="min-w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tipo
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Grupo
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Device
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Value
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Package
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Quantidade
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Data/Hora
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Responsável
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {movements.map((movement) => {
              const component = getComponent(movement.componentId);
              
              return (
                <tr key={movement.id} className="hover:bg-gray-50 transition-colors duration-150">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
                      getMovementTypeClasses(movement.movementType)
                    }`}>
                      {movement.movementType === 'Entrada' ? (
                        <TrendingUp size={14} />
                      ) : (
                        <TrendingDown size={14} />
                      )}
                      {movement.movementType}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900">
                      {component?.group || '-'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-medium text-gray-900">
                      {component?.device || '-'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-600">
                      {component?.value || '-'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-600">
                      {component?.package || '-'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <p className={`text-sm font-bold ${
                      movement.movementType === 'Entrada' 
                        ? 'text-green-600' 
                        : 'text-red-600'
                    }`}>
                      {movement.movementType === 'Entrada' ? '+' : '-'}{Math.abs(movement.quantity)}
                    </p>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar size={14} />
                      {formatDateTime(movement.movementDate)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center">
                        <User size={12} className="text-gray-600" />
                      </div>
                      <span className="text-sm text-gray-600">
                        {movement.userName || movement.performedBy}
                      </span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Paginação no final */}
        {movements.length > 0 && (
          <div className="border-t border-gray-200 bg-gray-50">
            <Pagination
              currentPage={queryParams.page}
              pageSize={queryParams.pageSize}
              totalItems={totalItems}
              onPageChange={(page) => handleFilterChange('page', page)}
              onPageSizeChange={handlePageSizeChange}
              loading={loading}
            />
          </div>
        )}
      </TableWrapper>
    </div>
  );
};

export default MovementsListPage;