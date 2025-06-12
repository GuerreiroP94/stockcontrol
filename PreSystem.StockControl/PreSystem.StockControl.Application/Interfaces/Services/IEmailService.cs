namespace PreSystem.StockControl.Application.Interfaces.Services
{
    public interface IEmailService
    {
        Task<bool> SendPasswordResetEmailAsync(string toEmail, string resetLink);
        Task<bool> SendEmailAsync(string toEmail, string subject, string body);
    }
}