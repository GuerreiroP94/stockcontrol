// stock-control-frontend/src/hooks/useGroupHierarchy.ts
import { useState, useEffect } from 'react';
import { GroupItem } from '../types';
import groupHierarchyService from '../services/groupHierarchy.service';

export const useGroupHierarchy = () => {
  const [groups, setGroups] = useState<GroupItem[]>([]);
  const [devices, setDevices] = useState<GroupItem[]>([]);
  const [values, setValues] = useState<GroupItem[]>([]);
  const [packages, setPackages] = useState<GroupItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Carregar toda hierarquia ao inicializar
  useEffect(() => {
    loadFullHierarchy();
  }, []);

  const loadFullHierarchy = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await groupHierarchyService.getFullHierarchy();
      setGroups(data.groups || []);
      setDevices(data.devices || []);
      setValues(data.values || []);
      setPackages(data.packages || []);
    } catch (error: any) {
      console.error('Erro ao carregar hierarquia:', error);
      setError('Erro ao carregar dados da hierarquia');
      setGroups([]);
      setDevices([]);
      setValues([]);
      setPackages([]);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredDevices = (groupId?: number) => {
    if (!groupId) return devices;
    return devices.filter(d => d.groupId === groupId);
  };

  const getFilteredValues = (groupId?: number, deviceId?: number) => {
    let filtered = values;
    if (groupId) filtered = filtered.filter(v => v.groupId === groupId);
    if (deviceId) filtered = filtered.filter(v => v.deviceId === deviceId);
    return filtered;
  };

  const getFilteredPackages = (groupId?: number, deviceId?: number, valueId?: number) => {
    let filtered = packages;
    if (groupId) filtered = filtered.filter(p => p.groupId === groupId);
    if (deviceId) filtered = filtered.filter(p => p.deviceId === deviceId);
    if (valueId) filtered = filtered.filter(p => p.valueId === valueId);
    return filtered;
  };

  const addGroup = (name: string) => {
    groupHierarchyService.createGroup(name)
      .then(result => {
        if (result.success && result.item) {
          setGroups(prevGroups => [...prevGroups, result.item!]);
          setTimeout(loadFullHierarchy, 100);
        } else {
          throw new Error(result.message || 'Erro ao criar grupo');
        }
      })
      .catch(error => {
        console.error('Erro ao criar grupo:', error);
        if (error?.response?.status === 403) {
          throw new Error('Acesso negado. Apenas administradores podem criar grupos.');
        } else if (error?.response?.status === 400) {
          const message = error?.response?.data?.message || error?.response?.data?.Message;
          throw new Error(message || 'Dados inválidos. Verifique se o nome já existe.');
        } else if (error?.response?.status === 401) {
          throw new Error('Sessão expirada. Faça login novamente.');
        } else if (error?.message) {
          throw new Error(error.message);
        } else {
          throw new Error('Erro ao criar grupo');
        }
      });
  };

  const addDevice = (name: string, groupId: number) => {
    groupHierarchyService.createDevice(groupId, name)
      .then(result => {
        if (result.success && result.item) {
          const newDevice = { ...result.item, groupId };
          setDevices(prevDevices => [...prevDevices, newDevice]);
          setTimeout(loadFullHierarchy, 100);
        } else {
          throw new Error(result.message || 'Erro ao criar device');
        }
      })
      .catch(error => {
        console.error('Erro ao criar device:', error);
        if (error?.response?.status === 403) {
          throw new Error('Acesso negado. Apenas administradores podem criar devices.');
        } else if (error?.response?.status === 400) {
          const message = error?.response?.data?.message || error?.response?.data?.Message;
          throw new Error(message || 'Dados inválidos.');
        } else if (error?.message) {
          throw new Error(error.message);
        } else {
          throw new Error('Erro ao criar device');
        }
      });
  };

  const addValue = (name: string, groupId: number, deviceId: number) => {
    groupHierarchyService.createValue(deviceId, name)
      .then(result => {
        if (result.success && result.item) {
          const newValue = { ...result.item, groupId, deviceId };
          setValues(prevValues => [...prevValues, newValue]);
          setTimeout(loadFullHierarchy, 100);
        } else {
          throw new Error(result.message || 'Erro ao criar value');
        }
      })
      .catch(error => {
        console.error('Erro ao criar value:', error);
        if (error?.response?.status === 403) {
          throw new Error('Acesso negado. Apenas administradores podem criar values.');
        } else if (error?.response?.status === 400) {
          const message = error?.response?.data?.message || error?.response?.data?.Message;
          throw new Error(message || 'Dados inválidos.');
        } else if (error?.message) {
          throw new Error(error.message);
        } else {
          throw new Error('Erro ao criar value');
        }
      });
  };

  const addPackage = (name: string, groupId: number, deviceId: number, valueId: number) => {
    groupHierarchyService.createPackage(valueId, name)
      .then(result => {
        if (result.success && result.item) {
          const newPackage = { ...result.item, groupId, deviceId, valueId };
          setPackages(prevPackages => [...prevPackages, newPackage]);
          setTimeout(loadFullHierarchy, 100);
        } else {
          throw new Error(result.message || 'Erro ao criar package');
        }
      })
      .catch(error => {
        console.error('Erro ao criar package:', error);
        if (error?.response?.status === 403) {
          throw new Error('Acesso negado. Apenas administradores podem criar packages.');
        } else if (error?.response?.status === 400) {
          const message = error?.response?.data?.message || error?.response?.data?.Message;
          throw new Error(message || 'Dados inválidos.');
        } else if (error?.message) {
          throw new Error(error.message);
        } else {
          throw new Error('Erro ao criar package');
        }
      });
  };

  const updateItem = (type: 'group' | 'device' | 'value' | 'package', id: number, name: string) => {
    let servicePromise;
    
    switch (type) {
      case 'group':
        servicePromise = groupHierarchyService.updateGroup(id, name);
        break;
      case 'device':
        servicePromise = groupHierarchyService.updateDevice(id, name);
        break;
      case 'value':
        servicePromise = groupHierarchyService.updateValue(id, name);
        break;
      case 'package':
        servicePromise = groupHierarchyService.updatePackage(id, name);
        break;
      default:
        return;
    }

    servicePromise
      .then(result => {
        if (result?.success) {
          switch (type) {
            case 'group':
              setGroups(groups.map(g => g.id === id ? { ...g, name } : g));
              break;
            case 'device':
              setDevices(devices.map(d => d.id === id ? { ...d, name } : d));
              break;
            case 'value':
              setValues(values.map(v => v.id === id ? { ...v, name } : v));
              break;
            case 'package':
              setPackages(packages.map(p => p.id === id ? { ...p, name } : p));
              break;
          }
          setTimeout(loadFullHierarchy, 100);
        } else {
          throw new Error(result?.message || `Erro ao atualizar ${type}`);
        }
      })
      .catch(error => {
        console.error(`Erro ao atualizar ${type}:`, error);
        if (error?.response?.status === 403) {
          throw new Error('Acesso negado. Apenas administradores podem editar.');
        } else if (error?.response?.status === 400) {
          const message = error?.response?.data?.message || error?.response?.data?.Message;
          throw new Error(message || 'Dados inválidos.');
        } else if (error?.message) {
          throw new Error(error.message);
        } else {
          throw new Error(`Erro ao atualizar ${type}`);
        }
      });
  };

  const deleteItem = (type: 'group' | 'device' | 'value' | 'package', id: number) => {
    let servicePromise;
    
    switch (type) {
      case 'group':
        servicePromise = groupHierarchyService.deleteGroup(id);
        break;
      case 'device':
        servicePromise = groupHierarchyService.deleteDevice(id);
        break;
      case 'value':
        servicePromise = groupHierarchyService.deleteValue(id);
        break;
      case 'package':
        servicePromise = groupHierarchyService.deletePackage(id);
        break;
      default:
        return;
    }

    servicePromise
      .then(result => {
        if (result?.success) {
          switch (type) {
            case 'group':
              setGroups(groups.filter(g => g.id !== id));
              setDevices(devices.filter(d => d.groupId !== id));
              setValues(values.filter(v => v.groupId !== id));
              setPackages(packages.filter(p => p.groupId !== id));
              break;
            case 'device':
              setDevices(devices.filter(d => d.id !== id));
              setValues(values.filter(v => v.deviceId !== id));
              setPackages(packages.filter(p => p.deviceId !== id));
              break;
            case 'value':
              setValues(values.filter(v => v.id !== id));
              setPackages(packages.filter(p => p.valueId !== id));
              break;
            case 'package':
              setPackages(packages.filter(p => p.id !== id));
              break;
          }
          setTimeout(loadFullHierarchy, 100);
        } else {
          throw new Error(result?.message || `Erro ao excluir ${type}`);
        }
      })
      .catch(error => {
        console.error(`Erro ao deletar ${type}:`, error);
        if (error?.response?.status === 403) {
          throw new Error('Acesso negado. Apenas administradores podem excluir.');
        } else if (error?.response?.status === 400) {
          const message = error?.response?.data?.message || error?.response?.data?.Message;
          throw new Error(message || 'Este item não pode ser excluído pois possui dependências.');
        } else if (error?.message) {
          throw new Error(error.message);
        } else {
          throw new Error(`Erro ao excluir ${type}`);
        }
      });
  };

  return {
    groups,
    devices,
    values,
    packages,
    loading,
    error,
    getFilteredDevices,
    getFilteredValues,
    getFilteredPackages,
    addGroup,
    addDevice,
    addValue,
    addPackage,
    updateItem,
    deleteItem,
    reloadHierarchy: loadFullHierarchy
  };
};