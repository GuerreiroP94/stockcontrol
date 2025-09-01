# Build stage
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build-env
WORKDIR /app

# Copy solution and project files
COPY *.sln ./
COPY PreSystem.StockControl.WebApi/*.csproj ./PreSystem.StockControl.WebApi/
COPY PreSystem.StockControl.Application/*.csproj ./PreSystem.StockControl.Application/
COPY PreSystem.StockControl.Domain/*.csproj ./PreSystem.StockControl.Domain/
COPY PreSystem.StockControl.Infrastructure/*.csproj ./PreSystem.StockControl.Infrastructure/

# Restore dependencies
RUN dotnet restore

# Copy everything else
COPY . ./

# Build and publish
RUN dotnet publish PreSystem.StockControl.WebApi/PreSystem.StockControl.WebApi.csproj -c Release -o out

# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:8.0
WORKDIR /app
COPY --from=build-env /app/out .

# ✅ A configuração de porta é feita no Program.cs, não no Dockerfile
ENV ASPNETCORE_ENVIRONMENT=Production

# Health check (opcional)
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:10000/health || exit 1

ENTRYPOINT ["dotnet", "PreSystem.StockControl.WebApi.dll"]