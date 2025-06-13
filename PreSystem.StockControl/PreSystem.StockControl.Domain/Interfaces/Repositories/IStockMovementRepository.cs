using PreSystem.StockControl.Domain.Entities;

namespace PreSystem.StockControl.Domain.Interfaces.Repositories
{
    // Interface para ações no repositório de movimentações de estoque
    public interface IStockMovementRepository : IRepository<StockMovement>
    {
        // Retorna movimentações de um componente específico
        Task<IEnumerable<StockMovement>> GetByComponentIdAsync(int componentId);
    }
}