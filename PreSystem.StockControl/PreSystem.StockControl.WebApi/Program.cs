using PreSystem.StockControl.Application.Interfaces.Services;
using PreSystem.StockControl.Application.Services;
using PreSystem.StockControl.Domain.Interfaces.Repositories;
using PreSystem.StockControl.Infrastructure.Repositories;
using PreSystem.StockControl.Infrastructure.Persistence;
using PreSystem.StockControl.Infrastructure.Seeders;  // <- ADICIONAR ESTA LINHA
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

// Configuração da porta para Render
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
    // Converter DATABASE_URL do Render para connection string do .NET
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

// SUBSTITUIR A SEÇÃO DE CORS POR ESTA:
// Configuração do CORS - CORRIGIDA PARA RENDER
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy
            .SetIsOriginAllowed(origin =>
            {
                Console.WriteLine($"🌐 CORS Origin request: {origin}");

                // Lista de origens permitidas
                var allowedOrigins = new[]
                {
                    "https://stock-control-frontend.onrender.com",
                    "http://localhost:3000",
                    "http://localhost:5173",
                    "http://localhost:8080"
                };

                // Verificar se a origem está na lista
                var isAllowed = allowedOrigins.Contains(origin);

                // Durante debug, também aceitar qualquer origem do Render
                if (!isAllowed && origin?.Contains("onrender.com") == true)
                {
                    isAllowed = true;
                    Console.WriteLine($"✅ Render origin aceito: {origin}");
                }

                Console.WriteLine($"🔍 Origin {origin} permitido: {isAllowed}");
                return isAllowed;
            })
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

// MANTER AS CONFIGURAÇÕES ORIGINAIS - NÃO REMOVER
// Adicionar todas as dependências do projeto
builder.Services.AddProjectDependencies(builder.Configuration);

// Adicionar User Repository (que estava faltando) - ADICIONAR SÓ ESTAS LINHAS
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

// SUBSTITUIR A SEÇÃO DE MIGRATIONS POR ESTA:
// Aplicar migrations e seeding automaticamente
try
{
    using (var scope = app.Services.CreateScope())
    {
        var dbContext = scope.ServiceProvider.GetRequiredService<StockControlDbContext>();

        Console.WriteLine("Aplicando migrations...");
        dbContext.Database.Migrate();
        Console.WriteLine("Migrations aplicadas com sucesso!");

        // EXECUTAR SEEDING
        Console.WriteLine("Executando seeding...");
        await DatabaseSeeder.SeedAsync(dbContext);
        Console.WriteLine("Seeding concluído!");
    }
}
catch (Exception ex)
{
    Console.WriteLine($"Erro ao aplicar migrations/seeding: {ex.Message}");
    Console.WriteLine($"Stack trace: {ex.StackTrace}");
    // Não falhar a aplicação se as migrations falharem
}

// Middlewares - SUBSTITUIR POR:
Console.WriteLine("🌐 Configurando CORS...");
app.UseCors("AllowFrontend");
app.UseAuthentication();
app.UseAuthorization();

app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "PreSystem.StockControl v1");
    c.RoutePrefix = string.Empty;
});

// Endpoints - MANTER OS ORIGINAIS E ADICIONAR ESTES:
app.MapGet("/", () => new
{
    message = "PreSystem Stock Control API",
    status = "running",
    timestamp = DateTime.UtcNow,
    environment = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT"),
    port = Environment.GetEnvironmentVariable("PORT"),
    frontendUrl = Environment.GetEnvironmentVariable("FRONTEND_URL")
});

app.MapGet("/health", () => Results.Ok(new { status = "healthy" }));

// ADICIONAR ENDPOINT DE DEBUG CORS
app.MapGet("/debug/cors", (HttpContext context) =>
{
    var origin = context.Request.Headers.Origin.FirstOrDefault();
    Console.WriteLine($"🔍 Debug CORS - Origin: {origin}");

    return Results.Ok(new
    {
        message = "CORS Debug Info",
        origin = origin,
        timestamp = DateTime.UtcNow,
        allowedOrigins = new[]
        {
            "https://stock-control-frontend.onrender.com",
            "http://localhost:3000",
            "http://localhost:5173",
            "http://localhost:8080"
        }
    });
});

app.MapHealthChecks("/healthz");
app.MapControllers();

Console.WriteLine("=== APLICAÇÃO INICIADA COM SUCESSO ===");
Console.WriteLine($"🌐 CORS configurado para aceitar: https://stock-control-frontend.onrender.com");

app.Run();