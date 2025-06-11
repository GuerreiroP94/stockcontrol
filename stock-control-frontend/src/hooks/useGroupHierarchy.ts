import { useState, useEffect } from 'react';
import { GroupItem } from '../types';

export const useGroupHierarchy = () => {
  const [groups, setGroups] = useState<GroupItem[]>([]);
  const [devices, setDevices] = useState<GroupItem[]>([]);
  const [values, setValues] = useState<GroupItem[]>([]);
  const [packages, setPackages] = useState<GroupItem[]>([]);

  // Simula dados do backend - substitua com chamadas reais da API
  useEffect(() => {
    // Exemplo de dados
    setGroups([
      { id: 1, name: 'Resistor' },
      { id: 2, name: 'Capacitor' },
      { id: 3, name: 'CI' },
    ]);
    
    setDevices([
      { id: 1, name: 'SMD', groupId: 1 },
      { id: 2, name: 'PTH', groupId: 1 },
      { id: 3, name: 'Cerâmico', groupId: 2 },
    ]);
    
    setValues([
      { id: 1, name: '10K', groupId: 1, deviceId: 1 },
      { id: 2, name: '100K', groupId: 1, deviceId: 1 },
      { id: 3, name: '100nF', groupId: 2, deviceId: 3 },
    ]);
    
    setPackages([
      { id: 1, name: '0805', groupId: 1, deviceId: 1, valueId: 1 },
      { id: 2, name: '1206', groupId: 1, deviceId: 1, valueId: 1 },
    ]);
  }, []);

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
    const newGroup: GroupItem = { id: Date.now(), name };
    setGroups([...groups, newGroup]);
    return newGroup;
  };

  const addDevice = (name: string, groupId: number) => {
    const newDevice: GroupItem = { id: Date.now(), name, groupId };
    setDevices([...devices, newDevice]);
    return newDevice;
  };

  const addValue = (name: string, groupId: number, deviceId: number) => {
    const newValue: GroupItem = { id: Date.now(), name, groupId, deviceId };
    setValues([...values, newValue]);
    return newValue;
  };

  const addPackage = (name: string, groupId: number, deviceId: number, valueId: number) => {
    const newPackage: GroupItem = { id: Date.now(), name, groupId, deviceId, valueId };
    setPackages([...packages, newPackage]);
    return newPackage;
  };

  const updateItem = (type: 'group' | 'device' | 'value' | 'package', id: number, name: string) => {
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
  };

  const deleteItem = (type: 'group' | 'device' | 'value' | 'package', id: number) => {
    switch (type) {
      case 'group':
        setGroups(groups.filter(g => g.id !== id));
        // Remove dependent items
        const deviceIds = devices.filter(d => d.groupId === id).map(d => d.id);
        setDevices(devices.filter(d => d.groupId !== id));
        setValues(values.filter(v => v.groupId !== id));
        setPackages(packages.filter(p => p.groupId !== id));
        break;
      case 'device':
        setDevices(devices.filter(d => d.id !== id));
        // Remove dependent items
        setValues(values.filter(v => v.deviceId !== id));
        setPackages(packages.filter(p => p.deviceId !== id));
        break;
      case 'value':
        setValues(values.filter(v => v.id !== id));
        // Remove dependent items
        setPackages(packages.filter(p => p.valueId !== id));
        break;
      case 'package':
        setPackages(packages.filter(p => p.id !== id));
        break;
    }
  };

  return {
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
  };
};