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
    setError('');
    setSuccess('');
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
          if (parentIds[0]) addDevice(name, parentIds[0]);
          break;
        case 'value':
          if (parentIds[0] && parentIds[1]) addValue(name, parentIds[0], parentIds[1]);
          break;
        case 'package':
          if (parentIds[0] && parentIds[1] && parentIds[2]) addPackage(name, parentIds[0], parentIds[1], parentIds[2]);
          break;
      }
      setSuccess(`${activeTab} criado com sucesso!`);
    } catch (error: any) {
      setError(error.message || 'Erro ao criar item');
    }
  };

  const handleUpdate = (id: number, name: string) => {
    try {
      updateItem(activeTab, id, name);
      setSuccess(`${activeTab} atualizado com sucesso!`);
    } catch (error: any) {
      setError(error.message || 'Erro ao atualizar item');
    }
  };

  const handleDelete = (id: number) => {
    try {
      deleteItem(activeTab, id);
      setSuccess(`${activeTab} excluído com sucesso!`);
    } catch (error: any) {
      setError(error.message || 'Erro ao excluir item');
    }
  };

  const getFilteredItems = () => {
    switch (activeTab) {
      case 'group': return groups;
      case 'device': return getFilteredDevices(selectedGroupId);
      case 'value': return getFilteredValues(selectedGroupId, selectedDeviceId);
      case 'package': return getFilteredPackages(selectedGroupId, selectedDeviceId, selectedValueId);
    }
  };

  return (
    <div className="p-6">
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

      {error && <ErrorMessage message={error} onClose={() => setError('')} className="mb-6" />}
      {success && <SuccessMessage message={success} onClose={() => setSuccess('')} className="mb-6" />}

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
                    ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                }`}
              >
                <Icon size={18} />
                {tab.name}
              </button>
            );
          })}
        </div>

        <div className="p-6">
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
    </div>
  );
};

export default GroupsMaintenancePage;