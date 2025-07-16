# Build stage
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build-env
WORKDIR /app

# Copy solution and project files
COPY PreSystem.StockControl/*.sln ./
COPY PreSystem.StockControl/PreSystem.StockControl.WebApi/*.csproj ./PreSystem.StockControl.WebApi/
COPY PreSystem.StockControl/PreSystem.StockControl.Application/*.csproj ./PreSystem.StockControl.Application/
COPY PreSystem.StockControl/PreSystem.StockControl.Domain/*.csproj ./PreSystem.StockControl.Domain/
COPY PreSystem.StockControl/PreSystem.StockControl.Infrastructure/*.csproj ./PreSystem.StockControl.Infrastructure/

# Restore dependencies
RUN dotnet restore

# Copy everything else
COPY PreSystem.StockControl/ ./

# Build and publish
RUN dotnet publish PreSystem.StockControl.WebApi/PreSystem.StockControl.WebApi.csproj -c Release -o out

# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:8.0
WORKDIR /app
COPY --from=build-env /app/out .

# Railway specific
ENV ASPNETCORE_ENVIRONMENT=Production
ENV ASPNETCORE_URLS=http://0.0.0.0:$PORT

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:$PORT/health || exit 1

ENTRYPOINT ["dotnet", "PreSystem.StockControl.WebApi.dll"]