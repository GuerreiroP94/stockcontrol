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
      // Em caso de erro, manter arrays vazios
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

  // ✅ CORRIGIDO: addGroup com melhor tratamento de erro e reload
  const addGroup = async (name: string): Promise<GroupItem> => {
    try {
      const result = await groupHierarchyService.createGroup(name);
      
      if (result.success && result.item) {
        // ✅ Atualizar estado local imediatamente
        setGroups(prevGroups => [...prevGroups, result.item!]);
        
        // ✅ Recarregar hierarquia completa para garantir consistência
        await loadFullHierarchy();
        
        return result.item;
      } else {
        throw new Error(result.message || 'Erro ao criar grupo');
      }
    } catch (error: any) {
      console.error('Erro ao criar grupo:', error);
      
      // ✅ Melhor tratamento de mensagens de erro
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
    }
  };

  // ✅ CORRIGIDO: addDevice com reload
  const addDevice = async (name: string, groupId: number): Promise<GroupItem> => {
    try {
      const result = await groupHierarchyService.createDevice(groupId, name);
      
      if (result.success && result.item) {
        // ✅ Atualizar estado local imediatamente
        const newDevice = { ...result.item, groupId };
        setDevices(prevDevices => [...prevDevices, newDevice]);
        
        // ✅ Recarregar hierarquia completa
        await loadFullHierarchy();
        
        return newDevice;
      } else {
        throw new Error(result.message || 'Erro ao criar device');
      }
    } catch (error: any) {
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
    }
  };

  // ✅ CORRIGIDO: addValue com reload
  const addValue = async (name: string, groupId: number, deviceId: number): Promise<GroupItem> => {
    try {
      const result = await groupHierarchyService.createValue(deviceId, name);
      
      if (result.success && result.item) {
        // ✅ Atualizar estado local imediatamente
        const newValue = { ...result.item, groupId, deviceId };
        setValues(prevValues => [...prevValues, newValue]);
        
        // ✅ Recarregar hierarquia completa
        await loadFullHierarchy();
        
        return newValue;
      } else {
        throw new Error(result.message || 'Erro ao criar value');
      }
    } catch (error: any) {
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
    }
  };

  // ✅ CORRIGIDO: addPackage com reload
  const addPackage = async (name: string, groupId: number, deviceId: number, valueId: number): Promise<GroupItem> => {
    try {
      const result = await groupHierarchyService.createPackage(valueId, name);
      
      if (result.success && result.item) {
        // ✅ Atualizar estado local imediatamente
        const newPackage = { ...result.item, groupId, deviceId, valueId };
        setPackages(prevPackages => [...prevPackages, newPackage]);
        
        // ✅ Recarregar hierarquia completa
        await loadFullHierarchy();
        
        return newPackage;
      } else {
        throw new Error(result.message || 'Erro ao criar package');
      }
    } catch (error: any) {
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
    }
  };

  // ✅ CORRIGIDO: updateItem com reload
  const updateItem = async (type: 'group' | 'device' | 'value' | 'package', id: number, name: string): Promise<void> => {
    try {
      let result;
      
      switch (type) {
        case 'group':
          result = await groupHierarchyService.updateGroup(id, name);
          if (result.success) {
            setGroups(groups.map(g => g.id === id ? { ...g, name } : g));
          }
          break;
        case 'device':
          result = await groupHierarchyService.updateDevice(id, name);
          if (result.success) {
            setDevices(devices.map(d => d.id === id ? { ...d, name } : d));
          }
          break;
        case 'value':
          result = await groupHierarchyService.updateValue(id, name);
          if (result.success) {
            setValues(values.map(v => v.id === id ? { ...v, name } : v));
          }
          break;
        case 'package':
          result = await groupHierarchyService.updatePackage(id, name);
          if (result.success) {
            setPackages(packages.map(p => p.id === id ? { ...p, name } : p));
          }
          break;
      }

      if (result?.success) {
        // ✅ Recarregar hierarquia completa após atualização
        await loadFullHierarchy();
      } else {
        throw new Error(result?.message || `Erro ao atualizar ${type}`);
      }
    } catch (error: any) {
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
    }
  };

  // ✅ CORRIGIDO: deleteItem com reload e limpeza de dependências
  const deleteItem = async (type: 'group' | 'device' | 'value' | 'package', id: number): Promise<void> => {
    try {
      let result;
      
      switch (type) {
        case 'group':
          result = await groupHierarchyService.deleteGroup(id);
          if (result.success) {
            setGroups(groups.filter(g => g.id !== id));
            // ✅ Remove items dependentes
            setDevices(devices.filter(d => d.groupId !== id));
            setValues(values.filter(v => v.groupId !== id));
            setPackages(packages.filter(p => p.groupId !== id));
          }
          break;
        case 'device':
          result = await groupHierarchyService.deleteDevice(id);
          if (result.success) {
            setDevices(devices.filter(d => d.id !== id));
            // ✅ Remove items dependentes
            setValues(values.filter(v => v.deviceId !== id));
            setPackages(packages.filter(p => p.deviceId !== id));
          }
          break;
        case 'value':
          result = await groupHierarchyService.deleteValue(id);
          if (result.success) {
            setValues(values.filter(v => v.id !== id));
            // ✅ Remove items dependentes
            setPackages(packages.filter(p => p.valueId !== id));
          }
          break;
        case 'package':
          result = await groupHierarchyService.deletePackage(id);
          if (result.success) {
            setPackages(packages.filter(p => p.id !== id));
          }
          break;
      }

      if (result?.success) {
        // ✅ Recarregar hierarquia completa após exclusão
        await loadFullHierarchy();
      } else {
        throw new Error(result?.message || `Erro ao excluir ${type}`);
      }
    } catch (error: any) {
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
    }
  };

  return {
    // Estados
    groups,
    devices,
    values,
    packages,
    loading,
    error,
    
    // Funções de filtro
    getFilteredDevices,
    getFilteredValues,
    getFilteredPackages,
    
    // Operações CRUD
    addGroup,
    addDevice,
    addValue,
    addPackage,
    updateItem,
    deleteItem,
    
    // Utilitários
    reloadHierarchy: loadFullHierarchy
  };
};