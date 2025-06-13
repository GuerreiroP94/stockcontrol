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
      const data = await groupHierarchyService.getFullHierarchy();
      setGroups(data.groups);
      setDevices(data.devices);
      setValues(data.values);
      setPackages(data.packages);
    } catch (error) {
      console.error('Erro ao carregar hierarquia:', error);
      setError('Erro ao carregar dados da hierarquia');
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

  const addGroup = async (name: string) => {
    try {
      const result = await groupHierarchyService.createGroup(name);
      if (result.success && result.item) {
        setGroups([...groups, result.item]);
        return result.item;
      }
      throw new Error(result.message || 'Erro ao criar grupo');
    } catch (error) {
      console.error('Erro ao criar grupo:', error);
      throw error;
    }
  };

  const addDevice = async (name: string, groupId: number) => {
    try {
      const result = await groupHierarchyService.createDevice(groupId, name);
      if (result.success && result.item) {
        setDevices([...devices, result.item]);
        return result.item;
      }
      throw new Error(result.message || 'Erro ao criar device');
    } catch (error) {
      console.error('Erro ao criar device:', error);
      throw error;
    }
  };

  const addValue = async (name: string, groupId: number, deviceId: number) => {
    try {
      const result = await groupHierarchyService.createValue(deviceId, name);
      if (result.success && result.item) {
        // Adicionar groupId ao item retornado
        const newValue = { ...result.item, groupId };
        setValues([...values, newValue]);
        return newValue;
      }
      throw new Error(result.message || 'Erro ao criar value');
    } catch (error) {
      console.error('Erro ao criar value:', error);
      throw error;
    }
  };

  const addPackage = async (name: string, groupId: number, deviceId: number, valueId: number) => {
    try {
      const result = await groupHierarchyService.createPackage(valueId, name);
      if (result.success && result.item) {
        // Adicionar groupId e deviceId ao item retornado
        const newPackage = { ...result.item, groupId, deviceId };
        setPackages([...packages, newPackage]);
        return newPackage;
      }
      throw new Error(result.message || 'Erro ao criar package');
    } catch (error) {
      console.error('Erro ao criar package:', error);
      throw error;
    }
  };

  const updateItem = async (type: 'group' | 'device' | 'value' | 'package', id: number, name: string) => {
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
    } catch (error) {
      console.error(`Erro ao atualizar ${type}:`, error);
      throw error;
    }
  };

  const deleteItem = async (type: 'group' | 'device' | 'value' | 'package', id: number) => {
    try {
      let result;
      switch (type) {
        case 'group':
          result = await groupHierarchyService.deleteGroup(id);
          if (result.success) {
            setGroups(groups.filter(g => g.id !== id));
            // Remove items dependentes
            const deviceIds = devices.filter(d => d.groupId === id).map(d => d.id);
            setDevices(devices.filter(d => d.groupId !== id));
            setValues(values.filter(v => v.groupId !== id));
            setPackages(packages.filter(p => p.groupId !== id));
          }
          break;
        case 'device':
          result = await groupHierarchyService.deleteDevice(id);
          if (result.success) {
            setDevices(devices.filter(d => d.id !== id));
            // Remove items dependentes
            setValues(values.filter(v => v.deviceId !== id));
            setPackages(packages.filter(p => p.deviceId !== id));
          }
          break;
        case 'value':
          result = await groupHierarchyService.deleteValue(id);
          if (result.success) {
            setValues(values.filter(v => v.id !== id));
            // Remove items dependentes
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
    } catch (error) {
      console.error(`Erro ao deletar ${type}:`, error);
      throw error;
    }
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