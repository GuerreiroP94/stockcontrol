import React, { useState, useEffect } from 'react';
import { Check, DollarSign, TrendingDown } from 'lucide-react';
import BaseModal from '../common/BaseModal';
import ConfirmModal from '../common/ConfirmModal';
import { Product, Component, MergedComponent } from '../../types';
import orderingService from '../../services/ordering.service';
import movementsService from '../../services/movements.service';

interface CrossExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedProducts: Product[];
  components: Component[];
  onConfirmExport: (mergedComponents: MergedComponent[], includeValues: boolean, productQuantities: { [productId: number]: number }, componentOrder: number[]) => void;
}

const CrossExportModal: React.FC<CrossExportModalProps> = ({
  isOpen,
  onClose,
  selectedProducts,
  components,
  onConfirmExport
}) => {
  const [includeValues, setIncludeValues] = useState(true);
  const [mergedComponents, setMergedComponents] = useState<MergedComponent[]>([]);
  const [productQuantities, setProductQuantities] = useState<{ [productId: number]: number }>({});
  const [componentOrder, setComponentOrder] = useState<number[]>([]);
  const [orderInputs, setOrderInputs] = useState<{ [key: number]: number }>({});
  const [showStockConfirm, setShowStockConfirm] = useState(false);
  const [stockLoading, setStockLoading] = useState(false);

  useEffect(() => {
    const initialQuantities: { [productId: number]: number } = {};
    selectedProducts.forEach(product => {
      initialQuantities[product.id] = 1;
    });
    setProductQuantities(initialQuantities);
  }, [selectedProducts]);

  useEffect(() => {
    if (selectedProducts.length > 0) {
      mergeComponents();
    }
  }, [selectedProducts, productQuantities, components]);

  const mergeComponents = () => {
    const componentMap = new Map<number, MergedComponent>();

    selectedProducts.forEach(product => {
      const productQty = productQuantities[product.id] || 1;
      
      product.components.forEach(pc => {
        const existing = componentMap.get(pc.componentId);
        const component = components.find(c => c.id === pc.componentId);
        
        if (!component) return;

        if (existing) {
          existing.totalQuantity += pc.quantity * productQty;
          if (!existing.products.includes(product.name)) {
            existing.products.push(product.name);
          }
        } else {
          componentMap.set(pc.componentId, {
            componentId: pc.componentId,
            componentName: pc.componentName || component.name,
            device: component.device,
            value: component.value,
            package: component.package,
            characteristics: component.characteristics,
            internalCode: component.internalCode,
            drawer: component.drawer,
            division: component.division,
            totalQuantity: pc.quantity * productQty,
            products: [product.name],
            unitPrice: component.price
          });
        }
      });
    });

    const merged = Array.from(componentMap.values());
    
    merged.sort((a, b) => {
      const aValueNum = parseFloat(a.value || '0') || 0;
      const bValueNum = parseFloat(b.value || '0') || 0;
      
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
      
      const movements = mergedComponents.map(comp => ({
        componentId: comp.componentId,
        movementType: 'Saida' as const,
        quantity: comp.totalQuantity
      }));

      await movementsService.createBulk({ movements });
      
      setShowStockConfirm(false);
      onClose();
      
      window.location.reload();
    } catch (error) {
      console.error('Erro ao dar baixa no estoque:', error);
      alert('Erro ao dar baixa no estoque. Verifique se há estoque suficiente.');
    } finally {
      setStockLoading(false);
    }
  };

  const handleConfirm = () => {
    onConfirmExport(mergedComponents, includeValues, productQuantities, componentOrder);
  };

  const getTotalCost = () => {
    return mergedComponents.reduce((sum, comp) => 
      sum + ((comp.unitPrice || 0) * comp.totalQuantity), 0
    );
  };

  const getComponentDetails = (componentId: number) => {
    return components.find(c => c.id === componentId);
  };

  const hasInsufficientStock = () => {
    return mergedComponents.some(comp => {
      const component = getComponentDetails(comp.componentId);
      return component && component.quantityInStock < comp.totalQuantity;
    });
  };

  return (
    <BaseModal 
      isOpen={isOpen} 
      onClose={onClose}
      title="Exportação Cruzada de Produtos"
      size="lg"
    >
      <div className="p-4">
        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-2">
            Produtos selecionados: <strong>{selectedProducts.length}</strong>
          </p>
          <div className="bg-blue-50 rounded p-3">
            <h3 className="text-xs font-semibold text-gray-700 mb-2">Defina a quantidade de cada produto:</h3>
            <div className="grid grid-cols-2 gap-2 max-h-24 overflow-y-auto">
              {selectedProducts.map(p => (
                <div key={p.id} className="flex items-center justify-between bg-white rounded px-2 py-1 border border-blue-200">
                  <span className="text-xs font-medium text-gray-700 truncate flex-1 mr-2" title={p.name}>{p.name}</span>
                  <input
                    type="number"
                    value={productQuantities[p.id] || 1}
                    onChange={(e) => handleProductQuantityChange(p.id, e.target.value)}
                    className="w-14 px-1 py-0.5 text-xs text-center rounded border border-gray-300"
                    min="1"
                  />
                </div>
              ))}
            </div>
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

        <div className="flex justify-between items-center mb-3">
          <h3 className="text-sm font-semibold text-gray-700">Ordem dos Componentes</h3>
          <button
            onClick={handleReorder}
            className="text-sm px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Reordenar
          </button>
        </div>

        {/* Tabela de componentes mesclados ajustada */}
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <div className="max-h-80 overflow-y-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0 z-10">
                <tr>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase w-16">Ordem</th>
                  <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase w-12">QTD</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Device</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Value</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Package</th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase">Cód.</th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase w-16">Gaveta</th>
                  <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase w-16">Estoque</th>
                  <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase w-16">Comprar</th>
                  {includeValues && (
                    <>
                      <th className="px-2 py-2 text-right text-xs font-medium text-gray-500 uppercase w-20">Unit.</th>
                      <th className="px-2 py-2 text-right text-xs font-medium text-gray-500 uppercase w-20">Total</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {componentOrder.map((compId, index) => {
                  const comp = mergedComponents.find(c => c.componentId === compId);
                  if (!comp) return null;
                  
                  const component = getComponentDetails(comp.componentId);
                  const currentStock = component?.quantityInStock || 0;
                  const needToBuy = Math.max(0, comp.totalQuantity - currentStock);

                  return (
                    <tr key={compId} className="hover:bg-gray-50">
                      <td className="px-2 py-2">
                        <input
                          type="number"
                          value={orderInputs[compId] || ''}
                          onChange={(e) => handleOrderInputChange(compId, e.target.value)}
                          className="w-12 px-1 py-0.5 text-xs text-center border rounded"
                          min="1"
                          placeholder={String(index + 1)}
                        />
                      </td>
                      <td className="px-2 py-2 text-xs font-bold text-blue-600 text-center">
                        {comp.totalQuantity}
                      </td>
                      <td className="px-3 py-2 text-xs truncate max-w-[100px]" title={comp.device || '-'}>{comp.device || '-'}</td>
                      <td className="px-3 py-2 text-xs font-medium truncate max-w-[100px]" title={comp.value || '-'}>{comp.value || '-'}</td>
                      <td className="px-3 py-2 text-xs truncate max-w-[80px]" title={comp.package || '-'}>{comp.package || '-'}</td>
                      <td className="px-2 py-2 text-xs truncate max-w-[80px]" title={comp.internalCode || '-'}>{comp.internalCode || '-'}</td>
                      <td className="px-2 py-2 text-xs">{comp.drawer || '-'}</td>
                      <td className="px-2 py-2 text-xs text-center">{currentStock}</td>
                      <td className={`px-2 py-2 text-xs text-center font-medium ${needToBuy > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {needToBuy || '0'}
                      </td>
                      {includeValues && (
                        <>
                          <td className="px-2 py-2 text-xs text-right">
                            R$ {(comp.unitPrice || 0).toFixed(2)}
                          </td>
                          <td className="px-2 py-2 text-xs text-right font-medium">
                            R$ {((comp.unitPrice || 0) * comp.totalQuantity).toFixed(2)}
                          </td>
                        </>
                      )}
                    </tr>
                  );
                })}
              </tbody>
              {includeValues && (
                <tfoot className="bg-gray-50">
                  <tr>
                    <td colSpan={9} className="px-2 py-2 text-xs font-medium text-right">
                      Total Geral:
                    </td>
                    <td colSpan={2} className="px-2 py-2 text-xs font-bold text-right">
                      R$ {getTotalCost().toFixed(2)}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>

        <div className="mt-3 p-2 bg-yellow-50 rounded">
          <p className="text-xs text-yellow-800">
            <strong>Nota:</strong> Componentes iguais foram agrupados e suas quantidades somadas.
          </p>
        </div>
      </div>

      <div className="p-4 border-t border-gray-200 flex justify-between">
        <button
          onClick={() => setShowStockConfirm(true)}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded ${
            hasInsufficientStock() 
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
              : 'bg-red-600 text-white hover:bg-red-700'
          }`}
          disabled={hasInsufficientStock()}
          title={hasInsufficientStock() ? 'Estoque insuficiente' : 'Dar baixa no estoque'}
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
        message={`Tem certeza que deseja dar baixa no estoque de ${mergedComponents.length} componentes? Esta ação criará movimentações de saída para todos os componentes listados.`}
        confirmText="Confirmar Baixa"
        type="warning"
        isLoading={stockLoading}
      />
    </BaseModal>
  );
};

export default CrossExportModal;