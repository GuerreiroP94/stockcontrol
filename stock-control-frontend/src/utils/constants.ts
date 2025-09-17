// stock-control-frontend/src/utils/constants.ts

// 🚀 CORREÇÃO PARA PRODUÇÃO NO RENDER
const getApiBaseUrl = (): string => {
  // 1. Primeiro, verificar se há variável de ambiente do build
  if (process.env.REACT_APP_API_URL) {
    console.log('🔧 Usando REACT_APP_API_URL:', process.env.REACT_APP_API_URL);
    return process.env.REACT_APP_API_URL;
  }

  // 2. Detecção baseada no hostname atual
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    
    console.log('🔍 Hostname detectado:', hostname);
    
    // Se estiver no Render (contém 'onrender.com')
    if (hostname.includes('onrender.com') || hostname.includes('render.com')) {
      const renderUrl = 'https://stock-control-backend.onrender.com/api';
      console.log('🚀 PRODUÇÃO RENDER detectada:', renderUrl);
      return renderUrl;
    }
    
    // Se estiver em localhost
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      const localUrl = 'http://localhost:5123/api';
      console.log('🏠 DESENVOLVIMENTO LOCAL detectado:', localUrl);
      return localUrl;
    }
  }

  // 3. Fallback para produção
  const fallbackUrl = 'https://stock-control-backend.onrender.com/api';
  console.log('⚠️ Usando fallback para produção:', fallbackUrl);
  return fallbackUrl;
};

export const API_BASE_URL = getApiBaseUrl();

// 🚨 LOG FORÇADO PARA DEBUG
console.log('🔧 === CONFIGURAÇÃO DE PRODUÇÃO ===');
console.log('API_BASE_URL final:', API_BASE_URL);
console.log('window.location.href:', typeof window !== 'undefined' ? window.location.href : 'N/A');
console.log('Environment:', process.env.NODE_ENV);

// Resto das constantes...
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 10,
  PAGE_SIZE_OPTIONS: [10, 20, 50, 100]
};

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

export const COMPONENT_ENVIRONMENTS = {
  STOCK: 'estoque',
  LAB: 'laboratorio'
} as const;

export const MOVEMENT_TYPES = {
  ENTRADA: 'Entrada',
  SAIDA: 'Saida'
} as const;

export const USER_ROLES = {
  ADMIN: 'admin',
  OPERATOR: 'operator'
} as const;

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

export const APP_NAME = 'Stock Control System';
export const VERSION = '1.0.0';
export const REQUEST_TIMEOUT = 10000;

export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Erro de conexão com o servidor. Verifique sua internet.',
  TIMEOUT_ERROR: 'Tempo limite excedido. Tente novamente.',
  UNAUTHORIZED: 'Não autorizado. Faça login novamente.',
  FORBIDDEN: 'Você não tem permissão para esta ação.',
  NOT_FOUND: 'Recurso não encontrado.',
  SERVER_ERROR: 'Erro interno do servidor. Tente novamente mais tarde.',
  UNKNOWN_ERROR: 'Erro desconhecido. Tente novamente.'
};

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

// 🧪 FUNÇÃO DE TESTE PARA PRODUÇÃO
export const testBackendConnection = async (): Promise<{
  success: boolean;
  message: string;
  details: any;
}> => {
  try {
    console.log('🧪 Testando backend:', API_BASE_URL);
    
    // Teste de health check
    const healthUrl = API_BASE_URL.replace('/api', '/health');
    const response = await fetch(healthUrl, {
      method: 'GET',
      mode: 'cors'
    });
    
    if (response.ok) {
      const data = await response.json();
      return {
        success: true,
        message: 'Backend conectado com sucesso!',
        details: data
      };
    } else {
      return {
        success: false,
        message: `Backend retornou status ${response.status}`,
        details: { status: response.status, statusText: response.statusText }
      };
    }
  } catch (error) {
    return {
      success: false,
      message: `Erro ao conectar com o backend: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
      details: { error }
    };
  }
};