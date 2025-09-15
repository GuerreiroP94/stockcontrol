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

  useEffect(() => {
    loadFullHierarchy();
  }, []);

  const loadFullHierarchy = async () => {
    try {
      setLoading(true);
      const data = await groupHierarchyService.getFullHierarchy();
      setGroups(data.groups || []);
      setDevices(data.devices || []);
      setValues(data.values || []);
      setPackages(data.packages || []);
    } catch (error) {
      setError('Erro ao carregar hierarquia');
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
    groupHierarchyService.createGroup(name);
  };

  const addDevice = (name: string, groupId: number) => {
    groupHierarchyService.createDevice(groupId, name);
  };

  const addValue = (name: string, groupId: number, deviceId: number) => {
    groupHierarchyService.createValue(deviceId, name);
  };

  const addPackage = (name: string, groupId: number, deviceId: number, valueId: number) => {
    groupHierarchyService.createPackage(valueId, name);
  };

  const updateItem = (type: 'group' | 'device' | 'value' | 'package', id: number, name: string) => {
    switch (type) {
      case 'group':
        groupHierarchyService.updateGroup(id, name);
        break;
      case 'device':
        groupHierarchyService.updateDevice(id, name);
        break;
      case 'value':
        groupHierarchyService.updateValue(id, name);
        break;
      case 'package':
        groupHierarchyService.updatePackage(id, name);
        break;
    }
  };

  const deleteItem = (type: 'group' | 'device' | 'value' | 'package', id: number) => {
    switch (type) {
      case 'group':
        groupHierarchyService.deleteGroup(id);
        break;
      case 'device':
        groupHierarchyService.deleteDevice(id);
        break;
      case 'value':
        groupHierarchyService.deleteValue(id);
        break;
      case 'package':
        groupHierarchyService.deletePackage(id);
        break;
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