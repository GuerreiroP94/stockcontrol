// stock-control-frontend/src/components/common/TabCRUD.tsx
import React, { useState } from 'react';
import { Plus, Pencil, Trash2, Search, Save } from 'lucide-react';
import { GroupItem } from '../../types';
import ConfirmModal from './ConfirmModal';
import BaseModal from './BaseModal';

interface TabCRUDProps {
  type: 'group' | 'device' | 'value' | 'package';
  items: GroupItem[];
  onAdd: (name: string, ...parentIds: number[]) => void;
  onUpdate: (id: number, name: string) => void;
  onDelete: (id: number) => void;
  filters?: {
    groupId?: number;
    deviceId?: number;
    valueId?: number;
  };
  groups?: GroupItem[];
  devices?: GroupItem[];
  values?: GroupItem[];
}

const TabCRUD: React.FC<TabCRUDProps> = ({
  type,
  items,
  onAdd,
  onUpdate,
  onDelete,
  filters = {},
  groups = [],
  devices = [],
  values = [],
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<GroupItem | null>(null);
  const [newItemName, setNewItemName] = useState('');
  const [editItemName, setEditItemName] = useState('');

  const getTypeName = () => {
    switch (type) {
      case 'group': return 'Grupo';
      case 'device': return 'Device';
      case 'value': return 'Value';
      case 'package': return 'Package';
    }
  };

  const filteredItems = items.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAdd = () => {
    if (!newItemName.trim()) return;
    
    const parentIds: number[] = [];
    if (filters.groupId) parentIds.push(filters.groupId);
    if (filters.deviceId) parentIds.push(filters.deviceId);
    if (filters.valueId) parentIds.push(filters.valueId);
    
    onAdd(newItemName.trim(), ...parentIds);
    setNewItemName('');
    setShowAddModal(false);
  };

  const handleEdit = () => {
    if (!selectedItem || !editItemName.trim()) return;
    
    onUpdate(selectedItem.id, editItemName.trim());
    setShowEditModal(false);
    setSelectedItem(null);
    setEditItemName('');
  };

  const handleDelete = () => {
    if (!selectedItem) return;
    
    onDelete(selectedItem.id);
    setShowDeleteModal(false);
    setSelectedItem(null);
  };

  const openEditModal = (item: GroupItem) => {
    setSelectedItem(item);
    setEditItemName(item.name);
    setShowEditModal(true);
  };

  const openDeleteModal = (item: GroupItem) => {
    setSelectedItem(item);
    setShowDeleteModal(true);
  };

  const canAdd = () => {
    switch (type) {
      case 'group':
        return true;
      case 'device':
        return !!filters.groupId;
      case 'value':
        return !!filters.groupId && !!filters.deviceId;
      case 'package':
        return !!filters.groupId && !!filters.deviceId && !!filters.valueId;
      default:
        return false;
    }
  };

  const getAddTooltip = () => {
    switch (type) {
      case 'device':
        return !filters.groupId ? 'Selecione um grupo primeiro' : `Novo ${getTypeName()}`;
      case 'value':
        return !filters.groupId ? 'Selecione um grupo primeiro' 
             : !filters.deviceId ? 'Selecione um device primeiro' 
             : `Novo ${getTypeName()}`;
      case 'package':
        return !filters.groupId ? 'Selecione um grupo primeiro'
             : !filters.deviceId ? 'Selecione um device primeiro'
             : !filters.valueId ? 'Selecione um value primeiro'
             : `Novo ${getTypeName()}`;
      default:
        return `Novo ${getTypeName()}`;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header com busca e botão adicionar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder={`Buscar ${getTypeName().toLowerCase()}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
          />
        </div>
        
        <button
          onClick={() => setShowAddModal(true)}
          disabled={!canAdd()}
          title={getAddTooltip()}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-200"
        >
          <Plus size={18} />
          Novo {getTypeName()}
        </button>
      </div>

      {/* Filtros aplicados */}
      {(filters.groupId || filters.deviceId || filters.valueId) && (
        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="text-sm font-medium text-blue-900 mb-2">Filtros aplicados:</h4>
          <div className="flex gap-2 flex-wrap">
            {filters.groupId && (
              <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                Grupo: {groups.find(g => g.id === filters.groupId)?.name}
              </span>
            )}
            {filters.deviceId && type !== 'device' && (
              <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                Device: {devices.find(d => d.id === filters.deviceId)?.name}
              </span>
            )}
            {filters.valueId && type === 'package' && (
              <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">
                Value: {values.find(v => v.id === filters.valueId)?.name}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Lista de itens */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Nome do {getTypeName()}
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredItems.length === 0 ? (
              <tr>
                <td colSpan={2} className="px-6 py-12 text-center text-gray-500">
                  {searchTerm ? `Nenhum ${getTypeName().toLowerCase()} encontrado para "${searchTerm}"` 
                             : `Nenhum ${getTypeName().toLowerCase()} encontrado`}
                </td>
              </tr>
            ) : (
              filteredItems.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <p className="text-sm font-medium text-gray-900">{item.name}</p>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <button
                      onClick={() => openEditModal(item)}
                      className="text-blue-600 hover:text-blue-700 mr-3"
                      title="Editar"
                    >
                      <Pencil size={18} />
                    </button>
                    <button
                      onClick={() => openDeleteModal(item)}
                      className="text-red-600 hover:text-red-700"
                      title="Excluir"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Adicionar */}
      <BaseModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title={`Novo ${getTypeName()}`}
        size="sm"
      >
        <div className="p-6">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nome do {getTypeName()}
            </label>
            <input
              type="text"
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAdd()}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              placeholder={`Digite o nome do ${getTypeName().toLowerCase()}`}
              autoFocus
            />
          </div>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setShowAddModal(false)}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg"
            >
              Cancelar
            </button>
            <button
              onClick={handleAdd}
              disabled={!newItemName.trim()}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
            >
              <Plus size={16} />
              Adicionar
            </button>
          </div>
        </div>
      </BaseModal>

      {/* Modal Editar */}
      <BaseModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title={`Editar ${getTypeName()}`}
        size="sm"
      >
        <div className="p-6">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nome do {getTypeName()}
            </label>
            <input
              type="text"
              value={editItemName}
              onChange={(e) => setEditItemName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleEdit()}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              placeholder={`Digite o nome do ${getTypeName().toLowerCase()}`}
              autoFocus
            />
          </div>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setShowEditModal(false)}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg"
            >
              Cancelar
            </button>
            <button
              onClick={handleEdit}
              disabled={!editItemName.trim()}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
            >
              <Save size={16} />
              Salvar
            </button>
          </div>
        </div>
      </BaseModal>

      {/* Modal Confirmar Delete - VERSÃO MÍNIMA */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title={`Excluir ${getTypeName()}`}
        message={`Tem certeza que deseja excluir "${selectedItem?.name}"?\nEsta ação não pode ser desfeita.`}
        confirmText="Excluir"
        type="danger"
      />
    </div>
  );
};

export default TabCRUD;