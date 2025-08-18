// stock-control-frontend/src/utils/constants.ts

// Função para determinar a URL base da API
const getApiBaseUrl = (): string => {
  // 1. Primeiro, tenta usar a variável de ambiente
  if (process.env.REACT_APP_API_URL) {
    console.log('🌐 Usando REACT_APP_API_URL:', process.env.REACT_APP_API_URL);
    return process.env.REACT_APP_API_URL;
  }

  // 2. Se estiver em desenvolvimento local
  if (process.env.NODE_ENV === 'development') {
    const localUrl = 'http://localhost:5000/api';
    console.log('🏠 Desenvolvimento local, usando:', localUrl);
    return localUrl;
  }

  // 3. Se estiver em produção, usar URL do Render
  const prodUrl = 'https://stock-control-backend.onrender.com/api';
  console.log('🚀 Produção, usando:', prodUrl);
  return prodUrl;
};

// Exportar a URL da API
export const API_BASE_URL = getApiBaseUrl();

// PAGINATION - ESTA ERA A CONSTANTE QUE ESTAVA FALTANDO!
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 10,
  PAGE_SIZE_OPTIONS: [10, 20, 50, 100]
};

// Rotas da aplicação
export const ROUTES = {
  LOGIN: '/login',
  FORGOT_PASSWORD: '/forgot-password',
  DASHBOARD: '/dashboard',
  COMPONENTS: '/components',
  PRODUCTS: '/products',
  MOVEMENTS: '/movements',
  ALERTS: '/alerts',
  USERS: '/users',
  SETTINGS: '/settings',
};

// Grupos de componentes
export const COMPONENT_GROUPS = [
  'Semicondutor',
  'Resistor',
  'Capacitor',
  'Indutor',
  'Conector',
  'CI',
  'Diodo',
  'Transistor',
  'LED',
  'Outros'
];

// Ambientes de componentes
export const COMPONENT_ENVIRONMENTS = {
  STOCK: 'estoque',
  LAB: 'laboratorio'
} as const;

// Tipos de movimentação
export const MOVEMENT_TYPES = {
  ENTRADA: 'Entrada',
  SAIDA: 'Saida'
} as const;

// Roles de usuário
export const USER_ROLES = {
  ADMIN: 'admin',
  OPERATOR: 'operator'
} as const;

// Mensagens do sistema
export const MESSAGES = {
  LOGIN_SUCCESS: 'Login realizado com sucesso!',
  LOGIN_ERROR: 'Erro ao fazer login. Verifique suas credenciais.',
  LOGOUT_SUCCESS: 'Logout realizado com sucesso!',
  
  COMPONENT_CREATED: 'Componente criado com sucesso!',
  COMPONENT_UPDATED: 'Componente atualizado com sucesso!',
  COMPONENT_DELETED: 'Componente excluído com sucesso!',
  
  PRODUCT_CREATED: 'Produto criado com sucesso!',
  PRODUCT_UPDATED: 'Produto atualizado com sucesso!',
  PRODUCT_DELETED: 'Produto excluído com sucesso!',
  
  MOVEMENT_CREATED: 'Movimentação registrada com sucesso!',
  
  USER_CREATED: 'Usuário criado com sucesso!',
  USER_UPDATED: 'Usuário atualizado com sucesso!',
  USER_DELETED: 'Usuário excluído com sucesso!',
  
  ERROR_GENERIC: 'Ocorreu um erro. Tente novamente.',
  ERROR_NETWORK: 'Erro de conexão. Verifique sua internet.',
  ERROR_UNAUTHORIZED: 'Você não tem permissão para realizar esta ação.',
  ERROR_NOT_FOUND: 'Registro não encontrado.'
};

// Outras constantes do sistema
export const APP_NAME = 'Stock Control System';
export const VERSION = '1.0.0';

// Configurações de timeout
export const REQUEST_TIMEOUT = 10000; // 10 segundos

// Mensagens de erro padrão
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Erro de conexão com o servidor. Verifique sua internet.',
  TIMEOUT_ERROR: 'Tempo limite excedido. Tente novamente.',
  UNAUTHORIZED: 'Não autorizado. Faça login novamente.',
  FORBIDDEN: 'Você não tem permissão para esta ação.',
  NOT_FOUND: 'Recurso não encontrado.',
  SERVER_ERROR: 'Erro interno do servidor. Tente novamente mais tarde.',
  UNKNOWN_ERROR: 'Erro desconhecido. Tente novamente.'
};

// Status codes HTTP
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500
};

// Debug das configurações
console.log('📊 === CONFIGURAÇÕES DA API ===');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('REACT_APP_API_URL:', process.env.REACT_APP_API_URL);
console.log('API_BASE_URL final:', API_BASE_URL);
console.log('window.location.origin:', typeof window !== 'undefined' ? window.location.origin : 'N/A');

// Verificar se a URL está correta
if (!API_BASE_URL.startsWith('http')) {
  console.error('❌ URL da API inválida:', API_BASE_URL);
} else {
  console.log('✅ URL da API configurada corretamente');
}

// Função de debug para testar conectividade
export const testApiConnectivity = async (): Promise<boolean> => {
  try {
    const baseUrl = API_BASE_URL.replace('/api', '');
    const response = await fetch(`${baseUrl}/health`, {
      method: 'GET',
      mode: 'cors',
      credentials: 'include'
    });
    
    const isConnected = response.ok;
    console.log(`🔍 Teste de conectividade: ${isConnected ? '✅' : '❌'}`);
    
    return isConnected;
  } catch (error) {
    console.error('❌ Erro no teste de conectividade:', error);
    return false;
  }
};