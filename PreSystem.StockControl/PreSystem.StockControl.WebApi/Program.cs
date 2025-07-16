var builder = WebApplication.CreateBuilder(args);

Console.WriteLine("=== INICIANDO COM CONFIGURAÇÃO DE PORTA ===");

// Configurar porta explicitamente
var port = Environment.GetEnvironmentVariable("PORT") ?? "8080";
Console.WriteLine($"Configurando porta: {port}");

builder.WebHost.ConfigureKestrel(options =>
{
    options.ListenAnyIP(int.Parse(port));
});

Console.WriteLine("Kestrel configurado");

// Apenas o básico
builder.Services.AddControllers();

Console.WriteLine("Services adicionados");

var app = builder.Build();

Console.WriteLine("App construído");

// Endpoints básicos
app.MapGet("/", () =>
{
    Console.WriteLine("Endpoint / acessado");
    return $"API funcionando na porta {port}! {DateTime.UtcNow}";
});

app.MapGet("/health", () =>
{
    Console.WriteLine("Endpoint /health acessado");
    return new
    {
        Status = "OK",
        Port = port,
        Timestamp = DateTime.UtcNow
    };
});

Console.WriteLine("Rotas mapeadas");

Console.WriteLine($"=== INICIANDO NA PORTA {port} ===");

try
{
    app.Run();
}
catch (Exception ex)
{
    Console.WriteLine($"ERRO CRÍTICO: {ex.GetType().Name}: {ex.Message}");
    if (ex.InnerException != null)
    {
        Console.WriteLine($"INNER EXCEPTION: {ex.InnerException.GetType().Name}: {ex.InnerException.Message}");
    }
    Console.WriteLine("=== STACK TRACE ===");
    Console.WriteLine(ex.StackTrace);
    throw;
}