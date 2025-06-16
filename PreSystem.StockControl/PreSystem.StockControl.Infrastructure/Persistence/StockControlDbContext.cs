using Microsoft.EntityFrameworkCore;
using PreSystem.StockControl.Domain.Entities;

namespace PreSystem.StockControl.Infrastructure.Persistence;

public class StockControlDbContext : DbContext
{
    public StockControlDbContext(DbContextOptions<StockControlDbContext> options)
        : base(options)
    {
    }

    public DbSet<Component> Components { get; set; }
    public DbSet<Product> Products { get; set; }
    public DbSet<ProductComponent> ProductComponents { get; set; }
    public DbSet<StockMovement> StockMovements { get; set; }
    public DbSet<StockAlert> StockAlerts { get; set; }
    public DbSet<User> Users { get; set; }
    public DbSet<PasswordResetToken> PasswordResetTokens { get; set; }
    public DbSet<ComponentGroup> ComponentGroups { get; set; }
    public DbSet<ComponentDevice> ComponentDevices { get; set; }
    public DbSet<ComponentValue> ComponentValues { get; set; }
    public DbSet<ComponentPackage> ComponentPackages { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Aplicar configurações existentes
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(StockControlDbContext).Assembly);

        // Configurações específicas para PostgreSQL
        ConfigureForPostgreSQL(modelBuilder);
    }

    private void ConfigureForPostgreSQL(ModelBuilder modelBuilder)
    {
        // 1. Configurar todos os DateTime para timestamp
        foreach (var entityType in modelBuilder.Model.GetEntityTypes())
        {
            foreach (var property in entityType.GetProperties())
            {
                if (property.ClrType == typeof(DateTime) || property.ClrType == typeof(DateTime?))
                {
                    property.SetColumnType("timestamp");
                }
            }
        }

        // 2. Configurar campo decimal
        modelBuilder.Entity<Component>()
            .Property(c => c.Price)
            .HasColumnType("numeric(18,2)");

        // 3. Configurar tamanhos de string para evitar text e usar varchar
        modelBuilder.Entity<Component>(entity =>
        {
            entity.Property(e => e.Name).HasMaxLength(200);
            entity.Property(e => e.Description).HasMaxLength(500);
            entity.Property(e => e.Group).HasMaxLength(100);
            entity.Property(e => e.Device).HasMaxLength(100);
            entity.Property(e => e.Value).HasMaxLength(100);
            entity.Property(e => e.Package).HasMaxLength(50);
            entity.Property(e => e.InternalCode).HasMaxLength(50);
            entity.Property(e => e.Environment).HasMaxLength(50);
            entity.Property(e => e.Drawer).HasMaxLength(50);
            entity.Property(e => e.Division).HasMaxLength(50);
            entity.Property(e => e.NCM).HasMaxLength(20);
            entity.Property(e => e.NVE).HasMaxLength(20);
            entity.Property(e => e.Characteristics).HasMaxLength(1000);
        });

        modelBuilder.Entity<User>(entity =>
        {
            entity.Property(e => e.Name).HasMaxLength(200);
            entity.Property(e => e.Email).HasMaxLength(200);
            entity.Property(e => e.Role).HasMaxLength(50);
            entity.Property(e => e.PasswordHash).HasMaxLength(500);
        });

        modelBuilder.Entity<Product>(entity =>
        {
            entity.Property(e => e.Name).HasMaxLength(200);
            entity.Property(e => e.Description).HasMaxLength(500);
            entity.Property(e => e.CreatedBy).HasMaxLength(200);
        });

        modelBuilder.Entity<StockMovement>(entity =>
        {
            entity.Property(e => e.MovementType).HasMaxLength(50);
            entity.Property(e => e.PerformedBy).HasMaxLength(200);
        });

        modelBuilder.Entity<StockAlert>(entity =>
        {
            entity.Property(e => e.Message).HasMaxLength(500);
        });

        modelBuilder.Entity<PasswordResetToken>(entity =>
        {
            entity.Property(e => e.Token).HasMaxLength(100);
            entity.Property(e => e.Email).HasMaxLength(200);
        });

        modelBuilder.Entity<ComponentGroup>(entity =>
        {
            entity.Property(e => e.Name).HasMaxLength(100);
        });

        modelBuilder.Entity<ComponentDevice>(entity =>
        {
            entity.Property(e => e.Name).HasMaxLength(100);
        });

        modelBuilder.Entity<ComponentValue>(entity =>
        {
            entity.Property(e => e.Name).HasMaxLength(100);
        });

        modelBuilder.Entity<ComponentPackage>(entity =>
        {
            entity.Property(e => e.Name).HasMaxLength(100);
        });

        // 4. Configurar índice único no email
        modelBuilder.Entity<User>()
            .HasIndex(u => u.Email)
            .IsUnique();
    }
}