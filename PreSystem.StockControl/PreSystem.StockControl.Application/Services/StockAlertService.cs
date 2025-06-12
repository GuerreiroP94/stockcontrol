using PreSystem.StockControl.Application.DTOs;
using PreSystem.StockControl.Application.DTOs.Filters;
using PreSystem.StockControl.Application.Interfaces.Services;
using PreSystem.StockControl.Domain.Interfaces.Repositories;

namespace PreSystem.StockControl.Application.Services
{
    public class StockAlertService : IStockAlertService
    {
        private readonly IStockAlertRepository _alertRepository;
        private readonly IComponentRepository _componentRepository;

        public StockAlertService(IStockAlertRepository alertRepository, IComponentRepository componentRepository)
        {
            _alertRepository = alertRepository;
            _componentRepository = componentRepository;
        }

        // Retorna todos os alertas de estoque
        public async Task<IEnumerable<StockAlertDto>> GetAllAlertsAsync(StockAlertQueryParameters parameters)
        {
            var alerts = await _alertRepository.GetAllAsync();

            if (parameters.ComponentId.HasValue)
                alerts = alerts.Where(a => a.ComponentId == parameters.ComponentId.Value);

            if (parameters.FromDate.HasValue)
                alerts = alerts.Where(a => a.CreatedAt >= parameters.FromDate.Value);

            if (parameters.ToDate.HasValue)
                alerts = alerts.Where(a => a.CreatedAt <= parameters.ToDate.Value);

            alerts = alerts
                .OrderByDescending(a => a.CreatedAt)
                .Skip((parameters.Page - 1) * parameters.PageSize)
                .Take(parameters.PageSize);

            return alerts.Select(a => new StockAlertDto
            {
                Id = a.Id,
                ComponentId = a.ComponentId,
                Message = a.Message,
                CreatedAt = a.CreatedAt
            });
        }


        // Retorna os alertas de um componente específico
        public async Task<IEnumerable<StockAlertDto>> GetAlertsByComponentIdAsync(int componentId)
        {
            var alerts = await _alertRepository.GetByComponentIdAsync(componentId);

            return alerts.Select(alert => new StockAlertDto
            {
                Id = alert.Id,
                ComponentId = alert.ComponentId,
                Message = alert.Message,
                CreatedAt = alert.CreatedAt
            });
        }

        public async Task<PurchaseListDto> GetPurchaseListAsync()
        {
            // Buscar todos os alertas ativos
            var alerts = await _alertRepository.GetAllAsync();

            // Buscar componentes únicos com alertas
            var componentIds = alerts.Select(a => a.ComponentId).Distinct().ToList();

            // TODO: Você precisa adicionar um método no IComponentRepository
            // Task<IEnumerable<Component>> GetByIdsAsync(IEnumerable<int> ids);

            // Por enquanto, vamos buscar todos e filtrar
            var allComponents = await _componentRepository.GetAllAsync();
            var alertedComponents = allComponents.Where(c => componentIds.Contains(c.Id)).ToList();

            // Agrupar componentes ignorando ambiente
            var grouped = alertedComponents
                .GroupBy(c => new {
                    c.Group,
                    c.Device,  // Este é o "nome" do componente
                    c.Value,
                    c.Package,
                    c.InternalCode
                })
                .Select(g => new PurchaseListItemDto
                {
                    ComponentName = g.Key.Device ?? "Sem nome",  // Device é o nome
                    Group = g.Key.Group,
                    Device = g.Key.Device,
                    Value = g.Key.Value,
                    Package = g.Key.Package,
                    InternalCode = g.Key.InternalCode,
                    Environments = g.Select(c => c.Environment).Distinct().ToList(),
                    MaximumMinimumQuantity = g.Max(c => c.MinimumQuantity),
                    SuggestedPurchase = g.Max(c => c.MinimumQuantity) * 2,
                    UnitPrice = g.Max(c => c.Price ?? 0),
                    TotalPrice = g.Max(c => c.MinimumQuantity) * 2 * g.Max(c => c.Price ?? 0)
                })
                .OrderBy(i => i.Group)
                .ThenBy(i => i.Device)
                .ToList();

            return new PurchaseListDto
            {
                Items = grouped,
                TotalValue = grouped.Sum(i => i.TotalPrice),
                TotalItems = grouped.Count
            };
        }
    }
}
