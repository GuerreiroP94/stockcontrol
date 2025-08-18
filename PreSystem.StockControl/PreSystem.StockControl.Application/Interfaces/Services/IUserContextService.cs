namespace PreSystem.StockControl.Application.Interfaces.Services
{
    public interface IUserContextService
    {
        int? GetCurrentUserId();
        string? GetCurrentUserRole();
        string? GetCurrentUserEmail();
        bool IsCurrentUserAdmin();
        bool IsAuthenticated();
        string? GetCurrentUsername(); // <- ADICIONAR APENAS ESTA LINHA
    }
}