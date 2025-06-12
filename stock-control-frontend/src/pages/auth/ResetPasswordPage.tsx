import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, Package, Eye, EyeOff, CheckCircle, XCircle } from 'lucide-react';
import { api } from '../../services/api';

const ResetPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);
  const [userEmail, setUserEmail] = useState('');

  // Validações de senha
  const hasMinLength = password.length >= 6;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const passwordsMatch = password === confirmPassword && password !== '';

  useEffect(() => {
    if (token) {
      validateToken();
    } else {
      navigate('/login');
    }
  }, [token]);

  const validateToken = async () => {
    try {
      const response = await api.get(`/auth/validate-token/${token}`);
      setTokenValid(response.data.valid);
      if (response.data.valid) {
        setUserEmail(response.data.email);
      }
    } catch (error) {
      setTokenValid(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!hasMinLength || !hasUpperCase || !hasLowerCase || !hasNumber || !passwordsMatch) {
      setError('Por favor, atenda a todos os requisitos de senha');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await api.post('/auth/reset-password', {
        token,
        newPassword: password,
        confirmPassword
      });

      setSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (error: any) {
      setError(error.response?.data?.message || 'Erro ao resetar senha');
    } finally {
      setLoading(false);
    }
  };

  if (tokenValid === null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (tokenValid === false) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md text-center">
          <XCircle className="text-red-500 w-16 h-16 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Token Inválido ou Expirado</h2>
          <p className="text-gray-600 mb-6">
            Este link de recuperação não é mais válido. Por favor, solicite um novo.
          </p>
          <button
            onClick={() => navigate('/forgot-password')}
            className="w-full py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700"
          >
            Solicitar Novo Link
          </button>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md text-center">
          <CheckCircle className="text-green-500 w-16 h-16 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Senha Alterada com Sucesso!</h2>
          <p className="text-gray-600 mb-6">
            Você será redirecionado para a página de login...
          </p>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
            <Package className="text-white" size={24} />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">PreSystem</h1>
        </div>

        {/* Title */}
        <h2 className="text-xl font-semibold text-center text-gray-800 mb-2">
          Criar Nova Senha
        </h2>
        <p className="text-center text-gray-600 mb-6">
          Digite sua nova senha para {userEmail}
        </p>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-700 font-medium mb-2">Nova Senha</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full pl-10 pr-12 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-gray-700 font-medium mb-2">Confirmar Nova Senha</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full pl-10 pr-12 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Password Requirements */}
          <div className="space-y-2 text-sm">
            <div className={`flex items-center gap-2 ${hasMinLength ? 'text-green-600' : 'text-gray-400'}`}>
              {hasMinLength ? <CheckCircle size={16} /> : <XCircle size={16} />}
              Mínimo 6 caracteres
            </div>
            <div className={`flex items-center gap-2 ${hasUpperCase ? 'text-green-600' : 'text-gray-400'}`}>
              {hasUpperCase ? <CheckCircle size={16} /> : <XCircle size={16} />}
              Uma letra maiúscula
            </div>
            <div className={`flex items-center gap-2 ${hasLowerCase ? 'text-green-600' : 'text-gray-400'}`}>
              {hasLowerCase ? <CheckCircle size={16} /> : <XCircle size={16} />}
              Uma letra minúscula
            </div>
            <div className={`flex items-center gap-2 ${hasNumber ? 'text-green-600' : 'text-gray-400'}`}>
              {hasNumber ? <CheckCircle size={16} /> : <XCircle size={16} />}
              Um número
            </div>
            <div className={`flex items-center gap-2 ${passwordsMatch ? 'text-green-600' : 'text-gray-400'}`}>
              {passwordsMatch ? <CheckCircle size={16} /> : <XCircle size={16} />}
              Senhas coincidem
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !hasMinLength || !hasUpperCase || !hasLowerCase || !hasNumber || !passwordsMatch}
            className="w-full py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition-all duration-200 font-medium shadow-sm flex items-center justify-center gap-2"
          >
            {loading && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            )}
            {loading ? 'Alterando...' : 'Alterar Senha'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPasswordPage;