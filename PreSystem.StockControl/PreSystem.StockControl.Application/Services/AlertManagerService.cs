using PreSystem.StockControl.Application.Interfaces.Services;
using PreSystem.StockControl.Domain.Entities;
using PreSystem.StockControl.Domain.Interfaces.Repositories;

namespace PreSystem.StockControl.Application.Services
{
    public class AlertManagerService : IAlertManagerService
    {
        private readonly IComponentRepository _componentRepository;
        private readonly IStockAlertRepository _alertRepository;

        public AlertManagerService(
            IComponentRepository componentRepository,
            IStockAlertRepository alertRepository)
        {
            _componentRepository = componentRepository;
            _alertRepository = alertRepository;
        }

        public async Task CheckAndUpdateAlertsForComponentAsync(int componentId)
        {
            var component = await _componentRepository.GetByIdAsync(componentId);
            if (component == null) return;

            var existingAlerts = await _alertRepository.GetByComponentIdAsync(componentId);
            var hasAlert = existingAlerts.Any();

            // Componente com estoque baixo mas sem alerta? Criar alerta
            if (component.QuantityInStock <= component.MinimumQuantity && !hasAlert)
            {
                var alert = new StockAlert
                {
                    ComponentId = componentId,
                    Message = component.QuantityInStock == 0
                        ? $"Estoque crítico para componente {componentId}"
                        : $"Estoque baixo para componente {componentId}",
                    CreatedAt = DateTime.UtcNow
                };

                await _alertRepository.AddAsync(alert);
            }
            // Componente com estoque normal mas tem alerta? Remover alerta
            else if (component.QuantityInStock > component.MinimumQuantity && hasAlert)
            {
                foreach (var alert in existingAlerts)
                {
                    await _alertRepository.DeleteAsync(alert);
                }
            }
            // Atualizar mensagem do alerta se mudou de baixo para crítico
            else if (hasAlert)
            {
                var alert = existingAlerts.First();
                var newMessage = component.QuantityInStock == 0
                    ? $"Estoque crítico para componente {componentId}"
                    : $"Estoque baixo para componente {componentId}";

                if (alert.Message != newMessage)
                {
                    alert.Message = newMessage;
                    await _alertRepository.UpdateAsync(alert);
                }
            }
        }

        public async Task CheckAndUpdateAllAlertsAsync()
        {
            var components = await _componentRepository.GetAllAsync();

            foreach (var component in components)
            {
                await CheckAndUpdateAlertsForComponentAsync(component.Id);
            }
        }

        public async Task GenerateMissingAlertsAsync()
        {
            // Buscar componentes com estoque baixo que não têm alerta
            var allComponents = await _componentRepository.GetAllAsync();
            var allAlerts = await _alertRepository.GetAllAsync();

            var componentsWithLowStock = allComponents
                .Where(c => c.QuantityInStock <= c.MinimumQuantity);

            var alertedComponentIds = allAlerts.Select(a => a.ComponentId).ToHashSet();

            foreach (var component in componentsWithLowStock)
            {
                if (!alertedComponentIds.Contains(component.Id))
                {
                    var alert = new StockAlert
                    {
                        ComponentId = component.Id,
                        Message = component.QuantityInStock == 0
                            ? $"Estoque crítico para componente {component.Id}"
                            : $"Estoque baixo para componente {component.Id}",
                        CreatedAt = DateTime.UtcNow
                    };

                    await _alertRepository.AddAsync(alert);
                }
            }

            // Remover alertas de componentes que voltaram ao normal
            var componentsWithNormalStock = allComponents
                .Where(c => c.QuantityInStock > c.MinimumQuantity)
                .Select(c => c.Id)
                .ToHashSet();

            var alertsToRemove = allAlerts
                .Where(a => componentsWithNormalStock.Contains(a.ComponentId));

            foreach (var alert in alertsToRemove)
            {
                await _alertRepository.DeleteAsync(alert);
            }
        }
    }
}