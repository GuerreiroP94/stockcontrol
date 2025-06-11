using Microsoft.Extensions.Logging;
using PreSystem.StockControl.Application.DTOs;
using PreSystem.StockControl.Application.Interfaces.Services;
using PreSystem.StockControl.Domain.Entities;
using PreSystem.StockControl.Domain.Interfaces.Repositories;

namespace PreSystem.StockControl.Application.Services
{
    public class GroupHierarchyService : IGroupHierarchyService
    {
        private readonly IComponentGroupRepository _groupRepository;
        private readonly IComponentDeviceRepository _deviceRepository;
        private readonly IComponentValueRepository _valueRepository;
        private readonly IComponentPackageRepository _packageRepository;
        private readonly ILogger<GroupHierarchyService> _logger;

        public GroupHierarchyService(
            IComponentGroupRepository groupRepository,
            IComponentDeviceRepository deviceRepository,
            IComponentValueRepository valueRepository,
            IComponentPackageRepository packageRepository,
            ILogger<GroupHierarchyService> logger)
        {
            _groupRepository = groupRepository;
            _deviceRepository = deviceRepository;
            _valueRepository = valueRepository;
            _packageRepository = packageRepository;
            _logger = logger;
        }

        // Obter toda a hierarquia
        public async Task<GroupHierarchyResponseDto> GetFullHierarchyAsync()
        {
            var groups = await _groupRepository.GetAllWithRelationsAsync();
            var devices = await _deviceRepository.GetAllWithRelationsAsync();
            var values = await _valueRepository.GetAllWithRelationsAsync();
            var packages = await _packageRepository.GetAllWithRelationsAsync();

            return new GroupHierarchyResponseDto
            {
                Groups = groups.Select(MapGroupToDto).ToList(),
                Devices = devices.Select(MapDeviceToDto).ToList(),
                Values = values.Select(MapValueToDto).ToList(),
                Packages = packages.Select(MapPackageToDto).ToList()
            };
        }

        #region Groups

        public async Task<IEnumerable<HierarchyItemDto>> GetAllGroupsAsync()
        {
            var groups = await _groupRepository.GetAllAsync();
            return groups.Select(g => new HierarchyItemDto
            {
                Id = g.Id,
                Name = g.Name,
                CreatedAt = g.CreatedAt
            });
        }

        public async Task<HierarchyItemDto?> GetGroupByIdAsync(int id)
        {
            var group = await _groupRepository.GetByIdAsync(id);
            return group == null ? null : new HierarchyItemDto
            {
                Id = group.Id,
                Name = group.Name,
                CreatedAt = group.CreatedAt
            };
        }

        public async Task<HierarchyOperationResult> CreateGroupAsync(HierarchyItemCreateDto dto)
        {
            try
            {
                // Verificar se já existe
                var existing = await _groupRepository.GetByNameAsync(dto.Name);
                if (existing != null)
                {
                    return new HierarchyOperationResult
                    {
                        Success = false,
                        Message = $"Grupo '{dto.Name}' já existe"
                    };
                }

                var group = new ComponentGroup
                {
                    Name = dto.Name,
                    CreatedAt = DateTime.UtcNow
                };

                await _groupRepository.AddAsync(group);
                _logger.LogInformation("Grupo criado: {Name}", group.Name);

                return new HierarchyOperationResult
                {
                    Success = true,
                    Item = new HierarchyItemDto
                    {
                        Id = group.Id,
                        Name = group.Name,
                        CreatedAt = group.CreatedAt
                    }
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao criar grupo");
                return new HierarchyOperationResult
                {
                    Success = false,
                    Message = "Erro ao criar grupo"
                };
            }
        }

        public async Task<HierarchyOperationResult> UpdateGroupAsync(int id, HierarchyItemCreateDto dto)
        {
            try
            {
                var group = await _groupRepository.GetByIdAsync(id);
                if (group == null)
                {
                    return new HierarchyOperationResult
                    {
                        Success = false,
                        Message = "Grupo não encontrado"
                    };
                }

                // Verificar duplicação
                var existing = await _groupRepository.GetByNameAsync(dto.Name);
                if (existing != null && existing.Id != id)
                {
                    return new HierarchyOperationResult
                    {
                        Success = false,
                        Message = $"Grupo '{dto.Name}' já existe"
                    };
                }

                group.Name = dto.Name;
                await _groupRepository.UpdateAsync(group);
                _logger.LogInformation("Grupo atualizado: {Id} - {Name}", group.Id, group.Name);

                return new HierarchyOperationResult
                {
                    Success = true,
                    Item = new HierarchyItemDto
                    {
                        Id = group.Id,
                        Name = group.Name,
                        CreatedAt = group.CreatedAt
                    }
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao atualizar grupo");
                return new HierarchyOperationResult
                {
                    Success = false,
                    Message = "Erro ao atualizar grupo"
                };
            }
        }

        public async Task<HierarchyOperationResult> DeleteGroupAsync(int id)
        {
            try
            {
                var group = await _groupRepository.GetByIdAsync(id);
                if (group == null)
                {
                    return new HierarchyOperationResult
                    {
                        Success = false,
                        Message = "Grupo não encontrado"
                    };
                }

                // Verificar se tem devices
                var devices = await _deviceRepository.GetByGroupIdAsync(id);
                if (devices.Any())
                {
                    return new HierarchyOperationResult
                    {
                        Success = false,
                        Message = "Não é possível excluir grupo com devices associados"
                    };
                }

                await _groupRepository.DeleteAsync(group);
                _logger.LogInformation("Grupo excluído: {Id} - {Name}", group.Id, group.Name);

                return new HierarchyOperationResult { Success = true };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao excluir grupo");
                return new HierarchyOperationResult
                {
                    Success = false,
                    Message = "Erro ao excluir grupo"
                };
            }
        }

        #endregion

        #region Devices

        public async Task<IEnumerable<ComponentDeviceDto>> GetAllDevicesAsync()
        {
            var devices = await _deviceRepository.GetAllAsync();
            return devices.Select(MapDeviceToDto);
        }

        public async Task<IEnumerable<ComponentDeviceDto>> GetDevicesByGroupIdAsync(int groupId)
        {
            var devices = await _deviceRepository.GetByGroupIdAsync(groupId);
            return devices.Select(MapDeviceToDto);
        }

        public async Task<ComponentDeviceDto?> GetDeviceByIdAsync(int id)
        {
            var device = await _deviceRepository.GetByIdAsync(id);
            return device == null ? null : MapDeviceToDto(device);
        }

        public async Task<HierarchyOperationResult> CreateDeviceAsync(int groupId, HierarchyItemCreateDto dto)
        {
            try
            {
                // Verificar se grupo existe
                var group = await _groupRepository.GetByIdAsync(groupId);
                if (group == null)
                {
                    return new HierarchyOperationResult
                    {
                        Success = false,
                        Message = "Grupo não encontrado"
                    };
                }

                // Verificar duplicação
                var existing = await _deviceRepository.GetByNameAndGroupAsync(dto.Name, groupId);
                if (existing != null)
                {
                    return new HierarchyOperationResult
                    {
                        Success = false,
                        Message = $"Device '{dto.Name}' já existe neste grupo"
                    };
                }

                var device = new ComponentDevice
                {
                    Name = dto.Name,
                    GroupId = groupId,
                    CreatedAt = DateTime.UtcNow
                };

                await _deviceRepository.AddAsync(device);
                _logger.LogInformation("Device criado: {Name} no grupo {GroupId}", device.Name, groupId);

                return new HierarchyOperationResult
                {
                    Success = true,
                    Item = MapDeviceToDto(device)
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao criar device");
                return new HierarchyOperationResult
                {
                    Success = false,
                    Message = "Erro ao criar device"
                };
            }
        }

        public async Task<HierarchyOperationResult> UpdateDeviceAsync(int id, HierarchyItemCreateDto dto)
        {
            try
            {
                var device = await _deviceRepository.GetByIdAsync(id);
                if (device == null)
                {
                    return new HierarchyOperationResult
                    {
                        Success = false,
                        Message = "Device não encontrado"
                    };
                }

                // Verificar duplicação
                var existing = await _deviceRepository.GetByNameAndGroupAsync(dto.Name, device.GroupId);
                if (existing != null && existing.Id != id)
                {
                    return new HierarchyOperationResult
                    {
                        Success = false,
                        Message = $"Device '{dto.Name}' já existe neste grupo"
                    };
                }

                device.Name = dto.Name;
                await _deviceRepository.UpdateAsync(device);
                _logger.LogInformation("Device atualizado: {Id} - {Name}", device.Id, device.Name);

                return new HierarchyOperationResult
                {
                    Success = true,
                    Item = MapDeviceToDto(device)
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao atualizar device");
                return new HierarchyOperationResult
                {
                    Success = false,
                    Message = "Erro ao atualizar device"
                };
            }
        }

        public async Task<HierarchyOperationResult> DeleteDeviceAsync(int id)
        {
            try
            {
                var device = await _deviceRepository.GetByIdAsync(id);
                if (device == null)
                {
                    return new HierarchyOperationResult
                    {
                        Success = false,
                        Message = "Device não encontrado"
                    };
                }

                // Verificar se tem values
                var values = await _valueRepository.GetByDeviceIdAsync(id);
                if (values.Any())
                {
                    return new HierarchyOperationResult
                    {
                        Success = false,
                        Message = "Não é possível excluir device com values associados"
                    };
                }

                await _deviceRepository.DeleteAsync(device);
                _logger.LogInformation("Device excluído: {Id} - {Name}", device.Id, device.Name);

                return new HierarchyOperationResult { Success = true };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao excluir device");
                return new HierarchyOperationResult
                {
                    Success = false,
                    Message = "Erro ao excluir device"
                };
            }
        }

        #endregion

        #region Values

        public async Task<IEnumerable<ComponentValueDto>> GetAllValuesAsync()
        {
            var values = await _valueRepository.GetAllAsync();
            return values.Select(MapValueToDto);
        }

        public async Task<IEnumerable<ComponentValueDto>> GetValuesByDeviceIdAsync(int deviceId)
        {
            var values = await _valueRepository.GetByDeviceIdAsync(deviceId);
            return values.Select(MapValueToDto);
        }

        public async Task<ComponentValueDto?> GetValueByIdAsync(int id)
        {
            var value = await _valueRepository.GetByIdAsync(id);
            return value == null ? null : MapValueToDto(value);
        }

        public async Task<HierarchyOperationResult> CreateValueAsync(int deviceId, HierarchyItemCreateDto dto)
        {
            try
            {
                // Verificar se device existe
                var device = await _deviceRepository.GetByIdAsync(deviceId);
                if (device == null)
                {
                    return new HierarchyOperationResult
                    {
                        Success = false,
                        Message = "Device não encontrado"
                    };
                }

                // Verificar duplicação
                var existing = await _valueRepository.GetByNameAndDeviceAsync(dto.Name, deviceId);
                if (existing != null)
                {
                    return new HierarchyOperationResult
                    {
                        Success = false,
                        Message = $"Value '{dto.Name}' já existe neste device"
                    };
                }

                var value = new ComponentValue
                {
                    Name = dto.Name,
                    DeviceId = deviceId,
                    CreatedAt = DateTime.UtcNow
                };

                await _valueRepository.AddAsync(value);
                _logger.LogInformation("Value criado: {Name} no device {DeviceId}", value.Name, deviceId);

                return new HierarchyOperationResult
                {
                    Success = true,
                    Item = MapValueToDto(value)
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao criar value");
                return new HierarchyOperationResult
                {
                    Success = false,
                    Message = "Erro ao criar value"
                };
            }
        }

        public async Task<HierarchyOperationResult> UpdateValueAsync(int id, HierarchyItemCreateDto dto)
        {
            try
            {
                var value = await _valueRepository.GetByIdAsync(id);
                if (value == null)
                {
                    return new HierarchyOperationResult
                    {
                        Success = false,
                        Message = "Value não encontrado"
                    };
                }

                // Verificar duplicação
                var existing = await _valueRepository.GetByNameAndDeviceAsync(dto.Name, value.DeviceId);
                if (existing != null && existing.Id != id)
                {
                    return new HierarchyOperationResult
                    {
                        Success = false,
                        Message = $"Value '{dto.Name}' já existe neste device"
                    };
                }

                value.Name = dto.Name;
                await _valueRepository.UpdateAsync(value);
                _logger.LogInformation("Value atualizado: {Id} - {Name}", value.Id, value.Name);

                return new HierarchyOperationResult
                {
                    Success = true,
                    Item = MapValueToDto(value)
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao atualizar value");
                return new HierarchyOperationResult
                {
                    Success = false,
                    Message = "Erro ao atualizar value"
                };
            }
        }

        public async Task<HierarchyOperationResult> DeleteValueAsync(int id)
        {
            try
            {
                var value = await _valueRepository.GetByIdAsync(id);
                if (value == null)
                {
                    return new HierarchyOperationResult
                    {
                        Success = false,
                        Message = "Value não encontrado"
                    };
                }

                // Verificar se tem packages
                var packages = await _packageRepository.GetByValueIdAsync(id);
                if (packages.Any())
                {
                    return new HierarchyOperationResult
                    {
                        Success = false,
                        Message = "Não é possível excluir value com packages associados"
                    };
                }

                await _valueRepository.DeleteAsync(value);
                _logger.LogInformation("Value excluído: {Id} - {Name}", value.Id, value.Name);

                return new HierarchyOperationResult { Success = true };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao excluir value");
                return new HierarchyOperationResult
                {
                    Success = false,
                    Message = "Erro ao excluir value"
                };
            }
        }

        #endregion

        #region Packages

        public async Task<IEnumerable<ComponentPackageDto>> GetAllPackagesAsync()
        {
            var packages = await _packageRepository.GetAllAsync();
            return packages.Select(MapPackageToDto);
        }

        public async Task<IEnumerable<ComponentPackageDto>> GetPackagesByValueIdAsync(int valueId)
        {
            var packages = await _packageRepository.GetByValueIdAsync(valueId);
            return packages.Select(MapPackageToDto);
        }

        public async Task<ComponentPackageDto?> GetPackageByIdAsync(int id)
        {
            var package = await _packageRepository.GetByIdAsync(id);
            return package == null ? null : MapPackageToDto(package);
        }

        public async Task<HierarchyOperationResult> CreatePackageAsync(int valueId, HierarchyItemCreateDto dto)
        {
            try
            {
                // Verificar se value existe
                var value = await _valueRepository.GetByIdAsync(valueId);
                if (value == null)
                {
                    return new HierarchyOperationResult
                    {
                        Success = false,
                        Message = "Value não encontrado"
                    };
                }

                // Verificar duplicação
                var existing = await _packageRepository.GetByNameAndValueAsync(dto.Name, valueId);
                if (existing != null)
                {
                    return new HierarchyOperationResult
                    {
                        Success = false,
                        Message = $"Package '{dto.Name}' já existe neste value"
                    };
                }

                var package = new ComponentPackage
                {
                    Name = dto.Name,
                    ValueId = valueId,
                    CreatedAt = DateTime.UtcNow
                };

                await _packageRepository.AddAsync(package);
                _logger.LogInformation("Package criado: {Name} no value {ValueId}", package.Name, valueId);

                return new HierarchyOperationResult
                {
                    Success = true,
                    Item = MapPackageToDto(package)
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao criar package");
                return new HierarchyOperationResult
                {
                    Success = false,
                    Message = "Erro ao criar package"
                };
            }
        }

        public async Task<HierarchyOperationResult> UpdatePackageAsync(int id, HierarchyItemCreateDto dto)
        {
            try
            {
                var package = await _packageRepository.GetByIdAsync(id);
                if (package == null)
                {
                    return new HierarchyOperationResult
                    {
                        Success = false,
                        Message = "Package não encontrado"
                    };
                }

                // Verificar duplicação
                var existing = await _packageRepository.GetByNameAndValueAsync(dto.Name, package.ValueId);
                if (existing != null && existing.Id != id)
                {
                    return new HierarchyOperationResult
                    {
                        Success = false,
                        Message = $"Package '{dto.Name}' já existe neste value"
                    };
                }

                package.Name = dto.Name;
                await _packageRepository.UpdateAsync(package);
                _logger.LogInformation("Package atualizado: {Id} - {Name}", package.Id, package.Name);

                return new HierarchyOperationResult
                {
                    Success = true,
                    Item = MapPackageToDto(package)
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao atualizar package");
                return new HierarchyOperationResult
                {
                    Success = false,
                    Message = "Erro ao atualizar package"
                };
            }
        }

        public async Task<HierarchyOperationResult> DeletePackageAsync(int id)
        {
            try
            {
                var package = await _packageRepository.GetByIdAsync(id);
                if (package == null)
                {
                    return new HierarchyOperationResult
                    {
                        Success = false,
                        Message = "Package não encontrado"
                    };
                }

                await _packageRepository.DeleteAsync(package);
                _logger.LogInformation("Package excluído: {Id} - {Name}", package.Id, package.Name);

                return new HierarchyOperationResult { Success = true };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao excluir package");
                return new HierarchyOperationResult
                {
                    Success = false,
                    Message = "Erro ao excluir package"
                };
            }
        }

        #endregion

        #region Métodos de Filtro

        public async Task<IEnumerable<ComponentDeviceDto>> GetFilteredDevicesAsync(int? groupId)
        {
            if (!groupId.HasValue)
            {
                return await GetAllDevicesAsync();
            }

            var devices = await _deviceRepository.GetByGroupIdAsync(groupId.Value);
            return devices.Select(MapDeviceToDto);
        }

        public async Task<IEnumerable<ComponentValueDto>> GetFilteredValuesAsync(int? groupId, int? deviceId)
        {
            var allValues = await _valueRepository.GetAllAsync();
            var query = allValues.AsQueryable();

            if (deviceId.HasValue)
            {
                query = query.Where(v => v.DeviceId == deviceId.Value);
            }
            else if (groupId.HasValue)
            {
                query = query.Where(v => v.Device != null && v.Device.GroupId == groupId.Value);
            }

            return query.Select(MapValueToDto);
        }

        public async Task<IEnumerable<ComponentPackageDto>> GetFilteredPackagesAsync(int? groupId, int? deviceId, int? valueId)
        {
            var allPackages = await _packageRepository.GetAllAsync();
            var query = allPackages.AsQueryable();

            if (valueId.HasValue)
            {
                query = query.Where(p => p.ValueId == valueId.Value);
            }
            else if (deviceId.HasValue)
            {
                query = query.Where(p => p.Value != null && p.Value.DeviceId == deviceId.Value);
            }
            else if (groupId.HasValue)
            {
                query = query.Where(p => p.Value != null &&
                                       p.Value.Device != null &&
                                       p.Value.Device.GroupId == groupId.Value);
            }

            return query.Select(MapPackageToDto);
        }

        #endregion

        #region Mapeamento

        private ComponentGroupDto MapGroupToDto(ComponentGroup group)
        {
            return new ComponentGroupDto
            {
                Id = group.Id,
                Name = group.Name,
                CreatedAt = group.CreatedAt,
                Devices = group.Devices?.Select(MapDeviceToDto).ToList() ?? new List<ComponentDeviceDto>()
            };
        }

        private ComponentDeviceDto MapDeviceToDto(ComponentDevice device)
        {
            return new ComponentDeviceDto
            {
                Id = device.Id,
                Name = device.Name,
                CreatedAt = device.CreatedAt,
                GroupId = device.GroupId,
                GroupName = device.Group?.Name,
                Values = device.Values?.Select(MapValueToDto).ToList() ?? new List<ComponentValueDto>()
            };
        }

        private ComponentValueDto MapValueToDto(ComponentValue value)
        {
            return new ComponentValueDto
            {
                Id = value.Id,
                Name = value.Name,
                CreatedAt = value.CreatedAt,
                DeviceId = value.DeviceId,
                DeviceName = value.Device?.Name,
                GroupId = value.Device?.GroupId ?? 0,
                GroupName = value.Device?.Group?.Name,
                Packages = value.Packages?.Select(MapPackageToDto).ToList() ?? new List<ComponentPackageDto>()
            };
        }

        private ComponentPackageDto MapPackageToDto(ComponentPackage package)
        {
            return new ComponentPackageDto
            {
                Id = package.Id,
                Name = package.Name,
                CreatedAt = package.CreatedAt,
                ValueId = package.ValueId,
                ValueName = package.Value?.Name,
                DeviceId = package.Value?.DeviceId ?? 0,
                DeviceName = package.Value?.Device?.Name,
                GroupId = package.Value?.Device?.GroupId ?? 0,
                GroupName = package.Value?.Device?.Group?.Name
            };
        }

        #endregion
    }
}