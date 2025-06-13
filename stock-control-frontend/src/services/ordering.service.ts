// src/services/ordering.service.ts
class OrderingService {
  // Cria um mapa de inputs de ordem a partir de um array
  createOrderInputsFromArray(orderArray: number[]): { [key: number]: number } {
    const inputs: { [key: number]: number } = {};
    orderArray.forEach((componentId, index) => {
      inputs[componentId] = index + 1;
    });
    return inputs;
  }

  // Atualiza a ordem de um componente específico
  updateComponentOrder(
    currentInputs: { [key: number]: number },
    componentId: number,
    newOrder: number,
    originalOrder: number[]
  ): { [key: number]: number } {
    const totalComponents = originalOrder.length;
    const validOrder = Math.max(1, Math.min(totalComponents, newOrder));
    
    // Cria uma cópia dos inputs atuais
    const newInputs = { ...currentInputs };
    
    // Obtém a ordem atual do componente
    const currentOrder = newInputs[componentId] || 1;
    
    // Se não mudou, retorna como está
    if (currentOrder === validOrder) {
      return newInputs;
    }
    
    // Atualiza a ordem do componente
    newInputs[componentId] = validOrder;
    
    // Ajusta as ordens dos outros componentes
    originalOrder.forEach(id => {
      if (id === componentId) return;
      
      const otherOrder = newInputs[id];
      
      if (currentOrder < validOrder) {
        // Movendo para baixo
        if (otherOrder > currentOrder && otherOrder <= validOrder) {
          newInputs[id] = otherOrder - 1;
        }
      } else {
        // Movendo para cima
        if (otherOrder >= validOrder && otherOrder < currentOrder) {
          newInputs[id] = otherOrder + 1;
        }
      }
    });
    
    return newInputs;
  }

  // Obtém os IDs dos componentes ordenados
  getSortedComponentIds(orderInputs: { [key: number]: number }): number[] {
    return Object.entries(orderInputs)
      .sort(([, orderA], [, orderB]) => orderA - orderB)
      .map(([id]) => Number(id));
  }

  // Reordena um array baseado em drag and drop
  reorderArray<T>(array: T[], fromIndex: number, toIndex: number): T[] {
    const result = [...array];
    const [removed] = result.splice(fromIndex, 1);
    result.splice(toIndex, 0, removed);
    return result;
  }
}

export default new OrderingService();