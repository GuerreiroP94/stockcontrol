namespace PreSystem.StockControl.Domain.Entities
{
    public class PasswordResetToken
    {
        public int Id { get; set; }

        // Token único gerado
        public string Token { get; set; } = Guid.NewGuid().ToString();

        // Email do usuário
        public string Email { get; set; } = string.Empty;

        // Data de expiração (24 horas)
        public DateTime ExpiresAt { get; set; }

        // Se já foi usado
        public bool IsUsed { get; set; } = false;

        // Data de criação
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // ID do usuário (opcional)
        public int? UserId { get; set; }

        // Navegação
        public User? User { get; set; }
    }
}