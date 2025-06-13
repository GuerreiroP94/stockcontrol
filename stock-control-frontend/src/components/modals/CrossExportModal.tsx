import React, { useState, useEffect } from 'react';
import { Check, DollarSign, TrendingDown, AlertTriangle } from 'lucide-react';
import BaseModal from '../common/BaseModal';
import ConfirmModal from '../common/ConfirmModal';
import { Product, Component } from '../../types';
import movementsService from '../../services/movements.service';
import orderingService from '../../services/ordering.service';

interface CrossExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedProducts: Product[];
  components: Component[];
  onConfirmExport: (
    productQuantities: { [productId: number]: number },
    mergedComponents: any[],
    componentOrder: number[],
    includeValues: boolean
  ) => void;
}

interface MergedComponent {
  componentId: number;
  totalQuantity: number;
  device?: string;
  value?: string;
  package?: string;
  products: Array<{
    productId: number;
    productName: string;
    quantity: number;
  }>;
}

const CrossExportModal: React.FC<CrossExportModalProps> = ({
  isOpen,
  onClose,
  selectedProducts,
  components,
  onConfirmExport,
}) => {
  const [includeValues, setIncludeValues] = useState(true);
  const [showStockConfirm, setShowStockConfirm] = useState(false);
  const [stockLoading, setStockLoading] = useState(false);
  const [mergedComponents, setMergedComponents] = useState<MergedComponent[]>([]);
  const [componentOrder, setComponentOrder] = useState<number[]>([]);
  const [orderInputs, setOrderInputs] = useState<{ [key: number]: number }>({});
  const [productQuantities, setProductQuantities] = useState<{ [productId: number]: number }>({});
  const [stockWarnings, setStockWarnings] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen && selectedProducts.length > 0) {
      // Inicializar quantidades dos produtos
      const quantities: { [productId: number]: number } = {};
      selectedProducts.forEach(product => {
        quantities[product.id] = 1;
      });
      setProductQuantities(quantities);
      
      // Mesclar componentes
      mergeComponents();
    }
  }, [isOpen, selectedProducts]);

  const getComponentDetails = (componentId: number): Component | undefined => {
    return components.find(c => c.id === componentId);
  };

  const mergeComponents = () => {
    const componentMap = new Map<number, MergedComponent>();
    
    selectedProducts.forEach(product => {
      const quantity = productQuantities[product.id] || 1;
      
      product.components.forEach(pc => {
        const existing = componentMap.get(pc.componentId);
        const component = getComponentDetails(pc.componentId);
        
        if (existing) {
          existing.totalQuantity += pc.quantity * quantity;
          existing.products.push({
            productId: product.id,
            productName: product.name,
            quantity: pc.quantity * quantity
          });
        } else {
          componentMap.set(pc.componentId, {
            componentId: pc.componentId,
            totalQuantity: pc.quantity * quantity,
            device: component?.device,
            value: component?.value,
            package: component?.package,
            products: [{
              productId: product.id,
              productName: product.name,
              quantity: pc.quantity * quantity
            }]
          });
        }
      });
    });
    
    // Converter para array e ordenar
    const merged = Array.from(componentMap.values()).sort((a, b) => {
      // Ordenar por value numérico primeiro
      const aValueNum = parseInt(a.value?.replace(/\D/g, '') || '0');
      const bValueNum = parseInt(b.value?.replace(/\D/g, '') || '0');
      
      if (aValueNum !== bValueNum) {
        return aValueNum - bValueNum;
      }
      
      return (a.device || '').localeCompare(b.device || '');
    });

    setMergedComponents(merged);
    setComponentOrder(merged.map(c => c.componentId));
    
    const inputs = orderingService.createOrderInputsFromArray(merged.map(c => c.componentId));
    setOrderInputs(inputs);
  };

  const handleProductQuantityChange = (productId: number, value: string) => {
    const numValue = parseInt(value) || 1;
    setProductQuantities(prev => ({
      ...prev,
      [productId]: Math.max(1, numValue)
    }));
  };

  const handleOrderInputChange = (componentId: number, value: string) => {
    const numValue = parseInt(value) || 0;
    setOrderInputs(prev => ({
      ...prev,
      [componentId]: numValue
    }));
  };

  const handleReorder = () => {
    const newOrder = orderingService.sortByOrderInputs(componentOrder, orderInputs);
    setComponentOrder(newOrder);
    
    const newInputs = orderingService.createOrderInputsFromArray(newOrder);
    setOrderInputs(newInputs);
  };

  const handleStockMovement = async () => {
    try {
      setStockLoading(true);
      setStockWarnings([]);
      
      // Criar mapa de componentes para acesso rápido
      const componentMap = new Map(
        components.map(c => [c.id, c])
      );
      
      const movements = mergedComponents.map(comp => ({
        componentId: comp.componentId,
        movementType: 'Saida' as const,
        quantity: comp.totalQuantity
      }));

      // Usar o novo método com suporte a baixa parcial
      const result = await movementsService.createBulkPartial(movements, componentMap);
      
      if (result.warnings.length > 0) {
        // Mostrar avisos em um alert mais elaborado
        const warningMessage = `ATENÇÃO - Baixa Parcial Realizada:\n\n${result.warnings.join('\n\n')}`;
        alert(warningMessage);
        
        setStockWarnings(result.warnings);
      } else if (result.success) {
        alert('Baixa no estoque realizada com sucesso!');
      }
      
      setShowStockConfirm(false);
      
      // Só fecha o modal se não houver avisos
      if (result.warnings.length === 0) {
        onClose();
        window.location.reload();
      }
    } catch (error: any) {
      console.error('Erro ao dar baixa no estoque:', error);
      
      if (error.response?.status === 403) {
        alert('Você não tem permissão para dar baixa no estoque. Apenas administradores podem realizar esta ação.');
      } else if (error.response?.data?.message) {
        alert(`Erro: ${error.response.data.message}`);
      } else {
        alert('Erro ao dar baixa no estoque. Tente novamente.');
      }
    } finally {
      setStockLoading(false);
    }
  };

  const getStockStatus = () => {
    const status = {
      hasInsufficientStock: false,
      partialStock: false,
      details: [] as string[]
    };

    mergedComponents.forEach(mc => {
      const component = getComponentDetails(mc.componentId);
      if (component) {
        const needed = mc.totalQuantity;
        const available = component.quantityInStock;
        
        if (available === 0 && needed > 0) {
          status.hasInsufficientStock = true;
          status.details.push(`${component.name}: Sem estoque (necessário: ${needed})`);
        } else if (available < needed) {
          status.partialStock = true;
          status.details.push(`${component.name}: Estoque parcial (disponível: ${available}, necessário: ${needed})`);
        }
      }
    });

    return status;
  };

  const handleConfirm = () => {
    onConfirmExport(productQuantities, mergedComponents, componentOrder, includeValues);
  };

  useEffect(() => {
    if (Object.keys(productQuantities).length > 0) {
      mergeComponents();
    }
  }, [productQuantities]);

  const stockStatus = getStockStatus();

  return (
    <BaseModal 
      isOpen={isOpen} 
      onClose={onClose}
      title="Exportação Cruzada de Produtos"
      size="xl"
    >
      <div className="p-4">
        <p className="text-sm text-gray-500 mb-3">
          Produtos selecionados: <span className="font-medium">{selectedProducts.length}</span>
        </p>
        
        {/* Quantidade por produto */}
        <div className="mb-4">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Defina a quantidade de cada produto:</h3>
          <div className="grid grid-cols-2 gap-2">
            {selectedProducts.map(product => (
              <div key={product.id} className="flex items-center gap-2">
                <label className="text-sm flex-1">{product.name}:</label>
                <input
                  type="number"
                  value={productQuantities[product.id] || 1}
                  onChange={(e) => handleProductQuantityChange(product.id, e.target.value)}
                  className="w-20 px-2 py-1 text-center border border-gray-300 rounded focus:border-blue-500"
                  min="1"
                />
              </div>
            ))}
          </div>
        </div>
        
        <div className="mb-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={includeValues}
              onChange={(e) => setIncludeValues(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded"
            />
            <span className="text-sm text-gray-700 flex items-center gap-1">
              <DollarSign size={16} />
              Incluir valores (R$)?
            </span>
          </label>
        </div>

        {/* Status do estoque */}
        {(stockStatus.hasInsufficientStock || stockStatus.partialStock) && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertTriangle className="text-yellow-600 mt-0.5" size={16} />
              <div className="text-sm">
                <p className="font-medium text-yellow-800 mb-1">
                  Atenção: Estoque insuficiente para alguns componentes
                </p>
                <ul className="text-yellow-700 text-xs space-y-0.5">
                  {stockStatus.details.slice(0, 5).map((detail, index) => (
                    <li key={index}>• {detail}</li>
                  ))}
                  {stockStatus.details.length > 5 && (
                    <li>• ...e mais {stockStatus.details.length - 5} componentes</li>
                  )}
                </ul>
                <p className="text-yellow-700 text-xs mt-2">
                  A baixa será realizada apenas com as quantidades disponíveis.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="mb-4">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Ordem dos Componentes</h3>
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="max-h-64 overflow-y-auto">
              <table className="w-full text-xs">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-2 py-2 text-left font-medium text-gray-700">ORDEM</th>
                    <th className="px-2 py-2 text-left font-medium text-gray-700">QTD</th>
                    <th className="px-2 py-2 text-left font-medium text-gray-700">DEVICE</th>
                    <th className="px-2 py-2 text-left font-medium text-gray-700">VALUE</th>
                    <th className="px-2 py-2 text-left font-medium text-gray-700">PACKAGE</th>
                    <th className="px-2 py-2 text-left font-medium text-gray-700">CÓD.</th>
                    <th className="px-2 py-2 text-left font-medium text-gray-700">GAVETA</th>
                    <th className="px-2 py-2 text-left font-medium text-gray-700">ESTOQUE</th>
                    <th className="px-2 py-2 text-left font-medium text-gray-700">COMPRAR</th>
                    <th className="px-2 py-2 text-left font-medium text-gray-700">UNIDADE</th>
                    {includeValues && (
                      <th className="px-2 py-2 text-left font-medium text-gray-700">TOTAL</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {componentOrder.map((componentId, index) => {
                    const merged = mergedComponents.find(m => m.componentId === componentId);
                    const component = getComponentDetails(componentId);
                    
                    if (!merged || !component) return null;
                    
                    const needToBuy = Math.max(0, merged.totalQuantity - component.quantityInStock);
                    
                    return (
                      <tr key={componentId} className="hover:bg-gray-50">
                        <td className="px-2 py-2">
                          <input
                            type="number"
                            value={orderInputs[componentId] || ''}
                            onChange={(e) => handleOrderInputChange(componentId, e.target.value)}
                            className="w-12 px-1 py-0.5 text-center border border-gray-300 rounded text-xs"
                            placeholder={(index + 1).toString()}
                          />
                        </td>
                        <td className="px-2 py-2 text-center font-medium">{merged.totalQuantity}</td>
                        <td className="px-2 py-2">{component.device || '-'}</td>
                        <td className="px-2 py-2">{component.value || '-'}</td>
                        <td className="px-2 py-2">{component.package || '-'}</td>
                        <td className="px-2 py-2">INTC{String(componentId).padStart(4, '0')}</td>
                        <td className="px-2 py-2 text-center">{component.drawer || '-'}</td>
                        <td className={`px-2 py-2 text-center ${component.quantityInStock < merged.totalQuantity ? 'text-orange-600 font-medium' : ''}`}>
                          {component.quantityInStock}
                        </td>
                        <td className={`px-2 py-2 text-center font-medium ${needToBuy > 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {needToBuy || '0'}
                        </td>
                        <td className="px-2 py-2 text-xs">
                          {merged.products.map((p, i) => (
                            <div key={i} className="truncate" title={`${p.quantity} × ${p.productName}`}>
                              {p.quantity} × {p.productName}
                            </div>
                          ))}
                        </td>
                        {includeValues && (
                          <td className="px-2 py-2 text-right">
                            R$ {((component.price || 0) * merged.totalQuantity).toFixed(2)}
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
          <button
            onClick={handleReorder}
            className="mt-2 px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Reordenar
          </button>
        </div>

        <div className="mt-3 p-3 bg-gray-50 rounded text-xs text-gray-600">
          <p className="mb-1">
            <strong>Total de componentes únicos:</strong> {mergedComponents.length}
          </p>
          <p className="mb-1">
            <strong>Total geral:</strong> {mergedComponents.reduce((sum, m) => sum + m.totalQuantity, 0)} unidades
          </p>
          <p className="text-xs text-gray-500 mt-2">
            <strong>Nota:</strong> Componentes iguais foram agrupados e suas quantidades somadas.
          </p>
        </div>

        {/* Avisos de baixa parcial */}
        {stockWarnings.length > 0 && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <h4 className="text-sm font-medium text-red-800 mb-2">Resultado da Baixa:</h4>
            <ul className="text-xs text-red-700 space-y-1">
              {stockWarnings.slice(0, 10).map((warning, index) => (
                <li key={index}>• {warning}</li>
              ))}
              {stockWarnings.length > 10 && (
                <li>• ...e mais {stockWarnings.length - 10} avisos</li>
              )}
            </ul>
          </div>
        )}
      </div>

      <div className="p-4 border-t border-gray-200 flex justify-between">
        <button
          onClick={() => setShowStockConfirm(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded bg-red-600 text-white hover:bg-red-700"
          title="Dar baixa no estoque (aceita baixa parcial)"
        >
          <TrendingDown size={16} />
          Dar Baixa no Estoque
        </button>
        
        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            className="flex items-center gap-1 px-3 py-1.5 text-sm bg-purple-600 text-white rounded hover:bg-purple-700"
          >
            <Check size={16} />
            Exportar
          </button>
        </div>
      </div>

      <ConfirmModal
        isOpen={showStockConfirm}
        onClose={() => setShowStockConfirm(false)}
        onConfirm={handleStockMovement}
        title="Confirmar Baixa no Estoque"
        message={
          stockStatus.hasInsufficientStock || stockStatus.partialStock
            ? `Alguns componentes não têm estoque suficiente. A baixa será realizada apenas com as quantidades disponíveis. Deseja continuar?`
            : `Tem certeza que deseja dar baixa no estoque de ${mergedComponents.length} componentes? Esta ação criará movimentações de saída para todos os componentes listados.`
        }
        confirmText="Confirmar Baixa"
        type="warning"
        isLoading={stockLoading}
      />
    </BaseModal>
  );
};

export default CrossExportModal;