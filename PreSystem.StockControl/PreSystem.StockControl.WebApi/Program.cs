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
    Console.WriteLine("✅ PostgreSQL connection string configurada");
}

// Adicionar as variáveis de ambiente à configuração
builder.Configuration.AddInMemoryCollection(new Dictionary<string, string?>
{
    ["EmailSettings:SmtpUser"] = Environment.GetEnvironmentVariable("EMAIL_SMTP_USER"),
    ["EmailSettings:SmtpPassword"] = Environment.GetEnvironmentVariable("EMAIL_SMTP_PASSWORD"),
    ["EmailSettings:FromEmail"] = Environment.GetEnvironmentVariable("EMAIL_FROM"),
    ["FrontendUrl"] = Environment.GetEnvironmentVariable("FRONTEND_URL") ?? "https://stock-control-frontend.onrender.com"
});

// ⚠️ CORS CONFIGURAÇÃO CRÍTICA PARA RENDER
Console.WriteLine("🌐 Configurando CORS...");
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy
            .SetIsOriginAllowed(origin =>
            {
                Console.WriteLine($"🔍 CORS Origin checando: {origin}");

                // Permitir origens vazias (para ferramentas)
                if (string.IsNullOrEmpty(origin))
                {
                    Console.WriteLine("✅ Origin vazio - permitido");
                    return true;
                }

                // Permitir Render e localhost
                if (origin.Contains("onrender.com") ||
                    origin.Contains("localhost") ||
                    origin.Contains("127.0.0.1"))
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

// ⚠️ JWT CONFIGURAÇÃO
var jwtSecret = Environment.GetEnvironmentVariable("JWT_SECRET") ?? "chave-super-secreta-para-desenvolvimento";
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

var app = builder.Build();

// ⚠️ CONFIGURAÇÃO DE MIDDLEWARE PARA RENDER
Console.WriteLine("🔧 Configurando middleware...");

// Swagger sempre ativado (para debug no Render)
app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "Stock Control API v1");
    c.RoutePrefix = "swagger";
});

// ⚠️ CORS DEVE VIR ANTES DE AUTHENTICATION
app.UseCors("AllowAll");

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

// Controllers
app.MapControllers();

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

Console.WriteLine("=== ✅ APLICAÇÃO INICIADA COM SUCESSO ===");
Console.WriteLine($"🌐 CORS: AllowAll policy ativa");
Console.WriteLine($"🔗 Frontend URL: {Environment.GetEnvironmentVariable("FRONTEND_URL")}");
Console.WriteLine($"📊 Swagger disponível em: /swagger");

app.Run();