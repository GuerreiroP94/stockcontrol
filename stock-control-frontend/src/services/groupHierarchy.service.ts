import { api } from './api';
import { GroupItem } from '../types';

interface HierarchyOperationResult {
  success: boolean;
  message?: string;
  item?: GroupItem;
}

interface GroupHierarchyResponse {
  groups: GroupItem[];
  devices: GroupItem[];
  values: GroupItem[];
  packages: GroupItem[];
}

class GroupHierarchyService {
  // Obter toda hierarquia
  async getFullHierarchy(): Promise<GroupHierarchyResponse> {
    const response = await api.get<GroupHierarchyResponse>('/grouphierarchy/full');
    return response.data;
  }

  // Groups
  async getAllGroups(): Promise<GroupItem[]> {
    const response = await api.get<GroupItem[]>('/grouphierarchy/groups');
    return response.data;
  }

  async getGroupById(id: number): Promise<GroupItem> {
    const response = await api.get<GroupItem>(`/grouphierarchy/groups/${id}`);
    return response.data;
  }

  async createGroup(name: string): Promise<HierarchyOperationResult> {
    const response = await api.post<HierarchyOperationResult>('/grouphierarchy/groups', { name });
    return response.data;
  }

  async updateGroup(id: number, name: string): Promise<HierarchyOperationResult> {
    const response = await api.put<HierarchyOperationResult>(`/grouphierarchy/groups/${id}`, { name });
    return response.data;
  }

  async deleteGroup(id: number): Promise<HierarchyOperationResult> {
    const response = await api.delete<HierarchyOperationResult>(`/grouphierarchy/groups/${id}`);
    return response.data;
  }

  // Devices
  async getAllDevices(): Promise<GroupItem[]> {
    const response = await api.get<GroupItem[]>('/grouphierarchy/devices');
    return response.data;
  }

  async getDevicesByGroupId(groupId: number): Promise<GroupItem[]> {
    const response = await api.get<GroupItem[]>(`/grouphierarchy/groups/${groupId}/devices`);
    return response.data;
  }

  async getFilteredDevices(groupId?: number): Promise<GroupItem[]> {
    const params = groupId ? { groupId } : {};
    const response = await api.get<GroupItem[]>('/grouphierarchy/devices/filtered', { params });
    return response.data;
  }

  async createDevice(groupId: number, name: string): Promise<HierarchyOperationResult> {
    const response = await api.post<HierarchyOperationResult>(`/grouphierarchy/groups/${groupId}/devices`, { name });
    return response.data;
  }

  async updateDevice(id: number, name: string): Promise<HierarchyOperationResult> {
    const response = await api.put<HierarchyOperationResult>(`/grouphierarchy/devices/${id}`, { name });
    return response.data;
  }

  async deleteDevice(id: number): Promise<HierarchyOperationResult> {
    const response = await api.delete<HierarchyOperationResult>(`/grouphierarchy/devices/${id}`);
    return response.data;
  }

  // Values
  async getAllValues(): Promise<GroupItem[]> {
    const response = await api.get<GroupItem[]>('/grouphierarchy/values');
    return response.data;
  }

  async getValuesByDeviceId(deviceId: number): Promise<GroupItem[]> {
    const response = await api.get<GroupItem[]>(`/grouphierarchy/devices/${deviceId}/values`);
    return response.data;
  }

  async getFilteredValues(groupId?: number, deviceId?: number): Promise<GroupItem[]> {
    const params: any = {};
    if (groupId) params.groupId = groupId;
    if (deviceId) params.deviceId = deviceId;
    const response = await api.get<GroupItem[]>('/grouphierarchy/values/filtered', { params });
    return response.data;
  }

  async createValue(deviceId: number, name: string): Promise<HierarchyOperationResult> {
    const response = await api.post<HierarchyOperationResult>(`/grouphierarchy/devices/${deviceId}/values`, { name });
    return response.data;
  }

  async updateValue(id: number, name: string): Promise<HierarchyOperationResult> {
    const response = await api.put<HierarchyOperationResult>(`/grouphierarchy/values/${id}`, { name });
    return response.data;
  }

  async deleteValue(id: number): Promise<HierarchyOperationResult> {
    const response = await api.delete<HierarchyOperationResult>(`/grouphierarchy/values/${id}`);
    return response.data;
  }

  // Packages
  async getAllPackages(): Promise<GroupItem[]> {
    const response = await api.get<GroupItem[]>('/grouphierarchy/packages');
    return response.data;
  }

  async getPackagesByValueId(valueId: number): Promise<GroupItem[]> {
    const response = await api.get<GroupItem[]>(`/grouphierarchy/values/${valueId}/packages`);
    return response.data;
  }

  async getFilteredPackages(groupId?: number, deviceId?: number, valueId?: number): Promise<GroupItem[]> {
    const params: any = {};
    if (groupId) params.groupId = groupId;
    if (deviceId) params.deviceId = deviceId;
    if (valueId) params.valueId = valueId;
    const response = await api.get<GroupItem[]>('/grouphierarchy/packages/filtered', { params });
    return response.data;
  }

  async createPackage(valueId: number, name: string): Promise<HierarchyOperationResult> {
    const response = await api.post<HierarchyOperationResult>(`/grouphierarchy/values/${valueId}/packages`, { name });
    return response.data;
  }

  async updatePackage(id: number, name: string): Promise<HierarchyOperationResult> {
    const response = await api.put<HierarchyOperationResult>(`/grouphierarchy/packages/${id}`, { name });
    return response.data;
  }

  async deletePackage(id: number): Promise<HierarchyOperationResult> {
    const response = await api.delete<HierarchyOperationResult>(`/grouphierarchy/packages/${id}`);
    return response.data;
  }
}

export default new GroupHierarchyService();