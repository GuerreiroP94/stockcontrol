namespace PreSystem.StockControl.Application.DTOs
{
    // DTO para solicitar recuperação de senha
    public class ForgotPasswordDto
    {
        public string Email { get; set; } = string.Empty;
    }

    // DTO para resetar a senha
    public class ResetPasswordDto
    {
        public string Token { get; set; } = string.Empty;
        public string NewPassword { get; set; } = string.Empty;
        public string ConfirmPassword { get; set; } = string.Empty;
    }

    // DTO de resposta
    public class PasswordResetResponseDto
    {
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
        public string? Token { get; set; } // Apenas para desenvolvimento/testes
    }
}