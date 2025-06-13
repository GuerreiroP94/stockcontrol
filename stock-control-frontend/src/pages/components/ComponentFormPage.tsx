import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Cpu } from 'lucide-react';
import componentsService from '../../services/components.service';
import { ComponentCreate } from '../../types';
import { useGroupHierarchy } from '../../hooks/useGroupHierarchy';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';

const ComponentFormPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const {
    groups,
    devices,
    values,
    packages,
    getFilteredDevices,
    getFilteredValues,
    getFilteredPackages,
  } = useGroupHierarchy();
  
  const [formData, setFormData] = useState<ComponentCreate>({
    name: '',
    description: '',
    group: '',
    device: '',
    value: '',
    package: '',
    quantityInStock: 0,
    minimumQuantity: 0,
    price: 0,
    environment: 'estoque',
    drawer: '',
    division: '',
    ncm: '',
    nve: '',
    internalCode: '',
    characteristics: ''
  });

  // Estados para controlar hierarquia
  const [selectedGroupId, setSelectedGroupId] = useState<number | undefined>();
  const [selectedDeviceId, setSelectedDeviceId] = useState<number | undefined>();
  const [selectedValueId, setSelectedValueId] = useState<number | undefined>();

  useEffect(() => {
    if (isEditing && id) {
      fetchComponent(Number(id));
    }
  }, [id, isEditing]);

  const fetchComponent = async (componentId: number) => {
    try {
      setLoading(true);
      const component = await componentsService.getById(componentId);
      setFormData({
        name: component.name,
        description: component.description || '',
        group: component.group,
        device: component.device || '',
        value: component.value || '',
        package: component.package || '',
        quantityInStock: component.quantityInStock,
        minimumQuantity: component.minimumQuantity,
        price: component.price || 0,
        environment: component.environment || 'estoque',
        drawer: component.drawer || '',
        division: component.division || '',
        ncm: component.ncm || '',
        nve: component.nve || '',
        internalCode: component.internalCode || '',
        characteristics: component.characteristics || ''
      });
      
      // Configurar seleções hierárquicas se editando
      const group = groups.find(g => g.name === component.group);
      if (group) {
        setSelectedGroupId(group.id);
        const device = devices.find(d => d.name === component.device && d.groupId === group.id);
        if (device) {
          setSelectedDeviceId(device.id);
          const value = values.find(v => v.name === component.value && v.deviceId === device.id);
          if (value) {
            setSelectedValueId(value.id);
          }
        }
      }
    } catch (error) {
      setError('Erro ao carregar componente');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Validações obrigatórias em cascata
    if (!formData.group) {
      setError('Grupo é obrigatório');
      return;
    }
    
    if (!formData.device) {
      setError('Device é obrigatório');
      return;
    }
    
    if (!formData.value) {
      setError('Value é obrigatório');
      return;
    }
    
    // Usar o device como name se não tiver name
    const dataToSubmit = {
      ...formData,
      name: formData.device // Usar device como name
    };
    
    try {
      setSaving(true);
      
      if (isEditing && id) {
        await componentsService.update(Number(id), dataToSubmit);
      } else {
        await componentsService.create(dataToSubmit);
      }
      
      navigate('/components');
    } catch (error: any) {
      if (error.response?.data?.errors) {
        const errorMessages = Object.values(error.response.data.errors).flat().join(', ');
        setError(errorMessages);
      } else {
        setError(error.message || 'Erro ao salvar componente');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: keyof ComponentCreate, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleGroupChange = (groupId: string) => {
    const group = groups.find(g => g.id === Number(groupId));
    if (group) {
      setSelectedGroupId(group.id);
      setFormData(prev => ({ 
        ...prev, 
        group: group.name,
        device: '',
        value: '',
        package: ''
      }));
      setSelectedDeviceId(undefined);
      setSelectedValueId(undefined);
    }
  };

  const handleDeviceChange = (deviceId: string) => {
    const device = devices.find(d => d.id === Number(deviceId));
    if (device) {
      setSelectedDeviceId(device.id);
      setFormData(prev => ({ 
        ...prev, 
        device: device.name,
        value: '',
        package: ''
      }));
      setSelectedValueId(undefined);
    }
  };

  const handleValueChange = (valueId: string) => {
    const value = values.find(v => v.id === Number(valueId));
    if (value) {
      setSelectedValueId(value.id);
      setFormData(prev => ({ 
        ...prev, 
        value: value.name,
        package: ''
      }));
    }
  };

  const handlePackageChange = (packageId: string) => {
    const pkg = packages.find(p => p.id === Number(packageId));
    if (pkg) {
      setFormData(prev => ({ ...prev, package: pkg.name }));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-2">
          <button
            onClick={() => navigate('/components')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-2xl font-bold text-gray-800">
            {isEditing ? 'Editar Componente' : 'Novo Componente'}
          </h1>
        </div>
      </div>

      {error && <ErrorMessage message={error} onClose={() => setError('')} />}

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="space-y-6">
          {/* Seção: Hierarquia - OBRIGATÓRIA */}
          <div>
            <h2 className="text-lg font-semibold text-gray-800 mb-4 pb-4 border-b border-gray-200 flex items-center gap-2">
              <Cpu size={20} />
              Classificação Hierárquica
              <span className="text-sm text-red-500 font-normal">* Obrigatório</span>
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Grupo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Grupo *
                </label>
                <select
                  value={selectedGroupId || ''}
                  onChange={(e) => handleGroupChange(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 bg-white"
                  required
                >
                  <option value="">Selecione um grupo</option>
                  {groups.map(group => (
                    <option key={group.id} value={group.id}>{group.name}</option>
                  ))}
                </select>
              </div>

              {/* Device */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Device *
                </label>
                <select
                  value={selectedDeviceId || ''}
                  onChange={(e) => handleDeviceChange(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 bg-white disabled:bg-gray-100"
                  required
                  disabled={!selectedGroupId}
                >
                  <option value="">Selecione um device</option>
                  {getFilteredDevices(selectedGroupId).map(device => (
                    <option key={device.id} value={device.id}>{device.name}</option>
                  ))}
                </select>
              </div>

              {/* Value */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Value *
                </label>
                <select
                  value={selectedValueId || ''}
                  onChange={(e) => handleValueChange(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 bg-white disabled:bg-gray-100"
                  required
                  disabled={!selectedDeviceId}
                >
                  <option value="">Selecione um value</option>
                  {getFilteredValues(selectedGroupId, selectedDeviceId).map(value => (
                    <option key={value.id} value={value.id}>{value.name}</option>
                  ))}
                </select>
              </div>

              {/* Package (Opcional) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Package
                </label>
                <select
                  value={formData.package}
                  onChange={(e) => handlePackageChange(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 bg-white disabled:bg-gray-100"
                  disabled={!selectedValueId}
                >
                  <option value="">Selecione um package (opcional)</option>
                  {getFilteredPackages(selectedGroupId, selectedDeviceId, selectedValueId).map(pkg => (
                    <option key={pkg.id} value={pkg.id}>{pkg.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Seção: Informações Básicas */}
          <h2 className="text-lg font-semibold text-gray-800 mb-4 pb-4 border-b border-gray-200">
            Informações Básicas
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
            {/* Código Interno */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Código Interno
              </label>
              <input
                type="text"
                value={formData.internalCode}
                onChange={(e) => handleChange('internalCode', e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                placeholder="Código interno"
              />
            </div>

            {/* Data (readonly) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Data de Cadastro
              </label>
              <input
                type="text"
                value={isEditing ? 'Data do cadastro original' : new Date().toLocaleDateString('pt-BR')}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-gray-50 cursor-not-allowed"
                disabled
              />
            </div>

            {/* Ambiente */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ambiente *
              </label>
              <select
                value={formData.environment}
                onChange={(e) => handleChange('environment', e.target.value as 'estoque' | 'laboratorio')}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 bg-white"
                required
              >
                <option value="estoque">Estoque</option>
                <option value="laboratorio">Laboratório</option>
              </select>
            </div>
          </div>

          {/* Seção: Quantidades e Valores */}
          <h2 className="text-lg font-semibold text-gray-800 mb-4 pb-4 border-b border-gray-200">
            Quantidades e Valores
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {/* Quantidade em Estoque */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quantidade em Estoque *
              </label>
              <input
                type="number"
                min="0"
                value={formData.quantityInStock}
                onChange={(e) => handleChange('quantityInStock', parseInt(e.target.value) || 0)}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                required
              />
            </div>

            {/* Quantidade Mínima */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quantidade Mínima *
              </label>
              <input
                type="number"
                min="0"
                value={formData.minimumQuantity}
                onChange={(e) => handleChange('minimumQuantity', parseInt(e.target.value) || 0)}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                required
              />
            </div>

            {/* Preço Unitário */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Preço Unitário (R$)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.price}
                onChange={(e) => handleChange('price', parseFloat(e.target.value) || 0)}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
              />
            </div>
          </div>

          {/* Seção: Localização */}
          <h2 className="text-lg font-semibold text-gray-800 mb-4 pb-4 border-b border-gray-200">
            Localização
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Gaveta */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Gaveta
              </label>
              <input
                type="text"
                value={formData.drawer}
                onChange={(e) => handleChange('drawer', e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                placeholder="Ex: A1, B2, C3"
              />
            </div>

            {/* Divisão */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Divisão
              </label>
              <input
                type="text"
                value={formData.division}
                onChange={(e) => handleChange('division', e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                placeholder="Ex: 1, 2, 3"
              />
            </div>
          </div>

          {/* Seção: Informações Fiscais */}
          <h2 className="text-lg font-semibold text-gray-800 mb-4 pb-4 border-b border-gray-200">
            Informações Fiscais
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* NCM */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                NCM
              </label>
              <input
                type="text"
                value={formData.ncm}
                onChange={(e) => handleChange('ncm', e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                placeholder="00000000"
              />
            </div>

            {/* NVE */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                NVE
              </label>
              <input
                type="text"
                value={formData.nve}
                onChange={(e) => handleChange('nve', e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                placeholder="AA0001"
              />
            </div>
          </div>

          {/* Características */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Características
            </label>
            <textarea
              value={formData.characteristics}
              onChange={(e) => handleChange('characteristics', e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
              rows={3}
              placeholder="Descreva as características técnicas do componente..."
            />
          </div>

          {/* Descrição */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descrição Adicional
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
              rows={4}
              placeholder="Informações adicionais sobre o componente..."
            />
          </div>

          {/* Botões */}
          <div className="flex justify-end gap-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => navigate('/components')}
              className="px-6 py-2.5 text-gray-700 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-all duration-200"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition-all duration-200 shadow-sm"
            >
              {saving ? (
                <>
                  <LoadingSpinner size="sm" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save size={18} />
                  {isEditing ? 'Atualizar' : 'Salvar'}
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default ComponentFormPage;