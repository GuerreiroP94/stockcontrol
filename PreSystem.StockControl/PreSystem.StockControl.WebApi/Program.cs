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

// ⚠️ CONFIGURAÇÃO CRUCIAL PARA RENDER
var port = Environment.GetEnvironmentVariable("PORT") ?? "5000";
builder.WebHost.UseUrls($"http://0.0.0.0:{port}");
Console.WriteLine($"✅ Aplicação configurada para porta: {port}");

// Carregar variáveis de ambiente
if (builder.Environment.IsDevelopment())
{
    try
    {
        DotNetEnv.Env.Load();
        Console.WriteLine("✅ Arquivo .env carregado");
    }
    catch (Exception ex)
    {
        Console.WriteLine($"⚠️ Arquivo .env não encontrado: {ex.Message}");
    }
}

// ⚠️ CORREÇÃO CRÍTICA - DATABASE CONNECTION STRING
var connectionString = Environment.GetEnvironmentVariable("DATABASE_URL");
Console.WriteLine($"🔍 DATABASE_URL encontrada: {!string.IsNullOrEmpty(connectionString)}");

if (!string.IsNullOrEmpty(connectionString))
{
    try
    {
        Console.WriteLine($"🔍 DATABASE_URL raw: {connectionString.Substring(0, Math.Min(50, connectionString.Length))}...");

        var databaseUri = new Uri(connectionString);
        var userInfo = databaseUri.UserInfo?.Split(':');

        // Validações mais robustas
        if (userInfo == null || userInfo.Length != 2)
        {
            throw new InvalidOperationException("DATABASE_URL deve conter username:password");
        }

        var host = databaseUri.Host;
        var port_db = databaseUri.Port > 0 ? databaseUri.Port : 5432; // Default PostgreSQL port
        var database = databaseUri.LocalPath.TrimStart('/');
        var username = userInfo[0];
        var password = userInfo[1];

        // Log para debug (sem mostrar senha completa)
        Console.WriteLine($"🔍 Parsed - Host: {host}, Port: {port_db}, Database: {database}, Username: {username}");

        // Validar componentes
        if (string.IsNullOrEmpty(host)) throw new InvalidOperationException("Host não encontrado na DATABASE_URL");
        if (string.IsNullOrEmpty(database)) throw new InvalidOperationException("Database não encontrado na DATABASE_URL");
        if (string.IsNullOrEmpty(username)) throw new InvalidOperationException("Username não encontrado na DATABASE_URL");
        if (string.IsNullOrEmpty(password)) throw new InvalidOperationException("Password não encontrado na DATABASE_URL");

        // Construir connection string mais robusta
        connectionString = $"Host={host};" +
                          $"Port={port_db};" +
                          $"Database={database};" +
                          $"Username={username};" +
                          $"Password={password};" +
                          $"SSL Mode=Require;" +
                          $"Trust Server Certificate=true;" +
                          $"Include Error Detail=true";

        builder.Configuration["ConnectionStrings:DefaultConnection"] = connectionString;
        Console.WriteLine("✅ PostgreSQL connection string configurada");
    }
    catch (Exception ex)
    {
        Console.WriteLine($"❌ Erro ao processar DATABASE_URL: {ex.Message}");
        Console.WriteLine($"DATABASE_URL format esperado: postgres://username:password@host:port/database");

        // Fallback para connection string local (apenas em development)
        if (builder.Environment.IsDevelopment())
        {
            Console.WriteLine("⚠️ Usando connection string local para desenvolvimento");
            builder.Configuration["ConnectionStrings:DefaultConnection"] =
                "Host=localhost;Port=5432;Database=PreSystemDB;Username=postgres;Password=123456";
        }
        else
        {
            throw; // Re-throw em production
        }
    }
}
else
{
    Console.WriteLine("⚠️ DATABASE_URL não encontrada nas variáveis de ambiente");

    // Em desenvolvimento, usar connection string do appsettings.json
    if (builder.Environment.IsDevelopment())
    {
        Console.WriteLine("ℹ️ Usando connection string do appsettings.json");
    }
    else
    {
        throw new InvalidOperationException("DATABASE_URL é obrigatória em produção");
    }
}

// Adicionar as variáveis de ambiente à configuração
builder.Configuration.AddInMemoryCollection(new Dictionary<string, string?>
{
    ["EmailSettings:SmtpUser"] = Environment.GetEnvironmentVariable("EMAIL_SMTP_USER"),
    ["EmailSettings:SmtpPassword"] = Environment.GetEnvironmentVariable("EMAIL_SMTP_PASSWORD"),
    ["EmailSettings:FromEmail"] = Environment.GetEnvironmentVariable("EMAIL_FROM"),
    ["FrontendUrl"] = Environment.GetEnvironmentVariable("FRONTEND_URL") ??
        "https://stock-control-frontend.onrender.com"
});

// ⚠️ CORS CONFIGURATION - FUNCIONAL PARA RENDER
Console.WriteLine("🌐 Configurando CORS...");
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy
            .AllowAnyOrigin()
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

// Adicionar DbContext
builder.Services.AddDbContext<StockControlDbContext>(options =>
{
    var connStr = builder.Configuration.GetConnectionString("DefaultConnection");
    if (!string.IsNullOrEmpty(connStr))
    {
        options.UseNpgsql(connStr);
        Console.WriteLine("✅ PostgreSQL DbContext configurado");
    }
    else
    {
        Console.WriteLine("❌ ERRO: Connection string não encontrada!");
    }
});

// Adicionar todas as dependências do projeto
builder.Services.AddProjectDependencies(builder.Configuration);

// Adicionar repositories e services
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<IUserContextService, UserContextService>();

// Serviços básicos
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// FluentValidation
builder.Services.AddFluentValidationAutoValidation();
builder.Services.AddFluentValidationClientsideAdapters();

// ⚠️ JWT CONFIGURAÇÃO CORRIGIDA
var jwtSecret = Environment.GetEnvironmentVariable("JWT_SECRET") ??
    "chave-super-secreta-para-desenvolvimento";
Console.WriteLine($"✅ JWT Secret configurado (length: {jwtSecret.Length})");

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret)),
            ValidateIssuer = false,
            ValidateAudience = false,
            ClockSkew = TimeSpan.Zero
        };
    });

// Health checks
builder.Services.AddHealthChecks();

var app = builder.Build();

// ⚠️ MIGRAÇÃO AUTOMÁTICA E SEED (PARA RENDER)
try
{
    using (var scope = app.Services.CreateScope())
    {
        var context = scope.ServiceProvider.GetRequiredService<StockControlDbContext>();

        Console.WriteLine("🔄 Executando migrações...");
        await context.Database.MigrateAsync();
        Console.WriteLine("✅ Migrações executadas com sucesso");

        Console.WriteLine("🌱 Executando seed...");
        await DatabaseSeeder.SeedAsync(context);
        Console.WriteLine("✅ Seed executado com sucesso");
    }
}
catch (Exception ex)
{
    Console.WriteLine($"❌ Erro durante migração/seed: {ex.Message}");
    Console.WriteLine($"StackTrace: {ex.StackTrace}");
}

// ⚠️ CONFIGURAÇÃO DE MIDDLEWARE PARA RENDER
Console.WriteLine("🔧 Configurando middleware...");

// Swagger sempre ativado (para debug no Render)
app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "Stock Control API v1");
    c.RoutePrefix = "swagger";
});

// ✅ CORS SIMPLIFICADO E CORRETO
app.UseCors("AllowAll");

// ✅ MIDDLEWARE APENAS PARA DEBUG (opcional - não interfere no CORS)
app.Use(async (context, next) =>
{
    // Log apenas para debug - NÃO manipula a response
    if (context.Request.Method == "OPTIONS")
    {
        Console.WriteLine($"🔧 CORS Preflight para: {context.Request.Path} - Origin: {context.Request.Headers.Origin}");
    }
    await next();
});

// Autenticação e autorização
app.UseAuthentication();
app.UseAuthorization();

// ⚠️ ENDPOINTS DE DEBUG ESSENCIAIS PARA RENDER
app.MapGet("/", () =>
{
    return Results.Ok(new
    {
        message = "PreSystem Stock Control API - FUNCIONANDO NO RENDER!",
        status = "running",
        timestamp = DateTime.UtcNow,
        environment = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT"),
        port = Environment.GetEnvironmentVariable("PORT"),
        frontendUrl = Environment.GetEnvironmentVariable("FRONTEND_URL"),
        corsEnabled = true
    });
});

app.MapGet("/health", () =>
{
    Console.WriteLine("❤️ Health check executado");
    return Results.Ok(new
    {
        status = "healthy",
        timestamp = DateTime.UtcNow,
        service = "stock-control-backend"
    });
});

// Endpoint para testar conectividade do frontend
app.MapGet("/api/test", () =>
{
    Console.WriteLine("🧪 API Test endpoint chamado");
    return Results.Ok(new
    {
        message = "API funcionando!",
        timestamp = DateTime.UtcNow,
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
        message = "CORS Debug OK",
        origin = origin,
        allHeaders = headers,
        timestamp = DateTime.UtcNow
    });
});

// ✅ NOVO ENDPOINT - Teste específico POST para debug CORS
app.MapPost("/debug/login-test", (HttpContext context) =>
{
    var origin = context.Request.Headers.Origin.FirstOrDefault();
    Console.WriteLine($"🧪 POST Login Test - Origin: {origin}");

    return Results.Ok(new
    {
        message = "POST Login Test OK - CORS funcionando!",
        origin = origin,
        method = context.Request.Method,
        timestamp = DateTime.UtcNow,
        note = "Se você está vendo isso, CORS está funcionando para POST"
    });
});

// ✅ NOVO ENDPOINT - Teste de conectividade com database
app.MapGet("/debug/database", async () =>
{
    try
    {
        using var scope = app.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<StockControlDbContext>();

        // Testa conexão simples
        await context.Database.CanConnectAsync();

        Console.WriteLine("✅ Database connection test OK");

        return Results.Ok(new
        {
            message = "Database connection OK!",
            timestamp = DateTime.UtcNow,
            status = "connected"
        });
    }
    catch (Exception ex)
    {
        Console.WriteLine($"❌ Database connection test failed: {ex.Message}");

        return Results.Json(new
        {
            message = "Database connection FAILED",
            error = ex.Message,
            timestamp = DateTime.UtcNow,
            status = "failed"
        }, statusCode: 500);
    }
});

// Health checks endpoint
app.MapHealthChecks("/healthz");

// Controllers
app.MapControllers();

Console.WriteLine("=== ✅ APLICAÇÃO INICIADA COM SUCESSO ===");
Console.WriteLine($"🌐 CORS: AllowAll policy ativa");
Console.WriteLine($"🔗 Frontend URL: {Environment.GetEnvironmentVariable("FRONTEND_URL")}");
Console.WriteLine($"📊 Swagger disponível em: /swagger");

app.Run();