using PreSystem.StockControl.Application.Interfaces.Services;
using PreSystem.StockControl.Application.Services;
using PreSystem.StockControl.Domain.Interfaces.Repositories;
using PreSystem.StockControl.Infrastructure.Repositories;
using PreSystem.StockControl.Infrastructure.Persistence;
using PreSystem.StockControl.WebApi.Configurations;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using FluentValidation;
using FluentValidation.AspNetCore;

var builder = WebApplication.CreateBuilder(args);

Console.WriteLine("=== INICIANDO APLICAÇÃO ===");
Console.WriteLine($"Environment: {builder.Environment.EnvironmentName}");

// Configuração da porta para Railway
var port = Environment.GetEnvironmentVariable("PORT") ?? "5000";
builder.WebHost.UseUrls($"http://0.0.0.0:{port}");
Console.WriteLine($"Aplicação configurada para porta: {port}");

// Carregar variáveis de ambiente
if (builder.Environment.IsDevelopment())
{
    try
    {
        DotNetEnv.Env.Load();
        Console.WriteLine("Arquivo .env carregado");
    }
    catch (Exception ex)
    {
        Console.WriteLine($"Arquivo .env não encontrado: {ex.Message}");
    }
}

// Configurar connection string do PostgreSQL
var connectionString = Environment.GetEnvironmentVariable("DATABASE_URL");
if (!string.IsNullOrEmpty(connectionString))
{
    // Converter DATABASE_URL do Railway para connection string do .NET
    var databaseUri = new Uri(connectionString);
    var userInfo = databaseUri.UserInfo.Split(':');
    
    connectionString = $"Host={databaseUri.Host};" +
                      $"Port={databaseUri.Port};" +
                      $"Database={databaseUri.LocalPath.TrimStart('/')};" +
                      $"Username={userInfo[0]};" +
                      $"Password={userInfo[1]};" +
                      $"SSL Mode=Require;Trust Server Certificate=true";
    
    builder.Configuration["ConnectionStrings:DefaultConnection"] = connectionString;
}

// Adicionar as variáveis de ambiente à configuração
builder.Configuration.AddInMemoryCollection(new Dictionary<string, string?>
{
    ["EmailSettings:SmtpUser"] = Environment.GetEnvironmentVariable("EMAIL_SMTP_USER"),
    ["EmailSettings:SmtpPassword"] = Environment.GetEnvironmentVariable("EMAIL_SMTP_PASSWORD"),
    ["EmailSettings:FromEmail"] = Environment.GetEnvironmentVariable("EMAIL_FROM"),
    ["FrontendUrl"] = Environment.GetEnvironmentVariable("FRONTEND_URL") ?? "http://localhost:3000"
});

// Configuração do CORS - CORRIGIDA
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend",
        policy =>
        {
            var frontendUrl = Environment.GetEnvironmentVariable("FRONTEND_URL");
            
            // Lista de origens permitidas
            var allowedOrigins = new List<string>();
            
            // Adicionar URLs do ambiente
            if (!string.IsNullOrEmpty(frontendUrl))
            {
                allowedOrigins.AddRange(frontendUrl.Split(','));
            }
            
            // Adicionar localhost para desenvolvimento
            allowedOrigins.Add("http://localhost:3000");
            allowedOrigins.Add("http://localhost:5173");
            allowedOrigins.Add("http://localhost:5000");
            
            // Configurar CORS corretamente
            policy.WithOrigins(allowedOrigins.ToArray())
                  .AllowAnyHeader()
                  .AllowAnyMethod()
                  .AllowCredentials();
        });
});

// Adicionar DbContext
builder.Services.AddDbContext<StockControlDbContext>(options =>
{
    var connStr = builder.Configuration.GetConnectionString("DefaultConnection");
    if (!string.IsNullOrEmpty(connStr))
    {
        options.UseNpgsql(connStr);
        Console.WriteLine("PostgreSQL configurado com sucesso");
    }
    else
    {
        Console.WriteLine("AVISO: Connection string não encontrada!");
    }
});

// Adicionar todas as dependências do projeto
builder.Services.AddProjectDependencies(builder.Configuration);

// Adicionar User Repository (que estava faltando)
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<IUserService, UserService>();

// Serviços básicos
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Adicionar FluentValidation
builder.Services.AddFluentValidationAutoValidation();
builder.Services.AddFluentValidationClientsideAdapters();

// JWT
var jwtSecret = Environment.GetEnvironmentVariable("JWT_SECRET") ?? "chave-secreta-super-segura-para-producao-123456";
var key = Encoding.ASCII.GetBytes(jwtSecret);

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.RequireHttpsMetadata = false;
        options.SaveToken = true;
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(key),
            ValidateIssuer = false,
            ValidateAudience = false,
            ClockSkew = TimeSpan.Zero
        };
    });

// Health checks
builder.Services.AddHealthChecks();

var app = builder.Build();

// Aplicar migrations automaticamente (com tratamento de erro melhorado)
try
{
    using (var scope = app.Services.CreateScope())
    {
        var dbContext = scope.ServiceProvider.GetRequiredService<StockControlDbContext>();
        Console.WriteLine("Aplicando migrations...");
        dbContext.Database.Migrate();
        Console.WriteLine("Migrations aplicadas com sucesso!");
    }
}
catch (Exception ex)
{
    Console.WriteLine($"Erro ao aplicar migrations: {ex.Message}");
    // Não falhar a aplicação se as migrations falharem
}

// Middlewares
app.UseCors("AllowFrontend");
app.UseAuthentication();
app.UseAuthorization();

app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "PreSystem.StockControl v1");
    c.RoutePrefix = string.Empty;
});

// Endpoints
app.MapGet("/", () => new
{
    message = "PreSystem Stock Control API",
    status = "running",
    timestamp = DateTime.UtcNow
});

app.MapGet("/health", () => Results.Ok(new { status = "healthy" }));
app.MapHealthChecks("/healthz");
app.MapControllers();

app.Run();
