using PreSystem.StockControl.Application.DTOs;

namespace PreSystem.StockControl.Application.Interfaces.Services
{
    public interface IGroupHierarchyService
    {
        // Obter toda a hierarquia
        Task<GroupHierarchyResponseDto> GetFullHierarchyAsync();

        // Groups
        Task<IEnumerable<HierarchyItemDto>> GetAllGroupsAsync();
        Task<HierarchyItemDto?> GetGroupByIdAsync(int id);
        Task<HierarchyOperationResult> CreateGroupAsync(HierarchyItemCreateDto dto);
        Task<HierarchyOperationResult> UpdateGroupAsync(int id, HierarchyItemCreateDto dto);
        Task<HierarchyOperationResult> DeleteGroupAsync(int id);

        // Devices
        Task<IEnumerable<ComponentDeviceDto>> GetAllDevicesAsync();
        Task<IEnumerable<ComponentDeviceDto>> GetDevicesByGroupIdAsync(int groupId);
        Task<ComponentDeviceDto?> GetDeviceByIdAsync(int id);
        Task<HierarchyOperationResult> CreateDeviceAsync(int groupId, HierarchyItemCreateDto dto);
        Task<HierarchyOperationResult> UpdateDeviceAsync(int id, HierarchyItemCreateDto dto);
        Task<HierarchyOperationResult> DeleteDeviceAsync(int id);

        // Values
        Task<IEnumerable<ComponentValueDto>> GetAllValuesAsync();
        Task<IEnumerable<ComponentValueDto>> GetValuesByDeviceIdAsync(int deviceId);
        Task<ComponentValueDto?> GetValueByIdAsync(int id);
        Task<HierarchyOperationResult> CreateValueAsync(int deviceId, HierarchyItemCreateDto dto);
        Task<HierarchyOperationResult> UpdateValueAsync(int id, HierarchyItemCreateDto dto);
        Task<HierarchyOperationResult> DeleteValueAsync(int id);

        // Packages
        Task<IEnumerable<ComponentPackageDto>> GetAllPackagesAsync();
        Task<IEnumerable<ComponentPackageDto>> GetPackagesByValueIdAsync(int valueId);
        Task<ComponentPackageDto?> GetPackageByIdAsync(int id);
        Task<HierarchyOperationResult> CreatePackageAsync(int valueId, HierarchyItemCreateDto dto);
        Task<HierarchyOperationResult> UpdatePackageAsync(int id, HierarchyItemCreateDto dto);
        Task<HierarchyOperationResult> DeletePackageAsync(int id);

        // Métodos auxiliares para o frontend
        Task<IEnumerable<ComponentDeviceDto>> GetFilteredDevicesAsync(int? groupId);
        Task<IEnumerable<ComponentValueDto>> GetFilteredValuesAsync(int? groupId, int? deviceId);
        Task<IEnumerable<ComponentPackageDto>> GetFilteredPackagesAsync(int? groupId, int? deviceId, int? valueId);
    }
}