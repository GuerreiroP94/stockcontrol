// Usings essenciais para DI funcionar corretamente com nossas camadas
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

// IMPORTANTE: Carregar variáveis de ambiente do arquivo .env (apenas em desenvolvimento)
if (builder.Environment.IsDevelopment())
{
    try
    {
        DotNetEnv.Env.Load();
        Console.WriteLine("Arquivo .env carregado");
    }
    catch (FileNotFoundException)
    {
        Console.WriteLine("Arquivo .env não encontrado - usando variáveis de ambiente do sistema");
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
        builder =>
        {
            builder.WithOrigins(
                "http://localhost:3000",  // Create React App
                "http://localhost:5173"   // Vite
            )
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials(); // Importante para cookies/auth
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

var app = builder.Build();

Console.WriteLine("Aplicação construída, iniciando middlewares...");

// Middlewares básicos
app.UseCors("AllowFrontend");
app.UseAuthentication();
app.UseAuthorization();

// Swagger sempre ativo para teste
app.UseSwagger();
app.UseSwaggerUI();

Console.WriteLine("Middlewares configurados");

// Endpoint de teste
app.MapGet("/", () => "PreSystem Stock Control API está funcionando!");
app.MapGet("/health", () => new { Status = "OK", Timestamp = DateTime.UtcNow });

app.MapControllers();

Console.WriteLine("Rotas mapeadas");

Console.WriteLine("=== APLICAÇÃO PRONTA PARA INICIAR ===");

app.Run();