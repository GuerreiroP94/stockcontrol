using Microsoft.EntityFrameworkCore;
using PreSystem.StockControl.Domain.Entities;
using PreSystem.StockControl.Domain.Interfaces.Repositories;
using PreSystem.StockControl.Infrastructure.Persistence;

namespace PreSystem.StockControl.Infrastructure.Repositories
{
    public class StockMovementRepository : IStockMovementRepository
    {
        private readonly StockControlDbContext _context;

        public StockMovementRepository(StockControlDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<StockMovement>> GetAllAsync()
        {
            return await _context.StockMovements
                .Include(m => m.Component)
                .Include(m => m.User)
                .OrderByDescending(m => m.PerformedAt)
                .ToListAsync();
        }

        public async Task<StockMovement?> GetByIdAsync(int id)
        {
            return await _context.StockMovements
                .Include(m => m.Component)
                .Include(m => m.User)
                .FirstOrDefaultAsync(m => m.Id == id);
        }

        public async Task AddAsync(StockMovement movement)
        {
            await _context.StockMovements.AddAsync(movement);
            await _context.SaveChangesAsync();
        }

        public async Task UpdateAsync(StockMovement movement)
        {
            _context.StockMovements.Update(movement);
            await _context.SaveChangesAsync();
        }

        public async Task DeleteAsync(StockMovement movement)
        {
            _context.StockMovements.Remove(movement);
            await _context.SaveChangesAsync();
        }

        // Implementação do método GetByComponentIdAsync
        public async Task<IEnumerable<StockMovement>> GetByComponentIdAsync(int componentId)
        {
            return await _context.StockMovements
                .Include(m => m.Component)
                .Include(m => m.User)
                .Where(m => m.ComponentId == componentId)
                .OrderByDescending(m => m.PerformedAt)
                .ToListAsync();
        }
    }
}