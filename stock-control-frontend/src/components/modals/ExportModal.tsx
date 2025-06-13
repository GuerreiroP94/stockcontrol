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
      onClose();
    } catch (error) {
      console.error('Erro ao dar baixa no estoque:', error);
      alert('Erro ao processar baixa no estoque');
    } finally {
      setStockLoading(false);
    }
  };

  const handleOrderChange = (componentId: number, newOrder: number) => {
    const validOrder = Math.max(1, Math.min(productOrder.length, newOrder));
    const newOrderInputs = orderingService.updateComponentOrder(
      orderInputs,
      componentId,
      validOrder,
      productOrder
    );
    
    setOrderInputs(newOrderInputs);
    const newOrderArray = orderingService.getSortedComponentIds(newOrderInputs);
    onUpdateOrder(newOrderArray);
  };

  const getTotalComponents = () => {
    return productOrder.length;
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={`Exportar: ${product?.name || 'Produto'}`}
      size="xl"
    >
      <div className="space-y-4">
        {/* Quantidade de Produção */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Quantidade a Produzir
          </label>
          <input
            type="number"
            min="1"
            value={productionQuantity}
            onChange={(e) => setProductionQuantity(Math.max(1, parseInt(e.target.value) || 1))}
            className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Opção de incluir valores */}
        <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
          <button
            onClick={() => setIncludeValues(!includeValues)}
            className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
              includeValues 
                ? 'bg-blue-600 border-blue-600' 
                : 'bg-white border-gray-300 hover:border-gray-400'
            }`}
          >
            {includeValues && <Check size={12} className="text-white" />}
          </button>
          <div className="flex-1">
            <label className="text-sm font-medium text-gray-700 cursor-pointer">
              Incluir valores (R$)?
            </label>
            <p className="text-xs text-gray-500 mt-0.5">
              Marque para incluir os preços dos componentes no relatório
            </p>
          </div>
        </div>

        {/* Avisos de estoque baixo */}
        {stockWarnings.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="text-yellow-600 flex-shrink-0 mt-0.5" size={20} />
              <div className="space-y-1">
                <p className="text-sm font-medium text-yellow-800">Avisos de Estoque</p>
                <div className="text-xs text-yellow-700 space-y-1">
                  {stockWarnings.map((warning, index) => (
                    <p key={index}>{warning}</p>
                  ))}
                </div>
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
                    <th className="px-2 py-2 text-left font-medium text-gray-700">GRUPO</th>
                    <th className="px-2 py-2 text-left font-medium text-gray-700">DEVICE</th>
                    <th className="px-2 py-2 text-left font-medium text-gray-700">VALUE</th>
                    <th className="px-2 py-2 text-left font-medium text-gray-700">PACKAGE</th>
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
                    const totalQuantity = quantity * productionQuantity;
                    const needToBuy = Math.max(0, totalQuantity - component.quantityInStock);
                    
                    return (
                      <tr key={componentId} className="hover:bg-gray-50">
                        <td className="px-2 py-2">
                          <input
                            type="number"
                            min="1"
                            max={getTotalComponents()}
                            value={orderInputs[componentId] || index + 1}
                            onChange={(e) => handleOrderChange(componentId, parseInt(e.target.value) || 1)}
                            className="w-12 px-1 py-0.5 text-center border border-gray-300 rounded"
                          />
                        </td>
                        <td className="px-2 py-2 text-center">{quantity}</td>
                        <td className="px-2 py-2 text-center font-medium">{totalQuantity}</td>
                        <td className="px-2 py-2">{component.group}</td>
                        <td className="px-2 py-2">{component.device || '-'}</td>
                        <td className="px-2 py-2 text-xs">{component.value || '-'}</td>
                        <td className="px-2 py-2 text-xs">{component.package || '-'}</td>
                        <td className="px-2 py-2 text-xs">{component.drawer || '-'}</td>
                        <td className="px-2 py-2 text-center">
                          <span className={`font-medium ${
                            component.quantityInStock < totalQuantity ? 'text-red-600' : 'text-green-600'
                          }`}>
                            {component.quantityInStock}
                          </span>
                        </td>
                        <td className="px-2 py-2 text-center">
                          {needToBuy > 0 && (
                            <span className="text-orange-600 font-medium">{needToBuy}</span>
                          )}
                        </td>
                        {includeValues && (
                          <td className="px-2 py-2 text-right font-medium">
                            R$ {((component.price || 0) * totalQuantity).toFixed(2)}
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Ações */}
        <div className="flex justify-between pt-4 border-t">
          <div className="flex gap-2">
            <button
              onClick={handleConfirm}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
            >
              <DollarSign size={18} />
              Exportar Excel
            </button>
            <button
              onClick={() => setShowStockConfirm(true)}
              className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors flex items-center gap-2"
            >
              <TrendingDown size={18} />
              Dar Baixa no Estoque
            </button>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Cancelar
          </button>
        </div>
      </div>

      {/* Modal de confirmação de baixa */}
      <ConfirmModal
        isOpen={showStockConfirm}
        onClose={() => setShowStockConfirm(false)}
        onConfirm={handleStockMovement}
        title="Confirmar Baixa no Estoque"
        message={
          stockWarnings.length > 0
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