using PreSystem.StockControl.Domain.Entities;

namespace PreSystem.StockControl.Domain.Interfaces.Repositories
{
    // Interface para repositório de Groups
    public interface IComponentGroupRepository : IRepository<ComponentGroup>
    {
        Task<ComponentGroup?> GetByNameAsync(string name);
        Task<IEnumerable<ComponentGroup>> GetAllWithRelationsAsync();
    }

    // Interface para repositório de Devices
    public interface IComponentDeviceRepository : IRepository<ComponentDevice>
    {
        Task<ComponentDevice?> GetByNameAndGroupAsync(string name, int groupId);
        Task<IEnumerable<ComponentDevice>> GetByGroupIdAsync(int groupId);
        Task<IEnumerable<ComponentDevice>> GetAllWithRelationsAsync();
    }

    // Interface para repositório de Values
    public interface IComponentValueRepository : IRepository<ComponentValue>
    {
        Task<ComponentValue?> GetByNameAndDeviceAsync(string name, int deviceId);
        Task<IEnumerable<ComponentValue>> GetByDeviceIdAsync(int deviceId);
        Task<IEnumerable<ComponentValue>> GetAllWithRelationsAsync();
    }

    // Interface para repositório de Packages
    public interface IComponentPackageRepository : IRepository<ComponentPackage>
    {
        Task<ComponentPackage?> GetByNameAndValueAsync(string name, int valueId);
        Task<IEnumerable<ComponentPackage>> GetByValueIdAsync(int valueId);
        Task<IEnumerable<ComponentPackage>> GetAllWithRelationsAsync();
    }
}