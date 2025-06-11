import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Search, 
  Pencil, 
  Trash2, 
  Package,
  Cpu,
  Calendar,
  ChevronDown,
  ChevronUp,
  FileSpreadsheet,
  X,
  GripVertical,
  Check,
  CheckSquare,
  Square,
  FileX
} from 'lucide-react';
import productsService from '../../services/products.service';
import componentsService from '../../services/components.service';
import exportService from '../../services/export.service';
import { Product, Component, ProductWithPriority, MergedComponent } from '../../types';
import { formatDate, formatCurrency } from '../../utils/helpers';
import { PAGINATION } from '../../utils/constants';
import * as XLSX from 'xlsx';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ConfirmModal from '../../components/common/ConfirmModal';
import ErrorMessage from '../../components/common/ErrorMessage';
import SuccessMessage from '../../components/common/SuccessMessage';
import ExportModal from '../../components/modals/ExportModal';
import CrossExportModal from '../../components/modals/CrossExportModal';
import PageHeader from '../../components/common/PageHeader';
import EmptyState from '../../components/common/EmptyState';
import TableWrapper from '../../components/common/TableWrapper';
import Pagination from '../../components/common/Pagination';

// Componente de Relatório de Produção
const ProductionReport: React.FC<{
  product: Product;
  components: Component[];
  onExport: () => void;
}> = ({ product, components, onExport }) => {
  const [quantity, setQuantity] = useState(1);

  const getComponentDetails = (componentId: number) => {
    return components.find(c => c.id === componentId);
  };

  const calculateTotal = () => {
    return product.components.reduce((sum, pc) => {
      const component = getComponentDetails(pc.componentId);
      const price = component?.price || 0;
      return sum + (price * pc.quantity * quantity);
    }, 0);
  };

  return (
    <div className="p-6 bg-gray-50 border-t border-gray-200">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-800">Relatório de Produção</h3>
            <p className="text-sm text-gray-500">Análise de componentes necessários</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Quantidade a produzir:</label>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-20 px-3 py-1.5 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                min="1"
              />
            </div>
            <button
              onClick={onExport}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              <FileSpreadsheet size={18} />
              Exportar Excel
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Componente</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Device/Value</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cód. Interno</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Localização</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Qtd/Un</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Total</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Estoque</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Comprar</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Preço Unit.</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {product.components.map((pc, index) => {
                const component = getComponentDetails(pc.componentId);
                if (!component) return null;

                const totalNeeded = pc.quantity * quantity;
                const needToBuy = Math.max(0, totalNeeded - component.quantityInStock);
                const totalPrice = (component.price || 0) * pc.quantity * quantity;

                return (
                  <tr key={index}>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{pc.componentName}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {component.device && component.value ? `${component.device} / ${component.value}` : '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{component.internalCode || '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {component.drawer && component.division ? `${component.drawer}/${component.division}` : '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-center">{pc.quantity}</td>
                    <td className="px-4 py-3 text-sm text-center font-medium">{totalNeeded}</td>
                    <td className="px-4 py-3 text-sm text-center">{component.quantityInStock}</td>
                    <td className="px-4 py-3 text-sm text-center">
                      {needToBuy > 0 ? (
                        <span className="text-red-600 font-medium">{needToBuy}</span>
                      ) : (
                        <span className="text-green-600 font-medium">OK</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-right">{formatCurrency(component.price || 0)}</td>
                    <td className="px-4 py-3 text-sm text-right font-medium">{formatCurrency(totalPrice)}</td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="bg-gray-50">
              <tr>
                <td colSpan={9} className="px-4 py-3 text-sm font-medium text-right">Total Geral:</td>
                <td className="px-4 py-3 text-sm font-bold text-right">{formatCurrency(calculateTotal())}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};

const ProductsListPage: React.FC = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [components, setComponents] = useState<Component[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [deleteModal, setDeleteModal] = useState<{ show: boolean; product?: Product }>({ show: false });
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedProductId, setExpandedProductId] = useState<number | null>(null);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [componentOrder, setComponentOrder] = useState<number[]>([]);

  // Estados para seleção múltipla e exportação cruzada
  const [selectedProducts, setSelectedProducts] = useState<Set<number>>(new Set());
  const [showCrossExportModal, setShowCrossExportModal] = useState(false);

  // Estados de paginação
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(PAGINATION.DEFAULT_PAGE_SIZE);

  useEffect(() => {
    fetchProducts();
    fetchComponents();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const data = await productsService.getAll();
      setProducts(data);
    } catch (error) {
      setError('Erro ao carregar produtos');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchComponents = async () => {
    try {
      const data = await componentsService.getAll();
      setComponents(data);
    } catch (error) {
      console.error('Erro ao carregar componentes:', error);
    }
  };

  const toggleProductExpansion = (productId: number) => {
    setExpandedProductId(expandedProductId === productId ? null : productId);
  };

  const handleExportClick = (product: Product) => {
    setSelectedProduct(product);
    setComponentOrder(product.components.map(c => c.componentId));
    setExportModalOpen(true);
  };

  const handleConfirmExport = (includeValues: boolean, productionQuantity: number = 1) => {
  if (!selectedProduct) return;

  exportService.exportProductWithCustomOrder(
    selectedProduct,
    components,
    componentOrder,
    productionQuantity,
    includeValues
  );
  
  setSuccess('Relatório exportado com sucesso!');
  setExportModalOpen(false);
};

  const handleDelete = async () => {
    if (!deleteModal.product) return;
    
    try {
      await productsService.delete(deleteModal.product.id);
      setSuccess('Produto excluído com sucesso!');
      fetchProducts();
      setDeleteModal({ show: false });
    } catch (error) {
      setError('Erro ao excluir produto');
    }
  };

  const calculateProductTotal = (product: Product) => {
    return product.components.reduce((sum, pc) => {
      const component = components.find(c => c.id === pc.componentId);
      const price = component?.price || 0;
      return sum + (price * pc.quantity);
    }, 0);
  };

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Paginação local
  const startIndex = (pageNumber - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedProducts = filteredProducts.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setPageNumber(page);
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setPageNumber(1);
  };

  // Funções de seleção múltipla
  const handleSelectProduct = (productId: number) => {
    setSelectedProducts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(productId)) {
        newSet.delete(productId);
      } else {
        newSet.add(productId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedProducts.size === filteredProducts.length) {
      setSelectedProducts(new Set());
    } else {
      setSelectedProducts(new Set(filteredProducts.map(p => p.id)));
    }
  };

  const handleCrossExport = () => {
    if (selectedProducts.size < 2) {
      setError('Selecione pelo menos 2 produtos para exportação cruzada');
      return;
    }
    setShowCrossExportModal(true);
  };

  const handleConfirmCrossExport = (mergedComponents: MergedComponent[], includeValues: boolean) => {
    // Criar dados para exportação
    const exportData = mergedComponents.map(comp => {
      const baseData: any = {
        'Código Interno': comp.internalCode || '',
        'Componente': comp.componentName,
        'Device': comp.device || '',
        'Value': comp.value || '',
        'Package': comp.package || '',
        'Características': comp.characteristics || '',
        'Gaveta': comp.drawer || '',
        'Divisão': comp.division || '',
        'Qtd Total': comp.totalQuantity,
        'Produtos': comp.products.join(', ')
      };

      if (includeValues && comp.unitPrice !== undefined) {
        baseData['Preço Unit.'] = comp.unitPrice || 0;
        baseData['Preço Total'] = (comp.unitPrice || 0) * comp.totalQuantity;
      }

      return baseData;
    });

    // Calcular total se incluir valores
    if (includeValues) {
      const totalGeral = mergedComponents.reduce((sum, comp) => 
        sum + ((comp.unitPrice || 0) * comp.totalQuantity), 0
      );

      const totalRow: any = {};
      Object.keys(exportData[0] || {}).forEach(key => {
        if (key === 'Preço Total') {
          totalRow[key] = totalGeral;
        } else if (key === 'Componente') {
          totalRow[key] = 'TOTAL GERAL';
        } else {
          totalRow[key] = '';
        }
      });

      exportData.push(totalRow);
    }

    // Exportar usando XLSX
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Exportação Cruzada');
    
    const filename = `exportacao_cruzada_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, filename);
    
    setSuccess('Exportação cruzada realizada com sucesso!');
    setShowCrossExportModal(false);
    setSelectedProducts(new Set());
  };

  const pageActions = (
    <div className="flex items-center gap-2">
      <button
        onClick={() => navigate('/products/new')}
        className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-200 shadow-sm"
      >
        <Plus size={18} />
        <span className="font-medium">Novo Produto</span>
      </button>
      
      {selectedProducts.size > 0 && (
        <>
          <button
            onClick={handleCrossExport}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg transition-all duration-200 ${
              selectedProducts.size >= 2
                ? 'bg-purple-600 text-white hover:bg-purple-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
            disabled={selectedProducts.size < 2}
          >
            <FileX size={18} />
            <span className="font-medium">Exportação Cruzada ({selectedProducts.size})</span>
          </button>
          
          <button
            onClick={() => setSelectedProducts(new Set())}
            className="px-4 py-2.5 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg"
          >
            Limpar Seleção
          </button>
        </>
      )}
    </div>
  );

  return (
    <div className="p-6">
      {/* Header */}
      <PageHeader
        title="Produtos"
        subtitle="Gerencie os produtos montados"
        icon={Package}
        iconColor="from-green-500 to-green-600"
        actions={pageActions}
      />

      {/* Messages */}
      {error && <ErrorMessage message={error} onClose={() => setError('')} className="mb-6" />}
      {success && <SuccessMessage message={success} onClose={() => setSuccess('')} className="mb-6" />}

      {/* Search */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Buscar produtos por nome..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
          />
        </div>
      </div>

      {/* Products List */}
      <TableWrapper
        loading={loading}
        isEmpty={filteredProducts.length === 0}
        loadingMessage="Carregando produtos..."
        emptyIcon={Package}
        emptyTitle="Nenhum produto encontrado"
        emptyDescription={
          searchTerm 
            ? "Tente ajustar sua busca" 
            : "Crie seu primeiro produto clicando no botão acima"
        }
      >
        {/* Paginação no topo */}
        {filteredProducts.length > 0 && (
          <div className="border-b border-gray-200 bg-gray-50">
            <Pagination
              currentPage={pageNumber}
              pageSize={pageSize}
              totalItems={filteredProducts.length}
              onPageChange={handlePageChange}
              onPageSizeChange={handlePageSizeChange}
              loading={loading}
            />
          </div>
        )}

        <div className="divide-y divide-gray-200">
          {paginatedProducts.map((product) => (
            <div key={product.id}>
              {/* Produto Linha Compacta */}
              <div
                onClick={() => toggleProductExpansion(product.id)}
                className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectProduct(product.id);
                      }}
                      className="text-gray-600 hover:text-gray-800"
                    >
                      {selectedProducts.has(product.id) ? 
                        <CheckSquare size={18} className="text-blue-600" /> : 
                        <Square size={18} />
                      }
                    </div>
                    <ChevronDown 
                      size={20} 
                      className={`text-gray-400 transition-transform ${
                        expandedProductId === product.id ? 'rotate-180' : ''
                      }`}
                    />
                    <div>
                      <h3 className="font-semibold text-gray-900">{product.name}</h3>
                      <p className="text-sm text-gray-500">{product.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Cpu size={16} />
                      <span>{product.components.length} componentes</span>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">Valor Total</p>
                      <p className="font-semibold text-gray-900">{formatCurrency(calculateProductTotal(product))}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/products/${product.id}/edit`);
                        }}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                      >
                        <Pencil size={18} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteModal({ show: true, product });
                        }}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                  <div className="flex items-center gap-1">
                    <Calendar size={12} />
                    Criado em {formatDate(product.createdAt)}
                  </div>
                  {product.createdBy && <span>Por {product.createdBy}</span>}
                </div>
              </div>

              {/* Dropdown Expandido */}
              {expandedProductId === product.id && (
                <ProductionReport
                  product={product}
                  components={components}
                  onExport={() => handleExportClick(product)}
                />
              )}
            </div>
          ))}
        </div>

        {/* Checkbox para selecionar todos */}
        {filteredProducts.length > 0 && (
          <div className="p-4 bg-gray-50 border-t border-gray-200">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedProducts.size === filteredProducts.length}
                onChange={handleSelectAll}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-600">
                Selecionar todos os produtos ({filteredProducts.length})
              </span>
            </label>
          </div>
        )}

        {/* Paginação no final */}
        {filteredProducts.length > 0 && (
          <div className="border-t border-gray-200 bg-gray-50">
            <Pagination
              currentPage={pageNumber}
              pageSize={pageSize}
              totalItems={filteredProducts.length}
              onPageChange={handlePageChange}
              onPageSizeChange={handlePageSizeChange}
              loading={loading}
            />
          </div>
        )}
      </TableWrapper>

      {/* Delete Modal */}
      <ConfirmModal
        isOpen={deleteModal.show}
        onClose={() => setDeleteModal({ show: false })}
        onConfirm={handleDelete}
        title="Excluir Produto"
        message={`Tem certeza que deseja excluir o produto "${deleteModal.product?.name}"? Esta ação não pode ser desfeita.`}
        confirmText="Excluir"
        type="danger"
      />

      {/* Export Modal */}
      {selectedProduct && (
        <ExportModal
          isOpen={exportModalOpen}
          onClose={() => setExportModalOpen(false)}
          product={selectedProduct}
          components={components}
          productOrder={componentOrder}
          onUpdateOrder={setComponentOrder}
          onConfirmExport={handleConfirmExport}
        />
      )}

      {/* Cross Export Modal */}
      {showCrossExportModal && (
        <CrossExportModal
          isOpen={showCrossExportModal}
          onClose={() => setShowCrossExportModal(false)}
          selectedProducts={products.filter(p => selectedProducts.has(p.id))}
          components={components}
          onConfirmExport={handleConfirmCrossExport}
        />
      )}
    </div>
  );
};

export default ProductsListPage;