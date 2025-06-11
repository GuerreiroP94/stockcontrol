/**
 * Retorna as classes CSS baseadas no status do estoque
 */
export const getStockStatusClasses = (current: number, minimum: number): string => {
  if (current === 0) {
    return 'bg-red-100 text-red-800';
  }
  if (current <= minimum) {
    return 'bg-yellow-100 text-yellow-800';
  }
  return 'bg-green-100 text-green-800';
};

/**
 * Retorna as classes CSS baseadas no tipo de movimento
 */
export const getMovementTypeClasses = (type: 'Entrada' | 'Saida'): string => {
  return type === 'Entrada' 
    ? 'bg-green-100 text-green-800' 
    : 'bg-red-100 text-red-800';
};

/**
 * Retorna as classes CSS baseadas no ambiente
 */
export const getEnvironmentClasses = (environment?: string): string => {
  return environment === 'laboratorio' 
    ? 'bg-purple-100 text-purple-800' 
    : 'bg-green-100 text-green-800';
};

/**
 * Retorna o label do ambiente
 */
export const getEnvironmentLabel = (environment?: string): string => {
  return environment === 'laboratorio' ? 'Laboratório' : 'Estoque';
};