using PreSystem.StockControl.Application.Interfaces.Services;
using PreSystem.StockControl.Application.Services;
using PreSystem.StockControl.Domain.Interfaces.Repositories;
using PreSystem.StockControl.Infrastructure.Repositories;
using PreSystem.StockControl.WebApi.Configurations;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using PreSystem.StockControl.Application.Validators;
using FluentValidation;
using FluentValidation.AspNetCore;

var builder = WebApplication.CreateBuilder(args);

Console.WriteLine("=== INICIANDO APLICAÇÃO ===");
Console.WriteLine($"Environment: {builder.Environment.EnvironmentName}");

// Configuração da porta para Railway
var port = Environment.GetEnvironmentVariable("PORT") ?? "5000";
builder.WebHost.UseUrls($"http://0.0.0.0:{port}");
Console.WriteLine($"Aplicação configurada para porta: {port}");

// IMPORTANTE: Carregar variáveis de ambiente do arquivo .env (apenas em desenvolvimento)
if (builder.Environment.IsDevelopment())
{
    try
    {
        DotNetEnv.Env.Load();
        Console.WriteLine("Arquivo .env carregado");
    }
    catch (Exception ex)
    {
        Console.WriteLine($"Arquivo .env não encontrado - usando variáveis de ambiente do sistema: {ex.Message}");
    }
}

// Adicionar as variáveis de ambiente à configuração
builder.Configuration.AddInMemoryCollection(new Dictionary<string, string?>
{
    ["EmailSettings:SmtpUser"] = Environment.GetEnvironmentVariable("EMAIL_SMTP_USER"),
    ["EmailSettings:SmtpPassword"] = Environment.GetEnvironmentVariable("EMAIL_SMTP_PASSWORD"),
    ["EmailSettings:FromEmail"] = Environment.GetEnvironmentVariable("EMAIL_FROM"),
    ["FrontendUrl"] = Environment.GetEnvironmentVariable("FRONTEND_URL") ?? "http://localhost:5173"
});

Console.WriteLine("Variáveis de ambiente configuradas");

// ==========================================
// ⚠️ TEMPORÁRIO: SEM BANCO POR ENQUANTO
// ==========================================
Console.WriteLine("AVISO: Versão sem banco para teste inicial");

// Configuração do CORS para permitir requisições do frontend
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend",
        policy =>
        {
            var frontendUrl = Environment.GetEnvironmentVariable("FRONTEND_URL");
            if (!string.IsNullOrEmpty(frontendUrl))
            {
                policy.WithOrigins(frontendUrl.Split(','))
                      .AllowAnyHeader()
                      .AllowAnyMethod()
                      .AllowCredentials();
            }
            else
            {
                // Em desenvolvimento
                policy.WithOrigins(
                    "http://localhost:3000",  // Create React App
                    "http://localhost:5173"   // Vite
                )
                .AllowAnyHeader()
                .AllowAnyMethod()
                .AllowCredentials();
            }
        });
});

Console.WriteLine("CORS configurado");

// Serviços básicos
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();

Console.WriteLine("Serviços básicos adicionados");

// JWT simplificado
var jwtSecret = Environment.GetEnvironmentVariable("JWT_SECRET") ?? "fallback-secret-key-for-testing-only";
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
        ValidateIssuer = false,      // Simplificado
        ValidateAudience = false,    // Simplificado
    };
});

Console.WriteLine("JWT configurado");

// Swagger básico
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new() { Title = "PreSystem.StockControl", Version = "v1" });
});

Console.WriteLine("Swagger configurado");

// Health checks
builder.Services.AddHealthChecks();

var app = builder.Build();

Console.WriteLine("Aplicação construída, iniciando middlewares...");

// Tratamento de exceções global
app.UseExceptionHandler("/error");
app.Map("/error", (HttpContext context) =>
{
    var exception = context.Features.Get<Microsoft.AspNetCore.Diagnostics.IExceptionHandlerFeature>()?.Error;
    Console.WriteLine($"Erro capturado: {exception?.Message}");
    Console.WriteLine($"Stack Trace: {exception?.StackTrace}");
    return Results.Problem("Um erro ocorreu ao processar sua requisição.");
});

// Middlewares básicos
app.UseCors("AllowFrontend");
app.UseAuthentication();
app.UseAuthorization();

// Swagger sempre ativo para teste
app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "PreSystem.StockControl v1");
    c.RoutePrefix = string.Empty; // Swagger na raiz
});

Console.WriteLine("Middlewares configurados");

// Endpoints
app.MapGet("/", () => new {
    message = "PreSystem Stock Control API está funcionando!",
    environment = app.Environment.EnvironmentName,
    timestamp = DateTime.UtcNow
});

app.MapGet("/health", () => new { Status = "OK", Timestamp = DateTime.UtcNow });
app.MapHealthChecks("/healthz");

app.MapControllers();

Console.WriteLine("Rotas mapeadas");
Console.WriteLine($"=== APLICAÇÃO PRONTA PARA INICIAR NA PORTA {port} ===");

try
{
    app.Run();
}
catch (Exception ex)
{
    Console.WriteLine($"ERRO FATAL: {ex.Message}");
    Console.WriteLine($"Stack Trace: {ex.StackTrace}");
    throw;
}