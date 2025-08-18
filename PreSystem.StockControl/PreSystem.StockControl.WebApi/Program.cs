using PreSystem.StockControl.Application.Interfaces.Services;
using PreSystem.StockControl.Application.Services;
using PreSystem.StockControl.Domain.Interfaces.Repositories;
using PreSystem.StockControl.Infrastructure.Repositories;
using PreSystem.StockControl.Infrastructure.Persistence;
using PreSystem.StockControl.Infrastructure.Seeders;
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

// CORS CONFIGURATION - SUPER PERMISSIVO PARA FUNCIONAR
Console.WriteLine("🌐 Configurando CORS...");
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy
            .SetIsOriginAllowed(origin =>
            {
                Console.WriteLine($"🔍 CORS Origin: {origin}");
                // Permitir todas as origens do Render por enquanto
                if (string.IsNullOrEmpty(origin))
                {
                    Console.WriteLine("✅ Origin vazio - permitido");
                    return true;
                }

                if (origin.Contains("onrender.com") || origin.Contains("localhost"))
                {
                    Console.WriteLine($"✅ Origin permitido: {origin}");
                    return true;
                }

                Console.WriteLine($"❌ Origin negado: {origin}");
                return false;
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
        Console.WriteLine("✅ PostgreSQL configurado com sucesso");
    }
    else
    {
        Console.WriteLine("⚠️ AVISO: Connection string não encontrada!");
    }
});

// Adicionar todas as dependências do projeto
builder.Services.AddProjectDependencies(builder.Configuration);

// Adicionar User Repository e Service
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<IUserService, UserService>();

// Adicionar HttpContextAccessor e UserContextService
builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<IUserContextService, UserContextService>();

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
Console.WriteLine($"🔐 JWT Secret configurado: {jwtSecret[..10]}...");

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

// Aplicar migrations e seeding automaticamente
try
{
    using (var scope = app.Services.CreateScope())
    {
        var dbContext = scope.ServiceProvider.GetRequiredService<StockControlDbContext>();

        Console.WriteLine("📊 Aplicando migrations...");
        dbContext.Database.Migrate();
        Console.WriteLine("✅ Migrations aplicadas com sucesso!");

        // EXECUTAR SEEDING
        Console.WriteLine("🌱 Executando seeding...");
        await DatabaseSeeder.SeedAsync(dbContext);
        Console.WriteLine("✅ Seeding concluído!");
    }
}
catch (Exception ex)
{
    Console.WriteLine($"❌ Erro ao aplicar migrations/seeding: {ex.Message}");
    Console.WriteLine($"Stack trace: {ex.StackTrace}");
}

// MIDDLEWARES - ORDEM CRÍTICA!
Console.WriteLine("🔧 Configurando middlewares...");

// 1. CORS PRIMEIRO
app.UseCors("AllowAll");

// 2. Desenvolvimento
if (app.Environment.IsDevelopment() || app.Environment.IsProduction())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "PreSystem.StockControl v1");
        c.RoutePrefix = string.Empty;
    });
}

// 3. Autenticação
app.UseAuthentication();
app.UseAuthorization();

// ENDPOINTS DE DEBUG
app.MapGet("/", (HttpContext context) =>
{
    var origin = context.Request.Headers.Origin.FirstOrDefault();
    Console.WriteLine($"🏠 Root endpoint - Origin: {origin}");

    return Results.Ok(new
    {
        message = "PreSystem Stock Control API - FUNCIONANDO!",
        status = "running",
        timestamp = DateTime.UtcNow,
        environment = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT"),
        port = Environment.GetEnvironmentVariable("PORT"),
        origin = origin,
        corsEnabled = true
    });
});

app.MapGet("/health", (HttpContext context) =>
{
    var origin = context.Request.Headers.Origin.FirstOrDefault();
    Console.WriteLine($"❤️ Health check - Origin: {origin}");

    return Results.Ok(new
    {
        status = "healthy",
        timestamp = DateTime.UtcNow,
        origin = origin,
        cors = "enabled"
    });
});

// Endpoint de debug CORS
app.MapGet("/debug/cors", (HttpContext context) =>
{
    var origin = context.Request.Headers.Origin.FirstOrDefault();
    var headers = context.Request.Headers.ToDictionary(h => h.Key, h => h.Value.ToString());

    Console.WriteLine($"🔍 Debug CORS - Origin: {origin}");

    return Results.Ok(new
    {
        message = "CORS Debug - Funcionando!",
        origin = origin,
        allHeaders = headers,
        timestamp = DateTime.UtcNow,
        corsPolicy = "AllowAll",
        status = "OK"
    });
});

// Endpoint de teste POST
app.MapPost("/debug/test", (HttpContext context) =>
{
    var origin = context.Request.Headers.Origin.FirstOrDefault();
    Console.WriteLine($"🧪 POST Test - Origin: {origin}");

    return Results.Ok(new
    {
        message = "POST funcionando!",
        origin = origin,
        method = context.Request.Method,
        timestamp = DateTime.UtcNow
    });
});

app.MapHealthChecks("/healthz");
app.MapControllers();

Console.WriteLine("=== ✅ APLICAÇÃO INICIADA COM SUCESSO ===");
Console.WriteLine($"🌐 CORS configurado como AllowAll");
Console.WriteLine($"🔗 Frontend URL esperada: https://stock-control-frontend.onrender.com");
Console.WriteLine($"📊 Swagger: https://stock-control-backend.onrender.com");

app.Run();