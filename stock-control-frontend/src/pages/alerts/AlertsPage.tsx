import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  AlertCircle, 
  Calendar, 
  Package,
  ShoppingCart,
  FileSpreadsheet,
  CheckSquare,
  Square,
  X,
  TrendingUp,
  MapPin,
  DollarSign,
  AlertTriangle,
  Info,
  Home,
  FlaskConical
} from 'lucide-react';
import alertsService from '../../services/alerts.service';
import componentsService from '../../services/components.service';
import exportService from '../../services/export.service';
import { StockAlert, StockAlertQueryParameters, Component, AlertedComponent } from '../../types';
import { PAGINATION } from '../../utils/constants';
import { formatDateTime, formatCurrency } from '../../utils/helpers';
import ErrorMessage from '../../components/common/ErrorMessage';
import SuccessMessage from '../../components/common/SuccessMessage';
import PageHeader from '../../components/common/PageHeader';
import FilterSection from '../../components/common/FilterSection';
import TableWrapper from '../../components/common/TableWrapper';
import Pagination from '../../components/common/Pagination';
import StatsCard from '../../components/dashboard/StatsCard';
import { getStockStatusClasses, getEnvironmentClasses, getEnvironmentLabel } from '../../utils/tableHelpers';

const AlertsPage: React.FC = () => {
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState<StockAlert[]>([]);
  const [components, setComponents] = useState<Component[]>([]);
  const [alertedComponents, setAlertedComponents] = useState<AlertedComponent[]>([]);
  const [selectedComponents, setSelectedComponents] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [totalItems, setTotalItems] = useState(0);
  
  // Filters
  const [queryParams, setQueryParams] = useState<StockAlertQueryParameters>({
    page: 1,
    pageSize: PAGINATION.DEFAULT_PAGE_SIZE,
    componentId: undefined,
    fromDate: '',
    toDate: ''
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [groupFilter, setGroupFilter] = useState('');
  const [environmentFilter, setEnvironmentFilter] = useState<'all' | 'estoque' | 'laboratorio'>('all');
  const [severityFilter, setSeverityFilter] = useState<'all' | 'critical' | 'warning'>('all');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [alertsData, componentsData] = await Promise.all([
        alertsService.getAll(queryParams),
        componentsService.getAll()
      ]);
      
      // Mapear alertas com componentes completos
      const alertedComps: AlertedComponent[] = alertsData.map(alert => {
        const component = componentsData.find(c => c.id === alert.componentId);
        if (!component) return null;
        
        // Calcular quantidade sugerida (dobro do mínimo)
        const suggestedPurchase = component.minimumQuantity * 2;
        const totalPurchasePrice = suggestedPurchase * (component.price || 0);
        
        return {
          ...component,
          alertId: alert.id,
          alertMessage: alert.message,
          alertDate: alert.createdAt,
          suggestedPurchase,
          totalPurchasePrice
        };
      }).filter(Boolean) as AlertedComponent[];
      
      setAlerts(alertsData);
      setComponents(componentsData);
      setAlertedComponents(alertedComps);
      
      setTotalItems(alertsData.length === queryParams.pageSize ? 
        queryParams.page * queryParams.pageSize + 1 : (queryParams.page - 1) * queryParams.pageSize + alertsData.length);
    } catch (error) {
      setError('Erro ao carregar alertas');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [queryParams]);

  const handlePageSizeChange = (newPageSize: number) => {
    setQueryParams(prev => ({ ...prev, pageSize: newPageSize, page: 1 }));
  };

  const handleFilterChange = (field: keyof StockAlertQueryParameters, value: any) => {
    setQueryParams(prev => ({ ...prev, [field]: value, page: 1 }));
  };

  const clearFilters = () => {
    setQueryParams({
      page: 1,
      pageSize: PAGINATION.DEFAULT_PAGE_SIZE,
      componentId: undefined,
      fromDate: '',
      toDate: ''
    });
    setSearchTerm('');
    setGroupFilter('');
    setEnvironmentFilter('all');
    setSeverityFilter('all');
  };

  const handleSelectComponent = (componentId: number) => {
    setSelectedComponents(prev => {
      const newSet = new Set(prev);
      if (newSet.has(componentId)) {
        newSet.delete(componentId);
      } else {
        newSet.add(componentId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedComponents.size === filteredComponents.length) {
      setSelectedComponents(new Set());
    } else {
      setSelectedComponents(new Set(filteredComponents.map(c => c.id)));
    }
  };

  const handleExportPurchaseList = () => {
    const selectedData = filteredComponents.filter(c => selectedComponents.has(c.id));
    
    if (selectedData.length === 0) {
      setError('Selecione ao menos um componente para exportar');
      return;
    }

    try {
      // Usar o método do serviço de exportação
      exportService.exportPurchaseList(selectedData);
      
      setSuccess(`Lista de compras exportada com sucesso! ${selectedData.length} itens processados.`);
      setSelectedComponents(new Set());
    } catch (error) {
      setError('Erro ao exportar lista de compras');
      console.error(error);
    }
  };

  const getAlertSeverity = (component: AlertedComponent): 'critical' | 'warning' => {
    if (component.quantityInStock === 0) return 'critical';
    return 'warning';
  };

  // Filtrar componentes
  const filteredComponents = alertedComponents.filter(comp => {
    // Filtro por busca
    if (searchTerm && !(
      comp.device?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      comp.internalCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      comp.value?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      comp.package?.toLowerCase().includes(searchTerm.toLowerCase())
    )) return false;
    
    // Filtro por grupo
    if (groupFilter && comp.group !== groupFilter) return false;
    
    // Filtro por ambiente
    if (environmentFilter !== 'all' && comp.environment !== environmentFilter) return false;
    
    // Filtro por severidade
    if (severityFilter !== 'all') {
      const severity = getAlertSeverity(comp);
      if (severityFilter !== severity) return false;
    }
    
    return true;
  });

  // Estatísticas
  const totalAlerts = alertedComponents.length;
  const criticalAlerts = alertedComponents.filter(c => c.quantityInStock === 0).length;
  const totalPurchaseValue = selectedComponents.size > 0
    ? filteredComponents
        .filter(c => selectedComponents.has(c.id))
        .reduce((sum, c) => sum + c.totalPurchasePrice, 0)
    : 0;

  // Grupos únicos para filtro
  const uniqueGroups = Array.from(new Set(alertedComponents.map(c => c.group)));

  const pageActions = (
    <div className="flex items-center gap-2">
      {selectedComponents.size > 0 && (
        <>
          <button
            onClick={handleExportPurchaseList}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg hover:from-purple-600 hover:to-purple-700 transition-all duration-200 shadow-sm"
          >
            <FileSpreadsheet size={18} />
            <span className="font-medium">Exportar Lista ({selectedComponents.size})</span>
          </button>
          
          <button
            onClick={() => setSelectedComponents(new Set())}
            className="px-4 py-2.5 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg"
          >
            <X size={18} />
          </button>
        </>
      )}
    </div>
  );

  return (
    <div className="p-6">
      {/* Header */}
      <PageHeader
        title="Alertas de Estoque"
        subtitle="Gerencie componentes com estoque baixo e gere listas de compra"
        icon={AlertCircle}
        iconColor="from-red-500 to-red-600"
        actions={pageActions}
      />

      {/* Messages */}
      {error && <ErrorMessage message={error} onClose={() => setError('')} className="mb-6" />}
      {success && <SuccessMessage message={success} onClose={() => setSuccess('')} className="mb-6" />}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <StatsCard
          title="Total de Alertas"
          value={totalAlerts}
          icon={AlertCircle}
          iconBgColor="bg-orange-100"
          iconColor="text-orange-600"
        />
        
        <StatsCard
          title="Alertas Críticos"
          value={criticalAlerts}
          icon={AlertTriangle}
          iconBgColor="bg-red-100"
          iconColor="text-red-600"
        />
        
        <StatsCard
          title="Itens Selecionados"
          value={selectedComponents.size}
          icon={ShoppingCart}
          iconBgColor="bg-blue-100"
          iconColor="text-blue-600"
        />
        
        <StatsCard
          title="Valor Total Selecionado"
          value={formatCurrency(totalPurchaseValue)}
          icon={DollarSign}
          iconBgColor="bg-green-100"
          iconColor="text-green-600"
        />
      </div>

      {/* Filters */}
      <FilterSection onClearFilters={clearFilters}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Search */}
          <input
            type="text"
            placeholder="Buscar componente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
          />

          {/* Group Filter */}
          <select
            value={groupFilter}
            onChange={(e) => setGroupFilter(e.target.value)}
            className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
          >
            <option value="">Todos os Grupos</option>
            {uniqueGroups.map(group => (
              <option key={group} value={group}>{group}</option>
            ))}
          </select>

          {/* Environment Filter */}
          <select
            value={environmentFilter}
            onChange={(e) => setEnvironmentFilter(e.target.value as 'all' | 'estoque' | 'laboratorio')}
            className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
          >
            <option value="all">Todos os Ambientes</option>
            <option value="estoque">Estoque</option>
            <option value="laboratorio">Laboratório</option>
          </select>

          {/* Severity Filter */}
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value as 'all' | 'critical' | 'warning')}
            className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
          >
            <option value="all">Todos os Alertas</option>
            <option value="critical">Crítico</option>
            <option value="warning">Atenção</option>
          </select>

          {/* Date Filters */}
          <div className="flex gap-2">
            <input
              type="date"
              value={queryParams.fromDate}
              onChange={(e) => handleFilterChange('fromDate', e.target.value)}
              className="flex-1 px-3 py-2.5 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
              placeholder="dd/mm/aaaa"
            />
            <input
              type="date"
              value={queryParams.toDate}
              onChange={(e) => handleFilterChange('toDate', e.target.value)}
              className="flex-1 px-3 py-2.5 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
              placeholder="dd/mm/aaaa"
            />
          </div>
        </div>
      </FilterSection>

      {/* Purchase Info */}
      {selectedComponents.size > 0 && (
        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Info className="text-blue-600 mt-0.5" size={20} />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-2">Como funciona a sugestão de compra:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>A quantidade sugerida é calculada como o <strong>dobro da quantidade mínima</strong> definida para cada componente</li>
                <li>Componentes iguais em <strong>ambientes diferentes</strong> são agrupados na exportação</li>
                <li>Quando há diferença nas quantidades mínimas entre ambientes, prevalece a <strong>maior quantidade</strong></li>
                <li>A lista exportada mostra em quais ambientes cada componente está presente</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Alerts Table */}
      <TableWrapper
        loading={loading}
        isEmpty={filteredComponents.length === 0}
        loadingMessage="Carregando alertas..."
        emptyIcon={Package}
        emptyTitle="Nenhum alerta ativo"
        emptyDescription="Todos os componentes estão com estoque adequado"
      >
        {/* Paginação no topo */}
        {filteredComponents.length > 0 && (
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
        
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-3 py-4">
                  <button
                    onClick={handleSelectAll}
                    className="text-gray-600 hover:text-gray-800"
                  >
                    {selectedComponents.size === filteredComponents.length && filteredComponents.length > 0 ? 
                      <CheckSquare size={20} /> : 
                      <Square size={20} />
                    }
                  </button>
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Grupo
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Device/Value
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Package
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ambiente
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Localização
                </th>
                <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estoque
                </th>
                <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Mínimo
                </th>
                <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sugestão Compra
                </th>
                <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Valor Total
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Alerta Desde
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredComponents.map((component) => {
                const severity = getAlertSeverity(component);
                const isSelected = selectedComponents.has(component.id);
                
                return (
                  <tr 
                    key={component.id} 
                    className={`hover:bg-gray-50 transition-colors ${isSelected ? 'bg-blue-50' : ''}`}
                  >
                    <td className="px-3 py-4">
                      <button
                        onClick={() => handleSelectComponent(component.id)}
                        className="text-gray-600 hover:text-gray-800"
                      >
                        {isSelected ? 
                          <CheckSquare size={18} className="text-blue-600" /> : 
                          <Square size={18} />
                        }
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
                        severity === 'critical' 
                          ? 'bg-red-100 text-red-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        <AlertCircle size={14} />
                        {severity === 'critical' ? 'Crítico' : 'Atenção'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">{component.group}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm">
                        {component.device && <p className="text-gray-900 font-medium">{component.device}</p>}
                        {component.value && <p className="text-gray-600">{component.value}</p>}
                        {component.internalCode && (
                          <p className="text-xs text-gray-500">Cód: {component.internalCode}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-600">{component.package || '-'}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2.5 py-1 text-xs font-medium rounded-full ${
                        getEnvironmentClasses(component.environment || 'estoque')
                      }`}>
                        {component.environment === 'laboratorio' ? (
                          <>
                            <FlaskConical size={12} className="mr-1" />
                            Laboratório
                          </>
                        ) : (
                          <>
                            <Home size={12} className="mr-1" />
                            Estoque
                          </>
                        )}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {component.drawer && component.division ? (
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <MapPin size={14} />
                          <span>{component.drawer}/{component.division}</span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className={`inline-flex px-2.5 py-1 text-xs font-medium rounded-full ${
                        getStockStatusClasses(component.quantityInStock, component.minimumQuantity)
                      }`}>
                        {component.quantityInStock}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className="text-sm text-gray-900">{component.minimumQuantity}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center gap-1">
                        <TrendingUp className="text-green-500" size={16} />
                        <span className="text-sm font-medium text-green-600">
                          {component.suggestedPurchase}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <span className="text-sm font-medium text-gray-900">
                        {formatCurrency(component.totalPurchasePrice)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Calendar size={12} />
                        {formatDateTime(component.alertDate)}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            {selectedComponents.size > 0 && (
              <tfoot className="bg-gray-50">
                <tr>
                  <td colSpan={10} className="px-6 py-3 text-sm font-medium text-right">
                    Total da Compra:
                  </td>
                  <td className="px-6 py-3 text-sm font-bold text-right">
                    {formatCurrency(totalPurchaseValue)}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        {/* Paginação no final */}
        {filteredComponents.length > 0 && (
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

export default AlertsPage;