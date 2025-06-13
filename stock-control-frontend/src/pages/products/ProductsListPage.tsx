import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Package,
  Plus,
  Search,
  Pencil,
  Trash2,
  FileSpreadsheet,
  ChevronDown,
  Calendar,
  AlertCircle,
  Cpu,
  CheckSquare,
  Square,
  Grid,
  X
} from 'lucide-react';
import { Product, Component, ProductWithPriority } from '../../types';
import productsService from '../../services/products.service';
import componentsService from '../../services/components.service';
import exportService from '../../services/export.service';
import PageHeader from '../../components/common/PageHeader';
import ErrorMessage from '../../components/common/ErrorMessage';
import SuccessMessage from '../../components/common/SuccessMessage';
import ConfirmModal from '../../components/common/ConfirmModal';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Pagination from '../../components/common/Pagination';
import TableWrapper from '../../components/common/TableWrapper';
import ExportModal from '../../components/modals/ExportModal';
import CrossExportModal from '../../components/modals/CrossExportModal';
import { formatCurrency, formatDate } from '../../utils/helpers';
import { PAGINATION } from '../../utils/constants';

// Componente inline para o relatório de produção expandido
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
    return product.components.reduce((total, pc) => {
      const component = getComponentDetails(pc.componentId);
      if (!component) return total;
      return total + ((component.price || 0) * pc.quantity * quantity);
    }, 0);
  };

  return (
    <div className="bg-gray-50 p-6 border-t">
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-sm font-semibold text-gray-700">Relatório de Produção</h4>
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
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Grupo</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Device</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Value</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Package</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Localização</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Qtd/Uni</th>
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
                const location = [component.drawer, component.division].filter(Boolean).join(' / ') || '-';

                return (
                  <tr key={index}>
                    <td className="px-4 py-3 text-sm text-gray-900">{component.group || '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{component.device || '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{component.value || '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{component.package || '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{location}</td>
                    <td className="px-4 py-3 text-sm text-center">{pc.quantity}</td>
                    <td className="px-4 py-3 text-sm text-center font-medium">{totalNeeded}</td>
                    <td className="px-4 py-3 text-sm text-center">{component.quantityInStock}</td>
                    <td className="px-4 py-3 text-sm text-center">
                      {needToBuy > 0 ? (
                        <span className="text-red-600 font-medium">{needToBuy}</span>
                      ) : (
                        <span className="text-green-600 font-medium">0</span>
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
                <td colSpan={10} className="px-4 py-3 text-sm font-medium text-right">Total Geral:</td>
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
      console.error(error);
    }
  };

  const calculateProductTotal = (product: Product) => {
    return product.components.reduce((total, pc) => {
      const component = components.find(c => c.id === pc.componentId);
      if (!component) return total;
      return total + ((component.price || 0) * pc.quantity);
    }, 0);
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (product.description && product.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleSelectProduct = (productId: number) => {
    const newSelected = new Set(selectedProducts);
    if (newSelected.has(productId)) {
      newSelected.delete(productId);
    } else {
      newSelected.add(productId);
    }
    setSelectedProducts(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedProducts.size === filteredProducts.length) {
      setSelectedProducts(new Set());
    } else {
      setSelectedProducts(new Set(filteredProducts.map(p => p.id)));
    }
  };

  const handleCrossExport = () => {
    if (selectedProducts.size === 0) {
      setError('Selecione pelo menos um produto para exportação cruzada');
      return;
    }
    setShowCrossExportModal(true);
  };

  const handleConfirmCrossExport = (
    productQuantities: { [key: number]: number },
    mergedComponents: any[],
    componentOrder: number[],
    includeValues: boolean
  ) => {
    const selectedProductsData = products.filter(p => selectedProducts.has(p.id));
    
    exportService.exportCrossProducts(
      selectedProductsData,
      components,
      productQuantities,
      mergedComponents,
      componentOrder,
      includeValues
    );
    
    setSuccess('Relatório de exportação cruzada gerado com sucesso!');
    setShowCrossExportModal(false);
    setSelectedProducts(new Set());
  };

  // Paginação
  const totalPages = Math.ceil(filteredProducts.length / pageSize);
  const paginatedProducts = filteredProducts.slice(
    (pageNumber - 1) * pageSize,
    pageNumber * pageSize
  );

  const handlePageChange = (page: number) => {
    setPageNumber(page);
    setExpandedProductId(null);
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setPageNumber(1);
    setExpandedProductId(null);
  };

  const pageActions = (
    <>
      <button
        onClick={() => navigate('/products/new')}
        className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200"
      >
        <Plus size={18} />
        <span className="font-medium">Novo Produto</span>
      </button>
      
      {selectedProducts.size > 0 && (
        <button
          onClick={handleCrossExport}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg hover:from-purple-600 hover:to-purple-700 transition-all duration-200"
        >
          <Grid size={18} />
          <span className="font-medium">Exportação Cruzada ({selectedProducts.size})</span>
        </button>
      )}
    </>
  );

  return (
    <div className="p-6">
      <PageHeader
        title="Produtos"
        subtitle="Gerencie produtos e suas composições"
        icon={Package}
        iconColor="from-purple-500 to-purple-600"
        actions={pageActions}
      />

      {error && <ErrorMessage message={error} onClose={() => setError('')} className="mb-6" />}
      {success && <SuccessMessage message={success} onClose={() => setSuccess('')} className="mb-6" />}

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Buscar produtos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
          />
        </div>
      </div>

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
        message={`Tem certeza que deseja excluir o produto "${deleteModal.product?.name}"?`}
        type="danger"
      />

      {/* Export Modal */}
      {selectedProduct && (
        <ExportModal
          isOpen={exportModalOpen}
          onClose={() => setExportModalOpen(false)}
          product={selectedProduct}
          components={components}
          componentOrder={componentOrder}
          onOrderChange={setComponentOrder}
          onConfirm={handleConfirmExport}
        />
      )}

      {/* Cross Export Modal */}
      <CrossExportModal
        isOpen={showCrossExportModal}
        onClose={() => setShowCrossExportModal(false)}
        selectedProducts={products.filter(p => selectedProducts.has(p.id))}
        components={components}
        onConfirmExport={handleConfirmCrossExport}
      />
    </div>
  );
};

export default ProductsListPage;