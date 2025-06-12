using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using PreSystem.StockControl.Application.Interfaces.Services;
using System.Net;
using System.Net.Mail;

namespace PreSystem.StockControl.Application.Services
{
    public class EmailService : IEmailService
    {
        private readonly IConfiguration _configuration;
        private readonly ILogger<EmailService> _logger;

        public EmailService(IConfiguration configuration, ILogger<EmailService> logger)
        {
            _configuration = configuration;
            _logger = logger;
        }

        public async Task<bool> SendPasswordResetEmailAsync(string toEmail, string resetLink)
        {
            var subject = "Recuperação de Senha - PreSystem";
            var body = $@"
                <h2>Recuperação de Senha</h2>
                <p>Você solicitou a recuperação de senha para sua conta no PreSystem.</p>
                <p>Clique no link abaixo para criar uma nova senha:</p>
                <p><a href='{resetLink}'>Resetar Senha</a></p>
                <p>Se você não solicitou esta recuperação, ignore este email.</p>
                <p>Este link expira em 24 horas.</p>
                <br>
                <p>Atenciosamente,<br>Equipe PreSystem</p>
            ";

            return await SendEmailAsync(toEmail, subject, body);
        }

        public async Task<bool> SendEmailAsync(string toEmail, string subject, string body)
        {
            try
            {
                // Em desenvolvimento, apenas loga o email
                var isDevelopment = _configuration.GetValue<bool>("EmailSettings:UseDevelopmentMode", true);

                if (isDevelopment)
                {
                    _logger.LogInformation("=== EMAIL DE DESENVOLVIMENTO ===");
                    _logger.LogInformation($"Para: {toEmail}");
                    _logger.LogInformation($"Assunto: {subject}");
                    _logger.LogInformation($"Corpo: {body}");
                    _logger.LogInformation("================================");
                    return true;
                }

                // Configurações SMTP para produção
                var smtpHost = _configuration.GetValue<string>("EmailSettings:SmtpHost") ?? "smtp.gmail.com";
                var smtpPort = _configuration.GetValue<int>("EmailSettings:SmtpPort", 587);
                var smtpUser = _configuration.GetValue<string>("EmailSettings:SmtpUser") ?? "";
                var smtpPassword = _configuration.GetValue<string>("EmailSettings:SmtpPassword") ?? "";
                var fromEmail = _configuration.GetValue<string>("EmailSettings:FromEmail") ?? smtpUser;
                var fromName = _configuration.GetValue<string>("EmailSettings:FromName") ?? "PreSystem";

                using var client = new SmtpClient(smtpHost, smtpPort)
                {
                    EnableSsl = true,
                    UseDefaultCredentials = false,
                    Credentials = new NetworkCredential(smtpUser, smtpPassword)
                };

                var mailMessage = new MailMessage
                {
                    From = new MailAddress(fromEmail, fromName),
                    Subject = subject,
                    Body = body,
                    IsBodyHtml = true
                };
                mailMessage.To.Add(toEmail);

                await client.SendMailAsync(mailMessage);

                _logger.LogInformation("Email enviado com sucesso para {Email}", toEmail);
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao enviar email para {Email}", toEmail);
                return false;
            }
        }
    }
}