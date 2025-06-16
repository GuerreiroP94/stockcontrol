using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using Microsoft.Extensions.Configuration;
using PreSystem.StockControl.Infrastructure.Persistence;

namespace PreSystem.StockControl.Infrastructure
{
    public class StockControlDbContextFactory : IDesignTimeDbContextFactory<StockControlDbContext>
    {
        public StockControlDbContext CreateDbContext(string[] args)
        {
            // Caminho para o appsettings.json
            var configuration = new ConfigurationBuilder()
                .SetBasePath(Directory.GetCurrentDirectory())
                .AddJsonFile("appsettings.json")
                .Build();

            // Pega a connection string
            var connectionString = configuration.GetConnectionString("DefaultConnection");

            var optionsBuilder = new DbContextOptionsBuilder<StockControlDbContext>();
            optionsBuilder.UseNpgsql(connectionString); // Mudou de UseSqlServer para UseNpgsql

            return new StockControlDbContext(optionsBuilder.Options);
        }
    }
}