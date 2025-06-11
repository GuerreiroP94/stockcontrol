import React, { useState, useEffect } from 'react';
import { Check, DollarSign, TrendingDown } from 'lucide-react';
import BaseModal from '../common/BaseModal';
import ConfirmModal from '../common/ConfirmModal';
import { Component, Product, ProductComponentCreate } from '../../types';
import movementsService from '../../services/movements.service';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | { name: string; components: ProductComponentCreate[] };
  components: Component[];
  productOrder: number[];
  onUpdateOrder: (order: number[]) => void;
  onConfirmExport: (includeValues: boolean, productionQuantity?: number) => void;
}

const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  product,
  components,
  productOrder,
  onUpdateOrder,
  onConfirmExport
}) => {
  const [includeValues, setIncludeValues] = useState(true);
  const [orderedComponents, setOrderedComponents] = useState<number[]>([]);
  const [orderInputs, setOrderInputs] = useState<{ [key: number]: number }>({});
  const [productionQuantity, setProductionQuantity] = useState(1);
  const [showStockConfirm, setShowStockConfirm] = useState(false);
  const [stockLoading, setStockLoading] = useState(false);

  useEffect(() => {
    const sortedComponents = orderComponentsAutomatically();
    setOrderedComponents(sortedComponents);
    onUpdateOrder(sortedComponents);
  }, [product, components]);

  const orderComponentsAutomatically = (): number[] => {
    const productComponents = getProductComponents();
    
    const componentsWithInfo = productComponents.map(pc => {
      const component = components.find(c => c.id === pc.componentId);
      return {
        componentId: pc.componentId,
        order: orderInputs[pc.componentId] || 999,
        value: component?.value || '',
        device: component?.device || ''
      };
    });

    componentsWithInfo.sort((a, b) => {
      if (a.order !== b.order) {
        return a.order - b.order;
      }
      
      const aValueNum = parseFloat(a.value) || 0;
      const bValueNum = parseFloat(b.value) || 0;
      if (aValueNum !== bValueNum) {
        return aValueNum - bValueNum;
      }
      
      return a.device.localeCompare(b.device);
    });

    return componentsWithInfo.map(c => c.componentId);
  };

  const handleOrderInputChange = (componentId: number, value: string) => {
    const numValue = parseInt(value) || 0;
    setOrderInputs(prev => ({
      ...prev,
      [componentId]: numValue
    }));
  };

  const handleReorder = () => {
    const sorted = orderComponentsAutomatically();
    setOrderedComponents(sorted);
    onUpdateOrder(sorted);
  };

  const getComponentDetails = (componentId: number) => {
    return components.find(c => c.id === componentId);
  };

  const getProductComponents = () => {
    if (!product || !('components' in product) || !Array.isArray(product.components)) {
      return [];
    }
    return product.components;
  };

  const handleConfirm = () => {
    onConfirmExport(includeValues, productionQuantity);
  };

  const handleStockMovement = async () => {
    try {
      setStockLoading(true);
      
      const productComponents = getProductComponents();
      
      const movements = productComponents.map(comp => ({
        componentId: comp.componentId,
        movementType: 'Saida' as const,
        quantity: ('quantity' in comp ? comp.quantity : 0) * productionQuantity
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

  const hasInsufficientStock = () => {
    const productComponents = getProductComponents();
    return productComponents.some(pc => {
      const component = getComponentDetails(pc.componentId);
      const quantity = 'quantity' in pc ? pc.quantity : 0;
      return component && component.quantityInStock < (quantity * productionQuantity);
    });
  };

  const getTotalComponents = () => {
    const productComponents = getProductComponents();
    return productComponents.reduce((sum, pc) => {
      const quantity = 'quantity' in pc ? pc.quantity : 0;
      return sum + (quantity * productionQuantity);
    }, 0);
  };

  return (
    <BaseModal 
      isOpen={isOpen} 
      onClose={onClose}
      title={`Exportar: ${product.name}`}
      size="lg"
    >
      <div className="p-4">
        <p className="text-sm text-gray-500 mb-3">Configure as opções de exportação</p>
        
        <div className="flex items-center gap-4 mb-4">
          <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
            Quantidade a produzir:
          </label>
          <input
            type="number"
            value={productionQuantity}
            onChange={(e) => setProductionQuantity(Math.max(1, parseInt(e.target.value) || 1))}
            className="w-20 px-2 py-1 text-center border border-gray-300 rounded focus:border-blue-500"
            min="1"
          />
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

        {/* Tabela de componentes ajustada */}
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <div className="max-h-80 overflow-y-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0 z-10">
                <tr>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase w-16">Ordem</th>
                  <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase w-12">Qtd</th>
                  <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase w-14">Total</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Device</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Value</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Package</th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase">Cód.</th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase w-16">Gaveta</th>
                  <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase w-16">Estoque</th>
                  <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase w-16">Comprar</th>
                  {includeValues && (
                    <th className="px-2 py-2 text-right text-xs font-medium text-gray-500 uppercase w-20">Valor</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {orderedComponents.map((compId, index) => {
                  const productComponents = getProductComponents();
                  const pc = productComponents.find((c: any) => c.componentId === compId);
                  if (!pc) return null;
                  
                  const component = getComponentDetails(pc.componentId);
                  if (!component) return null;

                  const quantity = 'quantity' in pc ? pc.quantity : 0;
                  const totalNeeded = quantity * productionQuantity;
                  const needToBuy = Math.max(0, totalNeeded - component.quantityInStock);

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
                      <td className="px-2 py-2 text-xs text-center">{quantity}</td>
                      <td className="px-2 py-2 text-xs font-medium text-center">{totalNeeded}</td>
                      <td className="px-3 py-2 text-xs truncate max-w-[100px]" title={component.device || '-'}>{component.device || '-'}</td>
                      <td className="px-3 py-2 text-xs font-medium truncate max-w-[100px]" title={component.value || '-'}>{component.value || '-'}</td>
                      <td className="px-3 py-2 text-xs truncate max-w-[80px]" title={component.package || '-'}>{component.package || '-'}</td>
                      <td className="px-2 py-2 text-xs truncate max-w-[80px]" title={component.internalCode || '-'}>{component.internalCode || '-'}</td>
                      <td className="px-2 py-2 text-xs">{component.drawer || '-'}</td>
                      <td className="px-2 py-2 text-xs text-center">{component.quantityInStock}</td>
                      <td className={`px-2 py-2 text-xs text-center font-medium ${needToBuy > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {needToBuy || '0'}
                      </td>
                      {includeValues && (
                        <td className="px-2 py-2 text-xs text-right">
                          R$ {((component.price || 0) * totalNeeded).toFixed(2)}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-3 p-3 bg-gray-50 rounded text-xs text-gray-600">
          <p className="font-semibold mb-1">Ordem automática:</p>
          <ol className="list-decimal list-inside space-y-0.5">
            <li><strong>Ordem manual</strong> (campo "Ordem")</li>
            <li><strong>Value</strong> (ordem numérica crescente)</li>
            <li><strong>Device</strong> (ordem alfabética A-Z)</li>
          </ol>
        </div>
      </div>

      <div className="p-4 border-t border-gray-200 flex justify-between">
        <button
          onClick={() => setShowStockConfirm(true)}
          className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded ${
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
        message={`Tem certeza que deseja dar baixa no estoque de ${getTotalComponents()} componentes para produzir ${productionQuantity} unidade(s) de "${product.name}"?`}
        confirmText="Confirmar Baixa"
        type="warning"
        isLoading={stockLoading}
      />
    </BaseModal>
  );
};

export default ExportModal;