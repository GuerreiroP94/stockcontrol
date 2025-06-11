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
    getFilteredDevices,
    getFilteredValues,
    getFilteredPackages,
    addGroup,
    addDevice,
    addValue,
    addPackage,
    updateItem,
    deleteItem,
  } = useGroupHierarchy();

  const tabs = [
    { id: 'group' as TabType, name: 'Grupos', icon: Package },
    { id: 'device' as TabType, name: 'Devices', icon: Cpu },
    { id: 'value' as TabType, name: 'Values', icon: Tag },
    { id: 'package' as TabType, name: 'Packages', icon: Box }
  ];

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    // Limpar filtros ao mudar de aba
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

  const handleAdd = (name: string, ...parentIds: number[]) => {
    try {
      switch (activeTab) {
        case 'group':
          addGroup(name);
          break;
        case 'device':
          if (parentIds[0]) {
            addDevice(name, parentIds[0]);
          }
          break;
        case 'value':
          if (parentIds[0] && parentIds[1]) {
            addValue(name, parentIds[0], parentIds[1]);
          }
          break;
        case 'package':
          if (parentIds[0] && parentIds[1] && parentIds[2]) {
            addPackage(name, parentIds[0], parentIds[1], parentIds[2]);
          }
          break;
      }
      setSuccess(`${getTabLabel(activeTab)} criado com sucesso!`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError(`Erro ao criar ${getTabLabel(activeTab)}`);
    }
  };

  const handleUpdate = (id: number, name: string) => {
    try {
      updateItem(activeTab, id, name);
      setSuccess(`${getTabLabel(activeTab)} atualizado com sucesso!`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError(`Erro ao atualizar ${getTabLabel(activeTab)}`);
    }
  };

  const handleDelete = (id: number) => {
    try {
      deleteItem(activeTab, id);
      setSuccess(`${getTabLabel(activeTab)} excluído com sucesso!`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError(`Erro ao excluir ${getTabLabel(activeTab)}`);
    }
  };

  const getTabLabel = (tab: TabType): string => {
    switch (tab) {
      case 'group': return 'Grupo';
      case 'device': return 'Device';
      case 'value': return 'Value';
      case 'package': return 'Package';
    }
  };

  const renderFilters = () => {
    if (activeTab === 'group') return null;

    return (
      <div className="bg-gray-50 p-4 rounded-lg mb-4">
        <p className="text-sm font-medium text-gray-700 mb-3">Filtros Hierárquicos:</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Filtro de Grupo */}
          <div>
            <label className="block text-xs text-gray-500 mb-1">Grupo</label>
            <select
              value={selectedGroupId || ''}
              onChange={(e) => {
                const value = e.target.value ? Number(e.target.value) : undefined;
                setSelectedGroupId(value);
                setSelectedDeviceId(undefined);
                setSelectedValueId(undefined);
              }}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 bg-white"
            >
              <option value="">Todos os Grupos</option>
              {groups.map(group => (
                <option key={group.id} value={group.id}>{group.name}</option>
              ))}
            </select>
          </div>

          {/* Filtro de Device */}
          {(activeTab === 'value' || activeTab === 'package') && (
            <div>
              <label className="block text-xs text-gray-500 mb-1">Device</label>
              <select
                value={selectedDeviceId || ''}
                onChange={(e) => {
                  const value = e.target.value ? Number(e.target.value) : undefined;
                  setSelectedDeviceId(value);
                  setSelectedValueId(undefined);
                }}
                disabled={!selectedGroupId}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 bg-white disabled:bg-gray-100"
              >
                <option value="">Todos os Devices</option>
                {getFilteredDevices(selectedGroupId).map(device => (
                  <option key={device.id} value={device.id}>{device.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Filtro de Value */}
          {activeTab === 'package' && (
            <div>
              <label className="block text-xs text-gray-500 mb-1">Value</label>
              <select
                value={selectedValueId || ''}
                onChange={(e) => {
                  const value = e.target.value ? Number(e.target.value) : undefined;
                  setSelectedValueId(value);
                }}
                disabled={!selectedDeviceId}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 bg-white disabled:bg-gray-100"
              >
                <option value="">Todos os Values</option>
                {getFilteredValues(selectedGroupId, selectedDeviceId).map(value => (
                  <option key={value.id} value={value.id}>{value.name}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>
    );
  };

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
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
            <Settings className="text-white" size={20} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Manutenção de Grupos</h1>
            <p className="text-sm text-gray-500">Gerencie grupos, devices, values e packages</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      {error && <ErrorMessage message={error} onClose={() => setError('')} className="mb-6" />}
      {success && <SuccessMessage message={success} onClose={() => setSuccess('')} className="mb-6" />}

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="flex border-b border-gray-200">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`flex items-center gap-2 px-6 py-4 font-medium transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'text-purple-600 border-b-2 border-purple-600 bg-purple-50'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                }`}
              >
                <Icon size={18} />
                {tab.name}
              </button>
            );
          })}
        </div>

        {/* Filters */}
        <div className="p-6">
          {renderFilters()}
        </div>

        {/* Tab Content */}
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
          devices={getFilteredDevices(selectedGroupId)}
          values={getFilteredValues(selectedGroupId, selectedDeviceId)}
        />
      </div>
    </div>
  );
};

export default GroupsMaintenancePage;