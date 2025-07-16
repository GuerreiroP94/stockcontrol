﻿// Usings essenciais para DI funcionar corretamente com nossas camadas
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

// IMPORTANTE: Carregar variáveis de ambiente do arquivo .env (apenas em desenvolvimento)
if (builder.Environment.IsDevelopment())
{
    try
    {
        DotNetEnv.Env.Load();
    }
    catch (FileNotFoundException)
    {
        // Arquivo .env não encontrado - continua sem ele
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

// Registro de dependências da aplicação
//Aqui informamos ao ASP.NET Core como criar instâncias dos nossos serviços e repositórios
builder.Services.AddScoped<IComponentRepository, ComponentRepository>(); // Injeta o repositório de componentes
builder.Services.AddScoped<IComponentService, ComponentService>();       // Injeta o serviço de componentes
builder.Services.AddHttpContextAccessor(); // Permite acessar o contexto HTTP atual (útil para recuperar dados do usuário logado)
builder.Services.AddScoped<IUserContextService, UserContextService>(); // Injeta o serviço que fornece dados do usuário logado a partir do token JWT
builder.Services.AddScoped<IUserRepository, UserRepository>(); // Injeta o repositório de usuários
builder.Services.AddScoped<IUserService, UserService>(); // Injeta o serviço de usuários
builder.Services.AddScoped<IPasswordResetTokenRepository, PasswordResetTokenRepository>(); // Repositório de tokens de reset
builder.Services.AddScoped<IEmailService, EmailService>(); // Serviço de email

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
// Serviços padrões da aplicação
builder.Services.AddProjectDependencies(builder.Configuration); // Adiciona a DI do projeto (com configuração)
builder.Services.AddControllers();         // Habilita os controllers

builder.Services.AddValidatorsFromAssemblyContaining<ProductCreateDtoValidator>(); // Registra os validadores
builder.Services.AddFluentValidationAutoValidation(); // Habilita validação automática nos controllers

// Documentação da API com Swagger
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new() { Title = "PreSystem.StockControl", Version = "v1" });

    //Adiciona suporte a JWT no Swagger
    c.AddSecurityDefinition("Bearer", new Microsoft.OpenApi.Models.OpenApiSecurityScheme
    {
        Description = @"JWT Authorization header usando o esquema Bearer.
                        Digite assim: 'Bearer {seu token}' (sem aspas)",
        Name = "Authorization",
        In = Microsoft.OpenApi.Models.ParameterLocation.Header,
        Type = Microsoft.OpenApi.Models.SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });

    c.AddSecurityRequirement(new Microsoft.OpenApi.Models.OpenApiSecurityRequirement()
    {
        {
            new Microsoft.OpenApi.Models.OpenApiSecurityScheme
            {
                Reference = new Microsoft.OpenApi.Models.OpenApiReference
                {
                    Type = Microsoft.OpenApi.Models.ReferenceType.SecurityScheme,
                    Id = "Bearer"
                },
                Scheme = "oauth2",
                Name = "Bearer",
                In = Microsoft.OpenApi.Models.ParameterLocation.Header,
            },
            new List<string>()
        }
    });
});

// Chave secreta para assinatura do token (em produção, armazene no appsettings)
var jwtSettings = builder.Configuration.GetSection("JwtSettings");
var secretKey = jwtSettings.GetValue<string>("Secret");

// Validação para evitar null
if (string.IsNullOrEmpty(secretKey))
    throw new InvalidOperationException("JWT Secret Key is missing in appsettings.json");

var key = Encoding.ASCII.GetBytes(secretKey);

// Configura a autenticação JWT com validação de assinatura, emissor e audiência
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.RequireHttpsMetadata = false;
    options.SaveToken = true;
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuerSigningKey = true,                                // Valida a assinatura do token
        IssuerSigningKey = new SymmetricSecurityKey(key),               // Chave usada na assinatura

        ValidateIssuer = true,                                          // Ativa a validação do emissor
        ValidateAudience = true,                                        // Ativa a validação da audiência
        ValidIssuer = jwtSettings.GetValue<string>("Issuer"),           // Define o emissor válido (do appsettings.json)
        ValidAudience = jwtSettings.GetValue<string>("Audience")        // Define a audiência válida (do appsettings.json)
    };
});

var app = builder.Build();

// Habilita o Swagger em ambiente de desenvolvimento
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("AllowFrontend"); // Permite requisições do frontend React (Vite)
app.UseHttpsRedirection();  // Redirecionamento para HTTPS
app.UseAuthentication();     // Habilita o middleware de autenticação para validar o token JWT enviado nas requisições
app.UseAuthorization();     // Middleware de autorização (JWT, policies, etc.)

app.MapControllers(); // Mapeia os controllers

app.Run(); // Inicia a aplicação