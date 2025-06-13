import React, { useState, useEffect } from 'react';
import { Check, DollarSign, TrendingDown, AlertTriangle } from 'lucide-react';
import BaseModal from '../common/BaseModal';
import ConfirmModal from '../common/ConfirmModal';
import { Product, Component } from '../../types';
import movementsService from '../../services/movements.service';
import orderingService from '../../services/ordering.service';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product;
  components: Component[];
  productOrder: number[];
  onUpdateOrder: (newOrder: number[]) => void;
  onConfirmExport: (includeValues: boolean, productionQuantity: number) => void;
}

const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  product,
  components,
  productOrder,
  onUpdateOrder,
  onConfirmExport,
}) => {
  const [includeValues, setIncludeValues] = useState(true);
  const [showStockConfirm, setShowStockConfirm] = useState(false);
  const [stockLoading, setStockLoading] = useState(false);
  const [orderInputs, setOrderInputs] = useState<{ [key: number]: number }>({});
  const [productionQuantity, setProductionQuantity] = useState(1);
  const [stockWarnings, setStockWarnings] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen && product) {
      const inputs = orderingService.createOrderInputsFromArray(productOrder);
      setOrderInputs(inputs);
    }
  }, [isOpen, product, productOrder]);

  const getComponentDetails = (componentId: number): Component | undefined => {
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
      setStockWarnings([]);
      
      const productComponents = getProductComponents();
      
      // Criar mapa de componentes para acesso rápido
      const componentMap = new Map(
        components.map(c => [c.id, c])
      );
      
      const movements = productComponents.map(comp => ({
        componentId: comp.componentId,
        movementType: 'Saida' as const,
        quantity: ('quantity' in comp ? comp.quantity : 0) * productionQuantity
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
    const productComponents = getProductComponents();
    const status = {
      hasInsufficientStock: false,
      partialStock: false,
      details: [] as string[]
    };

    productComponents.forEach(pc => {
      const component = getComponentDetails(pc.componentId);
      if (component) {
        const needed = ('quantity' in pc ? pc.quantity : 0) * productionQuantity;
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

  const handleOrderInputChange = (componentId: number, value: string) => {
    const numValue = parseInt(value) || 0;
    setOrderInputs(prev => ({
      ...prev,
      [componentId]: numValue
    }));
  };

  const handleReorder = () => {
    const newOrder = orderingService.sortByOrderInputs(productOrder, orderInputs);
    onUpdateOrder(newOrder);
    
    const newInputs = orderingService.createOrderInputsFromArray(newOrder);
    setOrderInputs(newInputs);
  };

  const getTotalComponents = () => {
    const productComponents = getProductComponents();
    return productComponents.reduce((sum, pc) => {
      const quantity = 'quantity' in pc ? pc.quantity : 0;
      return sum + (quantity * productionQuantity);
    }, 0);
  };

  const stockStatus = getStockStatus();

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
                  {stockStatus.details.map((detail, index) => (
                    <li key={index}>• {detail}</li>
                  ))}
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
                    <th className="px-2 py-2 text-left font-medium text-gray-700">TOTAL</th>
                    <th className="px-2 py-2 text-left font-medium text-gray-700">DEVICE</th>
                    <th className="px-2 py-2 text-left font-medium text-gray-700">VALUE</th>
                    <th className="px-2 py-2 text-left font-medium text-gray-700">PACKAGE</th>
                    <th className="px-2 py-2 text-left font-medium text-gray-700">CÓD.</th>
                    <th className="px-2 py-2 text-left font-medium text-gray-700">GAVETA</th>
                    <th className="px-2 py-2 text-left font-medium text-gray-700">ESTOQUE</th>
                    <th className="px-2 py-2 text-left font-medium text-gray-700">COMPRAR</th>
                    {includeValues && (
                      <th className="px-2 py-2 text-left font-medium text-gray-700">VALOR</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {productOrder.map((componentId, index) => {
                    const productComponent = getProductComponents().find(pc => pc.componentId === componentId);
                    const component = getComponentDetails(componentId);
                    
                    if (!productComponent || !component) return null;
                    
                    const quantity = 'quantity' in productComponent ? productComponent.quantity : 0;
                    const totalNeeded = quantity * productionQuantity;
                    const needToBuy = Math.max(0, totalNeeded - component.quantityInStock);
                    
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
                        <td className="px-2 py-2 text-center">{quantity}</td>
                        <td className="px-2 py-2 text-center font-medium">{totalNeeded}</td>
                        <td className="px-2 py-2">{component.device || '-'}</td>
                        <td className="px-2 py-2">{component.value || '-'}</td>
                        <td className="px-2 py-2">{component.package || '-'}</td>
                        <td className="px-2 py-2">INTC{String(componentId).padStart(4, '0')}</td>
                        <td className="px-2 py-2 text-center">{component.drawer || '-'}</td>
                        <td className={`px-2 py-2 text-center ${component.quantityInStock < totalNeeded ? 'text-orange-600 font-medium' : ''}`}>
                          {component.quantityInStock}
                        </td>
                        <td className={`px-2 py-2 text-center font-medium ${needToBuy > 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {needToBuy || '0'}
                        </td>
                        {includeValues && (
                          <td className="px-2 py-2 text-right">
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
          <button
            onClick={handleReorder}
            className="mt-2 px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Reordenar
          </button>
        </div>

        <div className="mt-3 p-3 bg-gray-50 rounded text-xs text-gray-600">
          <p className="font-semibold mb-1">Ordem automática:</p>
          <ol className="list-decimal list-inside space-y-0.5">
            <li><strong>Ordem manual</strong> (campo "Ordem")</li>
            <li><strong>Value</strong> (ordem numérica crescente)</li>
            <li><strong>Device</strong> (ordem alfabética A-Z)</li>
          </ol>
        </div>

        {/* Avisos de baixa parcial */}
        {stockWarnings.length > 0 && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <h4 className="text-sm font-medium text-red-800 mb-2">Resultado da Baixa:</h4>
            <ul className="text-xs text-red-700 space-y-1">
              {stockWarnings.map((warning, index) => (
                <li key={index}>• {warning}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="p-4 border-t border-gray-200 flex justify-between">
        <button
          onClick={() => setShowStockConfirm(true)}
          className="flex items-center gap-2 px-3 py-1.5 text-sm rounded bg-red-600 text-white hover:bg-red-700"
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
            : `Tem certeza que deseja dar baixa no estoque de ${getTotalComponents()} componentes para produzir ${productionQuantity} unidade(s) de "${product.name}"?`
        }
        confirmText="Confirmar Baixa"
        type="warning"
        isLoading={stockLoading}
      />
    </BaseModal>
  );
};

export default ExportModal;