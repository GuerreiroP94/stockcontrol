// stock-control-frontend/src/pages/components/GroupsMaintenancePage.tsx
import React, { useState } from 'react';
import { Settings, Package, Cpu, Tag, Box } from 'lucide-react';
import { useGroupHierarchy } from '../../hooks/useGroupHierarchy';
import TabCRUD from '../../components/common/TabCRUD';
import ErrorMessage from '../../components/common/ErrorMessage';
import SuccessMessage from '../../components/common/SuccessMessage';

type TabType = 'group' | 'device' | 'value' | 'package';

const GroupsMaintenancePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('group');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Filtros hierárquicos
  const [selectedGroupId, setSelectedGroupId] = useState<number | undefined>();
  const [selectedDeviceId, setSelectedDeviceId] = useState<number | undefined>();
  const [selectedValueId, setSelectedValueId] = useState<number | undefined>();

  const {
    groups,
    devices,
    values,
    packages,
    loading,
    error: hierarchyError,
    getFilteredDevices,
    getFilteredValues,
    getFilteredPackages,
    addGroup,
    addDevice,
    addValue,
    addPackage,
    updateItem,
    deleteItem,
    reloadHierarchy
  } = useGroupHierarchy();

  const tabs = [
    { id: 'group' as TabType, name: 'Grupos', icon: Package },
    { id: 'device' as TabType, name: 'Devices', icon: Cpu },
    { id: 'value' as TabType, name: 'Values', icon: Tag },
    { id: 'package' as TabType, name: 'Packages', icon: Box }
  ];

  // 🔧 FUNÇÃO AUXILIAR PARA LABELS
  const getTabLabel = (tab: TabType): string => {
    switch (tab) {
      case 'group': return 'Grupo';
      case 'device': return 'Device';
      case 'value': return 'Value';
      case 'package': return 'Package';
      default: return 'Item';
    }
  };

  // 🔧 FUNÇÃO PARA MUDAR TAB
  const handleTabChange = (tab: TabType) => {
    console.log('🔄 Mudando para tab:', tab);
    setActiveTab(tab);
    setError('');
    setSuccess('');
    
    // Reset dos filtros baseado na hierarquia
    if (tab === 'group') {
      setSelectedGroupId(undefined);
      setSelectedDeviceId(undefined);
      setSelectedValueId(undefined);
    } else if (tab === 'device') {
      setSelectedDeviceId(undefined);
      setSelectedValueId(undefined);
    } else if (tab === 'value') {
      setSelectedValueId(undefined);
    }
  };

  // 🚀 FUNÇÃO HANDLEADD CORRIGIDA COM ASYNC/AWAIT
  const handleAdd = async (name: string, ...parentIds: number[]) => {
    console.log('🚀 HandleAdd chamado:', { name, parentIds, activeTab });
    
    if (!name?.trim()) {
      setError('Nome é obrigatório');
      return;
    }

    setError('');
    setSuccess('');

    try {
      console.log(`🚀 Criando ${activeTab}:`, name.trim(), 'Parent IDs:', parentIds);

      switch (activeTab) {
        case 'group':
          await addGroup(name.trim());
          break;
          
        case 'device':
          if (!parentIds[0]) {
            setError('Selecione um grupo primeiro');
            return;
          }
          await addDevice(name.trim(), parentIds[0]);
          break;
          
        case 'value':
          if (!parentIds[0] || !parentIds[1]) {
            setError('Selecione um grupo e device primeiro');
            return;
          }
          await addValue(name.trim(), parentIds[0], parentIds[1]);
          break;
          
        case 'package':
          if (!parentIds[0] || !parentIds[1] || !parentIds[2]) {
            setError('Selecione um grupo, device e value primeiro');
            return;
          }
          await addPackage(name.trim(), parentIds[0], parentIds[1], parentIds[2]);
          break;
          
        default:
          throw new Error(`Tipo de tab não suportado: ${activeTab}`);
      }

      console.log(`✅ ${getTabLabel(activeTab)} criado com sucesso!`);
      setSuccess(`${getTabLabel(activeTab)} "${name}" criado com sucesso!`);
      setTimeout(() => setSuccess(''), 5000);
      
    } catch (error: any) {
      console.error(`❌ Erro ao criar ${getTabLabel(activeTab)}:`, error);
      
      let errorMessage = `Erro ao criar ${getTabLabel(activeTab)}`;
      
      // 🔧 TRATAMENTO MELHORADO DE ERROS
      if (typeof error === 'string') {
        errorMessage = error;
      } else if (error?.message) {
        errorMessage = error.message;
      } else if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error?.response?.data?.Message) { // C# usa 'Message' com M maiúsculo
        errorMessage = error.response.data.Message;
      } else if (error?.response?.status === 403) {
        errorMessage = 'Acesso negado. Apenas administradores podem criar itens.';
      } else if (error?.response?.status === 400) {
        errorMessage = 'Dados inválidos. Verifique se o nome já existe.';
      } else if (error?.response?.status === 401) {
        errorMessage = 'Sessão expirada. Faça login novamente.';
      } else if (error?.response?.status === 404) {
        errorMessage = 'Endpoint não encontrado. Verifique a configuração da API.';
      } else if (error?.response?.status >= 500) {
        errorMessage = 'Erro interno do servidor. Tente novamente mais tarde.';
      }
      
      console.error('❌ Mensagem de erro final:', errorMessage);
      setError(errorMessage);
      setTimeout(() => setError(''), 8000);
    }
  };

  // 🔧 FUNÇÃO HANDLEUPDATE CORRIGIDA
  const handleUpdate = async (id: number, name: string) => {
    console.log('🔄 HandleUpdate chamado:', { id, name, activeTab });
    
    if (!name?.trim()) {
      setError('Nome é obrigatório');
      return;
    }

    setError('');
    setSuccess('');

    try {
      await updateItem(activeTab, id, name.trim());
      console.log(`✅ ${getTabLabel(activeTab)} atualizado com sucesso!`);
      setSuccess(`${getTabLabel(activeTab)} atualizado com sucesso!`);
      setTimeout(() => setSuccess(''), 5000);
      
    } catch (error: any) {
      console.error(`❌ Erro ao atualizar ${activeTab}:`, error);
      
      let errorMessage = `Erro ao atualizar ${getTabLabel(activeTab)}`;
      
      if (typeof error === 'string') {
        errorMessage = error;
      } else if (error?.message) {
        errorMessage = error.message;
      } else if (error?.response?.status === 403) {
        errorMessage = 'Acesso negado. Apenas administradores podem editar.';
      } else if (error?.response?.status === 400) {
        errorMessage = 'Dados inválidos.';
      } else if (error?.response?.status === 404) {
        errorMessage = 'Item não encontrado.';
      }
      
      console.error('❌ Erro de atualização:', errorMessage);
      setError(errorMessage);
      setTimeout(() => setError(''), 8000);
    }
  };

  // 🔧 FUNÇÃO HANDLEDELETE CORRIGIDA
  const handleDelete = async (id: number) => {
    console.log('🗑️ HandleDelete chamado:', { id, activeTab });
    
    setError('');
    setSuccess('');

    try {
      await deleteItem(activeTab, id);
      console.log(`✅ ${getTabLabel(activeTab)} excluído com sucesso!`);
      setSuccess(`${getTabLabel(activeTab)} excluído com sucesso!`);
      setTimeout(() => setSuccess(''), 5000);
      
    } catch (error: any) {
      console.error(`❌ Erro ao deletar ${activeTab}:`, error);
      
      let errorMessage = `Erro ao excluir ${getTabLabel(activeTab)}`;
      
      if (typeof error === 'string') {
        errorMessage = error;
      } else if (error?.message) {
        errorMessage = error.message;
      } else if (error?.response?.status === 403) {
        errorMessage = 'Acesso negado. Apenas administradores podem excluir.';
      } else if (error?.response?.status === 400) {
        errorMessage = 'Este item não pode ser excluído pois possui dependências.';
      } else if (error?.response?.status === 404) {
        errorMessage = 'Item não encontrado.';
      }
      
      console.error('❌ Erro de exclusão:', errorMessage);
      setError(errorMessage);
      setTimeout(() => setError(''), 8000);
    }
  };

  // 🔧 FUNÇÃO PARA OBTER ITENS FILTRADOS
  const getFilteredItems = () => {
    switch (activeTab) {
      case 'group':
        return groups;
      case 'device':
        return getFilteredDevices(selectedGroupId);
      case 'value':
        return getFilteredValues(selectedGroupId, selectedDeviceId);
      case 'package':
        return getFilteredPackages(selectedGroupId, selectedDeviceId, selectedValueId);
      default:
        return [];
    }
  };

  // 🔧 FUNÇÃO PARA RENDERIZAR FILTROS
  const renderFilters = () => {
    return (
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* Filtro de Grupo - Sempre visível exceto na tab group */}
          {activeTab !== 'group' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filtrar por Grupo
              </label>
              <select
                value={selectedGroupId || ''}
                onChange={(e) => {
                  const groupId = e.target.value ? Number(e.target.value) : undefined;
                  setSelectedGroupId(groupId);
                  setSelectedDeviceId(undefined);
                  setSelectedValueId(undefined);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Todos os grupos</option>
                {groups.map(group => (
                  <option key={group.id} value={group.id}>
                    {group.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Filtro de Device - Visível para value e package */}
          {(activeTab === 'value' || activeTab === 'package') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filtrar por Device
              </label>
              <select
                value={selectedDeviceId || ''}
                onChange={(e) => {
                  const deviceId = e.target.value ? Number(e.target.value) : undefined;
                  setSelectedDeviceId(deviceId);
                  setSelectedValueId(undefined);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={!selectedGroupId}
              >
                <option value="">Todos os devices</option>
                {getFilteredDevices(selectedGroupId).map(device => (
                  <option key={device.id} value={device.id}>
                    {device.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Filtro de Value - Visível apenas para package */}
          {activeTab === 'package' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filtrar por Value
              </label>
              <select
                value={selectedValueId || ''}
                onChange={(e) => {
                  const valueId = e.target.value ? Number(e.target.value) : undefined;
                  setSelectedValueId(valueId);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={!selectedDeviceId}
              >
                <option value="">Todos os values</option>
                {getFilteredValues(selectedGroupId, selectedDeviceId).map(value => (
                  <option key={value.id} value={value.id}>
                    {value.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Botão de Reload Manual */}
        <div className="mt-4 flex justify-end">
          <button
            onClick={() => {
              console.log('🔄 Reload manual da hierarquia');
              reloadHierarchy();
            }}
            className="px-4 py-2 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
          >
            🔄 Atualizar Dados
          </button>
        </div>
      </div>
    );
  };

  // 🔧 EXIBIR LOADING
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando dados da hierarquia...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-blue-100 rounded-lg">
          <Settings className="h-6 w-6 text-blue-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Manutenção de Grupos
          </h1>
          <p className="text-gray-600">
            Gerencie grupos, devices, values e packages
          </p>
        </div>
      </div>

      {/* Mensagens de Erro e Sucesso */}
      {error && <ErrorMessage message={error} />}
      {success && <SuccessMessage message={success} />}
      {hierarchyError && <ErrorMessage message={hierarchyError} />}

      {/* Content */}
      <div className="bg-white rounded-lg shadow">
        {/* Tabs */}
        <div className="border-b border-gray-200">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`inline-flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50 border-transparent'
                }`}
              >
                <Icon size={18} />
                {tab.name}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="p-6">
          {renderFilters()}
          
          <TabCRUD
            type={activeTab}
            items={getFilteredItems()}
            onAdd={handleAdd}
            onUpdate={handleUpdate}
            onDelete={handleDelete}
            filters={{
              groupId: selectedGroupId,
              deviceId: selectedDeviceId,
              valueId: selectedValueId,
            }}
            groups={groups}
            devices={devices}
            values={values}
          />
        </div>
      </div>

      {/* Debug Info - Remover em produção */}
      {process.env.NODE_ENV === 'development' && (
        <div className="bg-gray-100 rounded-lg p-4 text-xs">
          <h4 className="font-bold mb-2">🔧 Debug Info:</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <strong>Active Tab:</strong> {activeTab}<br/>
              <strong>Groups:</strong> {groups.length}<br/>
              <strong>Devices:</strong> {devices.length}<br/>
              <strong>Values:</strong> {values.length}<br/>
              <strong>Packages:</strong> {packages.length}
            </div>
            <div>
              <strong>Selected Group:</strong> {selectedGroupId || 'Nenhum'}<br/>
              <strong>Selected Device:</strong> {selectedDeviceId || 'Nenhum'}<br/>
              <strong>Selected Value:</strong> {selectedValueId || 'Nenhum'}<br/>
              <strong>Filtered Items:</strong> {getFilteredItems().length}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GroupsMaintenancePage;