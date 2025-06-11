using Microsoft.EntityFrameworkCore;
using PreSystem.StockControl.Domain.Entities;
using PreSystem.StockControl.Domain.Interfaces.Repositories;
using PreSystem.StockControl.Infrastructure.Persistence;

namespace PreSystem.StockControl.Infrastructure.Repositories
{
    // Implementação do repositório de Groups
    public class ComponentGroupRepository : IComponentGroupRepository
    {
        private readonly StockControlDbContext _context;

        public ComponentGroupRepository(StockControlDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<ComponentGroup>> GetAllAsync()
        {
            return await _context.ComponentGroups.OrderBy(g => g.Name).ToListAsync();
        }

        public async Task<ComponentGroup?> GetByIdAsync(int id)
        {
            return await _context.ComponentGroups.FindAsync(id);
        }

        public async Task<ComponentGroup?> GetByNameAsync(string name)
        {
            return await _context.ComponentGroups
                .FirstOrDefaultAsync(g => g.Name.ToLower() == name.ToLower());
        }

        public async Task<IEnumerable<ComponentGroup>> GetAllWithRelationsAsync()
        {
            return await _context.ComponentGroups
                .Include(g => g.Devices)
                    .ThenInclude(d => d.Values)
                        .ThenInclude(v => v.Packages)
                .OrderBy(g => g.Name)
                .ToListAsync();
        }

        public async Task AddAsync(ComponentGroup entity)
        {
            await _context.ComponentGroups.AddAsync(entity);
            await _context.SaveChangesAsync();
        }

        public async Task UpdateAsync(ComponentGroup entity)
        {
            _context.ComponentGroups.Update(entity);
            await _context.SaveChangesAsync();
        }

        public async Task DeleteAsync(ComponentGroup entity)
        {
            _context.ComponentGroups.Remove(entity);
            await _context.SaveChangesAsync();
        }
    }

    // Implementação do repositório de Devices
    public class ComponentDeviceRepository : IComponentDeviceRepository
    {
        private readonly StockControlDbContext _context;

        public ComponentDeviceRepository(StockControlDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<ComponentDevice>> GetAllAsync()
        {
            return await _context.ComponentDevices
                .Include(d => d.Group)
                .OrderBy(d => d.Name)
                .ToListAsync();
        }

        public async Task<ComponentDevice?> GetByIdAsync(int id)
        {
            return await _context.ComponentDevices
                .Include(d => d.Group)
                .FirstOrDefaultAsync(d => d.Id == id);
        }

        public async Task<ComponentDevice?> GetByNameAndGroupAsync(string name, int groupId)
        {
            return await _context.ComponentDevices
                .FirstOrDefaultAsync(d => d.Name.ToLower() == name.ToLower() && d.GroupId == groupId);
        }

        public async Task<IEnumerable<ComponentDevice>> GetByGroupIdAsync(int groupId)
        {
            return await _context.ComponentDevices
                .Where(d => d.GroupId == groupId)
                .OrderBy(d => d.Name)
                .ToListAsync();
        }

        public async Task<IEnumerable<ComponentDevice>> GetAllWithRelationsAsync()
        {
            return await _context.ComponentDevices
                .Include(d => d.Group)
                .Include(d => d.Values)
                    .ThenInclude(v => v.Packages)
                .OrderBy(d => d.Name)
                .ToListAsync();
        }

        public async Task AddAsync(ComponentDevice entity)
        {
            await _context.ComponentDevices.AddAsync(entity);
            await _context.SaveChangesAsync();
        }

        public async Task UpdateAsync(ComponentDevice entity)
        {
            _context.ComponentDevices.Update(entity);
            await _context.SaveChangesAsync();
        }

        public async Task DeleteAsync(ComponentDevice entity)
        {
            _context.ComponentDevices.Remove(entity);
            await _context.SaveChangesAsync();
        }
    }

    // Implementação do repositório de Values
    public class ComponentValueRepository : IComponentValueRepository
    {
        private readonly StockControlDbContext _context;

        public ComponentValueRepository(StockControlDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<ComponentValue>> GetAllAsync()
        {
            return await _context.ComponentValues
                .Include(v => v.Device)
                    .ThenInclude(d => d.Group)
                .OrderBy(v => v.Name)
                .ToListAsync();
        }

        public async Task<ComponentValue?> GetByIdAsync(int id)
        {
            return await _context.ComponentValues
                .Include(v => v.Device)
                    .ThenInclude(d => d.Group)
                .FirstOrDefaultAsync(v => v.Id == id);
        }

        public async Task<ComponentValue?> GetByNameAndDeviceAsync(string name, int deviceId)
        {
            return await _context.ComponentValues
                .FirstOrDefaultAsync(v => v.Name.ToLower() == name.ToLower() && v.DeviceId == deviceId);
        }

        public async Task<IEnumerable<ComponentValue>> GetByDeviceIdAsync(int deviceId)
        {
            return await _context.ComponentValues
                .Where(v => v.DeviceId == deviceId)
                .OrderBy(v => v.Name)
                .ToListAsync();
        }

        public async Task<IEnumerable<ComponentValue>> GetAllWithRelationsAsync()
        {
            return await _context.ComponentValues
                .Include(v => v.Device)
                    .ThenInclude(d => d.Group)
                .Include(v => v.Packages)
                .OrderBy(v => v.Name)
                .ToListAsync();
        }

        public async Task AddAsync(ComponentValue entity)
        {
            await _context.ComponentValues.AddAsync(entity);
            await _context.SaveChangesAsync();
        }

        public async Task UpdateAsync(ComponentValue entity)
        {
            _context.ComponentValues.Update(entity);
            await _context.SaveChangesAsync();
        }

        public async Task DeleteAsync(ComponentValue entity)
        {
            _context.ComponentValues.Remove(entity);
            await _context.SaveChangesAsync();
        }
    }

    // Implementação do repositório de Packages
    public class ComponentPackageRepository : IComponentPackageRepository
    {
        private readonly StockControlDbContext _context;

        public ComponentPackageRepository(StockControlDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<ComponentPackage>> GetAllAsync()
        {
            return await _context.ComponentPackages
                .Include(p => p.Value)
                    .ThenInclude(v => v.Device)
                        .ThenInclude(d => d.Group)
                .OrderBy(p => p.Name)
                .ToListAsync();
        }

        public async Task<ComponentPackage?> GetByIdAsync(int id)
        {
            return await _context.ComponentPackages
                .Include(p => p.Value)
                    .ThenInclude(v => v.Device)
                        .ThenInclude(d => d.Group)
                .FirstOrDefaultAsync(p => p.Id == id);
        }

        public async Task<ComponentPackage?> GetByNameAndValueAsync(string name, int valueId)
        {
            return await _context.ComponentPackages
                .FirstOrDefaultAsync(p => p.Name.ToLower() == name.ToLower() && p.ValueId == valueId);
        }

        public async Task<IEnumerable<ComponentPackage>> GetByValueIdAsync(int valueId)
        {
            return await _context.ComponentPackages
                .Where(p => p.ValueId == valueId)
                .OrderBy(p => p.Name)
                .ToListAsync();
        }

        public async Task<IEnumerable<ComponentPackage>> GetAllWithRelationsAsync()
        {
            return await _context.ComponentPackages
                .Include(p => p.Value)
                    .ThenInclude(v => v.Device)
                        .ThenInclude(d => d.Group)
                .OrderBy(p => p.Name)
                .ToListAsync();
        }

        public async Task AddAsync(ComponentPackage entity)
        {
            await _context.ComponentPackages.AddAsync(entity);
            await _context.SaveChangesAsync();
        }

        public async Task UpdateAsync(ComponentPackage entity)
        {
            _context.ComponentPackages.Update(entity);
            await _context.SaveChangesAsync();
        }

        public async Task DeleteAsync(ComponentPackage entity)
        {
            _context.ComponentPackages.Remove(entity);
            await _context.SaveChangesAsync();
        }
    }
}