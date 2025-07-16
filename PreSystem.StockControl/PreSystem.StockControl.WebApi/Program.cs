var builder = WebApplication.CreateBuilder(args);

Console.WriteLine("=== ULTRA MINIMAL VERSION ===");
Console.WriteLine($"Environment: {builder.Environment.EnvironmentName}");
Console.WriteLine($"Content Root: {builder.Environment.ContentRootPath}");

// APENAS o absolutamente básico
builder.Services.AddControllers();

Console.WriteLine("Services added successfully");

var app = builder.Build();

Console.WriteLine("App built successfully");

// Endpoint de teste simples
app.MapGet("/", () =>
{
    Console.WriteLine("Root endpoint accessed");
    return "🚀 PreSystem API FUNCIONANDO! " + DateTime.UtcNow.ToString();
});

app.MapGet("/health", () =>
{
    Console.WriteLine("Health endpoint accessed");
    return new
    {
        Status = "OK",
        Timestamp = DateTime.UtcNow,
        Environment = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT"),
        Message = "Sistema funcionando perfeitamente!"
    };
});

app.MapGet("/test", () =>
{
    Console.WriteLine("Test endpoint accessed");
    return new
    {
        Success = true,
        Data = "Endpoint de teste OK",
        Variables = new
        {
            JWT_SECRET = !string.IsNullOrEmpty(Environment.GetEnvironmentVariable("JWT_SECRET")),
            EMAIL_FROM = Environment.GetEnvironmentVariable("EMAIL_FROM"),
            FRONTEND_URL = Environment.GetEnvironmentVariable("FRONTEND_URL")
        }
    };
});

Console.WriteLine("Routes mapped successfully");

Console.WriteLine("=== STARTING APPLICATION ===");

try
{
    app.Run();
}
catch (Exception ex)
{
    Console.WriteLine($"CRITICAL ERROR: {ex.Message}");
    Console.WriteLine($"Stack Trace: {ex.StackTrace}");
    throw;
}