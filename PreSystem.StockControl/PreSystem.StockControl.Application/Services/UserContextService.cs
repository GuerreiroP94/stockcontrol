using Microsoft.AspNetCore.Http;
using PreSystem.StockControl.Application.Interfaces.Services;
using System.Security.Claims;

namespace PreSystem.StockControl.Application.Services
{
    public class UserContextService : IUserContextService
    {
        private readonly IHttpContextAccessor _httpContextAccessor;

        public UserContextService(IHttpContextAccessor httpContextAccessor)
        {
            _httpContextAccessor = httpContextAccessor;
        }

        public int? GetCurrentUserId()
        {
            var httpContext = _httpContextAccessor.HttpContext;
            if (httpContext?.User?.Identity?.IsAuthenticated == true)
            {
                var userIdClaim = httpContext.User.FindFirst(ClaimTypes.NameIdentifier);
                if (userIdClaim != null && int.TryParse(userIdClaim.Value, out var userId))
                {
                    return userId;
                }
            }
            return null;
        }

        public string? GetCurrentUserRole()
        {
            var httpContext = _httpContextAccessor.HttpContext;
            if (httpContext?.User?.Identity?.IsAuthenticated == true)
            {
                var roleClaim = httpContext.User.FindFirst(ClaimTypes.Role);
                return roleClaim?.Value;
            }
            return null;
        }

        public string? GetCurrentUserEmail()
        {
            var httpContext = _httpContextAccessor.HttpContext;
            if (httpContext?.User?.Identity?.IsAuthenticated == true)
            {
                var emailClaim = httpContext.User.FindFirst(ClaimTypes.Email);
                return emailClaim?.Value;
            }
            return null;
        }

        public bool IsCurrentUserAdmin()
        {
            return GetCurrentUserRole() == "admin";
        }

        public bool IsAuthenticated()
        {
            var httpContext = _httpContextAccessor.HttpContext;
            return httpContext?.User?.Identity?.IsAuthenticated == true;
        }

        // ADICIONAR APENAS ESTE MÉTODO
        public string? GetCurrentUsername()
        {
            var httpContext = _httpContextAccessor.HttpContext;
            if (httpContext?.User?.Identity?.IsAuthenticated == true)
            {
                // Tentar pegar o nome do claim "name" primeiro
                var nameClaim = httpContext.User.FindFirst(ClaimTypes.Name);
                if (nameClaim != null)
                    return nameClaim.Value;

                // Se não encontrar, usar o email como fallback
                var emailClaim = httpContext.User.FindFirst(ClaimTypes.Email);
                return emailClaim?.Value;
            }
            return "Sistema"; // Fallback para operações automáticas
        }
    }
}