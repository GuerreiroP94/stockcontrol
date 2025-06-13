import { api } from './api';
import { StockMovement, StockMovementCreate, StockMovementQueryParameters } from '../types';

// Interface para resultado de baixa parcial
export interface PartialStockResult {
  success: boolean;
  totalRequested: number;
  totalProcessed: number;
  partialMovements: Array<{
    componentId: number;
    componentName: string;
    requested: number;
    processed: number;
    available: number;
    status: 'full' | 'partial' | 'unavailable';
  }>;
  warnings: string[];
}

interface BulkStockMovementDto {
  movements: Array<{
    componentId: number;
    movementType: 'Entrada' | 'Saida';
    quantity: number;
  }>;
  allowPartial?: boolean; // Nova flag para permitir baixa parcial
}

interface BulkMovementResultDto {
  success: boolean;
  totalMovements: number;
  successCount: number;
  errorCount: number;
  errors: string[];
  alertsGenerated: number[];
}

class MovementsService {
  async getAll(params?: StockMovementQueryParameters): Promise<StockMovement[]> {
    const response = await api.get<StockMovement[]>('/stockmovement', { params });
    return response.data;
  }

  async getByComponentId(componentId: number): Promise<StockMovement> {
    const response = await api.get<StockMovement>(`/stockmovement/component/${componentId}`);
    return response.data;
  }

  async create(data: StockMovementCreate): Promise<StockMovement> {
    const response = await api.post<StockMovement>('/stockmovement', data);
    return response.data;
  }

  async createBulk(data: BulkStockMovementDto): Promise<BulkMovementResultDto> {
    const response = await api.post<BulkMovementResultDto>('/stockmovement/bulk', data);
    return response.data;
  }

  /**
   * Cria movimentações com suporte a baixa parcial
   */
  async createBulkPartial(
    movements: Array<{
      componentId: number;
      movementType: 'Entrada' | 'Saida';
      quantity: number;
    }>,
    components: Map<number, any>
  ): Promise<PartialStockResult> {
    const result: PartialStockResult = {
      success: true,
      totalRequested: 0,
      totalProcessed: 0,
      partialMovements: [],
      warnings: []
    };

    // Preparar movimentações ajustadas
    const adjustedMovements: Array<{
      componentId: number;
      movementType: 'Entrada' | 'Saida';
      quantity: number;
    }> = [];

    movements.forEach(mov => {
      const component = components.get(mov.componentId);
      if (!component) {
        result.warnings.push(`Componente ID ${mov.componentId} não encontrado`);
        return;
      }

      result.totalRequested += mov.quantity;

      if (mov.movementType === 'Saida') {
        const available = component.quantityInStock || 0;
        const toProcess = Math.min(mov.quantity, available);

        if (toProcess === 0) {
          result.partialMovements.push({
            componentId: mov.componentId,
            componentName: component.name,
            requested: mov.quantity,
            processed: 0,
            available: 0,
            status: 'unavailable'
          });
          result.warnings.push(`${component.name}: Estoque zerado. Necessário comprar ${mov.quantity} unidades.`);
        } else if (toProcess < mov.quantity) {
          adjustedMovements.push({
            ...mov,
            quantity: toProcess
          });
          result.totalProcessed += toProcess;
          result.partialMovements.push({
            componentId: mov.componentId,
            componentName: component.name,
            requested: mov.quantity,
            processed: toProcess,
            available: available,
            status: 'partial'
          });
          result.warnings.push(
            `${component.name}: Estoque parcial. Baixa de ${toProcess} de ${mov.quantity} solicitadas. ` +
            `Estoque zerado! Necessário comprar ${mov.quantity - toProcess} unidades.`
          );
        } else {
          adjustedMovements.push(mov);
          result.totalProcessed += mov.quantity;
          result.partialMovements.push({
            componentId: mov.componentId,
            componentName: component.name,
            requested: mov.quantity,
            processed: mov.quantity,
            available: available,
            status: 'full'
          });
        }
      } else {
        // Entrada sempre processa total
        adjustedMovements.push(mov);
        result.totalProcessed += mov.quantity;
      }
    });

    // Enviar apenas movimentações válidas
    if (adjustedMovements.length > 0) {
      try {
        const bulkResult = await this.createBulk({
          movements: adjustedMovements,
          allowPartial: true
        });

        if (!bulkResult.success) {
          result.success = false;
          result.warnings.push(...bulkResult.errors);
        }
      } catch (error: any) {
        result.success = false;
        result.warnings.push(error.message || 'Erro ao processar movimentações');
      }
    }

    // Adicionar mensagem final se houver componentes sem estoque
    if (result.warnings.length > 0) {
      result.warnings.push('\n⚠️ Para verificar componentes sem estoque e gerar relatório de compra, acesse a página de Alertas.');
    }

    return result;
  }
}

export default new MovementsService();