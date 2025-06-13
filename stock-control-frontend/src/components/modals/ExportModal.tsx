import React, { useState, useEffect } from 'react';
import { DollarSign, TrendingDown, AlertTriangle } from 'lucide-react';
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
    } catch (error: any) {
      console.error('Erro ao dar baixa no estoque:', error);
      if (error.response?.status === 403) {
        alert('Acesso negado. Apenas administradores podem realizar esta ação.');
      } else if (error.response?.data?.message) {
        alert(`Erro: ${error.response.data.message}`);
      } else {
        alert('Erro ao dar baixa no estoque. Tente novamente.');
      }
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

  const getTotalValue = () => {
    return productOrder.reduce((total, componentId) => {
      const productComponent = getProductComponents().find(pc => pc.componentId === componentId);
      const component = getComponentDetails(componentId);
      if (productComponent && component) {
        const quantity = productComponent.quantity * productionQuantity;
        return total + (component.price || 0) * quantity;
      }
      return total;
    }, 0);
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={`Exportar: ${product?.name || 'Produto'}`}
      size="xl"
    >
      <div className="p-4">
        {/* Quantidade a produzir */}
        <div className="mb-4">
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-gray-700">
              Quantidade a Produzir:
            </label>
            <input
              type="number"
              min="1"
              value={productionQuantity}
              onChange={(e) => setProductionQuantity(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-20 px-2 py-1 text-center border border-gray-300 rounded focus:border-blue-500"
            />
          </div>
        </div>

        {/* Checkbox incluir valores */}
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
            <span className="text-xs text-gray-500 ml-2">
              Marque para incluir os preços dos componentes no relatório
            </span>
          </label>
        </div>

        {/* Avisos de estoque */}
        {stockWarnings.length > 0 && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertTriangle size={20} className="text-yellow-600 mt-0.5" />
              <div className="text-sm text-yellow-800">
                <p className="font-medium mb-1">Avisos de Estoque:</p>
                {stockWarnings.map((warning, idx) => (
                  <p key={idx} className="mb-0.5">• {warning}</p>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Ordem dos Componentes */}
        <div className="mb-4">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Ordem dos Componentes</h3>
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-3 py-2 text-left font-medium text-gray-700">ORDEM</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-700">QTD</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-700">DEVICE</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-700">VALUE</th>
                  <th className="px-3 py-2 text-center font-medium text-gray-700">PACKAGE</th>
                  <th className="px-3 py-2 text-center font-medium text-gray-700">CÓD.</th>
                  <th className="px-3 py-2 text-center font-medium text-gray-700">GAVETA</th>
                  <th className="px-3 py-2 text-center font-medium text-gray-700">ESTOQUE</th>
                  <th className="px-3 py-2 text-center font-medium text-gray-700">COMPRAR</th>
                  <th className="px-3 py-2 text-center font-medium text-gray-700">UNIDADE</th>
                  {includeValues && (
                    <th className="px-3 py-2 text-right font-medium text-gray-700">TOTAL</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {productOrder.map((componentId, index) => {
                  const productComponent = getProductComponents().find(pc => pc.componentId === componentId);
                  const component = getComponentDetails(componentId);
                  
                  if (!productComponent || !component) return null;
                  
                  const baseQuantity = productComponent.quantity;
                  const totalQuantity = baseQuantity * productionQuantity;
                  const needToBuy = Math.max(0, totalQuantity - component.quantityInStock);
                  
                  return (
                    <tr key={componentId} className="hover:bg-gray-50">
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          value={orderInputs[componentId] || index + 1}
                          onChange={(e) => handleOrderChange(componentId, parseInt(e.target.value) || 1)}
                          className="w-12 px-1 py-0.5 text-center border border-gray-300 rounded"
                          min="1"
                          max={productOrder.length}
                        />
                      </td>
                      <td className="px-3 py-2 text-center">{baseQuantity}</td>
                      <td className="px-3 py-2">{component.device || '-'}</td>
                      <td className="px-3 py-2">{component.value || '-'}</td>
                      <td className="px-3 py-2 text-center">{component.package || '-'}</td>
                      <td className="px-3 py-2 text-center">{component.internalCode || '-'}</td>
                      <td className="px-3 py-2 text-center">{component.drawer || '-'}</td>
                      <td className="px-3 py-2 text-center">
                        <span className={`font-medium ${
                          component.quantityInStock < totalQuantity ? 'text-red-600' : 'text-green-600'
                        }`}>
                          {component.quantityInStock}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-center">
                        {needToBuy > 0 && (
                          <span className="text-orange-600 font-medium">{needToBuy}</span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-center">
                        {productionQuantity > 1 ? `1 × ${productionQuantity}` : '1'}
                      </td>
                      {includeValues && (
                        <td className="px-3 py-2 text-right font-medium">
                          R$ {((component.price || 0) * totalQuantity).toFixed(2)}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
              {includeValues && (
                <tfoot className="bg-gray-50 border-t-2 border-gray-200">
                  <tr>
                    <td colSpan={10} className="px-3 py-2 text-right font-medium">
                      Total Geral:
                    </td>
                    <td className="px-3 py-2 text-right font-bold text-green-600">
                      R$ {getTotalValue().toFixed(2)}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
          <div className="mt-2 flex justify-between items-center text-xs text-gray-500">
            <span>Total de componentes únicos: {getTotalComponents()}</span>
            <span>Total geral: {product?.components?.reduce((sum, pc) => sum + pc.quantity, 0) || 0} unidades</span>
          </div>
          <p className="mt-2 text-xs text-gray-500">
            Nota: Componentes iguais foram agrupados e suas quantidades somadas.
          </p>
        </div>

        {/* Botões de ação */}
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