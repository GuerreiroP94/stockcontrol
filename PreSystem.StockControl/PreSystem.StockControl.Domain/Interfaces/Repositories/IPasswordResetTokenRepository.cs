using PreSystem.StockControl.Domain.Entities;

namespace PreSystem.StockControl.Domain.Interfaces.Repositories
{
    public interface IPasswordResetTokenRepository : IRepository<PasswordResetToken>
    {
        Task<PasswordResetToken?> GetByTokenAsync(string token);
        Task<PasswordResetToken?> GetActiveTokenByEmailAsync(string email);
        Task InvalidateTokensByEmailAsync(string email);
    }
}