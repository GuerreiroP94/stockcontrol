using Microsoft.EntityFrameworkCore;
using PreSystem.StockControl.Domain.Entities;
using PreSystem.StockControl.Domain.Interfaces.Repositories;
using PreSystem.StockControl.Infrastructure.Persistence;

namespace PreSystem.StockControl.Infrastructure.Repositories
{
    public class PasswordResetTokenRepository : IPasswordResetTokenRepository
    {
        private readonly StockControlDbContext _context;

        public PasswordResetTokenRepository(StockControlDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<PasswordResetToken>> GetAllAsync()
        {
            return await _context.PasswordResetTokens.ToListAsync();
        }

        public async Task<PasswordResetToken?> GetByIdAsync(int id)
        {
            return await _context.PasswordResetTokens.FindAsync(id);
        }

        public async Task<PasswordResetToken?> GetByTokenAsync(string token)
        {
            return await _context.PasswordResetTokens
                .Include(t => t.User)
                .FirstOrDefaultAsync(t => t.Token == token && !t.IsUsed && t.ExpiresAt > DateTime.UtcNow);
        }

        public async Task<PasswordResetToken?> GetActiveTokenByEmailAsync(string email)
        {
            return await _context.PasswordResetTokens
                .Where(t => t.Email.ToLower() == email.ToLower() && !t.IsUsed && t.ExpiresAt > DateTime.UtcNow)
                .OrderByDescending(t => t.CreatedAt)
                .FirstOrDefaultAsync();
        }

        public async Task InvalidateTokensByEmailAsync(string email)
        {
            var tokens = await _context.PasswordResetTokens
                .Where(t => t.Email.ToLower() == email.ToLower() && !t.IsUsed)
                .ToListAsync();

            foreach (var token in tokens)
            {
                token.IsUsed = true;
            }

            await _context.SaveChangesAsync();
        }

        public async Task AddAsync(PasswordResetToken entity)
        {
            await _context.PasswordResetTokens.AddAsync(entity);
            await _context.SaveChangesAsync();
        }

        public async Task UpdateAsync(PasswordResetToken entity)
        {
            _context.PasswordResetTokens.Update(entity);
            await _context.SaveChangesAsync();
        }

        public async Task DeleteAsync(PasswordResetToken entity)
        {
            _context.PasswordResetTokens.Remove(entity);
            await _context.SaveChangesAsync();
        }
    }
}