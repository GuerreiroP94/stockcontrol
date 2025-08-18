using Microsoft.EntityFrameworkCore;
using PreSystem.StockControl.Domain.Entities;
using PreSystem.StockControl.Infrastructure.Persistence;

namespace PreSystem.StockControl.Infrastructure.Seeders
{
    public static class DatabaseSeeder
    {
        public static async Task SeedAsync(StockControlDbContext context)
        {
            try
            {
                Console.WriteLine("=== INICIANDO SEEDING ===");

                // Verificar se já existe usuário admin
                var adminExists = await context.Users
                    .AnyAsync(u => u.Role == "admin");

                if (!adminExists)
                {
                    Console.WriteLine("Criando usuário admin padrão...");

                    var adminUser = new User
                    {
                        Name = "Administrador",
                        Email = "admin@stockcontrol.com",
                        PasswordHash = BCrypt.Net.BCrypt.HashPassword("admin123"),
                        Role = "admin",
                        CreatedAt = DateTime.UtcNow
                    };

                    context.Users.Add(adminUser);
                    await context.SaveChangesAsync();

                    Console.WriteLine("✅ Usuário admin criado com sucesso!");
                    Console.WriteLine($"   Email: {adminUser.Email}");
                    Console.WriteLine($"   Senha: admin123");
                    Console.WriteLine($"   Role: {adminUser.Role}");
                }
                else
                {
                    Console.WriteLine("ℹ️ Usuário admin já existe no banco.");
                }

                // Criar usuário operador de exemplo também
                var operatorExists = await context.Users
                    .AnyAsync(u => u.Role == "operator" && u.Email == "operador@stockcontrol.com");

                if (!operatorExists)
                {
                    Console.WriteLine("Criando usuário operador de exemplo...");

                    var operatorUser = new User
                    {
                        Name = "Operador Exemplo",
                        Email = "operador@stockcontrol.com",
                        PasswordHash = BCrypt.Net.BCrypt.HashPassword("operador123"),
                        Role = "operator",
                        CreatedAt = DateTime.UtcNow
                    };

                    context.Users.Add(operatorUser);
                    await context.SaveChangesAsync();

                    Console.WriteLine("✅ Usuário operador criado com sucesso!");
                    Console.WriteLine($"   Email: {operatorUser.Email}");
                    Console.WriteLine($"   Senha: operador123");
                    Console.WriteLine($"   Role: {operatorUser.Role}");
                }

                Console.WriteLine("=== SEEDING CONCLUÍDO ===");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ Erro durante seeding: {ex.Message}");
                throw;
            }
        }
    }
}