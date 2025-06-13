using Microsoft.Extensions.Logging;
using PreSystem.StockControl.Application.DTOs;
using PreSystem.StockControl.Application.DTOs.Filters;
using PreSystem.StockControl.Application.Interfaces.Services;
using PreSystem.StockControl.Domain.Entities;
using PreSystem.StockControl.Domain.Interfaces.Repositories;

namespace PreSystem.StockControl.Application.Services
{
    // Serviço responsável pelas regras de negócio dos Componentes
    public class ComponentService : IComponentService
    {
        private readonly IComponentRepository _componentRepository;
        private readonly IAlertManagerService _alertManager;
        private readonly ILogger<ComponentService> _logger;

        public ComponentService(
            IComponentRepository componentRepository,
            IAlertManagerService alertManager,
            ILogger<ComponentService> logger)
        {
            _componentRepository = componentRepository;
            _alertManager = alertManager;
            _logger = logger;
        }

        // Adiciona um novo componente com base nos dados do DTO
        public async Task<ComponentDto> AddComponentAsync(ComponentCreateDto dto)
        {
            var component = new Component
            {
                Name = dto.Name,
                Description = dto.Description,
                Group = dto.Group,
                Device = dto.Device,
                Value = dto.Value,
                Package = dto.Package,
                Characteristics = dto.Characteristics,
                InternalCode = dto.InternalCode,
                Price = dto.Price,
                Environment = dto.Environment,
                Drawer = dto.Drawer,
                Division = dto.Division,
                NCM = dto.NCM,
                NVE = dto.NVE,
                QuantityInStock = dto.QuantityInStock,
                MinimumQuantity = dto.MinimumQuantity,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            await _componentRepository.AddAsync(component);

            _logger.LogInformation("Componente criado: {Nome}, Estoque inicial: {Quantidade}",
                component.Name, component.QuantityInStock);

            // Verificar se precisa criar alerta
            await _alertManager.CheckAndUpdateAlertsForComponentAsync(component.Id);

            return MapToDto(component);
        }

        // Retorna todos os componentes
        public async Task<IEnumerable<ComponentDto>> GetAllComponentsAsync(ComponentFilterDto filter)
        {
            var components = await _componentRepository.GetAllAsync();

            // Aplicar filtros se existirem
            if (!string.IsNullOrWhiteSpace(filter.Group))
                components = components.Where(c => c.Group == filter.Group);

            if (!string.IsNullOrWhiteSpace(filter.Device))
                components = components.Where(c => c.Device == filter.Device);

            if (!string.IsNullOrWhiteSpace(filter.Value))
                components = components.Where(c => c.Value == filter.Value);

            if (!string.IsNullOrWhiteSpace(filter.Package))
                components = components.Where(c => c.Package == filter.Package);

            if (!string.IsNullOrWhiteSpace(filter.SearchTerm))
            {
                var searchLower = filter.SearchTerm.ToLower();
                components = components.Where(c =>
                    c.Name.ToLower().Contains(searchLower) ||
                    (c.InternalCode != null && c.InternalCode.ToLower().Contains(searchLower)) ||
                    (c.Description != null && c.Description.ToLower().Contains(searchLower))
                );
            }

            return components.Select(MapToDto);
        }

        // Retorna um componente específico pelo ID
        public async Task<ComponentDto?> GetComponentByIdAsync(int id)
        {
            var component = await _componentRepository.GetByIdAsync(id);
            return component == null ? null : MapToDto(component);
        }

        // Atualiza um componente existente
        public async Task<ComponentDto?> UpdateComponentAsync(int id, ComponentCreateDto dto)
        {
            var component = await _componentRepository.GetByIdAsync(id);
            if (component == null) return null;

            // Atualiza os dados
            component.Name = dto.Name;
            component.Description = dto.Description;
            component.Group = dto.Group;
            component.Device = dto.Device;
            component.Value = dto.Value;
            component.Package = dto.Package;
            component.Characteristics = dto.Characteristics;
            component.InternalCode = dto.InternalCode;
            component.Price = dto.Price;
            component.Environment = dto.Environment;
            component.Drawer = dto.Drawer;
            component.Division = dto.Division;
            component.NCM = dto.NCM;
            component.NVE = dto.NVE;
            component.QuantityInStock = dto.QuantityInStock;
            component.MinimumQuantity = dto.MinimumQuantity;
            component.UpdatedAt = DateTime.UtcNow;

            await _componentRepository.UpdateAsync(component);

            _logger.LogInformation("Componente atualizado: {Id}, Nome: {Nome}, Quantidade: {Quantidade}",
                component.Id, component.Name, component.QuantityInStock);

            // Verificar alertas após atualização
            await _alertManager.CheckAndUpdateAlertsForComponentAsync(id);

            return MapToDto(component);
        }

        // Remove um componente com base no ID
        public async Task<bool> DeleteComponentAsync(int id)
        {
            var component = await _componentRepository.GetByIdAsync(id);
            if (component == null)
            {
                _logger.LogWarning("Tentativa de deletar componente inexistente: ID {Id}", id);
                return false;
            }

            await _componentRepository.DeleteAsync(component);
            _logger.LogInformation("Componente deletado: {Id} - {Nome}", component.Id, component.Name);
            return true;
        }

        // Deleta múltiplos componentes
        public async Task<bool> DeleteMultipleComponentsAsync(List<int> componentIds)
        {
            try
            {
                var components = new List<Component>();

                foreach (var id in componentIds)
                {
                    var component = await _componentRepository.GetByIdAsync(id);
                    if (component != null)
                    {
                        components.Add(component);
                    }
                }

                if (components.Any())
                {
                    await _componentRepository.DeleteRangeAsync(components);
                    _logger.LogInformation("Deletados {Count} componentes em massa", components.Count);
                }

                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao deletar componentes em massa");
                return false;
            }
        }

        // Método privado para mapear Entity para DTO
        private ComponentDto MapToDto(Component component)
        {
            return new ComponentDto
            {
                Id = component.Id,
                Name = component.Name,
                Description = component.Description,
                Group = component.Group,
                Device = component.Device,
                Value = component.Value,
                Package = component.Package,
                Characteristics = component.Characteristics,
                InternalCode = component.InternalCode,
                Price = component.Price,
                Environment = component.Environment,
                Drawer = component.Drawer,
                Division = component.Division,
                NCM = component.NCM,
                NVE = component.NVE,
                QuantityInStock = component.QuantityInStock,
                MinimumQuantity = component.MinimumQuantity,
                CreatedAt = component.CreatedAt,
                UpdatedAt = component.UpdatedAt
            };
        }
    }
}