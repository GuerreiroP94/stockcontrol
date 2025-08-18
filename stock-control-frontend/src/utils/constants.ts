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

// Debug das configurações
console.log('📊 === CONFIGURAÇÕES DA API ===');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('REACT_APP_API_URL:', process.env.REACT_APP_API_URL);
console.log('API_BASE_URL final:', API_BASE_URL);
console.log('window.location.origin:', window.location.origin);

// Verificar se a URL está correta
if (!API_BASE_URL.startsWith('http')) {
  console.error('❌ URL da API inválida:', API_BASE_URL);
} else {
  console.log('✅ URL da API configurada corretamente');
}

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